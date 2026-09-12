import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, Activity, Utensils, Stethoscope, ShoppingBag, Bell, 
  Download, Smartphone, ChevronRight, ShieldCheck, ExternalLink,
  Sparkles, Heart, BookOpen, MapPin, MessageCircle, Calendar, Syringe, Star, ChevronDown, AlertTriangle, Building2
} from 'lucide-react';

// ── FAQ ACCORDION COMPONENT ──
function FAQSection({ handleFeatureAccess, openModal }) {
  const [openIdx, setOpenIdx] = useState(null);
  const faqs = [
    { q: 'How accurate is the GPS tracking?', a: 'The Pet Maya smart collar uses multi-constellation GNSS (GPS + GLONASS + Galileo) with proprietary Kalman filtering to achieve sub-2-meter accuracy in open areas. Indoor accuracy is approximately 5-8 meters via WiFi triangulation.' },
    { q: 'Is the AI health scanner a replacement for a vet visit?', a: 'No — the AI Clinical Triage provides rapid symptom severity assessment and first-aid guidance to help you decide if and how urgently you need to see a vet. It is a decision-support tool, not a clinical diagnosis. Always consult a licensed veterinarian for treatment.' },
    { q: 'What pets does Pet Maya support?', a: 'Pet Maya currently supports Dogs, Cats, Birds, and Rabbits across all features including GPS tracking, AI health scanning, vaccine reminders, and the medical passport. More species are planned for upcoming releases.' },
    { q: 'How do geofence boundary alarms work?', a: 'You draw a custom safe zone on the map (home perimeter, garden, park area). If the collar detects the pet has moved outside this boundary, you receive an instant push notification within 3 seconds, along with the live map location.' },
    { q: 'Can I book a teleconsultation with any vet on the platform?', a: 'Yes. All veterinarians on Pet Maya with the Telehealth badge offer HD video consultations. You can book directly from the Specialists page. Teleconsults are available 7 days a week, with 24/7 emergency on-call coverage.' },
    { q: 'How is my pet\'s medical data stored?', a: 'All electronic health records (EHR) are encrypted with AES-256 and stored in Firebase Firestore with regional compliance. Only you and your authorized clinicians can access your pet\'s records. You can export or delete all data at any time from the Profile page.' },
    { q: 'Is Pet Maya available in Bangladesh?', a: 'Yes — Pet Maya was built for the Bangladesh market first. Our verified specialist network includes clinics across Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, and more. The app and website support BDT (৳) pricing and local pharmacy delivery.' },
    { q: 'Is there a free plan?', a: 'Yes. Pet Maya Basic is completely free and includes GPS tracking (15-min update interval), AI health scanning (5 scans/month), vaccine reminders, community access, and the pet shop. Pet Maya Pro (৳499/month) adds real-time 5-second GPS updates, unlimited AI scans, teleconsultation credits, and priority vet booking.' },
  ];
  return (
    <section style={{ background: 'var(--bg)', padding: '72px 20px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Got questions?</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.15 }}>Frequently asked questions.</h2>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {faqs.map((faq, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5px' }} transition={{ duration: 0.3, delay: idx * 0.04 }} style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', gap: '16px', textAlign: 'left' }}
              >
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>{faq.q}</span>
                <motion.span animate={{ rotate: openIdx === idx ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openIdx === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0, padding: '0 22px 20px' }}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



export default function LandingPage() {
  const { setActiveTab, openModal, showToast } = useApp();
  const { currentUser, loginAsGuest } = useAuth();

  const handleTryDemo = () => {
    loginAsGuest('Pet Owner');
    setActiveTab('dashboard');
    showToast('Welcome to Pet Maya Demo Dashboard!', 'success');
  };

  const handleFeatureAccess = (tabId, featureName) => {
    if (currentUser) {
      setActiveTab(tabId);
    } else {
      openModal('auth');
      showToast(`Please sign in to access ${featureName}`, 'info');
    }
  };

  const [activePillar, setActivePillar] = useState(0);

  // 12 Distinct Ecosystem Features for Compact Grid
  const ecosystemFeatures = [
    { id: 'tracker',   icon: Radar,         title: 'Tracker',        subtitle: 'Live GPS location',        color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
    { id: 'ai',        icon: Activity,      title: 'Wellness',       subtitle: 'AI health scan',           color: '#3B82F6', bg: 'rgba(59,130,246,0.18)' },
    { id: 'vets',      icon: Stethoscope,   title: 'Specialists',    subtitle: '500+ Verified doctors',    color: '#F59E0B', bg: 'rgba(245,158,11,0.18)' },
    { id: 'shop',      icon: ShoppingBag,   title: 'Pet Shop',       subtitle: 'Nutrition & essentials',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.18)' },
    { id: 'community', icon: MessageCircle, title: 'Community',      subtitle: 'Pet parent network',       color: '#06B6D4', bg: 'rgba(6,182,212,0.18)' },
    { id: 'food',      icon: BookOpen,      title: 'Blog',           subtitle: 'Expert advice & diet',     color: '#EC4899', bg: 'rgba(236,72,153,0.18)' },
    { id: 'tracker',   icon: Radar,         title: 'Hardware & GPS', subtitle: 'Live GPS & BLE Collars',   color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
    { id: 'ai',        icon: Activity,      title: 'Wellness AI',    subtitle: 'Vision scan & body map',   color: '#3B82F6', bg: 'rgba(59,130,246,0.18)' },
    { id: 'vaccines',  icon: Calendar,      title: 'Reminders',      subtitle: 'Vaccine & vet calendar',   color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
    { id: 'shop',      icon: ShoppingBag,   title: 'Pet Pharmacy',   subtitle: 'Nutrition & RX items',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.18)' },
    { id: 'community', icon: AlertTriangle, title: 'Amber Alerts',   subtitle: 'Lost pet recovery grid',   color: '#EF4444', bg: 'rgba(239,68,68,0.18)' },
    { id: 'vaccines',  icon: ShieldCheck,   title: 'Pet Passport',   subtitle: 'Microchip & rabies tag',   color: '#06B6D4', bg: 'rgba(6,182,212,0.18)' },
  ];

  // 3 Signature Pillars for Compact Interactive Showcase
  const showcasePillars = [
    {
      id: 'tracker',
      tabId: 'tracker',
      eyebrow: 'Pet Radar & Smart Collar',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.15)',
      border: 'rgba(16,185,129,0.3)',
      icon: Radar,
      title: 'Wonderfully fast. Astoundingly precise.',
      subtitle: 'Multi-constellation GPS tracking with geofence breach alarms.',
      tags: ['< 2m GNSS Satellites', '3-Sec Geofence Push', '85dB Acoustic Siren', 'BLE Beacon Radar'],
      actionText: 'Explore Radar Telemetry',
    },
    {
      id: 'ai',
      tabId: 'ai',
      eyebrow: 'Clinical AI Vision',
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.15)',
      border: 'rgba(59,130,246,0.3)',
      icon: Activity,
      title: 'Clinical intelligence. Right on your camera.',
      subtitle: 'Instant severity analysis and first aid advice from a photo.',
      tags: ['Vision CNN Model', 'Severity Scoring 1-4', 'Body Region Mapping', 'Direct Vet Referral'],
      actionText: 'Try AI Health Scan',
    },
    {
      id: 'shop',
      tabId: 'shop',
      eyebrow: 'Pet Pharmacy & Care',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.15)',
      border: 'rgba(245,158,11,0.3)',
      icon: ShoppingBag,
      title: 'Everything they need. Delivered today.',
      subtitle: 'Genuine prescription preventatives and specialty food.',
      tags: ['100% Genuine RX', '24h Express Dispatch', 'Cold-Chain Shipping', 'Auto Refill Schedules'],
      actionText: 'Browse Pet Shop',
    },
  ];

  const currentPillar = showcasePillars[activePillar];

  // Bento grid features
  const bentoFeatures = [
    { id: 'tracker',  title: 'Live GPS Radar',       eyebrow: 'Radar Telemetry',      color: '#10B981', icon: Radar,         desc: 'Sub-meter satellite tracking, safe perimeter geofencing, and smart biometric collar sensors.' },
    { id: 'ai',       title: 'Wellness AI',          eyebrow: 'AI Diagnostics',       color: '#3B82F6', icon: Activity,      desc: 'Instant multi-modal neural triage for skin, eye, dental, and mobility conditions.' },
    { id: 'vets',     title: 'Specialists',          eyebrow: 'Specialist Network',   color: '#F59E0B', icon: Stethoscope,   desc: 'In-clinic visits, surgery consultations, and HD teleconsultations with verified doctors.' },
    { id: 'food',     title: 'Blog & Nutrition',     eyebrow: 'Precision Diet',       color: '#EC4899', icon: BookOpen,      desc: 'Scientific calorie calculators, portion guides, and breed-specific feeding plans.' },
    { id: 'shop',     title: 'Pet Pharmacy',         eyebrow: 'Shop & Pharmacy',      color: '#8B5CF6', icon: ShoppingBag,   desc: 'Genuine prescription preventatives and specialty food with live order dispatch.' },
    { id: 'vaccines', title: 'Medical Passport',     eyebrow: 'Immunization',         color: '#06B6D4', icon: Syringe,       desc: 'Automated immunization schedules, rabies tracking, and calendar export.' },
    { id: 'tracker',  title: 'Hardware & GPS Radar', eyebrow: 'Smart Tracker Ecosystem', color: '#10B981', icon: Radar,         desc: 'Sub-meter multi-GNSS tracking, 85dB acoustic chime siren, geofence security perimeter, and BLE beacon pairing.' },
    { id: 'ai',       title: 'Clinical AI Diagnostics', eyebrow: 'Vision & Body Triage',  color: '#3B82F6', icon: Activity,      desc: 'Instant multi-modal neural triage for dermatological, ocular, dental, and mobility conditions with interactive body maps.' },
    { id: 'vets',     title: 'Veterinary Specialists', eyebrow: 'Specialist Network',     color: '#F59E0B', icon: Stethoscope,   desc: 'In-clinic appointments, surgical consultations, and 24/7 on-call HD teleconsultations with certified clinicians.' },
    { id: 'community', title: 'Amber Alert Recovery',  eyebrow: 'Community Safe Shield',  color: '#EF4444', icon: AlertTriangle, desc: 'Instant neighborhood missing pet broadcasts, live sighting map alerts, and direct guardian emergency contact.' },
    { id: 'vaccines', title: 'Digital Pet Passport',  eyebrow: 'Microchip & Biometrics', color: '#06B6D4', icon: ShieldCheck,   desc: 'Official ISO 11784 microchip registry, verified rabies immunity tracking, travel certifications, and QR lookup.' },
    { id: 'shop',     title: 'Pet Pharmacy & Care',   eyebrow: 'Shop & Express Dispatch', color: '#8B5CF6', icon: ShoppingBag,   desc: 'Genuine veterinary-grade preventatives, clinical diets, and smart tech accessories with 24h express dispatch.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', margin: '-24px -16px 0', width: 'calc(100% + 32px)', backgroundColor: '#000' }}>

      {/* ═══ HERO 1: UNIFIED SPATIAL HERO & COMPACT ECOSYSTEM ═══ */}
      <section style={{
        position: 'relative',
        padding: '44px 16px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% 12%, rgba(16,185,129,0.16) 0%, rgba(0,0,0,0) 65%), #000',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Title stage */}
        <div style={{ maxWidth: '780px', margin: '0 auto', zIndex: 10 }}>
          {/* Animated pill eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: 'rgba(16,185,129,0.14)',
              border: '1px solid rgba(16,185,129,0.28)',
              borderRadius: '999px',
              padding: '4px 12px 4px 8px',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#10B981',
                animation: 'pulseDot 2s ease-in-out infinite',
                display: 'inline-block',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#10B981', letterSpacing: '0.02em' }}>
                Pet Maya 2.0 — Now Live
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 4.4rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#FFF',
              lineHeight: 1.08,
              margin: '0 0 12px 0',
              wordBreak: 'break-word',
            }}
          >
            Titanium intelligence.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', color: '#A1A1A6', maxWidth: '560px', margin: '0 auto 22px', lineHeight: 1.5, padding: '0 10px' }}
          >
            Next-generation pet healthcare, live GPS radar, and clinical AI triage. All in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="apple-cta-group"
            style={{ justifyContent: 'center', marginBottom: '8px' }}
          >
            <button className="apple-btn-blue" onClick={() => openModal('auth')}>
              <span>Get Started</span>
            </button>
            <button className="apple-link-cta" onClick={handleTryDemo} style={{ color: '#FFF', opacity: 0.85 }}>
              <span>Explore Live Demo</span>
              <ChevronRight size={15} />
            </button>
          </motion.div>
        </div>

        {/* Ecosystem card overlay (Integrated cleanly with tight vertical margin) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            marginTop: '28px',
            width: 'calc(100% - 32px)',
            maxWidth: '880px',
            zIndex: 10,
          }}
        >
          <div style={{
            background: 'rgba(20,20,22,0.94)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px',
            padding: 'clamp(16px, 2.8vw, 24px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 30px rgba(16,185,129,0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: 'clamp(10px, 1.8vw, 16px)',
            textAlign: 'left',
          }}>
            {ecosystemFeatures.map((item) => (
              <motion.div
                key={`${item.id}-${item.title}`}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '5px 4px' }}
                onClick={() => handleFeatureAccess(item.id, item.title)}
              >
                <div style={{ width: 38, height: 38, borderRadius: '11px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                  <item.icon size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#FFFFFF', display: 'block', letterSpacing: '-0.01em', fontWeight: 600 }}>{item.title}</strong>
                  <span style={{ fontSize: '11px', color: '#86868B' }}>{item.subtitle}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ HERO 2: COMPACT INTERACTIVE PILLARS SHOWCASE ═══ */}
      <section style={{
        background: '#000',
        padding: '36px 16px 40px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '600px', height: '300px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(30,58,138,0.18) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* Switcher Tabs */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '999px',
            padding: '4px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {showcasePillars.map((p, idx) => {
              const isActive = activePillar === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePillar(idx)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: '999px',
                    border: 'none',
                    background: isActive ? p.bg : 'transparent',
                    color: isActive ? p.color : '#86868B',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <p.icon size={14} />
                  <span>{p.eyebrow}</span>
                </button>
              );
            })}
          </div>

          {/* Active Feature Showcase */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${currentPillar.border}`,
                borderRadius: '22px',
                padding: 'clamp(22px, 3.5vw, 32px)',
                boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 25px ${currentPillar.bg}`,
              }}
            >
              <span className="apple-hero-eyebrow" style={{ color: currentPillar.color, fontSize: 'clamp(11px, 2.5vw, 13px)', display: 'block', marginBottom: '8px' }}>
                {currentPillar.eyebrow}
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 4.5vw, 2.8rem)', fontWeight: 700, color: '#FFF', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
                {currentPillar.title}
              </h2>
              <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', color: '#A1A1A6', maxWidth: '540px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {currentPillar.subtitle}
              </p>

              {/* Badges row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '22px' }}>
                {currentPillar.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      color: '#D1D5DB',
                      fontWeight: 500,
                    }}
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleFeatureAccess(currentPillar.tabId, currentPillar.eyebrow)}
                className="apple-btn-blue"
                style={{
                  background: currentPillar.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  margin: '0 auto',
                }}
              >
                <span>{currentPillar.actionText}</span>
                <ChevronRight size={14} />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '28px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '24px', textAlign: 'center' }}>
          {[
            { value: '500+', label: 'Verified Vets' },
            { value: '50K+', label: 'Pet Families' },
            { value: '4.9★', label: 'App Rating' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
            >
              <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: '#FFF', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '12.5px', color: '#86868B', fontWeight: 500 }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ BENTO FEATURE GRID ═══ */}
      <section style={{ background: 'var(--bg)', padding: '44px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            style={{ textAlign: 'center', marginBottom: '28px' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Everything in one place
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.15 }}>
              Built for every pet parent.
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {bentoFeatures.map((item, idx) => (
              <motion.div
                key={`${item.id}-${idx}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.32, delay: (idx % 4) * 0.04 }}
                whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
                style={{
                  background: 'var(--surface-solid)',
                  border: '1px solid var(--border)',
                  borderRadius: '18px',
                  padding: '22px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.25s ease',
                  borderTop: `3px solid ${item.color}`,
                }}
                onClick={() => handleFeatureAccess(item.id, item.title)}
              >
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${item.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  <item.icon size={19} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: item.color, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {item.eyebrow}
                  </span>
                  <h3 style={{ fontSize: '16.5px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 5px', color: 'var(--text-main)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', color: item.color, fontWeight: 600 }}>
                    Explore <ChevronRight size={13} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF TESTIMONIALS ═══ */}
      <section style={{ background: 'var(--bg)', padding: '44px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            style={{ textAlign: 'center', marginBottom: '28px' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Trusted by thousands
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: '0 0 8px', lineHeight: 1.15 }}>
              Pet parents love it.
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>4.9 avg · 3,200+ reviews</span>
            </div>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              { name: 'Nafisa Rahman', role: 'Dog Parent · Dhaka', quote: 'The GPS collar alert saved my Golden Retriever Biscuit from crossing the boundary. Got the geofence alert within seconds. Life-changing.', icon: Radar, iconColor: '#10B981', stars: 5 },
              { name: 'Dr. Touhid Hossain', role: 'Veterinarian · Chittagong', quote: 'The AI triage tool is surprisingly accurate. It correctly flagged a secondary pyoderma on a Labrador photo a client sent before clinic visit.', icon: Stethoscope, iconColor: '#3B82F6', stars: 5 },
              { name: 'Meher Afroz', role: 'Cat Parent · Sylhet', quote: 'Our Persian cat Mia had conjunctivitis. I uploaded a photo, got the diagnosis plus the right doctor. Saved us so much panic and time.', icon: Heart, iconColor: '#EC4899', stars: 5 },
              { name: 'Tanvir Ahmed', role: 'Multi-Pet Owner · Rajshahi', quote: 'Managing 3 dogs vaccine schedules was chaotic. The Medical Passport feature keeps everything in one place with automatic calendar export.', icon: Activity, iconColor: '#F59E0B', stars: 5 },
              { name: 'Sabrina Islam', role: 'Rabbit Parent · Khulna', quote: 'I did not expect rabbit-specific content but the AI correctly identified ear mite signs and gave breed-appropriate advice. Excellent app.', icon: Sparkles, iconColor: '#8B5CF6', stars: 4 },
              { name: 'Kamrul Hassan', role: 'Vet Clinic Owner · Dhaka', quote: 'We registered our clinic and started receiving teleconsultation bookings within the first week. The platform quality matches international standards.', icon: Building2, iconColor: '#06B6D4', stars: 5 },
            ].map((t, idx) => {
              const IconComponent = t.icon;
              return (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10px' }}
                  transition={{ duration: 0.3, delay: (idx % 3) * 0.04 }}
                  style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {Array(t.stars).fill(0).map((_, i) => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
                    {Array(5 - t.stars).fill(0).map((_, i) => <Star key={`e${i}`} size={12} fill="none" color="#86868B" />)}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>"{t.quote}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `${t.iconColor}18`,
                      color: t.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '12.5px', display: 'block', color: 'var(--text-main)' }}>{t.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.role}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TECHNOLOGY SPECS ═══ */}
      <section style={{ background: '#000', padding: '44px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            style={{ textAlign: 'center', marginBottom: '28px' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: '#3B82F6', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Under the hood</span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#FFF', margin: 0, lineHeight: 1.15 }}>Titanium engineering.</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
            {[
              { icon: Radar, color: '#10B981', title: 'GPS Accuracy', spec: '< 2 meter', detail: 'Multi-constellation GNSS (GPS+GLONASS+Galileo) with Kalman filtering' },
              { icon: Radar, color: '#10B981', title: 'Hardware Ecosystem', spec: 'Sub-meter GNSS', detail: 'Smart GPS collars, BLE beacons, 85dB acoustic siren & live telemetry' },
              { icon: Sparkles, color: '#3B82F6', title: 'AI Model', spec: 'Clinical V3.4', detail: '50,000+ veterinary case training set, multi-modal vision CNN architecture' },
              { icon: ShieldCheck, color: '#F59E0B', title: 'Data Security', spec: 'AES-256', detail: 'End-to-end encrypted health records with Firebase Firestore backend' },
              { icon: Bell, color: '#EC4899', title: 'Alert Latency', spec: '< 3 seconds', detail: 'Real-time geofence breach push notification via FCM cloud messaging' },
              { icon: ShieldCheck, color: '#06B6D4', title: 'Digital Passport', spec: 'ISO 11784', detail: 'Encrypted microchip registry, rabies verification & biometric recovery QR' },
              { icon: AlertTriangle, color: '#EF4444', title: 'Amber Alert Net', spec: '< 3 seconds', detail: 'Real-time neighborhood missing pet broadcasts & geofence perimeter alarms' },
              { icon: Activity, color: '#8B5CF6', title: 'Biometrics', spec: '8 sensors', detail: 'Heart rate, activity, temperature, humidity, orientation, steps, GPS, battery' },
              { icon: Calendar, color: '#10B981', title: 'Cloud Reliability', spec: '99.95% SLA', detail: 'Firebase cloud infrastructure with automatic regional failover' },
            ].map((spec, idx) => (
              <motion.div
                key={spec.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.3, delay: (idx % 3) * 0.04 }}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${spec.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: spec.color }}>
                  <spec.icon size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: spec.color, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>{spec.title}</span>
                  <strong style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>{spec.spec}</strong>
                  <p style={{ fontSize: '11.5px', color: '#86868B', margin: '4px 0 0', lineHeight: 1.5 }}>{spec.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ACCORDION ═══ */}
      <FAQSection />

      {/* ═══ MOBILE DOWNLOADS ═══ */}
      <section id="mobile-downloads" style={{ background: '#000', padding: '44px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Apple & Android Ecosystem
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#FFF', margin: '0 0 10px', lineHeight: 1.15 }}>
            Connected seamlessly.
          </h2>
          <p style={{ fontSize: '14.5px', color: '#86868B', maxWidth: '580px', margin: '0 auto 28px', lineHeight: 1.5 }}>
            Full Bluetooth collar telemetry, background boundary alarms, push notifications, and camera triage on your phone.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', maxWidth: '700px', margin: '0 auto' }}>
            {/* iOS */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '22px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={19} color="#0071E3" />
                <strong style={{ fontSize: '15.5px', fontWeight: 600, color: '#FFF' }}>iPhone & iPad</strong>
              </div>
              <p style={{ fontSize: '12.5px', color: '#86868B', margin: 0, lineHeight: 1.5 }}>
                Install via Wireless OTA Manifest or download the <strong style={{ color: '#A1A1A6' }}>.ipa</strong> package for AltStore, Sideloadly, or TrollStore.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a
                  href="itms-services://?action=download-manifest&url=https://www.petmaya.app/manifest.plist"
                  className="apple-btn-blue"
                  style={{ justifyContent: 'center', textDecoration: 'none', padding: '9px 16px', fontSize: '13px' }}
                >
                  <Download size={14} />
                  <span>1-Click Install on iPhone</span>
                </a>
                <a href="https://github.com/sadikmahmudadive/Pet-Maya/releases" target="_blank" rel="noreferrer"
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '12.5px', color: '#86868B' }}
                >
                  <span>Download .IPA</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Android */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '22px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={19} color="#10B981" />
                <strong style={{ fontSize: '15.5px', fontWeight: 600, color: '#FFF' }}>Android</strong>
              </div>
              <p style={{ fontSize: '12.5px', color: '#86868B', margin: 0, lineHeight: 1.5 }}>
                Get the official app on Google Play Store or download the universal Android APK release binary.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a
                  href="https://play.google.com/store/apps/details?id=com.vertexhand.petmaya"
                  target="_blank" rel="noreferrer"
                  className="apple-btn-blue"
                  style={{ background: '#10B981', justifyContent: 'center', textDecoration: 'none', padding: '9px 16px', fontSize: '13px' }}
                >
                  <Download size={14} />
                  <span>Get on Google Play</span>
                </a>
                <a href="https://github.com/sadikmahmudadive/Pet-Maya/releases" target="_blank" rel="noreferrer"
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '12.5px', color: '#86868B' }}
                >
                  <span>Download APK</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER (MINIMAL 3-COL) ═══ */}
      <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '32px 20px 24px', color: 'var(--text-muted)', fontSize: '12px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Brand + cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, auto)', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {/* Brand blurb */}
            <div style={{ gridColumn: '1', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 700 }}>Pet Maya</strong>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Next-generation pet healthcare platform for modern pet parents.
              </p>
            </div>

            {/* Services */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>Services</strong>
              {[
                ['shop', 'Pet Shop'], ['tracker', 'Tracker'], ['ai', 'Wellness'],
                ['vets', 'Specialists'], ['community', 'Community'], ['food', 'Blog'], ['vaccines', 'Reminders'],
              ].map(([id, label]) => (
                <button key={id} onClick={() => handleFeatureAccess(id, label)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Account */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>Account</strong>
              <button onClick={() => openModal('auth')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >Sign In</button>
              <button onClick={handleTryDemo} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >Guest Demo</button>
            </div>

            {/* Legal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>Legal</strong>
              {[
                ['/privacy_policy.html', 'Privacy Policy'],
                ['/terms_of_service.html', 'Terms of Use'],
                ['/about.html', 'About'],
                ['https://github.com/sadikmahmudadive/Pet-Maya', 'GitHub'],
              ].map(([href, label]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright row */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Copyright © 2026 Pet Maya Inc. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '14px' }}>
              <a href="/privacy_policy.html" target="_blank" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
              <a href="/terms_of_service.html" target="_blank" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
              <a href="/sitemap.xml" target="_blank" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
