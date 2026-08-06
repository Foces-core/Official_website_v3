import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectCube, Keyboard } from 'swiper/modules';

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
import Devadarsana from '../../assets/WhatsApp Image 2026-08-04 at 12.07.46 PM.jpeg';

import MeetTheTeam from '../../assets/MeetTheTeam.svg';
import useDeviceProfile from '../../hooks/useLowPower.js';

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

// The cube rotates 90° per face, so Swiper's loop mode can't be used.
// Render 3 invisible copies: indices 0 and 32 share the same cube orientation
// (32 × 90° = 2880° ≡ 0°), so a 0ms jump between them wraps seamlessly.
const cubeSlides = [...cardData, ...cardData, ...cardData];

function Execom() {
  const { lowPower, lowCPU, reducedMotion, slowNetwork } = useDeviceProfile();
  const flatCube = lowCPU || reducedMotion;
  const [activeCube, setActiveCube] = React.useState(0);
  const cubeRef = React.useRef(null);
  const cubeWrapRef = React.useRef(null);
  const cubeVisibleRef = React.useRef(true);
  const deskSwiperRef = React.useRef(null);
  const deskWrapRef = React.useRef(null);
  const lastWrap = React.useRef(0);

  // Shadow planes + face gradients are the cube's #1 GPU cost — and on a
  // near-black site they read as a black smear, not a shadow. Keep them off.
  const cubeEffectConfig = { shadow: false, slideShadows: false };

  // Only run autoplay while a carousel is actually on screen — at 20x CPU
  // throttle (or on low-end phones), a slider spinning in the background is
  // pure wasted frames. Applies to the mobile cube AND the desktop swiper.
  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    // Mobile cube
    const cubeEl = cubeWrapRef.current;
    const ioCube = cubeEl
      ? new IntersectionObserver(([entry]) => {
          cubeVisibleRef.current = entry.isIntersecting;
          if (!cubeRef.current) return;
          if (entry.isIntersecting) {
            if (!lowPower) cubeRef.current.autoplay.start();
          } else {
            cubeRef.current.autoplay.stop();
          }
        }, { threshold: 0.1 })
      : null;
    if (ioCube) ioCube.observe(cubeEl);

    // Desktop / tablet multi-card swiper (hidden on mobile via CSS, so this
    // also stops it from spinning invisibly on phones)
    const deskEl = deskWrapRef.current;
    const ioDesk = deskEl
      ? new IntersectionObserver(([entry]) => {
          if (!deskSwiperRef.current) return;
          if (entry.isIntersecting) {
            if (!lowPower) deskSwiperRef.current.autoplay.start();
          } else {
            deskSwiperRef.current.autoplay.stop();
          }
        }, { threshold: 0.1 })
      : null;
    if (ioDesk) ioDesk.observe(deskEl);

    return () => {
      if (ioCube) ioCube.disconnect();
      if (ioDesk) ioDesk.disconnect();
    };
  }, [lowPower]);

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
        <div ref={deskWrapRef} className="hidden sm:block">
          <Swiper
            onSwiper={(swiper) => { deskSwiperRef.current = swiper; }}
            modules={[Autoplay, Pagination, Navigation, Keyboard]}
            spaceBetween={20}
            slidesPerView={1}
            loop={true}
            autoplay={lowPower ? false : { delay: 3500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation={true}
            keyboard={{ enabled: true, onlyInViewport: true }}
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
                    className={`object-cover ${d.name === 'Sebin Mathew' ? 'object-center' : 'object-top'} w-full h-full card-hover grayscale group-hover:filter-none transition-all duration-300`}
                    src={d.img}
                    alt={d.name}
                    loading="lazy"
                    decoding="async"
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

        {/* Mobile 3D Cube Swiper — seamless infinite wrap (swipe any direction, forever) */}
        <div ref={cubeWrapRef} className="block sm:hidden max-w-[320px] mx-auto py-4">
          <Swiper
            onSwiper={(swiper) => { cubeRef.current = swiper; }}
            effect={flatCube ? 'slide' : 'cube'}
            grabCursor={true}
            speed={flatCube ? 250 : 400}
            cubeEffect={cubeEffectConfig}
            loop={false}
            initialSlide={cardData.length}
            autoplay={{ delay: 2500, disableOnInteraction: false, stopOnLastSlide: false }}
            modules={[EffectCube, Pagination, Autoplay]}
            onSlideChange={(swiper) => setActiveCube(swiper.activeIndex % cardData.length)}
            onTransitionEnd={(swiper) => {
              // Seamless infinite wrap: at either edge, jump 0ms to the matching slide copy
              const now = Date.now();
              if (now - lastWrap.current < 120) return;
              if (swiper.activeIndex >= cardData.length * 3 - 1) {
                lastWrap.current = now;
                swiper.slideTo(cardData.length, 0);
                if (swiper.autoplay) swiper.autoplay.start();
              } else if (swiper.activeIndex <= 0) {
                lastWrap.current = now;
                swiper.slideTo(cardData.length, 0);
                if (swiper.autoplay) swiper.autoplay.start();
              }
            }}
            className="execom-cube-swiper"
          >
            {cubeSlides.map((d, index) => (
              <SwiperSlide key={index}>
                <div className='container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden'>
                  <img
                    className={`object-cover ${d.imgPos || 'object-top'} w-full h-full`}
                    src={d.img}
                    alt={d.name}
                    loading={slowNetwork ? 'lazy' : 'eager'}
                    decoding="async"
                  />
                  <div className="absolute rounded-b-3xl bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-4 text-left">
                    <div className="text-white text-base font-semibold italic">{d.name}</div>
                    <div className="text-gray-300 text-xs font-light">{d.review}</div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom 11-dot indicator (the cube itself has 3 hidden copies) */}
          <div className="flex justify-center gap-2 mt-2 pb-1">
            {cardData.map((d, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to ${d.name}`}
                onClick={() => {
                  const sw = cubeRef.current;
                  if (!sw) return;
                  const copy = Math.floor(sw.activeIndex / cardData.length);
                  sw.slideTo(copy * cardData.length + i, 350);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${activeCube === i ? 'w-6 bg-[#007aff]' : 'w-2 bg-[#4f4f54]'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Execom;
