import { deferToNextPaint } from '../Pages/LandingPage/Navbar/navSpy.js';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Finds all visible, non-disabled focusable elements inside a container.
 *
 * @param {HTMLElement | null} container
 * @returns {HTMLElement[]}
 */
export function findFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== 'function') return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (typeof el.hasAttribute === 'function' && el.hasAttribute('disabled')) return false;
    if (typeof el.getAttribute === 'function' && el.getAttribute('aria-hidden') === 'true')
      return false;
    return el.offsetParent !== null || (el.style && el.style.display !== 'none');
  });
}

/**
 * Traps Tab and Shift+Tab key navigation strictly within the given container.
 *
 * @param {KeyboardEvent} event
 * @param {HTMLElement | null} container
 * @returns {boolean} true if focus was trapped and default was prevented
 */
export function trapTabFocus(event, container) {
  if (!event || event.key !== 'Tab' || !container) return false;

  const focusables = findFocusableElements(container);
  if (!focusables.length) return false;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = typeof document !== 'undefined' ? document.activeElement : null;

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
      return true;
    }
  } else {
    if (active === last || !container.contains(active)) {
      event.preventDefault();
      first.focus();
      return true;
    }
  }
  return false;
}

/**
 * Handles Escape key to close the overlay and trigger focus restoration.
 *
 * @param {KeyboardEvent} event
 * @param {(() => void) | {
 *   isOpen?: boolean,
 *   onClose?: () => void,
 *   onRestoreFocus?: () => void
 * }} optionsOrOnClose
 * @returns {boolean} true if Escape was handled
 */
export function handleOverlayEscape(event, optionsOrOnClose) {
  if (!event || event.key !== 'Escape') return false;
  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  if (typeof optionsOrOnClose === 'function') {
    optionsOrOnClose();
    return true;
  }
  const { isOpen = true, onClose, onRestoreFocus } = optionsOrOnClose || {};
  if (!isOpen) return false;
  if (typeof onClose === 'function') {
    onClose();
  }
  if (typeof onRestoreFocus === 'function') {
    deferToNextPaint(onRestoreFocus);
  }
  return true;
}
