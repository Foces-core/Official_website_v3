import React, { useEffect } from "react";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa6";
import { FaHeart } from "react-icons/fa6";
import "./Footer.css";

function Footer() {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mapRef.current && !mapRef.current.contains(event.target)) {
        setShowMap(false);
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="h-[10vh] bg-[#101011] relative z-0 flex w-screen items-center gap-10 p-5 max-[767px]:flex-col mt-20 max-[767px]:mt-5">
      <div className="w-[15%] max-[767px]:w-[50%]">
        <img src="././src/assets/FOCES.png" alt="" />
      </div>
      <div className="flex flex-col justify-between items-center w-[70%] gap-10">
        <div className="social flex gap-16 max-[767px]:w-screen max-[767px]:justify-center">
          <a href="https://www.facebook.com/focescec?mibextid=JRoKGi" target="_blank">
            <FaSquareFacebook className="h-5 w-5 text-[#D9D9D9] hover:scale-125 duration-300" />
          </a>
          <a href="https://www.instagram.com/foces_cec?igsh=b2E3bjNpbGgzdG03" target="_blank">
            <FaInstagram className="h-5 w-5 text-[#D9D9D9] hover:scale-125 duration-300" />
          </a>
          <a href="https://x.com/foces_cec?t=e__UXOl9tQFznh7JG8kqzQ&s=08" target="_blank">
            <FaXTwitter className="h-5 w-5 text-[#D9D9D9] hover:scale-125 duration-300" />
          </a>
          <a href="https://www.linkedin.com/in/foces-cec-423176229/" target="_blank">
            <FaLinkedin className="h-5 w-5 text-[#D9D9D9] hover:scale-125 duration-300" />
          </a>
        </div>
        <p className="text-center text-[#D9D9D9] max-[767px]:w-screen max-[767px]:text-sm max-[380px]:text-xs">
          Copyright ©2023 All rights reserved | Made with{" "}
          <FaHeart className="inline-block text-[#080AA4] h-4 w-4" /> by FOCES
        </p>
      </div>
      <div className="w-[15%] max-[767px]:hidden">
        <img src="././src/assets/clogo.png" alt="" className="scale-[80%]" />
      </div>
    </div>
  );
}

export default Footer;
