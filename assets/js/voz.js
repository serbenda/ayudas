// Leer en voz alta con la voz más humana que tenga cada aparato.
// No hay servidor: se usan las voces del navegador o del sistema, que en muchos aparatos son muy buenas
// si se eligen bien (Edge: voces «Natural» de Microsoft; iPhone y Mac: «mejoradas» o «premium»; Chrome y Android: Google).
// Se lee frase a frase: suena con pausas más naturales y evita que Chrome se corte en los textos largos.

const ACENTO = { es: 'es-ES', en: 'en-GB', ca: 'ca-ES', gl: 'gl-ES', eu: 'eu-ES' };
// Si no hay voz en gallego, catalán o euskera, se lee con una voz en castellano
const RESERVA = { ca: 'es', gl: 'es', eu: 'es' };
// Voces de mala calidad o de broma (macOS, eSpeak…)
const MALAS = /espeak|compact|eloquence|novelty|zarvox|albert|bad news|bells|bubbles|cellos|fred|jester|organ|superstar|trinoids|whisper|wobble|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy|bahh|boing|deranged|hysterical|pipe organ/i;

const idioma = (lang) => (lang ?? 'es').toLowerCase().split('-')[0];

/** Puntúa una voz para un idioma: más alta, más humana. Exportada para los tests. */
export function puntuar(voz, lang) {
  const base = idioma(lang);
  const suyo = idioma(voz.lang);
  if (suyo !== base) return -Infinity;
  let p = 0;
  const nombre = voz.name ?? '';
  if (/natural|neural/i.test(nombre)) p += 100; // Edge y Windows 11
  if (/premium|mejorada|enhanced|siri/i.test(nombre)) p += 80; // Apple
  if (/google/i.test(nombre)) p += 60; // Chrome y Android
  if (/online/i.test(nombre)) p += 20;
  if (MALAS.test(nombre)) p -= 200;
  if ((voz.lang ?? '').toLowerCase().replace('_', '-') === (ACENTO[base] ?? '').toLowerCase()) p += 15;
  if (voz.default) p += 5;
  return p;
}

/** La mejor voz de la lista para un idioma, o null */
export function mejorVoz(voces, lang) {
  let mejor = null;
  let maximo = -Infinity;
  for (const v of voces) {
    const p = puntuar(v, lang);
    if (p > maximo) [mejor, maximo] = [v, p];
  }
  return mejor;
}

/** Parte un texto en frases cortas para leerlas con pausas */
export function frases(texto) {
  return String(texto)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:;])\s+(?=\S)/u)
    .flatMap((f) => (f.length > 220 ? f.split(/(?<=,)\s+/) : [f]))
    .map((f) => f.trim())
    .filter(Boolean);
}

// ── En el navegador ─────────────────────────────────────────────────────
const hay = typeof window !== 'undefined' && 'speechSynthesis' in window;
const CLAVE = (lang) => `ayudas:voz:${idioma(lang)}`;
const CLAVE_RITMO = 'ayudas:voz:ritmo';

export const puedeHablar = hay;

/** Las voces tardan en cargar en Chrome: se espera a que lleguen (máximo 1,5 s) */
export function voces() {
  if (!hay) return Promise.resolve([]);
  const ya = speechSynthesis.getVoices();
  if (ya.length) return Promise.resolve(ya);
  return new Promise((ok) => {
    const listo = () => ok(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', listo, { once: true });
    setTimeout(listo, 1500);
  });
}

function leerGuardado(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

/** Voz que se usará para un idioma: la elegida por la persona o la mejor del aparato (con reserva) */
export async function vozPara(lang) {
  const lista = await voces();
  const elegida = leerGuardado(CLAVE(lang));
  const guardada = elegida && lista.find((v) => v.voiceURI === elegida && idioma(v.lang) === idioma(lang));
  if (guardada) return guardada;
  return mejorVoz(lista, lang) ?? (RESERVA[idioma(lang)] ? mejorVoz(lista, RESERVA[idioma(lang)]) : null);
}

export function ritmo() {
  return leerGuardado(CLAVE_RITMO) === 'despacio' ? 0.75 : 0.92;
}

let turno = 0;
let botonActivo = null;

function marcar(boton, hablando) {
  if (!boton) return;
  boton.setAttribute('aria-pressed', String(hablando));
  boton.classList.toggle('hablando', hablando);
}

export function parar() {
  if (!hay) return;
  turno++;
  speechSynthesis.cancel();
  marcar(botonActivo, false);
  botonActivo = null;
}

export const hablando = () => hay && (speechSynthesis.speaking || speechSynthesis.pending);

/** Lee un texto en voz alta. `boton` se marca mientras habla. */
export async function hablar(texto, { lang = 'es', boton = null } = {}) {
  if (!hay || !texto) return;
  parar();
  const mio = ++turno;
  const voz = await vozPara(lang);
  if (mio !== turno) return;
  botonActivo = boton;
  marcar(boton, true);
  const partes = frases(texto);
  partes.forEach((f, i) => {
    const u = new SpeechSynthesisUtterance(f);
    u.lang = voz?.lang ?? ACENTO[idioma(lang)] ?? lang;
    if (voz) u.voice = voz;
    u.rate = ritmo();
    u.pitch = 1;
    if (i === partes.length - 1) u.onend = u.onerror = () => mio === turno && marcar(boton, false);
    speechSynthesis.speak(u);
  });
}

// Nombre corto y claro: «Mónica · España ★ recomendada» en vez de «Mónica (español (España))»
const PAISES = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;
export function etiquetaVoz(v, recomendada = false) {
  const nombre = v.name
    .replace(/\s*\((?:[^()]|\([^()]*\))*\)\s*$/, '') // «(español (España))», «(Natural)»
    .replace(/^(Microsoft|Google|Apple)\s+/i, '')
    .replace(/\s+Online.*$/i, '')
    .replace(/\s+-\s+.*$/, '')
    .trim() || v.name;
  const nombreFinal = /^google/i.test(v.name) ? 'Voz de Google' : nombre;
  const region = (v.lang ?? '').replace('_', '-').split('-')[1];
  let pais = '';
  try {
    pais = region && PAISES ? PAISES.of(region.toUpperCase()) : '';
  } catch {}
  const natural = /natural|neural|premium|mejorada|enhanced/i.test(v.name) ? ' (natural)' : '';
  return `${nombreFinal}${natural}${pais ? ` · ${pais}` : ''}${recomendada ? ' ★ recomendada' : ''}`.replace(/</g, '&lt;');
}

/** Rellena el ajuste de voz (si la página lo tiene): lista de voces del idioma, ritmo y «Probar» */
export async function prepararAjustes() {
  const caja = document.getElementById('ajuste-voz');
  if (!caja) return;
  if (!hay) {
    caja.hidden = true;
    return;
  }
  const lang = document.documentElement.lang || 'es';
  const select = caja.querySelector('select[name="voz"]');
  const todas = (await voces()).filter((v) => idioma(v.lang) === idioma(lang)).sort((a, b) => puntuar(b, lang) - puntuar(a, lang));
  // Fuera las voces de broma o robóticas (Grandma, Rocko, eSpeak…), salvo que no haya otras
  const buenas = todas.filter((v) => !MALAS.test(v.name));
  const lista = buenas.length ? buenas : todas;
  const actual = await vozPara(lang);
  const mejor = lista[0];
  select.innerHTML = lista.length
    ? lista.map((v) => `<option value="${v.voiceURI.replace(/"/g, '&quot;')}"${v === actual ? ' selected' : ''}>${etiquetaVoz(v, v === mejor)}</option>`).join('')
    : '<option value="">La del aparato</option>';
  select.addEventListener('change', () => {
    try {
      localStorage.setItem(CLAVE(lang), select.value);
    } catch {}
  });
  const despacio = caja.querySelector('input[name="despacio"]');
  despacio.checked = ritmo() < 0.9;
  despacio.addEventListener('change', () => {
    try {
      localStorage.setItem(CLAVE_RITMO, despacio.checked ? 'despacio' : 'normal');
    } catch {}
  });
  caja.querySelector('[data-probar]').addEventListener('click', (e) => hablar(e.currentTarget.dataset.probar, { lang, boton: e.currentTarget }));
}
