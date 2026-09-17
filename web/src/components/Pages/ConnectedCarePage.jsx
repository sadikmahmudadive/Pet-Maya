import React from 'react';
import { 
  Cpu, 
  Radio, 
  Activity, 
  ShieldCheck, 
  ArrowRight, 
  Wifi, 
  Smartphone, 
  HeartHandshake
} from 'lucide-react';

export default function ConnectedCarePage({ onNavigate }) {
  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
      {/* ── HERO ── */}
      <section className="editorial-section editorial-section-border" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="editorial-container">
          <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>
            CONNECTED CARE & IoT
          </span>
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 76px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              maxWidth: '820px',
              margin: '0 auto 20px',
            }}
          >
            Your pet. Your devices. One connected ecosystem.
          </h1>
          <p
            style={{
              fontSize: 'clamp(17px, 2vw, 20px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: '0 auto 36px',
            }}
          >
            Pet Maya bridges smart wearable collar sensors, home Bluetooth beacons, and cloud veterinary records to catch health changes before they become emergencies.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button onClick={() => handleRoute('dashboard')} className="editorial-btn-primary">
              <span>Connect a Device</span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => handleRoute('/features')} className="editorial-btn-secondary">
              <span>View System Architecture</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURAL FLOW ── */}
      <section className="editorial-section editorial-section-border" style={{ backgroundColor: 'var(--soft-surface)' }}>
        <div className="editorial-container">
          <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
            <span className="text-eyebrow" style={{ marginBottom: '12px' }}>DATA CONTINUITY</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.15 }}>From physical collar to clinical diagnosis.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div className="editorial-card">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>01 / SENSE</div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Pet & Smart Collar</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                6-axis accelerometer, GPS module, and temperature sensor continuously monitor resting and active cycles.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>02 / TRANSMIT</div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>LTE-M & Bluetooth Mesh</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Low-power cellular telemetry sends batched vitals to the cloud, switching to local BLE when near home base stations.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>03 / ANALYZE</div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Clinical Machine Learning</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Algorithms detect abnormal scratching patterns, sudden drop in daily activity, or sleep disturbances indicating pain.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>04 / ACT</div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Proactive Care</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Parents receive gentle notifications with recommended veterinary checkups before minor issues escalate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="editorial-section" style={{ textAlign: 'center' }}>
        <div className="editorial-container-narrow">
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, marginBottom: '18px' }}>
            Build your pet’s connected health network.
          </h2>
          <button onClick={() => handleRoute('dashboard')} className="editorial-btn-primary">
            <span>Explore Connected Dashboard</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
