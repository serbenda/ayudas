// Builds the published site into _site/ (what GitHub Pages serves).
// 1. Copies site/ as is.
// 2. Generates one page per benefit and per region, the language guides and sitemap.xml (pages.mjs).
// 3. Adds a version (?v=…) to every CSS and JS reference, so nobody mixes new HTML with old CSS or JS.
// 4. Adds a Content-Security-Policy to every page, allowing its own inline scripts by hash.
// Usage: node scripts/build/build.mjs [version]   (CI passes the commit SHA)

import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = new URL('../../', import.meta.url).pathname;
const out = join(root, '_site');
const version = (process.argv[2] ?? Date.now().toString(36)).slice(0, 8);

await rm(out, { recursive: true, force: true });
await cp(join(root, 'site'), out, { recursive: true });
execFileSync(process.execPath, [join(root, 'scripts/build/pages.mjs'), out], { stdio: 'inherit' });

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

// What the pages may load: only this site, plus GoatCounter for the visit counter.
// Style attributes are used for chart positions and bar widths, hence 'unsafe-inline' for styles only.
// frame-ancestors cannot be set from a <meta> tag (and the site is meant to be embedded anyway).
const GOATCOUNTER = 'https://serbenda.goatcounter.com';
function contentSecurityPolicy(html) {
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].map(
    ([, code]) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`,
  );
  return [
    "default-src 'self'",
    `script-src 'self' ${[...inline, 'https://gc.zgo.at'].join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${GOATCOUNTER}`,
    `connect-src 'self' ${GOATCOUNTER}`,
    "font-src 'self'",
    "frame-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

let versioned = 0;
let protectedPages = 0;
for await (const file of files(out)) {
  if (file.endsWith('.html')) {
    let html = (await readFile(file, 'utf8')).replace(/(href="[^"]+\.css)"/g, `$1?v=${version}"`).replace(/(src="[^"]+\.js)"/g, `$1?v=${version}"`);
    if (html.includes('<meta charset="utf-8">')) {
      html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(html)}">`);
      protectedPages++;
    }
    await writeFile(file, html);
  } else if (file.endsWith('.js') && file.includes('/assets/js/')) {
    const js = await readFile(file, 'utf8');
    const stamped = js.replace(/(from\s+'\.{1,2}\/[^']+\.js)'/g, `$1?v=${version}'`);
    if (stamped !== js) versioned++;
    await writeFile(file, stamped);
  }
}
if (!versioned) throw new Error('No JS imports were versioned');
if (!protectedPages) throw new Error('No page got a Content-Security-Policy');
console.log(`_site/ built (version ${version}, ${versioned} JS files with versioned imports, ${protectedPages} pages with a CSP).`);
