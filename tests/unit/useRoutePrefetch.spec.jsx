/* eslint-disable react/prop-types -- test fixtures use plain props without full schemas */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createHarness } from './harness.jsx';
import useRoutePrefetch from '../../src/hooks/useRoutePrefetch.js';
import * as routePrefetchLogic from '../../src/utils/routePrefetchLogic.js';

function TestPrefetchComponent({ slowNetwork, idleDelayMs }) {
  const { handlePrefetch } = useRoutePrefetch({ slowNetwork, idleDelayMs });
  return (
    <div>
      <button id="prefetch-events" onClick={() => handlePrefetch('events')}>
        Events
      </button>
      <button id="prefetch-contact" onClick={() => handlePrefetch('contact')}>
        Contact
      </button>
    </div>
  );
}

describe('useRoutePrefetch hook', () => {
  let harness;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('does NOT trigger idle preload or intent prefetch on slowNetwork', () => {
    const prefetchSpy = vi.spyOn(routePrefetchLogic, 'prefetchRoute');
    const defaultRoutesSpy = vi.spyOn(routePrefetchLogic, 'prefetchDefaultRoutes');

    harness.render(<TestPrefetchComponent slowNetwork={true} idleDelayMs={500} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(defaultRoutesSpy).not.toHaveBeenCalled();

    const eventsBtn = document.getElementById('prefetch-events');
    eventsBtn.click();
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it('triggers idle preloading on fast network after delay', () => {
    const defaultRoutesSpy = vi.spyOn(routePrefetchLogic, 'prefetchDefaultRoutes');

    harness.render(<TestPrefetchComponent slowNetwork={false} idleDelayMs={500} />);

    expect(defaultRoutesSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(defaultRoutesSpy).toHaveBeenCalledTimes(1);
  });

  it('triggers direct prefetch on fast network when handlePrefetch is called', () => {
    const prefetchSpy = vi.spyOn(routePrefetchLogic, 'prefetchRoute');

    harness.render(<TestPrefetchComponent slowNetwork={false} idleDelayMs={500} />);

    const contactBtn = document.getElementById('prefetch-contact');
    contactBtn.click();

    expect(prefetchSpy).toHaveBeenCalledWith('contact');
  });
});
