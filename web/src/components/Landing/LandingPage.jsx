import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Radar, 
  Cpu, 
  ArrowRight, 
  ChevronDown, 
  CheckCircle2, 
  Smartphone, 
  Sparkles, 
  Lock, 
  FileText, 
  Calendar, 
  Bell, 
  Eye, 
  MapPin, 
  Radio, 
  Battery, 
  Volume2, 
  QrCode, 
  Heart,
  Stethoscope,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const { setActiveTab, openModal, showToast } = useApp();
  const { currentUser, loginAsGuest } = useAuth();

  const handleRoute = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  const handleGetStarted = () => {
    if (currentUser) {
      handleRoute('dashboard');
    } else {
      loginAsGuest('Pet Owner');
      handleRoute('dashboard');
      showToast('Welcome to Pet Maya Platform Demo!', 'success');
    }
  };

  const handleOpenAuth = () => {
    openModal('auth');
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'What is Pet Maya?',
      a: 'Pet Maya is a modern digital pet healthcare and connected-care ecosystem. It brings together your pet’s digital medical passport, vaccination records, AI-assisted symptom triage, satellite GPS safety radar, and veterinary telemedicine into one unified platform.'
    },
    {
      q: 'What is the Digital Pet Passport?',
      a: 'The Digital Pet Passport is a lifelong, verifiable electronic health record for your pet. It stores verified ISO microchip registration, complete vaccination timelines, clinical diagnoses, surgical history, and travel certifications with paperless QR access.'
    },
    {
      q: 'How does Pet Maya help with my pet’s everyday health?',
      a: 'Pet Maya helps you maintain preventive care schedules with automated vaccination and booster reminders, clinical weight and calorie tracking, medical history timelines, and direct 24/7 teleconsultations with verified veterinarians.'
    },
    {
      q: 'Does the AI symptom scanner replace a licensed veterinarian?',
      a: 'No. Pet Maya’s clinical AI vision scanner provides immediate first-aid guidance and triage severity assessment (Levels 1 to 4) to help you understand what might be happening and how urgently you should seek professional veterinary care. It is a decision-support guide, not a veterinary medical diagnosis.'
    },
    {
      q: 'How does the GPS & Safety Radar work?',
      a: 'The Pet Maya smart collar utilizes multi-constellation GNSS (GPS + GLONASS + Galileo) combined with cellular telemetry. It provides live satellite tracking, safe-zone geofence breach notifications within 3 seconds, and an 85dB acoustic chime siren for rapid local recovery.'
    },
    {
      q: 'Does Pet Maya support connected IoT devices?',
      a: 'Yes. The platform seamlessly integrates with Pet Maya 4G cellular smart collars, Bluetooth activity telemetry beacons, and temperature-controlled medical shipment trackers.'
    },
    {
      q: 'How is my pet’s sensitive information protected?',
      a: 'All pet medical records, personal identity data, and clinical history are encrypted and stored in secure Firebase cloud infrastructure. Only authorized pet owners and their chosen veterinary specialists have access.'
    },
    {
      q: 'How do I get started with Pet Maya?',
      a: 'Getting started takes under two minutes. Click "Get Started" to create a profile for your pet (dog, cat, bird, or rabbit), upload existing records, and connect smart tools.'
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 01 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          paddingTop: 'clamp(56px, 8vw, 100px)',
          paddingBottom: 'clamp(64px, 8vw, 110px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="editorial-container">
          <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: '18px' }}
            >
              <span className="text-eyebrow text-eyebrow-accent">
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                PET MAYA
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(42px, 6.5vw, 84px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.06,
                color: 'var(--foreground)',
                marginBottom: '24px',
              }}
            >
              Better care for the pets you love.
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                fontSize: 'clamp(17px, 2vw, 21px)',
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                maxWidth: '680px',
                margin: '0 auto 36px',
              }}
            >
              Pet Maya brings health records, intelligent care, safety and connected pet technology together in one simple platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                marginBottom: '56px',
              }}
            >
              <button
                onClick={handleGetStarted}
                className="editorial-btn-primary"
                style={{ padding: '15px 32px', fontSize: '16px' }}
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => handleRoute('/features')}
                className="editorial-btn-secondary"
                style={{ padding: '15px 30px', fontSize: '16px' }}
              >
                <span>Explore Pet Maya</span>
              </button>
            </motion.div>
          </div>

          {/* Hero Visual Composition — Real Product UI with Floating Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              maxWidth: '1120px',
              margin: '0 auto',
            }}
          >
            {/* Main Stage Frame */}
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                boxShadow: '0 24px 72px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.03)',
              }}
            >
              {/* Device Window Bar */}
              <div
                style={{
                  height: '42px',
                  backgroundColor: 'var(--soft-surface)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 18px',
                  gap: '8px',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#E2E1DA' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#E2E1DA' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#E2E1DA' }} />
                <div
                  style={{
                    margin: '0 auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.02em',
                  }}
                >
                  petmaya.app/dashboard
                </div>
              </div>

              {/* Product UI Image */}
              <img
                src="/assets/screens/02_dashboard_desktop.png"
                alt="Pet Maya Health Dashboard"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '620px',
                  objectFit: 'cover',
                  objectPosition: 'top',
                }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Floating Live Product Indicator: Health Score */}
            <div
              className="editorial-hero-chip"
              style={{
                position: 'absolute',
                top: '-20px',
                left: '-16px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                boxShadow: 'var(--shadow-md)',
                display: 'none',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health Score</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>100% — Optimal</div>
              </div>
            </div>

            {/* Floating Live Product Indicator: GPS Safe Zone */}
            <div
              className="editorial-hero-chip"
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '-16px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                boxShadow: 'var(--shadow-md)',
                display: 'none',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#E0F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#008AA0' }}>
                <Radar size={18} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GPS Radar</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>Safe Zone • Home Perimeter</div>
              </div>
            </div>
          </motion.div>
        </div>

        <style>{`
          @media (min-width: 900px) {
            .editorial-hero-chip {
              display: flex !important;
            }
          }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 02 — PRODUCT PROMISE
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          backgroundColor: 'var(--soft-surface)',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div className="editorial-container-narrow">
          <span className="text-eyebrow" style={{ marginBottom: '16px' }}>
            MODERN PET CARE
          </span>
          <h2
            style={{
              fontSize: 'clamp(32px, 4.5vw, 56px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '24px',
              color: 'var(--foreground)',
            }}
          >
            Your pet’s health shouldn’t live in scattered places.
          </h2>
          <p
            style={{
              fontSize: 'clamp(16px, 1.8vw, 19px)',
              color: 'var(--text-muted)',
              lineHeight: 1.65,
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            Vaccination records, medical history, medications, appointments, health information and safety tools should not exist in disconnected places. Pet Maya brings them together into one unified, intelligent companion.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 03 — HEALTH
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="editorial-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <span className="text-eyebrow" style={{ marginBottom: '14px' }}>
                01 / HEALTH
              </span>
              <h2
                style={{
                  fontSize: 'clamp(32px, 4vw, 52px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.12,
                  marginBottom: '20px',
                }}
              >
                Your pet’s health, finally organized.
              </h2>
              <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '32px' }}>
                No more paper vaccination cards lost in drawers or forgotten rabies boosters. Pet Maya maintains complete, chronological medical records synced with certified veterinary clinics.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>Digital Health Records</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Diagnoses, prescriptions, allergies, and surgical notes stored permanently.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>Vaccination Timelines & Reminders</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Automated notifications for rabies, core vaccines, and parasite prevention.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>Telemedicine & In-Clinic Scheduling</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Book verified veterinary specialists for physical visits or HD video consults.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Dashboard Visual */}
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <img
                src="/assets/screens/08_reminders_desktop.png"
                alt="Vaccination & Health Schedule"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={(e) => {
                  e.target.src = '/assets/screens/02_dashboard_desktop.png';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 04 — DIGITAL PET PASSPORT
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          backgroundColor: 'var(--soft-surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="editorial-container">
          <div style={{ maxWidth: '780px', margin: '0 auto 56px', textAlign: 'center' }}>
            <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>
              DIGITAL PET PASSPORT
            </span>
            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 54px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: '18px',
              }}
            >
              Your pet’s health story, wherever you go.
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              The flagship Pet Maya digital passport replaces fragile paper records with an encrypted, cloud-verified identity complete with ISO microchip registry, verified immunity records, and instant QR sharing.
            </p>
          </div>

          {/* Passport Visual Composition */}
          <div
            style={{
              maxWidth: '920px',
              margin: '0 auto',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              boxShadow: 'var(--shadow-xl)',
              padding: 'clamp(28px, 4vw, 56px)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
              {/* Pet Identity Card */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=160&auto=format&fit=crop&q=80"
                    alt="Max the Golden Retriever"
                    style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>Max</h3>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Golden Retriever • 3 Years Old</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} />
                      <span>ISO 11784 Verified #985141002381</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rabies Immunity</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px', color: '#10B981' }}>Active (Valid to 2027)</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weight</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>28.4 kg (Optimal)</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Clinic</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>Central Vet Hospital</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emergency Hotline</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>+880 1712-345678</div>
                  </div>
                </div>
              </div>

              {/* Passport QR & Travel Ready Panel */}
              <div
                style={{
                  backgroundColor: 'var(--soft-surface)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px',
                  textAlign: 'center',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ width: 120, height: 120, margin: '0 auto 16px', backgroundColor: '#FFF', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <QrCode size={96} color="#151515" />
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                  Digital Identity QR
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Scan at border security, airlines, or emergency veterinary hospitals for instant read-only health clearance.
                </p>
                <button
                  onClick={() => handleRoute('/digital-pet-passport')}
                  className="editorial-btn-secondary"
                  style={{ width: '100%', fontSize: '13.5px', padding: '10px 16px' }}
                >
                  <span>Explore Passport Features</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 05 — AI
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="editorial-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
            {/* AI Interactive Chat / Scanner Showcase */}
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'clamp(24px, 3vw, 36px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14.5px', display: 'block' }}>Pet Maya Clinical AI</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multi-Modal Symptom Guidance</span>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#10B981', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  Decision Support Active
                </span>
              </div>

              {/* Chat Dialog Simulation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%', backgroundColor: 'var(--soft-surface)', padding: '12px 16px', borderRadius: '14px 14px 14px 2px', fontSize: '13.5px', lineHeight: 1.5 }}>
                  "My cat Bella has been scratching her right ear frequently and shaking her head since yesterday."
                </div>

                <div style={{ alignSelf: 'flex-end', maxWidth: '90%', backgroundColor: 'var(--foreground)', color: '#FFF', padding: '14px 18px', borderRadius: '14px 14px 2px 14px', fontSize: '13.5px', lineHeight: 1.55 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontWeight: 600, fontSize: '12.5px', marginBottom: '4px' }}>
                    <Activity size={14} />
                    <span>Severity Triage: Level 2 (Moderate — Non-Emergency)</span>
                  </div>
                  Head shaking and focal ear scratching commonly indicate Otitis Externa (ear canal inflammation) or ear mite infestation. Do not insert cotton swabs. Recommended next step: schedule a non-emergency veterinary ear exam within 48 hours.
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ marginTop: '20px', padding: '10px 14px', backgroundColor: 'var(--soft-surface)', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                ⚠️ <strong>Clinical Notice:</strong> AI assistance provides triage insights and first-aid protocols. It is not a replacement for professional veterinary examination, diagnosis, or prescription.
              </div>
            </div>

            {/* AI Editorial Text */}
            <div>
              <span className="text-eyebrow" style={{ marginBottom: '14px' }}>
                02 / INTELLIGENCE
              </span>
              <h2
                style={{
                  fontSize: 'clamp(32px, 4vw, 52px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.12,
                  marginBottom: '20px',
                }}
              >
                Smarter insights for better pet care.
              </h2>
              <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '28px' }}>
                When your pet behaves differently, you shouldn't have to panic through conflicting forum threads. Pet Maya's vision models analyze symptoms, map physiological regions, and provide calm, structured guidance.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>Multi-modal image analysis for skin, coat, and eye lesions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>Standardized 4-level veterinary urgency scoring</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>Direct seamless escalation to on-call tele-vets</span>
                </div>
              </div>

              <button
                onClick={() => handleRoute('/ai-pet-care')}
                className="editorial-btn-secondary"
              >
                <span>Learn About AI Health Care</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 06 — GPS & SAFETY (High-Contrast Dark Section)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          backgroundColor: 'var(--dark-hero-bg)',
          color: '#FFFFFF',
          borderBottom: '1px solid var(--dark-border)',
        }}
      >
        <div className="editorial-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '56px', alignItems: 'center' }}>
            <div>
              <span className="text-eyebrow" style={{ color: '#10B981', marginBottom: '14px' }}>
                03 / SAFETY
              </span>
              <h2
                style={{
                  fontSize: 'clamp(32px, 4.5vw, 54px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: '#FFFFFF',
                  marginBottom: '20px',
                }}
              >
                Know where they are. Know they’re safe.
              </h2>
              <p style={{ fontSize: '17px', color: '#94A3B8', lineHeight: 1.65, marginBottom: '32px' }}>
                Real-time multi-constellation satellite telemetry delivers sub-2-meter precision. Set geofence security perimeters around home or park, and receive instant push alarms the second a boundary is breached.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '36px' }}>
                <div style={{ backgroundColor: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', marginBottom: '6px' }}>
                    <MapPin size={18} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>GNSS Satellite</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>&lt; 2-Meter Precision</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>GPS + GLONASS + Galileo</div>
                </div>

                <div style={{ backgroundColor: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', marginBottom: '6px' }}>
                    <Volume2 size={18} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>Acoustic Siren</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>85dB Audio Chime</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Locate in brush & night</div>
                </div>
              </div>

              <button
                onClick={() => handleRoute('/pet-gps')}
                className="editorial-btn-accent"
              >
                <span>Discover GPS & Radar</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Dark Radar Map Visual */}
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--dark-border)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
              }}
            >
              <img
                src="/assets/screens/07_tracker_desktop.png"
                alt="Pet Maya GPS Radar Live Map"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1000&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 07 — CONNECTED CARE / IoT
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="editorial-container">
          <div style={{ maxWidth: '780px', margin: '0 auto 56px', textAlign: 'center' }}>
            <span className="text-eyebrow" style={{ marginBottom: '14px' }}>
              04 / CONNECTED CARE
            </span>
            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 54px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
                marginBottom: '18px',
              }}
            >
              Your pet. Your devices. One connected ecosystem.
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              A continuous, calm bridge from your pet's everyday collar telemetry to cloud health diagnostics and certified veterinary care.
            </p>
          </div>

          {/* Connected Flow Diagram */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              { step: '01', title: 'Pet & Collar', desc: 'Smart 4G Collar with motion, temperature, and GPS telemetry sensors.' },
              { step: '02', title: 'Secure Gateway', desc: 'Encrypted BLE and LTE-M cloud sync with ultra-low battery drain.' },
              { step: '03', title: 'Pet Maya Cloud', desc: 'Unified Electronic Health Record (EHR) and biometric history vault.' },
              { step: '04', title: 'Clinical AI', desc: 'Continuous baseline learning for early detection of lethargy or pain.' },
              { step: '05', title: 'Vet & Parent', desc: 'Proactive alerts dispatched directly to you and your veterinarian.' }
            ].map((node, i) => (
              <div
                key={node.step}
                className="editorial-card"
                style={{ padding: '24px 20px', position: 'relative' }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>
                  {node.step}
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{node.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {node.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 08 — MOBILE EXPERIENCE
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          backgroundColor: 'var(--soft-surface)',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div className="editorial-container">
          <span className="text-eyebrow" style={{ marginBottom: '14px' }}>
            CROSS-PLATFORM CONTINUITY
          </span>
          <h2
            style={{
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '18px',
            }}
          >
            Pet care, wherever you are.
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto 56px' }}>
            Experience total synchronization between the web platform and native mobile apps for iOS and Android.
          </p>

          {/* 3 Real Mobile App Screens */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(16px, 3vw, 40px)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { src: '/assets/screens/14_dashboard_mobile.png', title: 'Dashboard & Vitals' },
              { src: '/assets/screens/15_shop_mobile.png', title: 'Care Pharmacy' },
              { src: '/assets/screens/16_ai_mobile.png', title: 'Vision AI Triage' }
            ].map((mock, idx) => (
              <div
                key={mock.title}
                style={{
                  width: '260px',
                  borderRadius: '36px',
                  overflow: 'hidden',
                  border: '6px solid #151515',
                  boxShadow: '0 20px 48px rgba(0,0,0,0.12)',
                  backgroundColor: '#000',
                }}
              >
                <img
                  src={mock.src}
                  alt={mock.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  onError={(e) => {
                    e.target.src = '/assets/screens/02_dashboard_desktop.png';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 09 — HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="editorial-container">
          <div style={{ maxWidth: '720px', margin: '0 auto 64px', textAlign: 'center' }}>
            <span className="text-eyebrow" style={{ marginBottom: '14px' }}>
              GETTING STARTED
            </span>
            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
                marginBottom: '16px',
              }}
            >
              Four simple steps to complete care.
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '32px',
            }}
          >
            {[
              { num: '01', title: 'Create your pet profile', text: 'Add your dog, cat, bird or rabbit with age, breed, microchip, and clinical history.' },
              { num: '02', title: 'Track health & everyday care', text: 'Log vaccinations, record weight trajectories, and set automatic reminders.' },
              { num: '03', title: 'Connect safety & smart tools', text: 'Pair the GPS smart collar or activate AI camera triage whenever symptoms arise.' },
              { num: '04', title: 'Understand your pet better', text: 'Access proactive preventative insights and book verified veterinary consultations.' }
            ].map((step) => (
              <div key={step.num} style={{ padding: '16px 0' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '44px',
                    fontWeight: 800,
                    color: 'var(--border)',
                    lineHeight: 1,
                    marginBottom: '14px',
                  }}
                >
                  {step.num}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 10 — PET PARENT EXPERIENCE (Emotional Foundation)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          backgroundColor: 'var(--soft-surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="editorial-container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            <div>
              <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>
                OUR PHILOSOPHY
              </span>
              <h2
                style={{
                  fontSize: 'clamp(34px, 4.5vw, 56px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: '20px',
                }}
              >
                Because they’re family.
              </h2>
              <p style={{ fontSize: '17.5px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '24px' }}>
                Their health history, everyday care and important moments deserve a place of their own. We designed Pet Maya with the same precision, beauty, and privacy standards you expect for human health.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={handleGetStarted} className="editorial-btn-primary">
                  <span>Start Caring With Us</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=80"
                alt="Happy dogs playing"
                style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 11 — TRUST & PRIVACY
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="editorial-container">
          <div style={{ maxWidth: '780px', margin: '0 auto 56px', textAlign: 'center' }}>
            <span className="text-eyebrow" style={{ marginBottom: '14px' }}>
              SECURITY & PRIVACY
            </span>
            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
                marginBottom: '18px',
              }}
            >
              Built with your pet’s information in mind.
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              We apply rigorous data protection principles. Your pet's medical records and your family's personal data belong exclusively to you.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            <div className="editorial-card">
              <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Lock size={20} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Secure Cloud Storage</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                Electronic health records are stored in Google Cloud infrastructure with role-based Firestore security rules.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Owner Controlled Access</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                Only you choose which veterinarians or emergency clinics receive access to medical histories and prescription logs.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <FileText size={20} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Paperless Data Export</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                Download comprehensive clinical health summaries as PDF passports anytime for travel, boarding, or relocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 12 — PET MAYA JOURNAL
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          backgroundColor: 'var(--soft-surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="editorial-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span className="text-eyebrow" style={{ marginBottom: '12px' }}>
                EDITORIAL
              </span>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, margin: 0 }}>
                Pet Maya Journal
              </h2>
            </div>
            <button
              onClick={() => handleRoute('/blog')}
              className="editorial-btn-secondary"
              style={{ fontSize: '14px', padding: '10px 20px' }}
            >
              <span>View All Articles</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '28px',
            }}
          >
            {[
              {
                category: 'Pet Health',
                title: 'Understanding Canine Vaccination Timelines: Core vs Non-Core',
                readTime: '6 min read',
                image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
              },
              {
                category: 'Nutrition',
                title: 'Clinical Calorie Management for Indoor Domestic Cats',
                readTime: '5 min read',
                image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
              },
              {
                category: 'Technology',
                title: 'How Multi-GNSS Satellite Collars Filter Out Multipath Interference',
                readTime: '8 min read',
                image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop&q=80',
              }
            ].map((article) => (
              <div
                key={article.title}
                className="editorial-card"
                style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => handleRoute('/blog')}
              >
                <img
                  src={article.image}
                  alt={article.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase' }}>{article.category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{article.readTime}</span>
                  </div>
                  <h4 style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.35, margin: 0 }}>
                    {article.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 13 — FAQ ACCORDION
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="editorial-container-narrow">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="text-eyebrow" style={{ marginBottom: '12px' }}>
              QUESTIONS & ANSWERS
            </span>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800 }}>
              Frequently asked questions.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    gap: '16px',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: 'var(--text-muted)',
                      transform: openFaq === idx ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 24px 22px', fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="editorial-section"
        style={{
          backgroundColor: 'var(--soft-surface)',
          textAlign: 'center',
        }}
      >
        <div className="editorial-container-narrow">
          <h2
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '20px',
            }}
          >
            Give your pet a healthier tomorrow.
          </h2>
          <p
            style={{
              fontSize: 'clamp(17px, 2vw, 20px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto 36px',
            }}
          >
            Everything you need to understand, protect and care for your pet, in one simple place.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGetStarted}
              className="editorial-btn-primary"
              style={{ padding: '16px 36px', fontSize: '16px' }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => handleRoute('/contact')}
              className="editorial-btn-secondary"
              style={{ padding: '16px 32px', fontSize: '16px' }}
            >
              <span>Contact Veterinary Team</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
