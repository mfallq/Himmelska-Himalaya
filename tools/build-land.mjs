// Builds the dotted land mask for the globe on the Journey tab.
//   node tools/build-land.mjs
// Input : <cache>/world-atlas/package/land-110m.json (Natural Earth, public domain,
//         as packaged by the world-atlas npm module)
// Output: data/land.json  { step, dots: [lon*10, lat*10, ...] }
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, CACHE } from './config.mjs';

const topo = JSON.parse(await fs.readFile(path.join(CACHE, 'world-atlas', 'package', 'land-110m.json'), 'utf8'));
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});
const rings = [];
const ringOf = (indices) => {
  const pts = [];
  for (const i of indices) {
    const arc = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
    pts.push(...(pts.length ? arc.slice(1) : arc));
  }
  return pts;
};
for (const g of topo.objects.land.geometries) {
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  for (const poly of polys) for (const ring of poly) rings.push(ringOf(ring));
}
const boxes = rings.map((r) => {
  let x0 = 999, x1 = -999, y0 = 999, y1 = -999;
  for (const [x, y] of r) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
});
// even-odd rule over every ring: holes cancel out by themselves
function isLand(lon, lat) {
  let inside = false;
  rings.forEach((r, k) => {
    const b = boxes[k];
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) return;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  });
  return inside;
}

const STEP = 1.5;
const dots = [];
for (let lat = -58.5; lat <= 84; lat += STEP) {
  const count = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / STEP));
  for (let i = 0; i < count; i++) {
    const lon = -180 + ((i + 0.5) * 360) / count;
    if (isLand(lon, lat)) dots.push(Math.round(lon * 10), Math.round(lat * 10));
  }
}
const json = JSON.stringify({ source: 'Natural Earth 1:110m land, public domain', step: STEP, dots });
await fs.writeFile(path.join(ROOT, 'data', 'land.json'), json + '\n');
console.log(`land.json: ${dots.length / 2} dots, ${(json.length / 1024).toFixed(0)} KB`);
