import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  // Read the viewport synchronously on first render so phones never flash the
  // desktop menu open for a frame before the resize effect kicks in.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 767
  );
  const [showItems, setShowItems] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 767
  );
  const [joinPressed, setJoinPressed] = useState(false);
  const joinTimer = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentItem, setCurrentItem] = useState(navItems[0].id);
  const navigate = useNavigate();

  useEffect(() => () => clearTimeout(joinTimer.current), []);

  useEffect(() => {
    const sectionIds = navItems
      .map((item) => item.id)
      .filter((id) => id !== "contact" && document.getElementById(id));
    const pick = () => {
      // Reference line ~35% down the viewport: the section whose top edge has
      // crossed that line is "current". This guarantees the link unselects as
      // soon as you scroll into the next section (unlike a zero-height band).
      const refY = window.innerHeight * 0.35;
      let current = null;
      for (const id of sectionIds) {
        const top = document.getElementById(id).getBoundingClientRect().top;
        if (top <= refY) current = id;
      }
      if (!current && sectionIds.length > 0) current = sectionIds[0];
      setCurrentItem(current);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
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
    if (id === "contact") {
      // Contact is a real route, not a same-page anchor.
      e.preventDefault();
      if (isMobile) {
        setShowItems(false);
      }
      navigate('/contact');
      return;
    }
    if (id === "events" && window.location.pathname !== "/") {
      // Not on the home page: navigate home, then scroll to the #events section.
      e.preventDefault();
      if (isMobile) {
        setShowItems(false);
      }
      navigate("/", { state: { id: "events" } });
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

  // Keyboard navigation: ArrowLeft/ArrowUp / ArrowRight/ArrowDown cycle focus
  // through the nav links, Enter/Space activates the focused link, Escape
  // closes the mobile menu.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isMobile && showItems) {
          e.preventDefault();
          setShowItems(false);
          const toggle = document.querySelector('#nav-toggle');
          if (toggle) toggle.focus();
        }
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const links = Array.from(document.querySelectorAll('#nav-items a'));
      if (!links.length) return;
      const focused = document.activeElement;
      const idx = links.indexOf(focused);
      if (idx === -1) return;
      const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      e.preventDefault();
      const next = links[(idx + dir + links.length) % links.length];
      next.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile, showItems]);

  const handleJoinFocesClick = () => {
    if (isMobile) {
      setShowItems(false);
    }

    // Flip the CTA to cyan first so the click is always visible, even if the
    // popup is blocked or slow.
    setJoinPressed(true);
    clearTimeout(joinTimer.current);
    joinTimer.current = setTimeout(() => setJoinPressed(false), 1200);

    // Open in a new tab so the current page isn't hijacked
    try {
      window.open("https://www.instagram.com/foces_cec/", "_blank", "noopener,noreferrer");
    } catch {
      // popup blocked — the visual flip above still shows the click happened
    }
  };

  // Foresight.js / Quicklink intelligent route chunk prefetching
  const handlePrefetch = useCallback(
    (id) => {
      if (slowNetwork) return; // don't waste slow bandwidth on speculative fetches
      if (id === 'events') {
        import('../../EventPage/Eventpage.jsx').catch(() => {});
      } else if (id === 'contact') {
        import('../../../Components/ContactUs/ContactUs.jsx').catch(() => {});
      }
    },
    [slowNetwork]
  );

  // ForesightJS: predict intent from mouse trajectory / touch / keyboard and
  // prefetch the matching route chunk a beat BEFORE the user actually hovers.
  // Code-split via dynamic import so it never bloats the main bundle.
  useEffect(() => {
    if (slowNetwork) return;
    let cancelled = false;
    let unregisters = [];
    import('js.foresight')
      .then(({ ForesightManager }) => {
        if (cancelled) return;
        if (!ForesightManager.isInitiated) {
          ForesightManager.initialize({
            enableManagerLogging: false,
            minimumConnectionType: '3g',
            setDataAttributes: false,
          });
        }
        const manager = ForesightManager.instance;
        const els = document.querySelectorAll('[data-foresight]');
        els.forEach((el) => {
          const id = el.getAttribute('data-foresight');
          if (id !== 'events' && id !== 'contact') return;
          manager.register({
            element: el,
            name: id,
            callback: () => handlePrefetch(id),
          });
          unregisters.push(() => manager.unregister(el));
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      unregisters.forEach((fn) => fn());
    };
  }, [slowNetwork, handlePrefetch]);

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

  const isDark = ["home", "featuring", "events", "contact", "execom", "about"].includes(currentItem);

  return (
    <div
      className={`fixed z-10 left-0 top-0 w-full shadow ${
        isDark ? "nav-w" : "nav-b"
      } flex items-center px-5 pt-4 pb-2 font-semibold max-[767px]:pl-4 max-[767px]:py-4 cursor-none max-[767px]:h-[12vh] max-[767px]:w-screen min-[768px]:grid min-[768px]:grid-cols-[1fr_auto_1fr] ${
        isScrolled || currentItem === "contact"
          ? "bg-[#101011e6] border-b border-[#ffffff1a]"
          : "bg-transparent"
      }`}
    >
      {/* Left: FOCES logo */}
      <div className="min-[768px]:justify-self-start flex items-center">
        <img
          src={isDark ? LogoWhite : LogoGrey}
          alt="FOCES"
          className={`h-auto w-[clamp(88px,8vw,140px)] flex-none cursor-pointer ${isMobile ? "hidden" : ""}`}
          onClick={handleLogoClick}
        />
        <img
          src={isDark ? LogoWhite : LogoGrey}
          alt="FOCES"
          className={`h-auto w-[clamp(56px,19vw,84px)] cursor-pointer ${isMobile ? "" : "hidden"}`}
          onClick={handleLogoClick}
        />
      </div>

      {/* Center: nav links (perfectly centered between logo and CTA) */}
      <div
        id="nav-items"
        className={`z-10 Items flex items-center justify-center gap-[clamp(0.75rem,2vw,2.25rem)] whitespace-nowrap min-[768px]:justify-self-center ${
          isDark ? "bg-[#101011]" : "bg-[#F5F5F5]"
        } min-[768px]:bg-transparent max-[767px]:h-[60vh] max-[767px]:flex-col max-[767px]:w-screen max-[767px]:-ml-4 max-[767px]:items-center max-[767px]:absolute max-[767px]:top-full max-[767px]:mt-10 max-[767px]:gap-7 max-[767px]:pb-10 ${
          showItems ? "" : "hidden"
        } ${isMobile && showItems ? "h-[80%]" : ""}`}
      >
        {navItems.map((item) => (
          <Link
            to={item.id !== "contact" ? `/#${item.id}` : "/contact"}
            key={item.id}
            data-foresight={item.id}
            aria-current={currentItem === item.id ? "true" : undefined}
            className={`border-b-2 z-10 tracking-wider ${
              currentItem === item.id
                ? "border-[#22d3ee] text-[#22d3ee]"
                : isDark
                  ? "border-transparent text-[#ffffff80]"
                  : "border-transparent text-[#000000b3]"
            } `}
            onMouseEnter={() => handlePrefetch(item.id)}
            onTouchStart={() => handlePrefetch(item.id)}
            onFocus={() => handlePrefetch(item.id)}
            onClick={(e) => handleItemClick(item.id, e)}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Right: Join CTA + mobile hamburger */}
      <div className="min-[768px]:justify-self-end max-[767px]:ml-auto flex items-center gap-2">
        <button
          type="button"
          className={`contact cursor-pointer px-[clamp(1.1em,1.6vw,1.7em)] h-[clamp(2em,2.4vh,2.3em)] text-[clamp(0.7rem,0.85vw,0.88rem)] ${
            joinPressed
              ? "bg-cyan-400 text-black"
              : isDark
                ? "bg-[#F5F5F5] text-[#101011]"
                : "bg-black text-[#F5F5F5]"
          } flex justify-center items-center rounded-3xl whitespace-nowrap select-none max-[767px]:w-auto max-[767px]:h-auto max-[767px]:px-4 max-[767px]:py-1.5 max-[767px]:text-[0.7rem] max-[767px]:font-medium max-[767px]:tracking-wide transition-colors duration-200 ${
            showItems && isMobile ? "hidden" : ""
          }`}
          onClick={handleJoinFocesClick}
        >
          Join FOCES
        </button>

        {isMobile && (
          <button
            type="button"
            id="nav-toggle"
            className="w-[2rem] h-full flex items-center justify-center cursor-none"
            onClick={toggleItems}
            aria-expanded={showItems}
            aria-controls="nav-items"
            aria-label={showItems ? "Close menu" : "Open menu"}
          >
            {showItems ? (
              <AiOutlineClose size={24} color={isDark ? "#fff" : "#000"} />
            ) : (
              <img
                src={isDark ? toggleW : toggleB}
                alt=""
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
