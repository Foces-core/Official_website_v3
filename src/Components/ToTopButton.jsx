import React, { useEffect, useState } from 'react';
import { FaAngleDoubleUp } from "react-icons/fa";


function ToTopButton() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScrollButtonVisible = () => {
      // Check the scroll position and update show/hide state
      window.scrollY > 300 ? setShowButton(true) : setShowButton(false);
    };

    // Add event listener when the component mounts
    window.addEventListener('scroll', handleScrollButtonVisible);

    // Remove event listener when the component unmounts
    return () => {
      window.removeEventListener('scroll', handleScrollButtonVisible);
    };
  }, []); // Empty dependency array means the effect runs once on mount

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {showButton && (
        <div className=' text-white rounded-full  '>
          <button
            className='fixed bottom-10 right-10 z-50 cursor-pointer p-4 bg-gray-500 text-white rounded-full hover:bg-gray-700 hover:scale-125 transition-all duration-300 '
            onClick={handleScrollToTop}
          ><FaAngleDoubleUp />
          </button>
        </div>
      )}
    </div>
  );
}

export default ToTopButton;
