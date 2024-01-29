import React, { useRef } from 'react';
import '../../custom.css'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Aravind from '../../assets/Aravind3.svg';
import NandkishorR from '../../assets/Nandkishor3.svg';
import SteveAugustine from '../../assets/SteveAugustine.svg';
import VimalKrishna from '../../assets/Vimal.svg';
import DiyaHarish from '../../assets/Diya.svg';
import NandanaSuresh from '../../assets/Nandana.svg';
import AadithyaSai from '../../assets/Aadithya.svg';
import AkashM from '../../assets/Akash.svg';
import Athul from '../../assets/Athul1.svg';
import Jez from '../../assets/Jez1.svg';
import Anupriya from '../../assets/Anupriya3.svg';
import Shijin from '../../assets/Shijin4.svg';
import Jerry from '../../assets/Jerry3.svg';
import Megha from '../../assets/Megha3.svg';
import Hari from '../../assets/Hari1.svg';
import George from '../../assets/George2.svg';
import MeetTheTeam from '../../assets/meet the team black.svg';
import SubExecom from '../../assets/SUB EXECOM B.svg';
import MainExecom from '../../assets/MAIN EXECOM B.svg';


function Execom() {
  var settings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1500,
    beforeChange: (current, next) => handleBeforeChange(current, next),
    initialSlide: 0,

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
        breakpoint: 460,
    settings: {
      slidesToShow:1 ,
      slidesToScroll: 1,
      initialSlide: 2
        }
      }
    ]
  };
  
  const slider1 = useRef(null);
  const slider2 = useRef(null);

  const handleBeforeChange = (current, next) => {
    slider1.current.slickGoTo(next);
    slider2.current.slickGoTo(next);
  };


  
  return (
    <div className='h-full pb-10  bg-[#F5F5F5]' id='execom'>
      <div >
        <div className='flex items-center pl-6 lg:pl-40 pt-6'>
          <div className='inline-block w-5 h-16 bg-[#4f4f54] relative'></div>
          <div className="absolute w-46 h-6 pl-2.5">
            <img src={MeetTheTeam} alt="" style={{ width: 250}} />
          </div>
        </div>
      </div>
      <div className='m-auto w-3/4  '>
        <div className="mt-20 ">
          <div className='pb-10 pl-4 '>
            <div className='flex items-center '>
              <img className=' w-32 h-4 ' src={MainExecom} alt="" />
            </div>
          </div>
          <Slider ref={slider1} {...settings}>
            {cardData.map((d, index) => (
              <div key={index} className="relative cardSize bg-container card-hover">
                <div className="absolute blueBox  rectangle  bg-[#4f4f54]" />
                <img className="absolute imgSize -ml-2 " src={d.img} alt="" />
                <div className="absolute left-0 flex flex-col items-center bottom-0 bg-black  bg-opacity-60  w-full">
                  
                    <div className="text-white   text-[15px] font-bold">{d.name}</div>
                    <div className="text-white   text-[15px] font-light">{d.review}</div>
                 
                </div>
              </div>
            ))}
          </Slider>


    
          <div className='p-10 pl-4 mt-8 '>
            <div className='flex items-center '>
              <img className=' w-32 h-4' src={SubExecom} alt="" />
            </div>
          </div>
          <Slider ref={slider2} {...settings}>
            {cardData1.map((d1, index) => (
              <div key={index} className="relative cardSize bg-container card-hover">
                <div className="absolute blueBox  rectangle   bg-[#4f4f54]" />
                <img className="absolute imgSize -ml-2  bottom-0" src={d1.img1} alt="" />
                <div className="absolute flex flex-col items-center bg-black left-0 bg-opacity-60 bottom-0 w-full">
                 
                    <div className="text-white  text-[15px] font-bold">{d1.name1}</div>
                    <div className="text-white text-[15px] font-light">{d1.review1}</div>
                  
                </div>
              </div> 
            ))}
          </Slider>

        </div>
      </div>
      </div>
    
  );
}

const cardData = [
  {
    name: 'Aravind HR',
    img: Aravind,
    review: 'Chairman',
    
  },
  {
    name: 'Nandkishor R',
    img: NandkishorR,
    review: 'Vice Chairman',
    
  },
  {
    name: 'Steve Augustine',
    img: SteveAugustine,
    review: 'Secretary',
   
  },
  {
    name: 'M Vimal Krishna Rao',
    img: VimalKrishna,
    review: 'Joint Secretary',
    
  },
  {
    name: 'Diya Harish',
    img: DiyaHarish,
    review: 'Treasurer',
    
  },
  {
    name: 'Nandana Suresh V',
    img: NandanaSuresh,
    review: 'UI/UX Engineer',
    
  },
  {
    name: 'Aadithya Sai G Menon',
    img: AadithyaSai,
    review: 'R&D Lead',
    
  },
  {
    name: 'Akash M Nandan',
    img: AkashM,
    review: 'Project Coordinator',
    
  }
];
const cardData1 = [
  {
    name1: 'Athul Jayaprakash',
    img1: Athul,
    review1: 'UI/UX Designer',
    
  },
  {
    name1: 'Jez Thomas P Kurien',
    img1: Jez,
    review1: 'UI/UX Designer',
  
  },
  {
    name1: 'Anupriya A Pillai',
    img1: Anupriya,
    review1: 'UI/UX Designer',

    
  },
  {
    name1: 'Shijin Abraham',
    img1: Shijin,
    review1: 'Frontend Developer',
    
  },
  {
    name1: 'Jerry Sanju Joanes',
    img1: Jerry,
    review1: 'Frontend Developer',
   
  },
  {
    name1: 'Megha Daniel',
    img1: Megha,
    review1: 'Frontend Developer',
   
  },
  {
    name1: 'Harikrishna A',
    img1: Hari,
    review1: 'Backend Developer',
    
  },
  {
    name1: 'George C Thomas',
    img1: George,
    review1: 'Backend Developer',
    
  }
];



export default Execom
