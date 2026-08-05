import { useEffect, useState } from 'react';

// Detects low-end devices / slow connections so heavy features
// (WebGL backgrounds, carousel autoplay, etc.) can be skipped.
// Uses the Network Information API (saveData / effectiveType / downlink),
// device memory (Chromium), and the prefers-reduced-motion media query.
function detectLowPower() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  try {
    // Respect users who asked for reduced motion
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return true;
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      // Data Saver is ON
      if (conn.saveData) return true;
      // 2G-class connection
      const type = (conn.effectiveType || '').toLowerCase();
      if (type === 'slow-2g' || type === '2g') return true;
      // Very low measured bandwidth (~<1.2 Mbps)
      if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.2) return true;
    }

    // Low-RAM device (Chromium only exposes this)
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4) {
      return true;
    }
  } catch {
    // Ignore detection errors — default to not-low-power
  }

  return false;
}

export default function useLowPower() {
  const [lowPower, setLowPower] = useState(detectLowPower);

  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn || typeof conn.addEventListener !== 'function') return;

    const update = () => setLowPower(detectLowPower());
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return lowPower;
}
