import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import PropTypes from 'prop-types';
import { useCubeDrag } from '../../src/hooks/useCubeDrag.js';
import { registerWidget, markInteracted, getArrowOwner } from '../../src/utils/keyboardLock.js';
import { SPIN_BARS } from '../../src/Components/AboutUs/easterEggLogic.js';
import { CUBE_PHYSICS } from '../../src/utils/cubePhysics.js';
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

function Probe({ onEggFire, spinConfig = SPIN_BARS.desktop, idleSpin = true }) {
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
const completeTouchDrag = (el, owner, distance) => {
  touchEvent(el, 'touchstart', [owner], [owner]);
  owner.clientX = distance;
  touchEvent(el, 'touchmove', [owner], [owner]);
  touchEvent(el, 'touchend', [owner], []);
};
const makeCubeVisible = (el) => {
  el.getClientRects = () => [{}];
  el.getBoundingClientRect = () => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  });
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

  it('does not throw when a rapid spin has no optional egg callback', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');

    expect(() => {
      act(() => {
        mousedown(el, 0);
        mousemove(3000);
        mouseup();
      });
    }).not.toThrow();
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

  it('does not let a second touchstart steal ownership from an active touch', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };
    const other = { identifier: 22, clientX: 500 };

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      touchEvent(el, 'touchstart', [other], [owner, other]);
      owner.clientX = 20;
      touchEvent(el, 'touchmove', [owner], [owner, other]);
    });

    expect(el.style.transform).toContain('rotateY(12deg)');
  });

  it('falls back to the current touch when changedTouches is unavailable', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };
    const event = new Event('touchstart', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', { value: [owner] });

    act(() => el.dispatchEvent(event));
    owner.clientX = 20;
    act(() => touchEvent(el, 'touchmove', [owner], [owner]));

    expect(el.style.transform).toContain('rotateY(12deg)');
  });

  it('restores the starting angle when the owning touch is cancelled', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      owner.clientX = 100;
      touchEvent(el, 'touchmove', [owner], [owner]);
    });
    expect(el.style.transform).toContain('rotateY(60deg)');

    act(() => touchEvent(el, 'touchcancel', [owner], []));

    expect(el.style.transform).toContain('rotateY(0deg)');
    expect(onEggFire).not.toHaveBeenCalled();
  });

  it('resumes an interrupted wind-down after restoring the pre-touch angle', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');

    act(() => {
      mousedown(el, 0);
      mousemove(1000);
      mouseup();
      fireFrames(1);
    });
    const beforeTouch = el.style.transform;
    expect(rafCallbacks.size).toBe(1);

    const owner = { identifier: 11, clientX: 0 };
    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      owner.clientX = 20;
      touchEvent(el, 'touchmove', [owner], [owner]);
      touchEvent(el, 'touchcancel', [owner], []);
    });

    expect(el.style.transform).toBe(beforeTouch);
    expect(rafCallbacks.size).toBe(1);
    fireFrames(1);
    expect(el.style.transform).not.toBe(beforeTouch);
  });

  it('does not count spin progress from a cancelled touch gesture', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} spinConfig={SPIN_BARS.touch} idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      owner.clientX = 1200; // 8 full 90-degree spins at 0.6 degrees per pixel
      touchEvent(el, 'touchmove', [owner], [owner]);
      touchEvent(el, 'touchcancel', [owner], []);
    });

    expect(el.style.transform).toContain('rotateY(0deg)');
    expect(onEggFire).not.toHaveBeenCalled();
  });

  it('counts touch spin progress only after the gesture ends normally', () => {
    const onEggFire = vi.fn();
    harness.render(<Probe onEggFire={onEggFire} spinConfig={SPIN_BARS.touch} idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };

    act(() => completeTouchDrag(el, owner, 1200));

    expect(onEggFire).toHaveBeenCalledTimes(1);
  });

  it('counts exactly one spin once for a 90-degree touch drag', () => {
    const onEggFire = vi.fn();
    harness.render(
      <Probe onEggFire={onEggFire} spinConfig={{ target: 2, gap: 800 }} idleSpin={false} />,
    );
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };

    act(() => {
      completeTouchDrag(el, owner, 150);
      expect(onEggFire).not.toHaveBeenCalled();
      owner.clientX = 0;
      completeTouchDrag(el, owner, 150);
    });

    expect(onEggFire).toHaveBeenCalledTimes(1);
  });

  it('uses the latest egg callback after the hook rerenders', () => {
    const firstCallback = vi.fn();
    const latestCallback = vi.fn();
    harness.render(<Probe onEggFire={firstCallback} idleSpin={false} />);
    harness.render(<Probe onEggFire={latestCallback} idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const unregister = registerWidget('cube', () => true, el);
    markInteracted('cube');

    act(() => {
      for (let i = 0; i < 20; i += 1) arrowKey('ArrowRight');
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(latestCallback).toHaveBeenCalledTimes(1);
    unregister();
  });

  it('ignores cancellation of a non-owner touch while the owner is still dragging', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };
    const other = { identifier: 22, clientX: 300 };

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      owner.clientX = 30;
      touchEvent(el, 'touchmove', [owner], [owner, other]);
      touchEvent(el, 'touchcancel', [other], [owner]);
    });

    expect(el.style.transform).toContain('rotateY(18deg)');

    act(() => {
      owner.clientX = 40;
      touchEvent(el, 'touchmove', [owner], [owner]);
    });
    expect(el.style.transform).toContain('rotateY(24deg)');
  });

  it('ends the drag when changedTouches is empty and the owner is no longer down', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };
    const other = { identifier: 22, clientX: 500 };

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      touchEvent(el, 'touchend', [], [other]);
    });

    const moveAfterOwnerLift = touchEvent(el, 'touchmove', [other], [other]);
    expect(moveAfterOwnerLift.defaultPrevented).toBe(false);
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
    expect(el.getAttribute('data-manual-motion')).toBe('true');
    expect(el.style.getPropertyValue('--manual-motion-duration')).toBe('400ms');
    expect(el.style.transition).toContain('400ms');
  });

  it('pauses idle auto-spin during the manual arrow grace period and resumes later', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
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

    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(-90deg)');

    act(() => vi.advanceTimersByTime(3001));
    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(-90deg)');

    act(() => vi.advanceTimersByTime(CUBE_PHYSICS.idlePauseMs - 3001));
    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(-180deg)');
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

  it('pointer interaction gives the cube keyboard ownership over another widget', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    makeCubeVisible(el);
    const unregisterRival = registerWidget('featuring', () => true, null);
    markInteracted('featuring');

    act(() => el.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    act(() => arrowKey('ArrowRight'));

    expect(getArrowOwner()).toBe('cube');
    expect(el.style.transform).toContain('rotateY(-90deg)');
    unregisterRival();
  });

  it('focus interaction keeps cube keyboard ownership after focus leaves it', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    makeCubeVisible(el);
    const unregisterRival = registerWidget('featuring', () => true, null);
    markInteracted('featuring');

    act(() => {
      el.focus();
      el.blur();
      arrowKey('ArrowRight');
    });

    expect(getArrowOwner()).toBe('cube');
    expect(el.style.transform).toContain('rotateY(-90deg)');
    unregisterRival();
  });

  it('holds each face before the next idle turn', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    expect(rafCallbacks.size).toBeGreaterThan(0); // idle spin scheduled

    fireFrames(1);
    expect(el.style.transform).toBe('');
    act(() => vi.advanceTimersByTime(CUBE_PHYSICS.idlePauseMs));
    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(-90deg)');
    expect(el.style.transition).toBe(`transform ${CUBE_PHYSICS.snapMs}ms ease-in-out`);
    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(-90deg)');
    act(() => vi.advanceTimersByTime(CUBE_PHYSICS.idlePauseMs));
    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(-180deg)');
  });

  it('pauses idle rotation while the cube is outside the observer margin and resumes on re-entry', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    let onIntersect;
    let observerOptions;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class IntersectionObserverMock {
        constructor(callback, options) {
          onIntersect = callback;
          observerOptions = options;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    expect(observe).toHaveBeenCalledWith(el);
    expect(observerOptions).toEqual({ rootMargin: '100px' });

    act(() => onIntersect([{ isIntersecting: false }]));
    fireFrames(1);
    expect(el.style.transform).toBe('');
    expect(rafCallbacks.size).toBe(0);

    act(() => vi.advanceTimersByTime(CUBE_PHYSICS.idlePauseMs));
    act(() => onIntersect([{ isIntersecting: true }]));
    expect(rafCallbacks.size).toBe(1);
    act(() => onIntersect([{ isIntersecting: true }]));
    expect(rafCallbacks.size).toBe(1);
    fireFrames(1);
    expect(el.style.transform).toContain('rotateY(-90deg)');

    harness.unmount();
    expect(rafCallbacks.size).toBe(0);
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
    const settledAngle = Number(el.style.transform.match(/rotateY\((-?\d+)deg\)/)?.[1]);
    expect(settledAngle % 90).toBe(0);
    expect(rafCallbacks.size).toBe(0);
  });

  it('keyboard input cancels wind-down before applying the new angle', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const unregister = registerWidget('cube', () => true, el);
    markInteracted('cube');
    act(() => {
      mousedown(el, 0);
      mousemove(1000);
      mouseup();
    });
    expect(rafCallbacks.size).toBe(1);

    act(() => arrowKey('ArrowRight'));
    expect(el.style.transform).toContain('rotateY(510deg)');
    expect(rafCallbacks.size).toBe(0);
    fireFrames(2);
    expect(el.style.transform).toContain('rotateY(510deg)');
    unregister();
  });

  it('a new drag cancels the previous wind-down frame', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    act(() => {
      mousedown(el, 0);
      mousemove(1000);
      mouseup();
    });
    expect(rafCallbacks.size).toBe(1);

    act(() => {
      mousedown(el, 0);
      fireFrames(1);
    });
    expect(rafCallbacks.size).toBe(0);
    expect(el.style.transform).toContain('rotateY(600deg)');
    act(mouseup);
  });

  it('skips the idle auto-spin when the idleSpin capability is off', () => {
    harness.render(<Probe idleSpin={false} />);
    expect(rafCallbacks.size).toBe(0);

    harness.render(<Probe idleSpin />);
    expect(rafCallbacks.size).toBe(1);

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
    expect(rafCallbacks.size).toBe(0);
  });

  it('replaces the snap timer, restores transition after settling, and clears it on unmount', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const owner = { identifier: 11, clientX: 0 };

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      touchEvent(el, 'touchend', [owner], []);
      touchEvent(el, 'touchstart', [owner], [owner]);
      touchEvent(el, 'touchend', [owner], []);
    });
    expect(vi.getTimerCount()).toBe(1);
    expect(el.style.transition).toContain('400ms');

    act(() => vi.advanceTimersByTime(400));
    expect(el.style.transition).toBe('none');
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      touchEvent(el, 'touchstart', [owner], [owner]);
      touchEvent(el, 'touchend', [owner], []);
    });
    expect(vi.getTimerCount()).toBe(1);
    harness.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('removes active mouse listeners when unmounted during a drag', () => {
    harness.render(<Probe idleSpin={false} />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    const remove = vi.spyOn(window, 'removeEventListener');
    act(() => mousedown(el, 0));

    harness.unmount();

    expect(remove).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(getArrowOwner()).toBeNull();
    remove.mockRestore();
  });
});
