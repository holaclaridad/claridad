# Fuentes oficiales de convocatorias de bombero/a en España

Base documental del bot que avisará por Telegram de convocatorias de bombero/a, SPEIS, extinción de
incendios y operador/a de comunicaciones en toda España.

**Cómo se ha hecho:** cada fuente se ha comprobado con peticiones reales (`curl` y los propios lectores en
TypeScript) el **25/10/2026**. Fechas de prueba: un día reciente (22-23/10/2026) y otro antiguo (2025 o
septiembre de 2026), para comprobar si hay histórico. Los títulos que se citan como ejemplo están sacados
de las respuestas reales. **Lo que no se ha podido comprobar va marcado como "no verificado"**; en esos
casos el patrón de URL, si lo hay, sale de WebSearch y no está confirmado.

> ⚠️ **Aviso de red, importante para interpretar el documento.** Las pruebas se hicieron desde un servidor
> en la nube fuera de España. Varios portales **cortan la conexión TLS** desde esa red
> (`Connection reset by peer` tras el ClientHello): BON (Navarra), BOR (La Rioja), BOC (Cantabria),
> BOCCE (Ceuta), el portal sede.asturias.es y los BOP de Málaga, Sevilla, Zaragoza, Burgos, Salamanca,
> Valladolid, Albacete y Lleida. Otros fallan por otros motivos: proxy 502 (Alicante, Cuenca),
> certificado incompleto (Ciudad Real), firewall que veta la IP (Guadalajara), HTTP 500 (Jaén) y
> antibot con JavaScript (BOB Bizkaia).
> Lo más probable es un **bloqueo geográfico o por IP**. **El bot debería alojarse en España, o salir
> por una IP española**, y esas fuentes hay que volver a probarlas desde allí. Su viabilidad
> "DIFÍCIL" es *desde aquí*; no significa que sean difíciles de verdad.
> Además, DOGV, BOCYL, BOJA y BOP Badajoz/Barcelona cortan conexiones **a ratos**: todos los lectores
> deben reintentar con espera.

## Hallazgos clave para el diseño del bot

1. **El BOE (2B) no basta con el título.** En "Administración Local" el título es genérico
   (*"…referente a la convocatoria para proveer varias plazas"*). La plaza ("Bombero/a del Servicio de
   Extinción de Incendios…") solo aparece en `<notas>` del XML de cada disposición. El lector pide ese
   XML para los unos 30 anuncios locales del día (`enriquecerBoeLocal`).
2. **El BOE 2B solo trae el extracto.** Las bases íntegras y los trámites siguientes (admitidos,
   fechas de examen, nombramientos) salen en el **BOP o diario autonómico**. Para avisar pronto, y de
   todo el proceso, hacen falta los BOP.
3. **Un lector cubre varios BOP:**
   - el **BOA con `BASE=BZHT`** trae en una sola llamada los BOP de **Huesca, Teruel y Zaragoza**, con
     texto completo; así se salvan los bloqueos de Teruel y Zaragoza;
   - la plataforma **SAGA** la usan Granada, Huesca y León;
   - el software PHP de los **BOP canarios** es común a Las Palmas y Santa Cruz de Tenerife;
   - la plataforma **BOPB** la comparten Barcelona y Tarragona.
4. **En 7 comunidades uniprovinciales el diario autonómico hace de BOP:** Madrid (BOCM), Murcia (BORM),
   Navarra (BON), La Rioja (BOR), Asturias (BOPA), Cantabria (BOC) e Illes Balears (BOIB).
5. **User-Agent:** DOE se citaba como fuente que bloquea el UA por defecto, pero en estas pruebas no
   bloqueó. En cambio, **xunta.gal (DOG) devuelve HTTP 500 al UA de Chrome** y 200 con UA de Firefox.
   Los lectores usan un UA de navegador y, para el DOG, Firefox.
6. **Filtro: solo la categoría de bombero/a** (`esBombero` en `lectores.ts`).
   - Se mira solo el **título**, no el organismo: un consorcio de bomberos que convoca un administrativo
     no cuenta. En el BOE el título incluye la nota del XML de cada disposición.
   - Tiene que aparecer "bombero/a" en cualquiera de sus formas: *bombero/a, bomberos, bombeiro/a*
     (gallego), *bomber/bombers* (catalán) o *suhiltzaile* (euskera). Entra también Bombero-Conductor.
   - Se descartan las otras categorías del servicio aunque digan "bomberos": cabo, sargento, oficial,
     jefe, inspector, operador/a (de comunicaciones o de control), técnico, enfermero, administrativo,
     mecánico, etc.
   - Excepción: si el título nombra explícitamente "plazas de bombero" (o "places de bomber",
     "prazas de bombeiro"), cuenta aunque cite otras categorías.
   - Probado con 14 casos y con los boletines reales. Por ejemplo, descarta "tres plazas de CABO del
     Servicio de Extinción de Incendios" (BOP Ávila) y "operador de control de Bombers" (DOGC).
   - Queda dentro el **bombero forestal** si el título dice "bombero". Si no se quiere, basta añadir
     `forestal` a `OTRA_CATEGORIA`.

## Tabla maestra

V = verificado con petición real: **sí**, **parcial** o **no** (no verificado).
L = tiene lector en `lectores.ts` probado contra el servidor real.

### Estatal y diarios autonómicos

| Fuente | Territorio | Acceso por fecha | Viab. | V | L |
|---|---|---|---|---|---|
| BOE | Estatal | API JSON `datosabiertos/api/boe/sumario/AAAAMMDD` (+ XML por item) | FÁCIL | sí | ✅ |
| BOJA | Andalucía | HTML `/boja/AAAAMMDD.html` → `/boja/AAAA/NNN/s53`, `s57` | FÁCIL–MEDIA | sí | |
| BOA | Aragón (+ BOP HU/TE/Z) | JSON CGI `BRSCGI…OPENDATABOAJSONAPP&PUBL=AAAAMMDD` | FÁCIL | sí | ✅ |
| BOPA | Asturias (= BOP) | PDF de sumario `asturias.es/bopa/AAAA/MM/DD/AAAAMMDD.pdf` | MEDIA | parcial | |
| BOIB | Illes Balears (= BOP) | RSS / calendario → boletín → sección | MEDIA | sí | |
| BOC | Canarias | Índice anual (fecha→nº) → `/boc/AAAA/NNN/` + RSS | FÁCIL–MEDIA | sí | |
| BOC | Cantabria (= BOP) | app Java `.do`; reset desde aquí | DIFÍCIL* | no | |
| BOCYL | Castilla y León | HTML `boletin.do?fechaBoletin=DD/MM/AAAA` | FÁCIL | sí | ✅ |
| DOCM | Castilla-La Mancha | HTML `cambiarBoletin.do?fecha=AAAAMMDD` | FÁCIL | sí | ✅ |
| DOGC | Catalunya | API JSON (POST) `calendarDOGC` → `summaryDOGC` | FÁCIL | sí | ✅ |
| DOGV | C. Valenciana | API JSON `dogv-portal/dogv?date=AAAA-MM-DD` | FÁCIL | sí | ✅ |
| DOE | Extremadura | HTML `mostrardoe.php?fecha=AAAAMMDD` | FÁCIL | sí | ✅ |
| DOG | Galicia | HTML `/dog/Publicados/AAAA/AAAAMMDD/Secciones{i}_es.html` | FÁCIL–MEDIA | sí | |
| BOCM | Madrid (= BOP) | XML de sumario por nº (calendario fecha→nid en portada) | FÁCIL | sí | |
| BORM | Murcia (= BOP) | API JSON `services/boletin/fecha/DD-MM-AAAA/sumario` | FÁCIL | sí | ✅ |
| BON | Navarra (= BOP) | `bon.navarra.es/es/boletin/-/sumario/AAAA/N` (WebSearch); reset | DIFÍCIL* | no | |
| BOPV/EHAA | País Vasco | calendario `MMAAAA.shtml` → `sAA_NNNN.shtml`; RSS `Ultimo.xml` | FÁCIL–MEDIA | sí | |
| BOR | La Rioja (= BOP) | desconocido; reset | DIFÍCIL* | no | |
| BOCCE | Ceuta | PDFs jdownloads; reset | DIFÍCIL | no | |
| BOME | Melilla | API JSON calendario + HTML | FÁCIL | sí | |

### Boletines provinciales (BOP)

| Provincia | Acceso por fecha | Viab. | V | L |
|---|---|---|---|---|
| Almería | app ZK (JS obligatorio) | DIFÍCIL | parcial | |
| Cádiz | solo último sumario (portada); WAF intermitente | MEDIA | parcial | |
| Córdoba | HTML `bop.dipucordoba.es/dia/DD-MM-AAAA` | FÁCIL | sí | |
| Granada | HTML SAGA `BOP-DD-MM-AAAA/` | FÁCIL | sí | ✅ |
| Huelva | JSON POST `ajaxAnuncios.php` `tipo=2&fecha=` | FÁCIL | sí | ✅ |
| Jaén | HTTP 500 en todo | DIFÍCIL* | no | |
| Málaga | reset | DIFÍCIL* | no | |
| Sevilla | reset / 502 | DIFÍCIL* | no | |
| Huesca | HTML SAGA, y además vía BOA `BZHT` | FÁCIL | sí | ✅ (BOA) |
| Teruel | vía BOA `BZHT` (portal propio: error TLS) | FÁCIL vía BOA | sí (BOA) | ✅ (BOA) |
| Zaragoza | vía BOA `BZHT` (portal propio: reset) | FÁCIL vía BOA | sí (BOA) | ✅ (BOA) |
| Las Palmas | HTML `sumario.php?…fecha_mas_reciente=AAAA-MM-DD` | FÁCIL | sí | ✅ |
| S/C Tenerife | ídem (mismo software) | FÁCIL | sí | ✅ |
| Ávila | RSS `bops/AAAA/DD-MM-AAAA/rss.xml` | FÁCIL | sí | ✅ |
| Burgos | reset | DIFÍCIL* | no | |
| León | SAGA sin listado → PDF de sumario | MEDIA | sí | |
| Palencia | listado → PDF | MEDIA/DIFÍCIL | sí | |
| Salamanca | reset | DIFÍCIL* | no | |
| Segovia | Liferay por fecha → solo PDF | DIFÍCIL | sí | |
| Soria | HTML 2 pasos `mem.listadodia/fecha.DD-MM-AAAA` | MEDIA | sí | |
| Valladolid | reset | DIFÍCIL* | no | |
| Zamora | HTML últimos 8 boletines | MEDIA | sí | |
| Albacete | reset | DIFÍCIL* | no | |
| Ciudad Real | cadena TLS incompleta | DIFÍCIL* | no | |
| Cuenca | proxy 502 / 403 | DIFÍCIL* | no | |
| Guadalajara | firewall veta la IP | DIFÍCIL* | no | |
| Toledo | HTML `ebopResumen.jsp?publication_date=DD/MM/AAAA…` | FÁCIL | sí | ✅ |
| Barcelona | RSS del día + HTML `/anteriors/AAAA-MM-DD` | FÁCIL | sí | |
| Girona | HTML por nº `mostra-bop/…/AAAA/NUM` | FÁCIL | sí | |
| Lleida | reset | DIFÍCIL* | no | |
| Tarragona | misma plataforma que Barcelona | FÁCIL | sí | |
| Alicante | proxy 502 / 403 | DIFÍCIL* | no | |
| Castellón | portada (último) + JSF | MEDIA | parcial | |
| Valencia | JSF/PrimeFaces, 25 filas del último | DIFÍCIL | parcial | |
| Badajoz | HTML `?FechaSolicitada=AAAAMMDD` | FÁCIL | sí | |
| Cáceres | API JSON `fechaPublicacion?fechaPublic=MM/DD/AAAA` | FÁCIL | sí | |
| A Coruña | HTML `cambioBoletin?fechaInput=DD/MM/AAAA` | FÁCIL | sí | |
| Lugo | listado Drupal por fecha → nodo | MEDIA | sí | |
| Ourense | API JSON `portalapi/api/boletin/getFecha/AAAAMMDD` | FÁCIL | sí | |
| Pontevedra | HTML `detalle/-/boppo/AAAA/MM/DD` | FÁCIL | sí | |
| Álava (BOTHA) | HTML `SGBO5001.aspx?FechaBotha=DD/MM/AAAA` | FÁCIL | sí | |
| Bizkaia (BOB) | antibot F5 con JS | DIFÍCIL | no | |
| Gipuzkoa (BOG) | HTML estático `…/AAAA/MM/DD/bcAAMMDD.htm` | FÁCIL | sí | |
| Madrid, Murcia, Navarra, La Rioja, Asturias, Cantabria, Baleares | el diario autonómico hace de BOP | — | — | — |

\* DIFÍCIL **desde la red de pruebas** (bloqueo de IP o de red, o fallo TLS). Hay que volver a probar
desde una IP española antes de descartarla.

### Complementarias (agregadores, ayuntamientos y consorcios)

| Fuente | Ámbito | Acceso | Viab. | V | L |
|---|---|---|---|---|---|
| CIDO / Transparència Catalunya (`a2hm-uzyj`) | Toda Cataluña | API SODA JSON por `data_darrer_anunci` | FÁCIL | sí | ✅ |
| PAG administracion.gob.es (buscador de empleo público) | Estatal | HTML por fecha + texto ("bombero"); truco de caché | MEDIA | sí | |
| Ayto. Zaragoza (RSS de oferta) | Zaragoza | RSS (~20 últimos) | FÁCIL | sí | |
| Consorcio de Emergencias de Gran Canaria | Gran Canaria | API WordPress por fecha | FÁCIL | sí | |
| Ajuntament de Barcelona, Bilbao (OPE) | municipal | API JSON sin filtro de fecha / 2 pasos | MEDIA | sí | |
| València, Málaga, Bombers Generalitat, Bomberos C. Madrid, Consorci València, Consorcio Tenerife, Consorcio Alicante | varios | HTML a comparar cada día | MEDIA | sí/parcial | |
| Ayto. Madrid, Sevilla, Bomberos Navarra, consorcios de Cádiz, Málaga y Badajoz | varios | bloqueo / 403 / reset | DIFÍCIL* | no | |

## Orden de construcción recomendado

Criterio: primero las APIs limpias con más volumen de convocatorias de bombero, después lo que da más
cobertura por petición y, al final, lo que exige PDF, JSF o probar desde una IP española.

**Fase 1: ya escritas y probadas (`lectores.ts`).** Cubren el BOE, 7 diarios autonómicos (en Murcia el BORM hace
además de BOP), los BOP de Huesca, Teruel y Zaragoza vía BOA, los BOP de Granada, Huelva, Las Palmas,
Tenerife, Ávila y Toledo, y toda Cataluña vía CIDO.
1. **BOE** (2A + 2B, con enriquecimiento de los anuncios locales mediante el XML de cada disposición). Es la
   red de seguridad nacional: casi toda convocatoria de funcionario de carrera de bombero acaba con su
   extracto aquí.
2. **CIDO** (Cataluña entera, incluido Bombers de la Generalitat y Barcelona, más seguimiento de trámites).
3. **DOGV**, **DOGC**, **BORM**, **BOA**+BOP aragoneses, **DOCM**, **DOE**, **BOCYL**: un GET o dos POST por día.
4. **BOP**: Granada, Huelva, Las Palmas, S/C Tenerife, Ávila, Toledo.

**Fase 2: fáciles, sin lector todavía (un GET por día, HTML o JSON limpio).**
5. **BOCM** (Madrid: Cuerpo de Bomberos de la Comunidad y Ayto. de Madrid; mucho volumen).
6. **BOJA** (Andalucía: s53 + s57, con complementarios).
7. **BOP Barcelona/Tarragona** (un parser para los dos; el RSS del día no pagina).
8. **DOG** (Galicia; UA Firefox), **BOP A Coruña, Pontevedra, Ourense, Cáceres, Badajoz, Córdoba**.
9. **BOPV**, **BOTHA**, **BOG** (País Vasco), **BOC Canarias**, **BOME**, **BOP Girona**.
10. **PAG** como red de descubrimiento nacional ya clasificada, con fin de plazo.

**Fase 3: media (varios pasos, solo el último boletín o lectura de PDF).**
11. BOIB, BOP Soria, Zamora, Lugo, Castellón y Cádiz (portada diaria), BOPA y BOP León (PDF con `pdftotext`).
12. Sedes de ayuntamientos y consorcios para el seguimiento de trámites (Zaragoza RSS, Gran Canaria, Bilbao,
    Barcelona, València, Málaga, Comunidad de Madrid…).

**Fase 4: bloqueadas desde aquí; volver a probar desde una IP española.**
13. Prioridad por volumen de bomberos: **BOP Málaga, Sevilla, Valencia (JSF), Alicante, Zaragoza** (ya
    cubierto por BOA), **BON, BOC Cantabria, BOR**, BOP Burgos, Valladolid, Salamanca, Albacete,
    Ciudad Real, Cuenca, Guadalajara, Jaén, Lleida; BOB Bizkaia (antibot: probablemente navegador headless).
14. Solo PDF o JS: Almería (ZK), Segovia, Palencia, Ceuta.

**Notas de implementación:**
- Ejecutar a diario por la mañana para la fecha del día. Guardar el último día procesado por fuente y
  recuperar días perdidos (casi todas tienen histórico por fecha). Las que solo dan "lo último"
  (Cádiz, Castellón, Zamora, BOIB por RSS) hay que leerlas todos los días.
- Deduplicar por `fuente + id`. La misma convocatoria saldrá varias veces (BOP con las bases, BOE con el
  extracto, PAG/CIDO): agrupar por organismo y número de plazas si se quiere un único aviso.
- Reintentos con espera (3-5): DOGV, BOCYL, BOJA y BOP Badajoz/Barcelona cortan conexiones a menudo.
- Los 404 en días sin boletín son normales (BOE, BORM, BOJA, SAGA, Ávila): se tratan como "0 anuncios".

## Lectores en TypeScript (borrador)

Fichero completo: [`lectores.ts`](./lectores.ts). Patrón pedido: `Publicacion`, `fetchTexto(url, init?)`
y un lector `async (fecha: 'DD/MM/AAAA') => Publicacion[]` por fuente.

**Estado:** los 15 lectores se ejecutaron contra los servidores reales el 25/10/2026 con las fechas
23/10/2026 y 15/09/2025, y dieron publicaciones en todos los casos con boletín ese día. El fichero
compila con `tsc --strict`. Prueba manual:

```bash
NODE_USE_ENV_PROXY=1 node bot-bomberos/lectores.ts 23/10/2026            # todas las fuentes
node bot-bomberos/lectores.ts 23/10/2026 "BOP Granada"                   # una fuente
```
(Node ≥ 22.18 ejecuta TypeScript directamente; `NODE_USE_ENV_PROXY=1` solo hace falta detrás de un proxy.)

Resultado real con el filtro `esBombero` (solo la categoría de bombero/a):

| Lector | Fecha | Publicaciones | 🔥 | Coincidencia |
|---|---|---|---|---|
| BOE | 23/10/2026 | 57 | 1 | Ayto. de Valladolid: la nota del XML dice "Promoción interna: Bombero/a del Servicio de Extinción de Incendios…" |
| BOP Granada | 23/10/2026 | 17 | 1 | "Bases… seis (6) plazas de Bombero/a", Ayto. de Motril |
| BOA (+BOP HU/TE/Z) | 13/10/2026 | 176 | 1 | "Nombramiento de 24 Bomberos", Diputación de Huesca |
| BOCYL | 08/10/2026 | 27 | 1 | "…12 plazas de Bombero…", Ayto. de Valladolid |
| CIDO | 22/10/2026 | 217 | 1 | "60 places de Bomber del SPCPEIS", Ajuntament de Barcelona |
| CIDO | 15/10/2026 | 255 | 1 | "250 places de Bomber, escala bàsica", Generalitat de Catalunya |
| DOGV, BORM, DOGC, DOCM, DOE, BOP Huelva, Las Palmas, Tenerife, Toledo | 23/10/2026 | 14–92 | 0 | — |
| BOP Ávila | 23/10/2026 | 11 | 0 | Descarta bien "tres plazas de CABO" y "una plaza de SARGENTO" del Servicio de Extinción de Incendios |
| BOP Toledo | 23/10/2026 | 32 | 0 | Descarta bien "carrera profesional" del Consorcio de Extinción de Incendios |

```ts
// Lectores en BORRADOR de boletines oficiales (bot de convocatorias de bombero).
// Cada lector: async (fecha: 'DD/MM/AAAA') => Publicacion[] con los anuncios del día normalizados.
// Probados contra los servidores reales el 25/10/2026 (ver FUENTES-ESPANA.md).
// Ejecutable con Node >= 22.18 (type stripping): node bot-bomberos/lectores.ts 23/10/2026

export interface Publicacion { fuente: string; id: string; fecha: string /* DD/MM/YYYY */; titulo: string; organismo?: string; seccion?: string; url?: string }

const UA_NAVEGADOR = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
// xunta.gal (DOG) responde 500 al UA de Chrome; con Firefox responde 200.
const UA_FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';

export class HttpError extends Error {
  status: number;
  constructor(status: number, url: string) { super(`HTTP ${status} en ${url}`); this.status = status; }
}

type FetchInit = RequestInit & { charset?: string; reintentos?: number; ua?: string };

// fetch con User-Agent de navegador, timeout de 20 s, reintentos ante cortes de red
// (DOGV y BOCYL cortan conexiones a menudo) y throw si !res.ok.
export async function fetchTexto(url: string, init: FetchInit = {}): Promise<{ texto: string; setCookie: string | null }> {
  const { charset, reintentos = 3, ua = UA_NAVEGADOR, ...resto } = init;
  let ultimoError: unknown;
  for (let intento = 0; intento <= reintentos; intento++) {
    try {
      const res = await fetch(url, {
        ...resto,
        headers: { 'User-Agent': ua, 'Accept-Language': 'es-ES,es;q=0.9', ...(resto.headers as Record<string, string> | undefined) },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new HttpError(res.status, url);
      const buf = await res.arrayBuffer();
      const texto = new TextDecoder(charset ?? charsetDe(res.headers.get('content-type'))).decode(buf);
      return { texto, setCookie: res.headers.get('set-cookie') };
    } catch (e) {
      if (e instanceof HttpError && e.status < 500) throw e; // 404 = no hay boletín ese día
      ultimoError = e;
      if (intento < reintentos) await new Promise(r => setTimeout(r, 1500 * (intento + 1)));
    }
  }
  throw ultimoError;
}

function charsetDe(contentType: string | null): string {
  const m = contentType?.match(/charset=([\w-]+)/i);
  return m ? m[1].toLowerCase() : 'utf-8';
}

// ---------- utilidades de fecha y HTML ----------

function partes(fecha: string): { d: string; m: string; a: string } {
  const [d, m, a] = fecha.split('/');
  return { d: d.padStart(2, '0'), m: m.padStart(2, '0'), a };
}
const aaaammdd = (f: string) => { const { d, m, a } = partes(f); return `${a}${m}${d}`; };
const isoFecha = (f: string) => { const { d, m, a } = partes(f); return `${a}-${m}-${d}`; };
const ddmmaaaaGuion = (f: string) => { const { d, m, a } = partes(f); return `${d}-${m}-${a}`; };

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export function limpiar(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (s, n) => ENTIDADES[n.toLowerCase()] ?? s)
    .replace(/\s+/g, ' ')
    .trim();
}
const comoArray = <T>(x: T | T[] | undefined | null): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);

// Recorre el HTML en orden y aplica cada regex "marcador" (sección/organismo) o "item".
// Devuelve los items con el último valor visto de cada marcador. Evita depender de un parser DOM.
function recorrer(html: string, patrones: Record<string, RegExp>, item: RegExp) {
  type Ev = { pos: number; tipo: string; m: RegExpExecArray };
  const evs: Ev[] = [];
  for (const [tipo, re] of Object.entries({ ...patrones, __item: item })) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    for (let m; (m = g.exec(html)); ) evs.push({ pos: m.index, tipo, m });
  }
  evs.sort((a, b) => a.pos - b.pos);
  const estado: Record<string, string> = {};
  const out: { m: RegExpExecArray; ctx: Record<string, string> }[] = [];
  for (const e of evs) {
    if (e.tipo === '__item') out.push({ m: e.m, ctx: { ...estado } });
    else estado[e.tipo] = limpiar(e.m[1]);
  }
  return out;
}

// ---------- 1. BOE (estatal) — API JSON por fecha ----------
// Solo secciones 2A y 2B. En 2B "Administración Local" el título no nombra la plaza:
// ver enriquecerBoeLocal() más abajo.
export async function leerBOE(fecha: string): Promise<Publicacion[]> {
  let texto: string;
  try {
    ({ texto } = await fetchTexto(`https://www.boe.es/datosabiertos/api/boe/sumario/${aaaammdd(fecha)}`, { headers: { Accept: 'application/json' } }));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return []; // domingo / sin BOE
    throw e;
  }
  const out: Publicacion[] = [];
  for (const diario of comoArray(JSON.parse(texto).data?.sumario?.diario)) {
    for (const sec of comoArray<any>(diario.seccion)) {
      if (sec.codigo !== '2A' && sec.codigo !== '2B') continue;
      for (const dep of comoArray<any>(sec.departamento)) {
        const items = [...comoArray<any>(dep.item), ...comoArray<any>(dep.epigrafe).flatMap((ep: any) => comoArray(ep.item))];
        for (const it of items) {
          out.push({
            fuente: 'BOE', id: it.identificador, fecha, titulo: it.titulo,
            organismo: dep.nombre, seccion: `${sec.codigo} ${sec.nombre ?? ''}`.trim(), url: it.url_html,
          });
        }
      }
    }
  }
  return out;
}

// Para 2B Administración Local: descarga el XML de cada disposición y añade al título la nota
// ("Promoción interna: Bombero/a del Servicio de Extinción de Incendios...") para que el filtro la vea.
// Unas 30 peticiones por día.
export async function enriquecerBoeLocal(pubs: Publicacion[]): Promise<Publicacion[]> {
  for (const p of pubs) {
    if (p.fuente !== 'BOE' || !/ADMINISTRACI[ÓO]N LOCAL/i.test(p.organismo ?? '')) continue;
    try {
      const { texto } = await fetchTexto(`https://www.boe.es/diario_boe/xml.php?id=${p.id}`);
      const notas = [...texto.matchAll(/<nota[^>]*>([\s\S]*?)<\/nota>/g)].map(m => limpiar(m[1])).join(' | ');
      if (notas) p.titulo += ` — ${notas}`;
    } catch { /* se queda con el título genérico */ }
  }
  return pubs;
}

// ---------- 2. DOGV (Comunitat Valenciana) — API JSON por fecha ----------
export async function leerDOGV(fecha: string): Promise<Publicacion[]> {
  const { texto } = await fetchTexto(`https://dogv.gva.es/dogv-portal/dogv?date=${isoFecha(fecha)}&lang=es`,
    { headers: { Accept: 'application/json' }, reintentos: 5 });
  const j = JSON.parse(texto);
  return comoArray<any>(j.disposiciones).map(d => ({
    fuente: 'DOGV', id: String(d.codigoInsercion ?? d.id), fecha, titulo: d.titulo, organismo: d.organismo,
    seccion: [d.seccion?.descripcion, d.subseccion?.descripcion].filter(Boolean).join(' / '),
    url: d.urlPdf ? `https://dogv.gva.es/datos${d.urlPdf.startsWith('/') ? '' : '/'}${d.urlPdf}` : undefined,
  }));
}

// ---------- 3. BORM (Región de Murcia) — API REST JSON por fecha ----------
export async function leerBORM(fecha: string): Promise<Publicacion[]> {
  let texto: string;
  try {
    ({ texto } = await fetchTexto(`https://www.borm.es/services/boletin/fecha/${ddmmaaaaGuion(fecha)}/sumario`, { headers: { Accept: 'application/json' } }));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return [];
    throw e;
  }
  return comoArray<any>(JSON.parse(texto).anunciosBoletin).map(a => ({
    fuente: 'BORM', id: `${a.ano}-${a.numero}`, fecha, titulo: a.sumario,
    organismo: [a.anunciante, a.subAnunciante].filter(Boolean).join(' / '),
    seccion: [a.apartado, a.subApartado].filter(Boolean).join(' / '),
    url: `https://www.borm.es/services/anuncio/${a.id}/pdf`,
  }));
}

// ---------- 4. BOA (Aragón) + BOP Huesca, Teruel y Zaragoza — CGI JSON por fecha ----------
// BASE=BZHT incluye las secciones VI/VII/VIII (BOP de las tres provincias) con el texto completo.
// JSON en ISO-8859-1 y a veces mal formado: se sanea antes de parsear.
export async function leerBOA(fecha: string): Promise<Publicacion[]> {
  const out: Publicacion[] = [];
  for (let desde = 1; ; desde += 200) {
    const url = `https://www.boa.aragon.es/cgi-bin/EBOA/BRSCGI?CMD=VERLST&BASE=BZHT&DOCS=${desde}-${desde + 199}` +
      `&SEC=OPENDATABOAJSONAPP&OUTPUTMODE=JSON&SEPARADOR=&PUBL=${aaaammdd(fecha)}`;
    const { texto } = await fetchTexto(url, { charset: 'iso-8859-1' });
    if (!texto.trimStart().startsWith('[') && !texto.trimStart().startsWith('{')) return out; // sin boletín: devuelve la portada HTML
    const saneado = texto.replace(/[\u0000-\u001f]/g, ' ').replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    const docs = comoArray<any>(JSON.parse(saneado));
    for (const d of docs) {
      // Seccion "VI. Boletín Oficial de la Provincia de Huesca" → fuente BOPH, etc.
      const fuente = /Huesca/i.test(d.Seccion) ? 'BOP Huesca' : /Teruel/i.test(d.Seccion) ? 'BOP Teruel' : /Zaragoza/i.test(d.Seccion) ? 'BOP Zaragoza' : 'BOA';
      const texto = limpiar(String(d.Texto ?? ''));
      out.push({
        fuente, id: String(d.DOCN), fecha, organismo: d.Emisor,
        // Se añade el inicio del texto completo: los títulos locales a veces no nombran la plaza.
        titulo: `${limpiar(String(d.Titulo ?? ''))}${texto ? ' — ' + texto.slice(0, 400) : ''}`,
        seccion: [d.Seccion, d.Subseccion].filter(Boolean).join(' / '),
        url: String(d.UrlPdf ?? '').match(/`(https?:\/\/[^´`]+)´/)?.[1],
      });
    }
    const total = Number(String(docs[0]?.NOrden ?? '').match(/de\s+(\d+)/)?.[1] ?? 0);
    if (docs.length < 200 || desde + 199 >= total) return out;
  }
}

// ---------- 5. DOGC (Catalunya) — API REST JSON (POST), 2 pasos ----------
export async function leerDOGC(fecha: string): Promise<Publicacion[]> {
  const { m, a } = partes(fecha);
  const base = 'https://portaldogc.gencat.cat/eadop-rest/api/dogc';
  const form = { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } };
  const cal = JSON.parse((await fetchTexto(`${base}/calendarDOGC`, { ...form, body: `month=${Number(m)}&year=${a}&language=es` })).texto);
  const dia = comoArray<any>(cal.calendar).find(c => c.date === fecha && c.hasDOGC);
  const num = dia?.linkDOGC?.match(/numDOGC=(\d+)/)?.[1];
  if (!num) return [];
  const sum = JSON.parse((await fetchTexto(`${base}/summaryDOGC`, { ...form, body: `numDOGC=${num}&language=es` })).texto);
  const out: Publicacion[] = [];
  for (const s of comoArray<any>(sum.sumaris)) for (const sec of comoArray<any>(s.section)) for (const h of comoArray<any>(sec.header)) {
    const grupos = [{ org: h.title, docs: comoArray<any>(h.document) },
      ...comoArray<any>(h.subheader).map((sh: any) => ({ org: `${h.title} / ${sh.title}`, docs: comoArray<any>(sh.document) }))];
    for (const g of grupos) for (const d of g.docs) {
      const url: string | undefined = d.linkDownloadDocumentPDF;
      out.push({ fuente: 'DOGC', id: url?.match(/documentId=(\d+)/)?.[1] ?? `${num}-${out.length}`, fecha,
        titulo: d.title, organismo: g.org, seccion: sec.title, url });
    }
  }
  return out;
}

// ---------- 6. DOCM (Castilla-La Mancha) — HTML por fecha ----------
export async function leerDOCM(fecha: string): Promise<Publicacion[]> {
  const { texto } = await fetchTexto(`https://docm.jccm.es/docm/cambiarBoletin.do?fecha=${aaaammdd(fecha)}`);
  return recorrer(texto,
    { seccion: /class\s*=\s*"categoriaDiario"[^>]*>([\s\S]*?)<\//, organismo: /<h4 class\s*=\s*"tituloOrganismo">([\s\S]*?)(?:<br|<\/h4)/ },
    /<div class\s*=\s*"disp_(\d+)"[\s\S]*?<p class\s*=\s*"sumario">([\s\S]*?)<\/p>/,
  ).map(({ m, ctx }) => {
    const ruta = m[2].match(/ruta=([^&"]+\.pdf)/)?.[1];
    return { fuente: 'DOCM', id: m[1], fecha, titulo: limpiar(m[2]), organismo: ctx.organismo, seccion: ctx.seccion,
      url: ruta ? `https://docm.jccm.es/docm/descargarArchivo.do?ruta=${ruta}&tipo=rutaDocm` : undefined };
  });
}

// ---------- 7. DOE (Extremadura) — HTML por fecha (ISO-8859-1) ----------
export async function leerDOE(fecha: string): Promise<Publicacion[]> {
  const { texto } = await fetchTexto(`https://doe.juntaex.es/ultimosdoe/mostrardoe.php?fecha=${aaaammdd(fecha)}`, { charset: 'iso-8859-1' });
  return recorrer(texto,
    { seccion: /<span class="d3">([\s\S]*?)<\/span>/, organismo: /<p>\s*<span class="DOE2">([^<]*?)<\/span>\s*<\/p>/ },
    /<div class="justificado">[\s\S]*?<span class="DOE4">([\s\S]*?)<\/span>[\s\S]*?href="(\/pdfs\/doe\/[^"]+?(\d+)\.pdf)"/,
  ).map(({ m, ctx }) => ({ fuente: 'DOE', id: m[3], fecha, titulo: limpiar(m[1]), organismo: ctx.organismo, seccion: ctx.seccion,
    url: `https://doe.juntaex.es${m[2]}` }));
}

// ---------- 8. BOCYL (Castilla y León) — HTML por fecha ----------
export async function leerBOCYL(fecha: string): Promise<Publicacion[]> {
  const { texto } = await fetchTexto(`https://bocyl.jcyl.es/boletin.do?fechaBoletin=${partes(fecha).d}/${partes(fecha).m}/${partes(fecha).a}`, { reintentos: 5 });
  const html = texto.replace(/<!--[\s\S]*?-->/g, ''); // cada bloque repite los enlaces en comentarios
  return recorrer(html,
    { seccion: /<h3[^>]*>([\s\S]*?)<\/h3>/, subseccion: /<h4[^>]*>([\s\S]*?)<\/h4>/, organismo: /<h5[^>]*>([\s\S]*?)<\/h5>/ },
    /<p>((?:(?!<p>)[\s\S])*?)<\/p>\s*<ul class="descargaBoletin">[\s\S]*?href='(html\/[^']+?(BOCYL-D-[\d-]+)\.do)'/,
  ).map(({ m, ctx }) => ({ fuente: 'BOCYL', id: m[3], fecha, titulo: limpiar(m[1]), organismo: ctx.organismo,
    seccion: [ctx.seccion, ctx.subseccion].filter(Boolean).join(' / '), url: `https://bocyl.jcyl.es/${m[2]}` }));
}

// ---------- 9. BOP plataforma SAGA (Granada, Huesca) — HTML por fecha ----------
// León usa la misma plataforma pero sin listado HTML (solo PDF): no sirve este lector.
function lectorSaga(fuente: string, host: string) {
  return async (fecha: string): Promise<Publicacion[]> => {
    const { d, m, a } = partes(fecha);
    let texto: string;
    try { ({ texto } = await fetchTexto(`https://${host}/publica/consulta-de-bops/buscador/BOP-${d}-${m}-${a}/`)); }
    catch (e) { if (e instanceof HttpError && e.status === 404) return []; throw e; }
    const out: Publicacion[] = [];
    for (const li of texto.split(/<li[^>]*class="[^"]*elementoListado/).slice(1)) {
      const href = li.match(/href="(\/publica\/buscador-anuncios\/anuncio\/[^"]+)"/)?.[1];
      const titulo = li.match(/<h3[^>]*titulo_elemento[^>]*>([\s\S]*?)<\/h3>/)?.[1];
      if (!href || !titulo) continue;
      const campo = (n: number) => { const c = li.match(new RegExp(`campo_${n}[^>]*>([\\s\\S]*?)<\\/div>`))?.[1]; return c ? limpiar(c) : undefined; };
      out.push({ fuente, id: campo(3)?.match(/BOP[\w-]+/)?.[0] ?? href, fecha, titulo: limpiar(titulo),
        organismo: campo(1), url: `https://${host}${href}` });
    }
    return out;
  };
}
export const leerBOPGranada = lectorSaga('BOP Granada', 'bop.dipgra.es');
export const leerBOPHuesca = lectorSaga('BOP Huesca', 'bop.dphuesca.es'); // también llega vía leerBOA (BZHT)

// ---------- 10. BOP Huelva — JSON por fecha (POST) ----------
export async function leerBOPHuelva(fecha: string): Promise<Publicacion[]> {
  const { texto } = await fetchTexto('https://s2.diphuelva.es/lib/bope/anuncios_bop/ajaxAnuncios.php', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `tipo=2&fecha=${ddmmaaaaGuion(fecha)}`, charset: 'utf-8' });
  const j = JSON.parse(texto);
  return comoArray<any>(j.Anuncios).map(a => ({
    fuente: 'BOP Huelva', id: String(a.id_anuncio), fecha, titulo: limpiar(String(a.titulo)), organismo: a.entidad_anunciante,
    seccion: [a.Seccion, a.Categoria].filter(Boolean).join(' / '),
    url: a.documento ? `https://s2.diphuelva.es/portalweb/bope/anuncios/${a.documento}` : undefined,
  }));
}

// ---------- 11. BOP canarios (Las Palmas, S/C Tenerife) — HTML por fecha ----------
// No hay enlace por anuncio: se enlaza al PDF completo del boletín.
function lectorCanarias(fuente: string, base: string) {
  return async (fecha: string): Promise<Publicacion[]> => {
    const { d, m, a } = partes(fecha);
    const { texto } = await fetchTexto(`${base}/sumario.php?codigopub=1&fecha_mas_reciente=${isoFecha(fecha)}`); // UTF-8 real (el meta dice ISO-8859-1)
    // Tenerife escribe la fecha sin ceros ("15-9-25"). Si ese día no hubo boletín, devuelve otro: se descarta.
    if (!new RegExp(`DE FECHA\\s*0?${Number(d)}-0?${Number(m)}-${a.slice(2)}`).test(limpiar(texto))) return [];
    const rel = texto.match(/href="\.\.\/(boletines\/[^"]+\.pdf)"/i)?.[1];
    const pdf = rel ? `${base.replace(/\/[^/]+$/, '')}/${rel}` : undefined;
    const out: Publicacion[] = [];
    let organismo: string | undefined;
    for (const trozo of texto.split(/<br\s*\/?>/i)) {
      const org = trozo.match(/<b>\s*<i>([\s\S]*?)<\/i>\s*<\/b>/i);
      if (org) { organismo = limpiar(org[1]); continue; }
      const t = limpiar(trozo);
      if (t.startsWith('- ')) out.push({ fuente, id: `${a}${m}${d}-${out.length + 1}`, fecha, titulo: t.slice(2), organismo, url: pdf });
    }
    return out;
  };
}
export const leerBOPLasPalmas = lectorCanarias('BOP Las Palmas', 'https://www.boplaspalmas.net/nbop2');
export const leerBOPTenerife = lectorCanarias('BOP S/C Tenerife', 'https://www.bopsantacruzdetenerife.es/bopsc2');

// ---------- 12. BOP Ávila — RSS por fecha ----------
export async function leerBOPAvila(fecha: string): Promise<Publicacion[]> {
  const { a } = partes(fecha);
  let texto: string;
  try { ({ texto } = await fetchTexto(`https://www.diputacionavila.es/bops/${a}/${ddmmaaaaGuion(fecha)}/rss.xml`)); }
  catch (e) { if (e instanceof HttpError && e.status === 404) return []; throw e; }
  return [...texto.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const tag = (t: string) => limpiar((it.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`))?.[1] ?? '').replace(/<!\[CDATA\[|\]\]>/g, ''));
    const cab = tag('title'); // "AYUNTAMIENTO DE X - 2070/26"
    const link = tag('link');
    return { fuente: 'BOP Ávila', id: link.match(/_(\d+)\.pdf$/)?.[1] ?? cab, fecha, titulo: tag('description'),
      organismo: cab.replace(/\s*-\s*\d+\/\d+\s*$/, ''), url: link };
  });
}

// ---------- 13. BOP Toledo — HTML por fecha ----------
export async function leerBOPToledo(fecha: string): Promise<Publicacion[]> {
  const f = `${partes(fecha).d}/${partes(fecha).m}/${partes(fecha).a}`;
  const { texto } = await fetchTexto(`https://bop.diputoledo.es/webEbop/ebopResumen.jsp?publication_date=${f}&publication_date_to=${f}`);
  // Bloques: <h3 class="publisherBlock">Anunciante : X</h3> seguido de <div id="26104826>" class="announce">…
  return recorrer(texto,
    { organismo: /<h3[^>]*publisherBlock[^>]*>([\s\S]*?)<\/h3>/ },
    /<div id="(\d+)[^"]*"\s+class="announce">[\s\S]*?href="(DocGet\?id=[^"]+)"[\s\S]*?Resumen\/Asunto\s*:\s*<\/strong>([\s\S]*?)<\/li>/,
  ).map(({ m, ctx }) => ({ fuente: 'BOP Toledo', id: m[1], fecha, titulo: limpiar(m[3]),
    organismo: ctx.organismo?.replace(/^Anunciante\s*:\s*/i, ''), url: `https://bop.diputoledo.es/webEbop/${m[2].replace(/&amp;/g, '&')}` }));
}

// ---------- 14. CIDO / Transparència Catalunya (todas las administraciones catalanas) — API SODA JSON ----------
// Agregador oficial: una fila por proceso; data_darrer_anunci cambia con cada trámite nuevo
// (convocatoria, admitidos, notas...), así que también sirve para seguir procesos.
export async function leerCIDO(fecha: string): Promise<Publicacion[]> {
  const url = `https://analisi.transparenciacatalunya.cat/resource/a2hm-uzyj.json?data_darrer_anunci=${isoFecha(fecha)}T00:00:00.000&$limit=1000`;
  const filas = comoArray<any>(JSON.parse((await fetchTexto(url, { headers: { Accept: 'application/json' } })).texto));
  return filas.map(r => {
    const enlace: string | undefined = r.enlla?.url;
    return { fuente: 'CIDO', id: enlace?.match(/(\d+)\/?$/)?.[1] ?? `${r.codi_ens}-${r.resum}`, fecha, titulo: r.resum,
      organismo: r.nom_ens, seccion: r.termini_presentaci_ ? `Plazo: ${r.termini_presentaci_}` : undefined, url: enlace };
  });
}

// ---------- filtro del bot: solo la categoría de bombero/a ----------
// Se mira solo el título (no el organismo): un consorcio de bomberos que convoca un administrativo no cuenta.
// Formas de "bombero" en castellano, gallego, catalán y euskera.
const BOMBERO = /\bbomber[oa]s?\b|\bbomber[oa]\/[ao]\b|\bbombeir[oa]s?\b|\bbombers?\b|\bsuhiltzaile/i;
// Otras categorías del servicio que mencionan "bomberos" en el título pero no son la plaza de bombero/a.
const OTRA_CATEGORIA = /\b(sargent[oa]s?|cab[oa]s?|caporal|suboficial|oficial(es)?|sergent|jef[ea]s?|cap de|inspector[ae]?s?|subinspector|intendente|sotsinspector|operador[ae]?s?|operari[oa]s?|enfermer[oa]s?|infermer|m[eé]dic[oa]s?|t[eé]cnic[oa]s?|administrativ[oa]s?|auxiliar|mec[aá]nic[oa]s?|conserje|ordenanza)\b/i;
// Si el título nombra explícitamente plazas de bombero, cuenta aunque cite otras categorías.
const PLAZA_BOMBERO = /(plazas?|places?|prazas?|categor[ií]a|puestos?|llocs?)\s+(de\s+|d['’]\s*)?(\(?\d+\)?\s+)?(bomber|bombeir)|(bomber[oa]s?|bombers?)[\s/-]*(conductor|de primera|escala b[aà]sica)/i;

// Se evalúa por trozos (título, notas del BOE separadas por " | ") para que una nota con otra categoría
// no tape la de bombero.
export function esBombero(p: Publicacion): boolean {
  return p.titulo.split(/ — | \| /).some(t => BOMBERO.test(t) && (PLAZA_BOMBERO.test(t) || !OTRA_CATEGORIA.test(t)));
}

export const LECTORES: Record<string, (fecha: string) => Promise<Publicacion[]>> = {
  BOE: async f => enriquecerBoeLocal(await leerBOE(f)),
  DOGV: leerDOGV, BORM: leerBORM, BOA: leerBOA, DOGC: leerDOGC, DOCM: leerDOCM, DOE: leerDOE, BOCYL: leerBOCYL,
  'BOP Granada': leerBOPGranada, 'BOP Huelva': leerBOPHuelva, 'BOP Las Palmas': leerBOPLasPalmas,
  'BOP S/C Tenerife': leerBOPTenerife, 'BOP Ávila': leerBOPAvila, 'BOP Toledo': leerBOPToledo, CIDO: leerCIDO,
};

// Prueba manual: node bot-bomberos/lectores.ts 23/10/2026 [FUENTE]
if (import.meta.url === `file://${process.argv[1]}`) {
  const fecha = process.argv[2] ?? '23/10/2026';
  const solo = process.argv[3];
  for (const [nombre, leer] of Object.entries(LECTORES)) {
    if (solo && nombre !== solo) continue;
    try {
      const pubs = await leer(fecha);
      const hits = pubs.filter(esBombero);
      console.log(`${nombre}: ${pubs.length} publicaciones, ${hits.length} de bomberos` + (pubs[0] ? ` | ej.: ${pubs[0].titulo.slice(0, 90)} [${pubs[0].organismo ?? ''}] ${pubs[0].url ?? ''}` : ''));
      for (const h of hits) console.log(`   🔥 ${h.titulo.slice(0, 160)} | ${h.organismo ?? ''} | ${h.url ?? ''}`);
    } catch (e) {
      console.log(`${nombre}: ERROR ${(e as Error).message}`);
    }
  }
}
```

## Parte 1 — BOE y diarios autonómicos (A)

Verificado con curl el 25/10/2026 (domingo) desde la red de pruebas (salida por proxy). Fechas de prueba:
viernes 23/10/2026 (reciente) y 15/09/2025 (antigua), salvo que se indique otra. UA de navegador
Chrome salvo donde se dice lo contrario (DOG bloquea ese UA).

---

#### Boletín Oficial del Estado (BOE) — España (estatal)
- **URL portal:** https://www.boe.es/
- **Acceso programático:** API de datos abiertos, JSON o XML (cabecera `Accept`).
- **Endpoint por fecha:** `https://www.boe.es/datosabiertos/api/boe/sumario/{AAAAMMDD}` con `Accept: application/json` (o `application/xml`).
- **Ejemplo verificado:**
  - `curl -H 'Accept: application/json' 'https://www.boe.es/datosabiertos/api/boe/sumario/20261023'` → HTTP 200, `application/json`, 399 453 bytes. BOE nº 263; secciones 1, 2A (26 items), 2B (31 items), 3, 5A, 5B.
  - Lo mismo con `Accept: application/xml` → HTTP 200, `application/xml`, 223 288 bytes.
  - `.../sumario/20250915` → HTTP 200, JSON, 422 079 bytes (2B: 41 items). Hay histórico.
  - `.../sumario/20261025` (domingo, sin BOE) → **HTTP 404**, y el cuerpo llega en **XML** aunque se pida JSON: `<status><code>404</code><text>La información solicitada no existe</text></status>`.
  - Título real de la 2B "Administración Local" (23/10/2026): *"Resolución de 19 de octubre de 2026, del Ayuntamiento de Valladolid, referente a la convocatoria para proveer varias plazas."* (BOE-A-2026-22139). El XML de esa disposición dice: *"Promoción interna: Bombero/a del Servicio de Extinción de Incendios, Salvamento y…"*.
- **Cómo extraer los anuncios (JSON):**
  - Ruta: `data.sumario.diario[]` → `.seccion[]` (`codigo`: "1", "2A", "2B", "3", "4", "5A", "5B", "T"; `nombre`) → `.departamento[]` (`codigo`, `nombre`; p. ej. `9525` = "ADMINISTRACIÓN LOCAL") → y luego:
    - en las secciones 1, 2A, 2B y 3: `.epigrafe[]` (`nombre`, p. ej. "Personal funcionario", "Personal funcionario y laboral", "Personal laboral") → `.item`;
    - en las secciones 4 y 5: el `.item` cuelga directamente del `departamento`.
  - **`item` puede ser un OBJETO (cuando hay uno solo) o un ARRAY.** En las muestras: 49 objetos y 32 arrays bajo epígrafe, 16 objetos y 35 arrays bajo departamento. `diario`, `seccion`, `departamento` y `epigrafe` salieron siempre como array en las muestras, pero conviene normalizar todos los niveles con `x if isinstance(x, list) else [x]`.
  - Campos del item: `identificador` (BOE-A-AAAA-NNNNN; BOE-B-… en la sección 5), `control`, `titulo`, `url_pdf` (objeto: `texto` es la URL, más `szBytes`, `pagina_inicial` y `pagina_final`), `url_html` (`https://www.boe.es/diario_boe/txt.php?id=…`) y `url_xml` (`https://www.boe.es/diario_boe/xml.php?id=…`).
  - En XML la jerarquía es la misma: `<diario><seccion codigo nombre><departamento codigo nombre><epigrafe nombre><item>`.
- **Importante para bomberos:** los títulos de la 2B "Administración Local" son genéricos (*"…referente a la convocatoria para proveer varias plazas / una plaza"*) y **no nombran la plaza**. El tipo de plaza solo aparece en el XML de cada disposición (`url_xml`):
  - en `<analisis><notas><nota>` (resumen, p. ej. *"Promoción interna: Bombero/a del Servicio de Extinción de Incendios…"*);
  - y en `<texto>`, que también lleva el boletín provincial donde están las bases.

  El bot debe pedir el `url_xml` de cada item de la sección 2B, departamento 9525 (unos 30 al día), y buscar las palabras clave en `notas` y `texto`. Se probó con los 30 items locales del 23/10/2026: solo coincidió BOE-A-2026-22139.
- **Cobertura:** histórico por fecha (probado 2025 y 2026).
- **Pegas:** los días sin BOE dan 404 con cuerpo XML. Hay que normalizar objeto/array. Hace falta una petición más por item local para conocer la plaza.
- **Viabilidad:** FÁCIL.
- **Relevancia bomberos:** alta. BOE-A-2026-22139 (Ayto. de Valladolid, promoción interna a Bombero/a, 23/10/2026).

---

#### Boletín Oficial de la Junta de Andalucía (BOJA) — Andalucía
- **URL portal:** https://www.juntadeandalucia.es/eboja.html (`/boja/` redirige ahí)
- **Acceso programático:** HTML estático por fecha y por número/sección. No busqué API ni datos abiertos del sumario: con el HTML basta.
- **Endpoint por fecha:**
  1. `https://www.juntadeandalucia.es/boja/{AAAAMMDD}.html` → lista los boletines del día (ordinario y complementarios), con enlaces relativos `2026/206/`, `2026/206/c01/`, `2026/206/c02/`.
  2. Sección de un boletín: `https://www.juntadeandalucia.es/boja/{AAAA}/{NNN}/s{NN}`. Los códigos se ven en los enlaces de navegación de la página: `s51` = 1. Disposiciones generales, `s52` = 2.1 Nombramientos, `s53` = **2.2 Oposiciones, concursos y otras convocatorias**, `s54` = 3. Otras disposiciones, `s57` = 5.2 **Otros anuncios oficiales** (donde salen los Ayuntamientos). Supongo que `s55` y `s56` son las secciones 4 y 5.1 por la secuencia, pero esos dos códigos **no los verifiqué**. `/boja/{AAAA}/{NNN}/index.html` muestra la primera sección del boletín.
  3. Calendario anual (date→number): `https://www.juntadeandalucia.es/boja/2026.html` (HTTP 200, 220 KB) enlaza `/boja/AAAAMMDD.html`.
- **Ejemplo verificado:**
  - `curl 'https://www.juntadeandalucia.es/boja/20261023.html'` → HTTP 200, HTML de 139 KB: *"Boletines digitales del día 23/10/2026: Boletín número 206 de 23-10-2026; Boletín 206 Complementario 1; Complementario 2"*.
  - `/boja/20261022.html` → nº 205; `/boja/20250915.html` → nº 177 (hay histórico).
  - `/boja/20261025.html` (domingo) → **HTTP 404**.
  - `/boja/2026/206/s53` → HTTP 200, 145 KB.
  - `/boja/2026/205/s53` → 15 items. Ej.: *"Acuerdo de 7 de octubre de 2026, de la Mesa del Parlamento de Andalucía, por el que se aprueba la convocatoria pública para cubrir, por el procedimiento de libre designación…"*.
  - En `/boja/2026/200/s57`, bajo "Ayuntamientos": *"Anuncio de 28 de septiembre de 2026, del Ayuntamiento de Martos, extracto de las bases reguladoras que han de regir la convocatoria y proceso de selección para la provisión de 7 plazas de Bombero/a-Conductor/a por promoción interna…"*.
- **Cómo extraer los anuncios:**
  - Organismo: `<p class="h5 text-uppercase font-weight-bold">ORGANISMO</p>` (p. ej. "Ayuntamientos", "Consejería de …"), seguido de los bloques del item.
  - Item: `<div class="item punteado_izquierda"><p>TÍTULO</p>`, que contiene:
    - `<a href="BOJA26-206-00009-13840-01_00345070.pdf" class="item_pdf_grupo">` → PDF relativo a `/boja/AAAA/NNN/`;
    - `<a href="/boja/2026/206/15" class="item_html" title="Versión HTML CVE:00345070">` → ficha HTML (el `title` lleva el CVE, que sirve de id).
  - Regex usado: `<div class="item punteado_izquierda">\s*<p>(.*?)</p>.*?href="(BOJA[^"]+\.pdf)".*?href="(/boja/[^"]+)"` (con DOTALL). Hay que des-escapar entidades HTML (`&#xF3;`).
  - Recorrido diario: página de fecha → por cada boletín (incluidos los complementarios) → `s53` y `s57`.
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:** varios boletines por día (complementarios). Sin publicación → 404. Hubo un `Connection reset` puntual en `/boja/2026.html`, que funcionó al reintentar. Páginas pesadas (unos 140 KB, mucho menú del portal).
- **Viabilidad:** FÁCIL–MEDIA (2-3 GET por día, HTML regular).
- **Relevancia bomberos:** sí, Ayto. de Martos, 7 plazas de Bombero/a-Conductor/a (BOJA 200/2026, s57).

---

#### Boletín Oficial de la Comunidad de Madrid (BOCM) — Comunidad de Madrid
- **URL portal:** https://www.bocm.es/
- **Acceso programático:** XML de sumario por boletín (datos abiertos), más XML y JSON-LD por disposición. La URL del XML lleva el **número** de boletín, que no se deduce de la fecha.
- **Endpoint por fecha:** `https://www.bocm.es/boletin/CM_Boletin_BOCM/{AAAA}/{MM}/{DD}/BOCM-{AAAAMMDD}{NNN}.xml` (NNN = número de boletín sin ceros a la izquierda; p. ej. `BOCM-20261023253.xml`). Para pasar de fecha a número:
  - **Opción A (verificada):** la portada `https://www.bocm.es/` (HTML de 846 KB) trae en `Drupal.settings` un calendario completo desde 1983, en la forma `"23_10_2026":{"nid":"966100","date":"23_10_2026","extra":"0"}`; día y mes van **sin cero a la izquierda**, p. ej. `"15_9_2025"`. Después `https://www.bocm.es/node/{nid}` → HTML que contiene `href="/boletin/CM_Boletin_BOCM/2026/10/23/BOCM-20261023253.xml"`.
  - **Opción B (no verificada como regla):** el número es consecutivo dentro del año (24/10/2026 = 254, 23/10/2026 = 253). Hay extraordinarios (`"extra":"1"` aparece 10 veces en el calendario), así que contar no es fiable.
  - La portada también enlaza el último XML (`/boletin/CM_Boletin_BOCM/2026/10/24/BOCM-20261024254.xml`).
- **Ejemplo verificado:**
  - `curl 'https://www.bocm.es/boletin/CM_Boletin_BOCM/2026/10/23/BOCM-20261023253.xml'` → HTTP 200, `text/xml;charset=UTF-8`, 99 861 bytes, 100 `<disposicion>`.
  - `/node/936318` → `BOCM-20250915220.xml` → HTTP 200, 110 955 bytes, 106 disposiciones (hay histórico).
  - Título real en la sección I.B: *"Nombramiento – Orden de 15 de octubre de 2026, de la Consejería de Economía, Hacienda y Empleo, por la que se nombra personal funcionario en prácticas del Cuerpo de Bomberos de la Comunidad de Madrid, Escala Técnica o de Mando, Categoría de Inspector"*.
- **Cómo extraer los anuncios (XML):**
  - Ruta: `<sumario><diario numero><secciones><seccion nombre="I. COMUNIDAD DE MADRID">` → `<apartado nombre="B) Autoridades y Personal">` → `<organismo nombre="…">` → `<disposicion numero="N">`.
  - Cada disposición trae `<identificador>BOCM-20261023-2</identificador>`, `<rango>`, `<titulo>`, `<url_html>` (`https://www.bocm.es/bocm-20261023-2`), `<url_xml>`, `<url_json_ld>`, `<url_pdf>` y `<url_epub>`.
  - Secciones vistas: I. COMUNIDAD DE MADRID (A Disposiciones generales, B Autoridades y Personal, C Otras disposiciones, D Anuncios), II. DISPOSICIONES Y ANUNCIOS DEL ESTADO, **III. ADMINISTRACIÓN LOCAL AYUNTAMIENTOS** (aquí `<apartado>` va sin nombre y `<organismo nombre="MADRID">` es el municipio), IV. ADMINISTRACIÓN DE JUSTICIA y V. OTROS ANUNCIOS.
  - En la sección III los títulos son cortos y normalizados: *"– Guadarrama. Personal. Nombramiento funcionarios carrera"*, *"– Alcorcón. Personal. Acuerdo personal"*. Para bomberos locales conviene filtrar por "Personal" / "Oferta de empleo" / "Convocatoria" y leer el XML o JSON de la disposición.
- **Cobertura:** histórico completo (calendario desde 1983; probado 2025).
- **Pegas:** hace falta el número de boletín (portada de 846 KB + `/node/{nid}`, o mantener un contador). Las búsquedas de la portada (`/search-day-month`, etc.) son formularios Drupal AJAX; no las usé. `/rss` es una página HTML, no un feed; no la seguí.
- **Viabilidad:** FÁCIL (XML limpio), con un paso previo para obtener el número.
- **Relevancia bomberos:** sí. Cuerpo de Bomberos de la Comunidad de Madrid en I.B (BOCM-20261023, Orden de 15/10/2026).

---

#### Diari Oficial de la Generalitat de Catalunya (DOGC) — Catalunya
- **URL portal:** https://dogc.gencat.cat/es/inici/
- **Acceso programático:** **API REST JSON** (la que usa el propio portal, que pinta el sumario con JS), en `portaldogc.gencat.cat/eadop-rest/api/dogc/…`, peticiones POST con formulario. El portal de datos abiertos (analisi.transparenciacatalunya.cat) solo tiene la normativa de la sección 1, así que no sirve.
- **Endpoint por fecha (dos pasos):**
  1. Calendario mensual: `POST https://portaldogc.gencat.cat/eadop-rest/api/dogc/calendarDOGC` con cuerpo `month=10&year=2026&language=es` → `{"calendar":[{"date":"23/10/2026","hasDOGC":true,"linkDOGC":"?anexos=1&selectedYear=2026&selectedMonth=10&numDOGC=9779&language=es_ES"},…]}`.
  2. Sumario: `POST https://portaldogc.gencat.cat/eadop-rest/api/dogc/summaryDOGC` con cuerpo `numDOGC=9779&language=es` (también `ca`).
  - Otro endpoint: `POST …/summaryLastPublishedDOGC` (`language=es`) da el último DOGC; lo vi en el HTML de la portada pero **no lo verifiqué**.
- **Ejemplo verificado:**
  - `curl -X POST -d 'month=10&year=2026&language=es' 'https://portaldogc.gencat.cat/eadop-rest/api/dogc/calendarDOGC'` → HTTP 200, `application/json`, 2 930 bytes (23/10/2026 → 9779; 22/10 → 9778).
  - `curl -X POST -d 'numDOGC=9779&language=es' 'https://portaldogc.gencat.cat/eadop-rest/api/dogc/summaryDOGC'` → HTTP 200, `application/json`, 35 579 bytes, 84 documentos, 6 secciones.
  - Septiembre de 2025: 15/09/2025 → nº 9499 → HTTP 200, 81 documentos (hay histórico).
  - Título real (DOGC 9755–9778): *"Resolución ISP/3422/2026, de 23 de septiembre, por la que se aprueban y se hacen públicas las listas definitivas de personas admitidas y excluidas de la convocatoria del proceso selectivo … 8 plazas … de la categoría profesional C1 técnico/a especialista operador/a de control de Bomberos (convocatoria L320/26)"* (Departamento de Interior y Seguridad Pública).
- **Cómo extraer los anuncios (JSON):**
  - `sumaris[]` (puede haber más de uno, p. ej. "Annex A"/"Anexo A") lleva `title`, `numDOGC`, `dateDOGC` ("23/10/2026"), `previousNumDOGC`, `laterNumDOGC`, `linkDownloadDOGCPDF` y `section[]`.
  - `section[]` tiene `title` ("Disposiciones generales", "Otras disposiciones", "Cargos y personal", "Anuncios", "Administración local", "Otros sujetos emisores") y `header[]`.
  - `header[]` tiene `title` (departamento o "Ayuntamientos") y, o bien `document[]` directo, o bien `subheader[]` (`title` = organismo concreto, p. ej. "Ayuntamiento de Banyoles"), que contiene `document[]`.
  - `document[]` trae `title` y `linkDownloadDocumentPDF` (`https://portaldogc.gencat.cat/utilsEADOP/AppJava/PdfProviderServlet?documentId=1057562&type=01&language=es_ES`). El `documentId` sirve de id.
  - Recorrido recursivo: `section` → `header` → [`subheader`] → `document`.
- **Enlace HTML del documento:** `https://dogc.gencat.cat/es/document-del-dogc/?documentId={id}` → HTTP 200 (77 KB) y el HTML contiene el id, pero el contenido parece cargarse por JS. **No verifiqué** que traiga el texto.
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:** son POST (form-urlencoded), no GET. El JSON no trae URL HTML, solo el PDF. La portada declara `hostCalendar=preproduccio.portaldogc.gencat.cat` en campos ocultos, pero el JS usa una constante `hostConstant`; probé contra `portaldogc.gencat.cat` y funciona. El calendario marca algunos sábados/domingos como `hasDOGC:true`, así que hay que fiarse del calendario.
- **Viabilidad:** FÁCIL (2 POST por día, JSON).
- **Relevancia bomberos:** sí. Generalitat (Interior: Bombers, operador/a de control de Bomberos) y ayuntamientos en "Administración local".

---

#### Diario Oficial de Galicia (DOG) — Galicia
- **URL portal:** https://www.xunta.gal/diario-oficial-galicia
- **Acceso programático:** HTML estático por fecha (fragmentos del sumario) + RSS.
- **Endpoint por fecha (patrón correcto):** `https://www.xunta.gal/dog/Publicados/{AAAA}/{AAAAMMDD}/Secciones{i}_es.html` (o `_gl`).
  - `i` = 1, 2, 3… es el índice correlativo **de las secciones que existen ese día**, no un número fijo de sección. El 23/10/2026: Secciones1 = II, 2 = III, 3 = IV, 4 = VI. El 15/09/2025: Secciones1 = III, 2 = IV, 3 = VI.
  - Hay que pedir i = 1, 2, … hasta recibir **404** (230 bytes), y mirar el `dog-toc-nivel-1` para saber qué sección es.
  - Índice del día (necesita el nº de DOG): `/dog/Publicados/2026/20261023/Indice202_es.html` (HTTP 200, 2,5 KB). Lista las secciones con enlace a `SeccionesN`; las que ese día no tienen contenido salen sin enlace.
  - El patrón `…/Publicados/2026/20261023/Indice_es.html` (sin número) **no funciona**.
- **Ejemplo verificado (UA Firefox):**
  - `curl -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0' 'https://www.xunta.gal/dog/Publicados/2026/20261023/Secciones3_es.html'` → HTTP 200, `text/html`, 5 432 bytes: "Nº 202 · Viernes, 23 de octubre de 2026", "IV. Oposiciones y concursos", 6 items.
  - `Secciones4` → VI. Anuncios, 32 items. `Secciones5` → 404.
  - 24/10/2026 (sábado) → `Secciones1` = 404.
  - 15/09/2025: `Secciones3` (VI. Anuncios), Ayuntamiento de Ferrol: *"ANUNCIO de convocatoria del proceso de provision de puestos de trabajo, por el sistema de concurso, en el servicio de Bomberos."* (`/dog/Publicados/2025/20250915/AnuncioL136-250825-0001_es.html`, HTTP 200).
  - RSS `https://www.xunta.gal/diario-oficial-galicia/rss/Sumario_es.rss` → HTTP 200, `application/rss+xml`: solo el último DOG (nº 203, 25/10/2026, 1 item). También hay RSS por rango: `rss/Rango{N}_gl.rss` (lista en `/diario-oficial-galicia/suscricionsRSS.do`).
- **Cómo extraer los anuncios:** fragmento HTML simple.
  - `<span id="DOGNumero">Nº 202</span>` y `<span id="DOGData">…</span>`: número y fecha.
  - `<p class="dog-toc-nivel-1">IV. Oposiciones y concursos</p>`: sección. `<p class="dog-toc-nivel-2">b) Administración local</p>`: subsección.
  - `<p class="dog-toc-organismo">Ayuntamiento de Ferrol</p>`: organismo, que vale para los items siguientes.
  - `<li class="dog-toc-sumario"><a href="/dog/Publicados/2026/20261023/AnuncioG0597-161026-0007_es.html">TÍTULO</a></li>`: título + enlace; el id es el nombre del fichero, `AnuncioG0597-161026-0007`.
  - `<p class="dog-descargar"><a href="…_es.pdf">`: PDF.
  - Los anuncios locales salen en "VI. Anuncios → b) Administración local".
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:**
  - **Bloqueo por User-Agent:** con el UA de Chrome (`…Chrome/126.0 Safari/537.36`, también `126.0.0.0`) **todo xunta.gal devuelve HTTP 500** (341 bytes, un HTML con un script de redirección). Con UA Firefox, `curl/8.5.0` o un UA propio (`bot-convocatorias/1.0`) → 200. El bot debe usar un UA no-Chrome.
  - `http://www.xunta.gal` no resolvió desde aquí (`Could not resolve host`); usar https.
  - El número de sección es variable, así que hay que iterar hasta el 404 (3-5 GET al día).
  - `portalPublicoHome.do?method=getDiasDog` devolvió `[]`.
- **Viabilidad:** FÁCIL–MEDIA.
- **Relevancia bomberos:** sí, Ayto. de Ferrol, servicio de Bomberos (DOG 15/09/2025).

---

#### Boletín Oficial de la Región de Murcia (BORM) — Región de Murcia
- **URL portal:** https://www.borm.es/ (SPA AngularJS, rutas `#/home/sumario/{fecha}`)
- **Acceso programático:** **API REST** interna (`/services/…`), JSON (con `Accept: application/json`) o XML (por defecto).
- **Endpoint por fecha:** `https://www.borm.es/services/boletin/fecha/{DD-MM-AAAA}/sumario`
  - Otros endpoints (sacados del JS `scripts/boletines/factories/boletinFactory.js` y `anuncioFactory.js`):
    - `/services/boletin/ultimo` (verificado);
    - `/services/boletin/fecha/{DD-MM-AAAA}/sumario/apartados` (verificado, JSON con recuento por apartado);
    - `/services/anuncio/{id}/pdf` (verificado: HTTP 200, `application/pdf`, 741 KB);
    - `/services/anuncio/{id}/txt` y `/services/anuncio/fecha/{f}/numero/{n}`: **no verificados**.
- **Ejemplo verificado:**
  - `curl -H 'Accept: application/json' 'https://www.borm.es/services/boletin/fecha/23-10-2026/sumario'` → HTTP 200, `application/json`, 8 475 bytes: BORM nº 245, 14 anuncios. Ej.: *"Convocatoria y bases para selección de un/a Orientador/a Laboral Programa Experiencial…"* (anunciante: Las Torres de Cotillas, apartado IV).
  - Sin `Accept` → `application/xml` (`<SumarioBoletinDTO>`).
  - `15-09-2025` → HTTP 200, nº 213, 10 anuncios (hay histórico).
  - `25-10-2026` (domingo) → **HTTP 404**, cuerpo `boletin.alerts.danger.errorBusqueda`.
  - Formato `AAAA-MM-DD` → 404; `AAAAMMDD` → 500.
- **Cómo extraer los anuncios (JSON):**
  - Raíz: `id`, `numero`, `ano`, `fechaPublicacion`, `fechaAnterior`, `fechaSiguiente`, `extraordinario` y `anunciosBoletin[]` (array).
  - Cada anuncio: `id` (interno, para `/services/anuncio/{id}/pdf`), `numero` (número de anuncio en el año, p. ej. 5161), `ano`, `sumario` (título), `anunciante` (organismo / municipio), `subAnunciante`, `apartado` ("I. Comunidad Autónoma", "IV. Administración Local"…), `subApartado` ("3. Otras Disposiciones"…), `fechaPublicacion`, `numeroBoletin` y `paginas`.
  - Enlace público: el PDF `https://www.borm.es/services/anuncio/{id}/pdf`. La URL SPA del anuncio (`https://www.borm.es/#/home/anuncio/{DD-MM-AAAA}/{numero}`) sale de la ruta `/anuncio/:fecha/:numero` del JS, pero **no la verifiqué**.
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:** API no documentada (interna del SPA); podría cambiar. Formato de fecha `DD-MM-AAAA`. Hay boletines extraordinarios (campo `extraordinario`). No mostró bloqueos.
- **Viabilidad:** FÁCIL.
- **Relevancia bomberos:** en sep-oct 2026 solo encontré convenios de la Consejería de Emergencias que mencionan incendios, ninguna convocatoria de bombero. Los anuncios municipales salen en el apartado IV.

---

#### Boletín Oficial de Aragón (BOA) — Aragón (incluye los BOP de Huesca, Teruel y Zaragoza)
- **URL portal:** https://www.boa.aragon.es/ (SPA Angular)
- **Acceso programático:** CGI de datos abiertos `BRSCGI` con salida **JSON** (sacado del JS `main.*.js` del portal).
- **Endpoint por fecha:**
  - `https://www.boa.aragon.es/cgi-bin/EBOA/BRSCGI?CMD=VERLST&BASE=BZHT&DOCS=1-200&SEC=OPENDATABOAJSONAPP&OUTPUTMODE=JSON&SEPARADOR=&PUBL={AAAAMMDD}`
  - `BASE=BZHT` = BOA + **Boletines Oficiales de las Provincias de Huesca, Teruel y Zaragoza** (secciones VI, VII y VIII). `BASE=BOLE` = solo el BOA.
  - `DOCS=1-200` es el rango: si `NOrden` dice "1 de N" con N > 200, hay que paginar con `DOCS=201-400`, etc.
- **Ejemplo verificado:**
  - `curl '…BASE=BOLE…&PUBL=20261023'` → HTTP 200, 237 KB, 37 documentos (BOA nº 206).
  - `BASE=BZHT…&PUBL=20261023` → HTTP 200, 662 KB, 92 documentos (VI BOP Huesca 20, VII BOP Teruel 17, VIII BOP Zaragoza 18, más el BOA).
  - `BOLE…&PUBL=20250915` → 24 documentos (hay histórico).
  - `PUBL=20261025` (domingo) → HTTP 200 pero devuelve **la portada HTML** (8 KB), no JSON: hay que detectarlo.
  - Título real (`BZHT`, 13/10/2026, VI. BOP Huesca, "Diputación Provincial de Huesca - Recursos Humanos"): *"Nombramiento de 24 Bomberos (RPT 449, 515, …)"*.
- **Cómo extraer los anuncios (JSON):** array de objetos con:
  - `NOrden` ("1 de 92"), `DOCN` (id), `FechaPublicacion`, `Numeroboletin`;
  - `Seccion` ("II. Autoridades y Personal", "V. Anuncios", "VI. Boletín Oficial de la Provincia de Huesca"…), `Subseccion` ("b) Oposiciones y concursos"…);
  - `Fechadisposicion`, `Rango`, `Emisor` (organismo, p. ej. "AYUNTAMIENTO DE MAICAS"), `Titulo`;
  - `Texto`: **texto completo** con `<br/>`, lo que permite buscar "bombero" en el cuerpo, no solo en el título;
  - `CodigoMateria`, `UrlPdf`, `UrlBCOM`.
  - `UrlPdf` llega con un formato raro: una o varias URLs entre acento grave y acento agudo, p. ej. `` `https://www.boa.aragon.es/cgi-bin/EBOA/BRSCGI?CMD=VEROBJ&MLKOB=1471694210808´`https://…´ ``. Hay que extraerlas con la regex `` `(https?://[^´`]+)´ ``.
- **Cobertura:** histórico por fecha (probado 2025). Más los tres BOP aragoneses en la misma llamada.
- **Pegas:**
  - Respuesta en **ISO-8859-1** con `Content-Type: text/html`.
  - **JSON a veces inválido:** de 8 días probados, 3 fallaron con `json.loads` estricto: "Invalid control character" (15/10/2026) e "Invalid \escape" (21 y 22/10/2026). Hay que parsear con `strict=False` y sanear las barras invertidas no válidas (p. ej. `re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', raw)`) antes de `json.loads`.
  - Días sin boletín → HTML de portada.
  - Respuestas grandes (hasta unos 750 KB con `BZHT`, porque incluyen el texto completo).
- **Viabilidad:** FÁCIL (una GET por día), con un parser tolerante.
- **Relevancia bomberos:** alta. Diputación Provincial de Huesca, "Nombramiento de 24 Bomberos" (BOP Huesca vía `BZHT`, 13/10/2026). El servicio de bomberos de las diputaciones y de Zaragoza publica en los BOP, que entran aquí.

---

#### Boletín Oficial de Canarias (BOC) — Canarias
- **URL portal:** https://www.gobiernodecanarias.org/boc/
- **Acceso programático:** HTML estático por año/número + RSS por capítulo, consejería, cabildo y universidad.
- **Endpoint por fecha:**
  1. Índice anual (fecha → número): `https://www.gobiernodecanarias.org/boc/archivo/{AAAA}/index.html` (también `/boc/{AAAA}/index.html`). Enlaces del tipo `<a href="/boc/2026/213/index.html" title="Ir al boletín BOC 213/2026 (2026-10-23)">`; la fecha ISO va en el `title`. **Puede haber varios números el mismo día** (211 y 212 son ambos del 22/10/2026).
  2. Sumario: `https://www.gobiernodecanarias.org/boc/{AAAA}/{NNN}/index.html` (también `/boc/2026/213/`).
  - RSS (lista en `https://www.gobiernodecanarias.org/boc/feeds/`): `feeds/capitulo/autoridades_personal_oposiciones.rss`, `feeds/capitulo/anuncios.rss`, `feeds/capitulo/otros_anuncios.rss`, `feeds/cabildo/{tenerife|gran_canaria|…}.rss`, etc. Son últimos N, no por fecha.
- **Ejemplo verificado:**
  - `curl 'https://www.gobiernodecanarias.org/boc/2026/213/'` → HTTP 200, HTML de 54 KB: "BOC Nº 213. Viernes 23 de octubre de 2026". Ej. (II. Autoridades y personal → Oposiciones y concursos): *"Secretaría General Técnica.- Resolución de 6 de octubre de 2026, por la que se convoca, por el procedimiento de libre designación, la provisión del puesto de trabajo n.º 13342010…"* (BOC-A-2026-213-3655).
  - `/boc/archivo/2026/index.html` → HTTP 200, 69 KB.
  - `/boc/2025/180/index.html` → HTTP 200, "BOC Nº 180. Jueves 11 de septiembre de 2025", 10 items (hay histórico).
  - RSS de oposiciones → HTTP 200, `application/rss+xml`, 111 KB, 61 items.
- **Cómo extraer los anuncios (HTML):**
  - `<h4>II. Autoridades y personal</h4>`: sección. `<h3 class="titboc">Oposiciones y concursos</h3>`: subsección. `<h5>Consejería de …</h5>`: organismo (en los anuncios, el ayuntamiento o cabildo).
  - Items: `<li class="justificado_boc">`, que contiene:
    - `<a href="https://sede.gobiernodecanarias.org/boc/boc-a-2026-213-3655.pdf"><b>3655</b></a>` (número de anuncio);
    - `<a href="…pdf"> TÍTULO </a>`;
    - `<div class="cve">BOC-A-2026-213-3655.` (id), con `<a href="/boc/2026/213/3655.html">Versión HTML</a>`.
  - Regex: `<li class="justificado_boc">.*?<a href="([^"]+)">(.*?)</a>` (con DOTALL).
  - En el RSS: `<item><title>` (título), `<link>`, y `<description>` (HTML escapado con "Sección - Subsección - Organismo" en `<h5>`).
- **Cobertura:** histórico por año/número (probado 2025).
- **Pegas:** paso previo de fecha → número (índice anual, unos 70 KB). Varios boletines por día. El PDF está en otro host (`sede.gobiernodecanarias.org`).
- **Viabilidad:** FÁCIL–MEDIA (2 GET por día).
- **Relevancia bomberos:** en BOC 180–213/2026 no encontré convocatorias de bombero; solo apareció un convenio de "salvamento y socorrismo", que es un falso positivo de esa palabra clave. Los consorcios insulares de bomberos publican en BOC y BOP, a través de los anuncios de los cabildos (hay RSS por cabildo).

---

#### Boletín Oficial de Castilla y León (BOCYL) — Castilla y León
- **URL portal:** https://bocyl.jcyl.es/
- **Acceso programático:** HTML por fecha (confirmado). Además: XML por disposición, RSS por sección (solo el último boletín) y un dataset de datos abiertos que no pude verificar.
- **Endpoint por fecha:** `https://bocyl.jcyl.es/boletin.do?fechaBoletin={DD/MM/AAAA}`
- **Ejemplo verificado:**
  - `curl 'https://bocyl.jcyl.es/boletin.do?fechaBoletin=23/10/2026'` → HTTP 200, `text/html;charset=UTF-8`, 68 640 bytes: BOCYL nº 206, 39 disposiciones (bloques `descargaBoletin`).
  - `15/09/2025` → **la primera vez `curl: (35) Recv failure: Connection reset by peer`**; al reintentar, HTTP 200, 60 678 bytes, 35 disposiciones.
  - Título real (08/10/2026, III. Administración Local, B.2 Oposiciones y Concursos): *"RESOLUCIÓN de 30 de septiembre de 2026, del Concejal Delegado de Hacienda, Personal y Modernización Administrativa del Ayuntamiento de Valladolid, relativa a la convocatoria para la provisión, mediante concurso ordinario, de 12 plazas de Bombero, 3 del Servicio de Extinción de Incendios, Salvamento y Protección Civil."* (`html/2026/10/08/html/BOCYL-D-08102026-196-23.do`).
  - XML de disposición: `https://bocyl.jcyl.es/boletines/2026/10/23/xml/BOCYL-D-23102026-206-1.xml` → HTTP 200, XML **ISO-8859-15** con `<disposicion><numeroEdicion><fechaPublicacion><seccion><subseccion><apartado><organismo><suborganismo><rango><numeroOficial><contenido><titulo><texto>`.
  - RSS: `https://bocyl.jcyl.es/rss.do?seccion=III` (también `I`, `II`, `IV`, `V`) → HTTP 200, `text/xml`. Es **un solo `<item>` por boletín** (el último), con todo el sumario de la sección como HTML escapado en `<description>`, así que no es por fecha.
- **Cómo extraer los anuncios (HTML):**
  - `<h3 id="I._COMUNIDAD_DE_CASTILLA_Y_LEÓN">`: sección (I, III. ADMINISTRACIÓN LOCAL, V. OTROS ANUNCIOS…).
  - `<h4 class="encabezado4…" id="…">B. AUTORIDADES Y PERSONAL: B.2. Oposiciones y Concursos</h4>`: subsección. Existe tanto en I como en **III (Administración Local)**.
  - `<h5 class="encabezado6">ORGANISMO</h5>` y, si lo hay, `<h6 class="encabezado6">SUBORGANISMO</h6>`.
  - `<p>TÍTULO</p>`, seguido de `<ul class="descargaBoletin">` con:
    - `<a href='https://bocyl.jcyl.es/boletines/2026/10/23/pdf/BOCYL-D-23102026-206-1.pdf'>`;
    - `<a href='html/2026/10/23/html/BOCYL-D-23102026-206-1.do'>` (relativa a `https://bocyl.jcyl.es/`). El id es `BOCYL-D-DDMMAAAA-NNN-K`.
  - **Ojo:** cada bloque repite los enlaces dentro de comentarios `<!-- … -->`; hay que quitar los comentarios antes de extraer.
  - Fichas de disposición: XML en `…/boletines/AAAA/MM/DD/xml/BOCYL-D-…xml`, igual que el PDF pero con `/xml/` y `.xml`.
- **Datos abiertos:** https://datosabiertos.jcyl.es/web/jcyl/set/es/sector-publico/bocyl/1284948181134 (HTTP 200) remite a un dataset Opendatasoft `https://analisi.datosabiertos.jcyl.es/explore/dataset/bocyl/`. La API `https://analisi.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/bocyl/records?limit=2` dio **`Connection reset by peer` 3 veces** desde aquí (el proxy informa `ws_closed_mid_exchange`): **no verificado**. Podría ser una alternativa JSON por fecha.
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:** **`Connection reset by peer` intermitentes** en bocyl.jcyl.es. En una tanda de 15 fechas, varias peticiones fallaron aunque se reintentaron una vez, y 2 fechas se quedaron sin descargar. Hace falta reintentar con espera. Enlaces duplicados en comentarios HTML. El XML está en ISO-8859-15.
- **Viabilidad:** FÁCIL (una GET por día), con reintentos.
- **Relevancia bomberos:** sí. Ayto. de Valladolid, 12 plazas de Bombero (BOCYL 08/10/2026, III.B.2).

---

### Tabla resumen

| Fuente | Territorio | Tipo acceso | Viabilidad | Verificado (sí/parcial/no) |
|---|---|---|---|---|
| BOE | Estatal | API JSON/XML por fecha (`/datosabiertos/api/boe/sumario/AAAAMMDD`) + XML por item (notas con la plaza) | FÁCIL | sí |
| BOJA | Andalucía | HTML por fecha (`/boja/AAAAMMDD.html`) → secciones `/boja/AAAA/NNN/s53`, `s57` | FÁCIL–MEDIA | sí |
| BOCM | Comunidad de Madrid | XML de sumario por boletín (necesita número; calendario fecha→nid en la portada → `/node/{nid}`) | FÁCIL | sí |
| DOGC | Catalunya | API REST JSON (POST `calendarDOGC` → `summaryDOGC`) | FÁCIL | sí |
| DOG | Galicia | HTML estático `/dog/Publicados/AAAA/AAAAMMDD/Secciones{i}_es.html` (i hasta 404) + RSS; bloquea el UA Chrome | FÁCIL–MEDIA | sí |
| BORM | Región de Murcia | API REST JSON/XML `/services/boletin/fecha/DD-MM-AAAA/sumario` | FÁCIL | sí |
| BOA | Aragón (+ BOP Huesca, Teruel, Zaragoza) | CGI JSON `BRSCGI…SEC=OPENDATABOAJSONAPP&PUBL=AAAAMMDD` (`BASE=BZHT`) | FÁCIL (JSON a veces mal formado) | sí |
| BOC | Canarias | HTML por año/número (índice anual fecha→número) + RSS por capítulo/cabildo | FÁCIL–MEDIA | sí |
| BOCYL | Castilla y León | HTML por fecha `boletin.do?fechaBoletin=DD/MM/AAAA` + XML por disposición; dataset Opendatasoft no verificado | FÁCIL (con reintentos por resets) | sí (HTML) / no (datos abiertos) |

---

## Parte 2 — Diarios autonómicos (B), Ceuta y Melilla

Fechas usadas en las pruebas: 23/10/2026 (viernes) y 14/03/2025 (fecha antigua).

**Bloqueo de red importante:** desde este entorno, `bon.navarra.es`, `web.larioja.org`, `www.larioja.org`, `sede.asturias.es`, `miprincipado.asturias.es`, `boc.cantabria.es`, `www.ceuta.es`/`ceuta.es`/`sede.ceuta.es` y `www.navarra.es` fallan siempre con `curl: (35) Recv failure: Connection reset by peer`. Lo he probado 3 o más veces, por https y por http (por http da "Could not resolve host"), con www y sin www. Según el estado del proxy, el error es `ws_closed_mid_exchange: tunnel closed (code 1006) ... 517 B sent, 39 B received`: el túnel de salida se cierra después del ClientHello. Parece un bloqueo de IP o geográfico del lado del servidor, o de la salida del proxy. Con WebFetch tampoco funciona: da `getaddrinfo ENOTFOUND` para todos esos hosts. Por tanto, esas fichas se basan en WebSearch y quedan marcadas como **no verificado**. Desde una IP española probablemente funcionen.

---

#### Diari Oficial de la Generalitat Valenciana (DOGV) — Comunitat Valenciana
- **URL portal:** https://dogv.gva.es
- **Acceso programático:** API JSON por fecha. La había confirmado el usuario y **también la he verificado desde aquí**.
- **Endpoint por fecha:** `https://dogv.gva.es/dogv-portal/dogv?date={AAAA-MM-DD}&lang=es` (con `lang=va` se obtiene en valenciano; esa variante no la pude verificar porque la conexión se cortó).
- **Ejemplo verificado:** `curl -A "<UA navegador>" -H 'Accept: application/json' 'https://dogv.gva.es/dogv-portal/dogv?date=2026-10-23&lang=es'` → HTTP 200, `application/json;charset=UTF-8`, 40 812 B. Es el DOGV nº 10477 y trae 56 disposiciones. Ejemplos:
  - "RESOLUCIÓN de 16 de octubre de 2026, por la que se elaboran las terceras listas parciales…" (Vicepresidencia Segunda y Conselleria de Presidencia)
  - "RESOLUCIÓN 2026-1283, de la Presidencia del Consejo de Gobierno, mediante la que se aprueb…" (Consorci Hospitalari Provincial Universitari de Castelló)
  - Fecha antigua `date=2025-03-14` → HTTP 200, 31 366 B, DOGV nº 10067 con 44 disposiciones.
  - Domingo `date=2026-10-25` → HTTP 200, 802 B, con 1 disposición: ese día hubo un DOGV con un decreto de cese.
- **Cómo extraer los anuncios:** el JSON es `{cabecera:{numeroDogv, fecha, any}, fechaSumario:"DD-MM-AAAA", esBis, urlPdf, disposiciones:[...]}`. Cada disposición trae:
  - `id` y `codigoInsercion` (p. ej. "2026/33243"): sirven como identificador.
  - `titulo` y `organismo`.
  - `seccion.descripcion` (p. ej. "II. AUTORIDADES Y PERSONAL") y `subseccion.descripcion` (p. ej. "B) OPOSICIONES Y CONCURSOS").
  - `fechaPublicacion`, `paginaInicial`.
  - `urlPdf`, que es relativa: hay que anteponer `https://dogv.gva.es/datos`. Por ejemplo `https://dogv.gva.es/datos/2026/10/23/pdf/2026_33243_es.pdf` → HTTP 206 `application/pdf`, verificado. Sin el prefijo `/datos` la conexión se corta.

  Para el bot conviene filtrar por `seccion.id == 13` (II. Autoridades y personal) y por palabras clave en `titulo`. El campo `organismo` incluye ayuntamientos y consorcios.
- **Cobertura:** histórico por fecha (2025 comprobado). Si un día no hay DOGV, devuelve `disposiciones` vacío o con pocas entradas.
- **Pegas:** **resets intermitentes** (`Connection reset by peer`, el proxy lo registra como `ws_closed_mid_exchange`). Aproximadamente 1 de cada 2 peticiones falla y otras pasan sin problema. **Hay que reintentar 3–5 veces con espera.** No necesita autenticación.
- **Viabilidad:** FÁCIL, con reintentos.

#### Butlletí Oficial del País Vasco / Euskal Herriko Agintaritzaren Aldizkaria (BOPV/EHAA) — País Vasco
- **URL portal:** https://www.euskadi.eus/bopv
- **Acceso programático:** RSS del último boletín, más un sumario HTML por número. La correspondencia entre fecha y número sale del calendario mensual, que es HTML estático con arrays en JS.
- **Endpoint por fecha:** la URL `Sumario_AAAAMMDD.html` **no existe**: `https://www.euskadi.eus/bopv2/datos/2026/10/Sumario_20261023.html` → **HTTP 404**. Las URLs reales son estas:
  - Calendario del mes (castellano): `https://www.euskadi.eus/bopv2/datos/{MM}{AAAA}.shtml`, p. ej. `092026.shtml`. En euskera es `{AAAA}{MM}.shtml`, con enlaces `e26_…`. Contiene `var diasHabilitados = ['20260901',…]` y `var enlaces = [['s26_0166.shtml'],…]` en el mismo orden, así que basta con emparejar las dos listas.
  - Mes en curso: `https://www.euskadi.eus/bopv2/datos/CalUltimo.shtml`.
  - Sumario: `https://www.euskadi.eus/bopv2/datos/{AAAA}/{MM}/s{AA}_{NNNN}.shtml`, donde NNNN es el número de boletín con 4 cifras.
  - RSS del último boletín: `https://www.euskadi.eus/bopv2/datos/Ultimo.xml`.
  - Último sumario: `https://www.euskadi.eus/web01-bopv/es/bopv2/datos/Ultimo.shtml`.
- **Ejemplo verificado:**
  - `curl 'https://www.euskadi.eus/bopv2/datos/2026/10/s26_0203.shtml'` → HTTP 200, `text/html; charset=ISO-8859-1`, 27 922 B. Es el boletín nº 203 del 23/10/2026. Ejemplo: "ORDEN de 6 de octubre de 2026, de la consejera de Educación, por la que se convocan ayudas destinadas a subvencionar materiales didácticos en euskera…" (organismo: DEPARTAMENTO DE EDUCACIÓN).
  - Fecha antigua: `032025.shtml` → 14/03/2025 = `s25_0051.shtml`. `https://www.euskadi.eus/bopv2/datos/2025/03/s25_0051.shtml` → HTTP 200, con 26 disposiciones. Ejemplo: "RESOLUCIÓN 418/2025, de 4 de marzo, de la Directora General de Osakidetza-Servicio vasco de salud, por la que se nombra…".
  - `Ultimo.xml` → HTTP 200, `application/xml`, 15 696 B. Es un RSS 2.0 con `<title>Boletín Nº 203, fecha 23/10/2026</title>` y un `<item>` por disposición.
- **Cómo extraer los anuncios:** el HTML está en ISO-8859-1.
  - Sección: `<h4 class="BOPVSumarioSeccion">`. Subsección: `<h5 class="BOPVSumarioSubSeccion">`.
  - Organismo: `<h5 class="BOPVSumarioOrganismo">`. **Si está vacío, se hereda el organismo anterior.**
  - Título y enlace: `<p class="BOPVSumarioTitulo"><a href="2604441a.shtml">TÍTULO</a>`. El href es relativo al directorio `/bopv2/datos/AAAA/MM/`, y el id es `2604441` (AA + número de orden).
  - En el RSS: `item/title` y `item/link`, con enlaces del tipo `https://www.euskadi.eus/y22-bopv/es/bopv2/datos/2026/10/2604441a.shtml`.
- **Cobertura:** histórico por fecha mediante el calendario mensual (2025 comprobado). El RSS solo trae el último boletín.
- **Pegas:** hacen falta dos pasos (calendario y luego sumario) y hay que convertir de ISO-8859-1. No hay boletín en sábados, domingos ni festivos.
- **Viabilidad:** FÁCIL–MEDIA. Para uso diario basta con el RSS `Ultimo.xml`.
- **Relevancia bomberos:** en euskadi.eus/empleo_publico aparece "Convocatoria para la provisión, mediante oposición, de quince plazas del puesto de trabajo de Bombero/a" (encontrada con WebSearch).

#### Diario Oficial de Extremadura (DOE) — Extremadura
- **URL portal:** https://doe.juntaex.es
- **Acceso programático:** HTML por fecha y RSS por sección.
- **Endpoint por fecha:** `https://doe.juntaex.es/ultimosdoe/mostrardoe.php?fecha={AAAAMMDD}`. El parámetro opcional `&t=o` indica el DOE ordinario; para el extraordinario sería probablemente `t=e`, **no verificado**.
- **Ejemplo verificado:** `curl -A "<UA navegador>" 'https://doe.juntaex.es/ultimosdoe/mostrardoe.php?fecha=20261023'` → HTTP 200, `text/html` en ISO-8859-1, 27 893 B. Es el "Núm.: 205 — Viernes, 23 de octubre de 2026" y trae 17 disposiciones. Ejemplo: "Resolución de 19 de octubre de 2026, de la Dirección General de Recursos Humanos, por la que se aprueba la relación de plazas que se ofertan…". Con `fecha=20250314` → HTTP 200, 46 905 B, Núm. 51. **Sin User-Agent, o con `curl/8`, también devolvió 200 desde aquí**, así que el bloqueo por UA no se reprodujo. Aun así, conviene enviar un UA de navegador.
- **Cómo extraer los anuncios:**
  - Sección: `<span class="d3">III. OTRAS RESOLUCIONES</span>`.
  - Organismo: `<p><span class="DOE2">CONSEJERÍA …</span></p>`, fuera del `div.justificado`.
  - Cada disposición está en un `<div class="justificado"><p><span class="DOE2">Materia.- </span><span class="DOE4">TÍTULO</span>…`.
  - PDF: `href="/pdfs/doe/2026/2050o/26062623.pdf"`. El id es `26062623` y `2050o` es el número 205 + 0 + o (ordinario).
  - HTML: `../otrosFormatos/html.php?xml=2026062623&anio=2026&doe=2050o`.
  - Navegación: enlaces "DOE Anterior" y "DOE Siguiente" (`mostrardoe.php?fecha=…&t=o`).
- **RSS:** `https://doe.juntaex.es/rss/rss.php?seccion={0..5}`, donde 2 = Autoridades y personal. Devuelve HTTP 200 `text/xml`, pero el domingo 25/10 llegó **vacío (0 items)**: parece que solo contiene el DOE del día en curso.
- **Cobertura:** histórico por fecha (2025 comprobado).
- **Pegas:** ISO-8859-1. Si el día tiene un DOE extraordinario, puede requerir otra petición con `t`.
- **Viabilidad:** FÁCIL.

#### Diario Oficial de Castilla-La Mancha (DOCM) — Castilla-La Mancha
- **URL portal:** https://docm.jccm.es
- **Acceso programático:** HTML por fecha.
- **Endpoint por fecha:** `https://docm.jccm.es/docm/cambiarBoletin.do?fecha={AAAAMMDD}`
- **Ejemplo verificado:** `curl 'https://docm.jccm.es/docm/cambiarBoletin.do?fecha=20261023'` → HTTP 200, `text/html;charset=UTF-8`, 73 888 B. Es el sumario del 23/10/2026: 32 disposiciones repartidas en 16 organismos. Ejemplos:
  - "Oposiciones. Resolución de 16/10/2026, de la Consejería de Desarrollo Sostenible, por la que se nombra personal funcionario de carrera…"
  - "Ayudas y Subvenciones. Resolución de 15/10/2026, de la Dirección General de Empleo…"

  Con `fecha=20250314` → HTTP 200, 80 710 B, 36 disposiciones.
- **Cómo extraer los anuncios:**
  - Categorías: `<… class = "categoriaDiario">`, p. ej. "OPOSICIONES Y CONCURSOS" u "OTROS ANUNCIOS OFICIALES". También hay `class = "subcategoria"`.
  - Organismo: `<div class = "organismo"><h4 class = "tituloOrganismo">Consejería de … <br/>`.
  - Disposición: `<div class = "disp_{idDisposicion}"><p class = "sumario"><a href="./descargarArchivo.do?ruta=2026/10/23/pdf/2026_7150.pdf&amp;tipo=rutaDocm">Anuncio de 30/09/2026</a>, de la Delegación…</p>`. El título completo es el texto de `p.sumario` sin etiquetas, y empieza por la materia, p. ej. "Oposiciones.".
  - HTML de la disposición: `verArchivoHtml.do?ruta=2026/10/23/html/2026_7150.html&tipo=rutaDocm`.
  - Ficha de la disposición: `./detalleDocumento.do?idDisposicion=1790756146939110037`.
  - Ojo: los atributos llevan espacios alrededor del `=` (`class = "sumario"`).
- **Cobertura:** histórico por fecha (2025 comprobado).
- **Pegas:** el HTML lleva entidades (`&#243;`) y los atributos con espacios. No encontré RSS en la página.
- **Viabilidad:** FÁCIL.

#### Butlletí Oficial de les Illes Balears (BOIB) — Illes Balears
- **URL portal:** https://www.caib.es/eboibfront/es
- **Acceso programático:** RSS de boletines, calendario mensual HTML, páginas de sección HTML y una versión XML por disposición.
- **Endpoint por fecha:** no hay endpoint por fecha. La correspondencia se saca así:
  - Calendario mensual `https://www.caib.es/eboibfront/es/{AAAA}/mes/{M}`, con enlaces `<a class="ordinario|extraordinario" href="/eboibfront/es/2026/12347/" title="BOIB ordinario del dia 20">`.
  - O el RSS `https://www.caib.es/eboibfront/indexrss.do?lang=es`, cuyos items tienen `title` "BOIB Núm 135/2026", `link` `…/es/2026/12349` y `pubDate`.
  - Boletín: `https://www.caib.es/eboibfront/es/{AAAA}/{idBoletin}`, que enlaza a las secciones `/{idBoletin}/seccion-ii-autoridades-y-personal/{idSec}`.
- **Ejemplo verificado:**
  - RSS → HTTP 200 `application/rss+xml`, 16 items. El último es "BOIB Núm 136/2026" del 24/10. **No hubo BOIB el 23/10**: el BOIB sale martes, jueves y sábado, más extraordinarios.
  - `https://www.caib.es/eboibfront/es/2026/12349/seccion-ii-autoridades-y-personal/473` (BOIB 135 del 22/10/2026) → HTTP 200, 61 784 B, 24 disposiciones. Ejemplos:
    - "Convocatoria del proceso selectivo para cubrir como personal funcionario de carrera dos plazas vacantes de la categoría de policía local del Consell I…"
    - "Convocatoria y bases reguladoras del procedimiento selectivo para la provisión de 5 plazas de policía local del Ayuntamiento de Alcúdia…"
  - La sección V (Anuncios, id 475) → HTTP 200, 29 disposiciones.
  - Mes antiguo `…/es/2025/mes/3` → HTTP 200, p. ej. "BOIB ordinario del dia 1" = `/es/2025/12075/`.
- **Cómo extraer los anuncios:** en la página de sección, cada grupo es `<h3 class="organisme">ORGANISMO<strong>SUBORGANISMO</strong></h3>` seguido de `<ul class="resolucions"><li><p>TÍTULO</p><p class="registre">Número de registro 10555 - Página 57931</p>`. Los enlaces son:
  - HTML: `https://www.caib.es/eboibfront/es/2026/12349/721219/slug`.
  - XML: el mismo con `/xml` al final.
  - PDF: `/eboibfront/pdf/es/2026/135/{id}`.

  El sumario completo en PDF está en `/eboibfront/pdf/es/2026/135/sumari/12349`. Los ids de sección (471–475) **cambian por boletín**: hay que leerlos de la página del boletín.
- **Cobertura:** histórico mediante el calendario mensual (2025 comprobado). El RSS tiene los últimos 16 boletines aproximadamente.
- **Pegas:** son 3 pasos (calendario o RSS → boletín → sección). No hay publicación todos los días. Las secciones II y V son las que interesan.
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** la sección II publica convocatorias de policía local y bomberos de consells insulares y ayuntamientos.

#### Boletín Oficial del Principado de Asturias (BOPA) — Principado de Asturias
- **URL portal:** https://sede.asturias.es/bopa. También aparece como https://miprincipado.asturias.es/bopa, y `https://www.asturias.es/bopa` redirige con 302 a `https://sede.asturias.es/servicios-del-bopa`.
- **Acceso programático:** el sumario diario es un **PDF con URL por fecha**, servido en `www.asturias.es`, que sí funciona desde aquí. El portal HTML de sede.asturias.es está bloqueado desde aquí (reset): **no verificado**.
- **Endpoint por fecha:** `https://www.asturias.es/bopa/{AAAA}/{MM}/{DD}/{AAAAMMDD}.pdf` (sumario). Cada disposición está en `https://www.asturias.es/bopa/{AAAA}/{MM}/{DD}/{AAAA-NNNNN}.pdf`.
- **Ejemplo verificado:**
  - `curl 'https://www.asturias.es/bopa/2026/10/23/20261023.pdf'` → HTTP 200, `application/pdf`, 201 777 B. Es el "Viernes, 23 de octubre de 2026 — Núm. 206" y contiene 58 códigos. Ejemplo: "Resolución de 5 de octubre de 2026, de la Gerencia del Área de Salud I Occidente del Servicio de Salud del Principado de Asturias, por la que se convoca la cobertura temporal… [Cód. 2026‑08408]".
  - `https://www.asturias.es/bopa/2026/10/23/2026-08408.pdf` → HTTP 206 `application/pdf`.
  - `…/2025/03/14/20250314.pdf` → HTTP 200, 165 827 B, 33 códigos.
  - El sábado `…/2026/10/24/20261024.pdf` → 404, porque ese día no hubo boletín.
- **Cómo extraer los anuncios:** `pdftotext -layout` y parsear el texto.
  - Secciones: "I. Principado de Asturias" (subapartados "••Disposiciones Generales", "••Autoridades y Personal", "••Otras Disposiciones", "••Anuncios"), "III. Administración del Estado" y "IV. Administración Local" (ayuntamientos).
  - Organismo: la línea sin sangría o con menos sangría antes de los títulos (Consejería…, Ayuntamiento de…).
  - Cada disposición termina con `[Cód. AAAA‑NNNNN] [N págs.]`. **Ojo: el guion es U+2011 (non-breaking hyphen).** Hay que normalizarlo a "-" para construir el enlace al PDF individual.
  - El texto que va entre dos `[Cód.…]` es el título.
- **Cobertura:** histórico por fecha (2025 comprobado). De lunes a viernes, salvo festivos.
- **Pegas:** solo hay PDF (hay que convertirlo a texto, con títulos partidos en varias líneas). El portal sede.asturias.es no es accesible desde aquí. Los ayuntamientos aparecen en IV.
- **Viabilidad:** MEDIA (una GET por fecha, pero con parseo de PDF).
- **Relevancia bomberos:** según WebSearch, el SEPA (112 Asturias) convocó una bolsa de Bombero-Conductor con bases en el BOPA del 5/11/2024.

#### Boletín Oficial de Melilla (BOME) — Ciudad Autónoma de Melilla
- **URL portal:** https://bomemelilla.es
- **Acceso programático:** **API JSON de calendario** y HTML por boletín.
- **Endpoint por fecha:** `https://bomemelilla.es/api/bomes/calendar?start={AAAA-MM-DD}&end={AAAA-MM-DD}`. Sin parámetros devuelve 400 `{"error":"Missing start or end query parameters"}`. Con ellos devuelve `[{title:"Nº 6425", start:"2026-10-23", url:"/bome/BOME-B-2026-6425"}, …]`. Los extraordinarios se distinguen por `BOME-BX-…` y el color `#9dadbe`. El boletín está en `https://bomemelilla.es/bome/BOME-B-{AAAA}-{N}`.
- **Ejemplo verificado:**
  - `curl 'https://bomemelilla.es/api/bomes/calendar?start=2026-10-01&end=2026-10-31'` → HTTP 200 `application/json`, 1366 B. Para el 23/10 trae dos boletines: el ordinario nº 6425 y el extraordinario nº 48.
  - Marzo de 2025 → HTTP 200, con datos.
  - `https://bomemelilla.es/bome/BOME-B-2026-6424` (20/10) → HTTP 200, 58 155 B, 10 artículos. Ejemplo: "Decreto nº 405, de fecha 16 de octubre de 2026, relativo a locales oficiales y lugares públicos de uso gratuito, para celebrar actos públicos durante la Campaña de las Ele…" (ASAMBLEA DE MELILLA).
- **Cómo extraer los anuncios:**
  - Consejería: `button.accordion-button span` (p. ej. "ASAMBLEA DE MELILLA").
  - Organismo: `ul.organismo-list > li > h4` (texto tras el icono).
  - Artículo: `ul.articulo-list > li`, con `h5` "ARTÍCULO 1175 (CVE: BOME-A-2026-1175)" y `blockquote`, que contiene el título.
  - PDF: `/bome/descargar/BOME-A-2026-1175.pdf`. Vista web: `/bome/BOME-B-2026-6424/articulo/1175`.
  - Sumario PDF: `/bome/descargar/BOME-S-2026-6424.pdf`.
- **Cobertura:** histórico (2025 comprobado). Sale martes y viernes, más extraordinarios.
- **Pegas:** son 2 pasos (calendario JSON → HTML del boletín). No necesita autenticación.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de Navarra (BON) — Comunidad Foral de Navarra
- **URL portal:** https://bon.navarra.es
- **Acceso programático:** HTML por año y número, **no verificado**: `bon.navarra.es` da siempre `Connection reset by peer` desde aquí, y WebFetch da ENOTFOUND.
- **Endpoint por fecha:** no he encontrado ninguno. Según WebSearch, hay un patrón por número, `https://bon.navarra.es/es/boletin/-/sumario/{AAAA}/{N}` (citado como `…/sumario/2024/265`): **no verificado**. No encontré RSS ni API del BON; el portal datosabiertos.navarra.es no tiene un dataset del BON confirmado.
- **Ejemplo verificado:** **no verificado**. El error es `curl: (35) Recv failure: Connection reset by peer` (proxy: `ws_closed_mid_exchange`) tanto en https://bon.navarra.es/ como en /es/. Por http da "Could not resolve host".
- **Cómo extraer los anuncios:** desconocido. Hay que inspeccionarlo desde una IP española.
- **Cobertura:** desconocida.
- **Pegas:** inaccesible desde este entorno. Para pasar de fecha a número habrá que buscar un calendario.
- **Viabilidad:** DIFÍCIL desde aquí, por el bloqueo. Probablemente sea MEDIA.
- **Relevancia bomberos:** ha publicado convocatorias de bombero (19 plazas, BON nº 86 del 6/5/2019) y de sargento de bomberos (2022), según WebSearch.

#### Boletín Oficial de La Rioja (BOR) — La Rioja
- **URL portal:** https://web.larioja.org/bor-portada
- **Acceso programático:** **no verificado**. `web.larioja.org` y `www.larioja.org` dan reset desde aquí y WebFetch da ENOTFOUND.
- **Endpoint por fecha:** no encontrado. WebSearch no devolvió el patrón de URL de los sumarios; solo PDFs de memorias en `web.larioja.org/files/pdf/bor/`.
- **Ejemplo verificado:** **no verificado**. El error es `curl: (35) Recv failure: Connection reset by peer`.
- **Cómo extraer los anuncios:** desconocido.
- **Cobertura:** según la memoria del BOR, se publica de lunes a viernes no festivos (253 boletines y 6892 anuncios en 2025).
- **Pegas:** inaccesible desde aquí.
- **Viabilidad:** DIFÍCIL desde aquí (por determinar).

#### Boletín Oficial de Cantabria (BOC) — Cantabria
- **URL portal:** https://boc.cantabria.es/boces/
- **Acceso programático:** **no verificado**. Da reset desde aquí; `www.boc.cantabria.es` da `CONNECT tunnel failed, response 502` y WebFetch da ENOTFOUND.
- **Endpoint por fecha:** no verificado. Por WebSearch:
  - La portada tiene un calendario y una búsqueda por fecha, número o CVE.
  - Los anuncios siguen el patrón `https://boc.cantabria.es/boces/verAnuncioAction.do?idAnuBlob={id}`, visto en citas y copias de 2024–2025 (CVE-2025-7723 = idAnuBlob 424655).
  - No encontré la URL del sumario por fecha.
- **Ejemplo verificado:** **no verificado**. El error es `curl: (35) Recv failure: Connection reset by peer`.
- **Cómo extraer los anuncios:** desconocido. Es una aplicación Java (`.do`) y posiblemente necesite sesión.
- **Pegas:** inaccesible desde aquí.
- **Viabilidad:** DIFÍCIL desde aquí (por determinar).
- **Relevancia bomberos:** en el BOC salen las convocatorias de bomberos de Santander, Castro-Urdiales, Camargo y Torrelavega y de las plazas del SEMCA (fuente: BOE y prensa, vía WebSearch).

#### Boletín Oficial de la Ciudad de Ceuta (BOCCE) — Ciudad Autónoma de Ceuta
- **URL portal:** https://www.ceuta.es/ceuta/bocce
- **Acceso programático:** PDFs en un gestor de descargas Joomla (jdownloads), organizados por mes. **No verificado**: `www.ceuta.es`, `ceuta.es` y `sede.ceuta.es` dan reset y WebFetch da ENOTFOUND.
- **Endpoint por fecha:** no hay. Según WebSearch, los PDFs siguen el patrón `https://www.ceuta.es/ceuta/component/jdownloads/finish/{idCat}-{mes}/{idDoc}-bocce-{num}-{DD}-{MM}-{AAAA}?Itemid=0`, p. ej. `…/finish/1971-marzo/23088-bocce-6600-17-03-2026`. `idCat` e `idDoc` no se pueden predecir, así que hay que listar la categoría del mes: **no verificado**.
- **Ejemplo verificado:** **no verificado**. El error es `curl: (35) Recv failure: Connection reset by peer`.
- **Cómo extraer los anuncios:** solo hay PDF del boletín completo, con el sumario en las primeras páginas. Habría que convertirlo con `pdftotext` y parsearlo.
- **Pegas:** solo PDF, ids no predecibles e inaccesible desde aquí.
- **Viabilidad:** DIFÍCIL.

---

### Tabla resumen

| Fuente | Territorio | Tipo acceso | Viabilidad | Verificado (sí/parcial/no) |
|---|---|---|---|---|
| DOGV | Comunitat Valenciana | API JSON por fecha (`dogv-portal/dogv?date=`) | FÁCIL (con reintentos por resets) | sí |
| BOPV/EHAA | País Vasco | RSS último + calendario mensual → sumario HTML por número | FÁCIL–MEDIA | sí |
| DOE | Extremadura | HTML por fecha (`mostrardoe.php?fecha=`) + RSS por sección | FÁCIL | sí |
| DOCM | Castilla-La Mancha | HTML por fecha (`cambiarBoletin.do?fecha=`) | FÁCIL | sí |
| BOIB | Illes Balears | RSS / calendario mensual → boletín → sección HTML (+XML por disposición) | MEDIA | sí |
| BOPA | Principado de Asturias | PDF de sumario por fecha (`www.asturias.es/bopa/AAAA/MM/DD/AAAAMMDD.pdf`) | MEDIA | parcial (PDF sí; portal sede no accesible) |
| BOME | Melilla | API JSON calendario + HTML por boletín | FÁCIL | sí |
| BON | Navarra | HTML por año/número (patrón vía WebSearch) | DIFÍCIL desde aquí | no (reset) |
| BOR | La Rioja | desconocido | DIFÍCIL desde aquí | no (reset) |
| BOC | Cantabria | app Java `.do`, anuncios `verAnuncioAction.do?idAnuBlob=` | DIFÍCIL desde aquí | no (reset) |
| BOCCE | Ceuta | PDFs jdownloads por mes | DIFÍCIL | no (reset) |

---

## Parte 3 — BOP de Andalucía, Aragón, Canarias, Castilla y León y Castilla-La Mancha

Verificado con curl el 25/10/2026 (UA de navegador, `-m 30`). Fechas de prueba: 23/10/2026 (viernes) y 15/09/2025.

> **Aviso general de red:** 9 de las 27 fuentes no responden desde nuestra salida: el servidor corta la conexión
> tras el ClientHello TLS (`curl: (35) Recv failure: Connection reset by peer`). El proxy lo registra como
> `ws_closed_mid_exchange ... 39 B received`. Pasa en Málaga, Sevilla, Zaragoza, Burgos, Salamanca, Valladolid,
> Albacete y en los dominios principales de algunas Diputaciones (www.dpz.es, www.diputaciondeburgos.es,
> www.diputaciondevalladolid.es). Se reintentó 3 veces, con y sin www y por http. Lo más probable es un
> **bloqueo geográfico o por IP de los rangos no españoles**. Un bot alojado en España o con IP española
> probablemente sí llegue. Además hay otros bloqueos:
> - Cuenca: el proxy devuelve 502 al CONNECT.
> - Guadalajara: el firewall OSE de Joomla bloquea nuestra IP.
> - Ciudad Real: falla el certificado TLS.
> - Cádiz: el WAF F5 responde 403 de forma intermitente.
> - Jaén: devuelve 500 en todas las rutas.
> - Teruel: la conexión TLS se cae.

---

### Plataformas comunes detectadas (para el lector genérico)

#### P1. Plataforma SAGA "InPro BOP" sobre OpenCms (Granada, Huesca y León)
- **Cómo reconocerla:** recursos en `/export/system/modules/com.saga.inpro.theme.bop/...` y rutas `/publica/consulta-de-bops/`, `/publica/buscador-anuncios/`, `/publica/boletines-anteriores/`. La raíz redirige a `/publica/consulta-de-bops/`.
- **Endpoint por fecha:** `https://{host}/publica/consulta-de-bops/buscador/BOP-{DD}-{MM}-{AAAA}/`. Es un GET y no necesita cookies. Si ese día no hay boletín, devuelve **HTTP 404** (probado con el sábado 24/10/2026 en Granada).
- **Estructura (Granada y Huesca):** cada anuncio es un `li.elementoListado[data-tipo="Anuncio"]` con estos campos:
  - enlace: `a.enlace_elemento[href^="/publica/buscador-anuncios/anuncio/"]`; su atributo `title` es el título completo;
  - título: `h3.titulo_elemento`;
  - fecha: `div.fecha_elemento`;
  - `div.campoPersonalizado.campo_1`: el organismo (por ejemplo "AYUNTAMIENTO DE MOTRIL" o "Almunia de San Juan");
  - `campo_2`: el tipo (solo en Huesca);
  - `campo_3`: el identificador (`BOP-GRA-2026-206013` o `BOPH-2026-204002`).
- **Paginación:** hay un `input.totalPages` que en todas las pruebas valía 1, con 17 a 23 anuncios en una sola página. Si alguna vez vale más de 1, la paginación la hace el JavaScript de SagaListado (**no verificado**).
- **PDF del boletín completo:** `/export/sites/bop/.galleries/Documentos-BOPs-en-PDF/bop-DD_MM_AAAA-{uuid}-{ts}.pdf`. El sumario está en `/export/sites/bop/.galleries/DOCUMENTOS-Sumarios-en-PDF/...pdf`. Ambos enlaces aparecen en la página del día.
- **Variante León:** la misma URL por fecha responde 200, pero **no incluye el listado de anuncios en el HTML**. Solo trae los enlaces al PDF del BOP y al PDF del sumario. El buscador `/publica/buscador-anuncios/resultados-anuncios/` (campos `fechaDesde`, `fechaHasta`, `fdesde`, `fhasta`) tampoco devuelve resultados en el HTML, ni por GET ni por POST: se cargan con JavaScript.

#### P2. Software "nbop"/"bopsc2" en PHP de los BOP canarios (Las Palmas y Santa Cruz de Tenerife)
- **Cómo reconocerlo:** páginas con frames `cab.php`, `main1.php` y `pie.php`. El sumario está en `sumario.php?codigopub=1&fecha_mas_reciente=AAAA-MM-DD`. `main1.php` enumera los enlaces a todas las fechas del mes.
- **Estructura:**
  - número y fecha: `SUMARIO DEL BOLETÍN Nº <n>, DE FECHA DD-MM-AA`;
  - sección: texto en mayúsculas del tipo `II. ADMINISTRACIÓN ...`;
  - organismo: `<b><i>ORGANISMO</i></b><br>`;
  - cada anuncio: `<br>- Título<br>`.
- **Limitación:** no hay enlace propio para cada anuncio. Solo existe el PDF completo, en `../boletines/AAAA/DD-MM-AA/DD-MM-AA.pdf`.
- **Publicación:** lunes, miércoles y viernes.

#### P3. Buscador Solr de OpenCms con la fecha en el parámetro `lq` (Zamora)
- Solo se ha visto en Zamora. Se describe en su ficha.

---

### ANDALUCÍA

#### Boletín Oficial de la Provincia de Almería (BOP AL) — Almería
- **URL portal:** https://www.dipalme.org/. La portada enlaza a `https://app.dipalme.org/bop/publico.zul` y a `https://www.dipalme.org/Servicios/cmsdipro/index.nsf/bop_view.xsp?p=dipalme`.
- **Acceso programático:** es una aplicación **ZK (`.zul`)**, que obliga a ejecutar JavaScript.
- **Endpoint por fecha:** no hay ninguno visible.
- **Ejemplo verificado:** `curl 'https://app.dipalme.org/bop/publico.zul'` → 200, 1.919 bytes. Solo contiene los cargadores `zk.wpd;jsessionid=...` y ningún dato. **No verificado** el contenido.
- **Cómo extraer:** habría que reproducir las peticiones AJAX de ZK (`/bop/zkau`) o usar un navegador sin interfaz gráfica.
- **Cobertura:** desconocida.
- **Pegas:** JavaScript obligatorio, sesión `jsessionid` y protocolo ZK con estado.
- **Viabilidad:** DIFÍCIL.

#### Boletín Oficial de la Provincia de Cádiz (BOP CA) — Cádiz
- **URL portal:** https://www.bopcadiz.es/
- **Acceso programático:** HTML. La portada y `/boletin/` muestran el sumario del **último** boletín.
- **Endpoint por fecha:** no encontrado. Los PDF siguen el patrón `https://www.bopcadiz.es/.boletines_pdf/AAAA/MM_mes/BOP{num}_DD-MM-AA.pdf` y el sumario `.../SU-{num}_DD-MM-AA.pdf`. Para construirlos hace falta el número de boletín. **No verificado** para fechas antiguas.
- **Ejemplo verificado:** `curl 'https://www.bopcadiz.es/'` → 200, 42.713 bytes, 21 anuncios. Ejemplos:
  - "346.403.- Ayuntamiento de Algeciras. Resolución de caducidad e incorporación a la OEP 2027 de 2 plazas de Administrativo/a…";
  - "346.767.- Ayuntamiento de Ubrique. Corrección de errores de las bases… 1 plaza de Sepulturero/a".
- **Cómo extraer:**
  - número de boletín: `h2` con el texto "Boletín número N del año AAAA";
  - sección: `h3`;
  - cada anuncio: un `p > a[href*=".boletines_pdf/"]`; dentro, `<strong>` contiene "nº registro.- Organismo." y el resto del texto es el título;
  - el enlace es `...pdf#page=N`.
- **Cobertura:** solo el día en curso. El buscador (POST con `fch_ini`, `anno`, `n_boletin`) y la lista `list-inner.jsp` se cargan con JavaScript; la prueba con `fch_ini=15/09/2025` devolvió "No hay entradas".
- **Pegas:** el WAF F5 responde **403 de forma intermitente** ("The requested URL was rejected… Error 403 - Forbidden", F5 site dc12-ash). Hay que reintentar.
- **Viabilidad:** MEDIA, siempre que el bot lea la portada a diario.

#### Boletín Oficial de la Provincia de Córdoba (BOP CO) — Córdoba
- **URL portal:** https://bop.dipucordoba.es/ (Next.js con renderizado en servidor).
- **Acceso programático:** HTML por fecha, ya renderizado en el servidor.
- **Endpoint por fecha:** `https://bop.dipucordoba.es/dia/{DD-MM-AAAA}`
- **Ejemplo verificado:**
  - `curl 'https://bop.dipucordoba.es/dia/22-10-2026'` → 200, 58 KB, 16 PDF de anuncios;
  - `/dia/15-09-2025` → 200, 20 anuncios;
  - la portada (23/10/2026) incluye "Exposición pública Proyecto de Obra 'Construcción de tanatorio y adecuación de ampliación de cementerio', en Guadalcázar (Córdoba)" y "Convocatoria Asamblea General a celebrar el día 19 de noviembre de 2026".
- **Cómo extraer:**
  - sección: `h1.font-j` (por ejemplo "VI - ADMINISTRACIÓN LOCAL");
  - organismo: `li.emisor > h2`;
  - cada anuncio: `li.announcement` (su `key` es el identificador interno, por ejemplo 121546); el título es su primer `p`;
  - enlace: `a[href^="/visor-pdf/DD-MM-AAAA/BOP-A-AAAA-NNNN.pdf"]`;
  - también está el sumario: `/visor-pdf/.../BOP-S-AAAA-NNN.pdf`;
  - en el payload `self.__next_f` vienen las listas `emisors`, `sections` y `categories` (por ejemplo "Oposiciones y concursos", id 34).
- **Cobertura:** histórico por fecha (verificado hasta 2025).
- **Pegas:** ninguna relevante. Existe `apis.dipucordoba.es`, pero no se ha investigado.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de la Provincia de Granada (BOP GR) — Granada
- **URL portal:** https://bop.dipgra.es/. Usa la **plataforma P1 (SAGA)**.
- **Acceso programático:** HTML por fecha.
- **Endpoint por fecha:** `https://bop.dipgra.es/publica/consulta-de-bops/buscador/BOP-{DD}-{MM}-{AAAA}/`
- **Ejemplo verificado:**
  - `.../BOP-23-10-2026/` → 200, `text/html`, 117 KB, 17 anuncios. Ejemplo: "**Bases selección para la provisión, mediante el sistema de oposición libre… de seis (6) plazas de Bombero/a**…", organismo AYUNTAMIENTO DE MOTRIL;
  - `BOP-15-09-2025` → 200, 23 anuncios;
  - `BOP-24-10-2026` (sábado) → 404.
- **Cómo extraer:** ver P1.
- **Cobertura:** histórico por fecha. Hay un archivo antiguo en `archivo.dipgra.es`.
- **Pegas:** los días sin boletín devuelven 404.
- **Viabilidad:** FÁCIL.
- **Relevancia bomberos:** el 23/10/2026 publicó las bases de 6 plazas de Bombero/a del Ayuntamiento de Motril.

#### Boletín Oficial de la Provincia de Huelva (BOP H) — Huelva
- **URL portal:** https://s2.diphuelva.es/servicios/bope_web/UltimoBop. Se llega desde sede.diphuelva.es, que enlaza a `BOP.jsp`. La ruta `www.diphuelva.es/bop/` da 404.
- **Acceso programático:** **API JSON**, la llamada AJAX que usa la propia web.
- **Endpoint por fecha:** `POST https://s2.diphuelva.es/lib/bope/anuncios_bop/ajaxAnuncios.php` con cuerpo `tipo=2&fecha=DD-MM-AAAA`. Con `tipo=1` devuelve el último boletín.
- **Ejemplo verificado:**
  - `curl --data 'tipo=2&fecha=23-10-2026' 'https://s2.diphuelva.es/lib/bope/anuncios_bop/ajaxAnuncios.php'` → 200, `application/json`, 54 KB, 18 anuncios. Ejemplo: "Ayuntamiento de Almonaster la Real | Aprobación de las Bases de la convocatoria para cubrir una plaza de Fontanero, Sepulturero…";
  - `fecha=15-09-2025` → 200, `num_bop` 175.
- **Cómo extraer:**
  - en la raíz: `success`, `fecha_publicacion`, `TieneAnuncios`, `Indice.{num_bop, documento}`;
  - en cada `Anuncios[]`: `id_anuncio`, `titulo`, `entidad_anunciante`, `documento` (por ejemplo `Anuncio_382633_BOP-205_2026.pdf`), `csv`, `Categoria`, `Seccion`, `num_expe`.
- **Enlace al PDF:** `https://s2.diphuelva.es/portalweb/bope/anuncios/{documento}`. Verificado: responde 200 con `application/pdf`.
- **Cobertura:** histórico por fecha (verificado hasta 2025).
- **Pegas:** es POST. La página HTML está en ISO-8859-1, pero el JSON viene en UTF-8.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de la Provincia de Jaén (BOP J) — Jaén
- **URL portal:** https://bop.dipujaen.es/
- **Acceso programático:** **no verificado**.
- **Endpoint por fecha:** desconocido. En buscadores aparecen URLs del tipo `https://bop.dipujaen.es/resultados/{base64}/pdf`.
- **Ejemplo verificado:** cualquier ruta (`/`, `/index.php`, `/sumario`, `/rss`, `/resultados/...`) responde **HTTP 500**, con 55 KB de página de error ("El recurso al que intenta acceder no existe o tiene problemas a ser cargado"). Pasa igual con y sin UA de navegador. Por http no resuelve DNS. En cambio, `www.dipujaen.es` responde 200.
- **Cómo extraer:** no se pudo averiguar.
- **Pegas:** el servidor devuelve 500 a nuestra IP. Puede ser una caída o un bloqueo.
- **Viabilidad:** DIFÍCIL desde aquí. Hay que reintentar desde una IP española.

#### Boletín Oficial de la Provincia de Málaga (BOP MA) — Málaga
- **URL portal:** https://www.bopmalaga.es/ (lo edita el CEDMA de la Diputación).
- **Acceso programático:** **no verificado**.
- **Endpoint por fecha:** desconocido.
- **Ejemplo verificado:** `curl: (35) Recv failure: Connection reset by peer` en 3 intentos, con `https://www.`, `https://` sin www y `http://` (este último sin DNS). `sede.malaga.es` también se corta. WebFetch da ENOTFOUND.
- **Pegas:** probable bloqueo geográfico o por IP.
- **Viabilidad:** DIFÍCIL desde aquí. Hay que reintentar desde una IP española.

#### Boletín Oficial de la Provincia de Sevilla (BOP SE) — Sevilla
- **URL portal:** https://www.bopsevilla.es/ (plataforma "BOPSevill@", en producción desde el 01/12/2022).
- **Acceso programático:** **no verificado**.
- **Endpoint por fecha:** desconocido.
- **Ejemplo verificado:**
  - `www.bopsevilla.es` → `Connection reset by peer` en 3 intentos;
  - `bopsevilla.es` y `sede.dipusevilla.es` → `CONNECT tunnel failed, response 502` (el proxy lo deniega).
- **Pegas:** bloqueo de IP y de política del proxy.
- **Viabilidad:** DIFÍCIL desde aquí.

---

### ARAGÓN

#### Boletín Oficial de la Provincia de Huesca (BOPH) — Huesca
- **URL portal:** https://bop.dphuesca.es/. Usa la **plataforma P1 (SAGA)**.
- **Endpoint por fecha:** `https://bop.dphuesca.es/publica/consulta-de-bops/buscador/BOP-{DD}-{MM}-{AAAA}/`
- **Ejemplo verificado:**
  - `.../BOP-23-10-2026/` → 200, 140 KB, 20 anuncios. Ejemplos: "Aprobación inicial cuenta general 2025" (Almunia de San Juan, BOPH-2026-204002) y "Modificación de errores tipográficos en Decreto de resolución RAEE";
  - `BOP-15-09-2025` → 200, 17 anuncios.
- **Cómo extraer:** ver P1. En Huesca `campo_1` es el organismo, `campo_2` el tipo y `campo_3` el identificador.
- **Cobertura:** histórico por fecha.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de la Provincia de Teruel (BOPTE) — Teruel
- **URL portal:** https://bop.dpteruel.es/, que redirige a `https://236ws.dpteruel.es/DPT/bopt.nsf` (Lotus Domino). La redirección sí está verificada.
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:**
  - `236ws.dpteruel.es` → `curl: (35) OpenSSL SSL_connect: SSL_ERROR_SYSCALL` y en otro intento `(55) getpeername() failed`;
  - `www.dpteruel.es` → 403.
- **Pegas:** la conexión TLS se cae y puede haber filtrado de IP.
- **Viabilidad:** DIFÍCIL desde aquí.

#### Boletín Oficial de la Provincia de Zaragoza (BOPZ) — Zaragoza
- **URL portal:** https://bop.dpz.es/
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:** `bop.dpz.es` y `www.dpz.es` → `Connection reset by peer` en 3 intentos. Por http no resuelve DNS.
- **Pegas:** probable bloqueo geográfico o por IP.
- **Viabilidad:** DIFÍCIL desde aquí.
- **Relevancia bomberos:** según agregadores (redopositor.com), el BOPZ publica listas de admitidos de Bombero/a de la DPZ.

---

### CANARIAS

#### Boletín Oficial de la Provincia de Las Palmas (BOP LP) — Las Palmas
- **URL portal:** https://www.boplaspalmas.net/nbop2/index.php. Usa la **plataforma P2**.
- **Acceso programático:** HTML por fecha.
- **Endpoint por fecha:** `https://www.boplaspalmas.net/nbop2/sumario.php?codigopub=1&fecha_mas_reciente={AAAA-MM-DD}`
- **Ejemplo verificado:**
  - `...fecha_mas_reciente=2026-10-23` → 200, 10 KB, boletín nº 127. Ejemplos: "Bases Específicas del proceso selectivo para cubrir 5 plazas de Técnico/a Superior de Seguridad y Emergencias" (EXCMO. AYUNTAMIENTO DE LAS PALMAS DE GRAN CANARIA) y "Extracto de convocatoria de subvenciones para instalar sistemas de videovigilancia en auto-taxis de Gran Canaria (2026)";
  - `2025-09-15` → 200, con su PDF `../boletines/2025/15-09-25/15-09-25.pdf`.
- **Cómo extraer:** ver P2. Basta separar por `<br>` y distinguir `<b><i>ORGANISMO</i></b>` de las líneas que empiezan por `- `.
- **Cobertura:** histórico por fecha.
- **Pegas:** no hay URL individual por anuncio, solo el PDF completo. Por http falla el DNS: hay que usar https. Publica lunes, miércoles y viernes.
- **Viabilidad:** FÁCIL.
- **Relevancia bomberos:** el 23/10/2026 publicó las bases de plazas de Seguridad y Emergencias.

#### Boletín Oficial de la Provincia de Santa Cruz de Tenerife (BOP TF) — Santa Cruz de Tenerife
- **URL portal:** https://www.bopsantacruzdetenerife.es/bopsc2/index.php. Usa la **plataforma P2**, el mismo software que Las Palmas.
- **Endpoint por fecha:** `https://www.bopsantacruzdetenerife.es/bopsc2/sumario.php?codigopub=1&fecha_mas_reciente={AAAA-MM-DD}`
- **Ejemplo verificado:**
  - `...=2026-10-23` → 200, 14 KB, nº 127. Ejemplos: "Anuncio relativo a extracto de la Resolución… nombramiento… tres (3) plazas de Agente de Medio Ambiente" (CABILDO INSULAR DE LA GOMERA) y "Bases específicas para el otorgamiento de subvenciones para la producción ecológica 2026" (CABILDO INSULAR DE EL HIERRO);
  - `2025-09-15` → 200.
- **Cómo extraer:** ver P2. El PDF está en `../boletines/AAAA/DD-MM-AA/DD-MM-AA.pdf`.
- **Cobertura:** histórico por fecha.
- **Pegas:** las mismas que Las Palmas.
- **Viabilidad:** FÁCIL.

---

### CASTILLA Y LEÓN

#### Boletín Oficial de la Provincia de Ávila (BOP AV) — Ávila
- **URL portal:** https://www.diputacionavila.es/boletin-oficial/
- **Acceso programático:** **RSS por fecha** y HTML por fecha.
- **Endpoint por fecha:**
  - RSS: `https://www.diputacionavila.es/bops/{AAAA}/{DD-MM-AAAA}/rss.xml`
  - HTML: `https://www.diputacionavila.es/boletin-oficial/{AAAA}/{DD-MM-AAAA}.html`
- **Ejemplo verificado:**
  - RSS del 23-10-2026 → 200, `application/xml`, 4,5 KB, 11 `<item>`. Ejemplos: "AYUNTAMIENTO DE CANTIVEROS - 2070/26 | APROBACIÓN DEFINITIVA DE LA ORDENANZA REGULADORA DE LA TASA POR DISTRIBUCIÓN DE AGUA…" y "AYUNTAMIENTO DE CASILLAS - 2087/26 | ADJUDICACIÓN POR CONCURSO PÚBLICO DEL APROVECHAMIENTO FORESTAL…";
  - RSS del 15-09-2025 → 200, 2 items;
  - HTML del 23-10-2026 → 200, 52 KB.
- **Cómo extraer:**
  - RSS: `item/title` contiene "ORGANISMO - nº/aa", `item/description` el título y `item/link` el PDF del anuncio (`/bops/AAAA/DD-MM-AAAA/DD-MM-AAAA_{nnnnaa}.pdf`). Los textos usan entidades HTML;
  - HTML: el organismo va en `div.listado > span`, el número en `p.num` y el título en `li a[href$=".pdf"]`;
  - el boletín completo está en `/bops/AAAA/DD-MM-AAAA.pdf`.
- **Cobertura:** histórico por fecha (el índice anual llega hasta 2017 como mínimo).
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de la Provincia de Burgos (BOPBUR) — Burgos
- **URL portal:** https://bopbur.diputaciondeburgos.es/
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:** tanto `bopbur.diputaciondeburgos.es` como `www.diputaciondeburgos.es` → `Connection reset by peer` en 3 intentos.
- **Pegas:** probable bloqueo geográfico o por IP.
- **Viabilidad:** DIFÍCIL desde aquí.

#### Boletín Oficial de la Provincia de León (BOP LE) — León
- **URL portal:** https://bop.dipuleon.es/. Usa la **plataforma P1 (SAGA)** en su variante sin listado HTML.
- **Acceso programático:** HTML por fecha, que solo da los enlaces a PDF. Los anuncios se extraen del **sumario en PDF**.
- **Endpoint por fecha:** `https://bop.dipuleon.es/publica/consulta-de-bops/buscador/BOP-{DD}-{MM}-{AAAA}/`. Dentro aparecen `href="/export/sites/bop/.galleries/DOCUMENTOS-Sumarios-en-PDF/final-{hash}.pdf"` (el sumario) y `.../Documentos-BOPs-en-PDF/bop-DD_MM_AAAA-....pdf` (el boletín).
- **Ejemplo verificado:**
  - `BOP-23-10-2026` → 200, 44 KB, sin `elementoListado`;
  - el sumario `final-5b3c8cdb.pdf` → 200, `application/pdf`, 313 KB. Con `pdftotext` se obtiene "Boletín núm. 202 … - Ayuntamiento de Bembibre / Resolución por la que se aprueba la lista definitiva de admitidos y excluidos… Encargado de Instalaciones Deportivas… [28 anuncios]";
  - `BOP-15-09-2025` → 200, con su propio PDF de sumario.
- **Cómo extraer:** con `pdftotext` sobre el sumario. Las líneas "- Ayuntamiento de X" son el organismo y las líneas siguientes, hasta la próxima línea en blanco, son el título.
- **Cobertura:** histórico por fecha.
- **Pegas:** depende de un PDF. El listado HTML y el buscador se cargan con JavaScript.
- **Viabilidad:** MEDIA.

#### Boletín Oficial de la Provincia de Palencia (BOP P) — Palencia
- **URL portal:** https://www.diputaciondepalencia.es/servicios/boletin-oficial-provincia (Drupal).
- **Acceso programático:** listado HTML de boletines y un PDF por boletín.
- **Endpoint por fecha:** no admite la fecha sola. La página del boletín es `/servicios/boletin-oficial-provincia/bop-no-{num}-{diasemana}-{DD}-{mes}-{AAAA}` y su PDF `/system/files/bop/{AAAA}/{AAAAMMDD}-bop-{num}-Ordinario.pdf`. Los slugs se toman del listado, que admite el filtro `?f[0]=fecha_de_bop:AAAA` y `&page=N`.
- **Ejemplo verificado:**
  - `.../bop-no-127-viernes-23-octubre-2026` → 200;
  - su PDF `20261023-bop-127-Ordinario.pdf` → 200, 1,7 MB. El sumario de la página 1, extraído con `pdftotext`, incluye "Procedimiento abierto para el arrendamiento de las fincas rústicas y nave agrícola de la explotación 'La Morenilla'";
  - el listado `?f[0]=fecha_de_bop:2025` → 200 (bop-no-157 del 31-12-2025, hasta page=5).
- **Cómo extraer:**
  1. del listado, enlaces `a[href^="/servicios/boletin-oficial-provincia/bop-no-"]`; el slug contiene la fecha;
  2. de la página del boletín, `a[href$="-Ordinario.pdf"]`;
  3. con `pdftotext -l 3`, las páginas del sumario.
- **Cobertura:** histórico desde 2003.
- **Pegas:** solo hay PDF. Publica lunes, miércoles y viernes.
- **Viabilidad:** MEDIA o DIFÍCIL (por depender del PDF).

#### Boletín Oficial de la Provincia de Salamanca (BOP SA) — Salamanca
- **URL portal:** `https://www.lasalina.es/bop/`, que redirige a `https://sede.diputaciondesalamanca.gob.es/BOP/`. La redirección sí está verificada.
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:**
  - `sede.diputaciondesalamanca.gob.es` → `Connection reset by peer` en 3 intentos;
  - `www.lasalina.es` → en otro intento, timeout de 25 s.
- **Pegas:** probable bloqueo geográfico o por IP.
- **Viabilidad:** DIFÍCIL desde aquí.

#### Boletín Oficial de la Provincia de Segovia (BOP SG) — Segovia
- **URL portal:** https://www.dipsegovia.es/bop (Liferay).
- **Acceso programático:** HTML por fecha que solo da el PDF del boletín. Los anuncios están en el sumario de ese PDF.
- **Endpoint por fecha:** `https://www.dipsegovia.es/bop?p_p_id=as_asac_asset_search_AssetSearchInstancePortlet_INSTANCE_r0jAmqbO3Q75&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_r_p_startDate={DD}%2F{MM}%2F{AAAA}&p_r_p_endDate={DD}%2F{MM}%2F{AAAA}`. Es la URL que usa el calendario de la página.
- **Ejemplo verificado:**
  - con el 23/10/2026 → 200, 150 KB; contiene `/documents/39512/e99e5722-...` (el PDF del BOP nº 127) y `articleId=20628191`;
  - con el 15/09/2025 → 200, con otro PDF (`/documents/39512/66255421-...`, `articleId=12998319`);
  - el PDF → 200, `application/pdf`, 1,1 MB. La página 1 contiene "SUMARIO … Extracto de la convocatoria del 36º Concurso Provincial de Belenes 2026/2027".
- **Cómo extraer:**
  1. regex `/documents/39512/[0-9a-f-]{36}` en la página del día;
  2. descargar el PDF;
  3. `pdftotext -l 3` sobre el sumario. El maquetado en columnas desordena el texto.
- **Cobertura:** histórico por fecha.
- **Pegas:** solo hay PDF y su texto se extrae desordenado. Los IDs de portlet (`INSTANCE_r0jAmqbO3Q75`) podrían cambiar. Publica lunes, miércoles y viernes.
- **Viabilidad:** DIFÍCIL (por depender del PDF).

#### Boletín Oficial de la Provincia de Soria (BOP SO) — Soria
- **URL portal:** https://bop.dipsoria.es/ (CMS "mvc" de Net2U).
- **Acceso programático:** HTML por fecha en dos pasos. Existe un RSS (`/index.php/mod.global/mem.rssHome`), pero sale vacío: un único `<item>` sin título.
- **Endpoint por fecha:** `https://bop.dipsoria.es/index.php/mod.boloficial/mem.listadodia/fecha.{DD-MM-AAAA}`. Ahí está el enlace `mem.detalle/id.{N}/relcategoria.210`, que abre el sumario del boletín.
- **Ejemplo verificado:**
  - `.../fecha.23-10-2026` → 200, con el enlace "BOP 122 VIERNES 23 DE OCTUBRE DE 2026" (`id.55692`);
  - `.../mem.detalle/id.55692/relcategoria.210` → 200, 44 KB, 34 enlaces de descarga. Ejemplos: "Subsanación Constitución Junta Electoral Provincial" y "SGIISE/ PEol-FV-157 / Resolución Desestimación AAP y AAC";
  - `fecha.15-09-2025` → 200 (`id.52400`).
- **Cómo extraer:** en la página de detalle, la jerarquía va en `p.fec-f1` anidados con distinto `margin-left`: 5px es el organismo, 10px el suborganismo y 15px el título del anuncio, que empieza por " - ". El PDF está en el `div.caj-doc a[href*="mod.documentos/mem.descargar/fichero.documentos_{id}_..."]` siguiente.
- **Cobertura:** histórico por fecha, desde 2004.
- **Pegas:** son dos peticiones por día. Publica lunes, miércoles y viernes.
- **Viabilidad:** MEDIA (fácil de programar).

#### Boletín Oficial de la Provincia de Valladolid (BOPVA) — Valladolid
- **URL portal:** https://bop.sede.diputaciondevalladolid.es/
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:** `bop.sede.diputaciondevalladolid.es` y `www.diputaciondevalladolid.es` → `Connection reset by peer` en 3 intentos.
- **Pegas:** probable bloqueo geográfico o por IP.
- **Viabilidad:** DIFÍCIL desde aquí.

#### Boletín Oficial de la Provincia de Zamora (BOP ZA) — Zamora
- **URL portal:** https://www.diputaciondezamora.es/opencms/servicios/BOP/bop/index.html. Se llega desde `/opencms/servicios/bop_redirect` (301). `bop.diputaciondezamora.es` se corta.
- **Acceso programático:** HTML. El índice muestra los **8 últimos boletines**, cada uno con su página.
- **Endpoint por fecha:** no hay por GET. Cada boletín tiene una URL con UUID: `/opencms/servicios/BOP/indice-bop/{uuid}/`. El buscador `/opencms/servicios/BOP/busqueda-en-el-bop/index.html?lq=TIPOS-----ANIOS-----PROCEDENCIAS-----NUMBOLETIN-----DD/MM/AAAA-----ORGANISMO&reloaded=&q=&sort=instancedate_es_dt+desc` responde 200, pero carga los resultados con JavaScript. **No verificado** que devuelva datos.
- **Ejemplo verificado:**
  - `index.html` → 200, 44 KB, con BOP 118 a 125. Cada uno tiene `title="ORDINARIO: BOP 125"` y `div.teaser-date` "viernes, 23 de octubre de 2026";
  - `indice-bop/6ad59481-ce0b-11f1-a057-1576f9d14bbb/` → 200, 56 KB, 33 anuncios. Ejemplo: "Organismo: Ayuntamiento de Almaraz de Duero — Aprobación definitiva de la modificación de la Ordenanza fiscal reguladora de la tasa por la prestación de servicio en la Residencia…", referencia 202602399.
- **Cómo extraer:**
  1. en el índice, el enlace del boletín es `a[href^="/opencms/servicios/BOP/indice-bop/"]` y la fecha está en `.teaser-date`;
  2. en el boletín, cada `div#anuncio` contiene "Procedencia: …", "Organismo: …", "Extracto:" (con el texto en `div.text`) y "Nº de referencia: N";
  3. el PDF del anuncio es `a[href*="/BOP/anuncios/AAAA/{num}/{ref}.pdf"]` y el del boletín completo `/BOP/AAAA/AAAAMMDD-{num}.pdf`.
- **Cobertura:** sin JavaScript, solo los últimos 8 boletines, lo que basta para una lectura diaria. El histórico está en el buscador, que necesita JavaScript.
- **Pegas:** las URLs llevan UUID y no hay acceso directo por fecha.
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** entre las procedencias del buscador figura el "CONSORCIO PROVINCIAL DE PREVENCIÓN Y EXTINCIÓN DE INCENDIOS, SALVAMENTOS Y PROTECCIÓN CIVIL ZAMORA".

---

### CASTILLA-LA MANCHA

#### Boletín Oficial de la Provincia de Albacete (BOP AB) — Albacete
- **URL portal:** https://bop.dipualba.es/ (enlazado desde web.dipualba.es).
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:**
  - `bop.dipualba.es` → `Connection reset by peer` en 3 intentos;
  - `web.dipualba.es` → 503 en el primer intento y 200 en el segundo.
- **Pegas:** probable bloqueo geográfico o por IP.
- **Viabilidad:** DIFÍCIL desde aquí.

#### Boletín Oficial de la Provincia de Ciudad Real (BOP CR) — Ciudad Real
- **URL portal:** https://bop.dipucr.es/ (enlazado desde www.dipucr.es, que sí responde 200).
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:** `curl: (60) SSL certificate problem: unable to get local issuer certificate`, repetido en 2 intentos. Seguramente el servidor no envía el certificado intermedio. No se desactivó TLS, como exigen las normas.
- **Pegas:** cadena TLS incompleta. Un bot tendría que añadir el certificado intermedio de la CA a su almacén de confianza.
- **Viabilidad:** DIFÍCIL hasta resolver el problema TLS.

#### Boletín Oficial de la Provincia de Cuenca (BOP CU) — Cuenca
- **URL portal:** https://bop.dipucuenca.es/
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:**
  - `bop.dipucuenca.es` → `CONNECT tunnel failed, response 502`; el proxy lo registra como "connect_rejected: policy denial or upstream failure";
  - `www.dipucuenca.es` → 403.
- **Pegas:** bloqueo de política del proxy o del servidor de origen.
- **Viabilidad:** DIFÍCIL desde aquí.

#### Boletín Oficial de la Provincia de Guadalajara (BOP GU) — Guadalajara
- **URL portal:** https://boletin.dguadalajara.es/boletin/ (Joomla).
- **Acceso programático:** **no verificado**.
- **Ejemplo verificado:** HTTP 200, pero el contenido es la página de bloqueo del firewall OSE de Joomla: "mailto:…?Subject=Inquiry: Banned for suspicious hacking behaviour - IP: 160.79.106.129 - Violation". Se repitió en un segundo intento con la IP .131.
- **Pegas:** el firewall de la aplicación ha vetado las IP de nuestra salida.
- **Viabilidad:** DIFÍCIL desde aquí. Hay que probar desde otra IP.

#### Boletín Oficial de la Provincia de Toledo (BOP TO) — Toledo
- **URL portal:** https://bop.diputoledo.es/webEbop/ (JSP).
- **Acceso programático:** HTML por fecha mediante GET.
- **Endpoint por fecha:** `https://bop.diputoledo.es/webEbop/ebopResumen.jsp?publication_date={DD/MM/AAAA}&publication_date_to={DD/MM/AAAA}`. Admite un rango de fechas.
- **Ejemplo verificado:**
  - `...publication_date=23/10/2026&publication_date_to=23/10/2026` → 200, 44 KB, 32 anuncios. Ejemplos: "MODIFICACIÓN DEL CONVENIO COLECTIVO DEL PERSONAL LABORAL DEL AYUNTAMIENTO DE CAMARENA" y "PADRON ESCUELA INFANTIL SEPTIEMBRE-26" (AYUNTAMIENTO DE NAMBROCA);
  - con el 15/09/2025 → 200, BOP 175.
- **Cómo extraer:**
  - organismo: `h3.publisherBlock`, con el texto "Anunciante : X";
  - cada anuncio: el bloque `div.announce` que le sigue, cuyo `id` es el identificador;
  - título: el texto tras `Resumen/Asunto : </strong>`;
  - número: el texto tras `Número de inserción : </strong>`;
  - tipo: `Tipo de anuncio`;
  - enlace: `a[href^="DocGet?id="]`, relativo a `/webEbop/`;
  - boletín completo: `DocGet?bop={n}&insert_year=AAAA&publication_date=DDMMAAAA&anexo=0`.
- **Cobertura:** histórico por fecha. El calendario `ebopCalendar.jsp` enlaza todos los días con boletín.
- **Pegas:** `csv.jsp` no devuelve CSV, sino una página para validar documentos. Puede que haya paginación con los parámetros `start` y `numResults` del buscador (**no verificado**, porque con 32 resultados todo cupo en una página).
- **Viabilidad:** FÁCIL.

---

### Tabla resumen

| Fuente | Territorio | Tipo acceso | Viabilidad | Verificado (sí/parcial/no) |
|---|---|---|---|---|
| BOP Almería | Almería | App ZK (.zul), JavaScript obligatorio | DIFÍCIL | parcial (solo cargador ZK) |
| BOP Cádiz | Cádiz | HTML del último sumario; WAF F5 intermitente | MEDIA | parcial (último boletín sí; por fecha no) |
| BOP Córdoba | Córdoba | HTML por fecha `/dia/DD-MM-AAAA` | FÁCIL | sí |
| BOP Granada | Granada | HTML por fecha (P1 SAGA) | FÁCIL | sí |
| BOP Huelva | Huelva | JSON por fecha (POST ajaxAnuncios.php) | FÁCIL | sí |
| BOP Jaén | Jaén | — (HTTP 500 en todo) | DIFÍCIL | no |
| BOP Málaga | Málaga | — (conexión cortada; ¿bloqueo geográfico?) | DIFÍCIL | no |
| BOP Sevilla | Sevilla | — (conexión cortada o 502) | DIFÍCIL | no |
| BOPH Huesca | Huesca | HTML por fecha (P1 SAGA) | FÁCIL | sí |
| BOPTE Teruel | Teruel | Lotus Domino; error TLS | DIFÍCIL | no |
| BOPZ Zaragoza | Zaragoza | — (conexión cortada) | DIFÍCIL | no |
| BOP Las Palmas | Las Palmas | HTML por fecha (P2 sumario.php) | FÁCIL | sí |
| BOP S/C Tenerife | Santa Cruz de Tenerife | HTML por fecha (P2 sumario.php) | FÁCIL | sí |
| BOP Ávila | Ávila | RSS por fecha y HTML por fecha | FÁCIL | sí |
| BOPBUR Burgos | Burgos | — (conexión cortada) | DIFÍCIL | no |
| BOP León | León | HTML por fecha (P1 sin listado) y PDF de sumario | MEDIA | sí |
| BOP Palencia | Palencia | Listado HTML y PDF | MEDIA/DIFÍCIL | sí |
| BOP Salamanca | Salamanca | — (conexión cortada) | DIFÍCIL | no |
| BOP Segovia | Segovia | HTML por fecha que da solo el PDF | DIFÍCIL | sí |
| BOP Soria | Soria | HTML por fecha en 2 pasos | MEDIA | sí |
| BOPVA Valladolid | Valladolid | — (conexión cortada) | DIFÍCIL | no |
| BOP Zamora | Zamora | HTML con los últimos 8 boletines (UUID) | MEDIA | sí (sin histórico por fecha) |
| BOP Albacete | Albacete | — (conexión cortada) | DIFÍCIL | no |
| BOP Ciudad Real | Ciudad Real | — (cadena TLS incompleta) | DIFÍCIL | no |
| BOP Cuenca | Cuenca | — (proxy 502 o 403) | DIFÍCIL | no |
| BOP Guadalajara | Guadalajara | — (IP vetada por el firewall de Joomla) | DIFÍCIL | no |
| BOP Toledo | Toledo | HTML por fecha (ebopResumen.jsp) | FÁCIL | sí |

---

## Parte 4 — BOP de Catalunya, C. Valenciana, Extremadura, Galicia y País Vasco

Verificado con curl el 25/10/2026, con UA de navegador y `-m 30`. Fechas de prueba: 22/10/2026 y 23/10/2026 (recientes), y 15/09/2026 o 15/09/2025 (antiguas).

**Red:** desde este entorno varias conexiones dan `Recv failure: Connection reset by peer` de forma intermitente (bop.diba.cat, dip-badajoz.es). Con 2-4 reintentos responden 200. **El bot debe reintentar.**

### Plataformas comunes detectadas

- **Plataforma "BOPB" de la Diputació de Barcelona, usada por Barcelona y Tarragona.** Las dos tienen exactamente las mismas rutas:
  - `…/anteriors/AAAA-MM-DD` (HTML por fecha, 20 resultados por página, paginación en `…/anteriors/AAAA-MM-DD/N`).
  - `…/dades-obertes/butlleti-del-dia/feed` (RSS del día, completo, sin paginar), más un feed por sección.
  - El filtro `?bopb_dia[tipusAnunci]=…` y la ficha `…/anunci/{id}`.
  - Base Barcelona: `https://bop.diba.cat`. Base Tarragona: `https://www.dipta.cat/bopt/web`.
  - **El mismo parser vale para las dos.**
- **Girona** (`ssl4.ddgi.cat/bopV1/pdf/...`) y **Lleida** (`ebop.diputaciolleida.cat/aplicacions/bop/bopV1/...`, ruta vista en un enlace de la web de la Diputació) comparten el nombre de ruta "bopV1". Que sean la misma plataforma es **no verificado**: Lleida no responde.
- Galicia: las cuatro diputaciones usan cuatro sistemas distintos.
- País Vasco: los tres forales usan tres sistemas distintos.

---

#### Butlletí Oficial de la Província de Barcelona (BOPB) — Barcelona
- **URL portal:** https://bop.diba.cat/
- **Acceso programático:**
  - RSS del día (datos abiertos): `/dades-obertes`.
  - HTML por fecha (histórico).
- **Endpoint por fecha:**
  - HTML: `https://bop.diba.cat/anteriors/{AAAA-MM-DD}`. Páginas siguientes: `https://bop.diba.cat/anteriors/{AAAA-MM-DD}/{N}`.
  - Filtro "Personal": `?bopb_dia%5BtipusAnunci%5D=60`.
  - RSS (solo el último boletín): `https://bop.diba.cat/dades-obertes/butlleti-del-dia/feed`. Hay un feed por sección: `/dades-obertes/butlleti-del-dia/administracio-local/feed`, `/generalitat-de-catalunya/feed`, etc.
- **Ejemplo verificado:**
  - `curl … 'https://bop.diba.cat/dades-obertes/butlleti-del-dia/feed'` → 200 `text/xml`, 137 KB, `<title>BOPB del dia 23/10/2026</title>`, 163 `<item>`.
  - `/anteriors/2026-10-23` → 200 HTML, "S'han trobat 162 resultats".
  - `/anteriors/2026-09-15` → 200, 94 resultados.
  - `/anteriors/2025-03-12` → 200, 126 resultados.
  - `/anteriors/2026-09-15/2` → "mostrant del 21 al 40".
  - `?bopb_dia[tipusAnunci]=60` → "S'han trobat 20". Ej.: "Aprovació de la llista provisional de persones admeses i excloses … procés de selecció d'una plaça d'agent de la policia local … Ajuntament d'Arenys de Mar" y "Bases reguladores i convocatòria pública de selecció d'una plaça d'auxiliar administratiu/iva … Ajuntament de Balsareny".
  - RSS: "Modificació de les bases del procés de selecció, mitjançant concurs oposició lliure … tècnic/a de promoció econòmica, grup A2" (Tipus: Personal | Convocatòries. Borses de treball).
- **Cómo extraer los anuncios:**
  - RSS. En cada `<item>`:
    - `<title>` = organismo (p. ej. "Ajuntament d'Abrera").
    - `<link>` = `http://bop.diba.cat/anunci/{id}`.
    - `<category>` = sección.
    - `<description>` (CDATA) contiene `Registre: {nº} - Tipus d'anunci: {tipo} - Data publicació: dd/mm/aaaa` y, en el segundo `<p>`, el resumen o título.
    - PDF: `http://bop.diba.cat/anunci/descarrega-pdf/{id}`.
    - El primer item es el sumario, apunta a `/sumari-del-dia/AAAA-MM-DD`; hay que saltarlo.
  - HTML:
    - Cada anuncio va en `div.card` y su enlace es `h3.card-title a.stretched-link`, con `href="/anunci/{id}/{slug-del-titulo}"` y el organismo como texto del enlace. El slug lleva el título.
    - El total sale en "S'han trobat N resultats".
- **Cobertura:**
  - HTML: histórico por fecha (probado 2025 y 2026; el portal dice que hay BOPB histórico).
  - RSS: solo el último boletín.
- **Pegas:**
  - Paginación de 20 en 20 en HTML.
  - Resets de conexión intermitentes: reintentar.
  - El RSS usa `http://` en los enlaces.
  - `/convocatories` da 500: no existe en Barcelona.
- **Viabilidad:** FÁCIL. RSS diario, o HTML por fecha para recuperar días perdidos.

#### Butlletí Oficial de la Província de Girona (BOPG) — Girona
- **URL portal:** https://www.ddgi.cat/bop/
- **Acceso programático:** HTML por número de boletín. La portada muestra el último boletín completo.
- **Endpoint por fecha:**
  - `https://www.ddgi.cat/bop/mostra-bop/{AAAA-MM-DD}/{AAAA}/{NUM}`. **Ojo: el servidor ignora la fecha; manda el número.**
  - Buscador por fecha en `/bop/cerca`: JSF con `jakarta.faces.ViewState` y POST.
- **Ejemplo verificado:**
  - `https://www.ddgi.cat/bop/` → 200, 39 KB, "Bop número: 205/0 - 23/10/2026", 55 `li.edicte`.
  - `/bop/mostra-bop/2026-09-15/2026/180` → 200, "Bop número: 180/0 - 18/09/2026", 43 PDF.
  - `/bop/mostra-bop/2026-09-15/2026/1` → "1/0 - 02/01/2026".
  - Ej.: "9116 - AJUNTAMENT DE LLAGOSTERA - Extracte de la resolució … de convocatòria d'ajuts per material escolar…" y "8904 - AJUNTAMENT DE LLORET DE MAR - Aprovació definitiva del projecte de renovació del paviment…".
- **Cómo extraer los anuncios:**
  - Cada anuncio es un `li.edicte > a.linkAjuda`, con `href="https://ssl4.ddgi.cat/bopV1/pdf/{AAAA}/{NUM}/{AAAA}{NUM}{nºedicte}.pdf"`.
  - El texto del enlace es `{nºedicte} - <span>{ORGANISMO}</span> - {título}`.
  - Secciones en `h2.seccioTau`.
  - Número y fecha en "Bop número: N/0 - dd/mm/aaaa".
- **Cobertura:** histórico por número (desde el nº 1 de cada año). Para ir día a día: leer la portada, o incrementar el número y leer la fecha de la cabecera.
- **Pegas:**
  - El enlace de cada anuncio es PDF (no hay HTML por anuncio), aunque el título está en el listado.
  - Sin RSS. Existe `/bop/subscripcio` (no probado).
- **Viabilidad:** FÁCIL (GET simple; solo hay que llevar el contador de números).

#### Butlletí Oficial de la Província de Lleida (BOPL) — Lleida
- **URL portal:** https://bop.diputaciolleida.cat/ y https://ebop.diputaciolleida.cat/ (este dominio sale en la web de la Diputació, en un enlace a `https://ebop.diputaciolleida.cat/aplicacions/bop/bopV1/fitxers/pdf/2025/58/20255802322.pdf`).
- **Acceso programático:** **no verificado.**
- **Endpoint por fecha:** **no verificado.**
- **Ejemplo verificado:** **no verificado.**
  - `curl https://bop.diputaciolleida.cat/` y `https://ebop.diputaciolleida.cat/` → `curl: (35) Recv failure: Connection reset by peer`, 4 reintentos.
  - El proxy registra `ws_closed_mid_exchange` (el túnel se cierra a los 12 s).
  - Con http da `Could not resolve host`.
  - WebFetch → `getaddrinfo ENOTFOUND`.
  - www.diputaciolleida.cat sí responde (200).
  - Parece un bloqueo por IP/geo o un fallo de upstream desde este entorno.
- **Cómo extraer los anuncios:** pendiente. Ruta de PDF observada: `…/aplicacions/bop/bopV1/fitxers/pdf/{AAAA}/{NUM}/{AAAA}{NUM}{nºedicte}.pdf`, muy parecida a la de Girona.
- **Cobertura:** desconocida.
- **Pegas:** inaccesible desde aquí. Reintentar desde otra IP (España).
- **Viabilidad:** DIFÍCIL (por bloqueo; quizá FÁCIL si se accede desde otra red).

#### Butlletí Oficial de la Província de Tarragona (BOPT) — Tarragona
- **URL portal:** https://www.dipta.cat/bopt/web/
  - `bop.dipta.cat` da `CONNECT tunnel failed, response 502`.
  - `www.diputaciodetarragona.cat/ebop/` da `SSL certificate problem: unable to get local issuer certificate`: el servidor envía un intermedio Sectigo que no corresponde.
- **Acceso programático:** RSS (datos abiertos) y HTML por fecha. Es la misma plataforma que Barcelona.
- **Endpoint por fecha:**
  - HTML: `https://www.dipta.cat/bopt/web/anteriors/{AAAA-MM-DD}`, páginas en `/{N}`.
  - RSS: `https://www.dipta.cat/bopt/web/dades-obertes/butlleti-del-dia/feed`, más un feed por sección.
  - Sumario PDF: `https://www.dipta.cat/bopt/web/sumari-del-dia/{AAAA-MM-DD}`.
- **Ejemplo verificado:**
  - RSS → 200 `text/xml`, 31 KB, "BOPT del dia 23/10/2026", 42 items.
  - Ej.: item "DIPUTACIÓ TARRAGONA - PERSONES I TALENT" → `https://www.dipta.cat/bopt/web/anunci/365430`, "Tipus d'anunci: Personal: oferta pública, convocatòries, nomenaments | Nomenaments i contractació de personal … Nomenament de tècniques especialistes".
  - `/anteriors/2026-10-23` → 200, "han trobat 41".
  - `/anteriors/2026-09-15` → 200, "han trobat 38". Ej.: "MINISTERIO DE TRANSPORTES Y MOVILIDAD SOSTENIBLE - CAPITANIA MARÍTIMA - TARRAGONA" (resolución que prohíbe la navegación durante la Festa al Cel 2026 a Salou).
  - `/sumari-del-dia/2026-10-23` → 200 `application/pdf`.
- **Cómo extraer los anuncios:**
  - Igual que Barcelona: RSS (`title` = organismo; `link` = `/bopt/web/anunci/{id}`; la `description` lleva Registre, Tipus y Data, más el resumen) o HTML (`a.stretched-link`, con `href="/bopt/web/anunci/{id}/{slug}"` y el organismo como texto).
  - Extra: `https://www.dipta.cat/bopt/web/convocatories` → 200 PDF, una tabla de convocatorias de personal de los últimos meses ("Convocatòries des de: 27/07/2026"). Útil como lista ya filtrada.
- **Cobertura:** HTML con histórico por fecha. El RSS solo trae el último boletín.
- **Pegas:** los subdominios alternativos fallan; usar `www.dipta.cat/bopt/web`.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de la Provincia de Alicante (BOP Alicante) — Alicante
- **URL portal:** https://bop.dip-alicante.es/
- **Acceso programático:** **no verificado.**
- **Endpoint por fecha:** **no verificado.**
- **Ejemplo verificado:** **no verificado.**
  - `bop.dip-alicante.es` y `sede.dip-alicante.es` → `curl: (56) CONNECT tunnel failed, response 502` (el proxy registra `connect_rejected`: el host no está permitido o el upstream falla).
  - `https://www.dip-alicante.es/bop2/` → 403 "Forbidden: Access is denied".
  - `/bop2/index.asp` redirige al portal general.
  - `www.diputacionalicante.es` → 200, sin enlace al BOP.
- **Cómo extraer los anuncios:** pendiente.
- **Cobertura:** desconocida.
- **Pegas:** bloqueo proxy/upstream desde este entorno. Revisar desde otra red.
- **Viabilidad:** DIFÍCIL (inaccesible desde aquí).

#### Boletín Oficial de la Provincia de Castellón (BOP CS) — Castellón
- **URL portal:** https://bop.dipcas.es/PortalBOP/
- **Acceso programático:** HTML (JSF/PrimeFaces 12). La portada trae el último boletín con todos sus anuncios.
- **Endpoint por fecha:** no hay GET por fecha. El buscador `/PortalBOP/buscador/` es JSF (`javax.faces.ViewState`, POST).
  - PDF del boletín completo: `https://bop.dipcas.es/PortalBOP/api/descargarBoletin?idBoletin={id}&idioma=es`. Con `idBoletin=27000` devuelve 204 (vacío); el actual es 27020.
- **Ejemplo verificado:**
  - `https://bop.dipcas.es/` → 200, 86 KB, "BOP Nº 129", 24/10/2026, 34 anuncios.
  - Ej.: "Anuncio bolsa de trabajo temporal de agente Censal", "Anuncio bolsa de trabajo temporal de operario de movilidad", "ANUNCIO DEL BANDO DE LA ALCALDIA DE ELECCIÓN CARGOS JUEZ DE PAZ…".
- **Cómo extraer los anuncios:**
  - Organismo en `span.titulo3` (p. ej. "AJUNTAMENT DE FORCALL").
  - Título en `span.titulo4`.
  - PDF: `https://bop.dipcas.es/PortalBOP/api/descargarAnuncio?idAnuncio={id}&idioma=es`, en el `a` de `span.linkDownloadFileCurrentAnuncioIcon` que va justo antes del `titulo4`.
- **Cobertura:** solo el último boletín con GET. Se publica martes, jueves y sábados (24/10 fue sábado). El histórico requiere JSF.
- **Pegas:** JSF/ViewState y `jsessionid` en la URL. Para no perder días hay que leer la portada cada día de publicación.
- **Viabilidad:** MEDIA (FÁCIL si se lee la portada a diario; DIFÍCIL para el histórico).

#### Butlletí Oficial de la Província de València (BOP València) — Valencia
- **URL portal:** https://bop.dival.es/bop/
- **Acceso programático:** HTML JSF (PrimeFaces). La portada `portal.xhtml` trae el último boletín paginado.
- **Endpoint por fecha:** no hay GET. Los filtros de fecha (`filtroCalendarioIni_input`, `filtroCalendarioFin_input`, `calen_input`) van por POST/AJAX con 11 ViewState. También existe `/bop/xhtml/csv.xhtml` (otra pantalla JSF).
- **Ejemplo verificado:**
  - `https://bop.dival.es/` → 200, 222 KB, "divendres 23 d'octubre de 2026 · Butlletí Núm. 204 · Mostrant del 1 al 25 de 58".
  - Ej.: "Diputació Provincial de València / Gestió de Recursos Humans i Organització: Anunci … sobre l'aprovació de les bases de la convocatòria del concurs de mèrits per a la provisió del lloc de treball de cap de secció d'Assumptes Taurins. Convocatòria P/44/26" (Núm. registre 2026/13145).
- **Cómo extraer los anuncios:** en el texto de la portada, cada anuncio sigue este orden: sección (p. ej. "Diputació"), organismo "X / Servei", título "Anunci de…", "Núm. registre: AAAA/NNNNN" y "Data publicació: dd/mm/aaaa". El primer GET solo da 25 de los N anuncios; el resto se pagina por AJAX de PrimeFaces.
- **Cobertura:** sin JSF, solo las 25 primeras entradas del último boletín. El histórico está en el buscador JSF (**no verificado**).
- **Pegas:** JSF/ViewState, paginación AJAX, `jsessionid`. No se encontró RSS ni datos abiertos.
- **Viabilidad:** DIFÍCIL.

#### Boletín Oficial de la Provincia de Badajoz (BOP BA) — Badajoz
- **URL portal:** https://dip-badajoz.es/bop/index.php (el host `www.` da resets frecuentes)
- **Acceso programático:** HTML por fecha (GET), y un Atom con lo publicado hoy.
- **Endpoint por fecha:**
  - `https://dip-badajoz.es/bop/index.php?FechaSolicitada={AAAAMMDD}`
  - Atom: `https://dip-badajoz.es/canales/atom_xml_bop.php?c=1&u=1`
- **Ejemplo verificado:**
  - `?FechaSolicitada=20261023` → 200, 64 KB, 13 anuncios.
  - `?FechaSolicitada=20250915` → 200, 18 anuncios. Ej.: "Bases de la convocatoria para la provisión, mediante libre designación, del puesto de Jefatura de Servicio de Infraestructuras y Movilidad…" y "Aprobación definitiva de la modificación de la plantilla presupuestaria 2025 de la Diputación de Badajoz…".
  - El Atom un domingo (25/10) → 200 `application/atom+xml`, sin `<entry>`: es solo "hoy".
- **Cómo extraer los anuncios:**
  - Jerarquía de organismo en `p.nivel1`, `p.nivel2`, `p.nivel3` y `p.nivel4` (p. ej. "Administración Local > Ayuntamientos > Ayuntamiento de Aceuchal").
  - Cada anuncio es un `article > dl > dt` con `[ nº ]` y un `dd span a[href^="ventana_anuncio.php?id_anuncio="]`. El texto del enlace es el título; el atributo `title` es "Anuncio N / AAAA".
  - PDF: `https://www.dip-badajoz.es/ficheros/bop/bopedictos/{AAAA-MM-DD}000000_{nº}.pdf`.
- **Cobertura:** histórico por fecha (probado 2025). La portada enlaza los días del mes.
- **Pegas:** resets de conexión (hacen falta 2-4 reintentos). El Atom solo sirve para el día en curso.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de la Provincia de Cáceres (BOP CC) — Cáceres
- **URL portal:** https://bop.dip-caceres.es/bop/
- **Acceso programático:** **API JSON** (REST interna del frontend, en `js/consultas.js`).
- **Endpoint por fecha:** `https://bop.dip-caceres.es/bop/services/anuncios/fechaPublicacion?fechaPublic={MM/DD/AAAA}` (formato americano). Otros endpoints vistos en el JS:
  - `/bop/services/boletines/ultimoBop`
  - `/bop/services/boletines/bopMesCalendario?mes=&anio=`
  - `/bop/services/anuncios/anunciosTipoGrupoEntidad?tipo=&grupo=&entidad=&desde=&hasta=&start=&limit=`
  - Estos tres no se probaron.
- **Ejemplo verificado:**
  - `?fechaPublic=10/23/2026` → 200 `application/json`, 160 KB, 22 anuncios (BOP nº 204).
  - `?fechaPublic=09/15/2025` → 200, 14 anuncios (nº 175).
  - Ej.: "BOP-2025-4548 Aprobación Pliego Condiciones Concurso Para el Arrendamiento de Pastos…" (Ayuntamiento de Abertura).
  - PDF: `https://bop.dip-caceres.es/bop/services/anuncios/contenidoPdfIdAnuncio?csv=BOP-2026-5002` → 200 `application/pdf`.
- **Cómo extraer los anuncios:**
  - `data[]` con `tituloAnuncio` (empieza por el CSV, p. ej. "BOP-2026-5002 …"), `nombreEntidad` (organismo), `nombreGrupoEntidad`, `nombreTipoEntidad` (sección), `idAnuncio`, `csv`, `numBop`, `idboletin`, `fechaPublicacion` (epoch en ms), `urlPdf` (relativa: `services/anuncios/contenidoPdfIdAnuncio?csv=…`, se le antepone `https://bop.dip-caceres.es/bop/`) y `contenidoHtml` (texto completo).
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:** formato de fecha MM/DD/AAAA. La respuesta es grande porque incluye el HTML completo.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial da Provincia da Coruña (BOP A Coruña) — A Coruña
- **URL portal:** https://bop.dacoruna.gal/bopportal/
- **Acceso programático:** HTML por fecha (GET).
- **Endpoint por fecha:**
  - `https://bop.dacoruna.gal/bopportal/cambioBoletin?fechaInput={DD}%2f{MM}%2f{AAAA}`
  - Último boletín: `/bopportal/ultimoBoletin`
- **Ejemplo verificado:**
  - `ultimoBoletin` → 200, 50 KB (23/10/2026). Ej.: "2026/6851 Resolución 2026/44657 … listaxe provisional de persoas admitidas e excluídas ao proceso de selección de dúas (2) prazas de titor/a (B) … Deputación Provincial".
  - `cambioBoletin?fechaInput=15%2f09%2f2026` → 200, "Martes, 15 de setembro de 2026".
  - `cambioBoletin?fechaInput=12%2f03%2f2025` → 200, 33 PDF. Ej.: "Acordo do 7 de marzo de 2025 do Departamento Territorial da Coruña, de levantamento das actas previas…".
  - PDF `https://bop.dacoruna.gal/bopportal/publicado/2026/10/23/2026_0000006851.pdf` → 206 `application/pdf`.
- **Cómo extraer los anuncios:**
  - Jerarquía de organismo en `h4.tituloEdicto` y encabezados previos (Administración Local > Provincial > Deputación… > Servizo…).
  - Cada anuncio es un `p.resumenSumario` con dos `a href="AAAA_00000NNNNN.pdf"`: el primero tiene como texto el nº de anuncio "AAAA/NNNN"; el segundo, el título. También hay versión `.html`.
  - Los enlaces son relativos a la ruta del `input#rutaRelativa`, cuyo `value` es `/publicado/AAAA/MM/DD`. URL final: `https://bop.dacoruna.gal/bopportal/publicado/AAAA/MM/DD/{fichero}`.
  - Los enlaces al día anterior y siguiente aparecen como `cambioBoletin?fechaInput=…`.
- **Cobertura:** histórico por fecha (probado 2025). También hay `/bopportal/boletinesAntiguos`.
- **Pegas:** las rutas de PDF/HTML son relativas al directorio `publicado/…` (no al de la página).
- **Viabilidad:** FÁCIL.

#### Boletín Oficial da Provincia de Lugo (BOP Lugo) — Lugo
- **URL portal:** https://www.deputacionlugo.gal/boletin-oficial-da-provincia-de-lugo (Drupal)
- **Acceso programático:** RSS (solo el último boletín, con el sumario en HTML) y listado Drupal con filtro de fecha. Después se lee el nodo de ese día.
- **Endpoint por fecha:**
  - Paso 1: `https://www.deputacionlugo.gal/boletin-oficial-da-provincia-de-lugo/bop?fecha_publicacion%5Bmin%5D={AAAA-MM-DD}&fecha_publicacion%5Bmax%5D={AAAA-MM-DD}` devuelve el enlace `/gl/node/{id}`.
  - Paso 2: `https://www.deputacionlugo.gal/gl/node/{id}`.
  - RSS: `https://www.deputacionlugo.gal/boletin-oficial-da-provincia-de-lugo/bop/feed.xml`
  - PDF del boletín: `https://www.deputacionlugo.gal/sites/deputacionlugo.org/files/inline-files/{DD-MM-AAAA}.pdf` (206 para 23-10-2026 y 15-09-2026).
- **Ejemplo verificado:**
  - feed.xml → 200 `application/rss+xml`, 1 item, "BOP DE 24/10/2026" (node/85182). La `description` trae el sumario: "XUNTA DE GALICIA … RESOLUCIÓN E TEXTO DO CONVENIO COLECTIVO DE OFICINAS E DESPACHOS (PÁX. 1, R. 2859)", "CASTRO DE REI – MELLORA DA ESTACIÓN DE TRATAMENTO DE AUGA POTABLE (PÁX. 32, R. 2860)".
  - Listado con filtro 2026-09-15 → 200, un solo nodo `/gl/node/84960`.
  - Ese nodo → 200, "Martes, 15 de Setembro de 2026". Ej.: "LUGO – RELACIÓN DE APROBADOS DO PROCESO SELECTIVO PARA O ACCESO EN PROPIEDADE A 4 PRAZAS DE AUXILIAR ADMIISTRATIVO/A… (PÁX. 7, R. 2431)" y "MONTERROSO – CONVOCATORIA PARA A CREACIÓN DUNHA BOLSA DE TRABALLO DE AUXILIARES DE AXUDA NO FOGAR… (PÁX. 12, R. 2432)".
- **Cómo extraer los anuncios:**
  - En el nodo (o en la `description` del RSS, que viene con entidades HTML escapadas), el sumario es una secuencia de bloques de texto:
    - Organismo en mayúsculas (p. ej. "CONCELLOS", luego el nombre del concello).
    - Títulos con el formato `TÍTULO (PÁX. n, R. nnnn)`.
  - Los enlaces apuntan a `inline-files/DD-MM-AAAA.pdf#page=n`.
  - No hay URL individual por anuncio: el enlace es el PDF del día con el ancla de página.
- **Cobertura:** histórico por fecha mediante el listado (más de 700 páginas en `bop-por-contenido`).
- **Pegas:** son dos pasos; sin id por anuncio; la estructura de organismo es plana (texto). También hay `files/Documentos/bop_{NUM}_{DDMMAAAA}.pdf`.
- **Viabilidad:** MEDIA.

#### Boletín Oficial da Provincia de Ourense (BOP Ourense) — Ourense
- **URL portal:** https://bop.depourense.es/portal/ (SPA Angular)
- **Acceso programático:** **API JSON** (`/portalapi/api`, sacada de `main.js`).
- **Endpoint por fecha:**
  - `https://bop.depourense.es/portalapi/api/boletin/getFecha/{AAAAMMDD}`
  - Última fecha: `https://bop.depourense.es/portalapi/api/boletin/ultimaFecha` → `20261023`
- **Ejemplo verificado:**
  - `getFecha/20261023` → 200 `application/json`, 41 KB, BOP nº 204, 19 edictos. Ej.: "Aprobación de la lista de admitidos y excluidos en el proceso selectivo de (2) plazas de oficiales de obras y servicios…".
  - `getFecha/20250915` → 200, nº 176, 12 edictos. Ej.: "Exposición pública de la aprobación inicial del Presupuesto general para el ejercicio económico de 2025".
  - PDF: `https://bop.depourense.es/portalapi/api/edicto/descargar/pdf/352981/idioma/es` → 206. El cuerpo es PDF (`%PDF-1.5`), aunque el content-type dice JSON. `idioma` admite `es` o `gl`; `cas` da 500.
- **Cómo extraer los anuncios:**
  - La respuesta es `[ { boletin: { id, numeroBop, fechaPublicacion, edictos: [ { id, sumarioCas, sumarioGal, sumario, sumarioRemGal, seccion: { id, nombre, nombreGal }, tematica } ] } } ]`.
  - Título = `sumarioCas`, o `sumarioGal`.
  - **No hay campo organismo**: solo la sección (p. ej. "IV. ENTIDADES LOCALES"). El organismo habría que sacarlo del PDF o de la ficha.
  - Ficha web: ruta SPA `anuncio/:id` (URL exacta **no verificada**).
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:** falta el organismo en el JSON.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial da Provincia de Pontevedra (BOPPO) — Pontevedra
- **URL portal:** https://boppo.depo.gal/ (Liferay)
- **Acceso programático:** HTML por fecha (GET, URL limpia).
- **Endpoint por fecha:** `https://boppo.depo.gal/detalle/-/boppo/{AAAA}/{MM}/{DD}`
- **Ejemplo verificado:**
  - `/2026/10/22` → 200, 43 KB, "BOPPO número 204 · xoves, 22 de outubro de 2026", 27 anuncios. Ej.: "Xunta Electoral de Zona de Vigo — RECTIFICACIÓN DO EDICTO PUBLICADO NO BOPPO DE DATA 20/10/2026 REFERENTE AOS LUGARES E LOCAIS PARA ACTOS DE CAMPAÑA…".
  - `/2026/09/15` → 200, 10 anuncios.
  - `/2025/09/15` → 200, 14 anuncios.
  - **`/2026/10/23` → 200, pero con la página "Aconteceu un erro interno"** (repetido 2 veces): error del servidor en ese día concreto.
- **Cómo extraer los anuncios:**
  - Dentro de `#contSumario`: secciones en `h4.tit` y subsecciones en `p.Org`.
  - Cada anuncio es un `ul.listadoSumario > li`, con el organismo en `span.pub` y el título en `p.sumario a` (`href="/web/boppo/detalle/-/boppo/AAAA/MM/DD/{id}"`).
  - PDF: `a.botDescPDF`, con `href="/web/boppo/detalle/-/boppo/AAAA/MM/DD/{id}/an.bop.PONTEVEDRA.{AAAAMMDD}.{id}.pdf"`.
  - Sumario PDF en la cabecera (`sum.bop.PONTEVEDRA.{AAAAMMDD}.{NUM}.pdf`).
- **Cobertura:** histórico por fecha (probado 2025).
- **Pegas:** algún día devuelve el error interno: tratarlo como reintento o alerta.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial del Territorio Histórico de Álava (BOTHA) — Álava
- **URL portal:** https://www.araba.eus/botha/Inicio/SGBO5001.aspx (ASP.NET)
- **Acceso programático:** HTML por fecha (GET).
- **Endpoint por fecha:** `https://www.araba.eus/botha/Inicio/SGBO5001.aspx?FechaBotha={DD/MM/AAAA}`
- **Ejemplo verificado:**
  - `?FechaBotha=23/10/2026` → 200, 235 KB, 22 anuncios (boletín 2026/122).
  - `?FechaBotha=15/09/2025` → 200, 24 anuncios (2025/104). Ej.: "Orden Foral 86/2025 del diputado foral de Igualdad, Euskera y Gobernanza … convocatoria de los premios Henrike Knörr 2025" y "Anuncio de emplazamiento en el procedimiento abreviado 103/2025".
  - Ficha HTML: `https://www.araba.eus/botha/Busquedas/Resultado.aspx?File=Boletines/2026/122/2026_122_02867_C.xml&hl=` → 200.
- **Cómo extraer los anuncios:**
  - Jerarquía de organismo en `div.titulo_bloque_resultados` (p. ej. "Administraciónes Vascas" > "Gobierno Vasco (Departamento de Economía, Trabajo y Empleo)").
  - Título en `span[id$="_lblAnuResumen"] a[id$="_Hyperlink1"]`, con `href="../Busquedas/Resultado.aspx?File=Boletines/{AAAA}/{NUM}/{AAAA}_{NUM}_{nº}_C.xml"`. `_C` es castellano y `_E` euskera: cada anuncio aparece dos veces, **filtrar por `_C`**.
  - PDF: `../Boletines/{AAAA}/{NUM}/{AAAA}_{NUM}_{nº}_C.pdf` (algunos en `Boletines/pdfni/…`).
  - Nº de anuncio en `span.boton_anuncio_inicio`.
- **Cobertura:** histórico por fecha (probado 2025). Se publica lunes, miércoles y viernes. El calendario de la portada enlaza `?FechaBotha=` de los días con boletín.
- **Pegas:** la página arrastra mucho ViewState, pero el GET funciona sin postback.
- **Viabilidad:** FÁCIL.

#### Boletín Oficial de Bizkaia (BOB) — Bizkaia
- **URL portal:** https://www.bizkaia.eus/es/bob
- **Acceso programático:** **no verificado** (bloqueado por antibot).
- **Endpoint por fecha:** **no verificado.**
  - Por búsqueda web se conocen PDF con el patrón `https://www.bizkaia.eus/lehendakaritza/Bao_bob/{AAAA}/{MM}/{DD}/{sección}-{n}_{cas|eus}.pdf` (ej. `…/Bao_bob/2021/01/12/III-1_eus.pdf`).
  - La documentación dice que hay búsqueda BOB por fecha, con CVE tipo `BAO-BOB-AAAANNN`.
- **Ejemplo verificado:** **no verificado.**
  - Cualquier URL de www.bizkaia.eus (`/es/bob`, `/es/-/bob-descripcion-general`, `/lehendakaritza/Bao_bob/...pdf`) → 200 `text/html`, unos 45 KB: es una página de desafío JavaScript **F5 TSPD** (`window["bobcmn"]`, `/TSPD/…?type=5`), no el contenido.
  - El reintento con cookies devuelve lo mismo. No se intentó saltar la protección.
- **Cómo extraer los anuncios:** pendiente. Hace falta un navegador real (JS) o pedir acceso al servicio.
- **Cobertura:** según la ayuda oficial, la base de datos cubre de 1994 a hoy.
- **Pegas:** antibot con JS obligatorio en todo el dominio.
- **Viabilidad:** DIFÍCIL.

#### Boletín Oficial de Gipuzkoa (BOG) — Gipuzkoa
- **URL portal:** https://egoitza.gipuzkoa.eus/es/bog
- **Acceso programático:** HTML estático por fecha (sumario `.htm`).
- **Endpoint por fecha:** `https://egoitza.gipuzkoa.eus/gao-bog/castell/bog/{AAAA}/{MM}/{DD}/bc{AAMMDD}.htm`
- **Ejemplo verificado:**
  - `…/2026/10/23/bc261023.htm` → 200 `text/html; charset=iso-8859-15`, 65 KB, "23-10-2026, Número 203", unos 40 anuncios (82 enlaces HTM/PDF). Ej.: "Convocatoria y bases del proceso selectivo para la cobertura de tres puestos de Operario/a de Cementerio y Crematorio" y "Orden Foral 2114/2026, de 9 de octubre, por la que se nombra, mediante el sistema de libre designación, a la Secretaria de Dirección de Régimen Jurídico y Función Pública…".
  - `…/2025/09/15/bc250915.htm` → 200, 20 anuncios.
  - Ficha `…/gao-bog/castell/bog/2026/10/23/c2606546.htm` → 200.
- **Cómo extraer los anuncios:**
  - Organismo en `li.organismo > a[name]` (texto, p. ej. "SERVICIOS FUNERARIOS DE DONOSTIA - SAN SEBASTIÁN S.A.").
  - Cada anuncio es un `ul.anuncios > li`, con el título en `div.titulo_anuncio` y los enlaces en `a.descarga_html` / `a.descarga_pdf`, con `href="../../../../../castell/bog/AAAA/MM/DD/c{AA}{nnnnn}.htm|.pdf"`.
  - **Esos enlaces se resuelven como `https://egoitza.gipuzkoa.eus/gao-bog/castell/bog/AAAA/MM/DD/c…htm`**; la resolución relativa ingenua contra `/` da 404.
  - Sumario PDF: `ib{AAMMDD}.pdf`.
- **Cobertura:** histórico por fecha (probado 2025). La portada enlaza el último (también publica en domingo: existía `bc261025.htm`).
- **Pegas:** codificación ISO-8859-15; títulos con entidades HTML; hay que corregir la ruta relativa.
- **Viabilidad:** FÁCIL.

---

#### Comunidades uniprovinciales (no verificadas aquí)
Cubiertas por el diario autonómico, que hace de BOP; sus fichas están en las Partes 1 y 2:
- Madrid → BOCM
- Murcia → BORM
- Navarra → BON
- La Rioja → BOR
- Asturias → BOPA
- Cantabria → BOC
- Illes Balears → BOIB

---

### Tabla resumen

| Fuente | Territorio | Tipo acceso | Viabilidad | Verificado (sí/parcial/no) |
|---|---|---|---|---|
| BOPB | Barcelona | RSS del día + HTML por fecha `/anteriors/AAAA-MM-DD` | FÁCIL | sí |
| BOPG | Girona | HTML por nº de boletín (`/bop/mostra-bop/…/AAAA/NUM`) | FÁCIL | sí |
| BOP Lleida | Lleida | desconocido (connection reset) | DIFÍCIL (bloqueo) | no |
| BOPT | Tarragona | RSS + HTML por fecha (misma plataforma que BOPB) | FÁCIL | sí |
| BOP Alicante | Alicante | desconocido (CONNECT 502 / 403) | DIFÍCIL (bloqueo) | no |
| BOP CS | Castellón | HTML portada (último BOP) + JSF | MEDIA | parcial |
| BOP València | Valencia | HTML JSF/PrimeFaces, solo último BOP (25 filas) | DIFÍCIL | parcial |
| BOP BA | Badajoz | HTML GET `?FechaSolicitada=AAAAMMDD` + Atom de hoy | FÁCIL | sí |
| BOP CC | Cáceres | API JSON `fechaPublicacion?fechaPublic=MM/DD/AAAA` | FÁCIL | sí |
| BOP A Coruña | A Coruña | HTML GET `cambioBoletin?fechaInput=DD/MM/AAAA` | FÁCIL | sí |
| BOP Lugo | Lugo | RSS (último) + listado Drupal por fecha → nodo | MEDIA | sí |
| BOP Ourense | Ourense | API JSON `getFecha/AAAAMMDD` (sin organismo) | FÁCIL | sí |
| BOPPO | Pontevedra | HTML GET `/detalle/-/boppo/AAAA/MM/DD` | FÁCIL | sí (23/10 dio error interno) |
| BOTHA | Álava | HTML GET `SGBO5001.aspx?FechaBotha=DD/MM/AAAA` | FÁCIL | sí |
| BOB | Bizkaia | bloqueado por antibot F5 TSPD (JS) | DIFÍCIL | no |
| BOG | Gipuzkoa | HTML estático `gao-bog/castell/bog/AAAA/MM/DD/bcAAMMDD.htm` | FÁCIL | sí |

---

## Parte 5 — Agregadores, ayuntamientos y consorcios


**Qué aportan estas fuentes frente al BOE/BOP.** La convocatoria con efectos jurídicos siempre sale en un diario oficial: las bases íntegras en el BOP o en el diario autonómico, y el extracto que abre el plazo en el BOE (sección 2B). Las sedes municipales y de los consorcios añaden sobre todo los **actos de trámite**, que muchas veces solo se publican allí: listas de admitidos, fechas, horas y lugar de los ejercicios, plantillas de respuestas, notas, llamamientos, bolsas temporales e interinidades. Para un bot de avisos son útiles como **segunda capa** (seguimiento de procesos ya detectados en el BOE/BOP) y para procesos que no pasan por el BOE (bolsas, interinos, comisiones de servicio). Hay dos excepciones con valor propio de **descubrimiento**: los agregadores PAG y CIDO.

---

### A. Agregadores públicos

#### Punto de Acceso General — Buscador de empleo público (PAG) — Estatal (cubre AGE, CCAA, capitales de provincia y entidades locales que publican en el BOE)
- **URL portal:** https://administracion.gob.es/empleopublico/resultados-empleo (la antigua `pag_Home/empleoBecas/...` redirige aquí).
- **Acceso programático:** fragmento HTML (AEM/Sling) que devuelve la lista de resultados con filtros por GET. No hay RSS. Existe una exportación a CSV/XML (`/content/sling/endpoints/pag/front-elastic/empleo-elastic/exportar`), pero da **403 Forbidden** por POST incluso con cookie y cabecera CSRF (el token sale vacío `{}`), y **404** por GET: **no verificado** como vía automática. Hay un "Boletín semanal de empleo público" por suscripción (`/empleopublico/boletin`) que no he probado.
- **Endpoint por fecha:**
  `https://administracion.gob.es/content/pag-home/es/empleopublico/resultados-empleo/jcr:content/root/container/containerSpace/pag_front_formulario.list.html/<CUALQUIER_COSA>.html?pag_fecha=intervalo&fechaDesde=DD/MM/AAAA&fechaHasta=DD/MM/AAAA&pag_descripcion=bombero&numRegistrosMostrar=100&p=N`
- **Ejemplo verificado:**
  - `...list.html/d29635.html?pag_fecha=intervalo&fechaDesde=23/10/2026&fechaHasta=23/10/2026&numRegistrosMostrar=100` → 200 text/html, 15 KB, "Total de resultados: 6" (p. ej. "TÉCNICO DE GRADO MEDIO", "CONDUCTOR-ORDENANZA").
  - `...?pag_descripcion=bombero&pag_fecha=intervalo&fechaDesde=01/09/2026&fechaHasta=30/09/2026` → 4 resultados. Ejemplos: "BOMBEROS - Se convoca el proceso de selección, mediante concurso oposición, para proveer 300 plazas de la categoría de bombero/a de primera … Cuerpo de Bomberos de la Generalitat" (Ref. 222402, fin de plazo 29/09/2026); "BOMBERO/A CONDUCTOR/A - C1." (Zaragoza); "ENFERMERO/A - A2. Especialidad Bomberos".
  - Fecha antigua: `fechaDesde=15/09/2025&fechaHasta=15/09/2025` → 23 resultados, así que **hay histórico**.
  - `pag_descripcion=bombero` sin fecha → 467 resultados (todo el histórico que contiene esa palabra); `numRegistrosMostrar=100` → 100 items.
- **Cómo extraer:** cada resultado es un `div.col-12.dnt-item > .pag-card-convo`. Campos:
  - título: `a.cmp-title__link` (`aria-label` o `span.cmp-button__text`), con el formato "CUERPO - descripción";
  - enlace: `href="/empleopublico/resultados-empleo/detalle-empleo?selectorget=<ID>&selectorServicio=bolsa_empleo"`;
  - pares `span.dnt-txt-body-l` + `span`: "Ref.:", "Fin de plazo:", "Titulación:", "Ubicación:" (p. ej. "LOCAL - ARAGÓN ZARAGOZA" o "AUTONÓMICO - CATALUÑA"), "Órgano convocante:" y "Plazas:".
  - El total está en `Total de resultados: N` y en `data-load-total`. Se pagina con `&p=N`.
  - La ficha de detalle trae enlaces al diario oficial (DOGC, BOE…) y el plazo.
- **Cobertura:** histórico por fecha de publicación (al menos desde 2025; existen registros de 2015). Solo incluye convocatorias locales si salen en el BOE, como ocurre normalmente con las bases de funcionarios de carrera.
- **Pegas:**
  - **CloudFront cachea 10 min (`cache-control: max-age=600`, `x-cache: Hit from cloudfront`) SIN tener en cuenta la query string.** Dos URLs con distintos parámetros devuelven la misma respuesta cacheada. Lo he verificado: `pag_descripcion=policia` devolvía los resultados de "bombero".
  - **Solución verificada:** añadir un sufijo Sling aleatorio a la ruta (`.list.html/<random>.html?...`). Cambia la clave de caché y Sling lo ignora.
  - `.list.p2.html` devuelve vacío.
  - No hay JSON.
- **Viabilidad:** MEDIA (una sola petición GET por día con HTML simple, pero hay que conocer el truco de la caché).
- **Relevancia bomberos:** alta como **descubrimiento** nacional, porque normaliza el cuerpo ("BOMBEROS", "BOMBERO/A CONDUCTOR/A", "OPERADORES - Operador/a de Comunicaciones del Servicio de Bomberos", "OPERARIO - Operario de Montes-Bombero Forestal"). No aporta nada que no esté en el BOE/diario, pero lo da clasificado y con fin de plazo.

#### Convocatòries de Personal (CIDO, Diputació de Barcelona) en Transparència Catalunya — dataset `a2hm-uzyj` (Socrata) — Cataluña (todas las administraciones)
- **URL portal:** https://analisi.transparenciacatalunya.cat/d/a2hm-uzyj. Lo publica el Consorci AOC con datos del "Cercador d'Informació i Documentació Oficials (CIDO)" de la Diputació de Barcelona. Existe además el dataset hermano `skem-kyue`, "Convocatòries de personal: resultats", con los campos `resum`, `enlla`, `estat`, `nom_ens` y `data_pub`.
- **Acceso programático:** API JSON SODA (Socrata), sin clave, con consultas SoQL.
- **Endpoint por fecha:** `https://analisi.transparenciacatalunya.cat/resource/a2hm-uzyj.json?data_darrer_anunci=AAAA-MM-DDT00:00:00.000&$limit=1000`. También admite `$where=data_pub='AAAA-MM-DD'`.
- **Ejemplo verificado:**
  - `curl '...a2hm-uzyj.json?data_darrer_anunci=2026-10-23T00:00:00.000&$limit=1000'` → 200 application/json, 23 KB, 56 registros (p. ej. "Ajuntament de Calella | Borsa de treball de places d'Oficial 2a electricista").
  - Fecha antigua: `$where=data_darrer_anunci='2025-09-15'` → 111 registros.
  - Totales: `$select=count(*),min(data_pub),max(data_darrer_anunci)` → 223.965 registros, desde 2015-01-02 hasta 2026-10-30.
  - Bomberos: `$where=upper(resum) like '%BOMBER%'&$order=data_darrer_anunci DESC` →
    - "2026-10-22 Ajuntament de Barcelona | 60 places de Bomber del Servei de Protecció Civil, Prevenció, Extinció d'Incendis i Salvament…";
    - "2026-10-15 Generalitat de Catalunya - Departament d'Interior | 250 places de Bomber, escala bàsica";
    - "2026-10-14 … | 8 places de Tècnic especialista operador de control de Bombers";
    - "2026-09-16 … | 300 places de Cos de Bombers, bomber de primera de l'escala tècnica".
- **Cómo extraer:** array JSON. Campos:
  - `resum` (título),
  - `nom_ens` (organismo),
  - `codi_ens`,
  - `data_pub` (fecha del primer anuncio),
  - `data_darrer_anunci` (fecha del último anuncio, **la clave para el bot diario**),
  - `termini_presentaci_` (fin de plazo),
  - `enlla.url` (ficha CIDO `https://cido.diba.cat/oposicions/<id>`),
  - `latitud`/`longitud`.
  - La ficha CIDO no se pudo abrir desde aquí (connection reset), pero no hace falta.
- **Cobertura:** histórico completo desde 2015. Se actualiza a diario (la última actualización del dataset es de hoy).
- **Pegas:** ninguna. Si se quieren más de 1000 resultados, se pagina con `$offset`. `data_darrer_anunci` cambia cuando se añade un anuncio nuevo al expediente (listas, notas…). Eso sirve para detectar movimientos, pero no dice cuál es el anuncio.
- **Viabilidad:** FÁCIL.
- **Relevancia bomberos:** muy alta para Cataluña. Cubre Bombers de la Generalitat, Bombers de Barcelona, el Consorci de Bombers… y **sigue actos posteriores** a la convocatoria. Es la mejor fuente de esta parte.

#### Agregadores privados (solo como referencia, NO como fuente)
Redopositor, oposiciones.es, Adams, Academia Jesús Ayala, CSIF (sindical) y similares indexan BOE, BOP y sedes. Se ven sus errores de fechas (p. ej. Redopositor fecha todo "11 ago 2026"). No se usan como fuente.

---

### B. Ayuntamientos con cuerpo de bomberos propio

#### Ayuntamiento de Madrid (madrid.es / sede.madrid.es) — Madrid capital
- **URL portal:** https://www.madrid.es/portales/munimadrid/oposiciones.html. Los documentos van en `https://www.madrid.es/UnidadWeb/Contenidos/Oposiciones/<año>/<Proceso>/...pdf`, p. ej. `.../2025/BomberoEspecialista2025/BombEspec2025_DecretoBases.pdf`.
- **Acceso programático:** **no verificado**.
- **Endpoint por fecha:** no hay (conocido).
- **Ejemplo verificado:** **no verificado**. `https://www.madrid.es/`, `https://madrid.es/`, `https://sede.madrid.es/` y el PDF de bases dan **HTTP 403 "Access Denied" de Akamai** (`errors.edgesuite.net`, Reference #18.e8d11102…). `http://www.madrid.es/` da 000 (reset). Parece un bloqueo por IP o geográfico del proxy, no por User-Agent.
- **Cómo extraer:** —. Las bases salen en el BOAM y el BOCM y el extracto en el BOE. El BOAM tiene su propio boletín (ver grupo de boletines locales).
- **Cobertura:** —.
- **Pegas:** bloqueo Akamai desde esta IP. `datos.madrid.es` responde 200, pero no se encontró ningún dataset de oposiciones.
- **Viabilidad:** DIFÍCIL (bloqueo). Habría que reprobar desde una IP española.
- **Relevancia bomberos:** alta (152 plazas de Bombero/a Especialista 2025, BOAM 9982 de 10/10/2025, según CSIF). Las listas y los ejercicios solo están en madrid.es.

#### Ajuntament de Barcelona — Seu electrònica, Processos selectius (incluye SPEIS/Bombers de Barcelona) — Barcelona
- **URL portal:** https://seuelectronica.ajuntament.barcelona.cat/processosselectius/ca/convocatories (aplicación Nuxt; la lista se carga por JS).
- **Acceso programático:** API JSON (Wagtail CMS detrás de un API Gateway de IBM). Pide la cabecera `X-IBM-Client-Id`, que es **pública** y está incrustada en el HTML (`window.__NUXT__.config.public.XIbmClientID`). Hay que extraerla de la página en cada ejecución o cachearla.
- **Endpoint (lista completa, ordenable):** `https://api.bcn.cat/imi/inet/services/seuelectronica-processos/api/pages/?type=public_offer.CallPage&locale=ca&limit=100&order=-last_update&fields=entity,submission_end,last_update,status,publication_date,call_type&page=N`. No hay filtro por fecha: se filtra en local por `publication_date`.
- **Ejemplo verificado:** `curl -H "X-IBM-Client-Id: <id de la página>" '...pages/?type=public_offer.CallPage&locale=ca&limit=100&order=-last_update&fields=...'` → 200 application/json, 98 KB, `count: 266` (534 sumando ca y es). Ejemplos: "Bomber/a del SPCPEIS 2025", "211/2026 mobilitat categoria de bomber/a, caporal/a i sergent/a SPCPEIS", "162/2026 dos llocs de treball de Bomber/a submarinista del Parc de la Zona Franca…".
- **Cómo extraer:**
  - `items[]` con los campos `id`, `title`, `meta.slug`, `entity.name` (Ajuntament de Barcelona, Consorci d'Educació, IMI…), `call_type.name` (Oferta pública / Borses de treball / Altres convocatòries), `publication_date` (AAAA-MM-DD), `submission_end` (DD/MM/AAAA) y `status` (`termini_obert`/`termini_tancat`…).
  - Enlace público: `https://seuelectronica.ajuntament.barcelona.cat/processosselectius/ca/convocatories/<slug>` (patrón visto en la página, p. ej. `/convocatories/ajudant-serveis-auxiliars-2026`).
  - Detalle por API (visto en el JS, **no verificado**): `/pages/parent/convocatories/slug/<slug>/`.
- **Cobertura:** las ~266 convocatorias publicadas en la sede (vigentes e históricas recientes). Se pagina con `page`.
- **Pegas:**
  - Hace falta la cabecera con el client-id.
  - `search=` falla con 400 ("cannot filter by 'show_internet' while searching").
  - `type` mal escrito → 500.
  - `last_update` tiene valores incoherentes (fechas de 2024 en procesos de 2026): no es fiable, mejor usar `publication_date`.
- **Viabilidad:** MEDIA (JSON limpio, pero sin filtro por fecha y con una cabecera que hay que extraer).
- **Relevancia bomberos:** alta (SPCPEIS). Para el descubrimiento en Cataluña, CIDO/Socrata es más simple y también lo cubre.

#### Ajuntament de València — Seguimiento de oposiciones — Valencia
- **URL portal:** https://www.valencia.es/cas/tramites/seguimiento-de-oposiciones (Liferay, portlet `FrontOposiciones`). El enlace "Oposicions" de `sede.valencia.es/sede/` lleva aquí a través de un antiguo `oposiciones.nsf`.
- **Acceso programático:** HTML. Una página con la lista de todas las oposiciones y una ficha por oposición con anuncios fechados.
- **Endpoint por fecha:** no hay. Ficha: `https://www.valencia.es/cas/tramites/seguimiento-de-oposiciones?p_p_id=FrontOposiciones_INSTANCE_2eirpTaJ4QHi&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_FrontOposiciones_INSTANCE_2eirpTaJ4QHi_esConcurso=false&_FrontOposiciones_INSTANCE_2eirpTaJ4QHi_jspPage=%2Ffront_ver_ficha_oposicion.jsp&_FrontOposiciones_INSTANCE_2eirpTaJ4QHi_oposicion=<COD>&_FrontOposiciones_INSTANCE_2eirpTaJ4QHi_oposicionTipo=O` (p. ej. `oposicion=A321` = BOMBERO/A (2024)).
- **Ejemplo verificado:**
  - La lista → 200, 213 KB, con entradas "BOMBERO/A (2024)", "CABO DE BOMBERO/A", "INSPECTOR/A DE BOMBERO/A", "OFICIAL/A DE BOMBERO/A", "SUBOFICIAL/A BOMBERO/A" y "Sargento/a Bombero/a".
  - La ficha A321 → 200, 153 KB, con fechas `2025-10-06 a 2025-11-03` (plazo), "BOP n.º 134, de 17 de julio de 2026. Anuncio … adición de las plazas … 2026" y "(20/01/2026) Providencia de Secretaría … emplazamiento de recurso…".
- **Cómo extraer:**
  - Lista: `<a href="...oposicion=<COD>&...oposicionTipo=O">NOMBRE</a>` y `<td class="text-center">C1</td>` (grupo).
  - Ficha: líneas de texto con el patrón `^\((DD[/-]MM[/-]AAAA)\) texto` para los anuncios del tribunal, más bloques "BOP n.º …, de <fecha>" y enlaces a PDF en `/documents/20142/...`.
- **Cobertura:** vigentes ("Seguimiento") más una pestaña "Histórico de Oposiciones".
- **Pegas:**
  - URLs largas de portlet.
  - No hay fecha de publicación estructurada: hay que hacer un diff de la ficha.
  - `sede.valencia.es/sede/registro/procedimiento/PE.AF.425` (fichas de trámite) da 500 o redirige a una página de error.
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** alta (92+30 plazas de bombero 2024-2026, cabos y oficiales). Las notas y fechas de examen solo están aquí.

#### Ayuntamiento de Sevilla (sevilla.org) — Sevilla
- **URL portal:** https://www.sevilla.org/servicios/empleo/servicio-de-recursos-humanos/convocatorias-oposiciones-concursos (ruta tomada de los PDF indexados, p. ej. `.../ayuntamiento-de-sevilla/funcionario/acceso-libre/bombero-45-plazas/35-anuncio-resultado-5o-ejercicio-y-fecha-6o-ejerccio.pdf`).
- **Acceso programático:** **no verificado**.
- **Endpoint por fecha:** —.
- **Ejemplo verificado:** **no verificado**. `https://www.sevilla.org/`, `https://sevilla.org/` y `http://www.sevilla.org/` dan `curl: (35) Recv failure: Connection reset by peer` (3 intentos; el proxy registra `ws_closed_mid_exchange` con www.sevilla.org). Probablemente es un bloqueo por IP o geográfico.
- **Cómo extraer:** — (estructura de carpetas por proceso con PDFs numerados "NN-anuncio-…").
- **Pegas:** reset de conexión.
- **Viabilidad:** DIFÍCIL (bloqueo).
- **Relevancia bomberos:** alta (45 plazas de bombero, BOP 93 de 25/04/2022, con anuncios de ejercicios; 46 plazas en la OEP 2026 según la prensa).

#### Ayuntamiento de Zaragoza — Oferta de Empleo (RSS) — Zaragoza
- **URL portal:** https://www.zaragoza.es/oferta/ (en `https://www.zaragoza.es/sede/portal/bomberos/` está el portal del servicio).
- **Acceso programático:** **RSS 2.0** con los últimos anuncios de todos los procesos.
- **Endpoint por fecha:** no hay. `https://www.zaragoza.es/oferta/rss.jsp` da los últimos ~20 anuncios, que cubren aproximadamente una semana.
- **Ejemplo verificado:** `curl 'https://www.zaragoza.es/oferta/rss.jsp'` → 200, `text/html; charset=ISO-8859-1` (en realidad es XML RSS), 8 KB, 20 `<item>`. Rango de `pubDate`: lun 19 oct 2026 a vie 23 oct 2026. Ejemplos: "Psicóloga/o (TL - TLRTRAN)" con la descripción "Acuerdo del Tribunal de Selección (Plantilla provisional primer ejercicio)" y el enlace `http://www.zaragoza.es/oferta/verAnuncio.jsp?idAnuncio=17641`; "Agente Forestal (TL)".
- **Cómo extraer:** `<item>` con:
  - `<title>`: plaza y turno (TL = turno libre, PI = promoción interna);
  - `<description>`: tipo de acto;
  - `<link>`: `verAnuncio.jsp?idAnuncio=N`, con un id incremental útil para deduplicar;
  - `<pubDate>`: **fecha en español**, p. ej. `vie, 23 oct 2026 00:00:00 CEST`. No es RFC 822, así que hay que parsearla con locale es.
- **Cobertura:** solo los ~20 últimos. Hay que consultarlo a diario (o varias veces al día en épocas de mucha actividad).
- **Pegas:** codificación ISO-8859-1, content-type incorrecto y fecha no estándar. No se encontró ningún JSON ni dataset de oposiciones en la sede (`/sede/servicio/empleo-publico.json` → 404).
- **Viabilidad:** FÁCIL.
- **Relevancia bomberos:** alta (37 plazas de Bombero/a Conductor/a 2026, BOE-A-2026-19150; BOPZ 170 de 27/07/2026). El RSS trae plantillas, calificaciones y fechas que no salen en el BOE.

#### Ayuntamiento de Málaga — Ofertas de Empleo Público / Detalle de convocatoria — Málaga
- **URL portal:** https://www.malaga.eu/el-ayuntamiento/ofertas-de-empleo-publico/ayuntamiento-de-malaga/
- **Acceso programático:** HTML: una lista de convocatorias con el último trámite y una ficha por id.
- **Endpoint por fecha:** no hay. Ficha: `https://www.malaga.eu/el-ayuntamiento/ofertas-de-empleo-publico/ayuntamiento-de-malaga/detalle-de-la-convocatoria/index.html?id=<N>`.
- **Ejemplo verificado:** la lista → 200, 211 KB, 71 enlaces "detalle-de-la-convocatoria". Hay tarjetas con "OEP 2024 · BOMBERO · Subgrupo C1 · FUNCIONARIO DE CARRERA · Trámite: Cerrado el plazo de subsanación de errores en listas provisionales" y "TÉCNICO MEDIO · DIPLOMADO ENFERMERÍA BOMBERO · Trámite: Anuncio nº 14 del Tribunal". La ficha `id=381` → 200, con una tabla de bases (fecha y lugar: "12/06/2026 BOPMA", "09/10/2026 BOJA").
- **Cómo extraer:**
  - Tarjetas con los campos "OEP AAAA", categoría, "Especialidad:", "Subgrupo:", "Vínculo:" y **"Trámite:"** (el estado o último acto). Para detectar cambios hay que comparar el "Trámite" entre días.
  - Cuidado: en el HTML el enlace "Detalle" va **antes** de los datos de su tarjeta, así que hay que delimitar bien cada tarjeta.
  - Los documentos están en `/visorcontenido/ANUDocumentDisplayer/<id>/...pdf` y `/visorcontenido/OEPDocumentDisplayer/<id>/documento` (este último devolvió el error 410 para un id antiguo).
- **Cobertura:** convocatorias en curso y recientes. No hay histórico por fecha.
- **Pegas:** `rrhh.malaga.eu` devuelve "Dominio no declarado" (proxy inverso), así que ya no existe. No hay RSS de empleo.
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** alta (51 plazas de Bombero turno libre, BOE 19/02/2025; 23 plazas de promoción interna, BOE 17/04/2026).

#### Ayuntamiento de Bilbao — Aplicación OPE (ope.bilbao.eus) — Bilbao
- **URL portal:** https://ope.bilbao.eus/open/ (SPA Angular). Se llega desde bilbao.eus → "Empleo y Oposiciones" → "Acceso a la aplicación de Oferta Pública de Empleo".
- **Acceso programático:** **API JSON** pública (sacada del JS), sin autenticación.
- **Endpoints:**
  - Convocatorias en trámite: `https://ope.bilbao.eus/open/ope/convocatorias-tramite?idioma=0` (0 = castellano, 1 = euskera; `es`/`ES`/`CAS` → 400).
  - Hay también `convocatorias-plazo`, `convocatorias-futuro` y `convocatorias-finalizadas` (vistos en el JS; **no verificados**).
  - Avisos de una convocatoria: `https://ope.bilbao.eus/open/ope/avisos?idConvocatoria=<ID>&idIdioma=0&cantidadResultados=50&numPagina=0`.
- **Ejemplo verificado:**
  - `curl '.../convocatorias-tramite?idioma=0'` → 200 application/json, 42 KB, 90 convocatorias. Las de bomberos: "2025-050422 138 plazas de BOMBERA/O- Promoción interna 2025", "2025-050417 42 plazas de CABO DE BOMBERAS/OS- Promoción interna 2025", "2022-000067 BOMBERO/A 55 plazas (2022)", "2019-039807 BOMBERO/A 38 plazas (2019)" y "2023-050277 OFICIAL/A DE BOMBERA/0 3 plazas 2023".
  - `curl '.../avisos?idConvocatoria=2022-000067&idIdioma=0&cantidadResultados=50&numPagina=0'` → 200, 22 KB, `totalElements: 63`. Ejemplo: "2025-05-22 BOMBERA/O 55 plazas (2022): Ejecución sentencia. Calificación provisional fase de concurso".
  - `avisos-todo` devuelve `[]`.
- **Cómo extraer:**
  - Convocatorias: array con `idConvocatoria`, `nombreConvocatoria`, `urlBases` (enlace al BOB), `fechaInicioSolicitud`, `fechaBajaSolicitud`, `abierta`, `tipoProcesoDescripcion` y `fkEntidad`.
  - Avisos: página Spring (`content[]`, `totalElements`) con `fechaAlta` (AAAA-MM-DD, **la fecha que usa el bot**), `fechaBaja`, `fkConvocatoria` y `avisosIdiomas.titulo`/`texto` (HTML).
- **Cobertura:** convocatorias en trámite (incluye antiguas sin cerrar) y todos sus avisos con fecha.
- **Pegas:**
  - No hay listado global de avisos por fecha: son 1 + N peticiones (una por convocatoria, o filtrar antes por "BOMBER").
  - Con `idioma=2` o `3` los textos salen `null`.
- **Viabilidad:** MEDIA (JSON, pero en dos pasos).
- **Relevancia bomberos:** alta. Los avisos (listas, calificaciones, nombramientos) no salen en el BOE.

---

### C. Servicios autonómicos y consorcios provinciales

#### Bombers de la Generalitat de Catalunya — Convocatòries (interior.gencat.cat) — Cataluña
- **URL portal:** https://interior.gencat.cat/ca/arees_dactuacio/bombers/convocatories/ (subsecciones bombers-funcionaris, Concursos generals, personal laboral, bombers voluntaris y OEP). `bombers.gencat.cat` da 000 y `atri.gencat.cat` da 000 (reset).
- **Acceso programático:** HTML. Hay un índice con un enlace por convocatoria y una ficha con "novetats" fechadas.
- **Endpoint por fecha:** no hay. Ficha, p. ej. `https://interior.gencat.cat/ca/arees_dactuacio/bombers/convocatories/bombers-funcionaris/acces-a-bomber-a-de-1a-de-lescala-tecnica-81-26/`.
- **Ejemplo verificado:**
  - El índice → 200, 467 KB. Contiene "Accés a bomber/a de 1a de l'escala tècnica 81/26", "Promoció interna … 83/25, 84/25, 85/25", "Concurs bomber/a de primera escala tècnica (DGPEIS/12/2026)", "Accés TEOC 2026" y "Bombers voluntaris 90/26".
  - La ficha 81/26 → 200, con entradas "21/10/2026 Correccions de la Guia Orientativa d'Estudi…", "16/07/2026 La resolució ISP/2428/2026…" y "15/09/2026 Termini de presentació de sol·licituds…".
- **Cómo extraer:**
  - Índice: `a[href*="/bombers/convocatories/"]` con el texto del proceso.
  - Ficha: pares línea de fecha `DD/MM/AAAA` + texto siguiente.
- **Cobertura:** vigentes y anteriores (desde 81/18).
- **Pegas:** páginas pesadas (~450 KB), sin RSS. Para el descubrimiento basta con CIDO (Socrata), que ya recoge estas convocatorias.
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** máxima (300 plazas de bombero/a de primera, convocatoria 81/26).

#### Comunidad de Madrid — Cuerpo de Bomberos (sede.comunidad.madrid / comunidad.madrid/empleo) — Comunidad de Madrid
- **URL portal:** https://sede.comunidad.madrid/buscador?t=bombero&tipo=empleo y las fichas `https://sede.comunidad.madrid/oferta-empleo/<slug>`, p. ej. `/oferta-empleo/bombero-especialista` (con ancla `#calendario-de-actuaciones`). Espejo: `https://www.comunidad.madrid/empleo/bomberos-bombero-especialista-c1-2026`.
- **Acceso programático:** buscador HTML (Drupal) por GET y fichas con un "calendario de actuaciones" fechado.
- **Endpoint por fecha:** no hay. Buscador: `https://sede.comunidad.madrid/buscador?t=bombero&tipo=empleo&items_per_page=10&page=N`.
- **Ejemplo verificado:**
  - El buscador → 200, 100 KB, "33 resultados", con enlaces `/oferta-empleo/bombero-especialista`, `/bombero-especialista-conductor`, `/bombero-jefe-dotacion`, `/bombero-oficial-tecnico` y `/oposicion-bombero-operador`. El título visible es "Proceso de acceso libre para Bombero Especialista (2026)".
  - La ficha → 200, 91 KB, con fechas de actuaciones 21/10/2026, 06/10/2026, 23/09/2026 y 04/09/2026, y "14/11/2026 Celebración del primer ejercicio".
- **Cómo extraer:**
  - Buscador: `a[href^="/oferta-empleo/"]` con el título; se pagina con `page=`.
  - Ficha: bloque del calendario con líneas `DD/MM/AAAA` + descripción y enlaces a PDF `/docs/AAAA-MM/...pdf`.
- **Cobertura:** procesos vigentes y recientes. El buscador no muestra fechas.
- **Pegas:** el formulario tiene `antibot_key` (sin efecto en GET). `/empleo-publico` da 404 (la ruta buena es `/empleo`).
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** alta (131 plazas de Bombero Especialista 2026, Orden 877/2026, BOCM 08/04/2026). Las fechas de ejercicios se publican "en la web de la DG de Función Pública y en el portal de empleo público".

#### Consorci Provincial de Bombers de València (bombersdv.es) — provincia de Valencia
- **URL portal:** https://www.bombersdv.es/oposicions/processos-en-marxa/ (también "Processos finalitzats" y `/es/oposiciones/`).
- **Acceso programático:** HTML (WordPress + Avada). El `/feed/` general solo trae noticias (10 items: "Adjudicades les obres del nou Parc de Bombers d'Alzira…"). La REST `wp-json/wp/v2/types` no tiene ningún tipo de contenido para procesos: estos son contenido estático de página.
- **Endpoint por fecha:** no hay.
- **Ejemplo verificado:** `curl 'https://www.bombersdv.es/oposicions/processos-en-marxa/'` → 200, 1,7 MB. Lista de expedientes: "2026/OP001: Proceso para cubrir, por Turno Libre, 16 plazas de Administrativo…", "2025/PI005: … Caporal … 7 places", "2026 Concurs de Trasllats 12a Edició Bomber/a-Conductor/a", "2021 Borsa Unificada … Bomber/a Conductor/a. Actualització cridaments" y "2025/CS007 Comissió de Serveis Lloc CB-31 Bomber/a-Conductor/a".
- **Cómo extraer:** líneas de texto con el patrón `^(\d{4}(-\d{4})?/[A-Z]{2}\d{3}|\d{4} )…` (código de expediente AAAA/OPnnn, PI, BT, CE, CS). Hay que hacer un diff diario de la lista y entrar en cada expediente (no verificado) para ver sus documentos.
- **Cobertura:** solo los procesos en marcha, sin fechas.
- **Pegas:** página enorme (1,7 MB) y sin fechas.
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** alta (bolsa de Bomber/a-Conductor/a, concursos de traslados, promociones). Las actualizaciones de llamamientos de bolsas no salen en el BOE.

#### Consorcio Provincial de Bomberos de Alicante (consorciobomberosalicante.es + sede Gestiona) — provincia de Alicante
- **URL portal:** https://consorciobomberosalicante.es/ (solo responde **sin www**; con www da 000). Menú "Empleo – Oposiciones" → `/oposiciones`. Tablón: https://cbomberosalicante.sedelectronica.es/board (sede Gestiona de esPublico).
- **Acceso programático:** HTML del tablón de la sede (Apache Wicket).
- **Endpoint por fecha:** no hay. La primera página de `/board` muestra los anuncios más recientes.
- **Ejemplo verificado:**
  - `curl 'https://cbomberosalicante.sedelectronica.es/board'` → 200, 40 KB (el primer intento dio un timeout). Anuncios: "23/10/2026 Anuncio BOP núm 202 - 23-10-26 - Lista definitiva y fecha 1er examen proceso selectivo miembros GER CPBA", "24/09/2026 BOLSA BOMBERO - CONVOCATORIA 5ª EDICIÓN CURSO" y "22/09/2026 9 plazas OPERADOR COMUNICACIONES exp. 807/2022 - EJECUCIÓN SENTENCIA".
  - `https://consorciobomberosalicante.es/oposiciones` → **302 a `https://www.smlsistemas.es/challenge?next=/cba2021Ins`** (desafío antibot de un proveedor externo).
- **Cómo extraer:** en el tablón, cada anuncio tiene categoría, título corto, descripción y fecha `DD/MM/AAAA`. Hay un filtro por texto (`input name="description"`), pero el formulario es Wicket (POST con `?x=<token>`).
- **Cobertura:** primera página (los ~10-20 últimos anuncios de todas las materias).
- **Pegas:** paginación y filtros con Wicket y estado de sesión. El portal de oposiciones está detrás de un challenge. Ojo: Gestiona (`*.sedelectronica.es`) lo usan cientos de ayuntamientos, así que un parser de `/board` es reutilizable.
- **Viabilidad:** MEDIA (solo página 1); DIFÍCIL para el histórico.
- **Relevancia bomberos:** alta (bolsa de bombero, GER, operadores).

#### Consorcio de Bomberos de la Provincia de Cádiz (CBPC) — provincia de Cádiz
- **URL portal:** https://www.cbpc.es/ (Joomla; noticias). La sede está en https://sede.cbpc.es.
- **Acceso programático:** **no verificado**.
- **Endpoint por fecha:** —.
- **Ejemplo verificado:** `www.cbpc.es` → 200 (solo noticias, p. ej. "El Consorcio de Bomberos creará una bolsa de interinos con los aspirantes que superaron el último proceso sin plaza"). **`https://sede.cbpc.es/` → 403** ("Error Page", 312 B). No hay sección de empleo en la web pública.
- **Pegas:** la sede bloquea el acceso.
- **Viabilidad:** DIFÍCIL.
- **Relevancia bomberos:** alta (72 plazas previstas para 2025: 49 bomberos y 23 cabos). Las bases salen en el BOP de Cádiz y el extracto en el BOE.

#### Consorcio Provincial de Bomberos de Málaga (CPB Málaga) — provincia de Málaga
- **URL portal:** https://cpbmalaga.es/ (WordPress, institucional). Los trámites están en `https://sede.malaga.es/cpbmalaga` (sede de la Diputación).
- **Acceso programático:** **no verificado** para empleo. `https://cpbmalaga.es/feed/` → 200 RSS con 10 noticias (p. ej. "Las obras del nuevo parque de bomberos de Rincón de la Victoria se encuentran a casi el 80% de ejecución"). Las categorías WP son solo `comunicacion` y `general`.
- **Ejemplo verificado:** `https://sede.malaga.es/cpbmalaga/` → **Connection reset** (https y http).
- **Pegas:** la sede no es accesible desde aquí y la web no tiene sección de empleo.
- **Viabilidad:** DIFÍCIL.
- **Relevancia bomberos:** alta (292 plazas de Bombero por promoción interna, BOJA nov-2025). Se cubre mejor por el BOP de Málaga y el BOE.

#### Consorcio de Prevención, Extinción de Incendios y Salvamento de la Isla de Tenerife — Tenerife
- **URL portal:** https://bomberostenerife.es/procesos-selectivos/ (PHP propio; la sede está en sede.bomberostenerife.com).
- **Acceso programático:** HTML, con un bloque por convocatoria y su lista de documentos.
- **Endpoint por fecha:** no hay.
- **Ejemplo verificado:** `curl 'https://bomberostenerife.es/procesos-selectivos/'` → 200, 33 KB: "Convocatoria 52 plazas de Bombero/a Especialista Conductor/a (Subgrupo C1)", "Suspensión del segundo ejercicio (25/03/2026) por fenómeno meteorológico adverso", "Distribución de aspirantes para los ejercicios del 27/04/2026" y "Convocatoria quinto ejercicio". Sin `/` final o con `/wp-json/` → redirige a "pagina-no-disponible".
- **Cómo extraer:** títulos de convocatoria más una lista de enlaces a documentos sin fecha estructurada (solo la que aparece en el texto). Hay que hacer un diff de la lista de enlaces.
- **Cobertura:** solo vigentes.
- **Pegas:** sin fechas ni RSS.
- **Viabilidad:** MEDIA.
- **Relevancia bomberos:** alta (52 plazas, BOP S/C Tenerife 72 de 16/06/2025, BOE 26/06/2025). Las fechas de los ejercicios solo están aquí.

#### Consorcio de Emergencias de Gran Canaria (emergenciasgc.org) — Gran Canaria
- **URL portal:** https://emergenciasgc.org/proceso-selectivo/ (WordPress + Elementor).
- **Acceso programático:** **API REST de WordPress** con el tipo de contenido `document` (cada anuncio es un documento), filtrable por fecha.
- **Endpoint por fecha:** `https://emergenciasgc.org/wp-json/wp/v2/document?after=AAAA-MM-DDT00:00:00&before=AAAA-MM-DDT00:00:00&per_page=100&_fields=id,date,title,link`.
- **Ejemplo verificado:**
  - `after=2026-10-14T00:00:00&before=2026-10-15T00:00:00` → 200 JSON, 2 registros ("Anuncio número 29. Propuesta nombramiento funcionarios interinos en prácticas, requerimiento doc. y publicidad exenciones formación.").
  - Sin filtro → `x-wp-total: 571` documentos.
  - `before=2025-01-01` → registros de 2024 (histórico).
  - `wp/v2/search?search=bombero` → "Anuncio BOP Nº 115 de 25-09-26: Emplazamientos … contra … las bases de la convocatoria de 37 plazas de bombero/a."
  - `/document/feed/` → 403.
- **Cómo extraer:** array JSON con `date`, `title.rendered` y `link` (`https://emergenciasgc.org/document/<slug>/`). No incluye todo el personal del consorcio, solo lo que publica como "document" (procesos, bolsas, avisos de RR. HH.). Hay que filtrar por palabra clave.
- **Cobertura:** histórico completo por fecha.
- **Pegas:** ninguna relevante. El RSS del tipo de contenido está bloqueado (403), pero la REST funciona.
- **Viabilidad:** FÁCIL.
- **Relevancia bomberos:** alta (37 plazas de Bombero/a por concurso-oposición turno libre, con anuncios nº 1-30 del tribunal).

#### Servicio de Emergencias del Principado de Asturias (SEPA, 112asturias.es) — Asturias
- **URL portal:** https://www.112asturias.es/recursos-humanos, `/bolsas-empleo` y `/bomberos/bolsa-empleo`.
- **Acceso programático:** HTML. Solo se ven secciones de bolsas, "lista movilidad funcional" y "lista superior categoría". **No hay una lista de procesos selectivos**: las oposiciones de Bombero/Auxiliar Bombero Especialista las gestiona el IAAP "Adolfo Posada" y se publican en el BOPA (sede.asturias.es/bopa).
- **Ejemplo verificado:** `/recursos-humanos` → 200, 38 KB; `/bomberos/bolsa-empleo` → 200, 42 KB (texto: "BOLSAS DE EMPLEO" más menús de notas de prensa). No he encontrado anuncios fechados.
- **Pegas:** contenido escaso.
- **Viabilidad:** MEDIA/no útil. Mejor el BOPA y el portal del IAAP (no verificado).
- **Relevancia bomberos:** media (17 plazas de Auxiliar Bombero/a Especialista, estabilización, BOPA 24/01/2024).

#### Servicio de Bomberos de Navarra – Nafarroako Suhiltzaileak (navarra.es) — Navarra
- **URL portal:** https://www.navarra.es/es/empleo-publico (**no verificado**).
- **Ejemplo verificado:** **no verificado**. `https://www.navarra.es/`, `https://navarra.es/` y `/es/empleo-publico` → `Recv failure: Connection reset by peer`. `bon.navarra.es` también figura con resets en el log del proxy.
- **Viabilidad:** DIFÍCIL (bloqueo desde esta IP).
- **Relevancia bomberos:** media (5 plazas de oficial de bomberos 2026 según un agregador; 32 de cabo, DF 48/2023).

#### CPEI Diputación de Badajoz — provincia de Badajoz
- **URL portal:** https://www.dip-badajoz.es/diputacion/delegaciones/cpei/ (**no verificado**).
- **Ejemplo verificado:** **no verificado**. `https://www.dip-badajoz.es/` respondió 200 en una prueba de código HTTP y luego 000 al descargar. La ruta del CPEI → 000.
- **Viabilidad:** DIFÍCIL/no verificado (conexión inestable).
- **Relevancia bomberos:** alta según agregadores (38 plazas de Conductor/a Bombero/a, BOP 17/07/2026; 58 de Cabo, BOP 14/08/2026). Se cubre por el BOP de Badajoz.

#### Otros consultados brevemente
- **Consorcio Provincial de Prevención y Extinción de Incendios de Córdoba** (https://consorcioincendios.es/): 200. `/feed/` solo trae 2 entradas de noticias (la última de 03/2025). No hay feed de empleo, así que no es útil para el bot.
- **Consorcio de Toledo:** no he encontrado el dominio (`consorcioincendiostoledo.es` → 502 DNS). **No verificado**.
- **Bombers de Barcelona:** cubierto por la API de la seu (ficha B) y por CIDO.

---

### Tabla resumen

| Fuente | Territorio | Tipo acceso | Viabilidad | Verificado (sí/parcial/no) |
|---|---|---|---|---|
| PAG – Buscador de empleo público (`pag_front_formulario.list.html`) | Estatal | HTML por GET con filtro de fecha y texto (truco de caché CloudFront) | MEDIA | sí |
| CIDO / Transparència Catalunya (Socrata `a2hm-uzyj`) | Cataluña | API JSON SoQL por fecha | FÁCIL | sí |
| Ayto. Madrid (madrid.es / sede) | Madrid | — (403 Akamai) | DIFÍCIL | no |
| Ajuntament de Barcelona – Processos selectius (API Wagtail) | Barcelona | API JSON (cabecera client-id pública), sin filtro de fecha | MEDIA | sí |
| Ajuntament de València – Seguimiento de oposiciones | Valencia | HTML lista + fichas con anuncios fechados | MEDIA | sí |
| Ayto. Sevilla (sevilla.org) | Sevilla | — (connection reset) | DIFÍCIL | no |
| Ayto. Zaragoza – Oferta de Empleo (`/oferta/rss.jsp`) | Zaragoza | RSS (últimos ~20) | FÁCIL | sí |
| Ayto. Málaga – Ofertas de empleo público | Málaga | HTML lista con "Trámite" + fichas | MEDIA | sí |
| Ayto. Bilbao – ope.bilbao.eus | Bilbao | API JSON (convocatorias + avisos con fecha) | MEDIA | sí |
| Bombers de la Generalitat (interior.gencat.cat) | Cataluña | HTML índice + fichas con fechas | MEDIA | sí |
| Comunidad de Madrid – Bomberos (sede.comunidad.madrid) | C. de Madrid | Buscador HTML + calendario de actuaciones | MEDIA | sí |
| Consorci Provincial de Bombers de València | prov. Valencia | HTML "processos en marxa" (sin fechas) | MEDIA | sí |
| Consorcio Provincial de Bomberos de Alicante (tablón Gestiona) | prov. Alicante | HTML tablón (Wicket, solo pág. 1) | MEDIA | parcial |
| Consorcio de Bomberos de Cádiz (CBPC) | prov. Cádiz | — (sede 403) | DIFÍCIL | no |
| Consorcio Provincial de Bomberos de Málaga | prov. Málaga | — (sede reset; feed solo noticias) | DIFÍCIL | parcial |
| Consorcio de Bomberos de Tenerife | Tenerife | HTML por convocatoria (sin fechas) | MEDIA | sí |
| Consorcio de Emergencias de Gran Canaria | Gran Canaria | API REST WP (`document`) por fecha | FÁCIL | sí |
| SEPA Asturias (112asturias.es) | Asturias | HTML bolsas (sin lista de procesos) | MEDIA (poco útil) | parcial |
| Bomberos de Navarra (navarra.es) | Navarra | — (connection reset) | DIFÍCIL | no |
| CPEI Diputación de Badajoz | prov. Badajoz | — (conexión inestable) | DIFÍCIL | no |
