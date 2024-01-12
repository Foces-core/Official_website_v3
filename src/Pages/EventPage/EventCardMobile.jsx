import React, { useState, useEffect } from "react"
import { motion, spring } from "framer-motion"

import AOS from "aos"
import "aos/dist/aos.css";

import img1 from "../../assets/img1.png"
import img2 from "../../assets/img2.png"
import img3 from "../../assets/img3.png"
import Modal from './Modal';

function EventCardMobile({Events}) {
  let [ExpandingCard, setExpandingCard] = useState(true)
  let [Expanding, setExpanding] = useState(false)
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
   }, [])
  return (
    <div className="h-full w-fit bg-black rounded-xl mt-10 mb-10  flex flex-col " data-aos="fade-up">
       <motion.div
        animate={{ height: !ExpandingCard ? "auto" : 580 }}
        type={spring}
        Layout
        duration="2000"
        className="bg-gradient-to-br from-slate-950 from-0.001%  h-fit  w-[350px]  rounded-lg  shadow-2xl shadow-slate-700  "
        style={{
          transition: "box-shadow 0.7s ease ",
        }} 
        >
          {console.log(Events)}
        <div  className=" flex flex-col h-full  ">
          <div className="w-full h-full flex flex-col  ">
          <a className='w-[100%] h-[100%] mt-12 ml-5  flex flex-col gap-3' onClick={()=>setExpanding(!Expanding)}>
      
      
      <div className='bg-slate-700 w-[90%] h-24  rounded-[30px] ' 
       style={{ backgroundImage: `url(${Events.images[0]})`, backgroundSize: 'cover' }}>
        
      </div>

      <div className='bg-slate-700 w-[90%] h-24  rounded-[30px] ' 
       style={{ backgroundImage: `url(${Events.images[1]})`, backgroundSize: 'cover' }}>
        
      </div>

      <div className='bg-slate-700 w-[90%] h-[0%]  rounded-[30px] ' 
       style={{ backgroundImage: `url(${Events.images[2]})`, backgroundSize: 'cover' }}>
        
      </div>


    </a>

    <Modal images={Events.images} open={Expanding} onClose={() => setExpanding(false)}>
          
         
        </Modal>




    <div className='w-[95%]   items-end text-white'>
      <h1 className='text-7xl  text-right mb-1 ml-3'>{Events.name}</h1>
      <h3 className='text-lg text-left mt-14 ml-5'>
      {Events.content}
      <br />
      {Events.date}
      </h3>

        <div className=' h-[15%] mb-3 flex justify-end items-end transition-all ease-in-out duration-300'>
          <a className="bg-black  hover:bg-blue-700 border-[2px] border-blue-700 hover:border-white 
            p-2 rounded-xl text-white transition-all ease-in-out duration-300" href="">
            Register Now
          </a>
        </div>
    </div>
          </div>
          

          

        </div>
        
        
      </motion.div>
    </div>
  )
}

export default EventCardMobile