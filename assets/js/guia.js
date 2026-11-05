// Lo que hace falta para pedir las ayudas: papeles, teléfonos y palabras difíciles explicadas.
// Teléfonos comprobados en fuentes oficiales en noviembre de 2026.

/** Papeles que se piden. Cada ayuda dice cuáles necesita (por su id). */
export const DOCUMENTOS = {
  dni: { nombre: 'DNI o NIE', ayuda: 'Tuyo y de las personas que viven contigo.' },
  residencia: { nombre: 'Tarjeta de residencia (TIE)', ayuda: 'Solo si no tienes nacionalidad española.' },
  padron: { nombre: 'Certificado de empadronamiento', ayuda: 'Lo da tu ayuntamiento. Pide el «colectivo»: el que dice quién vive en la casa.' },
  padronHistorico: { nombre: 'Empadronamiento histórico', ayuda: 'Dice desde cuándo vives en cada sitio. Lo da tu ayuntamiento.' },
  libroFamilia: { nombre: 'Libro de familia o certificado de nacimiento', ayuda: 'Para demostrar quiénes son tus hijos o tu pareja.' },
  iban: { nombre: 'Número de cuenta del banco (IBAN)', ayuda: 'Te lo da tu banco. La cuenta tiene que estar a tu nombre.' },
  ingresos: { nombre: 'Papeles de lo que cobráis', ayuda: 'Nóminas, pensiones o la declaración de la renta del año pasado.' },
  vidaLaboral: { nombre: 'Informe de vida laboral', ayuda: 'Dice cuánto has trabajado. Se pide gratis en la Seguridad Social.' },
  demanda: { nombre: 'Inscripción como demandante de empleo', ayuda: 'Te la dan en la oficina de empleo de tu comunidad.' },
  certEmpresa: { nombre: 'Certificado de empresa', ayuda: 'Lo manda tu empresa al SEPE cuando acaba tu contrato.' },
  certDiscapacidad: { nombre: 'Certificado de discapacidad', ayuda: 'El que dice el porcentaje (33 %, 65 %…).' },
  informeSalud: { nombre: 'Informe de salud', ayuda: 'Pídeselo a tu médico de cabecera.' },
  informeSocial: { nombre: 'Informe social', ayuda: 'Te lo hacen en los servicios sociales de tu ayuntamiento.' },
  resolucionDependencia: { nombre: 'Resolución de dependencia', ayuda: 'La carta que dice el grado (I, II o III).' },
  alquiler: { nombre: 'Contrato de alquiler y recibos', ayuda: 'El contrato y los últimos recibos pagados.' },
  facturaLuz: { nombre: 'Una factura de la luz', ayuda: 'Para saber tu compañía y tu número de contrato (CUPS).' },
  tituloFN: { nombre: 'Título de familia numerosa', ayuda: 'El carné en vigor.' },
  informeEmbarazo: { nombre: 'Informe médico del embarazo', ayuda: 'Con la semana de embarazo y la fecha prevista de parto.' },
  cartaPension: { nombre: 'Carta de tu pensión', ayuda: 'La de la Seguridad Social con lo que cobras.' },
  justificanteImv: { nombre: 'Justificante de haber pedido el IMV', ayuda: 'El resguardo que te dan al pedir el Ingreso Mínimo Vital.' },
  extractos: { nombre: 'Movimientos del banco de los 2 últimos meses', ayuda: 'De todas las cuentas de las personas que viven contigo.' },
  ordenProteccion: { nombre: 'Orden de protección o informe', ayuda: 'O un informe de servicios sociales o del centro de la mujer. No hace falta denuncia para todo.' },
};

/** Teléfonos. «gratis» solo cuando la fuente oficial lo dice. */
export const TELEFONOS = {
  emergencias: { numero: '112', texto: 'Emergencias', cuando: 'Si hay peligro ahora mismo.', gratis: true },
  violencia: { numero: '016', texto: 'Violencia contra las mujeres', cuando: 'Las 24 horas. No sale en la factura del teléfono. También por WhatsApp: 600 000 016.', gratis: true },
  crisis: { numero: '024', texto: 'Línea de atención a la conducta suicida', cuando: 'Si piensas en hacerte daño o conoces a alguien. 24 horas.', gratis: true },
  cruzRoja: { numero: '900 107 917', texto: 'Cruz Roja Te Escucha', cuando: 'Si te sientes solo o sola, o estás pasando un mal momento.', gratis: true },
  imv: { numero: '900 20 22 22', texto: 'Ingreso Mínimo Vital', cuando: 'De lunes a viernes, de 9:00 a 14:30.', gratis: true },
  citaInss: { numero: '91 541 25 30', texto: 'Cita previa de la Seguridad Social', cuando: 'Para pensiones y prestaciones. Las 24 horas (contesta una máquina).' },
  infoInss: { numero: '91 542 11 76', texto: 'Información de la Seguridad Social', cuando: 'Pensiones y prestaciones. De lunes a viernes, de 9:00 a 20:00.' },
  sepe: { numero: '060', texto: 'Información del SEPE (paro)', cuando: 'Puede tener coste.' },
  citaSepe: { numero: '91 926 79 70', texto: 'Cita previa del SEPE', cuando: 'Para ir a la oficina del paro.' },
  citaAeat: { numero: '91 290 13 40', texto: 'Cita previa de Hacienda', cuando: 'Para la renta y las deducciones.' },
  madrid012: { numero: '012', texto: 'Comunidad de Madrid', cuando: 'Información de todas sus ayudas.' },
  madridPnc: { numero: '91 392 56 86', texto: 'Pensiones no contributivas (Madrid)', cuando: 'Información sobre tu solicitud.' },
  andalucia: { numero: '955 012 012', texto: 'Junta de Andalucía', cuando: 'Información de sus ayudas. También el 012.' },
  cataluna: { numero: '012', texto: 'Generalitat de Catalunya', cuando: 'Gratis. Para pedir cita, dudas y ver cómo va tu trámite.', gratis: true },
  valencia: { numero: '012', texto: 'Generalitat Valenciana', cuando: 'Información de sus ayudas.' },
  balearesDependencia: { numero: '971 177 200', texto: 'Govern balear: dependencia y discapacidad', cuando: 'Dirección General de Atención a la Dependencia.' },
  canal: { numero: '900 365 365', texto: 'Canal de Isabel II', cuando: 'Gratis. Atención comercial en días laborables de 8:30 a 20:00; averías, a cualquier hora.', gratis: true },
  baleares: { numero: '012', texto: 'Govern de les Illes Balears', cuando: 'De lunes a viernes de 8 a 20 h y sábados de 9 a 14 h. Desde fuera de Baleares: 971 22 57 91.' },
  galicia: { numero: '012', texto: 'Xunta de Galicia', cuando: 'Información de sus ayudas y trámites.' },
  castillaMancha: { numero: '012', texto: 'Junta de Castilla-La Mancha', cuando: 'Información de sus ayudas y trámites.' },
  castillaLeon: { numero: '012', texto: 'Junta de Castilla y León', cuando: 'Información de sus ayudas y trámites.' },
  linea010: { numero: '010', texto: 'Ayuntamiento de Madrid (Línea Madrid)', cuando: 'Desde fuera de Madrid: 91 480 00 10.' },
  mayoresMadrid: { numero: '900 111 065', texto: 'Línea para mayores de 65 (Ayuntamiento de Madrid)', cuando: 'Gratis, las 24 horas. Información y trámites sin salir de casa.', gratis: true },
};

/** Palabras difíciles explicadas en una frase */
export const GLOSARIO = {
  IPREM: 'Una cifra que usa el Gobierno para medir los ingresos. En 2026 son 600 € al mes.',
  'base reguladora': 'La media de lo que has cotizado. Con ella se calcula lo que cobras.',
  cotizar: 'Pagar a la Seguridad Social mientras trabajas. Cuenta para el paro y la pensión.',
  padrón: 'La lista del ayuntamiento de quién vive en cada casa. Empadronarse es apuntarse.',
  'Cl@ve': 'Una forma de identificarte en internet con tu DNI y tu móvil. Se pide en clave.gob.es o en una oficina.',
  'certificado digital': 'Un archivo en tu ordenador o móvil que hace de DNI en internet.',
  CAISS: 'Las oficinas de la Seguridad Social donde te atienden en persona. Hay que pedir cita.',
  PVPC: 'La tarifa de luz regulada por el Gobierno. Es la única que tiene bono social.',
  'comercializadora de referencia': 'Las compañías de luz que ofrecen la tarifa regulada: Energía XXI, Curenergía, Comercializadora Regulada, Régsiti y otras.',
  PIA: 'El plan que dice qué ayuda de la dependencia vas a recibir.',
  IRPF: 'El impuesto de la renta. Se paga por lo que ganas cada año.',
  'unidad de convivencia': 'Las personas que viven contigo y cuentan para la ayuda.',
  'silencio negativo': 'Si no te contestan en el plazo, es un «no». Puedes reclamar.',
  'recurso de alzada': 'Una reclamación por escrito si no estás de acuerdo. Tienes un mes.',
  'reclamación previa': 'Lo que se presenta a la Seguridad Social si te dicen que no. Tienes 30 días.',
};

/** Busca qué palabras del glosario salen en un texto */
export function terminosEn(texto) {
  const t = texto.toLowerCase();
  return Object.keys(GLOSARIO).filter((k) => t.includes(k.toLowerCase()));
}

/** Enlace tel: a partir del número escrito con espacios */
export const tel = (numero) => `tel:${numero.replace(/\s/g, '')}`;
