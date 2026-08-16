/**
 * Safe, fault-tolerant wrapper for Web Storage (sessionStorage).
 *
 * sessionStorage can throw in Safari Private Browsing, restricted iframes, or when
 * storage quotas are exceeded. These helpers guarantee zero-throw access and fallback gracefully.
 */

/**
 * Safely retrieve a string from sessionStorage.
 *
 * @param {string} key
 * @param {string | null} [defaultValue=null]
 * @param {Storage | null} [storage]
 * @returns {string | null}
 */
export function safeSessionGet(
  key,
  defaultValue = null,
  storage = typeof window !== 'undefined' ? window.sessionStorage : null,
) {
  try {
    if (!storage) return defaultValue;
    const value = storage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely store a string in sessionStorage.
 *
 * @param {string} key
 * @param {string} value
 * @param {Storage | null} [storage]
 * @returns {boolean} true if write succeeded, false if blocked/failed
 */
export function safeSessionSet(
  key,
  value,
  storage = typeof window !== 'undefined' ? window.sessionStorage : null,
) {
  try {
    if (!storage) return false;
    storage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely remove an entry from sessionStorage.
 *
 * @param {string} key
 * @param {Storage | null} [storage]
 * @returns {boolean}
 */
export function safeSessionRemove(
  key,
  storage = typeof window !== 'undefined' ? window.sessionStorage : null,
) {
  try {
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely check if a key exists in sessionStorage.
 *
 * @param {string} key
 * @param {Storage | null} [storage]
 * @returns {boolean}
 */
export function safeSessionHas(
  key,
  storage = typeof window !== 'undefined' ? window.sessionStorage : null,
) {
  return safeSessionGet(key, null, storage) !== null;
}
