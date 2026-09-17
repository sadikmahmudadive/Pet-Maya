import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  QrCode, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Lock, 
  Smartphone,
  Syringe,
  AlertCircle
} from 'lucide-react';

export default function DigitalPassportPage({ onNavigate }) {
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
            DIGITAL PET PASSPORT
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
            Your pet’s complete health story.
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
            The digital passport unifies microchip records, certified rabies vaccines, clinical medical history, and international travel clearance in one tamper-evident cloud vault.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button onClick={() => handleRoute('dashboard')} className="editorial-btn-primary">
              <span>Create Pet Passport</span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => handleRoute('/features')} className="editorial-btn-secondary">
              <span>View All Capabilities</span>
            </button>
          </div>

          {/* Large Visual */}
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
              src="/assets/screens/10_profile_desktop.png"
              alt="Digital Pet Passport & EHR Medical Vault"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.src = '/assets/screens/08_reminders_desktop.png';
              }}
            />
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM VS THE SOLUTION ── */}
      <section className="editorial-section editorial-section-border" style={{ backgroundColor: 'var(--soft-surface)' }}>
        <div className="editorial-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px' }}>
            <div>
              <span className="text-eyebrow" style={{ color: '#EF4444', marginBottom: '12px' }}>THE PROBLEM</span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '14px' }}>Paper records fail pets in critical moments.</h3>
              <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Paper vaccine booklets get lost in house moves, water damaged, or forgotten when boarding or visiting emergency veterinary clinics. Lack of immediate access to allergy notes or past surgical history delays emergency care.
              </p>
            </div>
            <div>
              <span className="text-eyebrow" style={{ color: 'var(--primary)', marginBottom: '12px' }}>THE PET MAYA SOLUTION</span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '14px' }}>Verifiable, paperless health anywhere on earth.</h3>
              <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                A lifelong digital passport permanently attached to your pet's ISO 11784 microchip. Instantly accessible from your smartphone or sharable via secure QR code to emergency veterinarians, boarding kennels, and international airline authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES GRID ── */}
      <section className="editorial-section editorial-section-border">
        <div className="editorial-container">
          <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
            <span className="text-eyebrow" style={{ marginBottom: '12px' }}>CORE FEATURES</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.15 }}>Designed for lifelong veterinary trust.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Syringe size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Immunization Schedule</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Track DHPP, Rabies, Bordetella, and FVRCP with lot numbers, administering clinics, and automated booster countdowns.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <FileText size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Electronic Health Records (EHR)</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Full chronological clinical history of doctor visits, differential diagnoses, lab work, radiology reports, and active prescriptions.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <QrCode size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Instant QR Identity Check</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Emergency clinic staff scan the QR code to view life-saving allergies, blood type, and owner contacts without needing an account.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Globe size={18} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Travel & Boarding Clearance</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Export an official PDF medical summary compliant with airline health certificates and boarding facility entry criteria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="editorial-section" style={{ backgroundColor: 'var(--soft-surface)', textAlign: 'center' }}>
        <div className="editorial-container-narrow">
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, marginBottom: '18px' }}>
            Set up your pet’s passport in minutes.
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '540px', margin: '0 auto 32px' }}>
            Join thousands of pet parents who have modernized their pet healthcare.
          </p>
          <button onClick={() => handleRoute('dashboard')} className="editorial-btn-primary">
            <span>Open Digital Passport</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
