import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import uploadAnimation from '../../../../assets/lottie/upload_icon.json';
import { UploadCloud } from 'lucide-react';

export default function LottieUploadIcon({ size = 54, loop = true, style = {} }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let anim;
    try {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: loop,
        autoplay: true,
        animationData: uploadAnimation,
      });
    } catch (err) {
      console.warn('[LottieUploadIcon] Animation error:', err);
    }

    return () => {
      if (anim) {
        anim.destroy();
      }
    };
  }, [loop]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        ...style 
      }} 
    />
  );
}
