import { useState, useEffect } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css'; 
import 'swiper/css/pagination';
import featuring from '../../assets/featuring.svg';
import codingArenaPoster from '../../assets/coding_arena_4_0_insta.jpg';
import promptParadoxPoster from '../../assets/the_prompt_paradox_2_0_insta.jpg';
import agenticCodingPoster from '../../assets/agentic_coding_instagram.jpg';

import client from '../../sanityClient.js';
import { sanityImg } from '../../utils/sanityImage.js';
import useDeviceProfile from '../../hooks/useLowPower.js';

const fallbackFeatures = [
  { image: { asset: { url: codingArenaPoster }, alt: "Coding Arena 4.0" } },
  { image: { asset: { url: promptParadoxPoster }, alt: "The Prompt Paradox 2.0" } },
  { image: { asset: { url: agenticCodingPoster }, alt: "Agentic Coding" } },
];


function Featuring() {
  const { slowNetwork } = useDeviceProfile();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); // AOS initialization
  }, []);


  const[feature,setFeature] = useState([]);
useEffect(() => {
  client.fetch(
    `*[_type == "featuring"]{
      image{
        asset ->{
          _id,
          url
        },
        alt
      },
      tickets,
    }`
  ).then((data) => { // Log fetched data
    setFeature(data);

  }).catch(() => {
    // Fall back to local fallbackFeatures array seamlessly
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
    <div className="bg-[#101011] h-fit w-full  flex  flex-col pt-32  overflow-x-hidden pb-20 " id='featuring'>
      <div className='flex  items-center h-20 pb-9 '>
    <div className='flex items-center justify-center w-full'>
   
    <img className=' w-72 h-[45%] pl-2.5' data-aos="flip-up" data-aos-duration="750" src={featuring}alt="" />
    </div>
  </div>
      <div className=' flex pt-10 justify-center items-center overflow-hidden '>
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
          "--swiper-pagination-bullet-inactive-opacity":".5",
          "--swiper-pagination-bullet-inactive-color":"white",
          "--swiper-pagination-top":"90%",
        }}
        className="mySwiper bg-transparent px-10 pb-10 h-fit"
      >
         {(feature.length > 0 ? feature : fallbackFeatures).map(({ image, tickets }, index) => {
            // Guard against Sanity docs that come back without an image asset —
            // fall back to the local poster so the slide never renders blank.
            const url = image?.asset?.url || fallbackFeatures[index % fallbackFeatures.length]?.image?.asset?.url;
            const hasValidLink = tickets && tickets !== '#' && tickets.startsWith('http');
            const imgElement = (
              <img
                className='hover:shadow-white hover:shadow-[0_0px_20px_rgba(255,255,255,0.2)] h-full w-full rounded-2xl object-cover hover:scale-105 transition-all duration-300 shadow-xl'
                src={sanityImg(url, slowNetwork ? 640 : 1000)}
                alt={image?.alt || 'Featured Event'}
                loading="lazy"
                decoding="async"
                data-aos="flip-right"
              />
            );

            return (
              <SwiperSlide key={index} className='px-3 pb-8 pt-4 bg-transparent'>
                {hasValidLink ? (
                  <a href={tickets} target='_blank' rel='noreferrer'>
                    {imgElement}
                  </a>
                ) : (
                  <div className='cursor-default'>
                    {imgElement}
                  </div>
                )}
              </SwiperSlide>
            );
          })}
      </Swiper>
      </div>
    </div>
  );
}

export default Featuring;
