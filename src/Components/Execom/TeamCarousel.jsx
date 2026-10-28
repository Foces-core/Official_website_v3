import { useRef, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import useCarousel from '../../hooks/useCarousel.js';
import { useViewportWidth } from '../../hooks/useViewportWidth.js';
import useIdleReveal from '../../hooks/useIdleReveal.js';
import BlurImage from '../BlurImage/BlurImage';
import useCarouselKeyboard from '../../hooks/useCarouselKeyboard.js';
import { copyFor, neighborIndices, shouldSyncCarouselIndex } from '../../utils/carouselWrap.js';
import { getTeamLayout } from '../../utils/viewportPolicy.js';
import { prioritizeAssetFetch } from '../../utils/priorityScheduler.js';

import '../Execom/custom.css';

/**
 * TeamCarousel — one hand-rolled carousel for both Execom variants.
 *
 * Previously this was two near-duplicate Swiper blocks (desktop cube/slider +
 * mobile cube) — now both render through the shared useCarousel seam, which
 * owns the mobile 3D cube (rotateY 90° per face, no shadows — they smear on the dark
 * bg), the flat desktop carousel and low-power fallback, swipe/touch drag with
 * horizontal-only gesture ownership (touch-action: pan-y + x-axis lock, so
 * vertical swipes scroll the page), the arrow-key
 * arbitration registration, and the on-screen autoplay gate.
 *
 * The DOM contract the E2E suite and CSS rely on is unchanged: the root keeps
 * .execom-swiper / .execom-cube-swiper, slides keep .swiper-slide (with
 * data-slide-active toggled by the engine), cards keep .container-execom, and the dots
 * div stays the root's direct sibling.
 */
function TeamCarousel({
  widgetId,
  variant,
  slides,
  slidesData,
  flatCube = false,
  disableAutoplay = false,
  activeIndex = 0,
  onActiveChange = () => {},
}) {
  const elRef = useRef(null);
  const wrapRef = useRef(null);
  const [hoveredSlideIndex, setHoveredSlideIndex] = useState(null);
  const width = useViewportWidth();

  const total = slidesData.length;
  const isDesktop = variant === 'desktop';
  const useFlat = isDesktop || flatCube;

  const handleActiveChange = useCallback(
    (nextIndex) => {
      setHoveredSlideIndex(null);
      onActiveChange(nextIndex);
    },
    [onActiveChange],
  );

  // Desktop is always a flat multi-card carousel (2/3/4 per view);
  // mobile keeps the cube unless a low-power profile needs the flat fallback.
  // Re-computed reactively via
  // useViewportWidth, then fed to the hook (its re-style effect re-applies).
  const {
    slidesPerView: perView,
    spaceBetween: gap,
    sizes: cardSizes,
  } = getTeamLayout(width, useFlat, isDesktop);

  const { instanceRef, trackRef } = useCarousel({
    elRef,
    wrapperRef: wrapRef,
    total,
    mode: useFlat ? 'flat' : 'cube',
    slidesPerView: perView,
    spaceBetween: gap,
    autoplayDelay: disableAutoplay ? 0 : isDesktop ? 3500 : 2500,
    initialIndex: total,
    speed: useFlat && !isDesktop ? 250 : 400,
    onActiveChange: handleActiveChange,
  });

  // The mobile and desktop carousels stay mounted together. When this copy
  // becomes visible after a breakpoint change, align it to the index selected
  // by the carousel that was previously visible.
  useEffect(() => {
    const carousel = instanceRef.current;
    const visible = Boolean(
      wrapRef.current && getComputedStyle(wrapRef.current).display !== 'none',
    );
    if (
      carousel &&
      shouldSyncCarouselIndex({
        visible,
        currentIndex: carousel.activeIndex,
        activeIndex,
        total,
      })
    ) {
      carousel.slideTo(total + activeIndex, 0);
    }
  }, [activeIndex, instanceRef, total, width]);

  // Arrow-key arbitration: one deep module, one line (see hooks/useCarouselKeyboard.js).
  useCarouselKeyboard({ widgetId, instanceRef, wrapperRef: wrapRef });

  // Neighbor prefetch: lazy slides outside the viewport start fetching only
  // when they become visible, so a quick advance stalls on the network. Warm
  // the HTTP cache for active ±1 as soon as the active slide settles.
  useEffect(() => {
    for (const i of neighborIndices(activeIndex, total)) {
      const url = slidesData[i]?.img;
      if (url) prioritizeAssetFetch(url);
    }
  }, [activeIndex, total, slidesData]);

  const containerClass = isDesktop
    ? 'hidden sm:block px-12'
    : 'block sm:hidden max-w-[320px] mx-auto py-4';

  const showNavArrows = isDesktop;

  // Declutter: the flat-mode arrows hide after 2.5s of inactivity over the
  // carousel area and re-reveal on hover/pointer/key activity (useIdleReveal;
  // focusin keeps them visible while keyboard-focused). The dots run on
  // their OWN timer and pulse on slide change — visible while cycling, then
  // they fade. Starts visible; a hook failure can only ever leave them
  // always-on, never missing.
  const arrowsVisible = useIdleReveal(wrapRef);
  const dotsVisible = useIdleReveal(wrapRef, { pulse: activeIndex });

  const goToSlide = useCallback(
    (i) => {
      const sw = instanceRef.current;
      if (!sw) return;
      const copy = copyFor(sw.activeIndex, total);
      sw.slideTo(copy * total + i, 420);
    },
    [instanceRef, total],
  );

  return (
    <div ref={wrapRef} className={containerClass}>
      <div
        ref={elRef}
        className={`${isDesktop ? 'execom-swiper pb-12' : 'execom-cube-swiper'} relative w-full ${
          useFlat ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div ref={trackRef} className="swiper-wrapper">
          {slides.map((d, index) => (
            <div key={index} className="swiper-slide">
              <div
                className={`container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden ${
                  isDesktop ? 'group' : ''
                }`}
                onPointerMove={() => setHoveredSlideIndex(index)}
                onPointerLeave={() => setHoveredSlideIndex(null)}
              >
                <BlurImage
                  className={`object-cover ${d.imgPosition ?? 'object-top'} w-full h-full ${isDesktop ? 'card-hover' : ''} ${d.imageTone ?? ''} ${isDesktop && hoveredSlideIndex === index ? (d.imageTone ? 'grayscale-0' : 'filter-none') : 'grayscale'} transition-all duration-400`}
                  src={d.img}
                  srcSet={d.srcset}
                  sizes={cardSizes}
                  blurSrc={d.blur}
                  alt={d.name}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute rounded-b-3xl bottom-0 w-full bg-gradient-to-t from-black via-black/85 to-transparent p-4 text-left">
                  <div className="text-white text-base font-semibold italic">{d.name}</div>
                  <div className="text-gray-300 text-xs font-light">{d.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Flat desktop mode keeps prev/next arrows (Swiper's navigation was
            rendered by the library; here they're plain buttons). */}
        {showNavArrows && (
          <>
            <button
              type="button"
              aria-label="Previous team member"
              onClick={() => instanceRef.current?.slidePrev()}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-all duration-400 backdrop-blur-sm ${
                arrowsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Next team member"
              onClick={() => instanceRef.current?.slideNext()}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-all duration-400 backdrop-blur-sm ${
                arrowsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>
      {/* Custom 11-dot indicator — the 3-copy wrap means the dots can't be
          generated from the raw index; they map to the logical slides and
          jump within the current copy. Sits as the root's direct sibling
          (selectors in the E2E suite depend on .execom-swiper + div /
          .execom-cube-swiper + div). Fades with the arrows on idle — focus
          still reveals (useIdleReveal's activeElement guard). */}{' '}
      <div
        className={`flex justify-center gap-2 mt-2 pb-1 transition-all duration-400 ${
          dotsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {slidesData.map((d, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ${d.name}`}
            onClick={() => goToSlide(i)}
            // 8px dot on a 24px hit area (WCAG 2.2.8 target size): the button
            // is a genuine 24×24 box (min-w-6/min-h-6) with the visible dot
            // centered inside — no padding/margin tricks, which axe reads as
            // overlapping targets.
            className="flex items-center justify-center min-w-6 min-h-6 rounded-full"
          >
            <span
              className={`h-2 rounded-full transition-all duration-400 ${
                activeIndex === i ? 'w-6 bg-[#007aff]' : 'w-2 bg-[#4f4f54]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

TeamCarousel.propTypes = {
  widgetId: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['desktop', 'mobile']).isRequired,
  slides: PropTypes.arrayOf(PropTypes.object).isRequired,
  slidesData: PropTypes.arrayOf(PropTypes.object).isRequired,
  flatCube: PropTypes.bool,
  disableAutoplay: PropTypes.bool,
  activeIndex: PropTypes.number,
  onActiveChange: PropTypes.func,
};

export default TeamCarousel;
