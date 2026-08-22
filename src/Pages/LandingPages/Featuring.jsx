import { useState, useEffect, useRef, useCallback } from 'react';
import { useViewportWidth } from '../../hooks/useViewportWidth.js';
import useCarousel from '../../hooks/useCarousel.js';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import useExperienceCapabilities from '../../hooks/useExperienceCapabilities.js';
import BlurImage from '../../Components/BlurImage/BlurImage';
import featuring from '../../assets/featuring.svg';
import { echoSlides, carouselSlides } from '../../data/echoSlides.js';
import { getFeaturingLayout } from '../../utils/viewportPolicy.js';
import { copyFor } from '../../utils/carouselWrap.js';
import useCarouselKeyboard from '../../hooks/useCarouselKeyboard.js';
import './Featuring.css';

function Featuring() {
  // The reducedMotion || lowPower dialect lives in the experience-tier
  // matrix — autoplay is a full-tier capability.
  const { autoplay } = useExperienceCapabilities();
  const disableAutoplay = !autoplay;
  const viewportWidth = useViewportWidth();
  const {
    slidesPerView: noSlides,
    spaceBetween,
    sizes: slideSizes,
  } = getFeaturingLayout(viewportWidth);
  const [activeSlide, setActiveSlide] = useState(0);
  const elRef = useRef(null);
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);

  const { instanceRef, trackRef } = useCarousel({
    elRef,
    wrapperRef: sectionRef,
    total: echoSlides.length,
    mode: 'flat',
    slidesPerView: noSlides,
    spaceBetween,
    autoplayDelay: disableAutoplay ? 0 : 3500,
    initialIndex: echoSlides.length,
    onActiveChange: setActiveSlide,
  });

  // Arrow-key arbitration: one deep module, one line (see hooks/useCarouselKeyboard.js).
  useCarouselKeyboard({
    widgetId: 'featuring',
    instanceRef,
    wrapperRef: sectionRef,
  });

  // The seamless loop renders 3 copies of the slides; label each copy with
  // the real position so screen readers announce "1 / 4" instead of "N / 12".
  // (The old Swiper set these on the slides in its onSwiper hook.)
  useEffect(() => {
    const slides = instanceRef.current?.slides;
    if (!slides) return;
    slides.forEach((el, i) =>
      el.setAttribute('aria-label', `${(i % echoSlides.length) + 1} / ${echoSlides.length}`),
    );
  }, [instanceRef]);

  const goToSlide = useCallback(
    (i) => {
      const sw = instanceRef.current;
      if (!sw) return;
      const copy = copyFor(sw.activeIndex, echoSlides.length);
      sw.slideTo(copy * echoSlides.length + i, 350);
    },
    [instanceRef],
  );

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
          onClick={() => instanceRef.current?.slidePrev()}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm"
        >
          <FaChevronLeft />
        </button>
        <div ref={elRef} className="feat-swiper bg-transparent h-fit w-full">
          <div ref={trackRef} className="swiper-wrapper">
            {carouselSlides.map(({ image, imageSet, blur, alt }, index) => (
              <div
                key={index}
                role="group"
                aria-roledescription="slide"
                className="swiper-slide px-3 pt-9 pb-8 bg-transparent"
              >
                {/* data-aos lives on the wrapper, not the img: AOS's [data-aos]
                    opacity rules would override the blur-up fade (higher CSS
                    specificity than Tailwind's opacity-0/100), so the reveal
                    animates the whole card while BlurImage fades independently. */}
                <div data-aos="flip-right" data-aos-duration="1000">
                  <BlurImage
                    className="h-full w-full rounded-2xl object-cover transition-all duration-300 shadow-xl hover:scale-105 hover:ring-2 hover:ring-white/50 hover:shadow-[0_0_25px_6px_rgba(255,255,255,0.25)]"
                    src={image}
                    srcSet={imageSet}
                    sizes={slideSizes}
                    blurSrc={blur}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label="Next ECHO photos"
          onClick={() => instanceRef.current?.slideNext()}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm"
        >
          <FaChevronRight />
        </button>
      </div>
      {/* Custom 4-dot indicator — the 3-copy wrap means the dots can't be
          generated from the raw index; they map to the logical slides and
          jump within the current copy. */}
      <div className="flex justify-center gap-2 mt-2 feat-dots">
        {echoSlides.map((slide, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ${slide.alt}`}
            onClick={() => goToSlide(i)}
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
