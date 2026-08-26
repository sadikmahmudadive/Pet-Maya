import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import menuAnimation from '../../../../assets/lottie/menu.json';

export default function LottieMenuIcon({ isOpen = false, size = 26, isDark = false }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: menuAnimation,
      });

      // Set initial state
      if (isOpen) {
        animRef.current.goToAndStop(30, true);
      } else {
        animRef.current.goToAndStop(0, true);
      }
    } catch (err) {
      console.warn('[LottieMenuIcon] Init error:', err);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, []);

  // Animate on isOpen change
  useEffect(() => {
    if (!animRef.current) return;
    if (isOpen) {
      animRef.current.setDirection(1);
      animRef.current.play();
    } else {
      animRef.current.setDirection(-1);
      animRef.current.play();
    }
  }, [isOpen]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        filter: isDark ? 'invert(1)' : 'none',
        transition: 'filter 0.3s ease'
      }} 
    />
  );
}
