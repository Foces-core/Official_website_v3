import React ,{useState,useEffect} from 'react'
import ReactDOM from 'react-dom';
import Slider from 'react-touch-drag-slider'


import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination,Navigation,  Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css'; 
import 'swiper/css/free-mode'; 
import 'swiper/css/navigation'; 
import 'swiper/css/pagination';


import img1 from "../../assets/img1.png"
import img2 from "../../assets/img2.png"
import img3 from "../../assets/img3.png"

export default function Modal({ open,  onClose }) {

  const slides = [
    { url: img1, title: "beach" },
    { url: img2, title: "boat" },
    { url: img3, title: "italy" },
    ];

  if (!open) return null;

  

  return ReactDOM.createPortal(
    <>
      <div className=' fixed top-0 left-0 right-0 bottom-0 bg-slate-950 bg-opacity-70 z-50' onClick={onClose} />
        <div className='sm:h-[95vh] sm:w-[98vh] w-[55vh] h-[70vh] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black rounded-xl p-16 z-50 shadow-slate-700 drop-shadow-lg shadow-2xl'>
        
       
        



<Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        slidesPerView={1} 
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
          "--swiper-navigation-color": "blue",
          "--swiper-navigation-size": "30px",
          "--swiper-pagination-color": "blue",
          "--swiper-pagination-bullet-inactive-opacity":".3",
          "--swiper-pagination-bullet-inactive-color":"blue"
        }}
        className="mySwiper h-full w-full bg-black px-10 "
      >
        {slides.map(({ url, title,link }, index) => (
          <SwiperSlide key={index} className=' h-full w-full rounded-full flex justify-center '>
            <a href={link}>
              <img className='  h-full w-full rounded-xl    ease-in-out duration-200  ' src={url} alt={title}   />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
         
      </div>
    </>,
    document.getElementById('portal')
  );
}
