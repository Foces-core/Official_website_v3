/**
 * Serve Sanity-hosted images at a capped width with the browser's best format
 * (WebP/AVIF via `auto=format`). Sanity originals are often 3000px+; a gallery
 * card only ever displays ~1000px, so this cuts their transfer weight by
 * several times with zero visible difference. Local bundled assets pass
 * through untouched (they're already optimized at build time).
 *
 * @param {string} url  Sanity asset URL (or any URL)
 * @param {number} [w=1000]  Max display width in pixels
 * @returns {string}  The optimized URL (or the original if it's not Sanity)
 */
export const sanityImg = (url, w = 1000) =>
  url && url.includes('cdn.sanity.io') ? `${url.split('?')[0]}?w=${w}&auto=format&q=72` : url;

/**
 * Generate a tiny blurred placeholder for Sanity images (LQIP).
 * Returns a ~20px wide blurred data-URL-quality image via Sanity CDN.
 * Non-Sanity URLs return undefined (no placeholder available).
 *
 * @param {string} url  Sanity asset URL
 * @returns {string|undefined}  Blurred placeholder URL or undefined
 */
export const sanityBlurUrl = (url) =>
  url && url.includes('cdn.sanity.io')
    ? `${url.split('?')[0]}?w=20&blur=20&auto=format&q=30`
    : undefined;
