// Autoplay-on-screen gating is now internal to useCarousel — the engine
// observes the wrapperRef with IntersectionObserver and starts/stops autoplay
// as the carousel enters/leaves the viewport. This hook is retained for
// backward compatibility but is no longer imported by any consumer.
//
//   autoplayGate(visible, disable)  — 'start' | 'stop'

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
