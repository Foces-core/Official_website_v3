import './App.css';
import { lazy, Suspense, useEffect } from 'react';
import SectionSkeleton from './Components/SectionSkeleton/SectionSkeleton';
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection';
import Navbar from './Pages/LandingPage/Navbar/Navbar';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useLocation } from 'react-router';
import { useDeviceProfile } from './hooks/useLowPower.js';
import { aosDisabled } from './utils/aosGating.js';

// Below-the-fold sections are code-split: the heavy Swiper chunk (used by
// Featuring + Execom) and the cube logic only download once the user scrolls
// to them, shrinking the first-load bundle. AOS picks up the newly-mounted
// [data-aos] elements via its built-in MutationObserver.
const AboutUs = lazy(() => import('./Components/AboutUs/AboutUs'));
const Featuring = lazy(() => import('./Pages/LandingPages/Featuring'));
const Events = lazy(() => import('./Pages/LandingPages/Events'));
const Execom = lazy(() => import('./Components/Execom/Execom'));
const Footer = lazy(() => import('./Pages/LandingPage/Footer/Footer'));

// AOS hides [data-aos] elements (opacity/transform) until they scroll into
// view. Init runs at module scope, before React renders, so when the animation
// gate is active (reduced motion / low-end device) AOS finds no elements to
// unhide and never registers its observer — leaving every [data-aos] element
// stuck invisible. So when gated, we tag <body> and CSS force-shows all
// [data-aos] content (including anything mounted later, e.g. lazy routes).
const aosGated = aosDisabled();
if (document.body) {
  document.body.classList.toggle('aos-disabled', aosGated);
}
AOS.init({
  once: true,
  disable: aosGated,
});

function App() {
  const location = useLocation();
  const [found, setFound] = React.useState(false);

  const pageH1 = <h1 className="sr-only">FOCES - Forum of Computer Engineering Students</h1>;

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetId = location.state?.id || (location.hash ? location.hash.replace('#', '') : null);
    if (!targetId) return;

    let cancelled = false;
    let observer = null;
    let intervalRef = null;
    const startTime = Date.now();

    const scrollToTarget = () => {
      const el = document.getElementById(targetId);
      if (el && !found) {
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        setFound(true);
        return true;
      }
      return false;
    };

    // 1. Try scrolling immediately if component is already mounted
    if (scrollToTarget()) return;

    // 2. Observe DOM mutations when lazy-loaded Suspense chunks mount
    const mainContainer = document.getElementById('main-content') || document.body;
    observer = new MutationObserver(() => {
      if (scrollToTarget() && observer) {
        observer.disconnect();
      }
    });
    observer.observe(mainContainer, { childList: true, subtree: true });

    // 3. Failsafe polling for up to 5 seconds across slow network chunk downloads
    intervalRef = setInterval(() => {
      if (cancelled) return;
      if (scrollToTarget() || Date.now() - startTime > 5000) {
        clearInterval(intervalRef);
        if (observer) observer.disconnect();
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(intervalRef);
      if (observer) observer.disconnect();
    };
  }, [location]);

  return (
    <div className="App bg-[#101011]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        {pageH1}
        <HeroSection />
        <Suspense fallback={<SectionSkeleton height="200vh" label="Loading sections" />}>
          <AboutUs />
          <Featuring />
          <Events />
          <Execom />
        </Suspense>
      </main>
      <Suspense fallback={<SectionSkeleton height="30vh" label="Loading footer" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
