// Lo que se ve al elegir una comunidad: en el mapa y en la página propia de cada comunidad

import { REGIONS } from '../data/benefits.js';
import { MINIMUM_INCOME, benefitsOf, minimumIncomeAmount } from '../data/regions.js';
import { benefitCard, esc } from './card.js';

export const nameOf = (id) => REGIONS.find((c) => c.id === id)?.name ?? id;

export function regionPanel(id, { title = true } = {}) {
  const r = MINIMUM_INCOME[id];
  const { common, own, capital, cityName } = benefitsOf(id);
  const list = (ids) => `<ul class="benefit-list">${ids.map((x) => benefitCard(x, { region: id })).join('')}</ul>`;
  return `
    ${title ? `<h2 class="panel-title">${esc(nameOf(id))}</h2>` : ''}
    <div class="region-income">
      <p class="region-label">Aquí la renta mínima se llama</p>
      <p class="region-name">${esc(r.name)}</p>
      ${minimumIncomeAmount(id) ? `<p class="region-amount">${esc(minimumIncomeAmount(id))} Se cobra la diferencia con lo que ya entra en casa.</p>` : ''}
      ${r.note ? `<p>${esc(r.note)}</p>` : ''}
      <p><a href="${r.website}" rel="noopener">Web oficial de ${esc(nameOf(id))}</a> · <a href="/comunidad/${id}/">Página de ${esc(nameOf(id))}</a></p>
    </div>
    ${own.length ? `<h3 class="panel-sub">Solo en ${esc(nameOf(id))}</h3>${list(own)}` : ''}
    ${capital.length ? `<h3 class="panel-sub">Si vives en ${esc(cityName)}</h3>${list(capital)}` : ''}
    <h3 class="panel-sub">Se piden en ${esc(nameOf(id))}</h3>
    <p class="panel-note">Son para toda España, pero las tramita tu comunidad. Pulsa cada una para ver los pasos.</p>
    ${list(common)}
    <p class="panel-note">Además están las ayudas del Estado, que son iguales en toda España: <a href="/catalogo/">verlas todas</a>, o <a href="/">contesta unas preguntas</a> y te decimos cuáles te tocan.</p>`;
}
