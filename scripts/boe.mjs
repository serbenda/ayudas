// Vigila el BOE: busca en los sumarios de los últimos días disposiciones que pueden cambiar las cifras de la web
// (revalorización de pensiones, SMI, IPREM, IMV, bono social, dependencia, paro, vivienda, copago…).
// Si encuentra algo, escribe boe-novedades.md; la Action abre o actualiza un issue para revisarlo.
// Uso: node scripts/boe.mjs [días]   (por defecto, los últimos 7)

import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const TEMAS = [
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
const SECCIONES = new Set(['1', '3']);

const comoLista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

/** Las disposiciones de un sumario que tocan algún tema, con el tema */
export function buscar(sumario) {
  const encontrados = [];
  for (const diario of comoLista(sumario?.data?.sumario?.diario)) {
    for (const seccion of comoLista(diario.seccion)) {
      if (!SECCIONES.has(String(seccion.codigo))) continue;
      for (const dep of comoLista(seccion.departamento)) {
        const items = [...comoLista(dep.item), ...comoLista(dep.epigrafe).flatMap((e) => comoLista(e.item))];
        for (const item of items) {
          const tema = TEMAS.find(([, re]) => re.test(item.titulo ?? ''));
          if (tema) encontrados.push({ tema: tema[0], id: item.identificador, titulo: item.titulo, url: item.url_html, departamento: dep.nombre });
        }
      }
    }
  }
  return encontrados;
}

const fecha = (d) => d.toISOString().slice(0, 10).replaceAll('-', '');

async function sumarioDe(d) {
  const r = await fetch(`https://www.boe.es/datosabiertos/api/boe/sumario/${fecha(d)}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (r.status === 404) return null; // domingo o día sin BOE
  if (!r.ok) throw new Error(`BOE ${fecha(d)}: HTTP ${r.status}`);
  return r.json();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dias = Number(process.argv[2] ?? 7);
  const todos = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(Date.now() - i * 86400000);
    try {
      const s = await sumarioDe(d);
      if (s) todos.push(...buscar(s).map((x) => ({ ...x, fecha: fecha(d) })));
    } catch (e) {
      console.log(`::warning::${e.message}`);
    }
  }
  const texto = todos.length
    ? `En el BOE de los últimos ${dias} días hay disposiciones que pueden cambiar cifras de la web. Revísalas y actualiza \`assets/js/cifras.js\` si hace falta:\n\n${todos
        .map((x) => `- **${x.tema}** (${x.fecha.slice(6)}/${x.fecha.slice(4, 6)}): [${x.titulo}](${x.url}) — ${x.departamento}`)
        .join('\n')}\n`
    : '';
  await writeFile('boe-novedades.md', texto);
  console.log(todos.length ? texto : `Nada relevante en el BOE de los últimos ${dias} días.`);
}
