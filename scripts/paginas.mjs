// Crea una página por ayuda (/ayuda/<id>/) y una por comunidad (/comunidad/<id>/) para que se encuentren en buscadores.
// También rehace sitemap.xml. Uso: node scripts/paginas.mjs [carpeta de salida, por defecto _site]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AYUDAS, POR_ID, COMUNIDADES, CATEGORIAS } from '../assets/js/ayudas.js';
import { tramiteDe } from '../assets/js/tramites.js';
import { tarjeta, esc } from '../assets/js/tarjeta.js';
import { RENTA_CCAA } from '../assets/js/comunidades.js';
import { panelDe } from '../assets/js/panel-ccaa.js';
import { IDIOMAS, FRASE } from './idiomas.mjs';
import { icono } from '../assets/js/iconos.js';

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

const rutas = ['/', '/mayores/', '/catalogo/', '/mapa/', '/entidades/', '/fuentes/', '/comunidad/', ...Object.keys(IDIOMAS).map((c) => `/${c}/`)];

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


// Guías en otros idiomas: misma cabecera con los textos traducidos, lang y dir (árabe de derecha a izquierda)
const TELEFONOS_HOY = [['112', '112'], ['016', '016'], ['024', '024'], ['900 107 917', 'cruz']];
for (const [codigo, t] of Object.entries(IDIOMAS)) {
  let html = plantilla
    .replace('<html lang="es">', `<html lang="${t.lang}" dir="${t.dir}">`)
    .replace(/<title>.*?<\/title>/, `<title>${esc(t.titulo)} · ayudas</title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${esc(t.descripcion)}">`)
    .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${WEB}/${codigo}/">\n${Object.values(IDIOMAS).map((o) => `  <link rel="alternate" hreflang="${o.lang}" href="${WEB}/${o.lang}/">`).join('\n')}\n  <link rel="alternate" hreflang="es" href="${WEB}/">`)
    .replace('<span>Tus ayudas</span>', `<span>${esc(t.nav.inicio)}</span>`)
    .replace('<span>Mayores</span>', `<span>${esc(t.nav.mayores)}</span>`)
    .replace('<span>Todas las ayudas</span>', `<span>${esc(t.nav.catalogo)}</span>`)
    .replace('<span>Mapa</span>', `<span>${esc(t.nav.mapa)}</span>`)
    .replace('<span>Fuentes</span>', `<span>${esc(t.nav.fuentes)}</span>`)
    .replace(/<div class="envoltorio barra">[\s\S]*?<\/div>\n/, '')
    .replace(/<footer class="envoltorio pie">[\s\S]*?<\/footer>/, `<footer class="envoltorio pie" lang="${t.lang}">
    <p>${esc(t.nota)} <a href="/fuentes/#t-error">${esc(t.aviso)}</a>.</p>
    <p lang="es">${otrosIdiomas(codigo)}</p>
  </footer>`)
    .replace(/<main class="envoltorio">[\s\S]*?<\/main>/, `<main class="envoltorio guia-idioma">
    <section aria-labelledby="titular">
      <h1 class="titular titular-ficha" id="titular">${esc(t.titulo)}</h1>
      <p class="entradilla">${esc(t.entradilla)}</p>
      <p><button type="button" class="escuchar" data-leer="${esc([t.titulo, t.entradilla, t.pasosTitulo, ...t.pasos, t.ayudasTitulo, ...t.ayudas.map(([n, x]) => `${n}. ${x}`)].join(' '))}">${icono('altavoz')} ${esc(t.escuchar)}</button></p>
      <section class="ayuda-hoy" aria-labelledby="t-hoy">
        <h2 id="t-hoy">${esc(t.hoy)}</h2>
        <div class="llamadas">${TELEFONOS_HOY.map(([n, k]) => `<a class="llamar" href="tel:${n.replace(/\s/g, '')}"><span class="llamar-icono">${icono('telefono')}</span><span><strong dir="ltr">${n}</strong><small>${esc(t.tel[k])}</small></span></a>`).join('')}</div>
      </section>
      <h2 class="seccion-titulo">${esc(t.pasosTitulo)}</h2>
      <ol class="pasos-tramite">${t.pasos.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <h2 class="seccion-titulo">${esc(t.ayudasTitulo)}</h2>
      <dl class="guia-ayudas">${t.ayudas.map(([n, x]) => `<div><dt lang="es" dir="ltr">${esc(n)}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl>
      <h2 class="seccion-titulo">${esc(t.frase)}</h2>
      <p class="frase-ventanilla" lang="es" dir="ltr">${esc(FRASE)}</p>
      <p><button type="button" class="escuchar" data-lang="es" data-leer="${esc(FRASE)}">${icono('altavoz')} ${esc(t.escucharFrase)}</button></p>
      <p>${esc(t.usar)}</p>
      <p class="ficha-acciones"><a class="boton" href="/" hreflang="es">${esc(t.boton)}</a> <a class="boton secundario" href="/mapa/" hreflang="es">${esc(t.mapa)}</a></p>
    </section>
  </main>`);
  const carpeta = join(SALIDA, codigo);
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(join(carpeta, 'index.html'), html);
}

function otrosIdiomas(actual) {
  return [['es', 'Español', '/'], ...Object.entries(IDIOMAS).map(([c, o]) => [c, o.nombre, `/${c}/`])]
    .filter(([c]) => c !== actual)
    .map(([c, n, u]) => `<a href="${u}" hreflang="${c}" lang="${c}">${esc(n)}</a>`)
    .join(' · ');
}

writeFileSync(join(SALIDA, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${WEB}${r}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`${AYUDAS.length} fichas, ${rutas.length} direcciones en el mapa del sitio (${Object.keys(POR_ID).length} ayudas).`);
