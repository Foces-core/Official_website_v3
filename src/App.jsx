import "./App.css";
import { useEffect } from "react";
import Events from "./Pages/LandingPages/Events";
import Featuring from "./Pages/LandingPages/Featuring";
import HeroSection from "./Pages/LandingPage/HeroSection/HeroSection";
import Footer from "./Pages/LandingPage/Footer/Footer";
import AboutUs from "./Components/AboutUs/AboutUs";
import Execom from "./Components/Execom/Execom";
import Navbar from "./Pages/LandingPage/Navbar/Navbar";
import AOS from "aos";
import "aos/dist/aos.css";
import { useLocation } from "react-router-dom";
import { aosDisabled } from "./utils/aosGating.js";

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
        element.scrollIntoView({ behavior: "smooth" });
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
        <AboutUs />
        <Featuring />
        <Events />
        <Execom />
      </main>
      <Footer />
    </div>
  );
}

export default App;
