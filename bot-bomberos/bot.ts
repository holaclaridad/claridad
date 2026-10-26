// Bot de Telegram: publica en un canal las convocatorias de bombero/a de los boletines oficiales.
//
// Cada ejecución lee, para cada fuente, los días pendientes (desde el último día completado hasta hoy),
// clasifica los anuncios, publica los que pasan el filtro y guarda lo publicado para no repetirlo.
// El día de hoy nunca se da por completado: se vuelve a leer en cada ejecución, por si el boletín sale
// tarde, y la memoria de publicados evita duplicados. Pensado para ejecutarse 2-3 veces al día por cron.
//
// Variables de entorno:
//   TELEGRAM_BOT_TOKEN   token de @BotFather (obligatorio salvo con --dry-run)
//   TELEGRAM_CHAT_ID     @usuario del canal o ID numérico (-100…) (obligatorio salvo con --dry-run)
//   ESTADO_PATH          fichero JSON de estado (por defecto bot-bomberos/estado.json)
//   DIAS_MAX_RECUPERAR   máximo de días hacia atrás a recuperar por fuente (por defecto 7)
//   CATEGORIAS           categorías a avisar, separadas por comas (por defecto "bombero")
//   PROMOCION_INTERNA    "1" para avisar también de promoción interna / movilidad (por defecto no)
//   FUENTES              limitar a ciertas fuentes, separadas por comas (por defecto todas)
//
// Uso:
//   node bot-bomberos/bot.ts                    # ejecución normal
//   node bot-bomberos/bot.ts --dry-run          # muestra los mensajes sin enviarlos ni guardar estado
//   node bot-bomberos/bot.ts --dry-run --desde 01/10/2026 --hasta 23/10/2026

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LECTORES, clasificar, debeAvisar, etiqueta, OPCIONES_POR_DEFECTO,
  type Publicacion, type Categoria, type OpcionesFiltro,
} from './lectores.ts';

interface Estado {
  // Último día leído entero por fuente (DD/MM/AAAA). Nunca es hoy.
  ultimoDiaCompleto: Record<string, string>;
  // Clave "fuente|id" -> fecha ISO en que se publicó en el canal.
  publicados: Record<string, string>;
}

const DIR = dirname(fileURLToPath(import.meta.url));
const ESTADO_PATH = process.env.ESTADO_PATH ?? join(DIR, 'estado.json');
const DIAS_MAX_RECUPERAR = Number(process.env.DIAS_MAX_RECUPERAR ?? 7);
const DIAS_RETENCION_PUBLICADOS = 400;
const PAUSA_ENTRE_MENSAJES_MS = 3_100; // Telegram: ~20 mensajes/minuto por canal
const TELEGRAM_API = process.env.TELEGRAM_API_BASE ?? 'https://api.telegram.org';

// ---------- fechas (DD/MM/AAAA, en hora de España) ----------

function hoyEspana(): string {
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
}
function aDate(f: string): Date { const [d, m, a] = f.split('/').map(Number); return new Date(Date.UTC(a, m - 1, d)); }
function deDate(x: Date): string {
  return `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`;
}
function sumarDias(f: string, n: number): string { const x = aDate(f); x.setUTCDate(x.getUTCDate() + n); return deDate(x); }
const anterior = (a: string, b: string) => aDate(a) < aDate(b);

function diasEntre(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let f = desde; !anterior(hasta, f); f = sumarDias(f, 1)) out.push(f);
  return out;
}

// ---------- estado ----------

async function cargarEstado(): Promise<Estado> {
  try {
    const e = JSON.parse(await readFile(ESTADO_PATH, 'utf8'));
    return { ultimoDiaCompleto: e.ultimoDiaCompleto ?? {}, publicados: e.publicados ?? {} };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { ultimoDiaCompleto: {}, publicados: {} };
    throw e; // un estado corrupto no se sobrescribe: mejor parar que republicar todo
  }
}

// Escritura atómica: si el proceso muere a mitad, el estado anterior sigue intacto.
async function guardarEstado(estado: Estado): Promise<void> {
  const limite = Date.now() - DIAS_RETENCION_PUBLICADOS * 86_400_000;
  for (const [k, iso] of Object.entries(estado.publicados)) if (Date.parse(iso) < limite) delete estado.publicados[k];
  await mkdir(dirname(ESTADO_PATH), { recursive: true });
  const tmp = `${ESTADO_PATH}.tmp`;
  await writeFile(tmp, JSON.stringify(estado, null, 1));
  await rename(tmp, ESTADO_PATH);
}

// ---------- mensaje ----------

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const recortar = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export function componerMensaje(p: Publicacion): string {
  const c = clasificar(p);
  const lineas = [
    `<b>${escapar(c ? etiqueta(c) : 'Convocatoria')}</b>`,
    p.organismo ? `🏛️ <b>${escapar(recortar(p.organismo, 200))}</b>` : '',
    escapar(recortar(p.titulo, 700)),
    `📰 ${escapar(p.fuente)} · ${p.fecha}`,
    p.url ? `🔗 <a href="${escapar(p.url)}">Ver anuncio</a>` : '',
  ];
  return lineas.filter(Boolean).join('\n\n');
}

// ---------- Telegram ----------

async function enviarTelegram(texto: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  for (let intento = 0; intento < 5; intento++) {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(20_000),
    });
    const j = await res.json().catch(() => ({})) as { ok?: boolean; description?: string; parameters?: { retry_after?: number } };
    if (j.ok) return;
    if (res.status === 429) { await esperar(((j.parameters?.retry_after ?? 5) + 1) * 1000); continue; }
    if (res.status >= 500) { await esperar(3000 * (intento + 1)); continue; }
    throw new Error(`Telegram ${res.status}: ${j.description ?? 'error'}`); // token o chat_id incorrectos: no reintentar
  }
  throw new Error('Telegram: demasiados reintentos');
}

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));

// ---------- ejecución ----------

function leerArgs() {
  const a = process.argv.slice(2);
  const valor = (n: string) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  return { dryRun: a.includes('--dry-run'), desde: valor('--desde'), hasta: valor('--hasta') };
}

function opcionesDesdeEntorno(): OpcionesFiltro {
  const cats = process.env.CATEGORIAS?.split(',').map(s => s.trim()).filter(Boolean) as Categoria[] | undefined;
  return {
    categorias: cats?.length ? cats : OPCIONES_POR_DEFECTO.categorias,
    promocionInterna: process.env.PROMOCION_INTERNA === '1',
  };
}

export async function ejecutar(): Promise<void> {
  const { dryRun, desde, hasta } = leerArgs();
  if (!dryRun && (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID)) {
    throw new Error('Faltan TELEGRAM_BOT_TOKEN y/o TELEGRAM_CHAT_ID (o usa --dry-run)');
  }
  const opciones = opcionesDesdeEntorno();
  const hoy = hoyEspana();
  const fin = hasta ?? hoy;
  const filtroFuentes = process.env.FUENTES?.split(',').map(s => s.trim()).filter(Boolean);
  const estado = await cargarEstado();
  let enviados = 0;
  const errores: string[] = [];

  for (const [fuente, leer] of Object.entries(LECTORES)) {
    if (filtroFuentes && !filtroFuentes.includes(fuente)) continue;
    // Primera vez: solo hoy (no inundar el canal). Después: desde el día siguiente al último completado,
    // con un máximo de DIAS_MAX_RECUPERAR hacia atrás.
    const ultimo = estado.ultimoDiaCompleto[fuente];
    let inicio = desde ?? (ultimo ? sumarDias(ultimo, 1) : fin);
    const tope = sumarDias(fin, -DIAS_MAX_RECUPERAR);
    if (!desde && anterior(inicio, tope)) inicio = tope;

    for (const dia of diasEntre(inicio, fin)) {
      let pubs: Publicacion[];
      try {
        pubs = await leer(dia);
      } catch (e) {
        errores.push(`${fuente} ${dia}: ${(e as Error).message}`);
        break; // ese día se reintentará en la próxima ejecución; no se avanza el estado de esta fuente
      }
      for (const p of pubs.filter(x => debeAvisar(x, opciones))) {
        const clave = `${p.fuente}|${p.id}`;
        if (estado.publicados[clave]) continue;
        const texto = componerMensaje(p);
        if (dryRun) {
          console.log(`--- ${clave}\n${texto}\n`);
        } else {
          await enviarTelegram(texto);
          estado.publicados[clave] = new Date().toISOString();
          await guardarEstado(estado); // tras cada envío, para no repetir si el proceso se corta
          await esperar(PAUSA_ENTRE_MENSAJES_MS);
        }
        enviados++;
      }
      if (anterior(dia, hoy) && (!estado.ultimoDiaCompleto[fuente] || anterior(estado.ultimoDiaCompleto[fuente], dia))) {
        estado.ultimoDiaCompleto[fuente] = dia;
      }
    }
  }

  if (!dryRun) await guardarEstado(estado);
  console.log(`${dryRun ? '[dry-run] ' : ''}${enviados} avisos ${dryRun ? 'detectados' : 'publicados'} · ${errores.length} errores`);
  for (const e of errores) console.log(`  ⚠️ ${e}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ejecutar().catch(e => { console.error(e); process.exit(1); });
}
