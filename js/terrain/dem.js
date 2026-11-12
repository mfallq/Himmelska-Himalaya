// Elevation grid: loads assets/terrain/dem.png and answers "how high is it here?".
// The PNG is decoded by hand rather than through a canvas, because some
// browsers add noise to canvas read-back and a wrong high byte is a 1 km error.

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decodePng(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let pos = 8, width = 0, height = 0, colorType = 2;
  const parts = [];
  while (pos < bytes.length) {
    const len = view.getUint32(pos);
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (type === 'IHDR') {
      width = view.getUint32(pos + 8);
      height = view.getUint32(pos + 12);
      colorType = bytes[pos + 17];
    } else if (type === 'IDAT') parts.push(bytes.subarray(pos + 8, pos + 8 + len));
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 1;
  const total = parts.reduce((n, p) => n + p.length, 0);
  const idat = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    idat.set(p, o);
    o += p.length;
  }
  const rawData = await inflate(idat);
  const stride = width * channels;
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = rawData[start];
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[row + x - channels] : 0;
      const b = y > 0 ? out[row - stride + x] : 0;
      const c = y > 0 && x >= channels ? out[row - stride + x - channels] : 0;
      let v = rawData[start + 1 + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[row + x] = v & 255;
    }
  }
  return { width, height, channels, data: out };
}

export class Dem {
  constructor(meta, heights) {
    Object.assign(this, meta);
    this.data = heights; // metres, row 0 = north edge
  }
  /** Grid position (0..1, 0..1) of a longitude/latitude; u east, v south. */
  uv(lon, lat) {
    const b = this.bbox;
    return [(lon - b.west) / (b.east - b.west), (b.north - lat) / (b.north - b.south)];
  }
  lonLat(u, v) {
    const b = this.bbox;
    return [b.west + u * (b.east - b.west), b.north - v * (b.north - b.south)];
  }
  contains(lon, lat) {
    const [u, v] = this.uv(lon, lat);
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  }
  /** Bilinear height in metres at a grid position; clamps at the edges. */
  sampleUV(u, v) {
    const { width: w, height: h, data } = this;
    const x = Math.min(w - 1.001, Math.max(0, u * (w - 1)));
    const y = Math.min(h - 1.001, Math.max(0, v * (h - 1)));
    const x0 = x | 0, y0 = y | 0;
    const fx = x - x0, fy = y - y0;
    const i = y0 * w + x0;
    return (
      data[i] * (1 - fx) * (1 - fy) + data[i + 1] * fx * (1 - fy) + data[i + w] * (1 - fx) * fy + data[i + w + 1] * fx * fy
    );
  }
  sample(lon, lat) {
    const [u, v] = this.uv(lon, lat);
    return this.sampleUV(u, v);
  }
}

let shared = null;
/** One decoded grid for the whole site: the 3D relief and the flat map use the same one. */
export const getDem = (meta) => (shared ??= loadDem(meta).catch((err) => ((shared = null), Promise.reject(err))));

export async function loadDem(meta, url = 'assets/terrain/dem.png') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`elevation grid: HTTP ${res.status}`);
  const png = await decodePng(await res.arrayBuffer());
  const heights = new Float32Array(png.width * png.height);
  for (let i = 0; i < heights.length; i++) {
    heights[i] = (png.data[i * png.channels] * 256 + png.data[i * png.channels + 1]) * meta.step;
  }
  return new Dem({ ...meta, width: png.width, height: png.height }, heights);
}
