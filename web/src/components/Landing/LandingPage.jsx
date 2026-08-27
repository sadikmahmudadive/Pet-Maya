import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Radar, Activity, Utensils, Stethoscope, ShoppingBag, Bell, 
  Download, Smartphone, ChevronRight, ShieldCheck, ExternalLink,
  Sparkles, Heart, BookOpen, MapPin, MessageCircle, Calendar, Syringe
} from 'lucide-react';

export default function LandingPage() {
  const { setActiveTab, openModal, showToast } = useApp();
  const { currentUser, loginAsGuest } = useAuth();

  const handleTryDemo = () => {
    loginAsGuest('Pet Owner');
    setActiveTab('dashboard');
    showToast('🚀 Welcome to Pet Maya Demo Dashboard!', 'success');
  };

  const handleFeatureAccess = (tabId, featureName) => {
    if (currentUser) {
      setActiveTab(tabId);
    } else {
      openModal('auth');
      showToast(`🔒 Please sign in to access ${featureName}`, 'info');
    }
  };

  // --- Scroll Animations: Hero 1 ---
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgressRaw } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end']
  });
  const heroProgress = useSpring(heroProgressRaw, { stiffness: 220, damping: 26, restDelta: 0.001 });

  const heroOpacity = useTransform(heroProgress, [0, 0.22, 0.35], [1, 1, 0]);
  const heroScale  = useTransform(heroProgress, [0, 0.35], [1, 1.06]);
  const heroBlur   = useTransform(heroProgress, [0.18, 0.35], ['blur(0px)', 'blur(14px)']);
  const heroY      = useTransform(heroProgress, [0, 0.35], [0, -50]);
  const heroPointerEvents = useTransform(heroProgress, (v) => v > 0.32 ? 'none' : 'auto');

  const gridOpacity = useTransform(heroProgress, [0.36, 0.48, 0.82, 0.96], [0, 1, 1, 0]);
  const gridY       = useTransform(heroProgress, [0.36, 0.48, 0.82, 0.96], [50, 0, 0, -40]);
  const gridScale   = useTransform(heroProgress, [0.36, 0.48, 0.82, 0.96], [0.92, 1, 1, 0.96]);

  // --- Scroll Animations: Hero 2 ---
  const showcaseRef = useRef(null);
  const { scrollYProgress: showcaseProgressRaw } = useScroll({
    target: showcaseRef,
    offset: ['start start', 'end end']
  });
  const showcaseProgress = useSpring(showcaseProgressRaw, { stiffness: 220, damping: 26 });

  const text1Opacity = useTransform(showcaseProgress, [0.05, 0.16, 0.28, 0.38], [0, 1, 1, 0]);
  const text2Opacity = useTransform(showcaseProgress, [0.38, 0.49, 0.61, 0.71], [0, 1, 1, 0]);
  const text3Opacity = useTransform(showcaseProgress, [0.71, 0.82, 0.93, 1.00], [0, 1, 1, 0]);

  // Feature items for ecosystem card
  const ecosystemFeatures = [
    { id: 'tracker',   icon: Radar,         title: 'Tracker',     subtitle: 'Live GPS location',     color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
    { id: 'ai',        icon: Activity,      title: 'Wellness',    subtitle: 'AI health scan',        color: '#3B82F6', bg: 'rgba(59,130,246,0.18)' },
    { id: 'vets',      icon: Stethoscope,   title: 'Specialists', subtitle: '500+ Verified doctors', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)' },
    { id: 'shop',      icon: ShoppingBag,   title: 'Pet Shop',    subtitle: 'Nutrition & essentials', color: '#8B5CF6', bg: 'rgba(139,92,246,0.18)' },
    { id: 'community', icon: MessageCircle, title: 'Community',   subtitle: 'Pet parent network',    color: '#06B6D4', bg: 'rgba(6,182,212,0.18)' },
    { id: 'food',      icon: BookOpen,      title: 'Blog',        subtitle: 'Expert advice & diet',  color: '#EC4899', bg: 'rgba(236,72,153,0.18)' },
  ];

  // Bento grid features
  const bentoFeatures = [
    { id: 'tracker',  title: 'Live GPS Radar',       eyebrow: 'Radar Telemetry',      color: '#10B981', icon: Radar,         desc: 'Sub-meter satellite tracking, safe perimeter geofencing, and smart biometric collar sensors.' },
    { id: 'ai',       title: 'Wellness AI',          eyebrow: 'AI Diagnostics',       color: '#3B82F6', icon: Activity,      desc: 'Instant multi-modal neural triage for skin, eye, dental, and mobility conditions.' },
    { id: 'vets',     title: 'Specialists',          eyebrow: 'Specialist Network',   color: '#F59E0B', icon: Stethoscope,   desc: 'In-clinic visits, surgery consultations, and HD teleconsultations with verified doctors.' },
    { id: 'food',     title: 'Blog & Nutrition',     eyebrow: 'Precision Diet',       color: '#EC4899', icon: BookOpen,      desc: 'Scientific calorie calculators, portion guides, and breed-specific feeding plans.' },
    { id: 'shop',     title: 'Pet Pharmacy',         eyebrow: 'Shop & Pharmacy',      color: '#8B5CF6', icon: ShoppingBag,   desc: 'Genuine prescription preventatives and specialty food with live order dispatch.' },
    { id: 'vaccines', title: 'Medical Passport',     eyebrow: 'Immunization',         color: '#06B6D4', icon: Syringe,       desc: 'Automated immunization schedules, rabies tracking, and calendar export.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', margin: '-24px -16px 0', width: 'calc(100% + 32px)', backgroundColor: '#000' }}>

      {/* ═══ HERO 1: SPATIAL REVEAL ═══ */}
      <section ref={heroRef} style={{ height: '240vh', position: 'relative' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '0 16px',
          boxSizing: 'border-box'
        }}>
          {/* Title stage */}
          <motion.div style={{
            opacity: heroOpacity,
            scale: heroScale,
            filter: heroBlur,
            y: heroY,
            pointerEvents: heroPointerEvents,
            textAlign: 'center',
            zIndex: 10,
            maxWidth: '780px',
            padding: '0 16px'
          }}>
            {/* Animated pill eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: 'rgba(16,185,129,0.14)',
                border: '1px solid rgba(16,185,129,0.28)',
                borderRadius: '999px',
                padding: '5px 14px 5px 8px',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#10B981',
                  animation: 'pulseDot 2s ease-in-out infinite',
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', letterSpacing: '0.02em' }}>
                  Pet Maya 2.0 — Now Live
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{
                fontSize: 'clamp(2.2rem, 7.5vw, 5.2rem)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: '#FFF',
                lineHeight: 1.08,
                margin: '0 0 18px 0',
                wordBreak: 'break-word',
              }}
            >
              Titanium<br className="hide-mobile" /> intelligence.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              style={{ fontSize: 'clamp(1rem, 3.2vw, 1.3rem)', color: '#A1A1A6', maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.5, padding: '0 10px' }}
            >
              Next-generation pet healthcare, live GPS radar, and clinical AI triage. All in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.24, duration: 0.32 }}
              className="apple-cta-group"
              style={{ justifyContent: 'center' }}
            >
              <button className="apple-btn-blue" onClick={() => openModal('auth')}>
                <span>Get Started</span>
              </button>
              <button className="apple-link-cta" onClick={handleTryDemo} style={{ color: '#FFF', opacity: 0.85 }}>
                <span>Explore Live Demo</span>
                <ChevronRight size={15} />
              </button>
            </motion.div>
          </motion.div>

          {/* Ecosystem card overlay */}
          <motion.div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            translateY: gridY,
            opacity: gridOpacity,
            scale: gridScale,
            width: 'calc(100% - 32px)',
            maxWidth: '880px',
            zIndex: 20,
          }}>
            <div style={{
              background: 'rgba(20,20,22,0.94)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '26px',
              padding: 'clamp(18px, 3.5vw, 28px)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 'clamp(12px, 2.5vw, 20px)',
              textAlign: 'left',
            }}>
              {ecosystemFeatures.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 0' }}
                  onClick={() => handleFeatureAccess(item.id, item.title)}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#FFFFFF', display: 'block', letterSpacing: '-0.01em', fontWeight: 600 }}>{item.title}</strong>
                    <span style={{ fontSize: '11.5px', color: '#86868B' }}>{item.subtitle}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ HERO 2: STICKY SHOWCASE ═══ */}
      <section ref={showcaseRef} style={{ height: '280vh', position: 'relative', background: '#000' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            width: '100%', height: '100%',
            background: 'radial-gradient(circle at center, rgba(30,40,60,0.35) 0%, #000 70%)',
            zIndex: 1,
          }} />

          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '760px', padding: '0 16px', textAlign: 'center', boxSizing: 'border-box' }}>

            {/* Text 1: Tracker */}
            <motion.div style={{ position: 'absolute', width: '100%', left: 0, right: 0, padding: '0 16px', boxSizing: 'border-box', opacity: text1Opacity, transform: 'translateY(-50%)' }}>
              <span className="apple-hero-eyebrow" style={{ color: 'var(--primary)', fontSize: 'clamp(11px, 3vw, 13.5px)' }}>
                Pet Radar & Smart Collar
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 6vw, 3.6rem)', fontWeight: 700, color: '#FFF', margin: '12px 0 14px', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
                Wonderfully fast.<br className="hide-mobile" /> Astoundingly precise.
              </h2>
              <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.2rem)', color: '#A1A1A6', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
                Multi-constellation GPS tracking with geofence breach alarms.
              </p>
            </motion.div>

            {/* Text 2: AI Vision */}
            <motion.div style={{ position: 'absolute', width: '100%', left: 0, right: 0, padding: '0 16px', boxSizing: 'border-box', opacity: text2Opacity, transform: 'translateY(-50%)' }}>
              <span className="apple-hero-eyebrow" style={{ color: '#3B82F6', fontSize: 'clamp(11px, 3vw, 13.5px)' }}>
                AI Health Vision
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 6vw, 3.6rem)', fontWeight: 700, color: '#FFF', margin: '12px 0 14px', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
                Clinical intelligence.<br className="hide-mobile" /> Right on your camera.
              </h2>
              <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.2rem)', color: '#A1A1A6', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
                Instant severity analysis and first aid advice from a photo.
              </p>
            </motion.div>

            {/* Text 3: Pet Shop */}
            <motion.div style={{ position: 'absolute', width: '100%', left: 0, right: 0, padding: '0 16px', boxSizing: 'border-box', opacity: text3Opacity, transform: 'translateY(-50%)' }}>
              <span className="apple-hero-eyebrow" style={{ color: '#F59E0B', fontSize: 'clamp(11px, 3vw, 13.5px)' }}>
                Pet Pharmacy
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 6vw, 3.6rem)', fontWeight: 700, color: '#FFF', margin: '12px 0 14px', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
                Everything they need.<br className="hide-mobile" /> Delivered today.
              </h2>
              <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.2rem)', color: '#A1A1A6', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
                Genuine prescription preventatives and specialty food.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '44px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '32px', textAlign: 'center' }}>
          {[
            { value: '500+', label: 'Verified Vets' },
            { value: '50K+', label: 'Pet Families' },
            { value: '4.9★', label: 'App Rating' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <span style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#FFF', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '13px', color: '#86868B', fontWeight: 500 }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ BENTO FEATURE GRID ═══ */}
      <section style={{ background: 'var(--bg)', padding: '64px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', marginBottom: '40px' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              Everything in one place
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.15 }}>
              Built for every pet parent.
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {bentoFeatures.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-15px' }}
                transition={{ duration: 0.38, delay: idx * 0.05 }}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                style={{
                  background: 'var(--surface-solid)',
                  border: '1px solid var(--border)',
                  borderRadius: '22px',
                  padding: '28px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.25s ease',
                  borderTop: `3px solid ${item.color}`,
                }}
                onClick={() => handleFeatureAccess(item.id, item.title)}
              >
                <div style={{ width: 44, height: 44, borderRadius: '14px', background: `${item.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  <item.icon size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.06em', color: item.color, textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                    {item.eyebrow}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--text-main)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', color: item.color, fontWeight: 600 }}>
                    Explore <ChevronRight size={14} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MOBILE DOWNLOADS ═══ */}
      <section id="mobile-downloads" style={{ background: '#000', padding: '64px 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
            Apple & Android Ecosystem
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#FFF', margin: '0 0 14px', lineHeight: 1.15 }}>
            Connected seamlessly.
          </h2>
          <p style={{ fontSize: '16px', color: '#86868B', maxWidth: '580px', margin: '0 auto 40px', lineHeight: 1.5 }}>
            Full Bluetooth collar telemetry, background boundary alarms, push notifications, and camera triage on your phone.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
            {/* iOS */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '26px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={20} color="#0071E3" />
                <strong style={{ fontSize: '16px', fontWeight: 600, color: '#FFF' }}>iPhone & iPad</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#86868B', margin: 0, lineHeight: 1.5 }}>
                Install via Wireless OTA Manifest or download the <strong style={{ color: '#A1A1A6' }}>.ipa</strong> package for AltStore, Sideloadly, or TrollStore.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a
                  href="itms-services://?action=download-manifest&url=https://www.petmaya.app/manifest.plist"
                  className="apple-btn-blue"
                  style={{ justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Download size={14} />
                  <span>1-Click Install on iPhone</span>
                </a>
                <a href="https://github.com/sadikmahmudadive/Pet-Maya/releases" target="_blank" rel="noreferrer"
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '13px', color: '#86868B' }}
                >
                  <span>Download .IPA</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Android */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '26px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={20} color="#10B981" />
                <strong style={{ fontSize: '16px', fontWeight: 600, color: '#FFF' }}>Android</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#86868B', margin: 0, lineHeight: 1.5 }}>
                Get the official app on Google Play Store or download the universal Android APK release binary.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a
                  href="https://play.google.com/store/apps/details?id=com.vertexhand.petmaya"
                  target="_blank" rel="noreferrer"
                  className="apple-btn-blue"
                  style={{ background: '#10B981', justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Download size={14} />
                  <span>Get on Google Play</span>
                </a>
                <a href="https://github.com/sadikmahmudadive/Pet-Maya/releases" target="_blank" rel="noreferrer"
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '13px', color: '#86868B' }}
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
      <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '40px 20px 28px', color: 'var(--text-muted)', fontSize: '12px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Brand + cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, auto)', gap: '28px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {/* Brand blurb */}
            <div style={{ gridColumn: '1', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 700 }}>Pet Maya</strong>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                Next-generation pet healthcare platform for modern pet parents.
              </p>
            </div>

            {/* Services */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
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
