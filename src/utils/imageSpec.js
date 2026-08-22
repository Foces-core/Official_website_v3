import { capSrcset } from './imagePolicy.js';

/**
 * imageSpec — pure image-spec builder (deep module).
 *
 * Single seam for policy-aware srcset capping. No DOM, no hooks, no
 * side effects — same inputs always yield same outputs, so it is
 * fully unit-testable without a browser.
 *
 * The width policy comes from the experience-tier matrix
 * (utils/experienceTier.js `imageMaxWidth` capability): 400w on slow
 * networks, 800w on low CPU, 1000w capable. BlurImage reads the capability
 * once and passes it here — this module stays policy-free, it only applies
 * the number it is given.
 *
 * Deletion test: delete this module and the null-guard + capSrcset wiring
 * scatters back into BlurImage.jsx — the shallow adapter returns.
 *
 * CC = 2 (one null-guard ternary). Well under the <5 budget.
 *
 * @param {{ src?: string, srcSet?: string, sizes?: string,
 *           maxWidth?: number }} [config]
 * @returns {{ src: string|undefined, srcSet: string|undefined, sizes: string|undefined }}
 */
export function createImageSpec({ src, srcSet, sizes, maxWidth } = {}) {
  const cappedSrcSet = srcSet == null ? srcSet : capSrcset(srcSet, maxWidth ?? 1000);
  return { src, srcSet: cappedSrcSet, sizes };
}
