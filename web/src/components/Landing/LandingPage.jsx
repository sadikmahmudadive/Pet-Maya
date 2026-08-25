import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Radar, 
  Activity, 
  Utensils, 
  Stethoscope, 
  ShoppingBag, 
  Bell, 
  Download, 
  Smartphone, 
  ChevronRight, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Play,
  Heart,
  BookOpen,
  DollarSign,
  MapPin,
  MessageCircle,
  Calendar
} from 'lucide-react';

export default function LandingPage() {
  const { setActiveTab, openModal, showToast } = useApp();
  const { currentUser, loginAsGuest } = useAuth();

  const handleTryDemo = () => {
    loginAsGuest('Pet Owner');
    setActiveTab('dashboard');
    showToast('🚀 Welcome to Pet Maya Demo Dashboard!', 'success');
  };

  const handleFeatureAccess = (tabId, featureName) => {
    if (currentUser) {
      setActiveTab(tabId);
    } else {
      openModal('auth');
      showToast(`🔒 Please sign in to access ${featureName}`, 'info');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '-24px -16px 0', width: 'calc(100% + 32px)' }}>
      
      {/* ══════════════════════════════════════════════════════
          HERO 1: TITANIUM CARE FLAGSHIP (APPLE.COM STYLE)
          ══════════════════════════════════════════════════════ */}
      <section className="apple-hero-section apple-hero-dark" style={{ minHeight: '82vh', justifyContent: 'center' }}>
        <span className="apple-hero-eyebrow" style={{ color: 'var(--primary)' }}>
          Pet Maya 2.0
        </span>
        <h1 className="apple-hero-headline" style={{ color: '#FFFFFF' }}>
          Titanium intelligence.
        </h1>
        <p className="apple-hero-subhead" style={{ color: '#A1A1A6' }}>
          Next-generation pet healthcare, live GPS radar, and clinical AI triage. All in one place.
        </p>

        <div className="apple-cta-group">
          <button className="apple-btn-blue" onClick={() => openModal('auth')}>
            <span>Get Started</span>
          </button>

          <button className="apple-link-cta" onClick={handleTryDemo}>
            <span>Explore Live Demo</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Hero Ecosystem Visual */}
        <div 
          style={{
            maxWidth: '920px',
            width: '100%',
            background: 'rgba(28, 28, 30, 0.7)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '24px 32px',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            textAlign: 'left'
          }}
        >
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            onClick={() => handleFeatureAccess('tracker', 'Tracker')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <Radar size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#FFFFFF', display: 'block' }}>Tracker</strong>
              <span style={{ fontSize: '12px', color: '#86868B' }}>Live GPS location</span>
            </div>
          </div>

          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            onClick={() => handleFeatureAccess('ai', 'Wellness')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <Activity size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#FFFFFF', display: 'block' }}>Wellness</strong>
              <span style={{ fontSize: '12px', color: '#86868B' }}>AI health scan</span>
            </div>
          </div>

          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            onClick={() => handleFeatureAccess('vets', 'Specialists')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <Stethoscope size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#FFFFFF', display: 'block' }}>Specialists</strong>
              <span style={{ fontSize: '12px', color: '#86868B' }}>500+ Verified clinicians</span>
            </div>
          </div>

          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            onClick={() => handleFeatureAccess('food', 'Blog')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(236, 72, 153, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#FFFFFF', display: 'block' }}>Blog</strong>
              <span style={{ fontSize: '12px', color: '#86868B' }}>Expert advice &amp; diet</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HERO 2: REAL-TIME TRACKER
          ══════════════════════════════════════════════════════ */}
      <section className="apple-hero-section apple-hero-light" style={{ minHeight: '65vh', justifyContent: 'center' }}>
        <span className="apple-hero-eyebrow" style={{ color: 'var(--primary)' }}>
          Pet Radar &amp; Smart Collar
        </span>
        <h2 className="apple-hero-headline">
          Wonderfully fast. <br />
          Astoundingly precise.
        </h2>
        <p className="apple-hero-subhead">
          Multi-constellation GPS tracking with geofence breach alarms and collar audio buzzer.
        </p>

        <div className="apple-cta-group">
          <button className="apple-btn-blue" onClick={() => handleFeatureAccess('tracker', 'Tracker')}>
            <span>Launch Tracker</span>
          </button>
          <button className="apple-link-cta" onClick={() => handleFeatureAccess('tracker', 'Tracker Live Telemetry')}>
            <span>See live telemetry</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HERO 3: WELLNESS AI CLINICAL TRIAGE
          ══════════════════════════════════════════════════════ */}
      <section className="apple-hero-section apple-hero-dark" style={{ minHeight: '65vh', justifyContent: 'center' }}>
        <span className="apple-hero-eyebrow" style={{ color: '#3B82F6' }}>
          AI Health Vision
        </span>
        <h2 className="apple-hero-headline" style={{ color: '#FFFFFF' }}>
          Clinical intelligence. <br />
          Right on your camera.
        </h2>
        <p className="apple-hero-subhead" style={{ color: '#A1A1A6' }}>
          Upload photos of skin irritation, eye discharge, or ear discomfort for instant severity analysis and first aid advice.
        </p>

        <div className="apple-cta-group">
          <button className="apple-btn-blue" onClick={() => handleFeatureAccess('ai', 'Wellness Scan')}>
            <span>Test Wellness Scan</span>
          </button>
          <button className="apple-link-cta" onClick={() => handleFeatureAccess('vets', 'Specialists Directory')}>
            <span>Consult a specialist</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          APPLE 2X2 BENTO PROMO MATRIX
          ══════════════════════════════════════════════════════ */}
      <section className="apple-bento-grid">
        {/* Bento 1: Specialists */}
        <div className="apple-promo-card">
          <span className="apple-card-eyebrow" style={{ color: '#F59E0B' }}>Specialist Network</span>
          <h3 className="apple-card-title">Specialists</h3>
          <p className="apple-card-desc">
            In-clinic visits, surgery consultations, and HD teleconsultations with verified doctors.
          </p>
          <button className="apple-link-cta" onClick={() => handleFeatureAccess('vets', 'Specialists')}>
            <span>Explore directory</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Bento 2: Blog */}
        <div className="apple-promo-card">
          <span className="apple-card-eyebrow" style={{ color: '#EC4899' }}>Precision Diet</span>
          <h3 className="apple-card-title">Blog &amp; Nutrition</h3>
          <p className="apple-card-desc">
            Scientific RER/MER calorie calculators, dry/wet portion splits, and breed guides.
          </p>
          <button className="apple-link-cta" onClick={() => handleFeatureAccess('food', 'Blog')}>
            <span>Read guide</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Bento 3: Pet Shop */}
        <div className="apple-promo-card">
          <span className="apple-card-eyebrow" style={{ color: '#6366F1' }}>Pharmacy &amp; Store</span>
          <h3 className="apple-card-title">Pet Shop</h3>
          <p className="apple-card-desc">
            Genuine prescription flea/tick preventatives (Simparica) and specialty food with live order dispatch.
          </p>
          <button className="apple-link-cta" onClick={() => handleFeatureAccess('shop', 'Pet Shop')}>
            <span>Visit Pet Shop</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Bento 4: Reminders */}
        <div className="apple-promo-card">
          <span className="apple-card-eyebrow" style={{ color: '#10B981' }}>Medical Passport</span>
          <h3 className="apple-card-title">Reminders</h3>
          <p className="apple-card-desc">
            Automated immunization schedules, rabies tracking, and 1-click export to Apple Calendar (.ICS).
          </p>
          <button className="apple-link-cta" onClick={() => handleFeatureAccess('vaccines', 'Reminders')}>
            <span>View Reminders</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          APPLE MOBILE DOWNLOADS & SIDELOADING SECTION
          ══════════════════════════════════════════════════════ */}
      <section id="mobile-downloads" style={{ maxWidth: '1240px', margin: '30px auto', padding: '0 16px', width: '100%', scrollMarginTop: '80px' }}>
        <div 
          className="apple-promo-card" 
          style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--surface-solid)' }}
        >
          <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Apple &amp; Android Ecosystem</span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '14px' }}>
            Connected seamlessly.
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 36px', lineHeight: 1.5 }}>
            Enjoy full Bluetooth collar telemetry, background boundary alarms, push notifications, and camera triage on your phone.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', width: '100%', maxWidth: '980px' }}>
            {/* iOS Column */}
            <div style={{ background: 'var(--surface-alt)', padding: '28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={22} color="#0071E3" />
                <strong style={{ fontSize: '17px', fontWeight: 600 }}>iPhone &amp; iPad</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Install directly via Wireless OTA Manifest or download the <strong>.ipa</strong> package for AltStore, Sideloadly, TrollStore or Scarlet.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a 
                  href="itms-services://?action=download-manifest&url=https://www.petmaya.app/manifest.plist" 
                  className="apple-btn-blue" 
                  style={{ justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Download size={15} />
                  <span>1-Click Install on iPhone</span>
                </a>
                <a 
                  href="https://github.com/sadikmahmudadive/Pet-Maya/releases" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '13px' }}
                >
                  <span>Download .IPA Package</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Android Column */}
            <div style={{ background: 'var(--surface-alt)', padding: '28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={22} color="#10B981" />
                <strong style={{ fontSize: '17px', fontWeight: 600 }}>Android</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Get the official application on Google Play Store or download the universal Android APK release binary.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.vertexhand.petmaya" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="apple-btn-blue" 
                  style={{ background: '#10B981', justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Download size={15} />
                  <span>Get on Google Play</span>
                </a>
                <a 
                  href="https://github.com/sadikmahmudadive/Pet-Maya/releases" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '13px', color: '#10B981' }}
                >
                  <span>Download APK Binary</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* QR Scan Column */}
            <div style={{ background: 'var(--surface-alt)', padding: '28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https%3A%2F%2Fwww.petmaya.app%2F" 
                alt="Scan with Camera" 
                style={{ width: 120, height: 120, borderRadius: '8px', border: '1px solid var(--border)', background: '#FFFFFF', padding: '4px' }} 
              />
              <strong style={{ fontSize: '15px' }}>Scan with Phone Camera</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Instantly opens Pet Maya web app or downloads mobile application on your device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          APPLE.COM GLOBAL DIRECTORY FOOTER
          ══════════════════════════════════════════════════════ */}
      <footer className="apple-footer-wrap">
        <div className="apple-footer-inner">
          <div className="apple-footer-grid">
            <div className="apple-footer-col">
              <h5>Explore Services</h5>
              <ul>
                <li><button onClick={() => handleFeatureAccess('shop', 'Pet Shop')}>Pet Shop</button></li>
                <li><button onClick={() => handleFeatureAccess('tracker', 'Tracker')}>Tracker</button></li>
                <li><button onClick={() => handleFeatureAccess('ai', 'Wellness')}>Wellness</button></li>
                <li><button onClick={() => handleFeatureAccess('vets', 'Specialists')}>Specialists</button></li>
                <li><button onClick={() => handleFeatureAccess('community', 'Community')}>Community</button></li>
                <li><button onClick={() => handleFeatureAccess('food', 'Blog')}>Blog</button></li>
                <li><button onClick={() => handleFeatureAccess('vaccines', 'Reminders')}>Reminders</button></li>
              </ul>
            </div>

            <div className="apple-footer-col">
              <h5>Account &amp; Pet EHR</h5>
              <ul>
                <li><button onClick={() => openModal('auth')}>Sign In to Account</button></li>
                <li><button onClick={handleTryDemo}>Guest Demo Console</button></li>
                <li><button onClick={() => handleFeatureAccess('vaccines', 'Reminders')}>Reminders</button></li>
                <li><button onClick={() => handleFeatureAccess('shop', 'Pet Shop')}>Pet Shop</button></li>
              </ul>
            </div>

            <div className="apple-footer-col">
              <h5>For Veterinarians</h5>
              <ul>
                <li><button onClick={() => handleFeatureAccess('vets', 'Clinician Network')}>Clinician Verification</button></li>
                <li><button onClick={() => openModal('booking')}>Telehealth Guidelines</button></li>
              </ul>
            </div>

            <div className="apple-footer-col">
              <h5>Pet Maya Values</h5>
              <ul>
                <li><a href="/privacy_policy.html" target="_blank">Privacy First</a></li>
                <li><a href="/terms_of_service.html" target="_blank">Terms of Service</a></li>
                <li><a href="/about.html" target="_blank">About Pet Maya</a></li>
                <li><a href="https://github.com/sadikmahmudadive/Pet-Maya" target="_blank" rel="noreferrer">Open Source GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="apple-footer-legal">
            <div>
              Copyright © 2026 Pet Maya Inc. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="/privacy_policy.html" target="_blank">Privacy Policy</a>
              <span>|</span>
              <a href="/terms_of_service.html" target="_blank">Terms of Use</a>
              <span>|</span>
              <a href="/about.html" target="_blank">Legal</a>
              <span>|</span>
              <a href="/sitemap.xml" target="_blank">Site Map</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
