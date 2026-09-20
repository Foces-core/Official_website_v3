import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import usePersistentErrorRecovery from '../../src/hooks/usePersistentErrorRecovery.js';
import { createHarness } from './harness.jsx';

vi.mock('../../src/utils/errorRecoveryLogic.js', () => ({
  scheduleErrorAutoReload: vi.fn(() => () => {}),
  shouldEscalateToCacheRecovery: vi.fn(() => false),
  markCacheRecoveryDone: vi.fn(),
}));
vi.mock('../../src/utils/cacheRecovery.js', () => ({
  purgeAppCaches: vi.fn(async () => 0),
  unregisterServiceWorkers: vi.fn(async () => 0),
}));

import {
  scheduleErrorAutoReload,
  shouldEscalateToCacheRecovery,
  markCacheRecoveryDone,
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
});
