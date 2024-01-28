import React from 'react';
import '../../index.css'
import Aboutus from '../../assets/about us b.svg';

 function AboutUs() {
  return (
    <div className=' bg-[#F5F5F5] text-black w-full h-screen mx-auto p-[1.5rem] md:p-16 lg:p-24 flex flex-col justify-center  lg:px-60 ' id='about'>
      <div className='md:text-xl lg:text-2xl mb-4 md:mb-6 lg:mb-8'>
      <div className='flex items-center'>
    <div className='inline-block w-5 h-16 bg-[#4f4f54] relative' data-aos="flip-up"></div>
    <img className='absolute w-44 h-[25px] pl-2.5' data-aos="flip-up" data-aos-duration="750" src={Aboutus}alt="" />
  </div>
        </div>


  <div className="font-Armata px-8 sm:text-justify text-base lg:text-xl" data-aos="zoom-in" data-aos-duration="1000">
    <p>
      This is an organization of CSE students of the college. The forum aims at improving the technical and industrial knowledge of the students and strives to keep them abreast with the latest software and technologies evolving in the information technology field.
      <br/><br/>
      It welcomes the freshers into the world of computer engineering by conducting essential orientation classes. It organizes talks by eminent personalities in the industry on evolving technologies in computing, workshops on the latest developing platforms, languages, and software packages in the IT industry and helps coordinate and implement software projects for the students in the Computer Science & Engineering Department.
    </p>
  </div>
</div>

  )
}
 export default AboutUs;