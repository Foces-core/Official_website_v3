import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { acquireScrollLock } from '../../src/utils/scrollLock.js';

// The body scroll-lock was hand-rolled twice (EventPage/Modal and the Navbar
// mobile drawer), neither ref-counted — a nested lock (lightbox over drawer)
// would release scroll while the second overlay was still open. This module
// owns the lock with reference counting; components just acquire/release.

beforeEach(() => {
  document.body.style.overflow = '';
});

afterEach(() => {
  document.body.style.overflow = '';
});

describe('acquireScrollLock', () => {
  it('locks the body when acquired', () => {
    const release = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');
    release();
  });

  it('restores the ORIGINAL overflow value on release', () => {
    document.body.style.overflow = 'auto';
    const release = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('ref-counts nested locks: the body stays locked until the LAST release', () => {
    const first = acquireScrollLock();
    const second = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    first();
    // One overlay closed, the other is still open → still locked
    expect(document.body.style.overflow).toBe('hidden');

    second();
    expect(document.body.style.overflow).toBe('');
  });

  it('stays locked across any number of unbalanced acquisitions', () => {
    const a = acquireScrollLock();
    const b = acquireScrollLock();
    const c = acquireScrollLock();
    a();
    b();
    expect(document.body.style.overflow).toBe('hidden');
    c();
    expect(document.body.style.overflow).toBe('');
  });

  it('release is idempotent — calling it twice does not unlock early', () => {
    const release = acquireScrollLock();
    release();
    release(); // StrictMode double-invoke / cleanup safety
    expect(document.body.style.overflow).toBe('');
  });

  it('an interleaved lock restores exactly once', () => {
    const a = acquireScrollLock();
    const b = acquireScrollLock();
    a();
    const c = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');
    b();
    c();
    expect(document.body.style.overflow).toBe('');
  });

  it('is a no-op without a document (SSR)', () => {
    const savedDoc = globalThis.document;
    delete globalThis.document;
    try {
      const release = acquireScrollLock();
      expect(typeof release).toBe('function');
      expect(() => release()).not.toThrow();
    } finally {
      globalThis.document = savedDoc;
    }
  });
});
