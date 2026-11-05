// Portada: el cuestionario por pasos y la lista de ayudas que salen.
// Nada se envía: las respuestas solo viven en esta página (y en el navegador si marcas «recordar»).

import { evaluar, perfilVacio, totalHijos, porDondeEmpezar } from './reglas.js';
import { AYUDAS, POR_ID, CATEGORIAS, COMUNIDADES } from './ayudas.js';
import { papelesPara, tramiteDe } from './tramites.js';
import { DOCUMENTOS } from './guia.js';
import { leerNumero } from './formato.js';
import { icono } from './iconos.js';
import { tarjeta, botonTelefono, esc } from './tarjeta.js';
import { pintarEvolucion } from './evolucion.js';

const form = document.getElementById('cuestionario');
const pasos = [...form.querySelectorAll('.paso')];
const botonesPaso = [...document.querySelectorAll('#pasos [data-ir]')];
const atras = document.getElementById('atras');
const siguiente = document.getElementById('siguiente');
const saltar = document.getElementById('saltar');
const resultados = document.getElementById('resultados');
const lista = document.getElementById('lista');
const recordar = document.getElementById('recordar');
const personasCaja = document.getElementById('personas');
const CLAVE = 'ayudas:respuestas';
const CLAVE_SEGUIR = 'ayudas:seguimiento';
let seguimiento = {};
const ORDEN = Object.fromEntries(AYUDAS.map((a, i) => [a.id, i]));

let pasoActual = 1;
let visitados = new Set([1]);
let filtro = 'todas';
let monoparentalTocado = false;

// ── Comunidades ─────────────────────────────────────────────────────────
const selectCcaa = document.getElementById('ccaa');
for (const c of COMUNIDADES) selectCcaa.add(new Option(c.nombre, c.id));

// ── Pasos ───────────────────────────────────────────────────────────────
function irA(n, { foco = true } = {}) {
  pasoActual = Math.min(Math.max(n, 1), pasos.length);
  visitados.add(pasoActual);
  pasos.forEach((p, i) => (p.hidden = i + 1 !== pasoActual));
  botonesPaso.forEach((b, i) => {
    if (i + 1 === pasoActual) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
    b.classList.toggle('hecho', visitados.has(i + 1) && i + 1 !== pasoActual);
  });
  atras.hidden = pasoActual === 1;
  siguiente.textContent = pasoActual === pasos.length ? 'Ver mis ayudas' : 'Siguiente';
  if (foco) {
    const legend = pasos[pasoActual - 1].querySelector('legend');
    form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    legend.setAttribute('tabindex', '-1');
    legend.focus({ preventScroll: true });
  }
}

botonesPaso.forEach((b) => b.addEventListener('click', () => irA(Number(b.dataset.ir))));
atras.addEventListener('click', () => irA(pasoActual - 1));
siguiente.addEventListener('click', () => (pasoActual === pasos.length ? mostrarResultados() : irA(pasoActual + 1)));
saltar.addEventListener('click', mostrarResultados);

// ── Contadores − / + ────────────────────────────────────────────────────
form.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sumar], [data-restar]');
  if (!b) return;
  const input = document.getElementById(b.dataset.sumar ?? b.dataset.restar);
  const v = Number(input.value) || 0;
  const n = b.dataset.sumar ? v + 1 : v - 1;
  input.value = Math.min(Math.max(n, Number(input.min) || 0), Number(input.max) || 99);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

// ── Personas a cargo ────────────────────────────────────────────────────
function plantillaPersona(i) {
  const n = i + 1;
  return `
  <div class="persona" data-persona="${n}">
    <h3>Persona ${n}</h3>
    <div class="persona-campos">
      <label>¿Quién es?
        <select name="p${n}-relacion">
          <option value="padre">Mi padre o mi madre</option>
          <option value="hijo">Mi hijo o hija</option>
          <option value="pareja">Mi pareja</option>
          <option value="otro">Otro familiar</option>
        </select>
      </label>
      <label>Edad
        <input name="p${n}-edad" type="number" inputmode="numeric" min="0" max="120" class="corto">
      </label>
      <label>Discapacidad
        <select name="p${n}-discapacidad">
          <option value="no">No tiene</option>
          <option value="sin">Tiene limitaciones, sin certificado</option>
          <option value="33">Del 33 % al 64 %</option>
          <option value="65">Del 65 % al 74 %</option>
          <option value="75">Del 75 % o más</option>
        </select>
      </label>
      <label>Dependencia
        <select name="p${n}-dependencia">
          <option value="no">No necesita ayuda diaria</option>
          <option value="necesita">Necesita ayuda, sin reconocer</option>
          <option value="tramite">Pedida, en trámite</option>
          <option value="1">Grado I</option>
          <option value="2">Grado II</option>
          <option value="3">Grado III</option>
        </select>
      </label>
    </div>
    <label class="casilla"><input type="checkbox" name="p${n}-convive" checked><span>Vive conmigo</span></label>
    <label class="casilla"><input type="checkbox" name="p${n}-cuidoYo" checked><span>La cuido yo (o alguien de la familia)</span></label>
  </div>`;
}

function ajustarPersonas() {
  const n = Number(form.numCuidados.value) || 0;
  const actuales = personasCaja.children.length;
  for (let i = actuales; i < n; i++) personasCaja.insertAdjacentHTML('beforeend', plantillaPersona(i));
  for (let i = actuales; i > n; i--) personasCaja.lastElementChild.remove();
}

// ── Leer el formulario ──────────────────────────────────────────────────
const valor = (nombre) => form.elements[nombre]?.value ?? '';
const radio = (nombre) => form.querySelector(`input[name="${nombre}"]:checked`)?.value ?? null;
const siNo = (nombre) => {
  const v = radio(nombre);
  return v === 'si' ? true : v === 'no' ? false : null;
};
const entero = (nombre, def = 0) => {
  const n = parseInt(valor(nombre), 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
};
// ¿La pregunta está en juego? Solo cuentan las que se esconden por no aplicar, no las de otros pasos.
const visible = (el) => !el.closest('[data-si][hidden]');

export function leerPerfil() {
  const p = perfilVacio();
  p.edad = valor('edad') === '' ? null : entero('edad', null);
  p.ccaa = valor('ccaa') || null;
  p.madridCapital = p.ccaa === 'madrid' ? siNo('madridCapital') : null;
  p.residencia = radio('residencia') || null;
  p.situacion = radio('situacion');
  p.pareja = radio('pareja') === 'si';
  p.adultos = Math.max(1, entero('adultos', 1));
  p.hijos = { menor3: entero('hijos-menor3'), de3a5: entero('hijos-de3a5'), de6a17: entero('hijos-de6a17') };
  p.bebe = form.bebe.checked;
  p.monoparental = form.monoparental.checked && visible(form.monoparental);
  p.familiaNumerosa = visible(form.familiaNumerosa) ? valor('familiaNumerosa') : 'no';
  p.viudo = form.viudo.checked;
  p.ingresosHogar = leerNumero(valor('ingresosHogar'));
  p.ingresosPropios = visible(form.ingresosPropios) ? leerNumero(valor('ingresosPropios')) : p.ingresosHogar;
  const patrimonio = radio('patrimonio');
  p.patrimonioAlto = patrimonio === 'alto' ? true : patrimonio === 'bajo' ? false : null;
  p.vivienda = radio('vivienda');
  p.discapacidad = valor('discapacidad');
  p.dependencia = valor('dependencia');
  p.cuidados = [...personasCaja.children].map((el, i) => {
    const n = i + 1;
    const edad = valor(`p${n}-edad`);
    return {
      relacion: valor(`p${n}-relacion`),
      edad: edad === '' ? null : Number(edad),
      discapacidad: valor(`p${n}-discapacidad`),
      dependencia: valor(`p${n}-dependencia`),
      convive: form.elements[`p${n}-convive`].checked,
      cuidoYo: form.elements[`p${n}-cuidoYo`].checked,
    };
  });
  p.enfermedadGraveHijo = form.enfermedadGraveHijo.checked && visible(form.enfermedadGraveHijo);
  p.pension = valor('pension');
  const contributiva = ['jubilacion', 'viudedad', 'incapacidad'].includes(p.pension);
  p.pensionMes = contributiva ? leerNumero(valor('pensionMes')) : null;
  p.pensionDesde2021 = contributiva ? siNo('pensionDesde2021') : null;
  p.hijosTenidos = contributiva ? entero('hijosTenidos') : 0;
  p.cotizado15 = visible(form.querySelector('[name="cotizado15"]')) ? siNo('cotizado15') : null;
  p.cotizadoUnAño = visible(form.querySelector('[name="cotizadoUnAño"]')) ? siNo('cotizadoUnAño') : null;
  p.urgencias = Object.fromEntries(['comida', 'casaRiesgo', 'sinCasa', 'violencia', 'soledad'].map((k) => [k, form.elements[`u-${k}`].checked]));
  return p;
}

// ── Preguntas que solo salen cuando hacen falta ─────────────────────────
function actualizarCondiciones() {
  const p = leerPerfil();
  const n = totalHijos(p);
  const enParo = p.situacion === 'paro-cobrando' || p.situacion === 'paro-sin';
  const pideCotizado = (enParo && (p.edad ?? 0) >= 50) || (p.pension === 'no' && (p.edad ?? 0) >= 58);
  const reglas = {
    madrid: p.ccaa === 'madrid',
    monoparental: !p.pareja && n > 0,
    'familia-numerosa': n >= 2 || (n >= 1 && p.bebe),
    'ingresos-propios': p.adultos > 1 || p.pareja,
    hijos: n > 0,
    'pension-contributiva': ['jubilacion', 'viudedad', 'incapacidad'].includes(p.pension),
    'paro-sin': p.situacion === 'paro-sin',
    cotizado15: pideCotizado,
    'nada-paso5': p.pension === 'no' && !enParo && !pideCotizado,
  };
  for (const el of form.querySelectorAll('[data-si]')) el.hidden = !reglas[el.dataset.si];
  // Una persona sola con hijos: casi siempre es monoparental (se puede desmarcar)
  if (reglas.monoparental && !monoparentalTocado && radio('pareja') === 'no' && p.adultos === 1) form.monoparental.checked = true;
}

form.monoparental.addEventListener('change', () => (monoparentalTocado = true));

form.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 'situacion' && t.value === 'pensionista' && form.pension.value === 'no') form.pension.value = 'jubilacion';
  if (t.name === 'pareja' && t.value === 'si' && (Number(form.adultos.value) || 1) < 2) form.adultos.value = 2;
  if (t.name === 'numCuidados') ajustarPersonas();
  alCambiar();
});
form.addEventListener('input', alCambiar);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  mostrarResultados();
});

function alCambiar() {
  actualizarCondiciones();
  if (!resultados.hidden) pintar();
  guardar();
}

// ── Resultados ──────────────────────────────────────────────────────────
function mostrarResultados() {
  actualizarCondiciones();
  pintarTelefonos();
  pintar();
  resultados.hidden = false;
  resultados.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  resultados.focus({ preventScroll: true });
  guardar();
}

function pintar() {
  const p = leerPerfil();
  const todos = evaluar(p).sort((x, y) => (x.estado === y.estado ? ORDEN[x.id] - ORDEN[y.id] : x.estado === 'si' ? -1 : 1));
  const nSi = todos.filter((r) => r.estado === 'si').length;
  const nQuizas = todos.length - nSi;
  document.getElementById('n-si').firstChild.textContent = nSi;
  document.getElementById('n-quizas').firstChild.textContent = nQuizas;
  document.getElementById('resultados-texto').textContent = todos.length
    ? `Con lo que has contestado salen ${todos.length} ${todos.length === 1 ? 'ayuda' : 'ayudas'}. Pulsa cada una para ver cómo se pide, paso a paso.`
    : 'Con lo que has contestado no sale ninguna ayuda. Prueba a completar más preguntas: los ingresos y quién vive contigo cambian mucho el resultado.';

  // Por dónde empezar
  const primeras = porDondeEmpezar(todos);
  const empezar = document.getElementById('empezar');
  empezar.hidden = !primeras.length;
  document.getElementById('empezar-lista').innerHTML = primeras
    .map((r) => {
      const t = tramiteDe(r.id, p.ccaa);
      return `<li><a href="#ayuda-${r.id}" data-abrir="${r.id}"><strong>${esc(POR_ID[r.id].nombre)}</strong></a><span>${esc(t.pasos[0])}</span></li>`;
    })
    .join('');

  // Papeles de todas las ayudas que salen
  const papeles = papelesPara(todos.map((r) => r.id));
  document.getElementById('papeles-bloque').hidden = !papeles.length;
  document.getElementById('papeles').innerHTML = papeles
    .map(({ doc, ayudas }) => `<li><strong>${esc(DOCUMENTOS[doc].nombre)}</strong>. ${esc(DOCUMENTOS[doc].ayuda)} <small>Para: ${ayudas.map((id) => esc(POR_ID[id].nombre)).join(', ')}.</small></li>`)
    .join('');

  const visibles = todos.filter((r) => filtro === 'todas' || r.estado === filtro);
  if (!visibles.length) {
    lista.innerHTML = todos.length ? '<p class="vacio">Nada con este filtro.</p>' : '';
    return;
  }
  lista.innerHTML = CATEGORIAS.map((c) => {
    const delGrupo = visibles.filter((r) => POR_ID[r.id].categoria === c.id);
    if (!delGrupo.length) return '';
    return `<section class="grupo grupo-${c.id}" aria-labelledby="g-${c.id}">
      <h3 class="grupo-titulo" id="g-${c.id}"><span class="insignia">${icono(c.icono)}</span>${esc(c.nombre)}</h3>
      <ul class="lista-ayudas">${delGrupo.map((r) => tarjeta(r.id, { resultado: r, ccaa: p.ccaa, seguimiento: seguimiento[r.id] ?? '' })).join('')}</ul>
    </section>`;
  }).join('');
}

// Abrir una ayuda desde «Por dónde empezar»
document.getElementById('empezar-lista').addEventListener('click', (e) => {
  const a = e.target.closest('[data-abrir]');
  if (!a) return;
  const d = document.querySelector(`#ayuda-${a.dataset.abrir} details`);
  if (d) d.open = true;
});

// Seguimiento: cómo va cada ayuda
lista.addEventListener('change', (e) => {
  const s = e.target.closest('[data-seguir]');
  if (!s) return;
  if (s.value) seguimiento[s.dataset.seguir] = s.value;
  else delete seguimiento[s.dataset.seguir];
  guardar();
  pintar();
  document.querySelector(`#ayuda-${s.dataset.seguir} details`)?.setAttribute('open', '');
});

for (const b of document.querySelectorAll('[data-filtro]')) {
  b.addEventListener('click', () => {
    filtro = b.dataset.filtro;
    document.querySelectorAll('[data-filtro]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    pintar();
  });
}

document.getElementById('cambiar').addEventListener('click', () => irA(1));
document.getElementById('imprimir').addEventListener('click', () => print());
document.getElementById('borrar').addEventListener('click', () => {
  form.reset();
  personasCaja.replaceChildren();
  monoparentalTocado = false;
  visitados = new Set([1]);
  seguimiento = {};
  try {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_SEGUIR);
  } catch {}
  resultados.hidden = true;
  actualizarCondiciones();
  irA(1);
});
// Al imprimir, todas las ayudas abiertas
addEventListener('beforeprint', () => resultados.querySelectorAll('details').forEach((d) => (d.open = true)));

// ── Recordar respuestas (solo si se marca) ──────────────────────────────
function respuestas() {
  const datos = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'radio') {
      if (el.checked) datos[el.name] = el.value;
    } else if (el.type === 'checkbox') datos[el.name] = el.checked;
    else datos[el.name] = el.value;
  }
  return datos;
}

function rellenar(datos) {
  form.reset();
  personasCaja.replaceChildren();
  if (datos.numCuidados) {
    form.numCuidados.value = datos.numCuidados;
    ajustarPersonas();
  }
  for (const [nombre, v] of Object.entries(datos)) {
    const campo = form.elements[nombre];
    if (!campo) continue;
    if (campo instanceof RadioNodeList) {
      for (const r of campo) r.checked = r.value === v;
    } else if (campo.type === 'checkbox') campo.checked = Boolean(v);
    else campo.value = v;
  }
  monoparentalTocado = 'monoparental' in datos;
  actualizarCondiciones();
}

function guardar() {
  try {
    if (recordar.checked) {
      localStorage.setItem(CLAVE, JSON.stringify(respuestas()));
      localStorage.setItem(CLAVE_SEGUIR, JSON.stringify(seguimiento));
    }
  } catch {}
}

recordar.addEventListener('change', () => {
  try {
    if (recordar.checked) guardar();
    else {
      localStorage.removeItem(CLAVE);
      localStorage.removeItem(CLAVE_SEGUIR);
    }
  } catch {}
});

// ── Ejemplos ────────────────────────────────────────────────────────────
const EJEMPLOS = {
  familia: { edad: '29', ccaa: 'madrid', madridCapital: 'si', residencia: 'si', situacion: 'cuenta-ajena', pareja: 'si', adultos: '2', 'hijos-de3a5': '1', bebe: true, ingresosHogar: '28.000', patrimonio: 'bajo', vivienda: 'alquiler' },
  jubilada: { edad: '74', ccaa: 'madrid', madridCapital: 'si', residencia: 'si', 'u-soledad': true, situacion: 'pensionista', pareja: 'no', adultos: '1', viudo: true, ingresosHogar: '10.500', patrimonio: 'bajo', vivienda: 'propia', pension: 'viudedad', pensionMes: '720', pensionDesde2021: 'si', hijosTenidos: '3' },
  cuidador: {
    edad: '52', ccaa: 'castilla-leon', residencia: 'si', situacion: 'cuenta-ajena', pareja: 'si', adultos: '3', 'hijos-de6a17': '1', ingresosHogar: '38.000', ingresosPropios: '21.000', vivienda: 'hipoteca',
    numCuidados: '1', 'p1-relacion': 'padre', 'p1-edad': '84', 'p1-discapacidad': '65', 'p1-dependencia': '2', 'p1-convive': true, 'p1-cuidoYo': true,
  },
  paro: { edad: '55', ccaa: 'valencia', residencia: 'si', 'u-comida': true, situacion: 'paro-sin', pareja: 'si', adultos: '2', ingresosHogar: '9.000', ingresosPropios: '0', patrimonio: 'bajo', vivienda: 'alquiler', cotizado15: 'si', cotizadoUnAño: 'no' },
};

for (const b of document.querySelectorAll('[data-ejemplo]')) {
  b.addEventListener('click', () => {
    rellenar(EJEMPLOS[b.dataset.ejemplo]);
    visitados = new Set([1, 2, 3, 4, 5, 6]);
    irA(1, { foco: false });
    mostrarResultados();
  });
}

// ── Necesito ayuda hoy ──────────────────────────────────────────────────
function pintarTelefonos() {
  const madrid = form.ccaa.value === 'madrid';
  const claves = ['emergencias', 'violencia', 'crisis', 'cruzRoja', ...(madrid ? ['madrid012', 'linea010', 'mayoresMadrid'] : []), 'imv'];
  document.getElementById('telefonos-hoy').innerHTML = claves.map(botonTelefono).join('');
}
form.ccaa.addEventListener('change', pintarTelefonos);

// ── Arranque ────────────────────────────────────────────────────────────
try {
  const guardadas = localStorage.getItem(CLAVE);
  if (guardadas) {
    rellenar(JSON.parse(guardadas));
    seguimiento = JSON.parse(localStorage.getItem(CLAVE_SEGUIR) ?? '{}');
    recordar.checked = true;
  }
} catch {}
actualizarCondiciones();
pintarTelefonos();
pintarEvolucion(document.getElementById('evolucion'));
document.getElementById('n-ayudas').textContent = AYUDAS.length;
for (const el of document.querySelectorAll('[data-icono]')) el.innerHTML = icono(el.dataset.icono);
irA(1, { foco: false });
