import React from 'react';
import '../../index.css'
import Aboutus from '../../assets/about us.svg';
import '../AboutUs/AboutUs.css'


 function AboutUs() {
  return (
    <div className=' mx-6 mt-14 lg:mx-1 flex flex-col justify-center text-white  lg:px-44' id='about' >
      
      
      <div className='md:text-xl lg:text-2xl mb-4 md:mb-6 lg:mb-8 flex items-center'>
    <div className='inline-block w-5 h-16 bg-[#4f4f54] relative' data-aos="flip-up"></div>
    <img className='absolute w-44 h-[25px] pl-2.5' data-aos="flip-up" data-aos-duration="750" src={Aboutus}alt="" />
        </div>

    <div className='flex  flex-col items-center justify-center container-about '>
  <div className=" sm:text-[14px]   md:text-[17px]   text-center " data-aos="zoom-in" data-aos-duration="1000">
  
      <p className='font-about' >
      The Forum of Computer Engineering Students (FOCES) at the College of Engineering Chengannur aims to uplift the skills of the student community.
 Guided by the visionary ethos of "DARE, DEVELOP, and DOMINATE," the forum offers opportunities for students to help each other achieve excellence and reach the pinnacle of success.
 Through various workshops, hackathons, and seminars, FOCES provides a platform for students to enhance their technical skills and knowledge. The forum encourages collaboration and innovation, fostering a spirit of teamwork and creativity.
 </p>
  </div>

  <div id="mainDiv-about">
    <div id="boxDiv-about" >
        <div id="front-about"  className='font-about text-shadow-white '>VISIONARY</div>
        <div id="back-about"  className='font-about text-shadow-white '>EMPOWERMENT</div>
        <div id="left-about"  className='font-about text-shadow-white '>ZEAL</div>
        <div id="right-about"   className='font-about text-shadow-white '>EVOLUTION</div>
        <div id="top-about"  className='font-about  text-shadow-white '>SUCCESS</div>
        <div id="bottom-about"  className='font-about  text-shadow-white '>OPPORTUNITY</div>
        
        <div className="shadow-about"></div>
    </div>
</div>    
 </div>

</div>

  );
}
 export default AboutUs;