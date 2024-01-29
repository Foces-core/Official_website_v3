import React, { useState, useEffect } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination,Navigation,  Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css'; 
import 'swiper/css/free-mode'; 
import 'swiper/css/navigation'; 
import 'swiper/css/pagination';
import FI1 from "../../assets/FI1.svg";
import featuring from '../../assets/featuring.svg';


function Featuring() {
  const slides = [
    { url: FI1, title: "beach" ,link:"https://www.instagram.com/p/CzL8OmkPMKY/?igsh=bzBwcXJvajE3Y3Rh" },
    { url: FI1, title: "boat"  ,link:"https://www.instagram.com/p/CzL8OmkPMKY/?igsh=bzBwcXJvajE3Y3Rh" },
    { url: FI1, title: "boat"  ,link:"https://www.instagram.com/p/CzL8OmkPMKY/?igsh=bzBwcXJvajE3Y3Rh" },
    { url: FI1, title: "boat"  ,link:"https://www.instagram.com/p/CzL8OmkPMKY/?igsh=bzBwcXJvajE3Y3Rh" },
    { url: FI1, title: "boat"  ,link:"https://www.instagram.com/p/CzL8OmkPMKY/?igsh=bzBwcXJvajE3Y3Rh" },
    { url: FI1, title: "italy" ,link:"https://www.instagram.com/p/CzL8OmkPMKY/?igsh=bzBwcXJvajE3Y3Rh" },
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
    <div className="bg-[#101011] h-screen w-screen  flex  flex-col pt-32  overflow-x-hidden pb-20 " id='featuring'>
      <div className='flex  items-center h-20 pb-9 '>
    <div className='flex items-center justify-center w-full'>
   
    <img className=' w-72 h-[45%] pl-2.5' data-aos="flip-up" data-aos-duration="750" src={featuring}alt="" />
    </div>
  </div>
      <div className=' flex pt-10 justify-center items-center overflow-hidden '>
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        slidesPerView={noSlides} 
        spaceBetween={50}
        freeMode={false}
        navigation={{
          clickable: true,
        }}
        scrollbar={{ draggable: true }}
        pagination={{
          clickable: true,
        }}
        style={{
          "--swiper-navigation-color": "white",
          "--swiper-navigation-size": "20px",
          "--swiper-pagination-color": "white",
          "--swiper-pagination-bullet-inactive-opacity":".5",
          "--swiper-pagination-bullet-inactive-color":"white",
          "--swiper-pagination-top":"90%",
        }}
        className="mySwiper bg-transparent px-10 pb-10 h-fit"
      >
        {slides.map(({ url, title,link }, index) => (
          <SwiperSlide key={index} className='px-5 pb-7 pt-7 bg-transparent rounded-full'>
            <a href={link}>
              <img className=' hover:shadow-white hover:shadow-[0_0px_20px_rgb(0,0,0,0.12)] h-full w-full rounded-xl hover:scale-110   ease-in-out duration-200  ' src={url} alt={title}  data-aos="flip-righ" />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
      </div>
    </div>
  );
}

export default Featuring;
