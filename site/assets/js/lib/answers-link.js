// Answers inside a link: JSON in base64 (URL-safe). Only non-empty values are kept.
// It goes after «#», so the browser never sends it to the server.

export function toLink(data) {
  const useful = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== false && v != null));
  const bytes = new TextEncoder().encode(JSON.stringify(useful));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromLink(text) {
  try {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    // Only text, numbers and checkboxes: nothing that could be executed
    return Object.fromEntries(Object.entries(data).filter(([k, v]) => /^[\w\-ñ]+$/u.test(k) && ['string', 'number', 'boolean'].includes(typeof v)).map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 200) : v]));
  } catch {
    return null;
  }
}
