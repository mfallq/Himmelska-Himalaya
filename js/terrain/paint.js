// Textures for the relief, all made in the browser from the elevation grid:
// a natural-colour ground cover, the slope map used for lighting, the route
// overlay and (optionally, online) a satellite mosaic.
import { clamp, lerp, smoothstep } from '../util.js';

/** East-west and north-south slope of every grid cell, in metres per metre. */
export function gradients(dem) {
  if (dem._grad) return dem._grad;
  const { width: w, height: h, data } = dem;
  const cellX = (dem.widthKm * 1000) / (w - 1);
  const cellY = (dem.heightKm * 1000) / (h - 1);
  const gx = new Float32Array(w * h);
  const gy = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const yu = Math.max(0, y - 1), yd = Math.min(h - 1, y + 1);
    for (let x = 0; x < w; x++) {
      const xl = Math.max(0, x - 1), xr = Math.min(w - 1, x + 1);
      gx[y * w + x] = (data[y * w + xr] - data[y * w + xl]) / ((xr - xl) * cellX);
      gy[y * w + x] = (data[yd * w + x] - data[yu * w + x]) / ((yd - yu) * cellY);
    }
  }
  dem._grad = { gx, gy };
  return dem._grad;
}

/** RGBA bytes for the shader: R = slope east, G = slope south, each mapped from ±4. */
export function slopeTexture(dem) {
  const { gx, gy } = gradients(dem);
  const out = new Uint8Array(gx.length * 4);
  for (let i = 0; i < gx.length; i++) {
    out[i * 4] = clamp(Math.round((gx[i] / 8 + 0.5) * 255), 0, 255);
    out[i * 4 + 1] = clamp(Math.round((gy[i] / 8 + 0.5) * 255), 0, 255);
    out[i * 4 + 3] = 255;
  }
  return out;
}

// Smooth repeatable noise from a small random table.
const N = 64;
const table = new Float32Array(N * N);
{
  let seed = 20261111;
  for (let i = 0; i < table.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    table[i] = seed / 4294967296;
  }
}
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const x0 = ((xi % N) + N) % N, y0 = ((yi % N) + N) % N;
  const x1 = (x0 + 1) % N, y1 = (y0 + 1) % N;
  const a = table[y0 * N + x0], b = table[y0 * N + x1], c = table[y1 * N + x0], d = table[y1 * N + x1];
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const C = {
  lowland: [116, 136, 76],
  forest: [62, 96, 62],
  upper: [78, 100, 70],
  scrub: [138, 126, 88],
  rock: [128, 120, 112],
  dryValley: [190, 166, 124],
  dryScrub: [162, 142, 106],
  dryRock: [140, 126, 110],
  cliff: [96, 90, 86],
  snow: [246, 249, 253],
};

/**
 * Natural-colour ground cover: forest in the wet south and east, bare ochre in
 * the rain shadow of Manang and Mustang, rock and snow above. A stylised
 * picture built from height, steepness and position, not a photograph.
 * With `shaded`, relief shading is baked in for the flat field map.
 */
export function paintLandcover(dem, scale = 2, { shaded = false } = {}) {
  const W = Math.round(dem.width * scale), H = Math.round(dem.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const px = img.data;
  const { gx, gy } = gradients(dem);
  const { west, east, south, north } = dem.bbox;
  // light from the east-south-east, 34° up (matches the 3D view)
  const L = [0.752, 0.559, 0.35];
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    const lat = north - v * (north - south);
    const gyRow = Math.min(dem.height - 1, Math.round(v * (dem.height - 1))) * dem.width;
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const lon = west + u * (east - west);
      const h = dem.sampleUV(u, v);
      const gi = gyRow + Math.min(dem.width - 1, Math.round(u * (dem.width - 1)));
      const sx = gx[gi], sy = gy[gi];
      const slope = Math.hypot(sx, sy);
      const n1 = noise(x / (22 * scale), y / (22 * scale));
      const n2 = noise(x / (2.2 * scale) + 31, y / (2.2 * scale) + 7);

      const arid = smoothstep(28.585, 28.7, lat + 0.03 * (n1 - 0.5)) * smoothstep(84.38, 84.22, lon);
      let wet = mix3(C.lowland, C.forest, smoothstep(700, 1900, h));
      wet = mix3(wet, C.upper, smoothstep(2600, 3500, h));
      wet = mix3(wet, C.scrub, smoothstep(3600, 4300, h));
      wet = mix3(wet, C.rock, smoothstep(4400, 5000, h));
      let dry = mix3(C.dryValley, C.dryScrub, smoothstep(3000, 4200, h));
      dry = mix3(dry, C.dryRock, smoothstep(4400, 5100, h));
      let col = mix3(wet, dry, arid);
      col = mix3(col, C.cliff, smoothstep(0.75, 1.5, slope) * 0.7);

      const snowLine = lerp(5150, 5800, arid) + (n1 - 0.5) * 260;
      let snow = smoothstep(snowLine - 220, snowLine + 260, h);
      snow *= 1 - 0.55 * smoothstep(1.1, 2.2, slope);
      snow = clamp(snow + 0.18 * clamp(sy * 0.6, -1, 1) * smoothstep(4600, 5400, h), 0, 1);
      col = mix3(col, C.snow, snow);

      let k = 0.94 + 0.12 * n2;
      if (shaded) {
        const ex = 1.5;
        const nx = -sx * ex, nz = -sy * ex;
        const inv = 1 / Math.hypot(nx, 1, nz);
        const diff = Math.max(0, (nx * L[0] + L[1] + nz * L[2]) * inv);
        k *= 0.42 + 0.86 * diff;
      }
      const o = (y * W + x) * 4;
      px[o] = clamp(col[0] * k, 0, 255);
      px[o + 1] = clamp(col[1] * k, 0, 255);
      px[o + 2] = clamp(col[2] * k, 0, 255);
      px[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Draw every leg onto a canvas that covers the grid's bounding box. */
export function drawRoute(ctx, dem, legs, selectedDay, W, H, { scale = 1 } = {}) {
  const { west, east, south, north } = dem.bbox;
  const X = (lon) => ((lon - west) / (east - west)) * W;
  const Y = (lat) => ((north - lat) / (north - south)) * H;
  const trace = (line) => {
    ctx.beginPath();
    line.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
  };
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const s = (W / 2048) * scale;
  for (const pass of ['casing', 'core', 'selected']) {
    for (const leg of legs) {
      const sel = leg.day === selectedDay;
      const drive = leg.mode !== 'trek';
      if (pass === 'selected' && !sel) continue;
      trace(leg.line);
      ctx.setLineDash(drive ? [9 * s, 9 * s] : []);
      if (pass === 'casing') {
        ctx.strokeStyle = 'rgba(18, 12, 4, .55)';
        ctx.lineWidth = (drive ? 5.5 : 9.5) * s;
      } else if (pass === 'core') {
        ctx.strokeStyle = drive ? 'rgba(236, 226, 200, .85)' : '#e9b55c';
        ctx.lineWidth = (drive ? 2.4 : 4.6) * s;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255, 221, 150, .34)';
        ctx.lineWidth = 17 * s;
        ctx.stroke();
        ctx.setLineDash(drive ? [9 * s, 9 * s] : []);
        ctx.strokeStyle = '#fff0c9';
        ctx.lineWidth = (drive ? 3.6 : 6.2) * s;
      }
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}

const SATELLITE_LAYERS = ['s2cloudless-2024_3857', 's2cloudless-2023_3857', 's2cloudless-2021_3857', 's2cloudless-2020_3857'];
export const SATELLITE_CREDIT =
  'Sentinel-2 cloudless by EOX IT Services GmbH (contains modified Copernicus Sentinel data), CC BY-NC-SA 4.0';

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('tile failed: ' + url));
    img.src = url;
  });

/**
 * Fetch a satellite mosaic for the grid's bounding box (needs a connection).
 * Returns a canvas W pixels wide, or throws if the imagery cannot be loaded.
 */
export async function loadSatellite(dem, W = 2048, zoom = 11) {
  const { west, east, south, north } = dem.bbox;
  const H = Math.round((W * dem.height) / dem.width);
  const n = 2 ** zoom;
  const tx = (lon) => Math.floor(((lon + 180) / 360) * n);
  const ty = (lat) => {
    const r = (lat * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  };
  const tileLon = (x) => (x / n) * 360 - 180;
  const tileLat = (y) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;

  let layer = null;
  for (const candidate of SATELLITE_LAYERS) {
    try {
      await loadImage(`https://tiles.maps.eox.at/wmts/1.0.0/${candidate}/default/g/${zoom}/${ty(north)}/${tx(west)}.jpg`);
      layer = candidate;
      break;
    } catch {}
  }
  if (!layer) throw new Error('Satellite imagery is not reachable right now.');

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const jobs = [];
  for (let y = ty(north); y <= ty(south); y++) {
    for (let x = tx(west); x <= tx(east); x++) {
      jobs.push(
        loadImage(`https://tiles.maps.eox.at/wmts/1.0.0/${layer}/default/g/${zoom}/${y}/${x}.jpg`).then((img) => {
          const x0 = ((tileLon(x) - west) / (east - west)) * W;
          const x1 = ((tileLon(x + 1) - west) / (east - west)) * W;
          const y0 = ((north - tileLat(y)) / (north - south)) * H;
          const y1 = ((north - tileLat(y + 1)) / (north - south)) * H;
          ctx.drawImage(img, x0, y0, x1 - x0 + 0.6, y1 - y0 + 0.6);
        }),
      );
    }
  }
  const results = await Promise.allSettled(jobs);
  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > jobs.length * 0.25) throw new Error('Too many satellite tiles failed to load.');
  ctx.getImageData(0, 0, 1, 1); // throws here if the server did not allow cross-origin use
  return canvas;
}
