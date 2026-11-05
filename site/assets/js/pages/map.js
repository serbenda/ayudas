// Mapa de España: pulsas tu comunidad y salen sus ayudas, con cómo se piden allí

import { MAP, SHAPES, CENTRES } from '../data/map-shapes.js';
import { REGIONS } from '../data/benefits.js';
import { MINIMUM_INCOME } from '../data/regions.js';
import { esc } from '../ui/card.js';
import { regionPanel } from '../ui/region-panel.js';

const REGION_KEY = 'ayudas:ccaa';
const SMALL_REGIONS = new Set(['ceuta', 'melilla']);

export function mapSvg() {
  const { canarias: k } = MAP;
  const zones = REGIONS.filter((c) => SHAPES[c.id]).map((c) => {
    const [x, y] = CENTRES[c.id];
    // Ceuta y Melilla son diminutas: se añade un círculo grande para poder pulsarlas
    const dot = SMALL_REGIONS.has(c.id) ? `<circle class="punto" cx="${x}" cy="${y}" r="16"/>` : '';
    return `<g class="zona" data-region="${c.id}" tabindex="0" role="button" aria-pressed="false" aria-label="${esc(c.name)}">
      <title>${esc(c.name)}</title><path d="${SHAPES[c.id]}"/>${dot}</g>`;
  }).join('');
  return `<svg class="mapa-svg" viewBox="0 0 ${MAP.width} ${MAP.high}" role="group" aria-label="Mapa de España por comunidades">
    <rect class="recuadro" x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="8"/>
    ${zones}
  </svg>`;
}

function init() {
  const box = document.getElementById('mapa');
  if (!box) return;
  const panel = document.getElementById('panel-ccaa');
  const select = document.getElementById('mapa-ccaa');
  box.innerHTML = mapSvg();
  for (const c of REGIONS) select.add(new Option(c.name, c.id));

  function choose(id, { moveFocus = false, save = true } = {}) {
    if (!MINIMUM_INCOME[id]) return;
    select.value = id;
    box.querySelectorAll('.zona').forEach((z) => z.setAttribute('aria-pressed', String(z.dataset.region === id)));
    if (save) {
      try { localStorage.setItem(REGION_KEY, id); } catch {}
      history.replaceState(null, '', `#${id}`);
    }
    panel.innerHTML = regionPanel(id);
    panel.hidden = false;
    if (moveFocus) panel.focus({ preventScroll: false });
  }

  box.addEventListener('click', (e) => {
    const z = e.target.closest('.zona');
    if (z) choose(z.dataset.region, { moveFocus: true });
  });
  box.addEventListener('keydown', (e) => {
    const z = e.target.closest('.zona');
    if (z && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      choose(z.dataset.region, { moveFocus: true });
    }
  });
  select.addEventListener('change', () => select.value && choose(select.value, { moveFocus: true }));

  const initial = decodeURIComponent(location.hash.slice(1));
  let savedVoice = '';
  try { savedVoice = localStorage.getItem(REGION_KEY) ?? ''; } catch {}
  if (MINIMUM_INCOME[initial]) choose(initial);
  else if (MINIMUM_INCOME[savedVoice]) choose(savedVoice, { save: false });
}

init();
