// Enviar el resultado a un familiar: solo la lista de ayudas y un enlace para ver cómo se pide cada una.
// Nunca se envían las respuestas (ni edad, ni ingresos, ni salud).

import { POR_ID } from '../data/benefits.js';

export function textoParaCompartir(ids) {
  const base = location.hostname.endsWith('bendi.dev') ? 'https://ayudas.bendi.dev/' : new URL('../../', import.meta.url).href;
  const enlace = `${base}catalogo/?ver=${ids.join(',')}`;
  const lista = ids.map((id, i) => `${i + 1}. ${POR_ID[id].nombre}`).join('\n');
  return { titulo: 'Ayudas que me pueden corresponder', texto: `Ayudas que me pueden corresponder:\n${lista}\n\nCómo se pide cada una, paso a paso:`, enlace };
}

/** Comparte con el menú del móvil; si no hay, abre WhatsApp */
export async function compartir(ids) {
  const { titulo, texto, enlace } = textoParaCompartir(ids);
  if (navigator.share) {
    try {
      await navigator.share({ title: titulo, text: texto, url: enlace });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${texto}\n${enlace}`)}`, '_blank', 'noopener');
}
