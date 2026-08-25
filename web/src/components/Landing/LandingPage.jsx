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
  Cpu,
  Layers,
  MapPin,
  Lock
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '40px' }}>
      {/* ══════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════ */}
      <section style={{ textAlign: 'center', maxWidth: '960px', margin: '20px auto 0', padding: '0 12px' }}>

        {/* Main Headline */}
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: '20px' }}>
          Next-Gen Pet Healthcare, <br />
          <span style={{ background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Live GPS Radar &amp; AI Vision.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Everything you need for your furry family in one place: Real-time GPS sonar tracking, AI clinical health triage, verified vet teleconsultations, and scientific nutrition.
        </p>

        {/* Call To Actions */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
          <button 
            className="btn-primary" 
            style={{ padding: '14px 32px', fontSize: '16px', borderRadius: 'var(--radius-full)' }}
            onClick={() => openModal('auth')}
          >
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </button>

          <button 
            className="btn-ghost" 
            style={{ padding: '14px 28px', fontSize: '15px' }}
            onClick={handleTryDemo}
          >
            <Sparkles size={16} color="#10B981" />
            <span>Explore Live Demo (No Sign-in)</span>
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

        {/* App Showcase Hero Card */}
        <div 
          className="glass-card" 
          style={{
            padding: '24px',
            background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-alt) 100%)',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', textAlign: 'left' }}>
            <div style={{ background: 'var(--surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Radar size={24} color="#10B981" style={{ marginBottom: '8px' }} />
              <strong style={{ fontSize: '15px', display: 'block' }}>Live Sonar Radar</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time GPS boundary alerts &amp; collar sound buzzer</span>
            </div>

            <div style={{ background: 'var(--surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Activity size={24} color="#3B82F6" style={{ marginBottom: '8px' }} />
              <strong style={{ fontSize: '15px', display: 'block' }}>AI Health Triage</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Computer vision scanning for lesions, eyes &amp; ears</span>
            </div>

            <div style={{ background: 'var(--surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Stethoscope size={24} color="#F59E0B" style={{ marginBottom: '8px' }} />
              <strong style={{ fontSize: '15px', display: 'block' }}>Verified Specialists</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In-clinic appointments &amp; HD video teleconsultations</span>
            </div>

            <div style={{ background: 'var(--surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Utensils size={24} color="#EC4899" style={{ marginBottom: '8px' }} />
              <strong style={{ fontSize: '15px', display: 'block' }}>Precision Nutrition</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scientific RER/MER daily calorie &amp; breed trait guide</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS SECTION
          ══════════════════════════════════════════════════════ */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '24px' }}>
          <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', display: 'block' }}>10,000+</span>
          <strong style={{ fontSize: '14px' }}>Pets Protected</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Active GPS &amp; medical monitoring</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '24px' }}>
          <span style={{ fontSize: '32px', fontWeight: 900, color: '#3B82F6', display: 'block' }}>99.8%</span>
          <strong style={{ fontSize: '14px' }}>GPS Precision</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Multi-constellation satellite lock</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '24px' }}>
          <span style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B', display: 'block' }}>500+</span>
          <strong style={{ fontSize: '14px' }}>Verified Clinicians</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Surgeons, dermatologists &amp; spas</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '24px' }}>
          <span style={{ fontSize: '32px', fontWeight: 900, color: '#EC4899', display: 'block' }}>24/7</span>
          <strong style={{ fontSize: '14px' }}>Emergency Triage</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Instant video triage &amp; AI scanner</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURE HIGHLIGHTS BENTO
          ══════════════════════════════════════════════════════ */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="label-mini" style={{ color: 'var(--primary)', letterSpacing: '0.08em' }}>Core Capabilities</span>
          <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.8px' }}>Designed for Complete Peace of Mind</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Feature 1 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radar size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Real-Time Sonar Radar &amp; Geofence</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Dynamic safe-zone boundary perimeters (100m - 1km). Receive instant push alerts if your pet leaves home, activate the audio collar buzzer, and track telemetry in real time.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => { setActiveTab('tracker'); }}>
              <span>Try Live Radar</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 2 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>AI Vision Health Diagnostic Scanner</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Upload photos of skin irritation, eye cloudiness, or ear discomfort. Our neural diagnostic model provides instant severity ratings, first aid instructions, and clinic booking.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => { setActiveTab('ai'); }}>
              <span>Test AI Scanner</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 3 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Verified Care Specialists &amp; Tele-Health</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Connect with top veterinary surgeons, dermatologists, groomers, and boarding resorts. Schedule in-clinic appointments or join HD video consultations with digital Rx prescriptions.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => { setActiveTab('vets'); }}>
              <span>Explore Specialists</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 4 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#FCE7F3', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Scientific Daily Nutrition &amp; Breed Guide</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Calculate resting (RER) and maintenance (MER) energy requirements. Get exact dry kibble, wet food, and water targets, plus trait meters for over 20+ breeds.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => { setActiveTab('food'); }}>
              <span>Calculate Portions</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 5 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Pet Pharmacy &amp; 5-Stage Order Tracking</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Order genuine prescription medications (Simparica), specialty diets, and smart collars with fast home delivery and live step-by-step dispatch tracking.
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => { setActiveTab('shop'); }}>
              <span>Visit Shop</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 6 */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Digital Passport &amp; Vaccine Calendar</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Never miss a booster or deworming date. Full DHPP, Rabies, and parasite prevention matrix with 1-click export to Apple &amp; Google Calendars (.ICS).
            </p>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => { setActiveTab('vaccines'); }}>
              <span>View Vaccine Matrix</span>
              <ArrowRight size={14} />
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
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%)',
            border: '1.5px solid var(--primary)',
            padding: '40px 32px',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
            <div className="badge badge-green" style={{ marginBottom: '12px' }}>Mobile Ecosystem</div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.8px' }}>
              Download Pet Maya on Android &amp; iOS
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Access full Bluetooth collar telemetry, live GPS background alarms, push notifications, and camera scanners directly on your phone.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Android Column */}
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <strong style={{ fontSize: '17px', display: 'block' }}>Android Application</strong>
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
                  <span>Download Direct APK (.apk)</span>
                </a>
              </div>
            </div>

            {/* iOS Column (Direct Install / GitHub / Sideloading) */}
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <strong style={{ fontSize: '17px', display: 'block' }}>iOS iPhone Installation</strong>
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
                  style={{ background: '#0F172A', color: '#fff', textDecoration: 'none', justifyContent: 'center', padding: '12px' }}
                >
                  <Download size={16} />
                  <span>1-Click Install on iPhone (OTA)</span>
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
              <div style={{ background: 'var(--surface-alt)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                💡 <strong>First time opening on iOS?</strong> Go to <em>iPhone Settings &gt; General &gt; VPN &amp; Device Management</em> and tap <strong>Trust "Pet Maya"</strong>.
              </div>
            </div>

            {/* QR Code Column */}
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https%3A%2F%2Fwww.petmaya.app%2F" 
                alt="Scan to open Pet Maya on Mobile" 
                style={{ width: 140, height: 140, borderRadius: 'var(--radius-sm)', border: '2px solid var(--border)', padding: '4px', background: '#fff' }} 
              />
              <strong style={{ fontSize: '15px' }}>Scan with Phone Camera</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Point your iPhone or Android camera at the QR code to open the web application or install instantly on your phone.
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
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} />
          </div>
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '10px' }}>Your Pet’s Privacy &amp; Data Security First</h2>
        <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          GPS coordinates, clinical health records, and owner contact details are strictly encrypted with TLS/AES-256 cloud infrastructure. We will never sell your telemetry or clinical records.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <a href="/privacy_policy.html" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Privacy Policy</a>
          <span>•</span>
          <a href="/terms_of_service.html" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Terms of Service</a>
          <span>•</span>
          <a href="https://github.com/sadikmahmudadive/Pet-Maya" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>GitHub Repository</a>
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

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
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
