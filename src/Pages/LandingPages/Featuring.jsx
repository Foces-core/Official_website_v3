import { useState, useEffect } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import featuring from '../../assets/featuring.svg';
import episodeOne from '../../assets/episode-1.png';
import series from '../../assets/series.png';
import fourth from '../../assets/fourth.png';
import mentorReveal from '../../assets/Mentor_reveal.png';
import { aosDisabled } from '../../utils/aosGating.js';

const echoSlides = [
  { image: episodeOne, alt: "ECHO - Episode 1" },
  { image: series, alt: "ECHO Series" },
  { image: fourth, alt: "ECHO - Fourth" },
  { image: mentorReveal, alt: "ECHO - Mentor Reveal" },
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
          {echoSlides.map(({ image, alt }, index) => (
            <SwiperSlide key={index} className='px-3 pb-8 pt-4 bg-transparent'>
              <img
                className='hover:shadow-white hover:shadow-[0_0px_20px_rgba(255,255,255,0.2)] h-full w-full rounded-2xl object-cover hover:scale-105 transition-transform duration-300 shadow-xl'
                src={image}
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
