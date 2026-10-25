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
