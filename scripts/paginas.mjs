// Crea una página por ayuda (/ayuda/<id>/) y una por comunidad (/comunidad/<id>/) para que se encuentren en buscadores.
// También rehace sitemap.xml. Uso: node scripts/paginas.mjs [carpeta de salida, por defecto _site]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AYUDAS, POR_ID, COMUNIDADES, CATEGORIAS } from '../assets/js/ayudas.js';
import { tramiteDe } from '../assets/js/tramites.js';
import { tarjeta, esc } from '../assets/js/tarjeta.js';
import { RENTA_CCAA } from '../assets/js/comunidades.js';
import { panelDe } from '../assets/js/panel-ccaa.js';

const SALIDA = process.argv[2] ?? '_site';
const WEB = 'https://ayudas.bendi.dev';
const plantilla = readFileSync('catalogo/index.html', 'utf8')
  .replace(/(href|src)="\.\.\//g, '$1="/')
  .replace(' aria-current="page"', '')
  .replace('<script type="module" src="/assets/js/catalogo.js"></script>\n', '');

function pagina({ ruta, titulo, descripcion, cuerpo, datos }) {
  const html = plantilla
    .replace(/<title>.*?<\/title>/, `<title>${esc(titulo)} · ayudas</title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${esc(descripcion)}">`)
    .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${WEB}${ruta}">\n  <script type="application/ld+json">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>`)
    .replace(/<main class="envoltorio">[\s\S]*?<\/main>/, `<main class="envoltorio">\n${cuerpo}\n  </main>`);
  const carpeta = join(SALIDA, ruta);
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(join(carpeta, 'index.html'), html);
}

const preguntas = (lista) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: lista.filter(([, r]) => r).map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })),
});
const migas = (pasos) => `<nav class="migas" aria-label="Estás en"><ol>${pasos.map(([t, u]) => (u ? `<li><a href="${u}">${esc(t)}</a></li>` : `<li aria-current="page">${esc(t)}</li>`)).join('')}</ol></nav>`;

const rutas = ['/', '/mayores/', '/catalogo/', '/mapa/', '/entidades/', '/fuentes/', '/comunidad/'];

for (const a of AYUDAS) {
  const t = tramiteDe(a.id, null);
  const ruta = `/ayuda/${a.id}/`;
  rutas.push(ruta);
  const tema = CATEGORIAS.find((c) => c.id === a.categoria);
  pagina({
    ruta,
    titulo: `${a.nombre}: cuánto dan y cómo se pide en 2026`,
    descripcion: `${a.resumen} Qué dan en 2026, quién puede pedirla y cómo se pide, paso a paso.`.slice(0, 300),
    datos: preguntas([
      [`¿Qué es ${a.nombre}?`, a.resumen],
      [`¿Cuánto da ${a.nombre} en 2026?`, a.cuantia],
      [`¿Quién puede pedir ${a.nombre}?`, a.requisitos.join(' ')],
      [`¿Cómo se pide ${a.nombre}?`, t.pasos.join(' ')],
    ]),
    cuerpo: `    <section aria-labelledby="titular">
      ${migas([['Inicio', '/'], ['Todas las ayudas', '/catalogo/'], [tema?.nombre ?? 'Ayudas', `/catalogo/?tema=${a.categoria}`], [a.nombre]])}
      <h1 class="titular titular-ficha" id="titular">${esc(a.nombre)}</h1>
      <p class="entradilla">${esc(a.resumen)} <strong>${esc(a.ambito)}</strong> · ${esc(a.organismo)}.</p>
      <p class="ficha-acciones"><a class="boton" href="/">¿Me toca? Contesta unas preguntas</a> <a class="boton secundario" href="/mapa/">Ver cómo se pide en mi comunidad</a></p>
      <ul class="lista-ayudas ficha">${tarjeta(a.id, { abierta: true })}</ul>
    </section>`,
  });
}

for (const c of COMUNIDADES) {
  const r = RENTA_CCAA[c.id];
  if (!r) continue;
  const ruta = `/comunidad/${c.id}/`;
  rutas.push(ruta);
  pagina({
    ruta,
    titulo: `Ayudas en ${c.nombre} en 2026`,
    descripcion: `Las ayudas que se piden en ${c.nombre}: ${r.nombre}, dependencia, discapacidad, pensiones no contributivas, alquiler y más, con los pasos para pedirlas.`,
    datos: preguntas([
      [`¿Cómo se llama la renta mínima en ${c.nombre}?`, `${r.nombre}. ${r.nota ?? ''}`.trim()],
      [`¿Dónde se piden las ayudas de ${c.nombre}?`, `En la web oficial (${r.sede}) o con ayuda de los servicios sociales de tu ayuntamiento.`],
    ]),
    cuerpo: `    <section aria-labelledby="titular">
      ${migas([['Inicio', '/'], ['Mapa', `/mapa/#${c.id}`], [c.nombre]])}
      <h1 class="titular titular-ficha" id="titular">Ayudas en ${esc(c.nombre)}.</h1>
      <p class="entradilla">Las ayudas que se piden en ${esc(c.nombre)} y cómo se piden aquí. <a href="/mapa/#${c.id}">Verla en el mapa</a>.</p>
      <div class="panel-ccaa">${panelDe(c.id, { titulo: false })}</div>
    </section>`,
  });
}

// Índice de comunidades
pagina({
  ruta: '/comunidad/',
  titulo: 'Ayudas por comunidad autónoma',
  descripcion: 'Elige tu comunidad autónoma y mira qué ayudas se piden allí y cómo.',
  datos: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Ayudas por comunidad autónoma' },
  cuerpo: `    <section aria-labelledby="titular">
      <h1 class="titular" id="titular">Ayudas por comunidad.</h1>
      <p class="entradilla">Elige dónde vives. También puedes <a href="/mapa/">pulsar en el mapa</a>.</p>
      <ul class="lista-comunidades">${COMUNIDADES.filter((c) => RENTA_CCAA[c.id]).map((c) => `<li><a href="/comunidad/${c.id}/">${esc(c.nombre)}</a><span>${esc(RENTA_CCAA[c.id].nombre)}</span></li>`).join('')}</ul>
    </section>`,
});

writeFileSync(join(SALIDA, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${WEB}${r}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`${AYUDAS.length} fichas, ${rutas.length} direcciones en el mapa del sitio (${Object.keys(POR_ID).length} ayudas).`);
