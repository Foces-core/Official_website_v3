import React from 'react';
import './Loader.css';
import logo from '../../assets/logo.svg';

const Loader = () => {
  const isSmallScreen = window.innerWidth < 500;

  const textContent = isSmallScreen
    ? '1st Rule Of Programming: \n If it Works, Don\'t Touch It.'
    : '1st Rule Of Programming: If it Works, Don\'t Touch It.';

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
          <img className='w-full h-full' src={logo} alt="We're here" />
        </div>
      </div>
     
 
      <span className={`text-white p-5 font-Armata ${isSmallScreen ? 'break-lines' : ''}`}>
  {textContent}
</span>

    </div>

    
  );
};
export default Loader;