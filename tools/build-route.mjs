// Turns the OpenStreetMap hiking relation into one line per day of the itinerary.
//   node tools/build-route.mjs
// Input : <cache>/osm/route.json (and extra-*.json for trails outside the relation)
// Output: data/route.json  { legs: [{ day, mode, from, to, km, ascent, descent, line }], stops }
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, CACHE } from './config.mjs';
import { createElevationSampler } from './lib/elevation.mjs';
import { STOPS, LEGS } from '../js/content/stops.js';

const R = 6371000;
const rad = Math.PI / 180;
const hav = (a, b) => {
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// ---- graph of every way in the relation (plus any extra trail extracts) ----
const osmDir = path.join(CACHE, 'osm');
const files = (await fs.readdir(osmDir)).filter((f) => f === 'route.json' || /^extra-.*\.json$/.test(f));
const nodes = []; // [lon, lat]
const index = new Map();
const adj = []; // adj[i] = [[j, metres], ...]
const nodeId = (lon, lat) => {
  const key = lon.toFixed(6) + ',' + lat.toFixed(6);
  let i = index.get(key);
  if (i === undefined) {
    i = nodes.length;
    index.set(key, i);
    nodes.push([lon, lat]);
    adj.push([]);
  }
  return i;
};
const link = (a, b, w) => {
  if (a === b) return;
  adj[a].push([b, w]);
  adj[b].push([a, w]);
};
let wayCount = 0;
for (const f of files) {
  const json = JSON.parse(await fs.readFile(path.join(osmDir, f), 'utf8'));
  const ways = [];
  for (const el of json.elements) {
    if (el.type === 'relation') ways.push(...el.members.filter((m) => m.type === 'way' && m.geometry));
    else if (el.type === 'way' && el.geometry) ways.push(el);
  }
  // Ways from outside the hiking relation cost a little more, so the marked
  // route wins wherever both exist.
  const cost = f === 'route.json' ? 1 : 1.2;
  for (const w of ways) {
    wayCount++;
    let prev = -1;
    for (const p of w.geometry) {
      const i = nodeId(p.lon, p.lat);
      if (prev >= 0) link(prev, i, hav(nodes[prev], nodes[i]) * cost);
      prev = i;
    }
  }
}

// Bridge small mapping gaps: join loose ends to the nearest other node.
function bridgeGaps(maxMetres) {
  let added = 0;
  const cell = 0.002;
  const grid = new Map();
  nodes.forEach(([lon, lat], i) => {
    const k = Math.floor(lon / cell) + ':' + Math.floor(lat / cell);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(i);
  });
  const reach = Math.ceil(maxMetres / 180) + 1;
  for (let i = 0; i < nodes.length; i++) {
    if (adj[i].length !== 1) continue;
    const [lon, lat] = nodes[i];
    const cx = Math.floor(lon / cell), cy = Math.floor(lat / cell);
    let best = -1, bestD = maxMetres;
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dy = -reach; dy <= reach; dy++) {
        for (const j of grid.get(cx + dx + ':' + (cy + dy)) || []) {
          if (j === i || adj[i][0][0] === j) continue;
          const d = hav(nodes[i], nodes[j]);
          if (d < bestD && !reachableWithin(i, j, d * 3 + 40)) {
            bestD = d;
            best = j;
          }
        }
      }
    }
    if (best >= 0) {
      link(i, best, bestD);
      added++;
    }
  }
  return added;
}
// True when j can already be reached from i along the graph within `limit` metres.
function reachableWithin(i, j, limit) {
  const seen = new Map([[i, 0]]);
  const stack = [i];
  while (stack.length) {
    const u = stack.pop();
    const du = seen.get(u);
    for (const [v, w] of adj[u]) {
      const dv = du + w;
      if (dv > limit || (seen.has(v) && seen.get(v) <= dv)) continue;
      if (v === j) return true;
      seen.set(v, dv);
      stack.push(v);
    }
  }
  return false;
}
const bridged = bridgeGaps(90);
console.log(`graph: ${wayCount} ways, ${nodes.length} nodes, ${bridged} small gaps bridged`);

// Label connected pieces so stops never snap to a stray, unconnected way.
const component = new Int32Array(nodes.length).fill(-1);
const componentSize = [];
for (let i = 0; i < nodes.length; i++) {
  if (component[i] >= 0) continue;
  const id = componentSize.length;
  let size = 0;
  const stack = [i];
  component[i] = id;
  while (stack.length) {
    const u = stack.pop();
    size++;
    for (const [v] of adj[u]) {
      if (component[v] < 0) {
        component[v] = id;
        stack.push(v);
      }
    }
  }
  componentSize.push(size);
}
const mainComponent = componentSize.indexOf(Math.max(...componentSize));
console.log(`network: ${componentSize.length} pieces, main piece has ${componentSize[mainComponent]} of ${nodes.length} nodes`);

function nearestNode(lon, lat) {
  let best = -1, bestD = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    if (component[i] !== mainComponent) continue;
    const dx = (nodes[i][0] - lon) * Math.cos(lat * rad), dy = nodes[i][1] - lat;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { node: best, metres: hav([lon, lat], nodes[best]) };
}

function shortestPath(src, dst) {
  const dist = new Float64Array(nodes.length).fill(Infinity);
  const prev = new Int32Array(nodes.length).fill(-1);
  const heap = [[0, src]];
  dist[src] = 0;
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue;
    if (u === dst) break;
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        push([nd, v]);
      }
    }
  }
  if (!Number.isFinite(dist[dst])) return null;
  const out = [];
  for (let u = dst; u !== -1; u = prev[u]) out.push(u);
  return out.reverse();
}

// Douglas-Peucker in local metres, with elevation as the third axis.
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const lat0 = points[0][1];
  const xyz = points.map(([lon, lat, ele]) => [lon * rad * R * Math.cos(lat0 * rad), lat * rad * R, ele]);
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay, az] = xyz[a], [bx, by, bz] = xyz[b];
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len2 = dx * dx + dy * dy + dz * dz || 1;
    let worst = -1, worstD = tolerance * tolerance;
    for (let i = a + 1; i < b; i++) {
      const [px, py, pz] = xyz[i];
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / len2));
      const ex = ax + t * dx - px, ey = ay + t * dy - py, ez = az + t * dz - pz;
      const d = ex * ex + ey * ey + ez * ez;
      if (d > worstD) {
        worstD = d;
        worst = i;
      }
    }
    if (worst >= 0) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// Total climb and drop from a noisy elevation series: resample, smooth, then
// only count moves that exceed a small threshold.
function climb(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + hav(points[i - 1], points[i]));
  const total = cum[cum.length - 1];
  const step = 60;
  const series = [];
  for (let d = 0, i = 0; d <= total; d += step) {
    while (i < cum.length - 2 && cum[i + 1] < d) i++;
    const t = cum[i + 1] > cum[i] ? (d - cum[i]) / (cum[i + 1] - cum[i]) : 0;
    series.push(points[i][2] + (points[i + 1][2] - points[i][2]) * t);
  }
  const smooth = series.map((_, i) => {
    let s = 0, n = 0;
    for (let k = Math.max(0, i - 4); k <= Math.min(series.length - 1, i + 4); k++) {
      s += series[k];
      n++;
    }
    return s / n;
  });
  let up = 0, down = 0, ref = smooth[0];
  for (const v of smooth) {
    if (v - ref > 18) {
      up += v - ref;
      ref = v;
    } else if (ref - v > 18) {
      down += ref - v;
      ref = v;
    }
  }
  return { km: total / 1000, ascent: up, descent: down };
}

// The elevation model is unreliable in the deep gorges (radar shadow, void
// filling), where it can be out by many hundreds of metres. Each named stop has
// a published altitude, so pin the profile to those and keep only modest local
// relief from the model in between.
function pinToStops(line, anchors, maxDeviation = 150) {
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + hav(line[i - 1], line[i]));
  const raw = line.map((p) => p[2]);
  for (let a = 0; a < anchors.length - 1; a++) {
    const i0 = anchors[a].index, i1 = anchors[a + 1].index;
    if (i1 <= i0) continue;
    const span = cum[i1] - cum[i0] || 1;
    const dev = [];
    for (let i = i0; i <= i1; i++) {
      const t = (cum[i] - cum[i0]) / span;
      dev.push(raw[i] - (raw[i0] + (raw[i1] - raw[i0]) * t));
    }
    for (let i = i0; i <= i1; i++) {
      const k = i - i0;
      const win = dev.slice(Math.max(0, k - 2), k + 3).sort((x, y) => x - y);
      const med = win[win.length >> 1];
      const t = (cum[i] - cum[i0]) / span;
      const base = anchors[a].ele + (anchors[a + 1].ele - anchors[a].ele) * t;
      // Full weight for small deviations, fading to none for implausible ones.
      const trust = 1 - Math.min(1, Math.max(0, (Math.abs(med) - maxDeviation) / maxDeviation));
      line[i][2] = base + med * trust;
    }
  }
}

// Remove short-range jitter from the model, then put each stop back on its height.
function smoothBetweenStops(line, anchors, radius = 260) {
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + hav(line[i - 1], line[i]));
  const smooth = line.map((_, i) => {
    let sum = 0, weight = 0;
    for (let k = i; k >= 0 && cum[i] - cum[k] <= radius; k--) {
      const w = 1 - (cum[i] - cum[k]) / (radius * 1.2);
      sum += line[k][2] * w;
      weight += w;
    }
    for (let k = i + 1; k < line.length && cum[k] - cum[i] <= radius; k++) {
      const w = 1 - (cum[k] - cum[i]) / (radius * 1.2);
      sum += line[k][2] * w;
      weight += w;
    }
    return sum / weight;
  });
  for (let a = 0; a < anchors.length - 1; a++) {
    const i0 = anchors[a].index, i1 = anchors[a + 1].index;
    if (i1 <= i0) continue;
    const e0 = anchors[a].ele - smooth[i0], e1 = anchors[a + 1].ele - smooth[i1];
    const span = cum[i1] - cum[i0] || 1;
    for (let i = i0; i <= i1; i++) line[i][2] = smooth[i] + e0 + (e1 - e0) * ((cum[i] - cum[i0]) / span);
  }
}

const sampler = createElevationSampler(CACHE, 12);
const legs = [];
const stops = {};
const warnings = [];

for (const leg of LEGS) {
  const ids = leg.path;
  let line = [];
  const anchors = [];
  if (leg.mode === 'trek') {
    for (let i = 0; i < ids.length - 1; i++) {
      const a = STOPS[ids[i]], b = STOPS[ids[i + 1]];
      const na = nearestNode(a.lon, a.lat), nb = nearestNode(b.lon, b.lat);
      for (const [id, n] of [[ids[i], na], [ids[i + 1], nb]]) {
        if (n.metres > 700) warnings.push(`${id}: nearest trail point is ${Math.round(n.metres)} m away`);
        stops[id] = { lon: nodes[n.node][0], lat: nodes[n.node][1], offTrail: Math.round(n.metres) };
      }
      const p = shortestPath(na.node, nb.node);
      if (!p) {
        warnings.push(`day ${leg.day}: no trail between ${ids[i]} and ${ids[i + 1]}; drawn straight`);
        if (!line.length) line.push([a.lon, a.lat]);
        line.push([b.lon, b.lat]);
      } else {
        const seg = p.map((n) => nodes[n].slice());
        if (line.length) seg.shift();
        line.push(...seg);
      }
      if (i === 0) anchors.push({ index: 0, ele: a.ele });
      anchors.push({ index: line.length - 1, ele: b.ele });
    }
  } else {
    line = ids.map((id) => [STOPS[id].lon, STOPS[id].lat]);
  }
  for (const pt of line) pt[2] = await sampler.at(pt[0], pt[1]);
  if (leg.mode === 'trek') {
    pinToStops(line, anchors);
    smoothBetweenStops(line, anchors);
  }
  else ids.forEach((id, i) => (line[i][2] = STOPS[id].ele));
  const stats = leg.mode === 'trek' ? climb(line) : { km: 0, ascent: 0, descent: 0 };
  if (leg.mode !== 'trek') for (let i = 1; i < line.length; i++) stats.km += hav(line[i - 1], line[i]) / 1000;
  const slim = leg.mode === 'trek' ? simplify(line, 14) : line;
  legs.push({
    day: leg.day,
    mode: leg.mode,
    from: ids[0],
    to: ids[ids.length - 1],
    via: ids.slice(1, -1),
    km: +stats.km.toFixed(1),
    ascent: Math.round(stats.ascent / 10) * 10,
    descent: Math.round(stats.descent / 10) * 10,
    minEle: Math.round(Math.min(...line.map((p) => p[2]))),
    maxEle: Math.round(Math.max(...line.map((p) => p[2]))),
    line: slim.map(([lon, lat, ele]) => [+lon.toFixed(5), +lat.toFixed(5), Math.round(ele)]),
  });
  const l = legs[legs.length - 1];
  console.log(
    `day ${String(l.day).padStart(2)} ${l.mode.padEnd(5)} ${(l.from + ' → ' + l.to).padEnd(28)} ` +
      `${String(l.km).padStart(6)} km  +${String(l.ascent).padStart(4)} −${String(l.descent).padStart(4)} m  ` +
      `${l.minEle}–${l.maxEle} m  ${line.length}→${l.line.length} pts`,
  );
}
const out = {
  attribution: 'Trail geometry © OpenStreetMap contributors (ODbL). Elevation: Mapzen Terrain Tiles.',
  note:
    'Lines follow mapped trails and roads. Altitudes are pinned to the published height of each named stop, ' +
    'with local relief from the elevation model in between. A planning aid, not a GPS track of any walk.',
  legs,
  stops: Object.fromEntries(
    Object.entries(stops).map(([id, s]) => [id, { lon: +s.lon.toFixed(5), lat: +s.lat.toFixed(5), offTrail: s.offTrail }]),
  ),
};
await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
const json = JSON.stringify(out);
await fs.writeFile(path.join(ROOT, 'data', 'route.json'), json + '\n');
console.log(`route.json: ${(json.length / 1024).toFixed(0)} KB, ${legs.reduce((n, l) => n + l.line.length, 0)} points`);
const trekKm = legs.filter((l) => l.mode === 'trek').reduce((n, l) => n + l.km, 0);
console.log(`trekking total: ${trekKm.toFixed(1)} km`);
if (warnings.length) console.log('\nWARNINGS\n' + warnings.map((w) => '  ' + w).join('\n'));
