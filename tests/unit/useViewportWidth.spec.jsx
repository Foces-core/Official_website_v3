import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useViewportWidth } from '../../src/hooks/useViewportWidth.js';
import { createHarness } from './harness.jsx';

// The viewport-width ceremony (useState initializer + resize listener) used
// to be hand-rolled in Loader, Navbar and Featuring. This hook owns it; the
// components feed the result into their breakpoints.js predicates.

let originalInnerWidth;

beforeEach(() => {
  originalInnerWidth = window.innerWidth;
});

afterEach(() => {
  // Restore the width the jsdom environment started with, in case a test
  // redefined it.
  if (window.innerWidth !== originalInnerWidth) {
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true,
    });
  }
});

function WidthProbe() {
  const width = useViewportWidth();
  return <div data-testid="width">{width}</div>;
}

describe('useViewportWidth', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
  });

  it('reads the current viewport width on mount', () => {
    harness.render(<WidthProbe />);
    const el = harness.container.querySelector('[data-testid="width"]');
    expect(el.textContent).toBe(String(window.innerWidth));
  });

  it('tracks resize events reactively', () => {
    harness.render(<WidthProbe />);
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const el = harness.container.querySelector('[data-testid="width"]');
    expect(el.textContent).toBe('500');
  });

  it('stops listening when the component unmounts', () => {
    harness.render(<WidthProbe />);
    harness.unmount();
    // Unmounting must not throw; the listener is removed, so a resize after
    // unmount is a no-op.
    Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });
    expect(() => act(() => window.dispatchEvent(new Event('resize')))).not.toThrow();
  });
});
