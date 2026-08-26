import React from 'react';
import { useApp } from '../context/AppContext';
import { AppleReveal } from './Animations/AppleReveal';
import { ChevronRight } from 'lucide-react';

export default function GlobalBanner() {
  const { globalBanner } = useApp();

  if (!globalBanner || !globalBanner.isActive) return null;

  return (
    <AppleReveal duration={0.6} yOffset={0}>
      <div 
        className="global-promo-banner" 
        style={{ 
          backgroundColor: globalBanner.bgColor || '#f5f5f7',
          color: globalBanner.textColor || '#1d1d1f',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '12.5px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <span style={{ fontWeight: 500 }}>{globalBanner.text}</span>
        
        {globalBanner.linkText && globalBanner.linkUrl && (
          <a 
            href={globalBanner.linkUrl} 
            style={{ 
              color: '#06c', 
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            {globalBanner.linkText}
            <ChevronRight size={14} />
          </a>
        )}
      </div>
    </AppleReveal>
  );
}
