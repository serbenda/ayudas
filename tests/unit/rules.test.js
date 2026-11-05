import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, guaranteedIncome, socialDiscountLimit, minimumPension, emptyProfile, IDS_WITH_RULE } from '../../site/assets/js/lib/rules.js';
import { BENEFITS, BY_ID, REGIONS, linkOf } from '../../site/assets/js/data/benefits.js';
import { parseNumber, euros } from '../../site/assets/js/lib/format.js';

const profile = (changes) => ({ ...emptyProfile(), ...changes, children: { ...emptyProfile().children, ...(changes.children ?? {}) } });
const ids = (r) => r.map((x) => x.id);
const de = (r, id) => r.find((x) => x.id === id);

test('every rule has its card in the catalogue, with a link', () => {
  for (const id of IDS_WITH_RULE) assert.ok(BY_ID[id], `missing card for ${id}`);
  for (const a of BENEFITS) {
    assert.ok(a.name && a.summary && a.amount && a.requirements.length, `incomplete card: ${a.id}`);
    assert.ok(a.link.region || /^https:\/\//.test(a.link.url), `odd link in ${a.id}`);
  }
  assert.equal(new Set(BENEFITS.map((a) => a.id)).size, BENEFITS.length, 'duplicate ids');
});

test("regionally managed benefits link to your region's website", () => {
  const a = BY_ID['dependencia-valoracion'];
  assert.equal(linkOf(a, 'madrid').url, 'https://www.comunidad.madrid/');
  assert.equal(linkOf(a, null).url, null);
  assert.equal(REGIONS.length, 19);
});

test('with no answers nothing comes up as certain', () => {
  const r = evaluate({});
  assert.ok(r.every((x) => x.status !== 'si'), ids(r.filter((x) => x.status === 'si')).join());
});

test('IMV guaranteed income by household', () => {
  assert.equal(guaranteedIncome(profile({})), 733.6);
  assert.equal(guaranteedIncome(profile({ adults: 2 })), 953.68);
  assert.equal(guaranteedIncome(profile({ adults: 2, children: { age6to17: 2 } })), 1393.84);
  assert.equal(guaranteedIncome(profile({ adults: 2, children: { age6to17: 5 } })), 1613.92);
  // single-parent: +22 % of the base
  assert.equal(guaranteedIncome(profile({ children: { under3: 1 }, singleParent: true })), Math.round((733.6 * 1.3 + 733.6 * 0.22) * 100) / 100);
});

test('IMV: a low-income household gets the difference', () => {
  const r = evaluate(profile({ age: 35, adults: 2, children: { age6to17: 2 }, householdIncome: 690 * 12 }));
  const imv = de(r, 'imv');
  assert.equal(imv.status, 'si');
  assert.equal(imv.payment.monthly, 703.84);
  assert.equal(de(r, 'capi').status, 'si');
  assert.equal(de(r, 'capi').payment.monthly, 115);
  assert.equal(de(r, 'bono-social').status, 'si');
});

test('IMV: not shown with high income; nor is CAPI', () => {
  const r = evaluate(profile({ age: 40, adults: 2, children: { under3: 1 }, householdIncome: 60000 }));
  assert.ok(!ids(r).includes('imv'));
  assert.ok(!ids(r).includes('capi'));
  assert.ok(!ids(r).includes('bono-social'));
});

test('IMV: not shown for under-23s without children, nor for retirees', () => {
  assert.ok(!ids(evaluate(profile({ age: 20, householdIncome: 0 }))).includes('imv'));
  assert.ok(!ids(evaluate(profile({ age: 70, pension: 'jubilacion', pensionMonthly: 700, householdIncome: 9800 }))).includes('imv'));
});

test('non-contributory pension for an older person with no pension or income', () => {
  const r = evaluate(profile({ age: 70, pension: 'no', ownIncome: 0, housing: 'alquiler' }));
  const pnc = de(r, 'pnc-jubilacion');
  assert.equal(pnc.status, 'si');
  assert.equal(pnc.payment.monthly, 628.8);
  assert.equal(de(r, 'pnc-alquiler').payment.yearly, 525);
  assert.ok(ids(r).includes('imserso-viajes'));
  assert.ok(ids(r).includes('servicios-mayores'));
});

test('minimum pension supplement and gender gap supplement', () => {
  const r = evaluate(profile({ age: 68, pension: 'jubilacion', pensionMonthly: 800, pensionSince2021: true, childrenBorn: 2 }));
  assert.equal(de(r, 'complemento-minimos').status, 'si');
  assert.equal(de(r, 'complemento-minimos').payment.monthly, 136.2);
  assert.equal(de(r, 'brecha-genero').payment.monthly, 73.8);
  assert.deepEqual(minimumPension(profile({ age: 68, pension: 'jubilacion' })).figure, 936.2);
  assert.deepEqual(minimumPension(profile({ age: 55, pension: 'viudedad', children: { age6to17: 1 } })).figure, 1256.6);
});

test('pension above the minimum: no supplement', () => {
  const r = evaluate(profile({ age: 68, pension: 'jubilacion', pensionMonthly: 1500, pensionSince2021: false, childrenBorn: 2 }));
  assert.ok(!ids(r).includes('complemento-minimos'));
  assert.ok(!ids(r).includes('brecha-genero'));
});

test('unemployment: general allowance and the over-52 one', () => {
  const young = evaluate(profile({ age: 30, situation: 'paro-sin', ownIncome: 0, contributedOneYear: false }));
  assert.equal(de(young, 'subsidio-desempleo').status, 'si');
  assert.ok(!ids(young).includes('paro'));
  const older = evaluate(profile({ age: 55, situation: 'paro-sin', ownIncome: 0, contributed15: true }));
  assert.equal(de(older, 'subsidio-52').status, 'si');
  assert.ok(!ids(older).includes('subsidio-desempleo'));
  const wealthy = evaluate(profile({ age: 30, situation: 'paro-sin', ownIncome: 20000 }));
  assert.ok(!ids(wealthy).includes('subsidio-desempleo'));
});

test('family with a baby in the Community of Madrid', () => {
  const r = evaluate(profile({ age: 29, region: 'madrid', situation: 'cuenta-ajena', partner: true, adults: 2, baby: true, children: { age3to5: 1, age6to17: 1 }, householdIncome: 30000 }));
  for (const id of ['nacimiento', 'pago-unico-nacimiento', 'madrid-natalidad', 'deduccion-maternidad', 'titulo-familia-numerosa', 'capi']) assert.ok(ids(r).includes(id), `missing ${id}`);
  assert.equal(de(r, 'nacimiento').status, 'si');
  assert.ok(!ids(evaluate(profile({ region: 'galicia', baby: true }))).includes('madrid-natalidad'));
});

test('large family: deduction and direct social discount', () => {
  const r = evaluate(profile({ situation: 'cuenta-ajena', adults: 2, children: { age6to17: 4 }, largeFamily: 'general', householdIncome: 70000 }));
  assert.equal(de(r, 'deduccion-familia-numerosa').payment.yearly, 1800);
  assert.equal(de(r, 'bono-social').status, 'si');
  assert.ok(!ids(r).includes('titulo-familia-numerosa'));
});

test('caring for a parent with dependency and disability', () => {
  const r = evaluate(profile({ age: 50, situation: 'cuenta-ajena', caredFor: [{ relationship: 'padre', age: 82, disability: '65', dependency: '2', livesWith: true, iCare: true }] }));
  for (const id of ['dependencia-servicios', 'dependencia-prestacion', 'convenio-cuidadores', 'deduccion-discapacidad-cargo', 'ventajas-discapacidad', 'servicios-mayores']) assert.ok(ids(r).includes(id), `missing ${id}`);
  assert.equal(de(r, 'deduccion-discapacidad-cargo').payment.yearly, 1200);
});

test('someone who needs help without recognised dependency', () => {
  const r = evaluate(profile({ caredFor: [{ relationship: 'padre', age: 85, disability: 'sin', dependency: 'necesita', livesWith: true, iCare: true }] }));
  assert.equal(de(r, 'dependencia-valoracion').status, 'si');
  assert.equal(de(r, 'certificado-discapacidad').status, 'si');
  assert.ok(!ids(r).includes('dependencia-prestacion'));
});

test('adult child with a 65 % disability', () => {
  const r = evaluate(profile({ caredFor: [{ relationship: 'hijo', age: 25, disability: '65', dependency: 'no', livesWith: true, iCare: true }] }));
  assert.equal(de(r, 'hijo-cargo-discapacidad').status, 'si');
  assert.equal(de(r, 'hijo-cargo-discapacidad').payment.yearly, 5962.8);
});

test('social discount: limits by household', () => {
  assert.equal(socialDiscountLimit(profile({})).euros, 12600);
  assert.equal(socialDiscountLimit(profile({ children: { under3: 1 } })).euros, 16800);
  assert.equal(socialDiscountLimit(profile({ children: { under3: 1, age3to5: 1 }, singleParent: true })).euros, 25200);
  const severe = evaluate(profile({ householdIncome: 5000 }));
  assert.equal(de(severe, 'bono-social').severe, true);
  assert.equal(de(severe, 'bono-termico').status, 'si');
});

test('rent: young person with middle income and adult with low income', () => {
  const young = evaluate(profile({ age: 28, housing: 'alquiler', householdIncome: 30000 }));
  assert.ok(ids(young).includes('alquiler-joven'));
  assert.ok(!ids(young).includes('alquiler-general'));
  const adult = evaluate(profile({ age: 45, housing: 'alquiler', householdIncome: 20000 }));
  assert.ok(ids(adult).includes('alquiler-general'));
  assert.ok(!ids(evaluate(profile({ age: 28, housing: 'propia' }))).includes('alquiler-joven'));
});

test('own disability: tax reduction and non-contributory disability pension', () => {
  const r = evaluate(profile({ age: 40, disability: '65', ownIncome: 2000 }));
  assert.equal(de(r, 'minimo-discapacidad').status, 'si');
  assert.equal(de(r, 'pnc-invalidez').status, 'si');
});

test('parse numbers written the Spanish way', () => {
  assert.equal(parseNumber('1.234,5'), 1234.5);
  assert.equal(parseNumber('30.000'), 30000);
  assert.equal(parseNumber('12000'), 12000);
  assert.equal(parseNumber('800,50 €'), 800.5);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('abc'), null);
  assert.equal(euros(1200), '1.200 €');
  assert.equal(euros(628.8), '628,80 €');
});

// ── Procedures, emergencies and Madrid ─────────────────────────────────
import { PROCEDURES, procedureOf, papersFor } from '../../site/assets/js/data/procedures.js';
import { DOCUMENTS, PHONES } from '../../site/assets/js/data/guide.js';
import { whereToStart } from '../../site/assets/js/lib/rules.js';

test('every benefit explains how to apply, with documents and phone numbers that exist', () => {
  for (const a of BENEFITS) {
    const t = PROCEDURES[a.id];
    assert.ok(t, `missing procedure for ${a.id}`);
    assert.ok(t.easy?.length && t.steps?.length && t.deadline && t.response, `incomplete procedure: ${a.id}`);
    for (const d of t.documents) assert.ok(DOCUMENTS[d], `unknown document ${d} in ${a.id}`);
    for (const k of [...(t.phones ?? []), ...(t.madridPhones ?? [])]) assert.ok(PHONES[k], `unknown phone ${k} in ${a.id}`);
    // Short sentences in the easy summary: anyone should be able to read it
    for (const f of t.easy) assert.ok(f.split(' ').length <= 20, `long sentence in ${a.id}: ${f}`);
  }
});

test("in Madrid, Madrid's steps and phone numbers are shown", () => {
  assert.match(procedureOf('pnc-jubilacion', 'madrid').steps.join(' '), /sede\.comunidad\.madrid/);
  assert.ok(procedureOf('pnc-jubilacion', 'madrid').phones.includes('madridPnc'));
  assert.doesNotMatch(procedureOf('pnc-jubilacion', 'galicia').steps.join(' '), /comunidad\.madrid/);
});

test('grouped documents: those required by most benefits first', () => {
  const p = papersFor(['imv', 'capi', 'bono-social']);
  assert.equal(p[0].doc, 'dni');
  assert.deepEqual(p[0].benefits, ['imv', 'capi', 'bono-social']);
});

test('emergencies: violence, eviction and food come first', () => {
  const r = evaluate(profile({ age: 40, region: 'madrid', madridCity: true, householdIncome: 6000, urgent: { violence: true, food: true, housingAtRisk: true } }));
  const order = whereToStart(r).map((x) => x.id);
  assert.deepEqual(order.slice(0, 3), ['violencia-genero', 'desahucio', 'alimentos']);
  for (const id of ['tarjeta-familias', 'rmi-madrid', 'emergencia-social']) assert.ok(ids(r).includes(id), `missing ${id}`);
  assert.ok(!ids(r).includes('renta-minima'), 'in Madrid its RMI shows, not the generic one');
});

test('without a residence permit, benefits that require it are hidden but the rest are shown', () => {
  const r = evaluate(profile({ age: 35, householdIncome: 3000, residence: 'no', urgent: { food: true } }));
  assert.ok(!ids(r).includes('imv'));
  for (const id of ['sanidad-sin-papeles', 'alimentos', 'emergencia-social', 'justicia-gratuita']) assert.ok(ids(r).includes(id), `missing ${id}`);
  const procedure = evaluate(profile({ age: 35, householdIncome: 3000, residence: 'tramite' }));
  assert.equal(de(procedure, 'imv').status, 'quizas');
});

test('over-65 living alone in the city of Madrid', () => {
  const r = evaluate(profile({ age: 78, region: 'madrid', madridCity: true, adults: 1, pension: 'jubilacion', pensionMonthly: 800 }));
  for (const id of ['teleasistencia-madrid', 'transporte-madrid', 'soledad', 'copago-farmaceutico', 'complemento-minimos']) assert.ok(ids(r).includes(id), `missing ${id}`);
  assert.equal(de(r, 'transporte-madrid').payment.text, 'Gratis');
});

// ── BOE watch ──────────────────────────────────────────────────────────
import { search } from '../../scripts/watch/boe.mjs';

test('BOE: finds the pension increase and the minimum wage, with a single item or a list', () => {
  const summary = {
    data: { sumario: { diario: [{ seccion: [
      { codigo: '1', nombre: 'I. Disposiciones generales', departamento: [
        { nombre: 'MINISTERIO DE INCLUSIÓN', epigrafe: [{ nombre: 'Pensiones', item: { identificador: 'BOE-A-2026-1', titulo: 'Real Decreto 1/2026, sobre revalorización de las pensiones', url_html: 'https://www.boe.es/1' } }] },
        { nombre: 'MINISTERIO DE TRABAJO', epigrafe: [{ nombre: 'SMI', item: [{ identificador: 'BOE-A-2026-2', titulo: 'Real Decreto por el que se fija el salario mínimo interprofesional para 2027', url_html: 'https://www.boe.es/2' }] }] },
      ] },
      { codigo: '2B', nombre: 'Oposiciones', departamento: [{ nombre: 'X', epigrafe: [{ item: { identificador: 'BOE-A-2026-3', titulo: 'Pensiones: plazas de funcionario', url_html: '' } }] }] },
    ] }] } },
  };
  const r = search(summary);
  assert.deepEqual(r.map((x) => x.topic), ['Pensiones', 'Salario mínimo']);
  assert.deepEqual(search({}), []);
});

test('regional phone numbers and steps exist', () => {
  for (const [id, t] of Object.entries(PROCEDURES)) {
    for (const list of Object.values(t.phonesByRegion ?? {})) for (const k of list) assert.ok(PHONES[k], `phone ${k} in ${id}`);
    for (const list of Object.values(t.documentsByRegion ?? {})) for (const d of list) assert.ok(DOCUMENTS[d], `document ${d} in ${id}`);
  }
  assert.match(procedureOf('renta-minima', 'cataluna').steps.join(' '), /Renda Garantida/);
  assert.match(procedureOf('dependencia-valoracion', 'andalucia').steps.join(' '), /Junta de Andalucía/);
  assert.match(procedureOf('renta-minima', 'galicia').steps.join(' '), /servicios sociales/);
});

// ── Charts ─────────────────────────────────────────────────────────────
import { thresholdOf, estimatedMoney } from '../../site/assets/js/lib/rules.js';

test('threshold bar: your income against the limit', () => {
  const u = thresholdOf('imv', profile({ adults: 2, children: { age6to17: 2 }, householdIncome: 9000 }));
  assert.equal(u.yours, 9000);
  assert.equal(u.limit, 1393.84 * 12);
  assert.equal(thresholdOf('imv', profile({})), null);
  const pension = thresholdOf('complemento-minimos', profile({ age: 70, pension: 'jubilacion', pensionMonthly: 800 }));
  assert.equal(pension.limit, 936.2);
});

test('estimated money: adds compatible benefits and deducts the allowance from the IMV', () => {
  const r = evaluate(profile({ age: 30, situation: 'paro-sin', ownIncome: 0, householdIncome: 0, adults: 1, children: { under3: 1 }, singleParent: true, contributedOneYear: false }));
  const d = estimatedMoney(r);
  const imv = d.parts.find((x) => x.id === 'imv').monthly;
  const grossImv = r.find((x) => x.id === 'imv').payment.monthly;
  assert.equal(Math.round((grossImv - 570) * 100) / 100, imv);
  assert.ok(d.parts.some((x) => x.id === 'capi'));
  assert.equal(d.yearly, 50, 'only the thermal discount: without work, the maternity deduction does not add up');
});
