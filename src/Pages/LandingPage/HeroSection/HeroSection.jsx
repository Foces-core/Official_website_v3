import './HeroSection.css';
import { useState, useEffect, useRef } from 'react';
import WAVES from 'vanta/dist/vanta.waves.min';
import Cursor from '../../../Components/Cursor/Cursor';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import Notification from '../../../assets/Notification.png';
import clock from '../../../assets/clock.png';
import speaker from '../../../assets/speaker.png';
import client from '../../../sanityClient.js';
import BlockContent from "@sanity/block-content-to-react";

function HeroSection() {
  const [notfy, setNotfy] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const myRef = useRef(null);

  useEffect(() => {
    client.fetch(
      `*[_type == "notification"]{
        Event_name,
        id,
        date,
        short_details,
      }`
    ).then((data) => {
      const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotfy(sortedData);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let vantaEffect = null;
    if (myRef.current) {
      vantaEffect = WAVES({
        el: myRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        scale: 0.75,
        scaleMobile: 0.50,
        color: 0x000000,
      });
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  const handleImageClick = (event) => {
    setShowNotifications(!showNotifications);
    event.stopPropagation();
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    handleResize();

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className='HeroSection relative bg-transparent overflow-hidden h-screen cursor-none' id='home' ref={myRef}>
      <div className="hero">
        <Cursor />
        <img src={ddd} alt="DDD" className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `} />
        <img src={focespng} alt="FOCES" className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `} />
        <img src={foces1} alt="" className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `} />
      </div>
    </div>
  );
}

export default HeroSection;
