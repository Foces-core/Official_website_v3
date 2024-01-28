import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleItems = () => {
    setShowItems(!showItems);
    event.stopPropagation();
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    handleResize();
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setShowItems(!isMobile);
  }, [isMobile]);

  return (
    <div className={`fixed   z-10 shadow nav flex min-[767px]:items-center p-5 font-bold max-[767px]:pl-4 max-[767px]:pt-8 cursor-none max-[767px]:w-screen ${isScrolled ? "backdrop-blur-md" :"backdrop-blur-0"}`}>
      {isMobile && (
        <div
          className="h-[2rem] w-[2rem] Button absolute inset-y-10 right-5 flex items-center top-[31%] cursor-none"
          onClick={toggleItems}
        ></div>
      )}

      {!isMobile && (
        <img
          src="././src/assets/FOCES.png"
          alt="FOCES"
          className="h-[5%] w-[10%] max-[767px]:h-[3vh] max-[767px]:w-[15vw]"
        />
      )}
      {isMobile && (
        <img
          src="././src/assets/FOCES.png"
          alt="FOCES"
          className="h-[5%] w-[10%] mt-1 max-[767px]:h-[3vh] max-[767px]:w-[24vw] min-[767px]:hidden"
        />
      )}

      <div
        className={`container z-10 bg-transparent Items flex justify-center space-x-9 text-[white] max-[767px]:bg-[#101011] max-[767px]:flex-col max-[767px]:w-screen max-[767px]:-ml-4 max-[767px]:items-center max-[767px]:space-x-0 max-[767px]:absolute max-[767px]:h-[70vh] max-[767px]:mt-10 max-[767px]:gap-7 max-[767px]:pb-10 ${
          showItems ? "" : "hidden"
        } ${isMobile && showItems ? "h-[80%]" : ""}`}
      >
        <a
          href="/"
          className={`border-b-2 border-transparent max-[767px]:hidden`}
        >
          HOME
        </a>

        <a
          href="#about"
          className={`border-b-2 border-transparent max-[767px]:border-none max-[767px]:my-2`}
          onClick={() => handleItemClick("about")}
        >
          ABOUT
        </a>

        <a
          href="#featuring"
          className={`border-b-2 border-transparent max-[767px]:border-none max-[767px]:my-2`}
          onClick={() => handleItemClick("gallery")}
        >
          FEATURING
        </a>

        <a
          href="#execom"
          className={`border-b-2 border-transparent max-[767px]:border-none max-[767px]:my-2`}
          onClick={() => handleItemClick("team")}
        >
          MEET THE TEAM
        </a>

        <a
          href="/events"
          className={`border-b-2 border-transparent max-[767px]:border-none max-[767px]:my-2`}
          onClick={() => handleItemClick("events")}
        >
          EVENTS
        </a>

        <a
          href="/contact"
          className={`border-b-2 border-transparent max-[767px]:border-none max-[767px]:my-2`}
          onClick={() => {
            handleItemClick("contact");
            toggleItems();
          }}
          
        >
          CONTACT
        </a>
      </div>

      <div className={`contact text-[#101011] cursor-pointer w-[9em] h-[2.5em] bg-[white] flex justify-center items-center rounded-3xl hover:bg-[#101011] hover:text-white hover:border hover:border-white duration-700 max-[767px]:h-[4vh] max-[767px]:ml-28 max-[767px]:w-[6.5em] max-[380px]:ml-[25%] max-[320px]:ml-[15%] ${(showItems && isMobile) ? "hidden": ""}`}>
        Join FOCES
      </div>
    </div>
  );
}
