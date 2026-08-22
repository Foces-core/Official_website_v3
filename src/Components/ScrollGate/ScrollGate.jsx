import { Suspense, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import SectionSkeleton from '../SectionSkeleton/SectionSkeleton';
import { isDesktopViewport } from '../../utils/breakpoints.js';
import { shouldMountAtBoot, shouldMountSection } from './scrollGateLogic.js';

// Real section heights, cached after first mount so the placeholder matches
// the real content on subsequent visits (no layout shift on return). Keyed by
// `id + viewport bucket` because the carousels are responsive (slidesPerView
// 1/2/3 by width) — a desktop-measured height reused on a phone would be wrong.
const measuredHeights = new Map();

// Coarse viewport bucket so desktop vs mobile heights never collide in the cache.
function viewportBucket() {
  if (typeof window === 'undefined') return 'unknown';
  return isDesktopViewport(window.innerWidth) ? 'desktop' : 'mobile';
}

/**
 * ScrollGate — keep an expensive lazy section unmounted until it approaches
 * the viewport or until the initial above-the-fold content settles and the
 * browser is idle, so initial LCP/FCP is instantaneous while background sections
 * are ready without delay.
 *
 * Triggers:
 *   - IntersectionObserver with a generous rootMargin
 *   - a rAF-throttled scroll listener as an instant jump fallback
 *   - idle callback pre-mount once on-screen resources finish loading
 *
 * Once mounted, the section stays mounted (no un-mount on scroll-away).
 */
export default function ScrollGate({ id, placeholderHeight = '110vh', label, children }) {
  const [mounted, setMounted] = useState(false);
  // Before the first user scroll, below-fold sections stay deferred (boot
  // must not download/evaluate their chunks). The first scroll event arms the
  // normal pre-load margin. Anchor jumps still work: the wrapper owns the
  // section id, so navigationCoordinator finds it, scrolls, and the resulting
  // scroll event arms the gate before content is needed.
  const [armed, setArmed] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (armed) return;
    const arm = () => setArmed(true);
    window.addEventListener('scroll', arm, { passive: true, once: true });
    return () => window.removeEventListener('scroll', arm);
  }, [armed]);

  useEffect(() => {
    if (mounted) return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setMounted(true); // no IO support — never block content
      return;
    }

    const MOUNT_MARGIN_VIEWPORTS = 0.5;
    const MOUNT_MARGIN_PX = window.innerHeight * MOUNT_MARGIN_VIEWPORTS;

    let io = null;
    const mount = () => setMounted(true);

    // 1. IntersectionObserver: fires reliably during real (incremental) scrolling
    io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          mount();
          io?.disconnect();
        }
      },
      { rootMargin: `0px 0px ${MOUNT_MARGIN_PX}px 0px` },
    );
    io.observe(el);

    // 2. Programmatic jump fallback — boot rule before first scroll, full
    //    margin once armed.
    let rafId = 0;
    const checkPosition = () => {
      const top = el.getBoundingClientRect().top;
      const ok = armed
        ? shouldMountSection(top, window.innerHeight, MOUNT_MARGIN_VIEWPORTS)
        : shouldMountAtBoot(top, window.innerHeight);
      if (ok) mount();
    };
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkPosition);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    checkPosition();

    return () => {
      io?.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mounted, armed]);

  // Cache the real height once the section's content lands. ResizeObserver —
  // not a mount-timed read — because when `mounted` flips, the inner lazy
  // section is still suspended, so an immediate read would measure the
  // skeleton. This fires again when the real content replaces it.
  useEffect(() => {
    if (!mounted) return;
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const bucket = viewportBucket();
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h > 0) measuredHeights.set(`${id}:${bucket}`, h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted, id]);

  const cachedHeight = measuredHeights.get(`${id}:${viewportBucket()}`);
  const skeletonHeight = cachedHeight ? `${Math.round(cachedHeight)}px` : placeholderHeight;

  return (
    <div ref={wrapRef} id={id} className="scroll-mt-24">
      {mounted ? (
        // The lazy section resolves its own Suspense fallback while the chunk
        // downloads — but by then we're ~1 viewport away, so the skeleton is
        // barely seen and the download overlaps the scroll.
        <Suspense fallback={<SectionSkeleton height={skeletonHeight} label={label} />}>
          {children}
        </Suspense>
      ) : (
        // NOT role=status: this placeholder is not a loading state — the
        // section is merely deferred until scrolled to. role=status would
        // make screen readers announce "Loading featuring" at page load for
        // content the user hasn't asked for yet.
        <SectionSkeleton height={skeletonHeight} label={label} announce={false} />
      )}
    </div>
  );
}

ScrollGate.propTypes = {
  id: PropTypes.string.isRequired,
  placeholderHeight: PropTypes.string,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
