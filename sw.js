// Service worker: keeps one complete copy of the site on the device.
//
// Built for use with no signal: every request is answered from the saved copy
// at once. A new version is downloaded whole into its own cache and only takes
// over when every file has arrived, so the site is never half old and half new.
// If anything fails, the old version keeps running.
const VERSION = '87c9809fb04a';
const PREFIX = 'hh-site-';
const CACHE = PREFIX + VERSION;

async function install() {
  const manifest = await (await fetch('precache.json?net=' + Date.now(), { cache: 'no-store' })).json();
  // Start from nothing, so a half-finished earlier try can never leave a stale file behind.
  await caches.delete(CACHE);
  const cache = await caches.open(CACHE);
  const queue = [...manifest.files];
  const work = async () => {
    for (let f; (f = queue.shift()); ) {
      const res = await fetch(new Request(f.url, { cache: 'reload' }));
      if (!res.ok) throw new Error(`${f.url}: ${res.status}`);
      await cache.put(f.url, res);
    }
  };
  await Promise.all([work(), work(), work(), work()]);
  // The satellite picture is not in the list: carry over the one this device has.
  for (const name of await caches.keys()) {
    if (!name.startsWith(PREFIX) || name === CACHE) continue;
    const old = await caches.open(name);
    for (const url of ['assets/terrain/satellite.jpg', 'assets/terrain/satellite-small.jpg']) {
      const hit = await old.match(url);
      if (hit && !(await cache.match(url))) await cache.put(url, hit);
    }
  }
  // Written last: its presence marks the copy as complete.
  await cache.put('precache.json', new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json' } }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    install()
      .then(() => self.skipWaiting())
      .catch(async (err) => {
        await caches.delete(CACHE);
        throw err;
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.searchParams.has('net')) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      // Not saved: use the network, and offline fall back to the start page.
      try {
        return await fetch(req);
      } catch {
        return (req.mode === 'navigate' && (await cache.match('./'))) || new Response('Offline, and this file was not saved yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })(),
  );
});
