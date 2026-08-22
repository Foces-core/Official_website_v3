import { describe, it, expect } from 'vitest';
import {
  safeSessionGet,
  safeSessionSet,
  safeSessionRemove,
  safeSessionHas,
} from '../../src/utils/safeStorage.js';

describe('safeStorage pure helpers', () => {
  it('reads, writes, checks, and removes from working storage', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k),
    };

    expect(safeSessionGet('key1', 'default', mockStorage)).toBe('default');
    expect(safeSessionHas('key1', mockStorage)).toBe(false);

    expect(safeSessionSet('key1', 'value1', mockStorage)).toBe(true);
    expect(safeSessionGet('key1', 'default', mockStorage)).toBe('value1');
    expect(safeSessionHas('key1', mockStorage)).toBe(true);

    expect(safeSessionRemove('key1', mockStorage)).toBe(true);
    expect(safeSessionGet('key1', 'default', mockStorage)).toBe('default');
  });

  it('gracefully tolerates throwing storage (Safari Private mode / blocked storage)', () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error('SecurityError: The operation is insecure.');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };

    expect(safeSessionGet('any', 'fallback', throwingStorage)).toBe('fallback');
    expect(safeSessionSet('any', 'val', throwingStorage)).toBe(false);
    expect(safeSessionRemove('any', throwingStorage)).toBe(false);
    expect(safeSessionHas('any', throwingStorage)).toBe(false);
  });

  it('handles null / undefined storage gracefully', () => {
    expect(safeSessionGet('k', 'def', null)).toBe('def');
    expect(safeSessionSet('k', 'v', null)).toBe(false);
    expect(safeSessionRemove('k', null)).toBe(false);
    expect(safeSessionHas('k', null)).toBe(false);
  });

  it('safeSessionSet coerces non-string values to strings', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k),
    };
    expect(safeSessionSet('n', 123, mockStorage)).toBe(true);
    expect(safeSessionGet('n', null, mockStorage)).toBe('123');
  });

  it('safeSessionGet with no default returns null for missing key', () => {
    const memory = new Map();
    const mockStorage = { getItem: (k) => memory.get(k) ?? null };
    expect(safeSessionGet('missing', undefined, mockStorage)).toBeNull();
  });
});
