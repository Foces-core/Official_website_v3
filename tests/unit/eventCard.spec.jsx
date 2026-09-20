import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import EventCard from '../../src/Pages/EventPage/EventCard.jsx';
import { createHarness } from './harness.jsx';

vi.mock('../../src/Pages/EventPage/Modal.jsx', () => ({
  default: ({ open, onClose, startIndex }) => (
    <div id="mock-modal" data-open={String(open)} data-start-index={String(startIndex)}>
      <button id="modal-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('EventCard component & GalleryTrigger wiring', () => {
  let harness;
  let container;

  const mockEvent = {
    name: 'Hackathon 2026',
    date: 'March 15, 2026',
    desc: 'Annual hackathon for creative technologists.',
    websiteUrl: 'https://example.com/hackathon',
    photos: [
      { url: '/images/h1.webp', srcset: '/images/h1.webp 800w' },
      { url: '/images/h2.webp', srcset: '/images/h2.webp 800w' },
    ],
  };

  beforeEach(() => {
    harness = createHarness();
    container = harness.container;
  });

  it('renders event details and accessible gallery triggers', () => {
    act(() => {
      harness.render(<EventCard Events={mockEvent} priority={false} reverse={false} />);
    });

    expect(container.textContent).toContain('Hackathon 2026');
    expect(container.textContent).toContain('March 15, 2026');

    const primaryTrigger = container.querySelector(
      '[aria-label="Open photo gallery for Hackathon 2026"]',
    );
    expect(primaryTrigger).not.toBeNull();
    expect(primaryTrigger.getAttribute('role')).toBe('button');
    expect(primaryTrigger.getAttribute('tabindex')).toBe('0');
    expect(primaryTrigger.getAttribute('aria-haspopup')).toBe('dialog');

    const thumbTrigger = container.querySelector('[aria-label="View photo 2"]');
    expect(thumbTrigger).not.toBeNull();
    expect(thumbTrigger.getAttribute('role')).toBe('button');
  });

  it('opens modal on poster click and keyboard Enter', () => {
    act(() => {
      harness.render(<EventCard Events={mockEvent} />);
    });

    const modal = container.querySelector('#mock-modal');
    expect(modal.getAttribute('data-open')).toBe('false');

    const primaryTrigger = container.querySelector(
      '[aria-label="Open photo gallery for Hackathon 2026"]',
    );

    act(() => {
      primaryTrigger.click();
    });
    expect(modal.getAttribute('data-open')).toBe('true');

    const closeBtn = container.querySelector('#modal-close');
    act(() => {
      closeBtn.click();
    });
    expect(modal.getAttribute('data-open')).toBe('false');

    // Keydown Enter activation
    act(() => {
      primaryTrigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(modal.getAttribute('data-open')).toBe('true');
  });

  it('opens the gallery at the clicked thumbnail, poster resets to photo 1', () => {
    act(() => {
      harness.render(<EventCard Events={mockEvent} />);
    });
    const modal = container.querySelector('#mock-modal');
    const primaryTrigger = container.querySelector(
      '[aria-label="Open photo gallery for Hackathon 2026"]',
    );
    const thumbTrigger = container.querySelector('[aria-label="View photo 2"]');

    act(() => {
      thumbTrigger.click();
    });
    expect(modal.getAttribute('data-open')).toBe('true');
    // Thumbnail 1 maps to photo index 1 (0-based) — the second photo.
    expect(modal.getAttribute('data-start-index')).toBe('1');

    act(() => {
      container.querySelector('#modal-close').click();
    });
    expect(modal.getAttribute('data-open')).toBe('false');

    // Poster always opens at the first photo.
    act(() => {
      primaryTrigger.click();
    });
    expect(modal.getAttribute('data-open')).toBe('true');
    expect(modal.getAttribute('data-start-index')).toBe('0');
  });
});
