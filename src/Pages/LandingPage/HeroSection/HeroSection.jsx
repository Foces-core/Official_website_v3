import './HeroSection.css';
import  { useState, useEffect, useRef } from 'react';
import WAVES from 'vanta/dist/vanta.waves.min';


function HeroSection({ }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [vantaEffect, setVantaEffect] = useState(null)
    const myRef = useRef(null)
    useEffect(() => {
      if (!vantaEffect) {
        setVantaEffect(WAVES({
          el: myRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x000000,
        }))
      }
      return () => {
        if (vantaEffect) vantaEffect.destroy()
      }
    }, [vantaEffect])

  const handleImageClick = (event) => {
    setShowNotifications(!showNotifications);
    event.stopPropagation();
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

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

  const events = [
    {
      id: 1,
      date: '12 June 2024',
      eventName: 'Event Name 1',
      description: 'This is the space where you share the information regarding the event 1',
    },
    {
      id: 2,
      date: '13 June 2024',
      eventName: 'Event Name 2',
      description: 'This is the space where you share the information regarding the event 2',
    },
    {
      id: 3,
      date: '14 June 2024',
      eventName: 'Event Name 3',
      description: 'This is the space where you share the information regarding the event 3',
    },
    {
      id: 4,
      date: '15 June 2024',
      eventName: 'Event Name 4',
      description: 'This is the space where you share the information regarding the event 4',
    },
  ];

  return (
    <div className='HeroSection relative bg-transparent overflow-x-hidden h-screen cursor-none' ref={myRef}>
      
      <div className={`hero ${showNotifications ? 'blur-sm' : ''}`}>
        <img src="././src/assets/ddd.svg" alt="DDD" className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `} />
        <img src="././src/assets/foces.png" alt="FOCES" className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `} />
        <img src="././src/assets/foces1.svg" alt="" className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `} />
        <img src="././src/assets/Notification.png" alt="Notif" className={`Notif h-[26vh] absolute translate-y-80 right-0 cursor-pointer max-[767px]:mt-[35%] max-[767px]:z-0  ${showNotifications?'hidden':''}`} onTouchStart={handleImageClick} onClick={handleImageClick} /> 
      </div>
      <div ref={notificationsRef} className={` notifications h-[60%] w-[28%] absolute bottom-0 max-[767px]:bottom-5 right-0 bg-opacity-45 bg-slate-900 rounded-3xl  overflow-scroll overflow-x-hidden max-[767px]:w-[90%] max-[767px]:z-10 
      ${showNotifications ? 'visible' : 'translate-x-[110%]'}
      ${isMobile ? 'h-[50vh] bottom-[7%] right-[5%]':''}`}>
        {events.map((event) => (
            <div key={event.id} className={`text-[#D9D9D9] flex h-fit flex-col my-10 p-9 w-[100%] pr-4 ${event.id === 1 ? 'mt-0' : ''}`}>
              <div className="notif flex justify-between">
                <div className=''>
                  <img src="././src/assets/speaker.png" alt="" className='border border-[#2a5739] rounded-md' />
                  <div key={event.id} className={`line w-[2px] h-[320%] ml-[30%] bg-[#C2C2C2] ${event.id===4 ? 'h-28' : ''}`}></div>
                </div>
                <div className=''>
                  <img src="././src/assets/clock.png" alt="" />
                  <p className='text-sm'>{event.date}</p>
                </div>
              </div>
              <div className='w-[85%] absolute h-fit mt-[12%] ml-[13%] content'>
                <h3 className='font-semibold'>{event.eventName}</h3>
                <p className='text-sm max-[767px]:w-[95%]'>{event.description}</p>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}

export default HeroSection;