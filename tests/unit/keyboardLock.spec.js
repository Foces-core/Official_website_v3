import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerWidget,
  markInteracted,
  getArrowOwner,
  isControlFocused,
  syncCarouselKeyboard,
  rectIsOnScreen,
  subscribeKeyboardArbitration,
} from '../../src/utils/keyboardLock.js';

// keyboardLock attaches scroll listeners that schedule notify via
// requestAnimationFrame; jsdom doesn't provide it. Polyfill to a timer.
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// jsdom's viewport is 0x0 unless configured; rectIsOnScreen reads
// window.innerWidth / innerHeight, so give it a realistic one. Must be set
// inside beforeEach (module-scope runs before the jsdom env is ready).
function setViewport(width, height) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

const onScreen = () => true;
const offScreen = () => false;

// Every registerWidget call returns an unregister fn. Collect them all so
// afterEach can fully reset the module-level widget store between tests.
const activeRegistrations = [];
function reg(id, isOnScreen, el) {
  activeRegistrations.push(registerWidget(id, isOnScreen, el));
  return activeRegistrations[activeRegistrations.length - 1];
}

beforeEach(() => {
  setViewport(1280, 720);
  document.body.innerHTML = '';
  document.activeElement?.blur?.();
});

afterEach(() => {
  // Unregister in reverse (last-registered first) then drop the list.
  while (activeRegistrations.length) activeRegistrations.pop()();
});

describe('keyboardLock — ownership arbitration', () => {
  it('returns null when no widget is registered', () => {
    expect(getArrowOwner()).toBeNull();
  });

  it('returns null when the only registered widget is off screen', () => {
    reg('cube', offScreen, null);
    expect(getArrowOwner()).toBeNull();
  });

  it('gives the arrow keys to the single on-screen widget', () => {
    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });

  it('prefers the most recently interacted on-screen widget', () => {
    reg('cube', onScreen, null);
    reg('featuring', onScreen, null);
    markInteracted('featuring');
    expect(getArrowOwner()).toBe('featuring');
  });

  it('ignores interactions with widgets that are no longer on screen', () => {
    reg('cube', onScreen, null);
    reg('execom', offScreen, null);
    markInteracted('execom');
    expect(getArrowOwner()).toBe('cube');
  });

  it('tie-breaks (nothing interacted) to the first registered on-screen widget', () => {
    reg('cube', onScreen, null);
    reg('featuring', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });

  it('unregistering the owner hands ownership to the next on-screen widget', () => {
    reg('cube', onScreen, null);
    reg('featuring', onScreen, null);
    markInteracted('cube');
    activeRegistrations.shift()(); // unregister cube
    expect(getArrowOwner()).toBe('featuring');
  });
});

describe('keyboardLock — focused-control rules', () => {
  it('a focused link outside any widget withholds the arrow keys', () => {
    const link = document.createElement('a');
    link.href = '#';
    document.body.appendChild(link);
    link.focus();

    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBeNull();
    expect(isControlFocused()).toBe(true);
  });

  it('a focused input outside any widget withholds the arrow keys', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBeNull();
  });

  it('a focusable element INSIDE the widget does not withhold the keys (its own controls)', () => {
    const root = document.createElement('div');
    const button = document.createElement('button');
    root.appendChild(button);
    document.body.appendChild(root);
    button.focus();

    reg('cube', onScreen, root);
    expect(getArrowOwner()).toBe('cube');
  });

  it('a non-interactive focus target (tabindex=-1, e.g. <main>) does not withhold the keys', () => {
    const main = document.createElement('main');
    main.tabIndex = -1;
    document.body.appendChild(main);
    main.focus();

    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });

  it('a plain body focus does not withhold the keys', () => {
    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });
});

describe('keyboardLock — syncCarouselKeyboard', () => {
  it('enables keyboard when the widget owns the arrows, disables otherwise', () => {
    reg('featuring', onScreen, null);
    const swiper = { keyboard: { enabled: false, enable: vi.fn(), disable: vi.fn() } };

    markInteracted('featuring');
    syncCarouselKeyboard(swiper, 'featuring');
    expect(swiper.keyboard.enable).toHaveBeenCalledTimes(1);

    syncCarouselKeyboard(swiper, 'not-the-owner');
    expect(swiper.keyboard.disable).toHaveBeenCalledTimes(1);
  });

  it('no-ops when the swiper lacks a keyboard module', () => {
    reg('cube', onScreen, null);
    expect(() => syncCarouselKeyboard({}, 'cube')).not.toThrow();
  });
});

describe('keyboardLock — subscriptions', () => {
  it('notifies subscribers when ownership changes', () => {
    const listener = vi.fn();
    const unsub = subscribeKeyboardArbitration(listener);
    reg('cube', onScreen, null);
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it('unsubscribe stops future notifications', () => {
    const listener = vi.fn();
    const unsub = subscribeKeyboardArbitration(listener);
    unsub();
    const before = listener.mock.calls.length;
    reg('cube', onScreen, null);
    expect(listener.mock.calls.length).toBe(before);
  });
});

describe('keyboardLock — rectIsOnScreen', () => {
  function fakeEl(rect) {
    // getClientRects must be truthy — rectIsOnScreen treats a missing/empty
    // one as "element not rendered" and bails before the viewport check.
    return { getClientRects: () => ({ length: 1 }), getBoundingClientRect: () => rect };
  }

  it('returns false for a null/undefined element', () => {
    expect(rectIsOnScreen(null)).toBe(false);
    expect(rectIsOnScreen(undefined)).toBe(false);
  });

  it('returns false for an element with no client rects (display: none)', () => {
    const el = { getClientRects: () => ({ length: 0 }) };
    expect(rectIsOnScreen(el)).toBe(false);
  });

  it('returns true for an element inside the viewport', () => {
    const el = fakeEl({ top: 100, bottom: 300, left: 100, right: 300 });
    expect(rectIsOnScreen(el)).toBe(true);
  });

  it('returns false for an element scrolled far below the viewport', () => {
    const el = fakeEl({ top: 5000, bottom: 5200, left: 0, right: 200 });
    expect(rectIsOnScreen(el)).toBe(false);
  });

  it('honors a positive margin so slightly-off-screen widgets still count', () => {
    const el = fakeEl({ top: 900, bottom: 1000, left: 0, right: 200 });
    expect(rectIsOnScreen(el)).toBe(false);
    expect(rectIsOnScreen(el, 400)).toBe(true);
  });
});
