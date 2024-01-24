import './App.css'
import Events from './Pages/LandingPages/Events'
import Featuring from './Pages/LandingPages/Featuring'
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection'
import Footer from './Pages/LandingPage/Footer/Footer'
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
  
  return (
    
    <div className={`App bg-[#101011] cursor-none`}>
      <Cursor />
      <Navbar />
      <HeroSection />
      <AboutUs />
      <Featuring/>
      <Events  />
      <Execom/>
      <Footer/>
      </div>
  )
}

export default App;