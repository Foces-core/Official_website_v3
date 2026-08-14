import { useEffect, useState } from 'react';
import './Loader.css';
import logo from '../../assets/logo.svg';
import { isSmallScreen } from '../../utils/breakpoints.js';

const Loader = () => {
  // The narrow-screen pick used to be a one-shot render-time window read
  // (unreactive — resizing mid-navigation kept the wrong tagline). Now the
  // POLICY lives in breakpoints.js (unit-tested); this effect just makes it
  // reactive, same resize seam the other responsive components use.
  const [isNarrow, setIsNarrow] = useState(() => isSmallScreen(window.innerWidth));

  useEffect(() => {
    const onResize = () => setIsNarrow(isSmallScreen(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const textContent = isNarrow
    ? "\u00A0 \u00A0 1st Rule Of Programming: \nIf A Code Works, Don't Touch It."
    : "1st Rule Of Programming: If A Code Works, Don't Touch It.";

  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-[#101011]"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div className="relative">
        <div className="steam-container" aria-hidden="true">
          <span className="steam-dot" />
          <span className="steam-dot" />
          <span className="steam-dot" />
          <span className="steam-dot" />
        </div>
        <div className="coffee">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="absolute top-0 left-0 right-0 bottom-0 p-2">
          <img className="w-full h-full" src={logo} alt="FOCES" loading="eager" decoding="async" />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <span className="text-cyan-400 font-semibold text-xs tracking-widest uppercase mb-1">
          Loading...
        </span>
        <span className={`text-gray-300 p-3 text-sm font-Grotesk ${isNarrow ? 'break-lines' : ''}`}>
          {textContent}
        </span>
      </div>
    </div>
  );
};
export default Loader;
