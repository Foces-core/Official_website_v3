import { useEffect, useState } from 'react';
import { nextOfflineVisible } from '../utils/offlineToast.js';

/**
 * Thin wiring for the global offline indicator (ADR-0009 / ADR-0010):
 * mirrors the browser's online state into toast visibility. The visibility
 * decision lives in the pure offlineToast module; this hook only subscribes
 * to the `online`/`offline` events and reads the initial state.
 *
 * @returns {{ offlineVisible: boolean }}
 */
export default function useOfflineToast() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean'
      ? true
      : navigator.onLine,
  );

  useEffect(() => {
    const sync = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return { offlineVisible: nextOfflineVisible(isOnline) };
}
