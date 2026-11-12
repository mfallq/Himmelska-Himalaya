// Saving the whole site on the device, and saying truthfully whether it is there.
// The service worker (sw.js) serves the saved copy; this module checks it file by
// file, adds the satellite picture, and picks up new versions.
const PREFIX = 'hh-site-';

export const supported = 'serviceWorker' in navigator && 'caches' in window;
/** True when the site runs from the home screen rather than a browser tab. */
export const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const photoUrl = () => (matchMedia('(max-width: 760px)').matches ? 'assets/terrain/satellite-small.jpg' : 'assets/terrain/satellite.jpg');

/** The file list of the version this page runs from (the worker serves it from the saved copy). */
async function manifest() {
  const res = await fetch('precache.json');
  if (!res.ok) throw new Error('no file list');
  return res.json();
}

/** Which of the needed files are saved right now. */
export async function check() {
  if (!supported) return { supported: false, total: 0, saved: 0, missing: [] };
  try {
    const m = await manifest();
    const files = [...m.files.map((f) => f.url), photoUrl()];    const cache = await caches.open(PREFIX + m.version);
    const missing = [];
    for (const url of files) if (!(await cache.match(url, { ignoreSearch: true }))) missing.push(url);
    return { supported: true, total: files.length, saved: files.length - missing.length, missing, version: m.version };
  } catch {
    return { supported: true, total: 0, saved: 0, missing: ['precache.json'] };
  }
}

/** Download whatever is missing. Calls onProgress(saved, total) as it goes. */
export async function saveAll(onProgress) {
  const state = await check();
  if (!state.supported || !state.version) return state;
  const cache = await caches.open(PREFIX + state.version);
  let saved = state.saved;
  onProgress?.(saved, state.total);
  for (const url of state.missing) {
    try {
      await cache.add(new Request(url, { cache: 'reload' }));
      saved++;
    } catch {}
    onProgress?.(saved, state.total);
  }
  // Ask the browser not to clear the copy when the device runs short of space.
  try {
    await navigator.storage?.persist?.();
  } catch {}
  return check();
}

/** Register the worker, pick up new versions, and quietly fetch anything not yet saved. */
export async function start(onChange) {
  if (!supported) return onChange({ supported: false, total: 0, saved: 0, missing: [] });
  let reg;
  try {
    const hadWorker = !!navigator.serviceWorker.controller;
    reg = await navigator.serviceWorker.register('sw.js');
    // A new version has taken over: reload once so the page and its files match.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadWorker || reloaded) return;
      reloaded = true;
      location.reload();
    });
    await navigator.serviceWorker.ready;
  } catch {
    return onChange({ supported: false, total: 0, saved: 0, missing: [] });
  }
  onChange(await check());
  if (navigator.onLine) onChange(await saveAll());
  // Look for a new version whenever the app comes back to the screen.
  const look = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) reg.update().catch(() => {});
  };
  document.addEventListener('visibilitychange', look);
  look();
}
