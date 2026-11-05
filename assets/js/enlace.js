// Respuestas dentro de un enlace: JSON en base64 (apto para URL). Solo se guarda lo que no está vacío.
// Va después de «#», así que el navegador nunca lo envía al servidor.

export function aEnlace(datos) {
  const util = Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== '' && v !== false && v != null));
  const bytes = new TextEncoder().encode(JSON.stringify(util));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deEnlace(texto) {
  try {
    const bin = atob(texto.replace(/-/g, '+').replace(/_/g, '/'));
    const datos = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null;
    // Solo textos, números y casillas: nada que pueda ejecutarse
    return Object.fromEntries(Object.entries(datos).filter(([k, v]) => /^[\w\-ñ]+$/u.test(k) && ['string', 'number', 'boolean'].includes(typeof v)).map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 200) : v]));
  } catch {
    return null;
  }
}
