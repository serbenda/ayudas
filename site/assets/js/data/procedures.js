// Cómo se pide cada ayuda, explicado paso a paso y en frases cortas.
// facil:    lo esencial para leerlo de un vistazo (modo fácil y página de mayores)
// pasos:    qué hacer, en orden. pasosMadrid sustituye a pasos si vives en la Comunidad de Madrid.
// telefonos/telefonosMadrid: claves de TELEFONOS (guia.js)
// documentos: claves de DOCUMENTOS (guia.js)
// plazo:    cuándo se pide · respuesta: cuánto tardan y qué hacer si dicen que no
// ojo:      avisos importantes (orden, compatibilidades)
// Revisado en noviembre de 2026 con las sedes oficiales (Seguridad Social, SEPE, Comunidad y Ayuntamiento de Madrid).
import { REGIONAL_ASSESSMENT, REGION_INFO_PHONE, dependencySteps, disabilitySteps } from './regional-procedures.js';
import { MANAGED_BY_REGION } from './regions.js';
import { REGIONAL_BENEFITS } from './regional-benefits.js';


const NO_INTERNET = 'Si no te manejas con internet, pide ayuda en los servicios sociales de tu ayuntamiento. Te ayudan gratis.';
const SS_CLAIM = 'Si te dicen que no y crees que sí te toca, presenta una «reclamación previa» en la Seguridad Social. Tienes 30 días.';
const SS_APPOINTMENT = 'Para ir en persona, pide cita en la Seguridad Social: 91 541 25 30 (contesta una máquina, las 24 horas) o en sede.seg-social.gob.es.';

export const PROCEDURES = {
  imv: {
    easy: ['Es dinero cada mes si en casa entra muy poco.', 'Te pagan lo que falta hasta un mínimo.', 'Lo paga la Seguridad Social.'],
    steps: [
      'Mira primero si te toca en el simulador: imv.seg-social.es.',
      'Junta los papeles de la lista.',
      'Pídelo por internet en imv.seg-social.es. No hace falta certificado digital: subes una foto tuya y de tu DNI.',
      'Si tienes Cl@ve o certificado, también puedes pedirlo en la Sede de la Seguridad Social.',
      SS_APPOINTMENT,
      'Guarda el justificante. Con él puedes ver cómo va tu solicitud.',
    ],
    phones: ['imv', 'citaInss'],
    documents: ['dni', 'residencia', 'padron', 'libroFamilia', 'iban'],
    deadline: 'Cuando quieras. Se cobra desde el mes siguiente a pedirlo.',
    response: `Tienen 6 meses para contestar. Si no contestan, es un «no» (silencio negativo). ${SS_CLAIM}`,
    warnings: ['Pídelo antes que la renta mínima de tu comunidad: casi todas lo exigen.', 'Cada año tienes que hacer la declaración de la renta, aunque no te salga a pagar.', 'Al pedirlo, la Seguridad Social mira también el complemento por hijos.'],
  },
  capi: {
    easy: ['Es dinero cada mes por cada hijo menor de 18.', 'Para familias con ingresos bajos o medios.', 'No hace falta cobrar el IMV.'],
    steps: [
      'Mira si te toca en el simulador: imv.seg-social.es.',
      'Se pide con el mismo formulario que el Ingreso Mínimo Vital, en imv.seg-social.es.',
      'Marca que pides solo el complemento por hijos si no te toca el IMV.',
      SS_APPOINTMENT,
    ],
    phones: ['imv', 'citaInss'],
    documents: ['dni', 'padron', 'libroFamilia', 'iban'],
    deadline: 'Cuando quieras. Si tienes un bebé, pídelo en los 3 meses siguientes al nacimiento para no perder meses.',
    response: `Tienen 6 meses. ${SS_CLAIM}`,
  },
  'renta-minima': {
    easy: ['Tu comunidad tiene su propia ayuda para quien no tiene casi ingresos.', 'Se pide en los servicios sociales.'],
    steps: ['Pide cita en los servicios sociales de tu ayuntamiento.', 'Llévate los papeles de la lista.', 'La trabajadora social te ayuda a rellenar la solicitud.'],
    stepsByRegion: {
      'aragon': ["En tu comunidad se llama Prestación Aragonesa Complementaria del IMV.", "Complementa al IMV: hay que cobrarlo o haberlo pedido.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en aragon.es (con certificado o Cl@ve) o en una oficina de registro."],
      'asturias': ["En tu comunidad se llama Salario Social Básico.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en socialasturias.asturias.es o en los servicios sociales municipales."],
      'baleares': ["En tu comunidad se llama Renta Social Garantizada.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en la sede del Govern (caib.es) o con ayuda de servicios sociales."],
      'canarias': ["En tu comunidad se llama Renta Canaria de Ciudadanía (sustituye a la Prestación Canaria de Inserción).", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en gobiernodecanarias.org o con ayuda de servicios sociales."],
      'cantabria': ["En tu comunidad se llama Renta Social Básica.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en serviciossocialescantabria.org o en los servicios sociales de atención primaria."],
      'castilla-mancha': ["En tu comunidad se llama Ingreso Mínimo de Solidaridad.", "En 2026 solo se renueva para quien ya la tenía (plazo hasta el 31 de diciembre de 2026): no hay altas nuevas.", "Si no la tenías, pide el Ingreso Mínimo Vital y pregunta en servicios sociales por ayudas de emergencia.", "Información y renovación en jccm.es."],
      'castilla-leon': ["En tu comunidad se llama Renta Garantizada de Ciudadanía.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Pide cita en tu CEAS (Centro de Acción Social). Se presenta en tramitacastillayleon.jcyl.es o en registro."],
      'extremadura': ["En tu comunidad se llama Renta Extremeña Garantizada.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en juntaex.es o en registro. El plazo está abierto todo el año."],
      'galicia': ["En tu comunidad se llama Renta de Inclusión Social de Galicia (RISGA).", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en sede.xunta.gal o en los servicios sociales de tu concello."],
      'murcia': ["En tu comunidad se llama Renta Básica de Inserción.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en sede.carm.es o con ayuda de servicios sociales."],
      'navarra': ["En tu comunidad se llama Renta Garantizada.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en navarra.es o en los servicios sociales de base de tu zona."],
      'pais-vasco': ["En tu comunidad se llama Renta de Garantía de Ingresos (RGI).", "La gestiona Lanbide, que también tramita el Ingreso Mínimo Vital en Euskadi.", "Pide cita en tu oficina de Lanbide o entra en lanbide.euskadi.eus.", "En servicios sociales de tu ayuntamiento te orientan."],
      'rioja': ["En tu comunidad se llama Renta de Ciudadanía.", "Pide antes el Ingreso Mínimo Vital: casi siempre lo exigen y la renta lo complementa.", "Pide cita en los servicios sociales de tu ayuntamiento: te ayudan a pedirla.", "Se presenta en la oficina electrónica de larioja.org o con ayuda de servicios sociales."],
      'ceuta': ["Pregunta en los servicios sociales de la Ciudad de Ceuta por la renta de inserción.", "Pide antes el Ingreso Mínimo Vital."],
      'melilla': ["Pregunta en los servicios sociales de la Ciudad de Melilla por el ingreso de integración.", "Pide antes el Ingreso Mínimo Vital."],
      andalucia: [
        'En Andalucía se llama Renta Mínima de Inserción Social (RMISA).',
        'No se puede cobrar a la vez que el IMV, salvo urgencia social. En servicios sociales te dicen cuál te conviene.',
        'Pide cita en los servicios sociales comunitarios de tu ayuntamiento: te ayudan a pedirla.',
        'Se presenta en la web de la Junta de Andalucía (con certificado o Cl@ve) o en una oficina de registro con cita.',
      ],
      cataluna: [
        'En Cataluña se llama Renda Garantida de Ciutadania (RGC).',
        'Primero pide el Ingreso Mínimo Vital: te piden el justificante.',
        'Pide cita llamando al 012 (gratis) para ir a una oficina de atención ciudadana. Allí te la rellenan en media hora.',
        'También se puede pedir por internet en ciutada.esocial.gencat.cat con certificado o idCAT Mòbil, o por videollamada con cita.',
        'Lleva los movimientos del banco de los 2 últimos meses de todas las personas de casa.',
      ],
      valencia: [
        'En la Comunitat Valenciana se llama Renta Valenciana de Inclusión.',
        'Pide cita en los servicios sociales de tu ayuntamiento: se pide allí.',
        'Te dicen qué papeles necesitas según tu caso.',
      ],
    },
    phonesByRegion: { andalucia: ['andalucia'], cataluna: ['cataluna'], valencia: ['valencia'] },
    documentsByRegion: { cataluna: ['dni', 'justificanteImv', 'iban', 'extractos'] },
    responseByRegion: { cataluna: 'Tienen hasta 8 meses. Si no contestan en ese plazo, se entiende concedida.' },
    documents: ['dni', 'padronHistorico', 'libroFamilia', 'ingresos', 'iban'],
    deadline: 'Cuando quieras.',
    response: 'Depende de tu comunidad. Si te dicen que no, pregunta en servicios sociales cómo reclamar.',
    warnings: ['Normalmente piden haber solicitado antes el Ingreso Mínimo Vital.'],
  },
  'rmi-madrid': {
    easy: ['Es la ayuda de la Comunidad de Madrid para quien no tiene casi ingresos.', 'Se pide en el centro de servicios sociales de tu barrio.'],
    steps: [
      'Pide el Ingreso Mínimo Vital antes. La RMI lo complementa.',
      'Pide cita en el centro de servicios sociales que te corresponde por tu domicilio. En Madrid capital: 010.',
      'Pide en tu ayuntamiento el empadronamiento histórico y colectivo (todas las personas de la casa, con fechas).',
      'Lleva la solicitud y los papeles al centro de servicios sociales. Allí te ayudan a rellenarla.',
      'También se puede presentar por internet en sede.comunidad.madrid, con firma electrónica.',
    ],
    phones: ['madrid012', 'linea010'],
    documents: ['dni', 'padronHistorico', 'libroFamilia', 'alquiler', 'ingresos', 'iban'],
    deadline: 'Cuando quieras. Está abierta todo el año.',
    response: 'Te avisan por carta. Si te dicen que no, puedes presentar un recurso: pregunta en tu centro de servicios sociales.',
    warnings: ['Si cobras el IMV, la RMI solo paga la diferencia hasta su cuantía.', 'También piden el certificado de escolaridad de los hijos.'],
  },
  'tarjeta-familias': {
    easy: ['Es una tarjeta con dinero cada mes para comida, aseo y transporte.', 'La da el Ayuntamiento de Madrid.', 'Se pide en servicios sociales.'],
    steps: [
      'Llama al 010 y pide cita en el centro de servicios sociales de tu barrio.',
      'Cuéntale tu situación a la trabajadora social. Ella valora si te corresponde.',
      'Tienes que aceptar un plan de ayuda con servicios sociales.',
      'Te dan una tarjeta monedero. Guarda los tiques: los revisan.',
    ],
    phones: ['linea010'],
    documents: ['dni', 'padron', 'ingresos'],
    deadline: 'Cuando la necesites.',
    response: 'Suele resolverse en unas dos semanas.',
    warnings: ['Desde enero de 2026, los ingresos del hogar no pueden pasar de 752 € al mes.', 'Sirve para comida, higiene y el abono de transporte.'],
  },
  'subsidio-desempleo': {
    easy: ['Es dinero cada mes si estás en paro y no cobras el paro.', 'Lo da el SEPE.'],
    steps: [
      'Apúntate como demandante de empleo en la oficina de empleo de tu comunidad.',
      'Entra en sede.sepe.gob.es. Sin certificado: elige «PIN SEPE», pon tu DNI y tu móvil y escribe el código del SMS.',
      'En «Gestiones», elige «Solicitar prestación o subsidio» y rellénalo.',
      'Si prefieres ir en persona, pide cita en el 91 926 79 70.',
      'Guarda el justificante.',
    ],
    phones: ['citaSepe', 'sepe'],
    documents: ['dni', 'demanda', 'libroFamilia', 'ingresos', 'iban'],
    deadline: 'En los 15 días hábiles siguientes a acabar el paro o el contrato. Si llegas tarde, cobras menos.',
    response: 'Te contestan por carta o en tu área personal del SEPE. Si es «no», puedes reclamar en 30 días.',
    warnings: ['Cuenta como ingreso para el Ingreso Mínimo Vital.', 'Puedes trabajar y cobrar parte del subsidio a la vez.'],
  },
  'subsidio-52': {
    easy: ['Es dinero cada mes hasta la jubilación.', 'Y la Seguridad Social cotiza por ti para la pensión.'],
    steps: [
      'Pide tu vida laboral para comprobar que tienes 15 años cotizados.',
      'Apúntate como demandante de empleo.',
      'Pídelo en sede.sepe.gob.es con «PIN SEPE» (tu DNI y tu móvil) o con cita en el 91 926 79 70.',
      'Cada año tienes que entregar la declaración de rentas al SEPE.',
    ],
    phones: ['citaSepe', 'sepe'],
    documents: ['dni', 'demanda', 'vidaLaboral', 'iban'],
    deadline: 'En los 15 días hábiles siguientes a acabar el paro o el contrato.',
    response: 'Si es «no», puedes reclamar en 30 días.',
    warnings: ['Si no entregas la declaración anual de rentas, te lo pueden quitar.'],
  },
  paro: {
    easy: ['Es el paro: dinero cada mes tras perder el trabajo.', 'Hay que haber trabajado al menos un año en los últimos seis.'],
    steps: [
      'Apúntate como demandante de empleo.',
      'Comprueba que tu empresa ha enviado el certificado de empresa.',
      'Pídelo en sede.sepe.gob.es con «PIN SEPE» (tu DNI y tu móvil) o con cita en el 91 926 79 70.',
    ],
    phones: ['citaSepe', 'sepe'],
    documents: ['dni', 'demanda', 'certEmpresa', 'iban'],
    deadline: 'En los 15 días hábiles siguientes a quedarte sin trabajo. Si llegas tarde, pierdes días.',
    response: 'Si es «no», puedes reclamar en 30 días.',
  },
  nacimiento: {
    easy: ['Es el permiso por tener un bebé, cobrando tu sueldo.', 'Son 19 semanas para cada progenitor.'],
    steps: [
      'Avisa a tu empresa con 15 días de antelación de cuándo vas a coger las semanas.',
      'Inscribe al bebé en el Registro Civil (normalmente desde el hospital).',
      'Pide la prestación en la Sede de la Seguridad Social o en «Tu Seguridad Social».',
      SS_APPOINTMENT,
    ],
    phones: ['citaInss', 'infoInss'],
    documents: ['dni', 'libroFamilia', 'iban'],
    deadline: 'Desde el nacimiento. Las 6 primeras semanas son seguidas tras el parto.',
    response: `Suele resolverse en pocas semanas. ${SS_CLAIM}`,
  },
  'nacimiento-no-contributivo': {
    easy: ['Si eres madre trabajadora y no has cotizado bastante, cobras una ayuda durante 42 días.'],
    steps: ['Pídelo en la Sede de la Seguridad Social como la prestación por nacimiento.', SS_APPOINTMENT],
    phones: ['citaInss'],
    documents: ['dni', 'libroFamilia', 'iban'],
    deadline: 'Tras el parto.',
    response: SS_CLAIM,
  },
  'pago-unico-nacimiento': {
    easy: ['Son 1.000 € de una vez al nacer o adoptar un hijo.', 'Para familias numerosas, monoparentales o con madre con discapacidad.'],
    steps: ['Pídelo en la Sede de la Seguridad Social, en «Prestaciones familiares».', SS_APPOINTMENT],
    phones: ['infoInss', 'citaInss'],
    documents: ['dni', 'libroFamilia', 'tituloFN', 'certDiscapacidad', 'ingresos', 'iban'],
    deadline: 'Tras el nacimiento o la adopción.',
    response: SS_CLAIM,
  },
  'madrid-natalidad': {
    easy: ['Son 500 € al mes durante 2 años por cada bebé.', 'Para madres de 30 años o menos que viven en la Comunidad de Madrid.'],
    steps: [
      'Pide en tu ayuntamiento el empadronamiento histórico. Tienes que llevar 5 de los últimos 10 años en la Comunidad de Madrid.',
      'Si estás embarazada, pide a tu médico un informe que diga que estás en la semana 21 o más.',
      'Pídela en sede.comunidad.madrid («Ayudas económicas a la natalidad») con firma electrónica.',
      'Sin firma electrónica: rellena el formulario en esa web, imprímelo, fírmalo y llévalo a una oficina de registro (algunas piden cita).',
      'Mira cómo va en «Mis Gestiones» de tu Cuenta Digital o llamando al 012.',
    ],
    phones: ['madrid012'],
    documents: ['dni', 'residencia', 'padronHistorico', 'informeEmbarazo', 'libroFamilia', 'ingresos', 'iban'],
    deadline: 'Todo el año: desde la semana 21 de embarazo hasta que el bebé cumple 2 años. Cuanto antes, más meses cobras.',
    response: 'Tienen 3 meses. Si no contestan, es un «no» (silencio negativo): llama al 012 y pregunta cómo reclamar.',
  },
  'titulo-familia-numerosa': {
    easy: ['Es un carné que da descuentos en transporte, tasas, luz y la renta.', 'Con 3 hijos, o con 2 en algunos casos.'],
    steps: ['Pídelo en tu comunidad: por internet o en una oficina de registro.', 'Te llega el título. Renuévalo antes de que caduque.'],
    madridSteps: [
      'Pídelo en sede.comunidad.madrid («Título de familia numerosa»), con firma electrónica.',
      'Sin firma electrónica: rellena el formulario, imprímelo y llévalo a una oficina de registro.',
      'Llama al 012 si tienes dudas.',
    ],
    madridPhones: ['madrid012'],
    documents: ['dni', 'libroFamilia', 'padron'],
    deadline: 'Cuando quieras.',
    response: 'Si te lo deniegan, puedes presentar un recurso en un mes.',
  },
  cume: {
    easy: ['Si tu hijo tiene cáncer u otra enfermedad grave, puedes reducir tu jornada y cobrar lo que pierdes.'],
    steps: [
      'Pide al hospital la declaración del médico sobre la enfermedad y el cuidado que necesita.',
      'Pide a tu empresa la reducción de jornada (al menos a la mitad).',
      'Pide la prestación a tu mutua o a la Seguridad Social (te lo dicen en tu empresa).',
    ],
    phones: ['infoInss'],
    documents: ['dni', 'libroFamilia', 'informeSalud', 'iban'],
    deadline: 'Desde que reduces la jornada.',
    response: SS_CLAIM,
  },
  'escuela-infantil': {
    easy: ['Hay plazas públicas de escuela infantil, becas de comedor y de libros.', 'Los plazos suelen abrir en primavera.'],
    steps: ['Pregunta en el colegio o en tu ayuntamiento por las becas de comedor y de libros.', 'Para la escuela infantil (0-3 años), la solicitud suele abrir en abril.'],
    documents: ['dni', 'libroFamilia', 'padron', 'ingresos'],
    deadline: 'Normalmente en primavera, para el curso siguiente.',
    response: 'Publican listas provisionales y puedes reclamar en pocos días.',
  },
  'escuela-infantil-madrid': {
    easy: ['Las escuelas infantiles municipales de Madrid son gratis.', 'Solo se paga el comedor.', 'Para niños de 0 a 3 años.'],
    steps: [
      'La solicitud se abre en abril (en 2026 fue del 6 al 17 de abril).',
      'Elige hasta 4 escuelas por orden de preferencia.',
      'Pídela en la sede del Ayuntamiento de Madrid (sede.madrid.es) o en persona en la escuela que eliges primero.',
      'Mira las listas en mayo. Si hay error, reclama en los días que indican.',
      'Matrícula a partir de junio.',
    ],
    phones: ['linea010'],
    documents: ['dni', 'libroFamilia', 'padron', 'ingresos', 'informeEmbarazo'],
    deadline: 'En abril, para el curso siguiente. Si el bebé aún no ha nacido, también se puede pedir con un informe médico.',
    response: 'Listas provisionales en mayo y definitivas en junio.',
  },
  orfandad: {
    easy: ['Es una pensión para los hijos de una persona que ha fallecido.'],
    steps: ['Pídela junto con la de viudedad, en la Sede de la Seguridad Social.', SS_APPOINTMENT],
    phones: ['infoInss', 'citaInss'],
    documents: ['dni', 'libroFamilia', 'iban'],
    deadline: 'Pídela en los 3 meses siguientes al fallecimiento para cobrar desde el principio.',
    response: SS_CLAIM,
  },
  'pnc-jubilacion': {
    easy: ['Es una pensión para mayores de 65 que no cotizaron bastante.', 'Cobras hasta 628,80 € al mes.'],
    steps: ['Pídela en tu comunidad: en servicios sociales te ayudan con la solicitud.', 'Junta los papeles de la lista.'],
    madridSteps: [
      'Pide en tu ayuntamiento el empadronamiento histórico: tienes que demostrar 10 años en España.',
      'Rellena la solicitud en sede.comunidad.madrid («Pensión no contributiva de jubilación»).',
      'Con firma electrónica, envíala por internet. Sin ella: imprímela, fírmala y llévala a una oficina de registro.',
      'Si te cuesta, en los servicios sociales de tu ayuntamiento te ayudan.',
      'Para dudas: 91 392 56 86. Para cita: 91 392 56 04.',
    ],
    phones: ['madrid012'],
    madridPhones: ['madridPnc', 'madrid012'],
    documents: ['dni', 'padronHistorico', 'ingresos', 'iban'],
    deadline: 'Cuando quieras.',
    response: 'Tienen 90 días. El primer pago llega el mes siguiente, con los atrasos.',
    warnings: ['Cada año tienes que declarar tus ingresos antes del 1 de abril.', 'Si vives de alquiler, pide también el complemento de 525 € al año.'],
  },
  'pnc-invalidez': {
    easy: ['Es una pensión para personas con discapacidad del 65 % o más que no tienen ingresos.'],
    steps: ['Pídela en tu comunidad. En servicios sociales te ayudan.', 'Necesitas el certificado de discapacidad con el 65 % o más.'],
    madridSteps: [
      'Rellena la solicitud en sede.comunidad.madrid («Pensión no contributiva de invalidez»).',
      'Con firma electrónica, envíala. Sin ella: imprímela y llévala a una oficina de registro.',
      'Para dudas: 91 392 56 86.',
    ],
    madridPhones: ['madridPnc', 'madrid012'],
    documents: ['dni', 'padronHistorico', 'certDiscapacidad', 'ingresos', 'iban'],
    deadline: 'Cuando quieras.',
    response: 'Tienen 90 días.',
  },
  'pnc-alquiler': {
    easy: ['Son 525 € al año si cobras una pensión no contributiva y vives de alquiler.'],
    steps: ['Pídelo a tu comunidad con el contrato de alquiler.'],
    madridSteps: ['Pídelo en sede.comunidad.madrid («Complemento de alquiler para pensionistas no contributivos»).', 'Sin firma electrónica, llévalo a una oficina de registro. Dudas: 012.'],
    madridPhones: ['madridPnc', 'madrid012'],
    documents: ['dni', 'alquiler', 'iban'],
    deadline: 'Cada año, en el plazo que abre tu comunidad.',
    response: 'Se paga una vez al año.',
  },
  'complemento-minimos': {
    easy: ['Si tu pensión es muy baja, te la suben hasta la mínima.'],
    steps: [
      'Normalmente lo pone la Seguridad Social sola.',
      'Si crees que te toca y no lo cobras, pídelo en la Sede de la Seguridad Social.',
      SS_APPOINTMENT,
    ],
    phones: ['infoInss', 'citaInss'],
    documents: ['dni', 'cartaPension', 'ingresos'],
    deadline: 'Cuando quieras.',
    response: SS_CLAIM,
    warnings: ['Cada año tienes que avisar si tus otros ingresos suben.', 'Con el complemento a mínimos, las medicinas suelen salir gratis.'],
  },
  'brecha-genero': {
    easy: ['Es un extra en la pensión por cada hijo que has tenido.', 'Son 36,90 € al mes por hijo.'],
    steps: [
      'Mira tu carta de la pensión: si ya sale «complemento brecha de género», ya lo cobras.',
      'Si no sale, pídelo en la Sede de la Seguridad Social.',
      SS_APPOINTMENT,
    ],
    phones: ['infoInss', 'citaInss'],
    documents: ['dni', 'libroFamilia', 'cartaPension'],
    deadline: 'Cuando quieras.',
    response: SS_CLAIM,
  },
  jubilacion: {
    easy: ['Si has cotizado 15 años o más, tienes pensión de jubilación.', 'Conviene pedirla antes de dejar de trabajar.'],
    steps: [
      'Pide tu vida laboral en la Seguridad Social: es gratis.',
      'Mira cuánto te quedaría en el simulador de «Tu Seguridad Social».',
      'Pídela hasta 3 meses antes de la fecha en que te quieres jubilar.',
      SS_APPOINTMENT,
    ],
    phones: ['infoInss', 'citaInss'],
    documents: ['dni', 'vidaLaboral', 'iban'],
    deadline: 'Hasta 3 meses antes de jubilarte.',
    response: SS_CLAIM,
  },
  viudedad: {
    easy: ['Es una pensión si tu marido, tu mujer o tu pareja de hecho ha fallecido.'],
    steps: ['Pídela en la Sede de la Seguridad Social o con cita.', SS_APPOINTMENT, 'Pide a la vez la de orfandad si tienes hijos.'],
    phones: ['infoInss', 'citaInss'],
    documents: ['dni', 'libroFamilia', 'iban'],
    deadline: 'Pídela en los 3 meses siguientes al fallecimiento para cobrar desde el principio.',
    response: SS_CLAIM,
  },
  'imserso-viajes': {
    easy: ['Son viajes y balnearios baratos para pensionistas.'],
    steps: ['La solicitud se abre una vez al año (normalmente en primavera o verano).', 'Pídelo en la web del IMSERSO o con el formulario en papel por correo.', 'Si te dan plaza, te avisan y eliges el viaje en una agencia.'],
    documents: ['dni', 'cartaPension'],
    deadline: 'Una vez al año, en la convocatoria.',
    response: 'Las plazas se dan por puntos. Si no te toca, quedas en lista de espera.',
  },
  'servicios-mayores': {
    easy: ['Un botón para pedir ayuda las 24 horas, ayuda en casa y comida.', 'Se pide en servicios sociales.'],
    steps: ['Llama a tu ayuntamiento y pide cita con servicios sociales.', 'Te visitan en casa para ver qué necesitas.'],
    documents: ['dni', 'padron', 'ingresos'],
    deadline: 'Cuando lo necesites.',
    response: 'Depende de tu ayuntamiento.',
  },
  'teleasistencia-madrid': {
    easy: ['Un aparato con un botón para pedir ayuda las 24 horas.', 'Si tienes más de 65 y vives solo o sola, basta con llamar.'],
    steps: [
      'Llama al 900 111 065 (gratis, las 24 horas) o al 010.',
      'Di que quieres la teleasistencia.',
      'Te instalan el aparato en casa. Si se estropea, lo arreglan en 48 horas.',
    ],
    phones: ['mayoresMadrid', 'linea010'],
    documents: ['dni'],
    deadline: 'Cuando quieras.',
    response: 'Te llaman para instalarlo.',
  },
  'dependencia-valoracion': {
    easy: ['Si necesitas ayuda para el día a día, primero te valoran.', 'Te dan un grado: I, II o III.', 'Es gratis.'],
    steps: [
      'Pide cita en los servicios sociales de tu ayuntamiento y pide el «informe social».',
      'Pide a tu médico de cabecera un «informe de salud» para la dependencia.',
      'Rellena la solicitud de dependencia de tu comunidad y preséntala con los papeles.',
      'Te llaman para una visita en casa. Un técnico mira lo que puedes hacer y lo que no.',
      'Te llega una carta con el grado y con el plan de ayudas (PIA).',
    ],
    madridSteps: [
      'Pide cita en el centro de servicios sociales de tu ayuntamiento (en Madrid capital, 010) y pide el «informe social».',
      'Pide a tu médico de cabecera el «informe de salud» para la dependencia.',
      'Rellena la solicitud en sede.comunidad.madrid («Reconocimiento de la situación de dependencia»).',
      'Envíala con firma electrónica o llévala a una oficina de registro. No cuesta nada.',
      'La Comunidad te llama para la visita de valoración en casa.',
      'Te llega la carta con el grado y el plan de ayudas (PIA).',
    ],
    stepsByRegion: {
      andalucia: [
        'Pide a tu médico de cabecera el «informe sobre condiciones de salud» para la dependencia.',
        'Preséntala en la web de la Junta de Andalucía (con certificado o Cl@ve) o en una oficina de registro con cita previa.',
        'Te llaman para una única visita en casa.',
        'Recibes una sola carta con el grado y el plan de ayudas (PIA). De media tarda cerca de un año; menos en urgencias, niños pequeños y ELA.',
        'Dudas: 012 o 955 012 012.',
      ],
    },
    phones: [],
    madridPhones: ['madrid012', 'linea010'],
    phonesByRegion: { andalucia: ['andalucia'], cataluna: ['cataluna'], valencia: ['valencia'] },
    documents: ['dni', 'padronHistorico', 'informeSalud', 'informeSocial', 'iban'],
    deadline: 'Cuanto antes: tarda meses.',
    response: 'Tienen 6 meses. Si no estás de acuerdo con el grado, presenta un «recurso de alzada» en un mes.',
    warnings: ['Si la persona empeora, se puede pedir una nueva valoración.'],
  },
  'dependencia-prestacion': {
    easy: ['Es dinero cada mes para que un familiar cuide en casa.', 'Hace falta tener la dependencia reconocida.'],
    steps: ['Cuando te valoren, di que quieres esta prestación en el plan (PIA).', 'Si ya tienes el PIA y quieres cambiarlo, pídelo en servicios sociales.'],
    documents: ['dni', 'resolucionDependencia', 'iban'],
    deadline: 'Al hacer el plan de ayudas (PIA).',
    response: 'Si no estás de acuerdo con el PIA, puedes recurrir en un mes.',
  },
  'dependencia-servicios': {
    easy: ['Ayuda en casa, centro de día o residencia.', 'Gratis o pagando una parte según tus ingresos.'],
    steps: ['Revisa tu plan de ayudas (PIA). Ahí sale el servicio.', 'Si no tienes plaza pública, pregunta por la prestación para pagar un servicio privado.'],
    documents: ['resolucionDependencia'],
    deadline: 'Con el PIA.',
    response: 'Pregunta en servicios sociales si tarda.',
  },
  'convenio-cuidadores': {
    easy: ['Si cuidas a un familiar con dependencia, el Estado cotiza por ti.', 'Así sumas años para tu pensión.'],
    steps: ['Pide el «convenio especial de cuidadores no profesionales» en la Seguridad Social (Tesorería).', 'Se puede pedir por internet en la Sede o en una oficina con cita.'],
    phones: ['infoInss'],
    documents: ['dni', 'resolucionDependencia'],
    deadline: 'Cuando quieras.',
    response: 'Te avisan por carta.',
  },
  'certificado-discapacidad': {
    easy: ['Es un papel que dice tu porcentaje de discapacidad.', 'Con un 33 % o más tienes muchas ventajas.'],
    steps: ['Pide a tu médico los informes de tus problemas de salud.', 'Rellena la solicitud de tu comunidad y preséntala.', 'Te citan para una valoración.'],
    madridSteps: [
      'Pide a tu médico los informes de tus problemas de salud.',
      'Rellena la solicitud en sede.comunidad.madrid («Reconocimiento del grado de discapacidad»).',
      'Preséntala con firma electrónica o en una oficina de registro.',
      'Te citan en un centro base para la valoración. Dudas: 012.',
    ],
    madridPhones: ['madrid012'],
    documents: ['dni', 'informeSalud'],
    deadline: 'Cuando quieras.',
    response: 'Si no estás de acuerdo con el porcentaje, puedes reclamar.',
  },
  'hijo-cargo-discapacidad': {
    easy: ['Es dinero por cada hijo con discapacidad.'],
    steps: ['Pídelo en la Sede de la Seguridad Social («Prestaciones familiares»).', SS_APPOINTMENT],
    phones: ['infoInss', 'citaInss'],
    documents: ['dni', 'libroFamilia', 'certDiscapacidad', 'iban'],
    deadline: 'Cuando quieras.',
    response: SS_CLAIM,
  },
  'ventajas-discapacidad': {
    easy: ['Pagas menos por el coche y el aparcamiento.'],
    steps: ['Para el coche: pide el IVA reducido al comprarlo (con el certificado).', 'Para el impuesto de circulación: pídelo en tu ayuntamiento.', 'Para la tarjeta de aparcamiento: pídela en tu ayuntamiento.'],
    documents: ['dni', 'certDiscapacidad'],
    deadline: 'Cuando quieras.',
    response: 'Depende de cada trámite.',
  },
  'bono-social': {
    easy: ['Es un descuento en la factura de la luz.', 'En 2026 es del 42,5 % o del 57,5 %.'],
    steps: [
      'Mira tu factura: tienes que tener la tarifa regulada (PVPC) con una «comercializadora de referencia».',
      'Si no la tienes, llama a una de ellas y pide cambiarte. No te pueden cobrar por cambiar.',
      'Pide el bono social a esa compañía: por teléfono (está en tu factura), en su web o en su oficina.',
      'Envía los papeles. Tienen 10 días hábiles para contestarte.',
      'Se aplica desde la factura en la que entregas todo.',
    ],
    documents: ['dni', 'padron', 'libroFamilia', 'tituloFN', 'certDiscapacidad', 'facturaLuz'],
    deadline: 'Cuando quieras. Dura 2 años y se renueva.',
    response: 'Si te lo deniegan, reclama por escrito a la compañía. Si sigue el problema, ve a la oficina de consumo de tu ayuntamiento.',
    warnings: ['Si lo tienes el 31 de diciembre, te llega solo el bono térmico al año siguiente.', 'Comercializadoras de referencia: Energía XXI, Curenergía, Comercializadora Regulada, Régsiti, Baser y otras.'],
  },
  'bono-termico': {
    easy: ['Es un pago al año para la calefacción.', 'Llega solo si tienes el bono social de la luz.'],
    steps: ['No hay que pedirlo: si tienes el bono social de la luz el 31 de diciembre, te lo pagan en tu cuenta al año siguiente.', 'Comprueba que tu número de cuenta está bien.'],
    madridSteps: ['No hay que pedirlo: llega solo si tenías el bono social de la luz el 31 de diciembre.', 'Para cambiar la cuenta: sede.comunidad.madrid («Bono social térmico»).', 'Si no te llega, escribe a bono_social_termico@madrid.org.'],
    documents: [],
    deadline: 'Automático.',
    response: 'Se paga una vez al año.',
  },
  'agua-canal': {
    easy: ['Descuento en el recibo del agua en la Comunidad de Madrid.', 'Para hogares vulnerables, familias numerosas o casas con muchas personas.'],
    steps: [
      'Llama gratis a Canal de Isabel II, 900 365 365, o entra en su oficina virtual, en «Tarifas y bonificaciones».',
      'Di qué bonificación pides: exención social, familia numerosa o vivienda con muchas personas.',
      'Para la exención social te piden el IMV o un informe de servicios sociales.',
    ],
    phones: ['canal'],
    documents: ['dni', 'padron', 'tituloFN', 'informeSocial'],
    deadline: 'Cuando quieras. Se renueva cada cierto tiempo.',
    response: 'Te avisan en el recibo.',
  },
  'alquiler-joven': {
    easy: ['Ayuda para el alquiler si tienes 35 años o menos.', 'Hasta 300 € al mes.'],
    steps: ['Espera a que tu comunidad abra la convocatoria (suele ser una vez al año).', 'Prepara los papeles antes: se acaba rápido.', 'Pídela por internet en la web de tu comunidad.'],
    documents: ['dni', 'padron', 'alquiler', 'ingresos', 'iban'],
    deadline: 'Solo cuando la convocatoria está abierta.',
    response: 'Suele tardar meses. Pagan los atrasos.',
  },
  'alquiler-general': {
    easy: ['Ayuda para pagar el alquiler si ganas poco.'],
    steps: ['Espera a que tu comunidad abra la convocatoria.', 'Prepara los papeles antes.', 'Pídela en la web de tu comunidad o en una oficina de registro.'],
    documents: ['dni', 'padron', 'alquiler', 'ingresos', 'iban'],
    deadline: 'Solo cuando la convocatoria está abierta.',
    response: 'Suele tardar meses.',
  },
  'vivienda-social-madrid': {
    easy: ['Pisos de alquiler barato de la Comunidad de Madrid.', 'Hay lista de espera.'],
    steps: ['Apúntate en la Agencia de Vivienda Social de la Comunidad de Madrid (sede.comunidad.madrid).', 'Si estás en una situación muy difícil, pide en servicios sociales que te ayuden a pedir una vivienda por «especial necesidad».'],
    phones: ['madrid012'],
    documents: ['dni', 'padronHistorico', 'ingresos', 'informeSocial'],
    deadline: 'Cuando quieras.',
    response: 'La espera puede ser larga.',
  },
  'deduccion-maternidad': {
    easy: ['Son 100 € al mes por hijo menor de 3 años.', 'Los cobra la madre.'],
    steps: [
      'Puedes cobrarla cada mes (abono anticipado) o de golpe en la declaración de la renta.',
      'Para cobrarla cada mes, pide el «abono anticipado» en Hacienda (modelo 140) por internet con Cl@ve, o con cita previa en el 91 290 13 40.',
      'Si pagas guardería, la deducción sube hasta 1.000 € más al año: la guardería informa a Hacienda.',
    ],
    phones: ['citaAeat'],
    documents: ['dni', 'libroFamilia'],
    deadline: 'Cuando quieras, o en la renta del año siguiente.',
    response: 'Si cobras de más, lo devuelves en la renta.',
  },
  'deduccion-familia-numerosa': {
    easy: ['Son 1.200 € al año (100 € al mes) por ser familia numerosa.'],
    steps: ['Puedes cobrarla cada mes con el modelo 143 de Hacienda (por internet con Cl@ve, o con cita en el 91 290 13 40).', 'O pídela en la declaración de la renta.'],
    phones: ['citaAeat'],
    documents: ['dni', 'tituloFN'],
    deadline: 'Cuando quieras.',
    response: 'Si cobras de más, lo devuelves en la renta.',
  },
  'deduccion-monoparental': {
    easy: ['Son 1.200 € al año si crías solo o sola a dos hijos.'],
    steps: ['Pídela con el modelo 143 (cada mes) o en la declaración de la renta.', 'Cita en Hacienda: 91 290 13 40.'],
    phones: ['citaAeat'],
    documents: ['dni', 'libroFamilia'],
    deadline: 'Cuando quieras.',
    response: 'Si cobras de más, lo devuelves en la renta.',
  },
  'deduccion-discapacidad-cargo': {
    easy: ['Son 100 € al mes por cada familiar con discapacidad a tu cargo.'],
    steps: ['Pídela con el modelo 143 (cada mes) o en la declaración de la renta.', 'Cita en Hacienda: 91 290 13 40.'],
    phones: ['citaAeat'],
    documents: ['dni', 'certDiscapacidad', 'libroFamilia'],
    deadline: 'Cuando quieras.',
    response: 'Si cobras de más, lo devuelves en la renta.',
  },
  'minimo-discapacidad': {
    easy: ['Pagas menos impuestos por tener discapacidad.'],
    steps: ['Dale una copia del certificado a tu empresa o a quien te paga la pensión.', 'Así te quitan menos cada mes.', 'Márcalo también en la declaración de la renta.'],
    documents: ['certDiscapacidad'],
    deadline: 'Cuando quieras.',
    response: '—',
  },
  'deducciones-ccaa': {
    easy: ['Tu comunidad tiene más descuentos en la renta.'],
    steps: ['Al hacer la declaración de la renta, revisa el apartado de tu comunidad.', 'Si no sabes, pide cita en Hacienda (91 290 13 40): te ayudan a hacer la renta.'],
    phones: ['citaAeat'],
    documents: ['dni'],
    deadline: 'En la declaración de la renta (abril a junio).',
    response: '—',
  },
  becas: {
    easy: ['Becas para estudiar bachillerato, FP o universidad.'],
    steps: ['Pídelas en becaseducacion.gob.es.', 'El plazo suele abrir en primavera para el curso siguiente.'],
    documents: ['dni', 'ingresos', 'iban'],
    deadline: 'En primavera.',
    response: 'Si te la deniegan, puedes reclamar.',
  },
  'justicia-gratuita': {
    easy: ['Si necesitas un abogado y ganas poco, es gratis.'],
    steps: ['Ve al Servicio de Orientación Jurídica del Colegio de Abogados de tu zona (suele estar en los juzgados).', 'Rellena la solicitud allí. Te asignan un abogado de oficio.'],
    documents: ['dni', 'padron', 'ingresos'],
    deadline: 'Antes de ir a juicio o en cuanto te llegue una demanda.',
    response: 'Te nombran un abogado. Si te lo deniegan, puedes reclamar.',
  },
  'bono-cultural-joven': {
    easy: ['Son 400 € para cultura si cumples 18 años este año.'],
    steps: ['Pídelo en bonoculturajoven.gob.es con Cl@ve o certificado.', 'Elige una modalidad: «Descubre Cultura» o «Crea Cultura». No se puede cambiar después.'],
    documents: ['dni'],
    deadline: 'El año en que cumples 18.',
    response: 'Te avisan en la web.',
  },
  'transporte-madrid': {
    easy: ['En la Comunidad de Madrid, los mayores de 65 y los menores de 14 viajan gratis en 2026.', 'De 15 a 25 años, el abono cuesta 10 € al mes.'],
    steps: [
      'Necesitas la Tarjeta Transporte Público personal, con tu foto.',
      'Pídela en tarjetatransportepublico.es o en una oficina de gestión (con cita).',
      'Cuando la tengas, carga el abono en una máquina del metro o en un estanco.',
    ],
    phones: ['madrid012'],
    documents: ['dni'],
    deadline: 'Cuando quieras. Estos precios valen hasta el 31 de diciembre de 2026.',
    response: 'Te mandan la tarjeta a casa o la recoges en la oficina.',
  },
  'copago-farmaceutico': {
    easy: ['Pagas menos (o nada) por las medicinas de la receta.'],
    steps: ['Normalmente se aplica solo, según tus datos de la Seguridad Social.', 'Mira tu tarjeta sanitaria o pregunta en la farmacia cuánto pagas.', 'Si crees que pagas de más, pregúntalo en tu centro de salud.'],
    documents: ['dni'],
    deadline: 'Automático.',
    response: 'Si pagas de más en un mes, te lo devuelven.',
  },
  'emergencia-social': {
    easy: ['Si no puedes pagar comida, luz, agua o el alquiler este mes, hay ayudas urgentes.', 'Se piden en servicios sociales.'],
    steps: [
      'Llama a tu ayuntamiento y pide cita urgente con servicios sociales. En Madrid capital: 010.',
      'Explica qué te falta: comida, una factura, el alquiler…',
      'Lleva las facturas o recibos que no puedes pagar.',
    ],
    madridPhones: ['linea010', 'madrid012'],
    documents: ['dni', 'padron', 'ingresos'],
    deadline: 'Cuando lo necesites.',
    response: 'Las ayudas de emergencia suelen ser rápidas.',
  },
  alimentos: {
    easy: ['Bancos de alimentos, Cruz Roja y Cáritas dan comida.', 'No hace falta esperar a una ayuda pública.'],
    steps: ['Pregunta en servicios sociales: te mandan al punto de reparto más cercano.', 'También puedes ir a la parroquia (Cáritas) o a la Cruz Roja de tu zona.'],
    phones: ['cruzRoja'],
    documents: ['dni'],
    deadline: 'Cuando lo necesites.',
    response: '—',
  },
  'violencia-genero': {
    easy: ['Si sufres violencia, no estás sola.', 'Llama al 016: es gratis y no sale en la factura.', 'Hay ayudas de dinero, de casa y de trabajo.'],
    steps: [
      'Si estás en peligro ahora, llama al 112.',
      'Llama al 016 (o WhatsApp 600 000 016). Te informan de todo, las 24 horas.',
      'Pide cita en el punto de violencia de género de tu ayuntamiento o en servicios sociales.',
      'Con la orden de protección o un informe de servicios sociales puedes pedir: subsidio del SEPE sin haber cotizado, ayuda de pago único de tu comunidad, bono social de la luz y prioridad en vivienda.',
    ],
    phones: ['violencia', 'emergencias'],
    documents: ['dni', 'ordenProteccion'],
    deadline: 'Cuando lo necesites.',
    response: 'Te acompañan en todo el proceso.',
  },
  desahucio: {
    easy: ['Si puedes perder tu casa, pide ayuda cuanto antes.', 'Muchas veces se puede parar o retrasar.'],
    steps: [
      'Si te llega una carta del juzgado, no la ignores: tienes 10 días para responder.',
      'Pide un abogado de oficio gratis en el Colegio de Abogados (en los juzgados).',
      'Pide cita urgente en servicios sociales: pueden hacer un informe de vulnerabilidad para el juzgado.',
      'Ese informe puede retrasar el desahucio y abrir una alternativa de vivienda.',
    ],
    madridPhones: ['linea010', 'madrid012'],
    documents: ['dni', 'alquiler', 'ingresos', 'informeSocial'],
    deadline: 'Cuanto antes. Los plazos del juzgado son cortos.',
    response: '—',
  },
  'sin-hogar': {
    easy: ['Si no tienes casa, hay albergues y comida.', 'Puedes empadronarte aunque no tengas casa.'],
    steps: ['Ve a los servicios sociales de tu ayuntamiento o llama al 010 en Madrid capital.', 'Pide plaza en un albergue o centro de acogida.', 'Pide el empadronamiento «sin domicilio fijo»: con él puedes pedir otras ayudas y el médico.'],
    phones: ['emergencias'],
    madridPhones: ['linea010'],
    documents: ['dni'],
    deadline: 'Cuando lo necesites.',
    response: '—',
  },
  soledad: {
    easy: ['Si te sientes solo o sola, hay gente para hablar contigo.', 'También hay actividades y voluntarios que te visitan.'],
    steps: ['Llama a Cruz Roja Te Escucha: 900 107 917 (gratis).', 'Pregunta en tu centro de mayores o en servicios sociales por actividades y voluntarios.'],
    phones: ['cruzRoja'],
    madridPhones: ['cruzRoja', 'mayoresMadrid'],
    documents: [],
    deadline: 'Cuando quieras.',
    response: '—',
  },
  'sanidad-sin-papeles': {
    easy: ['Aunque no tengas papeles, tienes derecho al médico.', 'Y a empadronarte.'],
    steps: ['Empadrónate en tu ayuntamiento (no hace falta tener permiso de residencia).', 'Pide en tu centro de salud el documento para que te atiendan.', 'Pide orientación en servicios sociales o en una ONG (Cruz Roja, Cáritas, CEAR…).'],
    documents: ['dni', 'padron'],
    deadline: 'Cuando quieras.',
    response: '—',
  },
  'tarifa-plana-autonomos': {
    easy: ['Si empiezas como autónomo, pagas solo 80 € al mes de cuota el primer año.', 'Se pide al darte de alta.'],
    steps: [
      'Date de alta en Hacienda como autónomo (modelo 036 o 037) en sede.agenciatributaria.gob.es, o con cita en Hacienda.',
      'Date de alta en la Seguridad Social en Importass (portal.seg-social.gob.es), con Cl@ve o certificado. Hazlo antes de empezar a trabajar.',
      'En el mismo alta, marca que quieres la cuota reducida («tarifa plana»). Si no la marcas ahora, la pierdes.',
      'Pregunta en tu comunidad: algunas te devuelven esos 80 € al mes.',
      'Al acabar el primer año, si ganas menos del salario mínimo, pide la ampliación de otros 12 meses.',
    ],
    phones: ['citaAeat'],
    documents: ['dni', 'iban'],
    deadline: 'En el momento de darte de alta como autónomo.',
    response: 'Se aplica en tu primera cuota. Lo ves en el recibo de la Seguridad Social.',
    warnings: ['Si dejas de pagar una cuota, pierdes la tarifa plana.', 'Al final de año la Seguridad Social ajusta la cuota según lo que hayas ganado.'],
  },
  'cese-actividad': {
    easy: ['Es el paro de los autónomos.', 'Lo paga tu mutua si cierras sin quererlo.'],
    steps: [
      'Mira en tus recibos qué mutua tienes (la eliges al darte de alta). Si no tienes, lo lleva el SEPE.',
      'Date de baja como autónomo en Hacienda y en la Seguridad Social.',
      'Junta las pruebas del cierre: pérdidas, deudas, una sentencia, la orden de protección o el divorcio, según tu caso.',
      'Pide la prestación en la web o en una oficina de tu mutua. Te dan un impreso de solicitud.',
      'Apúntate como demandante de empleo.',
    ],
    phones: ['sepe'],
    documents: ['dni', 'demanda', 'iban', 'extractos'],
    deadline: 'Hasta el último día del mes siguiente al cierre. Si llegas tarde, cobras menos días.',
    response: 'La mutua contesta en unos 30 días. Si es «no», puedes reclamar a la mutua y después ir al juzgado.',
    warnings: ['Cotizar por cese de actividad es obligatorio desde 2019: casi todos los autónomos lo tienen.'],
  },
  'subsidio-retornados': {
    easy: ['Es dinero cada mes si has vuelto a España después de trabajar fuera.', 'Lo da el SEPE.'],
    steps: [
      'Pide en el consulado o en el país donde trabajabas un papel que diga cuánto tiempo trabajaste allí.',
      'Pide en la Delegación o Subdelegación del Gobierno el certificado de emigrante retornado.',
      'Apúntate como demandante de empleo en la oficina de empleo de tu comunidad.',
      'Pide el subsidio en sede.sepe.gob.es con «PIN SEPE» (tu DNI y tu móvil) o con cita en el 91 926 79 70.',
    ],
    phones: ['citaSepe', 'sepe'],
    documents: ['dni', 'demanda', 'ingresos', 'iban'],
    deadline: 'Cuanto antes después de volver: el plazo es corto. Al apuntarte como demandante, pregunta en el SEPE la fecha límite de tu caso.',
    response: 'Te contestan por carta o en tu área personal del SEPE. Si es «no», puedes reclamar en 30 días.',
    warnings: ['Si trabajaste en la Unión Europea o en Suiza, pide allí el formulario U1: ese tiempo cuenta para el paro normal en España.'],
  },
  'aval-ico-vivienda': {
    easy: ['El Estado avala parte de tu hipoteca.', 'Así el banco te presta casi todo el precio de la casa.'],
    steps: [
      'Pregunta en tu banco si da hipotecas con aval del ICO. En ico.es está la lista de bancos.',
      'Lleva tus nóminas, tu última declaración de la renta y la vida laboral.',
      'El banco estudia la hipoteca y pide el aval al ICO por ti. Tú no haces nada con el ICO.',
      'Compara: puedes pedirla en varios bancos.',
    ],
    phones: [],
    documents: ['dni', 'ingresos', 'vidaLaboral', 'extractos'],
    deadline: 'Hasta el 31 de diciembre de 2027 o hasta que se acabe el dinero.',
    response: 'El banco decide si te da la hipoteca. El aval no obliga al banco a dártela.',
    warnings: ['Es una garantía, no un regalo: la hipoteca la pagas entera.', 'Algunas comunidades tienen además su propio aval.'],
  },
  ortoprotesica: {
    easy: ['La sanidad pública paga sillas de ruedas, prótesis y otras ayudas técnicas.', 'Te lo receta el médico especialista.'],
    steps: [
      'Pide cita con tu médico de cabecera y que te mande al especialista.',
      'El especialista te da la receta del producto.',
      'Llévala a una ortopedia autorizada por tu comunidad. Pregunta allí si lo cobran al servicio de salud.',
      'Si te lo hacen pagar a ti, guarda la factura y pide que te devuelvan el dinero (reintegro) en tu centro de salud o en la web de tu servicio de salud.',
    ],
    phones: [],
    documents: ['dni', 'informeSalud', 'iban'],
    deadline: 'Cuando el médico lo recete. El reintegro suele tener un plazo de unos meses desde la factura: pregúntalo.',
    response: 'Si te dicen que no, puedes reclamar al servicio de salud de tu comunidad.',
    warnings: ['Cada producto tiene una vida mínima: no se renueva antes de ese tiempo salvo que cambie tu situación.'],
  },
  'aes-euskadi': {
    easy: ['Ayuda para un gasto que no puedes pagar.', 'Se pide en los servicios sociales de tu ayuntamiento.'],
    steps: [
      'Pide cita en los servicios sociales de tu ayuntamiento.',
      'Explica qué gasto no puedes pagar: alquiler, luz, comida, una deuda, un mueble o un arreglo.',
      'Lleva el padrón, tus ingresos y la factura o el presupuesto del gasto.',
      'La trabajadora social te ayuda a rellenar la solicitud.',
    ],
    phones: [],
    documents: ['dni', 'padron', 'ingresos', 'extractos', 'iban'],
    deadline: 'Durante el año, mientras el ayuntamiento tenga dinero para estas ayudas. Pídela pronto.',
    response: 'Te contesta el ayuntamiento. Si es «no», puedes recurrir.',
    warnings: ['Si cobras la RGI o el IMV también puedes pedirla.'],
  },
  'fons-infancia-barcelona': {
    easy: ['Dinero para familias con hijos e ingresos bajos en Barcelona.', 'Se pide una vez al año.'],
    steps: [
      'Si no lo eres ya, hazte usuario de tu Centro de Servicios Sociales: pide cita en el 010.',
      'Espera a que abra la convocatoria (en 2026 fue del 13 de mayo al 22 de junio).',
      'Pídela en la Oficina Virtual de Trámites del Ayuntamiento (ajuntament.barcelona.cat) o con ayuda en tu centro de servicios sociales.',
      'Si la custodia es compartida, cada progenitor cobra la mitad.',
    ],
    phones: [],
    documents: ['dni', 'padron', 'libroFamilia', 'ingresos', 'iban'],
    deadline: 'Una vez al año, en el plazo de la convocatoria.',
    response: 'Te avisan por la Oficina Virtual o por carta.',
  },
  'natalidad-valencia': {
    easy: ['400 € por cada bebé si vives en València.', 'Pídela en los 2 meses después del nacimiento.'],
    steps: [
      'Empadrona al bebé en València.',
      'Pide la ayuda en la sede electrónica del Ayuntamiento (sede.valencia.es), trámite PA.AY.15.',
      'Si tienes dudas, llama al 963 539 935 o escribe a ayudasnatalidad@valencia.es con un teléfono de contacto.',
    ],
    phones: [],
    documents: ['dni', 'padron', 'libroFamilia', 'iban'],
    deadline: 'En los 2 meses siguientes al nacimiento, la adopción o el acogimiento. Convocatoria de 2026: hasta el 1 de marzo de 2027.',
    response: 'Te avisan por la sede electrónica.',
  },
  'urgencia-zaragoza': {
    easy: ['Ayuda puntual del Ayuntamiento de Zaragoza.', 'Para comida, alquiler, luz o cosas del colegio.'],
    steps: [
      'Pide cita en tu centro municipal de servicios sociales: llama al 010 (976 721 100 desde fuera de Zaragoza).',
      'Cuenta a la trabajadora social qué necesitáis.',
      'Lleva el padrón, tus ingresos y las facturas o recibos del gasto.',
    ],
    phones: [],
    documents: ['dni', 'padron', 'ingresos', 'iban'],
    deadline: 'Cuando lo necesites.',
    response: 'Si es urgente, te la dan en poco tiempo.',
  },
  'nos-cuidamos-malaga': {
    easy: ['Alguien cuida gratis a tus hijos en casa unas horas.', 'Para que puedas trabajar, formarte o ir a una cita.'],
    steps: [
      'Espera a que abra la edición del año (en 2026, se pudo pedir desde el 11 de junio).',
      'Pídelo en sede.malaga.eu (trámites de Igualdad) o en malagaciudadcorresponsable.eu.',
      'También en persona, en las oficinas municipales de atención a la ciudadanía (OMAC).',
      'Hace falta el permiso de los dos progenitores o tutores.',
    ],
    phones: [],
    documents: ['dni', 'padron', 'libroFamilia', 'ingresos'],
    deadline: 'Mientras esté abierta la edición y queden horas.',
    response: 'Te llama el Ayuntamiento para organizar las horas.',
  },
};

/** El trámite de una ayuda para tu comunidad (en Madrid, los pasos y teléfonos de Madrid si los hay) */
// Ayudas propias de cada comunidad: su trámite viene con la ficha
for (const a of REGIONAL_BENEFITS) PROCEDURES[a.id] = a.procedure;

// Dependencia y discapacidad: pasos de cada comunidad a partir de quién valora y dónde se empieza
for (const [region, v] of Object.entries(REGIONAL_ASSESSMENT)) {
  for (const [id, key, steps] of [['dependencia-valoracion', 'dependency', dependencySteps], ['certificado-discapacidad', 'disability', disabilitySteps]]) {
    if (!v[key]) continue;
    const t = PROCEDURES[id];
    t.stepsByRegion ??= {};
    t.stepsByRegion[region] ??= steps(v[key]);
    if (v[key].phone) {
      t.phonesByRegion ??= {};
      t.phonesByRegion[region] ??= [v[key].phone];
    }
  }
}

// En las ayudas que tramita la comunidad, su teléfono de información va primero
const REGION_MANAGED = new Set(MANAGED_BY_REGION);
function phonesOf(id, t, region) {
  const ownItems = t.phonesByRegion?.[region] || (region === 'madrid' && t.madridPhones) || t.phones || [];
  const info = REGION_MANAGED.has(id) && REGION_INFO_PHONE[region];
  return info ? [...new Set([info, ...ownItems])] : ownItems;
}

export function procedureOf(id, region) {
  const t = PROCEDURES[id] ?? { easy: [], steps: [], documents: [] };
  const inMadrid = region === 'madrid';
  return {
    ...t,
    steps: t.stepsByRegion?.[region] || (inMadrid && t.madridSteps) || t.steps || [],
    phones: phonesOf(id, t, region),
    documents: t.documentsByRegion?.[region] || t.documents || [],
    response: t.responseByRegion?.[region] || t.response,
    stepsNote: NO_INTERNET,
  };
}

/** Todos los papeles que hacen falta para un conjunto de ayudas, con las ayudas que los piden */
export function papersFor(ids) {
  const papers = new Map();
  for (const id of ids) {
    for (const d of PROCEDURES[id]?.documents ?? []) {
      if (!papers.has(d)) papers.set(d, []);
      papers.get(d).push(id);
    }
  }
  return [...papers.entries()].map(([doc, benefits]) => ({ doc, benefits })).sort((a, b) => b.benefits.length - a.benefits.length);
}
