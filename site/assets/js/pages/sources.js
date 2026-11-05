// Página de fuentes: tabla con las cifras que usa la web

import { CIFRAS, FUENTES_CIFRAS } from '../data/figures.js';
import { pintarEvolucion } from '../ui/evolution-chart.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

document.getElementById('año').textContent = CIFRAS.año;
const fecha = new Date(`${CIFRAS.revisado}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
document.getElementById('revisado').textContent = `Revisadas el ${fecha}. Cuando cambia una cifra oficial, se actualiza aquí y en todas las ayudas que la usan.`;
document.getElementById('tabla-cifras').innerHTML = FUENTES_CIFRAS.map((f) => `<tr><th scope="row">${esc(f.tema)}</th><td>${esc(f.valor)}</td><td><a href="${esc(f.url)}" rel="noopener">${esc(f.fuente)}</a></td></tr>`).join('');

pintarEvolucion(document.getElementById('evolucion'));
