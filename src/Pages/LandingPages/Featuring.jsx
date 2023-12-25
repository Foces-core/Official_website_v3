import React ,{useState,useEffect} from 'react'
import AOS from "aos"
import "aos/dist/aos.css";
import Slider from 'react-touch-drag-slider'

import FI1 from "../../assets/FI1.svg"
import FH from "../../assets/Featueing.svg"



import img1 from "../../assets/img1.png"
import img2 from "../../assets/img2.png"
import img3 from "../../assets/img3.png"
import img4 from "../../assets/img4.png"





function Featuring() {


  const slides = [
    { url: FI1, title: "beach" },
    { url: FI1, title: "boat" },
    { url: FI1, title: "italy" },
    ];

    useEffect(() => {
        AOS.init({ duration: 1000, once: true })
       }, [])

       const [windowWidth, setWindowWidth] = useState(window.innerWidth);

       useEffect(() => {
        const handleResize = () => {
          setWindowWidth(window.innerWidth);
        };
      
        window.addEventListener('resize', handleResize);
      
       
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }, []);

      const [index, setIndex] = useState(0);
      const [currentIndex, setCurrentIndex] = React.useState(0);


      const next = () => {
        if (index < slides.length - 1) setIndex(index + 1);
        if (index < slides.length - 1) setCurrentIndex(index + 1);
        
        console.log(index )
      };
    
      const previous = () => {
        if (index > 0) setIndex(index - 1);
        if (index > 0) setCurrentIndex(index - 1);
      };
    
    
       if(windowWidth > 700)
 {return (
    <div className="overflow-x-hidden overflow-y-hidden">
      
        <div className="h-screen w-screen bg-black relative items-center">

            <div className="h-fit w-full bg-black absolute top-[28%] flex flex-wrap justify-center items-center gap-[15vh]">
                
                <div data-aos="flip-left" data-aos-duration="1000" className="h-[35vh] w-[31vh] bg-slate-900 shadow-blue-600  shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex justify-center rounded-t-md border-blue-700 border-[1px]  hover:h-fit transition-all ease-in-out duration-400"><img src={FI1} alt="" className='h-[100%] w-[93%]  hover:pt-0 hover:scale-150   hover:rounded-md  transition-all hover:shadow-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ease-in-out duration-300'/></div>
                <div data-aos="flip-left" data-aos-duration="1000" className="h-[35vh] w-[31vh] bg-slate-900 shadow-blue-600  shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex justify-center rounded-t-md border-blue-700 border-[1px]  hover:h-fit transition-all ease-in-out duration-400"><img src={FI1} alt="" className='h-[100%] w-[93%]  hover:pt-0 hover:scale-150   hover:rounded-md  transition-all hover:shadow-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ease-in-out duration-300'/></div>
                <div data-aos="flip-left" data-aos-duration="1000" className="h-[35vh] w-[31vh] bg-slate-900 shadow-blue-600  shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex justify-center rounded-t-md border-blue-700 border-[1px]  hover:h-fit transition-all ease-in-out duration-400"><img src={FI1} alt="" className='h-[100%] w-[93%]  hover:pt-0 hover:scale-150   hover:rounded-md  transition-all hover:shadow-blue-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ease-in-out duration-300'/></div>

            </div>

        </div>
    </div>
  )};
  return (
    <div className="flex  justify-center items-center h-screen w-screen">
       <div className="h-full w-full bg-black relative ">


       <button className="bg-slate-800  rounded-full h-10 w-10 absolute top-[50%] right-[93%] z-20" onClick={previous} >
          〈
        </button>
        <button className="bg-slate-800 rounded-full h-10 w-10 absolute top-[50%] left-[90%] z-20" onClick={next} >
          〉
        </button>

       <Slider
       className="absolute h-[75%] w-[80%]"
        onSlideComplete={(i) => {
        // console.log('finished dragging, current slide is', i)
        setCurrentIndex(i);
        }}
        onSlideStart={(i) => {
        // console.log('started dragging on slide', i)
        
        }}
        activeIndex={index}
        threshHold={100}
        transition={0.5}
        scaleOnDrag={true}
        >
          {slides.map(({ url, title }, index) => (
          <img className='shadow-blue-600  shadow-[0_8px_30px_rgb(0,0,0,0.12)] ' src={url} key={index} alt={title} />
          ))}
       
        </Slider>
        <div className="absolute flex justify-center  gap-3 w-full top-[85%] -translate-x-[1%]">
            
           {slides.map(({ path, title }, index) => (
            <div key={index} className={` w-3 h-3 ease-in-out duration-500 ${index === currentIndex  ? "bg-blue-700 scale-125 rounded-3xl"  : "bg-blue-900"}`}></div>

          ))}

        </div> 
       </div>
    </div>
  );
 
}

export default Featuring