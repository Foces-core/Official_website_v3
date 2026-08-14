import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import DeferredAnalytics from '../../src/utils/DeferredAnalytics.jsx';
import { createHarness } from './harness.jsx';

// The seam is the rendered output: DeferredAnalytics must render NOTHING at
// boot (analytics must not compete with the page), then mount SpeedInsights
// only after the user has interacted and the browser is idle — or the safety
// timer fires. The dynamic import is mocked; jsdom has no
// requestIdleCallback, so we drive it by hand.
vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => <div id="speed-insights">analytics</div>,
}));

let harness;
let idleCb;
let idleOpts;

function stubIdleCallback() {
  idleCb = null;
  idleOpts = null;
  vi.stubGlobal('requestIdleCallback', (cb, opts) => {
    idleCb = cb;
    idleOpts = opts;
    return 42;
  });
  vi.stubGlobal('cancelIdleCallback', () => {});
}

function renderAnalytics() {
  harness.render(<DeferredAnalytics />);
}

// arm() only runs on interaction or the safety timer, so boot tests interact
// first. fireIdle/mountAt are awaited so the dynamic-import microtask that
// calls setInsights lands before the assertion.
function interact() {
  act(() => {
    window.dispatchEvent(new Event('pointerdown'));
  });
}

async function fireIdle() {
  await act(async () => {
    idleCb?.({ didTimeout: false, timeRemaining: () => 50 });
  });
}

async function mountAt(t) {
  await act(async () => {
    vi.advanceTimersByTime(t);
  });
}

function insightsRendered() {
  return document.getElementById('speed-insights') !== null;
}

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  harness.unmount();
});

describe('DeferredAnalytics — idle boot path', () => {
  it('renders nothing at boot (analytics never competes with first paint)', () => {
    stubIdleCallback();
    renderAnalytics();
    expect(insightsRendered()).toBe(false);
    expect(harness.container.textContent).toBe('');
  });

  it('does not request idle or boot before any user interaction', async () => {
    stubIdleCallback();
    renderAnalytics();
    expect(idleCb).toBeNull();
    await act(async () => {});
    expect(insightsRendered()).toBe(false);
  });

  it('after an interaction, requests idle with a 3s timeout and boots when idle fires', async () => {
    stubIdleCallback();
    renderAnalytics();
    interact();
    expect(idleOpts).toEqual({ timeout: 3000 });

    await fireIdle();
    expect(insightsRendered()).toBe(true);
  });

  it('boots after a user interaction even if the browser is never idle until the timeout', async () => {
    stubIdleCallback();
    renderAnalytics();
    interact();
    expect(insightsRendered()).toBe(false);

    await fireIdle();
    expect(insightsRendered()).toBe(true);
  });

  it('listens for all interaction signals (pointer, keyboard, scroll, touch)', () => {
    stubIdleCallback();
    renderAnalytics();
    for (const type of ['keydown', 'scroll', 'touchstart']) {
      act(() => {
        window.dispatchEvent(new Event(type));
      });
    }
    expect(idleCb).not.toBeNull();
  });

  it('removes its interaction listeners when unmounted', () => {
    stubIdleCallback();
    renderAnalytics();
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    harness.unmount();
    const removedEvents = removeSpy.mock.calls.map(([name]) => name);
    for (const type of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
      expect(removedEvents).toContain(type);
    }
  });

  it('is best-effort: mounts analytics after idle without throwing', async () => {
    stubIdleCallback();
    renderAnalytics();
    interact();
    await fireIdle();
    expect(insightsRendered()).toBe(true);
  });
});

describe('DeferredAnalytics — timer fallbacks', () => {
  it('boots via the 8s safety timer even with no interaction and no idle callback', async () => {
    // requestIdleCallback deliberately NOT stubbed (absent in some browsers):
    // arm() then falls back to a 2s setTimeout, so boot lands at 10s.
    vi.useFakeTimers();
    renderAnalytics();
    expect(insightsRendered()).toBe(false);
    await mountAt(7999);
    expect(insightsRendered()).toBe(false);
    await mountAt(1);
    expect(insightsRendered()).toBe(false); // safety fired; 2s fallback pending
    await mountAt(2000);
    expect(insightsRendered()).toBe(true);
  });

  it('boots via the 2s fallback timer when idle callback is unavailable', async () => {
    vi.useFakeTimers();
    renderAnalytics();
    interact();
    expect(insightsRendered()).toBe(false);
    await mountAt(1999);
    expect(insightsRendered()).toBe(false);
    await mountAt(1);
    expect(insightsRendered()).toBe(true);
  });

  it('cancels the safety timer once the interaction path already booted', async () => {
    stubIdleCallback();
    vi.useFakeTimers();
    renderAnalytics();
    interact();
    await fireIdle();
    expect(insightsRendered()).toBe(true);
    // Advancing far past the safety deadline must not throw or double-boot.
    expect(() => mountAt(60_000)).not.toThrow();
    expect(insightsRendered()).toBe(true);
  });

  it('does not boot after unmount, even when the safety timer would fire', async () => {
    vi.useFakeTimers();
    renderAnalytics();
    harness.unmount();
    expect(() => mountAt(8000)).not.toThrow();
    expect(insightsRendered()).toBe(false);
  });
});
