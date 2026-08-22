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

  it('idle auto-spin rotates the cube on its own while nothing owns it', () => {
    harness.render(<Probe />);
    const el = harness.container.querySelector('[data-testid="cube"]');
    expect(rafCallbacks.size).toBeGreaterThan(0); // idle spin scheduled

    fireFrames(1);
    // 0 - 0.5 degrees, wrapped into [0, 360)
    expect(el.style.transform).toContain('rotateY(359.5deg)');
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
});
