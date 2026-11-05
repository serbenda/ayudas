// Todas las ayudas, con buscador y filtro por tema

import { AYUDAS, CATEGORIAS, COMUNIDADES } from './ayudas.js';
import { TRAMITES } from './tramites.js';
import { icono } from './iconos.js';
import { tarjeta, esc } from './tarjeta.js';

const lista = document.getElementById('lista');
const buscar = document.getElementById('buscar');
const cuantas = document.getElementById('cuantas');
const selectCcaa = document.getElementById('ccaa');
const chips = document.getElementById('categorias');
const CLAVE_CCAA = 'ayudas:ccaa';

let tema = new URLSearchParams(location.search).get('tema') ?? 'todas';

for (const c of COMUNIDADES) selectCcaa.add(new Option(c.nombre, c.id));
try {
  selectCcaa.value = localStorage.getItem(CLAVE_CCAA) ?? '';
} catch {}

chips.innerHTML = [{ id: 'todas', nombre: 'Todas' }, ...CATEGORIAS].map((c) => `<button type="button" data-tema="${c.id}" aria-pressed="${c.id === tema}">${c.nombre}</button>`).join('');
chips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tema]');
  if (!b) return;
  tema = b.dataset.tema;
  chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  pintar();
});

// Busca sin tildes ni mayúsculas
const normal = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function pintar() {
  const q = normal(buscar.value.trim());
  const ccaa = selectCcaa.value || null;
  const filtradas = AYUDAS.filter((a) => (tema === 'todas' || a.categoria === tema) && (!q || normal([a.nombre, a.resumen, a.cuantia, a.organismo, ...a.requisitos, ...(TRAMITES[a.id]?.facil ?? [])].join(' ')).includes(q)));
  cuantas.textContent = `${filtradas.length} de ${AYUDAS.length} ayudas`;
  lista.innerHTML = filtradas.length
    ? CATEGORIAS.map((c) => {
        const delGrupo = filtradas.filter((a) => a.categoria === c.id);
        if (!delGrupo.length) return '';
        return `<section class="grupo grupo-${c.id}" aria-labelledby="g-${c.id}">
        <h2 class="grupo-titulo" id="g-${c.id}"><span class="insignia">${icono(c.icono)}</span>${esc(c.nombre)}</h2>
        <ul class="lista-ayudas">${delGrupo.map((a) => tarjeta(a.id, { ccaa })).join('')}</ul>
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
  const id = decodeURIComponent(location.hash.slice(1)).replace(/^ayuda-/, '');
  const d = document.getElementById(`ayuda-${id}`)?.querySelector('details');
  if (d) {
    d.open = true;
    d.scrollIntoView({ block: 'start' });
  }
}
