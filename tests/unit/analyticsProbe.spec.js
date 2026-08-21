import { describe, it, expect, vi } from 'vitest';
import {
  VERCEL_INSIGHTS_ROUTE,
  isVercelScriptResponse,
  mountAnalyticsIfServed,
  probeServesScript,
} from '../../src/utils/analyticsProbe.js';
import { analyticsArmed } from '../../src/utils/DeferredAnalytics.jsx';

describe('probeServesScript', () => {
  it('resolves false when no fetch implementation exists', async () => {
    await expect(probeServesScript(undefined, VERCEL_INSIGHTS_ROUTE)).resolves.toBe(false);
  });
  it('resolves true when the platform serves JavaScript', async () => {
    const fetchFn = vi.fn(() =>
      Promise.resolve({ ok: true, headers: { get: () => 'application/javascript' } }),
    );
    await expect(probeServesScript(fetchFn, VERCEL_INSIGHTS_ROUTE)).resolves.toBe(true);
    expect(fetchFn).toHaveBeenCalledWith(VERCEL_INSIGHTS_ROUTE, { method: 'HEAD' });
  });
  it('resolves false when the response is not a JavaScript 2xx', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ ok: true, headers: { get: () => 'text/html' } }));
    await expect(probeServesScript(fetchFn, VERCEL_INSIGHTS_ROUTE)).resolves.toBe(false);
  });
  it('resolves false when the probe request itself fails', async () => {
    const fetchFn = vi.fn(() => Promise.reject(new Error('offline')));
    await expect(probeServesScript(fetchFn, VERCEL_INSIGHTS_ROUTE)).resolves.toBe(false);
  });
});

describe('analyticsArmed', () => {
  it('false until the boot phase is done', () => {
    expect(analyticsArmed(false, null, null)).toBe(false);
    expect(analyticsArmed(false, () => {}, null)).toBe(false);
  });
  it('false when ready but no integration mounted', () => {
    expect(analyticsArmed(true, null, null)).toBe(false);
  });
  it('true when ready and at least one integration mounted', () => {
    expect(analyticsArmed(true, () => {}, null)).toBe(true);
    expect(analyticsArmed(true, null, () => {})).toBe(true);
    expect(
      analyticsArmed(
        true,
        () => {},
        () => {},
      ),
    ).toBe(true);
  });
});

describe('isVercelScriptResponse', () => {
  const headersFor = (contentType) => ({ get: (h) => (h === 'content-type' ? contentType : null) });

  it('accepts a 2xx response with a JavaScript content type', () => {
    expect(
      isVercelScriptResponse({ ok: true, headers: headersFor('application/javascript') }),
    ).toBe(true);
  });

  it('accepts legacy JavaScript MIME types', () => {
    for (const type of [
      'text/javascript',
      'application/x-javascript',
      'application/ecmascript',
      'text/ecmascript',
    ]) {
      expect(isVercelScriptResponse({ ok: true, headers: headersFor(type) })).toBe(true);
    }
  });

  it('accepts mixed-case media types', () => {
    expect(
      isVercelScriptResponse({ ok: true, headers: headersFor('Application/JavaScript') }),
    ).toBe(true);
  });

  it('accepts parameterized content types', () => {
    expect(
      isVercelScriptResponse({
        ok: true,
        headers: headersFor('application/javascript; charset=utf-8'),
      }),
    ).toBe(true);
  });

  it('rejects a non-2xx response even when it reports JavaScript', () => {
    expect(
      isVercelScriptResponse({ ok: false, headers: headersFor('application/javascript') }),
    ).toBe(false);
  });

  it('rejects unrelated types whose name merely contains "javascript"', () => {
    expect(
      isVercelScriptResponse({ ok: true, headers: headersFor('application/not-javascript') }),
    ).toBe(false);
  });

  it('rejects a 2xx SPA-fallback HTML response', () => {
    expect(isVercelScriptResponse({ ok: true, headers: headersFor('text/html') })).toBe(false);
  });

  it('rejects falsy, headerless, and empty-header responses', () => {
    expect(isVercelScriptResponse(null)).toBe(false);
    expect(isVercelScriptResponse({ ok: true, headers: null })).toBe(false);
    expect(isVercelScriptResponse({ ok: true, headers: headersFor('') })).toBe(false);
  });
});

describe('mountAnalyticsIfServed', () => {
  const setup = (overrides = {}) => {
    const defaults = {
      importVendor: vi.fn(() => Promise.resolve('vendor')),
      setter: vi.fn(),
      probe: vi.fn(() => Promise.resolve(true)),
      isCancelled: () => false,
    };
    return { ...defaults, ...overrides };
  };

  it('imports and mounts the vendor when its route is served', async () => {
    const { importVendor, setter, probe } = setup();
    await mountAnalyticsIfServed({ url: VERCEL_INSIGHTS_ROUTE, importVendor, setter, probe });
    expect(probe).toHaveBeenCalledWith(VERCEL_INSIGHTS_ROUTE);
    expect(importVendor).toHaveBeenCalledTimes(1);
    expect(setter).toHaveBeenCalledTimes(1);
    expect(setter.mock.calls[0][0]()).toBe('vendor');
  });

  it('never imports or mounts when the route is not served', async () => {
    const { importVendor, setter, probe } = setup({ probe: vi.fn(() => Promise.resolve(false)) });
    await mountAnalyticsIfServed({ url: VERCEL_INSIGHTS_ROUTE, importVendor, setter, probe });
    expect(importVendor).not.toHaveBeenCalled();
    expect(setter).not.toHaveBeenCalled();
  });

  it('stops the chain once cancelled, even when the route is served', async () => {
    const { importVendor, setter, probe, isCancelled } = setup({ isCancelled: () => true });
    await mountAnalyticsIfServed({
      url: VERCEL_INSIGHTS_ROUTE,
      importVendor,
      setter,
      probe,
      isCancelled,
    });
    expect(importVendor).not.toHaveBeenCalled();
    expect(setter).not.toHaveBeenCalled();
  });

  it('swallows a failing vendor chunk: no mount, no unhandled rejection', async () => {
    const { importVendor, setter, probe } = setup({
      importVendor: vi.fn(() => Promise.reject(new Error('offline'))),
    });
    await expect(
      mountAnalyticsIfServed({ url: VERCEL_INSIGHTS_ROUTE, importVendor, setter, probe }),
    ).resolves.toBeUndefined();
    expect(setter).not.toHaveBeenCalled();
  });

  it('skips the setter when the import resolves to a falsy module', async () => {
    const { importVendor, setter, probe } = setup({
      importVendor: vi.fn(() => Promise.resolve(null)),
    });
    await mountAnalyticsIfServed({ url: VERCEL_INSIGHTS_ROUTE, importVendor, setter, probe });
    expect(setter).not.toHaveBeenCalled();
  });
});
