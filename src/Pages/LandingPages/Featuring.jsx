import { useState, useEffect } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
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
import { aosDisabled } from '../../utils/aosGating.js';
import { srcset } from '../../utils/srcset.js';

const echoSlides = [
  { image: episodeOne, imageSet: srcset([[episodeOne, 1280], [episodeOne960, 960], [episodeOne480, 480]]), alt: "ECHO - Episode 1" },
  { image: series, imageSet: srcset([[series, 1280], [series960, 960], [series480, 480]]), alt: "ECHO Series" },
  { image: fourth, imageSet: srcset([[fourth, 1280], [fourth960, 960], [fourth480, 480]]), alt: "ECHO - Fourth" },
  { image: mentorReveal, imageSet: srcset([[mentorReveal, 1280], [mentorReveal960, 960], [mentorReveal480, 480]]), alt: "ECHO - Mentor Reveal" },
];

function Featuring() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      disable: aosDisabled,
    });
  }, []);

  const [noSlides, setNoSlides] = useState(1);

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
      <div className='flex pt-10 justify-center items-center overflow-hidden'>
        <Swiper
          modules={[Pagination, Scrollbar, A11y]}
          slidesPerView={noSlides}
          spaceBetween={50}
          scrollbar={{ draggable: true }}
          pagination={{
            clickable: true,
          }}
          style={{
            "--swiper-pagination-color": "white",
            "--swiper-pagination-bullet-inactive-opacity": ".5",
            "--swiper-pagination-bullet-inactive-color": "white",
            "--swiper-pagination-top": "90%",
          }}
          className="mySwiper bg-transparent px-10 pb-10 h-fit"
        >
          {echoSlides.map(({ image, imageSet, alt }, index) => (
            <SwiperSlide key={index} className='px-3 pb-8 pt-4 bg-transparent'>
              <img
                className='hover:shadow-white hover:shadow-[0_0px_20px_rgba(255,255,255,0.2)] h-full w-full rounded-2xl object-cover hover:scale-105 transition-transform duration-300 shadow-xl'
                src={image}
                srcSet={imageSet}
                sizes="(min-width: 768px) 33vw, (min-width: 500px) 50vw, 90vw"
                alt={alt}
                loading="lazy"
                decoding="async"
                data-aos="flip-right"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default Featuring;
