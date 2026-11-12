// Builds the offline elevation grid used by the 3D relief.
//   node tools/build-dem.mjs
// Output: assets/terrain/dem.png (elevation / step, high byte in R, low byte in G)
//         data/terrain.json     (bounding box, size and scale of that grid)
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, CACHE, BBOX, DEM } from './config.mjs';
import { createElevationSampler } from './lib/elevation.mjs';
import { encodePng } from './lib/png.mjs';

const KM_PER_DEG_LAT = 110.574;
const midLat = (BBOX.north + BBOX.south) / 2;
const kmPerDegLon = 111.32 * Math.cos((midLat * Math.PI) / 180);
const widthKm = (BBOX.east - BBOX.west) * kmPerDegLon;
const heightKm = (BBOX.north - BBOX.south) * KM_PER_DEG_LAT;
const W = DEM.width;
const H = DEM.height || Math.round((W * heightKm) / widthKm);

const sampler = createElevationSampler(CACHE, DEM.zoom);
const tileCount = await sampler.preload(BBOX);
console.log(`tiles: ${tileCount} at z${DEM.zoom} (${sampler.stats().downloaded} downloaded)`);

const dLon = (BBOX.east - BBOX.west) / (W - 1);
const dLat = (BBOX.north - BBOX.south) / (H - 1);
const rgb = Buffer.alloc(W * H * 3);
let min = Infinity, max = -Infinity;
const SS = 2; // samples per axis within each cell
for (let j = 0; j < H; j++) {
  for (let i = 0; i < W; i++) {
    let sum = 0;
    for (let sj = 0; sj < SS; sj++) {
      for (let si = 0; si < SS; si++) {
        const lon = BBOX.west + (i + (si + 0.5) / SS - 0.5) * dLon;
        const lat = BBOX.north - (j + (sj + 0.5) / SS - 0.5) * dLat;
        sum += sampler.atSync(
          Math.min(BBOX.east, Math.max(BBOX.west, lon)),
          Math.min(BBOX.north, Math.max(BBOX.south, lat)),
        );
      }
    }
    const h = Math.max(0, sum / (SS * SS));
    if (h < min) min = h;
    if (h > max) max = h;
    const q = Math.round(h / DEM.step);
    const o = (j * W + i) * 3;
    rgb[o] = q >> 8;
    rgb[o + 1] = q & 255;
  }
}

const png = encodePng(W, H, rgb, 3);
await fs.mkdir(path.join(ROOT, 'assets', 'terrain'), { recursive: true });
await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
await fs.writeFile(path.join(ROOT, 'assets', 'terrain', 'dem.png'), png);
const meta = {
  bbox: BBOX,
  width: W,
  height: H,
  step: DEM.step,
  widthKm: +widthKm.toFixed(2),
  heightKm: +heightKm.toFixed(2),
  minElevation: Math.round(min),
  maxElevation: Math.round(max),
  source: 'Mapzen Terrain Tiles on AWS Open Data (SRTM and other sources), resampled',
};
await fs.writeFile(path.join(ROOT, 'data', 'terrain.json'), JSON.stringify(meta, null, 2) + '\n');
console.log(`dem.png: ${W}x${H}, ${(png.length / 1024).toFixed(0)} KB, ${Math.round(min)}–${Math.round(max)} m, cell ≈ ${((widthKm / W) * 1000).toFixed(0)} m`);
