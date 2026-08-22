import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';
import PropTypes from 'prop-types';
import useCarouselKeyboard from '../../src/hooks/useCarouselKeyboard.js';
import { getArrowOwner, markInteracted, registerWidget } from '../../src/utils/keyboardLock.js';
import { createHarness } from './harness.jsx';

function setViewport(width, height) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

const widgetCleanups = [];
const enableKeyboard = vi.fn();
const disableKeyboard = vi.fn();

const visibleEl = {
  getClientRects: () => ({ length: 1 }),
  getBoundingClientRect: () => ({ top: 0, left: 0, right: 200, bottom: 100 }),
};
const offscreenEl = { getClientRects: () => ({ length: 0 }) };

function CarouselKeyboardProbe({ onScreen = true }) {
  const wrapperRef = useRef(null);
  const instanceRef = useRef(null);
  useCarouselKeyboard({ widgetId: 'probe', instanceRef, wrapperRef });
  return (
    <div ref={wrapperRef} data-testid="probe-wrapper">
      <div
        ref={(node) => {
          if (node) {
            instanceRef.current = {
              el: onScreen ? visibleEl : offscreenEl,
              enableKeyboard,
              disableKeyboard,
            };
          }
        }}
      >
        slide
      </div>
    </div>
  );
}
CarouselKeyboardProbe.propTypes = { onScreen: PropTypes.bool };

describe('useCarouselKeyboard — arrow-key arbitration wiring', () => {
  let harness;

  beforeEach(() => {
    setViewport(1280, 720);
    document.body.innerHTML = '';
    document.activeElement?.blur?.();
    enableKeyboard.mockClear();
    disableKeyboard.mockClear();
    harness = createHarness();
  });

  afterEach(() => {
    vi.useRealTimers();
    while (widgetCleanups.length) widgetCleanups.pop()();
    harness.unmount();
  });

  it('enables the carousel keyboard while it owns the arrow keys', () => {
    harness.render(<CarouselKeyboardProbe />);
    expect(enableKeyboard).toHaveBeenCalled();
    expect(disableKeyboard).not.toHaveBeenCalled();
  });

  it('keeps the keyboard off while the widget is off screen', () => {
    harness.render(<CarouselKeyboardProbe onScreen={false} />);
    expect(enableKeyboard).not.toHaveBeenCalled();
    expect(disableKeyboard).toHaveBeenCalled();
  });

  it('disables when a competing widget takes ownership', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    harness.render(<CarouselKeyboardProbe />);
    widgetCleanups.push(registerWidget('cube', () => true, null));
    vi.setSystemTime(2000);
    markInteracted('cube');
    expect(disableKeyboard).toHaveBeenCalled();
  });

  it('re-enables after pointer interaction inside the wrapper', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    harness.render(<CarouselKeyboardProbe />);
    widgetCleanups.push(registerWidget('cube', () => true, null));
    vi.setSystemTime(2000);
    markInteracted('cube');
    disableKeyboard.mockClear();
    vi.setSystemTime(3000);
    harness.container
      .querySelector('[data-testid="probe-wrapper"]')
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(enableKeyboard).toHaveBeenCalled();
  });

  it('unregisters the widget on unmount', () => {
    harness.render(<CarouselKeyboardProbe />);
    harness.unmount();
    expect(getArrowOwner()).toBeNull();
  });
});
