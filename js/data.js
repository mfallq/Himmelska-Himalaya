// Loads the generated data files and joins them with the written itinerary.
import { STOPS, PEAKS } from './content/stops.js';
import { DAYS, TRIP } from './content/itinerary.js';
import { store } from './store.js';
import { addDays, parseISO, haversine } from './util.js';

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export const data = {
  route: null, // { legs, stops }
  terrain: null, // metadata for the elevation grid
  pois: null, // loaded on demand
  track: [], // every trekking point in walking order: { lon, lat, ele, km, day }
  trackKm: 0,
};

export async function loadData() {
  const [route, terrain] = await Promise.all([fetchJson('data/route.json'), fetchJson('data/terrain.json')]);
  data.route = route || { legs: [], stops: {} };
  data.terrain = terrain;
  // Prefer positions snapped to the mapped trail.
  for (const [id, s] of Object.entries(data.route.stops || {})) {
    if (STOPS[id]) Object.assign(STOPS[id], { lon: s.lon, lat: s.lat });
  }
  let km = 0;
  for (const leg of data.route.legs) {
    if (leg.mode !== 'trek') continue;
    // The stored line is simplified, so it measures a little short: stretch it
    // to the length measured from the full-resolution trail.
    let drawn = 0;
    for (let i = 1; i < leg.line.length; i++) drawn += haversine(leg.line[i - 1], leg.line[i]);
    const scale = drawn > 0 ? leg.km / drawn : 1;
    leg.line.forEach((p, i) => {
      if (i > 0) km += haversine(leg.line[i - 1], p) * scale;
      data.track.push({ lon: p[0], lat: p[1], ele: p[2], km, day: leg.day });
    });
  }
  data.trackKm = km;
  return data;
}

export async function loadPois() {
  if (!data.pois) data.pois = (await fetchJson('data/pois.json')) || { categories: [], items: [] };
  return data.pois;
}

export { STOPS, PEAKS, DAYS, TRIP };
export const day = (n) => DAYS[Math.min(DAYS.length, Math.max(1, n)) - 1];
export const legsOf = (n) => data.route.legs.filter((l) => l.day === n);

/** Ordered stop ids that a day touches, without repeats. */
export function stopsOf(n) {
  const ids = [];
  const add = (id) => {
    if (id && STOPS[id] && !ids.includes(id)) ids.push(id);
  };
  const d = day(n);
  add(d.from);
  for (const leg of legsOf(n)) [leg.from, ...(leg.via || []), leg.to].forEach(add);
  add(d.to);
  (d.focus || []).forEach(add);
  return ids;
}

/** Walking totals for a day, measured from the mapped trail. */
export function walked(n) {
  const legs = legsOf(n).filter((l) => l.mode === 'trek');
  if (!legs.length) return null;
  const d = day(n);
  return {
    km: legs.reduce((s, l) => s + l.km, 0),
    ascent: d.gain ?? legs.reduce((s, l) => s + l.ascent, 0),
    descent: d.loss ?? legs.reduce((s, l) => s + l.descent, 0),
  };
}

export const startDate = () => parseISO(store.state.settings.startDate);
/** Calendar date of a day number, or null until the traveller sets a start date. */
export const dateOf = (n) => {
  const start = startDate();
  return start ? addDays(start, n - 1) : null;
};

/** Position along the whole walk at a distance in km (for the fly-through). */
export function trackAt(km) {
  const t = data.track;
  if (!t.length) return null;
  let lo = 0, hi = t.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid].km < km) lo = mid;
    else hi = mid;
  }
  const a = t[lo], b = t[hi];
  const f = b.km > a.km ? Math.min(1, Math.max(0, (km - a.km) / (b.km - a.km))) : 0;
  return { lon: a.lon + (b.lon - a.lon) * f, lat: a.lat + (b.lat - a.lat) * f, ele: a.ele + (b.ele - a.ele) * f, day: f < 0.5 ? a.day : b.day, index: lo };
}
