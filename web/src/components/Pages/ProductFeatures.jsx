import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Radar, 
  Cpu, 
  Stethoscope, 
  ShoppingBag, 
  MessageCircle, 
  BookOpen, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function ProductFeatures({ onNavigate }) {
  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  const featurePillars = [
    {
      eyebrow: '01 / IDENTITY & HEALTH',
      title: 'Digital Pet Passport',
      desc: 'Permanent cloud medical vault storing ISO 11784 microchip numbers, verified rabies immunity certifications, surgical logs, and instant QR verification for travel and emergencies.',
      link: '/digital-pet-passport',
      icon: ShieldCheck,
      color: 'var(--primary)',
      bg: 'var(--primary-light)'
    },
    {
      eyebrow: '02 / INTELLIGENCE',
      title: 'Clinical AI Vision Triage',
      desc: 'Multi-modal diagnostic triage that analyzes symptom photos, physiological body regions, and urgency severity (Levels 1 to 4) to guide immediate next steps.',
      link: '/ai-pet-care',
      icon: Activity,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.12)'
    },
    {
      eyebrow: '03 / SAFETY',
      title: 'Live GPS Satellite Radar',
      desc: 'Sub-2-meter multi-constellation satellite tracking, 3-second geofence boundary alerts, and an 85dB acoustic chime siren for rapid lost pet recovery.',
      link: '/pet-gps',
      icon: Radar,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)'
    },
    {
      eyebrow: '04 / CLINICAL NETWORK',
      title: 'Specialists & Telemedicine',
      desc: 'Direct access to 500+ certified veterinarians for physical in-clinic checkups and HD video teleconsultations with digital prescription dispatch.',
      link: '/for-veterinarians',
      icon: Stethoscope,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)'
    },
    {
      eyebrow: '05 / IOT ECOSYSTEM',
      title: 'Connected Care Hardware',
      desc: 'Seamless integration with 4G cellular smart collars and Bluetooth activity beacons to track resting cycles, step counts, and fever telemetry.',
      link: '/connected-care',
      icon: Cpu,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.12)'
    },
    {
      eyebrow: '06 / COMMUNITY',
      title: 'Amber Alert Lost Pet Shield',
      desc: 'Neighborhood emergency broadcast grid for missing pets, real-time sighting pins on the map, and direct community guardian assistance.',
      link: 'community',
      icon: AlertTriangle,
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.12)'
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
      {/* ── HERO ── */}
      <section className="editorial-section editorial-section-border" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="editorial-container">
          <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>
            PLATFORM ARCHITECTURE
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
            Every feature. One unified ecosystem.
          </h1>
          <p
            style={{
              fontSize: 'clamp(17px, 2vw, 20px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: '0 auto 40px',
            }}
          >
            Explore all capabilities designed to make caring for your pet simpler, smarter, safer, and more connected.
          </p>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="editorial-section editorial-section-border">
        <div className="editorial-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
            {featurePillars.map((item) => (
              <div
                key={item.title}
                className="editorial-card"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={22} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {item.eyebrow}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleRoute(item.link)}
                  className="editorial-btn-secondary"
                  style={{ width: '100%', fontSize: '14px', padding: '10px 16px', justifyContent: 'space-between' }}
                >
                  <span>Explore {item.title}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="editorial-section" style={{ backgroundColor: 'var(--soft-surface)', textAlign: 'center' }}>
        <div className="editorial-container-narrow">
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, marginBottom: '18px' }}>
            Experience the Pet Maya ecosystem today.
          </h2>
          <button onClick={() => handleRoute('dashboard')} className="editorial-btn-primary">
            <span>Launch Platform Demo</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
