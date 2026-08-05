import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectCube } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import '../Execom/custom.css';

import Aleetta from '../../assets/aleeta.jpg';
import Lisha from '../../assets/lisha1.jpg';
import Steve from '../../assets/steve.jpg';
import AnnaRachel from '../../assets/anna_rachel.jpg';
import Amanul from '../../assets/amanul.jpg';
import Abel from '../../assets/abel.jpg';
import Saniya from '../../assets/saniya.jpg';
import Sebin from '../../assets/sebin.jpg';
import Anjitha from '../../assets/anjitha.jpg';
import Abhirami from '../../assets/abhirami_p.jpg';
import Devadarsana from '../../assets/devadarasan.jpg';

import MeetTheTeam from '../../assets/MeetTheTeam.svg';

const cardData = [
  { name: 'Aleetta Mariya Sebastian', img: Aleetta, review: 'Chairperson' },
  { name: 'Lisha Jins', img: Lisha, review: 'Vice Chairperson' },
  { name: 'Steve Jose', img: Steve, review: 'Secretary' },
  { name: 'Anna Rachel Mathew', img: AnnaRachel, review: 'Joint Secretary' },
  { name: 'Amanul Farhan K S', img: Amanul, review: 'Treasurer' },
  { name: 'Abel S Mathew', img: Abel, review: 'Research & Development Lead' },
  { name: 'Saniya K Shibu', img: Saniya, review: 'Program Outreach Coordinator' },
  { name: 'Sebin Mathew', img: Sebin, review: 'Project Coordinator' },
  { name: 'Anjitha Aravind', img: Anjitha, review: 'Operations Lead' },
  { name: 'Abhirami P', img: Abhirami, review: 'Design Lead' },
  { name: 'Devadarsana R', img: Devadarsana, review: 'Public Relations Lead' }
];

function Execom() {
  return (
    <section className='min-h-full flex flex-col pt-10 pb-20 overflow-hidden' id='execom'>
      {/* Section Header */}
      <div className='flex items-center h-36 pl-6 lg:pl-40 pt-6 pb-12 relative'>
        <div className='w-5 h-16 bg-[#4f4f54] relative'></div>
        <div className="absolute w-46 h-6 pl-2.5">
          <img src={MeetTheTeam} alt="Meet The Team" style={{ width: 250 }} />
        </div>
      </div>
    
      <div className='m-auto w-[90%] sm:w-5/6 md:w-4/5 px-2 relative'>
        {/* Desktop / Tablet Swiper (Multi-card) */}
        <div className="hidden sm:block">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            loop={true}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation={true}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
              1280: { slidesPerView: 4, spaceBetween: 24 }
            }}
            className="execom-swiper pb-12"
          >
            {cardData.map((d, index) => (
              <SwiperSlide key={index}>
                <div className='container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden group'>
                  <img
                    className="object-cover object-top w-full h-full card-hover grayscale group-hover:filter-none transition-all duration-300"
                    src={d.img}
                    alt={d.name}
                    loading="lazy"
                  />
                  <div className="absolute rounded-b-3xl bottom-0 w-full bg-gradient-to-t from-black via-black/85 to-transparent p-4 text-left">
                    <div className="text-white text-base font-semibold italic">{d.name}</div>
                    <div className="text-gray-300 text-xs font-light">{d.review}</div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Mobile 3D Cube Swiper (Touch & Swipe Enabled) */}
        <div className="block sm:hidden max-w-[320px] mx-auto py-4">
          <Swiper
            effect={'cube'}
            grabCursor={true}
            cubeEffect={{
              shadow: true,
              slideShadows: true,
              shadowOffset: 20,
              shadowScale: 0.94,
            }}
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            modules={[EffectCube, Pagination, Autoplay]}
            className="execom-cube-swiper pb-10"
          >
            {cardData.map((d, index) => (
              <SwiperSlide key={index}>
                <div className='container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden shadow-2xl'>
                  <img
                    className="object-cover object-top w-full h-full"
                    src={d.img}
                    alt={d.name}
                    loading="eager"
                  />
                  <div className="absolute rounded-b-3xl bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-4 text-left">
                    <div className="text-white text-base font-semibold italic">{d.name}</div>
                    <div className="text-gray-300 text-xs font-light">{d.review}</div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}

export default Execom;
