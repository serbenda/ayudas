// Quién valora la dependencia y la discapacidad en cada comunidad y dónde se empieza.
// Revisado en las webs de cada comunidad y en el directorio de centros de valoración del SID (INICO, Universidad de Salamanca), noviembre de 2026.
// Madrid y Andalucía tienen sus pasos escritos a mano en tramites.js.

export const VALORACION_CCAA = {
  andalucia: {
    discapacidad: { quien: 'el Centro de Valoración y Orientación (CVO) de tu provincia', web: 'juntadeandalucia.es', telefono: 'andalucia' },
  },
  aragon: {
    dependencia: { empieza: 'los servicios sociales de tu comarca o ayuntamiento', quien: 'el Instituto Aragonés de Servicios Sociales (IASS)', web: 'aragon.es' },
    discapacidad: { quien: 'los centros de valoración del IASS en Huesca, Teruel y Zaragoza', web: 'aragon.es' },
  },
  asturias: {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento', quien: 'la Consejería de Derechos Sociales y Bienestar', web: 'asturias.es' },
    discapacidad: { quien: 'los centros de valoración de Oviedo, Gijón y Avilés', web: 'asturias.es' },
  },
  baleares: {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento o un punto de atención de la Dirección General de Dependencia (Mallorca, Menorca, Ibiza o Formentera)', quien: 'la Dirección General de Atención a la Dependencia del Govern', web: 'caib.es', telefono: 'balearesDependencia' },
    discapacidad: { quien: 'los centros de valoración de Palma, Inca, Manacor, Maó e Ibiza', web: 'caib.es', telefono: 'balearesDependencia' },
  },
  canarias: {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento', quien: 'el Gobierno de Canarias', web: 'sede.gobiernodecanarias.org' },
    discapacidad: { quien: 'los centros de valoración de Las Palmas de Gran Canaria y Santa Cruz de Tenerife (en algunas islas, a través del Cabildo)', web: 'sede.gobiernodecanarias.org' },
  },
  cantabria: {
    dependencia: { empieza: 'los servicios sociales de atención primaria de tu ayuntamiento', quien: 'el Instituto Cántabro de Servicios Sociales (ICASS)', web: 'serviciossocialescantabria.org' },
    discapacidad: { quien: 'el centro de valoración del ICASS en Santander', web: 'serviciossocialescantabria.org' },
  },
  'castilla-leon': {
    dependencia: { empieza: 'el CEAS (Centro de Acción Social) de tu zona', quien: 'la Gerencia de Servicios Sociales de la Junta', web: 'serviciossociales.jcyl.es' },
    discapacidad: { quien: 'el centro base de tu provincia', web: 'serviciossociales.jcyl.es' },
  },
  'castilla-mancha': {
    dependencia: { empieza: 'los servicios sociales de atención primaria de tu ayuntamiento', quien: 'la Delegación Provincial de Bienestar Social', web: 'jccm.es' },
    discapacidad: { quien: 'el centro base de tu provincia (Albacete, Ciudad Real, Cuenca, Guadalajara, Toledo o Talavera)', web: 'jccm.es' },
  },
  cataluna: {
    dependencia: { empieza: 'los servicios sociales básicos de tu ayuntamiento', quien: 'el Servei de Valoració de la Dependència (SEVAD) de la Generalitat', web: 'gencat.cat', telefono: 'cataluna' },
    discapacidad: { quien: 'los CAD (Centres d\'Atenció a Persones amb Discapacitat) de la Generalitat', web: 'gencat.cat', telefono: 'cataluna' },
  },
  valencia: {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento', quien: 'la Conselleria de Servicios Sociales', web: 'gva.es', telefono: 'valencia' },
    discapacidad: { quien: 'los Centros de Valoración y Orientación de Discapacidades de Alicante, Castellón o Valencia', web: 'gva.es', telefono: 'valencia' },
  },
  extremadura: {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento', quien: 'el SEPAD (Servicio Extremeño de Promoción de la Autonomía y Atención a la Dependencia)', web: 'juntaex.es' },
    discapacidad: { quien: 'los CADEX (Centros de Atención a la Discapacidad en Extremadura) de Badajoz o Cáceres', web: 'juntaex.es' },
  },
  galicia: {
    dependencia: { empieza: 'los servicios sociales comunitarios de tu concello', quien: 'la Xunta de Galicia', web: 'sede.xunta.gal' },
    discapacidad: { quien: 'los Equipos de Valoración e Orientación (EVO) de la Xunta', web: 'sede.xunta.gal' },
  },
  murcia: {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento', quien: 'el IMAS (Instituto Murciano de Acción Social)', web: 'carm.es' },
    discapacidad: { quien: 'los centros de valoración del IMAS en Murcia, Cartagena y Lorca', web: 'carm.es' },
  },
  navarra: {
    dependencia: { empieza: 'los servicios sociales de base de tu zona', quien: 'la Agencia Navarra de Autonomía y Desarrollo de las Personas', web: 'navarra.es' },
    discapacidad: { quien: 'la Agencia Navarra de Autonomía y Desarrollo de las Personas, en Pamplona', web: 'navarra.es' },
  },
  'pais-vasco': {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento', quien: 'tu Diputación Foral (Álava, Bizkaia o Gipuzkoa)', web: 'la web de tu diputación' },
    discapacidad: { quien: 'tu Diputación Foral (Álava, Bizkaia o Gipuzkoa)', web: 'la web de tu diputación' },
  },
  rioja: {
    dependencia: { empieza: 'los servicios sociales de tu ayuntamiento', quien: 'el Centro de Valoración de la Discapacidad y la Dependencia del Gobierno de La Rioja', web: 'larioja.org' },
    discapacidad: { quien: 'el Centro de Valoración de la Discapacidad y la Dependencia, en Logroño', web: 'larioja.org' },
  },
  ceuta: {
    dependencia: { empieza: 'los servicios sociales de la Ciudad', quien: 'el IMSERSO (Dirección Territorial de Ceuta)', web: 'imserso.es' },
    discapacidad: { quien: 'el centro base del IMSERSO en Ceuta', web: 'imserso.es' },
  },
  melilla: {
    dependencia: { empieza: 'los servicios sociales de la Ciudad', quien: 'el IMSERSO (Dirección Territorial de Melilla)', web: 'imserso.es' },
    discapacidad: { quien: 'el centro base del IMSERSO en Melilla', web: 'imserso.es' },
  },
};

export function pasosDependencia(v) {
  return [
    `Pide cita en ${v.empieza}: te ayudan con la solicitud y hacen el «informe social».`,
    'Pide a tu médico de cabecera el «informe de salud» para la dependencia.',
    `Presenta la solicitud de valoración de la dependencia. La resuelve ${v.quien}. Se puede hacer en ${v.web} (con Cl@ve o certificado) o en una oficina de registro.`,
    'Te llaman para una visita en casa. Un técnico mira lo que puedes hacer y lo que no.',
    'Te llega una carta con el grado y, después, el plan de ayudas (PIA).',
  ];
}

export function pasosDiscapacidad(v) {
  return [
    'Pide a tu médico los informes de tus problemas de salud.',
    `Rellena la solicitud de reconocimiento del grado de discapacidad. Te valoran en ${v.quien}.`,
    `Preséntala en ${v.web} (con Cl@ve o certificado) o en una oficina de registro.`,
    'Te citan para la valoración y te mandan la resolución con tu porcentaje.',
  ];
}

// Teléfono de información general de cada comunidad (solo los comprobados en su web oficial)
export const INFO_CCAA = {
  andalucia: 'andalucia', cataluna: 'cataluna', valencia: 'valencia', madrid: 'madrid012',
  baleares: 'baleares', galicia: 'galicia', 'castilla-mancha': 'castillaMancha', 'castilla-leon': 'castillaLeon',
};
