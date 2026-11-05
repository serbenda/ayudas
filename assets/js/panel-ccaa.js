// Lo que se ve al elegir una comunidad: en el mapa y en la página propia de cada comunidad

import { COMUNIDADES } from './ayudas.js';
import { RENTA_CCAA, ayudasDe } from './comunidades.js';
import { tarjeta, esc } from './tarjeta.js';

export const nombreDe = (id) => COMUNIDADES.find((c) => c.id === id)?.nombre ?? id;

export function panelDe(id, { titulo = true } = {}) {
  const r = RENTA_CCAA[id];
  const { comunes, propias, capital, nombreCapital } = ayudasDe(id);
  const lista = (ids) => `<ul class="lista-ayudas">${ids.map((x) => tarjeta(x, { ccaa: id })).join('')}</ul>`;
  return `
    ${titulo ? `<h2 class="panel-titulo">${esc(nombreDe(id))}</h2>` : ''}
    <div class="ccaa-renta">
      <p class="ccaa-etiqueta">Aquí la renta mínima se llama</p>
      <p class="ccaa-nombre">${esc(r.nombre)}</p>
      ${r.nota ? `<p>${esc(r.nota)}</p>` : ''}
      <p><a href="${r.sede}" rel="noopener">Web oficial de ${esc(nombreDe(id))}</a> · <a href="/comunidad/${id}/">Página de ${esc(nombreDe(id))}</a></p>
    </div>
    ${propias.length ? `<h3 class="panel-sub">Solo en ${esc(nombreDe(id))}</h3>${lista(propias)}` : ''}
    ${capital.length ? `<h3 class="panel-sub">Si vives en ${esc(nombreCapital)}</h3>${lista(capital)}` : ''}
    <h3 class="panel-sub">Se piden en ${esc(nombreDe(id))}</h3>
    <p class="panel-nota">Son para toda España, pero las tramita tu comunidad. Pulsa cada una para ver los pasos.</p>
    ${lista(comunes)}
    <p class="panel-nota">Además están las ayudas del Estado, que son iguales en toda España: <a href="/catalogo/">verlas todas</a>, o <a href="/">contesta unas preguntas</a> y te decimos cuáles te tocan.</p>`;
}
