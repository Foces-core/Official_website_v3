import React from 'react'
import Navbar from '../Navbar/Navbar'

function HeroSection() {
  return (
    <div className='HeroSection bg-[#101011] w-screen h-screen overflow-hidden'>
        <div className="navbar">
            <Navbar />
        </div>
        <div className="hero">
            <img src="././src/assets/ddd.svg" alt="DDD" className='h-[50%] w-[38%] relative top-[40vh] left-[12vw] z-10' />
            <img src="././src/assets/foces.png" alt="FOCES" className='h-[50%] w-[40%] relative top-[45vh] left-[12vw] z-10' />
            <img src="././src/assets/foces1.svg" alt="" className='h-[50%] w-[40%] relative top-[50vh] left-[12vw]' />
            <img src="././src/assets/Mac.png" alt="Apple Mac" className='relative h-[15%] w-[15%] top-[15vh] left-[72vw] ' />
        </div>
    </div>
  )
}

export default HeroSection