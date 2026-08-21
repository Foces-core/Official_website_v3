import { resolveMaxImageWidth, capSrcset } from './imagePolicy.js';

/**
 * imageSpec — pure image-spec builder (deep module).
 *
 * Single seam for policy-aware srcset capping. No DOM, no hooks, no
 * side effects — same inputs always yield same outputs, so it is
 * fully unit-testable without a browser.
 *
 * Deletion test: delete this module and policy logic scatters back
 * into BlurImage.jsx as useMemo + capSrcset + resolveMaxImageWidth
 * wiring plus profile plumbing — the shallow 80-line adapter returns.
 *
 * BlurImage is the thin adapter that calls this and feeds the result
 * to the <img>; every photo (events, echo slides, team) routes through
 * that single seam, so the cap lives in one place.
 *
 * CC = 2 (one null-guard ternary). Well under the <5 budget.
 *
 * @param {{ src?: string, srcSet?: string, sizes?: string, policy?: { slowNetwork?: boolean, lowCPU?: boolean } }} [config]
 * @returns {{ src: string|undefined, srcSet: string|undefined, sizes: string|undefined }}
 */
export function createImageSpec({ src, srcSet, sizes, policy } = {}) {
  const cappedSrcSet =
    srcSet == null ? srcSet : capSrcset(srcSet, resolveMaxImageWidth(policy ?? {}));
  return { src, srcSet: cappedSrcSet, sizes };
}
