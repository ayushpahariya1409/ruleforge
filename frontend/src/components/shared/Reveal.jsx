import React, { useState, useEffect, useRef } from 'react';

const Reveal = ({ children, delay = 0, threshold = 0.05, className = "", onReveal }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Use a small timeout for the stagger effect instead of CSS delay
        // to make it feel more responsive to scroll
        setTimeout(() => {
          setInView(true);
          if (onReveal) onReveal();
        }, delay);
        observer.unobserve(entry.target);
      }
    }, { threshold });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, delay, onReveal]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out transform ${
        inView 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Reveal;
