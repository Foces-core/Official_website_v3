import { useEffect, useState } from 'react';
import { nextOfflineVisible } from '../utils/offlineToast.js';

/**
 * Thin wiring for the global offline indicator (ADR-0009 / ADR-0010):
 * mirrors the browser's online state into toast visibility. The visibility
 * decision lives in the pure offlineToast module; this hook only subscribes
 * to the `online`/`offline` events and reads the initial state.
 *
 * `epoch` bumps on every transition so consumers can tell a fresh offline
 * event from a stale one (e.g. re-arm a manual dismiss) with pure
 * derivation — no cascading setState-in-effect needed.
 *
 * @returns {{ offlineVisible: boolean, epoch: number }}
 */
export default function useOfflineToast() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean'
      ? true
      : navigator.onLine,
  );
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const sync = () => {
      setIsOnline(navigator.onLine);
      setEpoch((e) => e + 1);
    };
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return { offlineVisible: nextOfflineVisible(isOnline), epoch };
}
