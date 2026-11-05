// Tests de navegador: cada página funciona, no da errores, no se sale por los lados y pasa axe (WCAG 2.2 AA),
// en móvil, tablet y ordenador, claro y oscuro, y con alto contraste.
// También recorren lo importante: un ejemplo, la página de mayores y la lista enviada a un familiar.
// Los ejecuta la Action antes de publicar. Uso: npm run e2e (necesita playwright y @axe-core/playwright)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { arrancar } from './servidor.mjs';

let AxeBuilder = null;
try {
  ({ default: AxeBuilder } = await import('@axe-core/playwright'));
} catch {
  if (process.env.CI) throw new Error('Falta @axe-core/playwright: npm run herramientas');
  console.log('# Sin @axe-core/playwright: se salta la auditoría de accesibilidad (en la Action sí se hace)');
}

let servidor, navegador, base;

const MOVIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const TABLET = { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true };
const ESCRITORIO = { viewport: { width: 1280, height: 900 } };
const VARIANTES = [
  ['móvil claro', { ...MOVIL, colorScheme: 'light' }],
  ['móvil oscuro', { ...MOVIL, colorScheme: 'dark' }],
  ['tablet claro', { ...TABLET, colorScheme: 'light' }],
  ['escritorio claro', { ...ESCRITORIO, colorScheme: 'light' }],
  ['escritorio oscuro', { ...ESCRITORIO, colorScheme: 'dark' }],
];

before(async () => {
  servidor = await arrancar();
  base = servidor.base;
  navegador = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
});
after(async () => {
  await navegador?.close();
  await servidor?.cerrar();
});

async function abrir(ruta, opciones = {}, antes) {
  const contexto = await navegador.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid', ...opciones });
  if (antes) await contexto.addInitScript(antes);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  await pagina.route((url) => !url.href.startsWith(base), (r) => r.abort());
  await pagina.goto(base + ruta);
  await pagina.waitForLoadState('networkidle');
  return { pagina, errores, contexto };
}

// Errores que no son de la web: peticiones de fuera bloqueadas y la fuente si no está preparada
const propios = (errores) => errores.filter((e) => !/ERR_FAILED|net::|404/.test(e));

async function accesible(pagina, donde) {
  if (!AxeBuilder) return;
  await pagina.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  const { violations } = await new AxeBuilder({ page: pagina }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(violations.map((v) => `${donde} ${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`), []);
}

async function sinDesbordar(pagina, donde) {
  const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(sobra <= 1, `${donde}: la página se sale ${sobra} px por la derecha`);
}

for (const [ruta, nombre] of [['', 'portada'], ['mayores/', 'mayores'], ['catalogo/', 'todas las ayudas'], ['mapa/#galicia', 'mapa'], ['entidades/', 'entidades'], ['ayuda/imv/', 'ficha del IMV'], ['comunidad/madrid/', 'página de Madrid'], ['comunidad/', 'comunidades'], ['en/', 'guía en inglés'], ['va/', 'guía en valenciano'], ['eu/', 'guía en euskera'], ['fuentes/', 'fuentes']]) {
  test(`${nombre}: sin errores, sin desbordar y accesible en móvil, tablet y ordenador`, async () => {
    for (const [variante, opciones] of VARIANTES) {
      const { pagina, errores, contexto } = await abrir(ruta, opciones);
      assert.deepEqual(propios(errores), [], `${nombre} (${variante})`);
      await sinDesbordar(pagina, `${nombre} (${variante})`);
      await accesible(pagina, `${nombre} (${variante})`);
      await contexto.close();
    }
  });
}

test('alto contraste y letra grande también son accesibles', async () => {
  const { pagina, errores, contexto } = await abrir('', { ...MOVIL, colorScheme: 'light' }, () => {
    localStorage.setItem('ayudas:contraste', '1');
    localStorage.setItem('ayudas:facil', '1');
  });
  assert.ok(await pagina.evaluate(() => 'contraste' in document.documentElement.dataset && 'facil' in document.documentElement.dataset));
  await pagina.click('[data-ejemplo=jubilada]');
  await sinDesbordar(pagina, 'contraste');
  await accesible(pagina, 'contraste');
  assert.deepEqual(propios(errores), []);
  await contexto.close();
});

test('portada: un ejemplo enseña ayudas, por dónde empezar, papeles y pasos', async () => {
  const { pagina, errores, contexto } = await abrir('', { ...MOVIL, colorScheme: 'light' });
  await pagina.click('[data-ejemplo=paro]');
  await pagina.waitForSelector('#resultados:not([hidden])');
  const empezar = await pagina.locator('#empezar-lista li').allTextContents();
  assert.ok(empezar[0].includes('Comida'), `lo urgente primero: ${empezar[0]}`);
  assert.ok((await pagina.locator('#lista .ayuda').count()) >= 5);
  assert.ok((await pagina.locator('#papeles li').count()) >= 3);
  await pagina.locator('#lista details').first().evaluate((d) => (d.open = true));
  assert.ok((await pagina.locator('#lista details').first().locator('.pasos-tramite li').count()) >= 1);
  await accesible(pagina, 'portada con resultados');
  assert.deepEqual(propios(errores), []);
  await contexto.close();
});

test('mayores: se contesta pulsando botones y salen las ayudas con sus pasos', async () => {
  const { pagina, errores, contexto } = await abrir('mayores/', { ...MOVIL, colorScheme: 'light' });
  await pagina.click('#empezar');
  const respuestas = ['De 65 a 79', 'En la ciudad de Madrid', 'Vivo solo o sola', 'Sí, de viudedad', 'Menos de 700 €', 'Sí', '3', 'Sí, pero no lo he pedido', 'No', 'No', 'No, es mía', 'Justo', 'Sí'];
  for (const r of respuestas) await pagina.locator('.opcion-grande', { hasText: r }).first().click();
  await pagina.waitForSelector('#resultado:not([hidden])');
  const fichas = await pagina.locator('.ficha-mayores h3').allTextContents();
  assert.ok(fichas.some((t) => t.includes('Complemento a mínimos')), fichas.join(' | '));
  assert.ok(fichas.some((t) => t.includes('Teleasistencia')), fichas.join(' | '));
  await sinDesbordar(pagina, 'mayores resultado');
  await accesible(pagina, 'mayores resultado');
  assert.deepEqual(propios(errores), []);
  await contexto.close();
});

test('lista enviada a un familiar: solo esas ayudas, con sus pasos', async () => {
  const { pagina, errores, contexto } = await abrir('catalogo/?ver=imv,bono-social', { ...MOVIL, colorScheme: 'light' });
  assert.equal(await pagina.locator('#lista .ayuda').count(), 2);
  assert.match(await pagina.textContent('#titular'), /te han enviado/);
  assert.deepEqual(propios(errores), []);
  await contexto.close();
});

test('mapa: al pulsar una comunidad salen su renta mínima y sus ayudas', async () => {
  const { pagina, errores, contexto } = await abrir('mapa/', { ...MOVIL, colorScheme: 'light' });
  await pagina.locator('.zona[data-ccaa="pais-vasco"] path').click({ force: true });
  await pagina.waitForSelector('#panel-ccaa:not([hidden])');
  assert.match(await pagina.textContent('#panel-ccaa'), /Renta de Garantía de Ingresos/);
  assert.equal(await pagina.getAttribute('.zona[data-ccaa="pais-vasco"]', 'aria-pressed'), 'true');
  // Con teclado y con la lista también
  await pagina.focus('.zona[data-ccaa="ceuta"]');
  await pagina.keyboard.press('Enter');
  assert.match(await pagina.textContent('.panel-titulo'), /Ceuta/);
  await pagina.selectOption('#mapa-ccaa', 'madrid');
  assert.ok((await pagina.locator('#panel-ccaa .ayuda').count()) >= 10);
  assert.match(await pagina.textContent('#panel-ccaa'), /Si vives en la ciudad de Madrid/);
  assert.deepEqual(propios(errores), []);
  await contexto.close();
});

test('insertado en otra web: sin cabecera ni pie', async () => {
  const { pagina, errores, contexto } = await abrir('?widget=1', { ...MOVIL, colorScheme: 'light' });
  assert.equal(await pagina.locator('.cabecera').isVisible(), false);
  assert.equal(await pagina.locator('.widget-pie').count(), 1);
  assert.deepEqual(propios(errores), []);
  await contexto.close();
});

test('guardar en un enlace y modo profesional', async () => {
  const { pagina, errores, contexto } = await abrir('?pro=1', { ...ESCRITORIO, colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'] });
  await pagina.click('[data-ejemplo=jubilada]');
  await pagina.waitForSelector('#resultados:not([hidden])');
  assert.equal(await pagina.locator('#pro').isVisible(), true);
  const n = await pagina.locator('#lista .ayuda').count();
  await pagina.click('#enlace-respuestas');
  const enlace = await pagina.evaluate(() => navigator.clipboard.readText());
  assert.match(enlace, /#r=/);
  await accesible(pagina, 'portada en modo profesional');
  const otra = await contexto.newPage();
  await otra.goto(enlace);
  await otra.waitForSelector('#resultados:not([hidden])');
  assert.equal(await otra.locator('#lista .ayuda').count(), n);
  assert.ok(!otra.url().includes('#r='), 'las respuestas se quitan de la barra de direcciones');
  const descarga = otra.waitForEvent('download');
  await otra.click('#calendario');
  assert.equal((await descarga).suggestedFilename(), 'ayudas-recordatorios.ics');
  assert.deepEqual(propios(errores), []);
  await contexto.close();
});
