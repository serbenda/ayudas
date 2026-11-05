// Reglas: a partir de tus respuestas, qué ayudas te pueden corresponder.
// Funciones puras (sin DOM) para poder probarlas con node --test.
//
// Cada regla devuelve null (no te corresponde o no sabemos nada que lo apunte) o un resultado:
//   { id, estado: 'si' | 'quizas', motivos: [...], comprobar: [...], importe?: { mes?, año?, unico?, texto } }
// · 'si': por lo que has contestado, cumples lo principal. Aun así, lo decide el organismo al pedirla.
// · 'quizas': puede corresponderte, pero depende de algo que no hemos preguntado o no has contestado.

import { FIGURES } from '../data/figures.js';
import { MINIMUM_INCOME } from '../data/regions.js';
import { REGIONAL_BENEFITS } from '../data/regional-benefits.js';
import { euros, percent } from './format.js';

const CONTRIBUTORY_PENSIONS = ['jubilacion', 'viudedad', 'incapacidad'];
const GRADES = ['1', '2', '3'];
const WITH_33 = ['33', '65', '75'];
const WITH_65 = ['65', '75'];

/** Perfil vacío: lo que se supone si no se contesta nada */
export function emptyProfile() {
  return {
    age: null,
    region: null,
    situation: null,
    startingBusiness: false,
    returnee: false,
    partner: false,
    adults: 1,
    children: { under3: 0, age3to5: 0, age6to17: 0 },
    baby: false,
    largeFamily: 'no',
    singleParent: false,
    widowed: false,
    householdIncome: null,
    ownIncome: null,
    highWealth: null,
    housing: null,
    disability: 'no',
    dependency: 'no',
    caredFor: [],
    childSeriousIllness: false,
    pension: 'no',
    pensionMonthly: null,
    pensionSince2021: null,
    childrenBorn: 0,
    contributed15: null,
    contributedOneYear: null,
    madridCity: null,
    city: null, // 'barcelona' | 'valencia' | 'zaragoza' | 'malaga' si vive en esa ciudad
    residence: null, // 'si' (española, UE o permiso) | 'tramite' | 'no'
    urgent: { food: false, housingAtRisk: false, homeless: false, violence: false, soledad: false },
  };
}

// ── Cálculos que usan varias reglas ──────────────────────────────────────

export function totalChildren(p) {
  return p.children.under3 + p.children.age3to5 + p.children.age6to17;
}

export function members(p) {
  return Math.max(1, p.adults) + totalChildren(p);
}

const works = (p) => p.situation === 'cuenta-ajena' || p.situation === 'autonomo';
const unemployed = (p) => p.situation === 'paro-cobrando' || p.situation === 'paro-sin';
// Para las deducciones «reembolsables» hay que trabajar, cobrar paro o pensión
const hasCountableIncome = (p) => works(p) || p.situation === 'paro-cobrando' || p.pension !== 'no' || p.situation === 'pensionista';

/** Todas las personas del hogar con sus circunstancias: tú y las que cuidas */
function people(p) {
  return [{ who: 'tú', relationship: 'yo', age: p.age, disability: p.disability, dependency: p.dependency, livesWith: true, iCare: false }, ...p.caredFor.map((c, i) => ({ who: personName(c, i), ...c }))];
}

function personName(c, i) {
  const names = { hijo: 'tu hijo o hija', padre: 'tu padre o tu madre', pareja: 'tu pareja', otro: 'tu familiar' };
  return `${names[c.relationship] ?? 'la persona'}${i > 0 ? ` (${i + 1}.ª persona)` : ''}`;
}

/** ¿Hay en el hogar alguien con discapacidad ≥ 65 % o dependencia de grado III? (complemento del IMV) */
function hasSevereDisability(p) {
  return people(p).some((x) => WITH_65.includes(x.disability) || x.dependency === '3');
}

/** Renta garantizada del IMV al mes para este hogar */
export function guaranteedIncome(p) {
  const { base, perPerson, maximum, supplement } = FIGURES.imv;
  const scale = Math.min(1 + perPerson * (members(p) - 1), maximum);
  const extra = p.singleParent || hasSevereDisability(p) ? supplement : 0;
  return round2(base * (scale + extra));
}

/** Límite de ingresos del bono social de la luz (euros al año) y el multiplicador del IPREM que se ha usado */
export function socialDiscountLimit(p) {
  const minors = totalChildren(p);
  let times = 1.5 + 0.5 * Math.min(minors, 2);
  const special = p.singleParent || people(p).some((x) => WITH_33.includes(x.disability) || x.dependency === '2' || x.dependency === '3');
  if (special) times += 0.5;
  return { times, euros: times * FIGURES.iprem.annual14 };
}

/** Pensión mínima que te tocaría según tu pensión, edad y familia (euros al mes) */
export function minimumPension(p) {
  const m = FIGURES.minimums;
  if (p.pension === 'viudedad') {
    if (totalChildren(p) > 0) return { figure: m.viudedad.withDependants, caseLabel: 'viudedad con cargas familiares' };
    if ((p.age ?? 0) >= 65 || WITH_65.includes(p.disability)) return { figure: m.viudedad.from65, caseLabel: 'viudedad, 65 años o más' };
    if ((p.age ?? 0) >= 60) return { figure: m.viudedad.age60to64, caseLabel: 'viudedad, de 60 a 64 años' };
    return { figure: m.viudedad.under60, caseLabel: 'viudedad, menos de 60 años' };
  }
  const table = (p.age ?? 65) >= 65 ? m.retirement65 : m.retirementUnder65;
  const ageText = (p.age ?? 65) >= 65 ? '65 años o más' : 'menos de 65 años';
  if (p.partner) return { figure: table.nonDependentSpouse, caseLabel: `${ageText}, con cónyuge que no está a tu cargo`, withSpouse: table.withSpouse };
  return { figure: table.withoutSpouse, caseLabel: `${ageText}, sin cónyuge` };
}

const round2 = (n) => Math.round(n * 100) / 100;
const yearly = (n) => `${euros(n)} al año`;
const monthly = (n) => `${euros(n)} al mes`;

// ── Reglas ───────────────────────────────────────────────────────────────

const RULES = {
  imv(p) {
    if (p.age != null && p.age < 18) return null;
    if (p.age != null && p.age < 23 && totalChildren(p) === 0) return null;
    if (p.pension === 'jubilacion' || p.pension === 'pnc') return null;
    const rg = guaranteedIncome(p);
    const annual = rg * 12;
    const check = ['Lo que cuenta son los ingresos del año pasado de todo el hogar.'];
    if (p.highWealth === true) {
      if (members(p) === 1) return null;
      check.push('Tenéis ahorros o bienes: el límite de patrimonio sube con cada persona del hogar, compruébalo en el simulador.');
    }
    if (p.highWealth == null) check.push('Que vuestro patrimonio (sin contar la casa) no pase del límite.');
    const reasons = [`Para vuestro hogar (${members(p)} ${members(p) === 1 ? 'persona' : 'personas'}${p.singleParent ? ', monoparental' : ''}) la renta garantizada es de ${monthly(rg)} (${yearly(annual)}).`];
    if (p.householdIncome == null) {
      return { status: 'quizas', reasons, check: ['Depende de los ingresos de tu hogar, que no has puesto.', ...check], payment: { monthly: rg, text: `Hasta ${monthly(rg)}` } };
    }
    if (p.householdIncome >= annual) return null;
    const amount = round2(rg - p.householdIncome / 12);
    reasons.push(`Vuestros ingresos (${yearly(p.householdIncome)}) no llegan a esa cifra.`);
    return { status: 'si', reasons, check, payment: { monthly: amount, text: `≈ ${monthly(amount)}` } };
  },

  capi(p) {
    const n = totalChildren(p);
    if (n === 0) return null;
    const { under3, age3to5, age6to17 } = p.children;
    const total = round2(under3 * FIGURES.capi.under3 + age3to5 * FIGURES.capi.age3to6 + age6to17 * FIGURES.capi.age6to18);
    const payment = { monthly: total, text: monthly(total) };
    const reasons = [`Tenéis ${n} ${n === 1 ? 'hijo menor' : 'hijos menores'} de 18 años.`];
    const annual = guaranteedIncome(p) * 12;
    const check = ['El límite de patrimonio, sin contar la vivienda.'];
    if (p.householdIncome == null) return { status: 'quizas', reasons, check: ['Depende de los ingresos del hogar.', ...check], payment };
    if (p.householdIncome <= annual) return { status: 'si', reasons: [...reasons, `Vuestros ingresos están por debajo de la renta garantizada del IMV (${yearly(annual)}).`], check, payment };
    if (p.householdIncome <= annual * FIGURES.capi.incomeTimesLimit) {
      return { status: 'quizas', reasons: [...reasons, 'Vuestros ingresos están en la franja en la que se puede cobrar (entera o en parte).'], check: ['El límite exacto de ingresos de tu tipo de hogar: el simulador de la Seguridad Social lo calcula.', ...check], payment };
    }
    return null;
  },

  'renta-minima'(p) {
    if (p.region === 'madrid') return null;
    const r = MINIMUM_INCOME[p.region];
    const name = r ? `En tu comunidad se llama ${r.name}.` : null;
    const payment = r?.payment ? { text: `Hasta ${monthly(r.payment)} (una persona)` } : undefined;
    const annual = guaranteedIncome(p) * 12;
    if (p.householdIncome != null && p.householdIncome < annual) {
      return { status: 'quizas', reasons: ['Vuestros ingresos son bajos y tu comunidad puede tener una renta propia que complementa el IMV.', ...(name ? [name] : [])], check: ['Los requisitos de empadronamiento de tu comunidad.', ...(r?.note ? [r.note] : [])], payment };
    }
    if (p.householdIncome == null && p.situation === 'paro-sin') {
      return { status: 'quizas', reasons: ['Estás en paro sin cobrar prestación.', ...(name ? [name] : [])], check: ['Los ingresos del hogar y el empadronamiento.', ...(r?.note ? [r.note] : [])], payment };
    }
    return null;
  },

  paro(p) {
    if (p.situation !== 'paro-sin' || p.contributedOneYear === false) return null;
    return {
      status: p.contributedOneYear ? 'si' : 'quizas',
      reasons: ['Estás en paro y no cobras ninguna prestación.', ...(p.contributedOneYear ? ['Has trabajado al menos un año en los últimos seis.'] : [])],
      check: ['Que perdieras el trabajo sin quererlo y lo pidas en 15 días hábiles.'],
    };
  },

  'subsidio-desempleo'(p) {
    if (!unemployed(p)) return null;
    if ((p.age ?? 0) >= 52 && p.contributed15) return null; // le toca el de mayores de 52
    const limit = FIGURES.allowance.monthlyIncomeLimit * 12;
    if (p.ownIncome != null && p.ownIncome > limit) return null;
    const reasons = [p.situation === 'paro-cobrando' ? 'Cobras el paro: cuando se te acabe, puedes pasar al subsidio.' : 'Estás en paro sin cobrar prestación.'];
    const check = [];
    if (p.ownIncome == null) check.push(`Que tus rentas propias no pasen de ${monthly(FIGURES.allowance.monthlyIncomeLimit)}.`);
    else reasons.push(`Tus rentas propias (${yearly(p.ownIncome)}) están por debajo del límite (${yearly(limit)}).`);
    if (p.partner || totalChildren(p) > 0) check.push('Con responsabilidades familiares dura más, pero también cuentan las rentas del hogar.');
    return {
      status: p.situation === 'paro-sin' && p.ownIncome != null ? 'si' : 'quizas',
      reasons,
      check,
      payment: { monthly: FIGURES.allowance.first6Months, text: `${monthly(FIGURES.allowance.first6Months)} al principio` },
    };
  },

  'subsidio-52'(p) {
    if (!unemployed(p) || (p.age ?? 0) < 52 || p.contributed15 === false) return null;
    const limit = FIGURES.allowance.monthlyIncomeLimit * 12;
    if (p.ownIncome != null && p.ownIncome > limit) return null;
    const check = [];
    if (p.contributed15 == null) check.push('Haber cotizado al menos 15 años.');
    if (p.ownIncome == null) check.push(`Que tus rentas propias no pasen de ${monthly(FIGURES.allowance.monthlyIncomeLimit)}.`);
    if (p.situation === 'paro-cobrando') check.push('Se pide cuando se te acabe el paro.');
    return {
      status: check.length ? 'quizas' : 'si',
      reasons: [`Tienes ${p.age} años y estás en paro.`, ...(p.contributed15 ? ['Has cotizado al menos 15 años.'] : [])],
      check,
      payment: { monthly: FIGURES.allowance.over52, text: monthly(FIGURES.allowance.over52) },
    };
  },

  nacimiento(p) {
    if (!p.baby) return null;
    if (!works(p) && p.situation !== 'paro-cobrando') {
      if (!p.partner) return null;
      return { status: 'quizas', reasons: ['Esperáis un bebé o ha nacido hace poco.'], check: ['La pide cada progenitor que trabaje: si tu pareja trabaja, le corresponde a ella.'] };
    }
    const weeks = p.singleParent ? FIGURES.nacimiento.weeksSingleParent : FIGURES.nacimiento.weeks;
    return {
      status: 'si',
      reasons: ['Esperáis un bebé o ha nacido hace poco.', works(p) ? 'Trabajas.' : 'Cobras el paro.'],
      check: ['Tener cotizado el mínimo según tu edad.'],
      payment: { text: `${weeks} semanas al 100 % de tu sueldo` },
    };
  },

  'pago-unico-nacimiento'(p) {
    if (!p.baby) return null;
    const becomesLarge = totalChildren(p) + 1 >= 3;
    const reasons = [];
    if (p.largeFamily !== 'no') reasons.push('Sois familia numerosa.');
    else if (becomesLarge) reasons.push('Con el bebé pasáis a ser familia numerosa.');
    if (p.singleParent) reasons.push('Sois una familia monoparental.');
    if (WITH_65.includes(p.disability)) reasons.push('Tienes una discapacidad del 65 % o más (cuenta si eres la madre).');
    if (!reasons.length) return null;
    return { status: 'quizas', reasons, check: ['Que los ingresos del hogar no pasen del límite de la Seguridad Social.'], payment: { single: FIGURES.nacimiento.oneOffPayment, text: `${euros(FIGURES.nacimiento.oneOffPayment)} una vez` } };
  },

  'madrid-natalidad'(p) {
    if (p.region !== 'madrid' || !(p.baby || p.children.under3 > 0)) return null;
    const { madrid } = FIGURES;
    if (p.householdIncome != null && p.householdIncome > madrid.jointIncome * 1.5) return null;
    const check = [`Que la madre tenga ${madrid.maxAge} años o menos al pedirla.`, 'Que el niño no haya cumplido 2 años.', 'Empadronamiento en la Comunidad de Madrid los últimos 10 años.'];
    if (p.householdIncome == null || p.householdIncome > madrid.individualIncome) check.push(`Renta de hasta ${yearly(madrid.individualIncome)} (${euros(madrid.jointIncome)} en conjunta).`);
    return {
      status: 'quizas',
      reasons: ['Vives en la Comunidad de Madrid.', p.baby ? 'Esperáis un bebé o ha nacido hace poco.' : 'Tenéis un hijo menor de 3 años.'],
      check,
      payment: { monthly: madrid.birthMonthly, text: `${monthly(madrid.birthMonthly)} (hasta ${euros(madrid.birthTotal)})` },
    };
  },

  'titulo-familia-numerosa'(p) {
    if (p.largeFamily !== 'no') return null;
    const n = totalChildren(p);
    const childWithDisability = p.caredFor.some((c) => c.relationship === 'hijo' && WITH_33.includes(c.disability));
    if (n >= 3) return { status: 'si', reasons: [`Tenéis ${n} hijos.`], check: ['Los hijos mayores también cuentan hasta los 21 años (25 si estudian).'] };
    if (n >= 2 && (childWithDisability || p.widowed || WITH_65.includes(p.disability))) {
      const because = childWithDisability ? 'y uno tiene discapacidad' : p.widowed ? 'y has enviudado' : 'y tienes una discapacidad del 65 % o más';
      return { status: 'si', reasons: [`Tenéis ${n} hijos ${because}.`], check: [] };
    }
    if (n === 2 && p.baby) return { status: 'quizas', reasons: ['Con el bebé tendréis 3 hijos.'], check: ['Se pide cuando nazca.'] };
    if (n === 2 && p.singleParent) return { status: 'quizas', reasons: ['Eres una familia monoparental con 2 hijos.'], check: ['Algunas comunidades reconocen como numerosa a la monoparental con 2 hijos.'] };
    return null;
  },

  cume(p) {
    if (!p.childSeriousIllness || !works(p)) return null;
    return { status: 'si', reasons: ['Tu hijo o hija tiene una enfermedad grave y trabajas.'], check: ['Que ambos progenitores trabajen (salvo familia monoparental).', 'Reducir la jornada al menos un 50 %.'] };
  },

  'escuela-infantil'(p) {
    if (totalChildren(p) === 0 && !p.baby) return null;
    return { status: 'quizas', reasons: ['Tenéis hijos en edad escolar o de escuela infantil.'], check: ['Las convocatorias de tu comunidad y tu ayuntamiento.'] };
  },

  orfandad(p) {
    if (!p.widowed || totalChildren(p) === 0) return null;
    return { status: 'quizas', reasons: ['Has enviudado y tienes hijos menores.'], check: ['Que tu pareja tuviera cotización o pensión.'], payment: { text: `Mínimo ${monthly(FIGURES.minimums.orfandad)} por hijo` } };
  },

  'pnc-jubilacion'(p) {
    if ((p.age ?? 0) < 65 || p.pension !== 'no') return null;
    const { annual, perMonth } = FIGURES.pnc;
    const check = ['Haber vivido en España 10 años desde los 16.'];
    if (members(p) > 1) check.push('Si vives con familia, el límite de ingresos sube y cuentan también los suyos.');
    if (p.ownIncome == null) return { status: 'quizas', reasons: ['Tienes 65 años o más y no cobras pensión.'], check: ['Depende de tus ingresos.', ...check], payment: { monthly: perMonth, text: `Hasta ${monthly(perMonth)}` } };
    if (p.ownIncome >= annual) return null;
    const amount = round2(Math.max((annual - p.ownIncome) / 14, perMonth * 0.25));
    return { status: 'si', reasons: ['Tienes 65 años o más y no cobras pensión.', `Tus ingresos (${yearly(p.ownIncome)}) no llegan a ${yearly(annual)}.`], check, payment: { monthly: amount, text: `≈ ${monthly(amount)} (14 pagas)` } };
  },

  'pnc-invalidez'(p) {
    if (!WITH_65.includes(p.disability) || p.age == null || p.age < 18 || p.age >= 65 || p.pension !== 'no') return null;
    const { annual, perMonth } = FIGURES.pnc;
    const check = ['Haber vivido en España 5 años.'];
    if (p.ownIncome == null) return { status: 'quizas', reasons: ['Tienes una discapacidad del 65 % o más y no cobras pensión.'], check: ['Depende de tus ingresos.', ...check], payment: { monthly: perMonth, text: `Hasta ${monthly(perMonth)}` } };
    if (p.ownIncome >= annual) return null;
    const amount = round2(Math.max((annual - p.ownIncome) / 14, perMonth * 0.25));
    return { status: 'si', reasons: ['Tienes una discapacidad del 65 % o más y no cobras pensión.', `Tus ingresos no llegan a ${yearly(annual)}.`], check, payment: { monthly: amount, text: `≈ ${monthly(amount)} (14 pagas)` } };
  },

  'pnc-alquiler'(p) {
    if (p.housing !== 'alquiler') return null;
    const pnc = p.pension === 'pnc' || RULES['pnc-jubilacion'](p)?.status === 'si' || RULES['pnc-invalidez'](p)?.status === 'si';
    if (!pnc) return null;
    return { status: 'si', reasons: ['Cobras (o te puede corresponder) una pensión no contributiva y vives de alquiler.'], check: ['Ser el titular del contrato y que el casero no sea un familiar cercano.'], payment: { yearly: FIGURES.pnc.annualRent, text: yearly(FIGURES.pnc.annualRent) } };
  },

  'complemento-minimos'(p) {
    if (!CONTRIBUTORY_PENSIONS.includes(p.pension)) return null;
    const min = minimumPension(p);
    const limit = p.partner ? FIGURES.minimums.incomeLimit.withSpouse : FIGURES.minimums.incomeLimit.withoutSpouse;
    const check = [`Que tus otros ingresos (sin la pensión) no pasen de ${yearly(limit)}.`];
    if (min.withSpouse) check.push(`Si tu cónyuge depende de ti (casi sin ingresos), el mínimo sube a ${monthly(min.withSpouse)}.`);
    if (p.pensionMonthly == null) return { status: 'quizas', reasons: [`La pensión mínima en tu caso (${min.caseLabel}) es de ${monthly(min.figure)}.`], check: ['Si tu pensión es menor, te la completan.', ...check] };
    if (p.pensionMonthly >= min.figure) {
      if (min.withSpouse && p.pensionMonthly < min.withSpouse) return { status: 'quizas', reasons: [`Con cónyuge a cargo la mínima es ${monthly(min.withSpouse)} y tu pensión es menor.`], check };
      return null;
    }
    const missing = round2(min.figure - p.pensionMonthly);
    return { status: 'si', reasons: [`Tu pensión (${monthly(p.pensionMonthly)}) está por debajo de la mínima en tu caso (${min.caseLabel}): ${monthly(min.figure)}.`], check, payment: { monthly: missing, text: `≈ ${monthly(missing)} más` } };
  },

  'brecha-genero'(p) {
    if (!CONTRIBUTORY_PENSIONS.includes(p.pension) || p.childrenBorn < 1 || p.pensionSince2021 === false) return null;
    const n = Math.min(p.childrenBorn, 4);
    const figure = round2(FIGURES.gap * n);
    return {
      status: p.pensionSince2021 ? 'si' : 'quizas',
      reasons: [`Cobras una pensión contributiva y has tenido ${p.childrenBorn} ${p.childrenBorn === 1 ? 'hijo' : 'hijos'}.`],
      check: [...(p.pensionSince2021 ? [] : ['Que tu pensión empezara en 2021 o después.']), 'Lo cobra el progenitor con la pensión más baja. Si no te lo han puesto, se pide en la Seguridad Social.'],
      payment: { monthly: figure, text: monthly(figure) },
    };
  },

  jubilacion(p) {
    if (p.pension !== 'no' || (p.age ?? 0) < 60 || p.contributed15 === false) return null;
    return {
      status: 'quizas',
      reasons: [`Tienes ${p.age} años y no cobras pensión.`],
      check: [`En 2026 la edad ordinaria es ${FIGURES.jubilacion.age} (${FIGURES.jubilacion.longAge} con ${FIGURES.jubilacion.longContribution} cotizados).`, 'Mira tu vida laboral y el simulador de pensión en Tu Seguridad Social.'],
    };
  },

  viudedad(p) {
    if (!p.widowed || p.pension === 'viudedad') return null;
    return { status: 'quizas', reasons: ['Has enviudado y no cobras pensión de viudedad.'], check: ['Que estuvierais casados o fuerais pareja de hecho registrada.', 'Que tu pareja tuviera cotización o pensión.'] };
  },

  'imserso-viajes'(p) {
    const e = p.age ?? 0;
    const ok = e >= 65 || p.pension === 'jubilacion' || (p.pension === 'viudedad' && e >= 55) || (CONTRIBUTORY_PENSIONS.includes(p.pension) && e >= 60);
    if (!ok) return null;
    return { status: 'si', reasons: [p.pension !== 'no' ? 'Eres pensionista.' : 'Tienes 65 años o más.'], check: ['Las plazas son limitadas: se reparten por puntos cada temporada.'] };
  },

  'servicios-mayores'(p) {
    const eldersYouCareFor = p.caredFor.filter((c) => (c.age ?? 0) >= 65);
    const me = (p.age ?? 0) >= 65 && (p.adults === 1 || (p.age ?? 0) >= 80);
    if (!me && !eldersYouCareFor.length) return null;
    return { status: 'quizas', reasons: [me ? (p.adults === 1 ? 'Tienes 65 años o más y vives solo o sola.' : 'Tienes 80 años o más.') : 'Cuidas de una persona mayor.'], check: ['Pide cita en los servicios sociales de tu ayuntamiento.'] };
  },

  'dependencia-valoracion'(p) {
    const who = people(p).filter((x) => x.dependency === 'necesita');
    if (!who.length) return null;
    return { status: 'si', reasons: [`${capital(list(who.map((x) => x.who)))} ${who.length === 1 && who[0].relationship === 'yo' ? 'necesitas' : 'necesita'} ayuda para el día a día y no tiene la dependencia reconocida.`], check: ['Se pide en los servicios sociales: tardan meses, conviene pedirlo cuanto antes.'] };
  },

  'dependencia-servicios'(p) {
    const who = people(p).filter((x) => GRADES.includes(x.dependency));
    if (!who.length) return null;
    return { status: 'si', reasons: who.map((x) => `${capital(x.who)}: dependencia de grado ${x.dependency}.`), check: ['Revisar el Programa Individual de Atención (PIA) si no lo tenéis.'] };
  },

  'dependencia-prestacion'(p) {
    const who = p.caredFor.filter((c) => GRADES.includes(c.dependency) && c.iCare);
    if (!who.length) return null;
    const check = ['Que esta prestación se elija en el PIA.'];
    if (who.some((c) => !c.livesWith)) check.push('Normalmente el cuidador tiene que convivir con la persona dependiente.');
    return { status: 'quizas', reasons: who.map((c, i) => `Cuidas en casa a ${personName(c, i)}, con grado ${c.dependency}.`), check, payment: { text: 'Según tu comunidad y el grado' } };
  },

  'convenio-cuidadores'(p) {
    const who = p.caredFor.filter((c) => GRADES.includes(c.dependency) && c.iCare);
    if (!who.length) return null;
    return { status: 'quizas', reasons: ['Cuidas a un familiar con dependencia reconocida.'], check: ['Que tenga la prestación por cuidados en el entorno familiar.', ...(works(p) ? ['No vale si trabajas a jornada completa.'] : [])], payment: { text: 'La cotización la paga el Estado' } };
  },

  'certificado-discapacidad'(p) {
    const who = people(p).filter((x) => x.disability === 'sin');
    if (!who.length) return null;
    return { status: 'si', reasons: [`${capital(list(who.map((x) => x.who)))} ${who.length === 1 && who[0].relationship === 'yo' ? 'tienes' : 'tiene'} limitaciones pero sin certificado de discapacidad.`], check: ['Con un 33 % o más se abren la mayoría de ventajas.'] };
  },

  'hijo-cargo-discapacidad'(p) {
    const children = p.caredFor.filter((c) => c.relationship === 'hijo' && WITH_33.includes(c.disability));
    if (!children.length) return null;
    const { childWith33, adultWith65, adultWith75 } = FIGURES.dependentChild;
    let total = 0;
    let onlyCertain = true;
    const reasons = [];
    for (const h of children) {
      if ((h.age ?? 0) < 18) {
        total += childWith33;
        onlyCertain = false;
        reasons.push(`Hijo o hija menor de 18 con discapacidad del ${h.disability} % o más: ${yearly(childWith33)}.`);
      } else if (h.disability === '75') {
        total += adultWith75;
        reasons.push(`Hijo o hija mayor de edad con discapacidad del 75 % o más: ${yearly(adultWith75)}.`);
      } else if (h.disability === '65') {
        total += adultWith65;
        reasons.push(`Hijo o hija mayor de edad con discapacidad del 65 % o más: ${yearly(adultWith65)}.`);
      }
    }
    if (!total) return null;
    const check = onlyCertain ? [] : ['Para hijos menores hay un límite de ingresos del hogar.'];
    if (children.some((h) => h.disability === '75')) check.push('La cuantía más alta (75 %) pide también necesitar ayuda de otra persona.');
    return { status: onlyCertain ? 'si' : 'quizas', reasons, check, payment: { yearly: total, text: yearly(total) } };
  },

  'ventajas-discapacidad'(p) {
    const who = people(p).filter((x) => WITH_33.includes(x.disability));
    if (!who.length) return null;
    return { status: 'quizas', reasons: [`${capital(list(who.map((x) => x.who)))}: discapacidad del 33 % o más.`], check: ['Para la tarjeta de aparcamiento hace falta movilidad reducida.', 'El impuesto de circulación lo quita tu ayuntamiento.'] };
  },

  'bono-social'(p) {
    const reasons = [];
    let status = null;
    let severe = false;
    const check = ['Tener la tarifa regulada (PVPC) con una comercializadora de referencia. Si tienes una tarifa de mercado libre, hay que cambiarse.'];
    if (p.largeFamily !== 'no') {
      reasons.push('Sois familia numerosa: tenéis derecho directo.');
      status = 'si';
    }
    if (RULES.imv(p)?.status === 'si') {
      reasons.push('Cobrar el IMV da derecho directo (te puede corresponder).');
      status ??= 'quizas';
    }
    if (RULES['complemento-minimos'](p)?.status === 'si' || p.pension === 'pnc') {
      reasons.push('Los pensionistas con la mínima o con pensión no contributiva tienen derecho si no hay otros ingresos en casa.');
      status ??= 'quizas';
    }
    const lim = socialDiscountLimit(p);
    if (p.householdIncome != null && p.householdIncome <= lim.euros) {
      reasons.push(`Vuestros ingresos (${yearly(p.householdIncome)}) están por debajo del límite: ${yearly(lim.euros)} (${String(lim.times).replace('.', ',')} veces el IPREM).`);
      status = 'si';
      severe = p.householdIncome <= lim.euros / 2;
    } else if (p.householdIncome == null && !status) {
      return { status: 'quizas', reasons: [`Si vuestros ingresos no pasan de ${yearly(lim.euros)}, tenéis derecho.`], check, payment: { text: `${percent(FIGURES.socialDiscount.vulnerable)} de descuento` } };
    }
    if (!status) return null;
    if (lim.times > 1.5 + 0.5 * Math.min(totalChildren(p), 2)) check.push('El límite es más alto porque en casa hay discapacidad, dependencia o es monoparental: hay que acreditarlo.');
    const d = severe ? FIGURES.socialDiscount.severe : FIGURES.socialDiscount.vulnerable;
    return { status, reasons, check, payment: { text: `${percent(d)} de descuento en la luz` }, severe };
  },

  'bono-termico'(p) {
    const discount = RULES['bono-social'](p);
    if (!discount) return null;
    return { status: discount.status, reasons: ['Va unido al bono social de la luz.'], check: ['Tener el bono social de la luz a 31 de diciembre.'], payment: { yearly: FIGURES.socialDiscount.thermalMinimum, text: `Desde ${yearly(FIGURES.socialDiscount.thermalMinimum)}` } };
  },

  'alquiler-joven'(p) {
    if (p.housing !== 'alquiler' || p.age == null || p.age < 18 || p.age > FIGURES.rent.youngAge) return null;
    const limit = FIGURES.rent.ipremLimitYoung * FIGURES.iprem.annual14;
    if (p.householdIncome != null && p.householdIncome > limit) return null;
    return {
      status: 'quizas',
      reasons: [`Tienes ${p.age} años y vives de alquiler.`, ...(p.householdIncome != null ? [`Vuestros ingresos no pasan de ${yearly(limit)}.`] : [])],
      check: ['Que tu comunidad tenga la convocatoria abierta (suele ser una vez al año).', 'Que el alquiler no pase del tope de tu comunidad.', ...(p.householdIncome == null ? [`Ingresos de hasta ${yearly(limit)}.`] : [])],
      payment: { monthly: FIGURES.rent.young, text: `Hasta ${monthly(FIGURES.rent.young)}` },
    };
  },

  'alquiler-general'(p) {
    if (p.housing !== 'alquiler' || RULES['alquiler-joven'](p)) return null;
    const limit = FIGURES.rent.ipremLimitGeneral * FIGURES.iprem.annual14;
    if (p.householdIncome != null && p.householdIncome > limit * 1.5) return null;
    return {
      status: 'quizas',
      reasons: ['Vives de alquiler.', ...(p.householdIncome != null && p.householdIncome <= limit ? [`Vuestros ingresos no pasan de ${yearly(limit)}.`] : [])],
      check: ['Que tu comunidad tenga la convocatoria abierta.', `El límite de ingresos de la convocatoria (en general, ${yearly(limit)}; más en familias numerosas o con discapacidad).`],
    };
  },

  'deduccion-maternidad'(p) {
    const n = p.children.under3 + (p.baby && p.children.under3 === 0 ? 1 : 0);
    if (!n) return null;
    const total = n * FIGURES.irpf.maternity;
    return {
      status: hasCountableIncome(p) ? 'si' : 'quizas',
      reasons: [p.children.under3 ? `Tenéis ${p.children.under3} ${p.children.under3 === 1 ? 'hijo menor' : 'hijos menores'} de 3 años.` : 'Esperáis un bebé.'],
      check: ['La pide la madre (o el padre con custodia exclusiva o si la madre ha fallecido).', 'Que trabaje, cobre el paro o haya trabajado 30 días al tener al hijo.', `Si pagáis guardería, hasta ${yearly(FIGURES.irpf.nursery)} más.`],
      payment: { yearly: total, text: yearly(total) },
    };
  },

  'deduccion-familia-numerosa'(p) {
    if (p.largeFamily === 'no') return null;
    const special = p.largeFamily === 'especial';
    const minimum = special ? 5 : 3;
    const extra = Math.max(0, totalChildren(p) - minimum) * FIGURES.irpf.largeFamilyExtraChild;
    const total = (special ? FIGURES.irpf.largeFamilySpecial : FIGURES.irpf.largeFamilyGeneral) + extra;
    return { status: hasCountableIncome(p) ? 'si' : 'quizas', reasons: [`Sois familia numerosa de categoría ${special ? 'especial' : 'general'}.`], check: ['Se puede cobrar por adelantado, cada mes, con el modelo 143.'], payment: { yearly: total, text: yearly(total) } };
  },

  'deduccion-monoparental'(p) {
    if (!p.singleParent || totalChildren(p) < 2 || p.largeFamily !== 'no') return null;
    return { status: 'quizas', reasons: ['Eres una familia monoparental con dos hijos.'], check: ['No cobrar pensión de alimentos por ellos.'], payment: { yearly: FIGURES.irpf.singleParentTwoChildren, text: yearly(FIGURES.irpf.singleParentTwoChildren) } };
  },

  'deduccion-discapacidad-cargo'(p) {
    const who = p.caredFor.filter((c) => ['hijo', 'padre', 'pareja'].includes(c.relationship) && WITH_33.includes(c.disability));
    if (!who.length) return null;
    const total = who.length * FIGURES.irpf.dependentDisability;
    const check = ['Que viva contigo o dependa de ti económicamente.'];
    if (who.some((c) => c.relationship === 'pareja')) check.push('Por la pareja, solo si sus ingresos no pasan de 8.000 € al año.');
    return { status: hasCountableIncome(p) ? 'si' : 'quizas', reasons: who.map((c, i) => `${capital(personName(c, i))} tiene una discapacidad del ${c.disability} % o más.`), check, payment: { yearly: total, text: yearly(total) } };
  },

  'minimo-discapacidad'(p) {
    if (!WITH_33.includes(p.disability)) return null;
    const figure = WITH_65.includes(p.disability) ? FIGURES.irpf.disabilityMinimum65 : FIGURES.irpf.disabilityMinimum33;
    return { status: 'si', reasons: [`Tienes una discapacidad del ${p.disability} % o más.`], check: ['Díselo a tu empresa o pagador para que te retenga menos cada mes.'], payment: { text: `${yearly(figure)} sin IRPF` } };
  },

  'deducciones-ccaa'(p) {
    if (!(totalChildren(p) || p.baby || p.housing === 'alquiler' || p.caredFor.length || p.disability !== 'no')) return null;
    return { status: 'quizas', reasons: ['Tienes circunstancias (hijos, alquiler, cuidados o discapacidad) que suelen tener deducción en las comunidades.'], check: ['Revísalas en Renta Web al hacer la declaración.'] };
  },

  becas(p) {
    const me = p.situation === 'estudiante' && (p.age ?? 0) >= 16;
    if (!me && !p.children.age6to17) return null;
    return { status: 'quizas', reasons: [me ? 'Estudias.' : 'Tenéis hijos en edad escolar: al llegar a bachillerato, FP o universidad.'], check: ['Los umbrales de renta de la convocatoria de cada curso.'] };
  },

  'justicia-gratuita'(p) {
    if (p.householdIncome == null) return null;
    const m = members(p);
    const times = m === 1 ? 2 : m < 4 ? 2.5 : 3;
    const limit = times * FIGURES.iprem.annual12;
    if (p.householdIncome > limit) return null;
    return { status: 'si', reasons: [`Vuestros ingresos no pasan de ${yearly(limit)}.`], check: ['Solo si necesitas un abogado o ir a juicio.'] };
  },

  // ── Si lo necesitas ya ─────────────────────────────────────────────────
  'violencia-genero'(p) {
    if (!p.urgent.violence) return null;
    return { status: 'si', reasons: ['Has marcado que sufres violencia de género.'], check: ['Llama al 016 aunque no hayas denunciado: te orientan y no sale en la factura.'], payment: { text: '016 · 24 horas' }, urgent: true };
  },

  'sin-hogar'(p) {
    if (!p.urgent.homeless) return null;
    return { status: 'si', reasons: ['Has marcado que no tienes casa.'], check: [], urgent: true };
  },

  desahucio(p) {
    if (!p.urgent.housingAtRisk) return null;
    return { status: 'si', reasons: ['Has marcado que puedes perder tu casa.'], check: ['Si ya te ha llegado una carta del juzgado, pide abogado de oficio hoy mismo.'], urgent: true };
  },

  alimentos(p) {
    if (!p.urgent.food && !p.urgent.homeless) return null;
    return { status: 'si', reasons: ['Has marcado que no llegas para comer o para pagar lo básico.'], check: [], urgent: true };
  },

  'emergencia-social'(p) {
    const veryLow = p.householdIncome != null && p.householdIncome < guaranteedIncome(p) * 12 * 0.5;
    if (!p.urgent.food && !p.urgent.housingAtRisk && !p.urgent.homeless && !veryLow) return null;
    return { status: p.urgent.food || p.urgent.housingAtRisk || p.urgent.homeless ? 'si' : 'quizas', reasons: [veryLow && !p.urgent.food ? 'Vuestros ingresos son muy bajos.' : 'No llegas a cubrir lo básico este mes.'], check: ['Pide cita urgente: no esperes a que llegue el IMV.'], urgent: true };
  },

  soledad(p) {
    const livesAlone = (p.age ?? 0) >= 65 && p.adults === 1;
    if (!p.urgent.soledad && !livesAlone) return null;
    return { status: p.urgent.soledad ? 'si' : 'quizas', reasons: [p.urgent.soledad ? 'Has marcado que te sientes solo o sola.' : 'Tienes 65 años o más y vives solo o sola.'], check: [] };
  },

  'sanidad-sin-papeles'(p) {
    if (p.residence !== 'no' && p.residence !== 'tramite') return null;
    return { status: 'si', reasons: ['No tienes permiso de residencia (o está en trámite).'], check: ['Pide orientación a una ONG para regularizar tu situación.'] };
  },

  // ── Comunidad y Ayuntamiento de Madrid ─────────────────────────────────
  'rmi-madrid'(p) {
    if (p.region !== 'madrid') return null;
    if (p.pension === 'jubilacion' || p.pension === 'pnc') return null;
    const annual = guaranteedIncome(p) * 12;
    if (p.householdIncome != null && p.householdIncome >= annual) return null;
    if (p.householdIncome == null && !unemployed(p) && !p.urgent.food) return null;
    return {
      status: 'quizas',
      reasons: ['Vives en la Comunidad de Madrid.', p.householdIncome != null ? 'Vuestros ingresos son bajos.' : 'Estás en una situación de ingresos bajos.'],
      check: ['Pide antes el Ingreso Mínimo Vital: la RMI lo complementa.', 'La cuantía exacta te la dicen en servicios sociales.'],
      payment: { text: `Hasta ${monthly(MINIMUM_INCOME.madrid.payment)} (una persona)` },
    };
  },

  'aes-euskadi'(p) {
    if (p.region !== 'pais-vasco') return null;
    const struggling = p.urgent.food || p.urgent.housingAtRisk || (p.householdIncome != null && p.householdIncome < guaranteedIncome(p) * 12) || p.situation === 'paro-sin';
    if (!struggling) return null;
    return {
      status: 'quizas',
      reasons: ['Vives en Euskadi y tenéis pocos ingresos o un gasto que no podéis pagar.'],
      check: ['Llevar al menos 6 meses empadronado en tu municipio.', 'Que sea un gasto concreto: alquiler, luz, comida, deudas, muebles o arreglos.'],
    };
  },

  'fons-infancia-barcelona'(p) {
    if (p.city !== 'barcelona' || totalChildren(p) === 0) return null;
    return {
      status: 'quizas',
      reasons: ['Vives en Barcelona y tienes hijos menores.'],
      check: ['Ser usuario de los servicios sociales del Ayuntamiento.', 'Los ingresos del hogar: hay un límite según cuántos sois.', 'Que esté abierta la convocatoria (en 2026, del 13 de mayo al 22 de junio).'],
      payment: { text: 'Desde 600 € al año' },
    };
  },

  'natalidad-valencia'(p) {
    if (p.city !== 'valencia' || !p.baby) return null;
    return {
      status: 'si',
      reasons: ['Vives en València y esperáis un bebé o ha llegado hace poco.'],
      check: ['Pedirla en los 2 meses siguientes al nacimiento o la adopción.'],
      payment: { text: '400 € por hijo' },
    };
  },

  'urgencia-zaragoza'(p) {
    if (p.city !== 'zaragoza') return null;
    const struggling = p.urgent.food || p.urgent.housingAtRisk || (p.householdIncome != null && p.householdIncome < guaranteedIncome(p) * 12) || p.situation === 'paro-sin';
    if (!struggling) return null;
    return { status: 'quizas', reasons: ['Vives en Zaragoza y tenéis pocos ingresos o una urgencia.'], check: ['Pedir cita en tu centro municipal de servicios sociales.'] };
  },

  'nos-cuidamos-malaga'(p) {
    if (p.city !== 'malaga') return null;
    const hasSmallChildren = p.children.under3 + p.children.age3to5 > 0 || p.baby;
    if (!hasSmallChildren && p.children.age6to17 === 0) return null;
    return { status: 'quizas', reasons: ['Vives en Málaga y tienes hijos pequeños.'], check: ['Que los niños tengan de 4 meses a 10 años.', 'Que esté abierta la edición del año (en 2026, de julio a septiembre).'] };
  },

  'tarjeta-familias'(p) {
    if (p.region !== 'madrid' || p.madridCity === false) return null;
    const limit = 752 * 12;
    const low = p.householdIncome != null && p.householdIncome <= limit;
    if (!low && !p.urgent.food) return null;
    const check = ['La concede servicios sociales tras una entrevista.'];
    if (p.madridCity == null) check.unshift('Solo para quien vive en la ciudad de Madrid (la capital).');
    return { status: p.madridCity && low ? 'si' : 'quizas', reasons: [low ? `Vuestros ingresos (${yearly(p.householdIncome)}) no pasan de 752 € al mes.` : 'Has marcado que no llegas para comer.'], check, payment: { text: 'De 146 € a 735 € al mes' } };
  },

  'agua-canal'(p) {
    if (p.region !== 'madrid') return null;
    const reasons = [];
    if (RULES.imv(p)?.status === 'si') reasons.push('Te puede corresponder el IMV, que acredita la vulnerabilidad.');
    if (p.largeFamily !== 'no') reasons.push('Sois familia numerosa.');
    if (members(p) > 4) reasons.push(`Vivís ${members(p)} personas en casa.`);
    if (p.householdIncome != null && p.householdIncome <= socialDiscountLimit(p).euros && !reasons.length) reasons.push('Vuestros ingresos son bajos.');
    if (!reasons.length) return null;
    return { status: 'quizas', reasons, check: ['Para la exención social, cobrar el IMV o un informe de servicios sociales.'] };
  },

  'vivienda-social-madrid'(p) {
    if (p.region !== 'madrid') return null;
    const withoutHousing = p.housing === 'alquiler' || p.housing === 'otra' || p.urgent.homeless || p.urgent.housingAtRisk;
    if (!withoutHousing) return null;
    if (p.householdIncome != null && p.householdIncome > 3.5 * FIGURES.iprem.annual14) return null;
    if (p.householdIncome == null && !p.urgent.housingAtRisk && !p.urgent.homeless) return null;
    return { status: 'quizas', reasons: ['Vives en la Comunidad de Madrid, sin vivienda propia y con ingresos bajos.'], check: ['Hay lista de espera: apúntate cuanto antes.'] };
  },

  'escuela-infantil-madrid'(p) {
    if (p.region !== 'madrid' || p.madridCity === false || !(p.children.under3 > 0 || p.baby)) return null;
    return { status: p.madridCity ? 'si' : 'quizas', reasons: [p.baby ? 'Esperáis un bebé o tenéis uno pequeño.' : 'Tenéis hijos menores de 3 años.'], check: ['El plazo es en abril para el curso siguiente.', ...(p.madridCity ? [] : ['Solo para quien vive en la ciudad de Madrid.'])], payment: { text: 'Gratis (salvo comedor)' } };
  },

  'teleasistencia-madrid'(p) {
    const caresForElder = p.caredFor.some((c) => (c.age ?? 0) >= 65);
    if (p.region !== 'madrid' || p.madridCity === false || ((p.age ?? 0) < 65 && !caresForElder)) return null;
    return { status: p.madridCity ? 'si' : 'quizas', reasons: [(p.age ?? 0) >= 65 ? 'Tienes 65 años o más.' : 'Cuidas de una persona mayor.'], check: ['Llama al 900 111 065 (gratis).'] };
  },

  'transporte-madrid'(p) {
    if (p.region !== 'madrid') return null;
    const e = p.age;
    const reasons = [];
    let text = '';
    if (e != null && e >= 65) { reasons.push('Tienes 65 años o más: viajas gratis.'); text = 'Gratis'; }
    else if (e != null && e >= 15 && e <= 25) { reasons.push(`Tienes ${e} años: abono joven.`); text = '10 € al mes'; }
    if (totalChildren(p) > 0) reasons.push('Los menores de 14 viajan gratis.');
    if (!reasons.length) return null;
    return { status: 'si', reasons, check: ['Necesitas la Tarjeta Transporte Público personal.'], payment: text ? { text } : undefined };
  },

  'copago-farmaceutico'(p) {
    const reasons = [];
    if (p.pension === 'pnc') reasons.push('Cobras una pensión no contributiva: las medicinas son gratis.');
    if (RULES.imv(p)?.status === 'si') reasons.push('Si te conceden el IMV, las medicinas son gratis.');
    if (p.situation === 'paro-sin') reasons.push('En paro sin cobrar prestación, las medicinas son gratis.');
    if (RULES['complemento-minimos'](p)?.status === 'si') reasons.push('Con complemento a mínimos en la pensión, las medicinas son gratis.');
    if (!reasons.length && CONTRIBUTORY_PENSIONS.includes(p.pension)) reasons.push('Como pensionista pagas el 10 %, con un tope al mes según tus ingresos.');
    if (!reasons.length) return null;
    return { status: 'si', reasons, check: ['Se aplica solo. Pregunta en la farmacia si pagas de más.'] };
  },

  'tarifa-plana-autonomos'(p) {
    if (!p.startingBusiness) return null;
    const C = FIGURES.selfEmployed;
    return {
      status: 'quizas',
      reasons: ['Quieres hacerte autónomo o montar un negocio.'],
      check: ['Que no hayas sido autónomo en los últimos 2 años (3 si ya tuviste la tarifa plana).', 'Pedirla en el mismo momento del alta: después no se puede.'],
      payment: { text: `Pagas ${monthly(C.flatRate)} de cuota el primer año` },
    };
  },

  'cese-actividad'(p) {
    if (p.situation !== 'autonomo') return null;
    return {
      status: 'quizas',
      reasons: ['Eres autónomo: si tienes que cerrar sin quererlo, tienes un paro propio.'],
      check: ['Haber cotizado por cese de actividad los últimos 12 meses seguidos.', 'Pedirlo a tu mutua antes de que acabe el mes siguiente al cierre.'],
    };
  },

  'subsidio-retornados'(p) {
    if (!p.returnee) return null;
    const S = FIGURES.allowance;
    if (p.ownIncome != null && p.ownIncome / 12 > S.monthlyIncomeLimit) return null;
    return {
      status: 'quizas',
      reasons: ['Has vuelto a España en el último año después de trabajar fuera.', ...(p.ownIncome != null ? [`Tus ingresos no pasan de ${monthly(S.monthlyIncomeLimit)}.`] : [])],
      check: ['Tener la nacionalidad española.', 'Haber trabajado fuera al menos 12 meses en los últimos 6 años, fuera del Espacio Económico Europeo o en un país sin convenio de paro con España.', ...(p.ownIncome == null ? [`No tener ingresos de más de ${monthly(S.monthlyIncomeLimit)}.`] : [])],
      payment: { monthly: S.first6Months, text: `${monthly(S.first6Months)} al principio` },
    };
  },

  'aval-ico-vivienda'(p) {
    if (p.housing !== 'alquiler' && p.housing !== 'familia' && p.housing !== 'otra') return null;
    const young = p.age != null && p.age >= 18 && p.age <= FIGURES.icoGuarantee.age;
    if (!young && totalChildren(p) === 0) return null;
    if (p.highWealth === true) return null;
    return {
      status: 'quizas',
      reasons: [young ? `Tienes ${p.age} años y no tienes casa propia.` : 'Tienes hijos menores y no tienes casa propia.'],
      check: ['Si piensas comprar tu primera casa.', `Ingresos de hasta ${yearly(FIGURES.icoGuarantee.incomePerPerson)} por persona.`, 'Que tu banco dé estos avales: no todos lo hacen.'],
    };
  },

  ortoprotesica(p) {
    const someone = people(p).some((x) => (x.disability && x.disability !== 'no') || (x.dependency && x.dependency !== 'no'));
    if (!someone) return null;
    return {
      status: 'quizas',
      reasons: ['En casa hay una persona con discapacidad o dependencia.'],
      check: ['Que el médico especialista de la sanidad pública lo recete.'],
    };
  },

  'bono-cultural-joven'(p) {
    if (p.age !== 18) return null;
    return { status: 'quizas', reasons: ['Tienes 18 años.'], check: ['Es para quien cumple 18 este año (en 2026, los nacidos en 2008).'], payment: { text: '400 €' } };
  },
};

function list(xs) {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`;
}
function capital(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Ayudas que piden nacionalidad, residencia legal o estar dado de alta en Hacienda o la Seguridad Social
const NEED_RESIDENCE = new Set([
  'imv', 'capi', 'renta-minima', 'rmi-madrid', 'subsidio-desempleo', 'subsidio-52', 'paro', 'nacimiento', 'pago-unico-nacimiento',
  'madrid-natalidad', 'titulo-familia-numerosa', 'pnc-jubilacion', 'pnc-invalidez', 'pnc-alquiler', 'alquiler-joven', 'alquiler-general',
  'vivienda-social-madrid', 'bono-cultural-joven', 'dependencia-valoracion', 'dependencia-prestacion', 'hijo-cargo-discapacidad',
]);

// Reglas de las ayudas propias de cada comunidad
for (const a of REGIONAL_BENEFITS) RULES[a.id] = a.rule;

/** Evalúa todas las reglas. Devuelve los resultados en el orden del catálogo. */
export function evaluate(profile) {
  const base = emptyProfile();
  const p = { ...base, ...profile, children: { ...base.children, ...(profile?.children ?? {}) }, urgent: { ...base.urgent, ...(profile?.urgent ?? {}) } };
  const results = [];
  for (const [id, rule] of Object.entries(RULES)) {
    let r = rule(p);
    if (!r) continue;
    if (NEED_RESIDENCE.has(id)) {
      if (p.residence === 'no') continue;
      if (p.residence === 'tramite') r = { ...r, status: 'quizas', check: ['Necesitas tener ya el permiso de residencia.', ...r.check] };
    }
    results.push({ id, ...r });
  }
  return results;
}

// Orden en que conviene pedir las cosas: primero lo urgente, luego lo que abre la puerta a lo demás
const PRIORITY = [
  'violencia-genero', 'sin-hogar', 'desahucio', 'alimentos', 'emergencia-social', 'sanidad-sin-papeles',
  'imv', 'dependencia-valoracion', 'certificado-discapacidad', 'paro', 'subsidio-desempleo', 'subsidio-52', 'pnc-jubilacion', 'pnc-invalidez',
  'complemento-minimos', 'rmi-madrid', 'renta-minima', 'tarjeta-familias', 'capi', 'nacimiento', 'madrid-natalidad', 'viudedad', 'orfandad',
  'titulo-familia-numerosa', 'bono-social', 'brecha-genero', 'hijo-cargo-discapacidad', 'dependencia-prestacion', 'convenio-cuidadores',
];

/** Las primeras cosas que hacer, en orden (como mucho `n`) */
export function whereToStart(results, n = 4) {
  const range = (id) => {
    const i = PRIORITY.indexOf(id);
    return i === -1 ? PRIORITY.length : i;
  };
  return [...results].sort((a, b) => range(a.id) - range(b.id) || (a.status === b.status ? 0 : a.status === 'si' ? -1 : 1)).filter((r) => range(r.id) < PRIORITY.length).slice(0, n);
}

export const IDS_WITH_RULE = Object.keys(RULES);

// ── Gráficos: tu cifra frente al límite, y el dinero que podría entrar ──

/** Para las ayudas con límite de ingresos: tu cifra y el límite, para dibujar la barra. null si no se sabe. */
export function thresholdOf(id, profile) {
  const base = emptyProfile();
  const p = { ...base, ...profile, children: { ...base.children, ...(profile?.children ?? {}) }, urgent: { ...base.urgent, ...(profile?.urgent ?? {}) } };
  const rgAnnual = guaranteedIncome(p) * 12;
  const household = (limit, extra = {}) => (p.householdIncome == null ? null : { yours: p.householdIncome, limit, which: 'Ingresos de tu hogar al año', ...extra });
  const ownItems = (limit) => (p.ownIncome == null ? null : { yours: p.ownIncome, limit, which: 'Tus ingresos al año' });
  const m = members(p);
  switch (id) {
    case 'imv':
    case 'renta-minima':
    case 'rmi-madrid':
      return household(rgAnnual);
    case 'capi':
      return household(rgAnnual * FIGURES.capi.incomeTimesLimit);
    case 'pnc-jubilacion':
    case 'pnc-invalidez':
      return ownItems(FIGURES.pnc.annual);
    case 'subsidio-desempleo':
    case 'subsidio-52':
      return ownItems(FIGURES.allowance.monthlyIncomeLimit * 12);
    case 'bono-social':
      return household(socialDiscountLimit(p).euros);
    case 'alquiler-joven':
      return household(FIGURES.rent.ipremLimitYoung * FIGURES.iprem.annual14);
    case 'alquiler-general':
      return household(FIGURES.rent.ipremLimitGeneral * FIGURES.iprem.annual14);
    case 'tarjeta-familias':
      return household(752 * 12);
    case 'justicia-gratuita':
      return household((m === 1 ? 2 : m < 4 ? 2.5 : 3) * FIGURES.iprem.annual12);
    case 'complemento-minimos':
      return p.pensionMonthly == null || !CONTRIBUTORY_PENSIONS.includes(p.pension) ? null : { yours: p.pensionMonthly, limit: minimumPension(p).figure, which: 'Tu pensión al mes', lowerIsBetter: true, text: 'pensión mínima' };
    default:
      return null;
  }
}

// Ayudas que son dinero cada mes y que se pueden sumar (con el ajuste del IMV, que descuenta lo demás que cobras)
const MONTHLY_SUMMABLE = ['imv', 'capi', 'pnc-jubilacion', 'pnc-invalidez', 'complemento-minimos', 'brecha-genero', 'subsidio-desempleo', 'subsidio-52'];

/** Cuánto dinero podría entrar: al mes (14 pagas para pensiones, 12 el resto) y al año en pagos o deducciones. Solo «Cumples lo principal». */
export function estimatedMoney(results) {
  const yes = new Map(results.filter((r) => r.status === 'si').map((r) => [r.id, r]));
  const parts = [];
  for (const id of MONTHLY_SUMMABLE) {
    const r = yes.get(id);
    if (!r?.payment?.monthly) continue;
    let figure = r.payment.monthly;
    // El IMV completa hasta un mínimo: el subsidio o la pensión cuentan como ingreso y lo reducen
    if (id === 'imv') {
      const others = ['subsidio-desempleo', 'subsidio-52', 'pnc-invalidez'].map((k) => yes.get(k)?.payment?.monthly ?? 0).reduce((a, b) => a + b, 0);
      figure = Math.max(0, figure - others);
    }
    if (figure > 0) parts.push({ id, monthly: Math.round(figure * 100) / 100 });
  }
  const perYear = [];
  for (const r of yes.values()) if (r.payment?.yearly) perYear.push({ id: r.id, yearly: r.payment.yearly });
  return {
    monthly: Math.round(parts.reduce((a, x) => a + x.monthly, 0) * 100) / 100,
    yearly: perYear.reduce((a, x) => a + x.yearly, 0),
    parts,
    perYear,
  };
}
