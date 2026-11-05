import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluar, rentaGarantizada, limiteBonoSocial, pensionMinima, perfilVacio, IDS_CON_REGLA } from '../assets/js/reglas.js';
import { AYUDAS, POR_ID, COMUNIDADES, enlaceDe } from '../assets/js/ayudas.js';
import { leerNumero, euros } from '../assets/js/formato.js';

const perfil = (cambios) => ({ ...perfilVacio(), ...cambios, hijos: { ...perfilVacio().hijos, ...(cambios.hijos ?? {}) } });
const ids = (r) => r.map((x) => x.id);
const de = (r, id) => r.find((x) => x.id === id);

test('cada regla tiene su ficha en el catálogo, con enlace', () => {
  for (const id of IDS_CON_REGLA) assert.ok(POR_ID[id], `falta la ficha de ${id}`);
  for (const a of AYUDAS) {
    assert.ok(a.nombre && a.resumen && a.cuantia && a.requisitos.length, `ficha incompleta: ${a.id}`);
    assert.ok(a.enlace.ccaa || /^https:\/\//.test(a.enlace.url), `enlace raro en ${a.id}`);
  }
  assert.equal(new Set(AYUDAS.map((a) => a.id)).size, AYUDAS.length, 'ids repetidos');
});

test('el enlace de las ayudas autonómicas lleva a la web de tu comunidad', () => {
  const a = POR_ID['dependencia-valoracion'];
  assert.equal(enlaceDe(a, 'madrid').url, 'https://www.comunidad.madrid/');
  assert.equal(enlaceDe(a, null).url, null);
  assert.equal(COMUNIDADES.length, 19);
});

test('sin contestar nada no sale nada «seguro»', () => {
  const r = evaluar({});
  assert.ok(r.every((x) => x.estado !== 'si'), ids(r.filter((x) => x.estado === 'si')).join());
});

test('renta garantizada del IMV según el hogar', () => {
  assert.equal(rentaGarantizada(perfil({})), 733.6);
  assert.equal(rentaGarantizada(perfil({ adultos: 2 })), 953.68);
  assert.equal(rentaGarantizada(perfil({ adultos: 2, hijos: { de6a17: 2 } })), 1393.84);
  assert.equal(rentaGarantizada(perfil({ adultos: 2, hijos: { de6a17: 5 } })), 1613.92);
  // monoparental: +22 % de la base
  assert.equal(rentaGarantizada(perfil({ hijos: { menor3: 1 }, monoparental: true })), Math.round((733.6 * 1.3 + 733.6 * 0.22) * 100) / 100);
});

test('IMV: hogar con pocos ingresos cobra la diferencia', () => {
  const r = evaluar(perfil({ edad: 35, adultos: 2, hijos: { de6a17: 2 }, ingresosHogar: 690 * 12 }));
  const imv = de(r, 'imv');
  assert.equal(imv.estado, 'si');
  assert.equal(imv.importe.mes, 703.84);
  assert.equal(de(r, 'capi').estado, 'si');
  assert.equal(de(r, 'capi').importe.mes, 115);
  assert.equal(de(r, 'bono-social').estado, 'si');
});

test('IMV: con ingresos altos no sale; CAPI tampoco', () => {
  const r = evaluar(perfil({ edad: 40, adultos: 2, hijos: { menor3: 1 }, ingresosHogar: 60000 }));
  assert.ok(!ids(r).includes('imv'));
  assert.ok(!ids(r).includes('capi'));
  assert.ok(!ids(r).includes('bono-social'));
});

test('IMV: menor de 23 sin hijos no sale, y los jubilados tampoco', () => {
  assert.ok(!ids(evaluar(perfil({ edad: 20, ingresosHogar: 0 }))).includes('imv'));
  assert.ok(!ids(evaluar(perfil({ edad: 70, pension: 'jubilacion', pensionMes: 700, ingresosHogar: 9800 }))).includes('imv'));
});

test('pensión no contributiva para un mayor sin pensión ni ingresos', () => {
  const r = evaluar(perfil({ edad: 70, pension: 'no', ingresosPropios: 0, vivienda: 'alquiler' }));
  const pnc = de(r, 'pnc-jubilacion');
  assert.equal(pnc.estado, 'si');
  assert.equal(pnc.importe.mes, 628.8);
  assert.equal(de(r, 'pnc-alquiler').importe.año, 525);
  assert.ok(ids(r).includes('imserso-viajes'));
  assert.ok(ids(r).includes('servicios-mayores'));
});

test('complemento a mínimos y brecha de género', () => {
  const r = evaluar(perfil({ edad: 68, pension: 'jubilacion', pensionMes: 800, pensionDesde2021: true, hijosTenidos: 2 }));
  assert.equal(de(r, 'complemento-minimos').estado, 'si');
  assert.equal(de(r, 'complemento-minimos').importe.mes, 136.2);
  assert.equal(de(r, 'brecha-genero').importe.mes, 73.8);
  assert.deepEqual(pensionMinima(perfil({ edad: 68, pension: 'jubilacion' })).cifra, 936.2);
  assert.deepEqual(pensionMinima(perfil({ edad: 55, pension: 'viudedad', hijos: { de6a17: 1 } })).cifra, 1256.6);
});

test('pensión por encima de la mínima: sin complemento', () => {
  const r = evaluar(perfil({ edad: 68, pension: 'jubilacion', pensionMes: 1500, pensionDesde2021: false, hijosTenidos: 2 }));
  assert.ok(!ids(r).includes('complemento-minimos'));
  assert.ok(!ids(r).includes('brecha-genero'));
});

test('paro: subsidio general y de mayores de 52', () => {
  const joven = evaluar(perfil({ edad: 30, situacion: 'paro-sin', ingresosPropios: 0, cotizadoUnAño: false }));
  assert.equal(de(joven, 'subsidio-desempleo').estado, 'si');
  assert.ok(!ids(joven).includes('paro'));
  const mayor = evaluar(perfil({ edad: 55, situacion: 'paro-sin', ingresosPropios: 0, cotizado15: true }));
  assert.equal(de(mayor, 'subsidio-52').estado, 'si');
  assert.ok(!ids(mayor).includes('subsidio-desempleo'));
  const rico = evaluar(perfil({ edad: 30, situacion: 'paro-sin', ingresosPropios: 20000 }));
  assert.ok(!ids(rico).includes('subsidio-desempleo'));
});

test('familia con bebé en la Comunidad de Madrid', () => {
  const r = evaluar(perfil({ edad: 29, ccaa: 'madrid', situacion: 'cuenta-ajena', pareja: true, adultos: 2, bebe: true, hijos: { de3a5: 1, de6a17: 1 }, ingresosHogar: 30000 }));
  for (const id of ['nacimiento', 'pago-unico-nacimiento', 'madrid-natalidad', 'deduccion-maternidad', 'titulo-familia-numerosa', 'capi']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.equal(de(r, 'nacimiento').estado, 'si');
  assert.ok(!ids(evaluar(perfil({ ccaa: 'galicia', bebe: true }))).includes('madrid-natalidad'));
});

test('familia numerosa: deducción y bono social directo', () => {
  const r = evaluar(perfil({ situacion: 'cuenta-ajena', adultos: 2, hijos: { de6a17: 4 }, familiaNumerosa: 'general', ingresosHogar: 70000 }));
  assert.equal(de(r, 'deduccion-familia-numerosa').importe.año, 1800);
  assert.equal(de(r, 'bono-social').estado, 'si');
  assert.ok(!ids(r).includes('titulo-familia-numerosa'));
});

test('cuidar de un padre con dependencia y discapacidad', () => {
  const r = evaluar(perfil({ edad: 50, situacion: 'cuenta-ajena', cuidados: [{ relacion: 'padre', edad: 82, discapacidad: '65', dependencia: '2', convive: true, cuidoYo: true }] }));
  for (const id of ['dependencia-servicios', 'dependencia-prestacion', 'convenio-cuidadores', 'deduccion-discapacidad-cargo', 'ventajas-discapacidad', 'servicios-mayores']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.equal(de(r, 'deduccion-discapacidad-cargo').importe.año, 1200);
});

test('alguien que necesita ayuda sin la dependencia reconocida', () => {
  const r = evaluar(perfil({ cuidados: [{ relacion: 'padre', edad: 85, discapacidad: 'sin', dependencia: 'necesita', convive: true, cuidoYo: true }] }));
  assert.equal(de(r, 'dependencia-valoracion').estado, 'si');
  assert.equal(de(r, 'certificado-discapacidad').estado, 'si');
  assert.ok(!ids(r).includes('dependencia-prestacion'));
});

test('hijo mayor de edad con discapacidad del 65 %', () => {
  const r = evaluar(perfil({ cuidados: [{ relacion: 'hijo', edad: 25, discapacidad: '65', dependencia: 'no', convive: true, cuidoYo: true }] }));
  assert.equal(de(r, 'hijo-cargo-discapacidad').estado, 'si');
  assert.equal(de(r, 'hijo-cargo-discapacidad').importe.año, 5962.8);
});

test('bono social: límites según el hogar', () => {
  assert.equal(limiteBonoSocial(perfil({})).euros, 12600);
  assert.equal(limiteBonoSocial(perfil({ hijos: { menor3: 1 } })).euros, 16800);
  assert.equal(limiteBonoSocial(perfil({ hijos: { menor3: 1, de3a5: 1 }, monoparental: true })).euros, 25200);
  const severo = evaluar(perfil({ ingresosHogar: 5000 }));
  assert.equal(de(severo, 'bono-social').severo, true);
  assert.equal(de(severo, 'bono-termico').estado, 'si');
});

test('alquiler: joven con ingresos medios y adulto con ingresos bajos', () => {
  const joven = evaluar(perfil({ edad: 28, vivienda: 'alquiler', ingresosHogar: 30000 }));
  assert.ok(ids(joven).includes('alquiler-joven'));
  assert.ok(!ids(joven).includes('alquiler-general'));
  const adulto = evaluar(perfil({ edad: 45, vivienda: 'alquiler', ingresosHogar: 20000 }));
  assert.ok(ids(adulto).includes('alquiler-general'));
  assert.ok(!ids(evaluar(perfil({ edad: 28, vivienda: 'propia' }))).includes('alquiler-joven'));
});

test('discapacidad propia: reducción en la renta y PNC de invalidez', () => {
  const r = evaluar(perfil({ edad: 40, discapacidad: '65', ingresosPropios: 2000 }));
  assert.equal(de(r, 'minimo-discapacidad').estado, 'si');
  assert.equal(de(r, 'pnc-invalidez').estado, 'si');
});

test('leer números escritos a la española', () => {
  assert.equal(leerNumero('1.234,5'), 1234.5);
  assert.equal(leerNumero('30.000'), 30000);
  assert.equal(leerNumero('12000'), 12000);
  assert.equal(leerNumero('800,50 €'), 800.5);
  assert.equal(leerNumero(''), null);
  assert.equal(leerNumero('abc'), null);
  assert.equal(euros(1200), '1.200 €');
  assert.equal(euros(628.8), '628,80 €');
});

// ── Trámites, urgencias y Madrid ─────────────────────────────────────────
import { TRAMITES, tramiteDe, papelesPara } from '../assets/js/tramites.js';
import { DOCUMENTOS, TELEFONOS } from '../assets/js/guia.js';
import { porDondeEmpezar } from '../assets/js/reglas.js';

test('cada ayuda explica cómo se pide, con papeles y teléfonos que existen', () => {
  for (const a of AYUDAS) {
    const t = TRAMITES[a.id];
    assert.ok(t, `falta el trámite de ${a.id}`);
    assert.ok(t.facil?.length && t.pasos?.length && t.plazo && t.respuesta, `trámite incompleto: ${a.id}`);
    for (const d of t.documentos) assert.ok(DOCUMENTOS[d], `papel desconocido ${d} en ${a.id}`);
    for (const k of [...(t.telefonos ?? []), ...(t.telefonosMadrid ?? [])]) assert.ok(TELEFONOS[k], `teléfono desconocido ${k} en ${a.id}`);
    // Frases cortas en el resumen fácil: que lo pueda leer cualquiera
    for (const f of t.facil) assert.ok(f.split(' ').length <= 20, `frase larga en ${a.id}: ${f}`);
  }
});

test('en Madrid salen los pasos y teléfonos de Madrid', () => {
  assert.match(tramiteDe('pnc-jubilacion', 'madrid').pasos.join(' '), /sede\.comunidad\.madrid/);
  assert.ok(tramiteDe('pnc-jubilacion', 'madrid').telefonos.includes('madridPnc'));
  assert.doesNotMatch(tramiteDe('pnc-jubilacion', 'galicia').pasos.join(' '), /comunidad\.madrid/);
});

test('papeles agrupados: los que piden más ayudas, primero', () => {
  const p = papelesPara(['imv', 'capi', 'bono-social']);
  assert.equal(p[0].doc, 'dni');
  assert.deepEqual(p[0].ayudas, ['imv', 'capi', 'bono-social']);
});

test('urgencias: violencia, desahucio y comida salen primero', () => {
  const r = evaluar(perfil({ edad: 40, ccaa: 'madrid', madridCapital: true, ingresosHogar: 6000, urgencias: { violencia: true, comida: true, casaRiesgo: true } }));
  const orden = porDondeEmpezar(r).map((x) => x.id);
  assert.deepEqual(orden.slice(0, 3), ['violencia-genero', 'desahucio', 'alimentos']);
  for (const id of ['tarjeta-familias', 'rmi-madrid', 'emergencia-social']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.ok(!ids(r).includes('renta-minima'), 'en Madrid sale la RMI, no la genérica');
});

test('sin permiso de residencia no salen las ayudas que lo piden, pero sí las demás', () => {
  const r = evaluar(perfil({ edad: 35, ingresosHogar: 3000, residencia: 'no', urgencias: { comida: true } }));
  assert.ok(!ids(r).includes('imv'));
  for (const id of ['sanidad-sin-papeles', 'alimentos', 'emergencia-social', 'justicia-gratuita']) assert.ok(ids(r).includes(id), `falta ${id}`);
  const tramite = evaluar(perfil({ edad: 35, ingresosHogar: 3000, residencia: 'tramite' }));
  assert.equal(de(tramite, 'imv').estado, 'quizas');
});

test('mayor de 65 que vive solo en Madrid capital', () => {
  const r = evaluar(perfil({ edad: 78, ccaa: 'madrid', madridCapital: true, adultos: 1, pension: 'jubilacion', pensionMes: 800 }));
  for (const id of ['teleasistencia-madrid', 'transporte-madrid', 'soledad', 'copago-farmaceutico', 'complemento-minimos']) assert.ok(ids(r).includes(id), `falta ${id}`);
  assert.equal(de(r, 'transporte-madrid').importe.texto, 'Gratis');
});

// ── Vigilancia del BOE ───────────────────────────────────────────────────
import { buscar } from '../scripts/boe.mjs';

test('BOE: encuentra la revalorización de pensiones y el SMI, con item suelto o en lista', () => {
  const sumario = {
    data: { sumario: { diario: [{ seccion: [
      { codigo: '1', nombre: 'I. Disposiciones generales', departamento: [
        { nombre: 'MINISTERIO DE INCLUSIÓN', epigrafe: [{ nombre: 'Pensiones', item: { identificador: 'BOE-A-2026-1', titulo: 'Real Decreto 1/2026, sobre revalorización de las pensiones', url_html: 'https://www.boe.es/1' } }] },
        { nombre: 'MINISTERIO DE TRABAJO', epigrafe: [{ nombre: 'SMI', item: [{ identificador: 'BOE-A-2026-2', titulo: 'Real Decreto por el que se fija el salario mínimo interprofesional para 2027', url_html: 'https://www.boe.es/2' }] }] },
      ] },
      { codigo: '2B', nombre: 'Oposiciones', departamento: [{ nombre: 'X', epigrafe: [{ item: { identificador: 'BOE-A-2026-3', titulo: 'Pensiones: plazas de funcionario', url_html: '' } }] }] },
    ] }] } },
  };
  const r = buscar(sumario);
  assert.deepEqual(r.map((x) => x.tema), ['Pensiones', 'Salario mínimo']);
  assert.deepEqual(buscar({}), []);
});

test('teléfonos y pasos por comunidad existen', () => {
  for (const [id, t] of Object.entries(TRAMITES)) {
    for (const lista of Object.values(t.telefonosCcaa ?? {})) for (const k of lista) assert.ok(TELEFONOS[k], `teléfono ${k} en ${id}`);
    for (const lista of Object.values(t.documentosCcaa ?? {})) for (const d of lista) assert.ok(DOCUMENTOS[d], `papel ${d} en ${id}`);
  }
  assert.match(tramiteDe('renta-minima', 'cataluna').pasos.join(' '), /Renda Garantida/);
  assert.match(tramiteDe('dependencia-valoracion', 'andalucia').pasos.join(' '), /Junta de Andalucía/);
  assert.match(tramiteDe('renta-minima', 'galicia').pasos.join(' '), /servicios sociales/);
});

// ── Gráficos ─────────────────────────────────────────────────────────────
import { umbralDe, dineroEstimado } from '../assets/js/reglas.js';

test('barra de umbral: tus ingresos frente al límite', () => {
  const u = umbralDe('imv', perfil({ adultos: 2, hijos: { de6a17: 2 }, ingresosHogar: 9000 }));
  assert.equal(u.tuyo, 9000);
  assert.equal(u.limite, 1393.84 * 12);
  assert.equal(umbralDe('imv', perfil({})), null);
  const pension = umbralDe('complemento-minimos', perfil({ edad: 70, pension: 'jubilacion', pensionMes: 800 }));
  assert.equal(pension.limite, 936.2);
});

test('dinero estimado: suma lo compatible y descuenta del IMV el subsidio', () => {
  const r = evaluar(perfil({ edad: 30, situacion: 'paro-sin', ingresosPropios: 0, ingresosHogar: 0, adultos: 1, hijos: { menor3: 1 }, monoparental: true, cotizadoUnAño: false }));
  const d = dineroEstimado(r);
  const imv = d.partes.find((x) => x.id === 'imv').mes;
  const imvBruto = r.find((x) => x.id === 'imv').importe.mes;
  assert.equal(Math.round((imvBruto - 570) * 100) / 100, imv);
  assert.ok(d.partes.some((x) => x.id === 'capi'));
  assert.equal(d.año, 50, 'solo el bono térmico: sin trabajo, la deducción por maternidad no suma');
});
