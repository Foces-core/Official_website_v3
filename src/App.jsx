import './App.css';
import { lazy, Suspense, useEffect } from 'react';
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection';
import Navbar from './Pages/LandingPage/Navbar/Navbar';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useLocation } from 'react-router-dom';
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

  useEffect(() => {
    if (location.state && location.state.id) {
      const element = document.getElementById(location.state.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="App bg-[#101011]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <Suspense fallback={null}>
          <AboutUs />
          <Featuring />
          <Events />
          <Execom />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
