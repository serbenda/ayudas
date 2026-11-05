// Mapa de España: pulsas tu comunidad y salen sus ayudas, con cómo se piden allí

import { MAPA, CAMINOS, CENTROS } from '../data/map-shapes.js';
import { COMUNIDADES } from '../data/benefits.js';
import { RENTA_CCAA } from '../data/regions.js';
import { esc } from '../ui/card.js';
import { panelDe } from '../ui/region-panel.js';

const CLAVE_CCAA = 'ayudas:ccaa';
const PEQUENAS = new Set(['ceuta', 'melilla']);

export function svgMapa() {
  const { canarias: k } = MAPA;
  const zonas = COMUNIDADES.filter((c) => CAMINOS[c.id]).map((c) => {
    const [x, y] = CENTROS[c.id];
    // Ceuta y Melilla son diminutas: se añade un círculo grande para poder pulsarlas
    const punto = PEQUENAS.has(c.id) ? `<circle class="punto" cx="${x}" cy="${y}" r="16"/>` : '';
    return `<g class="zona" data-ccaa="${c.id}" tabindex="0" role="button" aria-pressed="false" aria-label="${esc(c.nombre)}">
      <title>${esc(c.nombre)}</title><path d="${CAMINOS[c.id]}"/>${punto}</g>`;
  }).join('');
  return `<svg class="mapa-svg" viewBox="0 0 ${MAPA.ancho} ${MAPA.alto}" role="group" aria-label="Mapa de España por comunidades">
    <rect class="recuadro" x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="8"/>
    ${zonas}
  </svg>`;
}

function iniciar() {
  const caja = document.getElementById('mapa');
  if (!caja) return;
  const panel = document.getElementById('panel-ccaa');
  const select = document.getElementById('mapa-ccaa');
  caja.innerHTML = svgMapa();
  for (const c of COMUNIDADES) select.add(new Option(c.nombre, c.id));

  function elegir(id, { mover = false, guardar = true } = {}) {
    if (!RENTA_CCAA[id]) return;
    select.value = id;
    caja.querySelectorAll('.zona').forEach((z) => z.setAttribute('aria-pressed', String(z.dataset.ccaa === id)));
    if (guardar) {
      try { localStorage.setItem(CLAVE_CCAA, id); } catch {}
      history.replaceState(null, '', `#${id}`);
    }
    panel.innerHTML = panelDe(id);
    panel.hidden = false;
    if (mover) panel.focus({ preventScroll: false });
  }

  caja.addEventListener('click', (e) => {
    const z = e.target.closest('.zona');
    if (z) elegir(z.dataset.ccaa, { mover: true });
  });
  caja.addEventListener('keydown', (e) => {
    const z = e.target.closest('.zona');
    if (z && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      elegir(z.dataset.ccaa, { mover: true });
    }
  });
  select.addEventListener('change', () => select.value && elegir(select.value, { mover: true }));

  const inicial = decodeURIComponent(location.hash.slice(1));
  let guardada = '';
  try { guardada = localStorage.getItem(CLAVE_CCAA) ?? ''; } catch {}
  if (RENTA_CCAA[inicial]) elegir(inicial);
  else if (RENTA_CCAA[guardada]) elegir(guardada, { guardar: false });
}

iniciar();
