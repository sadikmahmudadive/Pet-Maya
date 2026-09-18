import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function EditorialFooter({ onNavigate }) {
  const { showToast } = useApp ? useApp() : { showToast: () => {} };
  const [email, setEmail] = useState('');

  const handleLinkClick = (path, e) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      if (showToast) showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (showToast) showToast('Subscribed to The Clinical Gazette!', 'success');
    setEmail('');
  };

  return (
    <footer style={{ width: '100%', backgroundColor: '#EFEFEA', color: '#160F0C', marginTop: 'auto', borderTop: '1px solid rgba(222, 217, 214, 0.6)' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '56px 24px 36px' }}>
        
        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', paddingBottom: '48px', borderBottom: '1px solid rgba(222, 217, 214, 0.5)' }}>
          
          {/* Brand & Newsletter Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#160F0C' }}>
                PET MAYA
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.18em', color: '#45848D', textTransform: 'uppercase' }}>
                VETERINARY MEDICINE &amp; CLINICAL TRIAGE
              </span>
              <p style={{ fontSize: '14px', color: '#675C58', lineHeight: 1.6, margin: '8px 0 0' }}>
                Elevated veterinary intelligence, preventive biological care, and clinical empathy designed for the modern companion life.
              </p>
            </div>

            {/* Newsletter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#675C58', fontWeight: 600 }}>
                The Clinical Gazette
              </span>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px', maxWidth: '380px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(222, 217, 214, 0.7)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    color: '#160F0C',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="btn-elevate"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Nav Directory Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '32px', flex: 1 }}>
            {/* Column 1: Clinical Care */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#160F0C', fontWeight: 600 }}>
                Clinical Care
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <a onClick={(e) => handleLinkClick('shop', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Care Shop</a>
                <a onClick={(e) => handleLinkClick('ai', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">AI Triage</a>
                <a onClick={(e) => handleLinkClick('vets', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Board Specialists</a>
                <a onClick={(e) => handleLinkClick('profile', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Health Vault</a>
                <a onClick={(e) => handleLinkClick('tracker', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">GPS Safety Radar</a>
              </div>
            </div>

            {/* Column 2: Infrastructure */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#160F0C', fontWeight: 600 }}>
                Infrastructure
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <a onClick={(e) => handleLinkClick('features', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Cold-Chain (2°C–8°C)</a>
                <a onClick={(e) => handleLinkClick('digital-pet-passport', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">ISO Microchip Vault</a>
                <a onClick={(e) => handleLinkClick('connected-care', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Telemetry API</a>
                <a onClick={(e) => handleLinkClick('for-clinics', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Clinical Security</a>
              </div>
            </div>

            {/* Column 3: Editorial */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#160F0C', fontWeight: 600 }}>
                Editorial
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <a onClick={(e) => handleLinkClick('blog', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Companion Journal</a>
                <a onClick={(e) => handleLinkClick('pet-care', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Clinical Nutrition</a>
                <a onClick={(e) => handleLinkClick('pet-health', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Biosecurity Guidelines</a>
                <a onClick={(e) => handleLinkClick('about', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">About Pet Maya</a>
              </div>
            </div>
          </div>

        </div>

        {/* Legal & Regulatory Bottom Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '28px', fontSize: '12px', color: '#675C58' }}>
          <div>
            Pet Maya Veterinary Group © {new Date().getFullYear()}. Licensed under the Department of Livestock Services (DLS) &amp; Bangladesh Veterinary Council (BVC).
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a onClick={(e) => handleLinkClick('privacy', e)} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Privacy Policy</a>
            <a onClick={(e) => handleLinkClick('terms', e)} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Terms of Service</a>
            <a onClick={(e) => handleLinkClick('faq', e)} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Clinical FAQ</a>
          </div>
        </div>

      </div>

      <style>{`
        .footer-link:hover {
          color: #160F0C !important;
          text-decoration: underline;
        }
      `}</style>
    </footer>
  );
}
