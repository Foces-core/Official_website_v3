import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import DeferredAnalytics from '../../src/utils/DeferredAnalytics.jsx';
import { createHarness } from './harness.jsx';

// Analytics is best-effort PER INTEGRATION: the two vendor chunks load
// independently (Promise.allSettled), so when one fails (e.g. the analytics
// script is blocked offline) the other must still mount, and the page must
// keep working — no unhandled rejection, no crash.
vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => <div id="speed-insights">analytics</div>,
}));
vi.mock('@vercel/analytics/react', () => Promise.reject(new Error('offline')));

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

describe('DeferredAnalytics — one vendor import fails', () => {
  it('mounts the working integration: Speed Insights renders, Analytics stays out', async () => {
    stubIdleCallback();
    renderAnalytics();

    // Interact so the idle path arms, then let idle fire and the failing
    // dynamic import settle. Any unhandled rejection fails the test run.
    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
    });
    await act(async () => {
      idleCb({ didTimeout: false, timeRemaining: () => 50 });
    });
    await act(async () => {});

    expect(document.getElementById('speed-insights')).not.toBeNull();
    expect(document.getElementById('vercel-analytics')).toBeNull();
    expect(harness.container.textContent).toContain('analytics');
  });

  it('renders nothing at boot even with a failing chunk pending (no crash on mount)', async () => {
    stubIdleCallback();
    renderAnalytics();
    expect(harness.container.textContent).toBe('');
    expect(document.getElementById('speed-insights')).toBeNull();
  });
});
