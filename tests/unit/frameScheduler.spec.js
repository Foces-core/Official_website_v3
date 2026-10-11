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

  describe('coalesceToFrame deadline option (early idle fire)', () => {
    // Fake DOM window exposing rAF + requestIdleCallback: the coalescer reads
    // win.requestIdleCallback only when a deadline was passed.
    const fakeWin = () => {
      const idleCallbacks = new Map();
      let idleId = 0;
      return {
        requestAnimationFrame: (cb) => {
          rafCallbacks.set(++rafId, cb);
          return rafId;
        },
        cancelAnimationFrame: (id) => {
          rafCallbacks.delete(id);
        },
        requestIdleCallback: (cb, opts) => {
          idleCallbacks.set(++idleId, { cb, opts });
          return idleId;
        },
        cancelIdleCallback: (id) => {
          idleCallbacks.delete(id);
        },
        fireIdle(timeRemaining = 50, didTimeout = false) {
          const cbs = [...idleCallbacks.values()];
          idleCallbacks.clear();
          cbs.forEach(({ cb }) => cb({ timeRemaining: () => timeRemaining, didTimeout }));
        },
        pendingIdle: idleCallbacks,
      };
    };

    it('fires inside the first idle window with enough budget, without rAF', () => {
      const run = vi.fn();
      const win = fakeWin();
      const schedule = coalesceToFrame(run, win, { deadlineMs: 8 });
      schedule();
      schedule();
      schedule();
      win.fireIdle(50);
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('falls back to the next rAF when the idle window offers no budget', () => {
      const run = vi.fn();
      const win = fakeWin();
      const schedule = coalesceToFrame(run, win, { deadlineMs: 8 });
      schedule();
      win.fireIdle(2); // not enough budget, no timeout
      expect(run).not.toHaveBeenCalled();
      fireFrame();
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('runs immediately when the idle deadline times out', () => {
      const run = vi.fn();
      const win = fakeWin();
      const schedule = coalesceToFrame(run, win, { deadlineMs: 8 });
      schedule();
      win.fireIdle(0, true); // didTimeout
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('coalesces across the idle+rAF mixed path (only one run total)', () => {
      const run = vi.fn();
      const win = fakeWin();
      const schedule = coalesceToFrame(run, win, { deadlineMs: 8 });
      schedule();
      win.fireIdle(2); // low budget -> schedules rAF
      schedule(); // coalesced with the pending rAF
      fireFrame();
      win.fireIdle(50); // nothing pending anymore
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('cancel drops both the idle and rAF pending work', () => {
      const run = vi.fn();
      const win = fakeWin();
      const schedule = coalesceToFrame(run, win, { deadlineMs: 8 });
      schedule();
      win.fireIdle(2); // re-scheduled onto rAF
      schedule.cancel();
      win.fireIdle(50);
      fireFrame();
      expect(run).not.toHaveBeenCalled();
    });

    it('ignores a deadline when requestIdleCallback is missing', () => {
      const run = vi.fn();
      const schedule = coalesceToFrame(
        run,
        {
          requestAnimationFrame: (cb) => rafCallbacks.set(++rafId, cb),
          cancelAnimationFrame: (id) => rafCallbacks.delete(id),
        },
        { deadlineMs: 8 },
      );
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
