import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import usePersistentErrorRecovery from '../../src/hooks/usePersistentErrorRecovery.js';
import { createHarness } from './harness.jsx';

vi.mock('../../src/utils/errorRecoveryLogic.js', () => ({
  scheduleErrorAutoReload: vi.fn(() => () => {}),
  shouldEscalateToCacheRecovery: vi.fn(() => false),
  markCacheRecoveryDone: vi.fn(),
  isOffline: vi.fn(() => false),
}));
vi.mock('../../src/utils/cacheRecovery.js', () => ({
  purgeAppCaches: vi.fn(async () => 0),
  unregisterServiceWorkers: vi.fn(async () => 0),
}));

import {
  scheduleErrorAutoReload,
  shouldEscalateToCacheRecovery,
  markCacheRecoveryDone,
  isOffline,
} from '../../src/utils/errorRecoveryLogic.js';
import { purgeAppCaches, unregisterServiceWorkers } from '../../src/utils/cacheRecovery.js';

function Probe() {
  usePersistentErrorRecovery({ delayMs: 5 });
  return null;
}

describe('usePersistentErrorRecovery', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
    vi.clearAllMocks();
    shouldEscalateToCacheRecovery.mockReturnValue(false);
    isOffline.mockReturnValue(false);
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('schedules the plain auto-reload on a first error', () => {
    act(() => harness.render(<Probe />));
    expect(scheduleErrorAutoReload).toHaveBeenCalledWith({ delayMs: 5 });
    expect(purgeAppCaches).not.toHaveBeenCalled();
  });

  it('escalates on a persistent error: mark, purge, unregister, reload', async () => {
    shouldEscalateToCacheRecovery.mockReturnValue(true);
    markCacheRecoveryDone.mockReturnValue(true);
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });

    act(() => harness.render(<Probe />));
    expect(markCacheRecoveryDone).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(purgeAppCaches).toHaveBeenCalledTimes(1);
    expect(unregisterServiceWorkers).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('cancel handle stops nothing on unmount (no post-unmount reload)', async () => {
    shouldEscalateToCacheRecovery.mockReturnValue(true);
    markCacheRecoveryDone.mockReturnValue(true);
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });

    act(() => harness.render(<Probe />));
    act(() => harness.unmount());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(reload).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('defers persistent-error escalation until the connection returns', () => {
    shouldEscalateToCacheRecovery.mockReturnValue(true);
    isOffline.mockReturnValue(true);
    act(() => harness.render(<Probe />));
    expect(purgeAppCaches).not.toHaveBeenCalled();
    expect(unregisterServiceWorkers).not.toHaveBeenCalled();

    isOffline.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('online')));
    expect(markCacheRecoveryDone).toHaveBeenCalledTimes(1);
  });

  it('resumes cache escalation when purge finishes offline and connection returns', async () => {
    shouldEscalateToCacheRecovery.mockReturnValue(true);
    markCacheRecoveryDone.mockReturnValue(true);
    let resolvePurge;
    purgeAppCaches.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePurge = resolve;
      }),
    );
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });

    act(() => harness.render(<Probe />));
    expect(purgeAppCaches).toHaveBeenCalledTimes(1);

    isOffline.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('offline')));
    await act(async () => {
      resolvePurge(0);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(unregisterServiceWorkers).not.toHaveBeenCalled();

    isOffline.mockReturnValue(false);
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(purgeAppCaches).toHaveBeenCalledTimes(1);
    expect(unregisterServiceWorkers).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('does not repeat completed escalation when connection returns before purge settles', async () => {
    shouldEscalateToCacheRecovery.mockReturnValue(true);
    markCacheRecoveryDone.mockReturnValue(true);
    let resolvePurge;
    purgeAppCaches.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePurge = resolve;
      }),
    );
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });

    act(() => harness.render(<Probe />));
    isOffline.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('offline')));
    isOffline.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('online')));

    await act(async () => {
      resolvePurge(0);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(purgeAppCaches).toHaveBeenCalledTimes(1);
    expect(unregisterServiceWorkers).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('cancels and reschedules the first-error reload across a connection flap', () => {
    const cancel = vi.fn();
    scheduleErrorAutoReload.mockReturnValue(cancel);
    act(() => harness.render(<Probe />));
    expect(scheduleErrorAutoReload).toHaveBeenCalledTimes(1);

    isOffline.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(cancel).toHaveBeenCalledTimes(1);

    isOffline.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('online')));
    expect(scheduleErrorAutoReload).toHaveBeenCalledTimes(2);
  });

  it('does not purge caches when the escalation guard cannot be persisted', () => {
    shouldEscalateToCacheRecovery.mockReturnValue(true);
    markCacheRecoveryDone.mockReturnValue(false);
    act(() => harness.render(<Probe />));
    expect(purgeAppCaches).not.toHaveBeenCalled();
    expect(unregisterServiceWorkers).not.toHaveBeenCalled();
  });
});
