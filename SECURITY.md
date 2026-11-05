# Security

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report them privately through GitHub: **Security → Report a vulnerability** in this repository ([private vulnerability reporting](https://github.com/serbenda/ayudas/security/advisories/new)).

Include what you found, how to reproduce it and what impact you think it has. You will get an answer as soon as possible, and credit if you want it once it is fixed.

## Scope

ayudas is a static website on GitHub Pages. There is no server, no accounts and no database. The parts that matter most are:

- **Privacy of the answers.** Answers must never leave the browser. They live only in the page, in `localStorage` if the person ticks "Recordar", or in the part of a link after `#`, which browsers never send to servers. Anything that leaks answers to a third party is in scope.
- **Script injection (XSS).** Content is rendered with `innerHTML` after escaping (`esc()` in `site/assets/js/ui/card.js`). Data from a shared link (`#r=…`, `?ver=…`) is validated before use.
- **The embed script** (`site/embed.js`), which runs on other websites.
- **The GitHub Actions**, which only have `contents: read`, `issues: write` and, for publishing, `pages: write`. They are pinned to commits.

Out of scope: the content of third-party websites the site links to, and missing HTTP headers that GitHub Pages does not let us set.

## What is in place

- A **Content-Security-Policy** on every page, added at build time by `scripts/build/build.mjs`. Scripts may only come from the site itself, from GoatCounter (`gc.zgo.at`), or be inline scripts that match a hash. Connections and images may only go to the site and to GoatCounter. Objects and plugins are blocked. The browser tests fail if a page breaks the policy.
- **No runtime dependencies** and a self-hosted font, so no CDN can change what runs on the site.
- **Visit counting without cookies** (GoatCounter), only on the published site, and never with the answers.
- A weekly check for new versions of the pinned Actions (`scripts/watch/actions.mjs`).
