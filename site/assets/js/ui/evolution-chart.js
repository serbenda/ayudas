// Gráfico de líneas: cómo han subido las ayudas (euros al mes). SVG para las líneas, HTML para los textos.
// Un solo eje (todo en €/mes), leyenda + etiquetas directas, tooltip al pasar el dedo y tabla con los datos.

import { HISTORY } from '../data/figures.js';
import { euros } from '../lib/format.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function renderHistory(box) {
  if (!box) return;
  const { years, series } = HISTORY;
  const max = 1300;
  const W = 1000;
  const H = 400;
  const x = (i) => (i / (years.length - 1)) * W;
  const y = (v) => H - (v / max) * H;
  const rejilla = [0, 250, 500, 750, 1000, 1250];

  const lines = series
    .map((s) => {
      const points = s.valueList.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
      return `<polyline class="serie s-${s.id}" points="${points.join(' ')}"/>`;
    })
    .join('');
  const last = series.map((s) => ({ s, v: s.valueList.at(-1) }));
  // Etiquetas al final de cada línea, separadas para que no se pisen
  const positions = last.map((u) => ({ ...u, top: y(u.v) })).sort((a, b) => a.top - b.top);
  for (let i = 1; i < positions.length; i++) if (positions[i].top - positions[i - 1].top < 34) positions[i].top = positions[i - 1].top + 34;

  const rise = (s) => {
    const firstOne = s.valueList.find((v) => v != null);
    return Math.round((s.valueList.at(-1) / firstOne - 1) * 100);
  };

  box.innerHTML = `
    <ul class="leyenda">${series.map((s) => `<li><i class="s-${s.id}"></i>${esc(s.name)}</li>`).join('')}</ul>
    <div class="grafico" data-grafico>
      <div class="lienzo">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          ${rejilla.map((v) => `<line class="rejilla" x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}
          ${lines}
          <line class="cursor" x1="0" x2="0" y1="0" y2="${H}" hidden/>
        </svg>
        ${rejilla.map((v) => `<span class="eje eje-y" style="top:${(y(v) / H) * 100}%">${v.toLocaleString('es-ES')} €</span>`).join('')}
        ${years.map((a, i) => (i % 2 === 0 || i === years.length - 1 ? `<span class="eje eje-x" style="left:${(x(i) / W) * 100}%">${a}</span>` : '')).join('')}
        ${positions.map((p) => `<span class="etiqueta-final" style="top:${(p.top / H) * 100}%"><i class="s-${p.s.id}"></i>${esc(p.s.name)} <b>${euros(p.v)}</b></span>`).join('')}
        <div class="tooltip" role="status" hidden></div>
      </div>
    </div>
    <div class="subidas">${series.map((s) => `<div class="subida"><span><i class="s-${s.id}"></i>${esc(s.name)}</span><strong>${rise(s) > 0 ? '+' : ''}${rise(s)} %</strong><small>desde ${years[s.valueList.findIndex((v) => v != null)]}</small></div>`).join('')}</div>
    <details class="tabla-datos">
      <summary>Ver los datos en una tabla</summary>
      <div class="tabla-scroll" tabindex="0" role="region" aria-label="Datos del gráfico, año a año"><table>
        <thead><tr><th scope="col">Año</th>${series.map((s) => `<th scope="col">${esc(s.name)}</th>`).join('')}</tr></thead>
        <tbody>${years.map((a, i) => `<tr><th scope="row">${a}</th>${series.map((s) => `<td>${s.valueList[i] == null ? '—' : euros(s.valueList[i])}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="nota">${series.map((s) => `${esc(s.name)}: ${esc(s.note)}.`).join(' ')}</p>
    </details>`;

  // Tooltip: el año más cercano al dedo o al ratón
  const canvas = box.querySelector('.lienzo');
  const tip = box.querySelector('.tooltip');
  const cursor = box.querySelector('.cursor');
  const moveFocus = (clientX) => {
    const r = canvas.getBoundingClientRect();
    const i = Math.round(((clientX - r.left) / r.width) * (years.length - 1));
    if (i < 0 || i >= years.length) return;
    cursor.removeAttribute('hidden');
    cursor.setAttribute('x1', x(i));
    cursor.setAttribute('x2', x(i));
    tip.hidden = false;
    tip.innerHTML = `<strong>${years[i]}</strong>${series.map((s) => `<span><i class="s-${s.id}"></i>${esc(s.name)}: <b>${s.valueList[i] == null ? 'no existía' : euros(s.valueList[i])}</b></span>`).join('')}`;
    const leftSide = (x(i) / W) * r.width;
    tip.style.left = `${Math.min(Math.max(leftSide, 90), r.width - 90)}px`;
  };
  canvas.addEventListener('pointermove', (e) => moveFocus(e.clientX));
  canvas.addEventListener('pointerdown', (e) => moveFocus(e.clientX));
  canvas.addEventListener('pointerleave', () => {
    tip.hidden = true;
    cursor.setAttribute('hidden', '');
  });
}
