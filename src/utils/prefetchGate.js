/**
 * Prefetch gate — the single owner of "should we prefetch right now?"
 *
 * Every prefetch call site (Navbar hover, Events intent-prefetch, idle
 * preloading, ForesightJS trajectory prediction) checks this gate before
 * firing an import(). The gate reads the device profile's slowNetwork flag
 * and the Network Information API's saveData / effectiveType — the same
 * inputs the app already uses, but in one tested place.
 *
 * Policy:
 *   - slowNetwork (device profile: 2g, 3g, lowCPU, saveData) → block
 *   - saveData header → block
 *   - 2g / slow-2g effectiveType → block
 *   - Everything else → allow
 *
 * @param {{ slowNetwork?: boolean,
 *           connection?: { saveData?: boolean, effectiveType?: string } }} opts
 * @returns {boolean} true when prefetching is allowed
 */
export function prefetchGate({ slowNetwork = false, connection } = {}) {
  if (slowNetwork) return false;

  // Prefer the injected connection (for testing); fall back to the real API.
  const conn = connection ?? (typeof navigator !== 'undefined' ? navigator.connection : null);

  if (conn) {
    if (conn.saveData === true) return false;
    if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') return false;
  }

  return true;
}
