import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import BlurImage from '../../src/Components/BlurImage/BlurImage.jsx';
import { blurImageReducer } from '../../src/Components/BlurImage/useBlurImage.js';
import { createHarness } from './harness.jsx';

// The shared image primitive's state machine: loaded / removed (placeholder)
// / fetch-priority elevation, with a 500ms placeholder-removal timer — all
// owned by the pure blurImageReducer (the hook only feeds it events and runs
// side effects). The old implementation set state inside the render body when
// src changed — a render-phase write; SRC_CHANGED now arrives via a layout
// effect and the reset lives in the reducer. Every transition is pinned here:
// the direct reducer specs below, plus the DOM-level behavior via the harness.

vi.mock('../../src/utils/priorityScheduler.js', () => ({
  prioritizeAssetFetch: vi.fn(),
}));

import { prioritizeAssetFetch } from '../../src/utils/priorityScheduler.js';

let harness;

beforeEach(() => {
  harness = createHarness();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  harness.unmount();
  vi.useRealTimers();
});

const fullImg = (container, src) => container.querySelector(`img[src="${src}"]`);
const blurImg = (container) => container.querySelector('img[src="blur.jpg"]');

describe('BlurImage state machine', () => {
  it('shows the blur placeholder and keeps the full image hidden until it loads', () => {
    harness.render(<BlurImage src="full.jpg" blurSrc="blur.jpg" alt="Photo" />);
    expect(blurImg(harness.container)).not.toBeNull();
    expect(fullImg(harness.container, 'full.jpg').className).toContain('opacity-0');
  });

  it('renders a single img when no blurSrc is given', () => {
    harness.render(<BlurImage src="full.jpg" alt="Photo" />);
    expect(harness.container.querySelectorAll('img')).toHaveLength(1);
  });

  it('reveals the full image on load and removes the placeholder 500ms later', async () => {
    harness.render(<BlurImage src="full.jpg" blurSrc="blur.jpg" alt="Photo" />);
    const img = fullImg(harness.container, 'full.jpg');
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });
    // Loaded → full image visible, placeholder still cross-fading
    expect(img.className).toContain('opacity-100');
    expect(blurImg(harness.container)).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(blurImg(harness.container)).toBeNull();
  });

  it('reveals the image on error so alt text renders instead of an invisible node', async () => {
    harness.render(<BlurImage src="full.jpg" blurSrc="blur.jpg" alt="Photo" />);
    const img = fullImg(harness.container, 'full.jpg');
    await act(async () => {
      img.dispatchEvent(new Event('error'));
    });
    expect(blurImg(harness.container)).toBeNull();
    expect(img.getAttribute('alt')).toBe('Photo');
    expect(img.className).toContain('opacity-100');
  });

  it('resets to the placeholder when the src changes', async () => {
    harness.render(<BlurImage src="a.jpg" blurSrc="blur.jpg" alt="Photo" />);
    const img = fullImg(harness.container, 'a.jpg');
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(blurImg(harness.container)).toBeNull();

    // Same instance, new src (root.render reconciles in place)
    harness.render(<BlurImage src="b.jpg" blurSrc="blur.jpg" alt="Photo" />);
    expect(fullImg(harness.container, 'b.jpg')).not.toBeNull();
    expect(blurImg(harness.container)).not.toBeNull(); // placeholder is back
    expect(fullImg(harness.container, 'b.jpg').className).toContain('opacity-0');
  });

  it('clears the placeholder timer when the component unmounts', async () => {
    harness.render(<BlurImage src="full.jpg" blurSrc="blur.jpg" alt="Photo" />);
    const img = fullImg(harness.container, 'full.jpg');
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });
    act(() => {
      harness.unmount();
    });
    // Firing the stale timer after unmount must not throw or warn
    expect(() => vi.advanceTimersByTime(600)).not.toThrow();
  });
});

describe('blurImageReducer — the pure state machine', () => {
  // Direct transition tests (no DOM): the hook funnels every state write
  // through the reducer, so this contract is what the BlurImage behaviors
  // above are built on.
  const base = (overrides = {}) => ({
    loaded: false,
    removed: true, // placeholder already gone (no blurSrc) unless overridden
    priorityAttr: undefined, // lazy policy
    prevSrc: 'a.jpg',
    ...overrides,
  });

  it('SRC_CHANGED resets the machine for a new src (lazy policy)', () => {
    const next = blurImageReducer(base({ loaded: true, removed: false }), {
      type: 'SRC_CHANGED',
      src: 'b.jpg',
      blurSrc: 'blur.jpg',
      eager: false,
    });
    expect(next).toEqual({
      loaded: false,
      removed: false, // placeholder back for the new pair
      priorityAttr: undefined,
      prevSrc: 'b.jpg',
    });
  });

  it('SRC_CHANGED with an unchanged src is a no-op — same object, so useReducer bails', () => {
    const state = base();
    const next = blurImageReducer(state, {
      type: 'SRC_CHANGED',
      src: 'a.jpg',
      blurSrc: undefined,
      eager: false,
    });
    expect(next).toBe(state);
  });

  it('SRC_CHANGED re-applies the eager policy for the new src', () => {
    const next = blurImageReducer(base(), {
      type: 'SRC_CHANGED',
      src: 'b.jpg',
      blurSrc: undefined,
      eager: true,
    });
    expect(next).toEqual({
      loaded: false,
      removed: true,
      priorityAttr: 'high',
      prevSrc: 'b.jpg',
    });
  });

  it('LOADED marks the image loaded without touching the placeholder policy', () => {
    const next = blurImageReducer(base(), { type: 'LOADED' });
    expect(next.loaded).toBe(true);
    expect(next.removed).toBe(true);
    expect(next.priorityAttr).toBeUndefined();
  });

  it('ERROR reveals the element so broken-image alt text renders', () => {
    const next = blurImageReducer(base(), { type: 'ERROR' });
    expect(next).toEqual({
      loaded: true,
      removed: true,
      priorityAttr: undefined,
      prevSrc: 'a.jpg',
    });
  });

  it('INTERACT elevates priority once — a second dispatch is a no-op', () => {
    const first = blurImageReducer(base(), { type: 'INTERACT' });
    expect(first.priorityAttr).toBe('high');
    // Same object → the hook never re-renders for the redundant dispatch
    expect(blurImageReducer(first, { type: 'INTERACT' })).toBe(first);
  });

  it('REMOVE_PLACEHOLDER drops the blur layer after the cross-fade', () => {
    const next = blurImageReducer(base({ removed: false }), { type: 'REMOVE_PLACEHOLDER' });
    expect(next.removed).toBe(true);
    expect(next.loaded).toBe(false);
  });

  it('unknown action types leave the state untouched', () => {
    const state = base();
    expect(blurImageReducer(state, { type: 'NOPE' })).toBe(state);
  });
});

describe('fetch-priority elevation', () => {
  it('elevates a lazy image on first interaction, once', async () => {
    harness.render(<BlurImage src="full.jpg" alt="Photo" loading="lazy" />);
    const wrap = harness.container.firstElementChild;

    // focusin (not mouseenter/focus): React 17+ delegates onFocus via the
    // bubbling focusin event at the root; raw mouseenter/focus dispatches
    // never reach the handler in jsdom
    await act(async () => {
      wrap.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(prioritizeAssetFetch).toHaveBeenCalledWith('full.jpg');
    expect(fullImg(harness.container, 'full.jpg').getAttribute('fetchpriority')).toBe('high');

    await act(async () => {
      wrap.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(prioritizeAssetFetch).toHaveBeenCalledTimes(1);
  });

  it('eager images start at high priority and never re-fetch on interaction', async () => {
    harness.render(<BlurImage src="full.jpg" alt="Photo" loading="eager" />);
    expect(fullImg(harness.container, 'full.jpg').getAttribute('fetchpriority')).toBe('high');

    await act(async () => {
      harness.container.firstElementChild.dispatchEvent(
        new FocusEvent('focusin', { bubbles: true }),
      );
    });
    expect(prioritizeAssetFetch).not.toHaveBeenCalled();
  });

  it('keeps eager images at high priority when the src changes', async () => {
    harness.render(<BlurImage src="a.jpg" alt="Photo" loading="eager" />);
    await act(async () => {
      harness.render(<BlurImage src="b.jpg" alt="Photo" loading="eager" />);
    });
    // The src-change reset re-applies the eager priority policy ('high'),
    // not the lazy default (undefined)
    expect(fullImg(harness.container, 'b.jpg').getAttribute('fetchpriority')).toBe('high');
  });
});

describe('cached-image fast path', () => {
  it('treats an already-complete image (browser cache) as loaded from the first frame', async () => {
    harness.render(<BlurImage src="a.jpg" blurSrc="blur.jpg" alt="Photo" />);
    const img = fullImg(harness.container, 'a.jpg');

    // Simulate a cache hit: the <img> is complete with real dimensions.
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 500, configurable: true });

    // A src change re-runs the completeness effect against the same node.
    await act(async () => {
      harness.render(<BlurImage src="b.jpg" blurSrc="blur.jpg" alt="Photo" />);
    });
    expect(fullImg(harness.container, 'b.jpg').className).toContain('opacity-100');
  });
});
