import React, { useRef } from 'react';
import '../Execom/custom.css'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Jerry from '../../assets/JerrySanjuJoanes.jpg';
import Nandkishor from '../../assets/NandkishorR.png';
import Betsa from '../../assets/betsa.png';
import Vimal from '../../assets/vimal.png';
import Nandana from '../../assets/nandana.jpg';
import AadithyaSai from '../../assets/aadithyasai.png';
import Akash from '../../assets/akash1.jpg'
import Anupriya from '../../assets/anupriya.png';
import Megha from '../../assets/megha.png';
import George from '../../assets/george.png';
import Aparna from '../../assets/aparna.png';

import MeetTheTeam from '../../assets/MeetTheTeam.svg';

function Execom() {
  var settings = {
    dots: true,
    infinite: true,
    speed: 1500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1000,
    beforeChange: (current, next) => handleBeforeChange(current, next),
    initialSlide: 0,
    swipeToSlide: true,

    responsive: [
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
        breakpoint: 650,
        settings: {
          slidesToShow: 2,
          slidesToScroll:1 ,
          initialSlide: 2
        }
      },
      {
        breakpoint: 550,
    settings: {
      slidesToShow:1 ,
      slidesToScroll: 1,
      initialSlide: 2
        }
      }
    ]
  };
  
  const slider1 = useRef(null);
  const handleBeforeChange = (current, next) => {
  slider1.current.slickGoTo(next);
  };


  
  return (
    <div className='h-full pb-20' >
     
        <div className='flex items-center h-36 pl-6 lg:pl-40 pt-6 pb-12'>
          <div className='w-5 h-16 bg-[#4f4f54] relative'></div>
          <div className="absolute w-46 h-6 pl-2.5">
            <img src={MeetTheTeam} alt="" style={{ width: 250}} />
          </div>
        </div>
      
      <div className=' m-auto w-3/4 '>
          
          <Slider ref={slider1} {...settings}>
            {cardData.map((d, index) => (
              <div key={index} className="  relative card-hover">
                <div className='container1'>
                <img className="object-cover w-full  h-full border-box grayscale hover:filter-none  " src={d.img} alt="" style={{ width: d.width, height: d.height, bottom: d.bottom }} />
                <div className="absolute  bottom-0 rounded-r-md w-full  bg-black bg-opacity-60 black-box">
                  <div className="text-white text-[15px] pl-3 pb-1 text-left italic">
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
    name: 'Nandkishor R',
    img:Nandkishor ,
    review: 'Chairman',
    
  },
  {
    name: 'Jerry Sanju Joanes',
    img: Jerry,
    review: 'Vice Chairman',
    
  },
  {
    name: 'M Vimal Krishna Rao',
    img: Vimal ,
    review: 'Secretary',
    

   
  },
  {
    name: 'Betsa Sam',
    img: Betsa,
    review: 'Joint Secretary',
    
    
  },
  {
    name: 'Akash M Nandan',
    img: Akash,
    review: 'Treasurer',
    
    
  },
  {
    name: 'Aadithya Sai G Menon',
    img: AadithyaSai,
    review: 'R&D Lead',
    
    
  },
  {
    name: 'Nandana Suresh',
    img:Nandana,
    review: 'FOSS Coordinator',
   height :'300px',
   
   
   
  },
  {
    name: 'George C Thomas ',
    img:George,
    review: 'Project Coordinator',
    // height:'300px',
    
    
  },
  {
    name: 'Anupriya A Pillai',
    img: Anupriya,
    review: 'Design Lead',
    
  },
  {
    name: 'Aparna S',
    img:Aparna,
    review: 'Public Relations Lead',
    width:'600px',
    // height:'500px'
    
  },
  {
    name: 'Megha Daniel',
    img:Megha,
    review: 'Operations Lead',
   
   
  }
  
]


export default Execom
