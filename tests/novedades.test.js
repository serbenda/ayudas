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
