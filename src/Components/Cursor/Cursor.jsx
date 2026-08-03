import React, { useEffect, useRef } from 'react';

function Cursor() {
  const cursorOutlineRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafId = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      posRef.current.targetX = e.pageX;
      posRef.current.targetY = e.pageY;
    };

    const updateCursor = () => {
      const { x, y, targetX, targetY } = posRef.current;
      const ease = 0.15;
      const nextX = x + (targetX - x) * ease;
      const nextY = y + (targetY - y) * ease;
      posRef.current.x = nextX;
      posRef.current.y = nextY;

      if (cursorOutlineRef.current) {
        cursorOutlineRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }

      rafId.current = requestAnimationFrame(updateCursor);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className='overflow-hidden z-10'>
      <div 
        className='cursor-outline max-[767px]:hidden h-[1px] w-[1px] bg-[#fff] shadow-[0_0_201px_80px_rgba(255,255,255,0.4)] fixed z-10 pointer-events-none rounded-[50%] left-0 top-0 will-change-transform' 
        data-cursor-outline 
        ref={cursorOutlineRef}
      />
    </div>
  );
}

export default Cursor;
