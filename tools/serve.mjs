// Tiny static file server for local development.
//   node tools/serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';

const PORT = Number(process.argv[2] || process.env.PORT || 5173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.gpx': 'application/gpx+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    // Development only: tools/satellite.html builds the satellite texture in
    // the browser (which can decode JPEG tiles) and saves it through here.
    if (req.method === 'PUT' && /^\/assets\/(terrain\/satellite(-small)?\.jpg|icons\/icon-(180|512)\.png)$/.test(url.pathname)) {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        fs.writeFile(file, Buffer.concat(chunks), (err) => res.writeHead(err ? 500 : 204).end());
      });
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}`));
