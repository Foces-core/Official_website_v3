import { describe, it, expect } from 'vitest';
import {
  SENTRY_IGNORE_ERRORS,
  SENTRY_DENY_URLS,
  isIgnorableMessage,
  isDeniedUrl,
  shouldDropSentryEvent,
} from '../../src/utils/sentryFilter.js';

describe('sentryFilter', () => {
  it('exports ignore lists', () => {
    expect(SENTRY_IGNORE_ERRORS.length).toBeGreaterThan(5);
    expect(SENTRY_DENY_URLS.length).toBeGreaterThan(2);
  });

  it('isIgnorableMessage matches chunk and ResizeObserver noise', () => {
    expect(isIgnorableMessage('Loading chunk 123 failed')).toBe(true);
    expect(isIgnorableMessage('ChunkLoadError: Loading chunk 5 failed')).toBe(true);
    expect(isIgnorableMessage('ResizeObserver loop limit exceeded')).toBe(true);
    expect(isIgnorableMessage('Failed to fetch dynamically imported module: ...')).toBe(true);
    expect(isIgnorableMessage('Real TypeError: cannot read property')).toBe(false);
    expect(isIgnorableMessage('')).toBe(false);
    expect(isIgnorableMessage(null)).toBe(false);
  });

  it('isDeniedUrl matches extensions', () => {
    expect(isDeniedUrl('chrome-extension://abc/background.js')).toBe(true);
    expect(isDeniedUrl('moz-extension://xyz/content.js')).toBe(true);
    expect(isDeniedUrl('https://focess-five.vercel.app/assets/index.js')).toBe(false);
    expect(isDeniedUrl('')).toBe(false);
    expect(isDeniedUrl(null)).toBe(false);
  });

  it('shouldDropSentryEvent drops extension frames', () => {
    const event = {
      request: { url: 'chrome-extension://abc/inject.js' },
      exception: {
        values: [
          {
            value: 'Error',
            stacktrace: { frames: [{ filename: 'chrome-extension://abc/inject.js' }] },
          },
        ],
      },
    };
    expect(shouldDropSentryEvent(event, {})).toBe(true);
  });

  it('shouldDropSentryEvent drops ignorable messages', () => {
    const event = { exception: { values: [{ value: 'ResizeObserver loop limit exceeded' }] } };
    expect(shouldDropSentryEvent(event, {})).toBe(true);
    const ok = { exception: { values: [{ value: 'TypeError: x is not a function' }] } };
    expect(shouldDropSentryEvent(ok, {})).toBe(false);
  });

  it('shouldDropSentryEvent drops AbortError type', () => {
    const event = { exception: { values: [{ type: 'AbortError', value: 'Fetch is aborted' }] } };
    expect(shouldDropSentryEvent(event, {})).toBe(true);
  });

  it('shouldDropSentryEvent checks hint originalException', () => {
    const event = { exception: { values: [{ value: 'Error' }] } };
    const hint = { originalException: new Error('Loading chunk 42 failed') };
    expect(shouldDropSentryEvent(event, hint)).toBe(true);
  });
});
