import { useState, useEffect, useRef } from 'react';
import '../../index.css'
import Aboutus from '../../assets/about us.svg';
import '../AboutUs/AboutUs.css'
import useDeviceProfile from '../../hooks/useLowPower.js';


function AboutUs() {
  const { lowCPU, reducedMotion } = useDeviceProfile();
  const [rotationY, setRotationY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const startX = useRef(0);
  const startRot = useRef(0);
  // Desktop cube is driven imperatively (no React re-render per frame):
  const boxRef = useRef(null);
  const rotRef = useRef(0); // live rotation in degrees
  const rafRef = useRef(null);
  const manualUntilRef = useRef(0); // pauses auto-rotate while user navigates
  const transTimerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 500;
      if (mobile) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setRotationY(rotRef.current % 360);
      }
      setIsMobile(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop auto-rotate. Cheap: writes transform straight to the DOM at 60fps,
  // skipping React entirely. Frozen on low-CPU machines (CSS animation was too
  // — but here the keyboard controls still work while it's static).
  useEffect(() => {
    if (isMobile || lowCPU) return;
    rotRef.current = rotationY % 360;

    const step = () => {
      if (Date.now() >= manualUntilRef.current) {
        rotRef.current = (rotRef.current + 0.4) % 360; // ~24°/s ≈ 15s/lap
        if (boxRef.current) boxRef.current.style.transform = `rotateY(${rotRef.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isMobile, lowCPU, rotationY]);

  // Arrow keys step the desktop cube face-by-face (90°). Only active while the
  // cube is on screen so the page still scrolls normally elsewhere.
  useEffect(() => {
    if (isMobile) return;

    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = boxRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      e.preventDefault();
      const delta = e.key === 'ArrowRight' ? 90 : -90;
      rotRef.current = Math.round(rotRef.current / 90) * 90 + delta;
      manualUntilRef.current = Date.now() + 3000; // let the user read the face
      el.style.transition = 'transform 0.5s ease';
      el.style.transform = `rotateY(${rotRef.current}deg)`;
      clearTimeout(transTimerRef.current);
      transTimerRef.current = setTimeout(() => {
        if (el) el.style.transition = 'none';
      }, 600);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(transTimerRef.current);
    };
  }, [isMobile]);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    startRot.current = rotationY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isDragging) return;
    const deltaX = e.touches[0].clientX - startX.current;
    setRotationY(startRot.current + deltaX * 0.4);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
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
      ref={boxRef}
      style={
        isMobile
          // Drag works on every device; only the ease-out snap costs frames,
          // so drop it when CPU is tight / user wants reduced motion.
          ? {
              transform: `rotateY(${rotationY}deg)`,
              transition: isDragging || lowCPU || reducedMotion ? 'none' : 'transform 0.3s ease',
            }
          // Desktop: the JS loop drives the transform directly, so the CSS
          // animation must be off to avoid fighting it.
          : { animation: 'none' }
      }
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      role="group"
      aria-label="FOCES values cube, use left and right arrow keys to rotate"
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
