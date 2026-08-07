import { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Scrollbar, A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
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
import './Featuring.css';

const echoSlides = [
  { image: episodeOne, imageSet: srcset([[episodeOne, 1280], [episodeOne960, 960], [episodeOne480, 480]]), alt: "ECHO - Episode 1" },
  { image: series, imageSet: srcset([[series, 1280], [series960, 960], [series480, 480]]), alt: "ECHO Series" },
  { image: mentorReveal, imageSet: srcset([[mentorReveal, 1280], [mentorReveal960, 960], [mentorReveal480, 480]]), alt: "ECHO - Mentor Reveal" },
  { image: fourth, imageSet: srcset([[fourth, 1280], [fourth960, 960], [fourth480, 480]]), alt: "ECHO - Fourth" },
];

function Featuring() {
  const [noSlides, setNoSlides] = useState(1);
  const swiperRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 500) {
        setNoSlides(1);
      } else if (width >= 500 && width < 750) {
        setNoSlides(2);
      } else {
        setNoSlides(3);
      }
    };

    handleResize(); // Initial setup

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="bg-[#101011] h-fit w-full flex flex-col pt-32 overflow-x-hidden pb-20 scroll-mt-24" id='featuring'>
      <div className='flex items-center h-20 pb-9'>
        <div className='flex items-center justify-center w-full'>
          <img className='w-72 h-[45%] pl-2.5' data-aos="flip-up" data-aos-duration="750" src={featuring} alt="" />
        </div>
      </div>
      <div className='flex pt-10 justify-center items-center overflow-hidden relative'>
        {/* Arrow indicators: hint the carousel is scrollable/infinite */}
        <button
          type="button"
          aria-label="Previous ECHO photos"
          onClick={() => swiperRef.current?.slidePrev()}
          className='absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm'
        >
          <FaChevronLeft />
        </button>
        <Swiper
          modules={[Pagination, Scrollbar, A11y, Keyboard]}
          slidesPerView={noSlides}
          spaceBetween={50}
          loop={true}
          scrollbar={{ draggable: true }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          pagination={{
            clickable: true,
          }}
          className="feat-swiper bg-transparent px-14 pb-10 h-fit"
        >
          {echoSlides.map(({ image, imageSet, alt }, index) => (
            <SwiperSlide key={index} className='px-3 pt-9 pb-8 bg-transparent'>
              <img
                className='h-full w-full rounded-2xl object-cover transition-all duration-300 shadow-xl hover:scale-105 hover:ring-2 hover:ring-white/50 hover:shadow-[0_0_25px_6px_rgba(255,255,255,0.25)]'
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
          className='absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm'
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default Featuring;
