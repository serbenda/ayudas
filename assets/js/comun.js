// Código común a todas las páginas: contador de visitas y enlaces para avisar de errores.

import { hablar, parar, hablando, puedeHablar, voces, vozPara, prepararAjustes } from './voz.js';
import { GLOSARIO } from './guia.js';

// Funciona sin conexión e instalable en el móvil: guarda la web en el navegador
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register(new URL('../../sw.js', import.meta.url), { scope: new URL('../../', import.meta.url).pathname }).catch(() => {});
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
const origen = (() => {
  try {
    const r = new URL(document.referrer);
    return r.origin === location.origin ? r.href : location.href;
  } catch {
    return location.href;
  }
})();
const PLANTILLAS = {
  fallo: { titulo: 'Algo no funciona: ', cuerpo: ['**¿Qué pasa?** (página en blanco, un botón que no hace nada…)', '', '', '---', `Página: ${origen}`, `Navegador: ${navigator.userAgent}`, `Pantalla: ${innerWidth}×${innerHeight}`] },
  dato: { titulo: 'Dato: ', cuerpo: ['**¿Qué cifra o requisito no cuadra?**', '', '', '**Enlace a la fuente oficial (si lo tienes):**', '', '', '---', `Página: ${origen}`] },
  falta: { titulo: 'Falta una ayuda: ', cuerpo: ['**¿Qué ayuda falta?** (nombre, quién la da y para quién es)', '', '', '**Enlace oficial:**', '', '', '---', `Página: ${origen}`] },
};
for (const a of document.querySelectorAll('a[data-aviso]')) {
  const p = PLANTILLAS[a.dataset.aviso];
  if (!p) continue;
  const u = new URL(a.href);
  u.searchParams.set('title', p.titulo);
  u.searchParams.set('body', p.cuerpo.join('\n'));
  a.href = u.href;
}

// Letra grande y lectura fácil: se recuerda en este navegador (no es un dato personal)
const botonFacil = document.getElementById('facil');
if (botonFacil) {
  const pintarFacil = () => botonFacil.setAttribute('aria-pressed', String('facil' in document.documentElement.dataset));
  pintarFacil();
  botonFacil.addEventListener('click', () => {
    const activo = !('facil' in document.documentElement.dataset);
    if (activo) document.documentElement.dataset.facil = '';
    else delete document.documentElement.dataset.facil;
    try {
      localStorage.setItem('ayudas:facil', activo ? '1' : '0');
    } catch {}
    pintarFacil();
  });
}

// Alto contraste: negro sobre blanco (o al revés en modo oscuro), bordes gruesos y enlaces subrayados
const botonContraste = document.getElementById('contraste');
if (botonContraste) {
  const pintar = () => botonContraste.setAttribute('aria-pressed', String('contraste' in document.documentElement.dataset));
  pintar();
  botonContraste.addEventListener('click', () => {
    const activo = !('contraste' in document.documentElement.dataset);
    if (activo) document.documentElement.dataset.contraste = '';
    else delete document.documentElement.dataset.contraste;
    try {
      localStorage.setItem('ayudas:contraste', activo ? '1' : '0');
    } catch {}
    pintar();
  });
}

// Leer en voz alta: cualquier botón con data-leer lee su texto, en el idioma de donde está
// (las guías en otros idiomas se leen en su idioma) y con la voz más humana del aparato
// data-lang manda (la frase para la ventanilla se lee en castellano aunque el botón esté en otro idioma)
const idiomaDe = (b) => b.dataset.lang || b.closest('[lang]')?.lang || 'es';
if (puedeHablar) {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-leer]');
    if (!b) return;
    if (hablando() && b.getAttribute('aria-pressed') === 'true') return parar();
    hablar(b.dataset.leer, { lang: idiomaDe(b), boton: b });
  });
  // Si el aparato no tiene ninguna voz para ese idioma, el botón no se enseña
  voces().then(async (lista) => {
    // Sin lista de voces (algunos navegadores no la dan) se deja el botón: leerá con la voz por defecto
    if (!lista.length) return;
    for (const b of document.querySelectorAll('[data-leer]')) if (!(await vozPara(idiomaDe(b)))) b.hidden = true;
  });
  prepararAjustes();
} else {
  document.documentElement.classList.add('sin-voz');
  const ajuste = document.getElementById('ajuste-voz');
  if (ajuste) ajuste.hidden = true;
}
addEventListener('pagehide', parar);

// Versión para insertar en otras webs (?widget=1): sin cabecera ni pie, enlaces en otra pestaña
// y la altura se avisa a la página que la contiene para que no salga barra de desplazamiento.
if ('widget' in document.documentElement.dataset) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a && !a.getAttribute('href').startsWith('#')) a.target = '_blank';
  });
  const pie = document.createElement('p');
  pie.className = 'widget-pie';
  pie.innerHTML = 'Con datos oficiales de <a href="https://ayudas.bendi.dev/" target="_blank" rel="noopener">ayudas.bendi.dev</a>. Tus respuestas no salen de este aparato.';
  document.querySelector('main')?.append(pie);
  if (parent !== window) {
    const avisar = () => parent.postMessage({ ayudas: 'altura', altura: document.documentElement.scrollHeight }, '*');
    new ResizeObserver(avisar).observe(document.body);
    addEventListener('load', avisar);
  }
}

// Menús de la barra (Voz e Idioma): solo uno abierto, y se cierran al pulsar fuera o con Escape
const menus = [...document.querySelectorAll('.ajuste-voz, .ajuste-idioma')];
for (const m of menus) m.addEventListener('toggle', () => m.open && menus.forEach((o) => o !== m && (o.open = false)));
document.addEventListener('click', (e) => menus.forEach((m) => m.open && !m.contains(e.target) && (m.open = false)));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const abierto = menus.find((m) => m.open);
  if (abierto) {
    abierto.open = false;
    abierto.querySelector('summary').focus();
  }
});

// Palabras difíciles: al pulsar una palabra marcada sale debajo qué significa; al volver a pulsar, se esconde
{
  let n = 0;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button.termino');
    if (!b) return;
    e.preventDefault();
    const abierta = b.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('button.termino[aria-expanded="true"]').forEach((o) => {
      o.setAttribute('aria-expanded', 'false');
      document.getElementById(o.getAttribute('aria-controls'))?.remove();
    });
    if (abierta) return;
    const def = GLOSARIO[b.dataset.termino];
    if (!def) return;
    const id = `def-${++n}`;
    const caja = document.createElement('span');
    caja.className = 'definicion';
    caja.id = id;
    caja.setAttribute('role', 'note');
    caja.innerHTML = `<strong></strong> <span></span> <a href="/palabras/#${encodeURIComponent(b.dataset.termino)}">Más palabras</a>`;
    caja.querySelector('strong').textContent = `${b.textContent}:`;
    caja.querySelector('span').textContent = def;
    // La explicación va al final de la frase, para no cortarla
    (b.closest('li, p, dd, dt') ?? b.parentElement).append(caja);
    b.setAttribute('aria-controls', id);
    b.setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const b = document.querySelector('button.termino[aria-expanded="true"]');
    if (b) b.click();
  });
}
