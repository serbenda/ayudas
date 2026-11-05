import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, emptyProfile } from '../../site/assets/js/lib/rules.js';
import { REGIONS, BY_ID } from '../../site/assets/js/data/benefits.js';
import { procedureOf } from '../../site/assets/js/data/procedures.js';
import { MINIMUM_INCOME, benefitsOf } from '../../site/assets/js/data/regions.js';
import { SHAPES, CENTRES } from '../../site/assets/js/data/map-shapes.js';
import { calendar, remindersFor } from '../../site/assets/js/lib/reminders.js';
import { toLink, fromLink } from '../../site/assets/js/lib/answers-link.js';
import { regionPanel } from '../../site/assets/js/ui/region-panel.js';

const profile = (c) => ({ ...emptyProfile(), ...c });
const ids = (p) => evaluate(profile(p)).map((r) => r.id);

test('every region has its map shape, its minimum income and its steps', () => {
  for (const c of REGIONS) {
    assert.ok(SHAPES[c.id] && CENTRES[c.id], `${c.id} missing from the map`);
    assert.ok(MINIMUM_INCOME[c.id]?.name && /^https:\/\//.test(MINIMUM_INCOME[c.id].website), `missing minimum income for ${c.id}`);
    const steps = procedureOf('renta-minima', c.id).steps;
    assert.ok(steps.length >= 2, `too few steps in ${c.id}`);
    if (c.id !== 'madrid') assert.notDeepEqual(steps, procedureOf('renta-minima', null).steps, `${c.id} has no own steps`);
    for (const id of [...benefitsOf(c.id).common, ...benefitsOf(c.id).own, ...benefitsOf(c.id).capital]) assert.ok(BY_ID[id], `${id} no existe`);
    assert.match(regionPanel(c.id), new RegExp(MINIMUM_INCOME[c.id].name.replace(/[()]/g, '\\$&')));
  }
});

test("Madrid shows its own benefits and the capital's", () => {
  const m = benefitsOf('madrid');
  assert.ok(m.own.includes('rmi-madrid') && m.capital.includes('tarjeta-familias'));
  assert.ok(!m.common.includes('renta-minima'));
  assert.ok(benefitsOf('galicia').own.includes('tarxeta-benvida'));
  assert.equal(benefitsOf('ceuta').own.length, 0);
});

test('new benefits: self-employed, returnees, housing and health', () => {
  assert.ok(ids({ startingBusiness: true }).includes('tarifa-plana-autonomos'));
  assert.ok(!ids({}).includes('tarifa-plana-autonomos'));
  assert.ok(ids({ situation: 'autonomo' }).includes('cese-actividad'));
  assert.ok(ids({ returnee: true, ownIncome: 3000 }).includes('subsidio-retornados'));
  assert.ok(!ids({ returnee: true, ownIncome: 20000 }).includes('subsidio-retornados'));
  assert.ok(ids({ age: 30, housing: 'alquiler' }).includes('aval-ico-vivienda'));
  assert.ok(!ids({ age: 50, housing: 'alquiler' }).includes('aval-ico-vivienda'));
  assert.ok(!ids({ age: 30, housing: 'propia' }).includes('aval-ico-vivienda'));
  assert.ok(ids({ disability: '33' }).includes('ortoprotesica'));
  for (const id of ['tarifa-plana-autonomos', 'cese-actividad', 'subsidio-retornados', 'aval-ico-vivienda', 'ortoprotesica']) assert.ok(procedureOf(id, null).steps.length >= 3, id);
});

test('.ics reminders: valid, with the next date and only the relevant ones', () => {
  const today = new Date(2026, 10, 5);
  assert.deepEqual(remindersFor([]).map((r) => r.id), ['revisar']);
  assert.ok(remindersFor(['pnc-jubilacion']).some((r) => r.id === 'pnc'));
  const ics = calendar(['pnc-jubilacion', 'bono-social'], today);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270115/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270301/);
  assert.match(ics, /DTSTART;VALUE=DATE:20280905/);
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 3);
  for (const line of ics.split('\r\n')) assert.ok(line.length <= 75, line);
});

test('answers link: round trip, and rejects anything odd', () => {
  const data = { age: '72', region: 'galicia', widowed: true, 'contributedOneYear': 'si', empty: '', no: false };
  assert.deepEqual(fromLink(toLink(data)), { age: '72', region: 'galicia', widowed: true, 'contributedOneYear': 'si' });
  assert.equal(fromLink('esto no es base64 ¿'), null);
  assert.equal(fromLink(toLink({ a: 1 }).slice(0, 3)), null);
  assert.deepEqual(fromLink(Buffer.from(JSON.stringify({ '<x>': 'y', ok: { a: 1 } })).toString('base64url')), {});
});

test('every region has its income amount, its deductions and who assesses dependency', async () => {
  const { minimumIncomeAmount } = await import('../../site/assets/js/data/regions.js');
  const { deductionsOf } = await import('../../site/assets/js/data/deductions.js');
  for (const c of REGIONS) {
    assert.match(minimumIncomeAmount(c.id) ?? '', /Hasta [\d.,]+ € al mes/, `amount for ${c.id}`);
    if (!['ceuta', 'melilla'].includes(c.id)) assert.ok(deductionsOf(c.id), `deductions for ${c.id}`);
    if (c.id !== 'madrid') {
      assert.notDeepEqual(procedureOf('dependencia-valoracion', c.id).steps, procedureOf('dependencia-valoracion', null).steps, `dependency in ${c.id}`);
      assert.notDeepEqual(procedureOf('certificado-discapacidad', c.id).steps, procedureOf('certificado-discapacidad', null).steps, `disability in ${c.id}`);
    }
  }
  assert.ok(deductionsOf('navarra').foral);
  assert.ok(procedureOf('renta-minima', 'galicia').phones.includes('galicia'));
});

test('large city benefits: only if you live there', () => {
  const children = { children: { under3: 0, age3to5: 1, age6to17: 0 } };
  assert.ok(ids({ region: 'cataluna', city: 'barcelona', ...children }).includes('fons-infancia-barcelona'));
  assert.ok(!ids({ region: 'cataluna', city: null, ...children }).includes('fons-infancia-barcelona'));
  assert.ok(ids({ region: 'valencia', city: 'valencia', baby: true }).includes('natalidad-valencia'));
  assert.ok(ids({ region: 'aragon', city: 'zaragoza', situation: 'paro-sin' }).includes('urgencia-zaragoza'));
  assert.ok(ids({ region: 'andalucia', city: 'malaga', ...children }).includes('nos-cuidamos-malaga'));
  assert.ok(ids({ region: 'pais-vasco', situation: 'paro-sin' }).includes('aes-euskadi'));
  assert.ok(!ids({ region: 'galicia', situation: 'paro-sin' }).includes('aes-euskadi'));
});

test('guides in other languages: complete and with the same sections', async () => {
  const { LANGUAGES } = await import('../../scripts/build/languages.mjs');
  const keys = Object.keys(LANGUAGES.en).sort();
  for (const [code, t] of Object.entries(LANGUAGES)) {
    assert.deepEqual(Object.keys(t).sort(), keys, code);
    assert.equal(t.steps.length, 3, code);
    assert.ok(t.benefits.length >= 9, code);
    for (const k of ['112', '016', '024', 'redCross']) assert.ok(t.tel[k], `${code} ${k}`);
    assert.ok(!/undefined|NaN/.test(JSON.stringify(t)), code);
  }
  assert.deepEqual(Object.keys(LANGUAGES), ['ca', 'va', 'gl', 'eu', 'en']);
  assert.match(LANGUAGES.va.benefits.map(([n]) => n).join(), /Renta Valenciana/);
});

test('voice: picks the most human one in each browser and reads sentence by sentence', async () => {
  const { bestVoice, sentences, score } = await import('../../site/assets/js/lib/voice.js');
  const v = (name, lang, extra = {}) => ({ name, lang, voiceURI: name, ...extra });
  const edge = [v('Microsoft Helena - Spanish (Spain)', 'es-ES', { default: true }), v('Microsoft Elvira Online (Natural) - Spanish (Spain)', 'es-ES'), v('Microsoft Sonia Online (Natural) - English (United Kingdom)', 'en-GB')];
  assert.match(bestVoice(edge, 'es').name, /Elvira/);
  assert.match(bestVoice(edge, 'en').name, /Sonia/);
  const apple = [v('Eddy (Spanish (Spain))', 'es-ES'), v('Mónica', 'es-ES'), v('Mónica (Mejorada)', 'es-ES'), v('Jorge', 'es-ES')];
  assert.equal(bestVoice(apple, 'es').name, 'Mónica (Mejorada)');
  const chrome = [v('Google español', 'es-ES'), v('Google español de Estados Unidos', 'es-US'), v('eSpeak Spanish', 'es')];
  assert.equal(bestVoice(chrome, 'es').name, 'Google español');
  assert.equal(bestVoice(chrome, 'ar'), null);
  assert.equal(score(v('Google UK English Female', 'en-GB'), 'es'), -Infinity);
  assert.deepEqual(sentences('Hola. ¿Qué tal? Bien:  vale'), ['Hola.', '¿Qué tal?', 'Bien:', 'vale']);
  assert.deepEqual(sentences('Cuesta 1.221 € al mes.'), ['Cuesta 1.221 € al mes.']);
});

test('difficult words: marked once, as whole words and never inside a web address', async () => {
  const { markTerms, termsIn, GLOSSARY } = await import('../../site/assets/js/data/guide.js');
  const used = new Set();
  const html = markTerms('El IPREM y otra vez el IPREM. Entra en imv.seg-social.es para pedir el IMV.', used);
  assert.equal(html.match(/data-term="IPREM"/g).length, 1);
  assert.equal(html.match(/data-term="IMV"/g).length, 1);
  assert.ok(html.includes('imv.seg-social.es'));
  assert.equal(markTerms('Más IPREM.', used), 'Más IPREM.', 'already marked in the same card');
  assert.deepEqual(termsIn('empadronados'), [], 'not inside another word');
  for (const [k, d] of Object.entries(GLOSSARY)) assert.ok(d.length > 15 && d.length < 260 && /\.$/.test(d), `explanation for ${k}`);
});

test('regional benefits: card, rule, steps and only shown there', async () => {
  const { REGIONAL_BENEFITS } = await import('../../site/assets/js/data/regional-benefits.js');
  const common = new Set(['madrid', 'ceuta', 'melilla']);
  const withOwn = new Set(REGIONAL_BENEFITS.map((a) => a.region));
  for (const c of REGIONS) if (!common.has(c.id)) assert.ok(withOwn.has(c.id), `${c.id} has no own benefits`);
  const familia = { baby: true, children: { under3: 1, age3to5: 0, age6to17: 1 }, largeFamily: 'especial', singleParent: true, pension: 'pnc', situation: 'cuenta-ajena', householdIncome: 20000 };
  for (const a of REGIONAL_BENEFITS) {
    assert.ok(BY_ID[a.id] && procedureOf(a.id, a.region).steps.length >= 2, a.id);
    assert.ok(/^https:\/\//.test(a.link.url), a.id);
    const other = a.region === 'galicia' ? 'rioja' : 'galicia';
    assert.ok(!ids({ ...familia, region: other }).includes(a.id), `${a.id} must not show in ${other}`);
  }
  assert.ok(ids({ ...familia, region: 'galicia' }).includes('tarxeta-benvida'));
  assert.ok(ids({ ...familia, region: 'pais-vasco' }).includes('ayuda-hijos-euskadi'));
  assert.ok(ids({ ...familia, region: 'canarias' }).includes('complemento-pnc-canarias'));
  assert.ok(ids({ ...familia, region: 'murcia' }).includes('familias-especiales-murcia'));
});

test('watchers: cards to review, calls and the minimum wage from the BOE', async () => {
  const { toReview, CHECK_ON } = await import('../../site/assets/js/data/review.js');
  const { WATCHLIST, inRegion } = await import('../../scripts/watch/calls.mjs');
  const { smiFromText } = await import('../../scripts/watch/january.mjs');
  assert.deepEqual(toReview(['imv'], new Date(2026, 10, 5)), []);
  assert.match(toReview(['imv'], new Date(2027, 11, 1))[0].reason, /meses sin revisar/);
  assert.match(toReview(['xec-cangur'], new Date(2027, 5, 2))[0].reason, /toca mirar/);
  for (const id of Object.keys(CHECK_ON)) assert.ok(BY_ID[id], id);
  for (const [, , id] of WATCHLIST) assert.ok(BY_ID[id], id);
  const resp = { content: [{ descripcion: 'Tarxeta Benvida 2027', nivel1: 'AUTONOMICA', nivel2: 'GALICIA' }, { descripcion: 'Otra', nivel2: 'ARAGÓN' }] };
  assert.equal(inRegion(resp, 'GALICIA').length, 1);
  assert.equal(inRegion(resp, 'ARAGON').length, 1, 'without accents');
  assert.equal(inRegion({}, 'GALICIA').length, 0);
  assert.equal(smiFromText('el salario mínimo queda fijado en 1.260,50 euros/mes'), 1260.5);
  assert.equal(smiFromText('sin cifras'), null);
});
