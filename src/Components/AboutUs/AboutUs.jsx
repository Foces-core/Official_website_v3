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
      This is an organization of CSE students of the college. The forum aims at improving the technical and industrial knowledge of the students and strives to keep them abreast with the latest software and technologies evolving in the information technology field.
      
          <br /><br />
         
      It welcomes the freshers into the world of computer engineering by conducting essential orientation classes. It organizes talks by eminent personalities in the industry on evolving technologies in computing, workshops on the latest developing platforms, languages, and software packages in the IT industry and helps coordinate and implement software projects for the students in the Computer Science & Engineering Department.
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