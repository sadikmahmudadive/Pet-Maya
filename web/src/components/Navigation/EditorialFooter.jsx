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
    <footer style={{ width: '100%', backgroundColor: '#F9F5F1', color: '#160F0C', marginTop: 'auto', borderTop: '1px solid rgba(222, 217, 214, 0.6)' }}>
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
                VETERINARY MEDICINE • CLINICAL SCIENCE
              </span>
              <p style={{ fontSize: '13.5px', color: '#675C58', lineHeight: 1.6, margin: '8px 0 0' }}>
                An elevated standard of companion medicine. Bridging evidence-led biotechnology, continuous biometrics diagnostics, and compassionate veterinary counsel.
              </p>
            </div>

            {/* Newsletter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#160F0C', fontWeight: 700 }}>
                The Clinical Gazette
              </span>
              <p style={{ fontSize: '12px', color: '#707973', margin: '0 0 4px 0' }}>
                Monthly monographs on feline and canine longevity therapeutics.
              </p>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px', maxWidth: '380px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter companion guardian email..."
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(222, 217, 214, 0.7)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '12.5px',
                    color: '#160F0C',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="btn-elevate"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '9999px',
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Nav Directory Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '32px', flex: 1 }}>
            {/* Column 1: Clinical Care */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#160F0C', fontWeight: 700 }}>
                CLINICAL CARE
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <a onClick={(e) => handleLinkClick('shop', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Formulary Shop</a>
                <a onClick={(e) => handleLinkClick('ai', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Instant AI Triage</a>
                <a onClick={(e) => handleLinkClick('vets', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Veterinary Faculty</a>
                <a onClick={(e) => handleLinkClick('book-vet', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Telehealth Booking</a>
              </div>
            </div>

            {/* Column 2: Infrastructure */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#160F0C', fontWeight: 700 }}>
                INFRASTRUCTURE
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <a onClick={(e) => handleLinkClick('digital-pet-passport', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Health Vault Records</a>
                <a onClick={(e) => handleLinkClick('shop', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Prescription Sync</a>
                <a onClick={(e) => handleLinkClick('features', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Diagnostic Biomarkers</a>
                <a onClick={(e) => handleLinkClick('for-clinics', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Veterinary Ethics</a>
              </div>
            </div>

            {/* Column 3: Editorial */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#160F0C', fontWeight: 700 }}>
                EDITORIAL
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <a onClick={(e) => handleLinkClick('blog', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">The Companion Journal</a>
                <a onClick={(e) => handleLinkClick('pet-care', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Breed Philosophy</a>
                <a onClick={(e) => handleLinkClick('about', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Care Concierge</a>
                <a onClick={(e) => handleLinkClick('dashboard', e)} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }} className="footer-link">Patient Portal</a>
              </div>
            </div>
          </div>

        </div>

        {/* Legal & Regulatory Bottom Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '28px', fontSize: '12px', color: '#707973' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>© 2026 Pet Maya Group Inc. All clinical rights reserved.</span>
            <span>•</span>
            <a onClick={(e) => handleLinkClick('privacy', e)} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Privacy Policy</a>
            <span>•</span>
            <a onClick={(e) => handleLinkClick('terms', e)} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Terms of Medical Service</a>
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
