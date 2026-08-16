/* eslint-disable react/prop-types -- test fixture uses plain props */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';
import { createHarness } from './harness.jsx';
import useFocusTrap from '../../src/hooks/useFocusTrap.js';

function FocusTrapComponent({ isActive }) {
  const containerRef = useRef(null);
  useFocusTrap({ isActive, containerRef });

  return (
    <div>
      <button id="outside-btn">Outside</button>
      <div id="trap-container" ref={containerRef}>
        <button id="btn-1">Button 1</button>
        <button id="btn-2">Button 2</button>
      </div>
    </div>
  );
}

describe('useFocusTrap hook', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('traps Tab focus within container when active', () => {
    harness.render(<FocusTrapComponent isActive={true} />);

    const btn1 = document.getElementById('btn-1');
    const btn2 = document.getElementById('btn-2');

    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    const tabForward = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(tabForward);
    expect(document.activeElement).toBe(btn1);

    const tabBackward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(tabBackward);
    expect(document.activeElement).toBe(btn2);
  });

  it('does NOT trap focus when isActive is false', () => {
    harness.render(<FocusTrapComponent isActive={false} />);

    const btn2 = document.getElementById('btn-2');
    btn2.focus();

    const tabForward = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(tabForward);

    expect(document.activeElement).toBe(btn2);
  });
});
