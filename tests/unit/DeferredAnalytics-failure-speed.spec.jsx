import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import DeferredAnalytics from '../../src/utils/DeferredAnalytics.jsx';
import { createHarness } from './harness.jsx';

// Mirror of DeferredAnalytics-failure.spec.jsx with the failing chunk swapped:
// when the SPEED INSIGHTS chunk fails (fulfilled/failed swapped), Analytics
// must still mount and Insights stays out — best-effort per integration in
// the other direction.
vi.mock('@vercel/speed-insights/react', () => Promise.reject(new Error('offline')));
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div id="vercel-analytics">analytics</div>,
}));

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

describe('DeferredAnalytics — the speed-insights vendor import fails', () => {
  it('mounts the working integration: Analytics renders, Speed Insights stays out', async () => {
    stubIdleCallback();
    renderAnalytics();

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

    expect(document.getElementById('vercel-analytics')).not.toBeNull();
    expect(document.getElementById('speed-insights')).toBeNull();
    expect(harness.container.textContent).toContain('analytics');
  });

  it('renders nothing at boot even with a failing chunk pending (no crash on mount)', async () => {
    stubIdleCallback();
    renderAnalytics();
    expect(harness.container.textContent).toBe('');
    expect(document.getElementById('vercel-analytics')).toBeNull();
  });
});
