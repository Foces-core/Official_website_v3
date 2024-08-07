import React from 'react';
import ReactDOM from 'react-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination, Navigation, Scrollbar, A11y } from 'swiper/modules';


export default function Modal({ images, open, onClose }) {
  if (!open) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className='fixed top-0 left-0 right-0 bottom-0 bg-slate-950 bg-opacity-70 z-50 overflow-x-hidden'
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className='w-full h-[50%] min-[700px]:w-[90vh] min-[700px]:h-[80vh] flex items-center justify-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black rounded-xl p-1 z-50 shadow-slate-700 drop-shadow-lg shadow-2xl'
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className='absolute top-4 right-4 text-white text-2xl'
          onClick={onClose}
        >
         
        </button>
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
            "--swiper-navigation-color": "white",
            "--swiper-navigation-size": "30px",
            "--swiper-pagination-color": "white",
            "--swiper-pagination-bullet-inactive-opacity": ".3",
            "--swiper-pagination-bullet-inactive-color": "white",
          }}
          className="mySwiper h-full w-[120%] bg-black p-10 items-center flex justify-center"
        >
          {images.map((url, index) => (
            <SwiperSlide key={index} className='rounded-full flex justify-center items-center'>
              <img
                className='h-fit w-fit rounded-xl ease-in-out duration-200  bg-cover'
                src={url}
                alt={`Slide ${index + 1}`}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>,
    document.getElementById('portal')
  );
}
