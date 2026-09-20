import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, useRef } from 'react';
import useInViewOnce from '../../src/hooks/useInViewOnce.js';
import { createHarness } from './harness.jsx';

class FakeIO {
  constructor(cb) {
    this.cb = cb;
    this.observed = new Set();
    this.disconnected = false;
    FakeIO.instances.push(this);
  }
  observe(target) {
    this.observed.add(target);
  }
  disconnect() {
    this.disconnected = true;
  }
  unobserve() {}
  trigger(isIntersecting) {
    this.cb([{ isIntersecting }]);
  }
}
FakeIO.instances = [];

function Probe() {
  const ref = useRef(null);
  const inView = useInViewOnce(ref);
  return (
    <div ref={ref}>
      <span data-testid="state">{String(inView)}</span>
    </div>
  );
}

describe('useInViewOnce', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
    FakeIO.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIO);
  });

  afterEach(() => {
    harness.unmount();
    vi.unstubAllGlobals();
  });

  const state = () => harness.container.querySelector('[data-testid="state"]').textContent;

  it('starts false and observes the target', () => {
    act(() => harness.render(<Probe />));
    expect(state()).toBe('false');
    expect(FakeIO.instances).toHaveLength(1);
    expect(FakeIO.instances[0].observed.size).toBe(1);
  });

  it('resolves true on first intersection and disconnects (fire-once)', () => {
    act(() => harness.render(<Probe />));
    const io = FakeIO.instances[0];

    act(() => io.trigger(true));
    expect(state()).toBe('true');
    expect(io.disconnected).toBe(true);
  });

  it('never flips back on later non-intersecting events', () => {
    act(() => harness.render(<Probe />));
    const io = FakeIO.instances[0];

    act(() => io.trigger(true));
    act(() => io.trigger(false));
    expect(state()).toBe('true');
  });

  it('ignores non-intersecting first events and keeps observing', () => {
    act(() => harness.render(<Probe />));
    const io = FakeIO.instances[0];

    act(() => io.trigger(false));
    expect(state()).toBe('false');
    expect(io.disconnected).toBe(false);

    act(() => io.trigger(true));
    expect(state()).toBe('true');
  });

  it('fails open when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { default: useInViewOnceFresh } =
      await import('../../src/hooks/useInViewOnce.js?t=fallback');
    function FreshProbe() {
      const ref = useRef(null);
      const inView = useInViewOnceFresh(ref);
      return (
        <div ref={ref}>
          <span data-testid="fresh">{String(inView)}</span>
        </div>
      );
    }
    act(() => harness.render(<FreshProbe />));
    // Failsafe resolves on the next tick — give it one.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(harness.container.querySelector('[data-testid="fresh"]').textContent).toBe('true');
  });

  it('cleans up the observer on unmount', () => {
    act(() => harness.render(<Probe />));
    const io = FakeIO.instances[0];
    act(() => harness.unmount());
    expect(io.disconnected).toBe(true);
  });
});
