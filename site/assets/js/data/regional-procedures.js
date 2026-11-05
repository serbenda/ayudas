// Quién valora la dependencia y la discapacidad en cada comunidad y dónde se empieza.
// Revisado en las webs de cada comunidad y en el directorio de centros de valoración del SID (INICO, Universidad de Salamanca), noviembre de 2026.
// Madrid y Andalucía tienen sus pasos escritos a mano en tramites.js.

export const REGIONAL_ASSESSMENT = {
  andalucia: {
    disability: { who: 'el Centro de Valoración y Orientación (CVO) de tu provincia', web: 'juntadeandalucia.es', phone: 'andalucia' },
  },
  aragon: {
    dependency: { starts: 'los servicios sociales de tu comarca o ayuntamiento', who: 'el Instituto Aragonés de Servicios Sociales (IASS)', web: 'aragon.es' },
    disability: { who: 'los centros de valoración del IASS en Huesca, Teruel y Zaragoza', web: 'aragon.es' },
  },
  asturias: {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento', who: 'la Consejería de Derechos Sociales y Bienestar', web: 'asturias.es' },
    disability: { who: 'los centros de valoración de Oviedo, Gijón y Avilés', web: 'asturias.es' },
  },
  baleares: {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento o un punto de atención de la Dirección General de Dependencia (Mallorca, Menorca, Ibiza o Formentera)', who: 'la Dirección General de Atención a la Dependencia del Govern', web: 'caib.es', phone: 'balearesDependencia' },
    disability: { who: 'los centros de valoración de Palma, Inca, Manacor, Maó e Ibiza', web: 'caib.es', phone: 'balearesDependencia' },
  },
  canarias: {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento', who: 'el Gobierno de Canarias', web: 'sede.gobiernodecanarias.org' },
    disability: { who: 'los centros de valoración de Las Palmas de Gran Canaria y Santa Cruz de Tenerife (en algunas islas, a través del Cabildo)', web: 'sede.gobiernodecanarias.org' },
  },
  cantabria: {
    dependency: { starts: 'los servicios sociales de atención primaria de tu ayuntamiento', who: 'el Instituto Cántabro de Servicios Sociales (ICASS)', web: 'serviciossocialescantabria.org' },
    disability: { who: 'el centro de valoración del ICASS en Santander', web: 'serviciossocialescantabria.org' },
  },
  'castilla-leon': {
    dependency: { starts: 'el CEAS (Centro de Acción Social) de tu zona', who: 'la Gerencia de Servicios Sociales de la Junta', web: 'serviciossociales.jcyl.es' },
    disability: { who: 'el centro base de tu provincia', web: 'serviciossociales.jcyl.es' },
  },
  'castilla-mancha': {
    dependency: { starts: 'los servicios sociales de atención primaria de tu ayuntamiento', who: 'la Delegación Provincial de Bienestar Social', web: 'jccm.es' },
    disability: { who: 'el centro base de tu provincia (Albacete, Ciudad Real, Cuenca, Guadalajara, Toledo o Talavera)', web: 'jccm.es' },
  },
  cataluna: {
    dependency: { starts: 'los servicios sociales básicos de tu ayuntamiento', who: 'el Servei de Valoració de la Dependència (SEVAD) de la Generalitat', web: 'gencat.cat', phone: 'cataluna' },
    disability: { who: 'los CAD (Centres d\'Atenció a Persones amb Discapacitat) de la Generalitat', web: 'gencat.cat', phone: 'cataluna' },
  },
  valencia: {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento', who: 'la Conselleria de Servicios Sociales', web: 'gva.es', phone: 'valencia' },
    disability: { who: 'los Centros de Valoración y Orientación de Discapacidades de Alicante, Castellón o Valencia', web: 'gva.es', phone: 'valencia' },
  },
  extremadura: {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento', who: 'el SEPAD (Servicio Extremeño de Promoción de la Autonomía y Atención a la Dependencia)', web: 'juntaex.es' },
    disability: { who: 'los CADEX (Centros de Atención a la Discapacidad en Extremadura) de Badajoz o Cáceres', web: 'juntaex.es' },
  },
  galicia: {
    dependency: { starts: 'los servicios sociales comunitarios de tu concello', who: 'la Xunta de Galicia', web: 'sede.xunta.gal' },
    disability: { who: 'los Equipos de Valoración e Orientación (EVO) de la Xunta', web: 'sede.xunta.gal' },
  },
  murcia: {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento', who: 'el IMAS (Instituto Murciano de Acción Social)', web: 'carm.es' },
    disability: { who: 'los centros de valoración del IMAS en Murcia, Cartagena y Lorca', web: 'carm.es' },
  },
  navarra: {
    dependency: { starts: 'los servicios sociales de base de tu zona', who: 'la Agencia Navarra de Autonomía y Desarrollo de las Personas', web: 'navarra.es' },
    disability: { who: 'la Agencia Navarra de Autonomía y Desarrollo de las Personas, en Pamplona', web: 'navarra.es' },
  },
  'pais-vasco': {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento', who: 'tu Diputación Foral (Álava, Bizkaia o Gipuzkoa)', web: 'la web de tu diputación' },
    disability: { who: 'tu Diputación Foral (Álava, Bizkaia o Gipuzkoa)', web: 'la web de tu diputación' },
  },
  rioja: {
    dependency: { starts: 'los servicios sociales de tu ayuntamiento', who: 'el Centro de Valoración de la Discapacidad y la Dependencia del Gobierno de La Rioja', web: 'larioja.org' },
    disability: { who: 'el Centro de Valoración de la Discapacidad y la Dependencia, en Logroño', web: 'larioja.org' },
  },
  ceuta: {
    dependency: { starts: 'los servicios sociales de la Ciudad', who: 'el IMSERSO (Dirección Territorial de Ceuta)', web: 'imserso.es' },
    disability: { who: 'el centro base del IMSERSO en Ceuta', web: 'imserso.es' },
  },
  melilla: {
    dependency: { starts: 'los servicios sociales de la Ciudad', who: 'el IMSERSO (Dirección Territorial de Melilla)', web: 'imserso.es' },
    disability: { who: 'el centro base del IMSERSO en Melilla', web: 'imserso.es' },
  },
};

export function dependencySteps(v) {
  return [
    `Pide cita en ${v.starts}: te ayudan con la solicitud y hacen el «informe social».`,
    'Pide a tu médico de cabecera el «informe de salud» para la dependencia.',
    `Presenta la solicitud de valoración de la dependencia. La resuelve ${v.who}. Se puede hacer en ${v.web} (con Cl@ve o certificado) o en una oficina de registro.`,
    'Te llaman para una visita en casa. Un técnico mira lo que puedes hacer y lo que no.',
    'Te llega una carta con el grado y, después, el plan de ayudas (PIA).',
  ];
}

export function disabilitySteps(v) {
  return [
    'Pide a tu médico los informes de tus problemas de salud.',
    `Rellena la solicitud de reconocimiento del grado de discapacidad. Te valoran en ${v.who}.`,
    `Preséntala en ${v.web} (con Cl@ve o certificado) o en una oficina de registro.`,
    'Te citan para la valoración y te mandan la resolución con tu porcentaje.',
  ];
}

// Teléfono de información general de cada comunidad (solo los comprobados en su web oficial)
export const REGION_INFO_PHONE = {
  andalucia: 'andalucia', cataluna: 'cataluna', valencia: 'valencia', madrid: 'madrid012',
  baleares: 'baleares', galicia: 'galicia', 'castilla-mancha': 'castillaMancha', 'castilla-leon': 'castillaLeon',
};
