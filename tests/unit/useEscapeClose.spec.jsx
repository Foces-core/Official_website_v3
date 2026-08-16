/* eslint-disable react/prop-types -- test fixture uses plain props */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHarness } from './harness.jsx';
import useEscapeClose from '../../src/hooks/useEscapeClose.js';

function EscapeCloseComponent({ isActive, onClose }) {
  useEscapeClose({ isActive, onClose });
  return <div>Escape Target</div>;
}

describe('useEscapeClose hook', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('calls onClose when Escape key is pressed and isActive is true', () => {
    const onClose = vi.fn();
    harness.render(<EscapeCloseComponent isActive={true} onClose={onClose} />);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(escapeEvent);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose on other key presses', () => {
    const onClose = vi.fn();
    harness.render(<EscapeCloseComponent isActive={true} onClose={onClose} />);

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    window.dispatchEvent(enterEvent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does NOT call onClose when isActive is false', () => {
    const onClose = vi.fn();
    harness.render(<EscapeCloseComponent isActive={false} onClose={onClose} />);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(escapeEvent);

    expect(onClose).not.toHaveBeenCalled();
  });
});
