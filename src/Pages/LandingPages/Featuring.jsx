import React, { useState, useEffect } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import FI1 from "../../assets/FI1.svg";

function Featuring() {
  const slides = [
    { url: FI1, title: "beach" ,link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { url: FI1, title: "boat"  ,link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { url: FI1, title: "boat"  ,link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { url: FI1, title: "boat"  ,link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { url: FI1, title: "boat"  ,link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { url: FI1, title: "italy" ,link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  ];

  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); // AOS initialization
  }, []);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
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

      setWindowWidth(width);
    };

    handleResize(); // Initial setup

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex justify-center items-center overflow-x-hidden">
      <Swiper
        slidesPerView={noSlides} 
        spaceBetween={50}
        freeMode={false}
        pagination={{
          clickable: true,
        }}
        modules={[FreeMode, Pagination]}
        className="mySwiper bg-black px-10"
      >
        {slides.map(({ url, title,link }, index) => (
          <SwiperSlide key={index} className='px-5 py-7 bg-black rounded-full'>
            <a href={link}>
              <img className=' hover:shadow-blue-500 hover:shadow-[0_0px_20px_rgb(0,0,0,0.12)] h-full w-full rounded-xl hover:scale-110   ease-in-out duration-200  ' src={url} alt={title}  data-aos="flip-righ" />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default Featuring;
