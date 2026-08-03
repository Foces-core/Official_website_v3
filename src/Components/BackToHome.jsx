import React from 'react';

function BackToHome() {
    
    return (
        <div className='h-[10vh] w-screen bg-black relative p-10 flex items-center justify-center max-[767px]:bg-[#101011]'>
            <div className='border-2 border-white h-10 rounded-md text-white font-semibold w-[12vw] flex justify-center items-center hover:bg-white hover:text-black hover:scale-105 transition ease-in-out duration-400 max-[1100px]:w-[15vw] max-[870px]:w-[18vw] max-[700px]:w-[22vw] max-[600px]:w-[25vw] max-[500px]:w-[30vw] max-[430px]:w-[35vw] max-[360px]:w-[40vw] max-[320px]:w-[50vw] max-[767px]:bg-[#101011]'><a href='/'>BACK TO HOME</a></div>
        </div>
    );
}

export default BackToHome
