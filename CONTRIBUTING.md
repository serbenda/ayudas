# Contributing

## Workflow

- Work on the `development` branch. Never commit to `main` directly.
- Open a pull request from `development` to `main`. CI runs the unit tests, builds the site and runs the browser and accessibility tests; `main` is published to GitHub Pages when the PR is merged.
- Scheduled Actions only open or update issues. They never commit or open pull requests: a person reviews every change. See [docs/AUTOMATION.md](docs/AUTOMATION.md).

## Branch and tag rules

The repository rules live in [`.github/rulesets/`](.github/rulesets/) so they are versioned with the code:

- **`main.json`** (default branch):
  - changes only arrive through a pull request;
  - CI (`build`) must pass;
  - no force pushes and no deletion.
- **`development.json`**: no force pushes and no deletion.
- **`release-tags.json`** (`v*`): release tags cannot be moved or deleted.

To apply or update them, go to **Settings → Rules → Rulesets → New ruleset → Import a ruleset** and choose the file. If a ruleset with that name already exists, delete it first or edit it by hand.

## Releases

Releases follow [semantic versioning](https://semver.org/): `vMAJOR.MINOR.PATCH`.

- **MAJOR** for changes that break saved answers, public URLs or the embed API.
- **MINOR** for new benefits or features.
- **PATCH** for fixes and figure updates.

Create the release from **Releases → Draft a new release** on `main` once its PR has been merged.

## Layout

| Folder | What goes there |
| --- | --- |
| `site/` | Everything that is published, as it is served. Page folders keep their Spanish names because they are public URLs. |
| `site/assets/js/data/` | Content and official figures. No DOM access. |
| `site/assets/js/lib/` | Pure logic (rules, formatting, voice selection…). No DOM access, except for the browser-only parts of `voice.js` and `reminders.js`. Tested with `node --test`. |
| `site/assets/js/ui/` | Rendering shared by several pages. |
| `site/assets/js/pages/` | One entry module per page. Only these touch page-specific elements. |
| `scripts/build/` | Build steps: `build.mjs` copies `site/` to `_site/`, generates the per-benefit and per-region pages, language guides and sitemap, and versions CSS and JS references. |
| `scripts/watch/` | Scheduled checks used by the Actions. Each writes a Markdown report (git-ignored) that becomes an issue. |
| `tests/unit/`, `tests/e2e/` | Unit tests and browser tests. |

## Naming

- **Code is in English**: file names, functions, variables, object properties, CSS classes and custom properties, element ids, `data-*` attributes, comments, test names and console output.
- **Content is in Spanish**: everything a visitor reads, and the ids that are part of the content or of public interfaces. These stay in Spanish on purpose:
  - benefit, region, category, document, phone, icon and glossary ids (`imv`, `castilla-leon`, `libroFamilia`…);
  - answer values used by the rules (`'si'`, `'quizas'`, `'paro-sin'`, `'padre'`…) and the example ids;
  - public URLs and fragments (`/mayores/`, `/ayuda/<id>/`, `#ayuda-hoy`, `#t-error`, `#ayuda-<id>`);
  - the embed API (`data-ayudas`, `data-comunidad`, the `cuestionario`/`mayores`/`mapa`/`catalogo` types and the `{ ayudas: 'altura' }` message);
  - field names of external APIs (BOE, BDNS) and the titles and bodies of the issues the Actions open (they are matched by title).
- Use `camelCase` for JS names, `UPPER_SNAKE_CASE` for module-level constant tables, and `kebab-case` for CSS classes, ids and `data-*` attributes.

## Style

- No frameworks and no runtime dependencies. Dev tools (Playwright, axe, the font package) are installed with `--no-save` only where needed.
- ES modules, 2-space indentation, LF line endings (see `.editorconfig`). JS is formatted with Prettier (`npm run format`) and checked with ESLint; CSS and HTML keep their compact hand-written style.
- Every figure lives in `site/assets/js/data/figures.js` with its source. When a figure changes, change it there.
- Every card has a review date in `site/assets/js/data/review.js`. Update it when you review a card.
- Keep sentences on the site short and plain: tests check that the easy summaries stay short.

## Reporting problems

Wrong data, missing benefits and bugs go through the issue forms in `.github/ISSUE_TEMPLATE/` (the Sources page links to them with the page filled in). Security problems go privately: see [SECURITY.md](SECURITY.md).

## Before opening a pull request

```sh
npm run lint
npm test
npm run build
npm run tools        # once
npm run test:e2e
```
