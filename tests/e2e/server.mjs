// Servidor estático mínimo que imita GitHub Pages: sirve _site/ (o RAIZ_WEB) en la raíz, como ayudas.bendi.dev.
// Lo usan los tests de navegador.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml', '.txt': 'text/plain',
};

export async function start(root = process.env.SITE_ROOT ?? new URL('../../_site/', import.meta.url).pathname) {
  const server = createServer(async (req, res) => {
    const requested = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let routePath = normalize(join(root, requested));
    if (!routePath.startsWith(normalize(root))) { res.writeHead(403).end(); return; }
    try {
      if ((await stat(routePath)).isDirectory()) routePath = join(routePath, 'index.html');
      res.writeHead(200, { 'Content-Type': TYPES[extname(routePath)] ?? 'application/octet-stream', 'Cache-Control': 'max-age=600' });
      res.end(await readFile(routePath));
    } catch {
      // Como GitHub Pages: la página 404 propia, con su código
      try {
        res.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(await readFile(join(root, '404.html')));
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('no encontrado');
      }
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return {
    base: `http://127.0.0.1:${server.address().port}/`,
    close: () => new Promise((ok) => server.close(ok)),
  };
}
