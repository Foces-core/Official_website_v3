import './HeroSection.css';
import { useEffect, useRef } from 'react';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import useDeviceProfile from '../../../hooks/useLowPower.js';

// Skip Vanta on small screens — it looks bad on phones/tablets and wastes GPU.
const MIN_VANTA_WIDTH = 1024;

function HeroSection() {
  const myRef = useRef(null);
  const { lowPower } = useDeviceProfile();

  useEffect(() => {
    let vantaEffect = null;
    let cancelled = false;

    // Skip on low-end devices, reduced-motion, or small screens.
    if (lowPower) return;
    if (window.innerWidth < MIN_VANTA_WIDTH) return;

    // three.js + vanta are ~700KB combined, loaded on demand as a separate chunk.
    (async () => {
      try {
        const [THREE, vantaMod] = await Promise.all([
          import('three'),
          import('vanta/dist/vanta.waves.min'),
        ]);
        const WAVES = vantaMod.default;
        if (cancelled || !myRef.current) return;
        vantaEffect = WAVES({
          el: myRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x1a1a20,
          backgroundColor: 0x0a0a0c,
          shininess: 35.0,
          waveHeight: 18.0,
          waveSpeed: 0.75,
          zoom: 0.85,
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
  }, [lowPower]);

  return (
    <div
      className="HeroSection relative bg-[#0a0a0c] overflow-hidden h-screen"
      id="home"
      tabIndex={-1}
      ref={myRef}
    >
      <div className="hero">
        <img
          src={ddd}
          alt="DDD"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `}
        />
        <img
          src={focespng}
          alt="FOCES"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `}
        />
        <img
          src={foces1}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `}
        />
      </div>
    </div>
  );
}

export default HeroSection;
