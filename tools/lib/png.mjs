// Minimal PNG reader/writer (8-bit, non-interlaced). Enough for elevation tiles
// and the site's elevation grid, with no dependencies.
import zlib from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let pos = 8;
  let width, height, bitDepth, colorType, interlace, palette;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') palette = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) {
    throw new Error(`unsupported PNG (depth ${bitDepth}, interlace ${interlace})`);
  }
  const channels = CHANNELS[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start];
    const line = raw.subarray(start + 1, start + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    prev = cur;
  }
  if (colorType === 3) {
    const rgb = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      rgb[i * 3] = palette[out[i] * 3];
      rgb[i * 3 + 1] = palette[out[i] * 3 + 1];
      rgb[i * 3 + 2] = palette[out[i] * 3 + 2];
    }
    return { width, height, channels: 3, data: rgb };
  }
  return { width, height, channels, data: out };
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/** Encode 8-bit RGB (channels = 3) or greyscale (channels = 1) pixels as PNG. */
export function encodePng(width, height, data, channels = 3) {
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  const cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(stride));
  for (let y = 0; y < height; y++) {
    const cur = data.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? data.subarray((y - 1) * stride, y * stride) : null;
    const sums = [0, 0, 0, 0, 0];
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const paeth = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      const v = cur[x];
      const vals = [v, v - a, v - b, v - ((a + b) >> 1), v - paeth];
      for (let f = 0; f < 5; f++) {
        const r = vals[f] & 255;
        cand[f][x] = r;
        sums[f] += r < 128 ? r : 256 - r;
      }
    }
    let best = 0;
    for (let f = 1; f < 5; f++) if (sums[f] < sums[best]) best = f;
    raw[y * (stride + 1)] = best;
    cand[best].copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 3 ? 2 : 0;
  return Buffer.concat([
    SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
