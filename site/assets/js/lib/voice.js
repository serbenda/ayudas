// Read aloud with the most human voice each device has.
// There is no server: it uses the browser's or the system's voices, which on many devices are very good
// if chosen well (Edge: Microsoft «Natural» voices; iPhone and Mac: «enhanced» or «premium»; Chrome and Android: Google).
// It reads sentence by sentence: pauses sound more natural and Chrome does not cut off long texts.

const ACCENT = { es: 'es-ES', en: 'en-GB', ca: 'ca-ES', gl: 'gl-ES', eu: 'eu-ES' };
// If there is no Galician, Catalan or Basque voice, it reads with a Spanish voice
const FALLBACK = { ca: 'es', gl: 'es', eu: 'es' };
// Low-quality or novelty voices (macOS, eSpeak…)
const BAD_VOICES =
  /espeak|compact|eloquence|novelty|zarvox|albert|bad news|bells|bubbles|cellos|fred|jester|organ|superstar|trinoids|whisper|wobble|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy|bahh|boing|deranged|hysterical|pipe organ/i;

const language = (lang) => (lang ?? 'es').toLowerCase().split('-')[0];

/** Scores a voice for a language: higher means more human. Exported for the tests.*/
export function score(voice, lang) {
  const base = language(lang);
  const its = language(voice.lang);
  if (its !== base) return -Infinity;
  let p = 0;
  const name = voice.name ?? '';
  if (/natural|neural/i.test(name)) p += 100; // Edge and Windows 11
  if (/premium|mejorada|enhanced|siri/i.test(name)) p += 80; // Apple
  if (/google/i.test(name)) p += 60; // Chrome and Android
  if (/online/i.test(name)) p += 20;
  if (BAD_VOICES.test(name)) p -= 200;
  if ((voice.lang ?? '').toLowerCase().replace('_', '-') === (ACCENT[base] ?? '').toLowerCase()) p += 15;
  if (voice.default) p += 5;
  return p;
}

/** The best voice in the list for a language, or null*/
export function bestVoice(voices, lang) {
  let best = null;
  let maximum = -Infinity;
  for (const v of voices) {
    const p = score(v, lang);
    if (p > maximum) [best, maximum] = [v, p];
  }
  return best;
}

/** Splits a text into short sentences to read them with pauses*/
export function sentences(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:;])\s+(?=\S)/u)
    .flatMap((f) => (f.length > 220 ? f.split(/(?<=,)\s+/) : [f]))
    .map((f) => f.trim())
    .filter(Boolean);
}

// ── In the browser ─────────────────────────────────────────────────────
const available = typeof window !== 'undefined' && 'speechSynthesis' in window;
const STORAGE_KEY = (lang) => `ayudas:voz:${language(lang)}`;
const PACE_KEY = 'ayudas:voz:ritmo';

export const canSpeak = available;

/** Voices take a while to load in Chrome: wait for them (1.5 s at most)*/
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

/** Voice to use for a language: the one the person chose or the device's best (with a fallback)*/
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

/** Reads a text aloud. `button` is marked while it speaks.*/
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

// Short, clear name: «Mónica · España ★ recomendada» instead of «Mónica (español (España))»
const COUNTRIES = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;
export function voiceLabel(v, recommended = false) {
  const name =
    v.name
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

/** Fills in the voice setting (if the page has one): the language's voices, pace and «Probar»*/
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
  // Leave out novelty or robotic voices (Grandma, Rocko, eSpeak…), unless there are no others
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
