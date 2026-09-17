import React from 'react';
import { 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Stethoscope, 
  Camera, 
  FileText,
  ShieldCheck
} from 'lucide-react';

export default function AIPetCarePage({ onNavigate }) {
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
            CLINICAL AI HEALTHCARE
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
            Smarter insights for better pet care.
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
            Instant multi-modal vision triage and clinical symptom analysis trained on veterinary clinical guidelines to help you make calm, informed decisions.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button onClick={() => handleRoute('ai')} className="editorial-btn-primary">
              <span>Start Free AI Triage Scan</span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => handleRoute('/for-veterinarians')} className="editorial-btn-secondary">
              <span>Veterinary Clinical Protocol</span>
            </button>
          </div>

          {/* Product UI Visual */}
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <img
              src="/assets/screens/04_ai_scanner_desktop.png"
              alt="Clinical AI Vision Scanner"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.src = '/assets/screens/02_dashboard_desktop.png';
              }}
            />
          </div>
        </div>
      </section>

      {/* ── ETHICS & CLINICAL DISCLAIMER ── */}
      <section className="editorial-section editorial-section-border" style={{ backgroundColor: 'var(--soft-surface)' }}>
        <div className="editorial-container-narrow" style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={22} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
            Our Clinical Commitment & Medical Boundaries
          </h3>
          <p style={{ fontSize: '15.5px', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '680px', margin: '0 auto' }}>
            Pet Maya AI is built strictly as a veterinary triage decision-support tool. It analyzes visual lesions, symptoms, and physiological regions to assess urgency level and first-aid measures. <strong>It does not prescribe medications or replace hands-on diagnostic exams by a licensed veterinary doctor.</strong>
          </p>
        </div>
      </section>

      {/* ── 4-TIER SEVERITY PROTOCOL ── */}
      <section className="editorial-section editorial-section-border">
        <div className="editorial-container">
          <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
            <span className="text-eyebrow" style={{ marginBottom: '12px' }}>VETERINARY TRIAGE MATRIX</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.15 }}>Four standardized clinical urgency levels.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              {
                level: 'Level 1',
                title: 'Routine Care / Minor',
                color: '#10B981',
                bg: 'rgba(16, 185, 129, 0.1)',
                desc: 'Mild changes (e.g. minor plaque, seasonal shedding). Home monitoring advised.',
                action: 'Log in medical timeline'
              },
              {
                level: 'Level 2',
                title: 'Non-Urgent Consultation',
                color: '#3B82F6',
                bg: 'rgba(59, 130, 246, 0.1)',
                desc: 'Persistent itching, mild ear discharge, or diet sensitivity. Schedule within 48-72h.',
                action: 'Book video consultation'
              },
              {
                level: 'Level 3',
                title: 'Urgent Same-Day Visit',
                color: '#F59E0B',
                bg: 'rgba(245, 158, 11, 0.1)',
                desc: 'Acute lameness, repeated vomiting, or corneal clouding. Physical exam needed today.',
                action: 'Locate nearest open clinic'
              },
              {
                level: 'Level 4',
                title: 'Critical Emergency',
                color: '#EF4444',
                bg: 'rgba(239, 68, 68, 0.1)',
                desc: 'Difficulty breathing, pale gums, seizure, or toxic ingestion. Immediate dispatch required.',
                action: 'Call 24/7 Emergency Vet Line'
              }
            ].map(tier => (
              <div key={tier.level} className="editorial-card" style={{ padding: '24px', borderTop: `4px solid ${tier.color}` }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: tier.color, textTransform: 'uppercase' }}>
                  {tier.level}
                </span>
                <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '6px 0 10px 0' }}>{tier.title}</h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '16px' }}>{tier.desc}</p>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Protocol: {tier.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="editorial-section" style={{ backgroundColor: 'var(--soft-surface)', textAlign: 'center' }}>
        <div className="editorial-container-narrow">
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, marginBottom: '18px' }}>
            Check your pet’s symptoms in seconds.
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Free for all registered pet parents. Available 24 hours a day.
          </p>
          <button onClick={() => handleRoute('ai')} className="editorial-btn-primary">
            <span>Launch AI Symptom Checker</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
