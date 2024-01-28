import {React, useEffect, useRef} from 'react'

function Cursor() {

    const cursorOutlineRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorOutlineRef.current.style.top = `${e.pageY}px`;
      cursorOutlineRef.current.style.left = `${e.pageX }px`;

      cursorOutlineRef.current.animate({
        left: `${e.pageX}px`,
        top: `${e.pageY}px`
      }, {duration: 1000, fill: "forwards"});
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div>
      <div className='cursor-outline max-[767px]:hidden h-1 w-1 bg-[#fff] shadow-[0_0_300px_110px_rgba(255,255,255,0.4)] absolute z-10 pointer-events-none rounded-[50%] left-0 top-0' data-cursor-outline ref={cursorOutlineRef}></div>
    </div>
  )
}

export default Cursor;