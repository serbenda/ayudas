// Send the result to a relative: only the list of benefits and a link to see how to apply for each.
// The answers are never sent (no age, income or health).

import { BY_ID } from '../data/benefits.js';

export function shareText(ids) {
  const base = location.hostname.endsWith('bendi.dev') ? 'https://ayudas.bendi.dev/' : new URL('../../', import.meta.url).href;
  const link = `${base}catalogo/?ver=${ids.join(',')}`;
  const list = ids.map((id, i) => `${i + 1}. ${BY_ID[id].name}`).join('\n');
  return { title: 'Ayudas que me pueden corresponder', text: `Ayudas que me pueden corresponder:\n${list}\n\nCómo se pide cada una, paso a paso:`, link };
}

/** Shares with the phone's share menu; if there is none, opens WhatsApp*/
export async function share(ids) {
  const { title, text, link } = shareText(ids);
  if (navigator.share) {
    try {
      await navigator.share({ title: title, text: text, url: link });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`, '_blank', 'noopener');
}
