// Página para personas mayores: una pregunta cada vez, botones grandes, frases cortas y lectura en voz alta.
// Usa las mismas reglas que el resto de la web. Nada sale del navegador.

import { evaluar, perfilVacio, porDondeEmpezar } from './reglas.js';
import { POR_ID, COMUNIDADES } from './ayudas.js';
import { tramiteDe, papelesPara } from './tramites.js';
import { DOCUMENTOS } from './guia.js';
import { icono } from './iconos.js';
import { botonTelefono, esc, cajaEjemplo } from './tarjeta.js';
import { compartir } from './compartir.js';

const caja = document.getElementById('asistente');
const resultado = document.getElementById('resultado');
const respuestas = {};
let historial = [];

// ── Las preguntas ───────────────────────────────────────────────────────
// Cada una: texto, ayuda (opcional), opciones [texto, valor] y cuándo se hace (si)
const PREGUNTAS = [
  { id: 'edad', texto: '¿Cuántos años tienes?', opciones: [['Menos de 60', 55], ['De 60 a 64', 62], ['De 65 a 79', 72], ['80 o más', 85]] },
  {
    id: 'donde',
    texto: '¿Dónde vives?',
    opciones: [['En la ciudad de Madrid', 'capital'], ['En otro pueblo de la Comunidad de Madrid', 'madrid'], ['En otra comunidad', 'otra']],
  },
  { id: 'ccaa', texto: '¿En qué comunidad vives?', tipo: 'lista', si: (r) => r.donde === 'otra' },
  { id: 'convivencia', texto: '¿Con quién vives?', opciones: [['Vivo solo o sola', 'solo'], ['Con mi pareja', 'pareja'], ['Con otros familiares', 'familia']] },
  {
    id: 'pension',
    texto: '¿Cobras alguna pensión?',
    opciones: [['Sí, de jubilación', 'jubilacion'], ['Sí, de viudedad', 'viudedad'], ['Sí, de incapacidad', 'incapacidad'], ['Sí, no contributiva', 'pnc'], ['No cobro pensión', 'no']],
  },
  {
    id: 'pensionMes',
    texto: '¿Cuánto cobras de pensión al mes, más o menos?',
    ayuda: 'Lo pone en la carta de la Seguridad Social o en tu banco.',
    si: (r) => ['jubilacion', 'viudedad', 'incapacidad'].includes(r.pension),
    opciones: [['Menos de 700 €', 650], ['De 700 a 900 €', 800], ['De 900 a 1.100 €', 1000], ['De 1.100 a 1.500 €', 1300], ['Más de 1.500 €', 1800], ['No lo sé', null]],
  },
  { id: 'desde2021', texto: '¿Empezaste a cobrar la pensión en 2021 o después?', si: (r) => ['jubilacion', 'viudedad', 'incapacidad'].includes(r.pension), opciones: [['Sí', true], ['No, antes', false], ['No lo sé', null]] },
  { id: 'hijos', texto: '¿Cuántos hijos has tenido?', si: (r) => ['jubilacion', 'viudedad', 'incapacidad'].includes(r.pension), opciones: [['Ninguno', 0], ['1', 1], ['2', 2], ['3', 3], ['4 o más', 4]] },
  {
    id: 'ingresos',
    texto: '¿Tienes algún dinero que te entre cada mes?',
    si: (r) => r.pension === 'no',
    opciones: [['No, nada', 0], ['Menos de 500 € al mes', 4000], ['Más de 500 € al mes', 9000], ['No lo sé', null]],
  },
  {
    id: 'hogar',
    texto: '¿Cuánto dinero entra en casa al mes, entre todos?',
    ayuda: 'Suma pensiones, sueldos y otras ayudas de las personas que viven contigo.',
    si: (r) => r.convivencia !== 'solo',
    opciones: [['Menos de 800 €', 700 * 12], ['De 800 a 1.200 €', 1000 * 12], ['De 1.200 a 2.000 €', 1600 * 12], ['Más de 2.000 €', 2500 * 12], ['No lo sé', null]],
  },
  { id: 'viudo', texto: '¿Ha fallecido tu marido, tu mujer o tu pareja?', si: (r) => r.pension !== 'viudedad' && r.convivencia !== 'pareja', opciones: [['Sí', true], ['No', false]] },
  {
    id: 'ayudaDiaria',
    texto: '¿Necesitas ayuda de otra persona para asearte, vestirte o comer?',
    opciones: [['No', 'no'], ['Sí, pero no lo he pedido', 'necesita'], ['Lo he pedido y estoy esperando', 'tramite'], ['Sí, ya tengo el grado de dependencia', 'grado']],
  },
  { id: 'grado', texto: '¿Qué grado de dependencia tienes?', si: (r) => r.ayudaDiaria === 'grado', opciones: [['Grado I', '1'], ['Grado II', '2'], ['Grado III', '3'], ['No me acuerdo', '1']] },
  {
    id: 'discapacidad',
    texto: '¿Tienes certificado de discapacidad?',
    opciones: [['No', 'no'], ['No, pero tengo problemas de salud que me limitan', 'sin'], ['Sí, de menos del 65 %', '33'], ['Sí, del 65 % o más', '65']],
  },
  { id: 'cuidas', texto: '¿Cuidas de alguien de tu familia que necesita ayuda?', opciones: [['No', 'no'], ['Sí, a mi pareja', 'pareja'], ['Sí, a un hijo o hija', 'hijo'], ['Sí, a otra persona', 'otro']] },
  { id: 'cuidadoGrado', texto: '¿Esa persona tiene la dependencia reconocida?', si: (r) => r.cuidas && r.cuidas !== 'no', opciones: [['Sí', '2'], ['No', 'necesita'], ['Lo hemos pedido', 'tramite']] },
  { id: 'vivienda', texto: '¿Tu casa es de alquiler?', opciones: [['Sí, pago alquiler', 'alquiler'], ['No, es mía', 'propia'], ['Otra situación', 'otra']] },
  { id: 'llega', texto: '¿Te llega el dinero para comer y pagar la luz?', opciones: [['Sí', 'si'], ['Justo', 'justo'], ['No', 'no']] },
  { id: 'soledad', texto: '¿Te sientes solo o sola a menudo?', opciones: [['Sí', true], ['A veces', false], ['No', false]] },
];

const activas = () => PREGUNTAS.filter((q) => !q.si || q.si(respuestas));

// ── Leer en voz alta ────────────────────────────────────────────────────
const puedeHablar = 'speechSynthesis' in window;
function leer(texto) {
  if (!puedeHablar) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'es-ES';
  u.rate = 0.9;
  const voz = speechSynthesis.getVoices().find((v) => v.lang?.startsWith('es'));
  if (voz) u.voice = voz;
  speechSynthesis.speak(u);
}
const botonEscuchar = (id) => (puedeHablar ? `<button type="button" class="escuchar" data-escuchar="${id}">${icono('altavoz')} Escuchar</button>` : '');

// ── Pintar una pregunta ─────────────────────────────────────────────────
function mostrarPregunta(i) {
  const lista = activas();
  const q = lista[i];
  if (!q) return mostrarResultado();
  const n = i + 1;
  const total = lista.length;
  const opciones = q.tipo === 'lista'
    ? `<div class="opciones-grandes">${COMUNIDADES.filter((c) => c.id !== 'madrid').map((c) => `<button type="button" class="opcion-grande" data-valor="${c.id}">${esc(c.nombre)}</button>`).join('')}</div>`
    : `<div class="opciones-grandes">${q.opciones.map(([t, v], k) => `<button type="button" class="opcion-grande" data-indice="${k}">${esc(t)}</button>`).join('')}</div>`;
  caja.innerHTML = `
    <div class="progreso" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${n}" aria-label="Pregunta ${n} de ${total}">
      <span>Pregunta ${n} de ${total}</span>
      <div class="progreso-barra"><i style="width:${Math.round((n / total) * 100)}%"></i></div>
    </div>
    <h2 class="pregunta-grande" id="pregunta" tabindex="-1">${esc(q.texto)}</h2>
    ${q.ayuda ? `<p class="pregunta-ayuda">${esc(q.ayuda)}</p>` : ''}
    ${botonEscuchar('pregunta')}
    ${opciones}
    <div class="navegar">
      ${i > 0 ? '<button type="button" class="boton secundario grande" data-volver>← Volver</button>' : ''}
      <button type="button" class="boton texto" data-saltar>No quiero contestar</button>
    </div>`;
  caja.dataset.indice = i;
  caja.dataset.texto = [q.texto, q.ayuda ?? '', ...(q.opciones ?? []).map(([t]) => t)].join('. ');
  document.getElementById('pregunta').focus({ preventScroll: false });
}

caja.addEventListener('click', (e) => {
  const i = Number(caja.dataset.indice);
  const q = activas()[i];
  const b = e.target.closest('button');
  if (!b || !q) return;
  if (b.dataset.escuchar) return leer(caja.dataset.texto);
  if ('volver' in b.dataset) {
    const anterior = historial.pop() ?? 0;
    return mostrarPregunta(anterior);
  }
  if ('saltar' in b.dataset) {
    delete respuestas[q.id];
  } else if (b.dataset.valor !== undefined) {
    respuestas[q.id] = b.dataset.valor;
  } else if (b.dataset.indice !== undefined) {
    respuestas[q.id] = q.opciones[Number(b.dataset.indice)][1];
  } else return;
  historial.push(i);
  // Las preguntas que ya no tocan se borran (por ejemplo, si cambias la pensión)
  const ids = new Set(activas().map((x) => x.id));
  for (const k of Object.keys(respuestas)) if (!ids.has(k)) delete respuestas[k];
  const siguiente = activas().findIndex((x) => x.id === q.id) + 1;
  mostrarPregunta(siguiente);
});

// ── De las respuestas al perfil de las reglas ───────────────────────────
function perfil() {
  const r = respuestas;
  const p = perfilVacio();
  p.edad = r.edad ?? null;
  p.ccaa = r.donde === 'capital' || r.donde === 'madrid' ? 'madrid' : r.ccaa ?? null;
  p.madridCapital = r.donde === 'capital' ? true : r.donde === 'madrid' ? false : null;
  p.pareja = r.convivencia === 'pareja';
  p.adultos = r.convivencia === 'solo' ? 1 : 2;
  p.situacion = r.pension && r.pension !== 'no' ? 'pensionista' : null;
  p.pension = r.pension ?? 'no';
  p.pensionMes = r.pensionMes ?? null;
  p.pensionDesde2021 = r.desde2021 ?? null;
  p.hijosTenidos = r.hijos ?? 0;
  p.viudo = r.pension === 'viudedad' || r.viudo === true;
  const propios = p.pension === 'no' ? r.ingresos ?? null : p.pensionMes != null ? p.pensionMes * 14 : null;
  p.ingresosPropios = propios;
  p.ingresosHogar = r.convivencia === 'solo' ? propios : r.hogar ?? null;
  p.dependencia = r.ayudaDiaria === 'grado' ? r.grado ?? '1' : r.ayudaDiaria ?? 'no';
  p.discapacidad = r.discapacidad ?? 'no';
  p.vivienda = r.vivienda ?? null;
  if (r.cuidas && r.cuidas !== 'no') {
    p.cuidados = [{ relacion: r.cuidas, edad: r.cuidas === 'pareja' ? p.edad : null, discapacidad: 'no', dependencia: r.cuidadoGrado ?? 'necesita', convive: true, cuidoYo: true }];
  }
  p.urgencias = { ...p.urgencias, comida: r.llega === 'no', soledad: r.soledad === true };
  return p;
}

// ── Resultado ───────────────────────────────────────────────────────────
function tarjetaMayores(r, ccaa, numero) {
  const a = POR_ID[r.id];
  const t = tramiteDe(r.id, ccaa);
  return `
  <article class="ficha-mayores${r.urgente ? ' urgente' : ''}" id="m-${r.id}">
    <h3><span class="numero">${numero}</span>${esc(a.nombre)}</h3>
    ${r.importe?.texto ? `<p class="cuanto">${esc(r.importe.texto)}</p>` : ''}
    <ul class="frases">${t.facil.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    ${r.estado === 'quizas' && r.comprobar.length ? `<p class="comprobar-mayores"><strong>Hay que comprobar:</strong> ${esc(r.comprobar[0])}</p>` : ''}
    ${botonEscuchar(r.id)}
    <details class="como-mayores">
      <summary>Qué tengo que hacer</summary>
      ${cajaEjemplo(r.id)}
      <ol>${t.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      ${t.telefonos.length ? `<h4>Llama a</h4><div class="llamadas">${t.telefonos.map(botonTelefono).join('')}</div>` : ''}
      ${t.documentos.length ? `<h4>Lleva estos papeles</h4><ul class="papeles">${t.documentos.map((d) => `<li>${esc(DOCUMENTOS[d].nombre)}</li>`).join('')}</ul>` : ''}
      <p><strong>Cuándo:</strong> ${esc(t.plazo)}</p>
    </details>
  </article>`;
}

function mostrarResultado() {
  const p = perfil();
  const todos = evaluar(p);
  const primeras = porDondeEmpezar(todos, 99);
  const resto = todos.filter((r) => !primeras.includes(r) && r.estado === 'si');
  const quizas = todos.filter((r) => !primeras.includes(r) && r.estado === 'quizas');
  const orden = [...primeras, ...resto, ...quizas];
  const papeles = papelesPara(orden.map((r) => r.id)).slice(0, 8);
  const madrid = p.ccaa === 'madrid';

  caja.hidden = true;
  resultado.hidden = false;
  resultado.innerHTML = `
    <h2 class="pregunta-grande" id="t-resultado" tabindex="-1">${orden.length ? `Puedes pedir ${orden.length === 1 ? 'esta ayuda' : `estas ${orden.length} ayudas`}` : 'No sale ninguna ayuda'}</h2>
    <p class="pregunta-ayuda">${orden.length ? 'Empieza por la primera. Pulsa «Qué tengo que hacer» para ver los pasos.' : 'Con tus respuestas no sale ninguna. Llama a los servicios sociales de tu ayuntamiento: te orientan gratis.'}</p>
    <p class="consejo">${icono('cuidados')} Puedes pedir ayuda a un familiar, a un vecino o a los servicios sociales para hacer los trámites.</p>
    <div class="fichas-mayores">${orden.map((r, i) => tarjetaMayores(r, p.ccaa, i + 1)).join('')}</div>
    ${papeles.length ? `<section class="bloque-mayores"><h3>${icono('papeles')} Papeles que conviene tener a mano</h3><ul class="papeles">${papeles.map(({ doc }) => `<li><strong>${esc(DOCUMENTOS[doc].nombre)}</strong>. ${esc(DOCUMENTOS[doc].ayuda)}</li>`).join('')}</ul></section>` : ''}
    <section class="bloque-mayores"><h3>${icono('telefono')} Teléfonos que te pueden ayudar</h3>
      <div class="llamadas">${[...(madrid ? ['mayoresMadrid', 'madrid012', 'linea010'] : []), 'cruzRoja', 'infoInss', 'emergencias'].map(botonTelefono).join('')}</div>
    </section>
    <div class="navegar">
      <button type="button" class="boton grande" data-compartir>Enviar a un familiar</button>
      <button type="button" class="boton secundario grande" data-imprimir>Imprimir para llevar</button>
      <button type="button" class="boton secundario grande" data-cambiar>Cambiar respuestas</button>
      <a class="boton texto" href="../">Ver la versión completa</a>
    </div>
    <p class="nota">Es una orientación. Quien decide es el organismo que da cada ayuda. Cifras de 2026.</p>`;
  document.getElementById('t-resultado').focus();
}

resultado.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.escuchar) {
    const ficha = document.getElementById(`m-${b.dataset.escuchar}`);
    const t = tramiteDe(b.dataset.escuchar, perfil().ccaa);
    return leer([POR_ID[b.dataset.escuchar].nombre, ficha.querySelector('.cuanto')?.textContent ?? '', ...t.facil, 'Qué tengo que hacer.', ...t.pasos].join('. '));
  }
  if ('compartir' in b.dataset) {
    const ids = [...resultado.querySelectorAll('.ficha-mayores')].map((f) => f.id.replace(/^m-/, ''));
    return compartir(ids);
  }
  if ('imprimir' in b.dataset) {
    resultado.querySelectorAll('details').forEach((d) => (d.open = true));
    return print();
  }
  if ('cambiar' in b.dataset) {
    resultado.hidden = true;
    caja.hidden = false;
    historial = [];
    mostrarPregunta(0);
  }
});

// ── Arranque ────────────────────────────────────────────────────────────
document.getElementById('empezar').addEventListener('click', () => {
  document.getElementById('bienvenida').hidden = true;
  caja.hidden = false;
  mostrarPregunta(0);
});
document.querySelector('[data-escuchar="bienvenida"]')?.addEventListener('click', () => leer(document.getElementById('bienvenida').innerText));
if (!puedeHablar) document.querySelector('[data-escuchar="bienvenida"]')?.remove();
