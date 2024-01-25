import './App.css'
import { useState, useEffect } from "react";
import Loader from './components/Loader/Loader'
import Events from './Pages/LandingPages/Events'
import Featuring from './Pages/LandingPages/Featuring'
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection'
import Footer from './Pages/LandingPage/Footer/Footer'
import AboutUs from  './components/AboutUs/AboutUs';
import ContactUs from './components/ContactUs/ContactUs';
import Execom from './components/Execom/Execom';
import Animation from './Components/Animation/Animation';
import Cursor from './Components/Cursor/Cursor';
import AOS from "aos";
import "aos/dist/aos.css";

AOS.init({
  once: true, 
});

function App() {
  const [loading, setLoading] = useState(true);
  const [loaderOpacity, setLoaderOpacity] = useState(1);

  useEffect(() => {
    const loaderTimeout = setTimeout(() => {
      setLoaderOpacity(0.5); 
    }, 6000);

    const contentTimeout = setTimeout(() => {
      setLoading(false); 
    },9000);

    
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