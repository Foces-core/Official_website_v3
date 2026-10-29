import { describe, it, expect } from 'vitest';
import { execomArchive } from '../../src/data/execomArchive.js';

describe('execomArchive', () => {
  it('keeps batches ordered newest-first with a title per batch', () => {
    expect(execomArchive[0].year).toBe('2025-26');
    for (const batch of execomArchive) {
      expect(batch.year).toBeTruthy();
      expect(batch.title).toContain('Execom');
      expect(typeof batch.groupSub).toBe('string');
      // photo is either a wired asset or an empty placeholder slot
      if (batch.photo) expect(batch.photoSmall).toBeTruthy();
    }
  });
});
