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
// the curtain unmounts. Covers the 850ms panel transition and the 1.3s pop.
export const CURTAIN_SETTLE_MS = 1600;

// Confetti pieces fired from the seam's top when the curtain opens.
export const CURTAIN_POP_COUNT = 36;
