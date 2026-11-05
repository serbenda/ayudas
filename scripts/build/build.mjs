// Builds the published site into _site/ (what GitHub Pages serves).
// 1. Copies site/ as is.
// 2. Generates one page per benefit and per region, the language guides and sitemap.xml (pages.mjs).
// 3. Adds a version (?v=…) to every CSS and JS reference, so nobody mixes new HTML with old CSS or JS.
// Usage: node scripts/build/build.mjs [version]   (CI passes the commit SHA)

import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

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

let versioned = 0;
for await (const file of files(out)) {
  if (file.endsWith('.html')) {
    const html = await readFile(file, 'utf8');
    await writeFile(file, html.replace(/(href="[^"]+\.css)"/g, `$1?v=${version}"`).replace(/(src="[^"]+\.js)"/g, `$1?v=${version}"`));
  } else if (file.endsWith('.js') && file.includes('/assets/js/')) {
    const js = await readFile(file, 'utf8');
    const stamped = js.replace(/(from\s+'\.{1,2}\/[^']+\.js)'/g, `$1?v=${version}'`);
    if (stamped !== js) versioned++;
    await writeFile(file, stamped);
  }
}
if (!versioned) throw new Error('No JS imports were versioned');
console.log(`_site/ built (version ${version}, ${versioned} JS files with versioned imports).`);
