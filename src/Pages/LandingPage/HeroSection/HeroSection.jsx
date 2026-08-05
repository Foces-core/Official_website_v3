import './HeroSection.css';
import { useEffect, useRef, useState } from 'react';
import Cursor from '../../../Components/Cursor/Cursor';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import Notification from '../../../assets/Notification.png';
import clock from '../../../assets/clock.png';
import speaker from '../../../assets/speaker.png';
import useDeviceProfile from '../../../hooks/useLowPower.js';
import client from '../../../sanityClient.js';
import BlockContent from '@sanity/block-content-to-react';

function HeroSection() {
  const myRef = useRef(null);
  const { lowPower } = useDeviceProfile();
  const [notfy, setNotfy] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    client.fetch(
      `*[_type == "notification"]{
        Event_name,
        id,
        date,
        short_details,
      }`
    )
      .then((data) => {
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotfy(sortedData);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    handleResize();

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
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

  const handleImageClick = (event) => {
    setShowNotifications(!showNotifications);
    event.stopPropagation();
  };

  useEffect(() => {
    // Skip the heavy WebGL background entirely on low-power devices
    // (Data Saver, 2G, low RAM, reduced motion) — the three+vanta chunks
    // are never even downloaded in that case.
    if (lowPower) return;

    let vantaEffect = null;
    let cancelled = false;

    // Vanta already skips renderer.render() while the hero is off-screen, but
    // its requestAnimationFrame loop keeps ticking (with a getBoundingClientRect
    // layout read every single frame). Fully stop the loop while the hero is
    // out of view and restart it when it comes back — no destroy/recreate, so
    // no shader recompile hitch on scroll-back.
    const heroVisible = { current: true };

    const pauseVanta = (v) => {
      if (v._focesPaused) return;
      v._focesPaused = true;
      window.cancelAnimationFrame(v.req);
    };
    const resumeVanta = (v) => {
      if (!v._focesPaused) return;
      v._focesPaused = false;
      v.animationLoop(); // re-schedules itself; elapsed time is clamped internally
    };

    let io = null;
    const heroEl = myRef.current;
    if (heroEl && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => {
        heroVisible.current = entry.isIntersecting;
        if (!vantaEffect) return;
        if (entry.isIntersecting) {
          resumeVanta(vantaEffect);
        } else {
          pauseVanta(vantaEffect);
        }
      }, { threshold: 0 });
      io.observe(heroEl);
    }

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
        // Hero may already be off-screen (e.g. page loaded mid-scroll) — flush
        // any pending IO callback so heroVisible reflects reality, then pause
        // immediately so the loop never runs in the background.
        if (io) io.takeRecords();
        if (!heroVisible.current) pauseVanta(vantaEffect);
      } catch (err) {
        console.warn('Vanta Waves init warning:', err);
      }
    })();

    return () => {
      cancelled = true;
      if (io) io.disconnect();
      if (vantaEffect && typeof vantaEffect.destroy === 'function') {
        vantaEffect.destroy();
      }
    };
  }, [lowPower]);

  return (
    <div
      className={`HeroSection relative ${
        lowPower ? 'bg-[radial-gradient(circle_at_50%_35%,#1b1b20_0%,#0b0b0c_75%)]' : 'bg-transparent'
      } overflow-hidden h-screen cursor-none`}
      id='home'
      ref={myRef}
    >
      <div className={`hero ${showNotifications ? 'blur-sm' : ''}`}>
        <Cursor />
        <img src={ddd} alt="DDD" decoding="async" className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `} />
        <img src={focespng} alt="FOCES" fetchPriority="high" decoding="async" className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `} />
        <img src={foces1} alt="" decoding="async" className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `} />
        <img src={Notification} alt="Notif" className={`Notif h-[26vh] absolute translate-y-80 right-0 cursor-pointer max-[767px]:mt-[35%] max-[767px]:z-0 ${showNotifications ? 'hidden' : ''}`} onTouchStart={handleImageClick} onClick={handleImageClick} />
      </div>
      <div ref={notificationsRef} className={`notifications h-[60%] w-[28%] absolute bottom-3 max-[767px]:bottom-5 right-0 bg-opacity-45 bg-slate-900 rounded-3xl overflow-scroll overflow-x-hidden max-[767px]:w-[90%] max-[767px]:z-10 ${showNotifications ? 'visible' : 'translate-x-[110%]'} ${isMobile ? 'h-[50vh] bottom-[7%] right-[5%]' : 'right-3'}`}>
        {notfy.map((event) => (
          <div key={event.id} className={`text-[#D9D9D9] flex h-fit flex-col my-10 p-9 w-[100%] pr-4 ${event.id === 1 ? 'mt-0' : ''}`}>
            <div className="notif flex justify-between">
              <div className=''>
                <img src={speaker} alt="" className='border border-[#2a5739] rounded-md' />
                <div key={event.id} className={`line w-[2px] h-[320%] ml-[30%] bg-[#C2C2C2] ${event.id === 4 ? 'h-28' : ''}`}></div>
              </div>
              <div className=''>
                <img src={clock} alt="" />
                <p className='text-sm'>{event.date}</p>
              </div>
            </div>
            <div className='w-[85%] absolute h-fit mt-[12%] ml-[13%] content'>
              <h3 className='font-semibold'>{event.Event_name}</h3>
              <p className='text-sm max-[767px]:w-[95%]'>
                <BlockContent
                  blocks={event.short_details}
                  projectId='n7hx0w67'
                  dataset="production"
                />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroSection;
