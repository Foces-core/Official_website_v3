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

globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

function setViewport(width, height) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

const onScreen = () => true;
const offScreen = () => false;
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
  while (activeRegistrations.length) activeRegistrations.pop()();
});

describe('keyboardLock — ownership arbitration', () => {
  it('returns null when no widget is registered', () => {
    expect(getArrowOwner()).toBeNull();
  });
  it('returns null when only widget is off screen', () => {
    reg('cube', offScreen, null);
    expect(getArrowOwner()).toBeNull();
  });
  it('gives arrows to single on-screen widget', () => {
    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });
  it('prefers most recently interacted', () => {
    reg('cube', onScreen, null);
    reg('featuring', onScreen, null);
    markInteracted('featuring');
    expect(getArrowOwner()).toBe('featuring');
  });
  it('ignores interactions with off-screen widgets', () => {
    reg('cube', onScreen, null);
    reg('execom', offScreen, null);
    markInteracted('execom');
    expect(getArrowOwner()).toBe('cube');
  });
  it('tie-breaks to first registered', () => {
    reg('cube', onScreen, null);
    reg('featuring', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });
  it('unregistering owner hands to next', () => {
    reg('cube', onScreen, null);
    reg('featuring', onScreen, null);
    markInteracted('cube');
    activeRegistrations.shift()();
    expect(getArrowOwner()).toBe('featuring');
  });
});

describe('keyboardLock — focused-control rules', () => {
  it('focused link outside widget withholds keys', () => {
    const l = document.createElement('a');
    l.href = '#';
    document.body.appendChild(l);
    l.focus();
    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBeNull();
  });
  it('focused input outside widget withholds keys', () => {
    const i = document.createElement('input');
    document.body.appendChild(i);
    i.focus();
    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBeNull();
  });
  it('focusable element INSIDE widget does not withhold', () => {
    const r = document.createElement('div');
    const b = document.createElement('button');
    r.appendChild(b);
    document.body.appendChild(r);
    b.focus();
    reg('cube', onScreen, r);
    expect(getArrowOwner()).toBe('cube');
  });
  it('non-interactive focus target does not withhold', () => {
    const m = document.createElement('main');
    m.tabIndex = -1;
    document.body.appendChild(m);
    m.focus();
    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });
  it('contentEditable withholds keys', () => {
    const e = document.createElement('div');
    e.contentEditable = 'true';
    Object.defineProperty(e, 'isContentEditable', { value: true });
    e.tabIndex = 0;
    document.body.appendChild(e);
    e.focus();
    reg('cube', onScreen, null);
    expect(isControlFocused()).toBe(true);
    expect(getArrowOwner()).toBeNull();
  });
  it('tabindex >= 0 counts as control', () => {
    const e = document.createElement('div');
    e.tabIndex = 0;
    document.body.appendChild(e);
    e.focus();
    reg('cube', onScreen, null);
    expect(isControlFocused()).toBe(true);
    expect(getArrowOwner()).toBeNull();
  });
  it('plain body focus does not withhold', () => {
    reg('cube', onScreen, null);
    expect(getArrowOwner()).toBe('cube');
  });
});

describe('keyboardLock — syncCarouselKeyboard', () => {
  it('enables when widget owns arrows, disables otherwise', () => {
    reg('featuring', onScreen, null);
    const swiper = { enableKeyboard: vi.fn(), disableKeyboard: vi.fn() };
    markInteracted('featuring');
    syncCarouselKeyboard(swiper, 'featuring');
    expect(swiper.enableKeyboard).toHaveBeenCalledTimes(1);
    syncCarouselKeyboard(swiper, 'not-the-owner');
    expect(swiper.disableKeyboard).toHaveBeenCalledTimes(1);
  });
  it('no-ops when swiper lacks enableKeyboard', () => {
    reg('cube', onScreen, null);
    expect(() => syncCarouselKeyboard({}, 'cube')).not.toThrow();
  });
});

describe('keyboardLock — subscriptions', () => {
  it('notifies on ownership change', () => {
    const l = vi.fn();
    const u = subscribeKeyboardArbitration(l);
    reg('cube', onScreen, null);
    expect(l).toHaveBeenCalled();
    u();
  });
  it('unsubscribe stops notifications', () => {
    const l = vi.fn();
    const u = subscribeKeyboardArbitration(l);
    u();
    const b = l.mock.calls.length;
    reg('cube', onScreen, null);
    expect(l.mock.calls.length).toBe(b);
  });
  it('rAF-throttled scroll dedupes', async () => {
    const l = vi.fn();
    subscribeKeyboardArbitration(l);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 10));
    expect(l).toHaveBeenCalledTimes(1);
  });
  it('focus-in/out listeners notify (rAF-batched)', async () => {
    const l = vi.fn();
    subscribeKeyboardArbitration(l);
    const b = document.createElement('button');
    document.body.appendChild(b);
    b.focus();
    b.blur();
    // Focus notifications are rAF-coalesced — wait for the frame to fire.
    await new Promise((r) => setTimeout(r, 10));
    expect(l).toHaveBeenCalled();
  });
});

describe('keyboardLock — rectIsOnScreen', () => {
  function fakeEl(rect) {
    return { getClientRects: () => ({ length: 1 }), getBoundingClientRect: () => rect };
  }
  it('null/undefined → false', () => {
    expect(rectIsOnScreen(null)).toBe(false);
    expect(rectIsOnScreen(undefined)).toBe(false);
  });
  it('no client rects → false', () => {
    expect(rectIsOnScreen({ getClientRects: () => ({ length: 0 }) })).toBe(false);
  });
  it('inside viewport → true', () => {
    expect(rectIsOnScreen(fakeEl({ top: 100, bottom: 300, left: 100, right: 300 }))).toBe(true);
  });
  it('below viewport → false', () => {
    expect(rectIsOnScreen(fakeEl({ top: 5000, bottom: 5200, left: 0, right: 200 }))).toBe(false);
  });
  it('margin extends viewport', () => {
    const e = fakeEl({ top: 900, bottom: 1000, left: 0, right: 200 });
    expect(rectIsOnScreen(e)).toBe(false);
    expect(rectIsOnScreen(e, 400)).toBe(true);
  });
  it('above viewport false, left-of-viewport false', () => {
    expect(rectIsOnScreen(fakeEl({ top: -300, bottom: -100, left: 0, right: 200 }))).toBe(false);
    expect(rectIsOnScreen(fakeEl({ top: 0, bottom: 200, left: -500, right: -300 }))).toBe(false);
  });
  it('right-of-viewport false with margin boundary', () => {
    const e = fakeEl({ top: 0, bottom: 200, left: 1400, right: 1600 });
    expect(rectIsOnScreen(e)).toBe(false);
    expect(rectIsOnScreen(e, 200)).toBe(true);
  });
});

describe('keyboardLock — SSR guard', () => {
  it('skips window listeners when window undefined', async () => {
    const saved = globalThis.window;
    delete globalThis.window;
    try {
      vi.resetModules();
      const mod = await import('../../src/utils/keyboardLock.js');
      expect(typeof mod.getArrowOwner).toBe('function');
      expect(mod.getArrowOwner()).toBeNull();
    } finally {
      globalThis.window = saved;
    }
  });
});
