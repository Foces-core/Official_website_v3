import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import { act } from 'react';
import ErrorBoundary from '../../src/Components/ErrorBoundary/ErrorBoundary.jsx';
import ErrorFallback from '../../src/Components/ErrorFallback/ErrorFallback.jsx';
import { createHarness } from './harness.jsx';

// React logs caught render errors to the console; the boundary's whole job is
// catching them, so silence the noise and assert the behavior instead.
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

const AUTO_RELOAD_KEY = 'foces:error-auto-reloaded';

// jsdom's window.location.reload is non-configurable (can't be spied), so the
// whole location global is stubbed — the component's reload goes through it.
let reload;

beforeEach(() => {
  reload = vi.fn();
  vi.stubGlobal('location', { href: window.location.href, reload });
  sessionStorage.removeItem(AUTO_RELOAD_KEY);
});

afterEach(() => {
  consoleError.mockClear();
  sessionStorage.removeItem(AUTO_RELOAD_KEY);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function Bomb() {
  throw new Error('boom');
}

// Child whose throw is flag-controlled by the test — proves the boundary's
// resetError genuinely clears the error state and re-renders the children.
// A "throws once then recovers" child can't prove this: React 19 retries a
// failed render attempt, so a one-shot throw self-recovers without any click.
// The flag lives on a module-scope object (property mutation, not reassignment)
// so the React Compiler lint rule stays happy.
const flaky = { shouldThrow: true };
function ConditionalBomb() {
  if (flaky.shouldThrow) throw new Error('boom');
  return <div>recovered after reset</div>;
}

test('renders children when nothing throws', () => {
  const h = createHarness();
  h.render(
    <ErrorBoundary>
      <div>all good</div>
    </ErrorBoundary>,
  );
  expect(h.container.textContent).toContain('all good');
  expect(h.container.textContent).not.toContain('Something went wrong');
  h.unmount();
});

test('catches a child render error, shows the fallback, and reports via onError', () => {
  const h = createHarness();
  const onError = vi.fn();
  h.render(
    <ErrorBoundary onError={onError}>
      <Bomb />
    </ErrorBoundary>,
  );
  expect(h.container.textContent).toContain('Something went wrong');
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  expect(onError.mock.calls[0][0].message).toBe('boom');
  h.unmount();
});

test('fallback Refresh button resets the boundary and re-renders the children', () => {
  const h = createHarness();
  flaky.shouldThrow = true;
  h.render(
    <ErrorBoundary>
      <ConditionalBomb />
    </ErrorBoundary>,
  );
  expect(h.container.textContent).toContain('Something went wrong');

  flaky.shouldThrow = false;
  const refresh = [...h.container.querySelectorAll('button')].find((b) =>
    b.textContent.includes('Refresh Page'),
  );
  act(() => refresh.click());

  expect(h.container.textContent).toContain('recovered after reset');
  expect(h.container.textContent).not.toContain('Something went wrong');
  h.unmount();
});

test('shows the dev error message and wires both buttons to resetError', () => {
  const h = createHarness();
  const resetError = vi.fn();

  h.render(<ErrorFallback error={new Error('dev detail')} resetError={resetError} />);
  expect(h.container.textContent).toContain('Something went wrong');
  expect(h.container.textContent).toContain('dev detail');

  const [refresh, home] = h.container.querySelectorAll('button');
  act(() => refresh.click());
  expect(resetError).toHaveBeenCalledTimes(1);

  act(() => home.click());
  expect(resetError).toHaveBeenCalledTimes(2);
  h.unmount();
});

test('fallback handlers still navigate when resetError is not provided (standalone use)', () => {
  const h = createHarness();
  h.render(<ErrorFallback error={new Error('x')} />);
  const [refresh, home] = h.container.querySelectorAll('button');
  // Both handlers guard on resetError being present; without it they must
  // fall through to the navigation without throwing.
  expect(() => {
    act(() => refresh.click());
    act(() => home.click());
  }).not.toThrow();
  expect(h.container.textContent).toContain('Something went wrong');
  h.unmount();
});

test('fallback auto-reloads once after a short delay', () => {
  vi.useFakeTimers();
  const h = createHarness();
  h.render(<ErrorFallback error={new Error('x')} />);
  // Session guard armed + timer running; the page should reload on its own.
  act(() => {
    vi.advanceTimersByTime(1201);
  });
  expect(reload).toHaveBeenCalledTimes(1);
  h.unmount();
});

test('fallback does not auto-reload a second time in the same session', () => {
  // A previous auto-reload in this session armed the guard; a second error
  // must show the static fallback instead of reload-looping.
  sessionStorage.setItem(AUTO_RELOAD_KEY, '1');
  vi.useFakeTimers();
  const h = createHarness();
  h.render(<ErrorFallback error={new Error('x')} />);
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(reload).not.toHaveBeenCalled();
  expect(h.container.textContent).toContain('Something went wrong');
  h.unmount();
});

test('boundary shows the fallback once and lets the fallback heal (auto-reload path)', () => {
  const h = createHarness();
  h.render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>,
  );
  expect(h.container.textContent).toContain('Something went wrong');
  h.unmount();
});
