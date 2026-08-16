import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';
import PropTypes from 'prop-types';
import useCarousel from '../../src/hooks/useCarousel.js';
import { createHarness } from './harness.jsx';

// useCarousel drives a real DOM track (transforms, class toggling, pointer
// listeners). jsdom gives us the DOM; the harness mounts the hook. We assert
// the swiper-shaped instance contract the seams rely on — slideTo/slidePrev/
// slideNext, keyboard.enable/disable, autoplay.start/stop — plus the
// .swiper-slide-active class the E2E suite reads, and the 3-copy wrap.
//
// The instance is read from the root's __carousel__ debug handle (the same
// handle the carousel-probe uses) — capturing a ref during render trips the
// react-hooks lint rules.

let harness;

function TrackProbe({ total = 4, mode = 'flat', onActiveChange, autoplayDelay = 0, initialIndex }) {
  const elRef = useRef(null);
  const { trackRef } = useCarousel({
    elRef,
    total,
    mode,
    autoplayDelay,
    initialIndex,
    onActiveChange,
  });
  return (
    <div ref={elRef} className="probe-root">
      <div ref={trackRef} className="swiper-wrapper">
        {Array.from({ length: total * 3 }, (_, i) => (
          <div key={i} className="swiper-slide">
            slide {i % total}
          </div>
        ))}
      </div>
    </div>
  );
}

TrackProbe.propTypes = {
  total: PropTypes.number,
  mode: PropTypes.oneOf(['flat', 'cube']),
  onActiveChange: PropTypes.func,
  autoplayDelay: PropTypes.number,
  initialIndex: PropTypes.number,
};

const slideEls = (root) => [...root.querySelectorAll('.swiper-slide')];
const activeEl = (root) =>
  slideEls(root).find((el) => el.classList.contains('swiper-slide-active'));

const inst = (harness) => harness.container.querySelector('.probe-root').__carousel__;

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  vi.unstubAllGlobals();
  harness.unmount();
});

describe('useCarousel — instance contract', () => {
  it('starts in the middle copy (initialIndex = total) so the wrap never trips on mount', () => {
    harness.render(<TrackProbe total={4} />);
    expect(inst(harness).activeIndex).toBe(4);
    expect(activeEl(harness.container)).toBe(slideEls(harness.container)[4]);
  });

  it('slideNext / slidePrev move by one and report the raw index', () => {
    harness.render(<TrackProbe total={4} />);
    inst(harness).slideNext();
    expect(inst(harness).activeIndex).toBe(5);
    expect(activeEl(harness.container)).toBe(slideEls(harness.container)[5]);
    inst(harness).slidePrev();
    expect(inst(harness).activeIndex).toBe(4);
  });

  it('slideTo jumps to an explicit raw index', () => {
    harness.render(<TrackProbe total={4} />);
    inst(harness).slideTo(7, 0);
    expect(inst(harness).activeIndex).toBe(7);
    expect(activeEl(harness.container)).toBe(slideEls(harness.container)[7]);
  });

  it('fires onActiveChange with the NORMALIZED index on every settle', () => {
    const seen = [];
    harness.render(<TrackProbe total={4} onActiveChange={(i) => seen.push(i)} />);
    expect(seen).toEqual([0]); // mount settle at middle copy → normalized 0

    inst(harness).slideNext();
    inst(harness).slideNext();
    expect(seen).toEqual([0, 1, 2]);
  });

  it('keyboard.enable listens for arrows and advances; disable stops it', () => {
    harness.render(<TrackProbe total={4} />);
    inst(harness).keyboard.enable();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(inst(harness).activeIndex).toBe(5);
    inst(harness).keyboard.disable();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(inst(harness).activeIndex).toBe(5); // unchanged — listener removed
  });

  it('autoplay.start advances on the delay; stop halts it', () => {
    vi.useFakeTimers();
    harness.render(<TrackProbe total={4} autoplayDelay={100} />);
    inst(harness).autoplay.start();
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(5);
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(6);
    inst(harness).autoplay.stop();
    vi.advanceTimersByTime(300);
    expect(inst(harness).activeIndex).toBe(6);
    vi.useRealTimers();
  });
});

describe('useCarousel — cube mode', () => {
  it('sets the 3D scaffolding (perspective, preserve-3d, absolute faces)', () => {
    harness.render(<TrackProbe total={4} mode="cube" />);
    const root = harness.container.querySelector('.probe-root');
    expect(root.style.perspective).toBe('1200px');
    const track = root.querySelector('.swiper-wrapper');
    expect(track.style.transformStyle).toBe('preserve-3d');
    const face = track.querySelector('.swiper-slide');
    expect(face.style.position).toBe('absolute');
    expect(face.style.backfaceVisibility).toBe('hidden');
  });

  it('gates the face-hiding CSS behind data-carousel-ready (failsafe: no hidden content if the hook dies)', () => {
    // The cube's visibility:hidden rule only applies once the hook has
    // successfully applied transforms + active classes — so a chunk/JS
    // failure leaves the faces visible (stacked) instead of blank.
    harness.render(<TrackProbe total={4} mode="cube" />);
    const root = harness.container.querySelector('.probe-root');
    expect(root.getAttribute('data-carousel-mode')).toBe('cube');
    expect(root.hasAttribute('data-carousel-ready')).toBe(true);
    // And the active face is the one that would be visible (middle copy 4).
    expect(root.querySelector('.swiper-slide-active')).toBe(slideEls(root)[4]);
  });

  it('rotates the track by -90° per active face', () => {
    harness.render(<TrackProbe total={4} mode="cube" />);
    const root = harness.container.querySelector('.probe-root');
    const track = root.querySelector('.swiper-wrapper');
    expect(track.style.transform).toContain('rotateY(-360deg)'); // middle copy 4

    inst(harness).slideNext();
    expect(track.style.transform).toContain('rotateY(-450deg)');
  });
});

describe('useCarousel — seamless 3-copy wrap', () => {
  it('jumps back one copy when advancing past the last copy', () => {
    vi.useFakeTimers();
    harness.render(<TrackProbe total={4} autoplayDelay={100} />);
    const root = harness.container.querySelector('.probe-root');
    inst(harness).autoplay.start();
    // from raw 4 → 5 → 6 → 7 (still middle copy) → 8 (last copy start)
    vi.advanceTimersByTime(100 * 4);
    expect(inst(harness).activeIndex).toBe(8);
    // next tick crosses into the 3rd copy; the transitionend handler wraps back
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(9);
    root
      .querySelector('.swiper-wrapper')
      .dispatchEvent(new Event('transitionend', { bubbles: true }));
    // wrapTarget(9, 4) = 9 - 4 = 5 — same normalized slide, no visible jump
    expect(inst(harness).activeIndex).toBe(5);
    vi.useRealTimers();
  });

  it('jumps forward one copy when going before the first copy', () => {
    harness.render(<TrackProbe total={4} initialIndex={4} />);
    const root = harness.container.querySelector('.probe-root');
    inst(harness).slideTo(0, 0);
    expect(inst(harness).activeIndex).toBe(0);
    root
      .querySelector('.swiper-wrapper')
      .dispatchEvent(new Event('transitionend', { bubbles: true }));
    // wrapTarget(0, 4) = 0 + 4 = 4 — back into the middle copy
    expect(inst(harness).activeIndex).toBe(4);
  });
});
