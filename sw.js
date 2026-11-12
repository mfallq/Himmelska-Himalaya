// Service worker: keeps a full copy of the site on the device.
//
// Built for use with no signal or a very weak one: every request is answered
// from the saved copy at once, and the network is only used in the background
// to refresh that copy for the next visit. Nothing ever waits on the network
// once the site has been saved.
const CACHE = 'hh-site-v2';

async function saveAll() {
  const res = await fetch('precache.json', { cache: 'no-store' });
  const manifest = await res.json();
  const cache = await caches.open(CACHE);
  // One missing file must not stop the rest from being saved.
  await Promise.allSettled(manifest.files.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
  await cache.put('precache.json', new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json' } }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(saveAll().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (hit) {
        event.waitUntil(refresh);
        return hit;
      }
      // Not saved: use the network, and offline fall back to the start page.
      return (await refresh) || (req.mode === 'navigate' && (await cache.match('./'))) || new Response('Offline, and this file was not saved yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })(),
  );
});
