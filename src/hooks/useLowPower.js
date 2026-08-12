import { useEffect, useState } from 'react';
import detectProfile from '../utils/detectProfile';

/**
 * React hook wrapper around the pure detectProfile utility.
 *
 * Consumption rule: components subscribe here (reactive to connection
 * changes); non-React code reads detectProfile() once. One seam, two
 * documented entries — see the detectProfile JSDoc.
 *
 * Re-detects when the Network Information API fires a "change" event
 * (e.g., user toggles Data Saver or switches WiFi -> 4G).
 *
 * Override via URL params:
 *   ?perf=slow  — force all constraints on
 *   ?perf=high  — force all constraints off (full experience)
 */
export default function useDeviceProfile() {
  const [profile, setProfile] = useState(detectProfile);

  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn || typeof conn.addEventListener !== 'function') return;

    const update = () => setProfile(detectProfile());
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return profile;
}
