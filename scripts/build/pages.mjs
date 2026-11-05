// Crea una página por ayuda (/ayuda/<id>/) y una por comunidad (/comunidad/<id>/) para que se encuentren en buscadores.
// También rehace sitemap.xml. Uso: node scripts/paginas.mjs [carpeta de salida, por defecto _site]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BENEFITS, BY_ID, REGIONS, CATEGORIES } from '../../site/assets/js/data/benefits.js';
import { procedureOf } from '../../site/assets/js/data/procedures.js';
import { benefitCard, esc } from '../../site/assets/js/ui/card.js';
import { MINIMUM_INCOME } from '../../site/assets/js/data/regions.js';
import { regionPanel } from '../../site/assets/js/ui/region-panel.js';
import { LANGUAGES, COUNTER_SENTENCE } from './languages.mjs';
import { icon } from '../../site/assets/js/data/icons.js';
import { languageLinks, languageSelector } from '../../site/assets/js/data/flags.js';

const OUTPUT = process.argv[2] ?? '_site';
const SITE_URL = 'https://ayudas.bendi.dev';
const template = readFileSync(new URL('../../site/catalogo/index.html', import.meta.url), 'utf8')
  .replace(/(href|src)="\.\.\//g, '$1="/')
  .replace(' aria-current="page"', '')
  .replace('<script type="module" src="/assets/js/pages/catalogue.js"></script>\n', '');

function page({ routePath, title, descripcion, body, data }) {
  const html = template
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)} · ayudas</title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${esc(descripcion)}">`)
    .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${SITE_URL}${routePath}">\n  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)
    .replace(/<main class="envoltorio">[\s\S]*?<\/main>/, `<main class="envoltorio">\n${body}\n  </main>`);
  const folder = join(OUTPUT, routePath);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'index.html'), html);
}

const questions = (list) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: list.filter(([, r]) => r).map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })),
});
const breadcrumbs = (steps) => `<nav class="migas" aria-label="Estás en"><ol>${steps.map(([t, u]) => (u ? `<li><a href="${u}">${esc(t)}</a></li>` : `<li aria-current="page">${esc(t)}</li>`)).join('')}</ol></nav>`;

const routes = ['/', '/mayores/', '/catalogo/', '/mapa/', '/entidades/', '/palabras/', '/fuentes/', '/comunidad/', ...Object.keys(LANGUAGES).map((c) => `/${c}/`)];

for (const a of BENEFITS) {
  const t = procedureOf(a.id, null);
  const routePath = `/ayuda/${a.id}/`;
  routes.push(routePath);
  const topic = CATEGORIES.find((c) => c.id === a.category);
  page({
    routePath,
    title: `${a.name}: cuánto dan y cómo se pide en 2026`,
    descripcion: `${a.summary} Qué dan en 2026, quién puede pedirla y cómo se pide, paso a paso.`.slice(0, 300),
    data: questions([
      [`¿Qué es ${a.name}?`, a.summary],
      [`¿Cuánto da ${a.name} en 2026?`, a.amount],
      [`¿Quién puede pedir ${a.name}?`, a.requirements.join(' ')],
      [`¿Cómo se pide ${a.name}?`, t.steps.join(' ')],
    ]),
    body: `    <section aria-labelledby="titular">
      ${breadcrumbs([['Inicio', '/'], ['Todas las ayudas', '/catalogo/'], [topic?.name ?? 'Ayudas', `/catalogo/?tema=${a.category}`], [a.name]])}
      <h1 class="titular titular-ficha" id="titular">${esc(a.name)}</h1>
      <p class="entradilla">${esc(a.summary)} <strong>${esc(a.scope)}</strong> · ${esc(a.agency)}.</p>
      <p class="ficha-acciones"><a class="boton" href="/">¿Me toca? Contesta unas preguntas</a> <a class="boton secundario" href="/mapa/">Ver cómo se pide en mi comunidad</a></p>
      <ul class="lista-ayudas ficha">${benefitCard(a.id, { isOpen: true })}</ul>
    </section>`,
  });
}

for (const c of REGIONS) {
  const r = MINIMUM_INCOME[c.id];
  if (!r) continue;
  const routePath = `/comunidad/${c.id}/`;
  routes.push(routePath);
  page({
    routePath,
    title: `Ayudas en ${c.name} en 2026`,
    descripcion: `Las ayudas que se piden en ${c.name}: ${r.name}, dependencia, discapacidad, pensiones no contributivas, alquiler y más, con los pasos para pedirlas.`,
    data: questions([
      [`¿Cómo se llama la renta mínima en ${c.name}?`, `${r.name}. ${r.note ?? ''}`.trim()],
      [`¿Dónde se piden las ayudas de ${c.name}?`, `En la web oficial (${r.website}) o con ayuda de los servicios sociales de tu ayuntamiento.`],
    ]),
    body: `    <section aria-labelledby="titular">
      ${breadcrumbs([['Inicio', '/'], ['Mapa', `/mapa/#${c.id}`], [c.name]])}
      <h1 class="titular titular-ficha" id="titular">Ayudas en ${esc(c.name)}.</h1>
      <p class="entradilla">Las ayudas que se piden en ${esc(c.name)} y cómo se piden aquí. <a href="/mapa/#${c.id}">Verla en el mapa</a>.</p>
      <div class="panel-ccaa">${regionPanel(c.id, { title: false })}</div>
    </section>`,
  });
}

// Índice de comunidades
page({
  routePath: '/comunidad/',
  title: 'Ayudas por comunidad autónoma',
  descripcion: 'Elige tu comunidad autónoma y mira qué ayudas se piden allí y cómo.',
  data: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Ayudas por comunidad autónoma' },
  body: `    <section aria-labelledby="titular">
      <h1 class="titular" id="titular">Ayudas por comunidad.</h1>
      <p class="entradilla">Elige dónde vives. También puedes <a href="/mapa/">pulsar en el mapa</a>.</p>
      <ul class="lista-comunidades">${REGIONS.filter((c) => MINIMUM_INCOME[c.id]).map((c) => `<li><a href="/comunidad/${c.id}/">${esc(c.name)}</a><span>${esc(MINIMUM_INCOME[c.id].name)}</span></li>`).join('')}</ul>
    </section>`,
});


// Guías en otros idiomas: misma cabecera con los textos traducidos, y su idioma
const TODAY_PHONES = [['112', '112'], ['016', '016'], ['024', '024'], ['900 107 917', 'redCross']];
for (const [code, t] of Object.entries(LANGUAGES)) {
  let html = template
    .replace('<html lang="es">', `<html lang="${t.lang}" dir="${t.dir}">`)
    .replace(/<title>.*?<\/title>/, `<title>${esc(t.title)} · ayudas</title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${esc(t.descripcion)}">`)
    .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${SITE_URL}/${code}/">\n${Object.entries(LANGUAGES).map(([c, o]) => `  <link rel="alternate" hreflang="${o.lang}" href="${SITE_URL}/${c}/">`).join('\n')}\n  <link rel="alternate" hreflang="es" href="${SITE_URL}/">`)
    .replace('<span>Tus ayudas</span>', `<span>${esc(t.nav.home)}</span>`)
    .replace('<span>Mayores</span>', `<span>${esc(t.nav.mayores)}</span>`)
    .replace('<span>Todas las ayudas</span>', `<span>${esc(t.nav.catalogo)}</span>`)
    .replace('<span>Mapa</span>', `<span>${esc(t.nav.mapa)}</span>`)
    .replace('<span>Fuentes</span>', `<span>${esc(t.nav.sources)}</span>`)
    .replace(/<div class="envoltorio barra">[\s\S]*?\n  <\/div>\n/, `<div class="envoltorio barra barra-guia">\n    ${languageSelector('/', code, t.language)}\n  </div>\n`)
    .replace(/<footer class="envoltorio pie">[\s\S]*?<\/footer>/, `<footer class="envoltorio pie" lang="${t.lang}">
    <p>${esc(t.note)} <a href="/fuentes/#t-error">${esc(t.notice)}</a>.</p>
    <nav class="idiomas-pie" aria-label="${esc(t.others)}"><p>${esc(t.others)}</p>${languageLinks('/', code)}</nav>
  </footer>`)
    .replace(/<main class="envoltorio">[\s\S]*?<\/main>/, `<main class="envoltorio guia-idioma">
    <section aria-labelledby="titular">
      <h1 class="titular titular-ficha" id="titular">${esc(t.title)}</h1>
      <p class="entradilla">${esc(t.intro)}</p>
      <p><button type="button" class="escuchar" data-read="${esc([t.title, t.intro, t.stepsTitle, ...t.steps, t.benefitsTitle, ...t.benefits.map(([n, x]) => `${n}. ${x}`)].join(' '))}">${icon('altavoz')} ${esc(t.listen)}</button></p>
      <section class="ayuda-hoy" aria-labelledby="t-hoy">
        <h2 id="t-hoy">${esc(t.today)}</h2>
        <div class="llamadas">${TODAY_PHONES.map(([n, k]) => `<a class="llamar" href="tel:${n.replace(/\s/g, '')}"><span class="llamar-icono">${icon('telefono')}</span><span><strong dir="ltr">${n}</strong><small>${esc(t.tel[k])}</small></span></a>`).join('')}</div>
      </section>
      <h2 class="seccion-titulo">${esc(t.stepsTitle)}</h2>
      <ol class="pasos-tramite">${t.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <h2 class="seccion-titulo">${esc(t.benefitsTitle)}</h2>
      <dl class="guia-ayudas">${t.benefits.map(([n, x]) => `<div><dt lang="es" dir="ltr">${esc(n)}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl>
      <h2 class="seccion-titulo">${esc(t.sentence)}</h2>
      <p class="frase-ventanilla" lang="es" dir="ltr">${esc(COUNTER_SENTENCE)}</p>
      <p><button type="button" class="escuchar" data-lang="es" data-read="${esc(COUNTER_SENTENCE)}">${icon('altavoz')} ${esc(t.listenSentence)}</button></p>
      <p>${esc(t.use)}</p>
      <p class="ficha-acciones"><a class="boton" href="/" hreflang="es">${esc(t.button)}</a> <a class="boton secundario" href="/mapa/" hreflang="es">${esc(t.mapa)}</a></p>
    </section>
  </main>`);
  const folder = join(OUTPUT, code);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'index.html'), html);
}


writeFileSync(join(OUTPUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE_URL}${r}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`${BENEFITS.length} fichas, ${routes.length} direcciones en el mapa del sitio (${Object.keys(BY_ID).length} ayudas).`);
