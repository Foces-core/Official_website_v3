import { describe, it, expect, vi } from 'vitest';
import {
  resolveEntryFocusTarget,
  resolveRestoreFocusTarget,
  focusIfFocusable,
} from '../../src/utils/focusTargets.js';
import * as overlayLifecycle from '../../src/utils/overlayLifecycle.js';

describe('focusTargets', () => {
  const doc = {
    getElementById: vi.fn((id) => (id === 'known' ? { id, focus: vi.fn() } : null)),
  };

  describe('resolveEntryFocusTarget', () => {
    it('prefers explicit ref over id and container', () => {
      const refEl = { focus: vi.fn() };
      const target = resolveEntryFocusTarget({
        initialFocusRef: { current: refEl },
        initialFocusId: 'known',
        doc,
      });
      expect(target).toBe(refEl);
    });

    it('falls back to id when ref empty', () => {
      const target = resolveEntryFocusTarget({
        initialFocusRef: { current: null },
        initialFocusId: 'known',
        doc,
      });
      expect(target.id).toBe('known');
    });

    it('falls back to first focusable in container when no ref/id', () => {
      const first = { focus: vi.fn() };
      const spy = vi.spyOn(overlayLifecycle, 'findFocusableElements').mockReturnValue([first]);
      const container = { tag: 'container' };
      const target = resolveEntryFocusTarget({
        initialFocusRef: { current: null },
        initialFocusId: null,
        containerRef: { current: container },
        doc,
      });
      expect(target).toBe(first);
      spy.mockRestore();
    });

    it('falls back to container itself when no focusables inside', () => {
      const spy = vi.spyOn(overlayLifecycle, 'findFocusableElements').mockReturnValue([]);
      const container = { tag: 'container', focus: vi.fn() };
      const target = resolveEntryFocusTarget({
        initialFocusRef: { current: null },
        initialFocusId: null,
        containerRef: { current: container },
        doc,
      });
      expect(target).toBe(container);
      spy.mockRestore();
    });

    it('uses containerId when no containerRef', () => {
      doc.getElementById.mockImplementation((id) => (id === 'cont' ? { id: 'cont' } : null));
      const spy = vi.spyOn(overlayLifecycle, 'findFocusableElements').mockReturnValue([]);
      const target = resolveEntryFocusTarget({
        initialFocusRef: { current: null },
        initialFocusId: null,
        containerId: 'cont',
        doc,
      });
      expect(target).toEqual({ id: 'cont' });
      spy.mockRestore();
      doc.getElementById.mockImplementation((id) =>
        id === 'known' ? { id, focus: vi.fn() } : null,
      );
    });

    it('returns null when nothing resolvable', () => {
      const target = resolveEntryFocusTarget({
        initialFocusRef: { current: null },
        initialFocusId: 'missing',
        doc,
      });
      expect(target).toBeNull();
    });
  });

  describe('resolveRestoreFocusTarget', () => {
    it('returns explicit restore target first', () => {
      const el = { focus: vi.fn() };
      expect(
        resolveRestoreFocusTarget({
          explicitRestoreTarget: el,
          restoreFocusId: 'known',
          previouslyFocusedElement: null,
          doc,
        }),
      ).toBe(el);
    });

    it('falls back to id then previous element then null', () => {
      const prev = { focus: vi.fn() };
      expect(
        resolveRestoreFocusTarget({
          explicitRestoreTarget: null,
          restoreFocusId: 'known',
          previouslyFocusedElement: prev,
          doc,
        }).id,
      ).toBe('known');
      expect(
        resolveRestoreFocusTarget({
          explicitRestoreTarget: null,
          restoreFocusId: null,
          previouslyFocusedElement: prev,
          doc,
        }),
      ).toBe(prev);
      expect(
        resolveRestoreFocusTarget({
          explicitRestoreTarget: null,
          restoreFocusId: null,
          previouslyFocusedElement: null,
          doc,
        }),
      ).toBeNull();
    });
  });

  describe('focusIfFocusable', () => {
    it('focuses element with focus function and returns true', () => {
      const el = { focus: vi.fn() };
      expect(focusIfFocusable(el)).toBe(true);
      expect(el.focus).toHaveBeenCalledTimes(1);
    });
    it('returns false for null or non-focusable', () => {
      expect(focusIfFocusable(null)).toBe(false);
      expect(focusIfFocusable({})).toBe(false);
    });
  });
});
