// Insertar ayudas en otra web. Pon donde quieras que salga:
//   <div data-ayudas="cuestionario"></div>   (también: mayores, mapa, catalogo)
//   <script src="https://ayudas.bendi.dev/embed.js" async></script>
// No usa cookies ni recoge datos: las respuestas se quedan en el aparato de quien contesta.
(function () {
  var guion = document.currentScript;
  var base = guion ? new URL('./', guion.src).href : 'https://ayudas.bendi.dev/';
  var RUTAS = { cuestionario: '', mayores: 'mayores/', mapa: 'mapa/', catalogo: 'catalogo/' };
  var TITULOS = { cuestionario: 'Qué ayudas te pueden tocar', mayores: 'Ayudas para personas mayores', mapa: 'Ayudas de tu comunidad', catalogo: 'Todas las ayudas' };
  var marcos = [];
  document.querySelectorAll('[data-ayudas]').forEach(function (caja) {
    if (caja.querySelector('iframe')) return;
    var tipo = RUTAS.hasOwnProperty(caja.dataset.ayudas) ? caja.dataset.ayudas : 'cuestionario';
    var ccaa = caja.dataset.comunidad ? '#' + encodeURIComponent(caja.dataset.comunidad) : '';
    var f = document.createElement('iframe');
    f.src = base + RUTAS[tipo] + '?widget=1' + ccaa;
    f.title = TITULOS[tipo];
    f.loading = 'lazy';
    f.style.cssText = 'width:100%;border:0;min-height:600px;display:block';
    caja.appendChild(f);
    marcos.push(f);
  });
  addEventListener('message', function (e) {
    if (!e.data || e.data.ayudas !== 'altura' || typeof e.data.altura !== 'number') return;
    marcos.forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = Math.min(Math.max(e.data.altura, 400), 20000) + 'px';
    });
  });
})();
