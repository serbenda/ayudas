// La ficha de una ayuda, igual en todas las páginas: qué es, por qué te sale, cómo se pide paso a paso,
// papeles, teléfonos, plazos y qué hacer si te dicen que no.

import { POR_ID, enlaceDe } from './ayudas.js';
import { tramiteDe } from './tramites.js';
import { DOCUMENTOS, TELEFONOS, GLOSARIO, terminosEn, tel } from './guia.js';
import { icono } from './iconos.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ESTADOS_SEGUIMIENTO = [
  ['', 'Sin pedir'],
  ['pedida', 'Pedida'],
  ['concedida', 'Concedida'],
  ['denegada', 'Me la han denegado'],
];

/** Botón de llamar para un teléfono */
export function botonTelefono(clave) {
  const t = TELEFONOS[clave];
  if (!t) return '';
  return `<a class="llamar" href="${tel(t.numero)}"><span class="llamar-icono">${icono('telefono')}</span><span><strong>${esc(t.numero)}</strong> ${esc(t.texto)}${t.gratis ? ' <em>(gratis)</em>' : ''}<small>${esc(t.cuando)}</small></span></a>`;
}

/**
 * @param {string} id
 * @param {{ resultado?: object, ccaa?: string|null, seguimiento?: string, abierta?: boolean }} op
 */
export function tarjeta(id, { resultado = null, ccaa = null, seguimiento, abierta = false } = {}) {
  const a = POR_ID[id];
  const t = tramiteDe(id, ccaa);
  const enlace = enlaceDe(a, ccaa);
  const r = resultado;
  const etiqueta = r ? (r.estado === 'si' ? 'Cumples lo principal' : 'Mira si cumples') : '';
  const textoCompleto = [a.resumen, a.cuantia, ...a.requisitos, ...t.pasos, t.plazo, t.respuesta, ...(t.ojo ?? [])].join(' ');
  const terminos = terminosEn(textoCompleto);
  const seguir = seguimiento !== undefined
    ? `<label class="seguir">¿Cómo va?
        <select data-seguir="${id}">${ESTADOS_SEGUIMIENTO.map(([v, n]) => `<option value="${v}"${v === seguimiento ? ' selected' : ''}>${n}</option>`).join('')}</select>
      </label>`
    : '';
  const marcaSeguimiento = seguimiento ? `<span class="marca-seguir ${seguimiento}">${esc(ESTADOS_SEGUIMIENTO.find(([v]) => v === seguimiento)?.[1] ?? '')}</span>` : '';

  return `
  <li id="ayuda-${id}">
    <details class="ayuda"${r ? ` data-estado="${r.estado}"` : ''}${abierta ? ' open' : ''}>
      <summary>
        <span class="ayuda-nombre">${esc(a.nombre)}</span>
        <p class="ayuda-importe">${r?.importe?.texto ? esc(r.importe.texto) : ''}</p>
        <p class="ayuda-resumen">${r ? `<span class="estado ${r.estado}">${etiqueta}</span> ` : ''}${marcaSeguimiento}<span class="solo-normal">${esc(a.resumen)}</span><span class="solo-facil">${t.facil.map(esc).join(' ')}</span></p>
      </summary>
      <div class="ayuda-detalle">
        <button type="button" class="escuchar" data-leer="${esc([a.nombre, r?.importe?.texto ?? '', ...t.facil, 'Cómo se pide.', ...t.pasos].filter(Boolean).join('. '))}">${icono('altavoz')} Escuchar esta ayuda</button>
        ${r?.motivos.length ? `<div><h4>Por qué te sale</h4><ul class="motivos">${r.motivos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
        ${r?.comprobar.length ? `<div><h4>Qué falta comprobar</h4><ul class="comprobar">${r.comprobar.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
        <div><h4>Cuánto da en 2026</h4><p>${esc(a.cuantia)}</p></div>
        <div class="como">
          <h4>Cómo se pide, paso a paso</h4>
          <ol class="pasos-tramite">${t.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
          <p class="sin-internet">${icono('escudo')} ${esc(t.pasosAntes)}</p>
        </div>
        ${t.telefonos.length ? `<div><h4>A quién llamar</h4><div class="llamadas">${t.telefonos.map(botonTelefono).join('')}</div></div>` : ''}
        ${t.documentos.length ? `<div><h4>Papeles que necesitas</h4><ul class="papeles">${t.documentos.map((d) => `<li><strong>${esc(DOCUMENTOS[d].nombre)}</strong>. ${esc(DOCUMENTOS[d].ayuda)}</li>`).join('')}</ul></div>` : ''}
        <dl class="plazos">
          <div><dt>Cuándo pedirla</dt><dd>${esc(t.plazo)}</dd></div>
          <div><dt>Cuánto tardan y si te dicen que no</dt><dd>${esc(t.respuesta)}</dd></div>
        </dl>
        ${t.ojo?.length ? `<div class="ojo"><h4>Importante</h4><ul>${t.ojo.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
        <div class="solo-normal"><h4>Requisitos principales</h4><ul>${a.requisitos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
        ${terminos.length ? `<details class="glosario"><summary>Palabras difíciles de esta ayuda</summary><dl>${terminos.map((k) => `<div><dt>${esc(k)}</dt><dd>${esc(GLOSARIO[k])}</dd></div>`).join('')}</dl></details>` : ''}
        <p class="ayuda-pie"><span>${esc(a.ambito)} · ${esc(a.organismo)}</span>${seguir}${enlace.url ? `<a class="boton secundario" href="${esc(enlace.url)}" rel="noopener" target="_blank">Web oficial<span class="oculto"> (${esc(enlace.texto)}, se abre en otra pestaña)</span></a>` : ''}</p>
      </div>
    </details>
  </li>`;
}
