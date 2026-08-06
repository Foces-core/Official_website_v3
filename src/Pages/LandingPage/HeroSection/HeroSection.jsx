import '../../../initThree.js';
import './HeroSection.css';
import { useEffect, useRef } from 'react';
import WAVES from 'vanta/dist/vanta.waves.min';
import Cursor from '../../../Components/Cursor/Cursor';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';

function HeroSection() {
  const myRef = useRef(null);

  useEffect(() => {
    let vantaEffect = null;

    if (myRef.current) {
      try {
        vantaEffect = WAVES({
          el: myRef.current,
          THREE: window.THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          scale: 0.75,
          scaleMobile: 0.5,
          color: 0x000000,
          waveHeight: 18,
          waveSpeed: 0.8,
          zoom: 0.7,
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
  }, []);

  return (
    <div
      className={`HeroSection relative ${
        lowPower ? 'bg-[radial-gradient(circle_at_50%_35%,#1b1b20_0%,#0b0b0c_75%)]' : 'bg-transparent'
      } overflow-hidden h-screen cursor-none`}
      id='home'
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
