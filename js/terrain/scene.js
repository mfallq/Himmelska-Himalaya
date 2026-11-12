// One shared relief for the whole site: the live 3D view, the day thumbnails
// and the stills in the day sheets all draw from the same WebGL context.
import { loadDem } from './dem.js';
import { Relief } from './relief.js';
import { paintLandcover, drawRoute, loadSatellite } from './paint.js';
import { data, day as dayOf, STOPS } from '../data.js';
import { store } from '../store.js';

let pending = null;

/** Resolves to { dem, relief, canvas } or rejects when WebGL is unavailable. */
export function getScene() {
  pending ??= (async () => {
    if (!data.terrain) throw new Error('The elevation grid is missing.');
    const dem = await loadDem(data.terrain);
    const canvas = document.createElement('canvas');
    canvas.className = 'gl';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '3D relief of the Annapurna range with the trekking route');
    const coarse = matchMedia('(max-width: 760px)').matches;
    const relief = new Relief(canvas, dem, { coarse });
    const scene = { dem, relief, canvas, base: paintLandcover(dem, coarse ? 1.5 : 2), satellite: null, texture: null, paintedDay: null };
    const tex = document.createElement('canvas');
    tex.width = Math.min(coarse ? 1024 : 2048, relief.maxTexture);
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

/** Redraw the ground texture: cover (or satellite), then the route with one day lit. */
export function repaint(scene, dayNumber) {
  const { texture: tex, dem, relief } = scene;
  const ctx = tex.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(scene.satellite || scene.base, 0, 0, tex.width, tex.height);
  // Draw in ground-true proportions so the line is equally wide in every direction.
  const virtualH = (tex.width * dem.heightKm) / dem.widthKm;
  ctx.save();
  ctx.scale(1, tex.height / virtualH);
  drawRoute(ctx, dem, data.route.legs, dayNumber, tex.width, virtualH);
  ctx.restore();
  relief.flat = scene.satellite ? 0.75 : 0;
  relief.setTexture(tex);
  scene.paintedDay = dayNumber;
}

/** Switch the satellite drape on (fetches imagery) or off. */
export async function setSatellite(scene, on) {
  if (on && !scene.satellite) scene.satellite = await loadSatellite(scene.dem, scene.texture.width);
  if (!on) scene.satellite = null;
  repaint(scene, store.state.day);
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
    const live = scene.paintedDay;
    if (live !== job.n) repaint(scene, job.n);
    const cam = cameraOf(job.n);
    const ctx = job.canvas2d.getContext('2d');
    scene.relief.snapshot(ctx, { ...cam, dist: cam.dist * job.zoom }, job.canvas2d.width, job.canvas2d.height);
    // batch stills for the same day before restoring the live texture
    if (!queue.length || queue[0].n !== job.n) {
      if (!queue.length && live !== job.n) repaint(scene, store.state.day);
    }
    job.resolve(true);
  }
  if (scene.paintedDay !== store.state.day) repaint(scene, store.state.day);
  draining = false;
}
