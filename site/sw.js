// Service worker de ayudas: la web funciona sin conexión.
// Páginas, estilos y scripts: primero la red (así nunca se mezclan versiones); sin conexión, lo último guardado.
// Fuente e imágenes: lo guardado, y se actualiza en segundo plano.

const VERSION = 'ayudas-v8';
const BASICOS = [
  './', 'mayores/', 'catalogo/', 'mapa/', 'palabras/', 'fuentes/',
  'assets/css/styles.css',
  'assets/js/ui/common.js', 'assets/js/pages/home.js', 'assets/js/pages/seniors.js', 'assets/js/pages/catalogue.js', 'assets/js/pages/sources.js',
  'assets/js/lib/rules.js', 'assets/js/data/benefits.js', 'assets/js/data/procedures.js', 'assets/js/data/guide.js', 'assets/js/data/figures.js',
  'assets/js/lib/format.js', 'assets/js/data/icons.js', 'assets/js/ui/card.js', 'assets/js/ui/evolution-chart.js', 'assets/js/ui/share.js', 'assets/js/data/examples.js',
  'assets/js/pages/map.js', 'assets/js/data/map-shapes.js', 'assets/js/ui/region-panel.js', 'assets/js/data/regions.js', 'assets/js/lib/reminders.js', 'assets/js/lib/answers-link.js', 'assets/js/data/regional-procedures.js', 'assets/js/data/deductions.js', 'assets/js/lib/voice.js', 'assets/js/data/flags.js', 'assets/js/pages/glossary.js', 'assets/js/data/review.js', 'assets/js/data/regional-benefits.js',
  'assets/img/favicon.svg', 'manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASICOS)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const estatico = /\.(woff2|png|svg)$/.test(url.pathname);
  if (estatico) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((guardado) => {
        const red = fetch(e.request).then((r) => {
          if (r.ok) caches.open(VERSION).then((c) => c.put(e.request, r.clone()));
          return r;
        });
        return guardado ?? red;
      }),
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((g) => g ?? caches.match('./'))),
  );
});
