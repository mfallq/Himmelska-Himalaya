// Where a position sits on the mapped trail, and what is left of the day.
// Pure functions over `track`: the walking points in order, each
// { lon, lat, ele, km, day }, as built in data.js.
import { haversine } from '../util.js';

const RAD = Math.PI / 180;
const LAT0 = 28.5; // projection latitude for the whole region
const KX = 111.32 * Math.cos(LAT0 * RAD);
const KY = 110.574;
const xy = (lon, lat) => [lon * KX, lat * KY];
/** Gaps between two walking legs are not trail: skip segments longer than this (km). */
const MAX_SEGMENT_KM = 2;

/**
 * Closest point on the trail: { dist (km), km along the walk, ele, day, index, lon, lat }.
 * `from` and `to` limit the search to the points between those two indexes.
 */
export function nearestOnTrack(track, lon, lat, from = 0, to = track.length - 1) {
  const p = xy(lon, lat);
  let best = null;
  for (let i = Math.max(1, from + 1); i <= to; i++) {
    const a = track[i - 1], b = track[i];
    const A = xy(a.lon, a.lat), B = xy(b.lon, b.lat);
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const len2 = dx * dx + dy * dy;
    if (len2 > MAX_SEGMENT_KM * MAX_SEGMENT_KM) continue;
    const t = len2 ? Math.min(1, Math.max(0, ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / len2)) : 0;
    const d = Math.hypot(p[0] - (A[0] + dx * t), p[1] - (A[1] + dy * t));
    if (!best || d < best.d) best = { d, index: i - 1, t, a, b };
  }
  if (!best) return null;
  const { a, b, t } = best;
  const at = { lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t };
  return {
    dist: haversine([lon, lat], [at.lon, at.lat]),
    km: a.km + (b.km - a.km) * t,
    ele: a.ele + (b.ele - a.ele) * t,
    day: t < 0.5 ? a.day : b.day,
    index: best.index,
    t,
    lon: at.lon,
    lat: at.lat,
  };
}

/** Index range, and km range, of one walking day. */
export function dayRange(track, n) {
  let i0 = -1, i1 = -1;
  for (let i = 0; i < track.length; i++) {
    if (track[i].day !== n) continue;
    if (i0 < 0) i0 = i;
    i1 = i;
  }
  return i0 < 0 ? null : { i0, i1, kmStart: track[i0].km, kmEnd: track[i1].km };
}

/**
 * What is left of day `n` for someone standing at `lon, lat`.
 * `stops` is [{ name, lon, lat, ele }] for the day, used for "next stop".
 */
export function progress(track, lon, lat, n, stops = []) {
  const range = dayRange(track, n);
  let hit = nearestOnTrack(track, lon, lat);
  if (!hit) return null;
  // A village at the end of one day is the start of the next: prefer the day asked for.
  if (range && hit.day !== n) {
    const mine = nearestOnTrack(track, lon, lat, range.i0, range.i1);
    if (mine && mine.dist <= hit.dist + 0.05) hit = { ...mine, day: n };
  }
  const out = { off: hit.dist, onTrail: hit.dist <= 0.35, hitDay: hit.day, hit, range };
  if (!range || hit.day !== n) return { ...out, onDay: false };
  let up = 0, down = 0;
  let prev = hit.ele;
  for (let i = hit.index + 1; i <= range.i1; i++) {
    const d = track[i].ele - prev;
    if (d > 0) up += d;
    else down -= d;
    prev = track[i].ele;
  }
  let next = null;
  for (const s of stops) {
    const at = nearestOnTrack(track, s.lon, s.lat);
    if (!at || at.dist > 0.6 || at.km <= hit.km + 0.05 || at.km > range.kmEnd + 0.05) continue;
    if (!next || at.km < next.km) next = { name: s.name, ele: s.ele, km: at.km };
  }
  return {
    ...out,
    onDay: true,
    done: Math.max(0, hit.km - range.kmStart),
    left: Math.max(0, range.kmEnd - hit.km),
    up,
    down,
    next: next && { name: next.name, ele: next.ele, ahead: next.km - hit.km },
  };
}

/** The stop closest to a position: { stop, km }. */
export function nearestStop(stops, lon, lat) {
  let best = null;
  for (const s of stops) {
    const km = haversine([lon, lat], [s.lon, s.lat]);
    if (!best || km < best.km) best = { stop: s, km };
  }
  return best;
}
