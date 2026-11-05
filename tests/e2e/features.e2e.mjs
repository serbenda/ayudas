// Functional audit: clicks through every feature of every page, like a person would, and checks the result.
// Speech, printing and pop-ups are stubbed so they can be checked without a real device.
// Each check is reported on its own; the test fails if any of them fails.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { start } from './server.mjs';

let s, base, browser;
before(async () => {
  s = await start();
  base = s.base;
  browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
});
after(async () => {
  await browser?.close();
  await s?.close();
});
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(['✓', name]);
  } catch (e) {
    results.push(['✗', name, String(e.message).split('\n')[0].slice(0, 220)]);
    console.log('✗', name, String(e.message).split('\n')[0].slice(0, 220));
  }
};
const ok = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const STUBS = () => {
  window.__spoken = [];
  window.__printed = 0;
  window.__opened = [];
  window.print = () => window.__printed++;
  window.open = (u) => (window.__opened.push(String(u)), null);
  class U {
    constructor(t) {
      this.text = t;
    }
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: U, configurable: true, writable: true });
  const voices = [
    { name: 'Mónica', lang: 'es-ES', voiceURI: 'monica', localService: true },
    { name: 'Google español', lang: 'es-ES', voiceURI: 'google-es' },
    { name: 'Daniel', lang: 'en-GB', voiceURI: 'daniel' },
  ];
  const fake = {
    speaking: false,
    pending: false,
    getVoices: () => voices,
    speak(u) {
      window.__spoken.push(u.text);
      setTimeout(() => u.onend?.(), 5);
    },
    cancel() {},
    addEventListener() {},
    onvoiceschanged: null,
  };
  Object.defineProperty(window, 'speechSynthesis', { get: () => fake, configurable: true });
};

async function open(path, opts = {}) {
  const context = await browser.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid', acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'], ...opts });
  await context.addInitScript(STUBS);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/ERR_FAILED|net::|404/.test(m.text()) && errors.push(m.text()));
  await page.route(
    (u) => !u.href.startsWith(base),
    (r) => r.abort(),
  );
  await page.goto(base + path);
  await page.waitForLoadState('networkidle');
  return { page, context, errors };
}

test('every feature works on every page', { timeout: 600000 }, async () => {
  // ─────────────── Home ───────────────
  {
    const { page, context, errors } = await open('');
    await check('home: settings bar — easy on/off', async () => {
      await page.click('#easy');
      ok((await page.locator('html').getAttribute('data-easy')) === '', 'not on');
      await page.click('#easy');
      ok((await page.locator('html').getAttribute('data-easy')) === null, 'not off');
    });
    await check('home: settings bar — contrast on/off', async () => {
      await page.click('#contrast');
      ok((await page.locator('html').getAttribute('data-contrast')) === '', 'not on');
      await page.click('#contrast');
      ok((await page.locator('html').getAttribute('data-contrast')) === null, 'not off');
    });
    await check('home: voice menu opens, lists voices, Probar speaks, closes on Escape', async () => {
      await page.click('#voice-setting summary');
      ok(await page.locator('#voice-setting').evaluate((d) => d.open), 'not open');
      const n = await page.locator('#voice-setting select[name="voice"] option').count();
      ok(n >= 2, `voices ${n}`);
      await page.click('#voice-setting [data-try-voice]');
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => window.__spoken.length)) > 0, 'did not speak');
      await page.keyboard.press('Escape');
      ok(!(await page.locator('#voice-setting').evaluate((d) => d.open)), 'not closed');
    });
    await check('home: language menu opens and has 6 languages, only one menu open', async () => {
      await page.click('#voice-setting summary');
      await page.click('.language-setting summary');
      ok(await page.locator('.language-setting').evaluate((d) => d.open), 'lang not open');
      ok(!(await page.locator('#voice-setting').evaluate((d) => d.open)), 'voice still open');
      ok((await page.locator('.language-setting-panel a').count()) === 6, 'languages');
      await page.mouse.click(5, 600);
      ok(!(await page.locator('.language-setting').evaluate((d) => d.open)), 'not closed on outside click');
    });
    await check('home: hero Escuchar reads aloud', async () => {
      await page.evaluate(() => (window.__spoken = []));
      await page.locator('.hero [data-read], main [data-read]').first().click();
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => window.__spoken.join(' '))).length > 20, 'nothing read');
    });
    await check('home: "Necesito ayuda hoy" shows phones', async () => {
      await page.click('a[href="#ayuda-hoy"]');
      ok((await page.locator('#phones-today a[href^="tel:"]').count()) >= 4, 'phones');
    });
    await check('home: topic shortcuts link somewhere valid', async () => {
      const hrefs = await page.locator('.topics a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      ok(hrefs.length >= 4, `topics ${hrefs.length}`);
    });
    await check('home: step navigation next/back/step buttons', async () => {
      await page.click('#start, a[href="#cuestionario"]');
      await page.click('#next');
      ok(await page.locator('.step[data-step="2"]').isVisible(), 'step 2');
      await page.click('#back');
      ok(await page.locator('.step[data-step="1"]').isVisible(), 'back to 1');
      await page.click('[data-go-to="4"]');
      ok(await page.locator('.step[data-step="4"]').isVisible(), 'step 4');
      ok((await page.locator('[data-go-to="4"]').getAttribute('aria-current')) === 'step', 'aria-current');
      await page.click('[data-go-to="1"]');
    });
    await check('home: region Madrid shows Madrid city question; Barcelona shows city question', async () => {
      await page.selectOption('#region', 'madrid');
      ok(await page.locator('[name="madridCity"]').first().isVisible(), 'madrid city');
      await page.selectOption('#region', 'cataluna');
      ok(await page.locator('[name="inCity"]').first().isVisible(), 'in city');
      ok((await page.locator('#city-name').innerText()).includes('Barcelona'), 'city name');
      await page.selectOption('#region', 'galicia');
      ok(!(await page.locator('[name="inCity"]').first().isVisible()), 'in city hidden');
    });
    await check('home: counters − / + for adults and children', async () => {
      await page.click('[data-go-to="2"]');
      await page.click('[data-increment="adults"]');
      ok((await page.inputValue('#adults')) === '2', 'adults+');
      await page.click('[data-decrement="adults"]');
      await page.click('[data-decrement="adults"]');
      ok((await page.inputValue('#adults')) === '1', 'adults min 1');
      for (const id of ['children-under3', 'children-age3to5', 'children-age6to17']) {
        await page.click(`[data-increment="${id}"]`);
        ok((await page.inputValue('#' + id)) === '1', id);
      }
    });
    await check('home: single parent ticks itself with children and no partner; large family question shows', async () => {
      await page.check('[name="partner"][value="no"]');
      ok(await page.locator('[name="singleParent"]').isVisible(), 'single parent visible');
      ok(await page.locator('[name="singleParent"]').isChecked(), 'single parent ticked');
      ok(await page.locator('#largeFamily').isVisible(), 'large family visible (3 children)');
      for (const id of ['children-under3', 'children-age3to5', 'children-age6to17']) await page.click(`[data-decrement="${id}"]`);
      ok(!(await page.locator('[name="singleParent"]').isVisible()), 'single parent hidden w/o children');
    });
    await check('home: own income shows when living with someone', async () => {
      await page.click('[data-go-to="3"]');
      await page.click('[data-go-to="2"]');
      await page.click('[data-increment="adults"]');
      await page.click('[data-go-to="3"]');
      ok(await page.locator('#ownIncome').isVisible(), 'own income visible');
      await page.click('[data-go-to="2"]');
      await page.click('[data-decrement="adults"]');
    });
    await check('home: cared-for people create person fields', async () => {
      await page.click('[data-go-to="4"]');
      await page.selectOption('#caredForCount', '2');
      ok((await page.locator('#people .person').count()) === 2, 'two persons');
      ok((await page.locator('[name="p2-relationship"] option[value="pareja"]').count()) === 1, 'pareja value');
      await page.selectOption('#caredForCount', '0');
      ok((await page.locator('#people .person').count()) === 0, 'removed');
    });
    await check('home: pension questions show with a contributory pension; contributions with unemployment', async () => {
      await page.click('[data-go-to="5"]');
      await page.selectOption('#pension', { index: 1 });
      ok(await page.locator('#pensionMonthly').isVisible(), 'pension monthly');
      await page.selectOption('#pension', { index: 0 });
    });
    await check('home: results with every example, counts, money, where to start, papers', async () => {
      for (const ex of ['familia', 'jubilada', 'cuidador', 'paro']) {
        await page.click(`[data-example="${ex}"]`);
        ok(await page.locator('#results').isVisible(), `${ex} results`);
        const n = await page.locator('#list .benefit').count();
        ok(n > 0, `${ex} no benefits`);
        ok((await page.locator('#start-list li').count()) > 0, `${ex} start list`);
        ok((await page.locator('#papers li').count()) > 0, `${ex} papers`);
        const yes = Number((await page.locator('#n-yes').innerText()).match(/\d+/)?.[0]);
        ok(yes >= 0, 'n-yes');
        const t = await page.locator('#results').innerText();
        ok(!/undefined|NaN|\[object/.test(t), `${ex}: bad text`);
      }
    });
    await check('home: filters Todas / Cumples / Comprueba', async () => {
      const all = await page.locator('#list .benefit').count();
      await page.click('[data-active-filter="si"]');
      const yes = await page.locator('#list .benefit').count();
      await page.click('[data-active-filter="quizas"]');
      const maybe = await page.locator('#list .benefit').count();
      await page.click('[data-active-filter="todas"]');
      ok(yes + maybe === all && all === (await page.locator('#list .benefit').count()), `${yes}+${maybe}≠${all}`);
    });
    await check('home: "Por dónde empezar" opens the card', async () => {
      const a = page.locator('#start-list [data-open-page]').first();
      const id = await a.getAttribute('data-open-page');
      await a.click();
      ok(await page.locator(`#ayuda-${id} details.benefit`).evaluate((d) => d.open), 'not opened');
    });
    await check('home: card opens, shows steps, reasons, listen reads it', async () => {
      const d = page.locator('#list details.benefit').first();
      await d.locator('> summary').click();
      ok(await d.evaluate((x) => x.open), 'open');
      ok((await d.locator('.procedure-steps li').count()) > 0, 'steps');
      await page.evaluate(() => (window.__spoken = []));
      await d.locator('[data-read]').first().click();
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => window.__spoken.length)) > 0, 'not read');
    });
    await check('home: glossary words in a card toggle their definition', async () => {
      const t = page.locator('#list button.term').first();
      ok((await t.count()) === 1, 'no term');
      await t.click();
      ok((await t.getAttribute('aria-expanded')) === 'true', 'expanded');
      ok((await page.locator('.definition').count()) >= 1, 'definition');
      await t.click();
      ok((await t.getAttribute('aria-expanded')) === 'false', 'collapsed');
    });
    await check('home: tracking select marks the card', async () => {
      const sel = page.locator('#list [data-track]').first();
      const id = await sel.getAttribute('data-track');
      await sel.selectOption('pedida');
      ok((await page.locator(`#ayuda-${id} .tracking-mark`).count()) === 1, 'no mark');
    });
    await check('home: print, share, calendar, save link', async () => {
      await page.click('#print');
      ok((await page.evaluate(() => window.__printed)) === 1, 'print');
      await page.click('#share');
      const opened = await page.evaluate(() => window.__opened);
      ok(
        opened.some((u) => u.includes('wa.me') && u.includes('catalogo')),
        `share ${opened}`,
      );
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#calendar')]);
      ok(/\.ics$/.test(dl.suggestedFilename()), 'ics');
      await page.click('#answers-link');
      await page.waitForTimeout(200);
      ok((await page.locator('#link-status').innerText()).length > 10, 'link status');
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      ok(clip.includes('#r='), 'clipboard');
      globalThis.__savedLink = clip;
    });
    await check('home: change answers goes back to step 1', async () => {
      await page.click('#change');
      ok(await page.locator('.step[data-step="1"]').isVisible(), 'step 1');
    });
    await check('home: remember answers survives reload; clear removes them', async () => {
      await page.click('[data-example="jubilada"]');
      await page.check('#remember');
      await page.reload();
      await page.waitForLoadState('networkidle');
      ok((await page.inputValue('#age')) === '74', `age ${await page.inputValue('#age')}`);
      ok(await page.locator('#remember').isChecked(), 'remember');
      await page.click('[data-go-to="6"]');
      await page.click('#next');
      await page.click('#clear');
      ok((await page.inputValue('#age')) === '', 'cleared');
      await page.reload();
      ok((await page.inputValue('#age')) === '', 'still cleared after reload');
    });
    await check('home: evolution chart renders and tooltip moves', async () => {
      const c = page.locator('.chart').first();
      await c.scrollIntoViewIfNeeded();
      ok((await page.locator('.chart polyline').count()) >= 3, 'lines');
      const b = await c.boundingBox();
      await page.mouse.move(b.x + b.width * 0.8, b.y + b.height / 2);
      ok(await page.locator('.chart .tooltip').isVisible(), 'tooltip');
    });
    await check('home: no JS errors', async () => ok(errors.length === 0, errors.join(' | ')));
    await context.close();
  }

  // ─────────────── Answers link restores ───────────────
  await check('home: #r= link restores the answers and is removed from the address bar', async () => {
    const link = globalThis.__savedLink;
    ok(link, 'no saved link');
    const { page, context } = await open(link.replace(/^https?:\/\/[^/]+\//, ''));
    ok(await page.locator('#results').isVisible(), 'results');
    ok(!page.url().includes('#r='), 'hash not removed');
    await context.close();
  });

  // ─────────────── Pro mode ───────────────
  await check('home ?pro=1: professional box, header with case ref, notes', async () => {
    const { page, context } = await open('?pro=1');
    await page.click('[data-example="familia"]');
    ok(await page.locator('#pro').isVisible(), 'pro');
    await page.fill('#pro-ref', 'A-12');
    ok((await page.locator('#pro-header').innerText()).includes('A-12'), 'header');
    await page.goto(base + '?pro=0');
    await page.click('[data-example="familia"]');
    ok(!(await page.locator('#pro').isVisible()), 'pro off');
    await context.close();
  });

  // ─────────────── Seniors ───────────────
  {
    const { page, context, errors } = await open('mayores/');
    await check('seniors: welcome Escuchar reads', async () => {
      await page.click('[data-listen="welcome"]');
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => window.__spoken.length)) > 0, 'not read');
    });
    await check('seniors: start, progress, listen question, skip, back', async () => {
      await page.click('#start');
      ok(await page.locator('#question').isVisible(), 'question');
      await page.evaluate(() => (window.__spoken = []));
      await page.click('#assistant [data-listen]');
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => window.__spoken.length)) > 0, 'question not read');
      const q1 = await page.locator('#question').innerText();
      await page.click('#assistant [data-skip]');
      ok((await page.locator('#question').innerText()) !== q1, 'skip');
      await page.click('#assistant [data-back]');
      ok((await page.locator('#question').innerText()) === q1, 'back');
    });
    await check('seniors: answer everything (other region via list) and get results', async () => {
      for (let i = 0; i < 30; i++) {
        if (await page.locator('#result .senior-card').count()) break;
        const q = await page
          .locator('#question')
          .innerText()
          .catch(() => '');
        let b = page.locator('#assistant [data-position]');
        if (/dónde vives/i.test(q)) b = page.locator('#assistant [data-position]').nth(2);
        else if (/qué comunidad/i.test(q)) b = page.locator('#assistant [data-field-value="galicia"]');
        else b = b.first();
        await b.click();
        await page.waitForTimeout(60);
      }
      ok((await page.locator('#result .senior-card').count()) > 0, 'no results');
      const t = await page.locator('#result').innerText();
      ok(!/undefined|NaN|\[object/.test(t), 'bad text');
    });
    await check('seniors: result card listen, share, print, change', async () => {
      await page.evaluate(() => (window.__spoken = []));
      await page.locator('#result .senior-card [data-listen]').first().click();
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => window.__spoken.length)) > 0, 'card not read');
      await page.click('#result [data-share]');
      ok(
        (await page.evaluate(() => window.__opened)).some((u) => u.includes('wa.me')),
        'share',
      );
      await page.click('#result [data-print]');
      ok((await page.evaluate(() => window.__printed)) === 1, 'print');
      await page.click('#result [data-change]');
      ok(await page.locator('#question').isVisible(), 'change');
    });
    await check('seniors: no JS errors', async () => ok(errors.length === 0, errors.join(' | ')));
    await context.close();
  }

  // ─────────────── Catalogue ───────────────
  {
    const { page, context, errors } = await open('catalogo/');
    await check('catalogue: 84 benefits, search (no accents), topic chips, region select', async () => {
      const all = await page.locator('.benefit').count();
      ok(all >= 84, `all ${all}`);
      await page.fill('.filters .search, #search', 'pension');
      const n = await page.locator('.benefit:visible').count();
      ok(n > 0 && n < all, `search ${n}`);
      ok(/\d+ de \d+/.test(await page.locator('#count').innerText()), 'count');
      await page.fill('#search', '');
      await page.locator('[data-topic]').nth(2).click();
      const t = await page.locator('.benefit:visible').count();
      ok(t > 0 && t < all, `topic ${t}`);
      await page.locator('[data-topic]').first().click();
      await page.selectOption('#region-filter', 'galicia');
      ok((await page.locator('.benefit').count()) > 0, 'region');
    });
    await check('catalogue: #ayuda-imv opens that card', async () => {
      await page.goto('about:blank');
      await page.goto(base + 'catalogo/#ayuda-imv');
      await page.waitForTimeout(300);
      ok(await page.locator('#ayuda-imv details.benefit').evaluate((d) => d.open), 'not open');
    });
    await check('catalogue: ?ver= shows only the sent list', async () => {
      await page.goto(base + 'catalogo/?ver=imv,pnc-jubilacion');
      await page.waitForTimeout(300);
      ok((await page.locator('.benefit').count()) === 2, `${await page.locator('.benefit').count()}`);
      ok((await page.locator('#headline').innerText()).includes('enviado'), 'headline');
    });
    await check('catalogue: no JS errors', async () => ok(errors.length === 0, errors.join(' | ')));
    await context.close();
  }

  // ─────────────── Map ───────────────
  {
    const { page, context, errors } = await open('mapa/');
    await check('map: click each region shows its panel', async () => {
      const zones = await page.locator('.zone').evaluateAll((z) => z.map((x) => x.dataset.region));
      ok(zones.length === 19, `zones ${zones.length}`);
      for (const id of zones) {
        await page.locator(`.zone[data-region="${id}"]`).dispatchEvent('click');
        const t = await page.locator('#region-panel').innerText();
        ok(t.length > 50 && !/undefined|NaN/.test(t), `panel ${id}`);
      }
    });
    await check('map: select list, keyboard Enter, hash', async () => {
      await page.selectOption('#region-map', 'murcia');
      ok((await page.locator('#region-panel').innerText()).includes('Murcia'), 'select');
      await page.locator('.zone[data-region="aragon"]').focus();
      await page.keyboard.press('Enter');
      ok((await page.locator('#region-panel').innerText()).includes('Aragón'), 'keyboard');
      await page.goto('about:blank');
      await page.goto(base + 'mapa/#canarias');
      await page.waitForTimeout(300);
      ok((await page.locator('#region-panel').innerText()).includes('Canarias'), 'hash');
    });
    await check('map: no JS errors', async () => ok(errors.length === 0, errors.join(' | ')));
    await context.close();
  }

  // ─────────────── Glossary, organisations, sources ───────────────
  {
    const { page, context, errors } = await open('palabras/');
    await check('glossary: list, search, count, hash anchor', async () => {
      const all = await page.locator('#words dt, #words li, #words > *').count();
      ok(all > 50, `words ${all}`);
      await page.fill('#word-search', 'iprem');
      ok(/1 palabra/.test(await page.locator('#word-count').innerText()), await page.locator('#word-count').innerText());
    });
    await check('glossary: no JS errors', async () => ok(errors.length === 0, errors.join(' | ')));
    await context.close();
  }
  {
    const { page, context, errors } = await open('entidades/');
    await check('organisations: copy embed code, preview iframe loads', async () => {
      await page.click('#copy-code');
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => navigator.clipboard.readText())).includes('embed.js'), 'clipboard');
      ok((await page.locator('#copied').innerText()).length > 0, 'copied msg');
      const f = page.frameLocator('iframe.organisations-view');
      await f.locator('.zone').first().waitFor({ timeout: 10000 });
    });
    await check('organisations: no JS errors', async () => ok(errors.length === 0, errors.join(' | ')));
    await context.close();
  }
  {
    const { page, context, errors } = await open('fuentes/');
    await check('sources: figures table, year, reviewed, chart, report links', async () => {
      ok((await page.locator('#figures-table tr').count()) > 5, 'table');
      ok(/20\d\d/.test(await page.locator('#year').innerText()), 'year');
      ok((await page.locator('#reviewed').innerText()).includes('Revisadas'), 'reviewed');
      ok((await page.locator('#evolution polyline').count()) >= 3, 'chart');
      const t = await page.locator('a[data-notice]').evaluateAll((as) => as.map((a) => new URL(a.href).searchParams.get('template')));
      ok(t.length === 3 && t.every(Boolean), 'templates');
    });
    await check('sources: no JS errors', async () => ok(errors.length === 0, errors.join(' | ')));
    await context.close();
  }

  // ─────────────── Generated pages, guides, 404, widget, embed ───────────────
  for (const p of ['ayuda/imv/', 'ayuda/tarxeta-benvida/', 'comunidad/', 'comunidad/madrid/', 'comunidad/galicia/', 'en/', 'ca/', 'va/', 'gl/', 'eu/', 'no-existe/']) {
    await check(`page ${p}: loads, no bad text, no errors, links resolve`, async () => {
      const { page, context, errors } = await open(p);
      const t = await page.locator('body').innerText();
      ok(t.length > 200 && !/undefined|NaN|\[object/.test(t), 'text');
      const hrefs = await page.locator('a[href^="/"], a[href^="../"], a[href^="./"]').evaluateAll((as) => [...new Set(as.map((a) => a.href.split('#')[0]))]);
      for (const h of hrefs) {
        const r = await page.request.get(h);
        ok(r.status() === 200, `${h} ${r.status()}`);
      }
      if (p.startsWith('en/')) {
        await page.evaluate(() => (window.__spoken = []));
        await page.locator('[data-read]').first().click();
        await page.waitForTimeout(200);
        ok((await page.evaluate(() => window.__spoken.length)) > 0, 'guide not read');
      }
      ok(errors.length === 0, errors.join(' | '));
      await context.close();
    });
  }
  await check('every internal link on the main pages returns 200', async () => {
    const { page, context } = await open('');
    const seen = new Set();
    for (const p of ['', 'mayores/', 'catalogo/', 'mapa/', 'palabras/', 'entidades/', 'fuentes/']) {
      await page.goto(base + p);
      for (const h of await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.href.split('#')[0]))) if (h.startsWith(base)) seen.add(h);
    }
    const bad = [];
    for (const h of seen) {
      const r = await page.request.get(h);
      if (r.status() !== 200) bad.push(`${h} ${r.status()}`);
    }
    ok(!bad.length, bad.join(', '));
    await context.close();
  });
  await check('widget mode on map hides header and footer', async () => {
    const { page, context } = await open('mapa/?widget=1');
    ok(!(await page.locator('.header').isVisible()), 'header');
    ok((await page.locator('.widget-footer').count()) === 1, 'widget footer');
    await context.close();
  });
  await check('service worker installs, caches and serves the page offline', async () => {
    const { page, context } = await open('');
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await context.setOffline(true);
    await page.reload();
    ok((await page.locator('h1').innerText()).length > 5, 'offline page');
    await context.close();
  });

  const failed = results.filter((r) => r[0] === '✗').map(([, n, x]) => `${n}: ${x}`);
  console.log(`# ${results.length - failed.length} feature checks passed, ${failed.length} failed`);
  assert.deepEqual(failed, []);
});
