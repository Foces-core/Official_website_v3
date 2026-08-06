// AOS reveal animations are disabled for users who asked for no motion AND
// for low-end devices (slow network / few cores / low RAM) where transform
// reveals on scroll cause visible jank. Capable machines get the reveals.
export function aosDisabled() {
  if (typeof window === 'undefined') return false;

  if (typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      if (conn.saveData) return true;
      const type = (conn.effectiveType || '').toLowerCase();
      if (type === 'slow-2g' || type === '2g') return true;
      if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.2) return true;
    }
    const cores = navigator.hardwareConcurrency;
    const lowRam =
      typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;
    const fewCores = typeof cores !== 'number' || cores <= 4;
    if (lowRam && fewCores) return true;
  } catch {
    // ignore — default to enabled
  }

  return false;
}
