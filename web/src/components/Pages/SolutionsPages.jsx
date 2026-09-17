import React from 'react';
import { 
  Heart, 
  Stethoscope, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Video, 
  FileText,
  Users
} from 'lucide-react';

export default function SolutionsPages({ type = 'parents', onNavigate }) {
  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  const configs = {
    parents: {
      eyebrow: 'SOLUTIONS FOR PET PARENTS',
      title: 'Peace of mind for the pet you love.',
      subtitle: 'From puppy vaccinations to senior pet care, Pet Maya keeps health records organized, safety alerts instant, and certified veterinary doctors one tap away.',
      benefits: [
        'Complete digital medical passport always with you on your smartphone',
        'Automatic reminders for rabies, core boosters, and flea/tick preventatives',
        'Real-time GPS tracking collar with boundary escape alarms',
        'Instant AI symptom checker when unexpected behaviors happen',
        'Direct booking for in-clinic visits or HD video teleconsultations'
      ],
      ctaText: 'Get Started for Free',
      ctaAction: 'dashboard',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80'
    },
    vets: {
      eyebrow: 'SOLUTIONS FOR VETERINARIANS',
      title: 'Modern clinical care without administrative drag.',
      subtitle: 'Expand your practice with verified telemedicine consultations, digital prescription generation, and access to organized, longitudinal patient health histories.',
      benefits: [
        'Integrated HD WebRTC video consultation room with live patient notes',
        'Digital prescription dispenser sent straight to the owner’s passport',
        'Instant access to past vaccination records and allergy warnings',
        'Verified clinician profile visible to thousands of local pet parents',
        'Flexible on-call scheduling and transparent automated billing'
      ],
      ctaText: 'Join the Verified Specialist Network',
      ctaAction: '/contact',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80'
    },
    clinics: {
      eyebrow: 'SOLUTIONS FOR CLINICS & HOSPITALS',
      title: 'Unify hospital workflow and client communication.',
      subtitle: 'Equip your veterinary facility with unified electronic health records, multi-practitioner calendar scheduling, and automated post-visit follow-up protocols.',
      benefits: [
        'Multi-doctor schedule management with automated SMS & push reminders',
        'Direct electronic passport updates eliminating lost paper records',
        'In-hospital and remote tele-triage queues',
        'Pharmacy inventory and prescription fulfillment sync',
        'Seamless onboarding and staff role permissions'
      ],
      ctaText: 'Schedule a Clinic Demo',
      ctaAction: '/contact',
      image: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80'
    }
  };

  const current = configs[type] || configs.parents;

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
      {/* ── HERO ── */}
      <section className="editorial-section editorial-section-border" style={{ paddingTop: '80px' }}>
        <div className="editorial-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>
                {current.eyebrow}
              </span>
              <h1
                style={{
                  fontSize: 'clamp(36px, 5.5vw, 68px)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  marginBottom: '20px',
                }}
              >
                {current.title}
              </h1>
              <p
                style={{
                  fontSize: 'clamp(16px, 1.8vw, 19px)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  marginBottom: '36px',
                }}
              >
                {current.subtitle}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
                {current.benefits.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '15px', color: 'var(--foreground)', lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => handleRoute(current.ctaAction)} className="editorial-btn-primary">
                <span>{current.ctaText}</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>
              <img
                src={current.image}
                alt={current.title}
                style={{ width: '100%', height: '480px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="editorial-section" style={{ backgroundColor: 'var(--soft-surface)', textAlign: 'center' }}>
        <div className="editorial-container-narrow">
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 50px)', fontWeight: 800, marginBottom: '16px' }}>
            Ready to experience modern pet care?
          </h2>
          <p style={{ fontSize: '16.5px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Get started in under two minutes. No credit card required.
          </p>
          <button onClick={() => handleRoute('dashboard')} className="editorial-btn-primary">
            <span>Explore Pet Maya Now</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
