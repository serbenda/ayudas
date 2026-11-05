// Cuándo se revisó cada ficha y hasta cuándo vale su convocatoria.
// La Action semanal (scripts/caducidad.mjs) avisa cuando una ficha lleva más de un año sin revisar
// o cuando llega la fecha de mirar su convocatoria (MIRAR_EN).

export const REVISADO_POR_DEFECTO = '2026-11';

// Fichas revisadas en otra fecha (año-mes)
export const REVISADO = {};

// Fecha en la que toca mirar la convocatoria (año-mes-día): cuando acaba el plazo abierto,
// o cuando suele salir la del año siguiente si la de este año ya se cerró.
export const MIRAR_EN = {
  'concilia-asturias': '2027-07-15', // 2026: del 8 de agosto al 15 de septiembre
  'natalidad-rural-extremadura': '2027-07-15', // 2026: del 7 de agosto al 30 de septiembre
  'familias-especiales-murcia': '2027-09-15', // 2026: del 1 al 15 de octubre
  'fons-infancia-barcelona': '2027-04-15', // 2026: del 13 de mayo al 22 de junio
  'nos-cuidamos-malaga': '2027-05-15', // 2026: desde el 11 de junio
  'xec-cangur': '2027-06-01', // 2026: julio, septiembre-octubre y octubre
  'natalidad-valencia': '2027-03-01', // convocatoria de 2026: hasta el 1 de marzo de 2027
  'familias-numerosas-clm': '2026-12-31', // convocatoria abierta todo 2026
  'ayuda-hijos-euskadi': '2026-12-31', // pidiéndola antes, se cobra desde enero de 2026
  'aval-ico-vivienda': '2027-12-31', // se puede firmar hasta esta fecha
  'renta-minima': '2026-12-31', // Castilla-La Mancha: solo renovaciones hasta esta fecha
};

export const revisadoDe = (id) => REVISADO[id] ?? REVISADO_POR_DEFECTO;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** «noviembre de 2026» */
export function textoRevisado(id) {
  const [a, m] = revisadoDe(id).split('-').map(Number);
  return `${MESES[m - 1]} de ${a}`;
}

/** Fichas que hay que revisar hoy: más de un año sin revisar o plazo pasado */
export function porRevisar(ids, hoy = new Date()) {
  const avisos = [];
  for (const id of ids) {
    const [a, m] = revisadoDe(id).split('-').map(Number);
    const meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m);
    if (meses >= 12) avisos.push({ id, motivo: `lleva ${meses} meses sin revisar (desde ${textoRevisado(id)})` });
    const mirar = MIRAR_EN[id];
    if (mirar && new Date(`${mirar}T00:00:00`) <= hoy) avisos.push({ id, motivo: `desde el ${mirar.split('-').reverse().join('/')} toca mirar su convocatoria: si ha salido una nueva o ha cambiado el plazo, actualiza fechas y cuantías` });
  }
  return avisos;
}
