// Leer en voz alta con la voz más humana que tenga cada aparato.
// No hay servidor: se usan las voces del navegador o del sistema, que en muchos aparatos son muy buenas
// si se eligen bien (Edge: voces «Natural» de Microsoft; iPhone y Mac: «mejoradas» o «premium»; Chrome y Android: Google).
// Se lee frase a frase: suena con pausas más naturales y evita que Chrome se corte en los textos largos.

const ACCENT = { es: 'es-ES', en: 'en-GB', ca: 'ca-ES', gl: 'gl-ES', eu: 'eu-ES' };
// Si no hay voz en gallego, catalán o euskera, se lee con una voz en castellano
const FALLBACK = { ca: 'es', gl: 'es', eu: 'es' };
// Voces de mala calidad o de broma (macOS, eSpeak…)
const BAD_VOICES = /espeak|compact|eloquence|novelty|zarvox|albert|bad news|bells|bubbles|cellos|fred|jester|organ|superstar|trinoids|whisper|wobble|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy|bahh|boing|deranged|hysterical|pipe organ/i;

const language = (lang) => (lang ?? 'es').toLowerCase().split('-')[0];

/** Puntúa una voz para un idioma: más alta, más humana. Exportada para los tests. */
export function score(voice, lang) {
  const base = language(lang);
  const its = language(voice.lang);
  if (its !== base) return -Infinity;
  let p = 0;
  const name = voice.name ?? '';
  if (/natural|neural/i.test(name)) p += 100; // Edge y Windows 11
  if (/premium|mejorada|enhanced|siri/i.test(name)) p += 80; // Apple
  if (/google/i.test(name)) p += 60; // Chrome y Android
  if (/online/i.test(name)) p += 20;
  if (BAD_VOICES.test(name)) p -= 200;
  if ((voice.lang ?? '').toLowerCase().replace('_', '-') === (ACCENT[base] ?? '').toLowerCase()) p += 15;
  if (voice.default) p += 5;
  return p;
}

/** La mejor voz de la lista para un idioma, o null */
export function bestVoice(voices, lang) {
  let best = null;
  let maximum = -Infinity;
  for (const v of voices) {
    const p = score(v, lang);
    if (p > maximum) [best, maximum] = [v, p];
  }
  return best;
}

/** Parte un texto en frases cortas para leerlas con pausas */
export function sentences(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:;])\s+(?=\S)/u)
    .flatMap((f) => (f.length > 220 ? f.split(/(?<=,)\s+/) : [f]))
    .map((f) => f.trim())
    .filter(Boolean);
}

// ── En el navegador ─────────────────────────────────────────────────────
const available = typeof window !== 'undefined' && 'speechSynthesis' in window;
const STORAGE_KEY = (lang) => `ayudas:voz:${language(lang)}`;
const PACE_KEY = 'ayudas:voz:ritmo';

export const canSpeak = available;

/** Las voces tardan en cargar en Chrome: se espera a que lleguen (máximo 1,5 s) */
export function voices() {
  if (!available) return Promise.resolve([]);
  const already = speechSynthesis.getVoices();
  if (already.length) return Promise.resolve(already);
  return new Promise((ok) => {
    const ready = () => ok(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', ready, { once: true });
    setTimeout(ready, 1500);
  });
}

function readSaved(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Voz que se usará para un idioma: la elegida por la persona o la mejor del aparato (con reserva) */
export async function voiceFor(lang) {
  const list = await voices();
  const chosen = readSaved(STORAGE_KEY(lang));
  const savedVoice = chosen && list.find((v) => v.voiceURI === chosen && language(v.lang) === language(lang));
  if (savedVoice) return savedVoice;
  return bestVoice(list, lang) ?? (FALLBACK[language(lang)] ? bestVoice(list, FALLBACK[language(lang)]) : null);
}

export function pace() {
  return readSaved(PACE_KEY) === 'despacio' ? 0.75 : 0.92;
}

let turn = 0;
let activeButton = null;

function setPressed(button, isSpeaking) {
  if (!button) return;
  button.setAttribute('aria-pressed', String(isSpeaking));
  button.classList.toggle('speaking', isSpeaking);
}

export function stop() {
  if (!available) return;
  turn++;
  speechSynthesis.cancel();
  setPressed(activeButton, false);
  activeButton = null;
}

export const isSpeaking = () => available && (speechSynthesis.speaking || speechSynthesis.pending);

/** Lee un texto en voz alta. `boton` se marca mientras habla. */
export async function speak(text, { lang = 'es', button = null } = {}) {
  if (!available || !text) return;
  stop();
  const mine = ++turn;
  const voice = await voiceFor(lang);
  if (mine !== turn) return;
  activeButton = button;
  setPressed(button, true);
  const parts = sentences(text);
  parts.forEach((f, i) => {
    const u = new SpeechSynthesisUtterance(f);
    u.lang = voice?.lang ?? ACCENT[language(lang)] ?? lang;
    if (voice) u.voice = voice;
    u.rate = pace();
    u.pitch = 1;
    if (i === parts.length - 1) u.onend = u.onerror = () => mine === turn && setPressed(button, false);
    speechSynthesis.speak(u);
  });
}

// Nombre corto y claro: «Mónica · España ★ recomendada» en vez de «Mónica (español (España))»
const COUNTRIES = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;
export function voiceLabel(v, recommended = false) {
  const name = v.name
    .replace(/\s*\((?:[^()]|\([^()]*\))*\)\s*$/, '') // «(español (España))», «(Natural)»
    .replace(/^(Microsoft|Google|Apple)\s+/i, '')
    .replace(/\s+Online.*$/i, '')
    .replace(/\s+-\s+.*$/, '')
    .trim() || v.name;
  const finalName = /^google/i.test(v.name) ? 'Voz de Google' : name;
  const region = (v.lang ?? '').replace('_', '-').split('-')[1];
  let country = '';
  try {
    country = region && COUNTRIES ? COUNTRIES.of(region.toUpperCase()) : '';
  } catch {}
  const natural = /natural|neural|premium|mejorada|enhanced/i.test(v.name) ? ' (natural)' : '';
  return `${finalName}${natural}${country ? ` · ${country}` : ''}${recommended ? ' ★ recomendada' : ''}`.replace(/</g, '&lt;');
}

/** Rellena el ajuste de voz (si la página lo tiene): lista de voces del idioma, ritmo y «Probar» */
export async function setupSettings() {
  const box = document.getElementById('voice-setting');
  if (!box) return;
  if (!available) {
    box.hidden = true;
    return;
  }
  const lang = document.documentElement.lang || 'es';
  const select = box.querySelector('select[name="voice"]');
  const allOf = (await voices()).filter((v) => language(v.lang) === language(lang)).sort((a, b) => score(b, lang) - score(a, lang));
  // Fuera las voces de broma o robóticas (Grandma, Rocko, eSpeak…), salvo que no haya otras
  const good = allOf.filter((v) => !BAD_VOICES.test(v.name));
  const list = good.length ? good : allOf;
  const current = await voiceFor(lang);
  const best = list[0];
  select.innerHTML = list.length
    ? list.map((v) => `<option value="${v.voiceURI.replace(/"/g, '&quot;')}"${v === current ? ' selected' : ''}>${voiceLabel(v, v === best)}</option>`).join('')
    : '<option value="">La del aparato</option>';
  select.addEventListener('change', () => {
    try {
      localStorage.setItem(STORAGE_KEY(lang), select.value);
    } catch {}
  });
  const slow = box.querySelector('input[name="slow"]');
  slow.checked = pace() < 0.9;
  slow.addEventListener('change', () => {
    try {
      localStorage.setItem(PACE_KEY, slow.checked ? 'despacio' : 'normal');
    } catch {}
  });
  box.querySelector('[data-try-voice]').addEventListener('click', (e) => speak(e.currentTarget.dataset.tryVoice, { lang, button: e.currentTarget }));
}
