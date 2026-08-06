import { useState, useEffect, useRef } from 'react';
import '../../index.css';
import Aboutus from '../../assets/about us.svg';
import '../AboutUs/AboutUs.css';
import useDeviceProfile from '../../hooks/useLowPower.js';

function AboutUs() {
  const { lowCPU, reducedMotion } = useDeviceProfile();
  const [rotationY, setRotationY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startRot = useRef(0);
  const boxRef = useRef(null);
  const rotRef = useRef(0);
  const isDraggingRef = useRef(false);
  const manualUntilRef = useRef(0);
  const transTimerRef = useRef(null);

  // Auto-rotation effect when not dragging
  useEffect(() => {
    if (reducedMotion) return;

    let animFrame;
    const animate = () => {
      if (!isDraggingRef.current && Date.now() >= manualUntilRef.current) {
        setRotationY((prev) => (prev + 0.4) % 360);
      }
      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [reducedMotion]);

  // Keep rotRef updated for smooth transitions
  useEffect(() => {
    rotRef.current = rotationY;
  }, [rotationY]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = boxRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      e.preventDefault();
      const delta = e.key === 'ArrowRight' ? 90 : -90;
      const nextRot = Math.round(rotRef.current / 90) * 90 + delta;
      manualUntilRef.current = Date.now() + 3000;
      setRotationY(nextRot);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(transTimerRef.current);
    };
  }, []);

  // Touch Drag Handlers
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startRot.current = rotationY;
    setIsDragging(true);
    isDraggingRef.current = true;
    manualUntilRef.current = Date.now() + 5000;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.touches[0].clientX - startX.current;
    setRotationY(startRot.current + deltaX * 0.6);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    manualUntilRef.current = Date.now() + 3000;
  };

  // Mouse Drag Handlers (for Desktop & Laptop trackpads)
  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    startRot.current = rotationY;
    setIsDragging(true);
    isDraggingRef.current = true;
    manualUntilRef.current = Date.now() + 5000;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startX.current;
    setRotationY(startRot.current + deltaX * 0.6);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    manualUntilRef.current = Date.now() + 3000;
  };

  return (
    <div className='mx-6 mt-14 lg:mx-1 flex flex-col justify-center text-white lg:px-44' id='about'>
      <div className='md:text-xl lg:text-2xl mb-4 md:mb-6 lg:mb-8 flex items-center'>
        <div className='inline-block w-5 h-16 bg-[#4f4f54] relative' data-aos="flip-up"></div>
        <img className='absolute w-44 h-[25px] pl-2.5' data-aos="flip-up" data-aos-duration="750" src={Aboutus} alt="" />
      </div>

      <div className='flex flex-col items-center justify-center container-about'>
        <div className="sm:text-[14px] md:text-[17px] text-center" data-aos="zoom-in" data-aos-duration="1000">
          <p className='font-about'>
            The Forum of Computer Engineering Students (FOCES) at the College of Engineering Chengannur aims to uplift the skills of the student community.
            Guided by the visionary ethos of &quot;DARE, DEVELOP, and DOMINATE,&quot; the forum offers opportunities for students to help each other achieve excellence and reach the pinnacle of success.
            Through various workshops, hackathons, and seminars, FOCES provides a platform for students to enhance their technical skills and knowledge. The forum encourages collaboration and innovation, fostering a spirit of teamwork and creativity.
          </p>
        </div>

        <div id="mainDiv-about" className="select-none cursor-grab active:cursor-grabbing">
          <div
            id="boxDiv-about"
            ref={boxRef}
            style={{
              transform: `rotateY(${rotationY}deg)`,
              transition: isDragging ? 'none' : 'transform 0.1s linear',
              animation: 'none',
              touchAction: 'pan-y',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            role="group"
            aria-label="FOCES values cube, touch or drag to rotate, use left and right arrow keys"
          >
            <div id="front-about" className='font-about text-shadow-white'>DARE</div>
            <div id="back-about" className='font-about text-shadow-white'>DEVELOP</div>
            <div id="left-about" className='font-about text-shadow-white'>DOMINATE</div>
            <div id="right-about" className='font-about text-shadow-white'>FOCES</div>
            <div id="top-about" className='font-about text-shadow-white'>ICFOSS</div>
            <div id="bottom-about" className='font-about text-shadow-white'>CEC</div>

            <div className="shadow-about"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
