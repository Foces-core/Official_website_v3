import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useExperienceCapabilities from '../../src/hooks/useExperienceCapabilities.js';
import { createHarness } from './harness.jsx';

// The seam is the hook's public behavior: it must return the capability set
// for the resolved device profile (the matrix itself is pinned by
// experienceTier.spec.js). Here we observe the hook through a probe that
// serializes the returned capabilities.
function Probe() {
  const caps = useExperienceCapabilities();
  return <div id="caps">{JSON.stringify(caps)}</div>;
}

let harness;

function renderProbe() {
  harness.render(<Probe />);
}

function readCaps() {
  return JSON.parse(document.getElementById('caps').textContent);
}

function stubCapableDevice() {
  vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8 });
  vi.stubGlobal('matchMedia', (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  vi.unstubAllGlobals();
  harness.unmount();
});

describe('useExperienceCapabilities', () => {
  it('returns the full-tier capability set on a capable, motion-preferring device', () => {
    stubCapableDevice();
    renderProbe();
    const caps = readCaps();
    expect(caps.tier).toBe('full');
    expect(caps.webgl).toBe(true);
    expect(caps.autoplay).toBe(true);
    expect(caps.grain).toBe(true);
    expect(caps.prefetch).toBe(true);
    expect(caps.splash).toBe(true);
    expect(caps.scrollGate).toBe(true);
    expect(caps.celebrationMotion).toBe(true);
    expect(caps.smoothScroll).toBe(true);
    expect(caps.imageMaxWidth).toBe(1000);
  });

  it('returns the minimal-tier capability set under ?perf=slow', () => {
    window.history.replaceState({}, '', '/?perf=slow');
    stubCapableDevice();
    renderProbe();
    const caps = readCaps();
    expect(caps.tier).toBe('minimal');
    expect(caps.webgl).toBe(false);
    expect(caps.autoplay).toBe(false);
    expect(caps.grain).toBe(false);
    expect(caps.prefetch).toBe(false);
    expect(caps.splash).toBe(false);
    expect(caps.imageMaxWidth).toBe(400);
    window.history.replaceState({}, '', '/');
  });

  it('keeps grain on a reduced-motion device (lite tier)', () => {
    stubCapableDevice();
    vi.stubGlobal('matchMedia', (query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    renderProbe();
    const caps = readCaps();
    expect(caps.tier).toBe('lite');
    expect(caps.grain).toBe(true);
    expect(caps.celebrationMotion).toBe(false);
    expect(caps.autoplay).toBe(false);
  });
});
