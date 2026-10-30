import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Suspense, Component, act } from 'react';
import PropTypes from 'prop-types';
import { lazyWithRetry } from '../../src/utils/lazyWithRetry.js';
import { createHarness } from './harness.jsx';

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

let harness;
const reload = vi.fn();
let sessionStorageDescriptor;

beforeEach(() => {
  window.sessionStorage.clear();
  sessionStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
  reload.mockClear();
  harness = createHarness();
});

afterEach(() => {
  harness.unmount();
  if (sessionStorageDescriptor) {
    Object.defineProperty(window, 'sessionStorage', sessionStorageDescriptor);
  }
  vi.restoreAllMocks();
});

// Render a lazy component and flush microtasks + the 300ms retry window.
async function renderAndSettle(Lazy) {
  harness.render(
    <Boundary>
      <Suspense fallback={<div id="fallback">fallback</div>}>
        <Lazy />
      </Suspense>
    </Boundary>,
  );
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

  it('never touches sessionStorage — no reload flags exist in the new contract', async () => {
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: Resolved }));
    await renderAndSettle(Lazy);
    expect(window.sessionStorage.length).toBe(0);
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

  it('rethrows after the retry also fails — no reload, no storage flag', async () => {
    vi.stubGlobal('location', { reload });
    const Lazy = lazyWithRetry(() => Promise.reject(new Error('stale asset hash')));
    await renderAndSettle(Lazy);
    expect(reload).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(0);
    expect(document.getElementById('boundary-error').textContent).toBe('stale asset hash');
  });

  it('tolerates the legacy chunkId argument without using it', async () => {
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: Resolved }), 'featuring');
    await renderAndSettle(Lazy);
    expect(document.getElementById('resolved')).toBeTruthy();
    expect(window.sessionStorage.length).toBe(0);
  });
});

describe('lazyWithRetry — storage unavailable (Safari private mode etc.)', () => {
  function blockSessionStorage() {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('storage blocked');
      },
    });
  }

  it('still renders the component when sessionStorage throws on the success path', async () => {
    blockSessionStorage();
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: Resolved }));
    await renderAndSettle(Lazy);
    expect(document.getElementById('resolved')).toBeTruthy();
  });

  it('avoids a reload loop when sessionStorage throws on the failure path', async () => {
    blockSessionStorage();
    vi.stubGlobal('location', { reload });
    const Lazy = lazyWithRetry(() => Promise.reject(new Error('stale asset hash')));
    await renderAndSettle(Lazy);
    expect(reload).not.toHaveBeenCalled();
    expect(document.getElementById('boundary-error').textContent).toBe('stale asset hash');
  });
});
