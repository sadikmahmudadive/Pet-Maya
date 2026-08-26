import React from 'react';
import { motion } from 'framer-motion';

export const AppleStagger = ({ 
  children, 
  staggerDelay = 0.04, 
  delayChildren = 0,
  duration = 0.35, 
  yOffset = 12,
  className = '',
  style = {}
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delayChildren,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: duration,
        ease: [0.2, 0, 0, 1],
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
      style={style}
    >
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div variants={itemVariants}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default AppleStagger;
