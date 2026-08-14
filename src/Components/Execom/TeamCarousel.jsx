import { useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, EffectCube, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/navigation';
import BlurImage from '../BlurImage/BlurImage';
import {
  syncCarouselKeyboard,
  subscribeKeyboardArbitration,
  registerWidget,
  rectIsOnScreen,
} from '../../utils/keyboardLock.js';
import { normalizeIndex, wrapTarget } from './carouselWrap.js';
import '../Execom/custom.css';

/**
 * TeamCarousel — one swiper for both Execom variants.
 *
 * Previously Execom carried two near-duplicate swiper blocks (desktop
 * cube/slider + mobile cube) differing only in a handful of props, plus two
 * identical 11-dot indicators and two identical slide renderers. This
 * component owns all of that: the swiper, the slide cards, the dots, the
 * seamless-wrap handler, the arrow-key arbitration registration, and the
 * on-screen autoplay gate. Execom just renders two instances with the
 * variant-specific props.
 *
 * Both instances stay in the DOM (the other is hidden via CSS), so the E2E
 * selectors — .execom-swiper, .execom-cube-swiper, .container-execom and the
 * dots div as the swiper's direct sibling — are unchanged.
 */
function TeamCarousel({
  widgetId,
  variant,
  slides,
  slidesData,
  flatCube,
  disableAutoplay,
  activeIndex,
  onActiveChange,
}) {
  const swiperRef = useRef(null);
  const wrapRef = useRef(null);

  const total = slidesData.length;
  const isDesktop = variant === 'desktop';

  // No swipe-shadows: they are the cube's #1 GPU cost and read as a black
  // smear on the near-black site background.
  const cubeEffectConfig = { shadow: false, slideShadows: false };

  // Seamless infinite wrap (math in carouselWrap.js): the cube rotates 90°
  // per face, so Swiper's loop mode can't be used — 3 copies of the cards are
  // rendered and a 0ms jump between copies makes the wrap invisible (index 0
  // and 32 share the same cube orientation). The flat slider uses the same
  // copies instead of loop mode: Swiper's loop with only ~3× slidesPerView
  // jams at its append boundary (autoplay/keyboard advance a few times, then
  // freeze).
  const handleWrap = useCallback(
    (swiper) => {
      if (!swiper) return;
      const idx = swiper.activeIndex;
      onActiveChange(normalizeIndex(idx, total));

      const target = wrapTarget(idx, total);
      if (target !== null) {
        swiper.slideTo(target, 0);
        // The 0ms jump fires no DOM transitionend, so Swiper autoplay's
        // transition-wait would stay paused forever — nudge it back on.
        swiper.autoplay?.resume();
      }
    },
    [onActiveChange, total],
  );

  // Arrow-key arbitration (see utils/keyboardLock.js): this carousel counts
  // as "on screen" only while its swiper is actually rendered/visible (the
  // other variant is hidden via CSS, which rectIsOnScreen detects), and it
  // enables its keyboard only while it owns the arrows. The widget's `el` is
  // the WRAPPER div (parent of both the swiper AND the dots) — that way the
  // dots are "inside" the widget, so clicking one keeps the arrow keys
  // driving the carousel (same containment the original Execom had).
  useEffect(() => {
    const unregister = registerWidget(
      widgetId,
      () => rectIsOnScreen(swiperRef.current?.el, 60),
      wrapRef.current,
    );
    const sync = () => syncCarouselKeyboard(swiperRef.current, widgetId);
    sync(); // ownership may already be decided before this runs
    const unsub = subscribeKeyboardArbitration(sync);
    return () => {
      unregister();
      unsub();
    };
  }, [widgetId]);

  // Only run autoplay while the carousel is actually on screen — at high CPU
  // throttle (or on low-end phones), a slider spinning off-screen is pure
  // wasted frames.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const swiper = swiperRef.current;
        if (!swiper) return;
        if (entry.isIntersecting) {
          if (!disableAutoplay) swiper.autoplay?.start();
        } else {
          swiper.autoplay?.stop();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [disableAutoplay]);

  const containerClass = isDesktop
    ? `hidden sm:block ${flatCube ? '' : 'max-w-[360px] mx-auto py-4'}`
    : 'block sm:hidden max-w-[320px] mx-auto py-4';

  const autoplay = disableAutoplay
    ? false
    : { delay: isDesktop ? 3500 : 2500, disableOnInteraction: false };

  return (
    <div ref={wrapRef} className={containerClass}>
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          syncCarouselKeyboard(swiper, widgetId);
        }}
        modules={[Autoplay, Navigation, EffectCube, Keyboard]}
        effect={flatCube ? 'slide' : 'cube'}
        speed={flatCube ? 250 : 400}
        cubeEffect={cubeEffectConfig}
        grabCursor={isDesktop ? !flatCube : true}
        spaceBetween={flatCube ? 20 : 0}
        slidesPerView={1}
        initialSlide={total}
        autoplay={autoplay}
        navigation={isDesktop && flatCube}
        keyboard={{ enabled: true, onlyInViewport: false }}
        // Wrap on transition END (not slideChange): the 0ms wrap jump emits
        // no transitionend, which would leave Swiper autoplay paused forever.
        onTouchEnd={handleWrap}
        onTransitionEnd={handleWrap}
        breakpoints={
          flatCube && isDesktop
            ? {
                640: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
                1280: { slidesPerView: 4, spaceBetween: 24 },
              }
            : undefined
        }
        className={isDesktop ? 'execom-swiper pb-12' : 'execom-cube-swiper'}
      >
        {slides.map((d, index) => (
          <SwiperSlide key={index}>
            <div
              className={`container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden ${
                isDesktop ? 'group' : ''
              }`}
            >
              <BlurImage
                className={`object-cover ${
                  d.name === 'Sebin Mathew' ? 'object-center' : 'object-top'
                } w-full h-full ${isDesktop ? 'card-hover' : ''} grayscale group-hover:filter-none transition-all duration-300`}
                src={d.img}
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
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom 11-dot indicator — Swiper's loop was replaced with duplicated
          slides, so its pagination (which would render 3× bullets) can't be
          used. Sits as the swiper's direct sibling (selectors in the E2E
          suite depend on .execom-swiper + div / .execom-cube-swiper + div). */}
      <div className="flex justify-center gap-2 mt-2 pb-1">
        {slidesData.map((d, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ${d.name}`}
            onClick={() => {
              const sw = swiperRef.current;
              if (!sw) return;
              const copy = Math.floor(sw.activeIndex / total);
              sw.slideTo(copy * total + i, 350);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeIndex === i ? 'w-6 bg-[#007aff]' : 'w-2 bg-[#4f4f54]'
            }`}
          />
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

TeamCarousel.defaultProps = {
  flatCube: false,
  disableAutoplay: false,
  activeIndex: 0,
  onActiveChange: () => {},
};

export default TeamCarousel;
