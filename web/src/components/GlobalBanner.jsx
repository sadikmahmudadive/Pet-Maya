import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function GlobalBanner() {
  const { globalBanner } = useApp();

  if (!globalBanner || !globalBanner.isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="global-promo-banner-wrapper"
      style={{
        width: '100%',
        position: 'sticky',
        top: '48px',
        zIndex: 9998,
        backgroundColor: globalBanner.bgColor || '#f5f5f7',
        color: globalBanner.textColor || '#1d1d1f',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      <div
        className="global-promo-banner"
        style={{
          padding: '6px 14px',
          minHeight: '26px',
          textAlign: 'center',
          fontSize: '11.5px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '5px',
          maxWidth: '1200px',
          margin: '0 auto',
          lineHeight: 1.25
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
              gap: '1px',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            <span>{globalBanner.linkText}</span>
            <ChevronRight size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
}
