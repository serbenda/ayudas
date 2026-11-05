// Vigila las convocatorias nuevas de las ayudas autonómicas y municipales que recoge la web.
// Consulta la API pública de la Base de Datos Nacional de Subvenciones (BDNS, infosubvenciones.es), donde se publican las convocatorias
// de todas las administraciones (Estado, comunidades y ayuntamientos), y busca por el nombre de cada ayuda.
// Escribe convocatorias-novedades.md; la Action abre o actualiza un issue.
// Uso: node scripts/convocatorias.mjs [días]   (por defecto, los últimos 8)

import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// [texto que buscar, región en la BDNS (sin tildes, en mayúsculas) o null para cualquiera, id de la ficha]
export const VIGILAR = [
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

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
const ddmmaaaa = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const API = 'https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda';

/** Filtra las convocatorias de la respuesta de la BDNS que son de la región buscada */
export function delaRegion(respuesta, region) {
  const lista = Array.isArray(respuesta?.content) ? respuesta.content : [];
  return lista.filter((c) => !region || [c.nivel1, c.nivel2, c.nivel3].some((n) => sinTildes(n).includes(region)));
}

async function buscarBdns(texto, desde, hasta) {
  const u = new URL(API);
  Object.entries({ vpd: 'GE', page: 0, pageSize: 50, order: 'numeroConvocatoria', direccion: 'desc', descripcion: texto, descripcionTipoBusqueda: 1, fechaDesde: ddmmaaaa(desde), fechaHasta: ddmmaaaa(hasta) }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`BDNS «${texto}»: HTTP ${r.status}`);
  return r.json();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dias = Number(process.argv[2] ?? 8);
  const hasta = new Date();
  const desde = new Date(Date.now() - dias * 86400000);
  const encontradas = new Map();
  const fallos = [];
  for (const [texto, region, id] of VIGILAR) {
    try {
      for (const c of delaRegion(await buscarBdns(texto, desde, hasta), region)) {
        const clave = c.numeroConvocatoria ?? c.id;
        if (!encontradas.has(clave)) encontradas.set(clave, { ...c, ficha: id });
      }
    } catch (e) {
      fallos.push(e.message);
      console.log(`::warning::${e.message}`);
    }
  }
  const lineas = [...encontradas.values()].map((c) => `- [ ] **${c.descripcion ?? 'Convocatoria'}** — ${[c.nivel2, c.nivel3].filter(Boolean).join(', ')} (${c.fechaRecepcion ?? 's/f'}). Ficha: \`${c.ficha}\`. [Ver en la BDNS](https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${c.numeroConvocatoria ?? ''})`);
  let texto = '';
  if (lineas.length) texto += `Se han publicado convocatorias en los últimos ${dias} días que pueden cambiar fechas o cuantías de la web. Revisa cada una y actualiza la ficha y \`assets/js/revision.js\`:\n\n${lineas.join('\n')}\n`;
  if (fallos.length === VIGILAR.length) texto += `\nNo se ha podido consultar la BDNS (${fallos[0]}). Si se repite varias semanas, puede que haya cambiado su API: revisa \`scripts/convocatorias.mjs\`.\n`;
  await writeFile('convocatorias-novedades.md', texto);
  console.log(texto || `Sin convocatorias nuevas en los últimos ${dias} días.`);
}
