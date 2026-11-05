// Examples with people and numbers, calculated with this year's figures (they update when the figures change).
// And «how much for your household» tables for benefits that depend on the size of the family.

import { FIGURES as C } from './figures.js';
import { guaranteedIncome, emptyProfile, minimumPension, socialDiscountLimit } from '../lib/rules.js';
import { euros, percent } from '../lib/format.js';

const p = (changes) => ({ ...emptyProfile(), ...changes, children: { ...emptyProfile().children, ...(changes.children ?? {}) } });
const r2 = (n) => Math.round(n * 100) / 100;

/** An example in short sentences: who they are, what they get and why*/
export const EXAMPLES = {
  imv() {
    const rg = guaranteedIncome(p({ children: { age3to5: 1 }, singleParent: true }));
    const amount = r2(rg - 400);
    return {
      who: 'Lucía vive sola con su hijo de 4 años. Gana 400 € al mes limpiando casas.',
      accounts: [`Su renta garantizada (madre sola con un hijo) es ${euros(rg)} al mes.`, `Le faltan ${euros(rg)} − 400 € = ${euros(amount)}.`],
      result: `Cobraría unos ${euros(amount)} al mes de IMV, y además ${euros(C.capi.age3to6)} al mes por su hijo.`,
    };
  },
  capi() {
    const total = r2(C.capi.under3 + C.capi.age6to18);
    return {
      who: 'Marta y Javi tienen dos hijos de 2 y 8 años. Entre los dos ganan 1.500 € al mes.',
      accounts: [`Por el de 2 años: ${euros(C.capi.under3)}.`, `Por el de 8 años: ${euros(C.capi.age6to18)}.`],
      result: `Cobrarían ${euros(total)} al mes (${euros(total * 12)} al año), aunque no cobren el IMV.`,
    };
  },
  'pnc-jubilacion'() {
    const others = 2400;
    const amount = r2((C.pnc.annual - others) / 14);
    return {
      who: 'Carmen tiene 70 años. Nunca cotizó. Alquila una plaza de garaje por 200 € al mes.',
      accounts: [`La pensión no contributiva entera son ${euros(C.pnc.annual)} al año.`, `Se le resta lo que ya cobra: 2.400 € al año.`, `Queda ${euros(C.pnc.annual - others)}, en 14 pagas.`],
      result: `Cobraría unos ${euros(amount)} al mes.`,
    };
  },
  'complemento-minimos'() {
    const min = minimumPension(p({ age: 68, pension: 'jubilacion' })).figure;
    return {
      who: 'José tiene 68 años, vive solo y cobra 750 € de jubilación.',
      accounts: [`La pensión mínima para él es ${euros(min)} al mes.`, `${euros(min)} − 750 € = ${euros(r2(min - 750))}.`],
      result: `Le subirían la pensión ${euros(r2(min - 750))} al mes, hasta ${euros(min)}.`,
    };
  },
  'brecha-genero'() {
    return {
      who: 'Rosa se jubiló en 2023 y tuvo 3 hijos.',
      accounts: [`${euros(C.gap)} por cada hijo × 3.`],
      result: `Cobraría ${euros(r2(C.gap * 3))} más al mes en su pensión.`,
    };
  },
  'bono-social'() {
    const lim = socialDiscountLimit(p({ children: { under3: 1 } })).euros;
    return {
      who: 'Una pareja con un bebé gana 15.000 € al año y paga 80 € de luz al mes.',
      accounts: [`Su límite es ${euros(lim)} al año (1,5 veces el IPREM + 0,5 por el bebé).`, `15.000 € está por debajo.`],
      result: `Les descontarían el ${percent(C.socialDiscount.vulnerable)} de la luz consumida y de la potencia. Los impuestos y el alquiler del contador se pagan igual.`,
    };
  },
  'subsidio-desempleo'() {
    return {
      who: 'Pedro, 40 años, se queda sin paro. No tiene otros ingresos.',
      accounts: [`Los 6 primeros meses: ${euros(C.allowance.first6Months)} al mes.`, `Los 6 siguientes: ${euros(C.allowance.next6Months)}.`, `Después: ${euros(C.allowance.rest)}.`],
      result: `En el primer año cobraría ${euros(6 * C.allowance.first6Months + 6 * C.allowance.next6Months)}.`,
    };
  },
  'deduccion-maternidad'() {
    return {
      who: 'Elena trabaja y tiene una hija de 1 año que va a la guardería.',
      accounts: [`${euros(C.irpf.maternity)} al año por ser menor de 3 (100 € al mes si lo pide por adelantado).`, `Hasta ${euros(C.irpf.nursery)} más por la guardería.`],
      result: `Hasta ${euros(C.irpf.maternity + C.irpf.nursery)} al año menos de impuestos, o cobrados.`,
    };
  },
  'madrid-natalidad'() {
    return {
      who: 'Sara tiene 28 años, vive en Getafe desde niña y está embarazada de 5 meses.',
      accounts: [`${euros(C.madrid.birthMonthly)} al mes desde la semana 21.`, 'Hasta que su bebé cumpla 2 años.'],
      result: `En total, hasta ${euros(C.madrid.birthTotal)}.`,
    };
  },
};

/** «How much for your household» tables: rows with a label and a monthly figure, to draw bars*/
export const TABLES = {
  imv() {
    const rows = [1, 2, 3, 4, 5].map((n) => ({
      label: n === 1 ? '1 persona' : n === 5 ? '5 o más' : `${n} personas`,
      figure: guaranteedIncome(p({ adults: 1, children: { age6to17: n - 1 } })),
    }));
    return {
      title: 'Renta garantizada al mes según cuántos sois en casa',
      rows,
      note: `Un 22 % más (${euros(C.imv.base * C.imv.supplement)}) si es monoparental o hay discapacidad del 65 % o dependencia de grado III. Cobras la diferencia entre esta cifra y lo que ya ingresáis.`,
    };
  },
  capi() {
    return {
      title: 'Al mes por cada hijo',
      rows: [
        { label: 'Menor de 3 años', figure: C.capi.under3 },
        { label: 'De 3 a 6 años', figure: C.capi.age3to6 },
        { label: 'De 6 a 18 años', figure: C.capi.age6to18 },
      ],
    };
  },
  'subsidio-desempleo'() {
    return {
      title: 'Al mes, según el tiempo que lleves cobrándolo',
      rows: [
        { label: 'Meses 1 a 6', figure: C.allowance.first6Months },
        { label: 'Meses 7 a 12', figure: C.allowance.next6Months },
        { label: 'Desde el mes 13', figure: C.allowance.rest },
      ],
    };
  },
  'complemento-minimos'() {
    const m = C.minimums;
    return {
      title: 'Pensión mínima de jubilación al mes (65 años o más)',
      rows: [
        { label: 'Con cónyuge a cargo', figure: m.retirement65.withSpouse },
        { label: 'Sin cónyuge', figure: m.retirement65.withoutSpouse },
        { label: 'Cónyuge no a cargo', figure: m.retirement65.nonDependentSpouse },
      ],
    };
  },
  viudedad() {
    const v = C.minimums.viudedad;
    return {
      title: 'Pensión mínima de viudedad al mes',
      rows: [
        { label: 'Con cargas familiares', figure: v.withDependants },
        { label: '65 años o más', figure: v.from65 },
        { label: 'De 60 a 64 años', figure: v.age60to64 },
        { label: 'Menos de 60 años', figure: v.under60 },
      ],
    };
  },
  'hijo-cargo-discapacidad'() {
    const h = C.dependentChild;
    return {
      title: 'Al mes por cada hijo con discapacidad',
      rows: [
        { label: 'Menor de 18, 33 % o más', figure: h.childWith33 / 12 },
        { label: 'Mayor de 18, 65 % o más', figure: h.adultWith65 / 12 },
        { label: 'Mayor de 18, 75 % y ayuda de otra persona', figure: h.adultWith75 / 12 },
      ],
    };
  },
};
