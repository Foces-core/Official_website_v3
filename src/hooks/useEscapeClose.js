import { useEffect } from 'react';
import { handleOverlayEscape } from '../utils/overlayLifecycle.js';

/**
 * Focused hook that attaches a window Escape key listener when active.
 *
 * @param {{
 *   isActive: boolean,
 *   onClose?: () => void,
 *   win?: Window
 * }} options
 */
export default function useEscapeClose({
  isActive,
  onClose,
  win = typeof window !== 'undefined' ? window : null,
}) {
  useEffect(() => {
    if (!isActive || typeof onClose !== 'function' || !win) return;

    const handleKeyDown = (e) => {
      handleOverlayEscape(e, onClose);
    };

    win.addEventListener('keydown', handleKeyDown);
    return () => {
      win.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onClose, win]);
}
