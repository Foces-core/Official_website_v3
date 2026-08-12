/**
 * Interaction Priority Scheduler
 * Uses the Web Prioritized Task Scheduling API (navigator.scheduling.postTask)
 * to prioritize CPU and network operations that respond directly to user interaction
 * (hover, touch, focus, click) over background idle tasks.
 */

const prioritizedUrls = new Set();

/**
 * Schedule a high-priority task for immediate user interaction (user-blocking).
 * @param {Function} taskFn
 * @returns {Promise<any>}
 */
function scheduleUserBlockingTask(taskFn) {
  if (typeof taskFn !== 'function') return Promise.resolve();

  if (typeof window !== 'undefined' && window.navigator?.scheduling?.postTask) {
    return window.navigator.scheduling.postTask(taskFn, { priority: 'user-blocking' });
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      try {
        resolve(taskFn());
      } catch {
        resolve(undefined);
      }
    });
  });
}

/**
 * Schedule a low-priority background task that will not block user interactions.
 * @param {Function} taskFn
 * @returns {Promise<any>}
 */
export function scheduleBackgroundTask(taskFn) {
  if (typeof taskFn !== 'function') return Promise.resolve();

  if (typeof window !== 'undefined' && window.navigator?.scheduling?.postTask) {
    return window.navigator.scheduling.postTask(taskFn, { priority: 'background' });
  }

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return new Promise((resolve) => {
      window.requestIdleCallback(() => {
        try {
          resolve(taskFn());
        } catch {
          resolve(undefined);
        }
      });
    });
  }

  return new Promise((resolve) => setTimeout(() => resolve(taskFn()), 200));
}

/**
 * High-priority pre-fetch for an image URL triggered by direct user interaction.
 * @param {string} url
 */
export function prioritizeAssetFetch(url) {
  if (typeof url !== 'string' || !url.trim() || prioritizedUrls.has(url)) return;
  prioritizedUrls.add(url);

  scheduleUserBlockingTask(() => {
    try {
      const img = new Image();
      if ('fetchPriority' in img) {
        img.fetchPriority = 'high';
      }
      img.src = url;
    } catch {
      // ignore
    }
  });
}
