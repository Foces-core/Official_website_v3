import { describe, it, expect } from 'vitest';
import { ERAS, ROLE_FILTERS, execomArchive } from '../../src/data/execomArchive.js';

describe('execomArchive', () => {
  it('keeps batches ordered newest-first with known eras', () => {
    const eraIds = new Set(ERAS.map((e) => e.id));
    for (const batch of execomArchive) {
      expect(eraIds.has(batch.era)).toBe(true);
      expect(batch.title).toContain('Execom');
      expect(Array.isArray(batch.members)).toBe(true);
    }
    expect(execomArchive[0].year).toBe('2024-25');
  });

  it('keeps every member complete and categorised', () => {
    const categories = new Set(ROLE_FILTERS.filter((r) => r.id !== 'all').map((r) => r.id));
    const total = execomArchive.flatMap((b) => b.members);
    expect(total.length).toBeGreaterThanOrEqual(25);
    for (const m of total) {
      expect(m.name).toBeTruthy();
      expect(m.role).toBeTruthy();
      expect(m.company).toBeTruthy();
      expect(categories.has(m.category)).toBe(true);
      expect(m.img).toBeUndefined();
    }
  });
});
