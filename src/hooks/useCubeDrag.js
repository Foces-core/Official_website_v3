import { useRef, useCallback, useEffect } from 'react';
import {
  CUBE_PHYSICS,
  snapAngle,
  windStepVelocity,
  isWindStopped,
  resolveWindDown,
  splitSpins,
  emaVelocity,
} from '../utils/cubePhysics.js';
import {
  SNAP_GRACE_MS,
  WIND_DOWN_OVERRIDE_MS,
  ARROW_SPIN_GRACE_MS,
  DRAG_OVERRIDE_MS,
} from '../utils/cubeTiming.js';
import { createSpinTracker } from '../Components/AboutUs/easterEggLogic.js';
import {
  registerWidget,
  markInteracted,
  getArrowOwner,
  isControlFocused,
  rectIsOnScreen,
} from '../utils/keyboardLock.js';
import {
  shouldStartWindDown,
  computeDragDelta,
  isIdleForAutoSpin,
} from '../utils/cubeDragHelpers.js';

/**
 * useCubeDrag — the About cube's motion orchestration: drag (touch + mouse),
 * wind-down inertia, settle-to-face snapping, rapid-spin easter-egg tracking,
 * the idle auto-spin, and arrow-key navigation. Everything DOM/input; the
 * DECISIONS (physics, timing, spin bars, celebration policies) stay in their
 * pure modules (cubePhysics.js, cubeTiming.js, easterEggLogic.js,
 * easterEggCelebration.js).
 *
 * Refactored (CRAP < 8): drag delta, wind-down gate, and idle policy are
 * delegated to pure helpers in `cubeDragHelpers.js` so each callback stays at
 * CC < 5 and is mutation-testable. Hook keeps the same external API.
 *
 * @param {{ idleSpin: boolean, spinConfig: { target: number, gap: number },
 *           onEggFire: () => void,
 *           wrapRef: React.RefObject<HTMLElement> }} props
 * @returns {{ boxRef: React.RefObject<HTMLElement>,
 *             handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel,
 *                         onMouseDown } }}
 */
export function useCubeDrag({ idleSpin, spinConfig, onEggFire, wrapRef }) {
  const boxRef = useRef(null);
  const rotXRef = useRef(0);
  const rotYRef = useRef(0);

  // Drag state
  const startX = useRef(0);
  const startRotY = useRef(0);
  const lastMove = useRef({ t: 0, y: 0 });
  const velY = useRef(0);
  const isDraggingRef = useRef(false);

  // Wind-down / auto-rotation
  const windingRef = useRef(false);
  const windRaf = useRef(null);
  const manualUntilRef = useRef(0);

  // Easter-egg tracking
  const spinTrackerRef = useRef(createSpinTracker(spinConfig));
  const accumAngleRef = useRef(0);

  const onEggFireRef = useRef(onEggFire);
  useEffect(() => {
    onEggFireRef.current = onEggFire;
  }, [onEggFire]);

  const applyTransform = useCallback(() => {
    if (!boxRef.current) return;
    boxRef.current.style.transform = `rotateX(${rotXRef.current}deg) rotateY(${rotYRef.current}deg)`;
  }, []);

  const snapToFace = useCallback(() => {
    windingRef.current = false;
    if (windRaf.current != null) {
      cancelAnimationFrame(windRaf.current);
      windRaf.current = null;
    }
    const el = boxRef.current;
    if (!el) return;
    const tx = snapAngle(rotXRef.current);
    const ty = snapAngle(rotYRef.current);
    el.style.transition = `transform ${CUBE_PHYSICS.snapMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    rotXRef.current = tx;
    rotYRef.current = ty;
    applyTransform();
    setTimeout(() => {
      if (boxRef.current) boxRef.current.style.transition = 'none';
    }, CUBE_PHYSICS.snapMs);
    manualUntilRef.current = Date.now() + SNAP_GRACE_MS;
  }, [applyTransform]);

  const startWindDown = useCallback(
    (friction = CUBE_PHYSICS.normalWindFriction) => {
      windingRef.current = true;
      manualUntilRef.current = Date.now() + WIND_DOWN_OVERRIDE_MS;
      if (windRaf.current != null) cancelAnimationFrame(windRaf.current);
      const step = () => {
        rotYRef.current += velY.current;
        velY.current = windStepVelocity(velY.current, friction);
        if (isWindStopped(velY.current)) {
          snapToFace();
          return;
        }
        applyTransform();
        windRaf.current = requestAnimationFrame(step);
      };
      windRaf.current = requestAnimationFrame(step);
    },
    [applyTransform, snapToFace],
  );

  const stopWindDown = useCallback(() => {
    windingRef.current = false;
    if (windRaf.current != null) {
      cancelAnimationFrame(windRaf.current);
      windRaf.current = null;
    }
  }, []);

  const registerSpin = useCallback(() => {
    if (spinTrackerRef.current.register()) onEggFireRef.current?.();
  }, []);

  const accumulateAngle = useCallback(
    (deg) => {
      accumAngleRef.current += deg;
      const { spins, remainder } = splitSpins(accumAngleRef.current, 90);
      accumAngleRef.current = remainder;
      for (let i = 0; i < spins; i += 1) registerSpin();
    },
    [registerSpin],
  );

  const beginDrag = useCallback((clientX) => {
    isDraggingRef.current = true;
    windingRef.current = false;
    if (windRaf.current != null) {
      cancelAnimationFrame(windRaf.current);
      windRaf.current = null;
    }
    startX.current = clientX;
    startRotY.current = rotYRef.current;
    lastMove.current = { t: Date.now(), y: rotYRef.current };
    velY.current = 0;
    manualUntilRef.current = Date.now() + DRAG_OVERRIDE_MS;
    if (boxRef.current) boxRef.current.style.transition = 'none';
  }, []);

  const moveDrag = useCallback(
    (clientX) => {
      if (!isDraggingRef.current) return;
      const now = Date.now();
      const delta = computeDragDelta(clientX, startX.current, CUBE_PHYSICS.dragSensitivity);
      const ny = startRotY.current + delta;
      const dt = Math.max(now - lastMove.current.t, 1);
      velY.current = emaVelocity(velY.current, ny - lastMove.current.y, dt);
      accumulateAngle(Math.abs(ny - lastMove.current.y));
      lastMove.current = { t: now, y: ny };
      rotYRef.current = ny;
      applyTransform();
    },
    [accumulateAngle, applyTransform],
  );

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (!shouldStartWindDown(velY.current)) {
      snapToFace();
      return;
    }
    const resolved = resolveWindDown(velY.current);
    velY.current = resolved.velocity;
    startWindDown(resolved.friction);
  }, [snapToFace, startWindDown]);

  // Touch handlers — thin wrappers (CC 1-2), pure delta lives in helper.
  const handleTouchStart = (e) => {
    beginDrag(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    moveDrag(e.touches[0].clientX);
  };
  const handleTouchEnd = () => endDrag();

  const mouseHandlersRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    beginDrag(e.clientX);
    const move = (ev) => moveDrag(ev.clientX);
    const up = () => {
      endDrag();
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    mouseHandlersRef.current = { move, up };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // Idle auto-spin: rotates slowly on its own while visible and idle — unless
  // the experience tier strips it (idleSpin capability), or a manual action
  // owns the cube. Delegates the idle check to `isIdleForAutoSpin`.
  useEffect(() => {
    if (!idleSpin) return;

    let animFrame = null;
    let visible = true;
    let observer = null;

    const canSpin = () =>
      isIdleForAutoSpin({
        isDragging: isDraggingRef.current,
        winding: windingRef.current,
        manualUntil: manualUntilRef.current,
        visible,
      });

    const tick = () => {
      if (canSpin()) {
        const el = boxRef.current;
        if (el) {
          rotYRef.current = (rotYRef.current - 0.5 + 360) % 360;
          el.style.transition = 'none';
          el.style.transform = `rotateX(0deg) rotateY(${rotYRef.current}deg)`;
        }
      }
      if (visible) {
        animFrame = requestAnimationFrame(tick);
      } else {
        animFrame = null;
      }
    };

    if (typeof IntersectionObserver === 'function' && boxRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible && animFrame == null) animFrame = requestAnimationFrame(tick);
        },
        { rootMargin: '100px' },
      );
      observer.observe(boxRef.current);
    } else {
      visible = true;
    }

    if (visible && animFrame == null) animFrame = requestAnimationFrame(tick);

    return () => {
      if (animFrame != null) cancelAnimationFrame(animFrame);
      if (observer) observer.disconnect();
      stopWindDown();
    };
  }, [idleSpin, stopWindDown]);

  // Keyboard: left/right arrows only. Early returns collapsed to CC 4.
  useEffect(() => {
    const onKey = (e) => {
      const isArrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
      if (!isArrow) return;
      const blocked = isControlFocused() || getArrowOwner() !== 'cube';
      if (blocked) return;
      const el = boxRef.current;
      if (!el) return;

      e.preventDefault();
      stopWindDown();
      el.style.transition = 'transform 0.4s ease-out';
      rotYRef.current += e.key === 'ArrowRight' ? -90 : 90;
      applyTransform();
      manualUntilRef.current = Date.now() + ARROW_SPIN_GRACE_MS;
      markInteracted('cube');
      registerSpin();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [applyTransform, registerSpin, stopWindDown]);

  useEffect(() => {
    const unregister = registerWidget('cube', () => rectIsOnScreen(boxRef.current, 40));
    const wrap = wrapRef?.current;
    const mark = () => markInteracted('cube');
    wrap?.addEventListener('pointerdown', mark, true);
    return () => {
      unregister();
      wrap?.removeEventListener('pointerdown', mark, true);
    };
  }, [wrapRef]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const preventScroll = (e) => {
      if (isDraggingRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => el.removeEventListener('touchmove', preventScroll);
  }, []);

  useEffect(
    () => () => {
      if (mouseHandlersRef.current) {
        window.removeEventListener('mousemove', mouseHandlersRef.current.move);
        window.removeEventListener('mouseup', mouseHandlersRef.current.up);
      }
      if (windRaf.current != null) cancelAnimationFrame(windRaf.current);
    },
    [],
  );

  return {
    boxRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onMouseDown: handleMouseDown,
    },
  };
}
