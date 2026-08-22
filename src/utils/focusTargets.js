import { findFocusableElements } from './overlayLifecycle.js';

// Pure focus-target resolution for overlay lifecycle (entry + restore).
//
// Deletion test: delete this module and the ref/id/fallback chain duplicates
// in useFocusRestore (entry path + restore path) scatter as two copies of the
// same 4-branch resolution. One seam, two consumers, one spec file.

/**
 * Resolve the element to focus when an overlay opens.
 * Priority: explicit ref > explicit id > first focusable inside container >
 * container itself.
 *
 * @param {{
 *   initialFocusRef?: { current?: HTMLElement | null },
 *   initialFocusId?: string,
 *   containerRef?: { current?: HTMLElement | null },
 *   containerId?: string,
 *   doc: Document
 * }} params
 * @returns {HTMLElement | null}
 */
export function resolveEntryFocusTarget({
  initialFocusRef,
  initialFocusId,
  containerRef,
  containerId,
  doc,
}) {
  let target = initialFocusRef?.current ?? null;
  if (!target && initialFocusId) {
    target = doc.getElementById(initialFocusId);
  }
  if (!target) {
    const container =
      containerRef?.current || (containerId ? doc.getElementById(containerId) : null);
    if (container) {
      const focusables = findFocusableElements(container);
      target = focusables[0] || container;
    }
  }
  return target;
}

/**
 * Resolve the element to focus when an overlay closes.
 * Priority: explicit restore ref captured at open > explicit id > previously
 * focused element.
 *
 * @param {{
 *   explicitRestoreTarget?: HTMLElement | null,
 *   restoreFocusId?: string,
 *   previouslyFocusedElement?: HTMLElement | null,
 *   doc: Document
 * }} params
 * @returns {HTMLElement | null}
 */
export function resolveRestoreFocusTarget({
  explicitRestoreTarget,
  restoreFocusId,
  previouslyFocusedElement,
  doc,
}) {
  if (explicitRestoreTarget) return explicitRestoreTarget;
  if (restoreFocusId) return doc.getElementById(restoreFocusId);
  return previouslyFocusedElement ?? null;
}

/**
 * Focus an element if it is present and focusable. Null-safe.
 * @param {HTMLElement | null | undefined} el
 */
export function focusIfFocusable(el) {
  if (el && typeof el.focus === 'function') {
    el.focus();
    return true;
  }
  return false;
}
