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

  // Note: the `originalOverflow ?? ''` nullish fallback (release path) is
  // deliberately left uncovered — originalOverflow is always written by the
  // first acquire of a lock chain, so the null side is unreachable through
  // the public API. It is a defensive guard against future refactors.

  it('is a no-op when the document exists but has no <body> yet', () => {
    const bodyDesc = Object.getOwnPropertyDescriptor(document, 'body');
    Object.defineProperty(document, 'body', { value: null, configurable: true });
    try {
      const release = acquireScrollLock();
      expect(typeof release).toBe('function');
      expect(() => release()).not.toThrow();
      expect(document.body).toBeNull(); // untouched by the no-op
    } finally {
      if (bodyDesc) Object.defineProperty(document, 'body', bodyDesc);
      else delete document.body;
    }
  });
});
