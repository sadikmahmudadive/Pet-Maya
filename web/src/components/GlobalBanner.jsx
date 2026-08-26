import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function GlobalBanner() {
  const { globalBanner } = useApp();

  if (!globalBanner || !globalBanner.isActive) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="global-promo-banner-wrapper"
      style={{
        width: '100%',
        position: 'relative',
        zIndex: 9999,
        backgroundColor: globalBanner.bgColor || '#f5f5f7',
        color: globalBanner.textColor || '#1d1d1f',
        borderBottom: '1px solid rgba(0,0,0,0.08)'
      }}
    >
      <div 
        className="global-promo-banner" 
        style={{ 
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: '12.5px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          maxWidth: '1200px',
          margin: '0 auto',
          lineHeight: 1.4
        }}
      >
        <span style={{ fontWeight: 500 }}>{globalBanner.text}</span>
        
        {globalBanner.linkText && (
          <a 
            href={globalBanner.linkUrl || '#'} 
            style={{ 
              color: '#0066cc', 
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            <span>{globalBanner.linkText}</span>
            <ChevronRight size={13} />
          </a>
        )}
      </div>
    </motion.div>
  );
}
