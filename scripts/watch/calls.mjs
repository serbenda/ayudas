// Vigila las convocatorias nuevas de las ayudas autonómicas y municipales que recoge la web.
// Consulta la API pública de la Base de Datos Nacional de Subvenciones (BDNS, infosubvenciones.es), donde se publican las convocatorias
// de todas las administraciones (Estado, comunidades y ayuntamientos), y busca por el nombre de cada ayuda.
// Escribe convocatorias-novedades.md; la Action abre o actualiza un issue.
// Uso: node scripts/convocatorias.mjs [días]   (por defecto, los últimos 8)

import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// [texto que buscar, región en la BDNS (sin tildes, en mayúsculas) o null para cualquiera, id de la ficha]
export const WATCHLIST = [
  ['Tarxeta Benvida', 'GALICIA', 'tarxeta-benvida'],
  ['renta de inclusión social', 'GALICIA', 'renta-minima'],
  ['hijas e hijos', 'PAIS VASCO', 'ayuda-hijos-euskadi'],
  ['emergencia social', 'PAIS VASCO', 'aes-euskadi'],
  ['Concilia', 'ASTURIAS', 'concilia-asturias'],
  ['Bono Nacimiento', 'CASTILLA Y LEON', 'bono-nacimiento-cyl'],
  ['natalidad', 'EXTREMADURA', 'natalidad-rural-extremadura'],
  ['Xec Cangur', 'BALEAR', 'xec-cangur'],
  ['pensiones no contributivas', 'CANARIAS', 'complemento-pnc-canarias'],
  ['pensión no contributiva', 'CATALUNA', 'complemento-pnc-cataluna'],
  ['partos múltiples', 'ANDALUCIA', 'tercer-hijo-andalucia'],
  ['familias numerosas', 'VALENCIANA', 'familias-gva'],
  ['monoparentales', 'VALENCIANA', 'familias-gva'],
  ['familias numerosas', 'CASTILLA-LA MANCHA', 'familias-numerosas-clm'],
  ['familias numerosas', 'MURCIA', 'familias-especiales-murcia'],
  ['natalidad', 'CANTABRIA', 'natalidad-cantabria'],
  ['0 a 3 años', 'NAVARRA', 'menores-0-3-navarra'],
  ['partos o adopciones múltiples', 'ARAGON', 'partos-multiples-aragon'],
  ['Bono Infantil', 'RIOJA', 'bono-infantil-rioja'],
  ['natalidad', 'COMUNIDAD DE MADRID', 'madrid-natalidad'],
  ['Fons d\'Infància', null, 'fons-infancia-barcelona'],
  ['natalidad', 'VALENCIA', 'natalidad-valencia'],
  ['alquiler', null, 'alquiler-general'],
  ['bono alquiler joven', null, 'alquiler-joven'],
];

const withoutAccents = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
const ddmmyyyy = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const API = 'https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda';

/** Filtra las convocatorias de la respuesta de la BDNS que son de la región buscada */
export function inRegion(response, region) {
  const list = Array.isArray(response?.content) ? response.content : [];
  return list.filter((c) => !region || [c.nivel1, c.nivel2, c.nivel3].some((n) => withoutAccents(n).includes(region)));
}

async function searchBdns(text, since, until) {
  const u = new URL(API);
  Object.entries({ vpd: 'GE', page: 0, pageSize: 50, order: 'numeroConvocatoria', direccion: 'desc', descripcion: text, descripcionTipoBusqueda: 1, fechaDesde: ddmmyyyy(since), fechaHasta: ddmmyyyy(until) }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`BDNS «${text}»: HTTP ${r.status}`);
  return r.json();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const days = Number(process.argv[2] ?? 8);
  const until = new Date();
  const since = new Date(Date.now() - days * 86400000);
  const found = new Map();
  const failures = [];
  for (const [text, region, id] of WATCHLIST) {
    try {
      for (const c of inRegion(await searchBdns(text, since, until), region)) {
        const key = c.numeroConvocatoria ?? c.id;
        if (!found.has(key)) found.set(key, { ...c, card: id });
      }
    } catch (e) {
      failures.push(e.message);
      console.log(`::warning::${e.message}`);
    }
  }
  const lines = [...found.values()].map((c) => `- [ ] **${c.descripcion ?? 'Convocatoria'}** — ${[c.nivel2, c.nivel3].filter(Boolean).join(', ')} (${c.fechaRecepcion ?? 's/f'}). Ficha: \`${c.card}\`. [Ver en la BDNS](https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${c.numeroConvocatoria ?? ''})`);
  let text = '';
  if (lines.length) text += `Se han publicado convocatorias en los últimos ${days} días que pueden cambiar fechas o cuantías de la web. Revisa cada una y actualiza la ficha y \`assets/js/data/review.js\`:\n\n${lines.join('\n')}\n`;
  if (failures.length === WATCHLIST.length) text += `\nNo se ha podido consultar la BDNS (${failures[0]}). Si se repite varias semanas, puede que haya cambiado su API: revisa \`scripts/convocatorias.mjs\`.\n`;
  await writeFile('convocatorias-novedades.md', text);
  console.log(text || `Sin convocatorias nuevas en los últimos ${days} días.`);
}
