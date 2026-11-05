// What changes from one region to another: what its minimum income is called and where to apply.
// Reviewed on each region's official website (November 2026).
// payment: the monthly maximum for a person living alone; maximum: the cap for the largest households; year: year of the figure.
// 2025 figures: 2025 Minimum Insertion Income Report from the Ministry of Social Rights (table 1 and section 3.3).
// 2026 figures: Andalusia and Canary Islands (same as the IMV), Balearic Islands (Govern, from June), Navarre (Orden Foral 5/2026) and Madrid (minimum wage cap).

import { euros } from '../lib/format.js';
import { BY_REGION } from './regional-benefits.js';

export const MINIMUM_INCOME = {
  andalucia: {
    payment: 733.6,
    maximum: 1613.92,
    year: 2026,
    name: 'Renta Mínima de Inserción Social (RMISA)',
    website: 'https://www.juntadeandalucia.es/',
    note: 'No se puede cobrar a la vez que el IMV, salvo en casos urgentes.',
  },
  aragon: {
    payment: 700,
    maximum: 1540,
    year: 2025,
    name: 'Prestación Aragonesa Complementaria del IMV',
    website: 'https://www.aragon.es/',
    note: 'Complementa al IMV: hay que cobrarlo o haberlo pedido.',
  },
  asturias: { payment: 501.67, maximum: 827.74, year: 2025, name: 'Salario Social Básico', website: 'https://socialasturias.asturias.es/' },
  baleares: { payment: 757.63, maximum: 1666.8, year: 2026, name: 'Renta Social Garantizada', website: 'https://www.caib.es/' },
  canarias: { payment: 733.6, maximum: 1613.92, year: 2026, name: 'Renta Canaria de Ciudadanía', website: 'https://www.gobiernodecanarias.org/' },
  cantabria: { payment: 480, maximum: 750, year: 2025, name: 'Renta Social Básica', website: 'https://www.serviciossocialescantabria.org/' },
  'castilla-leon': {
    payment: 480,
    maximum: 780,
    year: 2025,
    name: 'Renta Garantizada de Ciudadanía',
    website: 'https://www.tramitacastillayleon.jcyl.es/',
    note: 'Se empieza en el CEAS (Centro de Acción Social) de tu zona.',
  },
  'castilla-mancha': {
    payment: 525,
    maximum: 813.75,
    year: 2025,
    name: 'Ingreso Mínimo de Solidaridad',
    website: 'https://www.jccm.es/',
    note: 'En 2026 solo se renueva para quien ya la tenía. No hay altas nuevas.',
  },
  cataluna: { payment: 801.85, maximum: 1459.36, year: 2025, name: 'Renta Garantizada de Ciudadanía', website: 'https://web.gencat.cat/' },
  valencia: { payment: 750.15, maximum: 1178.8, year: 2025, name: 'Renta Valenciana de Inclusión', website: 'https://www.gva.es/' },
  extremadura: { payment: 600, maximum: 960, year: 2025, name: 'Renta Extremeña Garantizada', website: 'https://www.juntaex.es/', note: 'Se puede pedir todo el año.' },
  galicia: { payment: 469.2, maximum: 840, year: 2025, name: 'Renta de Inclusión Social de Galicia (RISGA)', website: 'https://sede.xunta.gal/' },
  madrid: { payment: 469.93, maximum: 1221, year: 2026, name: 'Renta Mínima de Inserción (RMI)', website: 'https://www.comunidad.madrid/', note: 'Se pide en los servicios sociales de tu municipio.' },
  murcia: { payment: 480, maximum: 900, year: 2025, name: 'Renta Básica de Inserción', website: 'https://sede.carm.es/' },
  navarra: { payment: 810.83, maximum: 1621.66, year: 2026, name: 'Renta Garantizada', website: 'https://www.navarra.es/' },
  'pais-vasco': {
    payment: 853.28,
    maximum: null,
    year: 2025,
    name: 'Renta de Garantía de Ingresos (RGI)',
    website: 'https://www.lanbide.euskadi.eus/',
    note: 'La gestiona Lanbide, que en Euskadi también tramita el IMV.',
  },
  rioja: { payment: 480, maximum: 750, year: 2025, name: 'Renta de Ciudadanía', website: 'https://www.larioja.org/' },
  ceuta: { payment: 600, maximum: 760, year: 2025, name: 'Ingreso Mínimo de Inserción Social', website: 'https://www.ceuta.es/', note: 'Pregunta en los servicios sociales de la Ciudad.' },
  melilla: { payment: 328, maximum: 656, year: 2025, name: 'Ingreso Melillense de Integración', website: 'https://www.melilla.es/', note: 'Pregunta en los servicios sociales de la Ciudad.' },
};

// Benefits applied for in the region (or managed by the region even if they are national)
export const MANAGED_BY_REGION = [
  'renta-minima',
  'pnc-jubilacion',
  'pnc-invalidez',
  'pnc-alquiler',
  'dependencia-valoracion',
  'dependencia-prestacion',
  'dependencia-servicios',
  'certificado-discapacidad',
  'titulo-familia-numerosa',
  'escuela-infantil',
  'alquiler-joven',
  'alquiler-general',
  'bono-termico',
  'deducciones-ccaa',
];

// Large cities with their own benefits (besides Madrid, which has its own question)
export const CITIES = {
  cataluna: { id: 'barcelona', name: 'Barcelona' },
  valencia: { id: 'valencia', name: 'València' },
  aragon: { id: 'zaragoza', name: 'Zaragoza' },
  andalucia: { id: 'malaga', name: 'Málaga' },
};

// A region's or its capital's own benefits
export const OWN_BENEFITS = {
  madrid: {
    regional: ['madrid-natalidad', 'rmi-madrid', 'agua-canal', 'vivienda-social-madrid', 'transporte-madrid'],
    capital: ['tarjeta-familias', 'escuela-infantil-madrid', 'teleasistencia-madrid'],
    cityName: 'la ciudad de Madrid',
  },
  cataluna: { regional: [], capital: ['fons-infancia-barcelona'], cityName: 'Barcelona' },
  valencia: { regional: [], capital: ['natalidad-valencia'], cityName: 'la ciudad de València' },
  aragon: { regional: [], capital: ['urgencia-zaragoza'], cityName: 'Zaragoza' },
  andalucia: { regional: [], capital: ['nos-cuidamos-malaga'], cityName: 'Málaga' },
  'pais-vasco': { regional: ['aes-euskadi'], capital: [] },
};

/** Sentence with what a region's minimum income pays*/
export function minimumIncomeAmount(region) {
  const r = MINIMUM_INCOME[region];
  if (!r?.payment) return null;
  return `Hasta ${euros(r.payment)} al mes para una persona sola${r.maximum ? ` y hasta ${euros(r.maximum)} para los hogares más grandes` : ''} (cifras de ${r.year}).`;
}

export function benefitsOf(region) {
  const base = OWN_BENEFITS[region];
  const own = base || BY_REGION[region] ? { ...base, regional: [...(base?.regional ?? []), ...(BY_REGION[region] ?? [])], capital: base?.capital ?? [] } : undefined;
  // In Madrid its own RMI replaces the general minimum income card
  const common = own?.regional.includes('rmi-madrid') ? MANAGED_BY_REGION.filter((id) => id !== 'renta-minima') : MANAGED_BY_REGION;
  return { common, own: own?.regional ?? [], capital: own?.capital ?? [], cityName: own?.cityName };
}
