// Código común a todas las páginas: contador de visitas y enlaces para avisar de errores.

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
