import React from 'react'

function Footer() {
  return (
            <div className='bg-[#101011]'>
                <div className='h-[90vh] w-screen bg-[#101011] flex items-center justify-around px-3'>
                    <div className='Map h-[35%] w-[25%] rounded-3xl'>
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5229.627861662749!2d76.61570370341182!3d9.317201373845165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0622ea027eb08f%3A0x41105b207db821c6!2sCollege%20of%20Engineering%20Chengannur!5e0!3m2!1sen!2sin!4v1681872299096!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{border:"0",borderRadius:"9px"}}
                            allowfullscreen="true"
                            referrerpolicy="no-referrer-when-downgrade" title='map'>
                        </iframe>
                    </div>
                    <div className='Middle flex flex-col items-center justify-between h-[30%] w-[35vw] mt-[12%]'>
                        <img src="././src/assets/FOCES.png" alt="" className='h-[25%] w-[45%]'/>
                        <div className="nav w-[105%] flex justify-between text-sm text-[#D9D9D9]">
                            <a href="">
                                <p>HOME</p>
                            </a>
                            <a href="">
                                <p>ABOUT</p>
                            </a>
                            <a href="">
                                <p>GALLERY</p>
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
                        <div className="social flex h-[20%] w-[60%] justify-around">
                            <div className='h-[85%] w-[11%] rounded-[50%] border-[#D9D9D9] border'>
                                <img src="././src/assets/fb.png" alt="FB Logo" className='h-[95%] w-[95%] ml-[5%] mt-[1%]' />
                            </div>
                            <div className='h-[85%] w-[11%] rounded-[50%] border-[#D9D9D9] border'>
                                <img src="././src/assets/X.png" alt="FB Logo" className='h-[95%] w-[95%] ml-[2.5%] mt-[2%]' />
                            </div>
                            <div className='h-[85%] w-[11%] rounded-[50%] border-[#D9D9D9] border'>
                                <img src="././src/assets/insta.png" alt="FB Logo" className='' />
                            </div>
                            <div className='h-[85%] w-[11%] rounded-[50%] border-[#D9D9D9] border'>
                                <img src="././src/assets/linkedin.png" alt="FB Logo" className='h-[95%] w-[95%] ml-[4%] mt-[2%]' />
                            </div>
                        </div>
                    </div>
                    <div className='Logo h-[60%] w-[25vw] flex flex-col items-center text-[#D9D9D9] mt-[5%] '>
                        <img src="././src/assets/CEC-logo 2.png" alt="" className='h-[58%] w-[62%]' />
                        <p className='text-lg w-[85%]'>
                            College of Engineering Chengannur,
                            Chengannur P.O.<br></br>
                            Alappuzha District, Kerala.
                        </p>
                    </div>
                </div>
                <p className='text-center pb-3 text-[#D9D9D9]'>Copyright ©2023 All rights reserved | Made with love by FOCES</p>
            </div>
  )
}

export default Footer