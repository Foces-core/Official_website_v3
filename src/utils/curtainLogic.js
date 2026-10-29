// The cinematic entry curtain — a pure decision module for which user action
// reveals the site. The curtain always renders (it is static content, not an
// ambient effect); its OPENING motion is the only part gated by the reduced
// motion attribute (ADR-0028).

// Keyboard reveals are deliberate only: Enter (and Escape, which reads as
// "dismiss"). Space and arrows would fire on scroll attempts or focus
// moves, opening the curtain by accident.
export function isRevealKey(key) {
  return key === 'Enter' || key === 'Escape';
}

// How long the parting panels plus confetti take to leave the screen before
// the curtain unmounts. Covers the 1.1s panel transition and the 1.8s pop.
export const CURTAIN_SETTLE_MS = 2400;

// Confetti pieces fired when the curtain opens, shared between three
// emitters at the top edge (left, centre seam, right).
export const CURTAIN_POP_COUNT = 150;

// Seed for one curtain confetti particle at an emitter. `dir` biases the
// horizontal burst: -1 throws left, 0 spreads symmetrically, +1 throws
// right. Initial velocity points mostly down and out — the shared
// stepParticle integrator (gravity + drag) takes it from there.
export function createCurtainParticle(dir, rand = Math.random) {
  const outward = dir === 0 ? (rand() - 0.5) * 7 : dir * (2 + rand() * 6);
  return {
    x: 0,
    y: 0,
    vx: outward + (rand() - 0.5) * 1.5,
    vy: 0.5 + rand() * 3.5,
    rot: rand() * 360,
    vr: (rand() - 0.5) * 24,
    life: 1,
    decay: 0.007 + rand() * 0.009,
  };
}

// Fractional positions along the top edge and the direction each burst
// drifts: the side emitters throw inward, the centre throws both ways.
export const CURTAIN_EMITTERS = [
  { left: '8%', dir: 1 },
  { left: '50%', dir: 0 },
  { left: '92%', dir: -1 },
];
