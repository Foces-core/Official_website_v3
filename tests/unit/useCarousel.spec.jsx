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

// jsdom may lack PointerEvent (it landed in later jsdom releases) — fall
// back to a MouseEvent subclass carrying the pointer fields the hook reads.
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
          // jsdom does no layout (clientWidth is 0), so a cube drag's face
          // width must be injected before the hook's measure() runs (refs
          // attach before layout effects). Only the cube test needs it.
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
const activeEl = (root) =>
  slideEls(root).find((el) => el.classList.contains('swiper-slide-active'));

const inst = (harness) => harness.container.querySelector('.probe-root').__carousel__;

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  // Always restore real timers here — if an autoplay/wrap test's fake timers
  // are still active when an assertion fails mid-test, every later test in
  // this file would inherit them.
  vi.useRealTimers();
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

  it('disableKeyboard removes the EXACT registered listener even after a re-render', () => {
    // onKeyDown is re-created every render; disableKeyboard must drop the
    // function that was actually added (a naive remove of the current closure
    // would leave the original on window, driving a stale instance forever).
    harness.render(<TrackProbe total={4} rerenderKey={1} />);
    inst(harness).keyboard.enable();
    harness.render(<TrackProbe total={4} rerenderKey={2} />); // new closure
    inst(harness).keyboard.disable();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(inst(harness).activeIndex).toBe(4); // stale listener must be gone
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
  });

  it('pauses autoplay during a pointer drag and resumes on release', () => {
    vi.useFakeTimers();
    harness.render(<TrackProbe total={4} autoplayDelay={100} />);
    const root = harness.container.querySelector('.probe-root');
    const track = root.querySelector('.swiper-wrapper');
    inst(harness).autoplay.start();
    const pointer = (type, x) =>
      new PointerEventCtor(type, {
        pointerId: 1,
        pointerType: 'touch',
        clientX: x,
        bubbles: true,
        cancelable: true,
      });
    track.dispatchEvent(pointer('pointerdown', 400));
    // While the finger is down, the interval must NOT fire a goTo() — it
    // would move the track under the user and corrupt the release snap.
    vi.advanceTimersByTime(300);
    expect(inst(harness).activeIndex).toBe(4);
    track.dispatchEvent(pointer('pointermove', 350));
    track.dispatchEvent(pointer('pointerup', 350));
    expect(inst(harness).activeIndex).toBe(5); // release snap (left drag)
    // Autoplay resumed: the next tick advances again.
    vi.advanceTimersByTime(100);
    expect(inst(harness).activeIndex).toBe(6);
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

describe('useCarousel — pointer drag', () => {
  // Dispatch pointerdown + pointermove, and hand back the move (for preview
  // assertions) plus a finish() that dispatches pointerup.
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

  it('flat: drag previews the offset during the move, prevents the browser default, and settles on the next index', () => {
    harness.render(<TrackProbe total={4} mode="flat" />);
    const root = harness.container.querySelector('.probe-root');
    const { track, move, finish } = dragStart(root, 400, 320); // 80px left
    // During the drag the track previews the gesture (content follows the
    // finger) and owns it (preventDefault — ADR-0007 gesture ownership).
    expect(track.style.transform).toContain('translate3d(-80px, 0, 0)');
    expect(move.defaultPrevented).toBe(true);
    finish();
    // Release: a left drag settles on the next slide (raw 4 → 5).
    expect(inst(harness).activeIndex).toBe(5);
  });

  it('cube: drag left previews toward the NEXT face and settles there (sign regression)', () => {
    harness.render(<TrackProbe total={4} mode="cube" faceWidth={300} />);
    const root = harness.container.querySelector('.probe-root');
    const { track, move, finish } = dragStart(root, 400, 320); // 80px left
    // faceWidth 300 → cubeDragAngle(-80, 300) = -24°. Base -4×90 = -360°, so
    // the preview must read rotateY(-384deg) — MORE negative, toward the next
    // face, the same direction dragSnap settles on. (The old sign negated the
    // drag term and previewed the previous face, making the cube jump on
    // release.)
    expect(track.style.transform).toContain('rotateY(-384deg)');
    expect(move.defaultPrevented).toBe(true);
    finish();
    expect(inst(harness).activeIndex).toBe(5);
  });
});

describe('useCarousel — cube face gating across the 3-copy wrap', () => {
  it('marks exactly active/next/prev on every raw position (the copies share 4 faces; classes decide which child is visible)', () => {
    // TeamCarousel renders 3 copies of 11 slides; cubeFaceTransform(i) puts
    // children i, i±4, ... on the SAME face. The CSS shows only the child
    // carrying swiper-slide-active/next/prev — walk the whole wrap and assert
    // exactly one child carries each class, at the correct raw position, so
    // the visible member always matches the active index.
    harness.render(<TrackProbe total={4} mode="cube" faceWidth={300} />);
    const root = harness.container.querySelector('.probe-root');
    const els = slideEls(root);
    for (let raw = 0; raw < 12; raw++) {
      inst(harness).slideTo(raw, 0);
      const withClass = (name) => els.filter((el) => el.classList.contains(name));
      expect(withClass('swiper-slide-active')).toEqual([els[raw]]);
      expect(withClass('swiper-slide-next')).toEqual(raw + 1 < els.length ? [els[raw + 1]] : []);
      expect(withClass('swiper-slide-prev')).toEqual(raw - 1 >= 0 ? [els[raw - 1]] : []);
    }
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
