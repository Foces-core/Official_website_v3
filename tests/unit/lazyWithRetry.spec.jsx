import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Suspense, Component } from 'react';
import PropTypes from 'prop-types';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { lazyWithRetry } from '../../src/utils/lazyWithRetry.js';

// The seam is the rendered component: lazyWithRetry returns a React.lazy
// component, so behavior is observed through Suspense rendering, not module
// internals. The retry delay is a hardcoded 300ms, so failure-path tests use
// real timers and wait past it.
const RETRY_WAIT_MS = 700;

function Resolved() {
  return <div id="resolved">resolved</div>;
}

// Contain lazy rejections so they don't surface as uncaught errors.
class Boundary extends Component {
  static propTypes = { children: PropTypes.node };

  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div id="boundary-error">{this.state.error.message}</div>
    ) : (
      this.props.children
    );
  }
}

let root;
const reload = vi.fn();

beforeEach(() => {
  window.sessionStorage.clear();
  reload.mockClear();
  root = createRoot(document.body.appendChild(document.createElement('div')));
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

// Render a lazy component and flush microtasks + the 300ms retry window.
async function renderAndSettle(Lazy) {
  act(() => {
    root.render(
      <Boundary>
        <Suspense fallback={<div id="fallback">fallback</div>}>
          <Lazy />
        </Suspense>
      </Boundary>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT_MS));
  });
}

describe('lazyWithRetry — happy path', () => {
  it('renders the lazily-imported component once the import resolves', async () => {
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: Resolved }));
    await renderAndSettle(Lazy);
    expect(document.getElementById('resolved')).toBeTruthy();
    expect(document.getElementById('fallback')).toBeFalsy();
  });

  it('clears any stale retry flag on success (a later deployment may reload again)', async () => {
    window.sessionStorage.setItem('chunk-reload-retry', 'true');
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: Resolved }));
    await renderAndSettle(Lazy);
    expect(window.sessionStorage.getItem('chunk-reload-retry')).toBeNull();
  });
});

describe('lazyWithRetry — retry and reload recovery', () => {
  it('recovers from a transient first failure by retrying once, then renders', async () => {
    let calls = 0;
    const Lazy = lazyWithRetry(() => {
      calls += 1;
      return calls === 1
        ? Promise.reject(new Error('network blip'))
        : Promise.resolve({ default: Resolved });
    });
    await renderAndSettle(Lazy);
    expect(calls).toBe(2);
    expect(document.getElementById('resolved')).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
  });

  it('performs a one-time clean reload after the retry also fails, setting the retry flag', async () => {
    vi.stubGlobal('location', { reload });
    const Lazy = lazyWithRetry(() => Promise.reject(new Error('stale asset hash')));
    await renderAndSettle(Lazy);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('chunk-reload-retry')).toBe('true');
    expect(document.getElementById('boundary-error').textContent).toBe('stale asset hash');
  });

  it('does NOT reload again when the retry flag survives from a previous reload (no reload loop)', async () => {
    vi.stubGlobal('location', { reload });
    window.sessionStorage.setItem('chunk-reload-retry', 'true');
    const Lazy = lazyWithRetry(() => Promise.reject(new Error('still stale')));
    await renderAndSettle(Lazy);
    expect(reload).not.toHaveBeenCalled();
    expect(document.getElementById('boundary-error').textContent).toBe('still stale');
  });
});

describe('lazyWithRetry — storage unavailable (Safari private mode etc.)', () => {
  function blockSessionStorage() {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
  }

  it('still renders the component when sessionStorage throws on the success path', async () => {
    blockSessionStorage();
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: Resolved }));
    await renderAndSettle(Lazy);
    expect(document.getElementById('resolved')).toBeTruthy();
  });

  it('still attempts the reload recovery when sessionStorage throws on the failure path', async () => {
    blockSessionStorage();
    vi.stubGlobal('location', { reload });
    const Lazy = lazyWithRetry(() => Promise.reject(new Error('stale asset hash')));
    await renderAndSettle(Lazy);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(document.getElementById('boundary-error').textContent).toBe('stale asset hash');
  });
});
