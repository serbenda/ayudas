// La ficha de una ayuda, igual en todas las páginas: qué es, por qué te sale, cómo se pide paso a paso,
// papeles, teléfonos, plazos y qué hacer si te dicen que no.

import { POR_ID, COMUNIDADES, enlaceDe } from './ayudas.js';
import { tramiteDe } from './tramites.js';
import { DOCUMENTOS, TELEFONOS, GLOSARIO, terminosEn, marcarTerminos, tel } from './guia.js';
import { icono } from './iconos.js';
import { EJEMPLOS, TABLAS } from './ejemplos.js';
import { umbralDe, miembros } from './reglas.js';
import { cuantiaRenta } from './comunidades.js';
import { deduccionesDe } from './deducciones.js';
import { textoRevisado } from './revision.js';
import { euros } from './formato.js';

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

/** Barra «tu cifra frente al límite» */
export function barraUmbral(u) {
  if (!u) return '';
  const max = Math.max(u.tuyo, u.limite) * 1.15 || 1;
  const dentro = u.tuyo < u.limite;
  const diferencia = Math.abs(u.limite - u.tuyo);
  const pct = (n) => `${Math.min(100, (n / max) * 100).toFixed(1)}%`;
  const etiquetaLimite = u.texto ?? 'límite';
  const frase = dentro
    ? `Estás ${euros(diferencia)} por debajo del ${etiquetaLimite}.`
    : `Te pasas ${euros(diferencia)} del ${etiquetaLimite}.`;
  return `<figure class="umbral ${dentro ? 'dentro' : 'fuera'}">
    <figcaption>${esc(u.que)}: <strong>${euros(u.tuyo)}</strong> · ${esc(etiquetaLimite.charAt(0).toUpperCase() + etiquetaLimite.slice(1))}: <strong>${euros(u.limite)}</strong></figcaption>
    <div class="umbral-pista" role="img" aria-label="${esc(`${u.que}: ${euros(u.tuyo)}. ${etiquetaLimite}: ${euros(u.limite)}. ${frase}`)}">
      <span class="umbral-tuyo" style="width:${pct(u.tuyo)}"></span>
      <span class="umbral-limite" style="left:${pct(u.limite)}"><i>${esc(etiquetaLimite)}</i></span>
    </div>
    <p>${esc(frase)}</p>
  </figure>`;
}

/** Barras «cuánto según tu caso» */
export function barrasTabla(tabla, resaltar = -1) {
  if (!tabla) return '';
  const max = Math.max(...tabla.filas.map((f) => f.cifra));
  return `<figure class="tabla-barras">
    <figcaption>${esc(tabla.titulo)}</figcaption>
    <ul>${tabla.filas
      .map((f, i) => `<li${i === resaltar ? ' class="tu-caso"' : ''}><span class="tb-etiqueta">${esc(f.etiqueta)}${i === resaltar ? ' <em>(tu caso)</em>' : ''}</span><span class="tb-pista"><span class="tb-barra" style="width:${((f.cifra / max) * 100).toFixed(1)}%"></span></span><strong>${euros(f.cifra)}</strong></li>`)
      .join('')}</ul>
    ${tabla.nota ? `<p class="nota">${esc(tabla.nota)}</p>` : ''}
  </figure>`;
}

/** Un ejemplo con persona y cuentas */
export function cajaEjemplo(id) {
  const e = EJEMPLOS[id]?.();
  if (!e) return '';
  return `<aside class="ejemplo"><h5>Un ejemplo</h5><p class="ej-quien">${esc(e.quien)}</p><ul>${e.cuentas.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><p class="ej-resultado">${esc(e.resultado)}</p></aside>`;
}

/**
 * @param {string} id
 * @param {{ resultado?: object, ccaa?: string|null, seguimiento?: string, abierta?: boolean, perfil?: object }} op
 */
// Deducciones de la comunidad elegida: las cantidades que tenemos comprobadas y el resto, por su nombre
function bloqueDeducciones(ccaa) {
  const d = deduccionesDe(ccaa);
  if (!d) return '';
  const nombre = esc(COMUNIDADES.find((c) => c.id === ccaa)?.nombre ?? '');
  if (d.foral) return `<p><strong>En ${nombre}</strong> el IRPF es foral: sus deducciones están en <a href="${d.foral.url}" rel="noopener">${esc(d.foral.nombre)}</a>.</p>`;
  return `<div class="deducciones"><p><strong>En ${nombre}:</strong></p>
    ${d.cifras.length ? `<ul>${d.cifras.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${d.otras.length ? `<p>${d.cifras.length ? 'También hay deducciones por' : 'Hay deducciones por'}: ${d.otras.map((x) => esc(x[0].toLowerCase() + x.slice(1))).join(', ')}.</p>` : ''}
    <p><a href="${d.url}" rel="noopener">Cantidades y requisitos de cada una, en la Agencia Tributaria</a></p></div>`;
}

export function tarjeta(id, { resultado = null, ccaa = null, seguimiento, abierta = false, perfil = null } = {}) {
  const a = POR_ID[id];
  const t = tramiteDe(id, ccaa);
  const enlace = enlaceDe(a, ccaa);
  const r = resultado;
  const etiqueta = r ? (r.estado === 'si' ? 'Cumples lo principal' : 'Mira si cumples') : '';
  const textoCompleto = [a.resumen, a.cuantia, ...a.requisitos, ...t.pasos, t.plazo, t.respuesta, ...(t.ojo ?? [])].join(' ');
  const terminos = terminosEn(textoCompleto);
  // Palabras difíciles: se pueden pulsar para ver qué significan (la primera vez que salen en la ficha)
  const usados = new Set();
  const ex = (texto) => marcarTerminos(esc(texto), usados);
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
        ${r?.motivos.length ? `<div><h4>¿Por qué me sale?</h4><ul class="motivos">${r.motivos.map((m) => `<li>${ex(m)}</li>`).join('')}</ul>${perfil ? barraUmbral(umbralDe(id, perfil)) : ''}</div>` : ''}
        ${r?.comprobar.length ? `<div><h4>¿Qué tengo que comprobar?</h4><ul class="comprobar">${r.comprobar.map((m) => `<li>${ex(m)}</li>`).join('')}</ul></div>` : ''}
        <div><h4>¿Cuánto dan?</h4><p>${ex(a.cuantia)}</p>${id === 'deducciones-ccaa' ? bloqueDeducciones(ccaa) : ''}${id === 'renta-minima' && cuantiaRenta(ccaa) ? `<p><strong>En ${esc(COMUNIDADES.find((c) => c.id === ccaa)?.nombre ?? '')}:</strong> ${esc(cuantiaRenta(ccaa))}</p>` : ''}${barrasTabla(TABLAS[id]?.(), id === 'imv' && perfil ? Math.min(miembros(perfil), 5) - 1 : -1)}${cajaEjemplo(id)}</div>
        <div class="solo-normal"><h4>¿Quién puede pedirla?</h4><ul>${a.requisitos.map((m) => `<li>${ex(m)}</li>`).join('')}</ul></div>
        <div class="como">
          <h4>¿Cómo la pido? Paso a paso</h4>
          <ol class="pasos-tramite">${t.pasos.map((p) => `<li>${ex(p)}</li>`).join('')}</ol>
          <p class="sin-internet">${icono('escudo')} ${esc(t.pasosAntes)}</p>
        </div>
        ${t.telefonos.length ? `<div><h4>¿A quién llamo?</h4><div class="llamadas">${t.telefonos.map(botonTelefono).join('')}</div></div>` : ''}
        ${t.documentos.length ? `<div><h4>¿Qué papeles llevo?</h4><ul class="papeles">${t.documentos.map((d) => `<li><strong>${esc(DOCUMENTOS[d].nombre)}</strong>. ${ex(DOCUMENTOS[d].ayuda)}</li>`).join('')}</ul></div>` : ''}
        <dl class="plazos">
          <div><dt>¿Cuándo la pido?</dt><dd>${ex(t.plazo)}</dd></div>
          <div><dt>¿Cuánto tardan? ¿Y si me dicen que no?</dt><dd>${ex(t.respuesta)}</dd></div>
        </dl>
        ${t.ojo?.length ? `<div class="ojo"><h4>Importante</h4><ul>${t.ojo.map((m) => `<li>${ex(m)}</li>`).join('')}</ul></div>` : ''}
        ${terminos.length ? `<details class="glosario"><summary>Palabras difíciles de esta ayuda</summary><dl>${terminos.map((k) => `<div><dt>${esc(k)}</dt><dd>${esc(GLOSARIO[k])}</dd></div>`).join('')}</dl><p><a href="/palabras/">Todas las palabras difíciles, explicadas</a></p></details>` : ''}
        <p class="ayuda-pie"><span>${esc(a.ambito)} · ${esc(a.organismo)}<br><small class="revisado">Revisado en ${textoRevisado(id)}</small></span>${seguir}<a class="boton secundario" href="/ayuda/${id}/">Ficha para guardar<span class="oculto"> de ${esc(a.nombre)}</span></a>${enlace.url ? `<a class="boton secundario" href="${esc(enlace.url)}" rel="noopener" target="_blank">Web oficial<span class="oculto"> (${esc(enlace.texto)}, se abre en otra pestaña)</span></a>` : ''}</p>
      </div>
    </details>
  </li>`;
}
