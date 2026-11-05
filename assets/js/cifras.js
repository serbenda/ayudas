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

  // Autónomos: tarifa plana de cotización (Ley 31/2022) y avales ICO para la primera vivienda (RDL 42/2021, ampliado a 2027)
  autonomos: { tarifaPlana: 80, meses: 12, mesesExtra: 12 },
  avalIco: { edad: 35, ingresosPersona: 37800, patrimonio: 100000, aval: 20, avalEficiente: 25, hasta: '31 de diciembre de 2027' },

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
  { tema: 'Transporte en la Comunidad de Madrid', valor: 'Gratis desde 65 y hasta 14 años · abono joven 10 €', fuente: 'Consorcio Regional de Transportes (hasta el 31/12/2026)', url: 'https://www.crtm.es/' },
  { tema: 'Tarjeta Familias (Ayuntamiento de Madrid)', valor: '146 € a 735 € al mes · ingresos hasta 752 €/mes', fuente: 'Diario del Ayuntamiento de Madrid', url: 'https://diario.madrid.es/' },
  { tema: 'Natalidad Comunidad de Madrid', valor: '500 €/mes hasta los 2 años · madres de 30 o menos', fuente: 'Sede de la Comunidad de Madrid', url: 'https://sede.comunidad.madrid/ayudas-becas-subvenciones/ayudas-economicas-natalidad' },
  { tema: 'Pensiones no contributivas en Madrid', valor: 'Se resuelven en 90 días · información 91 392 56 86', fuente: 'Sede de la Comunidad de Madrid', url: 'https://sede.comunidad.madrid/prestacion-social/pension-no-contributiva-jubilacion' },
  { tema: 'Medicinas (copago)', valor: 'Pensionistas: 10 % con tope desde 8,23 €/mes', fuente: 'Real Decreto-ley 11/2026', url: 'https://www.boe.es/' },
  { tema: 'Deducciones familiares', valor: '1.200 € por hijo menor de 3, familia numerosa, discapacidad…', fuente: 'Agencia Tributaria', url: 'https://sede.agenciatributaria.gob.es/' },
];

// Cómo han cambiado, en euros al mes. Fuentes: IMSERSO (informes y fichas de PNC), BOE (reales decretos del SMI),
// Seguridad Social (IMV: la renta garantizada de un adulto es la PNC anual entre 12) y leyes de Presupuestos (IPREM).
export const EVOLUCION = {
  años: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  series: [
    { id: 'smi', nombre: 'Salario mínimo', valores: [735.9, 900, 950, 965, 1000, 1080, 1134, 1184, 1221], nota: 'Al mes, en 14 pagas' },
    { id: 'pnc', nombre: 'Pensión no contributiva', valores: [380.1, 392, 395.6, 402.8, 421.4, 484.61, 517.9, 564.7, 628.8], nota: 'Al mes, en 14 pagas' },
    { id: 'imv', nombre: 'Ingreso Mínimo Vital', valores: [null, null, 461.53, 469.93, 491.63, 565.38, 604.21, 658.81, 733.6], nota: 'Un adulto solo, al mes (existe desde junio de 2020)' },
    { id: 'iprem', nombre: 'IPREM', valores: [537.84, 537.84, 537.84, 564.9, 579.02, 600, 600, 600, 600], nota: 'La cifra que decide quién entra en muchas ayudas' },
  ],
};
