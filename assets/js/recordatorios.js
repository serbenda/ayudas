// Recordatorios para el calendario del móvil (.ics): fechas que no hay que dejar pasar.
// Se crea en el navegador y se descarga; no se envía nada.

const RECORDATORIOS = [
  { id: 'revisar', siempre: true, mes: 1, dia: 15, anual: true, titulo: 'Revisa tus ayudas: las cifras cambian en enero', texto: 'Vuelve a contestar las preguntas en ayudas.bendi.dev: cada enero suben las cuantías y cambian los límites.' },
  { id: 'pnc', para: ['pnc-jubilacion', 'pnc-invalidez', 'pnc-alquiler'], mes: 3, dia: 1, anual: true, titulo: 'Pensión no contributiva: declaración de ingresos', texto: 'Hay que entregar la declaración anual de ingresos antes del 1 de abril. Si no, te pueden suspender la pensión.' },
  { id: 'renta', para: ['deduccion-maternidad', 'deduccion-familia-numerosa', 'deduccion-monoparental', 'deduccion-discapacidad-cargo', 'minimo-discapacidad', 'deducciones-ccaa'], mes: 4, dia: 8, anual: true, titulo: 'Empieza la campaña de la renta', texto: 'Revisa que en tu declaración salen las deducciones por familia o discapacidad.' },
  { id: 'alquiler', para: ['alquiler-joven', 'alquiler-general'], mes: 3, dia: 1, anual: true, titulo: 'Mira si ha abierto la ayuda al alquiler', texto: 'Las comunidades suelen abrir la convocatoria en primavera y se cierra al acabarse el dinero.' },
  { id: 'imv', para: ['imv'], mes: 3, dia: 15, anual: true, titulo: 'IMV: avisa de los cambios en casa', texto: 'Si ha cambiado quién vive en casa o lo que ganáis, comunícalo en 30 días a la Seguridad Social.' },
  { id: 'bono', para: ['bono-social'], enMeses: 22, titulo: 'Bono social: mira cuándo se renueva', texto: 'El bono social se renueva cada 2 años. Mira la fecha en tu factura de la luz y pide la renovación a tiempo.' },
];

const dosCifras = (n) => String(n).padStart(2, '0');
const fecha = (d) => `${d.getFullYear()}${dosCifras(d.getMonth() + 1)}${dosCifras(d.getDate())}`;
// Texto ICS: escapar comas, punto y coma y barras; líneas de 75 caracteres como pide la norma
const textoIcs = (s) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
function plegar(linea) {
  const trozos = [];
  let resto = linea;
  while (resto.length > 74) {
    trozos.push(resto.slice(0, 74));
    resto = ` ${resto.slice(74)}`;
  }
  trozos.push(resto);
  return trozos.join('\r\n');
}

/** Recordatorios que tocan para estas ayudas */
export function recordatoriosPara(ids) {
  const tiene = new Set(ids);
  return RECORDATORIOS.filter((r) => r.siempre || r.para.some((id) => tiene.has(id)));
}

/** Calendario .ics con los recordatorios que tocan. `hoy` se puede pasar para probarlo. */
export function calendario(ids, hoy = new Date()) {
  const sello = `${fecha(hoy)}T000000Z`;
  const eventos = recordatoriosPara(ids).map((r) => {
    let d;
    if (r.enMeses) d = new Date(hoy.getFullYear(), hoy.getMonth() + r.enMeses, Math.min(hoy.getDate(), 28));
    else {
      d = new Date(hoy.getFullYear(), r.mes - 1, r.dia);
      if (d <= hoy) d = new Date(hoy.getFullYear() + 1, r.mes - 1, r.dia);
    }
    const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return [
      'BEGIN:VEVENT',
      `UID:${r.id}-${fecha(d)}@ayudas.bendi.dev`,
      `DTSTAMP:${sello}`,
      `DTSTART;VALUE=DATE:${fecha(d)}`,
      `DTEND;VALUE=DATE:${fecha(fin)}`,
      ...(r.anual ? ['RRULE:FREQ=YEARLY'] : []),
      `SUMMARY:${textoIcs(r.titulo)}`,
      `DESCRIPTION:${textoIcs(`${r.texto}\nhttps://ayudas.bendi.dev/`)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${textoIcs(r.titulo)}`,
      'END:VALARM',
      'END:VEVENT',
    ];
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ayudas.bendi.dev//Recordatorios//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Ayudas: fechas importantes', ...eventos.flat()].map(plegar).join('\r\n') + '\r\nEND:VCALENDAR\r\n';
}

/** Descarga el .ics en el navegador */
export function descargarCalendario(ids) {
  const blob = new Blob([calendario(ids)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ayudas-recordatorios.ics';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
