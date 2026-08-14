import { describe, it, expect, beforeEach } from 'vitest';
import { readSessionFlag, writeSessionFlag } from '../../src/utils/sessionCookie.js';

// The seam is the two tiny cookie helpers InstallPrompt uses to show its
// install toast at most once per browser session: readSessionFlag must only
// match the exact `name=1` pair (a startsWith would also match
// foces-install-seen=10), and writeSessionFlag must set a session cookie
// (no Max-Age/Expires) that survives StrictMode's double-invoke.

const COOKIE = 'foces-install-seen';

// document.cookie only returns name=value pairs — it omits Expires/Max-Age,
// so session scope can't be verified through reads. Intercept the setter and
// assert the raw assignment string instead.
let rawAssignments;

beforeEach(() => {
  // jsdom exposes `cookie` on a prototype, not the instance — walk the chain
  // to find the real accessor before shadowing it on the instance.
  let proto = document;
  let descriptor = null;
  while (proto && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(proto, 'cookie');
    proto = Object.getPrototypeOf(proto);
  }
  rawAssignments = [];
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => descriptor.get.call(document),
    set: (value) => {
      rawAssignments.push(value);
      descriptor.set.call(document, value);
    },
  });
  document.cookie = `${COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
});

describe('readSessionFlag', () => {
  it('is false when the cookie is absent', () => {
    expect(readSessionFlag(COOKIE)).toBe(false);
  });

  it('is true when the exact name=1 pair is present', () => {
    document.cookie = `${COOKIE}=1; SameSite=Lax; path=/`;
    expect(readSessionFlag(COOKIE)).toBe(true);
  });

  it('does NOT match a value-prefixed twin (exact pair match, not startsWith)', () => {
    document.cookie = `${COOKIE}=10; SameSite=Lax; path=/`;
    expect(readSessionFlag(COOKIE)).toBe(false);
  });

  it('ignores unrelated cookies', () => {
    document.cookie = 'other=1; path=/';
    expect(readSessionFlag(COOKIE)).toBe(false);
  });

  it('is safe without a document (SSR)', () => {
    const saved = globalThis.document;
    delete globalThis.document;
    try {
      expect(readSessionFlag(COOKIE)).toBe(false);
      expect(() => writeSessionFlag(COOKIE)).not.toThrow();
    } finally {
      globalThis.document = saved;
    }
  });
});

describe('writeSessionFlag', () => {
  it('sets a session-scoped cookie (no Max-Age/Expires) that readSessionFlag then sees', () => {
    writeSessionFlag(COOKIE);
    expect(readSessionFlag(COOKIE)).toBe(true);
    // The raw assignment must be the exact session cookie — no Expires, no
    // Max-Age (both would make it persistent and nag every page load).
    const last = rawAssignments[rawAssignments.length - 1];
    expect(last).toBe(`${COOKIE}=1; SameSite=Lax; path=/`);
    expect(last.toLowerCase()).not.toContain('expires=');
    expect(last.toLowerCase()).not.toContain('max-age=');
  });

  it('is idempotent — StrictMode double-invoke is harmless', () => {
    writeSessionFlag(COOKIE);
    writeSessionFlag(COOKIE);
    expect(readSessionFlag(COOKIE)).toBe(true);
  });
});
