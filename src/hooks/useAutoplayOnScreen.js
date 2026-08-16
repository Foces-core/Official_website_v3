import { useEffect } from 'react';

// Autoplay-on-screen gating — one seam for both carousels (Featuring and
// Execom's TeamCarousel used to implement the identical IntersectionObserver
// effect; the "two implementations of one behavior" signal). The decision is
// pure; the hook wires it to the DOM. The `swiperRef` name is legacy — it now
// holds the hand-rolled useCarousel instance, which keeps the same
// autoplay.start/stop shape.
//
//   autoplayGate(visible, disable)  — 'start' | 'stop'
//   useAutoplayOnScreen(...)        — observe the carousel wrapper; start
//                                     autoplay while visible and not
//                                     disabled, stop when hidden or disabled

/**
 * The gating decision: run autoplay only when the carousel is on screen AND
 * not disabled (reduced motion). Calling start/stop when already in that
 * state is harmless — the swiper methods are idempotent.
 *
 * @param {boolean} visible — is the carousel intersecting the viewport
 * @param {boolean} disable — autoplay disabled (e.g. prefers-reduced-motion)
 * @returns {'start' | 'stop'}
 */
export function autoplayGate(visible, disable) {
  return visible && !disable ? 'start' : 'stop';
}

/**
 * Observe a carousel wrapper and start/stop swiper autoplay as it enters or
 * leaves the viewport (threshold 0.1, matching both original effects).
 *
 * @param {{ elementRef: React.RefObject<HTMLElement>,
 *           swiperRef: React.RefObject<{ autoplay?: { start(): void, stop(): void } }>,
 *           disable: boolean }} props
 */
export function useAutoplayOnScreen({ elementRef, swiperRef, disable }) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = elementRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const swiper = swiperRef.current;
        if (!swiper) return;
        if (autoplayGate(entry.isIntersecting, disable) === 'start') {
          swiper.autoplay?.start();
        } else {
          swiper.autoplay?.stop();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [elementRef, swiperRef, disable]);
}
