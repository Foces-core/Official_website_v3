import { useEffect, useRef, useState, useCallback } from 'react';
import { DEFAULT_IDLE_REVEAL_MS, shouldShowIdleReveal } from '../utils/idleReveal.js';

const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];

/**
 * useIdleReveal — auto-hide wiring for idle-revealed controls (nav arrows).
 *
 * Marks activity on pointer/key/wheel/touch events anywhere inside the
 * target element and keeps the controls visible; after `idleMs` of silence
 * the decision module (idleReveal.shouldShowIdleReveal) says to hide them.
 * `focusin` is listened to separately from the passive pointer set because
 * keyboard users focusing a hidden (opacity-0) arrow button must reveal it
 * even though pointer-events is disabled on the hidden state.
 *
 * The state starts visible and only hides after measured idle — a JS failure
 * in the hook degrades to today's always-visible arrows, never to missing
 * controls (same failsafe philosophy as the carousel-ready gate).
 *
 * @param {{ current: Element | null }} targetRef element whose hover/activity owns the reveal
 * @param {{ idleMs?: number }} [options]
 * @returns {boolean} whether the controls should be visible
 */
export default function useIdleReveal(targetRef, { idleMs = DEFAULT_IDLE_REVEAL_MS } = {}) {
  const [visible, setVisible] = useState(true);
  // Refs start at 0 — Date.now() is impure and may not run during render
  // (react-hooks/purity); the effect stamps the mount time before arming.
  const lastActivityRef = useRef(0);
  const timerRef = useRef(null);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setVisible(true);
  }, []);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;

    const armTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // A focused control inside the target must never hide under the
        // pointer-idle policy: keyboard users would lose the visible focus
        // indicator to opacity-0. Reveal for as long as focus stays inside.
        if (el.ownerDocument?.activeElement && el.contains(el.ownerDocument.activeElement)) {
          setVisible(true);
          armTimer();
          return;
        }
        setVisible(
          shouldShowIdleReveal({
            lastActivityAt: lastActivityRef.current,
            now: Date.now(),
            idleMs,
          }),
        );
      }, idleMs);
    };

    const onActivity = () => {
      markActivity();
      armTimer();
    };

    ACTIVITY_EVENTS.forEach((evt) => el.addEventListener(evt, onActivity, { passive: true }));
    // Focus reaches hidden (opacity-0) buttons via keyboard tabbing even when
    // pointer-events is disabled — reveal on it so focus is always visible.
    el.addEventListener('focusin', onActivity);
    lastActivityRef.current = Date.now();
    armTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => el.removeEventListener(evt, onActivity));
      el.removeEventListener('focusin', onActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [targetRef, idleMs, markActivity]);

  return visible;
}
