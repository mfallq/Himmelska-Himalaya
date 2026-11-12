// Copies the files a browser needs into another site's folder.
//   node tools/publish.mjs <target folder>
// Example: node tools/publish.mjs ../expandialabs/site/himmelska-himalaya
// The target is emptied of previously published files first, so removed files
// do not linger. Tools, docs and agent configuration are never copied.
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './config.mjs';

const target = process.argv[2] && path.resolve(process.argv[2]);
if (!target) {
  console.error('usage: node tools/publish.mjs <target folder>');
  process.exit(1);
}
if (target === ROOT || ROOT.startsWith(target + path.sep) || target.startsWith(ROOT + path.sep)) {
  console.error('publish: the target must be outside this repository');
  process.exit(1);
}

const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'precache.json'), 'utf8'));
const files = [
  ...manifest.files.map((f) => f.url).filter((u) => u !== './'),
  'sw.js',
  'precache.json',
  'assets/terrain/satellite.jpg',
  'assets/terrain/satellite-small.jpg',
];
const MARKER = '.published-from-himmelska-himalaya';

// Only clear a folder this script created.
try {
  const existing = await fs.readdir(target);
  if (existing.length && !existing.includes(MARKER)) {
    console.error(`publish: ${target} exists and was not created by this script. Not touching it.`);
    process.exit(1);
  }
  await fs.rm(target, { recursive: true, force: true });
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

for (const rel of files) {
  const to = path.join(target, rel);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(path.join(ROOT, rel), to);
}
for (const licence of ['OFL-Instrument-Sans.txt', 'OFL-Instrument-Serif.txt']) {
  await fs.copyFile(path.join(ROOT, 'assets', 'fonts', licence), path.join(target, 'assets', 'fonts', licence));
}
await fs.copyFile(path.join(ROOT, 'deploy', 'htaccess'), path.join(target, '.htaccess'));
await fs.writeFile(path.join(target, MARKER), `version ${manifest.version}\n`);
console.log(`published ${files.length + 3} files (version ${manifest.version}) to ${target}`);
