import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createHarness } from './harness.jsx';
import useOfflineToast from '../../src/hooks/useOfflineToast.js';
import OfflineToast from '../../src/Components/OfflineToast/OfflineToast.jsx';

function setOnLine(value) {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
}

function fireOnlineEvent(type) {
  // Real browsers flip navigator.onLine before firing the event — mirror that.
  setOnLine(type === 'online');
  act(() => {
    window.dispatchEvent(new window.Event(type));
  });
}

function Probe() {
  const { offlineVisible } = useOfflineToast();
  return <div id="probe">{offlineVisible ? 'offline' : 'online'}</div>;
}

function probeText(harness) {
  return harness.container.querySelector('#probe').textContent;
}

describe('useOfflineToast hook', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
    setOnLine(true);
  });

  afterEach(() => {
    setOnLine(true);
    harness.unmount();
  });

  it('reports online when the browser is online', () => {
    harness.render(<Probe />);
    expect(probeText(harness)).toBe('online');
  });

  it('flips on offline/online events', () => {
    harness.render(<Probe />);
    fireOnlineEvent('offline');
    expect(probeText(harness)).toBe('offline');
    fireOnlineEvent('online');
    expect(probeText(harness)).toBe('online');
  });

  it('starts offline when the page boots without a connection', () => {
    setOnLine(false);
    harness.render(<Probe />);
    expect(probeText(harness)).toBe('offline');
  });
});

describe('OfflineToast component', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
    setOnLine(true);
  });

  afterEach(() => {
    setOnLine(true);
    harness.unmount();
  });

  const toast = () => harness.container.querySelector('[role="status"]');

  it('renders nothing while online', () => {
    harness.render(<OfflineToast />);
    expect(toast()).toBeNull();
  });

  it('appears on offline and disappears silently on reconnect', () => {
    harness.render(<OfflineToast />);
    fireOnlineEvent('offline');
    expect(toast()?.textContent).toContain('offline');
    fireOnlineEvent('online');
    // Silent reconnect: no "back online" toast, the pill just goes away.
    expect(toast()).toBeNull();
  });

  it('shows immediately when booting offline (cached PWA launch)', () => {
    setOnLine(false);
    harness.render(<OfflineToast />);
    expect(toast()).not.toBeNull();
  });

  it('dismiss re-arms on the next offline transition (never nag-loops)', () => {
    harness.render(<OfflineToast />);
    fireOnlineEvent('offline');
    act(() => {
      toast().querySelector('button').click();
    });
    expect(toast()).toBeNull();
    // Still offline, no new event: stays dismissed.
    expect(toast()).toBeNull();
    fireOnlineEvent('online');
    fireOnlineEvent('offline');
    expect(toast()).not.toBeNull();
  });
});
