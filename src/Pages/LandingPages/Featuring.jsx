import { useState, useEffect, useRef, useCallback } from 'react';
import { useViewportWidth } from '../../hooks/useViewportWidth.js';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Scrollbar, A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import useDeviceProfile from '../../hooks/useLowPower.js';
import { useAutoplayOnScreen } from '../../hooks/useAutoplayOnScreen.js';
import BlurImage from '../../Components/BlurImage/BlurImage';
import featuring from '../../assets/featuring.svg';
import { echoSlides, carouselSlides } from '../../data/echoSlides.js';
import { featuringSlidesPerView, DESKTOP_MIN, SMALL_SCREEN_MAX } from '../../utils/breakpoints.js';
import { normalizeIndex, wrapTarget, copyFor } from '../../utils/carouselWrap.js';
import {
  syncCarouselKeyboard,
  subscribeKeyboardArbitration,
  registerWidget,
  markInteracted,
  rectIsOnScreen,
} from '../../utils/keyboardLock.js';
import './Featuring.css';

function Featuring() {
  const { reducedMotion } = useDeviceProfile();
  const disableAutoplay = reducedMotion;
  const noSlides = featuringSlidesPerView(useViewportWidth());
  const [activeSlide, setActiveSlide] = useState(0);
  const swiperRef = useRef(null);
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);

  // Seamless infinite wrap: as soon as a copy boundary is crossed, jump 0ms
  // to the equivalent slide in the adjacent copy (same content → invisible).
  // The copy math lives in the shared, tested carouselWrap seam (same module
  // TeamCarousel uses); this handler only performs the swiper side effects.
  const handleWrap = useCallback((swiper) => {
    if (!swiper) return;
    const total = echoSlides.length;
    const idx = swiper.activeIndex;
    setActiveSlide(normalizeIndex(idx, total));

    const target = wrapTarget(idx, total);
    if (target != null) {
      swiper.slideTo(target, 0);
      // The 0ms jump fires no DOM transitionend, so Swiper autoplay's
      // transition-wait would stay paused forever — nudge it back on.
      swiper.autoplay?.resume();
    }
  }, []);

  // Arrow-key arbitration (see utils/keyboardLock.js): register the carousel
  // as a widget and enable its keyboard only while it owns the arrows (on
  // screen + last interacted). Pointer use on the carousel area (slides,
  // arrows, dots) marks it — not clicks on the section heading.
  useEffect(() => {
    const id = 'featuring';
    const unregister = registerWidget(
      id,
      () => rectIsOnScreen(swiperRef.current?.el, 60),
      sectionRef.current, // section wrapper includes the arrows AND the dot indicator
    );
    const sync = () => syncCarouselKeyboard(swiperRef.current, id);
    const mark = () => markInteracted(id);
    sync(); // ownership may already be decided before this runs
    const carouselEl = carouselRef.current;
    carouselEl?.addEventListener('pointerdown', mark, true);
    const unsub = subscribeKeyboardArbitration(sync);
    return () => {
      unregister();
      unsub();
      carouselEl?.removeEventListener('pointerdown', mark, true);
    };
  }, []);

  // Only run autoplay while the carousel is on screen (shared seam —
  // useAutoplayOnScreen, same hook TeamCarousel uses).
  useAutoplayOnScreen({ elementRef: carouselRef, swiperRef, disable: disableAutoplay });

  // The section id lives on the ScrollGate wrapper in App.jsx, not here —
  // the wrapper is always present, so anchors/scrollspy always find it.
  return (
    <div
      ref={sectionRef}
      className="bg-[#101011] h-fit w-full flex flex-col pt-32 overflow-x-hidden pb-20 scroll-mt-24"
    >
      <div className="flex items-center h-20 pb-9">
        <div className="flex items-center justify-center w-full">
          <img
            className="w-72 h-[45%] pl-2.5"
            data-aos="flip-up"
            data-aos-duration="750"
            src={featuring}
            alt="Featuring"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      <div
        ref={carouselRef}
        className="flex pt-10 justify-center items-center overflow-hidden relative"
      >
        {/* Arrow indicators: hint the carousel is scrollable/infinite */}
        <button
          type="button"
          aria-label="Previous ECHO photos"
          onClick={() => swiperRef.current?.slidePrev()}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm"
        >
          <FaChevronLeft />
        </button>
        <Swiper
          modules={[Autoplay, Scrollbar, A11y, Keyboard]}
          slidesPerView={noSlides}
          spaceBetween={50}
          initialSlide={echoSlides.length}
          autoplay={disableAutoplay ? false : { delay: 3500, disableOnInteraction: false }}
          scrollbar={{ draggable: true }}
          keyboard={{ enabled: true, onlyInViewport: false }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            syncCarouselKeyboard(swiper, 'featuring');
            // The seamless loop renders 3 copies of 4 slides; tell screen
            // readers the real count instead of "N / 12".
            swiper.slides.forEach((el, i) =>
              el.setAttribute(
                'aria-label',
                `${(i % echoSlides.length) + 1} / ${echoSlides.length}`,
              ),
            );
          }}
          // Wrap on transition END (not slideChange): the 0ms wrap jump emits
          // no transitionend, which would leave Swiper autoplay paused forever.
          onTouchEnd={handleWrap}
          onTransitionEnd={handleWrap}
          className="feat-swiper bg-transparent h-fit"
        >
          {carouselSlides.map(({ image, imageSet, blur, alt }, index) => (
            <SwiperSlide key={index} className="px-3 pt-9 pb-8 bg-transparent">
              {/* data-aos lives on the wrapper, not the img: AOS's [data-aos]
                  opacity rules would override the blur-up fade (higher CSS
                  specificity than Tailwind's opacity-0/100), so the reveal
                  animates the whole card while BlurImage fades independently. */}
              <div data-aos="flip-right" data-aos-duration="1000">
                <BlurImage
                  className="h-full w-full rounded-2xl object-cover transition-all duration-300 shadow-xl hover:scale-105 hover:ring-2 hover:ring-white/50 hover:shadow-[0_0_25px_6px_rgba(255,255,255,0.25)]"
                  src={image}
                  srcSet={imageSet}
                  sizes={`(min-width: ${DESKTOP_MIN}px) 33vw, (min-width: ${SMALL_SCREEN_MAX}px) 50vw, 90vw`}
                  blurSrc={blur}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <button
          type="button"
          aria-label="Next ECHO photos"
          onClick={() => swiperRef.current?.slideNext()}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm"
        >
          <FaChevronRight />
        </button>
      </div>
      {/* Custom 4-dot indicator — Swiper's loop mode was replaced with duplicated
          slides, so its pagination (which would render 12 bullets) can't be used. */}
      <div className="flex justify-center gap-2 mt-2 feat-dots">
        {echoSlides.map((slide, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ${slide.alt}`}
            onClick={() => {
              const sw = swiperRef.current;
              if (!sw) return;
              const copy = copyFor(sw.activeIndex, echoSlides.length);
              sw.slideTo(copy * echoSlides.length + i, 350);
            }}
            // 8px dot on a 24px hit area (WCAG 2.2.8 target size): the button
            // is a genuine 24×24 box (min-w-6/min-h-6) with the visible dot
            // centered inside — no padding/margin tricks, which axe reads as
            // overlapping targets.
            className="flex items-center justify-center min-w-6 min-h-6 rounded-full"
          >
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
                activeSlide === i ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default Featuring;
