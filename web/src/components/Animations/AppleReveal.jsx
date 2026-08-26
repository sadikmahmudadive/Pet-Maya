import React from 'react';
import { motion } from 'framer-motion';

export const AppleReveal = ({ 
  children, 
  delay = 0, 
  duration = 0.8,
  yOffset = 30,
  className = '',
  style = {}
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.25, 0.1, 0.25, 1], // Apple-style smooth ease-out curve
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default AppleReveal;
