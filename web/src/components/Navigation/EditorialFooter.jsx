import React from 'react';
import { ArrowUpRight, ShieldCheck, Heart } from 'lucide-react';

export default function EditorialFooter({ onNavigate }) {
  const handleLinkClick = (path, e) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  return (
    <footer
      style={{
        backgroundColor: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingTop: 'clamp(64px, 8vw, 96px)',
        paddingBottom: '48px',
        color: 'var(--text-main)',
      }}
    >
      <div className="editorial-container">
        {/* Top 5-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '40px 32px',
            marginBottom: '64px',
          }}
        >
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 2', maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <img
                src="/assets/images/tail_wagging_logo.png"
                alt="Pet Maya"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Pet Maya
              </span>
            </div>
            <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Better care for the pets you love. The unified digital healthcare, smart radar, and connected medical passport ecosystem.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Column: Platform */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '18px' }}>
              Platform
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <li><a href="/digital-pet-passport" onClick={(e) => handleLinkClick('/digital-pet-passport', e)} className="editorial-footer-link">Digital Pet Passport</a></li>
              <li><a href="/ai-pet-care" onClick={(e) => handleLinkClick('/ai-pet-care', e)} className="editorial-footer-link">Clinical AI Triage</a></li>
              <li><a href="/pet-gps" onClick={(e) => handleLinkClick('/pet-gps', e)} className="editorial-footer-link">GPS Safety Radar</a></li>
              <li><a href="/connected-care" onClick={(e) => handleLinkClick('/connected-care', e)} className="editorial-footer-link">Connected Care IoT</a></li>
              <li><a href="/features" onClick={(e) => handleLinkClick('/features', e)} className="editorial-footer-link">All Platform Features</a></li>
            </ul>
          </div>

          {/* Column: Solutions */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '18px' }}>
              Solutions
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <li><a href="/for-pet-parents" onClick={(e) => handleLinkClick('/for-pet-parents', e)} className="editorial-footer-link">For Pet Parents</a></li>
              <li><a href="/for-veterinarians" onClick={(e) => handleLinkClick('/for-veterinarians', e)} className="editorial-footer-link">For Veterinarians</a></li>
              <li><a href="/for-clinics" onClick={(e) => handleLinkClick('/for-clinics', e)} className="editorial-footer-link">For Clinics & Hospitals</a></li>
              <li><a href="/connected-care" onClick={(e) => handleLinkClick('/connected-care', e)} className="editorial-footer-link">Smart Collars & Hardware</a></li>
              <li><a href="#shop" onClick={(e) => handleLinkClick('shop', e)} className="editorial-footer-link">Pet Shop & Pharmacy</a></li>
            </ul>
          </div>

          {/* Column: Resources */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '18px' }}>
              Resources
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <li><a href="/pet-health" onClick={(e) => handleLinkClick('/pet-health', e)} className="editorial-footer-link">Pet Health Knowledge Hub</a></li>
              <li><a href="/pet-care" onClick={(e) => handleLinkClick('/pet-care', e)} className="editorial-footer-link">Canine & Feline Nutrition</a></li>
              <li><a href="/blog" onClick={(e) => handleLinkClick('/blog', e)} className="editorial-footer-link">Pet Maya Journal</a></li>
              <li><a href="/faq" onClick={(e) => handleLinkClick('/faq', e)} className="editorial-footer-link">Help & FAQs</a></li>
            </ul>
          </div>

          {/* Column: Company */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '18px' }}>
              Company
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <li><a href="/about" onClick={(e) => handleLinkClick('/about', e)} className="editorial-footer-link">About Pet Maya</a></li>
              <li><a href="/contact" onClick={(e) => handleLinkClick('/contact', e)} className="editorial-footer-link">Contact & Support</a></li>
              <li><a href="/privacy" onClick={(e) => handleLinkClick('/privacy', e)} className="editorial-footer-link">Privacy Policy</a></li>
              <li><a href="/terms" onClick={(e) => handleLinkClick('/terms', e)} className="editorial-footer-link">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Ethics Bar */}
        <div
          style={{
            paddingTop: '32px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © {new Date().getFullYear()} Pet Maya Inc. All rights reserved. Built with love for pets and their humans.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>Security: AES-256 Cloud Vault</span>
            <span>Region: Bangladesh & Global</span>
          </div>
        </div>
      </div>

      <style>{`
        .editorial-footer-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s ease;
        }
        .editorial-footer-link:hover {
          color: var(--foreground);
        }
      `}</style>
    </footer>
  );
}
