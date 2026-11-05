// Página de palabras difíciles: todas, por orden alfabético, con buscador (sin tildes ni mayúsculas)
import { GLOSARIO } from '../data/guide.js';
import { esc } from '../ui/card.js';

const lista = document.getElementById('palabras');
const buscar = document.getElementById('buscar-palabra');
const cuantas = document.getElementById('cuantas-palabras');
const normal = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const PALABRAS = Object.entries(GLOSARIO).filter(([k]) => k !== 'subrayadas').sort(([a], [b]) => normal(a).localeCompare(normal(b), 'es'));

function pintar() {
  const q = normal(buscar.value.trim());
  const salen = PALABRAS.filter(([k, d]) => !q || normal(k).includes(q) || normal(d).includes(q));
  cuantas.textContent = `${salen.length} ${salen.length === 1 ? 'palabra' : 'palabras'}`;
  lista.innerHTML = salen.length
    ? salen.map(([k, d]) => `<div id="${encodeURIComponent(k)}"><dt>${esc(k)}</dt><dd>${esc(d)}</dd></div>`).join('')
    : '<p class="vacio">No está esa palabra. <a href="../fuentes/#t-error">Dinos cuál falta</a> y la añadimos.</p>';
}
buscar.addEventListener('input', pintar);
pintar();
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
