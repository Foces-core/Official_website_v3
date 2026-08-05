import React from "react";
import { FaSquareFacebook, FaInstagram, FaXTwitter, FaLinkedin, FaHeart } from "react-icons/fa6";
import FocesLogo from "../../../assets/FOCES White.svg";
import CollegeLogo from "../../../assets/clogo.png";
import "./Footer.css";

function Footer() {
  return (
    <footer className="h-auto md:h-[12vh] bg-[#101011] relative z-0 flex flex-col md:flex-row w-full items-center justify-between gap-6 p-6 mt-12 border-t border-white/10">
      <div className="w-full md:w-[20%] flex justify-center md:justify-start items-center">
        <img src={FocesLogo} alt="FOCES Logo" className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="flex flex-col justify-between items-center w-full md:w-[60%] gap-4">
        <div className="social flex gap-8 justify-center items-center">
          <a href="https://www.facebook.com/focescec?mibextid=JRoKGi" target="_blank" rel="noreferrer" aria-label="Facebook">
            <FaSquareFacebook className="h-5 w-5 text-[#D9D9D9] hover:text-white hover:scale-125 duration-300" />
          </a>
          <a href="https://www.instagram.com/foces_cec?igsh=b2E3bjNpbGgzdG03" target="_blank" rel="noreferrer" aria-label="Instagram">
            <FaInstagram className="h-5 w-5 text-[#D9D9D9] hover:text-white hover:scale-125 duration-300" />
          </a>
          <a href="https://x.com/foces_cec?t=e__UXOl9tQFznh7JG8kqzQ&s=08" target="_blank" rel="noreferrer" aria-label="Twitter">
            <FaXTwitter className="h-5 w-5 text-[#D9D9D9] hover:text-white hover:scale-125 duration-300" />
          </a>
          <a href="https://www.linkedin.com/in/foces-cec-423176229/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <FaLinkedin className="h-5 w-5 text-[#D9D9D9] hover:text-white hover:scale-125 duration-300" />
          </a>
        </div>
        <p className="text-center text-[#D9D9D9] text-xs md:text-sm">
          Copyright ©{new Date().getFullYear()} All rights reserved | Made with{" "}
          <FaHeart className="inline-block text-[#080AA4] h-3.5 w-3.5 mx-0.5" /> by FOCES
        </p>
      </div>

      <div className="w-full md:w-[20%] hidden md:flex justify-end items-center">
        <img src={CollegeLogo} alt="College Logo" className="h-10 w-auto opacity-70 hover:opacity-100 transition-opacity" />
      </div>
    </footer>
  );
}

export default Footer;
