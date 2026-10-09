import { safeSessionGet, safeSessionSet } from './safeStorage.js';
import { isOffline } from './errorRecoveryLogic.js';

// Unstyled-boot recovery decisions for CssRecoveryGuard's effect in main.jsx —
// pure, unit-tested. The DOM work (getComputedStyle probe, the window 'load'
// listener) stays in the component; these are the knobs that detect a missing
// entry stylesheet and recover with exactly one reload.
//
// Why this exists: the entry stylesheet (assets/index-*.css) has no JS import
// to reject on failure — unlike lazy chunks, which lazyWithRetry retries and
// reloads. When the <link> 404s (stale deploy hash, a proxy hiccup, a blocked
// request) React still mounts and the page renders fully unstyled: giant hero
// images, a jammed navbar, serif fallback fonts. The probe below detects that
// state and the reload fetches a fresh document. Bounded to one reload per
// session and suppressed offline, same policy as the chunk/error recoveries.
export const CSS_RELOAD_KEY = 'foces:css-auto-reloaded';

// window 'load' waits for stylesheets, so a missing body background at load is
// a genuine failure, not slowness. The failsafe covers a 'load' stalled by an
// unrelated resource (e.g. a hung font fetch) while the stylesheet failed
// long ago — 8s is past any realistic stylesheet flight, even on 2G.
export const CSS_PROBE_FAILSAFE_MS = 8000;

// index.css paints body{background:#101011}. Per CSSOM serialization an opaque
// background computes to rgb() (never rgba()), but engines differ on comma
// spacing — the predicate normalizes whitespace and case before comparing.
const CSS_BODY_BACKGROUND = 'rgb(16,16,17)';

/**
 * True when the entry stylesheet is applied, judged by the computed body
 * background it paints. Anything else — transparent (no stylesheet), a
 * foreign value, a non-string — means the boot is unstyled.
 *
 * @param {unknown} bodyBackground — getComputedStyle(document.body).backgroundColor
 * @returns {boolean}
 */
export function cssLooksApplied(bodyBackground) {
  if (typeof bodyBackground !== 'string') return false;
  return bodyBackground.replace(/\s+/g, '').toLowerCase() === CSS_BODY_BACKGROUND;
}

/**
 * True when the unstyled-boot reload was already spent this session.
 *
 * @param {{ storage?: Storage | null }} [options]
 * @returns {boolean}
 */
export function hasCssReloaded({ storage } = {}) {
  return safeSessionGet(CSS_RELOAD_KEY, null, storage) === '1';
}

/**
 * Decide whether a missing stylesheet should trigger the one-shot reload.
 *
 * @param {{ storage?: Storage | null }} [options]
 * @returns {boolean}
 */
export function shouldReloadForMissingCss({ storage } = {}) {
  return !hasCssReloaded({ storage });
}

/**
 * Records the unstyled-boot reload and executes it. Silent no-op offline (a
 * reload without a connection replays the same failure) and once the session
 * flag is spent, so the worst case is one reload, never a loop.
 *
 * @param {{
 *   storage?: Storage | null,
 *   win?: Window | null,
 *   reloadFn?: () => void
 * }} [options]
 */
export function recordCssReload({
  storage,
  win = typeof window !== 'undefined' ? window : null,
  reloadFn,
} = {}) {
  if (isOffline(win)) return;
  if (hasCssReloaded({ storage })) return;
  safeSessionSet(CSS_RELOAD_KEY, '1', storage);
  const doReload =
    reloadFn ||
    (() => {
      if (win && win.location && typeof win.location.reload === 'function') {
        win.location.reload();
      }
    });
  doReload();
}
