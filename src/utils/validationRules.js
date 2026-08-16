/**
 * Shared primitives for schema validators (validateTeam, validateEvents, validateEchoSlides).
 */

/**
 * Returns true if value is a string with non-whitespace characters.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Returns true if value is a finite number.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Parses a srcset string like "/a.webp 1000w, /a-800.webp 800w" and returns
 * the first URL that is declared with two DIFFERENT width descriptors.
 * Returns null when every URL has a single consistent width.
 *
 * @param {string} srcsetString
 * @returns {[string, string, string] | null} [url, firstWidth, secondWidth] or null
 */
export function findDuplicateWidth(srcsetString) {
  if (!isNonEmptyString(srcsetString)) return null;
  const widthsByUrl = new Map();
  for (const part of srcsetString.split(',')) {
    const match = part.trim().match(/^(\S+)\s+(\d+)w$/);
    if (!match) continue;
    const [, url, width] = match;
    if (widthsByUrl.has(url) && widthsByUrl.get(url) !== width) {
      return [url, widthsByUrl.get(url), width];
    }
    widthsByUrl.set(url, width);
  }
  return null;
}

/**
 * Validates key uniqueness against a Set. Appends to problems if duplicate, otherwise adds key to set.
 *
 * @param {Set<unknown>} seenSet
 * @param {unknown} key
 * @param {string} problemMessage
 * @param {string[]} problems
 * @returns {boolean} true if unique (added), false if duplicate (problem pushed)
 */
export function checkUniqueKey(seenSet, key, problemMessage, problems) {
  if (seenSet.has(key)) {
    problems.push(problemMessage);
    return false;
  }
  seenSet.add(key);
  return true;
}
