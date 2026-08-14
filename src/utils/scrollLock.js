/**
 * scrollLock — ref-counted body scroll-lock (ADR-0009: behavior lives in
 * tested modules; components acquire/release).
 *
 * The save/set/restore of `document.body.style.overflow` was previously
 * hand-rolled in two components (EventPage/Modal lightbox and the Navbar
 * mobile drawer). Neither ref-counted, so if the two ever overlapped the
 * first cleanup would unlock the page while the second overlay was still
 * open. Here the body stays locked until the LAST release — nesting is safe
 * by construction.
 */

let lockCount = 0;
let originalOverflow = null;

/**
 * Lock the page body against scrolling. Returns a release function; the body
 * is restored only when every outstanding lock has been released.
 *
 * @returns {() => void} release — idempotent; safe to call multiple times
 */
export function acquireScrollLock() {
  if (typeof document === 'undefined' || !document.body) {
    return () => {}; // SSR / pre-hydration: nothing to lock
  }

  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount -= 1;
    if (lockCount === 0) {
      document.body.style.overflow = originalOverflow ?? '';
      originalOverflow = null;
    }
  };
}
