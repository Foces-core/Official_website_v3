import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, EffectCube, Keyboard } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/navigation';
import '../Execom/custom.css';

import Aleetta from '../../assets/aleeta.webp';
import AleettaBlur from '../../assets/aleeta.webp?blur&w=20';
import Lisha from '../../assets/lisha1.webp';
import LishaBlur from '../../assets/lisha1.webp?blur&w=20';
import Steve from '../../assets/steve.webp';
import SteveBlur from '../../assets/steve.webp?blur&w=20';
import AnnaRachel from '../../assets/anna_rachel.webp';
import AnnaRachelBlur from '../../assets/anna_rachel.webp?blur&w=20';
import Amanul from '../../assets/amanul.webp';
import AmanulBlur from '../../assets/amanul.webp?blur&w=20';
import Abel from '../../assets/abel.webp';
import AbelBlur from '../../assets/abel.webp?blur&w=20';
import Saniya from '../../assets/saniya.webp';
import SaniyaBlur from '../../assets/saniya.webp?blur&w=20';
import Sebin from '../../assets/sebin.webp';
import SebinBlur from '../../assets/sebin.webp?blur&w=20';
import Anjitha from '../../assets/anjitha.webp';
import AnjithaBlur from '../../assets/anjitha.webp?blur&w=20';
import Abhirami from '../../assets/abhirami_p.webp';
import AbhiramiBlur from '../../assets/abhirami_p.webp?blur&w=20';
import Devadarsana from '../../assets/devadarsana.webp?v=3';
import DevadarsanaBlur from '../../assets/devadarsana.webp?blur&w=20&v=3';
import Gopakumar from '../../assets/gopakumar.webp';
import GopakumarBlur from '../../assets/gopakumar.webp?blur&w=20';

import MeetTheTeam from '../../assets/MeetTheTeam.svg';
import useDeviceProfile from '../../hooks/useLowPower.js';
import BlurImage from '../BlurImage/BlurImage';
import {
  syncCarouselKeyboard,
  subscribeKeyboardArbitration,
  registerWidget,
  markInteracted,
  rectIsOnScreen,
} from '../../utils/keyboardLock.js';

const cardData = [
  { name: 'Aleetta Mariya Sebastian', img: Aleetta, blur: AleettaBlur, review: 'Chairperson' },
  { name: 'Lisha Jins', img: Lisha, blur: LishaBlur, review: 'Vice Chairperson' },
  { name: 'Steve Jose', img: Steve, blur: SteveBlur, review: 'Secretary' },
  { name: 'Anna Rachel Mathew', img: AnnaRachel, blur: AnnaRachelBlur, review: 'Joint Secretary' },
  { name: 'Amanul Farhan K S', img: Amanul, blur: AmanulBlur, review: 'Treasurer' },
  { name: 'Abel S Mathew', img: Abel, blur: AbelBlur, review: 'Research & Development Lead' },
  { name: 'Saniya K Shibu', img: Saniya, blur: SaniyaBlur, review: 'Program Outreach Coordinator' },
  { name: 'Sebin Mathew', img: Sebin, blur: SebinBlur, review: 'Project Coordinator' },
  { name: 'Anjitha Aravind', img: Anjitha, blur: AnjithaBlur, review: 'Operations Lead' },
  { name: 'Abhirami P', img: Abhirami, blur: AbhiramiBlur, review: 'Design Lead' },
  {
    name: 'Devadarsana R',
    img: Devadarsana,
    blur: DevadarsanaBlur,
    review: 'Public Relations Lead',
  },
];

// The cube rotates 90° per face, so Swiper's loop mode can't be used. Render
// 3 invisible copies: indices 0 and 32 share the same cube orientation
// (32 × 90° = 2880° ≡ 0°), so a 0ms jump between them wraps seamlessly.
//
// The flat (low-power) slider uses the same copies instead of loop mode —
// Swiper's loop with only ~3× slidesPerView jams at its append boundary
// (autoplay/keyboard advance a few times, then freeze), which the cube's
// wrap handler avoids.
const cubeSlides = [...cardData, ...cardData, ...cardData];

function Execom() {
  const { lowPower, reducedMotion } = useDeviceProfile();
  const disableAutoplay = reducedMotion;
  const flatCube = lowPower || reducedMotion;
  const [activeCube, setActiveCube] = React.useState(0);
  const cubeRef = React.useRef(null);
  const cubeWrapRef = React.useRef(null);
  const carouselRef = React.useRef(null);
  const cubeVisibleRef = React.useRef(true);
  const deskSwiperRef = React.useRef(null);
  const deskWrapRef = React.useRef(null);

  // Shadow planes + face gradients are the cube's #1 GPU cost — and on a
  // near-black site they read as a black smear, not a shadow. Keep them off.
  const cubeEffectConfig = { shadow: false, slideShadows: false };

  const handleCubeWrap = React.useCallback((swiper) => {
    if (!swiper) return;
    const total = cardData.length;
    const idx = swiper.activeIndex;
    setActiveCube(idx % total);

    if (idx >= total * 2) {
      swiper.slideTo(idx - total, 0);
      // The 0ms jump fires no DOM transitionend, so Swiper autoplay's
      // transition-wait would stay paused forever — nudge it back on.
      swiper.autoplay?.resume();
    } else if (idx < total) {
      swiper.slideTo(idx + total, 0);
      swiper.autoplay?.resume();
    }
  }, []);

  // Arrow-key arbitration (see utils/keyboardLock.js): register the desktop
  // and mobile carousels as separate widgets — each counts as "on screen"
  // only while its swiper is actually rendered/visible (the other is hidden
  // via CSS, which rectIsOnScreen now detects). Each enables its keyboard
  // only while it owns the arrows (on screen + last interacted). Pointer use
  // on the carousel area marks both.
  React.useEffect(() => {
    const unregs = [
      registerWidget(
        'execom-desk',
        () => rectIsOnScreen(deskSwiperRef.current?.el, 60),
        carouselRef.current,
      ),
      registerWidget(
        'execom-mobile',
        () => rectIsOnScreen(cubeRef.current?.el, 60),
        carouselRef.current,
      ),
    ];
    const sync = () => {
      syncCarouselKeyboard(deskSwiperRef.current, 'execom-desk');
      syncCarouselKeyboard(cubeRef.current, 'execom-mobile');
    };
    const mark = () => {
      markInteracted('execom-desk');
      markInteracted('execom-mobile');
    };
    sync();
    const carouselEl = carouselRef.current;
    carouselEl?.addEventListener('pointerdown', mark, true);
    const unsub = subscribeKeyboardArbitration(sync);
    return () => {
      unregs.forEach((unregister) => unregister());
      unsub();
      carouselEl?.removeEventListener('pointerdown', mark, true);
    };
  }, []);

  // Only run autoplay while a carousel is actually on screen — at 20x CPU
  // throttle (or on low-end phones), a slider spinning in the background is
  // pure wasted frames. Applies to the mobile cube AND the desktop swiper.
  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    // Mobile cube
    const cubeEl = cubeWrapRef.current;
    const ioCube = cubeEl
      ? new IntersectionObserver(
          ([entry]) => {
            cubeVisibleRef.current = entry.isIntersecting;
            if (!cubeRef.current) return;
            if (entry.isIntersecting) {
              if (!disableAutoplay) cubeRef.current.autoplay?.start();
            } else {
              cubeRef.current.autoplay?.stop();
            }
          },
          { threshold: 0.1 },
        )
      : null;
    if (ioCube) ioCube.observe(cubeEl);

    // Desktop / tablet multi-card swiper (hidden on mobile via CSS, so this
    // also stops it from spinning invisibly on phones)
    const deskEl = deskWrapRef.current;
    const ioDesk = deskEl
      ? new IntersectionObserver(
          ([entry]) => {
            if (!deskSwiperRef.current) return;
            if (entry.isIntersecting) {
              if (!disableAutoplay) deskSwiperRef.current.autoplay?.start();
            } else {
              deskSwiperRef.current.autoplay?.stop();
            }
          },
          { threshold: 0.1 },
        )
      : null;
    if (ioDesk) ioDesk.observe(deskEl);

    return () => {
      if (ioCube) ioCube.disconnect();
      if (ioDesk) ioDesk.disconnect();
    };
  }, [disableAutoplay]);

  return (
    <section
      className="min-h-full flex flex-col pt-10 pb-20 overflow-hidden scroll-mt-24"
      id="execom"
    >
      {/* Advisor banner — separate thin strip at the top of the section */}
      <div
        className="m-auto w-[90%] sm:w-5/6 md:w-4/5 px-2 pb-10"
        role="group"
        aria-label="Advisor"
      >
        <div className="relative bg-gradient-to-br from-[#1b1b1f] to-[#121215] border border-white/10 rounded-3xl overflow-hidden flex items-stretch group shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
          {/* Ambient accent glows — decorative, purely visual */}
          <div
            aria-hidden="true"
            className="absolute -top-16 -left-16 w-64 h-64 bg-[#007aff]/15 blur-[80px] rounded-full pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 right-0 w-72 h-48 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none"
          />

          {/* Framed portrait — grayscale by default, colour on hover */}
          <div className="relative w-28 sm:w-40 md:w-52 shrink-0 p-3 sm:p-4">
            <div className="relative h-full min-h-28 overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
              <BlurImage
                className="object-cover object-top w-full h-full grayscale group-hover:filter-none transition-all duration-500"
                src={Gopakumar}
                blurSrc={GopakumarBlur}
                alt="Gopakumar G"
                loading="lazy"
                decoding="async"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="relative flex-1 flex flex-col justify-center py-5 pr-5 md:pr-8">
            <span className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#007aff]/10 border border-[#007aff]/25 text-[#007aff] text-[10px] font-semibold uppercase tracking-[0.22em]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
              </svg>
              Advisor
            </span>
            <div className="mt-3 text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Gopakumar G
            </div>
            <div
              aria-hidden="true"
              className="mt-2 w-10 h-px bg-gradient-to-r from-[#007aff]/70 to-transparent"
            />
            <p className="mt-3 text-gray-400 text-xs sm:text-sm leading-relaxed max-w-2xl border-l-2 border-[#007aff]/30 pl-3">
              Guiding wisdom behind FOCES — the team looks to Gopakumar Sir for direction,
              mentorship, and the steady hand that keeps our community events running.
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center h-36 pl-6 lg:pl-40 pt-6 pb-12 relative">
        <div className="w-5 h-16 bg-[#4f4f54] relative"></div>
        <div className="absolute w-46 h-6 pl-2.5">
          <img
            src={MeetTheTeam}
            alt="Meet The Team"
            className="meet-the-team-title"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div ref={carouselRef} className="m-auto w-[90%] sm:w-5/6 md:w-4/5 px-2 relative">
        {/* Desktop / Tablet Swiper — 3D Cube on capable devices, flat slider on low-power */}
        <div
          ref={deskWrapRef}
          className={`hidden sm:block ${flatCube ? '' : 'max-w-[360px] mx-auto py-4'}`}
        >
          <Swiper
            onSwiper={(swiper) => {
              deskSwiperRef.current = swiper;
              syncCarouselKeyboard(swiper, 'execom-desk');
            }}
            modules={[Autoplay, Navigation, EffectCube, Keyboard]}
            effect={flatCube ? 'slide' : 'cube'}
            speed={flatCube ? 250 : 400}
            cubeEffect={cubeEffectConfig}
            grabCursor={!flatCube}
            spaceBetween={flatCube ? 20 : 0}
            slidesPerView={1}
            initialSlide={cardData.length}
            autoplay={disableAutoplay ? false : { delay: 3500, disableOnInteraction: false }}
            navigation={flatCube}
            keyboard={{ enabled: true, onlyInViewport: false }}
            // Wrap on transition END (not slideChange): the 0ms wrap jump emits
            // no transitionend, which would leave Swiper autoplay paused forever.
            onTouchEnd={handleCubeWrap}
            onTransitionEnd={handleCubeWrap}
            breakpoints={
              flatCube
                ? {
                    640: { slidesPerView: 2, spaceBetween: 20 },
                    1024: { slidesPerView: 3, spaceBetween: 24 },
                    1280: { slidesPerView: 4, spaceBetween: 24 },
                  }
                : undefined
            }
            className="execom-swiper pb-12"
          >
            {cubeSlides.map((d, index) => (
              <SwiperSlide key={index}>
                <div className="container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden group">
                  <BlurImage
                    className={`object-cover ${d.name === 'Sebin Mathew' ? 'object-center' : 'object-top'} w-full h-full card-hover grayscale group-hover:filter-none transition-all duration-300`}
                    src={d.img}
                    blurSrc={d.blur}
                    alt={d.name}
                    loading={index < 4 ? 'eager' : 'lazy'}
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

          {/* Custom 11-dot indicator for both modes — Swiper's loop was
              replaced with duplicated slides, so its pagination (which would
              render 33 bullets) can't be used. */}
          <div className="flex justify-center gap-2 mt-2 pb-1">
            {cardData.map((d, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to ${d.name}`}
                onClick={() => {
                  const sw = deskSwiperRef.current;
                  if (!sw) return;
                  const copy = Math.floor(sw.activeIndex / cardData.length);
                  sw.slideTo(copy * cardData.length + i, 350);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${activeCube === i ? 'w-6 bg-[#007aff]' : 'w-2 bg-[#4f4f54]'}`}
              />
            ))}
          </div>
        </div>

        {/* Mobile 3D Cube Swiper — seamless infinite wrap (swipe any direction, forever) */}
        <div ref={cubeWrapRef} className="block sm:hidden max-w-[320px] mx-auto py-4">
          <Swiper
            onSwiper={(swiper) => {
              cubeRef.current = swiper;
              syncCarouselKeyboard(swiper, 'execom-mobile');
            }}
            effect={flatCube ? 'slide' : 'cube'}
            grabCursor={true}
            speed={flatCube ? 250 : 400}
            cubeEffect={cubeEffectConfig}
            loop={false}
            initialSlide={cardData.length}
            autoplay={
              disableAutoplay
                ? false
                : { delay: 2500, disableOnInteraction: false, stopOnLastSlide: false }
            }
            modules={[EffectCube, Autoplay, Keyboard]}
            keyboard={{ enabled: true, onlyInViewport: false }}
            // Wrap on transition END (not slideChange): the 0ms wrap jump emits
            // no transitionend, which would leave Swiper autoplay paused forever.
            onTouchEnd={handleCubeWrap}
            onTransitionEnd={handleCubeWrap}
            className="execom-cube-swiper"
          >
            {cubeSlides.map((d, index) => (
              <SwiperSlide key={index}>
                <div className="container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden">
                  <BlurImage
                    className={`object-cover ${d.name === 'Sebin Mathew' ? 'object-center' : 'object-top'} w-full h-full`}
                    src={d.img}
                    blurSrc={d.blur}
                    alt={d.name}
                    loading={index < 2 ? 'eager' : 'lazy'}
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
