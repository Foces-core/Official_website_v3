/**
 * Image-policy string mechanics — the one pure helper that enforces a width
 * cap on a srcset string.
 *
 * The POLICY (which width cap a device gets) lives in the experience-tier
 * matrix (utils/experienceTier.js, `imageMaxWidth` capability); this module
 * only knows how to enforce it on a srcset string. <BlurImage> is the single
 * consumer: it reads `imageMaxWidth` from the matrix and passes it here.
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
