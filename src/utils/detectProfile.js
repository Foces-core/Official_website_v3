/**
 * Device-profile detection — pure logic, no React dependency.
 *
 * Returns:
 *   slowNetwork  — cut payload (lazy-load, skip prefetch)
 *   lowCPU       — cut JS animation cost (flatter, shorter, cheaper)
 *   reducedMotion-> user asked for no animation (a11y preference)
 *   lowPower     — coarse "skip heavy/motion stuff"
 *
 * Override via URL params:
 *   ?perf=slow  — force all constraints on
 *   ?perf=high  — force all constraints off (full experience)
 *   ?motion=off — force reduced motion (skip all animations)
 *   ?motion=on  — force full motion (ignore prefers-reduced-motion)
 */

const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
};

function matches(query) {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function getOverride(param, storageKey) {
  try {
    const urlValue = new URLSearchParams(window.location.search).get(param);
    if (urlValue) return urlValue;
  } catch {
    // ignore — SSR or security error
  }

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    // ignore
  }

  return null;
}

function getPerfOverride() {
  const stored = getOverride('perf', 'perfOverride');
  return stored === 'slow' || stored === 'high' ? stored : null;
}

function getMotionOverride() {
  const stored = getOverride('motion', 'motionOverride');
  return stored === 'off' || stored === 'on' ? stored : null;
}

function detectNetwork() {
  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return false;

    if (conn.saveData) return true;

    const type = (conn.effectiveType || '').toLowerCase();
    if (type === 'slow-2g' || type === '2g') return true;

    if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.2) return true;
  } catch {
    // ignore
  }
  return false;
}

// Shared "does this device look underpowered?" heuristic. Both the
// userAgentData path and the generic fallback apply exactly the same test
// (few cores AND low RAM), so it lives here instead of being copy-pasted.
function detectLowSpec() {
  const cores = navigator.hardwareConcurrency;
  const lowRam =
    typeof navigator.deviceMemory === 'number' &&
    navigator.deviceMemory > 0 &&
    navigator.deviceMemory <= 4;
  const fewCores = typeof cores !== 'number' || cores <= 4;
  return lowRam && fewCores;
}

function detectCPU() {
  try {
    // Screen-size heuristic via matchMedia — avoids the foldable/tablet
    // misclassification of window.screen.width. A Galaxy Z Fold unfolded
    // reports screen.width=1812 but matches (max-width: 767px) when folded.
    if (matches(BREAKPOINTS.mobile)) return true;

    // userAgentData: Android/iOS platform hint (Chrome, Edge, Opera only)
    const uaData = navigator.userAgentData;
    if (uaData && typeof uaData.getHighEntropyValues === 'function') {
      if (uaData.platform === 'Android' || uaData.platform === 'iOS') {
        // Mobile platform — but don't immediately mark lowCPU.
        // High-end phones with 8+ cores and 6+ GB RAM are fine.
        return detectLowSpec();
      }
      // Desktop platform from userAgentData — not low CPU
      return false;
    }

    // Fallback: require BOTH low memory AND few cores.
    // High-end phones often report 4GB to Chrome but have 8+ cores.
    return detectLowSpec();
  } catch {
    // ignore
  }
  return false;
}

function detectReducedMotion() {
  const motion = getMotionOverride();
  if (motion === 'off') return true;
  if (motion === 'on') return false;
  return matches('(prefers-reduced-motion: reduce)');
}

export default function detectProfile() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { slowNetwork: false, lowCPU: false, reducedMotion: false, lowPower: false };
  }

  const override = getPerfOverride();
  if (override === 'slow') {
    return { slowNetwork: true, lowCPU: true, reducedMotion: false, lowPower: true };
  }
  if (override === 'high') {
    return {
      slowNetwork: false,
      lowCPU: false,
      reducedMotion: detectReducedMotion(),
      lowPower: false,
    };
  }

  const slowNetwork = detectNetwork();
  const lowCPU = detectCPU();
  const reducedMotion = detectReducedMotion();

  return {
    slowNetwork,
    lowCPU,
    reducedMotion,
    lowPower: slowNetwork || lowCPU || reducedMotion,
  };
}
