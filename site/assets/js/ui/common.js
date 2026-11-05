// Code shared by every page: visit counter and links to report errors.

import { speak, stop, isSpeaking, canSpeak, voices, voiceFor, setupSettings } from '../lib/voice.js';
import { GLOSSARY } from '../data/guide.js';

// Works offline and can be installed on the phone: stores the site in the browser
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register(new URL('../../../sw.js', import.meta.url), { scope: new URL('../../../', import.meta.url).pathname }).catch(() => {});
}

// Visits with GoatCounter: no cookies or personal data. Only on the published site.
// Paths are counted as /ayudas/… so they do not mix with bendi.dev's in the visits dashboard.
// Only the page is counted, never the questionnaire answers.
if (location.hostname.endsWith('bendi.dev')) {
  window.goatcounter = { ...(window.goatcounter ?? {}), path: (p) => (p.startsWith('/ayudas') ? p : `/ayudas${p}`) };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = 'https://serbenda.goatcounter.com/count';
  document.head.append(s);
}

// Reports (on Sources): the GitHub link already includes the page you came from and the browser,
// so whoever reports does not have to explain it. Nothing is sent: it only fills in the form.
const sourcePage = (() => {
  try {
    const r = new URL(document.referrer);
    return r.origin === location.origin ? r.href : location.href;
  } catch {
    return location.href;
  }
})();
const TEMPLATES = {
  bug: { title: 'Algo no funciona: ', body: ['**¿Qué pasa?** (página en blanco, un botón que no hace nada…)', '', '', '---', `Página: ${sourcePage}`, `Navegador: ${navigator.userAgent}`, `Pantalla: ${innerWidth}×${innerHeight}`] },
  data: { title: 'Dato: ', body: ['**¿Qué cifra o requisito no cuadra?**', '', '', '**Enlace a la fuente oficial (si lo tienes):**', '', '', '---', `Página: ${sourcePage}`] },
  missing: { title: 'Falta una ayuda: ', body: ['**¿Qué ayuda falta?** (nombre, quién la da y para quién es)', '', '', '**Enlace oficial:**', '', '', '---', `Página: ${sourcePage}`] },
};
for (const a of document.querySelectorAll('a[data-notice]')) {
  const p = TEMPLATES[a.dataset.notice];
  if (!p) continue;
  const u = new URL(a.href);
  u.searchParams.set('title', p.title);
  u.searchParams.set('body', p.body.join('\n'));
  a.href = u.href;
}

// Large text and easy reading: remembered in this browser (it is not personal data)
const easyButton = document.getElementById('easy');
if (easyButton) {
  const renderEasy = () => easyButton.setAttribute('aria-pressed', String('facil' in document.documentElement.dataset));
  renderEasy();
  easyButton.addEventListener('click', () => {
    const active = !('facil' in document.documentElement.dataset);
    if (active) document.documentElement.dataset.easy = '';
    else delete document.documentElement.dataset.easy;
    try {
      localStorage.setItem('ayudas:facil', active ? '1' : '0');
    } catch {}
    renderEasy();
  });
}

// High contrast: black on white (or the other way round in dark mode), thick borders and underlined links
const contrastButton = document.getElementById('contrast');
if (contrastButton) {
  const render = () => contrastButton.setAttribute('aria-pressed', String('contraste' in document.documentElement.dataset));
  render();
  contrastButton.addEventListener('click', () => {
    const active = !('contraste' in document.documentElement.dataset);
    if (active) document.documentElement.dataset.contrast = '';
    else delete document.documentElement.dataset.contrast;
    try {
      localStorage.setItem('ayudas:contraste', active ? '1' : '0');
    } catch {}
    render();
  });
}

// Read aloud: any button with data-read reads its text, in the language of where it is
// (guides in other languages are read in their language) and with the device's most human voice
// data-lang wins (the sentence for the counter is read in Spanish even if the button is in another language)
const languageOf = (b) => b.dataset.lang || b.closest('[lang]')?.lang || 'es';
if (canSpeak) {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-read]');
    if (!b) return;
    if (isSpeaking() && b.getAttribute('aria-pressed') === 'true') return stop();
    speak(b.dataset.read, { lang: languageOf(b), button: b });
  });
  // If the device has no voice for that language, the button is not shown
  voices().then(async (list) => {
    // Without a list of voices (some browsers do not provide one) the button stays: it will read with the default voice
    if (!list.length) return;
    for (const b of document.querySelectorAll('[data-read]')) if (!(await voiceFor(languageOf(b)))) b.hidden = true;
  });
  setupSettings();
} else {
  document.documentElement.classList.add('no-voice');
  const setting = document.getElementById('voice-setting');
  if (setting) setting.hidden = true;
}
addEventListener('pagehide', stop);

// Version to embed in other websites (?widget=1): no header or footer, links in a new tab
// and the height is reported to the host page so no scrollbar appears.
if ('widget' in document.documentElement.dataset) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a && !a.getAttribute('href').startsWith('#')) a.target = '_blank';
  });
  const footer = document.createElement('p');
  footer.className = 'widget-footer';
  footer.innerHTML = 'Con datos oficiales de <a href="https://ayudas.bendi.dev/" target="_blank" rel="noopener">ayudas.bendi.dev</a>. Tus respuestas no salen de este aparato.';
  document.querySelector('main')?.append(footer);
  if (parent !== window) {
    const notify = () => parent.postMessage({ ayudas: 'altura', altura: document.documentElement.scrollHeight }, '*');
    new ResizeObserver(notify).observe(document.body);
    addEventListener('load', notify);
  }
}

// Top bar menus (Voice and Language): only one open, closed by clicking outside or with Escape
const menus = [...document.querySelectorAll('.voice-setting, .language-setting')];
for (const m of menus) m.addEventListener('toggle', () => m.open && menus.forEach((o) => o !== m && (o.open = false)));
document.addEventListener('click', (e) => menus.forEach((m) => m.open && !m.contains(e.target) && (m.open = false)));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const openIssue = menus.find((m) => m.open);
  if (openIssue) {
    openIssue.open = false;
    openIssue.querySelector('summary').focus();
  }
});

// Difficult words: tapping a marked word shows what it means below; tapping again hides it
{
  let n = 0;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button.term');
    if (!b) return;
    e.preventDefault();
    const isOpen = b.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('button.term[aria-expanded="true"]').forEach((o) => {
      o.setAttribute('aria-expanded', 'false');
      document.getElementById(o.getAttribute('aria-controls'))?.remove();
    });
    if (isOpen) return;
    const definition = GLOSSARY[b.dataset.term];
    if (!definition) return;
    const id = `def-${++n}`;
    const box = document.createElement('span');
    box.className = 'definition';
    box.id = id;
    box.setAttribute('role', 'note');
    box.innerHTML = `<strong></strong> <span></span> <a href="/palabras/#${encodeURIComponent(b.dataset.term)}">Más palabras</a>`;
    box.querySelector('strong').textContent = `${b.textContent}:`;
    box.querySelector('span').textContent = definition;
    // The explanation goes at the end of the sentence, so as not to cut it
    (b.closest('li, p, dd, dt') ?? b.parentElement).append(box);
    b.setAttribute('aria-controls', id);
    b.setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const b = document.querySelector('button.term[aria-expanded="true"]');
    if (b) b.click();
  });
}
