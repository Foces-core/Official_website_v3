import './HeroSection.css';
import { useEffect, useRef } from 'react';
import Cursor from '../../../Components/Cursor/Cursor';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import useDeviceProfile from '../../../hooks/useLowPower.js';

function HeroSection() {
  const myRef = useRef(null);
  const { lowPower } = useDeviceProfile();

  useEffect(() => {
    let vantaEffect = null;
    let cancelled = false;

    // Skip the WebGL waves on low-end phones (it stutters there) and on
    // prefers-reduced-motion (a11y). The plain #0a0a0c backdrop remains.
    if (lowPower) return;

    // three.js + vanta are ~700KB combined, so they're loaded on demand as a
    // separate chunk. Low-end devices never download them; capable machines
    // fetch them once here (after the shell is interactive).
    (async () => {
      try {
        // three's ESM entry has no default export — the namespace object IS the
        // THREE api vanta expects. Vanta's UMD default is on `mod.default`.
        const [THREE, vantaMod] = await Promise.all([
          import('three'),
          import('vanta/dist/vanta.waves.min'),
        ]);
        const WAVES = vantaMod.default;
        window.THREE = THREE;
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
      className="HeroSection relative bg-[#0a0a0c] overflow-hidden h-screen cursor-none"
      id='home'
      tabIndex={-1}
      ref={myRef}
    >
      <div className="hero">
        <Cursor />
        <img src={ddd} alt="DDD" decoding="async" className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `} />
        <img src={focespng} alt="FOCES" fetchPriority="high" decoding="async" className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `} />
        <img src={foces1} alt="" decoding="async" className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `} />
      </div>
    </div>
  );
}

export default HeroSection;
