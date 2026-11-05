// Ejemplos con personas y números, calculados con las cifras de este año (cambian solos cuando cambian las cifras).
// Y tablas «cuánto según tu hogar» para las ayudas que dependen del tamaño de la familia.

import { CIFRAS as C } from './figures.js';
import { rentaGarantizada, perfilVacio, pensionMinima, limiteBonoSocial } from '../lib/rules.js';
import { euros, porcentaje } from '../lib/format.js';

const p = (cambios) => ({ ...perfilVacio(), ...cambios, hijos: { ...perfilVacio().hijos, ...(cambios.hijos ?? {}) } });
const r2 = (n) => Math.round(n * 100) / 100;

/** Un ejemplo en frases cortas: quién es, qué cobra y por qué */
export const EJEMPLOS = {
  imv() {
    const rg = rentaGarantizada(p({ hijos: { de3a5: 1 }, monoparental: true }));
    const cobra = r2(rg - 400);
    return {
      quien: 'Lucía vive sola con su hijo de 4 años. Gana 400 € al mes limpiando casas.',
      cuentas: [`Su renta garantizada (madre sola con un hijo) es ${euros(rg)} al mes.`, `Le faltan ${euros(rg)} − 400 € = ${euros(cobra)}.`],
      resultado: `Cobraría unos ${euros(cobra)} al mes de IMV, y además ${euros(C.capi.de3a6)} al mes por su hijo.`,
    };
  },
  capi() {
    const total = r2(C.capi.menor3 + C.capi.de6a18);
    return {
      quien: 'Marta y Javi tienen dos hijos de 2 y 8 años. Entre los dos ganan 1.500 € al mes.',
      cuentas: [`Por el de 2 años: ${euros(C.capi.menor3)}.`, `Por el de 8 años: ${euros(C.capi.de6a18)}.`],
      resultado: `Cobrarían ${euros(total)} al mes (${euros(total * 12)} al año), aunque no cobren el IMV.`,
    };
  },
  'pnc-jubilacion'() {
    const otros = 2400;
    const cobra = r2((C.pnc.anual - otros) / 14);
    return {
      quien: 'Carmen tiene 70 años. Nunca cotizó. Alquila una plaza de garaje por 200 € al mes.',
      cuentas: [`La pensión no contributiva entera son ${euros(C.pnc.anual)} al año.`, `Se le resta lo que ya cobra: 2.400 € al año.`, `Queda ${euros(C.pnc.anual - otros)}, en 14 pagas.`],
      resultado: `Cobraría unos ${euros(cobra)} al mes.`,
    };
  },
  'complemento-minimos'() {
    const min = pensionMinima(p({ edad: 68, pension: 'jubilacion' })).cifra;
    return {
      quien: 'José tiene 68 años, vive solo y cobra 750 € de jubilación.',
      cuentas: [`La pensión mínima para él es ${euros(min)} al mes.`, `${euros(min)} − 750 € = ${euros(r2(min - 750))}.`],
      resultado: `Le subirían la pensión ${euros(r2(min - 750))} al mes, hasta ${euros(min)}.`,
    };
  },
  'brecha-genero'() {
    return {
      quien: 'Rosa se jubiló en 2023 y tuvo 3 hijos.',
      cuentas: [`${euros(C.brecha)} por cada hijo × 3.`],
      resultado: `Cobraría ${euros(r2(C.brecha * 3))} más al mes en su pensión.`,
    };
  },
  'bono-social'() {
    const lim = limiteBonoSocial(p({ hijos: { menor3: 1 } })).euros;
    return {
      quien: 'Una pareja con un bebé gana 15.000 € al año y paga 80 € de luz al mes.',
      cuentas: [`Su límite es ${euros(lim)} al año (1,5 veces el IPREM + 0,5 por el bebé).`, `15.000 € está por debajo.`],
      resultado: `Les descontarían el ${porcentaje(C.bonoSocial.vulnerable)} de la luz consumida y de la potencia. Los impuestos y el alquiler del contador se pagan igual.`,
    };
  },
  'subsidio-desempleo'() {
    return {
      quien: 'Pedro, 40 años, se queda sin paro. No tiene otros ingresos.',
      cuentas: [`Los 6 primeros meses: ${euros(C.subsidio.primeros6Meses)} al mes.`, `Los 6 siguientes: ${euros(C.subsidio.siguientes6Meses)}.`, `Después: ${euros(C.subsidio.resto)}.`],
      resultado: `En el primer año cobraría ${euros(6 * C.subsidio.primeros6Meses + 6 * C.subsidio.siguientes6Meses)}.`,
    };
  },
  'deduccion-maternidad'() {
    return {
      quien: 'Elena trabaja y tiene una hija de 1 año que va a la guardería.',
      cuentas: [`${euros(C.irpf.maternidad)} al año por ser menor de 3 (100 € al mes si lo pide por adelantado).`, `Hasta ${euros(C.irpf.guarderia)} más por la guardería.`],
      resultado: `Hasta ${euros(C.irpf.maternidad + C.irpf.guarderia)} al año menos de impuestos, o cobrados.`,
    };
  },
  'madrid-natalidad'() {
    return {
      quien: 'Sara tiene 28 años, vive en Getafe desde niña y está embarazada de 5 meses.',
      cuentas: [`${euros(C.madrid.natalidadMes)} al mes desde la semana 21.`, 'Hasta que su bebé cumpla 2 años.'],
      resultado: `En total, hasta ${euros(C.madrid.natalidadTotal)}.`,
    };
  },
};

/** Tablas «cuánto según tu hogar»: filas con etiqueta y cifra al mes, para dibujar barras */
export const TABLAS = {
  imv() {
    const filas = [1, 2, 3, 4, 5].map((n) => ({
      etiqueta: n === 1 ? '1 persona' : n === 5 ? '5 o más' : `${n} personas`,
      cifra: rentaGarantizada(p({ adultos: 1, hijos: { de6a17: n - 1 } })),
    }));
    return { titulo: 'Renta garantizada al mes según cuántos sois en casa', filas, nota: `Un 22 % más (${euros(C.imv.base * C.imv.complemento)}) si es monoparental o hay discapacidad del 65 % o dependencia de grado III. Cobras la diferencia entre esta cifra y lo que ya ingresáis.` };
  },
  capi() {
    return {
      titulo: 'Al mes por cada hijo',
      filas: [
        { etiqueta: 'Menor de 3 años', cifra: C.capi.menor3 },
        { etiqueta: 'De 3 a 6 años', cifra: C.capi.de3a6 },
        { etiqueta: 'De 6 a 18 años', cifra: C.capi.de6a18 },
      ],
    };
  },
  'subsidio-desempleo'() {
    return {
      titulo: 'Al mes, según el tiempo que lleves cobrándolo',
      filas: [
        { etiqueta: 'Meses 1 a 6', cifra: C.subsidio.primeros6Meses },
        { etiqueta: 'Meses 7 a 12', cifra: C.subsidio.siguientes6Meses },
        { etiqueta: 'Desde el mes 13', cifra: C.subsidio.resto },
      ],
    };
  },
  'complemento-minimos'() {
    const m = C.minimas;
    return {
      titulo: 'Pensión mínima de jubilación al mes (65 años o más)',
      filas: [
        { etiqueta: 'Con cónyuge a cargo', cifra: m.jubilacion65.conConyuge },
        { etiqueta: 'Sin cónyuge', cifra: m.jubilacion65.sinConyuge },
        { etiqueta: 'Cónyuge no a cargo', cifra: m.jubilacion65.conyugeNoACargo },
      ],
    };
  },
  viudedad() {
    const v = C.minimas.viudedad;
    return {
      titulo: 'Pensión mínima de viudedad al mes',
      filas: [
        { etiqueta: 'Con cargas familiares', cifra: v.conCargas },
        { etiqueta: '65 años o más', cifra: v.desde65 },
        { etiqueta: 'De 60 a 64 años', cifra: v.de60a64 },
        { etiqueta: 'Menos de 60 años', cifra: v.menor60 },
      ],
    };
  },
  'hijo-cargo-discapacidad'() {
    const h = C.hijoACargo;
    return {
      titulo: 'Al mes por cada hijo con discapacidad',
      filas: [
        { etiqueta: 'Menor de 18, 33 % o más', cifra: h.menorCon33 / 12 },
        { etiqueta: 'Mayor de 18, 65 % o más', cifra: h.mayorCon65 / 12 },
        { etiqueta: 'Mayor de 18, 75 % y ayuda de otra persona', cifra: h.mayorCon75 / 12 },
      ],
    };
  },
};
