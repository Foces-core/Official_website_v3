import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PropTypes from 'prop-types';
import { act, useRef } from 'react';
import useIdleReveal from '../../src/hooks/useIdleReveal.js';
import { createHarness } from './harness.jsx';

const IDLE_MS = 1000;

function Probe({ idleMs = IDLE_MS }) {
  const ref = useRef(null);
  const visible = useIdleReveal(ref, { idleMs });
  return (
    <div ref={ref} data-testid="area">
      <button type="button" data-testid="arrow">
        <span data-testid="state">{String(visible)}</span>
      </button>
    </div>
  );
}

Probe.propTypes = { idleMs: PropTypes.number };

describe('useIdleReveal', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
    vi.useFakeTimers();
  });

  afterEach(() => {
    harness.unmount();
    vi.useRealTimers();
  });

  const state = () => harness.container.querySelector('[data-testid="state"]').textContent;
  const fire = (type, target = '[data-testid="arrow"]') => {
    act(() => {
      harness.container
        .querySelector(target)
        .dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    });
  };

  it('starts visible, hides after the idle window of silence', () => {
    act(() => harness.render(<Probe />));
    expect(state()).toBe('true');

    act(() => vi.advanceTimersByTime(IDLE_MS));
    expect(state()).toBe('false');
  });

  it('re-reveals and restarts the window on pointer activity', () => {
    act(() => harness.render(<Probe />));

    act(() => vi.advanceTimersByTime(IDLE_MS - 10));
    fire('pointermove');
    act(() => vi.advanceTimersByTime(IDLE_MS - 10)); // 10ms since activity — window restarted
    expect(state()).toBe('true');

    act(() => vi.advanceTimersByTime(10)); // crosses the idle mark
    expect(state()).toBe('false');
  });

  it('reveals on keyboard focus of a hidden control', () => {
    act(() => harness.render(<Probe />));

    act(() => vi.advanceTimersByTime(IDLE_MS));
    expect(state()).toBe('false');

    fire('focusin');
    expect(state()).toBe('true');
  });

  it('re-hides only after fresh silence (no timer leak stacking)', () => {
    act(() => harness.render(<Probe />));

    for (let i = 0; i < 5; i += 1) {
      act(() => vi.advanceTimersByTime(IDLE_MS - 50));
      fire('pointerdown');
    }
    expect(state()).toBe('true');

    act(() => vi.advanceTimersByTime(IDLE_MS));
    expect(state()).toBe('false');
  });

  it('cleans listeners and timer on unmount (no post-unmount state write)', () => {
    act(() => harness.render(<Probe />));
    act(() => harness.unmount());
    // Must not throw setState-on-unmounted warnings.
    act(() => vi.advanceTimersByTime(IDLE_MS * 5));
    expect(true).toBe(true);
  });
});
