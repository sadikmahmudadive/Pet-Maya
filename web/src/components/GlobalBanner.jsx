import React from 'react';
import { useApp } from '../context/AppContext';

export default function GlobalBanner({ customText }) {
  let contextBanner = null;
  try {
    const appContext = useApp();
    if (appContext && appContext.globalBanner) {
      contextBanner = appContext.globalBanner;
    }
  } catch {
    // Graceful fallback if rendered outside AppProvider
  }

  const bannerText = customText || (contextBanner && contextBanner.text) || 
    'WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE WITH EVERY BESPOKE WELLNESS PLAN.';

  return (
    <div
      className="global-top-promotional-banner"
      role="region"
      aria-label="Clinical Protocol Announcement"
      style={{
        width: '100%',
        backgroundColor: '#160F0C',
        borderBottom: '1px solid rgba(0, 0, 0, 0.25)',
        padding: '6px 16px',
        minHeight: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: '10.5px',
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1.25,
        userSelect: 'none',
        zIndex: 9999,
        position: 'relative'
      }}
    >
      <span>{bannerText}</span>
    </div>
  );
}
