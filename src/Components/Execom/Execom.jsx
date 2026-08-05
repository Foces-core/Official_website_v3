import React, { useRef } from 'react';
import '../Execom/custom.css'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import Aleetta from '../../assets/aleeta.jpg';
import Lisha from '../../assets/lisha1.jpg';
import Steve from '../../assets/steve.jpg';
import Amanul from '../../assets/amanul.jpg';
import Abel from '../../assets/abel.jpg';
import Saniya from '../../assets/saniya.jpg';
import Anjitha from '../../assets/anjitha.jpg';
import Abhirami from '../../assets/abhirami_p.jpg';
import Devadarsana from '../../assets/devadarasan.jpg';

import MeetTheTeam from '../../assets/MeetTheTeam.svg';

function Execom() {
  var settings = {
    dots: false,
    infinite: true,
    speed:500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    initialSlide: 0,
    swipeToSlide: true,
    
    responsive: [
      {
        breakpoint: 1600,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 650,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          initialSlide: 1
        }
      },
      {
        breakpoint: 550,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1
        }
      }
    ]
  };
  
  const slider1 = useRef(null);

  return (
    <div className='min-h-full flex flex-col pt-10 pb-20' id='execom' >
      <div className='flex items-center h-36 pl-6 lg:pl-40 pt-6 pb-12'>
        <div className='w-5 h-16 bg-[#4f4f54] relative'></div>
        <div className="absolute w-46 h-6 pl-2.5">
          <img src={MeetTheTeam} alt="" style={{ width: 250}} />
        </div>
      </div>
    
      <div className=' m-auto w-3/4 '>
        <Slider ref={slider1} {...settings}>
          {cardData.map((d, index) => (
            <div key={index} className="relative">
              <div className='container-execom '>
                <img className="object-cover w-full h-full border-box grayscale hover:filter-none card-hover " src={d.img} alt={d.name} style={{ width: d.width, height: d.height, bottom: d.bottom }} />
                <div className="absolute rounded-bl-[30px] rounded-br-[30px] bottom-0 w-full bg-black bg-opacity-60 ">
                  <div className="text-white text-[15px] pl-4 pb-1 pt-2 text-left italic">
                    <div className="font-semibold">{d.name}</div>
                    <div className="font-light">{d.review}</div>
                  </div>
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
