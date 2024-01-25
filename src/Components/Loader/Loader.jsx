import React from 'react';
import '../../Loader.css';
import logo from '../../assets/logo.svg';

const Loader = () => {
  return (
    <div className=' flex items-center justify-center  h-screen'>
        

      <div className="relative ">
        <div className="coffee">
          <div></div>
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
    </div>
  );
};

export default Loader;
