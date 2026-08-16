// Seamless infinite wrap for the duplicated-slide carousels (Execom's
// TeamCarousel and the Featuring ECHO carousel): 3 copies of the slides are
// rendered because the cube rotates 90° per face and a true loop would need
// unbounded copies — a 0ms jump between copies makes the wrap invisible
// (index 0 and 32 share the same cube orientation). Pure math, unit-tested.
// Used to live in src/Components/Execom/ until Featuring grew the same
// pattern. The carousels are hand-rolled (see useCarousel) — this module
// only answers "where am I / where do I jump".
export function normalizeIndex(activeIndex, total) {
  return activeIndex % total;
}

// The copy-jump target for a raw carousel index, or null when it sits in the
// middle copy (indices total..2*total-1) and no jump is needed.
export function wrapTarget(activeIndex, total) {
  if (activeIndex >= total * 2) return activeIndex - total;
  if (activeIndex < total) return activeIndex + total;
  return null;
}

// Which copy of the slides a raw index lives in (0, 1 or 2) — used to jump to
// a specific slide in the CURRENT copy from a dot/indicator click.
export function copyFor(activeIndex, total) {
  return Math.floor(activeIndex / total);
}
