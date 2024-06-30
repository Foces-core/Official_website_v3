import React from 'react';
import './Loader.css';
import logo from '../../assets/logo.svg';

const Loader = () => {
  const isSmallScreen = window.innerWidth < 500;

  const textContent = isSmallScreen
    ? '\u00A0 \u00A0 1st Rule Of Programming: \nIf A Code Works, Don\'t Touch It.'
    : '1st Rule Of Programming: If A Code Works, Don\'t Touch It.';

  return (
    <div className=' flex flex-col items-center justify-center  h-screen'>
        
 
      <div className="relative">
        <div className="coffee ">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className='absolute top-0 left-0 right-0 bottom-0 p-2'>
          <img className='w-full h-full' src={logo} alt="FOCES" />
        </div>
      </div>
     
 
      <span className={`text-white p-5 font-Armata ${isSmallScreen ? 'break-lines' : ''}`}>
  {textContent}
</span>

    </div>

    
  );
};
export default Loader;