import { lazy } from 'react';

// Lazy load with a single delayed retry for transient chunk failures.
// No sessionStorage flags and no auto-reload — a failed chunk renders the
// nearest error boundary's fallback with a manual Retry button instead.
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch {
      await new Promise((r) => setTimeout(r, 300));
      return componentImport();
    }
  });
}
