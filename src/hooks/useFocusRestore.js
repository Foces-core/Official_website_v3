import { useEffect, useRef } from 'react';
import { deferToNextPaint } from '../Pages/LandingPage/Navbar/navSpy.js';
import { findFocusableElements } from '../utils/overlayLifecycle.js';

/**
 * Focused hook that captures focus prior to opening an overlay, focuses an
 * initial element, and restores focus back to the trigger or pre-open element
 * when the overlay closes or unmounts (WCAG 2.4.3 Focus Order).
 *
 * @param {{
 *   isOpen: boolean,
 *   initialFocusRef?: React.RefObject<HTMLElement>,
 *   initialFocusId?: string,
 *   restoreFocusRef?: React.RefObject<HTMLElement>,
 *   restoreFocusId?: string,
 *   containerRef?: React.RefObject<HTMLElement>,
 *   containerId?: string,
 *   doc?: Document
 * }} options
 */
export default function useFocusRestore({
  isOpen,
  initialFocusRef,
  initialFocusId,
  restoreFocusRef,
  restoreFocusId,
  containerRef,
  containerId,
  doc = typeof document !== 'undefined' ? document : null,
}) {
  const previouslyFocusedElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !doc) return;

    // Capture element focused prior to opening
    if (doc.activeElement) {
      previouslyFocusedElementRef.current = doc.activeElement;
    }

    // Focus entry: initialFocusRef -> initialFocusId -> first focusable in container
    const cancelEntry = deferToNextPaint(() => {
      let targetToFocus = initialFocusRef?.current;
      if (!targetToFocus && initialFocusId) {
        targetToFocus = doc.getElementById(initialFocusId);
      }
      if (!targetToFocus) {
        const container =
          containerRef?.current || (containerId ? doc.getElementById(containerId) : null);
        if (container) {
          const focusables = findFocusableElements(container);
          targetToFocus = focusables[0] || container;
        }
      }

      if (targetToFocus && typeof targetToFocus.focus === 'function') {
        targetToFocus.focus();
      }
    });

    const explicitRestoreTarget = restoreFocusRef?.current;

    return () => {
      cancelEntry();
      // Restore focus on close / unmount
      deferToNextPaint(() => {
        let restoreEl = explicitRestoreTarget;
        if (!restoreEl && restoreFocusId) {
          restoreEl = doc.getElementById(restoreFocusId);
        }
        if (!restoreEl) {
          restoreEl = previouslyFocusedElementRef.current;
        }
        if (restoreEl && typeof restoreEl.focus === 'function') {
          restoreEl.focus();
        }
      });
    };
  }, [
    isOpen,
    initialFocusId,
    initialFocusRef,
    restoreFocusId,
    restoreFocusRef,
    containerId,
    containerRef,
    doc,
  ]);
}
