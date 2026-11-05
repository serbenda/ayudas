// When each card was reviewed and until when its call is valid.
// The weekly Action (scripts/watch/review.mjs) warns when a card has gone more than a year without review
// or when the date to check its call arrives (CHECK_ON).

export const DEFAULT_REVIEWED = '2026-11';

// Cards reviewed on another date (year-month)
export const REVIEWED = {};

// Date to check the call (year-month-day): when the open period ends,
// or when next year's usually comes out if this year's has already closed.
export const CHECK_ON = {
  'concilia-asturias': '2027-07-15', // 2026: from 8 August to 15 September
  'natalidad-rural-extremadura': '2027-07-15', // 2026: from 7 August to 30 September
  'familias-especiales-murcia': '2027-09-15', // 2026: from 1 to 15 October
  'fons-infancia-barcelona': '2027-04-15', // 2026: from 13 May to 22 June
  'nos-cuidamos-malaga': '2027-05-15', // 2026: from 11 June
  'xec-cangur': '2027-06-01', // 2026: July, September-October and October
  'natalidad-valencia': '2027-03-01', // 2026 call: until 1 March 2027
  'familias-numerosas-clm': '2026-12-31', // call open all of 2026
  'ayuda-hijos-euskadi': '2026-12-31', // applying earlier, it is paid from January 2026
  'aval-ico-vivienda': '2027-12-31', // can be signed until this date
  'renta-minima': '2026-12-31', // Castilla-La Mancha: renewals only until this date
};

export const reviewedOf = (id) => REVIEWED[id] ?? DEFAULT_REVIEWED;

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** «noviembre de 2026»*/
export function reviewedText(id) {
  const [a, m] = reviewedOf(id).split('-').map(Number);
  return `${MONTHS[m - 1]} de ${a}`;
}

/** Cards to review today: more than a year without review or deadline passed*/
export function toReview(ids, today = new Date()) {
  const notices = [];
  for (const id of ids) {
    const [a, m] = reviewedOf(id).split('-').map(Number);
    const months = (today.getFullYear() - a) * 12 + (today.getMonth() + 1 - m);
    if (months >= 12) notices.push({ id, reason: `lleva ${months} meses sin revisar (desde ${reviewedText(id)})` });
    const checkDate = CHECK_ON[id];
    if (checkDate && new Date(`${checkDate}T00:00:00`) <= today)
      notices.push({ id, reason: `desde el ${checkDate.split('-').reverse().join('/')} toca mirar su convocatoria: si ha salido una nueva o ha cambiado el plazo, actualiza fechas y cuantías` });
  }
  return notices;
}
