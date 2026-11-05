// Página de palabras difíciles: todas, por orden alfabético, con buscador (sin tildes ni mayúsculas)
import { GLOSSARY } from '../data/guide.js';
import { esc } from '../ui/card.js';

const list = document.getElementById('palabras');
const search = document.getElementById('buscar-palabra');
const count = document.getElementById('cuantas-palabras');
const normal = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const WORDS = Object.entries(GLOSSARY).filter(([k]) => k !== 'subrayadas').sort(([a], [b]) => normal(a).localeCompare(normal(b), 'es'));

function render() {
  const q = normal(search.value.trim());
  const shown = WORDS.filter(([k, d]) => !q || normal(k).includes(q) || normal(d).includes(q));
  count.textContent = `${shown.length} ${shown.length === 1 ? 'palabra' : 'palabras'}`;
  list.innerHTML = shown.length
    ? shown.map(([k, d]) => `<div id="${encodeURIComponent(k)}"><dt>${esc(k)}</dt><dd>${esc(d)}</dd></div>`).join('')
    : '<p class="vacio">No está esa palabra. <a href="../fuentes/#t-error">Dinos cuál falta</a> y la añadimos.</p>';
}
search.addEventListener('input', render);
render();
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
