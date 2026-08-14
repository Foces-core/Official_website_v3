import { useState, useEffect, useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Scrollbar, A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import useDeviceProfile from '../../hooks/useLowPower.js';
import featuring from '../../assets/featuring.svg';
import episodeOne from '../../assets/episode-1.webp';
import episodeOne480 from '../../assets/episode-1-480.webp';
import episodeOne960 from '../../assets/episode-1-960.webp';
import series from '../../assets/series.webp';
import series480 from '../../assets/series-480.webp';
import series960 from '../../assets/series-960.webp';
import fourth from '../../assets/fourth.webp';
import fourth480 from '../../assets/fourth-480.webp';
import fourth960 from '../../assets/fourth-960.webp';
import mentorReveal from '../../assets/Mentor_reveal.webp';
import mentorReveal480 from '../../assets/Mentor_reveal-480.webp';
import mentorReveal960 from '../../assets/Mentor_reveal-960.webp';
import { srcset } from '../../utils/srcset.js';
import { featuringSlidesPerView } from '../../utils/breakpoints.js';
import {
  syncCarouselKeyboard,
  subscribeKeyboardArbitration,
  registerWidget,
  markInteracted,
  rectIsOnScreen,
} from '../../utils/keyboardLock.js';
import './Featuring.css';

const echoSlides = [
  {
    image: episodeOne,
    imageSet: srcset([
      [episodeOne, 1280],
      [episodeOne960, 960],
      [episodeOne480, 480],
    ]),
    alt: 'ECHO - Episode 1',
  },
  {
    image: series,
    imageSet: srcset([
      [series, 1280],
      [series960, 960],
      [series480, 480],
    ]),
    alt: 'ECHO Series',
  },
  {
    image: mentorReveal,
    imageSet: srcset([
      [mentorReveal, 1280],
      [mentorReveal960, 960],
      [mentorReveal480, 480],
    ]),
    alt: 'ECHO - Mentor Reveal',
  },
  {
    image: fourth,
    imageSet: srcset([
      [fourth, 1280],
      [fourth960, 960],
      [fourth480, 480],
    ]),
    alt: 'ECHO - Fourth',
  },
];

// Swiper's loop mode jams at its append boundary when there are only slightly
// more slides than slidesPerView (4 slides / up to 3 per view): autoplay and
// keyboard both advance once and then freeze (the loopFix re-targets the same
// slide). So — like the Execom cube — we render 3 copies of the 4 slides and
// wrap with a 0ms jump between copies (indices 4 and 8 show the same content
// as index 0), with no loop mode at all.
const carouselSlides = [...echoSlides, ...echoSlides, ...echoSlides];

function Featuring() {
  const { reducedMotion } = useDeviceProfile();
  const disableAutoplay = reducedMotion;
  const [noSlides, setNoSlides] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const swiperRef = useRef(null);
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);

  // Seamless infinite wrap: as soon as a copy boundary is crossed, jump 0ms
  // to the equivalent slide in the adjacent copy (same content → invisible).
  const handleWrap = useCallback((swiper) => {
    if (!swiper) return;
    const total = echoSlides.length;
    const idx = swiper.activeIndex;
    setActiveSlide(idx % total);

    if (idx >= total * 2) {
      swiper.slideTo(idx - total, 0);
      // The 0ms jump fires no DOM transitionend, so Swiper autoplay's
      // transition-wait would stay paused forever — nudge it back on.
      swiper.autoplay?.resume();
    } else if (idx < total) {
      swiper.slideTo(idx + total, 0);
      swiper.autoplay?.resume();
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setNoSlides(featuringSlidesPerView(window.innerWidth));
    };

    handleResize(); // Initial setup

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
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

  // IntersectionObserver: start/stop autoplay only when on screen
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !carouselRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!swiperRef.current) return;
        if (entry.isIntersecting) {
          if (!disableAutoplay) swiperRef.current.autoplay?.start();
        } else {
          swiperRef.current.autoplay?.stop();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(carouselRef.current);
    return () => observer.disconnect();
  }, [disableAutoplay]);

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
          {carouselSlides.map(({ image, imageSet, alt }, index) => (
            <SwiperSlide key={index} className="px-3 pt-9 pb-8 bg-transparent">
              <img
                className="h-full w-full rounded-2xl object-cover transition-all duration-300 shadow-xl hover:scale-105 hover:ring-2 hover:ring-white/50 hover:shadow-[0_0_25px_6px_rgba(255,255,255,0.25)]"
                src={image}
                srcSet={imageSet}
                sizes="(min-width: 768px) 33vw, (min-width: 500px) 50vw, 90vw"
                alt={alt}
                loading="lazy"
                decoding="async"
                data-aos="flip-right"
                data-aos-duration="1000"
              />
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
              const copy = Math.floor(sw.activeIndex / echoSlides.length);
              sw.slideTo(copy * echoSlides.length + i, 350);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeSlide === i ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default Featuring;
