// Today's stage, and progress along the trail from a GPS position.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.mjs';

// data.js loads its files with fetch: answer from disk.
globalThis.fetch = async (url) => {
  const file = path.join(ROOT, String(url));
  return fs.existsSync(file) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) } : { ok: false };
};
const { tripState } = await import('../../js/lib/tripday.js');
const { nearestOnTrack, progress, dayRange, nearestStop } = await import('../../js/lib/track.js');
const { data, loadData, STOPS, stopsOf, TRIP } = await import('../../js/data.js');
await loadData();

test('no date: no phase', () => {
  assert.equal(tripState({ startDate: '' }).phase, 'nodates');
});
test('before, during, after', () => {
  const s = { startDate: '2027-10-20' };
  assert.deepEqual(tripState(s, new Date('2027-10-15T12:00:00Z')).phase, 'before');
  assert.equal(tripState(s, new Date('2027-10-15T12:00:00Z')).daysTo, 5);
  assert.equal(tripState(s, new Date('2027-10-20T05:00:00Z')).day, 1);
  assert.equal(tripState(s, new Date('2027-10-30T05:00:00Z')).day, 11);
  assert.equal(tripState(s, new Date('2027-11-06T05:00:00Z')).day, 18);
  assert.equal(tripState(s, new Date('2027-11-07T05:00:00Z')).phase, 'after');
});
test('the day follows Nepal time, not the phone', () => {
  // 20:00 UTC on 29 Oct is already 30 Oct in Nepal (UTC+5:45).
  assert.equal(tripState({ startDate: '2027-10-20' }, new Date('2027-10-29T20:00:00Z')).day, 11);
});
test('a slipped plan holds the stage back', () => {
  assert.equal(tripState({ startDate: '2027-10-20', shift: 1 }, new Date('2027-10-30T05:00:00Z')).day, 10);
  assert.equal(tripState({ startDate: '2027-10-20', shift: 3 }, new Date('2027-10-21T05:00:00Z')).day, 1);
});

test('the walk is loaded', () => {
  assert.ok(data.track.length > 1000);
  assert.ok(Math.abs(data.trackKm - 160) < 8, `trackKm ${data.trackKm}`);
});

test('a point on every walking day is found on that day, and the halves add up', () => {
  for (const n of [4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]) {
    const r = dayRange(data.track, n);
    assert.ok(r, `day ${n}`);
    const mid = data.track[(r.i0 + r.i1) >> 1];
    const p = progress(data.track, mid.lon, mid.lat, n);
    assert.ok(p.onDay && p.onTrail, `day ${n}`);
    assert.ok(Math.abs(p.done + p.left - (r.kmEnd - r.kmStart)) < 0.01, `day ${n}`);
    assert.ok(p.done > 0.5 && p.left > 0.5, `day ${n}`);
  }
});

test('thirty metres off the trail still counts as on it; two kilometres does not', () => {
  const r = dayRange(data.track, 11);
  const mid = data.track[(r.i0 + r.i1) >> 1];
  const near = progress(data.track, mid.lon, mid.lat + 0.0003, 11); // about 33 m north
  assert.ok(near.onTrail, `off ${near.off}`);
  const far = progress(data.track, mid.lon, mid.lat + 0.03, 11); // about 3 km north
  assert.ok(!far.onTrail && far.off > 1, `off ${far.off}`);
});

test('from Thorong Phedi the next stop on day 11 is High Camp', () => {
  const stops = stopsOf(11).map((id) => ({ id, ...STOPS[id] }));
  const phedi = STOPS.thorongphedi;
  const p = progress(data.track, phedi.lon, phedi.lat, 11, stops);
  assert.equal(p.next.name, 'High Camp', JSON.stringify(p.next));
  assert.ok(p.next.ahead > 0.5 && p.next.ahead < 3);
  assert.ok(p.up > 800 && p.down > 1400, `up ${p.up} down ${p.down}`);
});

test('standing on another day\'s trail is reported as such', () => {
  const r = dayRange(data.track, 7);
  const mid = data.track[(r.i0 + r.i1) >> 1];
  const p = progress(data.track, mid.lon, mid.lat, 11);
  assert.equal(p.onDay, false);
  assert.equal(p.hitDay, 7);
});

test('far from Nepal nothing breaks', () => {
  const p = progress(data.track, 18.07, 59.33, 11); // Stockholm
  assert.ok(p.off > 5000);
  assert.equal(p.onTrail, false);
  assert.ok(nearestOnTrack(data.track, 85.32, 27.7).dist > 50);
});

test('nearest stop', () => {
  const stops = Object.values(STOPS);
  const h = nearestStop(stops, STOPS.manang.lon + 0.001, STOPS.manang.lat);
  assert.equal(h.stop.name, 'Manang');
});
test('the plan has eighteen days', () => assert.equal(TRIP.days, 18));
