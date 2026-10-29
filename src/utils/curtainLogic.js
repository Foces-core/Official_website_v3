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

// How long the parting panels take to leave the screen before the curtain
// unmounts. Matches the CSS transition duration in Curtain.css.
export const CURTAIN_SETTLE_MS = 900;
