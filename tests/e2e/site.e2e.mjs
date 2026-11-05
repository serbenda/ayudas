// Tests de navegador: cada página funciona, no da errores, no se sale por los lados y pasa axe (WCAG 2.2 AA),
// en móvil, tablet y ordenador, claro y oscuro, y con alto contraste.
// También recorren lo importante: un ejemplo, la página de mayores y la lista enviada a un familiar.
// Los ejecuta la Action antes de publicar. Uso: npm run e2e (necesita playwright y @axe-core/playwright)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { start } from './server.mjs';

let AxeBuilder = null;
try {
  ({ default: AxeBuilder } = await import('@axe-core/playwright'));
} catch {
  if (process.env.CI) throw new Error('Falta @axe-core/playwright: npm run herramientas');
  console.log('# Sin @axe-core/playwright: se salta la auditoría de accesibilidad (en la Action sí se hace)');
}

let server, browser, base;

const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const TABLET = { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1280, height: 900 } };
const VARIANTS = [
  ['móvil claro', { ...MOBILE, colorScheme: 'light' }],
  ['móvil oscuro', { ...MOBILE, colorScheme: 'dark' }],
  ['tablet claro', { ...TABLET, colorScheme: 'light' }],
  ['escritorio claro', { ...DESKTOP, colorScheme: 'light' }],
  ['escritorio oscuro', { ...DESKTOP, colorScheme: 'dark' }],
];

before(async () => {
  server = await start();
  base = server.base;
  browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
});
after(async () => {
  await browser?.close();
  await server?.close();
});

async function openPage(routePath, options = {}, before) {
  const context = await browser.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid', ...options });
  if (before) await context.addInitScript(before);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.route((url) => !url.href.startsWith(base), (r) => r.abort());
  await page.goto(base + routePath);
  await page.waitForLoadState('networkidle');
  return { page, errors, context };
}

// Errores que no son de la web: peticiones de fuera bloqueadas y la fuente si no está preparada
const ownItems = (errors) => errors.filter((e) => !/ERR_FAILED|net::|404/.test(e));

async function checkAccessible(page, where) {
  if (!AxeBuilder) return;
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  const { violations } = await new AxeBuilder({ page: page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(violations.map((v) => `${where} ${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`), []);
}

async function noOverflow(page, where) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `${where}: la página se sale ${overflow} px por la derecha`);
}

for (const [routePath, name] of [['', 'portada'], ['mayores/', 'mayores'], ['catalogo/', 'todas las ayudas'], ['mapa/#galicia', 'mapa'], ['entidades/', 'entidades'], ['ayuda/imv/', 'ficha del IMV'], ['comunidad/madrid/', 'página de Madrid'], ['comunidad/', 'comunidades'], ['palabras/', 'palabras difíciles'], ['en/', 'guía en inglés'], ['va/', 'guía en valenciano'], ['eu/', 'guía en euskera'], ['fuentes/', 'fuentes']]) {
  test(`${name}: sin errores, sin desbordar y accesible en móvil, tablet y ordenador`, async () => {
    for (const [variant, options] of VARIANTS) {
      const { page, errors, context } = await openPage(routePath, options);
      assert.deepEqual(ownItems(errors), [], `${name} (${variant})`);
      await noOverflow(page, `${name} (${variant})`);
      await checkAccessible(page, `${name} (${variant})`);
      await context.close();
    }
  });
}

test('alto contraste y letra grande también son accesibles', async () => {
  const { page, errors, context } = await openPage('', { ...MOBILE, colorScheme: 'light' }, () => {
    localStorage.setItem('ayudas:contraste', '1');
    localStorage.setItem('ayudas:facil', '1');
  });
  assert.ok(await page.evaluate(() => 'contrast' in document.documentElement.dataset && 'easy' in document.documentElement.dataset));
  await page.click('[data-example=jubilada]');
  await noOverflow(page, 'contraste');
  await checkAccessible(page, 'contraste');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('portada: un ejemplo enseña ayudas, por dónde empezar, papeles y pasos', async () => {
  const { page, errors, context } = await openPage('', { ...MOBILE, colorScheme: 'light' });
  await page.click('[data-example=paro]');
  await page.waitForSelector('#results:not([hidden])');
  const begin = await page.locator('#start-list li').allTextContents();
  assert.ok(begin[0].includes('Comida'), `lo urgente primero: ${begin[0]}`);
  assert.ok((await page.locator('#list .benefit').count()) >= 5);
  assert.ok((await page.locator('#papers li').count()) >= 3);
  await page.locator('#list details').first().evaluate((d) => (d.open = true));
  assert.ok((await page.locator('#list details').first().locator('.procedure-steps li').count()) >= 1);
  await checkAccessible(page, 'portada con resultados');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('mayores: se contesta pulsando botones y salen las ayudas con sus pasos', async () => {
  const { page, errors, context } = await openPage('mayores/', { ...MOBILE, colorScheme: 'light' });
  await page.click('#start');
  const answers = ['De 65 a 79', 'En la ciudad de Madrid', 'Vivo solo o sola', 'Sí, de viudedad', 'Menos de 700 €', 'Sí', '3', 'Sí, pero no lo he pedido', 'No', 'No', 'No, es mía', 'Justo', 'Sí'];
  for (const r of answers) await page.locator('.option-large', { hasText: r }).first().click();
  await page.waitForSelector('#result:not([hidden])');
  const cards = await page.locator('.senior-card h3').allTextContents();
  assert.ok(cards.some((t) => t.includes('Complemento a mínimos')), cards.join(' | '));
  assert.ok(cards.some((t) => t.includes('Teleasistencia')), cards.join(' | '));
  await noOverflow(page, 'mayores resultado');
  await checkAccessible(page, 'mayores resultado');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('lista enviada a un familiar: solo esas ayudas, con sus pasos', async () => {
  const { page, errors, context } = await openPage('catalogo/?ver=imv,bono-social', { ...MOBILE, colorScheme: 'light' });
  assert.equal(await page.locator('#list .benefit').count(), 2);
  assert.match(await page.textContent('#headline'), /te han enviado/);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('mapa: al pulsar una comunidad salen su renta mínima y sus ayudas', async () => {
  const { page, errors, context } = await openPage('mapa/', { ...MOBILE, colorScheme: 'light' });
  await page.locator('.zone[data-region="pais-vasco"] path').click({ force: true });
  await page.waitForSelector('#region-panel:not([hidden])');
  assert.match(await page.textContent('#region-panel'), /Renta de Garantía de Ingresos/);
  assert.equal(await page.getAttribute('.zone[data-region="pais-vasco"]', 'aria-pressed'), 'true');
  // Con teclado y con la lista también
  await page.focus('.zone[data-region="ceuta"]');
  await page.keyboard.press('Enter');
  assert.match(await page.textContent('.panel-title'), /Ceuta/);
  await page.selectOption('#region-map', 'madrid');
  assert.ok((await page.locator('#region-panel .benefit').count()) >= 10);
  assert.match(await page.textContent('#region-panel'), /Si vives en la ciudad de Madrid/);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('insertado en otra web: sin cabecera ni pie', async () => {
  const { page, errors, context } = await openPage('?widget=1', { ...MOBILE, colorScheme: 'light' });
  assert.equal(await page.locator('.header').isVisible(), false);
  assert.equal(await page.locator('.widget-footer').count(), 1);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('guardar en un enlace y modo profesional', async () => {
  const { page, errors, context } = await openPage('?pro=1', { ...DESKTOP, colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'] });
  await page.click('[data-example=jubilada]');
  await page.waitForSelector('#results:not([hidden])');
  assert.equal(await page.locator('#pro').isVisible(), true);
  const n = await page.locator('#list .benefit').count();
  await page.click('#answers-link');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(link, /#r=/);
  await checkAccessible(page, 'portada en modo profesional');
  const other = await context.newPage();
  await other.goto(link);
  await other.waitForSelector('#results:not([hidden])');
  assert.equal(await other.locator('#list .benefit').count(), n);
  assert.ok(!other.url().includes('#r='), 'las respuestas se quitan de la barra de direcciones');
  const downloadEvent = other.waitForEvent('download');
  await other.click('#calendar');
  assert.equal((await downloadEvent).suggestedFilename(), 'ayudas-recordatorios.ics');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('palabras difíciles: al pulsar una sale qué significa, y se esconde al volver a pulsar', async () => {
  const { page, errors, context } = await openPage('ayuda/imv/', { ...MOBILE, colorScheme: 'light' });
  const word = page.locator('button.term').first();
  await word.click();
  assert.equal(await word.getAttribute('aria-expanded'), 'true');
  assert.ok((await page.textContent('.definition')).length > 20);
  await checkAccessible(page, 'ficha con una palabra abierta');
  await word.click();
  assert.equal(await page.locator('.definition').count(), 0);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('embed.js: each type loads its page, with a title and in widget mode', async () => {
  const { page, context } = await openPage('');
  const types = { cuestionario: '', mayores: 'mayores/', mapa: 'mapa/', catalogo: 'catalogo/' };
  await page.setContent(`${Object.keys(types).map((t) => `<div data-ayudas="${t}"></div>`).join('')}<script src="${base}embed.js"></script>`);
  const frames = await page.locator('iframe').evaluateAll((fs) => fs.map((f) => [f.src, f.title]));
  assert.deepEqual(frames.map(([src]) => src), Object.values(types).map((p) => `${base}${p}?widget=1`));
  for (const [, title] of frames) assert.ok(title, 'every iframe has a title');
  await context.close();
});

test('sources: every report link opens a GitHub issue with its template', async () => {
  const { page, context } = await openPage('fuentes/');
  const links = await page.locator('a[data-notice]').evaluateAll((as) => as.map((a) => new URL(a.href).searchParams.get('title')));
  assert.equal(links.length, 3);
  for (const t of links) assert.ok(t, 'link has a title');
  await context.close();
});

test('home: the carer example fills in the person being cared for', async () => {
  const { page, context } = await openPage('');
  await page.click('[data-example=cuidador]');
  assert.equal(await page.locator('[name="p1-relationship"]').inputValue(), 'padre');
  assert.equal(await page.locator('[name="p1-age"]').inputValue(), '84');
  await context.close();
});
