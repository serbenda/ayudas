// Lo que hace falta para pedir las ayudas: papeles, teléfonos y palabras difíciles explicadas.
// Teléfonos comprobados en fuentes oficiales en noviembre de 2026.

/** Papeles que se piden. Cada ayuda dice cuáles necesita (por su id). */
export const DOCUMENTS = {
  dni: { name: 'DNI o NIE', benefit: 'Tuyo y de las personas que viven contigo.' },
  residencia: { name: 'Tarjeta de residencia (TIE)', benefit: 'Solo si no tienes nacionalidad española.' },
  padron: { name: 'Certificado de empadronamiento', benefit: 'Lo da tu ayuntamiento. Pide el «colectivo»: el que dice quién vive en la casa.' },
  padronHistorico: { name: 'Empadronamiento histórico', benefit: 'Dice desde cuándo vives en cada sitio. Lo da tu ayuntamiento.' },
  libroFamilia: { name: 'Libro de familia o certificado de nacimiento', benefit: 'Para demostrar quiénes son tus hijos o tu pareja.' },
  iban: { name: 'Número de cuenta del banco (IBAN)', benefit: 'Te lo da tu banco. La cuenta tiene que estar a tu nombre.' },
  ingresos: { name: 'Papeles de lo que cobráis', benefit: 'Nóminas, pensiones o la declaración de la renta del año pasado.' },
  vidaLaboral: { name: 'Informe de vida laboral', benefit: 'Dice cuánto has trabajado. Se pide gratis en la Seguridad Social.' },
  demanda: { name: 'Inscripción como demandante de empleo', benefit: 'Te la dan en la oficina de empleo de tu comunidad.' },
  certEmpresa: { name: 'Certificado de empresa', benefit: 'Lo manda tu empresa al SEPE cuando acaba tu contrato.' },
  certDiscapacidad: { name: 'Certificado de discapacidad', benefit: 'El que dice el porcentaje (33 %, 65 %…).' },
  informeSalud: { name: 'Informe de salud', benefit: 'Pídeselo a tu médico de cabecera.' },
  informeSocial: { name: 'Informe social', benefit: 'Te lo hacen en los servicios sociales de tu ayuntamiento.' },
  resolucionDependencia: { name: 'Resolución de dependencia', benefit: 'La carta que dice el grado (I, II o III).' },
  alquiler: { name: 'Contrato de alquiler y recibos', benefit: 'El contrato y los últimos recibos pagados.' },
  facturaLuz: { name: 'Una factura de la luz', benefit: 'Para saber tu compañía y tu número de contrato (CUPS).' },
  tituloFN: { name: 'Título de familia numerosa', benefit: 'El carné en vigor.' },
  informeEmbarazo: { name: 'Informe médico del embarazo', benefit: 'Con la semana de embarazo y la fecha prevista de parto.' },
  cartaPension: { name: 'Carta de tu pensión', benefit: 'La de la Seguridad Social con lo que cobras.' },
  justificanteImv: { name: 'Justificante de haber pedido el IMV', benefit: 'El resguardo que te dan al pedir el Ingreso Mínimo Vital.' },
  extractos: { name: 'Movimientos del banco de los 2 últimos meses', benefit: 'De todas las cuentas de las personas que viven contigo.' },
  ordenProteccion: { name: 'Orden de protección o informe', benefit: 'O un informe de servicios sociales o del centro de la mujer. No hace falta denuncia para todo.' },
};

/** Teléfonos. «gratis» solo cuando la fuente oficial lo dice. */
export const PHONES = {
  emergencias: { number: '112', text: 'Emergencias', when: 'Si hay peligro ahora mismo.', free: true },
  violencia: { number: '016', text: 'Violencia contra las mujeres', when: 'Las 24 horas. No sale en la factura del teléfono. También por WhatsApp: 600 000 016.', free: true },
  crisis: { number: '024', text: 'Línea de atención a la conducta suicida', when: 'Si piensas en hacerte daño o conoces a alguien. 24 horas.', free: true },
  cruzRoja: { number: '900 107 917', text: 'Cruz Roja Te Escucha', when: 'Si te sientes solo o sola, o estás pasando un mal momento.', free: true },
  imv: { number: '900 20 22 22', text: 'Ingreso Mínimo Vital', when: 'De lunes a viernes, de 9:00 a 14:30.', free: true },
  citaInss: { number: '91 541 25 30', text: 'Cita previa de la Seguridad Social', when: 'Para pensiones y prestaciones. Las 24 horas (contesta una máquina).' },
  infoInss: { number: '91 542 11 76', text: 'Información de la Seguridad Social', when: 'Pensiones y prestaciones. De lunes a viernes, de 9:00 a 20:00.' },
  sepe: { number: '060', text: 'Información del SEPE (paro)', when: 'Puede tener coste.' },
  citaSepe: { number: '91 926 79 70', text: 'Cita previa del SEPE', when: 'Para ir a la oficina del paro.' },
  citaAeat: { number: '91 290 13 40', text: 'Cita previa de Hacienda', when: 'Para la renta y las deducciones.' },
  madrid012: { number: '012', text: 'Comunidad de Madrid', when: 'Información de todas sus ayudas.' },
  madridPnc: { number: '91 392 56 86', text: 'Pensiones no contributivas (Madrid)', when: 'Información sobre tu solicitud.' },
  andalucia: { number: '955 012 012', text: 'Junta de Andalucía', when: 'Información de sus ayudas. También el 012.' },
  cataluna: { number: '012', text: 'Generalitat de Catalunya', when: 'Gratis. Para pedir cita, dudas y ver cómo va tu trámite.', free: true },
  valencia: { number: '012', text: 'Generalitat Valenciana', when: 'Información de sus ayudas.' },
  balearesDependencia: { number: '971 177 200', text: 'Govern balear: dependencia y discapacidad', when: 'Dirección General de Atención a la Dependencia.' },
  canal: { number: '900 365 365', text: 'Canal de Isabel II', when: 'Gratis. Atención comercial en días laborables de 8:30 a 20:00; averías, a cualquier hora.', free: true },
  baleares: { number: '012', text: 'Govern de les Illes Balears', when: 'De lunes a viernes de 8 a 20 h y sábados de 9 a 14 h. Desde fuera de Baleares: 971 22 57 91.' },
  galicia: { number: '012', text: 'Xunta de Galicia', when: 'Información de sus ayudas y trámites.' },
  castillaMancha: { number: '012', text: 'Junta de Castilla-La Mancha', when: 'Información de sus ayudas y trámites.' },
  castillaLeon: { number: '012', text: 'Junta de Castilla y León', when: 'Información de sus ayudas y trámites.' },
  aragonInfancia: { number: '976 715 629', text: 'Gobierno de Aragón: Servicio de Infancia', when: 'De 9 a 14 h.' },
  linea010: { number: '010', text: 'Ayuntamiento de Madrid (Línea Madrid)', when: 'Desde fuera de Madrid: 91 480 00 10.' },
  mayoresMadrid: { number: '900 111 065', text: 'Línea para mayores de 65 (Ayuntamiento de Madrid)', when: 'Gratis, las 24 horas. Información y trámites sin salir de casa.', free: true },
};

/** Palabras difíciles explicadas en una frase */
// Palabras difíciles, explicadas con frases cortas. Se marcan solas en el texto de cada ficha (se pulsan para ver qué significan)
// y están todas juntas en /palabras/. La clave es como aparece en el texto (no importan mayúsculas ni tildes del principio).
export const GLOSSARY = {
  subrayadas: 'Así: cuando una palabra sale con puntos debajo, púlsala y te dice qué significa.',
  // Dinero y límites
  IPREM: 'Una cifra que usa el Gobierno para poner límites de ingresos a las ayudas. En 2026 son 600 € al mes (8.400 € al año, en 14 pagas).',
  SMI: 'El salario mínimo: lo menos que se puede pagar por un trabajo a jornada completa. En 2026, 1.221 € al mes en 14 pagas.',
  'salario mínimo': 'Lo menos que se puede pagar por un trabajo a jornada completa. En 2026, 1.221 € al mes en 14 pagas.',
  rentas: 'Todo el dinero que entra: sueldo, pensión, paro, alquileres que cobras, intereses del banco.',
  patrimonio: 'Lo que tienes además de lo que ganas: ahorros, otras casas o terrenos (tu casa no cuenta), coches de valor, acciones.',
  'renta garantizada': 'Lo mínimo que el IMV asegura que entre en tu casa cada mes. Si entra menos, el IMV pone la diferencia.',
  'unidad de convivencia': 'Las personas que viven contigo y cuentan para la ayuda: casi siempre, tu pareja y tus hijos.',
  'unidad familiar': 'Para Hacienda: tú, tu pareja y los hijos menores que viven con vosotros.',
  monoparental: 'Familia con una sola persona adulta que cuida de los hijos.',
  'familia numerosa': 'Familia con tres hijos o más (o dos, si hay discapacidad o es monoparental, entre otros casos). Se acredita con un título.',
  // Ayudas y organismos
  IMV: 'Ingreso Mínimo Vital: dinero cada mes del Estado para hogares con pocos ingresos. Lo paga la Seguridad Social.',
  PNC: 'Pensión no contributiva: para quien no ha cotizado lo suficiente y tiene pocos ingresos, por edad (65 años o más) o por discapacidad.',
  'pensión no contributiva': 'Pensión para quien no ha cotizado lo suficiente y tiene pocos ingresos, por edad (65 años o más) o por discapacidad.',
  'pensión contributiva': 'La pensión que se cobra por lo que has cotizado trabajando: jubilación, viudedad, incapacidad.',
  'complemento a mínimos': 'Dinero que se suma a una pensión baja para que llegue a la pensión mínima.',
  prestación: 'Dinero (o un servicio) que da la Administración cuando cumples los requisitos.',
  subsidio: 'Una ayuda de dinero más pequeña que la prestación, para quien no tiene derecho a ella o ya la ha cobrado entera.',
  'Seguridad Social': 'El organismo del Estado que paga las pensiones, el IMV, el permiso por nacimiento y las bajas.',
  INSS: 'Instituto Nacional de la Seguridad Social: la parte de la Seguridad Social que paga pensiones, el IMV y las prestaciones.',
  TGSS: 'Tesorería General de la Seguridad Social: lleva las altas, las cuotas y la vida laboral.',
  SEPE: 'Servicio Público de Empleo Estatal: paga el paro y los subsidios.',
  IMSERSO: 'Organismo del Estado para personas mayores y dependencia. Organiza, por ejemplo, los viajes para mayores.',
  mutua: 'Una entidad que colabora con la Seguridad Social. Paga, por ejemplo, el paro de los autónomos y las bajas por accidente.',
  CAISS: 'Las oficinas de la Seguridad Social donde te atienden en persona. Hay que pedir cita.',
  CEAS: 'Centros de Acción Social de Castilla y León: son los servicios sociales de tu zona.',
  'servicios sociales': 'La oficina del ayuntamiento donde una trabajadora social te orienta y te ayuda a pedir ayudas. Es gratis.',
  'trabajadora social': 'La profesional de los servicios sociales que estudia tu caso, te orienta y te ayuda con los trámites.',
  'demandante de empleo': 'Estar apuntado en la oficina de empleo de tu comunidad como persona que busca trabajo.',
  'vida laboral': 'Un papel de la Seguridad Social con todos tus trabajos y el tiempo que has cotizado.',
  cotizar: 'Pagar a la Seguridad Social mientras trabajas. Cuenta para el paro y la pensión.',
  'base reguladora': 'La media de lo que has cotizado en un tiempo. Con ella se calcula lo que cobras.',
  cuota: 'Lo que paga cada mes un autónomo a la Seguridad Social.',
  // Dependencia y discapacidad
  dependencia: 'Necesitar ayuda de otra persona para cosas del día a día: asearse, vestirse, comer, moverse por casa.',
  'grado de dependencia': 'Cuánta ayuda necesitas: grado I (moderada), grado II (severa) o grado III (gran dependencia).',
  PIA: 'Programa Individual de Atención: el plan que dice qué ayuda de la dependencia vas a recibir.',
  'grado de discapacidad': 'Un porcentaje que da tu comunidad tras valorarte. Con un 33 % o más tienes derecho a muchas ventajas.',
  valoración: 'Cuando un técnico te ve (en casa o en un centro) para medir tu situación y decidir el grado.',
  'informe social': 'Un escrito de la trabajadora social que explica tu situación. Lo piden muchas ayudas.',
  'informe de salud': 'Un escrito de tu médico sobre tus problemas de salud.',
  ortopedia: 'Tienda de sillas de ruedas, muletas, plantillas y otros productos para la salud.',
  // Papeles y trámites
  padrón: 'La lista del ayuntamiento de quién vive en cada casa. Empadronarse es apuntarse. Se puede hacer sin papeles.',
  empadronado: 'Estar apuntado en el padrón del ayuntamiento donde vives.',
  'Cl@ve': 'Una forma de identificarte en internet con tu DNI y tu móvil. Se pide en clave.gob.es o en una oficina.',
  'certificado digital': 'Un archivo en tu ordenador o móvil que hace de DNI en internet.',
  'sede electrónica': 'La web oficial de un organismo donde se hacen los trámites por internet.',
  'oficina de registro': 'Una oficina donde entregas papeles a la Administración y te dan un justificante con la fecha. Vale cualquiera, de cualquier administración.',
  justificante: 'El papel o archivo que prueba que has presentado algo y en qué fecha. Guárdalo siempre.',
  'cita previa': 'Pedir día y hora antes de ir a una oficina. Casi todas la piden.',
  convocatoria: 'El anuncio oficial que abre el plazo para pedir una ayuda. Dice los requisitos y las fechas.',
  resolución: 'La carta oficial que dice si te dan la ayuda o no, y por qué.',
  'días hábiles': 'Todos los días menos sábados, domingos y festivos.',
  'silencio negativo': 'Si no te contestan en el plazo, es un «no». Puedes reclamar.',
  'recurso de alzada': 'Una reclamación por escrito si no estás de acuerdo. Tienes un mes.',
  'reclamación previa': 'Lo que se presenta a la Seguridad Social si te dicen que no. Tienes 30 días.',
  reintegro: 'Que te devuelvan un dinero que has pagado tú.',
  IBAN: 'El número de tu cuenta del banco. Empieza por ES y tiene 24 caracteres. Está en la app del banco o en un recibo.',
  NIE: 'Número de Identidad de Extranjero: el número que identifica en España a una persona extranjera.',
  TIE: 'Tarjeta de Identidad de Extranjero: la tarjeta con tu NIE y tu permiso de residencia.',
  'residencia legal': 'Tener permiso para vivir en España (o ser de la Unión Europea y estar registrado).',
  'libro de familia': 'Libro o certificado del Registro Civil donde salen el matrimonio y los hijos.',
  acogimiento: 'Cuidar en tu casa a un menor que no es tu hijo, por decisión de la Administración.',
  aval: 'Una garantía: si no pagas, quien avala responde por una parte de la deuda.',
  apostilla: 'Un sello que hace válido en España un documento de otro país.',
  // Impuestos
  IRPF: 'El impuesto de la renta. Se paga por lo que ganas cada año.',
  'declaración de la renta': 'El trámite de cada primavera en el que dices a Hacienda lo que has ganado en el año. Ahí se aplican las deducciones.',
  deducción: 'Un dinero que te quitan de lo que pagas en la declaración de la renta. A veces te lo devuelven aunque no pagues.',
  'Renta Web': 'El programa de Hacienda para hacer la declaración de la renta por internet.',
  'base imponible': 'Lo que has ganado en el año según Hacienda, después de quitar algunos gastos. Sale en tu declaración de la renta.',
  'base liquidable': 'La base imponible después de restar algunas reducciones, como lo que pones en un plan de pensiones.',
  'tributación conjunta': 'Hacer una sola declaración de la renta para toda la familia, en vez de una por persona.',
  'régimen foral': 'Navarra y el País Vasco cobran sus propios impuestos con sus propias reglas.',
  // Luz
  PVPC: 'La tarifa de luz regulada por el Gobierno. Es la única que tiene bono social.',
  'comercializadora de referencia': 'Las compañías de luz que ofrecen la tarifa regulada: Energía XXI, Curenergía, Comercializadora Regulada, Régsiti y otras.',
  'bono social': 'Un descuento en la factura de la luz para hogares vulnerables. Solo con la tarifa regulada (PVPC).',
};

/** Busca qué palabras del glosario salen en un texto */
// Busca una palabra entera (no dentro de otra), sin importar mayúsculas
// (ni dentro de una dirección web como imv.seg-social.es)
const pattern = (k) => new RegExp(`(?<![\\p{L}\\p{N}@./-])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}]|[.\\-/@][\\p{L}\\p{N}])`, 'iu');
const PATTERNS = Object.fromEntries(Object.keys(GLOSSARY).map((k) => [k, pattern(k)]));

export function termsIn(text) {
  return Object.keys(GLOSSARY).filter((k) => PATTERNS[k].test(text));
}

/**
 * Marca las palabras difíciles en un texto ya escapado: la primera vez que sale cada una (según `usados`),
 * se convierte en un botón que, al pulsarlo, enseña qué significa. Los términos largos van antes que los cortos.
 */
const ORDER = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
export function markTerms(html, used = new Set()) {
  let parts = [html];
  for (const k of ORDER) {
    if (used.has(k)) continue;
    const re = PATTERNS[k];
    const i = parts.findIndex((p, n) => n % 2 === 0 && re.test(p));
    if (i < 0) continue;
    used.add(k);
    const m = parts[i].match(re);
    const before = parts[i].slice(0, m.index);
    const after = parts[i].slice(m.index + m[0].length);
    parts.splice(i, 1, before, `<button type="button" class="termino" data-term="${k}" aria-expanded="false">${m[0]}</button>`, after);
  }
  return parts.join('');
}

/** Enlace tel: a partir del número escrito con espacios */
export const tel = (number) => `tel:${number.replace(/\s/g, '')}`;
