// Reminders for the phone calendar (.ics): dates not to miss.
// Created in the browser and downloaded; nothing is sent.

const REMINDERS = [
  {
    id: 'revisar',
    always: true,
    monthly: 1,
    day: 15,
    annual: true,
    title: 'Revisa tus ayudas: las cifras cambian en enero',
    text: 'Vuelve a contestar las preguntas en ayudas.bendi.dev: cada enero suben las cuantías y cambian los límites.',
  },
  {
    id: 'pnc',
    forIds: ['pnc-jubilacion', 'pnc-invalidez', 'pnc-alquiler'],
    monthly: 3,
    day: 1,
    annual: true,
    title: 'Pensión no contributiva: declaración de ingresos',
    text: 'Hay que entregar la declaración anual de ingresos antes del 1 de abril. Si no, te pueden suspender la pensión.',
  },
  {
    id: 'renta',
    forIds: ['deduccion-maternidad', 'deduccion-familia-numerosa', 'deduccion-monoparental', 'deduccion-discapacidad-cargo', 'minimo-discapacidad', 'deducciones-ccaa'],
    monthly: 4,
    day: 8,
    annual: true,
    title: 'Empieza la campaña de la renta',
    text: 'Revisa que en tu declaración salen las deducciones por familia o discapacidad.',
  },
  {
    id: 'alquiler',
    forIds: ['alquiler-joven', 'alquiler-general'],
    monthly: 3,
    day: 1,
    annual: true,
    title: 'Mira si ha abierto la ayuda al alquiler',
    text: 'Las comunidades suelen abrir la convocatoria en primavera y se cierra al acabarse el dinero.',
  },
  {
    id: 'imv',
    forIds: ['imv'],
    monthly: 3,
    day: 15,
    annual: true,
    title: 'IMV: avisa de los cambios en casa',
    text: 'Si ha cambiado quién vive en casa o lo que ganáis, comunícalo en 30 días a la Seguridad Social.',
  },
  {
    id: 'bono',
    forIds: ['bono-social'],
    inMonths: 22,
    title: 'Bono social: mira cuándo se renueva',
    text: 'El bono social se renueva cada 2 años. Mira la fecha en tu factura de la luz y pide la renovación a tiempo.',
  },
];

const twoDigits = (n) => String(n).padStart(2, '0');
const date = (d) => `${d.getFullYear()}${twoDigits(d.getMonth() + 1)}${twoDigits(d.getDate())}`;
// ICS text: escape commas, semicolons and backslashes; 75-character lines as the standard requires
const icsText = (s) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, (m) => `\\${m}`)
    .replace(/\n/g, '\\n');
function fold(line) {
  const chunks = [];
  let rest = line;
  while (rest.length > 74) {
    chunks.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  chunks.push(rest);
  return chunks.join('\r\n');
}

/** Reminders that apply to these benefits*/
export function remindersFor(ids) {
  const hasIt = new Set(ids);
  return REMINDERS.filter((r) => r.always || r.forIds.some((id) => hasIt.has(id)));
}

/** .ics calendar with the reminders that apply. `today` can be passed for testing.*/
export function calendar(ids, today = new Date()) {
  const stamp = `${date(today)}T000000Z`;
  const events = remindersFor(ids).map((r) => {
    let d;
    if (r.inMonths) d = new Date(today.getFullYear(), today.getMonth() + r.inMonths, Math.min(today.getDate(), 28));
    else {
      d = new Date(today.getFullYear(), r.monthly - 1, r.day);
      if (d <= today) d = new Date(today.getFullYear() + 1, r.monthly - 1, r.day);
    }
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return [
      'BEGIN:VEVENT',
      `UID:${r.id}-${date(d)}@ayudas.bendi.dev`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${date(d)}`,
      `DTEND;VALUE=DATE:${date(end)}`,
      ...(r.annual ? ['RRULE:FREQ=YEARLY'] : []),
      `SUMMARY:${icsText(r.title)}`,
      `DESCRIPTION:${icsText(`${r.text}\nhttps://ayudas.bendi.dev/`)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsText(r.title)}`,
      'END:VALARM',
      'END:VEVENT',
    ];
  });
  return (
    ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ayudas.bendi.dev//Recordatorios//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Ayudas: fechas importantes', ...events.flat()].map(fold).join('\r\n') +
    '\r\nEND:VCALENDAR\r\n'
  );
}

/** Downloads the .ics in the browser*/
export function downloadCalendar(ids) {
  const blob = new Blob([calendar(ids)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ayudas-recordatorios.ics';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
