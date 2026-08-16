import { useRef, useCallback, useEffect } from 'react';
import {
  CUBE_PHYSICS,
  snapAngle,
  windStepVelocity,
  isWindStopped,
  resolveWindDown,
  splitSpins,
} from '../Components/AboutUs/cubePhysics.js';
import {
  SNAP_GRACE_MS,
  WIND_DOWN_OVERRIDE_MS,
  ARROW_SPIN_GRACE_MS,
  DRAG_OVERRIDE_MS,
  isManualOverrideActive,
} from '../Components/AboutUs/cubeTiming.js';
import { emaVelocity } from '../Components/AboutUs/easterEggCelebration.js';
import { createSpinTracker } from '../Components/AboutUs/easterEggLogic.js';
import {
  registerWidget,
  markInteracted,
  getArrowOwner,
  isControlFocused,
  rectIsOnScreen,
} from '../utils/keyboardLock.js';

/**
 * useCubeDrag — the About cube's motion orchestration: drag (touch + mouse),
 * wind-down inertia, settle-to-face snapping, rapid-spin easter-egg tracking,
 * the idle auto-spin, and arrow-key navigation. Everything DOM/input; the
 * DECISIONS (physics, timing, spin bars, celebration policies) stay in their
 * pure modules (cubePhysics.js, cubeTiming.js, easterEggLogic.js,
 * easterEggCelebration.js).
 *
 * The celebration DOM (wobble, toasts, confetti burst) stays in AboutUs.jsx —
 * this hook only fires `onEggFire` when the rapid-spin bar is crossed.
 *
 * @param {{ idleSpin: boolean, spinConfig: { target: number, gap: number },
 *           onEggFire: () => void }} props
 * @returns {{ boxRef: React.RefObject<HTMLElement>,
 *             handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel,
 *                         onMouseDown } }} — spread handlers onto the cube
 */
export function useCubeDrag({ idleSpin, spinConfig, onEggFire }) {
  const boxRef = useRef(null);
  const rotXRef = useRef(0);
  const rotYRef = useRef(0);

  // Drag state
  const startX = useRef(0);
  const startRotY = useRef(0);
  const lastMove = useRef({ t: 0, y: 0 });
  const velY = useRef(0); // deg/ms while dragging, deg/frame during wind-down
  const isDraggingRef = useRef(false);

  // Wind-down / auto-rotation
  const windingRef = useRef(false);
  const windRaf = useRef(null);
  const manualUntilRef = useRef(0);

  // Easter-egg tracking (sequence logic in easterEggLogic.js)
  const spinTrackerRef = useRef(createSpinTracker(spinConfig));
  const accumAngleRef = useRef(0);

  // onEggFire flows through a ref so registerSpin stays stable (the callback
  // identity changes when the celebration's deps change, but the tracker
  // wiring must not re-create).
  const onEggFireRef = useRef(onEggFire);
  useEffect(() => {
    onEggFireRef.current = onEggFire;
  }, [onEggFire]);

  const applyTransform = useCallback(() => {
    if (!boxRef.current) return;
    boxRef.current.style.transform = `rotateX(${rotXRef.current}deg) rotateY(${rotYRef.current}deg)`;
  }, []);

  // Settle the cube onto the nearest 90° face with a smooth, slow transition.
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

  // Release "inertia": keep rotating with the release velocity, decaying, until
  // it's slow enough to settle onto a face. Rapid spins decay slower for a longer glide.
  const startWindDown = useCallback(
    (friction = CUBE_PHYSICS.normalWindFriction) => {
      windingRef.current = true;
      manualUntilRef.current = Date.now() + WIND_DOWN_OVERRIDE_MS;
      if (windRaf.current != null) cancelAnimationFrame(windRaf.current);
      const step = () => {
        // Y-axis only — spin decays on the horizontal plane. Inertia spins do
        // NOT count toward the easter egg; only deliberate drags/keys do.
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

  // Register one manual spin; fires the easter egg after the rapid-spin bar.
  const registerSpin = useCallback(() => {
    if (spinTrackerRef.current.register()) onEggFireRef.current?.();
  }, []);

  // Accumulate horizontal (Y-axis) angular travel; every full 90° = one spin.
  // The split (spins vs remainder) is pure math in cubePhysics.js.
  const accumulateAngle = useCallback(
    (deg) => {
      accumAngleRef.current += deg;
      const { spins, remainder } = splitSpins(accumAngleRef.current, 90);
      accumAngleRef.current = remainder;
      for (let i = 0; i < spins; i += 1) registerSpin();
    },
    [registerSpin],
  );

  // ---- Shared drag helpers (touch + mouse) ----
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
      // Horizontal movement only — vertical drags are ignored (left/right
      // spin). Dragging right turns the cube right, matching ArrowRight.
      const ny = startRotY.current + (clientX - startX.current) * CUBE_PHYSICS.dragSensitivity;
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

    // Resolve the release velocity into wind-down parameters (deg/ms ->
    // deg/frame, cap, rapid-vs-normal friction) — see cubePhysics.js.
    const resolved = resolveWindDown(velY.current);
    if (resolved) {
      velY.current = resolved.velocity;
      startWindDown(resolved.friction);
    } else {
      snapToFace();
    }
  }, [snapToFace, startWindDown]);

  // Touch handlers
  const handleTouchStart = (e) => {
    beginDrag(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    moveDrag(e.touches[0].clientX);
  };
  const handleTouchEnd = () => endDrag();

  // Mouse handlers. Move/up live on `window` so a fast drag keeps going past
  // the small cube bounds — otherwise the gesture dies at the box edge.
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
  // owns the cube.
  useEffect(() => {
    if (!idleSpin) return;

    let animFrame = null;
    let visible = true;
    let observer = null;

    const animate = () => {
      if (
        visible &&
        !isDraggingRef.current &&
        !windingRef.current &&
        !isManualOverrideActive(manualUntilRef.current, Date.now())
      ) {
        const el = boxRef.current;
        if (el) {
          // Left/right spin only — no X-axis wobble. Turns the same way
          // ArrowRight does (rightward) for consistency.
          rotYRef.current = (rotYRef.current - 0.5 + 360) % 360;
          el.style.transition = 'none';
          el.style.transform = `rotateX(0deg) rotateY(${rotYRef.current}deg)`;
        }
      }
      if (visible) {
        animFrame = requestAnimationFrame(animate);
      } else {
        animFrame = null;
      }
    };

    if (typeof IntersectionObserver === 'function' && boxRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible && animFrame == null) animFrame = requestAnimationFrame(animate);
        },
        { rootMargin: '100px' },
      );
      observer.observe(boxRef.current);
    } else {
      visible = true;
    }

    if (visible && animFrame == null) animFrame = requestAnimationFrame(animate);

    return () => {
      if (animFrame != null) cancelAnimationFrame(animFrame);
      if (observer) observer.disconnect();
      stopWindDown();
    };
  }, [idleSpin, stopWindDown]);

  // Keyboard navigation — left/right arrows only (no vertical spin).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // Yield when a control has focus, or another on-screen widget owns the
      // arrows (last-interacted wins — see utils/keyboardLock.js).
      if (isControlFocused()) return;
      if (getArrowOwner() !== 'cube') return;
      const el = boxRef.current;
      if (!el) return;

      e.preventDefault();
      stopWindDown();
      el.style.transition = 'transform 0.4s ease-out';
      // ArrowRight turns the cube to the right (negative Y rotation).
      rotYRef.current += e.key === 'ArrowRight' ? -90 : 90;
      applyTransform();
      manualUntilRef.current = Date.now() + ARROW_SPIN_GRACE_MS;
      markInteracted('cube'); // arrow use keeps the cube's arrow ownership
      registerSpin();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [applyTransform, registerSpin, stopWindDown]);

  // Arrow-key arbitration (see utils/keyboardLock.js): register the cube as a
  // widget ("on screen" = the cube box is in the viewport) and mark it as the
  // last-interacted widget whenever the user presses/grabs it, so it claims
  // the arrow keys over any on-screen carousel.
  useEffect(() => {
    const unregister = registerWidget('cube', () => rectIsOnScreen(boxRef.current, 40));
    const wrap = document.getElementById('mainDiv-about');
    const mark = () => markInteracted('cube');
    wrap?.addEventListener('pointerdown', mark, true);
    return () => {
      unregister();
      wrap?.removeEventListener('pointerdown', mark, true);
    };
  }, []);

  // Own the touch gesture: once a drag starts on the cube, native scrolling
  // is suppressed for the rest of the gesture — rotating must never scroll
  // the page. This is belt-and-suspenders for old iOS that ignores
  // `touch-action` (see AboutUs.css); on modern browsers the CSS alone opts
  // the cube out of panning. Must be a NON-passive listener — React's
  // delegated touchmove is passive, so e.preventDefault() there would no-op.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const preventScroll = (e) => {
      if (isDraggingRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => el.removeEventListener('touchmove', preventScroll);
  }, []);

  // Drop the window-level mouse listeners if the gesture dies with unmount.
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
