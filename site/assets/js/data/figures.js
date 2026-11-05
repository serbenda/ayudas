// Official 2026 figures used by the rules. Each block says where it comes from.
// When a figure changes (pension increase, minimum wage, IPREM…), change it here and nowhere else.

export const FIGURES = {
  yearly: 2026,
  reviewed: '2026-11-05',

  // IPREM: frozen since 2023 because the State Budget is still extended
  iprem: { perMonth: 600, annual12: 7200, annual14: 8400 },

  // Minimum wage 2026 (Real Decreto 126/2026)
  smi: { perMonth: 1221, annual: 17094 },

  // Minimum Living Income 2026: guaranteed income for a single adult; +30 % for each extra person (up to 220 %)
  // and +22 % of the base if the household is single-parent or has a disability ≥ 65 % or grade III dependency
  imv: { base: 733.6, perPerson: 0.3, maximum: 2.2, supplement: 0.22 },

  // Child support supplement (CAPI), per child and month, by age
  capi: { under3: 115, age3to6: 80.5, age6to18: 57.5, incomeTimesLimit: 3 },

  // Non-contributory pensions (retirement and disability), 14 payments, and rent supplement
  pnc: { annual: 8803.2, perMonth: 628.8, annualRent: 525 },

  // Minimum pensions 2026, in euros per month (14 payments)
  minimums: {
    retirement65: { withSpouse: 1256.6, withoutSpouse: 936.2, nonDependentSpouse: 888.7 },
    retirementUnder65: { withSpouse: 1256.6, withoutSpouse: 875.9, nonDependentSpouse: 827.9 },
    viudedad: { withDependants: 1256.6, from65: 936.2, age60to64: 875.9, under60: 709.4 },
    orfandad: 286.5,
    // Yearly income (not counting the pension) above which there is no minimum supplement
    incomeLimit: { withoutSpouse: 9442, withSpouse: 11013 },
  },
  maxPension: 3359.6,

  // Gender gap supplement, per child and month (up to 4 children)
  gap: 36.9,

  // Allowance per dependent child with a disability, per year
  dependentChild: { childWith33: 1000, adultWith65: 5962.8, adultWith75: 8942.4 },

  // Unemployment allowance (based on the IPREM) and income limit: 75 % of the minimum wage without extra payments
  allowance: { first6Months: 570, next6Months: 540, rest: 480, over52: 480, monthlyIncomeLimit: 915.75 },

  // Self-employed: flat contribution rate (Ley 31/2022) and ICO guarantees for a first home (RDL 42/2021, extended to 2027)
  selfEmployed: { flatRate: 80, months: 12, extraMonths: 12 },
  icoGuarantee: { age: 35, incomePerPerson: 37800, wealth: 100000, aval: 20, efficientGuarantee: 25, until: '31 de diciembre de 2027' },

  // Birth and childcare
  nacimiento: { weeks: 19, weeksSingleParent: 32, oneOffPayment: 1000 },

  // Electricity social discount: 2026 discounts (back to 35 % and 50 % in 2027 unless extended)
  socialDiscount: { vulnerable: 0.425, severe: 0.575, thermalMinimum: 50 },

  // Rent support: State Housing Plan 2026-2030
  rent: { young: 300, youngRoom: 200, youngAge: 35, ipremLimitYoung: 5, ipremLimitGeneral: 3 },

  // Income tax deductions (per year)
  irpf: {
    maternity: 1200,
    nursery: 1000,
    largeFamilyGeneral: 1200,
    largeFamilySpecial: 2400,
    largeFamilyExtraChild: 600,
    singleParentTwoChildren: 1200,
    dependentDisability: 1200,
    disabilityMinimum33: 3000,
    disabilityMinimum65: 9000,
  },

  // Ordinary retirement in 2026
  jubilacion: { age: '66 años y 10 meses', longAge: 65, longContribution: '38 años y 3 meses' },

  // Community of Madrid: birth grant for mothers aged 30 or under
  madrid: { birthMonthly: 500, birthTotal: 14500, maxAge: 30, individualIncome: 30000, jointIncome: 36200 },
};

// Sources of the figures (shown on the sources page)
export const FIGURE_SOURCES = [
  { topic: 'IPREM 2026', fieldValue: '600 €/mes · 8.400 €/año (14 pagas)', source: 'Prorrogado desde la Ley de Presupuestos de 2023', url: 'https://www.boe.es/' },
  { topic: 'Salario mínimo 2026', fieldValue: '1.221 €/mes · 17.094 €/año', source: 'Real Decreto 126/2026 (BOE)', url: 'https://www.boe.es/eli/es/rd/2026/02/18/126/con' },
  { topic: 'Pensiones 2026', fieldValue: 'Contributivas +2,7 %, mínimas +7 %, no contributivas e IMV +11,4 %', source: 'La Moncloa, nota de prensa sobre la revalorización', url: 'https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/inclusion/paginas/2026/subida-pensiones-2026.aspx' },
  { topic: 'Ingreso Mínimo Vital', fieldValue: '733,60 €/mes un adulto solo; hasta 1.613,92 €', source: 'Seguridad Social', url: 'https://imv.seg-social.es/' },
  { topic: 'Pensión no contributiva', fieldValue: '8.803,20 €/año · 628,80 €/mes', source: 'La Moncloa e IMSERSO', url: 'https://imserso.es/' },
  { topic: 'Subsidio por desempleo', fieldValue: '570 / 540 / 480 €/mes', source: 'SEPE', url: 'https://www.sepe.es/' },
  { topic: 'Bono social eléctrico', fieldValue: '42,5 % y 57,5 % de descuento en 2026', source: 'Ministerio para la Transición Ecológica', url: 'https://www.bonosocial.gob.es/' },
  { topic: 'Permiso por nacimiento', fieldValue: '19 semanas por progenitor (32 en monoparentales)', source: 'Real Decreto-ley 9/2025 y Seguridad Social', url: 'https://www.seg-social.es/' },
  { topic: 'Alquiler', fieldValue: 'Hasta 300 €/mes para menores de 35', source: 'Plan Estatal de Vivienda 2026-2030', url: 'https://www.mivau.gob.es/' },
  { topic: 'Transporte en la Comunidad de Madrid', fieldValue: 'Gratis desde 65 y hasta 14 años · abono joven 10 €', source: 'Consorcio Regional de Transportes (hasta el 31/12/2026)', url: 'https://www.crtm.es/' },
  { topic: 'Tarjeta Familias (Ayuntamiento de Madrid)', fieldValue: '146 € a 735 € al mes · ingresos hasta 752 €/mes', source: 'Diario del Ayuntamiento de Madrid', url: 'https://diario.madrid.es/' },
  { topic: 'Rentas mínimas de las comunidades', fieldValue: 'De 328 € (Melilla) a 853,28 € (País Vasco) al mes para una persona', source: 'Informe de Rentas Mínimas de Inserción 2025 (Ministerio de Derechos Sociales) y webs de cada comunidad para 2026', url: 'https://www.dsca.gob.es/es/derechos-sociales/servicios-sociales/rentas-minimas' },
  { topic: 'Deducciones autonómicas del IRPF', fieldValue: 'Las de cada comunidad, con cantidades en Andalucía, Cataluña, Galicia y Madrid', source: 'Agencia Tributaria (guía de deducciones autonómicas) y Ministerio de Hacienda (Tributación autonómica 2026)', url: 'https://sede.agenciatributaria.gob.es/Sede/Ayuda/25Manual/100/deducciones-autonomicas.html' },
  { topic: 'Natalidad Comunidad de Madrid', fieldValue: '500 €/mes hasta los 2 años · madres de 30 o menos', source: 'Sede de la Comunidad de Madrid', url: 'https://sede.comunidad.madrid/ayudas-becas-subvenciones/ayudas-economicas-natalidad' },
  { topic: 'Pensiones no contributivas en Madrid', fieldValue: 'Se resuelven en 90 días · información 91 392 56 86', source: 'Sede de la Comunidad de Madrid', url: 'https://sede.comunidad.madrid/prestacion-social/pension-no-contributiva-jubilacion' },
  { topic: 'Medicinas (copago)', fieldValue: 'Pensionistas: 10 % con tope desde 8,23 €/mes', source: 'Real Decreto-ley 11/2026', url: 'https://www.boe.es/' },
  { topic: 'Deducciones familiares', fieldValue: '1.200 € por hijo menor de 3, familia numerosa, discapacidad…', source: 'Agencia Tributaria', url: 'https://sede.agenciatributaria.gob.es/' },
];

// How they have changed, in euros per month. Sources: IMSERSO (PNC reports and sheets), BOE (minimum wage royal decrees),
// Social Security (IMV: a single adult's guaranteed income is the yearly PNC divided by 12) and Budget laws (IPREM).
export const HISTORY = {
  years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  series: [
    { id: 'smi', name: 'Salario mínimo', valueList: [735.9, 900, 950, 965, 1000, 1080, 1134, 1184, 1221], note: 'Al mes, en 14 pagas' },
    { id: 'pnc', name: 'Pensión no contributiva', valueList: [380.1, 392, 395.6, 402.8, 421.4, 484.61, 517.9, 564.7, 628.8], note: 'Al mes, en 14 pagas' },
    { id: 'imv', name: 'Ingreso Mínimo Vital', valueList: [null, null, 461.53, 469.93, 491.63, 565.38, 604.21, 658.81, 733.6], note: 'Un adulto solo, al mes (existe desde junio de 2020)' },
    { id: 'iprem', name: 'IPREM', valueList: [537.84, 537.84, 537.84, 564.9, 579.02, 600, 600, 600, 600], note: 'La cifra que decide quién entra en muchas ayudas' },
  ],
};
