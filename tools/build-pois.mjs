// Picks the mapped services close to the trekking route out of the
// OpenStreetMap extract, for the field map on the Relief 3D tab.
//   node tools/build-pois.mjs
// Input : <cache>/osm/pois.json, data/route.json
// Output: data/pois.json  { categories, items: [lon, lat, category index, name, day] }
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, CACHE } from './config.mjs';

const CORRIDOR = 1000; // metres either side of the walking route

const CATEGORIES = [
  { id: 'water', label: 'Drinking water', color: '#5ab8f0', test: (t) => /^(drinking_water|water_point)$/.test(t.amenity) || t.natural === 'spring' },
  { id: 'health', label: 'Health', color: '#f07f86', test: (t) => /^(hospital|clinic|doctors|pharmacy)$/.test(t.amenity) || !!t.healthcare },
  { id: 'lodging', label: 'Lodging', color: '#f0c05a', test: (t) => /^(guest_house|hotel|hostel|alpine_hut|wilderness_hut|camp_site)$/.test(t.tourism) },
  { id: 'food', label: 'Food and tea', color: '#f09a5a', test: (t) => /^(restaurant|cafe)$/.test(t.amenity) },
  { id: 'money', label: 'Bank and ATM', color: '#7fd08c', test: (t) => /^(atm|bank)$/.test(t.amenity) },
  { id: 'shop', label: 'Shops', color: '#b79cf0', test: (t) => !!t.shop },
  { id: 'check', label: 'Police and checkpoints', color: '#9fb4c8', test: (t) => t.amenity === 'police' || (t.tourism === 'information' && t.information === 'office') },
  { id: 'view', label: 'Viewpoints and sights', color: '#6fd6c8', test: (t) => /^(viewpoint|attraction|museum)$/.test(t.tourism) || t.waterway === 'waterfall' },
  { id: 'sacred', label: 'Monasteries and shrines', color: '#e8d79a', test: (t) => t.amenity === 'place_of_worship' || !!t.historic },
  { id: 'hot', label: 'Hot springs', color: '#f0a0c8', test: (t) => t.natural === 'hot_spring' },
  { id: 'shelter', label: 'Shelter and toilets', color: '#c8ccd0', test: (t) => /^(shelter|toilets)$/.test(t.amenity) },
  { id: 'bridge', label: 'Foot bridges', color: '#a8b0b8', test: (t) => !!t.bridge && t.bridge !== 'no' },
  { id: 'transport', label: 'Airstrips and bus stops', color: '#e9e8df', test: (t) => !!t.aeroway || t.amenity === 'bus_station' },
];

const R = 6371000, rad = Math.PI / 180;
const route = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'route.json'), 'utf8'));
const osm = JSON.parse(await fs.readFile(path.join(CACHE, 'osm', 'pois.json'), 'utf8'));

// densify the walking legs so a point-to-vertex distance is good enough
const lat0 = 28.55 * rad;
const X = (lon) => lon * rad * R * Math.cos(lat0), Y = (lat) => lat * rad * R;
const samples = [];
for (const leg of route.legs) {
  if (leg.mode !== 'trek') continue;
  for (let i = 1; i < leg.line.length; i++) {
    const a = leg.line[i - 1], b = leg.line[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1])) / 120));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      samples.push([X(a[0] + (b[0] - a[0]) * t), Y(a[1] + (b[1] - a[1]) * t), leg.day]);
    }
  }
}
const cell = 1000;
const grid = new Map();
for (const p of samples) {
  const k = Math.floor(p[0] / cell) + ':' + Math.floor(p[1] / cell);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
}
function nearest(lon, lat) {
  const x = X(lon), y = Y(lat), cx = Math.floor(x / cell), cy = Math.floor(y / cell);
  let best = Infinity, day = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (const p of grid.get(cx + dx + ':' + (cy + dy)) || []) {
        const d = Math.hypot(p[0] - x, p[1] - y);
        if (d < best) {
          best = d;
          day = p[2];
        }
      }
    }
  }
  return { metres: best, day };
}

const items = [];
const seen = new Set();
const counts = CATEGORIES.map(() => 0);
for (const el of osm.elements) {
  const tags = el.tags || {};
  const lon = el.lon ?? el.center?.lon, lat = el.lat ?? el.center?.lat;
  if (lon === undefined) continue;
  const cat = CATEGORIES.findIndex((c) => c.test(tags));
  if (cat < 0) continue;
  const near = nearest(lon, lat);
  if (near.metres > CORRIDOR) continue;
  const name = (tags['name:en'] || tags.name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const key = `${cat}:${name}:${Math.round(X(lon) / 25)}:${Math.round(Y(lat) / 25)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  counts[cat]++;
  items.push([+lon.toFixed(5), +lat.toFixed(5), cat, name, near.day]);
}
items.sort((a, b) => a[4] - b[4] || a[2] - b[2] || a[3].localeCompare(b[3]));

const out = {
  attribution: '© OpenStreetMap contributors (ODbL)',
  extracted: new Date().toISOString().slice(0, 10),
  corridorMetres: CORRIDOR,
  categories: CATEGORIES.map(({ id, label, color }) => ({ id, label, color })),
  items,
};
const json = JSON.stringify(out);
await fs.writeFile(path.join(ROOT, 'data', 'pois.json'), json + '\n');
console.log(`pois.json: ${items.length} places, ${(json.length / 1024).toFixed(0)} KB`);
console.log(CATEGORIES.map((c, i) => `${c.label} ${counts[i]}`).join(' · '));
const byDay = {};
for (const it of items) byDay[it[4]] = (byDay[it[4]] || 0) + 1;
console.log('per day:', JSON.stringify(byDay));
console.log('named:', items.filter((i) => i[3]).length);
