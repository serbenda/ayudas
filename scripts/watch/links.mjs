// Checks that the site's official links still work.
// Public administrations change their websites often: better to find out before the people using it do.
// Usage: node scripts/watch/links.mjs   (exits with an error if any link is broken)

import { readFile, writeFile } from 'node:fs/promises';
import { BENEFITS, REGIONS } from '../../site/assets/js/data/benefits.js';
import { FIGURE_SOURCES } from '../../site/assets/js/data/figures.js';

const root = new URL('../../site/', import.meta.url);
const urls = new Map(); // url → where it appears

const addUrl = (url, where) => {
  if (!url || !/^https:\/\//.test(url)) return;
  if (!urls.has(url)) urls.set(url, new Set());
  urls.get(url).add(where);
};

for (const a of BENEFITS) addUrl(a.link.url, `ayuda ${a.id}`);
for (const c of REGIONS) addUrl(c.url, `comunidad ${c.id}`);
for (const f of FIGURE_SOURCES) addUrl(f.url, `cifra «${f.topic}»`);
for (const page of ['index.html', 'mayores/index.html', 'catalogo/index.html', 'fuentes/index.html']) {
  const html = await readFile(new URL(page, root), 'utf8');
  for (const [, url] of html.matchAll(/href="(https:\/\/[^"]+)"/g)) {
    if (/github\.com\/(sponsors|serbenda\/ayudas\/issues)|bendi\.dev|goatcounter/.test(url)) continue;
    addUrl(url, page);
  }
}

const UA = 'Mozilla/5.0 (compatible; ayudas-enlaces/1.0; +https://ayudas.bendi.dev/fuentes/)';

async function check(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
      await r.body?.cancel();
      if (r.ok) return { url, ok: true, status: r.status };
      // Many public websites block robots: that is not a broken link
      if ([401, 403, 405, 429].includes(r.status)) return { url, ok: true, doubtful: true, status: r.status };
      if (attempt === 2) return { url, ok: false, status: r.status };
    } catch (e) {
      if (attempt === 2) return { url, ok: false, status: e.name === 'TimeoutError' ? 'sin respuesta en 20 s' : (e.cause?.code ?? e.message) };
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

const results = [];
const queue = [...urls.keys()];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) results.push(await check(queue.shift()));
  }),
);

const broken = results.filter((r) => !r.ok);
for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
  const mark = !r.ok ? '✗' : r.doubtful ? '?' : '✓';
  console.log(`${mark} ${r.status} ${r.url}`);
}

const report = broken.map((r) => `- ${r.url} (${r.status}) — en ${[...urls.get(r.url)].join(', ')}`).join('\n');
await writeFile('broken-links.md', broken.length ? `Estos enlaces oficiales no responden:\n\n${report}\n` : '');

console.log(`\n${results.length} links, ${broken.length} broken, ${results.filter((r) => r.doubtful).length} that block robots.`);
if (broken.length) {
  for (const r of broken) console.log(`::warning::Broken link: ${r.url} (${r.status})`);
  process.exit(1);
}
