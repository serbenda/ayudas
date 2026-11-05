// Lo que cambia de una comunidad a otra: cómo se llama su renta mínima y dónde se pide.
// Revisado en las webs oficiales de cada comunidad (noviembre de 2026).

export const RENTA_CCAA = {
  andalucia: { nombre: 'Renta Mínima de Inserción Social (RMISA)', sede: 'https://www.juntadeandalucia.es/', nota: 'No se puede cobrar a la vez que el IMV, salvo en casos urgentes.' },
  aragon: { nombre: 'Prestación Aragonesa Complementaria del IMV', sede: 'https://www.aragon.es/', nota: 'Complementa al IMV: hay que cobrarlo o haberlo pedido.' },
  asturias: { nombre: 'Salario Social Básico', sede: 'https://socialasturias.asturias.es/' },
  baleares: { nombre: 'Renta Social Garantizada', sede: 'https://www.caib.es/' },
  canarias: { nombre: 'Renta Canaria de Ciudadanía', sede: 'https://www.gobiernodecanarias.org/' },
  cantabria: { nombre: 'Renta Social Básica', sede: 'https://www.serviciossocialescantabria.org/' },
  'castilla-leon': { nombre: 'Renta Garantizada de Ciudadanía', sede: 'https://www.tramitacastillayleon.jcyl.es/', nota: 'Se empieza en el CEAS (Centro de Acción Social) de tu zona.' },
  'castilla-mancha': { nombre: 'Ingreso Mínimo de Solidaridad', sede: 'https://www.jccm.es/', nota: 'En 2026 solo se renueva para quien ya la tenía. No hay altas nuevas.' },
  cataluna: { nombre: 'Renta Garantizada de Ciudadanía', sede: 'https://web.gencat.cat/' },
  valencia: { nombre: 'Renta Valenciana de Inclusión', sede: 'https://www.gva.es/' },
  extremadura: { nombre: 'Renta Extremeña Garantizada', sede: 'https://www.juntaex.es/', nota: 'Se puede pedir todo el año.' },
  galicia: { nombre: 'Renta de Inclusión Social de Galicia (RISGA)', sede: 'https://sede.xunta.gal/' },
  madrid: { nombre: 'Renta Mínima de Inserción (RMI)', sede: 'https://www.comunidad.madrid/', nota: 'Se pide en los servicios sociales de tu municipio.' },
  murcia: { nombre: 'Renta Básica de Inserción', sede: 'https://sede.carm.es/' },
  navarra: { nombre: 'Renta Garantizada', sede: 'https://www.navarra.es/' },
  'pais-vasco': { nombre: 'Renta de Garantía de Ingresos (RGI)', sede: 'https://www.lanbide.euskadi.eus/', nota: 'La gestiona Lanbide, que en Euskadi también tramita el IMV.' },
  rioja: { nombre: 'Renta de Ciudadanía', sede: 'https://www.larioja.org/' },
  ceuta: { nombre: 'Ingreso Mínimo de Inserción Social', sede: 'https://www.ceuta.es/', nota: 'Pregunta en los servicios sociales de la Ciudad.' },
  melilla: { nombre: 'Ingreso Melillense de Integración', sede: 'https://www.melilla.es/', nota: 'Pregunta en los servicios sociales de la Ciudad.' },
};

// Ayudas que se piden en la comunidad (o que la comunidad gestiona aunque sean estatales)
export const AYUDAS_DE_LA_COMUNIDAD = [
  'renta-minima', 'pnc-jubilacion', 'pnc-invalidez', 'pnc-alquiler', 'dependencia-valoracion', 'dependencia-prestacion', 'dependencia-servicios',
  'certificado-discapacidad', 'titulo-familia-numerosa', 'escuela-infantil', 'alquiler-joven', 'alquiler-general', 'bono-termico', 'deducciones-ccaa',
];

// Ayudas propias de una comunidad o de su capital
export const AYUDAS_PROPIAS = {
  madrid: { comunidad: ['madrid-natalidad', 'rmi-madrid', 'agua-canal', 'vivienda-social-madrid', 'transporte-madrid'], capital: ['tarjeta-familias', 'escuela-infantil-madrid', 'teleasistencia-madrid'], nombreCapital: 'la ciudad de Madrid' },
};

export function ayudasDe(ccaa) {
  const propias = AYUDAS_PROPIAS[ccaa];
  // En Madrid la RMI propia sustituye a la ficha general de renta mínima
  const comunes = propias?.comunidad.includes('rmi-madrid') ? AYUDAS_DE_LA_COMUNIDAD.filter((id) => id !== 'renta-minima') : AYUDAS_DE_LA_COMUNIDAD;
  return { comunes, propias: propias?.comunidad ?? [], capital: propias?.capital ?? [], nombreCapital: propias?.nombreCapital };
}
