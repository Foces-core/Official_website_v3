import { useEffect } from 'react';
import {
  registerWidget,
  syncCarouselKeyboard,
  subscribeKeyboardArbitration,
  markInteracted,
  rectIsOnScreen,
} from '../utils/keyboardLock.js';

/**
 * Deep keyboard-arbitration module for carousels.
 *
 * Registers the carousel as a widget, enables its keyboard only while it owns
 * the arrow keys (on-screen + last-interacted), and marks it interacted on
 * pointer use. Both TeamCarousel and Featuring use this — one line each,
 * no drift.
 *
 * @param {{ widgetId: string,
 *           instanceRef: React.RefObject<{ el: HTMLElement,
 *                                          enableKeyboard(): void,
 *                                          disableKeyboard(): void }>,
 *           wrapperRef: React.RefObject<HTMLElement>,
 *           [onScreenMargin]: number }} opts
 */
export default function useCarouselKeyboard({
  widgetId,
  instanceRef,
  wrapperRef,
  onScreenMargin = 60,
}) {
  useEffect(() => {
    const unregister = registerWidget(
      widgetId,
      () => rectIsOnScreen(instanceRef.current?.el, onScreenMargin),
      wrapperRef.current,
    );
    const sync = () => syncCarouselKeyboard(instanceRef.current, widgetId);
    sync(); // ownership may already be decided before this runs
    const unsub = subscribeKeyboardArbitration(sync);

    // Mark interacted on any pointer use inside the widget (slides, arrows,
    // dots) so arrow-key arbitration hands this carousel the keys.
    const mark = () => markInteracted(widgetId);
    const el = wrapperRef.current;
    el?.addEventListener('pointerdown', mark, true);

    return () => {
      unregister();
      unsub();
      el?.removeEventListener('pointerdown', mark, true);
    };
  }, [widgetId, instanceRef, wrapperRef, onScreenMargin]);
}
