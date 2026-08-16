import { describe, it, expect } from 'vitest';
import {
  isNonEmptyString,
  isNumber,
  findDuplicateWidth,
  checkUniqueKey,
} from '../../src/utils/validationRules.js';

describe('validationRules schema helpers', () => {
  describe('isNonEmptyString', () => {
    it('returns true for strings with non-whitespace content', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  a  ')).toBe(true);
    });

    it('returns false for non-strings and blank strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('returns true for finite numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-4.5)).toBe(true);
    });

    it('returns false for NaN, Infinity, and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
    });
  });

  describe('findDuplicateWidth', () => {
    it('returns null when all candidate URLs have distinct or singular widths', () => {
      expect(findDuplicateWidth('/a.webp 800w, /b.webp 1200w')).toBeNull();
    });

    it('returns [url, width1, width2] when the same URL has conflicting width descriptors', () => {
      const dup = findDuplicateWidth('/a.webp 800w, /a.webp 1200w');
      expect(dup).toEqual(['/a.webp', '800', '1200']);
    });

    it('returns null for empty or invalid inputs', () => {
      expect(findDuplicateWidth('')).toBeNull();
      expect(findDuplicateWidth(null)).toBeNull();
    });
  });

  describe('checkUniqueKey', () => {
    it('adds unique keys to set and returns true without pushing problems', () => {
      const seen = new Set();
      const problems = [];

      const ok1 = checkUniqueKey(seen, 'key1', 'duplicate key1', problems);
      expect(ok1).toBe(true);
      expect(seen.has('key1')).toBe(true);
      expect(problems).toHaveLength(0);

      const ok2 = checkUniqueKey(seen, 'key2', 'duplicate key2', problems);
      expect(ok2).toBe(true);
      expect(seen.has('key2')).toBe(true);
      expect(problems).toHaveLength(0);
    });

    it('pushes problem message and returns false when key is already in set', () => {
      const seen = new Set(['key1']);
      const problems = [];

      const ok = checkUniqueKey(seen, 'key1', 'duplicate key1', problems);
      expect(ok).toBe(false);
      expect(problems).toEqual(['duplicate key1']);
    });
  });
});
