// Service worker: keeps a copy of the site so it opens without signal.
// The file list comes from precache.json (written by tools/build-precache.mjs).
const TILES = 'hh-tiles-v1';
let shellName = null;

async function shell() {
  if (shellName) return shellName;
  const names = await caches.keys();
  shellName = names.find((n) => n.startsWith('hh-shell-')) || 'hh-shell-initial';
  return shellName;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch('precache.json', { cache: 'no-store' });
      const manifest = await res.json();
      const name = `hh-shell-${manifest.version}`;
      const cache = await caches.open(name);
      // One missing file must not stop the rest from being saved.
      await Promise.allSettled(manifest.files.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      shellName = name;
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = await shell();
      for (const name of await caches.keys()) {
        if (name.startsWith('hh-shell-') && name !== keep) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Satellite tiles: keep what has been seen, so it is there offline later.
  if (url.hostname === 'tiles.maps.eox.at') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILES);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })(),
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // The site itself: fresh from the network when there is one, the saved copy otherwise.
  event.respondWith(
    (async () => {
      const cache = await caches.open(await shell());
      try {
        const res = await Promise.race([fetch(req), timeout(4000)]);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const hit = (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' && (await cache.match('./')));
        if (hit) return hit;
        return new Response('Offline, and this file was not saved yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })(),
  );
});
