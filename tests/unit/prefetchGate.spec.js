import { describe, it, expect } from 'vitest';
import { prefetchGate } from '../../src/utils/prefetchGate.js';

// The prefetch gate is the single owner of "should we prefetch right now?"
// Every prefetch call site (Navbar, Events, idle, ForesightJS) checks this
// before firing an import(). Four dialects existed before (slowNetwork,
// shouldPrefetchConnection, minimumConnectionType, raw import bypass);
// now there is one.

describe('prefetchGate — the single prefetch policy', () => {
  it('allows prefetching when no constraints are set', () => {
    expect(prefetchGate({})).toBe(true);
  });

  it('blocks on slowNetwork (device profile: 2g, 3g, lowCPU, saveData)', () => {
    expect(prefetchGate({ slowNetwork: true })).toBe(false);
  });

  it('blocks on saveData header', () => {
    expect(prefetchGate({ connection: { saveData: true } })).toBe(false);
  });

  it('blocks on 2g effectiveType', () => {
    expect(prefetchGate({ connection: { effectiveType: '2g' } })).toBe(false);
  });

  it('blocks on slow-2g effectiveType', () => {
    expect(prefetchGate({ connection: { effectiveType: 'slow-2g' } })).toBe(false);
  });

  it('allows on 3g (not blocked — only 2g/slow-2g are blocked)', () => {
    expect(prefetchGate({ connection: { effectiveType: '3g' } })).toBe(true);
  });

  it('allows on 4g', () => {
    expect(prefetchGate({ connection: { effectiveType: '4g' } })).toBe(true);
  });

  it('allows when connection API is unavailable', () => {
    expect(prefetchGate({ connection: null })).toBe(true);
  });

  it('blocks when slowNetwork overrides a fast connection', () => {
    expect(prefetchGate({ slowNetwork: true, connection: { effectiveType: '4g' } })).toBe(false);
  });
});
