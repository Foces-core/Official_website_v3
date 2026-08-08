import './Loader.css';
import logo from '../../assets/logo.svg';

const Loader = () => {
  const isSmallScreen = window.innerWidth < 500;

  const textContent = isSmallScreen
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
        <span
          className={`text-gray-300 p-3 text-sm font-Grotesk ${isSmallScreen ? 'break-lines' : ''}`}
        >
          {textContent}
        </span>
      </div>
    </div>
  );
};
export default Loader;
