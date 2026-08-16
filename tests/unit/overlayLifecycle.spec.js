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
