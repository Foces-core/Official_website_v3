import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import ErrorBoundary from '../../src/Components/ErrorBoundary/ErrorBoundary.jsx';
import ChunkErrorFallback from '../../src/Components/ErrorFallback/ChunkErrorFallback.jsx';
import { CACHE_RECOVERY_KEY } from '../../src/utils/errorRecoveryLogic.js';
import { createHarness } from './harness.jsx';

const recovery = vi.hoisted(() => ({
  purgeAppCaches: vi.fn(async () => 0),
  unregisterServiceWorkers: vi.fn(async () => 0),
}));

vi.mock('../../src/utils/cacheRecovery.js', () => recovery);

import { purgeAppCaches, unregisterServiceWorkers } from '../../src/utils/cacheRecovery.js';

let reload;
let harness;
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

function FailedChunk() {
  throw new Error('Failed to fetch dynamically imported module');
}

beforeEach(() => {
  sessionStorage.clear();
  recovery.purgeAppCaches.mockClear();
  recovery.unregisterServiceWorkers.mockClear();
  reload = vi.fn();
  vi.stubGlobal('location', { href: window.location.href, reload });
  harness = createHarness();
});

afterEach(() => {
  harness.unmount();
  consoleError.mockClear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('persistent section chunk failure clears stale caches and service worker', async () => {
  harness.render(
    <ErrorBoundary fallback={(error) => <ChunkErrorFallback error={error} />}>
      <FailedChunk />
    </ErrorBoundary>,
  );

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
  });

  expect(harness.container.textContent).toContain('This section failed to load');
  expect(purgeAppCaches).toHaveBeenCalledTimes(1);
  expect(unregisterServiceWorkers).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(CACHE_RECOVERY_KEY)).toBe('1');
  expect(reload).toHaveBeenCalledTimes(1);
});

test('ordinary section render errors get one reload without purging the browser cache', async () => {
  function BrokenSection() {
    throw new Error('section render broke');
  }

  harness.render(
    <ErrorBoundary fallback={(error) => <ChunkErrorFallback error={error} />}>
      <BrokenSection />
    </ErrorBoundary>,
  );

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1250));
  });

  expect(harness.container.textContent).toContain('This section failed to load');
  expect(purgeAppCaches).not.toHaveBeenCalled();
  expect(unregisterServiceWorkers).not.toHaveBeenCalled();
  expect(reload).toHaveBeenCalledTimes(1);
});
