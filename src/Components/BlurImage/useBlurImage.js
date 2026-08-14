import { useState, useRef, useEffect, useCallback } from 'react';
import { prioritizeAssetFetch } from '../../utils/priorityScheduler.js';

/**
 * useBlurImage — the blur-up image state machine (ADR-0009: behavior in a
 * tested module; the component wires DOM).
 *
 * Four pieces of state that used to live in BlurImage.jsx: loaded / removed
 * (placeholder) / fetch-priority elevation, plus the 500ms placeholder-
 * removal timer. Resetting them when `src` changes uses React's documented
 * "adjusting state when a prop changes" pattern: setState during render is
 * legal for the same component and re-renders before committing (no
 * stale-frame flash). Only STATE is adjusted there — refs (timer, elevation
 * guard) are off-limits during render and live in effects/event handlers.
 * For static assets `src` never changes, so the whole reset is inert.
 *
 * @param {{ src: string, blurSrc?: string, eager?: boolean }} props
 * @returns handlers + values for the <img> elements
 */
export function useBlurImage({ src, blurSrc, eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [removed, setRemoved] = useState(!blurSrc);
  const [priorityAttr, setPriorityAttr] = useState(() => (eager ? 'high' : undefined));
  const [prevSrc, setPrevSrc] = useState(src);
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  // Mirrors the old `if (!priorityAttr)` guard without reading state inside
  // an updater: elevation happens once per src, eager images never refetch.
  const elevatedRef = useRef(eager);

  // Reset the machine when the src (or its placeholder) changes.
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setRemoved(!blurSrc);
    setPriorityAttr(eager ? 'high' : undefined);
  }

  // Per-src bookkeeping that cannot happen during render: reset the elevation
  // guard for the new src, and clear a pending placeholder-removal timer from
  // the previous src (the cleanup runs before the next src's effects, and on
  // unmount).
  useEffect(() => {
    elevatedRef.current = eager;
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [src, eager]);

  // An already-complete image (browser cache) is loaded from the first frame.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src, blurSrc]);

  const handleInteraction = useCallback(() => {
    if (elevatedRef.current) return;
    elevatedRef.current = true;
    setPriorityAttr('high');
    prioritizeAssetFetch(src);
  }, [src]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    // Remove the placeholder from the DOM after the cross-fade completes
    timerRef.current = setTimeout(() => setRemoved(true), 500);
  }, []);

  const handleError = useCallback(() => {
    // Reveal the image element on error so broken image / alt text renders
    // instead of an invisible node
    setLoaded(true);
    setRemoved(true);
  }, []);

  return { imgRef, loaded, removed, priorityAttr, handleLoad, handleError, handleInteraction };
}
