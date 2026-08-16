import './Loader.css';
import { useViewportWidth } from '../../hooks/useViewportWidth.js';
import { isSmallScreen } from '../../utils/breakpoints.js';

const Loader = () => {
  // Narrow-screen tagline pick: policy in breakpoints.js, reactivity from
  // the shared useViewportWidth seam (the initializer + resize listener
  // used to be hand-rolled here).
  const isNarrow = isSmallScreen(useViewportWidth());

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
