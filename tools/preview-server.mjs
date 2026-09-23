// Serves dist/ the way GitHub Pages does: extensionless URLs such as
// /experience resolve to experience.html. python -m http.server cannot, so
// every navigation link 404s there. Usage: node tools/preview-server.mjs [port]
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2]) || 4321;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    // A malformed escape such as /%E0%A4%A throws; left unhandled inside this
    // async handler it would terminate the whole server.
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
    return;
  }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let file = normalize(join(root, relative));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
  } catch {
    if (!extname(file)) file += '.html';
  }
  try {
    const info = await stat(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size
    });
    createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch {
    const notFound = join(root, '404.html');
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(notFound).on('error', () => response.end('Not found')).pipe(response);
  }
}).listen(port, '127.0.0.1', () => console.log(`Previewing dist/ at http://localhost:${port}/`));
