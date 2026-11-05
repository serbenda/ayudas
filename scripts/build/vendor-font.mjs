// Copies the Archivo font from node_modules to vendor/fonts/,
// so the site serves it itself and does not depend on Google Fonts or a CDN.
// Usage (the Action does it):
//   npm install --no-save --no-package-lock @fontsource-variable/archivo@5
//185

import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const target = new URL('site/vendor/fonts/', root);
const sourcePage = new URL('node_modules/@fontsource-variable/archivo/files/', root);

await rm(new URL('site/vendor/', root), { recursive: true, force: true });
await mkdir(target, { recursive: true });

const files = await readdir(sourcePage);
const SUBSETS = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext':
    'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
};

let css = '';
for (const [sub, range] of Object.entries(SUBSETS)) {
  // Prefer the file with every axis (width and weight)
  const file = ['full', 'wdth', 'wght'].map((axis) => `archivo-${sub}-${axis}-normal.woff2`).find((n) => files.includes(n));
  if (!file) throw new Error(`Archivo font not found for ${sub}. Files: ${files.join(', ')}`);
  await cp(new URL(file, sourcePage), new URL(file, target));
  css += `@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  font-stretch: 62% 125%;
  src: url('${file}') format('woff2-variations');
  unicode-range: ${range};
}
`;
  console.log(`Font ${sub}: ${file}`);
}
await writeFile(new URL('archivo.css', target), css);
console.log('vendor/ ready');
