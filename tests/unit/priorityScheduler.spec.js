import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  scheduleBackgroundTask,
  scheduleUserBlockingTask,
  prioritizeAssetFetch,
} from '../../src/utils/priorityScheduler.js';

// The seam is the scheduler's public promise API: each function must resolve
// with the task's result (or undefined when the task throws) on every
// fallback path — never reject, since a rejected "background" task would
// surface as an unhandled rejection.

// postTask mock that faithfully rejects when the task throws, like the real
// Prioritized Task Scheduling API does.
function stubPostTask() {
  const postTask = vi.fn((taskFn) => Promise.resolve().then(taskFn));
  vi.stubGlobal('navigator', { scheduling: { postTask } });
  return postTask;
}

function stubRequestAnimationFrame() {
  const raf = vi.fn((cb) => {
    cb(Date.now());
    return 1;
  });
  vi.stubGlobal('requestAnimationFrame', raf);
  return raf;
}

function stubRequestIdleCallback() {
  const ric = vi.fn((cb) => {
    cb();
    return 1;
  });
  vi.stubGlobal('requestIdleCallback', ric);
  return ric;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('scheduleBackgroundTask', () => {
  it('resolves with the task result via postTask (priority background)', async () => {
    const postTask = stubPostTask();
    await expect(scheduleBackgroundTask(() => 42)).resolves.toBe(42);
    expect(postTask).toHaveBeenCalledTimes(1);
    expect(postTask.mock.calls[0][1]).toEqual({ priority: 'background' });
  });

  it('falls back to requestIdleCallback when postTask is unavailable', async () => {
    const ric = stubRequestIdleCallback();
    await expect(scheduleBackgroundTask(() => 'idle')).resolves.toBe('idle');
    expect(ric).toHaveBeenCalledTimes(1);
  });

  it('falls back to a 200ms timeout when neither postTask nor idle callback exists', async () => {
    const timer = vi.spyOn(globalThis, 'setTimeout');
    await expect(scheduleBackgroundTask(() => 'late')).resolves.toBe('late');
    expect(timer).toHaveBeenCalledWith(expect.any(Function), 200);
  });

  it('contains a throwing task on the postTask path (resolves undefined, never rejects)', async () => {
    stubPostTask();
    await expect(
      scheduleBackgroundTask(() => Promise.reject(new Error('boom'))),
    ).resolves.toBeUndefined();
  });

  it('contains a throwing task on the idle-callback path', async () => {
    stubRequestIdleCallback();
    await expect(
      scheduleBackgroundTask(() => {
        throw new Error('boom');
      }),
    ).resolves.toBeUndefined();
  });

  it('contains a throwing task on the 200ms timeout path', async () => {
    await expect(
      scheduleBackgroundTask(() => {
        throw new Error('boom');
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for a non-function argument', async () => {
    await expect(scheduleBackgroundTask(undefined)).resolves.toBeUndefined();
    await expect(scheduleBackgroundTask('nope')).resolves.toBeUndefined();
  });
});

describe('scheduleUserBlockingTask', () => {
  it('resolves with the task result via postTask (priority user-blocking)', async () => {
    const postTask = stubPostTask();
    await expect(scheduleUserBlockingTask(() => 'fast')).resolves.toBe('fast');
    expect(postTask.mock.calls[0][1]).toEqual({ priority: 'user-blocking' });
  });

  it('falls back to requestAnimationFrame when postTask is unavailable', async () => {
    const raf = stubRequestAnimationFrame();
    await expect(scheduleUserBlockingTask(() => 7)).resolves.toBe(7);
    expect(raf).toHaveBeenCalledTimes(1);
  });

  it('contains a throwing task on the postTask path', async () => {
    stubPostTask();
    await expect(
      scheduleUserBlockingTask(() => Promise.reject(new Error('boom'))),
    ).resolves.toBeUndefined();
  });

  it('contains a throwing task on the rAF fallback path', async () => {
    stubRequestAnimationFrame();
    await expect(
      scheduleUserBlockingTask(() => {
        throw new Error('boom');
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for a non-function argument', async () => {
    await expect(scheduleUserBlockingTask(undefined)).resolves.toBeUndefined();
    await expect(scheduleUserBlockingTask('nope')).resolves.toBeUndefined();
  });
});

describe('prioritizeAssetFetch', () => {
  let images;

  function stubImage({ withFetchPriority = false } = {}) {
    images = [];
    function FakeImage() {
      images.push(this);
    }
    if (withFetchPriority) FakeImage.prototype.fetchPriority = '';
    vi.stubGlobal('Image', FakeImage);
  }

  it('prefetches the URL with fetchPriority=high when the browser supports it', async () => {
    stubPostTask();
    stubImage({ withFetchPriority: true });
    prioritizeAssetFetch('/assets/hero-fp.webp');
    await Promise.resolve();
    expect(images).toHaveLength(1);
    expect(images[0].src).toBe('/assets/hero-fp.webp');
    expect(images[0].fetchPriority).toBe('high');
  });

  it('still prefetches when fetchPriority is unsupported', async () => {
    stubPostTask();
    stubImage();
    prioritizeAssetFetch('/assets/hero-plain.webp');
    await Promise.resolve();
    expect(images).toHaveLength(1);
    expect(images[0].src).toBe('/assets/hero-plain.webp');
  });

  it('dedupes repeat requests for the same URL', async () => {
    stubPostTask();
    stubImage();
    prioritizeAssetFetch('/assets/hero-dedupe.webp');
    prioritizeAssetFetch('/assets/hero-dedupe.webp');
    await Promise.resolve();
    expect(images).toHaveLength(1);
  });

  it('ignores empty or non-string URLs', async () => {
    stubPostTask();
    stubImage();
    prioritizeAssetFetch('');
    prioritizeAssetFetch('   ');
    prioritizeAssetFetch(null);
    await Promise.resolve();
    expect(images).toHaveLength(0);
  });
});
