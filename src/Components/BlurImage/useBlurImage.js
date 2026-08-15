import { useReducer, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { prioritizeAssetFetch } from '../../utils/priorityScheduler.js';

/**
 * blurImageReducer — the pure state machine behind the blur-up image
 * (ADR-0009: behavior in a tested module; the hook and component wire it).
 *
 * Every state write in the hook funnels through here, so the four-transition
 * contract is unit-testable without a DOM:
 *   - SRC_CHANGED  — reset for a new src/placeholder/policy pair (no-op when
 *                    the src is unchanged, letting useReducer skip re-renders)
 *   - LOADED       — full image visible, blur layer starts cross-fading
 *   - ERROR        — reveal the element so broken-image alt text renders
 *   - INTERACT     — elevate fetch priority once per src (eager images are
 *                    already 'high' → no-op)
 *   - REMOVE_PLACEHOLDER — drop the blur layer after the 500ms cross-fade
 *
 * `loaded`/`removed`/`priorityAttr` map 1:1 to the four states that used to
 * be separate useState calls in BlurImage.jsx (mount, loaded, failed,
 * removed, elevated). The src-change reset used to run setState during
 * render (`if (src !== prevSrc) …`); the hook now feeds SRC_CHANGED from a
 * layout effect so the render phase stays pure.
 *
 * @param {{ type: string, src: string, blurSrc?: string, eager?: boolean }} action
 * @returns {{ loaded: boolean, removed: boolean, priorityAttr: string | undefined,
 *             prevSrc: string }}
 */
export function initialState({ src, blurSrc, eager }) {
  return {
    loaded: false,
    removed: !blurSrc,
    priorityAttr: eager ? 'high' : undefined,
    prevSrc: src,
  };
}

export function blurImageReducer(state, action) {
  switch (action.type) {
    case 'SRC_CHANGED':
      // Bail when the src is unchanged: SRC_CHANGED is dispatched on every
      // mount/update cycle, and returning the SAME state object is what tells
      // useReducer to skip the re-render.
      if (action.src === state.prevSrc) return state;
      return initialState({ src: action.src, blurSrc: action.blurSrc, eager: action.eager });
    case 'LOADED':
      return { ...state, loaded: true };
    case 'ERROR':
      // Reveal the image element on error so broken image / alt text renders
      // instead of an invisible node
      return { ...state, loaded: true, removed: true };
    case 'INTERACT':
      // Elevation is one-shot per src; eager images start at 'high' so the
      // first interaction is already a no-op.
      if (state.priorityAttr === 'high') return state;
      return { ...state, priorityAttr: 'high' };
    case 'REMOVE_PLACEHOLDER':
      return { ...state, removed: true };
    default:
      return state;
  }
}

/**
 * useBlurImage — the blur-up image state machine. Four pieces of state that
 * used to live in BlurImage.jsx: loaded / removed (placeholder) / fetch
 * priority elevation, plus the 500ms placeholder-removal timer.
 *
 * The reducer owns all transitions (see blurImageReducer); the hook only
 * feeds it events and performs side effects that cannot live in a reducer
 * (the 500ms timer, the priority-elevation fetch guard, the cached-image
 * fast path). `src` changes are dispatched from a useLayoutEffect — not from
 * the render body — so the render phase stays free of state writes; the
 * layout timing means the reset lands before paint (no stale-frame flash).
 *
 * @param {{ src: string, blurSrc?: string, eager?: boolean }} props
 * @returns handlers + values for the <img> elements
 */
export function useBlurImage({ src, blurSrc, eager = false }) {
  const [state, dispatch] = useReducer(blurImageReducer, { src, blurSrc, eager }, initialState);
  const { loaded, removed, priorityAttr } = state;
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  // Mirrors the old `if (!priorityAttr)` guard without reading state inside
  // an updater: elevation happens once per src, eager images never refetch.
  // It guards the prioritizeAssetFetch SIDE EFFECT, so it stays in a ref —
  // the reducer must remain pure.
  const elevatedRef = useRef(eager);

  // Feed src/placeholder/policy changes to the reducer. Dispatched from a
  // layout effect (before paint, so no stale frame) rather than during
  // render; the reducer bails when nothing changed.
  useLayoutEffect(() => {
    dispatch({ type: 'SRC_CHANGED', src, blurSrc, eager });
  }, [src, blurSrc, eager]);

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
    if (img && img.complete && img.naturalWidth > 0) dispatch({ type: 'LOADED' });
  }, [src, blurSrc]);

  const handleInteraction = useCallback(() => {
    if (elevatedRef.current) return;
    elevatedRef.current = true;
    dispatch({ type: 'INTERACT' });
    prioritizeAssetFetch(src);
  }, [src]);

  const handleLoad = useCallback(() => {
    dispatch({ type: 'LOADED' });
    // Remove the placeholder from the DOM after the cross-fade completes
    timerRef.current = setTimeout(() => dispatch({ type: 'REMOVE_PLACEHOLDER' }), 500);
  }, []);

  const handleError = useCallback(() => {
    dispatch({ type: 'ERROR' });
  }, []);

  return { imgRef, loaded, removed, priorityAttr, handleLoad, handleError, handleInteraction };
}
