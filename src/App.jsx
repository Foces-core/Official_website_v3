import './App.css'
import { useState, useEffect } from "react";
import Loader from './components/Loader/Loader'
import Events from './Pages/LandingPages/Events'
import Featuring from './Pages/LandingPages/Featuring'
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection'
import Footer from './Pages/LandingPage/Footer/Footer'
import ContactUs from './components/ContactUs/ContactUs';
import AboutUs from  './Components/AboutUs/AboutUs';
import Execom from './components/Execom/Execom';
import Navbar from './Pages/LandingPage/Navbar/Navbar'
import Cursor from './Components/Cursor/Cursor';
import AOS from "aos";
import "aos/dist/aos.css";
import { Routes,Route } from 'react-router-dom/dist'

AOS.init({
  once: true, 
});

function App() {
  const [loading, setLoading] = useState(true);
  const [loaderOpacity, setLoaderOpacity] = useState(1);

  useEffect(() => {
    const loaderTimeout = setTimeout(() => {
      setLoaderOpacity(0.5); 
    }, 4000);

    const contentTimeout = setTimeout(() => {
      setLoading(false); 
    },5000);

    
    return () => {
      clearTimeout(loaderTimeout);
      clearTimeout(contentTimeout);
    };
  }, []);

return (
  <div className={`App bg-[#101011] cursor-none`}>
          <div className={`transition-opacity duration-1000`} style={{ opacity: loading ? loaderOpacity : 1 }}>

      {loading ? <Loader /> : (
        <div>
          <Cursor />
          <HeroSection />
          <AboutUs />
          <ContactUs />
          <Featuring />
          <Footer />
          <Events />
          <Execom />
        </div>
      )}
    </div>
  </div>
);

}

export default App;