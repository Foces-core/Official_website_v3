import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import PropTypes from 'prop-types';
import { useCubeDrag } from '../../src/hooks/useCubeDrag.js';
import { registerWidget, markInteracted } from '../../src/utils/keyboardLock.js';
import { SPIN_BARS } from '../../src/Components/AboutUs/easterEggLogic.js';
import { createHarness } from './harness.jsx';

// The cube's motion orchestration (drag, wind-down, spin tracking, idle
// auto-spin, keyboard) lives in useCubeDrag; the pure decisions behind it are
// spec'd in their own modules. These specs exercise the wiring: does a drag
// or 20 arrow presses actually cross the rapid-spin bar, and does the cube
// rotate?

let rafCallbacks;
let rafId;

beforeEach(() => {
  rafId = 0;
  rafCallbacks = new Map();
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    rafCallbacks.set(++rafId, cb);
    return rafId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => {
    rafCallbacks.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  rafCallbacks.clear();
});

function Probe({ onEggFire = vi.fn(), spinConfig = SPIN_BARS.desktop, idleSpin = true }) {
  const { boxRef, handlers } = useCubeDrag({
    idleSpin,
    spinConfig,
    onEggFire,
  });
  return <div ref={boxRef} {...handlers} data-testid="cube" role="group" tabIndex={0} />;
}

Probe.propTypes = {
  onEggFire: PropTypes.func,
  spinConfig: PropTypes.shape({ target: PropTypes.number, gap: PropTypes.number }),
  idleSpin: PropTypes.bool,
};

const mousedown = (el, clientX) =>
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX }));
const mousemove = (clientX) => window.dispatchEvent(new MouseEvent('mousemove', { clientX }));
const mouseup = () => window.dispatchEvent(new MouseEvent('mouseup'));
const arrowKey = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key }));
const touchEvent = (target, type, changedTouches = [], touches = []) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    changedTouches: { value: changedTouches },
    touches: { value: touches },
  });
  target.dispatchEvent(event);
  return event;
};

// Fire `n` queued animation frames (the idle auto-spin and wind-down both
// drive themselves through requestAnimationFrame).
const fireFrames = (n = 1) =>
  act(() => {
    for (let i = 0; i < n; i += 1) {
      const cbs = [...rafCallbacks.values()];
      rafCallbacks.clear();
      cbs.forEach((cb) => cb());
    }
  });

describe('useCubeDrag', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
  });

  it('renders and wires boxRef + the pointer handlers', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    expect(el).not.toBeNull();
    expect(el.getAttribute('role')).toBe('group');
  });

  it('a long drag rotates the cube and crosses the rapid-spin bar exactly once', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} />);
    const el = harness.container.querySelector('[data-testid="cube"]');

    act(() => {
      mousedown(el, 0);
      // 3000px * 0.6 deg/px = 1800° = 20 full spins (desktop bar).
      mousemove(3000);
      mouseup();
    });

    expect(el.style.transform).toContain('rotateY(1800deg)');
    expect(onEggFire).toHaveBeenCalledTimes(1);
  });

  it('a small drag rotates but never fires the egg', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} />);
    const el = harness.container.querySelector('[data-testid="cube"]');

    act(() => {
      mousedown(el, 0);
      mousemove(100); // 60° — well under one spin
      mouseup();
    });

    expect(el.style.transform).toContain('rotateY(60deg)');
    expect(onEggFire).not.toHaveBeenCalled();
  });

  it('ignores non-primary mouse buttons', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');

    act(() => {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 2, clientX: 0 }));
      mousemove(100);
      mouseup();
    });

    expect(el.style.transform).toBe('');
  });

  it('tracks only the touch that started the drag and ignores other fingers lifting', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };
    const other = { identifier: 22, clientX: 500 };

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      touchEvent(el, 'touchmove', [other], [owner, other]);
      touchEvent(el, 'touchend', [other], [owner]);
      touchEvent(el, 'touchend', [], [owner]); // Some browsers omit changedTouches.
    });
    expect(el.style.transform).toBe('');

    act(() => {
      owner.clientX = 1;
      touchEvent(el, 'touchmove', [owner], [owner, other]);
      touchEvent(el, 'touchend', [owner], []);
    });
    expect(el.style.transform).toContain('rotateY(0.6deg)');
  });

  it('prevents touch scrolling only while the cube is being dragged', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const idleEvent = touchEvent(el, 'touchmove');
    expect(idleEvent.defaultPrevented).toBe(false);

    act(() => touchEvent(el, 'touchstart', [{ identifier: 1, clientX: 0 }], []));
    const draggingEvent = touchEvent(el, 'touchmove');
    expect(draggingEvent.defaultPrevented).toBe(true);
  });

  it('20 arrow presses fire the egg when the cube owns the arrow keys', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    // Give the cube arrow ownership: on-screen widget + last-interacted.
    const unregister = registerWidget('cube', () => true, el);
    markInteracted('cube');

    act(() => {
      for (let i = 0; i < 20; i += 1) arrowKey('ArrowRight');
    });

    expect(onEggFire).toHaveBeenCalledTimes(1);
    unregister();
  });

  it('rotates from the keyboard when the focused cube owns the arrow keys', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    el.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    });
    el.getClientRects = () => [el.getBoundingClientRect()];
    el.focus();

    act(() => arrowKey('ArrowRight'));

    expect(el.style.transform).toContain('rotateY(-90deg)');
  });

  it('moves left by one face and ignores non-arrow keys', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const unregister = registerWidget('cube', () => true, el);
    markInteracted('cube');

    act(() => {
      arrowKey('ArrowLeft');
      arrowKey('Enter');
    });

    expect(el.style.transform).toContain('rotateY(90deg)');
    unregister();
  });

  it('idle auto-spin rotates the cube on its own while nothing owns it', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    expect(rafCallbacks.size).toBeGreaterThan(0); // idle spin scheduled

    fireFrames(1);
    // 0 - 0.5 degrees, wrapped into [0, 360)
    expect(el.style.transform).toContain('rotateY(359.5deg)');
  });

  it('pauses idle rotation while the cube is outside the observer margin and resumes on re-entry', () => {
    let onIntersect;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class IntersectionObserverMock {
        constructor(callback) {
          onIntersect = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    expect(observe).toHaveBeenCalledWith(el);

    act(() => onIntersect([{ isIntersecting: false }]));
    fireFrames(1);
    expect(el.style.transform).toBe('');
    expect(rafCallbacks.size).toBe(0);

    act(() => onIntersect([{ isIntersecting: true }]));
    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(359.5deg)');

    harness.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('winds down after a fast release, then snaps to the nearest face', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    act(() => {
      mousedown(el, 0);
      mousemove(1000);
      mouseup();
    });

    expect(rafCallbacks.size).toBe(1);
    fireFrames(240);
    expect(el.style.transition).toContain('400ms');
    expect(el.style.transform).toMatch(/rotateY\(-?\d+deg\)/);
    expect(rafCallbacks.size).toBe(0);
  });

  it('skips the idle auto-spin when the idleSpin capability is off', () => {
    harness.render(<Probe idleSpin={false} />);
    expect(rafCallbacks.size).toBe(0);
  });

  it('arrow presses do nothing while another widget owns the arrows', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const unregisterRival = registerWidget('featuring', () => true, el);
    markInteracted('featuring'); // last-interacted wins → rival owns the keys

    act(() => {
      for (let i = 0; i < 20; i += 1) arrowKey('ArrowRight');
    });

    expect(onEggFire).not.toHaveBeenCalled();
    unregisterRival();
  });

  it('unmounts cleanly with a wind-down in flight', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    act(() => {
      mousedown(el, 0);
      mousemove(3000); // endDrag schedules a wind-down rAF
      mouseup();
    });
    expect(() => harness.unmount()).not.toThrow();
  });

  it('removes active mouse listeners when unmounted during a drag', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const remove = vi.spyOn(window, 'removeEventListener');
    act(() => mousedown(el, 0));

    harness.unmount();

    expect(remove).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('mouseup', expect.any(Function));
    remove.mockRestore();
  });
});
