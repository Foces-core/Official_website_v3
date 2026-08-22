import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';
import PropTypes from 'prop-types';
import useCarousel from '../../src/hooks/useCarousel.js';
import { createHarness } from './harness.jsx';

const PointerEventCtor =
  globalThis.PointerEvent ||
  class PointerEvent extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? 'touch';
    }
  };

let harness;

function TrackProbe({
  total = 4,
  mode = 'flat',
  onActiveChange,
  autoplayDelay = 0,
  initialIndex,
  faceWidth,
  rerenderKey,
}) {
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
      <div
        ref={(node) => {
          trackRef.current = node;
          if (node && faceWidth) {
            Object.defineProperty(node, 'clientWidth', { configurable: true, value: faceWidth });
          }
        }}
        className={`swiper-wrapper ${rerenderKey}`}
      >
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
  faceWidth: PropTypes.number,
  rerenderKey: PropTypes.number,
};

const slideEls = (root) => [...root.querySelectorAll('.swiper-slide')];
const activeEl = (root) => slideEls(root).find((el) => el.hasAttribute('data-slide-active'));

const inst = (harness) => harness.container.querySelector('.probe-root').__carouselEngine__;

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  harness.unmount();
});

describe('useCarousel — instance contract', () => {
  it('starts in the middle copy', () => {
    harness.render(<TrackProbe total={4} />);
    expect(inst(harness).activeIndex).toBe(4);
    expect(activeEl(harness.container)).toBe(slideEls(harness.container)[4]);
  });

  it('slideNext / slidePrev move by one', () => {
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

  it('fires onActiveChange with NORMALIZED index', () => {
    const seen = [];
    harness.render(<TrackProbe total={4} onActiveChange={(i) => seen.push(i)} />);
    expect(seen).toEqual([0]);
    inst(harness).slideNext();
    inst(harness).slideNext();
    expect(seen).toEqual([0, 1, 2]);
  });

  it('enableKeyboard listens for arrows; disableKeyboard stops it', () => {
    harness.render(<TrackProbe total={4} />);
    inst(harness).enableKeyboard();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(inst(harness).activeIndex).toBe(5);
    inst(harness).disableKeyboard();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(inst(harness).activeIndex).toBe(5);
  });

  it('disableKeyboard removes the EXACT registered listener after re-render', () => {
    harness.render(<TrackProbe total={4} rerenderKey={1} />);
    inst(harness).enableKeyboard();
    harness.render(<TrackProbe total={4} rerenderKey={2} />);
    inst(harness).disableKeyboard();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(inst(harness).activeIndex).toBe(4);
  });

  it('startAutoplay advances; stopAutoplay halts', () => {
    vi.useFakeTimers();
    harness.render(<TrackProbe total={4} autoplayDelay={100} />);
    inst(harness).startAutoplay();
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(5);
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(6);
    inst(harness).stopAutoplay();
    vi.advanceTimersByTime(300);
    expect(inst(harness).activeIndex).toBe(6);
  });

  it('pauses autoplay during drag and resumes on release', () => {
    vi.useFakeTimers();
    harness.render(<TrackProbe total={4} autoplayDelay={100} />);
    const root = harness.container.querySelector('.probe-root');
    const track = root.querySelector('.swiper-wrapper');
    inst(harness).startAutoplay();
    const pointer = (type, x) =>
      new PointerEventCtor(type, {
        pointerId: 1,
        pointerType: 'touch',
        clientX: x,
        bubbles: true,
        cancelable: true,
      });
    track.dispatchEvent(pointer('pointerdown', 400));
    vi.advanceTimersByTime(300);
    expect(inst(harness).activeIndex).toBe(4);
    track.dispatchEvent(pointer('pointermove', 350));
    track.dispatchEvent(pointer('pointerup', 350));
    expect(inst(harness).activeIndex).toBe(5);
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(6);
  });
});

describe('useCarousel — cube mode', () => {
  it('sets 3D scaffolding', () => {
    harness.render(<TrackProbe total={4} mode="cube" />);
    const root = harness.container.querySelector('.probe-root');
    expect(root.style.perspective).toBe('1200px');
    const track = root.querySelector('.swiper-wrapper');
    expect(track.style.transformStyle).toBe('preserve-3d');
    const face = track.querySelector('.swiper-slide');
    expect(face.style.position).toBe('absolute');
    expect(face.style.backfaceVisibility).toBe('hidden');
  });

  it('gates face-hiding behind data-carousel-ready', () => {
    harness.render(<TrackProbe total={4} mode="cube" />);
    const root = harness.container.querySelector('.probe-root');
    expect(root.getAttribute('data-carousel-mode')).toBe('cube');
    expect(root.hasAttribute('data-carousel-ready')).toBe(true);
    expect(root.querySelector('[data-slide-active]')).toBe(slideEls(root)[4]);
  });

  it('rotates the track by -90° per face', () => {
    harness.render(<TrackProbe total={4} mode="cube" />);
    const root = harness.container.querySelector('.probe-root');
    const track = root.querySelector('.swiper-wrapper');
    expect(track.style.transform).toContain('rotateY(-360deg)');
    inst(harness).slideNext();
    expect(track.style.transform).toContain('rotateY(-450deg)');
  });
});

describe('useCarousel — pointer drag', () => {
  const dragStart = (root, fromX, toX) => {
    const track = root.querySelector('.swiper-wrapper');
    const pointer = (type, x) =>
      new PointerEventCtor(type, {
        pointerId: 1,
        pointerType: 'touch',
        clientX: x,
        bubbles: true,
        cancelable: true,
      });
    track.dispatchEvent(pointer('pointerdown', fromX));
    const move = pointer('pointermove', toX);
    track.dispatchEvent(move);
    return { track, move, finish: () => track.dispatchEvent(pointer('pointerup', toX)) };
  };

  it('flat: drag previews offset, prevents default, settles on next index', () => {
    harness.render(<TrackProbe total={4} mode="flat" />);
    const root = harness.container.querySelector('.probe-root');
    const { track, move, finish } = dragStart(root, 400, 320);
    expect(track.style.transform).toContain('translate3d(-80px, 0, 0)');
    expect(move.defaultPrevented).toBe(true);
    finish();
    expect(inst(harness).activeIndex).toBe(5);
  });

  it('cube: drag previews toward NEXT face and settles there', () => {
    harness.render(<TrackProbe total={4} mode="cube" faceWidth={300} />);
    const root = harness.container.querySelector('.probe-root');
    const { track, move, finish } = dragStart(root, 400, 320);
    expect(track.style.transform).toContain('rotateY(-384deg)');
    expect(move.defaultPrevented).toBe(true);
    finish();
    expect(inst(harness).activeIndex).toBe(5);
  });
});

describe('useCarousel — cube face gating across 3-copy wrap', () => {
  it('marks exactly active/next/prev on every raw position', () => {
    harness.render(<TrackProbe total={4} mode="cube" faceWidth={300} />);
    const root = harness.container.querySelector('.probe-root');
    const els = slideEls(root);
    for (let raw = 0; raw < 12; raw++) {
      inst(harness).slideTo(raw, 0);
      const withAttr = (name) => els.filter((el) => el.hasAttribute(name));
      expect(withAttr('data-slide-active')).toEqual([els[raw]]);
      expect(withAttr('data-slide-next')).toEqual(raw + 1 < els.length ? [els[raw + 1]] : []);
      expect(withAttr('data-slide-prev')).toEqual(raw - 1 >= 0 ? [els[raw - 1]] : []);
    }
  });
});

describe('useCarousel — seamless 3-copy wrap', () => {
  it('jumps back one copy when advancing past the last', () => {
    vi.useFakeTimers();
    harness.render(<TrackProbe total={4} autoplayDelay={100} />);
    const root = harness.container.querySelector('.probe-root');
    inst(harness).startAutoplay();
    vi.advanceTimersByTime(100 * 4);
    expect(inst(harness).activeIndex).toBe(8);
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(9);
    root
      .querySelector('.swiper-wrapper')
      .dispatchEvent(new Event('transitionend', { bubbles: true }));
    expect(inst(harness).activeIndex).toBe(5);
  });

  it('jumps forward one copy when going before the first', () => {
    harness.render(<TrackProbe total={4} initialIndex={4} />);
    const root = harness.container.querySelector('.probe-root');
    inst(harness).slideTo(0, 0);
    expect(inst(harness).activeIndex).toBe(0);
    root
      .querySelector('.swiper-wrapper')
      .dispatchEvent(new Event('transitionend', { bubbles: true }));
    expect(inst(harness).activeIndex).toBe(4);
  });
});
