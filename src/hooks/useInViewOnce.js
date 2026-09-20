import { useEffect, useRef, useState } from 'react';

/**
 * useInViewOnce — fire-once in-view detection for reveal-on-scroll styling.
 *
 * Resolves true the first time the target intersects the viewport and never
 * returns to false: reveal semantics, not show/hide semantics (a color
 * reveal that un-reveals on scroll-out would flicker while scrolling past).
 * The observer disconnects after the first hit.
 *
 * Failsafe: when IntersectionObserver is unavailable (very old browsers,
 * some test environments) the hook resolves true immediately — content is
 * never stuck in its pre-reveal state by a missing API.
 *
 * @param {{ current: Element | null }} targetRef element to observe
 * @param {{ threshold?: number }} [options]
 * @returns {boolean}
 */
export default function useInViewOnce(targetRef, { threshold = 0.2 } = {}) {
  const [inView, setInView] = useState(false);
  const seenRef = useRef(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      // Failsafe: resolve on the next tick (not synchronously in the effect
      // body) — content is never stuck pre-reveal by a missing API.
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (seenRef.current) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          seenRef.current = true;
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef, threshold]);

  return inView;
}
