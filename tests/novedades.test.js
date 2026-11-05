import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluar, perfilVacio } from '../assets/js/reglas.js';
import { COMUNIDADES, POR_ID } from '../assets/js/ayudas.js';
import { tramiteDe } from '../assets/js/tramites.js';
import { RENTA_CCAA, ayudasDe } from '../assets/js/comunidades.js';
import { CAMINOS, CENTROS } from '../assets/js/mapa-datos.js';
import { calendario, recordatoriosPara } from '../assets/js/recordatorios.js';
import { aEnlace, deEnlace } from '../assets/js/enlace.js';
import { panelDe } from '../assets/js/panel-ccaa.js';

const perfil = (c) => ({ ...perfilVacio(), ...c });
const ids = (p) => evaluar(perfil(p)).map((r) => r.id);

test('cada comunidad tiene su forma en el mapa, su renta mínima y sus pasos', () => {
  for (const c of COMUNIDADES) {
    assert.ok(CAMINOS[c.id] && CENTROS[c.id], `falta ${c.id} en el mapa`);
    assert.ok(RENTA_CCAA[c.id]?.nombre && /^https:\/\//.test(RENTA_CCAA[c.id].sede), `falta la renta de ${c.id}`);
    const pasos = tramiteDe('renta-minima', c.id).pasos;
    assert.ok(pasos.length >= 2, `pocos pasos en ${c.id}`);
    if (c.id !== 'madrid') assert.notDeepEqual(pasos, tramiteDe('renta-minima', null).pasos, `${c.id} sin pasos propios`);
    for (const id of [...ayudasDe(c.id).comunes, ...ayudasDe(c.id).propias, ...ayudasDe(c.id).capital]) assert.ok(POR_ID[id], `${id} no existe`);
    assert.match(panelDe(c.id), new RegExp(RENTA_CCAA[c.id].nombre.replace(/[()]/g, '\\$&')));
  }
});

test('Madrid enseña sus ayudas propias y las de la capital', () => {
  const m = ayudasDe('madrid');
  assert.ok(m.propias.includes('rmi-madrid') && m.capital.includes('tarjeta-familias'));
  assert.ok(!m.comunes.includes('renta-minima'));
  assert.equal(ayudasDe('galicia').propias.length, 0);
});

test('nuevas ayudas: autónomos, retornados, vivienda y salud', () => {
  assert.ok(ids({ emprender: true }).includes('tarifa-plana-autonomos'));
  assert.ok(!ids({}).includes('tarifa-plana-autonomos'));
  assert.ok(ids({ situacion: 'autonomo' }).includes('cese-actividad'));
  assert.ok(ids({ retornado: true, ingresosPropios: 3000 }).includes('subsidio-retornados'));
  assert.ok(!ids({ retornado: true, ingresosPropios: 20000 }).includes('subsidio-retornados'));
  assert.ok(ids({ edad: 30, vivienda: 'alquiler' }).includes('aval-ico-vivienda'));
  assert.ok(!ids({ edad: 50, vivienda: 'alquiler' }).includes('aval-ico-vivienda'));
  assert.ok(!ids({ edad: 30, vivienda: 'propia' }).includes('aval-ico-vivienda'));
  assert.ok(ids({ discapacidad: '33' }).includes('ortoprotesica'));
  for (const id of ['tarifa-plana-autonomos', 'cese-actividad', 'subsidio-retornados', 'aval-ico-vivienda', 'ortoprotesica']) assert.ok(tramiteDe(id, null).pasos.length >= 3, id);
});

test('recordatorios .ics: válido, con la fecha siguiente y solo los que tocan', () => {
  const hoy = new Date(2026, 10, 5);
  assert.deepEqual(recordatoriosPara([]).map((r) => r.id), ['revisar']);
  assert.ok(recordatoriosPara(['pnc-jubilacion']).some((r) => r.id === 'pnc'));
  const ics = calendario(['pnc-jubilacion', 'bono-social'], hoy);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270115/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270301/);
  assert.match(ics, /DTSTART;VALUE=DATE:20280905/);
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 3);
  for (const linea of ics.split('\r\n')) assert.ok(linea.length <= 75, linea);
});

test('enlace con respuestas: ida y vuelta, y rechaza lo raro', () => {
  const datos = { edad: '72', ccaa: 'galicia', viudo: true, 'cotizadoUnAño': 'si', vacio: '', no: false };
  assert.deepEqual(deEnlace(aEnlace(datos)), { edad: '72', ccaa: 'galicia', viudo: true, 'cotizadoUnAño': 'si' });
  assert.equal(deEnlace('esto no es base64 ¿'), null);
  assert.equal(deEnlace(aEnlace({ a: 1 }).slice(0, 3)), null);
  assert.deepEqual(deEnlace(Buffer.from(JSON.stringify({ '<x>': 'y', ok: { a: 1 } })).toString('base64url')), {});
});

test('cada comunidad tiene cuánto da su renta, sus deducciones y quién valora la dependencia', async () => {
  const { cuantiaRenta } = await import('../assets/js/comunidades.js');
  const { deduccionesDe } = await import('../assets/js/deducciones.js');
  for (const c of COMUNIDADES) {
    assert.match(cuantiaRenta(c.id) ?? '', /Hasta [\d.,]+ € al mes/, `cuantía de ${c.id}`);
    if (!['ceuta', 'melilla'].includes(c.id)) assert.ok(deduccionesDe(c.id), `deducciones de ${c.id}`);
    if (c.id !== 'madrid') {
      assert.notDeepEqual(tramiteDe('dependencia-valoracion', c.id).pasos, tramiteDe('dependencia-valoracion', null).pasos, `dependencia en ${c.id}`);
      assert.notDeepEqual(tramiteDe('certificado-discapacidad', c.id).pasos, tramiteDe('certificado-discapacidad', null).pasos, `discapacidad en ${c.id}`);
    }
  }
  assert.ok(deduccionesDe('navarra').foral);
  assert.ok(tramiteDe('renta-minima', 'galicia').telefonos.includes('galicia'));
});

test('ayudas de grandes ciudades: solo si vives allí', () => {
  const hijos = { hijos: { menor3: 0, de3a5: 1, de6a17: 0 } };
  assert.ok(ids({ ccaa: 'cataluna', ciudad: 'barcelona', ...hijos }).includes('fons-infancia-barcelona'));
  assert.ok(!ids({ ccaa: 'cataluna', ciudad: null, ...hijos }).includes('fons-infancia-barcelona'));
  assert.ok(ids({ ccaa: 'valencia', ciudad: 'valencia', bebe: true }).includes('natalidad-valencia'));
  assert.ok(ids({ ccaa: 'aragon', ciudad: 'zaragoza', situacion: 'paro-sin' }).includes('urgencia-zaragoza'));
  assert.ok(ids({ ccaa: 'andalucia', ciudad: 'malaga', ...hijos }).includes('nos-cuidamos-malaga'));
  assert.ok(ids({ ccaa: 'pais-vasco', situacion: 'paro-sin' }).includes('aes-euskadi'));
  assert.ok(!ids({ ccaa: 'galicia', situacion: 'paro-sin' }).includes('aes-euskadi'));
});

test('guías en otros idiomas: completas y con los mismos apartados', async () => {
  const { IDIOMAS } = await import('../scripts/idiomas.mjs');
  const claves = Object.keys(IDIOMAS.en).sort();
  for (const [codigo, t] of Object.entries(IDIOMAS)) {
    assert.deepEqual(Object.keys(t).sort(), claves, codigo);
    assert.equal(t.pasos.length, 3, codigo);
    assert.ok(t.ayudas.length >= 9, codigo);
    for (const k of ['112', '016', '024', 'cruz']) assert.ok(t.tel[k], `${codigo} ${k}`);
    assert.ok(!/undefined|NaN/.test(JSON.stringify(t)), codigo);
  }
  assert.deepEqual(Object.keys(IDIOMAS), ['ca', 'va', 'gl', 'eu', 'en']);
  assert.match(IDIOMAS.va.ayudas.map(([n]) => n).join(), /Renta Valenciana/);
});

test('voz: elige la más humana de cada navegador y lee frase a frase', async () => {
  const { mejorVoz, frases, puntuar } = await import('../assets/js/voz.js');
  const v = (name, lang, extra = {}) => ({ name, lang, voiceURI: name, ...extra });
  const edge = [v('Microsoft Helena - Spanish (Spain)', 'es-ES', { default: true }), v('Microsoft Elvira Online (Natural) - Spanish (Spain)', 'es-ES'), v('Microsoft Sonia Online (Natural) - English (United Kingdom)', 'en-GB')];
  assert.match(mejorVoz(edge, 'es').name, /Elvira/);
  assert.match(mejorVoz(edge, 'en').name, /Sonia/);
  const apple = [v('Eddy (Spanish (Spain))', 'es-ES'), v('Mónica', 'es-ES'), v('Mónica (Mejorada)', 'es-ES'), v('Jorge', 'es-ES')];
  assert.equal(mejorVoz(apple, 'es').name, 'Mónica (Mejorada)');
  const chrome = [v('Google español', 'es-ES'), v('Google español de Estados Unidos', 'es-US'), v('eSpeak Spanish', 'es')];
  assert.equal(mejorVoz(chrome, 'es').name, 'Google español');
  assert.equal(mejorVoz(chrome, 'ar'), null);
  assert.equal(puntuar(v('Google UK English Female', 'en-GB'), 'es'), -Infinity);
  assert.deepEqual(frases('Hola. ¿Qué tal? Bien:  vale'), ['Hola.', '¿Qué tal?', 'Bien:', 'vale']);
  assert.deepEqual(frases('Cuesta 1.221 € al mes.'), ['Cuesta 1.221 € al mes.']);
});

test('palabras difíciles: se marcan una vez, enteras y nunca dentro de una web', async () => {
  const { marcarTerminos, terminosEn, GLOSARIO } = await import('../assets/js/guia.js');
  const usados = new Set();
  const html = marcarTerminos('El IPREM y otra vez el IPREM. Entra en imv.seg-social.es para pedir el IMV.', usados);
  assert.equal(html.match(/data-termino="IPREM"/g).length, 1);
  assert.equal(html.match(/data-termino="IMV"/g).length, 1);
  assert.ok(html.includes('imv.seg-social.es'));
  assert.equal(marcarTerminos('Más IPREM.', usados), 'Más IPREM.', 'ya marcado en la misma ficha');
  assert.deepEqual(terminosEn('empadronados'), [], 'no dentro de otra palabra');
  for (const [k, d] of Object.entries(GLOSARIO)) assert.ok(d.length > 15 && d.length < 260 && /\.$/.test(d), `explicación de ${k}`);
});
