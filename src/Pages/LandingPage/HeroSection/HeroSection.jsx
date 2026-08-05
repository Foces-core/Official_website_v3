import './HeroSection.css';
import { useState, useEffect, useRef } from 'react';
import Cursor from '../../../Components/Cursor/Cursor';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import client from '../../../sanityClient.js';

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
      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotfy(sortedData);
      }
    }).catch(() => {
      // Fallback silently if Sanity project is unconfigured/CORS restricted
    });
  }, []);

  useEffect(() => {
    let vantaEffect = null;
    let cancelled = false;

    // Lazy-load three + vanta AFTER window.THREE is set.
    // (vanta captures window.THREE at module-evaluation time, so a static
    // import would capture it before main.jsx/HeroSection can assign it.)
    (async () => {
      try {
        const THREE = await import('three');
        if (typeof window !== 'undefined') {
          window.THREE = THREE;
        }
        const { default: WAVES } = await import('vanta/dist/vanta.waves.min');
        if (cancelled || !myRef.current) return;
        vantaEffect = WAVES({
          el: myRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          scale: 0.75,
          scaleMobile: 0.5,
          color: 0x000000,
        });
      } catch (err) {
        console.warn('Vanta Waves init warning:', err);
      }
    })();

    return () => {
      cancelled = true;
      if (vantaEffect && typeof vantaEffect.destroy === 'function') {
        vantaEffect.destroy();
      }
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
