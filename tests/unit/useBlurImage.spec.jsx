import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import BlurImage from '../../src/Components/BlurImage/BlurImage.jsx';
import { createHarness } from './harness.jsx';

// The shared image primitive's state machine: loaded / removed (placeholder)
// / fetch-priority elevation, with a 500ms placeholder-removal timer. The old
// implementation also set state inside the render body when src changed —
// render-phase side effects React warns against. The extraction (useBlurImage)
// moves that reset into an effect and pins every transition here.

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
