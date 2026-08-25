import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  Radar, 
  Activity, 
  Utensils, 
  Stethoscope, 
  ShoppingBag, 
  Bell, 
  ShieldCheck, 
  Download, 
  Smartphone, 
  QrCode, 
  ArrowRight, 
  Heart, 
  Star, 
  CheckCircle2, 
  Video, 
  ExternalLink,
  ChevronRight,
  Radio,
  Zap,
  Lock,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  const { setActiveTab, openModal, showToast } = useApp();
  const { loginAsGuest } = useAuth();

  const handleLaunchApp = () => {
    setActiveTab('dashboard');
  };

  const handleTryDemo = () => {
    loginAsGuest('Pet Owner');
    setActiveTab('dashboard');
    showToast('🚀 Logged in as Demo Pet Parent! Explore all features.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '88px', paddingBottom: '40px' }}>
      {/* ══════════════════════════════════════════════════════
          APPLE HERO SECTION
          ══════════════════════════════════════════════════════ */}
      <section style={{ textAlign: 'center', maxWidth: '980px', margin: '24px auto 0', padding: '0 16px', position: 'relative' }}>
        {/* Ambient Apple Radial Light */}
        <div 
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 75%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: -1
          }} 
        />

        {/* Main Headline */}
        <h1 style={{ fontSize: 'clamp(36px, 5.8vw, 64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: '20px' }}>
          Next-Gen Pet Healthcare, <br />
          <span style={{ background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Live GPS Radar &amp; AI Vision.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 'clamp(17px, 2vw, 20px)', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto 36px', lineHeight: 1.5, letterSpacing: '-0.015em' }}>
          Everything you need for your furry family in one seamless ecosystem: Real-time GPS sonar tracking, AI clinical health triage, verified vet teleconsultations, and scientific nutrition.
        </p>

        {/* Call To Actions */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <button 
            className="btn-primary" 
            style={{ padding: '14px 34px', fontSize: '15.5px' }}
            onClick={() => openModal('auth')}
          >
            <span>Get Started Free</span>
            <ArrowRight size={17} />
          </button>

          <button 
            className="btn-ghost" 
            style={{ padding: '14px 28px', fontSize: '15px' }}
            onClick={handleTryDemo}
          >
            <Sparkles size={16} color="#10B981" />
            <span>Explore Live Demo</span>
          </button>

          <a 
            href="#mobile-downloads" 
            className="btn-ghost" 
            style={{ padding: '14px 28px', fontSize: '15px', textDecoration: 'none' }}
          >
            <Smartphone size={16} />
            <span>Download Mobile App</span>
          </a>
        </div>

        {/* Apple Glass Interactive Widget Showcase */}
        <div 
          className="glass-card" 
          style={{
            padding: '28px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--border-specular), var(--shadow-lg)',
            borderRadius: 'var(--radius-xl)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', textAlign: 'left' }}>
            <div 
              style={{ background: 'var(--surface-alt)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s var(--apple-spring)' }}
              onClick={() => setActiveTab('tracker')}
            >
              <Radar size={24} color="#10B981" style={{ marginBottom: '10px' }} />
              <strong style={{ fontSize: '15px', fontWeight: 700, display: 'block' }}>Live Sonar Radar</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Real-time GPS boundary alerts &amp; audio collar buzzer</span>
            </div>

            <div 
              style={{ background: 'var(--surface-alt)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s var(--apple-spring)' }}
              onClick={() => setActiveTab('ai')}
            >
              <Activity size={24} color="#3B82F6" style={{ marginBottom: '10px' }} />
              <strong style={{ fontSize: '15px', fontWeight: 700, display: 'block' }}>AI Health Triage</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Computer vision scanning for lesions, eyes &amp; ears</span>
            </div>

            <div 
              style={{ background: 'var(--surface-alt)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s var(--apple-spring)' }}
              onClick={() => setActiveTab('vets')}
            >
              <Stethoscope size={24} color="#F59E0B" style={{ marginBottom: '10px' }} />
              <strong style={{ fontSize: '15px', fontWeight: 700, display: 'block' }}>Verified Specialists</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>In-clinic appointments &amp; HD video teleconsultations</span>
            </div>

            <div 
              style={{ background: 'var(--surface-alt)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s var(--apple-spring)' }}
              onClick={() => setActiveTab('food')}
            >
              <Utensils size={24} color="#EC4899" style={{ marginBottom: '10px' }} />
              <strong style={{ fontSize: '15px', fontWeight: 700, display: 'block' }}>Precision Nutrition</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Scientific RER/MER daily calorie &amp; breed trait guide</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          APPLE ECOSYSTEM STATS
          ══════════════════════════════════════════════════════ */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '26px' }}>
          <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary)', display: 'block', letterSpacing: '-0.03em' }}>10k+</span>
          <strong style={{ fontSize: '14.5px', fontWeight: 700 }}>Pets Protected</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Active GPS &amp; clinical monitoring</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '26px' }}>
          <span style={{ fontSize: '36px', fontWeight: 800, color: '#3B82F6', display: 'block', letterSpacing: '-0.03em' }}>99.8%</span>
          <strong style={{ fontSize: '14.5px', fontWeight: 700 }}>GPS Precision</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Multi-constellation satellite lock</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '26px' }}>
          <span style={{ fontSize: '36px', fontWeight: 800, color: '#F59E0B', display: 'block', letterSpacing: '-0.03em' }}>500+</span>
          <strong style={{ fontSize: '14.5px', fontWeight: 700 }}>Verified Clinicians</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Surgeons, dermatologists &amp; spas</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '26px' }}>
          <span style={{ fontSize: '36px', fontWeight: 800, color: '#EC4899', display: 'block', letterSpacing: '-0.03em' }}>24/7</span>
          <strong style={{ fontSize: '14.5px', fontWeight: 700 }}>Emergency Triage</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Instant video triage &amp; AI scanner</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURE HIGHLIGHTS BENTO
          ══════════════════════════════════════════════════════ */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="label-mini" style={{ color: 'var(--primary)' }}>Integrated Features</span>
          <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.03em' }}>Engineered for Ultimate Pet Wellness</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          {/* Bento 1 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radar size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Live Sonar Radar &amp; Geofence</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Dynamic safe-zone boundary perimeters (100m - 1km). Receive instant push alerts if your pet leaves home, activate the audio collar buzzer, and track telemetry in real time.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setActiveTab('tracker')}>
              <span>Try Live Radar</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Bento 2 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.14)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>AI Vision Health Diagnostic Scanner</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Upload photos of skin irritation, eye cloudiness, or ear discomfort. Our neural diagnostic model provides instant severity ratings, first aid instructions, and clinic booking.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setActiveTab('ai')}>
              <span>Test AI Scanner</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Bento 3 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Verified Care Specialists &amp; Tele-Health</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Connect with top veterinary surgeons, dermatologists, groomers, and boarding resorts. Schedule in-clinic appointments or join HD video consultations with digital Rx prescriptions.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setActiveTab('vets')}>
              <span>Explore Specialists</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Bento 4 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(236, 72, 153, 0.14)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Scientific Daily Nutrition &amp; Breed Guide</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Calculate resting (RER) and maintenance (MER) energy requirements. Get exact dry kibble, wet food, and water targets, plus trait meters for over 20+ breeds.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setActiveTab('food')}>
              <span>Calculate Portions</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Bento 5 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.14)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Pet Pharmacy &amp; 5-Stage Order Tracking</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Order genuine prescription medications (Simparica), specialty diets, and smart collars with fast home delivery and live step-by-step dispatch tracking.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setActiveTab('shop')}>
              <span>Visit Shop</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Bento 6 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.14)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Digital Passport &amp; Vaccine Calendar</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Never miss a booster or deworming date. Full DHPP, Rabies, and parasite prevention matrix with 1-click export to Apple &amp; Google Calendars (.ICS).
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setActiveTab('vaccines')}>
              <span>View Vaccine Matrix</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MOBILE APP DOWNLOADS (ANDROID & IOS DIRECT INSTALL)
          ══════════════════════════════════════════════════════ */}
      <section id="mobile-downloads" style={{ scrollMarginTop: '100px' }}>
        <div 
          className="glass-card" 
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--border-specular), var(--shadow-lg)',
            padding: '44px 34px',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
            <div className="badge badge-green" style={{ marginBottom: '12px' }}>Apple &amp; Android Ecosystem</div>
            <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Install Pet Maya on Your Devices
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Access full Bluetooth collar telemetry, live GPS background alarms, push notifications, and camera scanners directly on your phone.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Android Column */}
            <div style={{ background: 'var(--surface-alt)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.14)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <strong style={{ fontSize: '17px', fontWeight: 700, display: 'block' }}>Android Application</strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Google Play Store &amp; Direct APK</span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Install directly from Google Play or download the universal Android APK release binary for all devices running Android 8.0+.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.vertexhand.petmaya" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary" 
                  style={{ textDecoration: 'none', justifyContent: 'center', padding: '12px' }}
                >
                  <Download size={16} />
                  <span>Get on Google Play</span>
                </a>

                <a 
                  href="https://github.com/sadikmahmudadive/Pet-Maya/releases" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-ghost" 
                  style={{ textDecoration: 'none', justifyContent: 'center', padding: '10px' }}
                >
                  <ExternalLink size={15} />
                  <span>Download Universal APK (.apk)</span>
                </a>
              </div>
            </div>

            {/* iOS Column (Direct Install / GitHub / Sideloading) */}
            <div style={{ background: 'var(--surface-alt)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.14)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <strong style={{ fontSize: '17px', fontWeight: 700, display: 'block' }}>iOS iPhone Installation</strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>OTA Direct Install &amp; .IPA Package</span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Install on iPhone via Wireless OTA Manifest or download the <strong style={{ color: 'var(--text-main)' }}>.ipa</strong> package for AltStore, Sideloadly, TrollStore or Scarlet.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                <a 
                  href="itms-services://?action=download-manifest&url=https://www.petmaya.app/manifest.plist" 
                  className="btn-primary" 
                  style={{ background: 'var(--text-main)', color: 'var(--bg)', textDecoration: 'none', justifyContent: 'center', padding: '12px' }}
                >
                  <Download size={16} />
                  <span>Install on iPhone (OTA)</span>
                </a>

                <a 
                  href="https://github.com/sadikmahmudadive/Pet-Maya/releases" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-ghost" 
                  style={{ textDecoration: 'none', justifyContent: 'center', padding: '10px' }}
                >
                  <ExternalLink size={15} />
                  <span>Download .IPA Package (GitHub)</span>
                </a>
              </div>

              {/* iOS Trust Note */}
              <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4, border: '1px solid var(--border)' }}>
                💡 <strong>First time opening on iOS?</strong> Go to <em>Settings &gt; General &gt; VPN &amp; Device Management</em> and tap <strong>Trust "Pet Maya"</strong>.
              </div>
            </div>

            {/* QR Code Column */}
            <div style={{ background: 'var(--surface-alt)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https%3A%2F%2Fwww.petmaya.app%2F" 
                alt="Scan to open Pet Maya on Mobile" 
                style={{ width: 140, height: 140, borderRadius: 'var(--radius-sm)', border: '2px solid var(--border)', padding: '4px', background: '#fff' }} 
              />
              <strong style={{ fontSize: '15px', fontWeight: 700 }}>Scan with iPhone / Android</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Point your phone camera at the QR code to open the web application or install instantly on your phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECURITY & PRIVACY PROMISE
          ══════════════════════════════════════════════════════ */}
      <section style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={26} />
          </div>
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Your Pet’s Privacy &amp; Data Security First</h2>
        <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          GPS coordinates, clinical health records, and owner contact details are strictly encrypted with TLS/AES-256 cloud infrastructure. We will never sell your telemetry or clinical records.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <a href="/privacy_policy.html" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
          <span>•</span>
          <a href="/terms_of_service.html" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
          <span>•</span>
          <a href="https://github.com/sadikmahmudadive/Pet-Maya" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>GitHub Repository</a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <span>© 2026 Pet Maya Ecosystem. All rights reserved.</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-ghost" style={{ fontSize: '12.5px', padding: '6px 14px' }} onClick={handleTryDemo}>
            <span>Try Demo Mode</span>
          </button>
          <button className="btn-primary" style={{ fontSize: '12.5px', padding: '6px 16px' }} onClick={() => openModal('auth')}>
            <span>Sign In</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
