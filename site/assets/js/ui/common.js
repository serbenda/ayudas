// Código común a todas las páginas: contador de visitas y enlaces para avisar de errores.

import { speak, stop, isSpeaking, canSpeak, voices, voiceFor, setupSettings } from '../lib/voice.js';
import { GLOSSARY } from '../data/guide.js';

// Funciona sin conexión e instalable en el móvil: guarda la web en el navegador
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register(new URL('../../../sw.js', import.meta.url), { scope: new URL('../../../', import.meta.url).pathname }).catch(() => {});
}

// Visitas con GoatCounter: sin cookies ni datos personales. Solo en la web publicada.
// Las rutas se cuentan como /ayudas/… para que no se mezclen con las de bendi.dev en el panel de visitas.
// Solo se cuenta la página, nunca las respuestas del cuestionario.
if (location.hostname.endsWith('bendi.dev')) {
  window.goatcounter = { ...(window.goatcounter ?? {}), path: (p) => (p.startsWith('/ayudas') ? p : `/ayudas${p}`) };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = 'https://serbenda.goatcounter.com/count';
  document.head.append(s);
}

// Avisos (en Fuentes): el enlace a GitHub ya lleva la página de la que vienes y el navegador,
// para que quien avisa no tenga que explicarlo. No se envía nada: solo se rellena el formulario.
const sourcePage = (() => {
  try {
    const r = new URL(document.referrer);
    return r.origin === location.origin ? r.href : location.href;
  } catch {
    return location.href;
  }
})();
const TEMPLATES = {
  failure: { title: 'Algo no funciona: ', body: ['**¿Qué pasa?** (página en blanco, un botón que no hace nada…)', '', '', '---', `Página: ${sourcePage}`, `Navegador: ${navigator.userAgent}`, `Pantalla: ${innerWidth}×${innerHeight}`] },
  datum: { title: 'Dato: ', body: ['**¿Qué cifra o requisito no cuadra?**', '', '', '**Enlace a la fuente oficial (si lo tienes):**', '', '', '---', `Página: ${sourcePage}`] },
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

// Letra grande y lectura fácil: se recuerda en este navegador (no es un dato personal)
const easyButton = document.getElementById('facil');
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

// Alto contraste: negro sobre blanco (o al revés en modo oscuro), bordes gruesos y enlaces subrayados
const contrastButton = document.getElementById('contraste');
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

// Leer en voz alta: cualquier botón con data-read lee su texto, en el idioma de donde está
// (las guías en otros idiomas se leen en su idioma) y con la voz más humana del aparato
// data-lang manda (la frase para la ventanilla se lee en castellano aunque el botón esté en otro idioma)
const languageOf = (b) => b.dataset.lang || b.closest('[lang]')?.lang || 'es';
if (canSpeak) {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-read]');
    if (!b) return;
    if (isSpeaking() && b.getAttribute('aria-pressed') === 'true') return stop();
    speak(b.dataset.read, { lang: languageOf(b), button: b });
  });
  // Si el aparato no tiene ninguna voz para ese idioma, el botón no se enseña
  voices().then(async (list) => {
    // Sin lista de voces (algunos navegadores no la dan) se deja el botón: leerá con la voz por defecto
    if (!list.length) return;
    for (const b of document.querySelectorAll('[data-read]')) if (!(await voiceFor(languageOf(b)))) b.hidden = true;
  });
  setupSettings();
} else {
  document.documentElement.classList.add('sin-voz');
  const setting = document.getElementById('ajuste-voz');
  if (setting) setting.hidden = true;
}
addEventListener('pagehide', stop);

// Versión para insertar en otras webs (?widget=1): sin cabecera ni pie, enlaces en otra pestaña
// y la altura se avisa a la página que la contiene para que no salga barra de desplazamiento.
if ('widget' in document.documentElement.dataset) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a && !a.getAttribute('href').startsWith('#')) a.target = '_blank';
  });
  const footer = document.createElement('p');
  footer.className = 'widget-pie';
  footer.innerHTML = 'Con datos oficiales de <a href="https://ayudas.bendi.dev/" target="_blank" rel="noopener">ayudas.bendi.dev</a>. Tus respuestas no salen de este aparato.';
  document.querySelector('main')?.append(footer);
  if (parent !== window) {
    const notify = () => parent.postMessage({ benefits: 'altura', height: document.documentElement.scrollHeight }, '*');
    new ResizeObserver(notify).observe(document.body);
    addEventListener('load', notify);
  }
}

// Menús de la barra (Voz e Idioma): solo uno abierto, y se cierran al pulsar fuera o con Escape
const menus = [...document.querySelectorAll('.ajuste-voz, .ajuste-idioma')];
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

// Palabras difíciles: al pulsar una palabra marcada sale debajo qué significa; al volver a pulsar, se esconde
{
  let n = 0;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button.termino');
    if (!b) return;
    e.preventDefault();
    const isOpen = b.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('button.termino[aria-expanded="true"]').forEach((o) => {
      o.setAttribute('aria-expanded', 'false');
      document.getElementById(o.getAttribute('aria-controls'))?.remove();
    });
    if (isOpen) return;
    const definition = GLOSSARY[b.dataset.term];
    if (!definition) return;
    const id = `def-${++n}`;
    const box = document.createElement('span');
    box.className = 'definicion';
    box.id = id;
    box.setAttribute('role', 'note');
    box.innerHTML = `<strong></strong> <span></span> <a href="/palabras/#${encodeURIComponent(b.dataset.term)}">Más palabras</a>`;
    box.querySelector('strong').textContent = `${b.textContent}:`;
    box.querySelector('span').textContent = definition;
    // La explicación va al final de la frase, para no cortarla
    (b.closest('li, p, dd, dt') ?? b.parentElement).append(box);
    b.setAttribute('aria-controls', id);
    b.setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const b = document.querySelector('button.termino[aria-expanded="true"]');
    if (b) b.click();
  });
}
