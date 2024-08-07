import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { AiOutlineClose } from "react-icons/ai";
import toggleW from "../../../assets/ButtonW.svg";
import toggleB from "../../../assets/ButtonB.svg";
import LogoWhite from "../../../assets/FOCES White.svg";
import LogoGrey from "../../../assets/FOCES Black.svg";
import "./Navbar.css";

const navItems = [
  { id: "home", name: "HOME" },
  { id: "about", name: "ABOUT" },
  { id: "featuring", name: "FEATURING" },
  { id: "events", name: "EVENTS" },
  { id: "execom", name: "MEET THE TEAM" },
  { id: "contact", name: "CONTACT" },
];

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentItem, setCurrentItem] = useState(navItems[0].id);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentItem(entry.target.id);
          }
        });
      },
      { threshold: 0, rootMargin: "-7% 0% -93% 0%" }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => {
      navItems.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) observer.unobserve(element);
      });
    };
  }, []);

  const toggleItems = () => {
    setShowItems(!showItems);
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

  const handleItemClick = (id) => {
    if (id === "events") {
      window.location.href = "/Events";
      return;
    } else if (id === "contact") {
      window.location.href = "/contact";
      return;
    }
    setCurrentItem(id.toUpperCase());
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    if (isMobile) {
      setShowItems(false);
    }
  };

  useEffect(() => {
    setShowItems(!isMobile);
  }, [isMobile]);

  const handleJoinFocesClick = () => {
    window.location.href = "https://www.instagram.com/foces_cec/";
  };

  return (
    <div
      className={`fixed z-10 shadow ${
        ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
          ? "nav-w"
          : "nav-b"
      } flex min-[767px]:items-center px-5 pt-4 pb-2 font-semibold max-[767px]:pl-4 max-[767px]:pt-8 cursor-none max-[767px]:h-[12vh] max-[767px]:w-screen ${
        isScrolled && currentItem !== "contact"
          ? "backdrop-blur-md"
          : "backdrop-blur-0"
      } ${currentItem === "contact" ? "backdrop-blur-md" : "backdrop-blur-0"}`}
    >
      {isMobile && (
        <div
          className="h-[full] w-[2rem] Button absolute inset-y-10 right-5 flex items-center justify-center top-[31%] cursor-none"
          onClick={toggleItems}
        >
          {showItems ? (
            <AiOutlineClose size={24} color={["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem) ? "#fff" : "#000"} />
          ) : (
            <img
              src={
                ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
                  ? toggleW
                  : toggleB
              }
              alt=""
            />
          )}
        </div>
      )}

      {!isMobile && (
        <img
          src={
            ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
              ? LogoWhite
              : LogoGrey
          }
          alt="FOCES"
          className="h-[5%] w-[10%] max-[767px]:h-[3vh] max-[767px]:w-[15vw]"
        />
      )}
      {isMobile && (
        <img
          src={
            ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
              ? LogoWhite
              : LogoGrey
          }
          alt="FOCES"
          className="h-[5%] w-[10%] mt-1 max-[767px]:h-[3vh] max-[767px]:w-[24vw] min-[767px]:hidden"
        />
      )}

      <div
        className={`container z-10 Items flex justify-center space-x-9 min-[767px]:bg-transparent pt-2  ${
          ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
            ? "bg-[#101011]"
            : "bg-[#F5F5F5]"
        }  max-[767px]:h-[60vh] max-[767px]:flex-col max-[767px]:w-screen max-[767px]:-ml-4 max-[767px]:items-center max-[767px]:space-x-0 max-[767px]:absolute max-[767px]:mt-10 max-[767px]:gap-7 max-[767px]:pb-10 ${
          showItems ? "" : "hidden"
        } 
           ${isMobile && showItems ? "h-[80%]" : ""}
          `}
      >
        {navItems.map((item) => (
          <HashLink
            to={item.id !== "contact" ? `/#${item.id}` : "/contact"}
            key={item.id}
            className={`border-b-2 border-transparent z-10  ${
              ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
                ? "text-[#ffffff80]"
                : "text-[#000000b3]"
            } `}
            onClick={() => handleItemClick(item.id)}
          >
            {item.name}
          </HashLink>
        ))}
      </div>

      <div
        className={`contact cursor-pointer w-[9em] h-[2.5em]  ${
          ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
            ? "bg-[#F5F5F5] text-[#101011] hover:bg-[#101011] hover:text-[#F5F5F5] hover:border hover:border-[#F5F5F5]"
            : "bg-black text-[#F5F5F5] hover:bg-[#F5F5F5] hover:text-black hover:border hover:border-black"
        } flex justify-center items-center rounded-3xl duration-700 max-[767px]:h-[4vh] max-[767px]:ml-28 max-[767px]:w-[6.5em] max-[380px]:ml-[25%] max-[320px]:ml-[15%] ${
          showItems && isMobile ? "hidden" : ""
        }`}
        onClick={handleJoinFocesClick}
      >
        Join FOCES
      </div>
    </div>
  );
}
