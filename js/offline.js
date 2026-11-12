// Saving the whole site on the device, and saying truthfully whether it is there.
// The service worker (sw.js) serves the saved copy; this module fills it and
// checks it file by file.
const CACHE = 'hh-site-v2';

export const supported = 'serviceWorker' in navigator && 'caches' in window;
/** True when the site runs from the home screen rather than a browser tab. */
export const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Every file this device needs: the shared list plus its own satellite picture. */
async function fileList() {
  let manifest;
  try {
    manifest = await (await fetch('precache.json', { cache: 'no-store' })).json();
  } catch {
    const hit = await (await caches.open(CACHE)).match('precache.json');
    if (!hit) throw new Error('no file list');
    manifest = await hit.json();
  }
  const photo = matchMedia('(max-width: 760px)').matches ? 'assets/terrain/satellite-small.jpg' : 'assets/terrain/satellite.jpg';
  return [...manifest.files, photo];
}

/** Which of the needed files are saved right now. */
export async function check() {
  if (!supported) return { supported: false, total: 0, saved: 0, missing: [] };
  try {
    const files = await fileList();
    const cache = await caches.open(CACHE);
    const missing = [];
    for (const url of files) if (!(await cache.match(url, { ignoreSearch: true }))) missing.push(url);
    return { supported: true, total: files.length, saved: files.length - missing.length, missing };
  } catch {
    return { supported: true, total: 0, saved: 0, missing: ['precache.json'] };
  }
}

/** Download whatever is missing. Calls onProgress(saved, total) as it goes. */
export async function saveAll(onProgress) {
  const state = await check();
  if (!state.supported) return state;
  const cache = await caches.open(CACHE);
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

/** Register the worker, then quietly fetch anything not yet saved. */
export async function start(onChange) {
  if (!supported) return onChange({ supported: false, total: 0, saved: 0, missing: [] });
  try {
    await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
  } catch {
    return onChange({ supported: false, total: 0, saved: 0, missing: [] });
  }
  onChange(await check());
  if (navigator.onLine) onChange(await saveAll());
}
