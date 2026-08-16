import { useEffect } from 'react';
import { acquireScrollLock } from '../utils/scrollLock.js';

/**
 * React hook that manages reference-counted page scroll locking.
 * Locks body scroll when isLocked is true, and releases the lock
 * cleanly on unmount or when isLocked becomes false.
 *
 * @param {boolean} isLocked
 */
export default function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;
    const release = acquireScrollLock();
    return () => {
      release();
    };
  }, [isLocked]);
}
