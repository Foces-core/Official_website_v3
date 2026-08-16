/**
 * Image-policy seam — one pure place that answers "how big may a photo be
 * for this device?" and enforces it on a srcset string.
 *
 * Consumption rule: <BlurImage> is the single render seam every photo routes
 * through (events via photoTriplet, echo slides via imageSet, team via
 * srcset), and it is the only consumer of this module — so the cap lives in
 * one place instead of being re-derived at each image site.
 *
 * Intended to fold into the experience-tier module (architecture report,
 * Candidate 2) as a capability: resolveExperienceTier(profile) will own the
 * matrix and this module becomes the image-specific consumer of a tier.
 */

export const IMAGE_WIDTH_TIERS = {
  // slowNetwork — cut payload hardest: a 400w file is enough to recognize a
  // person / read a poster at card size, and it is the smallest candidate
  // every triplet ships.
  slowNetwork: 400,
  // lowCPU — cut decode cost: 800w covers retina without the 1000w decode.
  lowCPU: 800,
  // capable devices get the full triplet.
  full: 1000,
};

/**
 * Map a device profile to the largest image width it should download.
 * `slowNetwork` wins over `lowCPU` (a low-CPU device on a slow network still
 * wants the smaller file). Missing/unknown fields resolve to the full tier.
 *
 * @param {{ slowNetwork?: boolean, lowCPU?: boolean }} [profile]
 * @returns {number} 400 | 800 | 1000
 */
export function resolveMaxImageWidth({ slowNetwork, lowCPU } = {}) {
  if (slowNetwork) return IMAGE_WIDTH_TIERS.slowNetwork;
  if (lowCPU) return IMAGE_WIDTH_TIERS.lowCPU;
  return IMAGE_WIDTH_TIERS.full;
}

/**
 * Drop every srcset candidate wider than `maxWidth`, preserving order and
 * formatting ("url 1000w, url 800w, ...").
 *
 * Floor: if every candidate is wider than the cap (the echo slides only ship
 * 480w+), keep the single smallest one — an EMPTY srcset makes the browser
 * fall back to the full-size `src`, which would defeat the cap entirely.
 *
 * @param {string|undefined} srcsetValue
 * @param {number} maxWidth
 * @returns {string|undefined} the capped srcset (undefined/'' pass through)
 */
export function capSrcset(srcsetValue, maxWidth) {
  if (srcsetValue == null || srcsetValue === '') return srcsetValue;
  const candidates = srcsetValue
    .split(',')
    .map((pair) => pair.trim().split(/\s+/))
    .filter(([url, width]) => typeof url === 'string' && url.length > 0 && /^\d+w$/.test(width))
    .map(([url, width]) => [url, Number.parseInt(width, 10)]);
  if (candidates.length === 0) return srcsetValue;

  const kept = candidates.filter(([, width]) => width <= maxWidth);
  // When every candidate exceeds the cap, `final` must still be an array of
  // pairs — the smallest candidate, so the floor is a single-element srcset.
  const final =
    kept.length > 0
      ? kept
      : [
          candidates.reduce(
            (min, candidate) => (candidate[1] < min[1] ? candidate : min),
            candidates[0],
          ),
        ];

  return final.map(([url, width]) => `${url} ${width}w`).join(', ');
}
