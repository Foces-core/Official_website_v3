import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useAutoplayOnScreen, autoplayGate } from '../../src/hooks/useAutoplayOnScreen.js';
import { createHarness } from './harness.jsx';

// The autoplay-on-screen gating policy used to be two near-identical
// IntersectionObserver effects (Featuring.jsx and TeamCarousel.jsx) — the
// "two implementations of one behavior" seam signal. This seam owns the
// decision (autoplayGate) and the observer wiring; the carousels keep only
// their swiper setup.

let ioCallback;
let observedEl;

beforeEach(() => {
  ioCallback = null;
  observedEl = null;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb) {
        ioCallback = cb;
      }
      observe(el) {
        observedEl = el;
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('autoplayGate — the pure decision', () => {
  it('starts when visible and not disabled', () => {
    expect(autoplayGate(true, false)).toBe('start');
  });

  it('stops when visible but disabled', () => {
    expect(autoplayGate(true, true)).toBe('stop');
  });

  it('stops when off screen regardless of the disable flag', () => {
    expect(autoplayGate(false, false)).toBe('stop');
    expect(autoplayGate(false, true)).toBe('stop');
  });
});

describe('useAutoplayOnScreen — observer wiring', () => {
  let harness;

  function Probe({ disable = false }) {
    const elementRef = useRef(null);
    const swiperRef = useRef({
      autoplay: { start: vi.fn(), stop: vi.fn() },
    });
    useAutoplayOnScreen({ elementRef, swiperRef, disable });
    return <div ref={elementRef} data-testid="probe" />;
  }

  Probe.propTypes = {
    disable: PropTypes.bool,
  };

  const fireIntersection = (isIntersecting) =>
    act(() => {
      ioCallback([{ isIntersecting }]);
    });

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
  });

  it('starts autoplay when the carousel scrolls into view', () => {
    const refs = {};
    function SpyingProbe() {
      const elementRef = useRef(null);
      const swiperRef = useRef({ autoplay: { start: vi.fn(), stop: vi.fn() } });
      refs.swiper = swiperRef.current;
      useAutoplayOnScreen({ elementRef, swiperRef, disable: false });
      return <div ref={elementRef} />;
    }
    harness.render(<SpyingProbe />);
    expect(observedEl).not.toBeNull();

    fireIntersection(true);
    expect(refs.swiper.autoplay.start).toHaveBeenCalledTimes(1);
    expect(refs.swiper.autoplay.stop).not.toHaveBeenCalled();
  });

  it('stops autoplay when the carousel leaves the viewport', () => {
    const refs = {};
    function SpyingProbe() {
      const elementRef = useRef(null);
      const swiperRef = useRef({ autoplay: { start: vi.fn(), stop: vi.fn() } });
      refs.swiper = swiperRef.current;
      useAutoplayOnScreen({ elementRef, swiperRef, disable: false });
      return <div ref={elementRef} />;
    }
    harness.render(<SpyingProbe />);

    fireIntersection(true);
    fireIntersection(false);
    expect(refs.swiper.autoplay.stop).toHaveBeenCalledTimes(1);
  });

  it('never starts when autoplay is disabled (reduced motion)', () => {
    const refs = {};
    function SpyingProbe() {
      const elementRef = useRef(null);
      const swiperRef = useRef({ autoplay: { start: vi.fn(), stop: vi.fn() } });
      refs.swiper = swiperRef.current;
      useAutoplayOnScreen({ elementRef, swiperRef, disable: true });
      return <div ref={elementRef} />;
    }
    harness.render(<SpyingProbe />);

    fireIntersection(true);
    expect(refs.swiper.autoplay.start).not.toHaveBeenCalled();
    expect(refs.swiper.autoplay.stop).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    expect(() => harness.render(<Probe />)).not.toThrow();
  });
});
