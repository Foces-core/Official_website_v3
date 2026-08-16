/**
 * ARIA button-activation convention (WAI-ARIA APG pattern for role="button").
 * Enter or Space activates the control; prevents default page scrolling on Space.
 *
 * @param {KeyboardEvent | { key?: string }} e
 * @returns {boolean} true if the key is an activation key
 */
export function isActivationKey(e) {
  if (!e || typeof e.key !== 'string') return false;
  return e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
}

/**
 * Higher-order keydown handler for role="button" elements.
 *
 * @param {(e: any) => void} onActivate
 * @returns {(e: any) => void}
 */
export function onActivationKey(onActivate) {
  return (e) => {
    if (isActivationKey(e)) {
      if (typeof e?.preventDefault === 'function') {
        e.preventDefault();
      }
      onActivate(e);
    }
  };
}
