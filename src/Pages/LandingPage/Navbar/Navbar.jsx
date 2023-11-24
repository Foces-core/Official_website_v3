import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [showItems, setShowItems] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeItem, setActiveItem] = useState("");

  const toggleItems = () => {
    setShowItems(!showItems);
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setShowItems(!isMobile);
  }, [isMobile]);

  return (
    <div className="shadow bg-[#101011] flex p-10 font-bold">
      {isMobile && (
        <div
          className="h-[2rem] w-[2rem] Button absolute inset-y-8 right-5 flex items-center sm:hidden cursor-pointer"
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
      {!showItems && (
        <img
          src="././src/assets/FOCES.png"
          alt="FOCES"
          className="h-[5%] w-[10%] max-[767px]:h-[3vh] max-[767px]:w-[15vw] min-[767px]:hidden"
        />
      )}

      <div
        className={`container Items flex items-center justify-center space-x-9 text-[white] dark:text-gray-300 max-[767px]:flex-col max-[767px]:items-middle max-[767px]:space-x-0 max-[767px]:fixed ${
          showItems ? "" : "hidden"
        }`}
      >
        <a
          href="#"
          className={`border-b-2 border-transparent hover:text-[white] dark:hover:text-[white] hover:border-[white] max-[767px]:border-none max-[767px]:my-2 ${
            activeItem === "home" ? "border-[white]" : ""
          }`}
          onClick={() => handleItemClick("home")}
        >
          HOME
        </a>

        <a
          href="#"
          className={`border-b-2 border-transparent hover:text-[white] dark:hover:text-[white] hover:border-[white] max-[767px]:border-none max-[767px]:my-2 ${
            activeItem === "about" ? "border-[white]" : ""
          }`}
          onClick={() => handleItemClick("about")}
        >
          ABOUT
        </a>

        <a
          href="#"
          className={`border-b-2 border-transparent hover:text-[white] dark:hover:text-[white] hover:border-[white] max-[767px]:border-none max-[767px]:my-2 ${
            activeItem === "gallery" ? "border-[white]" : ""
          }`}
          onClick={() => handleItemClick("gallery")}
        >
          GALLERY
        </a>

        <a
          href="#"
          className={`border-b-2 border-transparent hover:text-[white] dark:hover:text-[white] hover:border-[white] max-[767px]:border-none max-[767px]:my-2 ${
            activeItem === "team" ? "border-[white]" : ""
          }`}
          onClick={() => handleItemClick("team")}
        >
          MEET THE TEAM
        </a>

        <a
          href="#"
          className={`border-b-2 border-transparent hover:text-[white] dark:hover:text-[white] hover:border-[white] max-[767px]:border-none max-[767px]:my-2 ${
            activeItem === "events" ? "border-[white]" : ""
          }`}
          onClick={() => handleItemClick("events")}
        >
          EVENTS
        </a>

        <a
          href="#"
          className={`border-b-2 border-transparent hover:text-[white] dark:hover:text-[white] hover:border-[white] max-[767px]:border-none max-[767px]:my-2 ${
            activeItem === "contact" ? "border-[white]" : ""
          }`}
          onClick={() => handleItemClick("contact")}
        >
          CONTACT
        </a>
      </div>

      <div className="contact text-[#101011] w-[9em] h-[2em] bg-[white] flex justify-center items-center rounded-2xl max-[767px]:hidden">
        Join FOCES
      </div>
    </div>
  );
}
