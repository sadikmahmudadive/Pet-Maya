import React from 'react';
import { motion } from 'framer-motion';

export const AppleStagger = ({ 
  children,
  staggerDelay = 0.1,
  delayChildren = 0,
  duration = 0.6,
  yOffset = 20,
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
        ease: [0.25, 0.1, 0.25, 1], // Apple-style smooth ease-out curve
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
      style={style}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AppleStagger;
