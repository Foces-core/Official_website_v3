// Remove only the retired image cache. Other app or user caches belong to
// their own features and must survive service-worker upgrades.
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.delete('images-cache-v2'));
});
