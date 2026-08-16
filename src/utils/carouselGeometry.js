// Carousel geometry — the transform math for the hand-rolled carousels
// (Featuring's flat slider and Execom's 3D cube), replacing Swiper's
// internal layout engine with pure, unit-tested functions.
//
// Both carousels render 3 copies of the slides for the seamless wrap (see
// carouselWrap.js) and move a single "track" element:
//   - flat:  translate3d(-activeIndex * step, 0, 0)
//   - cube:  each face rotateY(i * 90deg) translateZ(radius); the track
//            rotateY(-activeIndex * 90deg) — the classic CSS cube, matching
//            Swiper's EffectCube orientation (shadow: false — the repo's
//            Execom config, they read as a black smear on the dark bg).
//
// All functions are pure: no DOM, no state.

export const CUBE_ANGLE = 90; // the cube rotates 90° per face

// Horizontal distance between two flat slide positions (slide width + gap).
export function slideStep(slideWidth, spaceBetween) {
  return slideWidth + spaceBetween;
}

// Track transform for the flat slider. dragOffset lets a pointer drag
// preview the motion (0 when idle).
export function flatTrackTransform(activeIndex, step, dragOffset = 0) {
  return `translate3d(${-(activeIndex * step) + dragOffset}px, 0, 0)`;
}

// One cube face: rotated to its angle, pushed out to the cube radius
// (half the track width). Faces are absolutely positioned (CSS), so the
// transform-origin is the face center.
export function cubeFaceTransform(index, radius) {
  return `rotateY(${index * CUBE_ANGLE}deg) translateZ(${radius}px)`;
}

// The cube track: rotate the whole cube by -90° per active face. dragAngle
// (degrees, from a pointer drag) previews the motion when non-zero: the base
// rotation is negative (faces advance left), so a NEGATIVE dragAngle (finger
// dragging left) must push it further negative — toward the next face, the
// same direction dragSnap settles on. Adding the angle inside the negation
// would invert the preview (drag left → previous face flashes, then the cube
// jumps forward on release).
export function cubeTrackTransform(activeIndex, dragAngle = 0) {
  return `rotateY(${-activeIndex * CUBE_ANGLE + dragAngle}deg)`;
}

// A pointer delta (px) converted to cube drag degrees: a full face width of
// travel = one 90° face turn.
export function cubeDragAngle(deltaX, faceWidth) {
  if (!faceWidth) return 0;
  return (deltaX / faceWidth) * CUBE_ANGLE;
}

// Snap decision after a drag: which way should the carousel settle?
//   deltaX — total horizontal pointer travel (negative = dragged left)
//   step   — one slide's worth of travel (flat: slideStep; cube: faceWidth)
//   velocity — px per ms of the final gesture (flick detection)
//   thresholdRatio — fraction of `step` that forces a turn (default 1/3)
// Returns -1 (previous), 1 (next) or 0 (snap back in place).
export function dragSnap(deltaX, step, velocity, thresholdRatio = 1 / 3) {
  const threshold = step * thresholdRatio;
  // Flick beats distance — but only once the finger actually travelled. A
  // stationary tap's micro-jitter reports a huge velocity (px / ms with
  // ms→0), which would otherwise turn a face the user meant as a tap.
  const FLICK_PX_PER_MS = 0.5;
  const FLICK_MIN_PX = 10;
  if (Math.abs(velocity) > FLICK_PX_PER_MS && Math.abs(deltaX) > FLICK_MIN_PX) {
    return velocity < 0 ? 1 : -1;
  }
  if (deltaX < -threshold) return 1;
  if (deltaX > threshold) return -1;
  return 0;
}
