// Sources page: table with the figures the site uses

import { FIGURES, FIGURE_SOURCES } from '../data/figures.js';
import { renderHistory } from '../ui/evolution-chart.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

document.getElementById('year').textContent = FIGURES.yearly;
const date = new Date(`${FIGURES.reviewed}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
document.getElementById('reviewed').textContent = `Revisadas el ${date}. Cuando cambia una cifra oficial, se actualiza aquí y en todas las ayudas que la usan.`;
document.getElementById('figures-table').innerHTML = FIGURE_SOURCES.map((f) => `<tr><th scope="row">${esc(f.topic)}</th><td>${esc(f.fieldValue)}</td><td><a href="${esc(f.url)}" rel="noopener">${esc(f.source)}</a></td></tr>`).join('');

renderHistory(document.getElementById('evolution'));
