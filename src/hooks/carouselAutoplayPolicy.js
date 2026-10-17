/**
 * Autoplay is safe only when the carousel is configured and its visibility can
 * be observed. Without visibility data, hidden responsive copies would advance
 * alongside the visible carousel.
 */
export function shouldUseVisibilityGatedAutoplay({ autoplayDelay, canObserveVisibility }) {
  return autoplayDelay > 0 && canObserveVisibility;
}
