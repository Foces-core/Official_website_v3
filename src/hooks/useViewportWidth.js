import { useState, useEffect } from 'react';

/**
 * Reactive viewport width — the resize-ceremony seam for the layout
 * breakpoints (Loader, Navbar, Featuring used to hand-roll a useState
 * initializer + resize listener each). Feed the result into the pure
 * predicates in breakpoints.js, e.g. `isSmallScreen(useViewportWidth())`.
 *
 * Layout-breakpoint seam by design — NOT the device-profile seam
 * (useDeviceProfile carries no width; it re-detects on network changes, not
 * resizes).
 *
 * @returns {number} current window.innerWidth (0 before hydration)
 */
export function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth));

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}
