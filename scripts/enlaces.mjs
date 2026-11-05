// Comprueba que los enlaces oficiales de la web siguen funcionando.
// Las administraciones cambian sus webs a menudo: mejor enterarse antes que quien la usa.
// Uso: node scripts/enlaces.mjs   (sale con error si algún enlace está roto)

import { readFile, writeFile } from 'node:fs/promises';
import { AYUDAS, COMUNIDADES } from '../assets/js/ayudas.js';
import { FUENTES_CIFRAS } from '../assets/js/cifras.js';

const raiz = new URL('../', import.meta.url);
const urls = new Map(); // url → dónde aparece

const anotar = (url, donde) => {
  if (!url || !/^https:\/\//.test(url)) return;
  if (!urls.has(url)) urls.set(url, new Set());
  urls.get(url).add(donde);
};

for (const a of AYUDAS) anotar(a.enlace.url, `ayuda ${a.id}`);
for (const c of COMUNIDADES) anotar(c.url, `comunidad ${c.id}`);
for (const f of FUENTES_CIFRAS) anotar(f.url, `cifra «${f.tema}»`);
for (const pagina of ['index.html', 'mayores/index.html', 'catalogo/index.html', 'fuentes/index.html']) {
  const html = await readFile(new URL(pagina, raiz), 'utf8');
  for (const [, url] of html.matchAll(/href="(https:\/\/[^"]+)"/g)) {
    if (/github\.com\/(sponsors|serbenda\/ayudas\/issues)|bendi\.dev|goatcounter/.test(url)) continue;
    anotar(url, pagina);
  }
}

const UA = 'Mozilla/5.0 (compatible; ayudas-enlaces/1.0; +https://ayudas.bendi.dev/fuentes/)';

async function comprobar(url) {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
      await r.body?.cancel();
      if (r.ok) return { url, ok: true, estado: r.status };
      // Muchas webs públicas cortan a los robots: eso no es un enlace roto
      if ([401, 403, 405, 429].includes(r.status)) return { url, ok: true, dudoso: true, estado: r.status };
      if (intento === 2) return { url, ok: false, estado: r.status };
    } catch (e) {
      if (intento === 2) return { url, ok: false, estado: e.name === 'TimeoutError' ? 'sin respuesta en 20 s' : e.cause?.code ?? e.message };
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

const resultados = [];
const cola = [...urls.keys()];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cola.length) resultados.push(await comprobar(cola.shift()));
  }),
);

const rotos = resultados.filter((r) => !r.ok);
for (const r of resultados.sort((a, b) => a.url.localeCompare(b.url))) {
  const marca = !r.ok ? '✗' : r.dudoso ? '?' : '✓';
  console.log(`${marca} ${r.estado} ${r.url}`);
}

const informe = rotos.map((r) => `- ${r.url} (${r.estado}) — en ${[...urls.get(r.url)].join(', ')}`).join('\n');
await writeFile(new URL('enlaces-rotos.md', raiz), rotos.length ? `Estos enlaces oficiales no responden:\n\n${informe}\n` : '');

console.log(`\n${resultados.length} enlaces, ${rotos.length} rotos, ${resultados.filter((r) => r.dudoso).length} que no dejan comprobar a los robots.`);
if (rotos.length) {
  for (const r of rotos) console.log(`::warning::Enlace roto: ${r.url} (${r.estado})`);
  process.exit(1);
}
