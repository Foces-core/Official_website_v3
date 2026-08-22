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

// The /_vercel/ script-route probes gate mounting (only Vercel serves them).
function stubVercelFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: (h) => (h === 'content-type' ? 'application/javascript' : null) },
      }),
    ),
  );
}

function renderAnalytics() {
  harness.render(<DeferredAnalytics />);
}

beforeEach(() => {
  harness = createHarness();
  stubVercelFetch();
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
    // The platform-probe gate adds extra promise hops before the vendor
    // imports land; act only drains React's own work loop, so flush them.
    await act(async () => {
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });

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
