// Regional income tax (IRPF) deductions most relevant to families, older people, people with disabilities and tenants.
// Names: the Tax Agency's guide to regional deductions (2025 tax return).
// Amounts: Tax Agency (Madrid, 2025 tax return) and «Tributación autonómica. Medidas 2026» from the Ministry of Finance (Andalusia, Catalonia, Galicia).
// Navarre and the Basque Country have their own income tax (foral system): their deductions are with their foral treasury.

const AEAT = 'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025-deducciones-autonomicas/guia-deducciones-autonomicas/';

export const REGIONAL_DEDUCTIONS = {
  andalucia: {
    page: 'andalucia',
    figures: [
      'Nacimiento, adopción o acogida: 200 € por hijo (400 € en municipios que pierden población).',
      'Alquiler de tu casa (menores de 35, mayores de 65, víctimas de violencia o con discapacidad): 15 % del alquiler, hasta 1.200 € (1.500 € con discapacidad), con base de hasta 25.000 € (30.000 € en conjunta).',
      'Familia numerosa: 200 € (400 € si es especial).',
      'Familia monoparental: 100 €, más 100 € por cada abuelo mayor de 75 que viva con vosotros.',
      'Contribuyente con discapacidad: 150 €.',
    ],
    otras: ['Asistencia a personas con discapacidad', 'Ayuda doméstica', 'Gastos educativos', 'Familias con enfermedad celíaca'],
  },
  aragon: { page: 'aragon', otras: ['Nacimiento o adopción del tercer hijo o siguientes', 'Primer o segundo hijo en pueblos de menos de 10.000 habitantes', 'Hijo con discapacidad del 33 % o más', 'Guardería de menores de 3 años', 'Cuidado de personas dependientes', 'Mayores de 70 años', 'Libros de texto y material escolar', 'Clases de refuerzo'] },
  asturias: { page: 'principado-asturias', otras: ['Familias numerosas', 'Familias monoparentales', 'Partos múltiples', 'Centros de 0 a 3 años', 'Segundo hijo o siguientes en concejos en riesgo de despoblamiento', 'Acogida de mayores de 65 años', 'Alquiler de la vivienda habitual', 'Libros de texto y material escolar'] },
  baleares: { page: 'illes-balears', otras: ['Nacimiento', 'Adopción', 'Gastos de hijos menores de 6 años para conciliar', 'Discapacidad del declarante o de sus hijos', 'Gastos de mayores de 65 años o con discapacidad', 'Alquiler de la vivienda habitual', 'Libros de texto', 'Idiomas extraescolares', 'Estudios superiores fuera de tu isla'] },
  canarias: { page: 'canarias', otras: ['Nacimiento o adopción', 'Familias monoparentales', 'Familia numerosa', 'Guardería', 'Personas con discapacidad o mayores de 65 años', 'Familiares dependientes con discapacidad', 'Cuotas de empleados del hogar', 'Alquiler de la vivienda habitual', 'Estudios'] },
  cantabria: { page: 'cantabria', otras: ['Nacimiento y adopción', 'Familias monoparentales', 'Guardería', 'Cuidado de familiares (menores de 3, mayores de 70 o con discapacidad)', 'Ayuda doméstica', 'Alquiler para jóvenes, mayores o personas con discapacidad', 'Gastos de educación'] },
  'castilla-leon': { page: 'castilla-leon', otras: ['Familia numerosa', 'Nacimiento o adopción', 'Partos múltiples', 'Cuidado de hijos menores', 'Contribuyentes con discapacidad', 'Cuotas de empleados del hogar', 'Alquiler para jóvenes'] },
  'castilla-mancha': { page: 'castilla-mancha', otras: ['Nacimiento o adopción', 'Familia numerosa', 'Familia monoparental', 'Discapacidad del contribuyente o de familiares', 'Mayores de 75 años y cuidado de ascendientes', 'Guardería', 'Alquiler para menores de 36 años, familias numerosas, monoparentales o con discapacidad', 'Libros de texto e idiomas'] },
  cataluna: {
    page: 'cataluna',
    figures: [
      'Nacimiento, adopción o acogida: 150 € (300 € en declaración conjunta o en familia monoparental).',
      'Alquiler de tu casa (35 años o menos, en paro de larga duración, discapacidad del 65 %, viudos de 65 o más, familia numerosa o monoparental): 10 % del alquiler, hasta 500 € (1.000 € en familia numerosa o monoparental), con base de hasta 30.000 €.',
      'Víctimas de violencia de género: 20 % del alquiler, hasta 1.000 €.',
    ],
    otras: [],
  },
  valencia: { page: 'comunitat-valenciana', otras: ['Nacimiento, adopción o acogida', 'Partos múltiples', 'Hijo con discapacidad', 'Familia numerosa o monoparental', 'Guardería de menores de 3 años', 'Conciliación', 'Discapacidad del 33 % y 65 años o más', 'Ascendientes mayores de 75 (o de 65 con discapacidad)', 'Empleados del hogar para cuidados', 'Dos o más hijos', 'Alquiler de la vivienda habitual', 'Material escolar'] },
  extremadura: { page: 'extremadura', otras: ['Partos múltiples', 'Acogida de menores', 'Viudos', 'Cuidado de hijos menores de 14 años', 'Cuidado de familiares con discapacidad', 'Alquiler para menores de 36 años', 'Material escolar'] },
  galicia: {
    page: 'galicia',
    figures: [
      'Nacimiento o adopción (ese año y los dos siguientes), con base de hasta 22.000 €: 360 € el primer hijo, 1.200 € el segundo y 2.400 € el tercero y siguientes. Con más ingresos, 300 €.',
      'Guardería o cuidadora de menores de 3 años, trabajando los dos: 30 %, hasta 400 € (600 € con dos o más hijos).',
      'Alquiler para 35 años o menos: 10 %, hasta 300 € (20 % y 600 € con dos o más hijos menores), con base de hasta 22.000 €.',
      'Familia numerosa: 250 € (400 € si es especial).',
    ],
    otras: ['Familias con dos hijos', 'Mayores de 65 con discapacidad que necesitan ayuda de otra persona', 'Libros de texto y material escolar'],
  },
  madrid: {
    page: 'comunidad-madrid',
    figures: [
      'Nacimiento o adopción: 721,70 € por hijo, el año del nacimiento y los dos siguientes, con base de hasta 30.930 € (37.322,20 € en conjunta).',
      'Alquiler de tu casa si tienes menos de 40 años: 30 % del alquiler, hasta 1.237,20 €, con base de hasta 26.414,22 € (37.322,20 € en conjunta) y alquiler de más del 20 % de tu base.',
    ],
    otras: ['Cuidado de hijos menores de 3 años, mayores dependientes y personas con discapacidad', 'Cuidado de ascendientes', 'Acogida de mayores de 65 o con discapacidad', 'Familia numerosa', 'Familias con dos o más hijos e ingresos bajos', 'Gastos educativos'],
  },
  murcia: { page: 'region-murcia', otras: ['Guardería', 'Nacimiento o adopción', 'Conciliación', 'Familia monoparental', 'Contribuyentes con discapacidad', 'Acogida de mayores de 65 o con discapacidad', 'Alquiler de la vivienda habitual', 'Material escolar, libros de texto e idiomas'] },
  rioja: { page: 'rioja', otras: ['Nacimiento y adopción', 'Escuelas infantiles de 0 a 3 años', 'Acogida de menores', 'Obras para adaptar la casa a una discapacidad', 'Personas con ELA', 'Alquiler para menores de 36 años'] },
};

export const FORAL_REGIONS = {
  navarra: { name: 'Hacienda Foral de Navarra', url: 'https://hacienda.navarra.es/' },
  'pais-vasco': { name: 'la Hacienda Foral de tu territorio (Álava, Bizkaia o Gipuzkoa)', url: 'https://www.euskadi.eus/' },
};

/** What the regional deductions card shows for a region, or null*/
export function deductionsOf(region) {
  if (FORAL_REGIONS[region]) return { foral: FORAL_REGIONS[region] };
  const d = REGIONAL_DEDUCTIONS[region];
  if (!d) return null;
  return { figures: d.figures ?? [], otras: d.otras, url: `${AEAT}${d.page}.html` };
}
