import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { coalesceToFrame, deferToNextPaint } from '../../src/utils/frameScheduler.js';

describe('frameScheduler', () => {
  let rafCallbacks;
  let rafId;

  beforeEach(() => {
    rafId = 0;
    rafCallbacks = new Map();
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      rafCallbacks.set(++rafId, cb);
      return rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const fireFrame = () => {
    const cbs = [...rafCallbacks.values()];
    rafCallbacks.clear();
    cbs.forEach((cb) => cb());
  };

  describe('coalesceToFrame', () => {
    it('coalesces any number of calls within a frame into a single run', () => {
      const run = vi.fn();
      const schedule = coalesceToFrame(run);
      schedule();
      schedule();
      schedule();
      expect(run).not.toHaveBeenCalled();
      fireFrame();
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('schedules again after a frame has fired', () => {
      const run = vi.fn();
      const schedule = coalesceToFrame(run);
      schedule();
      fireFrame();
      schedule();
      fireFrame();
      expect(run).toHaveBeenCalledTimes(2);
    });

    it('cancel() drops a pending run', () => {
      const run = vi.fn();
      const schedule = coalesceToFrame(run);
      schedule();
      schedule.cancel();
      fireFrame();
      expect(run).not.toHaveBeenCalled();
    });

    it('is idempotent when cancelled twice or scheduled after cancel', () => {
      const run = vi.fn();
      const schedule = coalesceToFrame(run);
      schedule();
      schedule.cancel();
      schedule.cancel(); // no-op
      schedule();
      fireFrame();
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe('deferToNextPaint', () => {
    it('runs callback only after two animation frames', () => {
      const cb = vi.fn();
      deferToNextPaint(cb);

      expect(cb).not.toHaveBeenCalled();
      fireFrame(); // frame 1
      expect(cb).not.toHaveBeenCalled();
      fireFrame(); // frame 2
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('cancel handle stops execution when cancelled on frame 1', () => {
      const cb = vi.fn();
      const cancel = deferToNextPaint(cb);

      cancel();
      fireFrame();
      fireFrame();
      expect(cb).not.toHaveBeenCalled();
    });

    it('cancel handle stops execution when cancelled between frame 1 and frame 2', () => {
      const cb = vi.fn();
      const cancel = deferToNextPaint(cb);

      fireFrame(); // frame 1 scheduled frame 2
      cancel();
      fireFrame(); // frame 2
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
