// Pure confetti particle physics for the easter-egg burst — unit-tested.
// The DOM writes (style.transform, opacity, removal) stay in AboutUs.jsx;
// this module owns the per-particle spec and the per-frame step.
export function createParticleSpec(rand = Math.random) {
  return {
    x: 0,
    y: 0,
    vx: (rand() - 0.5) * 6,
    vy: -(2.5 + rand() * 5), // upward — gravity pulls it down over the burst
    rot: rand() * 360,
    vr: (rand() - 0.5) * 22,
    life: 1,
    decay: 0.012 + rand() * 0.008,
  };
}

// Advance one particle by one frame. Returns false once life is exhausted
// (the caller should stop rendering it).
export function stepParticle(p, { gravity = 0.16, drift = 0.985 } = {}) {
  p.vy += gravity;
  p.vx *= drift;
  p.vy *= drift;
  p.x += p.vx;
  p.y += p.vy;
  p.rot += p.vr;
  p.life -= p.decay;
  return p.life > 0;
}
