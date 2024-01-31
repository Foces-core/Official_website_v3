import React, { useState, useEffect } from 'react';
import EventcardL from './EventcardL.jsx';
import EventcardR from './EventcardR.jsx';
import EventCardMobile from './EventCardMobile.jsx';
import img1 from "../../assets/img1.png";
import img2 from "../../assets/img2.png";
import img3 from "../../assets/img3.png";
import Navbar from '../LandingPage/Navbar/Navbar.jsx';
import Footer from '../LandingPage/Footer/Footer.jsx';
import BackToHome from '../../Components/BackToHome.jsx';

function Eventpage() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  

  
   const  EventsList = [
      {
        name: "Event 1",
        images: [
          img1,
          img2,
          img3
        ],
        date: "2023-01-01",
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin vel justo vel risus scelerisque dapibus."
      },
      {
        name: "Event 2",
        images: [
          img1,
          img2,
          img3
        ],
        date: "2022-02-15",
        content: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."
      },
      {
        name: "Event 3",
        images: [
          img1,
          img2,
          img3
        ],
        date: "2023-05-20",
        content: "Fusce consequat felis eget justo tincidunt, in luctus arcu tincidunt. Nulla facilisi."
      }
    ]
  


    const sortedEventsList = [...EventsList].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
  



  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (windowWidth > 1000) {
    return (
      <div className=" overflow-x-hidden flex flex-col">
        <Navbar />
        <div className="h-[100%]  w-full bg-black overflow-hidden flex flex-col justify-center items-center gap-7 p-10 overflow-x-hidden  pt-28 float-left clear-left">
          {sortedEventsList.map((event, index) => (
            index%2===0 ?(<EventcardL key={index} Events={event} />):(<EventcardR key={index} Events={event}  className="" />)
          ))}
        
        </div>
        {/* <BackToHome /> */}
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="flex justify-center items-center flex-col  bg-black ">
        {sortedEventsList.map((event, index) => (
            <EventCardMobile  key={index} Events={event} />
          ))}
      </div>
      {/* <BackToHome /> */}
      <Footer />
    </div>
  );
}

export default Eventpage;
