import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Loader from '../../src/Components/Loader/Loader.jsx';
import { createHarness } from './harness.jsx';

// Characterization of the route-loader fallback: it reads window.innerWidth
// (reactively, via a resize listener) to pick a short (phone) vs long
// (desktop) tagline and toggles a word-wrap class. The 500px policy lives in
// breakpoints.js — pinned here so the exact narrow-screen behavior holds.

let harness;

// setInnerWidth redefines a global browser property — save the original
// descriptor and restore it after the suite so other specs see a clean window.
const originalInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  harness.unmount();
  if (originalInnerWidth) Object.defineProperty(window, 'innerWidth', originalInnerWidth);
  else delete window.innerWidth;
});

function setInnerWidth(width) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
}

describe('Loader', () => {
  it('renders a status region with the programming quote', () => {
    harness.render(<Loader />);
    expect(harness.container.querySelector('[role="status"]')).not.toBeNull();
    expect(harness.container.textContent).toContain('1st Rule Of Programming');
  });

  it('uses the short, wrapped tagline below 500px (phones)', () => {
    setInnerWidth(400);
    harness.render(<Loader />);
    expect(harness.container.textContent).toContain('1st Rule Of Programming');
    expect(harness.container.querySelector('.break-lines')).not.toBeNull();
  });

  it('uses the single-line tagline at 500px and wider', () => {
    setInnerWidth(500);
    harness.render(<Loader />);
    expect(harness.container.querySelector('.break-lines')).toBeNull();

    setInnerWidth(1280);
    harness.render(<Loader />);
    expect(harness.container.querySelector('.break-lines')).toBeNull();
  });
});
