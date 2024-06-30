import "./App.css";
import { useState, useEffect } from "react";
import Loader from "./Components/Loader/Loader";
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
import { useLocation } from "react-router-dom/dist";
import { Routes, Route } from "react-router-dom/dist";

AOS.init({
  once: true,
});

function App() {
  const [loading, setLoading] = useState(true);
  const [loaderOpacity, setLoaderOpacity] = useState(1);
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.id) {
      const element = document.getElementById(location.state.id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  useEffect(() => {
    const loaderTimeout = setTimeout(() => {
      setLoaderOpacity(0.5);
    }, 5000);

    const contentTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(loaderTimeout);
      clearTimeout(contentTimeout);
    };
  }, []);

  return (
    <div className={`App bg-[#101011]`}>
      <div
        className={`transition-opacity duration-1000`}
        style={{ opacity: loading ? loaderOpacity : 1 }}
      >
        {loading ? (
          <Loader />
        ) : (
          <div>
            <ToTopButton />
            <Navbar />
            <HeroSection />
            <AboutUs />
            <Featuring />
            <Events />
            <Execom />
            <Footer />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
