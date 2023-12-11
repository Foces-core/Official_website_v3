import AboutUs from  './components/AboutUs/AboutUs';
import ContactUs from './components/ContactUs/ContactUs';
import AOS from "aos";
import "aos/dist/aos.css";

AOS.init({
  once: true, 
});


function App() {
  return(
    <div>

      <AboutUs/>
      <ContactUs/>
      
    </div>
  )
}

export default App;