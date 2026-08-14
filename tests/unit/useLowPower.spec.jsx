import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import useDeviceProfile from '../../src/hooks/useLowPower.js';

// The seam is the hook's public behavior: it must return the resolved device
// profile and re-resolve it whenever the Network Information API reports a
// change, then stop listening on unmount. The profile itself is detectProfile
// (covered by its own suite); here we observe the hook through a probe that
// serializes the returned profile.
function makeConnection() {
  const listeners = {};
  return {
    saveData: false,
    effectiveType: '4g',
    downlink: 20,
    addEventListener: vi.fn((type, cb) => {
      listeners[type] = cb;
    }),
    removeEventListener: vi.fn((type) => {
      delete listeners[type];
    }),
    fire(type) {
      listeners[type]?.();
    },
  };
}

function Probe() {
  const profile = useDeviceProfile();
  return <div id="profile">{JSON.stringify(profile)}</div>;
}

let root;
let container;

function renderProbe() {
  act(() => {
    root.render(<Probe />);
  });
}

function readProfile() {
  return JSON.parse(document.getElementById('profile').textContent);
}

beforeEach(() => {
  container = document.body.appendChild(document.createElement('div'));
  root = createRoot(container);
});

afterEach(() => {
  vi.unstubAllGlobals();
  act(() => root.unmount());
  document.body.innerHTML = '';
});

describe('useDeviceProfile', () => {
  it('returns the resolved profile for a capable, motion-preferring device', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8 });
    renderProbe();
    expect(readProfile()).toEqual({
      slowNetwork: false,
      lowCPU: false,
      reducedMotion: false,
      lowPower: false,
    });
  });

  it('re-resolves the profile when navigator.connection fires a change event', () => {
    const conn = makeConnection();
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8, connection: conn });
    renderProbe();
    expect(readProfile().slowNetwork).toBe(false);

    // User toggles Data Saver — the connection object mutates, then the API
    // fires "change"; the hook must pick up the new profile.
    conn.saveData = true;
    act(() => conn.fire('change'));
    expect(readProfile().slowNetwork).toBe(true);
    expect(readProfile().lowPower).toBe(true);
  });

  it('subscribes to the connection change event on mount', () => {
    const conn = makeConnection();
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8, connection: conn });
    renderProbe();
    expect(conn.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('unsubscribes from the connection when unmounted', () => {
    const conn = makeConnection();
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8, connection: conn });
    renderProbe();
    act(() => root.unmount());
    expect(conn.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('works without a connection object (no listener, plain profile)', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8 });
    renderProbe();
    expect(readProfile()).toEqual({
      slowNetwork: false,
      lowCPU: false,
      reducedMotion: false,
      lowPower: false,
    });
  });
});
