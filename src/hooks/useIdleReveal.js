import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_IDLE_REVEAL_MS, shouldShowIdleReveal } from '../utils/idleReveal.js';

const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];

/**
 * useIdleReveal — auto-hide wiring for idle-revealed controls.
 *
 * Marks activity on pointer/key/wheel/touch events anywhere inside the
 * target element and keeps the controls visible; after `idleMs` of silence
 * the decision module (idleReveal.shouldShowIdleReveal) says to hide them.
 * `focusin` is listened to separately from the passive pointer set because
 * keyboard users focusing a hidden (opacity-0) arrow button must reveal it
 * even though pointer-events is disabled on the hidden state.
 *
 * `pulse` (optional): an external activity signal — when its value CHANGES,
 * the controls reveal and the idle window restarts. Carousels pass their
 * active index so dots stay visible while slides cycle (autoplay included)
 * even when no pointer event fires, without sharing a timer with the
 * arrows (whose visibility is pointer-driven only).
 *
 * The state starts visible and only hides after measured idle — a JS failure
 * in the hook degrades to today's always-visible controls, never to missing
 * controls (same failsafe philosophy as the carousel-ready gate).
 *
 * @param {{ current: Element | null }} targetRef element whose hover/activity owns the reveal
 * @param {{ idleMs?: number, pulse?: number | string }} [options]
 * @returns {boolean} whether the controls should be visible
 */
export default function useIdleReveal(targetRef, { idleMs = DEFAULT_IDLE_REVEAL_MS, pulse } = {}) {
  const [visible, setVisible] = useState(true);
  // Refs start at 0 — Date.now() is impure and may not run during render
  // (react-hooks/purity); the effect stamps the mount time before arming.
  const lastActivityRef = useRef(0);
  const timerRef = useRef(null);
  // Indirection so the hide-check can re-arm itself while focus stays inside
  // (self-referencing useCallback would create a circular dependency).
  const hideCheckRef = useRef(() => {});

  const scheduleHide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => hideCheckRef.current(), idleMs);
  }, [idleMs]);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  // The hide decision lives in a ref-anchored callback so both the event
  // path and the pulse path share one implementation.
  useEffect(() => {
    hideCheckRef.current = () => {
      const el = targetRef.current;
      // A focused control inside the target must never hide under the
      // pointer-idle policy: keyboard users would lose the visible focus
      // indicator to opacity-0. Reveal for as long as focus stays inside.
      if (el?.ownerDocument?.activeElement && el.contains(el.ownerDocument.activeElement)) {
        setVisible(true);
        scheduleHide();
        return;
      }
      setVisible(
        shouldShowIdleReveal({
          lastActivityAt: lastActivityRef.current,
          now: Date.now(),
          idleMs,
        }),
      );
    };
    return () => {
      hideCheckRef.current = () => {};
    };
  }, [targetRef, idleMs, scheduleHide]);

  // Pointer/key/wheel/touch activity listener set.
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;

    ACTIVITY_EVENTS.forEach((evt) => el.addEventListener(evt, markActivity, { passive: true }));
    // Focus reaches hidden (opacity-0) buttons via keyboard tabbing even when
    // pointer-events is disabled — reveal on it so focus is always visible.
    el.addEventListener('focusin', markActivity);
    lastActivityRef.current = Date.now();
    scheduleHide();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => el.removeEventListener(evt, markActivity));
      el.removeEventListener('focusin', markActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [targetRef, markActivity, scheduleHide]);

  // External activity pulse (e.g. the carousel's active index): every change
  // re-reveals and restarts the window — no listener churn. Deferred one
  // tick: the effect body stays free of synchronous setState (the same rule
  // the mount-time stamp follows).
  useEffect(() => {
    if (pulse === undefined) return;
    const t = setTimeout(markActivity, 0);
    return () => clearTimeout(t);
  }, [pulse, markActivity]);

  return visible;
}
