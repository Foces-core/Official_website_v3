import { useEffect, useRef } from 'react';
import { manageOverlayScrollLock } from '../utils/navigationCoordinator.js';
import { deferToNextPaint } from '../Pages/LandingPage/Navbar/navSpy.js';
import {
  findFocusableElements,
  trapTabFocus,
  handleOverlayEscape,
} from '../utils/overlayLifecycle.js';

/**
 * Comprehensive overlay lifecycle hook managing:
 * - Ref-counted body scroll lock
 * - Focus entry on open
 * - Focus restoration to triggering element on close
 * - Tab key focus trapping
 * - Escape key dismissal
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose?: () => void,
 *   containerId?: string,
 *   containerRef?: { current: HTMLElement | null },
 *   initialFocusId?: string,
 *   initialFocusRef?: { current: HTMLElement | null },
 *   restoreFocusId?: string,
 *   restoreFocusRef?: { current: HTMLElement | null },
 *   lockScroll?: boolean,
 * }} options
 */
export default function useOverlayLifecycle({
  isOpen,
  onClose,
  containerId,
  containerRef,
  initialFocusId,
  initialFocusRef,
  restoreFocusId,
  restoreFocusRef,
  lockScroll = true,
}) {
  const previouslyFocusedElementRef = useRef(null);

  // 1. Ref-counted body scroll lock
  useEffect(() => {
    if (!lockScroll) return;
    return manageOverlayScrollLock(isOpen);
  }, [isOpen, lockScroll]);

  // 2. Track previous focus before open, move focus in on open, restore on close
  useEffect(() => {
    if (!isOpen) return;

    // Capture element focused prior to opening (for restore on close)
    if (typeof document !== 'undefined' && document.activeElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    // Focus entry: initialFocusRef -> initialFocusId -> first focusable in container
    const entryTimer = deferToNextPaint(() => {
      let targetToFocus = initialFocusRef?.current;
      if (!targetToFocus && initialFocusId && typeof document !== 'undefined') {
        targetToFocus = document.getElementById(initialFocusId);
      }
      if (!targetToFocus) {
        const container =
          containerRef?.current ||
          (containerId && typeof document !== 'undefined'
            ? document.getElementById(containerId)
            : null);
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
      entryTimer();
      // Restore focus on close
      deferToNextPaint(() => {
        let restoreEl = explicitRestoreTarget;
        if (!restoreEl && restoreFocusId && typeof document !== 'undefined') {
          restoreEl = document.getElementById(restoreFocusId);
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
  ]);

  // 3. Tab trapping & Escape handling keydown listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const container =
        containerRef?.current ||
        (containerId && typeof document !== 'undefined'
          ? document.getElementById(containerId)
          : null);

      if (e.key === 'Tab') {
        trapTabFocus(e, container);
      } else if (e.key === 'Escape') {
        handleOverlayEscape(e, {
          isOpen,
          onClose,
          onRestoreFocus: () => {
            const restoreEl =
              restoreFocusRef?.current ||
              (restoreFocusId && typeof document !== 'undefined'
                ? document.getElementById(restoreFocusId)
                : previouslyFocusedElementRef.current);
            if (restoreEl && typeof restoreEl.focus === 'function') {
              restoreEl.focus();
            }
          },
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, containerId, containerRef, restoreFocusId, restoreFocusRef]);
}
