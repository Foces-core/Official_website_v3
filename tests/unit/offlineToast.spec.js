import { describe, it, expect } from 'vitest';
import { nextOfflineVisible } from '../../src/utils/offlineToast.js';

describe('offlineToast visibility policy', () => {
  it('shows the toast while offline', () => {
    expect(nextOfflineVisible(false)).toBe(true);
  });

  it('hides the toast while online — no interruption when nothing is wrong', () => {
    expect(nextOfflineVisible(true)).toBe(false);
  });

  it('stays hidden on unknown state (never false-alarm)', () => {
    expect(nextOfflineVisible(undefined)).toBe(false);
  });
});
