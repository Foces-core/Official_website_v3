import React from 'react';

function BackToHome() {
    
    return (
        <div className='h-[10vh] w-screen bg-black relative p-10 flex items-center justify-center'>
            <div className='border-2 border-white h-10 rounded-md text-white font-semibold w-[12%] flex justify-center items-center hover:bg-white hover:text-black hover:scale-105 transition ease-in-out duration-400'><a href='/'>BACK TO HOME</a></div>
        </div>
    );
}

export default BackToHome
