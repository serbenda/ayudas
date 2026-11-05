// Cifras oficiales de 2026 que usan las reglas. Cada bloque dice de dónde sale.
// Cuando cambie una cifra (revalorización de pensiones, SMI, IPREM…), se cambia aquí y en ningún otro sitio.

export const CIFRAS = {
  año: 2026,
  revisado: '2026-11-05',

  // IPREM: congelado desde 2023 porque siguen prorrogados los Presupuestos
  iprem: { mensual: 600, anual12: 7200, anual14: 8400 },

  // Salario mínimo 2026 (Real Decreto 126/2026)
  smi: { mensual: 1221, anual: 17094 },

  // Ingreso Mínimo Vital 2026: renta garantizada de un adulto solo; +30 % por cada persona más (hasta el 220 %)
  // y +22 % de la base si el hogar es monoparental o hay discapacidad ≥ 65 % o dependencia de grado III
  imv: { base: 733.6, porPersona: 0.3, maximo: 2.2, complemento: 0.22 },

  // Complemento de ayuda para la infancia (CAPI), por hijo y mes, según la edad
  capi: { menor3: 115, de3a6: 80.5, de6a18: 57.5, limiteVecesRenta: 3 },

  // Pensiones no contributivas (jubilación e invalidez), 14 pagas, y complemento por alquiler
  pnc: { anual: 8803.2, mensual: 628.8, alquilerAnual: 525 },

  // Pensiones mínimas 2026, en euros al mes (14 pagas)
  minimas: {
    jubilacion65: { conConyuge: 1256.6, sinConyuge: 936.2, conyugeNoACargo: 888.7 },
    jubilacionMenor65: { conConyuge: 1256.6, sinConyuge: 875.9, conyugeNoACargo: 827.9 },
    viudedad: { conCargas: 1256.6, desde65: 936.2, de60a64: 875.9, menor60: 709.4 },
    orfandad: 286.5,
    // Ingresos al año (sin contar la pensión) por encima de los cuales no hay complemento a mínimos
    limiteIngresos: { sinConyuge: 9442, conConyuge: 11013 },
  },
  pensionMaxima: 3359.6,

  // Complemento para reducir la brecha de género, por hijo y mes (hasta 4 hijos)
  brecha: 36.9,

  // Asignación por hijo a cargo con discapacidad, al año
  hijoACargo: { menorCon33: 1000, mayorCon65: 5962.8, mayorCon75: 8942.4 },

  // Subsidio por desempleo (sobre el IPREM) y límite de rentas: 75 % del SMI sin pagas extra
  subsidio: { primeros6Meses: 570, siguientes6Meses: 540, resto: 480, mayores52: 480, limiteRentasMes: 915.75 },

  // Nacimiento y cuidado de menor
  nacimiento: { semanas: 19, semanasMonoparental: 32, pagoUnico: 1000 },

  // Bono social eléctrico: descuentos en 2026 (vuelven al 35 % y 50 % en 2027 si no se prorrogan)
  bonoSocial: { vulnerable: 0.425, severo: 0.575, termicoMinimo: 50 },

  // Ayudas al alquiler: Plan Estatal de Vivienda 2026-2030
  alquiler: { joven: 300, jovenHabitacion: 200, edadJoven: 35, limiteIpremJoven: 5, limiteIpremGeneral: 3 },

  // Deducciones en el IRPF (al año)
  irpf: {
    maternidad: 1200,
    guarderia: 1000,
    familiaNumerosaGeneral: 1200,
    familiaNumerosaEspecial: 2400,
    familiaNumerosaHijoExtra: 600,
    monoparentalDosHijos: 1200,
    discapacidadACargo: 1200,
    minimoDiscapacidad33: 3000,
    minimoDiscapacidad65: 9000,
  },

  // Jubilación ordinaria en 2026
  jubilacion: { edad: '66 años y 10 meses', edadLarga: 65, cotizacionLarga: '38 años y 3 meses' },

  // Comunidad de Madrid: ayuda a la natalidad para madres de 30 años o menos
  madrid: { natalidadMes: 500, natalidadTotal: 14500, edadMaxima: 30, rentaIndividual: 30000, rentaConjunta: 36200 },
};

// Fuentes de las cifras (se enseñan en la página de fuentes)
export const FUENTES_CIFRAS = [
  { tema: 'IPREM 2026', valor: '600 €/mes · 8.400 €/año (14 pagas)', fuente: 'Prorrogado desde la Ley de Presupuestos de 2023', url: 'https://www.boe.es/' },
  { tema: 'Salario mínimo 2026', valor: '1.221 €/mes · 17.094 €/año', fuente: 'Real Decreto 126/2026 (BOE)', url: 'https://www.boe.es/eli/es/rd/2026/02/18/126/con' },
  { tema: 'Pensiones 2026', valor: 'Contributivas +2,7 %, mínimas +7 %, no contributivas e IMV +11,4 %', fuente: 'La Moncloa, nota de prensa sobre la revalorización', url: 'https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/inclusion/paginas/2026/subida-pensiones-2026.aspx' },
  { tema: 'Ingreso Mínimo Vital', valor: '733,60 €/mes un adulto solo; hasta 1.613,92 €', fuente: 'Seguridad Social', url: 'https://imv.seg-social.es/' },
  { tema: 'Pensión no contributiva', valor: '8.803,20 €/año · 628,80 €/mes', fuente: 'La Moncloa e IMSERSO', url: 'https://imserso.es/' },
  { tema: 'Subsidio por desempleo', valor: '570 / 540 / 480 €/mes', fuente: 'SEPE', url: 'https://www.sepe.es/' },
  { tema: 'Bono social eléctrico', valor: '42,5 % y 57,5 % de descuento en 2026', fuente: 'Ministerio para la Transición Ecológica', url: 'https://www.bonosocial.gob.es/' },
  { tema: 'Permiso por nacimiento', valor: '19 semanas por progenitor (32 en monoparentales)', fuente: 'Real Decreto-ley 9/2025 y Seguridad Social', url: 'https://www.seg-social.es/' },
  { tema: 'Alquiler', valor: 'Hasta 300 €/mes para menores de 35', fuente: 'Plan Estatal de Vivienda 2026-2030', url: 'https://www.mivau.gob.es/' },
  { tema: 'Deducciones familiares', valor: '1.200 € por hijo menor de 3, familia numerosa, discapacidad…', fuente: 'Agencia Tributaria', url: 'https://sede.agenciatributaria.gob.es/' },
];
