// Embed ayudas in another website. Put this wherever you want it to show:
//   <div data-ayudas="cuestionario"></div>   (also: mayores, mapa, catalogo)
//   <script src="https://ayudas.bendi.dev/embed.js" async></script>
// No cookies and no data collection: answers stay on the device of whoever answers.
(function () {
  var scriptTag = document.currentScript;
  var base = scriptTag ? new URL('./', scriptTag.src).href : 'https://ayudas.bendi.dev/';
  var ROUTES = { cuestionario: '', mayores: 'mayores/', mapa: 'mapa/', catalogo: 'catalogo/' };
  var TITLES = { cuestionario: 'Qué ayudas te pueden tocar', mayores: 'Ayudas para personas mayores', mapa: 'Ayudas de tu comunidad', catalogo: 'Todas las ayudas' };
  var frames = [];
  document.querySelectorAll('[data-ayudas]').forEach(function (box) {
    if (box.querySelector('iframe')) return;
    var type = ROUTES.hasOwnProperty(box.dataset.ayudas) ? box.dataset.ayudas : 'cuestionario';
    var region = box.dataset.comunidad ? '#' + encodeURIComponent(box.dataset.comunidad) : '';
    var f = document.createElement('iframe');
    f.src = base + ROUTES[type] + '?widget=1' + region;
    f.title = TITLES[type];
    f.loading = 'lazy';
    f.style.cssText = 'width:100%;border:0;min-height:600px;display:block';
    box.appendChild(f);
    frames.push(f);
  });
  addEventListener('message', function (e) {
    if (!e.data || e.data.ayudas !== 'altura' || typeof e.data.altura !== 'number') return;
    frames.forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = Math.min(Math.max(e.data.altura, 400), 20000) + 'px';
    });
  });
})();
