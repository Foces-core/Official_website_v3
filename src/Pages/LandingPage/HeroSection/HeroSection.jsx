import '../../../initThree.js';
import './HeroSection.css';
import { useEffect, useRef } from 'react';
import WAVES from 'vanta/dist/vanta.waves.min';
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

    // Skip the WebGL waves on low-end phones (it stutters there) and on
    // prefers-reduced-motion (a11y). The plain #0a0a0c backdrop remains.
    if (lowPower) return;

    if (myRef.current) {
      try {
        vantaEffect = WAVES({
          el: myRef.current,
          THREE: window.THREE,
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
    }

    return () => {
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
