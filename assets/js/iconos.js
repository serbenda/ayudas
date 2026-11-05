// Iconos de trazo (24×24) que toman el color del texto

export const ICONOS = {
  monedas: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7 M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  familia: 'M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M16 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M3.5 20v-5a4.5 4.5 0 0 1 9 0v5 M11.5 15a4.5 4.5 0 0 1 9 0v5',
  mayores: 'M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M9 21l2-6 M11 15l1-6 3 3 M12 9l-3 3 M17 12v9 M17 12a1.5 1.5 0 0 0-3 0',
  cuidados: 'M12 10.5 9.8 8.3a2 2 0 1 1 2.2-3 2 2 0 1 1 2.2 3Z M3 14v7 M3 15h3l4 2h4a1.5 1.5 0 0 0 0-3h-3 M14 16l5-2.5a1.5 1.5 0 0 1 1.6 2.5L14 20H6',
  casa: 'M3 11 12 3l9 8 M5 9.5V21h14V9.5 M10 21v-6h4v6',
  impuestos: 'M6 3h9l4 4v14H6Z M14 3v5h5 M9.5 17l5-6 M10 11.5h.01 M14 16.5h.01',
  otras: 'M2 9l10-5 10 5-10 5Z M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5 M22 9v6',
  escudo: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6Z M9 12l2 2 4-4',
};

export function icono(nombre) {
  const d = ICONOS[nombre];
  return d ? `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>` : '';
}
