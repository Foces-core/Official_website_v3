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
 * Hand-rolled carousel engine — replaces Swiper for the two carousels on the
 * site (Featuring's flat slider and Execom's 3D cube). The instance IS the
 * engine — no compat seam. Consumers call the real interface:
 * `slideTo/slidePrev/slideNext`, `enableKeyboard/disableKeyboard`,
 * `startAutoplay/stopAutoplay`. Slide states live on data attributes
 * (`data-slide-active`, `data-slide-next`, `data-slide-prev`). The root
 * carries `__carouselEngine__`.
 *
 * Autoplay owns its own visibility gating (IntersectionObserver on wrapperRef),
 * drag-pause/resume is internal, and the seamless 3-copy wrap (carouselWrap).
 *
 * Geometry (pure math in carouselGeometry.js):
 *   flat — track translate3d(-activeIndex * step); slides flex-sized
 *   cube — each face `rotateY(i * 90deg) translateZ(radius)`; track rotates
 *          `-activeIndex * 90deg` around the face-center origin
 *
 * @param {object} opts
 * @param {React.RefObject<HTMLElement>} opts.elRef — the carousel root
 * @param {React.RefObject<HTMLElement>} [opts.wrapperRef] — outer wrapper for
 *   autoplay visibility gating (IntersectionObserver, threshold 0.1)
 * @param {number} opts.total — logical slide count (before the 3-copy wrap)
 * @param {'flat' | 'cube'} opts.mode
 * @param {number} [opts.slidesPerView=1] — flat mode visible slides
 * @param {number} [opts.spaceBetween=0] — flat mode gap between slides (px)
 * @param {number} [opts.autoplayDelay=0] — ms between autoplay turns (0 = off)
 * @param {number} [opts.initialIndex] — raw index to start at
 * @param {number} [opts.speed=350] — transition ms for animated moves
 * @param {(normalizedIndex: number) => void} [opts.onActiveChange] — fired
 *   with the normalized (0..total-1) index on every settle
 * @returns {{ instanceRef: React.RefObject<object>, trackRef: React.RefObject<HTMLElement> }}
 */
export default function useCarousel({
  elRef,
  wrapperRef,
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
    dragAutoplayWasOn: false,
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
      const firstCard = t.firstElementChild?.firstElementChild;
      const h = firstCard ? firstCard.offsetHeight : 0;
      if (h) t.style.height = `${h}px`;
      applyFaceTransforms();
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
      slide.toggleAttribute('data-slide-active', i === raw);
      slide.toggleAttribute('data-slide-next', i === raw + 1);
      slide.toggleAttribute('data-slide-prev', i === raw - 1);
    });
  }

  function applyFaceTransforms() {
    const t = track();
    if (!t || p().mode !== 'cube') return;
    Array.from(t.children).forEach((slide, i) => {
      slide.style.transform = cubeFaceTransform(i, s.faceWidth / 2);
    });
  }

  function applyTransforms() {
    const t = track();
    if (!t) return;
    const { mode: m } = p();
    if (m === 'cube') {
      t.style.transform = cubeTrackTransform(
        s.raw,
        s.dragging ? cubeDragAngle(s.dragOffset, s.faceWidth) : 0,
      );
    } else {
      t.style.transform = flatTrackTransform(s.raw, s.step, s.dragging ? s.dragOffset : 0);
    }
    syncActiveClasses();
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

  // --- keyboard ------------------------------------------------------------

  const keydownHandler = useRef(null);

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
    keydownHandler.current = onKeyDown;
    window.addEventListener('keydown', keydownHandler.current);
  }

  function disableKeyboard() {
    if (!s.keyboardOn) return;
    s.keyboardOn = false;
    if (keydownHandler.current) {
      window.removeEventListener('keydown', keydownHandler.current);
      keydownHandler.current = null;
    }
  }

  // --- drag ----------------------------------------------------------------

  function onPointerDown(e) {
    if (s.dragging) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    s.dragging = true;
    s.dragAutoplayWasOn = !!s.autoplayTimer;
    if (s.autoplayTimer) stopAutoplay();
    s.pointerId = e.pointerId;
    s.dragStartX = e.clientX;
    s.dragOffset = 0;
    s.lastMoveX = e.clientX;
    s.lastMoveT = performance.now();
    s.velocity = 0;
    try {
      track()?.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e) {
    if (!s.dragging || e.pointerId !== s.pointerId) return;
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

  function onPointerUp(e) {
    if (!s.dragging || e.pointerId !== s.pointerId) return;
    s.dragging = false;
    const pid = s.pointerId;
    try {
      track()?.releasePointerCapture?.(pid);
    } catch {
      /* ignore */
    }
    s.pointerId = null;
    const { mode: m } = p();
    const step = m === 'cube' ? s.faceWidth : s.step;
    const snap = dragSnap(s.dragOffset, step, s.velocity);
    s.dragOffset = 0;
    s.velocity = 0;
    goTo(s.raw + snap, true);
    if (s.dragAutoplayWasOn) {
      s.dragAutoplayWasOn = false;
      startAutoplay();
    }
  }

  function onTransitionEnd(e) {
    if (e.target !== track()) return;
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

  // The engine instance — created once, delegates through handlersRef.
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
      enableKeyboard: () => handlersRef.current.enableKeyboard(),
      disableKeyboard: () => handlersRef.current.disableKeyboard(),
      startAutoplay: () => handlersRef.current.startAutoplay(),
      stopAutoplay: () => handlersRef.current.stopAutoplay(),
    };
  }

  function styleTrack() {
    const t = track();
    const r = root();
    if (!t || !r) return;
    const { mode: m, slidesPerView: spv, spaceBetween: gap } = p();
    r.setAttribute('data-carousel-mode', m);
    r.__carouselEngine__ = instanceRef.current;
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
      applyFaceTransforms();
    } else {
      t.style.display = 'flex';
      t.style.alignItems = 'center';
      t.style.columnGap = `${gap}px`;
      t.style.transformStyle = '';
      t.style.height = '';
      r.style.perspective = '';
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

  // Mount
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
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        handlersRef.current.measure();
        handlersRef.current.applyTransforms();
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      stopAutoplay();
      disableKeyboard();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      t.removeEventListener('pointerdown', handlersRef.current.onPointerDown);
      t.removeEventListener('pointermove', handlersRef.current.onPointerMove);
      t.removeEventListener('pointerup', handlersRef.current.onPointerUp);
      t.removeEventListener('pointercancel', handlersRef.current.onPointerUp);
      t.removeEventListener('transitionend', handlersRef.current.onTransitionEnd);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-style when layout-affecting props change
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    handlersRef.current.styleTrack();
    handlersRef.current.measure();
    handlersRef.current.applyTransforms();
  }, [slidesPerView, spaceBetween, mode, total]);

  // Autoplay visibility gating: observe wrapperRef and start/stop autoplay
  // as the carousel enters/leaves the viewport. Only active when
  // autoplayDelay > 0. Replaces the external useAutoplayOnScreen hook.
  useEffect(() => {
    if (!p().autoplayDelay) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const el = wrapperRef?.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handlersRef.current.startAutoplay();
        } else {
          handlersRef.current.stopAutoplay();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [wrapperRef]);

  return { instanceRef, trackRef };
}
