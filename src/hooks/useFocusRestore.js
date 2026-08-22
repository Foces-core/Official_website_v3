import { useEffect, useRef } from 'react';
import { deferToNextPaint } from '../utils/frameScheduler.js';
import {
  resolveEntryFocusTarget,
  resolveRestoreFocusTarget,
  focusIfFocusable,
} from '../utils/focusTargets.js';

/**
 * Focused hook that captures focus prior to opening an overlay, focuses an
 * initial element, and restores focus back to the trigger or pre-open element
 * when the overlay closes or unmounts (WCAG 2.4.3 Focus Order).
 *
 * Target resolution lives in the pure seam utils/focusTargets.js — this hook
 * only wires the open/close lifecycle and captures the previously focused
 * element.
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

    const explicitRestoreTarget = restoreFocusRef?.current ?? null;

    // Focus entry: initialFocusRef -> initialFocusId -> first focusable in container
    const cancelEntry = deferToNextPaint(() => {
      focusIfFocusable(
        resolveEntryFocusTarget({
          initialFocusRef,
          initialFocusId,
          containerRef,
          containerId,
          doc,
        }),
      );
    });

    return () => {
      cancelEntry();
      // Restore focus on close / unmount
      deferToNextPaint(() => {
        focusIfFocusable(
          resolveRestoreFocusTarget({
            explicitRestoreTarget,
            restoreFocusId,
            previouslyFocusedElement: previouslyFocusedElementRef.current,
            doc,
          }),
        );
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
