import React ,{useState,useEffect} from 'react'
import ReactDOM from 'react-dom';
import Slider from 'react-touch-drag-slider'


import img1 from "../../assets/img1.png"
import img2 from "../../assets/img2.png"
import img3 from "../../assets/img3.png"

export default function Modal({ open, children, onClose , images}) {

  const slides = [
    { url: img1, title: "beach" },
    { url: img2, title: "boat" },
    { url: img3, title: "italy" },
    ];

  if (!open) return null;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  {console.log(images)}


  // const navigateTo = (index) => {
  //   setCurrentIndex(index);
  // };

  return ReactDOM.createPortal(
    <>
      <div className='fixed top-0 left-0 right-0 bottom-0 bg-slate-950 bg-opacity-70 z-50' onClick={onClose} />
        <div className='h-[70vh] w-[90vh] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black rounded-xl p-16 z-50 shadow-slate-700 drop-shadow-lg shadow-2xl'>
        
       
        <Slider
        onSlideComplete={(i) => {
        // console.log('finished dragging, current slide is', i)
        setCurrentIndex(i);
        }}
        onSlideStart={(i) => {
        // console.log('started dragging on slide', i)
        
        }}
        activeIndex={0}
        threshHold={100}
        transition={0.5}
        scaleOnDrag={true}
        >
          {images.map(({ path, title }, index) => (
        <img src={images[index]} key={index} alt={title} />
          ))}
       
        </Slider>

        <div className="absolute flex justify-center  gap-3 w-full -translate-x-[10%]">
            
           {images.map(({ path, title }, index) => (
            <div key={index} className={` w-8 h-2 ease-in-out duration-300 ${index === currentIndex  ? "bg-blue-700 scale-125"  : "bg-blue-900"}`}></div>

          ))}

        </div>    
         
      </div>
    </>,
    document.getElementById('portal')
  );
}
