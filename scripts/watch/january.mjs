// Almost every figure changes each January (IPREM, minimum wage, pensions, IMV, non-contributory pensions…).
// This script prepares the year's review checklist and, if the BOE has already published the new minimum wage,
// proposes the exact change in site/assets/js/data/figures.js. Writes january.md; the Action opens an issue with the checklist.
// Usage: node scripts/watch/january.mjs [days back in the BOE]   (60 by default)

import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { FIGURES, FIGURE_SOURCES } from '../../site/assets/js/data/figures.js';
import { search } from './boe.mjs';

const date = (d) => d.toISOString().slice(0, 10).replaceAll('-', '');

/** Extracts the monthly minimum wage from a BOE text («…quedará fijado en 1.234,56 euros/mes…»)*/
export function smiFromText(text) {
  const m = String(text).match(/(\d{1,2}\.?\d{3},\d{2})\s*euros\s*\/\s*mes/i);
  return m ? Number(m[1].replace('.', '').replace(',', '.')) : null;
}

async function summaryOf(d) {
  const r = await fetch(`https://www.boe.es/datosabiertos/api/boe/sumario/${date(d)}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  return r.ok ? r.json() : null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const days = Number(process.argv[2] ?? 60);
  const year = new Date().getFullYear();
  const proposals = [];
  const news = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    try {
      const s = await summaryOf(d);
      if (!s) continue;
      for (const x of search(s)) {
        news.push(`- **${x.topic}**: [${x.title}](${x.url})`);
        if (x.topic === 'Salario mínimo' && x.url) {
          const html = await (await fetch(x.url, { signal: AbortSignal.timeout(30000) })).text();
          const smi = smiFromText(html.replace(/<[^>]+>/g, ' '));
          if (smi && smi !== FIGURES.smi.perMonth) proposals.push(`- **Salario mínimo**: ${FIGURES.smi.perMonth} → **${smi}** €/mes (${Math.round(smi * 14 * 100) / 100} €/año en 14 pagas). En \`site/assets/js/data/figures.js\`, cambia \`smi\` y revisa los límites que dependen de él (subsidio: 75 % del SMI). Fuente: [${x.title}](${x.url})`);
        }
      }
    } catch (e) {
      console.log(`::warning::${e.message}`);
    }
  }
  const text = `Empieza ${year}: toca revisar las cifras. Cambia cada una en \`site/assets/js/data/figures.js\` (y su fuente en \`FIGURE_SOURCES\`); la web se actualiza en todas las fichas.

## Propuestas a partir del BOE
${proposals.length ? proposals.join('\n') : 'Todavía no hay cifras nuevas detectadas automáticamente. Vuelve a lanzar la Action «Vigilar cambios» cuando se publiquen.'}

## Lista de revisión
${FIGURE_SOURCES.map((f) => `- [ ] **${f.topic}**: ahora «${f.fieldValue}». Fuente: [${f.source}](${f.url})`).join('\n')}
- [ ] Cuantías de la renta mínima de cada comunidad (\`site/assets/js/data/regions.js\`)
- [ ] Deducciones autonómicas del año (\`site/assets/js/data/deductions.js\`)
- [ ] Gráfico de evolución: añade el año nuevo en \`HISTORY\` (\`site/assets/js/data/figures.js\`)

## Lo que ha salido en el BOE en los últimos ${days} días
${news.length ? [...new Set(news)].join('\n') : 'Nada relevante.'}
`;
  await writeFile('january.md', text);
  console.log(text);
}
