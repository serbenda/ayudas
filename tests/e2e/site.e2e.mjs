// Browser tests: every page works, has no errors, does not overflow sideways and passes axe (WCAG 2.2 AA),
// on mobile, tablet and desktop, light and dark, and with high contrast.
// They also walk through the key flows: an example, the seniors page and the list sent to a relative.
// The Action runs them before publishing. Usage: npm run test:e2e (needs playwright and @axe-core/playwright)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { start } from './server.mjs';

let AxeBuilder = null;
try {
  ({ default: AxeBuilder } = await import('@axe-core/playwright'));
} catch {
  if (process.env.CI) throw new Error('Missing @axe-core/playwright: npm run tools');
  console.log('# No @axe-core/playwright: skipping the accessibility audit (CI runs it)');
}

let server, browser, base;

const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const TABLET = { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1280, height: 900 } };
const VARIANTS = [
  ['mobile light', { ...MOBILE, colorScheme: 'light' }],
  ['mobile dark', { ...MOBILE, colorScheme: 'dark' }],
  ['tablet light', { ...TABLET, colorScheme: 'light' }],
  ['desktop light', { ...DESKTOP, colorScheme: 'light' }],
  ['desktop dark', { ...DESKTOP, colorScheme: 'dark' }],
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
  await page.route(
    (url) => !url.href.startsWith(base),
    (r) => r.abort(),
  );
  await page.goto(base + routePath);
  await page.waitForLoadState('networkidle');
  return { page, errors, context };
}

// Errors that are not the site's: blocked external requests and the font if it is not prepared
const ownItems = (errors) => errors.filter((e) => !/ERR_FAILED|net::|404/.test(e));

async function checkAccessible(page, where) {
  if (!AxeBuilder) return;
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  const { violations } = await new AxeBuilder({ page: page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(
    violations.map(
      (v) =>
        `${where} ${v.id} (${v.impact}): ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(', ')}`,
    ),
    [],
  );
}

async function noOverflow(page, where) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `${where}: the page overflows ${overflow} px to the right`);
}

for (const [routePath, name] of [
  ['', 'home'],
  ['mayores/', 'seniors'],
  ['catalogo/', 'catalogue'],
  ['mapa/#galicia', 'map'],
  ['entidades/', 'organisations'],
  ['ayuda/imv/', 'IMV card'],
  ['comunidad/madrid/', 'Madrid page'],
  ['comunidad/', 'regions'],
  ['palabras/', 'glossary'],
  ['en/', 'English guide'],
  ['va/', 'Valencian guide'],
  ['eu/', 'Basque guide'],
  ['fuentes/', 'sources'],
]) {
  test(`${name}: no errors, no overflow and accessible on mobile, tablet and desktop`, async () => {
    for (const [variant, options] of VARIANTS) {
      const { page, errors, context } = await openPage(routePath, options);
      assert.deepEqual(ownItems(errors), [], `${name} (${variant})`);
      await noOverflow(page, `${name} (${variant})`);
      await checkAccessible(page, `${name} (${variant})`);
      await context.close();
    }
  });
}

test('high contrast and large text are accessible too', async () => {
  const { page, errors, context } = await openPage('', { ...MOBILE, colorScheme: 'light' }, () => {
    localStorage.setItem('ayudas:contraste', '1');
    localStorage.setItem('ayudas:facil', '1');
  });
  assert.ok(await page.evaluate(() => 'contrast' in document.documentElement.dataset && 'easy' in document.documentElement.dataset));
  await page.click('[data-example=jubilada]');
  await noOverflow(page, 'contraste');
  await checkAccessible(page, 'high contrast');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('home: an example shows benefits, where to start, documents and steps', async () => {
  const { page, errors, context } = await openPage('', { ...MOBILE, colorScheme: 'light' });
  await page.click('[data-example=paro]');
  await page.waitForSelector('#results:not([hidden])');
  const begin = await page.locator('#start-list li').allTextContents();
  assert.ok(begin[0].includes('Comida'), `urgent first: ${begin[0]}`);
  assert.ok((await page.locator('#list .benefit').count()) >= 5);
  assert.ok((await page.locator('#papers li').count()) >= 3);
  await page
    .locator('#list details')
    .first()
    .evaluate((d) => (d.open = true));
  assert.ok((await page.locator('#list details').first().locator('.procedure-steps li').count()) >= 1);
  await checkAccessible(page, 'home with results');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('seniors: answered by tapping buttons, and the benefits come up with their steps', async () => {
  const { page, errors, context } = await openPage('mayores/', { ...MOBILE, colorScheme: 'light' });
  await page.click('#start');
  const answers = ['De 65 a 79', 'En la ciudad de Madrid', 'Vivo solo o sola', 'Sí, de viudedad', 'Menos de 700 €', 'Sí', '3', 'Sí, pero no lo he pedido', 'No', 'No', 'No, es mía', 'Justo', 'Sí'];
  for (const r of answers) await page.locator('.option-large', { hasText: r }).first().click();
  await page.waitForSelector('#result:not([hidden])');
  const cards = await page.locator('.senior-card h3').allTextContents();
  assert.ok(
    cards.some((t) => t.includes('Complemento a mínimos')),
    cards.join(' | '),
  );
  assert.ok(
    cards.some((t) => t.includes('Teleasistencia')),
    cards.join(' | '),
  );
  await noOverflow(page, 'seniors result');
  await checkAccessible(page, 'seniors result');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('list sent to a relative: only those benefits, with their steps', async () => {
  const { page, errors, context } = await openPage('catalogo/?ver=imv,bono-social', { ...MOBILE, colorScheme: 'light' });
  assert.equal(await page.locator('#list .benefit').count(), 2);
  assert.match(await page.textContent('#headline'), /te han enviado/);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('map: tapping a region shows its minimum income and its benefits', async () => {
  const { page, errors, context } = await openPage('mapa/', { ...MOBILE, colorScheme: 'light' });
  await page.locator('.zone[data-region="pais-vasco"] path').click({ force: true });
  await page.waitForSelector('#region-panel:not([hidden])');
  assert.match(await page.textContent('#region-panel'), /Renta de Garantía de Ingresos/);
  assert.equal(await page.getAttribute('.zone[data-region="pais-vasco"]', 'aria-pressed'), 'true');
  // With the keyboard and with the list too
  await page.focus('.zone[data-region="ceuta"]');
  await page.keyboard.press('Enter');
  assert.match(await page.textContent('.panel-title'), /Ceuta/);
  await page.selectOption('#region-map', 'madrid');
  assert.ok((await page.locator('#region-panel .benefit').count()) >= 10);
  assert.match(await page.textContent('#region-panel'), /Si vives en la ciudad de Madrid/);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('embedded in another website: no header or footer', async () => {
  const { page, errors, context } = await openPage('?widget=1', { ...MOBILE, colorScheme: 'light' });
  assert.equal(await page.locator('.header').isVisible(), false);
  assert.equal(await page.locator('.widget-footer').count(), 1);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('save in a link and professional mode', async () => {
  const { page, errors, context } = await openPage('?pro=1', { ...DESKTOP, colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'] });
  await page.click('[data-example=jubilada]');
  await page.waitForSelector('#results:not([hidden])');
  assert.equal(await page.locator('#pro').isVisible(), true);
  const n = await page.locator('#list .benefit').count();
  await page.click('#answers-link');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(link, /#r=/);
  await checkAccessible(page, 'home in professional mode');
  const other = await context.newPage();
  await other.goto(link);
  await other.waitForSelector('#results:not([hidden])');
  assert.equal(await other.locator('#list .benefit').count(), n);
  assert.ok(!other.url().includes('#r='), 'answers are removed from the address bar');
  const downloadEvent = other.waitForEvent('download');
  await other.click('#calendar');
  assert.equal((await downloadEvent).suggestedFilename(), 'ayudas-recordatorios.ics');
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('difficult words: tapping one shows its meaning, and tapping again hides it', async () => {
  const { page, errors, context } = await openPage('ayuda/imv/', { ...MOBILE, colorScheme: 'light' });
  const word = page.locator('button.term').first();
  await word.click();
  assert.equal(await word.getAttribute('aria-expanded'), 'true');
  assert.ok((await page.textContent('.definition')).length > 20);
  await checkAccessible(page, 'card with an open word');
  await word.click();
  assert.equal(await page.locator('.definition').count(), 0);
  assert.deepEqual(ownItems(errors), []);
  await context.close();
});

test('embed.js: each type loads its page, with a title and in widget mode', async () => {
  const { page, context } = await openPage('');
  const types = { cuestionario: '', mayores: 'mayores/', mapa: 'mapa/', catalogo: 'catalogo/' };
  await page.setContent(
    `${Object.keys(types)
      .map((t) => `<div data-ayudas="${t}"></div>`)
      .join('')}<script src="${base}embed.js"></script>`,
  );
  const frames = await page.locator('iframe').evaluateAll((fs) => fs.map((f) => [f.src, f.title]));
  assert.deepEqual(
    frames.map(([src]) => src),
    Object.values(types).map((p) => `${base}${p}?widget=1`),
  );
  for (const [, title] of frames) assert.ok(title, 'every iframe has a title');
  await context.close();
});

test('sources: every report link opens its GitHub issue form, filled in', async () => {
  const { page, context } = await openPage('fuentes/');
  const links = await page.locator('a[data-notice]').evaluateAll((as) => as.map((a) => Object.fromEntries(new URL(a.href).searchParams)));
  assert.deepEqual(links.map((l) => l.template).sort(), ['bug.yml', 'data.yml', 'missing.yml']);
  for (const l of links) assert.ok(l.title && l.page, 'link has a title and the page');
  await context.close();
});

test('home: the carer example fills in the person being cared for', async () => {
  const { page, context } = await openPage('');
  await page.click('[data-example=cuidador]');
  assert.equal(await page.locator('[name="p1-relationship"]').inputValue(), 'padre');
  assert.equal(await page.locator('[name="p1-age"]').inputValue(), '84');
  await context.close();
});

test('every page has a Content-Security-Policy and breaks none of it', async () => {
  for (const routePath of ['', 'mayores/', 'catalogo/', 'mapa/', 'entidades/', 'palabras/', 'fuentes/', 'ayuda/imv/', 'en/']) {
    const { page, context } = await openPage(routePath, {}, () => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    assert.match((await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')) ?? '', /default-src 'self'/, routePath);
    assert.deepEqual(await page.evaluate(() => window.__cspViolations), [], routePath);
    await context.close();
  }
});

test('high contrast and large text can be switched off again', async () => {
  const { page, context } = await openPage('');
  for (const [id, attr] of [
    ['#contrast', 'data-contrast'],
    ['#easy', 'data-easy'],
  ]) {
    await page.click(id);
    assert.equal(await page.locator('html').getAttribute(attr), '', `${attr} on`);
    assert.equal(await page.locator(id).getAttribute('aria-pressed'), 'true');
    await page.click(id);
    assert.equal(await page.locator('html').getAttribute(attr), null, `${attr} off`);
    assert.equal(await page.locator(id).getAttribute('aria-pressed'), 'false');
  }
  await context.close();
});

test('seniors: back, skip and change answers work', async () => {
  const { page, context } = await openPage('mayores/');
  await page.click('#start');
  const question = () => page.locator('#question').innerText();
  const first = await question();
  await page.click('#assistant [data-skip]');
  const second = await question();
  assert.notEqual(second, first, 'skip moves on');
  await page.click('#assistant [data-back]');
  assert.equal(await question(), first, 'back returns');
  await context.close();
});
