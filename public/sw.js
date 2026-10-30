// Self-destructing service worker — the PWA layer was removed (ADR-0029:
// a college forum site has no offline need, and the worker's caches caused
// stale-chunk failures after every deploy). This file replaces the old
// workbox worker at the same URL, so already-registered workers update into
// it, wipe every cache they created, unregister, and hand control back to
// the network.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url))),
  );
});

// Pass-through for the brief window where this worker controls a page —
// never serve anything the old worker left behind.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
