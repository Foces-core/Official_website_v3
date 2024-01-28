import React ,{useState,useEffect} from 'react'
import Popup from 'reactjs-popup';
import Slider from 'react-touch-drag-slider'
import AOS from "aos"
import "aos/dist/aos.css";

import img1 from "../../assets/img1.png"
import img2 from "../../assets/img2.png"
import img3 from "../../assets/img3.png"
import Modal from './Modal';


function EventcardR({Events}) {                                               //To display the card with the image starting from Right

    

  const [Expanding, setExpanding] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
   }, [])


return (
  <div  className='  h-ful w-[95%] bg-gradient-to-bl from-slate-950 from-0.001%  rounded-2xl mt-10 flex flex-wrap justify-center gap-5' data-aos="slide-right">

  <div className='w-[45%]  m-5 items-start text-white'>
    <h1 className='text-7xl  text-left mt-3 mb-3 mr-3'>{Events.name}</h1>
    <h3 className='text-xl text-left mt-14 mr-5'>
      {Events.content}
      <br />
      {Events.date}
      </h3>

      <div className=' h-1/4 flex justify-start items-end transition-all ease-in-out duration-300  '>
        <a className="bg-black  hover:bg-blue-700 border-[2px] border-blue-700 hover:border-white hover:scale-105 
          p-2 rounded-xl text-white transition-all ease-in-out duration-500" href="">
          Register Now
        </a>
      </div>
  </div>
  <a className='w-[45%] m-5 flex flex-col gap-3 ' onClick={()=>setExpanding(!Expanding)} >
    
    
  <div className='bg-slate-700 w-[90%] h-24  rounded-[30px] ' 
     style={{ backgroundImage: `url(${Events.images[0]})`, backgroundSize: 'cover' }}>
      
    </div>

    <div className='bg-slate-700 w-[70%] h-24  rounded-[30px] ' 
     style={{ backgroundImage: `url(${Events.images[1]})`, backgroundSize: 'cover' }}>
      
    </div>

    <div className='bg-slate-700 w-[90%] h-24  rounded-[30px] ' 
     style={{ backgroundImage: `url(${Events.images[2]})`, backgroundSize: 'cover' }}>
      
    </div>


  </a>{console.log(Events)}

  <Modal images={Events.images} open={Expanding} onClose={() => setExpanding(false)}>
        Fancy Modal
        {console.log(Expanding)}
      </Modal>

  </div>
)
}

export default EventcardR 