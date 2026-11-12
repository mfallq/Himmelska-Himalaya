// The file list and the worker must agree, and every listed file must exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from '../config.mjs';

execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build-precache.mjs')], { stdio: 'pipe' });
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'precache.json'), 'utf8'));
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

test('manifest has a version and hashed files', () => {
  assert.match(manifest.version, /^[0-9a-f]{12}$/);
  assert.equal(manifest.files[0].url, './');
  for (const f of manifest.files) assert.ok(f.url && f.hash, JSON.stringify(f));
});
test('every listed file exists', () => {
  for (const f of manifest.files) if (f.url !== './') assert.ok(fs.existsSync(path.join(ROOT, f.url)), f.url);
});
test('sw.js carries the same version', () => {
  assert.ok(sw.includes(`const VERSION = '${manifest.version}';`));
});
test('satellite pictures stay out of the list', () => {
  assert.ok(!manifest.files.some((f) => /satellite/.test(f.url)));
});
test('the build is repeatable', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build-precache.mjs')], { stdio: 'pipe' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT, 'precache.json'), 'utf8')).version, manifest.version);
});
