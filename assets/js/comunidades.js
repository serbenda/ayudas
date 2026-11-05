// Lo que cambia de una comunidad a otra: cómo se llama su renta mínima y dónde se pide.
// Revisado en las webs oficiales de cada comunidad (noviembre de 2026).
// importe: lo máximo al mes para una persona sola; maximo: el tope para los hogares más grandes; anio: año de la cifra.
// Cifras de 2025: Informe de Rentas Mínimas de Inserción 2025 del Ministerio de Derechos Sociales (cuadro 1 y apartado 3.3).
// Cifras de 2026: Andalucía y Canarias (igual que el IMV), Baleares (Govern, desde junio), Navarra (Orden Foral 5/2026) y Madrid (tope del SMI).

import { euros } from './formato.js';

export const RENTA_CCAA = {
  andalucia: { importe: 733.6, maximo: 1613.92, anio: 2026, nombre: 'Renta Mínima de Inserción Social (RMISA)', sede: 'https://www.juntadeandalucia.es/', nota: 'No se puede cobrar a la vez que el IMV, salvo en casos urgentes.' },
  aragon: { importe: 700, maximo: 1540, anio: 2025, nombre: 'Prestación Aragonesa Complementaria del IMV', sede: 'https://www.aragon.es/', nota: 'Complementa al IMV: hay que cobrarlo o haberlo pedido.' },
  asturias: { importe: 501.67, maximo: 827.74, anio: 2025, nombre: 'Salario Social Básico', sede: 'https://socialasturias.asturias.es/' },
  baleares: { importe: 757.63, maximo: 1666.8, anio: 2026, nombre: 'Renta Social Garantizada', sede: 'https://www.caib.es/' },
  canarias: { importe: 733.6, maximo: 1613.92, anio: 2026, nombre: 'Renta Canaria de Ciudadanía', sede: 'https://www.gobiernodecanarias.org/' },
  cantabria: { importe: 480, maximo: 750, anio: 2025, nombre: 'Renta Social Básica', sede: 'https://www.serviciossocialescantabria.org/' },
  'castilla-leon': { importe: 480, maximo: 780, anio: 2025, nombre: 'Renta Garantizada de Ciudadanía', sede: 'https://www.tramitacastillayleon.jcyl.es/', nota: 'Se empieza en el CEAS (Centro de Acción Social) de tu zona.' },
  'castilla-mancha': { importe: 525, maximo: 813.75, anio: 2025, nombre: 'Ingreso Mínimo de Solidaridad', sede: 'https://www.jccm.es/', nota: 'En 2026 solo se renueva para quien ya la tenía. No hay altas nuevas.' },
  cataluna: { importe: 801.85, maximo: 1459.36, anio: 2025, nombre: 'Renta Garantizada de Ciudadanía', sede: 'https://web.gencat.cat/' },
  valencia: { importe: 750.15, maximo: 1178.8, anio: 2025, nombre: 'Renta Valenciana de Inclusión', sede: 'https://www.gva.es/' },
  extremadura: { importe: 600, maximo: 960, anio: 2025, nombre: 'Renta Extremeña Garantizada', sede: 'https://www.juntaex.es/', nota: 'Se puede pedir todo el año.' },
  galicia: { importe: 469.2, maximo: 840, anio: 2025, nombre: 'Renta de Inclusión Social de Galicia (RISGA)', sede: 'https://sede.xunta.gal/' },
  madrid: { importe: 469.93, maximo: 1221, anio: 2026, nombre: 'Renta Mínima de Inserción (RMI)', sede: 'https://www.comunidad.madrid/', nota: 'Se pide en los servicios sociales de tu municipio.' },
  murcia: { importe: 480, maximo: 900, anio: 2025, nombre: 'Renta Básica de Inserción', sede: 'https://sede.carm.es/' },
  navarra: { importe: 810.83, maximo: 1621.66, anio: 2026, nombre: 'Renta Garantizada', sede: 'https://www.navarra.es/' },
  'pais-vasco': { importe: 853.28, maximo: null, anio: 2025, nombre: 'Renta de Garantía de Ingresos (RGI)', sede: 'https://www.lanbide.euskadi.eus/', nota: 'La gestiona Lanbide, que en Euskadi también tramita el IMV.' },
  rioja: { importe: 480, maximo: 750, anio: 2025, nombre: 'Renta de Ciudadanía', sede: 'https://www.larioja.org/' },
  ceuta: { importe: 600, maximo: 760, anio: 2025, nombre: 'Ingreso Mínimo de Inserción Social', sede: 'https://www.ceuta.es/', nota: 'Pregunta en los servicios sociales de la Ciudad.' },
  melilla: { importe: 328, maximo: 656, anio: 2025, nombre: 'Ingreso Melillense de Integración', sede: 'https://www.melilla.es/', nota: 'Pregunta en los servicios sociales de la Ciudad.' },
};

// Ayudas que se piden en la comunidad (o que la comunidad gestiona aunque sean estatales)
export const AYUDAS_DE_LA_COMUNIDAD = [
  'renta-minima', 'pnc-jubilacion', 'pnc-invalidez', 'pnc-alquiler', 'dependencia-valoracion', 'dependencia-prestacion', 'dependencia-servicios',
  'certificado-discapacidad', 'titulo-familia-numerosa', 'escuela-infantil', 'alquiler-joven', 'alquiler-general', 'bono-termico', 'deducciones-ccaa',
];

// Grandes ciudades con ayudas propias (además de Madrid, que tiene su propia pregunta)
export const CIUDADES = {
  cataluna: { id: 'barcelona', nombre: 'Barcelona' },
  valencia: { id: 'valencia', nombre: 'València' },
  aragon: { id: 'zaragoza', nombre: 'Zaragoza' },
  andalucia: { id: 'malaga', nombre: 'Málaga' },
};

// Ayudas propias de una comunidad o de su capital
export const AYUDAS_PROPIAS = {
  madrid: { comunidad: ['madrid-natalidad', 'rmi-madrid', 'agua-canal', 'vivienda-social-madrid', 'transporte-madrid'], capital: ['tarjeta-familias', 'escuela-infantil-madrid', 'teleasistencia-madrid'], nombreCapital: 'la ciudad de Madrid' },
  cataluna: { comunidad: [], capital: ['fons-infancia-barcelona'], nombreCapital: 'Barcelona' },
  valencia: { comunidad: [], capital: ['natalidad-valencia'], nombreCapital: 'la ciudad de València' },
  aragon: { comunidad: [], capital: ['urgencia-zaragoza'], nombreCapital: 'Zaragoza' },
  andalucia: { comunidad: [], capital: ['nos-cuidamos-malaga'], nombreCapital: 'Málaga' },
  'pais-vasco': { comunidad: ['aes-euskadi'], capital: [] },
};


/** Frase con lo que da la renta mínima de una comunidad */
export function cuantiaRenta(ccaa) {
  const r = RENTA_CCAA[ccaa];
  if (!r?.importe) return null;
  return `Hasta ${euros(r.importe)} al mes para una persona sola${r.maximo ? ` y hasta ${euros(r.maximo)} para los hogares más grandes` : ''} (cifras de ${r.anio}).`;
}

export function ayudasDe(ccaa) {
  const propias = AYUDAS_PROPIAS[ccaa];
  // En Madrid la RMI propia sustituye a la ficha general de renta mínima
  const comunes = propias?.comunidad.includes('rmi-madrid') ? AYUDAS_DE_LA_COMUNIDAD.filter((id) => id !== 'renta-minima') : AYUDAS_DE_LA_COMUNIDAD;
  return { comunes, propias: propias?.comunidad ?? [], capital: propias?.capital ?? [], nombreCapital: propias?.nombreCapital };
}
