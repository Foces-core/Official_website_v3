import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextGateToArmAtIdle } from '../../src/Components/ScrollGate/scrollGateLogic.js';
import {
  registerDeferredGate,
  notifyLoadDone,
  setGateSnapshotProvider,
  resetGateCoordinator,
} from '../../src/Components/ScrollGate/gateIdleCoordinator.js';

describe('nextGateToArmAtIdle', () => {
  const VIEWPORT = 800;

  it('arms the first un-armed gate when no position info is available', () => {
    const next = nextGateToArmAtIdle({
      ids: ['about', 'featuring', 'events'],
      viewportHeight: VIEWPORT,
      armedIds: [],
    });
    expect(next).toBe('about');
  });

  it('skips gates already armed or mounted', () => {
    const next = nextGateToArmAtIdle({
      ids: ['about', 'featuring', 'events'],
      viewportHeight: VIEWPORT,
      armedIds: ['about', 'featuring'],
    });
    expect(next).toBe('events');
  });

  it('skips a gate whose placeholder is beyond the pre-load margin, plus later gates', () => {
    // featured far below fold, and its successor even farther — neither should
    // be prerendered during idle: pulling their chunks costs real CPU/bytes in
    // the exact window that must stay free for first-interaction latency.
    const next = nextGateToArmAtIdle({
      ids: ['about', 'featuring', 'events'],
      tops: [1200, 2400, 4000],
      viewportHeight: VIEWPORT,
      armedIds: ['about'],
    });
    expect(next).toBeNull();
  });

  it('arms the next un-armed gate whose placeholder is within the margin', () => {
    const next = nextGateToArmAtIdle({
      ids: ['about', 'featuring', 'events'],
      tops: [1100, 1200, 4000],
      viewportHeight: VIEWPORT,
      armedIds: ['about'],
    });
    expect(next).toBe('featuring');
  });

  it('stays null when the first un-armed gate sits beyond the pre-load margin', () => {
    // about is armed; featuring just mounted (top scrolls away); events sits
    // far below — arming it would pull a chunk nobody is about to see.
    const next = nextGateToArmAtIdle({
      ids: ['about', 'featuring', 'events'],
      tops: [1100, 2400, 4000],
      viewportHeight: VIEWPORT,
      armedIds: ['about', 'featuring'],
    });
    expect(next).toBeNull();
  });

  it('returns null when everything is armed', () => {
    const next = nextGateToArmAtIdle({
      ids: ['about', 'events'],
      viewportHeight: VIEWPORT,
      armedIds: ['about', 'events'],
    });
    expect(next).toBeNull();
  });

  it('returns null with no ids', () => {
    expect(nextGateToArmAtIdle({ ids: [], viewportHeight: VIEWPORT })).toBeNull();
    expect(nextGateToArmAtIdle({})).toBeNull();
  });
});

describe('gateIdleCoordinator', () => {
  const realWindow = globalThis.window;

  beforeEach(() => {
    resetGateCoordinator();
  });

  afterEach(() => {
    resetGateCoordinator();
    setGateSnapshotProvider(null);
    if (realWindow === undefined) delete globalThis.window;
    else globalThis.window = realWindow;
  });

  const fakeWindow = ({ idleAble }) => {
    const listeners = new Map();
    // Minimal window stand-in: only what the coordinator touches.
    const w = {
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      },
      removeEventListener(type, fn) {
        listeners.get(type)?.delete(fn);
      },
      requestIdleCallback: idleAble
        ? (cb) => {
            setTimeout(() => cb({ timeRemaining: () => 50, didTimeout: false }), 1);
            return 1;
          }
        : undefined,
      cancelIdleCallback: idleAble ? () => {} : undefined,
    };
    return {
      w,
      listeners,
      fire(type) {
        listeners.get(type)?.forEach((fn) => fn());
      },
    };
  };

  const flush = (ms) => vi.advanceTimersByTimeAsync(ms);

  it('arms the first registered gate when no snapshot provider is wired', async () => {
    vi.useFakeTimers();
    const { w } = fakeWindow({ idleAble: true });
    globalThis.window = w;

    const armA = vi.fn();
    const armB = vi.fn();
    registerDeferredGate('featuring', armB);
    registerDeferredGate('about', armA);

    notifyLoadDone();
    await flush(1600); // 1500ms delay + 1ms idle cb + buffer

    expect(armB).toHaveBeenCalledTimes(1);
    expect(armA).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('aborts the idle arm when a scroll happens before the timer fires', async () => {
    vi.useFakeTimers();
    const { w, fire } = fakeWindow({ idleAble: true });
    globalThis.window = w;

    const arm = vi.fn();
    registerDeferredGate('about', arm);
    notifyLoadDone();

    await flush(600); // before the 1500ms delay fires
    fire('scroll');
    await flush(2000);

    expect(arm).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not arm when window is missing (SSR safety)', () => {
    delete globalThis.window;
    const arm = vi.fn();
    registerDeferredGate('about', arm);
    expect(() => notifyLoadDone()).not.toThrow();
    expect(arm).not.toHaveBeenCalled();
  });

  it('uses the snapshot provider to pick the target gate', async () => {
    vi.useFakeTimers();
    const { w } = fakeWindow({ idleAble: true });
    globalThis.window = w;

    setGateSnapshotProvider(() => ({
      ids: ['about', 'featuring'],
      tops: [1100, 1200],
      viewportHeight: 800,
      armedIds: ['about'],
    }));

    const armAbout = vi.fn();
    const armFeaturing = vi.fn();
    registerDeferredGate('about', armAbout);
    registerDeferredGate('featuring', armFeaturing);

    notifyLoadDone();
    await flush(1600);

    expect(armFeaturing).toHaveBeenCalledTimes(1);
    expect(armAbout).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
