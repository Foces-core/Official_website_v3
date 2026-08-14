// Seamless infinite wrap for TeamCarousel: 3 copies of the cards are
// rendered because Swiper's loop mode can't be used (the cube rotates 90°
// per face, and loop jams at its append boundary with only ~3 slides per
// view). A 0ms jump between copies makes the wrap invisible — index 0 and 32
// share the same cube orientation. Pure math, unit-tested.
export function normalizeIndex(activeIndex, total) {
  return activeIndex % total;
}

// The copy-jump target for a raw swiper index, or null when it sits in the
// middle copy (indices total..2*total-1) and no jump is needed.
export function wrapTarget(activeIndex, total) {
  if (activeIndex >= total * 2) return activeIndex - total;
  if (activeIndex < total) return activeIndex + total;
  return null;
}
