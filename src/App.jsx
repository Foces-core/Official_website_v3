
import './App.css'
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection'
import Footer from './Pages/LandingPage/Footer/Footer'
import AboutUs from  './components/AboutUs/AboutUs';
import ContactUs from './components/ContactUs/ContactUs';
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
      </div>
  )
}

export default App;