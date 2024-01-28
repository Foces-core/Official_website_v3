import React ,{useEffect}  from 'react'
import AOS from "aos"
import "aos/dist/aos.css";
import { MouseParallaxContainer, MouseParallaxChild } from "react-parallax-mouse"
import Event from '../../assets/Event.svg'
import  "./Events.css"
import {Link} from "react-router-dom";
import img1 from "../../assets/img1.png"
import img2 from "../../assets/img2.png"
import img3 from "../../assets/img3.png"
import img4 from "../../assets/img4.png"
import Navbar from '../LandingPage/Navbar/Navbar';

function Events() {
  
    useEffect(() => {
       AOS.init({ duration: 1000 , once: true });
      }, [])

      
      
    return (
      <div className='overflow-x-hidden h-fit  pb-5  bg-[#101011]' id='events ' >
        <div className="h-screen w-screen bg-transparent overflow-hidden  relative pb-3 bg-">
          <MouseParallaxContainer 
            className="h-full w-full relative  "
            globalFactorX={0.03}
            globalFactorY={0.03}
            resetOnLeave={true}
            inverted={false}
          >
              <MouseParallaxChild
                factorX={1.}
                factorY={1.}
              >
                <img src={img1} alt="" className='responsive-image1 ' data-aos="slide-right"/>
              </MouseParallaxChild> 
             

              <MouseParallaxChild
                factorX={1.}
                factorY={1.}
              >
                <img src={img2} alt="" className='responsive-image2' data-aos="slide-down"/>
              </MouseParallaxChild>
              

              <MouseParallaxChild
                factorX={1.}
                factorY={1.}
              >
                <img src={img3} alt="" className='responsive-image3' data-aos="slide-up"/>
              </MouseParallaxChild>

              <MouseParallaxChild
                factorX={1.}
                factorY={1.}
              >
                <img src={img4} alt="" className='responsive-image4' data-aos="slide-left"/>
              </MouseParallaxChild>
              
          </MouseParallaxContainer>

            <div className="absolute-center"  >
              <div className="h-fit w-fit " data-aos="zoom-in" >
                <Link to="/Events" className="event-container" >
                  <img src={Event} alt='Events' className="h-20 w-60  mx-5 my-3 animate-pulse p-4"  />
                </Link>
              </div>
            </div>
       </div>
    </div>
  )
}

export default Events