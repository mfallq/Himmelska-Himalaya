// Lists every file the site needs offline, for the service worker.
//   node tools/build-precache.mjs
// Run it after adding, removing or changing site files. Output: precache.json
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './config.mjs';

const INCLUDE = ['index.html', 'manifest.webmanifest', 'css', 'js', 'data', 'assets'];
// The two satellite pictures are large and a device only needs one of them:
// the service worker keeps whichever one the page actually loads.
const SKIP = /\.(txt|md)$|satellite(-small)?\.jpg$/i;

async function walk(rel, out) {
  const abs = path.join(ROOT, rel);
  const stat = await fs.stat(abs);
  if (stat.isDirectory()) {
    for (const name of (await fs.readdir(abs)).sort()) await walk(path.posix.join(rel, name), out);
  } else if (!SKIP.test(rel)) out.push(rel);
}

const files = [];
for (const entry of INCLUDE) await walk(entry, files);
const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(await fs.readFile(path.join(ROOT, f)));
const manifest = { version: hash.digest('hex').slice(0, 12), files: ['./', ...files] };
await fs.writeFile(path.join(ROOT, 'precache.json'), JSON.stringify(manifest, null, 2) + '\n');
const bytes = (await Promise.all(files.map((f) => fs.stat(path.join(ROOT, f))))).reduce((n, s) => n + s.size, 0);
console.log(`precache.json: ${files.length} files, ${(bytes / 1024).toFixed(0)} KB, version ${manifest.version}`);
