import { useEffect, useRef, useCallback } from 'react';
import '../../index.css';
import Aboutus from '../../assets/about us.svg';
import '../AboutUs/AboutUs.css';
import useDeviceProfile from '../../hooks/useLowPower.js';

// Easter egg: if the user spins the cube 11 times in RAPID succession (via
// keyboard arrows or a fast drag on touch), a celebration fires. A spin =
// one 90° turn. A gap longer than RAPID_GAP between spins resets the counter,
// so casual rotating never triggers it — only deliberate rapid spinning.
const RAPID_GAP = 1000;
const SPIN_TARGET = 11;

const PARTICLE_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#facc15', '#4ade80', '#ffffff', '#fb7185', '#38bdf8'];
const PARTICLE_EMOJIS = ['✨', '🎉', '⭐', '🔥', '💥', '🚀'];
const EASTER_MESSAGES = [
  'DARE to spin! 🎉',
  '11 spins? You DEVELOP-ded that. 😎',
  'DOMINATE the cube! 🔥',
  'You FOCES-inated the cube ✨',
];

function AboutUs() {
  const { lowPower } = useDeviceProfile();
  const startX = useRef(0);
  const startRot = useRef(0);
  const boxRef = useRef(null);
  const rotRef = useRef(0);
  const isDraggingRef = useRef(false);
  const manualUntilRef = useRef(0);
  const spinCountRef = useRef(0);
  const lastSpinRef = useRef(0);
  const dragStartRotRef = useRef(0);
  const dragCrossedRef = useRef(0);

  const triggerEasterEgg = useCallback(() => {
    const wrap = document.getElementById('mainDiv-about');
    if (!wrap) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Clean up any previous burst
    wrap.querySelectorAll('.about-burst').forEach((n) => n.remove());
    wrap.classList.remove('about-wobble');

    // Celebratory wobble (on the wrapper, so it never fights the cube's inline rotateY)
    if (!reduceMotion) {
      wrap.classList.add('about-wobble');
      setTimeout(() => wrap.classList.remove('about-wobble'), 1000);
    }

    // Toast message (always shown, cheap)
    const toast = document.createElement('div');
    toast.className = 'about-toast';
    toast.textContent = EASTER_MESSAGES[Math.floor(Math.random() * EASTER_MESSAGES.length)];
    wrap.appendChild(toast);
    setTimeout(() => toast.remove(), 1700);

    if (reduceMotion || lowPower) {
      if (lowPower) {
        // low-power devices still get a small burst, just fewer particles
      } else {
        return; // reduced motion: skip the particle animation entirely
      }
    }

    const burst = document.createElement('div');
    burst.className = 'about-burst';
    const count = lowPower ? 8 : 24;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 110;
      const emoji = i % 3 === 0 && Math.random() < 0.5;
      p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      if (emoji) {
        p.className = 'about-particle about-particle--emoji';
        p.textContent = PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)];
        p.style.setProperty('--s', `${16 + Math.random() * 14}px`);
      } else {
        p.className = 'about-particle';
        p.style.setProperty('--c', PARTICLE_COLORS[i % PARTICLE_COLORS.length]);
        p.style.setProperty('--s', `${6 + Math.random() * 9}px`);
      }
      p.style.animationDelay = `${Math.random() * 0.15}s`;
      frag.appendChild(p);
    }
    burst.appendChild(frag);
    wrap.appendChild(burst);
    setTimeout(() => burst.remove(), 1800);
  }, [lowPower]);

  // Register one manual spin; fires the easter egg after SPIN_TARGET rapid spins.
  const registerSpin = useCallback(() => {
    const now = Date.now();
    spinCountRef.current = now - lastSpinRef.current > RAPID_GAP ? 1 : spinCountRef.current + 1;
    lastSpinRef.current = now;
    if (spinCountRef.current >= SPIN_TARGET) {
      spinCountRef.current = 0;
      triggerEasterEgg();
    }
  }, [triggerEasterEgg]);

  // Count 90° crossings during a drag (works for touch and mouse).
  const countDragCrossings = () => {
    const delta = Math.abs(rotRef.current - dragStartRotRef.current);
    const crossed = Math.floor(delta / 90);
    while (crossed > dragCrossedRef.current) {
      dragCrossedRef.current++;
      registerSpin();
    }
  };

  // Smooth 60fps direct DOM auto-rotation when not dragging
  useEffect(() => {
    if (lowPower) return;

    let animFrame;
    const animate = () => {
      if (!isDraggingRef.current && Date.now() >= manualUntilRef.current) {
        rotRef.current = (rotRef.current + 0.5) % 360;
        if (boxRef.current) {
          boxRef.current.style.transform = `rotateY(${rotRef.current}deg)`;
        }
      }
      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [lowPower]);

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
      rotRef.current = Math.round(rotRef.current / 90) * 90 + delta;
      manualUntilRef.current = Date.now() + 3000;
      if (boxRef.current) {
        boxRef.current.style.transition = 'transform 0.4s ease-out';
        boxRef.current.style.transform = `rotateY(${rotRef.current}deg)`;
      }
      registerSpin();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [registerSpin]);

  // Touch Drag Handlers
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startRot.current = rotRef.current;
    dragStartRotRef.current = rotRef.current;
    dragCrossedRef.current = 0;
    isDraggingRef.current = true;
    manualUntilRef.current = Date.now() + 5000;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.touches[0].clientX - startX.current;
    rotRef.current = startRot.current + deltaX * 0.6;
    if (boxRef.current) {
      boxRef.current.style.transition = 'none';
      boxRef.current.style.transform = `rotateY(${rotRef.current}deg)`;
    }
    countDragCrossings();
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    manualUntilRef.current = Date.now() + 2500;
  };

  // Mouse Drag Handlers (for Desktop & Laptop trackpads). Mouse move/up are
  // tracked on `window` so a fast drag can keep spinning past the small cube
  // bounds — otherwise the gesture dies the moment the cursor leaves the box.
  const handleMouseDown = (e) => {
    e.preventDefault();
    startX.current = e.clientX;
    startRot.current = rotRef.current;
    dragStartRotRef.current = rotRef.current;
    dragCrossedRef.current = 0;
    isDraggingRef.current = true;
    manualUntilRef.current = Date.now() + 5000;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startX.current;
    rotRef.current = startRot.current + deltaX * 0.6;
    if (boxRef.current) {
      boxRef.current.style.transition = 'none';
      boxRef.current.style.transform = `rotateY(${rotRef.current}deg)`;
    }
    countDragCrossings();
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    manualUntilRef.current = Date.now() + 2500;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className='mx-6 mt-14 lg:mx-1 flex flex-col justify-center text-white lg:px-44 scroll-mt-24' id='about'>
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
              transform: `rotateY(0deg)`,
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
