import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  HelpCircle, 
  FileText, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown,
  Building2,
  Heart
} from 'lucide-react';

export default function EditorialCompanyPages({ page = 'about', onNavigate }) {
  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  // ── ABOUT PAGE ──
  if (page === 'about') {
    return (
      <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
        <section className="editorial-section editorial-section-border" style={{ paddingTop: '80px', textAlign: 'center' }}>
          <div className="editorial-container-narrow">
            <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>ABOUT PET MAYA</span>
            <h1 style={{ fontSize: 'clamp(38px, 6vw, 70px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px' }}>
              Pets are family. Their healthcare should reflect that.
            </h1>
            <p style={{ fontSize: 'clamp(17px, 2vw, 20px)', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 auto 40px' }}>
              Pet Maya was created to solve a problem every pet parent faces: fragmented vaccination papers, anxiety when sudden symptoms occur, and fear of pets slipping away from safe perimeters.
            </p>
          </div>
        </section>

        <section className="editorial-section editorial-section-border">
          <div className="editorial-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px' }}>
              <div className="editorial-card">
                <span className="text-eyebrow" style={{ marginBottom: '12px' }}>OUR MISSION</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>Simpler, smarter, safer care.</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  To bridge the gap between pet parents, certified veterinary clinics, and modern connected technology — creating a calmer, more informed journey for every pet’s life.
                </p>
              </div>

              <div className="editorial-card">
                <span className="text-eyebrow" style={{ marginBottom: '12px' }}>CLINICAL RIGOR</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>Evidence-based protocols.</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Our AI vision triage and electronic health records are developed alongside licensed veterinary surgeons and livestock medical officers across Bangladesh and international partners.
                </p>
              </div>

              <div className="editorial-card">
                <span className="text-eyebrow" style={{ marginBottom: '12px' }}>SECURITY & PRIVACY</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>Your data belongs to you.</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  We treat pet medical records with the confidentiality they deserve. No selling of medical history or location data to third parties. Ever.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── CONTACT PAGE ──
  if (page === 'contact') {
    return (
      <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
        <section className="editorial-section editorial-section-border" style={{ paddingTop: '80px', textAlign: 'center' }}>
          <div className="editorial-container-narrow">
            <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>GET IN TOUCH</span>
            <h1 style={{ fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '20px' }}>
              We're here to help you and your pet.
            </h1>
            <p style={{ fontSize: '17.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Have questions about Pet Maya, need technical support with your smart collar, or want to register your veterinary clinic? Reach out to our team.
            </p>
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
              <div className="editorial-card">
                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Mail size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Email Support</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>For general inquiries, account support, and hardware assistance.</p>
                <a href="mailto:support@petmaya.app" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}>support@petmaya.app</a>
              </div>

              <div className="editorial-card">
                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Phone size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Veterinary Helpline</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>Available 7 days a week for customer care and urgent clinical routing.</p>
                <a href="tel:+8801712345678" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}>+880 1712-345678</a>
              </div>

              <div className="editorial-card">
                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Headquarters</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>Pet Maya Healthcare Technologies Inc.</p>
                <div style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.5 }}>Gulshan-2, Dhaka 1212, Bangladesh</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── PRIVACY POLICY & TERMS ──
  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
      <section className="editorial-section editorial-section-border" style={{ paddingTop: '80px' }}>
        <div className="editorial-container-narrow">
          <span className="text-eyebrow" style={{ marginBottom: '14px' }}>LEGAL & COMPLIANCE</span>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '24px' }}>
            {page === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '40px' }}>
            Last updated: September 2026 • Pet Maya Platform v2.5
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '15.5px', lineHeight: 1.7, color: 'var(--foreground)' }}>
            <p>
              At Pet Maya, we hold the trust of pet owners and veterinary clinicians as our highest priority. This document outlines our verifiable policies regarding medical data storage, encryption, and platform usage.
            </p>

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '16px' }}>1. Data Encryption & Access Control</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              All Electronic Health Records (EHR), pet identification markers, and teleconsultation history are encrypted at rest and in transit using industry-standard protocols. Only you and veterinary practitioners whom you explicitly authorize have permission to view your pet's complete diagnostic timeline.
            </p>

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '16px' }}>2. Veterinary Medical Boundaries</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Pet Maya AI and symptom checking features are intended exclusively as an educational triage and decision-support guide. They do not constitute formal veterinary medical diagnoses. For critical life-threatening conditions, users must consult a licensed emergency veterinary clinic immediately.
            </p>

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '16px' }}>3. Data Ownership & Deletion</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Pet owners retain complete ownership of all uploaded records, vaccination certificates, and media. You may export your entire medical record history as an official PDF passport or request permanent deletion of your account and data at any time through your Profile settings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
