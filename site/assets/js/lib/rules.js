// Reglas: a partir de tus respuestas, qué ayudas te pueden corresponder.
// Funciones puras (sin DOM) para poder probarlas con node --test.
//
// Cada regla devuelve null (no te corresponde o no sabemos nada que lo apunte) o un resultado:
//   { id, estado: 'si' | 'quizas', motivos: [...], comprobar: [...], importe?: { mes?, año?, unico?, texto } }
// · 'si': por lo que has contestado, cumples lo principal. Aun así, lo decide el organismo al pedirla.
// · 'quizas': puede corresponderte, pero depende de algo que no hemos preguntado o no has contestado.

import { CIFRAS } from '../data/figures.js';
import { RENTA_CCAA } from '../data/regions.js';
import { AYUDAS_CCAA } from '../data/regional-benefits.js';
import { euros, porcentaje } from './format.js';

const PENSIONES_CONTRIBUTIVAS = ['jubilacion', 'viudedad', 'incapacidad'];
const GRADOS = ['1', '2', '3'];
const CON_33 = ['33', '65', '75'];
const CON_65 = ['65', '75'];

/** Perfil vacío: lo que se supone si no se contesta nada */
export function perfilVacio() {
  return {
    edad: null,
    ccaa: null,
    situacion: null,
    emprender: false,
    retornado: false,
    pareja: false,
    adultos: 1,
    hijos: { menor3: 0, de3a5: 0, de6a17: 0 },
    bebe: false,
    familiaNumerosa: 'no',
    monoparental: false,
    viudo: false,
    ingresosHogar: null,
    ingresosPropios: null,
    patrimonioAlto: null,
    vivienda: null,
    discapacidad: 'no',
    dependencia: 'no',
    cuidados: [],
    enfermedadGraveHijo: false,
    pension: 'no',
    pensionMes: null,
    pensionDesde2021: null,
    hijosTenidos: 0,
    cotizado15: null,
    cotizadoUnAño: null,
    madridCapital: null,
    ciudad: null, // 'barcelona' | 'valencia' | 'zaragoza' | 'malaga' si vive en esa ciudad
    residencia: null, // 'si' (española, UE o permiso) | 'tramite' | 'no'
    urgencias: { comida: false, casaRiesgo: false, sinCasa: false, violencia: false, soledad: false },
  };
}

// ── Cálculos que usan varias reglas ──────────────────────────────────────

export function totalHijos(p) {
  return p.hijos.menor3 + p.hijos.de3a5 + p.hijos.de6a17;
}

export function miembros(p) {
  return Math.max(1, p.adultos) + totalHijos(p);
}

const trabaja = (p) => p.situacion === 'cuenta-ajena' || p.situacion === 'autonomo';
const enParo = (p) => p.situacion === 'paro-cobrando' || p.situacion === 'paro-sin';
// Para las deducciones «reembolsables» hay que trabajar, cobrar paro o pensión
const tieneRentasQueCuentan = (p) => trabaja(p) || p.situacion === 'paro-cobrando' || p.pension !== 'no' || p.situacion === 'pensionista';

/** Todas las personas del hogar con sus circunstancias: tú y las que cuidas */
function personas(p) {
  return [{ quien: 'tú', relacion: 'yo', edad: p.edad, discapacidad: p.discapacidad, dependencia: p.dependencia, convive: true, cuidoYo: false }, ...p.cuidados.map((c, i) => ({ quien: nombrePersona(c, i), ...c }))];
}

function nombrePersona(c, i) {
  const nombres = { hijo: 'tu hijo o hija', padre: 'tu padre o tu madre', pareja: 'tu pareja', otro: 'tu familiar' };
  return `${nombres[c.relacion] ?? 'la persona'}${i > 0 ? ` (${i + 1}.ª persona)` : ''}`;
}

/** ¿Hay en el hogar alguien con discapacidad ≥ 65 % o dependencia de grado III? (complemento del IMV) */
function hayDiscapacidadGrave(p) {
  return personas(p).some((x) => CON_65.includes(x.discapacidad) || x.dependencia === '3');
}

/** Renta garantizada del IMV al mes para este hogar */
export function rentaGarantizada(p) {
  const { base, porPersona, maximo, complemento } = CIFRAS.imv;
  const escala = Math.min(1 + porPersona * (miembros(p) - 1), maximo);
  const extra = p.monoparental || hayDiscapacidadGrave(p) ? complemento : 0;
  return round2(base * (escala + extra));
}

/** Límite de ingresos del bono social de la luz (euros al año) y el multiplicador del IPREM que se ha usado */
export function limiteBonoSocial(p) {
  const menores = totalHijos(p);
  let veces = 1.5 + 0.5 * Math.min(menores, 2);
  const especial = p.monoparental || personas(p).some((x) => CON_33.includes(x.discapacidad) || x.dependencia === '2' || x.dependencia === '3');
  if (especial) veces += 0.5;
  return { veces, euros: veces * CIFRAS.iprem.anual14 };
}

/** Pensión mínima que te tocaría según tu pensión, edad y familia (euros al mes) */
export function pensionMinima(p) {
  const m = CIFRAS.minimas;
  if (p.pension === 'viudedad') {
    if (totalHijos(p) > 0) return { cifra: m.viudedad.conCargas, caso: 'viudedad con cargas familiares' };
    if ((p.edad ?? 0) >= 65 || CON_65.includes(p.discapacidad)) return { cifra: m.viudedad.desde65, caso: 'viudedad, 65 años o más' };
    if ((p.edad ?? 0) >= 60) return { cifra: m.viudedad.de60a64, caso: 'viudedad, de 60 a 64 años' };
    return { cifra: m.viudedad.menor60, caso: 'viudedad, menos de 60 años' };
  }
  const tabla = (p.edad ?? 65) >= 65 ? m.jubilacion65 : m.jubilacionMenor65;
  const edadTexto = (p.edad ?? 65) >= 65 ? '65 años o más' : 'menos de 65 años';
  if (p.pareja) return { cifra: tabla.conyugeNoACargo, caso: `${edadTexto}, con cónyuge que no está a tu cargo`, conConyuge: tabla.conConyuge };
  return { cifra: tabla.sinConyuge, caso: `${edadTexto}, sin cónyuge` };
}

const round2 = (n) => Math.round(n * 100) / 100;
const año = (n) => `${euros(n)} al año`;
const mes = (n) => `${euros(n)} al mes`;

// ── Reglas ───────────────────────────────────────────────────────────────

const REGLAS = {
  imv(p) {
    if (p.edad != null && p.edad < 18) return null;
    if (p.edad != null && p.edad < 23 && totalHijos(p) === 0) return null;
    if (p.pension === 'jubilacion' || p.pension === 'pnc') return null;
    const rg = rentaGarantizada(p);
    const anual = rg * 12;
    const comprobar = ['Lo que cuenta son los ingresos del año pasado de todo el hogar.'];
    if (p.patrimonioAlto === true) {
      if (miembros(p) === 1) return null;
      comprobar.push('Tenéis ahorros o bienes: el límite de patrimonio sube con cada persona del hogar, compruébalo en el simulador.');
    }
    if (p.patrimonioAlto == null) comprobar.push('Que vuestro patrimonio (sin contar la casa) no pase del límite.');
    const motivos = [`Para vuestro hogar (${miembros(p)} ${miembros(p) === 1 ? 'persona' : 'personas'}${p.monoparental ? ', monoparental' : ''}) la renta garantizada es de ${mes(rg)} (${año(anual)}).`];
    if (p.ingresosHogar == null) {
      return { estado: 'quizas', motivos, comprobar: ['Depende de los ingresos de tu hogar, que no has puesto.', ...comprobar], importe: { mes: rg, texto: `Hasta ${mes(rg)}` } };
    }
    if (p.ingresosHogar >= anual) return null;
    const cobro = round2(rg - p.ingresosHogar / 12);
    motivos.push(`Vuestros ingresos (${año(p.ingresosHogar)}) no llegan a esa cifra.`);
    return { estado: 'si', motivos, comprobar, importe: { mes: cobro, texto: `≈ ${mes(cobro)}` } };
  },

  capi(p) {
    const n = totalHijos(p);
    if (n === 0) return null;
    const { menor3, de3a5, de6a17 } = p.hijos;
    const total = round2(menor3 * CIFRAS.capi.menor3 + de3a5 * CIFRAS.capi.de3a6 + de6a17 * CIFRAS.capi.de6a18);
    const importe = { mes: total, texto: mes(total) };
    const motivos = [`Tenéis ${n} ${n === 1 ? 'hijo menor' : 'hijos menores'} de 18 años.`];
    const anual = rentaGarantizada(p) * 12;
    const comprobar = ['El límite de patrimonio, sin contar la vivienda.'];
    if (p.ingresosHogar == null) return { estado: 'quizas', motivos, comprobar: ['Depende de los ingresos del hogar.', ...comprobar], importe };
    if (p.ingresosHogar <= anual) return { estado: 'si', motivos: [...motivos, `Vuestros ingresos están por debajo de la renta garantizada del IMV (${año(anual)}).`], comprobar, importe };
    if (p.ingresosHogar <= anual * CIFRAS.capi.limiteVecesRenta) {
      return { estado: 'quizas', motivos: [...motivos, 'Vuestros ingresos están en la franja en la que se puede cobrar (entera o en parte).'], comprobar: ['El límite exacto de ingresos de tu tipo de hogar: el simulador de la Seguridad Social lo calcula.', ...comprobar], importe };
    }
    return null;
  },

  'renta-minima'(p) {
    if (p.ccaa === 'madrid') return null;
    const r = RENTA_CCAA[p.ccaa];
    const nombre = r ? `En tu comunidad se llama ${r.nombre}.` : null;
    const importe = r?.importe ? { texto: `Hasta ${mes(r.importe)} (una persona)` } : undefined;
    const anual = rentaGarantizada(p) * 12;
    if (p.ingresosHogar != null && p.ingresosHogar < anual) {
      return { estado: 'quizas', motivos: ['Vuestros ingresos son bajos y tu comunidad puede tener una renta propia que complementa el IMV.', ...(nombre ? [nombre] : [])], comprobar: ['Los requisitos de empadronamiento de tu comunidad.', ...(r?.nota ? [r.nota] : [])], importe };
    }
    if (p.ingresosHogar == null && p.situacion === 'paro-sin') {
      return { estado: 'quizas', motivos: ['Estás en paro sin cobrar prestación.', ...(nombre ? [nombre] : [])], comprobar: ['Los ingresos del hogar y el empadronamiento.', ...(r?.nota ? [r.nota] : [])], importe };
    }
    return null;
  },

  paro(p) {
    if (p.situacion !== 'paro-sin' || p.cotizadoUnAño === false) return null;
    return {
      estado: p.cotizadoUnAño ? 'si' : 'quizas',
      motivos: ['Estás en paro y no cobras ninguna prestación.', ...(p.cotizadoUnAño ? ['Has trabajado al menos un año en los últimos seis.'] : [])],
      comprobar: ['Que perdieras el trabajo sin quererlo y lo pidas en 15 días hábiles.'],
    };
  },

  'subsidio-desempleo'(p) {
    if (!enParo(p)) return null;
    if ((p.edad ?? 0) >= 52 && p.cotizado15) return null; // le toca el de mayores de 52
    const limite = CIFRAS.subsidio.limiteRentasMes * 12;
    if (p.ingresosPropios != null && p.ingresosPropios > limite) return null;
    const motivos = [p.situacion === 'paro-cobrando' ? 'Cobras el paro: cuando se te acabe, puedes pasar al subsidio.' : 'Estás en paro sin cobrar prestación.'];
    const comprobar = [];
    if (p.ingresosPropios == null) comprobar.push(`Que tus rentas propias no pasen de ${mes(CIFRAS.subsidio.limiteRentasMes)}.`);
    else motivos.push(`Tus rentas propias (${año(p.ingresosPropios)}) están por debajo del límite (${año(limite)}).`);
    if (p.pareja || totalHijos(p) > 0) comprobar.push('Con responsabilidades familiares dura más, pero también cuentan las rentas del hogar.');
    return {
      estado: p.situacion === 'paro-sin' && p.ingresosPropios != null ? 'si' : 'quizas',
      motivos,
      comprobar,
      importe: { mes: CIFRAS.subsidio.primeros6Meses, texto: `${mes(CIFRAS.subsidio.primeros6Meses)} al principio` },
    };
  },

  'subsidio-52'(p) {
    if (!enParo(p) || (p.edad ?? 0) < 52 || p.cotizado15 === false) return null;
    const limite = CIFRAS.subsidio.limiteRentasMes * 12;
    if (p.ingresosPropios != null && p.ingresosPropios > limite) return null;
    const comprobar = [];
    if (p.cotizado15 == null) comprobar.push('Haber cotizado al menos 15 años.');
    if (p.ingresosPropios == null) comprobar.push(`Que tus rentas propias no pasen de ${mes(CIFRAS.subsidio.limiteRentasMes)}.`);
    if (p.situacion === 'paro-cobrando') comprobar.push('Se pide cuando se te acabe el paro.');
    return {
      estado: comprobar.length ? 'quizas' : 'si',
      motivos: [`Tienes ${p.edad} años y estás en paro.`, ...(p.cotizado15 ? ['Has cotizado al menos 15 años.'] : [])],
      comprobar,
      importe: { mes: CIFRAS.subsidio.mayores52, texto: mes(CIFRAS.subsidio.mayores52) },
    };
  },

  nacimiento(p) {
    if (!p.bebe) return null;
    if (!trabaja(p) && p.situacion !== 'paro-cobrando') {
      if (!p.pareja) return null;
      return { estado: 'quizas', motivos: ['Esperáis un bebé o ha nacido hace poco.'], comprobar: ['La pide cada progenitor que trabaje: si tu pareja trabaja, le corresponde a ella.'] };
    }
    const semanas = p.monoparental ? CIFRAS.nacimiento.semanasMonoparental : CIFRAS.nacimiento.semanas;
    return {
      estado: 'si',
      motivos: ['Esperáis un bebé o ha nacido hace poco.', trabaja(p) ? 'Trabajas.' : 'Cobras el paro.'],
      comprobar: ['Tener cotizado el mínimo según tu edad.'],
      importe: { texto: `${semanas} semanas al 100 % de tu sueldo` },
    };
  },

  'pago-unico-nacimiento'(p) {
    if (!p.bebe) return null;
    const pasaANumerosa = totalHijos(p) + 1 >= 3;
    const motivos = [];
    if (p.familiaNumerosa !== 'no') motivos.push('Sois familia numerosa.');
    else if (pasaANumerosa) motivos.push('Con el bebé pasáis a ser familia numerosa.');
    if (p.monoparental) motivos.push('Sois una familia monoparental.');
    if (CON_65.includes(p.discapacidad)) motivos.push('Tienes una discapacidad del 65 % o más (cuenta si eres la madre).');
    if (!motivos.length) return null;
    return { estado: 'quizas', motivos, comprobar: ['Que los ingresos del hogar no pasen del límite de la Seguridad Social.'], importe: { unico: CIFRAS.nacimiento.pagoUnico, texto: `${euros(CIFRAS.nacimiento.pagoUnico)} una vez` } };
  },

  'madrid-natalidad'(p) {
    if (p.ccaa !== 'madrid' || !(p.bebe || p.hijos.menor3 > 0)) return null;
    const { madrid } = CIFRAS;
    if (p.ingresosHogar != null && p.ingresosHogar > madrid.rentaConjunta * 1.5) return null;
    const comprobar = [`Que la madre tenga ${madrid.edadMaxima} años o menos al pedirla.`, 'Que el niño no haya cumplido 2 años.', 'Empadronamiento en la Comunidad de Madrid los últimos 10 años.'];
    if (p.ingresosHogar == null || p.ingresosHogar > madrid.rentaIndividual) comprobar.push(`Renta de hasta ${año(madrid.rentaIndividual)} (${euros(madrid.rentaConjunta)} en conjunta).`);
    return {
      estado: 'quizas',
      motivos: ['Vives en la Comunidad de Madrid.', p.bebe ? 'Esperáis un bebé o ha nacido hace poco.' : 'Tenéis un hijo menor de 3 años.'],
      comprobar,
      importe: { mes: madrid.natalidadMes, texto: `${mes(madrid.natalidadMes)} (hasta ${euros(madrid.natalidadTotal)})` },
    };
  },

  'titulo-familia-numerosa'(p) {
    if (p.familiaNumerosa !== 'no') return null;
    const n = totalHijos(p);
    const hijoConDiscapacidad = p.cuidados.some((c) => c.relacion === 'hijo' && CON_33.includes(c.discapacidad));
    if (n >= 3) return { estado: 'si', motivos: [`Tenéis ${n} hijos.`], comprobar: ['Los hijos mayores también cuentan hasta los 21 años (25 si estudian).'] };
    if (n >= 2 && (hijoConDiscapacidad || p.viudo || CON_65.includes(p.discapacidad))) {
      const porque = hijoConDiscapacidad ? 'y uno tiene discapacidad' : p.viudo ? 'y has enviudado' : 'y tienes una discapacidad del 65 % o más';
      return { estado: 'si', motivos: [`Tenéis ${n} hijos ${porque}.`], comprobar: [] };
    }
    if (n === 2 && p.bebe) return { estado: 'quizas', motivos: ['Con el bebé tendréis 3 hijos.'], comprobar: ['Se pide cuando nazca.'] };
    if (n === 2 && p.monoparental) return { estado: 'quizas', motivos: ['Eres una familia monoparental con 2 hijos.'], comprobar: ['Algunas comunidades reconocen como numerosa a la monoparental con 2 hijos.'] };
    return null;
  },

  cume(p) {
    if (!p.enfermedadGraveHijo || !trabaja(p)) return null;
    return { estado: 'si', motivos: ['Tu hijo o hija tiene una enfermedad grave y trabajas.'], comprobar: ['Que ambos progenitores trabajen (salvo familia monoparental).', 'Reducir la jornada al menos un 50 %.'] };
  },

  'escuela-infantil'(p) {
    if (totalHijos(p) === 0 && !p.bebe) return null;
    return { estado: 'quizas', motivos: ['Tenéis hijos en edad escolar o de escuela infantil.'], comprobar: ['Las convocatorias de tu comunidad y tu ayuntamiento.'] };
  },

  orfandad(p) {
    if (!p.viudo || totalHijos(p) === 0) return null;
    return { estado: 'quizas', motivos: ['Has enviudado y tienes hijos menores.'], comprobar: ['Que tu pareja tuviera cotización o pensión.'], importe: { texto: `Mínimo ${mes(CIFRAS.minimas.orfandad)} por hijo` } };
  },

  'pnc-jubilacion'(p) {
    if ((p.edad ?? 0) < 65 || p.pension !== 'no') return null;
    const { anual, mensual } = CIFRAS.pnc;
    const comprobar = ['Haber vivido en España 10 años desde los 16.'];
    if (miembros(p) > 1) comprobar.push('Si vives con familia, el límite de ingresos sube y cuentan también los suyos.');
    if (p.ingresosPropios == null) return { estado: 'quizas', motivos: ['Tienes 65 años o más y no cobras pensión.'], comprobar: ['Depende de tus ingresos.', ...comprobar], importe: { mes: mensual, texto: `Hasta ${mes(mensual)}` } };
    if (p.ingresosPropios >= anual) return null;
    const cobro = round2(Math.max((anual - p.ingresosPropios) / 14, mensual * 0.25));
    return { estado: 'si', motivos: ['Tienes 65 años o más y no cobras pensión.', `Tus ingresos (${año(p.ingresosPropios)}) no llegan a ${año(anual)}.`], comprobar, importe: { mes: cobro, texto: `≈ ${mes(cobro)} (14 pagas)` } };
  },

  'pnc-invalidez'(p) {
    if (!CON_65.includes(p.discapacidad) || p.edad == null || p.edad < 18 || p.edad >= 65 || p.pension !== 'no') return null;
    const { anual, mensual } = CIFRAS.pnc;
    const comprobar = ['Haber vivido en España 5 años.'];
    if (p.ingresosPropios == null) return { estado: 'quizas', motivos: ['Tienes una discapacidad del 65 % o más y no cobras pensión.'], comprobar: ['Depende de tus ingresos.', ...comprobar], importe: { mes: mensual, texto: `Hasta ${mes(mensual)}` } };
    if (p.ingresosPropios >= anual) return null;
    const cobro = round2(Math.max((anual - p.ingresosPropios) / 14, mensual * 0.25));
    return { estado: 'si', motivos: ['Tienes una discapacidad del 65 % o más y no cobras pensión.', `Tus ingresos no llegan a ${año(anual)}.`], comprobar, importe: { mes: cobro, texto: `≈ ${mes(cobro)} (14 pagas)` } };
  },

  'pnc-alquiler'(p) {
    if (p.vivienda !== 'alquiler') return null;
    const pnc = p.pension === 'pnc' || REGLAS['pnc-jubilacion'](p)?.estado === 'si' || REGLAS['pnc-invalidez'](p)?.estado === 'si';
    if (!pnc) return null;
    return { estado: 'si', motivos: ['Cobras (o te puede corresponder) una pensión no contributiva y vives de alquiler.'], comprobar: ['Ser el titular del contrato y que el casero no sea un familiar cercano.'], importe: { año: CIFRAS.pnc.alquilerAnual, texto: año(CIFRAS.pnc.alquilerAnual) } };
  },

  'complemento-minimos'(p) {
    if (!PENSIONES_CONTRIBUTIVAS.includes(p.pension)) return null;
    const min = pensionMinima(p);
    const limite = p.pareja ? CIFRAS.minimas.limiteIngresos.conConyuge : CIFRAS.minimas.limiteIngresos.sinConyuge;
    const comprobar = [`Que tus otros ingresos (sin la pensión) no pasen de ${año(limite)}.`];
    if (min.conConyuge) comprobar.push(`Si tu cónyuge depende de ti (casi sin ingresos), el mínimo sube a ${mes(min.conConyuge)}.`);
    if (p.pensionMes == null) return { estado: 'quizas', motivos: [`La pensión mínima en tu caso (${min.caso}) es de ${mes(min.cifra)}.`], comprobar: ['Si tu pensión es menor, te la completan.', ...comprobar] };
    if (p.pensionMes >= min.cifra) {
      if (min.conConyuge && p.pensionMes < min.conConyuge) return { estado: 'quizas', motivos: [`Con cónyuge a cargo la mínima es ${mes(min.conConyuge)} y tu pensión es menor.`], comprobar };
      return null;
    }
    const falta = round2(min.cifra - p.pensionMes);
    return { estado: 'si', motivos: [`Tu pensión (${mes(p.pensionMes)}) está por debajo de la mínima en tu caso (${min.caso}): ${mes(min.cifra)}.`], comprobar, importe: { mes: falta, texto: `≈ ${mes(falta)} más` } };
  },

  'brecha-genero'(p) {
    if (!PENSIONES_CONTRIBUTIVAS.includes(p.pension) || p.hijosTenidos < 1 || p.pensionDesde2021 === false) return null;
    const n = Math.min(p.hijosTenidos, 4);
    const cifra = round2(CIFRAS.brecha * n);
    return {
      estado: p.pensionDesde2021 ? 'si' : 'quizas',
      motivos: [`Cobras una pensión contributiva y has tenido ${p.hijosTenidos} ${p.hijosTenidos === 1 ? 'hijo' : 'hijos'}.`],
      comprobar: [...(p.pensionDesde2021 ? [] : ['Que tu pensión empezara en 2021 o después.']), 'Lo cobra el progenitor con la pensión más baja. Si no te lo han puesto, se pide en la Seguridad Social.'],
      importe: { mes: cifra, texto: mes(cifra) },
    };
  },

  jubilacion(p) {
    if (p.pension !== 'no' || (p.edad ?? 0) < 60 || p.cotizado15 === false) return null;
    return {
      estado: 'quizas',
      motivos: [`Tienes ${p.edad} años y no cobras pensión.`],
      comprobar: [`En 2026 la edad ordinaria es ${CIFRAS.jubilacion.edad} (${CIFRAS.jubilacion.edadLarga} con ${CIFRAS.jubilacion.cotizacionLarga} cotizados).`, 'Mira tu vida laboral y el simulador de pensión en Tu Seguridad Social.'],
    };
  },

  viudedad(p) {
    if (!p.viudo || p.pension === 'viudedad') return null;
    return { estado: 'quizas', motivos: ['Has enviudado y no cobras pensión de viudedad.'], comprobar: ['Que estuvierais casados o fuerais pareja de hecho registrada.', 'Que tu pareja tuviera cotización o pensión.'] };
  },

  'imserso-viajes'(p) {
    const e = p.edad ?? 0;
    const ok = e >= 65 || p.pension === 'jubilacion' || (p.pension === 'viudedad' && e >= 55) || (PENSIONES_CONTRIBUTIVAS.includes(p.pension) && e >= 60);
    if (!ok) return null;
    return { estado: 'si', motivos: [p.pension !== 'no' ? 'Eres pensionista.' : 'Tienes 65 años o más.'], comprobar: ['Las plazas son limitadas: se reparten por puntos cada temporada.'] };
  },

  'servicios-mayores'(p) {
    const mayoresQueCuidas = p.cuidados.filter((c) => (c.edad ?? 0) >= 65);
    const yo = (p.edad ?? 0) >= 65 && (p.adultos === 1 || (p.edad ?? 0) >= 80);
    if (!yo && !mayoresQueCuidas.length) return null;
    return { estado: 'quizas', motivos: [yo ? (p.adultos === 1 ? 'Tienes 65 años o más y vives solo o sola.' : 'Tienes 80 años o más.') : 'Cuidas de una persona mayor.'], comprobar: ['Pide cita en los servicios sociales de tu ayuntamiento.'] };
  },

  'dependencia-valoracion'(p) {
    const quien = personas(p).filter((x) => x.dependencia === 'necesita');
    if (!quien.length) return null;
    return { estado: 'si', motivos: [`${capital(lista(quien.map((x) => x.quien)))} ${quien.length === 1 && quien[0].relacion === 'yo' ? 'necesitas' : 'necesita'} ayuda para el día a día y no tiene la dependencia reconocida.`], comprobar: ['Se pide en los servicios sociales: tardan meses, conviene pedirlo cuanto antes.'] };
  },

  'dependencia-servicios'(p) {
    const quien = personas(p).filter((x) => GRADOS.includes(x.dependencia));
    if (!quien.length) return null;
    return { estado: 'si', motivos: quien.map((x) => `${capital(x.quien)}: dependencia de grado ${x.dependencia}.`), comprobar: ['Revisar el Programa Individual de Atención (PIA) si no lo tenéis.'] };
  },

  'dependencia-prestacion'(p) {
    const quien = p.cuidados.filter((c) => GRADOS.includes(c.dependencia) && c.cuidoYo);
    if (!quien.length) return null;
    const comprobar = ['Que esta prestación se elija en el PIA.'];
    if (quien.some((c) => !c.convive)) comprobar.push('Normalmente el cuidador tiene que convivir con la persona dependiente.');
    return { estado: 'quizas', motivos: quien.map((c, i) => `Cuidas en casa a ${nombrePersona(c, i)}, con grado ${c.dependencia}.`), comprobar, importe: { texto: 'Según tu comunidad y el grado' } };
  },

  'convenio-cuidadores'(p) {
    const quien = p.cuidados.filter((c) => GRADOS.includes(c.dependencia) && c.cuidoYo);
    if (!quien.length) return null;
    return { estado: 'quizas', motivos: ['Cuidas a un familiar con dependencia reconocida.'], comprobar: ['Que tenga la prestación por cuidados en el entorno familiar.', ...(trabaja(p) ? ['No vale si trabajas a jornada completa.'] : [])], importe: { texto: 'La cotización la paga el Estado' } };
  },

  'certificado-discapacidad'(p) {
    const quien = personas(p).filter((x) => x.discapacidad === 'sin');
    if (!quien.length) return null;
    return { estado: 'si', motivos: [`${capital(lista(quien.map((x) => x.quien)))} ${quien.length === 1 && quien[0].relacion === 'yo' ? 'tienes' : 'tiene'} limitaciones pero sin certificado de discapacidad.`], comprobar: ['Con un 33 % o más se abren la mayoría de ventajas.'] };
  },

  'hijo-cargo-discapacidad'(p) {
    const hijos = p.cuidados.filter((c) => c.relacion === 'hijo' && CON_33.includes(c.discapacidad));
    if (!hijos.length) return null;
    const { menorCon33, mayorCon65, mayorCon75 } = CIFRAS.hijoACargo;
    let total = 0;
    let soloSeguro = true;
    const motivos = [];
    for (const h of hijos) {
      if ((h.edad ?? 0) < 18) {
        total += menorCon33;
        soloSeguro = false;
        motivos.push(`Hijo o hija menor de 18 con discapacidad del ${h.discapacidad} % o más: ${año(menorCon33)}.`);
      } else if (h.discapacidad === '75') {
        total += mayorCon75;
        motivos.push(`Hijo o hija mayor de edad con discapacidad del 75 % o más: ${año(mayorCon75)}.`);
      } else if (h.discapacidad === '65') {
        total += mayorCon65;
        motivos.push(`Hijo o hija mayor de edad con discapacidad del 65 % o más: ${año(mayorCon65)}.`);
      }
    }
    if (!total) return null;
    const comprobar = soloSeguro ? [] : ['Para hijos menores hay un límite de ingresos del hogar.'];
    if (hijos.some((h) => h.discapacidad === '75')) comprobar.push('La cuantía más alta (75 %) pide también necesitar ayuda de otra persona.');
    return { estado: soloSeguro ? 'si' : 'quizas', motivos, comprobar, importe: { año: total, texto: año(total) } };
  },

  'ventajas-discapacidad'(p) {
    const quien = personas(p).filter((x) => CON_33.includes(x.discapacidad));
    if (!quien.length) return null;
    return { estado: 'quizas', motivos: [`${capital(lista(quien.map((x) => x.quien)))}: discapacidad del 33 % o más.`], comprobar: ['Para la tarjeta de aparcamiento hace falta movilidad reducida.', 'El impuesto de circulación lo quita tu ayuntamiento.'] };
  },

  'bono-social'(p) {
    const motivos = [];
    let estado = null;
    let severo = false;
    const comprobar = ['Tener la tarifa regulada (PVPC) con una comercializadora de referencia. Si tienes una tarifa de mercado libre, hay que cambiarse.'];
    if (p.familiaNumerosa !== 'no') {
      motivos.push('Sois familia numerosa: tenéis derecho directo.');
      estado = 'si';
    }
    if (REGLAS.imv(p)?.estado === 'si') {
      motivos.push('Cobrar el IMV da derecho directo (te puede corresponder).');
      estado ??= 'quizas';
    }
    if (REGLAS['complemento-minimos'](p)?.estado === 'si' || p.pension === 'pnc') {
      motivos.push('Los pensionistas con la mínima o con pensión no contributiva tienen derecho si no hay otros ingresos en casa.');
      estado ??= 'quizas';
    }
    const lim = limiteBonoSocial(p);
    if (p.ingresosHogar != null && p.ingresosHogar <= lim.euros) {
      motivos.push(`Vuestros ingresos (${año(p.ingresosHogar)}) están por debajo del límite: ${año(lim.euros)} (${String(lim.veces).replace('.', ',')} veces el IPREM).`);
      estado = 'si';
      severo = p.ingresosHogar <= lim.euros / 2;
    } else if (p.ingresosHogar == null && !estado) {
      return { estado: 'quizas', motivos: [`Si vuestros ingresos no pasan de ${año(lim.euros)}, tenéis derecho.`], comprobar, importe: { texto: `${porcentaje(CIFRAS.bonoSocial.vulnerable)} de descuento` } };
    }
    if (!estado) return null;
    if (lim.veces > 1.5 + 0.5 * Math.min(totalHijos(p), 2)) comprobar.push('El límite es más alto porque en casa hay discapacidad, dependencia o es monoparental: hay que acreditarlo.');
    const d = severo ? CIFRAS.bonoSocial.severo : CIFRAS.bonoSocial.vulnerable;
    return { estado, motivos, comprobar, importe: { texto: `${porcentaje(d)} de descuento en la luz` }, severo };
  },

  'bono-termico'(p) {
    const bono = REGLAS['bono-social'](p);
    if (!bono) return null;
    return { estado: bono.estado, motivos: ['Va unido al bono social de la luz.'], comprobar: ['Tener el bono social de la luz a 31 de diciembre.'], importe: { año: CIFRAS.bonoSocial.termicoMinimo, texto: `Desde ${año(CIFRAS.bonoSocial.termicoMinimo)}` } };
  },

  'alquiler-joven'(p) {
    if (p.vivienda !== 'alquiler' || p.edad == null || p.edad < 18 || p.edad > CIFRAS.alquiler.edadJoven) return null;
    const limite = CIFRAS.alquiler.limiteIpremJoven * CIFRAS.iprem.anual14;
    if (p.ingresosHogar != null && p.ingresosHogar > limite) return null;
    return {
      estado: 'quizas',
      motivos: [`Tienes ${p.edad} años y vives de alquiler.`, ...(p.ingresosHogar != null ? [`Vuestros ingresos no pasan de ${año(limite)}.`] : [])],
      comprobar: ['Que tu comunidad tenga la convocatoria abierta (suele ser una vez al año).', 'Que el alquiler no pase del tope de tu comunidad.', ...(p.ingresosHogar == null ? [`Ingresos de hasta ${año(limite)}.`] : [])],
      importe: { mes: CIFRAS.alquiler.joven, texto: `Hasta ${mes(CIFRAS.alquiler.joven)}` },
    };
  },

  'alquiler-general'(p) {
    if (p.vivienda !== 'alquiler' || REGLAS['alquiler-joven'](p)) return null;
    const limite = CIFRAS.alquiler.limiteIpremGeneral * CIFRAS.iprem.anual14;
    if (p.ingresosHogar != null && p.ingresosHogar > limite * 1.5) return null;
    return {
      estado: 'quizas',
      motivos: ['Vives de alquiler.', ...(p.ingresosHogar != null && p.ingresosHogar <= limite ? [`Vuestros ingresos no pasan de ${año(limite)}.`] : [])],
      comprobar: ['Que tu comunidad tenga la convocatoria abierta.', `El límite de ingresos de la convocatoria (en general, ${año(limite)}; más en familias numerosas o con discapacidad).`],
    };
  },

  'deduccion-maternidad'(p) {
    const n = p.hijos.menor3 + (p.bebe && p.hijos.menor3 === 0 ? 1 : 0);
    if (!n) return null;
    const total = n * CIFRAS.irpf.maternidad;
    return {
      estado: tieneRentasQueCuentan(p) ? 'si' : 'quizas',
      motivos: [p.hijos.menor3 ? `Tenéis ${p.hijos.menor3} ${p.hijos.menor3 === 1 ? 'hijo menor' : 'hijos menores'} de 3 años.` : 'Esperáis un bebé.'],
      comprobar: ['La pide la madre (o el padre con custodia exclusiva o si la madre ha fallecido).', 'Que trabaje, cobre el paro o haya trabajado 30 días al tener al hijo.', `Si pagáis guardería, hasta ${año(CIFRAS.irpf.guarderia)} más.`],
      importe: { año: total, texto: año(total) },
    };
  },

  'deduccion-familia-numerosa'(p) {
    if (p.familiaNumerosa === 'no') return null;
    const especial = p.familiaNumerosa === 'especial';
    const minimo = especial ? 5 : 3;
    const extra = Math.max(0, totalHijos(p) - minimo) * CIFRAS.irpf.familiaNumerosaHijoExtra;
    const total = (especial ? CIFRAS.irpf.familiaNumerosaEspecial : CIFRAS.irpf.familiaNumerosaGeneral) + extra;
    return { estado: tieneRentasQueCuentan(p) ? 'si' : 'quizas', motivos: [`Sois familia numerosa de categoría ${especial ? 'especial' : 'general'}.`], comprobar: ['Se puede cobrar por adelantado, cada mes, con el modelo 143.'], importe: { año: total, texto: año(total) } };
  },

  'deduccion-monoparental'(p) {
    if (!p.monoparental || totalHijos(p) < 2 || p.familiaNumerosa !== 'no') return null;
    return { estado: 'quizas', motivos: ['Eres una familia monoparental con dos hijos.'], comprobar: ['No cobrar pensión de alimentos por ellos.'], importe: { año: CIFRAS.irpf.monoparentalDosHijos, texto: año(CIFRAS.irpf.monoparentalDosHijos) } };
  },

  'deduccion-discapacidad-cargo'(p) {
    const quien = p.cuidados.filter((c) => ['hijo', 'padre', 'pareja'].includes(c.relacion) && CON_33.includes(c.discapacidad));
    if (!quien.length) return null;
    const total = quien.length * CIFRAS.irpf.discapacidadACargo;
    const comprobar = ['Que viva contigo o dependa de ti económicamente.'];
    if (quien.some((c) => c.relacion === 'pareja')) comprobar.push('Por la pareja, solo si sus ingresos no pasan de 8.000 € al año.');
    return { estado: tieneRentasQueCuentan(p) ? 'si' : 'quizas', motivos: quien.map((c, i) => `${capital(nombrePersona(c, i))} tiene una discapacidad del ${c.discapacidad} % o más.`), comprobar, importe: { año: total, texto: año(total) } };
  },

  'minimo-discapacidad'(p) {
    if (!CON_33.includes(p.discapacidad)) return null;
    const cifra = CON_65.includes(p.discapacidad) ? CIFRAS.irpf.minimoDiscapacidad65 : CIFRAS.irpf.minimoDiscapacidad33;
    return { estado: 'si', motivos: [`Tienes una discapacidad del ${p.discapacidad} % o más.`], comprobar: ['Díselo a tu empresa o pagador para que te retenga menos cada mes.'], importe: { texto: `${año(cifra)} sin IRPF` } };
  },

  'deducciones-ccaa'(p) {
    if (!(totalHijos(p) || p.bebe || p.vivienda === 'alquiler' || p.cuidados.length || p.discapacidad !== 'no')) return null;
    return { estado: 'quizas', motivos: ['Tienes circunstancias (hijos, alquiler, cuidados o discapacidad) que suelen tener deducción en las comunidades.'], comprobar: ['Revísalas en Renta Web al hacer la declaración.'] };
  },

  becas(p) {
    const yo = p.situacion === 'estudiante' && (p.edad ?? 0) >= 16;
    if (!yo && !p.hijos.de6a17) return null;
    return { estado: 'quizas', motivos: [yo ? 'Estudias.' : 'Tenéis hijos en edad escolar: al llegar a bachillerato, FP o universidad.'], comprobar: ['Los umbrales de renta de la convocatoria de cada curso.'] };
  },

  'justicia-gratuita'(p) {
    if (p.ingresosHogar == null) return null;
    const m = miembros(p);
    const veces = m === 1 ? 2 : m < 4 ? 2.5 : 3;
    const limite = veces * CIFRAS.iprem.anual12;
    if (p.ingresosHogar > limite) return null;
    return { estado: 'si', motivos: [`Vuestros ingresos no pasan de ${año(limite)}.`], comprobar: ['Solo si necesitas un abogado o ir a juicio.'] };
  },

  // ── Si lo necesitas ya ─────────────────────────────────────────────────
  'violencia-genero'(p) {
    if (!p.urgencias.violencia) return null;
    return { estado: 'si', motivos: ['Has marcado que sufres violencia de género.'], comprobar: ['Llama al 016 aunque no hayas denunciado: te orientan y no sale en la factura.'], importe: { texto: '016 · 24 horas' }, urgente: true };
  },

  'sin-hogar'(p) {
    if (!p.urgencias.sinCasa) return null;
    return { estado: 'si', motivos: ['Has marcado que no tienes casa.'], comprobar: [], urgente: true };
  },

  desahucio(p) {
    if (!p.urgencias.casaRiesgo) return null;
    return { estado: 'si', motivos: ['Has marcado que puedes perder tu casa.'], comprobar: ['Si ya te ha llegado una carta del juzgado, pide abogado de oficio hoy mismo.'], urgente: true };
  },

  alimentos(p) {
    if (!p.urgencias.comida && !p.urgencias.sinCasa) return null;
    return { estado: 'si', motivos: ['Has marcado que no llegas para comer o para pagar lo básico.'], comprobar: [], urgente: true };
  },

  'emergencia-social'(p) {
    const muyBajos = p.ingresosHogar != null && p.ingresosHogar < rentaGarantizada(p) * 12 * 0.5;
    if (!p.urgencias.comida && !p.urgencias.casaRiesgo && !p.urgencias.sinCasa && !muyBajos) return null;
    return { estado: p.urgencias.comida || p.urgencias.casaRiesgo || p.urgencias.sinCasa ? 'si' : 'quizas', motivos: [muyBajos && !p.urgencias.comida ? 'Vuestros ingresos son muy bajos.' : 'No llegas a cubrir lo básico este mes.'], comprobar: ['Pide cita urgente: no esperes a que llegue el IMV.'], urgente: true };
  },

  soledad(p) {
    const vivoSolo = (p.edad ?? 0) >= 65 && p.adultos === 1;
    if (!p.urgencias.soledad && !vivoSolo) return null;
    return { estado: p.urgencias.soledad ? 'si' : 'quizas', motivos: [p.urgencias.soledad ? 'Has marcado que te sientes solo o sola.' : 'Tienes 65 años o más y vives solo o sola.'], comprobar: [] };
  },

  'sanidad-sin-papeles'(p) {
    if (p.residencia !== 'no' && p.residencia !== 'tramite') return null;
    return { estado: 'si', motivos: ['No tienes permiso de residencia (o está en trámite).'], comprobar: ['Pide orientación a una ONG para regularizar tu situación.'] };
  },

  // ── Comunidad y Ayuntamiento de Madrid ─────────────────────────────────
  'rmi-madrid'(p) {
    if (p.ccaa !== 'madrid') return null;
    if (p.pension === 'jubilacion' || p.pension === 'pnc') return null;
    const anual = rentaGarantizada(p) * 12;
    if (p.ingresosHogar != null && p.ingresosHogar >= anual) return null;
    if (p.ingresosHogar == null && !enParo(p) && !p.urgencias.comida) return null;
    return {
      estado: 'quizas',
      motivos: ['Vives en la Comunidad de Madrid.', p.ingresosHogar != null ? 'Vuestros ingresos son bajos.' : 'Estás en una situación de ingresos bajos.'],
      comprobar: ['Pide antes el Ingreso Mínimo Vital: la RMI lo complementa.', 'La cuantía exacta te la dicen en servicios sociales.'],
      importe: { texto: `Hasta ${mes(RENTA_CCAA.madrid.importe)} (una persona)` },
    };
  },

  'aes-euskadi'(p) {
    if (p.ccaa !== 'pais-vasco') return null;
    const apurado = p.urgencias.comida || p.urgencias.casaRiesgo || (p.ingresosHogar != null && p.ingresosHogar < rentaGarantizada(p) * 12) || p.situacion === 'paro-sin';
    if (!apurado) return null;
    return {
      estado: 'quizas',
      motivos: ['Vives en Euskadi y tenéis pocos ingresos o un gasto que no podéis pagar.'],
      comprobar: ['Llevar al menos 6 meses empadronado en tu municipio.', 'Que sea un gasto concreto: alquiler, luz, comida, deudas, muebles o arreglos.'],
    };
  },

  'fons-infancia-barcelona'(p) {
    if (p.ciudad !== 'barcelona' || totalHijos(p) === 0) return null;
    return {
      estado: 'quizas',
      motivos: ['Vives en Barcelona y tienes hijos menores.'],
      comprobar: ['Ser usuario de los servicios sociales del Ayuntamiento.', 'Los ingresos del hogar: hay un límite según cuántos sois.', 'Que esté abierta la convocatoria (en 2026, del 13 de mayo al 22 de junio).'],
      importe: { texto: 'Desde 600 € al año' },
    };
  },

  'natalidad-valencia'(p) {
    if (p.ciudad !== 'valencia' || !p.bebe) return null;
    return {
      estado: 'si',
      motivos: ['Vives en València y esperáis un bebé o ha llegado hace poco.'],
      comprobar: ['Pedirla en los 2 meses siguientes al nacimiento o la adopción.'],
      importe: { texto: '400 € por hijo' },
    };
  },

  'urgencia-zaragoza'(p) {
    if (p.ciudad !== 'zaragoza') return null;
    const apurado = p.urgencias.comida || p.urgencias.casaRiesgo || (p.ingresosHogar != null && p.ingresosHogar < rentaGarantizada(p) * 12) || p.situacion === 'paro-sin';
    if (!apurado) return null;
    return { estado: 'quizas', motivos: ['Vives en Zaragoza y tenéis pocos ingresos o una urgencia.'], comprobar: ['Pedir cita en tu centro municipal de servicios sociales.'] };
  },

  'nos-cuidamos-malaga'(p) {
    if (p.ciudad !== 'malaga') return null;
    const pequenos = p.hijos.menor3 + p.hijos.de3a5 > 0 || p.bebe;
    if (!pequenos && p.hijos.de6a17 === 0) return null;
    return { estado: 'quizas', motivos: ['Vives en Málaga y tienes hijos pequeños.'], comprobar: ['Que los niños tengan de 4 meses a 10 años.', 'Que esté abierta la edición del año (en 2026, de julio a septiembre).'] };
  },

  'tarjeta-familias'(p) {
    if (p.ccaa !== 'madrid' || p.madridCapital === false) return null;
    const limite = 752 * 12;
    const bajos = p.ingresosHogar != null && p.ingresosHogar <= limite;
    if (!bajos && !p.urgencias.comida) return null;
    const comprobar = ['La concede servicios sociales tras una entrevista.'];
    if (p.madridCapital == null) comprobar.unshift('Solo para quien vive en la ciudad de Madrid (la capital).');
    return { estado: p.madridCapital && bajos ? 'si' : 'quizas', motivos: [bajos ? `Vuestros ingresos (${año(p.ingresosHogar)}) no pasan de 752 € al mes.` : 'Has marcado que no llegas para comer.'], comprobar, importe: { texto: 'De 146 € a 735 € al mes' } };
  },

  'agua-canal'(p) {
    if (p.ccaa !== 'madrid') return null;
    const motivos = [];
    if (REGLAS.imv(p)?.estado === 'si') motivos.push('Te puede corresponder el IMV, que acredita la vulnerabilidad.');
    if (p.familiaNumerosa !== 'no') motivos.push('Sois familia numerosa.');
    if (miembros(p) > 4) motivos.push(`Vivís ${miembros(p)} personas en casa.`);
    if (p.ingresosHogar != null && p.ingresosHogar <= limiteBonoSocial(p).euros && !motivos.length) motivos.push('Vuestros ingresos son bajos.');
    if (!motivos.length) return null;
    return { estado: 'quizas', motivos, comprobar: ['Para la exención social, cobrar el IMV o un informe de servicios sociales.'] };
  },

  'vivienda-social-madrid'(p) {
    if (p.ccaa !== 'madrid') return null;
    const sinVivienda = p.vivienda === 'alquiler' || p.vivienda === 'otra' || p.urgencias.sinCasa || p.urgencias.casaRiesgo;
    if (!sinVivienda) return null;
    if (p.ingresosHogar != null && p.ingresosHogar > 3.5 * CIFRAS.iprem.anual14) return null;
    if (p.ingresosHogar == null && !p.urgencias.casaRiesgo && !p.urgencias.sinCasa) return null;
    return { estado: 'quizas', motivos: ['Vives en la Comunidad de Madrid, sin vivienda propia y con ingresos bajos.'], comprobar: ['Hay lista de espera: apúntate cuanto antes.'] };
  },

  'escuela-infantil-madrid'(p) {
    if (p.ccaa !== 'madrid' || p.madridCapital === false || !(p.hijos.menor3 > 0 || p.bebe)) return null;
    return { estado: p.madridCapital ? 'si' : 'quizas', motivos: [p.bebe ? 'Esperáis un bebé o tenéis uno pequeño.' : 'Tenéis hijos menores de 3 años.'], comprobar: ['El plazo es en abril para el curso siguiente.', ...(p.madridCapital ? [] : ['Solo para quien vive en la ciudad de Madrid.'])], importe: { texto: 'Gratis (salvo comedor)' } };
  },

  'teleasistencia-madrid'(p) {
    const cuidoMayor = p.cuidados.some((c) => (c.edad ?? 0) >= 65);
    if (p.ccaa !== 'madrid' || p.madridCapital === false || ((p.edad ?? 0) < 65 && !cuidoMayor)) return null;
    return { estado: p.madridCapital ? 'si' : 'quizas', motivos: [(p.edad ?? 0) >= 65 ? 'Tienes 65 años o más.' : 'Cuidas de una persona mayor.'], comprobar: ['Llama al 900 111 065 (gratis).'] };
  },

  'transporte-madrid'(p) {
    if (p.ccaa !== 'madrid') return null;
    const e = p.edad;
    const motivos = [];
    let texto = '';
    if (e != null && e >= 65) { motivos.push('Tienes 65 años o más: viajas gratis.'); texto = 'Gratis'; }
    else if (e != null && e >= 15 && e <= 25) { motivos.push(`Tienes ${e} años: abono joven.`); texto = '10 € al mes'; }
    if (totalHijos(p) > 0) motivos.push('Los menores de 14 viajan gratis.');
    if (!motivos.length) return null;
    return { estado: 'si', motivos, comprobar: ['Necesitas la Tarjeta Transporte Público personal.'], importe: texto ? { texto } : undefined };
  },

  'copago-farmaceutico'(p) {
    const motivos = [];
    if (p.pension === 'pnc') motivos.push('Cobras una pensión no contributiva: las medicinas son gratis.');
    if (REGLAS.imv(p)?.estado === 'si') motivos.push('Si te conceden el IMV, las medicinas son gratis.');
    if (p.situacion === 'paro-sin') motivos.push('En paro sin cobrar prestación, las medicinas son gratis.');
    if (REGLAS['complemento-minimos'](p)?.estado === 'si') motivos.push('Con complemento a mínimos en la pensión, las medicinas son gratis.');
    if (!motivos.length && PENSIONES_CONTRIBUTIVAS.includes(p.pension)) motivos.push('Como pensionista pagas el 10 %, con un tope al mes según tus ingresos.');
    if (!motivos.length) return null;
    return { estado: 'si', motivos, comprobar: ['Se aplica solo. Pregunta en la farmacia si pagas de más.'] };
  },

  'tarifa-plana-autonomos'(p) {
    if (!p.emprender) return null;
    const C = CIFRAS.autonomos;
    return {
      estado: 'quizas',
      motivos: ['Quieres hacerte autónomo o montar un negocio.'],
      comprobar: ['Que no hayas sido autónomo en los últimos 2 años (3 si ya tuviste la tarifa plana).', 'Pedirla en el mismo momento del alta: después no se puede.'],
      importe: { texto: `Pagas ${mes(C.tarifaPlana)} de cuota el primer año` },
    };
  },

  'cese-actividad'(p) {
    if (p.situacion !== 'autonomo') return null;
    return {
      estado: 'quizas',
      motivos: ['Eres autónomo: si tienes que cerrar sin quererlo, tienes un paro propio.'],
      comprobar: ['Haber cotizado por cese de actividad los últimos 12 meses seguidos.', 'Pedirlo a tu mutua antes de que acabe el mes siguiente al cierre.'],
    };
  },

  'subsidio-retornados'(p) {
    if (!p.retornado) return null;
    const S = CIFRAS.subsidio;
    if (p.ingresosPropios != null && p.ingresosPropios / 12 > S.limiteRentasMes) return null;
    return {
      estado: 'quizas',
      motivos: ['Has vuelto a España en el último año después de trabajar fuera.', ...(p.ingresosPropios != null ? [`Tus ingresos no pasan de ${mes(S.limiteRentasMes)}.`] : [])],
      comprobar: ['Tener la nacionalidad española.', 'Haber trabajado fuera al menos 12 meses en los últimos 6 años, fuera del Espacio Económico Europeo o en un país sin convenio de paro con España.', ...(p.ingresosPropios == null ? [`No tener ingresos de más de ${mes(S.limiteRentasMes)}.`] : [])],
      importe: { mes: S.primeros6Meses, texto: `${mes(S.primeros6Meses)} al principio` },
    };
  },

  'aval-ico-vivienda'(p) {
    if (p.vivienda !== 'alquiler' && p.vivienda !== 'familia' && p.vivienda !== 'otra') return null;
    const joven = p.edad != null && p.edad >= 18 && p.edad <= CIFRAS.avalIco.edad;
    if (!joven && totalHijos(p) === 0) return null;
    if (p.patrimonioAlto === true) return null;
    return {
      estado: 'quizas',
      motivos: [joven ? `Tienes ${p.edad} años y no tienes casa propia.` : 'Tienes hijos menores y no tienes casa propia.'],
      comprobar: ['Si piensas comprar tu primera casa.', `Ingresos de hasta ${año(CIFRAS.avalIco.ingresosPersona)} por persona.`, 'Que tu banco dé estos avales: no todos lo hacen.'],
    };
  },

  ortoprotesica(p) {
    const alguien = personas(p).some((x) => (x.discapacidad && x.discapacidad !== 'no') || (x.dependencia && x.dependencia !== 'no'));
    if (!alguien) return null;
    return {
      estado: 'quizas',
      motivos: ['En casa hay una persona con discapacidad o dependencia.'],
      comprobar: ['Que el médico especialista de la sanidad pública lo recete.'],
    };
  },

  'bono-cultural-joven'(p) {
    if (p.edad !== 18) return null;
    return { estado: 'quizas', motivos: ['Tienes 18 años.'], comprobar: ['Es para quien cumple 18 este año (en 2026, los nacidos en 2008).'], importe: { texto: '400 €' } };
  },
};

function lista(xs) {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`;
}
function capital(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Ayudas que piden nacionalidad, residencia legal o estar dado de alta en Hacienda o la Seguridad Social
const PIDEN_RESIDENCIA = new Set([
  'imv', 'capi', 'renta-minima', 'rmi-madrid', 'subsidio-desempleo', 'subsidio-52', 'paro', 'nacimiento', 'pago-unico-nacimiento',
  'madrid-natalidad', 'titulo-familia-numerosa', 'pnc-jubilacion', 'pnc-invalidez', 'pnc-alquiler', 'alquiler-joven', 'alquiler-general',
  'vivienda-social-madrid', 'bono-cultural-joven', 'dependencia-valoracion', 'dependencia-prestacion', 'hijo-cargo-discapacidad',
]);

// Reglas de las ayudas propias de cada comunidad
for (const a of AYUDAS_CCAA) REGLAS[a.id] = a.regla;

/** Evalúa todas las reglas. Devuelve los resultados en el orden del catálogo. */
export function evaluar(perfil) {
  const base = perfilVacio();
  const p = { ...base, ...perfil, hijos: { ...base.hijos, ...(perfil?.hijos ?? {}) }, urgencias: { ...base.urgencias, ...(perfil?.urgencias ?? {}) } };
  const resultados = [];
  for (const [id, regla] of Object.entries(REGLAS)) {
    let r = regla(p);
    if (!r) continue;
    if (PIDEN_RESIDENCIA.has(id)) {
      if (p.residencia === 'no') continue;
      if (p.residencia === 'tramite') r = { ...r, estado: 'quizas', comprobar: ['Necesitas tener ya el permiso de residencia.', ...r.comprobar] };
    }
    resultados.push({ id, ...r });
  }
  return resultados;
}

// Orden en que conviene pedir las cosas: primero lo urgente, luego lo que abre la puerta a lo demás
const PRIORIDAD = [
  'violencia-genero', 'sin-hogar', 'desahucio', 'alimentos', 'emergencia-social', 'sanidad-sin-papeles',
  'imv', 'dependencia-valoracion', 'certificado-discapacidad', 'paro', 'subsidio-desempleo', 'subsidio-52', 'pnc-jubilacion', 'pnc-invalidez',
  'complemento-minimos', 'rmi-madrid', 'renta-minima', 'tarjeta-familias', 'capi', 'nacimiento', 'madrid-natalidad', 'viudedad', 'orfandad',
  'titulo-familia-numerosa', 'bono-social', 'brecha-genero', 'hijo-cargo-discapacidad', 'dependencia-prestacion', 'convenio-cuidadores',
];

/** Las primeras cosas que hacer, en orden (como mucho `n`) */
export function porDondeEmpezar(resultados, n = 4) {
  const rango = (id) => {
    const i = PRIORIDAD.indexOf(id);
    return i === -1 ? PRIORIDAD.length : i;
  };
  return [...resultados].sort((a, b) => rango(a.id) - rango(b.id) || (a.estado === b.estado ? 0 : a.estado === 'si' ? -1 : 1)).filter((r) => rango(r.id) < PRIORIDAD.length).slice(0, n);
}

export const IDS_CON_REGLA = Object.keys(REGLAS);

// ── Gráficos: tu cifra frente al límite, y el dinero que podría entrar ──

/** Para las ayudas con límite de ingresos: tu cifra y el límite, para dibujar la barra. null si no se sabe. */
export function umbralDe(id, perfil) {
  const base = perfilVacio();
  const p = { ...base, ...perfil, hijos: { ...base.hijos, ...(perfil?.hijos ?? {}) }, urgencias: { ...base.urgencias, ...(perfil?.urgencias ?? {}) } };
  const rgAnual = rentaGarantizada(p) * 12;
  const hogar = (limite, extra = {}) => (p.ingresosHogar == null ? null : { tuyo: p.ingresosHogar, limite, que: 'Ingresos de tu hogar al año', ...extra });
  const propios = (limite) => (p.ingresosPropios == null ? null : { tuyo: p.ingresosPropios, limite, que: 'Tus ingresos al año' });
  const m = miembros(p);
  switch (id) {
    case 'imv':
    case 'renta-minima':
    case 'rmi-madrid':
      return hogar(rgAnual);
    case 'capi':
      return hogar(rgAnual * CIFRAS.capi.limiteVecesRenta);
    case 'pnc-jubilacion':
    case 'pnc-invalidez':
      return propios(CIFRAS.pnc.anual);
    case 'subsidio-desempleo':
    case 'subsidio-52':
      return propios(CIFRAS.subsidio.limiteRentasMes * 12);
    case 'bono-social':
      return hogar(limiteBonoSocial(p).euros);
    case 'alquiler-joven':
      return hogar(CIFRAS.alquiler.limiteIpremJoven * CIFRAS.iprem.anual14);
    case 'alquiler-general':
      return hogar(CIFRAS.alquiler.limiteIpremGeneral * CIFRAS.iprem.anual14);
    case 'tarjeta-familias':
      return hogar(752 * 12);
    case 'justicia-gratuita':
      return hogar((m === 1 ? 2 : m < 4 ? 2.5 : 3) * CIFRAS.iprem.anual12);
    case 'complemento-minimos':
      return p.pensionMes == null || !PENSIONES_CONTRIBUTIVAS.includes(p.pension) ? null : { tuyo: p.pensionMes, limite: pensionMinima(p).cifra, que: 'Tu pensión al mes', debajoEsBueno: true, texto: 'pensión mínima' };
    default:
      return null;
  }
}

// Ayudas que son dinero cada mes y que se pueden sumar (con el ajuste del IMV, que descuenta lo demás que cobras)
const SUMAN_MES = ['imv', 'capi', 'pnc-jubilacion', 'pnc-invalidez', 'complemento-minimos', 'brecha-genero', 'subsidio-desempleo', 'subsidio-52'];

/** Cuánto dinero podría entrar: al mes (14 pagas para pensiones, 12 el resto) y al año en pagos o deducciones. Solo «Cumples lo principal». */
export function dineroEstimado(resultados) {
  const si = new Map(resultados.filter((r) => r.estado === 'si').map((r) => [r.id, r]));
  const partes = [];
  for (const id of SUMAN_MES) {
    const r = si.get(id);
    if (!r?.importe?.mes) continue;
    let cifra = r.importe.mes;
    // El IMV completa hasta un mínimo: el subsidio o la pensión cuentan como ingreso y lo reducen
    if (id === 'imv') {
      const otros = ['subsidio-desempleo', 'subsidio-52', 'pnc-invalidez'].map((k) => si.get(k)?.importe?.mes ?? 0).reduce((a, b) => a + b, 0);
      cifra = Math.max(0, cifra - otros);
    }
    if (cifra > 0) partes.push({ id, mes: Math.round(cifra * 100) / 100 });
  }
  const alAño = [];
  for (const r of si.values()) if (r.importe?.año) alAño.push({ id: r.id, año: r.importe.año });
  return {
    mes: Math.round(partes.reduce((a, x) => a + x.mes, 0) * 100) / 100,
    año: alAño.reduce((a, x) => a + x.año, 0),
    partes,
    alAño,
  };
}
