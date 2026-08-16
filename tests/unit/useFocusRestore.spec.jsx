/* eslint-disable react/prop-types -- test fixture uses plain props */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef, act } from 'react';
import { createHarness } from './harness.jsx';
import useFocusRestore from '../../src/hooks/useFocusRestore.js';

function FocusRestoreComponent({ isOpen, initialFocusId, restoreFocusId }) {
  const containerRef = useRef(null);
  useFocusRestore({
    isOpen,
    containerRef,
    initialFocusId,
    restoreFocusId,
  });

  return (
    <div>
      <button id="trigger-btn">Open Dialog</button>
      {isOpen && (
        <div id="modal-container" ref={containerRef}>
          <button id="modal-close-btn">Close</button>
          <a id="modal-link" href="#test">
            Link
          </a>
        </div>
      )}
    </div>
  );
}

describe('useFocusRestore hook', () => {
  let harness;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('moves focus into initialFocusId on open after paint deferral', () => {
    harness.render(
      <FocusRestoreComponent
        isOpen={true}
        initialFocusId="modal-close-btn"
        restoreFocusId="trigger-btn"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(40);
    });

    const closeBtn = document.getElementById('modal-close-btn');
    expect(document.activeElement).toBe(closeBtn);
  });

  it('restores focus to restoreFocusId when overlay closes', () => {
    harness.render(
      <FocusRestoreComponent
        isOpen={true}
        initialFocusId="modal-close-btn"
        restoreFocusId="trigger-btn"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(40);
    });

    // Close the overlay
    harness.render(
      <FocusRestoreComponent
        isOpen={false}
        initialFocusId="modal-close-btn"
        restoreFocusId="trigger-btn"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(40);
    });

    const triggerBtn = document.getElementById('trigger-btn');
    expect(document.activeElement).toBe(triggerBtn);
  });
});
