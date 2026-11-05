// Iconos de trazo (24×24) que toman el color del texto

export const ICONS = {
  monedas: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7 M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  familia: 'M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M16 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M3.5 20v-5a4.5 4.5 0 0 1 9 0v5 M11.5 15a4.5 4.5 0 0 1 9 0v5',
  mayores: 'M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M9 21l2-6 M11 15l1-6 3 3 M12 9l-3 3 M17 12v9 M17 12a1.5 1.5 0 0 0-3 0',
  cuidados: 'M12 10.5 9.8 8.3a2 2 0 1 1 2.2-3 2 2 0 1 1 2.2 3Z M3 14v7 M3 15h3l4 2h4a1.5 1.5 0 0 0 0-3h-3 M14 16l5-2.5a1.5 1.5 0 0 1 1.6 2.5L14 20H6',
  mapa: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z M9 4v14 M15 6v14',
  casa: 'M3 11 12 3l9 8 M5 9.5V21h14V9.5 M10 21v-6h4v6',
  impuestos: 'M6 3h9l4 4v14H6Z M14 3v5h5 M9.5 17l5-6 M10 11.5h.01 M14 16.5h.01',
  otras: 'M2 9l10-5 10 5-10 5Z M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5 M22 9v6',
  urgente: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7.5v5.5 M12 16.5h.01',
  telefono: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  papeles: 'M7 3h7l5 5v13H7Z M14 3v5h5 M10 13h6 M10 17h6',
  altavoz: 'M4 9v6h4l5 4V5L8 9Z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12',
  escudo: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6Z M9 12l2 2 4-4',
};

export function icon(name) {
  const d = ICONS[name];
  return d ? `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>` : '';
}
