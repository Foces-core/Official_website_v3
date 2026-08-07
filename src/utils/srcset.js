/**
 * Build an HTML `srcset` attribute value from [url, width] pairs.
 *
 * @param {Array<[string, number]>} variants  [url, width-w] pairs, largest first
 * @returns {string}  e.g. "a.webp 1280w, b.webp 960w, c.webp 480w"
 */
export const srcset = (variants) => variants.map(([url, w]) => `${url} ${w}w`).join(', ');
