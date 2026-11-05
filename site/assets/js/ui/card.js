// La ficha de una ayuda, igual en todas las páginas: qué es, por qué te sale, cómo se pide paso a paso,
// papeles, teléfonos, plazos y qué hacer si te dicen que no.

import { BY_ID, REGIONS, linkOf } from '../data/benefits.js';
import { procedureOf } from '../data/procedures.js';
import { DOCUMENTS, PHONES, GLOSSARY, termsIn, markTerms, tel } from '../data/guide.js';
import { icon } from '../data/icons.js';
import { EXAMPLES, TABLES } from '../data/examples.js';
import { thresholdOf, members } from '../lib/rules.js';
import { minimumIncomeAmount } from '../data/regions.js';
import { deductionsOf } from '../data/deductions.js';
import { reviewedText } from '../data/review.js';
import { euros } from '../lib/format.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const TRACKING_STATES = [
  ['', 'Sin pedir'],
  ['pedida', 'Pedida'],
  ['concedida', 'Concedida'],
  ['denegada', 'Me la han denegado'],
];

/** Botón de llamar para un teléfono */
export function phoneButton(key) {
  const t = PHONES[key];
  if (!t) return '';
  return `<a class="llamar" href="${tel(t.number)}"><span class="llamar-icono">${icon('telefono')}</span><span><strong>${esc(t.number)}</strong> ${esc(t.text)}${t.free ? ' <em>(gratis)</em>' : ''}<small>${esc(t.when)}</small></span></a>`;
}

/** Barra «tu cifra frente al límite» */
export function thresholdBar(u) {
  if (!u) return '';
  const max = Math.max(u.yours, u.limit) * 1.15 || 1;
  const inside = u.yours < u.limit;
  const difference = Math.abs(u.limit - u.yours);
  const pct = (n) => `${Math.min(100, (n / max) * 100).toFixed(1)}%`;
  const limitLabel = u.text ?? 'límite';
  const sentence = inside
    ? `Estás ${euros(difference)} por debajo del ${limitLabel}.`
    : `Te pasas ${euros(difference)} del ${limitLabel}.`;
  return `<figure class="umbral ${inside ? 'dentro' : 'fuera'}">
    <figcaption>${esc(u.which)}: <strong>${euros(u.yours)}</strong> · ${esc(limitLabel.charAt(0).toUpperCase() + limitLabel.slice(1))}: <strong>${euros(u.limit)}</strong></figcaption>
    <div class="umbral-pista" role="img" aria-label="${esc(`${u.which}: ${euros(u.yours)}. ${limitLabel}: ${euros(u.limit)}. ${sentence}`)}">
      <span class="umbral-tuyo" style="width:${pct(u.yours)}"></span>
      <span class="umbral-limite" style="left:${pct(u.limit)}"><i>${esc(limitLabel)}</i></span>
    </div>
    <p>${esc(sentence)}</p>
  </figure>`;
}

/** Barras «cuánto según tu caso» */
export function tableBars(table, highlight = -1) {
  if (!table) return '';
  const max = Math.max(...table.rows.map((f) => f.figure));
  return `<figure class="tabla-barras">
    <figcaption>${esc(table.title)}</figcaption>
    <ul>${table.rows
      .map((f, i) => `<li${i === highlight ? ' class="tu-caso"' : ''}><span class="tb-etiqueta">${esc(f.label)}${i === highlight ? ' <em>(tu caso)</em>' : ''}</span><span class="tb-pista"><span class="tb-barra" style="width:${((f.figure / max) * 100).toFixed(1)}%"></span></span><strong>${euros(f.figure)}</strong></li>`)
      .join('')}</ul>
    ${table.note ? `<p class="nota">${esc(table.note)}</p>` : ''}
  </figure>`;
}

/** Un ejemplo con persona y cuentas */
export function exampleBox(id) {
  const e = EXAMPLES[id]?.();
  if (!e) return '';
  return `<aside class="ejemplo"><h5>Un ejemplo</h5><p class="ej-quien">${esc(e.who)}</p><ul>${e.accounts.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><p class="ej-resultado">${esc(e.result)}</p></aside>`;
}

/**
 * @param {string} id
 * @param {{ resultado?: object, ccaa?: string|null, seguimiento?: string, abierta?: boolean, perfil?: object }} op
 */
// Deducciones de la comunidad elegida: las cantidades que tenemos comprobadas y el resto, por su nombre
function deductionsBlock(region) {
  const d = deductionsOf(region);
  if (!d) return '';
  const name = esc(REGIONS.find((c) => c.id === region)?.name ?? '');
  if (d.foral) return `<p><strong>En ${name}</strong> el IRPF es foral: sus deducciones están en <a href="${d.foral.url}" rel="noopener">${esc(d.foral.name)}</a>.</p>`;
  return `<div class="deducciones"><p><strong>En ${name}:</strong></p>
    ${d.figures.length ? `<ul>${d.figures.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${d.otras.length ? `<p>${d.figures.length ? 'También hay deducciones por' : 'Hay deducciones por'}: ${d.otras.map((x) => esc(x[0].toLowerCase() + x.slice(1))).join(', ')}.</p>` : ''}
    <p><a href="${d.url}" rel="noopener">Cantidades y requisitos de cada una, en la Agencia Tributaria</a></p></div>`;
}

export function benefitCard(id, { result = null, region = null, tracking, isOpen = false, profile = null } = {}) {
  const a = BY_ID[id];
  const t = procedureOf(id, region);
  const link = linkOf(a, region);
  const r = result;
  const label = r ? (r.status === 'si' ? 'Cumples lo principal' : 'Mira si cumples') : '';
  const fullText = [a.summary, a.amount, ...a.requirements, ...t.steps, t.deadline, t.response, ...(t.warnings ?? [])].join(' ');
  const terms = termsIn(fullText);
  // Palabras difíciles: se pueden pulsar para ver qué significan (la primera vez que salen en la ficha)
  const used = new Set();
  const ex = (text) => markTerms(esc(text), used);
  const track = tracking !== undefined
    ? `<label class="seguir">¿Cómo va?
        <select data-track="${id}">${TRACKING_STATES.map(([v, n]) => `<option value="${v}"${v === tracking ? ' selected' : ''}>${n}</option>`).join('')}</select>
      </label>`
    : '';
  const trackingMark = tracking ? `<span class="marca-seguir ${tracking}">${esc(TRACKING_STATES.find(([v]) => v === tracking)?.[1] ?? '')}</span>` : '';

  return `
  <li id="ayuda-${id}">
    <details class="ayuda"${r ? ` data-estado="${r.status}"` : ''}${isOpen ? ' open' : ''}>
      <summary>
        <span class="ayuda-nombre">${esc(a.name)}</span>
        <p class="ayuda-importe">${r?.payment?.text ? esc(r.payment.text) : ''}</p>
        <p class="ayuda-resumen">${r ? `<span class="estado ${r.status}">${label}</span> ` : ''}${trackingMark}<span class="solo-normal">${esc(a.summary)}</span><span class="solo-facil">${t.easy.map(esc).join(' ')}</span></p>
      </summary>
      <div class="ayuda-detalle">
        <button type="button" class="escuchar" data-read="${esc([a.name, r?.payment?.text ?? '', ...t.easy, 'Cómo se pide.', ...t.steps].filter(Boolean).join('. '))}">${icon('altavoz')} Escuchar esta ayuda</button>
        ${r?.reasons.length ? `<div><h4>¿Por qué me sale?</h4><ul class="motivos">${r.reasons.map((m) => `<li>${ex(m)}</li>`).join('')}</ul>${profile ? thresholdBar(thresholdOf(id, profile)) : ''}</div>` : ''}
        ${r?.check.length ? `<div><h4>¿Qué tengo que comprobar?</h4><ul class="comprobar">${r.check.map((m) => `<li>${ex(m)}</li>`).join('')}</ul></div>` : ''}
        <div><h4>¿Cuánto dan?</h4><p>${ex(a.amount)}</p>${id === 'deducciones-ccaa' ? deductionsBlock(region) : ''}${id === 'renta-minima' && minimumIncomeAmount(region) ? `<p><strong>En ${esc(REGIONS.find((c) => c.id === region)?.name ?? '')}:</strong> ${esc(minimumIncomeAmount(region))}</p>` : ''}${tableBars(TABLES[id]?.(), id === 'imv' && profile ? Math.min(members(profile), 5) - 1 : -1)}${exampleBox(id)}</div>
        <div class="solo-normal"><h4>¿Quién puede pedirla?</h4><ul>${a.requirements.map((m) => `<li>${ex(m)}</li>`).join('')}</ul></div>
        <div class="como">
          <h4>¿Cómo la pido? Paso a paso</h4>
          <ol class="pasos-tramite">${t.steps.map((p) => `<li>${ex(p)}</li>`).join('')}</ol>
          <p class="sin-internet">${icon('escudo')} ${esc(t.stepsNote)}</p>
        </div>
        ${t.phones.length ? `<div><h4>¿A quién llamo?</h4><div class="llamadas">${t.phones.map(phoneButton).join('')}</div></div>` : ''}
        ${t.documents.length ? `<div><h4>¿Qué papeles llevo?</h4><ul class="papeles">${t.documents.map((d) => `<li><strong>${esc(DOCUMENTS[d].name)}</strong>. ${ex(DOCUMENTS[d].benefit)}</li>`).join('')}</ul></div>` : ''}
        <dl class="plazos">
          <div><dt>¿Cuándo la pido?</dt><dd>${ex(t.deadline)}</dd></div>
          <div><dt>¿Cuánto tardan? ¿Y si me dicen que no?</dt><dd>${ex(t.response)}</dd></div>
        </dl>
        ${t.warnings?.length ? `<div class="ojo"><h4>Importante</h4><ul>${t.warnings.map((m) => `<li>${ex(m)}</li>`).join('')}</ul></div>` : ''}
        ${terms.length ? `<details class="glosario"><summary>Palabras difíciles de esta ayuda</summary><dl>${terms.map((k) => `<div><dt>${esc(k)}</dt><dd>${esc(GLOSSARY[k])}</dd></div>`).join('')}</dl><p><a href="/palabras/">Todas las palabras difíciles, explicadas</a></p></details>` : ''}
        <p class="ayuda-pie"><span>${esc(a.scope)} · ${esc(a.agency)}<br><small class="revisado">Revisado en ${reviewedText(id)}</small></span>${track}<a class="boton secundario" href="/ayuda/${id}/">Ficha para guardar<span class="oculto"> de ${esc(a.name)}</span></a>${link.url ? `<a class="boton secundario" href="${esc(link.url)}" rel="noopener" target="_blank">Web oficial<span class="oculto"> (${esc(link.text)}, se abre en otra pestaña)</span></a>` : ''}</p>
      </div>
    </details>
  </li>`;
}
