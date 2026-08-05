import React, { useRef } from 'react';
import '../Execom/custom.css'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

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

function Execom() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    swipeToSlide: true,
    swipe: true,
    touchMove: true,
    touchThreshold: 10,
    draggable: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          dots: true
        }
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          arrows: true
        }
      }
    ]
  };

  const slider1 = useRef(null);

  return (
    <div className='min-h-full flex flex-col pt-10 pb-20 overflow-hidden' id='execom'>
      <div className='flex items-center h-36 pl-6 lg:pl-40 pt-6 pb-12'>
        <div className='w-5 h-16 bg-[#4f4f54] relative'></div>
        <div className="absolute w-46 h-6 pl-2.5">
          <img src={MeetTheTeam} alt="Meet The Team" style={{ width: 250 }} />
        </div>
      </div>
    
      <div className='m-auto w-[92%] sm:w-5/6 md:w-3/4 px-2'>
        <Slider ref={slider1} {...settings}>
          {cardData.map((d, index) => (
            <div key={index} className="relative px-1">
              <div className='container-execom bg-[#161618] border-box'>
                <img
                  className="object-cover object-top w-full h-full card-hover grayscale hover:filter-none"
                  src={d.img}
                  alt={d.name}
                  loading="lazy"
                />
                <div className="absolute rounded-b-[22px] bottom-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4 text-left">
                  <div className="text-white text-base font-semibold italic">{d.name}</div>
                  <div className="text-gray-300 text-xs font-light">{d.review}</div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

const cardData = [
  {
    name: 'Aleetta Mariya Sebastian',
    img: Aleetta,
    review: 'Chairperson',
  },
  {
    name: 'Lisha Jins',
    img: Lisha,
    review: 'Vice Chairperson',
  },
  {
    name: 'Steve Jose',
    img: Steve,
    review: 'Secretary',
  },
  {
    name: 'Anna Rachel Mathew',
    img: AnnaRachel,
    review: 'Joint Secretary',
  },
  {
    name: 'Amanul Farhan K S',
    img: Amanul,
    review: 'Treasurer',
  },
  {
    name: 'Abel S Mathew',
    img: Abel,
    review: 'Research & Development Lead',
  },
  {
    name: 'Saniya K Shibu',
    img: Saniya,
    review: 'Program Outreach Coordinator',
  },
  {
    name: 'Sebin Mathew',
    img: Sebin,
    review: 'Project Coordinator',
  },
  {
    name: 'Anjitha Aravind',
    img: Anjitha,
    review: 'Operations Lead',
  },
  {
    name: 'Abhirami P',
    img: Abhirami,
    review: 'Design Lead',
  },
  {
    name: 'Devadarsana R',
    img: Devadarsana,
    review: 'Public Relations Lead',
  }
];

export default Execom;
