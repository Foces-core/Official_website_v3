import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { AiOutlineClose } from "react-icons/ai";
import toggleW from "../../../assets/ButtonW.svg";
import toggleB from "../../../assets/ButtonB.svg";
import LogoWhite from "../../../assets/FOCES White.svg";
import LogoGrey from "../../../assets/FOCES Black.svg";
import useDeviceProfile from "../../../hooks/useLowPower.js";
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
  const { slowNetwork } = useDeviceProfile();
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleItemClick = (id, e) => {
    if (id === "events" || id === "contact") {
      // Stop the HashLink's own navigation (it points to /#events on the home
      // page) so the real route navigation below isn't overridden.
      e.preventDefault();
      if (isMobile) {
        setShowItems(false);
      }
      navigate(id === "events" ? '/events' : '/contact');
      return;
    }
    setCurrentItem(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    if (isMobile) {
      setShowItems(false);
    }
  };

  const handleLogoClick = () => {
    if (isMobile) {
      setShowItems(false);
    }
    if (window.location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    setShowItems(!isMobile);
  }, [isMobile]);

  const handleJoinFocesClick = () => {
    if (isMobile) {
      setShowItems(false);
    }
    // Open in a new tab so the current page isn't hijacked
    window.open("https://www.instagram.com/foces_cec/", "_blank", "noopener,noreferrer");
  };

  // Foresight.js / Quicklink intelligent route chunk prefetching
  const handlePrefetch = (id) => {
    if (slowNetwork) return; // don't waste slow bandwidth on speculative fetches
    if (id === 'events') {
      import('../../EventPage/Eventpage.jsx').catch(() => {});
    } else if (id === 'contact') {
      import('../../../Components/ContactUs/ContactUs.jsx').catch(() => {});
    }
  };

  // Quicklink: once the page is idle, preload real route documents in the
  // viewport (e.g. /events, /contact) so navigation feels instant. Hash-only
  // anchors (#about, #execom…) stay same-page, so they're skipped.
  useEffect(() => {
    if (slowNetwork) return;
    let cancelled = false;
    const idle = (cb) =>
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(cb, { timeout: 2500 })
        : setTimeout(cb, 1500);
    idle(() => {
      if (cancelled) return;
      import('quicklink')
        .then(({ default: quicklink }) =>
          quicklink.listen({
            priority: true,
            ignores: [
              (uri) => uri.pathname === '/', // landing page is already loaded
              (uri) => uri.hash !== '', // same-page section links
            ],
          })
        )
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [slowNetwork]);

  return (
    <div
      className={`fixed z-10 shadow ${
        ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
          ? "nav-w"
          : "nav-b"
      } flex items-center px-5 pt-4 pb-2 font-semibold max-[767px]:pl-4 max-[767px]:py-4 cursor-none max-[767px]:h-[12vh] max-[767px]:w-screen ${
        isScrolled || currentItem === "contact"
          ? "bg-[#101011e6] border-b border-[#ffffff1a]"
          : "bg-transparent"
      }`}
    >
      {isMobile && (
        <div
          className="h-full w-[2rem] Button absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-none"
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
          className="h-auto w-[clamp(88px,8vw,140px)] cursor-pointer"
          onClick={handleLogoClick}
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
          className="h-auto w-[clamp(56px,19vw,84px)] min-[767px]:hidden cursor-pointer"
          onClick={handleLogoClick}
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
            className={`border-b-2 border-transparent z-10 tracking-wider ${
              ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
                ? "text-[#ffffff80]"
                : "text-[#000000b3]"
            } `}
            onMouseEnter={() => handlePrefetch(item.id)}
            onTouchStart={() => handlePrefetch(item.id)}
            onFocus={() => handlePrefetch(item.id)}
            onClick={(e) => handleItemClick(item.id, e)}
          >
            {item.name}
          </HashLink>
        ))}
      </div>

      <div
        className={`contact cursor-pointer w-[8em] h-[2.3em] text-[clamp(0.7rem,0.9vw,0.85rem)] ${
          ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem)
            ? "bg-[#F5F5F5] text-[#101011] hover:bg-cyan-400 hover:text-black"
            : "bg-black text-[#F5F5F5] hover:bg-cyan-400 hover:text-black"
        } flex justify-center items-center rounded-3xl transition-colors duration-300 whitespace-nowrap select-none max-[767px]:ml-auto max-[767px]:mr-12 max-[767px]:w-auto max-[767px]:h-auto max-[767px]:px-4 max-[767px]:py-1.5 max-[767px]:text-[0.7rem] max-[767px]:font-medium max-[767px]:tracking-wide ${
          showItems && isMobile ? "hidden" : ""
        }`}
        onClick={handleJoinFocesClick}
      >
        Join FOCES
      </div>
    </div>
  );
}
