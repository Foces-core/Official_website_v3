import React, { useState, useEffect, useRef } from 'react';
import './Footer.css'

function Footer() {
    

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mapRef.current && !mapRef.current.contains(event.target)) {
                setShowMap(false);
            }
        };

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);

    

  return (
            <div className='bg-[#101011]  max-[767px]:h-[40vh]'>
                <div className='Footer h-[35vh] min-[767px]:h-[40vh] w-screen bg-[#101011] flex items-center min-[767px]:justify-around px-3 max-[767px]:flex-col-reverse'>
                    <div className='Map h-[65%] w-[25%] rounded-3xl max-[767px]:hidden'>
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5229.627861662749!2d76.61570370341182!3d9.317201373845165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0622ea027eb08f%3A0x41105b207db821c6!2sCollege%20of%20Engineering%20Chengannur!5e0!3m2!1sen!2sin!4v1681872299096!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{border:"0",borderRadius:"9px"}}
                            allowfullscreen="true"
                            referrerpolicy="no-referrer-when-downgrade" title='map'>
                        </iframe>
                    </div>
                    <div className='Middle flex flex-col items-center justify-between h-[75%] w-[35vw] min-[767px]:h-[60%] max-[767px]:w-full max-[767px]:-mt-[10%]'>
                        <img src="././src/assets/FOCES.png" alt="" className='h-[25%] w-[45%] max-[767px]:h-[20%]'/>
                        <div className="nav w-[105%] flex justify-between text-sm text-[#D9D9D9] max-[767px]:w-full max-[380px]:text-xs">
                            <a href="">
                                <p>HOME</p>
                            </a>
                            <a href="">
                                <p>ABOUT</p>
                            </a>
                            <a href="">
                                <p>FEATURING</p>
                            </a>
                            <a href="">
                                <p>TEAM</p>
                            </a>
                            <a href="">
                                <p>EVENTS</p>
                            </a>
                            <a href="">
                                <p>CONTACT</p>
                            </a>
                        </div>
                        <div className="social flex h-[20%] w-[60%] justify-around max-[767px]:w-full">
                            <div className='h-[85%] min-[767px]:w-[11%] rounded-[50%] border-[#D9D9D9] border max-[767px]:h-[55%] max-[767px]:w-[7%] max-[767px]:-mt-5'>
                                <img src="././src/assets/fb.png" alt="FB Logo" className='h-[95%] w-[95%] ml-[5%] mt-[1%]' />
                            </div>
                            <div className='h-[85%] min-[767px]:w-[11%] rounded-[50%] border-[#D9D9D9] border max-[767px]:h-[55%] max-[767px]:w-[7%] max-[767px]:-mt-5'>
                                <img src="././src/assets/X.png" alt="FB Logo" className='h-[95%] w-[95%] ml-[2.5%] mt-[2%]' />
                            </div>
                            <div className='h-[85%] min-[767px]:w-[11%] rounded-[50%] border-[#D9D9D9] border max-[767px]:h-[55%] max-[767px]:w-[7%] max-[767px]:-mt-5'>
                                <img src="././src/assets/insta.png" alt="FB Logo" className='' />
                            </div>
                            <div className='h-[85%] min-[767px]:w-[11%] rounded-[50%] border-[#D9D9D9] border max-[767px]:h-[55%] max-[767px]:w-[7%] max-[767px]:-mt-5'>
                                <img src="././src/assets/linkedin.png" alt="FB Logo" className='h-[95%] w-[95%] ml-[4%] mt-[2%]' />
                            </div>
                        </div>
                    </div>
                    <div className='Logo h-full w-[25vw] flex flex-col items-center text-[#D9D9D9] mt-[5%] max-[767px]:w-screen max-[767px]:hidden '>
                        <img src="././src/assets/CEC-logo 2.png" alt="" className={`h-[58%] w-[62%] max-[767px]:w-[40%] max-[767px]:h-[35%] `} />
                                <p className={`text-lg w-[100%] max-[767px]:w-[100%] max-[767px]:text-center max-[380px]:text-base `}>
                                    College of Engineering Chengannur<br></br></p>
                                <p className={`text-lg w-[100%] max-[767px]:w-[100%] max-[767px]:text-center max-[380px]:text-base`}>
                                    Chengannur P.O.<br></br>
                                    Alappuzha District, Kerala.
                                </p>                    
                    </div>
                </div>
                <p className='text-center pb-3 bg-[#101011] text-[#D9D9D9] max-[767px]:text-sm max-[380px]:text-xs'>Copyright ©2023 All rights reserved | Made with love by FOCES</p>
            </div>
  )
}

export default Footer