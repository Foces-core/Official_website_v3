import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { createPortal } from 'react-dom';
import { AiOutlineClose } from 'react-icons/ai';
import toggleW from '../../../assets/ButtonW.svg';
import toggleB from '../../../assets/ButtonB.svg';
import LogoWhite from '../../../assets/FOCES White.svg';
import LogoGrey from '../../../assets/FOCES Black.svg';
import useDeviceProfile from '../../../hooks/useLowPower.js';
import './Navbar.css';

const navItems = [
  { id: 'home', name: 'HOME' },
  { id: 'about', name: 'ABOUT' },
  { id: 'featuring', name: 'FEATURING' },
  { id: 'events', name: 'EVENTS' },
  { id: 'execom', name: 'MEET THE TEAM' },
  { id: 'contact', name: 'CONTACT' },
];

export default function Navbar() {
  const { slowNetwork } = useDeviceProfile();
  // Read the viewport synchronously on first render so phones never flash the
  // desktop menu open for a frame before the resize effect kicks in.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 767,
  );
  const [showItems, setShowItems] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 767,
  );
  const [joinPressed, setJoinPressed] = useState(false);
  const joinTimer = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentItem, setCurrentItem] = useState(navItems[0].id);
  // Roving tabindex (ARIA APG): exactly one link owns tabindex=0. When the
  // user arrow-keys through the links, the tabstop follows the focused link.
  // null = fall back to the scrollspy-current item (or the first link).
  const [rovingId, setRovingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => () => clearTimeout(joinTimer.current), []);

  useEffect(() => {
    const pickActiveSection = () => {
      if (location.pathname === '/contact') {
        setCurrentItem('contact');
        return;
      }
      if (location.pathname !== '/') {
        setCurrentItem(null);
        return;
      }

      const sectionIds = navItems.map((item) => item.id).filter((id) => id !== 'contact');

      // Reference line at ~35% down the viewport
      const refY = window.innerHeight * 0.35;
      let current = null;

      // Check if user is scrolled near the bottom of the page
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= refY) {
            current = id;
          }
        }
      }

      if (isNearBottom) {
        // Find last visible section in DOM
        for (let i = sectionIds.length - 1; i >= 0; i--) {
          if (document.getElementById(sectionIds[i])) {
            current = sectionIds[i];
            break;
          }
        }
      }

      if (!current) current = 'home';
      setCurrentItem(current);
    };

    pickActiveSection();

    window.addEventListener('scroll', pickActiveSection, { passive: true });
    window.addEventListener('resize', pickActiveSection, { passive: true });

    // Observe DOM mutations to pick up lazy-loaded Suspense section elements as they mount
    const observer = new MutationObserver(pickActiveSection);
    const mainEl = document.getElementById('main-content') || document.body;
    if (mainEl) {
      observer.observe(mainEl, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('scroll', pickActiveSection);
      window.removeEventListener('resize', pickActiveSection);
      observer.disconnect();
    };
  }, [location.pathname]);

  const toggleItems = () => {
    setShowItems(!showItems);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      setShowItems(!mobile);
    };

    handleResize();
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleItemClick = (id, e) => {
    if (id === 'contact') {
      // Contact is a real route, not a same-page anchor.
      e.preventDefault();
      if (isMobile) {
        setShowItems(false);
      }
      navigate('/contact');
      return;
    }
    if (window.location.pathname !== '/') {
      // Not on the home page: navigate home, then scroll to the target section.
      e.preventDefault();
      if (isMobile) {
        setShowItems(false);
      }
      navigate('/', { state: { id } });
      return;
    }
    setCurrentItem(id);
    setRovingId(id);
    if (isMobile) {
      // Close the overlay first; the body scroll lock is released when it
      // unmounts, so defer the section scroll by a frame pair.
      setShowItems(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const toggle = document.getElementById('nav-toggle');
          if (toggle) toggle.focus();
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        });
      });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = () => {
    if (isMobile) {
      setShowItems(false);
    }
    if (window.location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // While the mobile menu is open, lock the page behind it: no scrolling and  // no interaction with the content under the full-screen overlay.
  useEffect(() => {
    if (!isMobile || !showItems) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, showItems]);

  // Move focus into the overlay when the mobile menu opens and trap Tab focus
  // so keyboard/screen-reader users cycle inside the drawer until closed.
  useEffect(() => {
    if (!isMobile || !showItems) return;
    const closeBtn = document.getElementById('nav-close');
    if (closeBtn) closeBtn.focus();

    const handleTabTrap = (e) => {
      if (e.key !== 'Tab') return;
      const overlay = document.getElementById('nav-items-mobile');
      if (!overlay) return;
      const focusables = Array.from(
        overlay.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !overlay.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !overlay.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleTabTrap);
    return () => window.removeEventListener('keydown', handleTabTrap);
  }, [isMobile, showItems]);

  // Keyboard navigation: ArrowLeft/ArrowUp / ArrowRight/ArrowDown cycle focus
  // through the nav links, Enter/Space activates the focused link, Escape
  // closes the mobile menu.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isMobile && showItems) {
          e.preventDefault();
          setShowItems(false);
          // Focus the toggle once it re-appears after the overlay unmounts.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const toggle = document.querySelector('#nav-toggle');
              if (toggle) toggle.focus();
            });
          });
        }
        return;
      }
      if (
        e.key !== 'ArrowLeft' &&
        e.key !== 'ArrowRight' &&
        e.key !== 'ArrowUp' &&
        e.key !== 'ArrowDown'
      )
        return;
      const links = Array.from(document.querySelectorAll('#nav-items a, #nav-items-mobile a'));
      if (!links.length) return;
      const focused = document.activeElement;
      const idx = links.indexOf(focused);
      if (idx === -1) return;
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      e.preventDefault();
      const next = links[(idx + dir + links.length) % links.length];
      const nextId = next.getAttribute('data-foresight');
      if (nextId) setRovingId(nextId);
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
      window.open('https://www.instagram.com/foces_cec/', '_blank', 'noopener,noreferrer');
    } catch {
      // popup blocked — the visual flip above still shows the click happened
    }
  };

  // Intelligent route chunk prefetching for instant 0ms navigation
  const handlePrefetch = useCallback((id) => {
    if (id === 'events') {
      import('../../EventPage/Eventpage.jsx').catch(() => {});
    } else if (id === 'contact') {
      import('../../../Components/ContactUs/ContactUs.jsx').catch(() => {});
    }
  }, []);

  // Preload route chunks during browser idle time so nav clicks load instantly
  useEffect(() => {
    const idleTimer = setTimeout(() => {
      import('../../EventPage/Eventpage.jsx').catch(() => {});
      import('../../../Components/ContactUs/ContactUs.jsx').catch(() => {});
    }, 1200);
    return () => clearTimeout(idleTimer);
  }, []);

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

  // (Quicklink removed: it prefetched the same index.html shell for /events
  // and /contact — the real route chunks are already prefetched by js.foresight
  // + the onMouseEnter/onTouchStart imports above, so it was redundant work.)

  // On non-home routes (e.g. /events, /contact) no section ever becomes
  // "current", so currentItem stays null. Treat null as dark-theme: the
  // navbar sits on the dark #0b0b0c page background and needs white styling.
  const isDark =
    currentItem === null ||
    ['home', 'featuring', 'events', 'contact', 'execom', 'about'].includes(currentItem);
  const rovingIndex = rovingId ?? currentItem ?? navItems[0].id;

  // One shared links list: inline in the navbar on desktop, full-screen
  // overlay (portal to <body>) on mobile. The overlay owns the close (X)
  // button, so when the menu closes the X goes off screen with it.
  const itemsEl = (
    <div
      id={isMobile ? 'nav-items-mobile' : 'nav-items'}
      className={
        isMobile
          ? `Items nav-overlay z-50 fixed inset-0 flex flex-col items-center [justify-content:safe_center] gap-8 pb-10 overflow-y-auto overscroll-contain backdrop-blur-md ${
              isDark ? 'nav-w bg-[#0b0b0c]/95' : 'nav-b bg-[#F5F5F5]/95'
            }`
          : `Items z-10 flex items-center justify-center gap-[clamp(0.75rem,2vw,2.25rem)] whitespace-nowrap min-[768px]:justify-self-center ${
              isDark ? 'bg-[#101011]' : 'bg-[#F5F5F5]'
            } min-[768px]:bg-transparent`
      }
      role={isMobile ? 'dialog' : undefined}
      aria-modal={isMobile ? 'true' : undefined}
    >
      {isMobile && (
        <button
          type="button"
          id="nav-close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"
          onClick={toggleItems}
          aria-label="Close menu"
        >
          <AiOutlineClose size={24} color={isDark ? '#fff' : '#000'} />
        </button>
      )}
      {navItems.map((item) => (
        <Link
          to={item.id !== 'contact' ? `/#${item.id}` : '/contact'}
          key={item.id}
          data-foresight={item.id}
          aria-current={currentItem === item.id ? 'true' : undefined}
          tabIndex={rovingIndex === item.id ? 0 : -1}
          className={`border-b-2 z-10 tracking-wider ${
            currentItem === item.id
              ? 'border-[#22d3ee] text-[#22d3ee]'
              : isDark
                ? 'border-transparent text-[#ffffff80]'
                : 'border-transparent text-[#000000b3]'
          } `}
          onMouseEnter={() => handlePrefetch(item.id)}
          onTouchStart={() => handlePrefetch(item.id)}
          onPointerDown={() => handlePrefetch(item.id)}
          onFocus={() => handlePrefetch(item.id)}
          onClick={(e) => handleItemClick(item.id, e)}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );

  return (
    <>
      <div
        className={`fixed z-10 left-0 top-0 w-full shadow ${
          isDark ? 'nav-w' : 'nav-b'
        } flex items-center px-5 pt-4 pb-2 font-semibold max-[767px]:pl-4 max-[767px]:py-2 max-[767px]:h-auto max-[767px]:w-screen min-[768px]:grid min-[768px]:grid-cols-[1fr_auto_1fr] ${
          isScrolled || currentItem === 'contact'
            ? 'bg-[#101011e6] border-b border-[#ffffff1a]'
            : 'bg-transparent'
        }`}
      >
        {/* Left: FOCES logo */}
        <div className="min-[768px]:justify-self-start flex items-center">
          <img
            src={isDark ? LogoWhite : LogoGrey}
            alt="FOCES"
            loading="eager"
            decoding="async"
            className={`h-auto w-[clamp(88px,8vw,140px)] flex-none cursor-pointer ${isMobile ? 'hidden' : ''}`}
            onClick={handleLogoClick}
          />
          <img
            src={isDark ? LogoWhite : LogoGrey}
            alt="FOCES"
            loading="eager"
            decoding="async"
            className={`h-auto w-[clamp(56px,19vw,84px)] cursor-pointer ${isMobile ? '' : 'hidden'}`}
            onClick={handleLogoClick}
          />
        </div>

        {/* Center: nav links (desktop only — mobile renders as a full-screen overlay) */}
        {!isMobile && itemsEl}

        {/* Right: Join CTA + mobile hamburger */}
        <div className="min-[768px]:justify-self-end max-[767px]:ml-auto flex items-center gap-2">
          <button
            type="button"
            className={`contact cursor-pointer px-[clamp(1.1em,1.6vw,1.7em)] h-[clamp(2em,2.4vh,2.3em)] text-[clamp(0.7rem,0.85vw,0.88rem)] ${
              joinPressed
                ? 'bg-cyan-400 text-black'
                : isDark
                  ? 'bg-[#F5F5F5] text-[#101011]'
                  : 'bg-black text-[#F5F5F5]'
            } flex justify-center items-center rounded-3xl whitespace-nowrap select-none max-[767px]:w-auto max-[767px]:h-auto max-[767px]:px-4 max-[767px]:py-1.5 max-[767px]:text-[0.7rem] max-[767px]:font-medium max-[767px]:tracking-wide transition-colors duration-200 ${
              showItems && isMobile ? 'hidden' : ''
            }`}
            onClick={handleJoinFocesClick}
          >
            Join FOCES
          </button>

          {isMobile && (
            <button
              type="button"
              id="nav-toggle"
              className={`w-8 h-8 flex items-center justify-center ${showItems ? 'hidden' : ''}`}
              onClick={toggleItems}
              aria-expanded={showItems}
              aria-controls="nav-items-mobile"
              aria-label={showItems ? 'Close menu' : 'Open menu'}
            >
              <img src={isDark ? toggleW : toggleB} alt="" loading="eager" decoding="async" />
            </button>
          )}
        </div>
      </div>
      {isMobile && showItems && createPortal(itemsEl, document.body)}
    </>
  );
}
