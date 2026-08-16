import { describe, it, expect, beforeEach } from 'vitest';
import {
  DRAFT_STORAGE_KEY,
  loadContactDraft,
  saveContactDraft,
  clearContactDraft,
} from '../../src/utils/contactDraft.js';

describe('contactDraft persistence', () => {
  let mockStorage;

  beforeEach(() => {
    const store = new Map();
    mockStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    };
  });

  it('returns default empty values when storage is empty', () => {
    expect(loadContactDraft(mockStorage)).toEqual({
      name: '',
      email: '',
      subject: '',
      message: '',
      website: '',
    });
  });

  it('saves and loads a valid contact form draft', () => {
    const draft = {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      subject: 'Compiler',
      message: 'Bug found',
      website: 'ignored-bot-field',
    };

    saveContactDraft(draft, mockStorage);
    const loaded = loadContactDraft(mockStorage);

    expect(loaded).toEqual({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      subject: 'Compiler',
      message: 'Bug found',
      website: '', // Honeypot never restored
    });
  });

  it('removes storage entry when all fields are empty or blank', () => {
    saveContactDraft(
      { name: 'Grace', email: 'grace@example.com', subject: '', message: '' },
      mockStorage,
    );
    expect(mockStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();

    saveContactDraft({ name: '  ', email: '', subject: '', message: '' }, mockStorage);
    expect(mockStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clears storage entry via clearContactDraft', () => {
    saveContactDraft({ name: 'Grace', email: 'g@e.com', subject: 'S', message: 'M' }, mockStorage);
    expect(mockStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();

    clearContactDraft(mockStorage);
    expect(mockStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('recovers gracefully from corrupted JSON data in storage', () => {
    mockStorage.setItem(DRAFT_STORAGE_KEY, '{invalid-json');
    expect(loadContactDraft(mockStorage)).toEqual({
      name: '',
      email: '',
      subject: '',
      message: '',
      website: '',
    });
  });

  it('handles throwing storage (e.g. Safari private mode restrictions)', () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error('QuotaExceededError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('QuotaExceededError');
      },
    };

    expect(() => loadContactDraft(throwingStorage)).not.toThrow();
    expect(loadContactDraft(throwingStorage)).toEqual({
      name: '',
      email: '',
      subject: '',
      message: '',
      website: '',
    });
    expect(() => saveContactDraft({ name: 'Test' }, throwingStorage)).not.toThrow();
    expect(() => clearContactDraft(throwingStorage)).not.toThrow();
  });
});
