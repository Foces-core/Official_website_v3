import React from 'react'
import './App.css'
import Events from './Pages/LandingPages/Events'
import Featuring from './Pages/LandingPages/Featuring'
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection'
import Footer from './Pages/LandingPage/Footer/Footer'
import AboutUs from  './components/AboutUs/AboutUs';
import ContactUs from './components/ContactUs/ContactUs';
import Execom from './components/Execom/Execom';
import AOS from "aos";
import "aos/dist/aos.css";

AOS.init({
  once: true, 
});

function App() {
  return (
   
      <div className='App'>
        <HeroSection />
        <AboutUs/>
        <ContactUs/>
        <Footer/>
        <Featuring/>
        <Events  />
        <Execom/>
      </div>
  )
}

export default App;