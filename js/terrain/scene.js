// One shared relief for the whole site: the live 3D view, the day thumbnails
// and the stills in the day sheets all draw from the same WebGL context.
import { loadDem } from './dem.js';
import { Relief } from './relief.js';
import { paintLandcover, drawRoute } from './paint.js';
import { data, day as dayOf, STOPS } from '../data.js';
import { store } from '../store.js';

let pending = null;

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });

/** Resolves to { dem, relief, canvas } or rejects when WebGL is unavailable. */
export function getScene() {
  pending ??= (async () => {
    if (!data.terrain) throw new Error('The elevation grid is missing.');
    const coarse = matchMedia('(max-width: 760px)').matches;
    // The satellite picture ships with the site, so it also works offline.
    const [dem, photo] = await Promise.all([
      loadDem(data.terrain),
      loadImage(coarse ? 'assets/terrain/satellite-small.jpg' : 'assets/terrain/satellite.jpg').catch(() => null),
    ]);
    const canvas = document.createElement('canvas');
    canvas.className = 'gl';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '3D relief of the Annapurna range with the trekking route');
    const relief = new Relief(canvas, dem, { coarse });
    const scene = { dem, relief, canvas, photo, painted: null, texture: null, paintedDay: null };
    const tex = document.createElement('canvas');
    tex.width = Math.min(coarse ? 2048 : 4096, relief.maxTexture);
    tex.height = relief.gl2 ? Math.round((tex.width * dem.heightKm) / dem.widthKm) : tex.width / 2;
    scene.texture = tex;
    const r = store.state.relief;
    relief.setExaggeration(r.exaggeration);
    relief.orbit = r.orbit;
    repaint(scene, store.state.day);
    return scene;
  })();
  return pending;
}

/** True when the relief is showing the satellite picture rather than the painted cover. */
export const usesPhoto = (scene) => !!scene.photo && store.state.relief.photo !== false;

/** Redraw the ground texture: satellite (or painted cover), then the route with one day lit. */
export function repaint(scene, dayNumber) {
  const { texture: tex, dem, relief } = scene;
  const ctx = tex.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const photo = usesPhoto(scene);
  if (photo) {
    // Satellite pictures are dark and flat: lift them a little.
    ctx.filter = 'brightness(1.28) contrast(1.06) saturate(1.2)';
    ctx.drawImage(scene.photo, 0, 0, tex.width, tex.height);
    ctx.filter = 'none';
  } else {
    scene.painted ??= paintLandcover(dem, 1);
    ctx.drawImage(scene.painted, 0, 0, tex.width, tex.height);
  }
  // Draw in ground-true proportions so the line is equally wide in every direction.
  const virtualH = (tex.width * dem.heightKm) / dem.widthKm;
  ctx.save();
  ctx.scale(1, tex.height / virtualH);
  drawRoute(ctx, dem, data.route.legs, dayNumber, tex.width, virtualH, { scale: tex.width > 2048 ? 0.8 : 1 });
  ctx.restore();
  relief.flat = photo ? 0.5 : 0;
  relief.setTexture(tex);
  scene.paintedDay = dayNumber;
}

/** Camera for a day, as the renderer wants it. */
export function cameraOf(n) {
  const cam = dayOf(n).cam;
  const [lon, lat] = typeof cam.at === 'string' ? [STOPS[cam.at].lon, STOPS[cam.at].lat] : cam.at;
  return { lon, lat, az: cam.az, pitch: cam.pitch, dist: cam.dist };
}

// Day stills are drawn one at a time so that scrolling never stutters.
const queue = [];
let draining = false;
/** Draw the relief as seen on a given day into a 2D canvas (queued). */
export function drawDayStill(canvas2d, n, { zoom = 1 } = {}) {
  return new Promise((resolve) => {
    queue.push({ canvas2d, n, zoom, resolve });
    if (!draining) drain();
  });
}
async function drain() {
  draining = true;
  let scene;
  try {
    scene = await getScene();
  } catch {
    queue.splice(0).forEach((job) => job.resolve(false));
    draining = false;
    return;
  }
  while (queue.length) {
    const job = queue.shift();
    await new Promise((r) => requestAnimationFrame(r));
    if (scene.paintedDay !== job.n) repaint(scene, job.n);
    const cam = cameraOf(job.n);
    const ctx = job.canvas2d.getContext('2d');
    scene.relief.snapshot(ctx, { ...cam, dist: cam.dist * job.zoom }, job.canvas2d.width, job.canvas2d.height);
    job.resolve(true);
  }
  if (scene.paintedDay !== store.state.day) repaint(scene, store.state.day);
  draining = false;
}
