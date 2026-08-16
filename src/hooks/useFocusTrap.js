import { useEffect } from 'react';
import { trapTabFocus } from '../utils/overlayLifecycle.js';

/**
 * Focused hook that traps Tab and Shift-Tab key cycling within a container.
 *
 * @param {{
 *   isActive: boolean,
 *   containerRef?: React.RefObject<HTMLElement>,
 *   containerId?: string,
 *   doc?: Document,
 *   win?: Window
 * }} options
 */
export default function useFocusTrap({
  isActive,
  containerRef,
  containerId,
  doc = typeof document !== 'undefined' ? document : null,
  win = typeof window !== 'undefined' ? window : null,
}) {
  useEffect(() => {
    if (!isActive || !win || !doc) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const container =
        containerRef?.current || (containerId ? doc.getElementById(containerId) : null);
      if (!container) return;

      trapTabFocus(e, container);
    };

    win.addEventListener('keydown', handleKeyDown);
    return () => {
      win.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, containerRef, containerId, doc, win]);
}
