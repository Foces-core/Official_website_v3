import { useState, useEffect, useRef } from 'react';
import '../../index.css'
import Aboutus from '../../assets/about us.svg';
import '../AboutUs/AboutUs.css'
import useLowPower from '../../hooks/useLowPower.js';


function AboutUs() {
  const lowPower = useLowPower();
  const [rotationY, setRotationY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const startX = useRef(0);
  const startRot = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 500);
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e) => {
    if (!isMobile || lowPower) return;
    startX.current = e.touches[0].clientX;
    startRot.current = rotationY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isDragging || lowPower) return;
    const deltaX = e.touches[0].clientX - startX.current;
    setRotationY(startRot.current + deltaX * 0.4);
  };

  const handleTouchEnd = () => {
    if (!isMobile || lowPower) return;
    setIsDragging(false);
    // Snap to the nearest cube face (every 90 degrees) for a clean finish
    setRotationY((prev) => Math.round(prev / 90) * 90);
  };

  return (
    <div className=' mx-6 mt-14 lg:mx-1 flex flex-col justify-center text-white  lg:px-44' id='about' >
      
      
      <div className='md:text-xl lg:text-2xl mb-4 md:mb-6 lg:mb-8 flex items-center'>
    <div className='inline-block w-5 h-16 bg-[#4f4f54] relative' data-aos="flip-up"></div>
    <img className='absolute w-44 h-[25px] pl-2.5' data-aos="flip-up" data-aos-duration="750" src={Aboutus}alt="" />
        </div>

    <div className='flex  flex-col items-center justify-center container-about '>
  <div className=" sm:text-[14px]   md:text-[17px]   text-center " data-aos="zoom-in" data-aos-duration="1000">
  
      <p className='font-about' >
      The Forum of Computer Engineering Students (FOCES) at the College of Engineering Chengannur aims to uplift the skills of the student community.
 Guided by the visionary ethos of &quot;DARE, DEVELOP, and DOMINATE,&quot; the forum offers opportunities for students to help each other achieve excellence and reach the pinnacle of success.
 Through various workshops, hackathons, and seminars, FOCES provides a platform for students to enhance their technical skills and knowledge. The forum encourages collaboration and innovation, fostering a spirit of teamwork and creativity.
 </p>
  </div>

  <div id="mainDiv-about">
    <div id="boxDiv-about"
      style={isMobile && !lowPower ? { transform: `rotateY(${rotationY}deg)`, transition: isDragging ? 'none' : 'transform 0.3s ease' } : lowPower ? { animation: 'none' } : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
        <div id="front-about"  className='font-about text-shadow-white '>DARE</div>
        <div id="back-about"  className='font-about text-shadow-white '>DEVELOP</div>
        <div id="left-about"  className='font-about text-shadow-white '>DOMINATE</div>
        <div id="right-about"   className='font-about text-shadow-white '>FOCES</div>
        <div id="top-about"  className='font-about  text-shadow-white '>ICFOSS</div>
        <div id="bottom-about"  className='font-about  text-shadow-white '>CEC</div>
        
        <div className="shadow-about"></div>
    </div>
</div>    
 </div>

</div>

  );
}
 export default AboutUs;
