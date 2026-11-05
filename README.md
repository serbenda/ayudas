<div align="center">

<a href="https://ayudas.bendi.dev/"><img src="site/assets/img/favicon.svg" width="112" alt="ayudas logo: a life ring"></a>

# ayudas

**Find out which public benefits you may be entitled to in Spain by answering a few questions.**<br>
Family, older people, pensions, disability, long-term care, housing, unemployment and tax deductions. No sign-up, no cookies, and your answers never leave the browser.

[![Open the website](https://img.shields.io/badge/open_the_website-ayudas.bendi.dev-1f6b68?style=for-the-badge)](https://ayudas.bendi.dev/)

[![Publish](https://github.com/serbenda/ayudas/actions/workflows/publish.yml/badge.svg)](https://github.com/serbenda/ayudas/actions/workflows/publish.yml)
[![Watch for changes](https://github.com/serbenda/ayudas/actions/workflows/watch.yml/badge.svg)](https://github.com/serbenda/ayudas/actions/workflows/watch.yml)
![No dependencies](https://img.shields.io/badge/dependencies-0-1f6b68)
![No cookies](https://img.shields.io/badge/cookies-0-1f6b68)
[![Support on GitHub Sponsors](https://img.shields.io/badge/support-GitHub_Sponsors-bf3989?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/serbenda)
[![All rights reserved](https://img.shields.io/badge/license-all_rights_reserved-1c2230)](LICENSE)

</div>

---

> The website itself is in Spanish (with starter guides in Catalan, Valencian, Galician, Basque and English). This README is in English. Benefit names are kept in Spanish, because that is how they are called at the counter.

## Contents

1. [What it is](#what-it-is)
2. [Pages](#pages)
3. [Which benefits it covers](#which-benefits-it-covers)
4. [How it decides what you get](#how-it-decides-what-you-get)
5. [Figures and where they come from](#figures-and-where-they-come-from)
6. [Accessibility](#accessibility)
7. [Privacy](#privacy)
8. [How it is built](#how-it-is-built)
9. [How it is published](#how-it-is-published)
10. [Keeping it up to date (automatically)](#keeping-it-up-to-date-automatically)

## What it is

Many people never claim benefits they are entitled to, because they do not know they exist or are not sure whether they qualify. **ayudas** asks a few simple questions (age, who lives at home, income, housing, disability, long-term care needs, pension, work) and shows the benefits you may be entitled to, with:

- **why it shows up**, using your own answers;
- **what still needs checking** (an open call, your region's exact limit, contributions…);
- **how much it pays in 2026** and, where possible, an estimate for your case;
- **how to apply, step by step**: where, who to call, which papers to bring, how long it takes and what to do if they say no.

It is a sister project of [hucha](https://github.com/serbenda/hucha) (where public money goes) and shares its style.

## Pages

| Page | What it has |
| --- | --- |
| **Your benefits** (`/`) | A 6-step questionnaire and the list of benefits you may get, with **where to start**, the **papers** you need, progress tracking for each benefit and a **printable sheet**. Topic shortcuts, an "I need help today" button with phone numbers, and a chart of how benefits have risen since 2018. |
| **Older people** (`/mayores/`) | For older people or anyone not comfortable with phones: one question at a time, big buttons, short sentences, **read aloud**, and each benefit's steps explained. |
| **All benefits** (`/catalogo/`) | Every benefit card, with search (accent-insensitive) and topic filters. Pick your region and links point to its website. |
| **Map** (`/mapa/`) | Map of Spain: tap your region (or pick it from a list) to see what its minimum income is called and how much it pays, the region's own benefits and the ones it manages, with their steps. |
| **Cards** (`/ayuda/<id>/` and `/comunidad/<id>/`) | One page per benefit and per region, with FAQ structured data for search engines. Generated at build time by `scripts/build/pages.mjs`, which also builds `sitemap.xml`. |
| **Difficult words** (`/palabras/`) | 74 bureaucratic terms (IPREM, padrón, Cl@ve, base imponible, recurso de alzada…) explained in short sentences, with search. In every card these words are underlined: tap one to see what it means. |
| **Organisations** (`/entidades/`) | For social services and NGOs: professional mode (case reference and notes that print, all kept locally) and code to embed the questionnaire, the older people page or the map in another website (`embed.js`). |
| **Language guides** (`/ca/`, `/va/`, `/gl/`, `/eu/`, `/en/`) | Starter guides in Catalan, Valencian, Galician, Basque and English: where to start, emergency numbers, the main benefits with their official Spanish names, and a sentence in Spanish to show at the counter. |
| **Sources** (`/fuentes/`) | How it works, the 2026 figures with their sources, where benefits are applied for and how to report an error. |

## Which benefits it covers

84 benefits in eight topics. Each explains **how to apply, step by step**, with region-specific steps when they differ. Procedures live in [`procedures.js`](site/assets/js/data/procedures.js); phone numbers, papers and difficult words in [`guide.js`](site/assets/js/data/guide.js).

- **If you need it now:** social emergency aid, food, gender violence (016), eviction, homelessness, loneliness, and healthcare without papers.
- **Income and benefits:** Ingreso Mínimo Vital (minimum income), regional minimum income, unemployment benefit and allowances, allowance for over-52s.
- **Children and family:** child support supplement, birth leave (19 weeks), birth allowance and one-off payment, large family title, care of children with serious illness, nursery school and school aid, orphan's pension.
- **Older people and pensions:** non-contributory pension, minimum pension supplement, gender gap supplement, retirement, widow's pension, IMSERSO trips and spas, telecare and home help.
- **Disability and long-term care:** dependency assessment, family carer allowance, care services, free Social Security contributions for carers, disability certificate, dependent child allowance, non-contributory disability pension, tax and parking benefits.
- **Housing and utilities:** electricity and heating social discount, rent aid (general and for young people), rent supplement for non-contributory pensioners, ICO state guarantee to buy a first home.
- **Income tax deductions:** maternity and nursery, large family, single parent, relative with disability, disability allowance, and each region's own deductions.
- **Each region's own benefits** ([`regional-benefits.js`](site/assets/js/data/regional-benefits.js)): Tarxeta Benvida (Galicia), monthly child benefit (Basque Country), Becas Concilia 0-3 (Asturias), Bono Nacimiento (Castilla y León), birth grant in villages (Extremadura), Xec Cangur (Balearic Islands), supplement to the non-contributory pension (Canary Islands and Catalonia), third child and multiple births (Andalusia), large and single-parent families (Valencian Community, Castilla-La Mancha and Murcia), birth grants (Cantabria), children aged 0-3 (Navarre), multiple births (Aragon) and Bono Infantil (La Rioja). Each has its rule, its steps and the dates of its call for applications.
- **Madrid region and city:** RMI, Tarjeta Familias, Canal de Isabel II water discount, social housing, free nursery schools, telecare, free transport from age 65.
- **Large cities:** Barcelona Children's Fund, València birth grant, Zaragoza urgent aid, free childcare at home in Málaga, and the Basque Social Emergency Aid (AES).
- **Self-employed:** €80 flat rate and self-employed unemployment benefit.
- **Returning to Spain:** allowance for returning emigrants.
- **Health:** wheelchairs, prostheses and hearing aids from public healthcare; free or cheaper medicines.
- **Other:** grants and free legal aid.

Per region the site also has: how much the minimum income pays (Ministry of Social Rights figures and each region's own), who assesses dependency and disability and where to start, and its income tax deductions (with amounts for Andalusia, Catalonia, Galicia and Madrid).

## How it decides what you get

Each benefit has a rule in [`rules.js`](site/assets/js/lib/rules.js) (pure functions, no DOM) — regional ones live next to their card in [`regional-benefits.js`](site/assets/js/data/regional-benefits.js) — that returns:

- **You meet the main requirements** (`si`): with your answers you fit the key requirements.
- **Check if you qualify** (`quizas`): it may apply, but it depends on something not asked or not answered.
- nothing, if it does not fit.

Some of the calculations:

- **IMV guaranteed income** by household: €733.60 for one adult, +30% per extra person (up to 220%) and +22% for single-parent households or with disability ≥ 65% or grade III dependency. The estimated IMV is the guaranteed income minus household income.
- **Electricity social discount limit**: 1.5 × IPREM (14 payments), +0.5 per child (up to two) and +0.5 with disability, grade II or III dependency or single-parent family. "Severe" below half.
- **Minimum pension** for your type, age and spouse, and the supplement up to it.
- **Gender gap supplement**: €36.90 per child (up to 4) if the pension started in 2021 or later.

Without residence papers, benefits that require legal residence are hidden, but those that do not are shown (healthcare, municipal register, food, emergency aid). Urgent needs always come first in "Where to start".

Questions that do not apply are hidden (for example, the single-parent question only appears if you do not live with a partner and have children).

## Figures and where they come from

All figures are in a single place, [`figures.js`](site/assets/js/data/figures.js), with their source next to them. When one changes (pension uprating, minimum wage, IPREM…), it is changed there and updates every card and rule.

| 2026 figure | Value | Source |
| --- | --- | --- |
| IPREM | €600/month · €8,400/year | Extended from the 2023 State Budget |
| Minimum wage (SMI) | €1,221/month · €17,094/year | Royal Decree 126/2026 |
| Pension uprating | +2.7% · minimum +7% · non-contributory and IMV +11.4% | La Moncloa |
| Non-contributory pension | €8,803.20/year | La Moncloa, IMSERSO |
| Unemployment allowance | €570 / €540 / €480 per month | SEPE |
| Electricity social discount | 42.5% / 57.5% | MITECO (back to 35% / 50% in 2027 unless extended) |
| Young people's rent aid | up to €300/month | State Housing Plan 2026-2030 |
| Regional minimum incomes | from €328 (Melilla) to €853.28 (Basque Country) per month for one person | Ministry of Social Rights minimum income report 2025, and each region for 2026 |

## Accessibility

- **Large, easy text**, **high contrast** and **listen** (read aloud) on every page.
- **A more human voice** ([`voice.js`](site/assets/js/lib/voice.js)): picks the best voice each browser has (Edge: Microsoft "Natural" voices; iPhone and Mac: "enhanced" or "premium"; Chrome and Android: Google) and drops robotic and novelty ones. It reads sentence by sentence, with pauses and without Chrome's cut-off on long texts. The "Voz" menu lets you pick another voice ("Mónica · España ★ recomendada") and read more slowly. Language guides are read in their language, and the counter sentence always in Spanish.
- **Difficult words explained** where they appear, plus a full glossary page.
- **Language menu** with flags at the top of every page, next to "Voz".
- Installs on the phone as an app and works offline.
- **Send to a relative**: sends only the list of benefits and a link with the steps (`/catalogo/?ver=…`), never the answers.
- **Calendar reminders**: downloads an `.ics` with dates not to miss (non-contributory pension income statement, income tax campaign, rent aid call, social discount renewal).
- **Save in a link**: answers go in the link after `#`, which the browser never sends to any server.
- Tested with axe (WCAG 2.2 AA) on mobile, tablet and desktop, in light, dark and high-contrast modes.

## Privacy

- Rules run in the browser. **There is no server receiving the answers.**
- Answers are only stored in the browser (`localStorage`) if you tick "Remember my answers"; "Start over" deletes them.
- Visits are counted with GoatCounter, without cookies, as `/ayudas/…` in the same dashboard as the other bendi.dev websites. Answers are never counted.

## How it is built

HTML, CSS and JavaScript (ES modules) with no frameworks and no runtime dependencies. The font (Archivo) is served from the site itself.

```
site/                          What gets published (public URLs stay in Spanish)
  index.html                   Questionnaire and results
  mayores/ catalogo/ mapa/     Older people, all benefits, map
  palabras/ entidades/         Difficult words, organisations
  fuentes/                     Sources and conditions
  embed.js  sw.js              Embed script and service worker
  assets/css/styles.css
  assets/img/                  Icons and favicon
  assets/js/data/              Content: figures, benefits, procedures, regions, glossary…
  assets/js/lib/               Pure logic: rules, formatting, voice, answers link, reminders
  assets/js/ui/                Shared UI: benefit card, region panel, chart, sharing, common code
  assets/js/pages/             One entry point per page
scripts/build/                 build.mjs (into _site/), per-benefit and per-region pages, language guides, font
scripts/watch/                 Links, BOE, BDNS calls, cards to review, January figures review
tests/unit/                    Rules and features (node --test)
tests/e2e/                     Browser and accessibility tests (Playwright + axe)
```

To run it locally (Node 22, see `.nvmrc`):

```sh
npm test                      # unit tests
npm run dev                   # serves site/ locally
npm run build                 # builds _site/ (what GitHub Pages serves)
npm run tools                 # installs Playwright and axe for the browser tests
npm run test:e2e              # browser tests against _site/ (SITE_ROOT=… to test another folder)
```

Code (file names, identifiers, CSS classes, comments) is in English; the content and its ids are in Spanish. See [CONTRIBUTING.md](CONTRIBUTING.md).

## How it is published

The [`publish.yml`](.github/workflows/publish.yml) Action:

1. On every **PR to `main`**: runs the rule tests and the browser tests (axe WCAG 2.2 AA, no horizontal overflow, no errors) on mobile, tablet and desktop, in light, dark and high contrast.
2. On every **push to `main`**: also publishes it to GitHub Pages, with the font included and a version on each CSS/JS file so nobody mixes new and old files.

Work happens on the `development` branch and reaches `main` through a PR.

## Keeping it up to date (automatically)

The site never changes on its own: an Action **warns** with a GitHub issue, a person reviews it and the change goes in through a PR. Wrong figures on a benefits website can hurt people, so a human always checks.

| When | What it checks | What it does |
| --- | --- | --- |
| Every Monday ([`publish.yml`](.github/workflows/publish.yml)) | Every official link in the cards | Opens the issue "Enlaces oficiales rotos" if one breaks, and closes it when they work again |
| Every Monday ([`publish.yml`](.github/workflows/publish.yml)) | The week's **BOE** (pensions, minimum wage, IPREM, IMV, social discount, dependency, unemployment, housing, prescription charges) | Opens "Novedades del BOE que pueden cambiar cifras" with the links |
| Every Monday ([`watch.yml`](.github/workflows/watch.yml)) | New **calls for applications** for the regional and city benefits, in the National Grants Database (BDNS), which publishes the calls of every administration | Opens "Convocatorias nuevas de ayudas que recoge la web" with each call and the card it affects |
| Every Monday ([`watch.yml`](.github/workflows/watch.yml)) | Cards **not reviewed for a year**, and cards whose call date has arrived (`CHECK_ON` in [`review.js`](site/assets/js/data/review.js)) | Opens "Fichas por revisar" as a checklist, and closes it when nothing is pending |
| Every 2 January ([`watch.yml`](.github/workflows/watch.yml)) | Every figure in `FIGURE_SOURCES`, plus the BOE of the last 60 days | Opens "Revisar las cifras de <year>" with the checklist and, if the BOE has already published the new minimum wage, the exact change to make in `figures.js` |

Each card shows "Revisado en …" (reviewed in …). After reviewing one, update its date in `REVIEWED` or its next check date in `CHECK_ON`, both in [`review.js`](site/assets/js/data/review.js).

What each check does, what to do with each issue and what can go wrong is explained in [docs/AUTOMATION.md](docs/AUTOMATION.md).

Both workflows can also be run by hand from the Actions tab ("Run workflow"; for `watch.yml`, choose `weekly` or `january`).

Other things to keep an eye on:

- **When there is a new State Budget**: IPREM.
- **Before 2027**: electricity social discount percentages, retirement age (67) and the possible universal child-rearing benefit, which is **not** approved in 2026.
- Error reports and missing benefits arrive as issues from the Sources page.

---

<sub>Informational website, not linked to any public administration. Whether you are entitled to a benefit is decided by the body that manages it.</sub>
