import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, guaranteedIncome, socialDiscountLimit, minimumPension, emptyProfile, IDS_WITH_RULE } from '../../site/assets/js/lib/rules.js';
import { BENEFITS, BY_ID, REGIONS, linkOf } from '../../site/assets/js/data/benefits.js';
import { parseNumber, euros } from '../../site/assets/js/lib/format.js';

const profile = (changes) => ({ ...emptyProfile(), ...changes, children: { ...emptyProfile().children, ...(changes.children ?? {}) } });
const ids = (r) => r.map((x) => x.id);
const de = (r, id) => r.find((x) => x.id === id);

test('cada regla tiene su ficha en el catálogo, con enlace', () => {
  for (const id of IDS_WITH_RULE) assert.ok(BY_ID[id], `falta la ficha de ${id}`);
  for (const a of BENEFITS) {
    assert.ok(a.name && a.summary && a.amount && a.requirements.length, `ficha incompleta: ${a.id}`);
    assert.ok(a.link.region || /^https:\/\//.test(a.link.url), `enlace raro en ${a.id}`);
  }
  assert.equal(new Set(BENEFITS.map((a) => a.id)).size, BENEFITS.length, 'ids repetidos');
});

test('el enlace de las ayudas autonómicas lleva a la web de tu comunidad', () => {
  const a = BY_ID['dependencia-valoracion'];
  assert.equal(linkOf(a, 'madrid').url, 'https://www.comunidad.madrid/');
  assert.equal(linkOf(a, null).url, null);
  assert.equal(REGIONS.length, 19);
});

test('sin contestar nada no sale nada «seguro»', () => {
  const r = evaluate({});
  assert.ok(r.every((x) => x.status !== 'si'), ids(r.filter((x) => x.status === 'si')).join());
});

test('renta garantizada del IMV según el hogar', () => {
  assert.equal(guaranteedIncome(profile({})), 733.6);
  assert.equal(guaranteedIncome(profile({ adults: 2 })), 953.68);
  assert.equal(guaranteedIncome(profile({ adults: 2, children: { age6to17: 2 } })), 1393.84);
  assert.equal(guaranteedIncome(profile({ adults: 2, children: { age6to17: 5 } })), 1613.92);
  // monoparental: +22 % de la base
  assert.equal(guaranteedIncome(profile({ children: { under3: 1 }, singleParent: true })), Math.round((733.6 * 1.3 + 733.6 * 0.22) * 100) / 100);
});

test('IMV: hogar con pocos ingresos cobra la diferencia', () => {
  const r = evaluate(profile({ age: 35, adults: 2, children: { age6to17: 2 }, householdIncome: 690 * 12 }));
  const imv = de(r, 'imv');
  assert.equal(imv.status, 'si');
  assert.equal(imv.payment.monthly, 703.84);
  assert.equal(de(r, 'capi').status, 'si');
  assert.equal(de(r, 'capi').payment.monthly, 115);
  assert.equal(de(r, 'bono-social').status, 'si');
});

test('IMV: con ingresos altos no sale; CAPI tampoco', () => {
  const r = evaluate(profile({ age: 40, adults: 2, children: { under3: 1 }, householdIncome: 60000 }));
  assert.ok(!ids(r).includes('imv'));
  assert.ok(!ids(r).includes('capi'));
  assert.ok(!ids(r).includes('bono-social'));
});

test('IMV: menor de 23 sin hijos no sale, y los jubilados tampoco', () => {
  assert.ok(!ids(evaluate(profile({ age: 20, householdIncome: 0 }))).includes('imv'));
  assert.ok(!ids(evaluate(profile({ age: 70, pension: 'jubilacion', pensionMonthly: 700, householdIncome: 9800 }))).includes('imv'));
});

test('pensión no contributiva para un mayor sin pensión ni ingresos', () => {
  const r = evaluate(profile({ age: 70, pension: 'no', ownIncome: 0, housing: 'alquiler' }));
  const pnc = de(r, 'pnc-jubilacion');
  assert.equal(pnc.status, 'si');
  assert.equal(pnc.payment.monthly, 628.8);
  assert.equal(de(r, 'pnc-alquiler').payment.yearly, 525);
  assert.ok(ids(r).includes('imserso-viajes'));
  assert.ok(ids(r).includes('servicios-mayores'));
});

test('complemento a mínimos y brecha de género', () => {
  const r = evaluate(profile({ age: 68, pension: 'jubilacion', pensionMonthly: 800, pensionSince2021: true, childrenBorn: 2 }));
  assert.equal(de(r, 'complemento-minimos').status, 'si');
  assert.equal(de(r, 'complemento-minimos').payment.monthly, 136.2);
  assert.equal(de(r, 'brecha-genero').payment.monthly, 73.8);
  assert.deepEqual(minimumPension(profile({ age: 68, pension: 'jubilacion' })).figure, 936.2);
  assert.deepEqual(minimumPension(profile({ age: 55, pension: 'viudedad', children: { age6to17: 1 } })).figure, 1256.6);
});

test('pensión por encima de la mínima: sin complemento', () => {
  const r = evaluate(profile({ age: 68, pension: 'jubilacion', pensionMonthly: 1500, pensionSince2021: false, childrenBorn: 2 }));
  assert.ok(!ids(r).includes('complemento-minimos'));
  assert.ok(!ids(r).includes('brecha-genero'));
});

test('paro: subsidio general y de mayores de 52', () => {
  const young = evaluate(profile({ age: 30, situation: 'paro-sin', ownIncome: 0, contributedOneYear: false }));
  assert.equal(de(young, 'subsidio-desempleo').status, 'si');
  assert.ok(!ids(young).includes('paro'));
  const older = evaluate(profile({ age: 55, situation: 'paro-sin', ownIncome: 0, contributed15: true }));
  assert.equal(de(older, 'subsidio-52').status, 'si');
  assert.ok(!ids(older).includes('subsidio-desempleo'));
  const wealthy = evaluate(profile({ age: 30, situation: 'paro-sin', ownIncome: 20000 }));
  assert.ok(!ids(wealthy).includes('subsidio-desempleo'));
});

test('familia con bebé en la Comunidad de Madrid', () => {
  const r = evaluate(profile({ age: 29, region: 'madrid', situation: 'cuenta-ajena', partner: true, adults: 2, baby: true, children: { age3to5: 1, age6to17: 1 }, householdIncome: 30000 }));
  for (const id of ['nacimiento', 'pago-unico-nacimiento', 'madrid-natalidad', 'deduccion-maternidad', 'titulo-familia-numerosa', 'capi']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.equal(de(r, 'nacimiento').status, 'si');
  assert.ok(!ids(evaluate(profile({ region: 'galicia', baby: true }))).includes('madrid-natalidad'));
});

test('familia numerosa: deducción y bono social directo', () => {
  const r = evaluate(profile({ situation: 'cuenta-ajena', adults: 2, children: { age6to17: 4 }, largeFamily: 'general', householdIncome: 70000 }));
  assert.equal(de(r, 'deduccion-familia-numerosa').payment.yearly, 1800);
  assert.equal(de(r, 'bono-social').status, 'si');
  assert.ok(!ids(r).includes('titulo-familia-numerosa'));
});

test('cuidar de un padre con dependencia y discapacidad', () => {
  const r = evaluate(profile({ age: 50, situation: 'cuenta-ajena', caredFor: [{ relationship: 'padre', age: 82, disability: '65', dependency: '2', livesWith: true, iCare: true }] }));
  for (const id of ['dependencia-servicios', 'dependencia-prestacion', 'convenio-cuidadores', 'deduccion-discapacidad-cargo', 'ventajas-discapacidad', 'servicios-mayores']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.equal(de(r, 'deduccion-discapacidad-cargo').payment.yearly, 1200);
});

test('alguien que necesita ayuda sin la dependencia reconocida', () => {
  const r = evaluate(profile({ caredFor: [{ relationship: 'padre', age: 85, disability: 'sin', dependency: 'necesita', livesWith: true, iCare: true }] }));
  assert.equal(de(r, 'dependencia-valoracion').status, 'si');
  assert.equal(de(r, 'certificado-discapacidad').status, 'si');
  assert.ok(!ids(r).includes('dependencia-prestacion'));
});

test('hijo mayor de edad con discapacidad del 65 %', () => {
  const r = evaluate(profile({ caredFor: [{ relationship: 'hijo', age: 25, disability: '65', dependency: 'no', livesWith: true, iCare: true }] }));
  assert.equal(de(r, 'hijo-cargo-discapacidad').status, 'si');
  assert.equal(de(r, 'hijo-cargo-discapacidad').payment.yearly, 5962.8);
});

test('bono social: límites según el hogar', () => {
  assert.equal(socialDiscountLimit(profile({})).euros, 12600);
  assert.equal(socialDiscountLimit(profile({ children: { under3: 1 } })).euros, 16800);
  assert.equal(socialDiscountLimit(profile({ children: { under3: 1, age3to5: 1 }, singleParent: true })).euros, 25200);
  const severe = evaluate(profile({ householdIncome: 5000 }));
  assert.equal(de(severe, 'bono-social').severe, true);
  assert.equal(de(severe, 'bono-termico').status, 'si');
});

test('alquiler: joven con ingresos medios y adulto con ingresos bajos', () => {
  const young = evaluate(profile({ age: 28, housing: 'alquiler', householdIncome: 30000 }));
  assert.ok(ids(young).includes('alquiler-joven'));
  assert.ok(!ids(young).includes('alquiler-general'));
  const adult = evaluate(profile({ age: 45, housing: 'alquiler', householdIncome: 20000 }));
  assert.ok(ids(adult).includes('alquiler-general'));
  assert.ok(!ids(evaluate(profile({ age: 28, housing: 'propia' }))).includes('alquiler-joven'));
});

test('discapacidad propia: reducción en la renta y PNC de invalidez', () => {
  const r = evaluate(profile({ age: 40, disability: '65', ownIncome: 2000 }));
  assert.equal(de(r, 'minimo-discapacidad').status, 'si');
  assert.equal(de(r, 'pnc-invalidez').status, 'si');
});

test('leer números escritos a la española', () => {
  assert.equal(parseNumber('1.234,5'), 1234.5);
  assert.equal(parseNumber('30.000'), 30000);
  assert.equal(parseNumber('12000'), 12000);
  assert.equal(parseNumber('800,50 €'), 800.5);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('abc'), null);
  assert.equal(euros(1200), '1.200 €');
  assert.equal(euros(628.8), '628,80 €');
});

// ── Trámites, urgencias y Madrid ─────────────────────────────────────────
import { PROCEDURES, procedureOf, papersFor } from '../../site/assets/js/data/procedures.js';
import { DOCUMENTS, PHONES } from '../../site/assets/js/data/guide.js';
import { whereToStart } from '../../site/assets/js/lib/rules.js';

test('cada ayuda explica cómo se pide, con papeles y teléfonos que existen', () => {
  for (const a of BENEFITS) {
    const t = PROCEDURES[a.id];
    assert.ok(t, `falta el trámite de ${a.id}`);
    assert.ok(t.easy?.length && t.steps?.length && t.deadline && t.response, `trámite incompleto: ${a.id}`);
    for (const d of t.documents) assert.ok(DOCUMENTS[d], `papel desconocido ${d} en ${a.id}`);
    for (const k of [...(t.phones ?? []), ...(t.madridPhones ?? [])]) assert.ok(PHONES[k], `teléfono desconocido ${k} en ${a.id}`);
    // Frases cortas en el resumen fácil: que lo pueda leer cualquiera
    for (const f of t.easy) assert.ok(f.split(' ').length <= 20, `frase larga en ${a.id}: ${f}`);
  }
});

test('en Madrid salen los pasos y teléfonos de Madrid', () => {
  assert.match(procedureOf('pnc-jubilacion', 'madrid').steps.join(' '), /sede\.comunidad\.madrid/);
  assert.ok(procedureOf('pnc-jubilacion', 'madrid').phones.includes('madridPnc'));
  assert.doesNotMatch(procedureOf('pnc-jubilacion', 'galicia').steps.join(' '), /comunidad\.madrid/);
});

test('papeles agrupados: los que piden más ayudas, primero', () => {
  const p = papersFor(['imv', 'capi', 'bono-social']);
  assert.equal(p[0].doc, 'dni');
  assert.deepEqual(p[0].benefits, ['imv', 'capi', 'bono-social']);
});

test('urgencias: violencia, desahucio y comida salen primero', () => {
  const r = evaluate(profile({ age: 40, region: 'madrid', madridCity: true, householdIncome: 6000, urgent: { violence: true, food: true, housingAtRisk: true } }));
  const order = whereToStart(r).map((x) => x.id);
  assert.deepEqual(order.slice(0, 3), ['violencia-genero', 'desahucio', 'alimentos']);
  for (const id of ['tarjeta-familias', 'rmi-madrid', 'emergencia-social']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.ok(!ids(r).includes('renta-minima'), 'en Madrid sale la RMI, no la genérica');
});

test('sin permiso de residencia no salen las ayudas que lo piden, pero sí las demás', () => {
  const r = evaluate(profile({ age: 35, householdIncome: 3000, residence: 'no', urgent: { food: true } }));
  assert.ok(!ids(r).includes('imv'));
  for (const id of ['sanidad-sin-papeles', 'alimentos', 'emergencia-social', 'justicia-gratuita']) assert.ok(ids(r).includes(id), `falta ${id}`);
  const procedure = evaluate(profile({ age: 35, householdIncome: 3000, residence: 'tramite' }));
  assert.equal(de(procedure, 'imv').status, 'quizas');
});

test('mayor de 65 que vive solo en Madrid capital', () => {
  const r = evaluate(profile({ age: 78, region: 'madrid', madridCity: true, adults: 1, pension: 'jubilacion', pensionMonthly: 800 }));
  for (const id of ['teleasistencia-madrid', 'transporte-madrid', 'soledad', 'copago-farmaceutico', 'complemento-minimos']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.equal(de(r, 'transporte-madrid').payment.text, 'Gratis');
});

// ── Vigilancia del BOE ───────────────────────────────────────────────────
import { search } from '../../scripts/watch/boe.mjs';

test('BOE: encuentra la revalorización de pensiones y el SMI, con item suelto o en lista', () => {
  const sumario = {
    data: { sumario: { diario: [{ seccion: [
      { code: '1', name: 'I. Disposiciones generales', departamento: [
        { name: 'MINISTERIO DE INCLUSIÓN', epigrafe: [{ name: 'Pensiones', item: { identificador: 'BOE-A-2026-1', title: 'Real Decreto 1/2026, sobre revalorización de las pensiones', url_html: 'https://www.boe.es/1' } }] },
        { name: 'MINISTERIO DE TRABAJO', epigrafe: [{ name: 'SMI', item: [{ identificador: 'BOE-A-2026-2', title: 'Real Decreto por el que se fija el salario mínimo interprofesional para 2027', url_html: 'https://www.boe.es/2' }] }] },
      ] },
      { code: '2B', name: 'Oposiciones', departamento: [{ name: 'X', epigrafe: [{ item: { identificador: 'BOE-A-2026-3', title: 'Pensiones: plazas de funcionario', url_html: '' } }] }] },
    ] }] } },
  };
  const r = search(sumario);
  assert.deepEqual(r.map((x) => x.topic), ['Pensiones', 'Salario mínimo']);
  assert.deepEqual(search({}), []);
});

test('teléfonos y pasos por comunidad existen', () => {
  for (const [id, t] of Object.entries(PROCEDURES)) {
    for (const list of Object.values(t.phonesByRegion ?? {})) for (const k of list) assert.ok(PHONES[k], `teléfono ${k} en ${id}`);
    for (const list of Object.values(t.documentsByRegion ?? {})) for (const d of list) assert.ok(DOCUMENTS[d], `papel ${d} en ${id}`);
  }
  assert.match(procedureOf('renta-minima', 'cataluna').steps.join(' '), /Renda Garantida/);
  assert.match(procedureOf('dependencia-valoracion', 'andalucia').steps.join(' '), /Junta de Andalucía/);
  assert.match(procedureOf('renta-minima', 'galicia').steps.join(' '), /servicios sociales/);
});

// ── Gráficos ─────────────────────────────────────────────────────────────
import { thresholdOf, estimatedMoney } from '../../site/assets/js/lib/rules.js';

test('barra de umbral: tus ingresos frente al límite', () => {
  const u = thresholdOf('imv', profile({ adults: 2, children: { age6to17: 2 }, householdIncome: 9000 }));
  assert.equal(u.yours, 9000);
  assert.equal(u.limit, 1393.84 * 12);
  assert.equal(thresholdOf('imv', profile({})), null);
  const pension = thresholdOf('complemento-minimos', profile({ age: 70, pension: 'jubilacion', pensionMonthly: 800 }));
  assert.equal(pension.limit, 936.2);
});

test('dinero estimado: suma lo compatible y descuenta del IMV el subsidio', () => {
  const r = evaluate(profile({ age: 30, situation: 'paro-sin', ownIncome: 0, householdIncome: 0, adults: 1, children: { under3: 1 }, singleParent: true, contributedOneYear: false }));
  const d = estimatedMoney(r);
  const imv = d.parts.find((x) => x.id === 'imv').monthly;
  const grossImv = r.find((x) => x.id === 'imv').payment.monthly;
  assert.equal(Math.round((grossImv - 570) * 100) / 100, imv);
  assert.ok(d.parts.some((x) => x.id === 'capi'));
  assert.equal(d.yearly, 50, 'solo el bono térmico: sin trabajo, la deducción por maternidad no suma');
});
