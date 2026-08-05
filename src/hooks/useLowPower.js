import { useEffect, useState } from 'react';

// Device profile split by constraint so each feature can degrade in the
// cheapest way for the *kind* of constraint it hits:
//   slowNetwork  -> cut payload (lazy-load chunks/images, skip prefetch)
//   lowCPU       -> cut JS animation cost (flatter, shorter, cheaper transitions)
//   reducedMotion-> user explicitly asked for no animation at all
//   lowPower     -> any of the above (kept for coarse "skip heavy stuff")
function detectProfile() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { slowNetwork: false, lowCPU: false, reducedMotion: false, lowPower: false };
  }

  let reducedMotion = false;
  try {
    reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    // ignore
  }

  let slowNetwork = false;
  let lowCPU = false;

  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      // Network-side constraints: Data Saver, 2G-class, or very low bandwidth
      if (conn.saveData) slowNetwork = true;
      const type = (conn.effectiveType || '').toLowerCase();
      if (type === 'slow-2g' || type === '2g') slowNetwork = true;
      if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.2) slowNetwork = true;
    }

    // CPU-side constraint. Require BOTH low memory AND few cores — many
    // high-end phones report only 4GB to Chrome but still have 8+ cores, so
    // memory alone false-positives them into low-end mode.
    const cores = navigator.hardwareConcurrency;
    const lowRam =
      typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;
    const fewCores = typeof cores !== 'number' || cores <= 4;
    if (lowRam && fewCores) lowCPU = true;
  } catch {
    // ignore — default to not-constrained
  }

  return {
    slowNetwork,
    lowCPU,
    reducedMotion,
    lowPower: slowNetwork || lowCPU || reducedMotion,
  };
}

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
