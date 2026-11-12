// Elevation lookups from Mapzen "terrarium" tiles on AWS Open Data.
// https://registry.opendata.aws/terrain-tiles/ : attribution required, see README.
import fs from 'node:fs/promises';
import path from 'node:path';
import { decodePng } from './png.mjs';

const TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const TILE = 256;

export const lonToX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
export const latToY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

export function createElevationSampler(cacheDir, zoom) {
  const tiles = new Map();
  const dir = path.join(cacheDir, 'terrarium', String(zoom));
  let downloaded = 0;

  async function load(tx, ty) {
    const key = `${tx}/${ty}`;
    if (tiles.has(key)) return tiles.get(key);
    const file = path.join(dir, `${tx}-${ty}.png`);
    let buf;
    try {
      buf = await fs.readFile(file);
    } catch {
      const res = await fetch(`${TILE_URL}/${zoom}/${tx}/${ty}.png`, {
        headers: { 'User-Agent': 'trek-site-builder/0.1' },
      });
      if (!res.ok) throw new Error(`tile ${zoom}/${key}: HTTP ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file, buf);
      downloaded++;
    }
    const png = decodePng(buf);
    const heights = new Float32Array(TILE * TILE);
    for (let i = 0; i < TILE * TILE; i++) {
      const o = i * png.channels;
      heights[i] = png.data[o] * 256 + png.data[o + 1] + png.data[o + 2] / 256 - 32768;
    }
    tiles.set(key, heights);
    return heights;
  }

  async function pixel(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    const t = await load(tx, ty);
    return t[(py - ty * TILE) * TILE + (px - tx * TILE)];
  }

  /** Bilinear elevation in metres at a longitude/latitude. */
  async function at(lon, lat) {
    const gx = lonToX(lon, zoom) * TILE - 0.5;
    const gy = latToY(lat, zoom) * TILE - 0.5;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = gx - x0, fy = gy - y0;
    const [a, b, c, d] = await Promise.all([
      pixel(x0, y0), pixel(x0 + 1, y0), pixel(x0, y0 + 1), pixel(x0 + 1, y0 + 1),
    ]);
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
  }

  /** Load every tile touching a bounding box so that atSync() can be used. */
  async function preload({ west, south, east, north }) {
    const x0 = Math.floor(lonToX(west, zoom) - 0.01), x1 = Math.floor(lonToX(east, zoom) + 0.01);
    const y0 = Math.floor(latToY(north, zoom) - 0.01), y1 = Math.floor(latToY(south, zoom) + 0.01);
    const jobs = [];
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) jobs.push([tx, ty]);
    for (let i = 0; i < jobs.length; i += 8) {
      await Promise.all(jobs.slice(i, i + 8).map(([tx, ty]) => load(tx, ty)));
    }
    return jobs.length;
  }

  function pixelSync(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    const t = tiles.get(`${tx}/${ty}`);
    if (!t) throw new Error(`tile ${zoom}/${tx}/${ty} not preloaded`);
    return t[(py - ty * TILE) * TILE + (px - tx * TILE)];
  }

  /** Bilinear elevation from preloaded tiles. */
  function atSync(lon, lat) {
    const gx = lonToX(lon, zoom) * TILE - 0.5;
    const gy = latToY(lat, zoom) * TILE - 0.5;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = gx - x0, fy = gy - y0;
    return (
      pixelSync(x0, y0) * (1 - fx) * (1 - fy) + pixelSync(x0 + 1, y0) * fx * (1 - fy) +
      pixelSync(x0, y0 + 1) * (1 - fx) * fy + pixelSync(x0 + 1, y0 + 1) * fx * fy
    );
  }

  return { at, atSync, preload, stats: () => ({ loaded: tiles.size, downloaded }) };
}
