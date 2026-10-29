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
// the curtain unmounts. Covers the 600ms panel transition and the 1.3s pop.
export const CURTAIN_SETTLE_MS = 1400;

// Confetti pieces fired when the curtain opens, shared between three
// emitters at the top edge (left, centre seam, right).
export const CURTAIN_POP_COUNT = 60;

// Fractional positions along the top edge and the direction each burst
// drifts: the side emitters throw inward, the centre throws both ways.
export const CURTAIN_EMITTERS = [
  { left: '8%', dir: 1 },
  { left: '50%', dir: 0 },
  { left: '92%', dir: -1 },
];
