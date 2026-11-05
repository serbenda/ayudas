// Gráfico de líneas: cómo han subido las ayudas (euros al mes). SVG para las líneas, HTML para los textos.
// Un solo eje (todo en €/mes), leyenda + etiquetas directas, tooltip al pasar el dedo y tabla con los datos.

import { EVOLUCION } from '../data/figures.js';
import { euros } from '../lib/format.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function pintarEvolucion(caja) {
  if (!caja) return;
  const { años, series } = EVOLUCION;
  const max = 1300;
  const W = 1000;
  const H = 400;
  const x = (i) => (i / (años.length - 1)) * W;
  const y = (v) => H - (v / max) * H;
  const rejilla = [0, 250, 500, 750, 1000, 1250];

  const lineas = series
    .map((s) => {
      const puntos = s.valores.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
      return `<polyline class="serie s-${s.id}" points="${puntos.join(' ')}"/>`;
    })
    .join('');
  const ultimos = series.map((s) => ({ s, v: s.valores.at(-1) }));
  // Etiquetas al final de cada línea, separadas para que no se pisen
  const posiciones = ultimos.map((u) => ({ ...u, top: y(u.v) })).sort((a, b) => a.top - b.top);
  for (let i = 1; i < posiciones.length; i++) if (posiciones[i].top - posiciones[i - 1].top < 34) posiciones[i].top = posiciones[i - 1].top + 34;

  const subida = (s) => {
    const primero = s.valores.find((v) => v != null);
    return Math.round((s.valores.at(-1) / primero - 1) * 100);
  };

  caja.innerHTML = `
    <ul class="leyenda">${series.map((s) => `<li><i class="s-${s.id}"></i>${esc(s.nombre)}</li>`).join('')}</ul>
    <div class="grafico" data-grafico>
      <div class="lienzo">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          ${rejilla.map((v) => `<line class="rejilla" x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}
          ${lineas}
          <line class="cursor" x1="0" x2="0" y1="0" y2="${H}" hidden/>
        </svg>
        ${rejilla.map((v) => `<span class="eje eje-y" style="top:${(y(v) / H) * 100}%">${v.toLocaleString('es-ES')} €</span>`).join('')}
        ${años.map((a, i) => (i % 2 === 0 || i === años.length - 1 ? `<span class="eje eje-x" style="left:${(x(i) / W) * 100}%">${a}</span>` : '')).join('')}
        ${posiciones.map((p) => `<span class="etiqueta-final" style="top:${(p.top / H) * 100}%"><i class="s-${p.s.id}"></i>${esc(p.s.nombre)} <b>${euros(p.v)}</b></span>`).join('')}
        <div class="tooltip" role="status" hidden></div>
      </div>
    </div>
    <div class="subidas">${series.map((s) => `<div class="subida"><span><i class="s-${s.id}"></i>${esc(s.nombre)}</span><strong>${subida(s) > 0 ? '+' : ''}${subida(s)} %</strong><small>desde ${años[s.valores.findIndex((v) => v != null)]}</small></div>`).join('')}</div>
    <details class="tabla-datos">
      <summary>Ver los datos en una tabla</summary>
      <div class="tabla-scroll" tabindex="0" role="region" aria-label="Datos del gráfico, año a año"><table>
        <thead><tr><th scope="col">Año</th>${series.map((s) => `<th scope="col">${esc(s.nombre)}</th>`).join('')}</tr></thead>
        <tbody>${años.map((a, i) => `<tr><th scope="row">${a}</th>${series.map((s) => `<td>${s.valores[i] == null ? '—' : euros(s.valores[i])}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="nota">${series.map((s) => `${esc(s.nombre)}: ${esc(s.nota)}.`).join(' ')}</p>
    </details>`;

  // Tooltip: el año más cercano al dedo o al ratón
  const lienzo = caja.querySelector('.lienzo');
  const tip = caja.querySelector('.tooltip');
  const cursor = caja.querySelector('.cursor');
  const mover = (clientX) => {
    const r = lienzo.getBoundingClientRect();
    const i = Math.round(((clientX - r.left) / r.width) * (años.length - 1));
    if (i < 0 || i >= años.length) return;
    cursor.removeAttribute('hidden');
    cursor.setAttribute('x1', x(i));
    cursor.setAttribute('x2', x(i));
    tip.hidden = false;
    tip.innerHTML = `<strong>${años[i]}</strong>${series.map((s) => `<span><i class="s-${s.id}"></i>${esc(s.nombre)}: <b>${s.valores[i] == null ? 'no existía' : euros(s.valores[i])}</b></span>`).join('')}`;
    const izquierda = (x(i) / W) * r.width;
    tip.style.left = `${Math.min(Math.max(izquierda, 90), r.width - 90)}px`;
  };
  lienzo.addEventListener('pointermove', (e) => mover(e.clientX));
  lienzo.addEventListener('pointerdown', (e) => mover(e.clientX));
  lienzo.addEventListener('pointerleave', () => {
    tip.hidden = true;
    cursor.setAttribute('hidden', '');
  });
}
