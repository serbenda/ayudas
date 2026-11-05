// Service worker de ayudas: la web funciona sin conexión.
// Páginas, estilos y scripts: primero la red (así nunca se mezclan versiones); sin conexión, lo último guardado.
// Fuente e imágenes: lo guardado, y se actualiza en segundo plano.

const VERSION = 'ayudas-v7';
const BASICOS = [
  './', 'mayores/', 'catalogo/', 'mapa/', 'palabras/', 'fuentes/',
  'assets/css/estilos.css',
  'assets/js/comun.js', 'assets/js/portada.js', 'assets/js/mayores.js', 'assets/js/catalogo.js', 'assets/js/fuentes.js',
  'assets/js/reglas.js', 'assets/js/ayudas.js', 'assets/js/tramites.js', 'assets/js/guia.js', 'assets/js/cifras.js',
  'assets/js/formato.js', 'assets/js/iconos.js', 'assets/js/tarjeta.js', 'assets/js/evolucion.js', 'assets/js/compartir.js', 'assets/js/ejemplos.js',
  'assets/js/mapa.js', 'assets/js/mapa-datos.js', 'assets/js/panel-ccaa.js', 'assets/js/comunidades.js', 'assets/js/recordatorios.js', 'assets/js/enlace.js', 'assets/js/ccaa-tramites.js', 'assets/js/deducciones.js', 'assets/js/voz.js', 'assets/js/banderas.js', 'assets/js/palabras.js',
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
