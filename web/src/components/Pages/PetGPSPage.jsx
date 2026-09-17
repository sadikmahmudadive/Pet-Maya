import React from 'react';
import { 
  Radar, 
  MapPin, 
  Volume2, 
  Battery, 
  ShieldCheck, 
  ArrowRight, 
  Radio, 
  AlertTriangle,
  Activity,
  Zap
} from 'lucide-react';

export default function PetGPSPage({ onNavigate }) {
  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
      {/* ── HERO (High-Contrast Editorial) ── */}
      <section
        className="editorial-section editorial-section-border"
        style={{
          backgroundColor: 'var(--dark-hero-bg)',
          color: '#FFFFFF',
          paddingTop: '80px',
          textAlign: 'center',
        }}
      >
        <div className="editorial-container">
          <span className="text-eyebrow" style={{ color: '#10B981', marginBottom: '14px' }}>
            SATELLITE GPS & LIVE RADAR
          </span>
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 76px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              maxWidth: '840px',
              margin: '0 auto 20px',
              color: '#FFFFFF',
            }}
          >
            Know where they are. Know they’re safe.
          </h1>
          <p
            style={{
              fontSize: 'clamp(17px, 2vw, 20px)',
              color: '#94A3B8',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: '0 auto 36px',
            }}
          >
            Sub-meter multi-constellation satellite tracking, safe-zone geofence push alarms, and an 85dB recovery siren in a waterproof, lightweight smart collar.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button onClick={() => handleRoute('tracker')} className="editorial-btn-accent">
              <span>Launch Live GPS Radar</span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => handleRoute('#shop')} className="editorial-btn-secondary" style={{ backgroundColor: 'transparent', color: '#FFF', borderColor: 'rgba(255,255,255,0.2)' }}>
              <span>Order Smart GPS Collar</span>
            </button>
          </div>

          {/* Real GPS Radar Visual */}
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 72px rgba(0, 0, 0, 0.7)',
            }}
          >
            <img
              src="/assets/screens/07_tracker_desktop.png"
              alt="Live GPS Satellite Radar Interface"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.src = '/assets/screens/02_dashboard_desktop.png';
              }}
            />
          </div>
        </div>
      </section>

      {/* ── SPECS & HARDWARE TELEMETRY ── */}
      <section className="editorial-section editorial-section-border">
        <div className="editorial-container">
          <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
            <span className="text-eyebrow" style={{ marginBottom: '12px' }}>HARDWARE SPECIFICATIONS</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.15 }}>Engineered for real-world pet safety.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <MapPin size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Multi-GNSS Positioning</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Simultaneously connects to GPS, GLONASS, and Galileo constellations with proprietary Kalman filtering for sub-2-meter accuracy.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <AlertTriangle size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>3-Second Geofence Alarms</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Draw custom virtual fences around your home, garden, or dog park. Receive high-priority push alarms if boundaries are exited.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Volume2 size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>85dB Acoustic Beacon</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Activate an audible chime remotely from the web or mobile app to locate pets in dense bushes, darkness, or adjacent rooms.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Battery size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Adaptive Battery Management</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Intelligently switches to low-power WiFi / BLE sleep when in safe zones, giving up to 14 days of battery life per charge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="editorial-section" style={{ backgroundColor: 'var(--soft-surface)', textAlign: 'center' }}>
        <div className="editorial-container-narrow">
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, marginBottom: '18px' }}>
            Never worry about losing your pet again.
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Track in real-time right from your browser or mobile phone.
          </p>
          <button onClick={() => handleRoute('tracker')} className="editorial-btn-primary">
            <span>Open Live GPS Radar</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
