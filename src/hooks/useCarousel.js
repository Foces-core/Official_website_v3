import { useRef, useLayoutEffect, useEffect } from 'react';
import {
  flatTrackTransform,
  cubeTrackTransform,
  cubeFaceTransform,
  cubeDragAngle,
  dragSnap,
  slideStep,
} from '../utils/carouselGeometry.js';
import { normalizeIndex, wrapTarget } from '../utils/carouselWrap.js';

/**
 * Hand-rolled carousel — replaces Swiper (react) for the two carousels on the
 * site (Featuring's flat slider and Execom's 3D cube), keeping the behaviors
 * the site relied on: the cube rotates 90° per face (matching EffectCube with
 * shadows off), swipe/touch drag with `touch-action: none` + preventDefault
 * gesture ownership, arrow-key arbitration through keyboardLock.js, autoplay
 * gated by useAutoplayOnScreen, and the seamless 3-copy wrap (carouselWrap).
 *
 * The instance is swiper-shaped on purpose — the seams that consumed Swiper
 * (syncCarouselKeyboard, useAutoplayOnScreen, rectIsOnScreen, the E2E suite)
 * keep working unchanged: it exposes `el`, `slides`, `activeIndex`,
 * `slideTo/slidePrev/slideNext`, `keyboard.enable/disable` and
 * `autoplay.start/stop/resume`. The DOM keeps the `.swiper-slide` /
 * `.swiper-wrapper` class names (they are the stable hooks the E2E suite and
 * CSS use) — only the engine is gone.
 *
 * Geometry (pure math in carouselGeometry.js):
 *   flat — track translate3d(-activeIndex * step); slides flex-sized
 *   cube — each face `rotateY(i * 90deg) translateZ(radius)`; track rotates
 *          `-activeIndex * 90deg` around the face-center origin
 *
 * @param {object} opts
 * @param {React.RefObject<HTMLElement>} opts.elRef — the carousel root (the
 *   element carrying .feat-swiper / .execom-swiper / .execom-cube-swiper)
 * @param {number} opts.total — logical slide count (before the 3-copy wrap)
 * @param {'flat' | 'cube'} opts.mode
 * @param {number} [opts.slidesPerView=1] — flat mode visible slides
 * @param {number} [opts.spaceBetween=0] — flat mode gap between slides (px)
 * @param {number} [opts.autoplayDelay=0] — ms between autoplay turns (0 = off)
 * @param {number} [opts.initialIndex] — raw index to start at (default: the
 *   middle copy, `total`, so the wrap never trips on mount)
 * @param {number} [opts.speed=350] — transition ms for animated moves
 * @param {(normalizedIndex: number) => void} [opts.onActiveChange] — fired
 *   with the normalized (0..total-1) index on every settle
 * @returns {{ instanceRef: React.RefObject<object>, trackRef: React.RefObject<HTMLElement> }}
 */
export default function useCarousel({
  elRef,
  total,
  mode,
  slidesPerView = 1,
  spaceBetween = 0,
  autoplayDelay = 0,
  initialIndex,
  speed = 350,
  onActiveChange,
}) {
  const trackRef = useRef(null);
  const instanceRef = useRef(null);

  // The instance + handlers are created once and read the latest props/DOM
  // through refs — no stale closures, no re-created listeners.
  const propsRef = useRef({ total, mode, slidesPerView, spaceBetween, autoplayDelay, speed });
  propsRef.current = { total, mode, slidesPerView, spaceBetween, autoplayDelay, speed };
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const s = useRef({
    raw: initialIndex ?? total,
    dragging: false,
    pointerId: null,
    dragStartX: 0,
    dragOffset: 0,
    lastMoveX: 0,
    lastMoveT: 0,
    velocity: 0,
    autoplayTimer: null,
    keyboardOn: false,
    faceWidth: 0,
    slideWidth: 0,
    step: 0,
  }).current;

  const track = () => trackRef.current;
  const root = () => elRef.current;
  const p = () => propsRef.current;

  // --- measurement ---------------------------------------------------------

  function measure() {
    const t = track();
    if (!t) return;
    const { mode: m, spaceBetween: gap } = p();
    if (m === 'cube') {
      s.faceWidth = t.clientWidth || root()?.clientWidth || 0;
      // Slides are absolutely positioned (no in-flow height), so the track
      // must be sized explicitly — the card inside has a fixed CSS height.
      const firstCard = t.firstElementChild?.firstElementChild;
      const h = firstCard ? firstCard.offsetHeight : 0;
      if (h) t.style.height = `${h}px`;
    } else {
      const first = t.firstElementChild;
      s.slideWidth = first ? first.getBoundingClientRect().width : 0;
      s.step = slideStep(s.slideWidth, gap);
    }
  }

  // --- transforms ----------------------------------------------------------

  function syncActiveClasses() {
    const t = track();
    if (!t) return;
    const children = Array.from(t.children);
    const raw = s.raw;
    children.forEach((slide, i) => {
      slide.classList.toggle('swiper-slide-active', i === raw);
      slide.classList.toggle('swiper-slide-next', i === raw + 1);
      slide.classList.toggle('swiper-slide-prev', i === raw - 1);
    });
  }

  function applyTransforms() {
    const t = track();
    if (!t) return;
    const { mode: m } = p();
    if (m === 'cube') {
      Array.from(t.children).forEach((slide, i) => {
        slide.style.transform = cubeFaceTransform(i, s.faceWidth / 2);
      });
      t.style.transform = cubeTrackTransform(
        s.raw,
        s.dragging ? cubeDragAngle(s.dragOffset, s.faceWidth) : 0,
      );
    } else {
      t.style.transform = flatTrackTransform(s.raw, s.step, s.dragging ? s.dragOffset : 0);
    }
    syncActiveClasses();
    // Failsafe gate (see Execom/custom.css): only once the first transforms
    // and active classes are in place may the cube CSS hide the non-visible
    // faces. Reaching here means the hook is alive — before this point the
    // faces stay visible (stacked) rather than the section going blank on a
    // chunk/JS failure.
    root()?.setAttribute('data-carousel-ready', '');
  }

  // --- navigation ----------------------------------------------------------

  function goTo(rawIndex, animate = true, msSpeed) {
    const t = track();
    if (!t) return;
    const { total: n, speed: defaultSpeed } = p();
    const clamped = Math.max(0, Math.min(rawIndex, n * 3 - 1));
    s.raw = clamped;
    t.style.transition = animate
      ? `transform ${msSpeed ?? defaultSpeed}ms cubic-bezier(0.25, 1, 0.5, 1)`
      : 'none';
    applyTransforms();
    onActiveChangeRef.current?.(normalizeIndex(clamped, n));
  }

  function slideTo(rawIndex, msSpeed) {
    goTo(rawIndex, true, msSpeed);
  }

  function slidePrev() {
    goTo(s.raw - 1, true);
  }

  function slideNext() {
    goTo(s.raw + 1, true);
  }

  // --- autoplay ------------------------------------------------------------

  function startAutoplay() {
    stopAutoplay();
    if (!p().autoplayDelay) return;
    s.autoplayTimer = setInterval(() => goTo(s.raw + 1, true), p().autoplayDelay);
  }

  function stopAutoplay() {
    if (s.autoplayTimer) {
      clearInterval(s.autoplayTimer);
      s.autoplayTimer = null;
    }
  }

  // --- keyboard (arbitrated by keyboardLock.js via enable/disable) ---------

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      slidePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      slideNext();
    }
  }

  function enableKeyboard() {
    if (s.keyboardOn) return;
    s.keyboardOn = true;
    window.addEventListener('keydown', onKeyDown);
  }

  function disableKeyboard() {
    if (!s.keyboardOn) return;
    s.keyboardOn = false;
    window.removeEventListener('keydown', onKeyDown);
  }

  // --- drag (pointer events; touch-action: none owns the gesture) ----------

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    s.dragging = true;
    s.pointerId = e.pointerId;
    s.dragStartX = e.clientX;
    s.dragOffset = 0;
    s.lastMoveX = e.clientX;
    s.lastMoveT = performance.now();
    s.velocity = 0;
    // Guarded: synthetic PointerEvents (E2E probes) have no active pointer,
    // and setPointerCapture would throw NotFoundError for their pointerId.
    try {
      track()?.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore — the drag still tracks via clientX deltas
    }
  }

  function onPointerMove(e) {
    if (!s.dragging) return;
    // Gesture ownership (ADR-0007): the carousel owns the drag, so the page
    // must not scroll from it. preventDefault + touch-action: none (CSS).
    e.preventDefault();
    const dx = e.clientX - s.dragStartX;
    const now = performance.now();
    s.velocity = (e.clientX - s.lastMoveX) / Math.max(1, now - s.lastMoveT);
    s.lastMoveX = e.clientX;
    s.lastMoveT = now;
    s.dragOffset = dx;
    const t = track();
    if (t) t.style.transition = 'none';
    applyTransforms();
  }

  function onPointerUp() {
    if (!s.dragging) return;
    s.dragging = false;
    const { mode: m } = p();
    const step = m === 'cube' ? s.faceWidth : s.step;
    const snap = dragSnap(s.dragOffset, step, s.velocity);
    s.dragOffset = 0;
    s.velocity = 0;
    goTo(s.raw + snap, true);
    // Interaction resets the autoplay timer but doesn't stop it
    // (disableOnInteraction: false — same policy Swiper had).
    if (s.autoplayTimer) {
      stopAutoplay();
      startAutoplay();
    }
    try {
      track()?.releasePointerCapture?.(s.pointerId);
    } catch {
      // ignore
    }
  }

  function onTransitionEnd(e) {
    if (e.target !== track()) return;
    // A settle that crossed a copy boundary: jump 0ms to the equivalent slide
    // in the adjacent copy (same normalized content → invisible).
    const { total: n } = p();
    const target = wrapTarget(s.raw, n);
    if (target != null) {
      s.raw = target;
      const t = track();
      if (t) {
        t.style.transition = 'none';
        applyTransforms();
      }
    }
  }

  // Handlers live in a ref so both the once-mounted listeners and the stable
  // instance methods call the current closure.
  const handlersRef = useRef({});
  handlersRef.current = {
    measure,
    applyTransforms,
    goTo,
    slideTo,
    slidePrev,
    slideNext,
    startAutoplay,
    stopAutoplay,
    enableKeyboard,
    disableKeyboard,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTransitionEnd,
  };

  // The swiper-shaped instance — created once, delegates through handlersRef.
  if (!instanceRef.current) {
    instanceRef.current = {
      get el() {
        return root();
      },
      get slides() {
        return track() ? Array.from(track().children) : [];
      },
      get activeIndex() {
        return s.raw;
      },
      slideTo: (i, ms) => handlersRef.current.slideTo(i, ms),
      slidePrev: () => handlersRef.current.slidePrev(),
      slideNext: () => handlersRef.current.slideNext(),
      keyboard: {
        enable: () => handlersRef.current.enableKeyboard(),
        disable: () => handlersRef.current.disableKeyboard(),
      },
      autoplay: {
        start: () => handlersRef.current.startAutoplay(),
        stop: () => handlersRef.current.stopAutoplay(),
        resume: () => handlersRef.current.startAutoplay(),
      },
    };
  }

  // Style the track/slides for the current mode + slidesPerView. Called on
  // mount and whenever the layout-affecting props change (Featuring's
  // responsive slidesPerView re-sizes the slides; Execom's flat/cube switch
  // re-positions them).
  function styleTrack() {
    const t = track();
    const r = root();
    if (!t || !r) return;
    const { mode: m, slidesPerView: spv, spaceBetween: gap } = p();
    r.setAttribute('data-carousel-mode', m);
    // Debug/probe handle (the carousel-probe reads it the way it read
    // Swiper's __swiper__). Not part of the app contract.
    r.__carousel__ = instanceRef.current;
    if (m === 'cube') {
      r.style.perspective = '1200px';
      t.style.display = '';
      t.style.columnGap = '';
      t.style.transformStyle = 'preserve-3d';
      Array.from(t.children).forEach((slide) => {
        slide.style.position = 'absolute';
        slide.style.inset = '0';
        slide.style.width = '100%';
        slide.style.height = '100%';
        slide.style.backfaceVisibility = 'hidden';
        slide.style.flex = '';
      });
    } else {
      t.style.display = 'flex';
      t.style.alignItems = 'center';
      t.style.columnGap = `${gap}px`;
      t.style.transformStyle = '';
      Array.from(t.children).forEach((slide) => {
        slide.style.position = '';
        slide.style.inset = '';
        slide.style.width = '';
        slide.style.height = '';
        slide.style.backfaceVisibility = '';
        slide.style.flex = `0 0 calc((100% - ${gap * (spv - 1)}px) / ${spv})`;
      });
    }
  }

  handlersRef.current.styleTrack = styleTrack;

  // Mount: style the track/slides for the mode, measure, position at the
  // initial (middle-copy) index, attach listeners. Runs once.
  useLayoutEffect(() => {
    const t = track();
    const r = root();
    if (!t || !r) return;

    styleTrack();
    measure();
    goTo(s.raw, false);
    applyTransforms();

    t.addEventListener('pointerdown', handlersRef.current.onPointerDown);
    t.addEventListener('pointermove', handlersRef.current.onPointerMove, { passive: false });
    t.addEventListener('pointerup', handlersRef.current.onPointerUp);
    t.addEventListener('pointercancel', handlersRef.current.onPointerUp);
    t.addEventListener('transitionend', handlersRef.current.onTransitionEnd);
    const onResize = () => {
      handlersRef.current.measure();
      handlersRef.current.applyTransforms();
    };
    window.addEventListener('resize', onResize);

    return () => {
      stopAutoplay();
      disableKeyboard();
      t.removeEventListener('pointerdown', handlersRef.current.onPointerDown);
      t.removeEventListener('pointermove', handlersRef.current.onPointerMove);
      t.removeEventListener('pointerup', handlersRef.current.onPointerUp);
      t.removeEventListener('pointercancel', handlersRef.current.onPointerUp);
      t.removeEventListener('transitionend', handlersRef.current.onTransitionEnd);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-style when the layout-affecting props change (e.g. Featuring's
  // responsive slidesPerView) without re-attaching listeners. Only refs are
  // touched, so the dep array is exactly the layout-affecting props.
  useEffect(() => {
    handlersRef.current.styleTrack();
    handlersRef.current.measure();
    handlersRef.current.applyTransforms();
  }, [slidesPerView, spaceBetween, mode, total]);

  return { instanceRef, trackRef };
}
