import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import DeferredAnalytics from '../../src/utils/DeferredAnalytics.jsx';
import { createHarness } from './harness.jsx';

// Analytics is best-effort: when the vendor chunk fails to load, the page
// must keep working with nothing mounted and no unhandled rejection.
vi.mock('@vercel/speed-insights/react', () => Promise.reject(new Error('offline')));

let harness;
let idleCb;

function stubIdleCallback() {
  idleCb = null;
  vi.stubGlobal('requestIdleCallback', (cb) => {
    idleCb = cb;
    return 42;
  });
  vi.stubGlobal('cancelIdleCallback', () => {});
}

function renderAnalytics() {
  harness.render(<DeferredAnalytics />);
}

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  vi.unstubAllGlobals();
  harness.unmount();
});

describe('DeferredAnalytics — analytics import failure', () => {
  it('never breaks the page: stays unmounted, no unhandled rejection, no crash', async () => {
    stubIdleCallback();
    renderAnalytics();

    // Interact so the idle path arms, then let idle fire and the failed
    // dynamic import settle. Any unhandled rejection fails the test run.
    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
    });
    await act(async () => {
      idleCb({ didTimeout: false, timeRemaining: () => 50 });
    });
    await act(async () => {});

    expect(document.getElementById('speed-insights')).toBeNull();
    expect(harness.container.textContent).toBe('');
  });
});
