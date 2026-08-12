/**
 * Utility module for local browser image caching & pre-fetching.
 * Uses the Web Cache Storage API ('foces-image-cache-v1') and idle scheduling
 * to store image assets locally, ensuring instant gallery/modal loading and
 * robust offline presentation.
 */

const CACHE_NAME = 'foces-image-cache-v1';
const preloadedUrls = new Set();

/**
 * Open the local CacheStorage instance safely.
 * @returns {Promise<Cache|null>}
 */
async function getCache() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return null;
  }
  try {
    return await caches.open(CACHE_NAME);
  } catch (err) {
    console.warn('[ImageCache] Failed to open CacheStorage:', err);
    return null;
  }
}

/**
 * Pre-fetches and caches an array of image URLs during browser idle time.
 * @param {string[]} urls - List of image URLs or srcset paths to pre-fetch.
 */
export function preloadImages(urls = []) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const validUrls = urls.filter((u) => typeof u === 'string' && u.trim() && !preloadedUrls.has(u));

  if (validUrls.length === 0) return;

  const loadTask = async () => {
    const cache = await getCache();
    for (const url of validUrls) {
      preloadedUrls.add(url);
      try {
        if (cache) {
          const match = await cache.match(url);
          if (!match) {
            const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
            if (response.ok || response.type === 'opaque') {
              await cache.put(url, response);
            }
          }
        } else {
          const img = new Image();
          img.src = url;
        }
      } catch {
        // Silent catch for network hiccups during idle prefetch
      }
    }
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        loadTask();
      },
      { timeout: 3000 },
    );
  } else {
    setTimeout(loadTask, 500);
  }
}
