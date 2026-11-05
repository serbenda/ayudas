// Formato de números en español: 1.234,50 €

const conDecimales = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const sinDecimales = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });

/** 1234.5 → «1.234,50 €»; 1200 → «1.200 €» (sin decimales si son redondos) */
export function euros(n) {
  if (!Number.isFinite(n)) return '—';
  const redondo = Math.abs(n - Math.round(n)) < 0.005;
  return `${(redondo ? sinDecimales : conDecimales).format(redondo ? Math.round(n) : n)} €`;
}

/** 0.425 → «42,5 %» */
export function porcentaje(n) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(n * 100)} %`;
}

/** Lee un número escrito a la española: «1.234,5», «1234.5», «1 234» → 1234.5. Vacío o raro → null */
export function leerNumero(texto) {
  if (texto == null) return null;
  let t = String(texto).trim().replace(/[\s€]/g, '');
  if (!t) return null;
  if (/,/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
