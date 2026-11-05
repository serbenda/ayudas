// Vigila el BOE: busca en los sumarios de los últimos días disposiciones que pueden cambiar las cifras de la web
// (revalorización de pensiones, SMI, IPREM, IMV, bono social, dependencia, paro, vivienda, copago…).
// Si encuentra algo, escribe boe-novedades.md; la Action abre o actualiza un issue para revisarlo.
// Uso: node scripts/boe.mjs [días]   (por defecto, los últimos 7)

import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const TOPICS = [
  ['Pensiones', /revaloriza|pensiones|clases pasivas/i],
  ['Salario mínimo', /salario m[ií]nimo interprofesional/i],
  ['IPREM y Presupuestos', /indicador p[uú]blico de renta|presupuestos generales del estado/i],
  ['Ingreso Mínimo Vital', /ingreso m[ií]nimo vital/i],
  ['Bono social', /bono social|consumidor vulnerable/i],
  ['Dependencia', /dependencia|autonom[ií]a personal/i],
  ['Paro', /desempleo|subsidio/i],
  ['Familia', /nacimiento y cuidado|familias numerosas|crianza|prestaciones familiares/i],
  ['Vivienda', /plan estatal de vivienda|alquiler/i],
  ['Medicinas', /aportaci[oó]n farmac[eé]utica|copago/i],
];

// Solo disposiciones generales (1) y otras disposiciones (3): ahí salen las normas y las cuantías
const SECTIONS = new Set(['1', '3']);

const asList = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

/** Las disposiciones de un sumario que tocan algún tema, con el tema */
export function search(sumario) {
  const found = [];
  for (const diario of asList(sumario?.data?.sumario?.diario)) {
    for (const seccion of asList(diario.seccion)) {
      if (!SECTIONS.has(String(seccion.code))) continue;
      for (const dep of asList(seccion.departamento)) {
        const items = [...asList(dep.item), ...asList(dep.epigrafe).flatMap((e) => asList(e.item))];
        for (const item of items) {
          const topic = TOPICS.find(([, re]) => re.test(item.title ?? ''));
          if (topic) found.push({ topic: topic[0], id: item.identificador, title: item.title, url: item.url_html, departamento: dep.name });
        }
      }
    }
  }
  return found;
}

const date = (d) => d.toISOString().slice(0, 10).replaceAll('-', '');

async function summaryOf(d) {
  const r = await fetch(`https://www.boe.es/datosabiertos/api/boe/sumario/${date(d)}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (r.status === 404) return null; // domingo o día sin BOE
  if (!r.ok) throw new Error(`BOE ${date(d)}: HTTP ${r.status}`);
  return r.json();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const days = Number(process.argv[2] ?? 7);
  const all = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    try {
      const s = await summaryOf(d);
      if (s) all.push(...search(s).map((x) => ({ ...x, date: date(d) })));
    } catch (e) {
      console.log(`::warning::${e.message}`);
    }
  }
  const text = all.length
    ? `En el BOE de los últimos ${days} días hay disposiciones que pueden cambiar cifras de la web. Revísalas y actualiza \`assets/js/data/figures.js\` si hace falta:\n\n${all
        .map((x) => `- **${x.topic}** (${x.date.slice(6)}/${x.date.slice(4, 6)}): [${x.title}](${x.url}) — ${x.departamento}`)
        .join('\n')}\n`
    : '';
  await writeFile('boe-novedades.md', text);
  console.log(all.length ? text : `Nada relevante en el BOE de los últimos ${days} días.`);
}
