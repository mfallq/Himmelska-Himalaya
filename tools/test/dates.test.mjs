// addDays must move by calendar date, also across a clock change.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../config.mjs';

const util = pathToFileURL(path.join(ROOT, 'js', 'util.js')).href;
// Runs a script in a child process, because the time zone is read at start-up.
const run = (tz, code) => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hh-')), 'case.mjs');
  fs.writeFileSync(file, code);
  return execFileSync(process.execPath, [file], { env: { ...process.env, TZ: tz }, encoding: 'utf8' }).trim();
};

for (const tz of ['Europe/Stockholm', 'America/New_York', 'Asia/Kathmandu', 'Australia/Sydney']) {
  test(`addDays keeps midnight across clock changes (${tz})`, () => {
    const out = run(tz, `
      import { addDays, parseISO } from '${util}';
      const out = [];
      for (const start of ['2027-10-20', '2027-03-20', '2027-04-01', '2027-10-01']) {
        const s = parseISO(start);
        for (let n = 0; n < 40; n++) { const d = addDays(s, n); out.push(d.getHours() + ':' + d.getMinutes()); }
      }
      console.log([...new Set(out)].join(','));`);
    assert.equal(out, '0:0');
  });
}

test('18 days from 20 Oct 2027 end on 6 Nov in Stockholm', () => {
  const out = run('Europe/Stockholm', `
    import { addDays, parseISO, dateShort } from '${util}';
    console.log(dateShort(addDays(parseISO('2027-10-20'), 17)));`);
  assert.equal(out, '6 Nov');
});
