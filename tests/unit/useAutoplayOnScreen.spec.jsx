import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, useRef } from 'react';
import PropTypes from 'prop-types';
import useCarousel from '../../src/hooks/useCarousel.js';
import { createHarness } from './harness.jsx';

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

const fireIntersection = (isIntersecting) =>
  act(() => {
    ioCallback([{ isIntersecting }]);
  });

describe('autoplay visibility gating — internal to useCarousel', () => {
  let harness;

  function CarouselProbe({ autoplayDelay = 3500 }) {
    const elRef = useRef(null);
    const wrapperRef = useRef(null);
    const { trackRef } = useCarousel({ elRef, wrapperRef, total: 4, mode: 'flat', autoplayDelay });
    return (
      <div ref={wrapperRef}>
        <div ref={elRef}>
          <div ref={trackRef} className="swiper-wrapper">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="swiper-slide">
                slide {i % 4}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  CarouselProbe.propTypes = { autoplayDelay: PropTypes.number };

  const inst = (h) => h.container.querySelector('[data-carousel-mode]').__carouselEngine__;

  beforeEach(() => {
    harness = createHarness();
  });
  afterEach(() => {
    vi.useRealTimers();
    harness.unmount();
  });

  it('observes wrapperRef when autoplayDelay > 0', () => {
    harness.render(<CarouselProbe autoplayDelay={3500} />);
    expect(observedEl).not.toBeNull();
  });

  it('does NOT observe when autoplayDelay is 0', () => {
    harness.render(<CarouselProbe autoplayDelay={0} />);
    expect(observedEl).toBeNull();
  });

  it('starts autoplay when carousel scrolls into view', () => {
    vi.useFakeTimers();
    harness.render(<CarouselProbe autoplayDelay={100} />);
    fireIntersection(true);
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(5);
  });

  it('stops autoplay when carousel leaves viewport', () => {
    vi.useFakeTimers();
    harness.render(<CarouselProbe autoplayDelay={100} />);
    fireIntersection(true);
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(5);
    fireIntersection(false);
    vi.advanceTimersByTime(300);
    expect(inst(harness).activeIndex).toBe(5);
  });

  it('is a no-op when IntersectionObserver unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    expect(() => harness.render(<CarouselProbe />)).not.toThrow();
  });
});
