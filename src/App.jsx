import "./App.css";
import { useState, useEffect } from "react";
import Events from "./Pages/LandingPages/Events";
import Featuring from "./Pages/LandingPages/Featuring";
import HeroSection from "./Pages/LandingPage/HeroSection/HeroSection";
import Footer from "./Pages/LandingPage/Footer/Footer";
import AboutUs from "./Components/AboutUs/AboutUs";
import Execom from "./Components/Execom/Execom";
import Navbar from "./Pages/LandingPage/Navbar/Navbar";
import ToTopButton from "./Components/ToTopButton";
import AOS from "aos";
import "aos/dist/aos.css";
import { useLocation } from "react-router-dom";

AOS.init({
  once: true,
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
      <ToTopButton />
      <Navbar />
      <HeroSection />
      <AboutUs />
      <Featuring />
      <Events />
      <Execom />
      <Footer />
    </div>
  );
}

export default App;
