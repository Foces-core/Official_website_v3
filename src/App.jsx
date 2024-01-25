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
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 5000);
  }, []);
  return (
   
    <div className={`App bg-[#101011] cursor-none`}>
        {
          loading?
          <Loader/>:
        
        <div>
          <Cursor />
          <HeroSection />
          <AboutUs/>
          <ContactUs/>
          <Featuring/>
          <Footer/>
          <Events  />
          <Execom/>

        </div>
}
      </div>
  )
}

export default App;