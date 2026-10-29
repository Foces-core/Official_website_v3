import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  findFocusableElements,
  trapTabFocus,
  handleOverlayEscape,
} from '../../src/utils/overlayLifecycle.js';

describe('overlayLifecycle pure helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findFocusableElements', () => {
    it('returns empty array when container is null or has no querySelectorAll', () => {
      expect(findFocusableElements(null)).toEqual([]);
      expect(findFocusableElements({})).toEqual([]);
    });

    it('excludes elements with display:none and keeps offsetParent fallback', () => {
      const hidden = {
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: null,
        style: { display: 'none' },
      };
      const visibleByStyle = {
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: null,
        style: { display: 'block' },
      };
      const visibleByOffset = {
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
        style: undefined,
      };
      const container = { querySelectorAll: () => [hidden, visibleByStyle, visibleByOffset] };
      const results = findFocusableElements(container);
      expect(results).toEqual([visibleByStyle, visibleByOffset]);
    });

    it('finds visible focusable elements and excludes disabled or aria-hidden', () => {
      const btn1 = {
        hasAttribute: (attr) => attr === 'disabled',
        getAttribute: () => null,
        offsetParent: {},
      };
      const btn2 = {
        hasAttribute: () => false,
        getAttribute: (attr) => (attr === 'aria-hidden' ? 'true' : null),
        offsetParent: {},
      };
      const btn3 = {
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
        focus: vi.fn(),
      };
      const link1 = {
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
        focus: vi.fn(),
      };

      const container = {
        querySelectorAll: vi.fn(() => [btn1, btn2, btn3, link1]),
      };

      const results = findFocusableElements(container);
      expect(results).toEqual([btn3, link1]);
    });
  });

  describe('trapTabFocus', () => {
    it('returns false if event is null, not Tab, or container is null', () => {
      expect(trapTabFocus(null, {})).toBe(false);
      expect(trapTabFocus({ key: 'Escape' }, {})).toBe(false);
      expect(trapTabFocus({ key: 'Tab' }, null)).toBe(false);
    });

    it('returns false when no focusables exist in container', () => {
      const container = { querySelectorAll: () => [], contains: () => false };
      const trapped = trapTabFocus(
        { key: 'Tab', shiftKey: false, preventDefault: vi.fn() },
        container,
      );
      expect(trapped).toBe(false);
    });

    it('wraps from the last actually tabbable element, ignoring roving links at tabindex -1', () => {
      const container = document.createElement('div');
      const close = document.createElement('button');
      const activeLink = document.createElement('a');
      const inactiveLink = document.createElement('a');
      close.textContent = 'Close';
      activeLink.href = '#home';
      activeLink.tabIndex = 0;
      inactiveLink.href = '#events';
      inactiveLink.tabIndex = -1;
      container.append(close, activeLink, inactiveLink);
      document.body.append(container);
      for (const el of [close, activeLink, inactiveLink]) {
        Object.defineProperty(el, 'offsetParent', { get: () => container });
      }

      const originalActive = document.activeElement;
      activeLink.focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefault = vi.spyOn(event, 'preventDefault');

      expect(trapTabFocus(event, container)).toBe(true);
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(close);

      container.remove();
      originalActive?.focus();
    });

    it('traps Shift+Tab from a focused non-tabbable controller wrapping the controls', () => {
      const container = document.createElement('div');
      const controller = document.createElement('div');
      const zoom = document.createElement('button');
      const close = document.createElement('button');
      const tail = document.createElement('div');
      controller.tabIndex = -1;
      tail.tabIndex = -1;
      controller.append(zoom, close);
      container.append(controller, tail);
      document.body.append(container);
      const originalActive = document.activeElement;

      controller.focus();
      const back = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
      expect(trapTabFocus(back, container)).toBe(true);
      expect(back.preventDefault).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(close);

      controller.focus();
      const forward = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
      expect(trapTabFocus(forward, container)).toBe(false);
      expect(forward.preventDefault).not.toHaveBeenCalled();

      tail.focus();
      expect(trapTabFocus(forward, container)).toBe(true);
      expect(document.activeElement).toBe(zoom);

      tail.focus();
      const backFromTail = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
      expect(trapTabFocus(backFromTail, container)).toBe(false);

      container.remove();
      originalActive?.focus();
    });

    it('wraps forward when focus outside container on Tab (not contained)', () => {
      const first = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const last = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const container = { querySelectorAll: () => [first, last], contains: () => false };
      const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
      const originalActive = document.activeElement;
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });
      const trapped = trapTabFocus(event, container);
      expect(trapped).toBe(true);
      expect(first.focus).toHaveBeenCalledTimes(1);
      Object.defineProperty(document, 'activeElement', {
        value: originalActive,
        configurable: true,
      });
    });

    it('does not trap when focus strictly inside and not at edge', () => {
      const first = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const mid = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const last = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const container = {
        querySelectorAll: () => [first, mid, last],
        contains: (el) => el === mid,
      };
      const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
      const originalActive = document.activeElement;
      Object.defineProperty(document, 'activeElement', { value: mid, configurable: true });
      const trapped = trapTabFocus(event, container);
      expect(trapped).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
      Object.defineProperty(document, 'activeElement', {
        value: originalActive,
        configurable: true,
      });
    });

    it('wraps focus to last element on Shift+Tab from first element', () => {
      const first = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const last = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const container = {
        querySelectorAll: () => [first, last],
        contains: (el) => el === first,
      };

      const event = {
        key: 'Tab',
        shiftKey: true,
        preventDefault: vi.fn(),
      };

      const originalActive = document.activeElement;
      Object.defineProperty(document, 'activeElement', { value: first, configurable: true });

      const trapped = trapTabFocus(event, container);
      expect(trapped).toBe(true);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(last.focus).toHaveBeenCalledTimes(1);

      Object.defineProperty(document, 'activeElement', {
        value: originalActive,
        configurable: true,
      });
    });

    it('wraps focus to first element on Tab from last element', () => {
      const first = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const last = {
        focus: vi.fn(),
        hasAttribute: () => false,
        getAttribute: () => null,
        offsetParent: {},
      };
      const container = {
        querySelectorAll: () => [first, last],
        contains: (el) => el === last,
      };

      const event = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: vi.fn(),
      };

      const originalActive = document.activeElement;
      Object.defineProperty(document, 'activeElement', { value: last, configurable: true });

      const trapped = trapTabFocus(event, container);
      expect(trapped).toBe(true);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(first.focus).toHaveBeenCalledTimes(1);

      Object.defineProperty(document, 'activeElement', {
        value: originalActive,
        configurable: true,
      });
    });
  });

  describe('handleOverlayEscape', () => {
    it('returns false if event is not Escape or isOpen is false', () => {
      expect(handleOverlayEscape({ key: 'Enter' }, { isOpen: true })).toBe(false);
      expect(handleOverlayEscape({ key: 'Escape' }, { isOpen: false })).toBe(false);
    });

    it('returns false when event is null', () => {
      expect(handleOverlayEscape(null, { isOpen: true })).toBe(false);
    });

    it('handles bare function onClose form', () => {
      const onClose = vi.fn();
      const event = { key: 'Escape', preventDefault: vi.fn() };
      const handled = handleOverlayEscape(event, onClose);
      expect(handled).toBe(true);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('skips preventDefault when not a function', () => {
      const event = { key: 'Escape' };
      const handled = handleOverlayEscape(event, { isOpen: true });
      expect(handled).toBe(true);
    });

    it('skips restore when onRestoreFocus missing but still closes', () => {
      const onClose = vi.fn();
      const event = { key: 'Escape', preventDefault: vi.fn() };
      const handled = handleOverlayEscape(event, { isOpen: true, onClose });
      expect(handled).toBe(true);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('handles Escape, prevents default, calls onClose, and defers onRestoreFocus', () => {
      const onClose = vi.fn();
      const onRestoreFocus = vi.fn();
      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      };

      const handled = handleOverlayEscape(event, {
        isOpen: true,
        onClose,
        onRestoreFocus,
      });

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onRestoreFocus).not.toHaveBeenCalled();

      // Deferral runs on next animation frame
      vi.advanceTimersByTime(40);
      expect(onRestoreFocus).toHaveBeenCalledTimes(1);
    });
  });
});
