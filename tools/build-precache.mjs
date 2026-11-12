// Lists every file the site needs offline, with a hash for each, and stamps the
// resulting version into sw.js.
//   node tools/build-precache.mjs
// Run it after adding, removing or changing site files. Output: precache.json
// and the VERSION line in sw.js. The worker keeps one cache per version, so a
// device always holds one complete copy, never a mix of old and new files.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './config.mjs';

const INCLUDE = ['index.html', 'manifest.webmanifest', 'css', 'js', 'data', 'assets'];
// The two satellite pictures are large and a device only needs one of them:
// the page adds the one it actually loads.
const SKIP = /\.(txt|md)$|satellite(-small)?\.jpg$/i;

async function walk(rel, out) {
  const abs = path.join(ROOT, rel);
  const stat = await fs.stat(abs);
  if (stat.isDirectory()) {
    for (const name of (await fs.readdir(abs)).sort()) await walk(path.posix.join(rel, name), out);
  } else if (!SKIP.test(rel)) out.push(rel);
}

const names = [];
for (const entry of INCLUDE) await walk(entry, names);
const files = [{ url: './', hash: 'start' }];
const all = crypto.createHash('sha256');
let bytes = 0;
for (const url of names) {
  const data = await fs.readFile(path.join(ROOT, url));
  bytes += data.length;
  const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, 12);
  all.update(url).update(hash);
  files.push({ url, hash });
}
// The worker itself is part of the version (apart from the version line), so a
// changed worker always gets a cache of its own and never rewrites a live one.
const swPath = path.join(ROOT, 'sw.js');
const sw = await fs.readFile(swPath, 'utf8');
const VERSION_LINE = /const VERSION = '[^']*';/;
if (!VERSION_LINE.test(sw)) throw new Error('sw.js has no VERSION line');
all.update('sw.js').update(sw.replace(VERSION_LINE, ''));
const version = all.digest('hex').slice(0, 12);
await fs.writeFile(path.join(ROOT, 'precache.json'), JSON.stringify({ version, files }, null, 2) + '\n');
await fs.writeFile(swPath, sw.replace(VERSION_LINE, `const VERSION = '${version}';`));
console.log(`precache.json: ${files.length - 1} files, ${(bytes / 1024).toFixed(0)} KB, version ${version}`);
