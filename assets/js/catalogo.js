// Todas las ayudas, con buscador y filtro por tema

import { AYUDAS, CATEGORIAS, COMUNIDADES, enlaceDe } from './ayudas.js';
import { icono } from './iconos.js';

const lista = document.getElementById('lista');
const buscar = document.getElementById('buscar');
const cuantas = document.getElementById('cuantas');
const selectCcaa = document.getElementById('ccaa');
const chips = document.getElementById('categorias');
const CLAVE_CCAA = 'ayudas:ccaa';

let tema = 'todas';

for (const c of COMUNIDADES) selectCcaa.add(new Option(c.nombre, c.id));
try {
  selectCcaa.value = localStorage.getItem(CLAVE_CCAA) ?? '';
} catch {}

chips.innerHTML = [{ id: 'todas', nombre: 'Todas' }, ...CATEGORIAS].map((c) => `<button type="button" data-tema="${c.id}" aria-pressed="${c.id === 'todas'}">${c.nombre}</button>`).join('');
chips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tema]');
  if (!b) return;
  tema = b.dataset.tema;
  chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  pintar();
});

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Busca sin tildes ni mayúsculas
const normal = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function ficha(a, ccaa) {
  const enlace = enlaceDe(a, ccaa);
  const boton = enlace.url ? `<a class="boton" href="${esc(enlace.url)}" rel="noopener" target="_blank">Dónde se pide<span class="oculto"> (${esc(enlace.texto)}, se abre en otra pestaña)</span></a>` : '<span>Se pide en tu comunidad: elígela arriba para ver el enlace.</span>';
  return `
  <li id="${a.id}">
    <details class="ayuda">
      <summary>
        <span class="ayuda-nombre">${esc(a.nombre)}</span>
        <p class="ayuda-importe"></p>
        <p class="ayuda-resumen">${esc(a.resumen)}</p>
      </summary>
      <div class="ayuda-detalle">
        <div><h4>Cuánto da en 2026</h4><p>${esc(a.cuantia)}</p></div>
        <div><h4>Requisitos principales</h4><ul>${a.requisitos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
        <p class="ayuda-pie"><span>${esc(a.ambito)} · ${esc(a.organismo)}</span>${boton}</p>
      </div>
    </details>
  </li>`;
}

function pintar() {
  const q = normal(buscar.value.trim());
  const ccaa = selectCcaa.value || null;
  const filtradas = AYUDAS.filter((a) => (tema === 'todas' || a.categoria === tema) && (!q || normal([a.nombre, a.resumen, a.cuantia, a.organismo, ...a.requisitos].join(' ')).includes(q)));
  cuantas.textContent = `${filtradas.length} de ${AYUDAS.length} ayudas`;
  lista.innerHTML = filtradas.length
    ? CATEGORIAS.map((c) => {
        const delGrupo = filtradas.filter((a) => a.categoria === c.id);
        if (!delGrupo.length) return '';
        return `<section class="grupo" aria-labelledby="g-${c.id}">
        <h2 class="grupo-titulo" id="g-${c.id}"><span class="insignia">${icono(c.icono)}</span>${esc(c.nombre)}</h2>
        <ul class="lista-ayudas">${delGrupo.map((a) => ficha(a, ccaa)).join('')}</ul>
      </section>`;
      }).join('')
    : '<p class="vacio">No hay ninguna ayuda con esa búsqueda. Prueba con otra palabra o <a href="../fuentes/#t-error">avísanos si falta alguna</a>.</p>';
}

buscar.addEventListener('input', pintar);
selectCcaa.addEventListener('change', () => {
  try {
    localStorage.setItem(CLAVE_CCAA, selectCcaa.value);
  } catch {}
  pintar();
});

pintar();

// Si se llega con #id-de-ayuda, se abre esa ficha
if (location.hash) {
  const d = document.getElementById(decodeURIComponent(location.hash.slice(1)))?.querySelector('details');
  if (d) {
    d.open = true;
    d.scrollIntoView({ block: 'start' });
  }
}
