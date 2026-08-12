import { Suspense, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import SectionSkeleton from '../SectionSkeleton/SectionSkeleton';

// Real section heights, cached after first mount so the placeholder matches
// the real content on subsequent visits (no layout shift on return). Keyed by
// `id + viewport bucket` because the carousels are responsive (slidesPerView
// 1/2/3 by width) — a desktop-measured height reused on a phone would be wrong.
const measuredHeights = new Map();

// Coarse viewport bucket so desktop vs mobile heights never collide in the cache.
function viewportBucket() {
  if (typeof window === 'undefined') return 'unknown';
  return window.innerWidth >= 768 ? 'desktop' : 'mobile';
}

/**
 * ScrollGate — keep an expensive lazy section unmounted until it approaches
 * the viewport, so its chunk (and its transitive deps, e.g. swiper-vendor)
 * is never downloaded or evaluated at boot.
 *
 * The section's id lives on THIS wrapper, not on the inner section — the
 * wrapper is always present, so anchor navigation, the navbar scrollspy, and
 * tests that query `#sectionId` all find a real element. The real section
 * must NOT repeat the id (duplicate ids broke the earlier attempt).
 *
 * Triggers:
 *   - IntersectionObserver with a generous rootMargin, so the chunk starts
 *     downloading ~1 viewport before the section is actually visible
 *   - a rAF-throttled scroll listener as a fallback: an instant programmatic
 *     jump (e.g. scrollTo(0, max)) can pass a sentinel in one frame and
 *     IntersectionObserver can miss it — the scroll check cannot.
 *
 * Once mounted, the section stays mounted (no un-mount on scroll-away).
 */
export default function ScrollGate({ id, placeholderHeight = '110vh', label, children }) {
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (mounted) return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setMounted(true); // no IO support — never block content
      return;
    }

    // Load once the section's top is within ~1.5 viewports of the top of the
    // page. This is deliberately TIGHT: Featuring starts at ~200vh (hero 100vh
    // + about ~100vh), so a wide margin would mount it at boot — defeating the
    // whole point. 0.5 viewport below the fold gives the chunk ~half a viewport
    // of scroll to download while the skeleton fallback holds the space.
    const MOUNT_MARGIN_PX = window.innerHeight * 0.5;

    let io = null;
    const mount = () => setMounted(true);

    // IntersectionObserver: fires reliably during real (incremental) scrolling
    // and catches anchor-jump cases where the wrapper lands in the margin band.
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

    // Fallback: instant programmatic jumps can skip the IO margin band in one
    // frame (measured in the earlier scroll-gate attempt). A scroll listener
    // always fires at the final position, so check the geometry directly.
    let rafId = 0;
    const checkPosition = () => {
      const rect = el.getBoundingClientRect();
      // Mount when the section top is within the margin below the fold OR
      // already above it (user scrolled past — catch up and mount anyway).
      if (rect.top <= window.innerHeight + MOUNT_MARGIN_PX) mount();
    };
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkPosition);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Also catch layout changes (e.g. a lazy section above shifts this one down)
    window.addEventListener('resize', onScroll);

    // Initial check — a section already near the fold at load mounts at once.
    checkPosition();

    return () => {
      io?.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mounted]);

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
