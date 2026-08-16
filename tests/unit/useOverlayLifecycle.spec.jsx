/* eslint-disable react/prop-types -- test fixtures use plain props without full schemas */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef, act } from 'react';
import { createHarness } from './harness.jsx';
import useOverlayLifecycle from '../../src/hooks/useOverlayLifecycle.js';

function TestOverlayComponent({ isOpen, onClose }) {
  const containerRef = useRef(null);
  useOverlayLifecycle({
    isOpen,
    onClose,
    containerRef,
    initialFocusId: 'overlay-close-btn',
    restoreFocusId: 'overlay-trigger-btn',
  });

  return (
    <div>
      <button id="overlay-trigger-btn">Open Overlay</button>
      {isOpen && (
        <div id="test-overlay" ref={containerRef}>
          <button id="overlay-close-btn" onClick={onClose}>
            Close
          </button>
          <a href="#link">Link</a>
        </div>
      )}
    </div>
  );
}

describe('useOverlayLifecycle hook', () => {
  let harness;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('acquires body lock when open and releases when closed', () => {
    harness.render(<TestOverlayComponent isOpen={false} onClose={() => {}} />);
    expect(document.body.style.overflow).not.toBe('hidden');

    harness.render(<TestOverlayComponent isOpen={true} onClose={() => {}} />);
    expect(document.body.style.overflow).toBe('hidden');

    harness.render(<TestOverlayComponent isOpen={false} onClose={() => {}} />);
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('moves focus into initialFocusId on open', () => {
    harness.render(<TestOverlayComponent isOpen={true} onClose={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(40);
    });

    const closeBtn = document.getElementById('overlay-close-btn');
    expect(document.activeElement).toBe(closeBtn);
  });

  it('handles Escape key to close the overlay', () => {
    const onClose = vi.fn();
    harness.render(<TestOverlayComponent isOpen={true} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(40);
    });

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    act(() => {
      window.dispatchEvent(escapeEvent);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
