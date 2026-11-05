# Automation

This guide is for whoever maintains the site, now or in a year's time. It covers what runs on its own, when it runs, what it produces and what to do with each result.

**The key rule:** automation never changes the site. It only **opens GitHub issues**. A person reads each issue, checks the official source, makes the change on `development` and merges it through a pull request. A wrong figure on a benefits website can hurt people, so a human always has the last word.

## Overview

| Workflow | When (UTC) | Job | What it does | Issue it opens |
| --- | --- | --- | --- | --- |
| [`publish.yml`](../.github/workflows/publish.yml) | Every PR to `main` | `build` | Tests and builds the site | — (the PR shows ✓ or ✗) |
| [`publish.yml`](../.github/workflows/publish.yml) | Every push to `main` | `build` + `deploy` | Tests, builds and publishes to GitHub Pages | — |
| [`publish.yml`](../.github/workflows/publish.yml) | Mondays 06:23 | `links` | Checks the official links and the week's BOE | "Enlaces oficiales rotos", "Novedades del BOE que pueden cambiar cifras" |
| [`watch.yml`](../.github/workflows/watch.yml) | Mondays 06:41 | `weekly` | New calls in the BDNS, cards due for review | "Convocatorias nuevas de ayudas que recoge la web", "Fichas por revisar" |
| [`watch.yml`](../.github/workflows/watch.yml) | 2 January 07:17 | `january` | Checklist for the new year's figures | "Revisar las cifras de <year>" |

Madrid time is UTC+1 in winter and UTC+2 in summer.

Every job can also be run by hand from **Actions → the workflow → Run workflow**. For `watch.yml`, choose `weekly` or `january`. Running `publish.yml` by hand both publishes the site and runs the link and BOE checks.

Issue titles and bodies are in Spanish. The workflows look for an open issue **by its exact title**: they add a comment to it instead of opening a duplicate. Do not rename these issues.

## 1. Publishing (`publish.yml` → `build` and `deploy`)

The `build` job runs these steps in order:

1. **Unit tests.** `npm test` runs the rules, procedures, figures, watchers and voice tests in `tests/unit/`.
2. **Font.** `npm run font` downloads Archivo once and copies it to `site/vendor/fonts/`, so the site serves its own font.
3. **Build.** `npm run build` copies `site/` to `_site/` and generates `/ayuda/<id>/`, `/comunidad/<id>/`, the language guides and `sitemap.xml`. It also adds `?v=<commit>` to every CSS and JS reference, so nobody gets new HTML with old JS.
4. **Browser tests.** `npm run test:e2e` runs Playwright and axe (WCAG 2.2 AA) on every page. It covers mobile, tablet and desktop, light and dark modes, high contrast and the main flows.

The `deploy` job uploads `_site/` to GitHub Pages, but only on a push to `main` or a manual run. Pull requests are only tested.

**If it fails:** open the run. The last step prints the failing assertions as `::error::` lines. Run the same commands locally (see the [README](../README.md#how-it-is-built)) and fix the problem on `development`.

## 2. Official links (`publish.yml` → `links`, Mondays)

- **Script:** [`scripts/watch/links.mjs`](../scripts/watch/links.mjs), also runnable as `npm run watch:links`.
- **What it checks:** every `https://` link in the benefit cards, the region websites, the figure sources and the main pages. It tries each link twice, 3 s apart, with a 20 s timeout.
- **Robots:** responses 401, 403, 405 and 429 count as "doubtful but OK", because many public websites block robots.
- **Output:** `broken-links.md`. The script exits with an error when something is broken.
- **Issue:** "Enlaces oficiales rotos". It is opened when a link breaks, commented on in later weeks and **closed automatically** once everything works again.

**What to do with the issue:**

1. Open each broken link in a browser.
2. If the page has moved, find its new address on the agency's website and update it in `site/assets/js/data/` (`benefits.js`, `regional-benefits.js` or `regions.js`) or in the page's HTML.
3. If it was a temporary outage, do nothing: the issue closes itself the next Monday.

## 3. BOE watch (`publish.yml` → `links`, Mondays)

- **Script:** [`scripts/watch/boe.mjs`](../scripts/watch/boe.mjs), also `npm run watch:boe [days]`. It looks back 7 days by default.
- **What it reads:** the BOE open-data summaries (`https://www.boe.es/datosabiertos/api/boe/sumario/YYYYMMDD`), sections 1 (general provisions) and 3 (other provisions) only.
- **What it looks for:** titles about pensions, minimum wage, IPREM and Budget, IMV, social discount, dependency, unemployment, family, housing and prescription charges. The list is `TOPICS` in the script.
- **Output:** `boe-news.md`.
- **Issue:** "Novedades del BOE que pueden cambiar cifras", with a link to each provision. It does not close itself: close it once you have reviewed everything.

**What to do with the issue:**

1. Read each provision.
2. If it changes a figure, update it in [`site/assets/js/data/figures.js`](../site/assets/js/data/figures.js), together with its source in `FIGURE_SOURCES`. Every card and rule reads from there.
3. Add a year to `HISTORY` if needed.

Many matches will be false alarms (for example, a pension provision for a specific group). That is expected.

## 4. New calls for applications (`watch.yml` → `weekly`, Mondays)

- **Script:** [`scripts/watch/calls.mjs`](../scripts/watch/calls.mjs), also `npm run watch:calls [days]`. It looks back 8 days by default.
- **Why it exists:** regional and city benefits usually open a new call every year, with new dates and amounts.
- **What it reads:** the public API of the National Grants Database (BDNS, infosubvenciones.es), which publishes the calls of every administration.
- **How it searches:** by the text of each entry in `WATCHLIST`, filtered by region.
- **Output:** `new-calls.md`, a checklist with each call and the card it affects.
- **Issue:** "Convocatorias nuevas de ayudas que recoge la web". It does not close itself.

**What to do with the issue:**

1. For each call, check whether it is really the benefit on the site.
2. If it is, update the card in `site/assets/js/data/regional-benefits.js` (amount, requirements, how to apply) and its dates in `CHECK_ON` in `site/assets/js/data/review.js`.

**When you add a new regional or city benefit,** add a line to `WATCHLIST` so its calls are watched too. The line has three parts: text to search, region as the BDNS writes it (upper case, no accents) and card id.

If every search fails, the issue says so. If that repeats for several weeks, the BDNS API has probably changed: compare the request in `searchBdns()` with what the website at infosubvenciones.es sends.

## 5. Cards due for review (`watch.yml` → `weekly`, Mondays)

- **Script:** [`scripts/watch/review.mjs`](../scripts/watch/review.mjs), also `npm run watch:review`.
- **Data:** [`site/assets/js/data/review.js`](../site/assets/js/data/review.js) holds three things:
  - `DEFAULT_REVIEWED`: the month every card was last reviewed, unless the card says otherwise;
  - `REVIEWED`: cards reviewed on a different date (`id: 'YYYY-MM'`);
  - `CHECK_ON`: the date to look at a card's call again (`id: 'YYYY-MM-DD'`). That is when its application period ends, or when next year's call usually comes out.
- **What it flags:** cards **not reviewed for 12 months**, and cards whose `CHECK_ON` date has arrived.
- **Output:** `to-review.md`.
- **Issue:** "Fichas por revisar". It **closes itself** when nothing is pending.

**What to do with the issue:**

1. Review the card against its official source.
2. Set today's month in `REVIEWED` and, if the card has a call, set its next date in `CHECK_ON`.

The website shows "Revisado en …" on each card based on these dates, so keep them honest.

## 6. New year's figures (`watch.yml` → `january`, 2 January)

- **Script:** [`scripts/watch/january.mjs`](../scripts/watch/january.mjs), also `npm run watch:january [days]`. It reads the last 60 days of BOE by default.
- **Why it exists:** almost every figure changes in January, including IPREM, minimum wage, pensions, IMV and non-contributory pensions.
- **What it produces:** `january.md`, which contains:
  - a checklist with every entry in `FIGURE_SOURCES` and its current value;
  - the regional minimum incomes (`regions.js`), the regional deductions (`deductions.js`) and the chart history (`HISTORY`);
  - if the BOE has already published the new minimum wage, **the exact change to make**;
  - the BOE provisions it found.
- **Issue:** "Revisar las cifras de <year>". A new one is opened every year.

**What to do with the issue:**

1. Work through the checklist and update `figures.js`.
2. Run `npm test`, because some tests check calculations with the figures.
3. Open the PR.

Some figures come out later: pensions in a Real Decreto, and the minimum wage sometimes in February. You can run the job again by hand (`january`) as often as you like.

## Things that can go wrong

- **Scheduled runs are paused after 60 days without activity.** If nobody commits to the repo for 60 days, GitHub disables the scheduled workflows and sends an email. To reactivate them, go to **Actions → the workflow → Enable workflow**, or push any commit.
- **Schedules only run from `main`.** A change to a workflow on `development` has no effect until it is merged.
- **Delays.** GitHub can start scheduled runs minutes or even an hour late. That is normal.
- **An external API changes.** The BOE and BDNS field names are used as-is in the scripts (`sumario`, `diario`, `seccion`, `codigo`, `titulo`, `descripcion`, `nivel1`…). If a watcher suddenly finds nothing for weeks, run it locally and inspect the raw response.
- **Permissions.** The workflows only use the built-in `GITHUB_TOKEN`, with `issues: write`, `pages: write` and `contents: read`. No secrets need to be set up. The bot can open issues but never push code.
- **Report files** (`broken-links.md`, `boe-news.md`, `new-calls.md`, `to-review.md`, `january.md`) are written to the repo root and git-ignored. They only exist during the run.

## Running everything locally

```sh
npm run watch:links      # writes broken-links.md, exits 1 if a link is broken
npm run watch:boe 14     # BOE of the last 14 days → boe-news.md
npm run watch:calls 30   # BDNS calls of the last 30 days → new-calls.md
npm run watch:review     # → to-review.md
npm run watch:january    # → january.md
```

The scripts need Node 22 (see `.nvmrc`) and internet access. They have no dependencies.
