import React from 'react';
import { motion } from 'framer-motion';

export const AppleReveal = ({ 
  children, 
  delay = 0, 
  duration = 0.35, 
  yOffset = 14,
  className = '',
  style = {}
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.2, 0, 0, 1], // Ultra-responsive Apple ease curve
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default AppleReveal;
