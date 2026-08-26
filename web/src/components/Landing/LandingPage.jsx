import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Radar, Activity, Utensils, Stethoscope, ShoppingBag, Bell, 
  Download, Smartphone, ChevronRight, ShieldCheck, ExternalLink,
  Sparkles, Play, Heart, BookOpen, DollarSign, MapPin, MessageCircle, Calendar
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

  // --- Scroll Animations: Hero 1 (Spatial Computing Reveal) ---
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgressRaw } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  // Snappy responsive spring for instant scroll response
  const heroProgress = useSpring(heroProgressRaw, { stiffness: 260, damping: 24, restDelta: 0.001 });

  const heroOpacity = useTransform(heroProgress, [0, 0.22], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 0.22], [1, 1.06]);
  const heroBlur = useTransform(heroProgress, [0, 0.22], ["blur(0px)", "blur(8px)"]);
  const heroY = useTransform(heroProgress, [0, 0.22], [0, -40]);

  // Ecosystem grid comes in quickly as hero text fades
  const gridOpacity = useTransform(heroProgress, [0.12, 0.38], [0, 1]);
  const gridY = useTransform(heroProgress, [0.12, 0.38], [40, 0]);
  const gridScale = useTransform(heroProgress, [0.12, 0.38], [0.96, 1]);

  // --- Scroll Animations: Hero 2 (Sticky Showcase) ---
  const showcaseRef = useRef(null);
  const { scrollYProgress: showcaseProgressRaw } = useScroll({
    target: showcaseRef,
    offset: ["start start", "end end"]
  });
  const showcaseProgress = useSpring(showcaseProgressRaw, { stiffness: 260, damping: 24 });
  
  // Fast, engaging cross-fades without long tedious pauses
  const text1Opacity = useTransform(showcaseProgress, [0, 0.18, 0.34], [0, 1, 0]);
  const text2Opacity = useTransform(showcaseProgress, [0.34, 0.52, 0.68], [0, 1, 0]);
  const text3Opacity = useTransform(showcaseProgress, [0.68, 0.84, 1], [0, 1, 0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', margin: '-24px -16px 0', width: 'calc(100% + 32px)', backgroundColor: '#000' }}>
      
      {/* ══════════════════════════════════════════════════════
          HERO 1: SPATIAL REVEAL (VISION PRO STYLE)
          ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ height: '115vh', position: 'relative' }}>
        <div style={{ 
          position: 'sticky', 
          top: 0, 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '0 20px'
        }}>
          {/* Main Title that scales up and blurs out */}
          <motion.div style={{ opacity: heroOpacity, scale: heroScale, filter: heroBlur, y: heroY, textAlign: 'center', zIndex: 10 }}>
            <motion.span 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              className="apple-hero-eyebrow" 
              style={{ color: 'var(--primary)', marginBottom: '16px', display: 'block' }}
            >
              Pet Maya 2.0
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#FFF', lineHeight: 1.1, margin: '0 0 24px 0' }}
            >
              Titanium <br/>intelligence.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: '#A1A1A6', maxWidth: '600px', margin: '0 auto 40px' }}
            >
              Next-generation pet healthcare, live GPS radar, and clinical AI triage. All in one place.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="apple-cta-group" 
              style={{ justifyContent: 'center' }}
            >
              <button className="apple-btn-blue" onClick={() => openModal('auth')}>
                <span>Get Started</span>
              </button>
              <button className="apple-link-cta" onClick={handleTryDemo} style={{ color: '#FFF' }}>
                <span>Explore Live Demo</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          </motion.div>

          {/* Ecosystem Visual that zooms in from below */}
          <motion.div 
            style={{ 
              position: 'absolute', 
              opacity: gridOpacity, 
              y: gridY,
              scale: gridScale,
              width: '100%',
              maxWidth: '920px',
              zIndex: 20
            }}
          >
            <div style={{
              background: 'rgba(28, 28, 30, 0.8)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
              textAlign: 'left'
            }}>
              {/* Feature Cards with hover effects */}
              {[
                { id: 'tracker', icon: Radar, title: 'Tracker', subtitle: 'Live GPS location', color: '#10B981', bg: 'rgba(16, 185, 129, 0.18)' },
                { id: 'ai', icon: Activity, title: 'Wellness', subtitle: 'AI health scan', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.18)' },
                { id: 'vets', icon: Stethoscope, title: 'Specialists', subtitle: '500+ Verified clinicians', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)' },
                { id: 'shop', icon: ShoppingBag, title: 'Pet Shop', subtitle: 'Nutrition & essentials', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.18)' },
                { id: 'community', icon: MessageCircle, title: 'Community', subtitle: 'Pet parent network', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.18)' },
                { id: 'food', icon: BookOpen, title: 'Blog', subtitle: 'Expert advice & diet', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.18)' }
              ].map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                  onClick={() => handleFeatureAccess(item.id, item.title)}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                    <item.icon size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '15.5px', color: '#FFFFFF', display: 'block', letterSpacing: '-0.01em' }}>{item.title}</strong>
                    <span style={{ fontSize: '12.5px', color: '#86868B' }}>{item.subtitle}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HERO 2: STICKY SHOWCASE (VISION PRO HARDWARE SCROLL)
          ══════════════════════════════════════════════════════ */}
      <section ref={showcaseRef} style={{ height: '130vh', position: 'relative', background: '#000' }}>
        <div style={{ 
          position: 'sticky', 
          top: 0, 
          height: '100vh', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Background Image / Hardware Video placeholder */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(30,40,60,0.4) 0%, #000 70%)',
            zIndex: 1
          }} />

          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '800px', padding: '0 20px', textAlign: 'center' }}>
            
            {/* Text 1: Tracker */}
            <motion.div style={{ position: 'absolute', width: '100%', left: 0, opacity: text1Opacity, transform: 'translateY(-50%)' }}>
              <span className="apple-hero-eyebrow" style={{ color: 'var(--primary)' }}>Pet Radar & Smart Collar</span>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, color: '#FFF', margin: '16px 0' }}>
                Wonderfully fast. <br /> Astoundingly precise.
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#A1A1A6' }}>
                Multi-constellation GPS tracking with geofence breach alarms.
              </p>
            </motion.div>

            {/* Text 2: AI Vision */}
            <motion.div style={{ position: 'absolute', width: '100%', left: 0, opacity: text2Opacity, transform: 'translateY(-50%)' }}>
              <span className="apple-hero-eyebrow" style={{ color: '#3B82F6' }}>AI Health Vision</span>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, color: '#FFF', margin: '16px 0' }}>
                Clinical intelligence. <br /> Right on your camera.
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#A1A1A6' }}>
                Instant severity analysis and first aid advice from a photo.
              </p>
            </motion.div>

            {/* Text 3: Pet Shop */}
            <motion.div style={{ position: 'absolute', width: '100%', left: 0, opacity: text3Opacity, transform: 'translateY(-50%)' }}>
              <span className="apple-hero-eyebrow" style={{ color: '#F59E0B' }}>Pet Pharmacy</span>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, color: '#FFF', margin: '16px 0' }}>
                Everything they need. <br /> Delivered today.
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#A1A1A6' }}>
                Genuine prescription preventatives and specialty food.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BENTO GRID (Animated Fade-In)
          ══════════════════════════════════════════════════════ */}
      <section className="apple-bento-grid" style={{ padding: '60px 20px', background: 'var(--surface-solid)' }}>
        {[
          { id: 'vets', title: 'Specialists', eyebrow: 'Specialist Network', color: '#F59E0B', desc: 'In-clinic visits, surgery consultations, and HD teleconsultations with verified doctors.' },
          { id: 'food', title: 'Blog & Nutrition', eyebrow: 'Precision Diet', color: '#EC4899', desc: 'Scientific RER/MER calorie calculators, dry/wet portion splits, and breed guides.' },
          { id: 'shop', title: 'Pet Shop', eyebrow: 'Pharmacy & Store', color: '#6366F1', desc: 'Genuine prescription flea/tick preventatives and specialty food with live order dispatch.' },
          { id: 'vaccines', title: 'Reminders', eyebrow: 'Medical Passport', color: '#10B981', desc: 'Automated immunization schedules, rabies tracking, and 1-click export to Apple Calendar.' }
        ].map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            className="apple-promo-card"
          >
            <span className="apple-card-eyebrow" style={{ color: item.color }}>{item.eyebrow}</span>
            <h3 className="apple-card-title">{item.title}</h3>
            <p className="apple-card-desc">{item.desc}</p>
            <button className="apple-link-cta" onClick={() => handleFeatureAccess(item.id, item.title)}>
              <span>Explore {item.title.toLowerCase()}</span>
              <ChevronRight size={15} />
            </button>
          </motion.div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════════════
          MOBILE DOWNLOADS
          ══════════════════════════════════════════════════════ */}
      <section id="mobile-downloads" style={{ maxWidth: '1240px', margin: '30px auto', padding: '0 16px', width: '100%' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="apple-promo-card" 
          style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--surface-solid)' }}
        >
          <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Apple & Android Ecosystem</span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '14px' }}>
            Connected seamlessly.
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 36px', lineHeight: 1.5 }}>
            Enjoy full Bluetooth collar telemetry, background boundary alarms, push notifications, and camera triage on your phone.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', width: '100%', maxWidth: '980px', margin: '0 auto' }}>
            {/* iOS Column */}
            <div style={{ background: 'var(--surface-alt)', padding: '28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={22} color="#0071E3" />
                <strong style={{ fontSize: '17px', fontWeight: 600 }}>iPhone & iPad</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Install directly via Wireless OTA Manifest or download the <strong>.ipa</strong> package for AltStore, Sideloadly, TrollStore or Scarlet.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a 
                  href="itms-services://?action=download-manifest&url=https://www.petmaya.app/manifest.plist" 
                  className="apple-btn-blue" 
                  style={{ justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Download size={15} />
                  <span>1-Click Install on iPhone</span>
                </a>
                <a 
                  href="https://github.com/sadikmahmudadive/Pet-Maya/releases" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '13px' }}
                >
                  <span>Download .IPA Package</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Android Column */}
            <div style={{ background: 'var(--surface-alt)', padding: '28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={22} color="#10B981" />
                <strong style={{ fontSize: '17px', fontWeight: 600 }}>Android</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Get the official application on Google Play Store or download the universal Android APK release binary.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.vertexhand.petmaya" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="apple-btn-blue" 
                  style={{ background: '#10B981', justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Download size={15} />
                  <span>Get on Google Play</span>
                </a>
                <a 
                  href="https://github.com/sadikmahmudadive/Pet-Maya/releases" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="apple-link-cta"
                  style={{ justifyContent: 'center', fontSize: '13px', color: '#10B981' }}
                >
                  <span>Download APK Binary</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="apple-footer-wrap">
        <div className="apple-footer-inner">
          <div className="apple-footer-grid">
            <div className="apple-footer-col">
              <h5>Explore Services</h5>
              <ul>
                <li><button onClick={() => handleFeatureAccess('shop', 'Pet Shop')}>Pet Shop</button></li>
                <li><button onClick={() => handleFeatureAccess('tracker', 'Tracker')}>Tracker</button></li>
                <li><button onClick={() => handleFeatureAccess('ai', 'Wellness')}>Wellness</button></li>
                <li><button onClick={() => handleFeatureAccess('vets', 'Specialists')}>Specialists</button></li>
                <li><button onClick={() => handleFeatureAccess('community', 'Community')}>Community</button></li>
                <li><button onClick={() => handleFeatureAccess('food', 'Blog')}>Blog</button></li>
                <li><button onClick={() => handleFeatureAccess('vaccines', 'Reminders')}>Reminders</button></li>
              </ul>
            </div>

            <div className="apple-footer-col">
              <h5>Account &amp; Pet EHR</h5>
              <ul>
                <li><button onClick={() => openModal('auth')}>Sign In to Account</button></li>
                <li><button onClick={handleTryDemo}>Guest Demo Console</button></li>
                <li><button onClick={() => handleFeatureAccess('vaccines', 'Reminders')}>Reminders</button></li>
                <li><button onClick={() => handleFeatureAccess('shop', 'Pet Shop')}>Pet Shop</button></li>
              </ul>
            </div>

            <div className="apple-footer-col">
              <h5>For Veterinarians</h5>
              <ul>
                <li><button onClick={() => handleFeatureAccess('vets', 'Clinician Network')}>Clinician Verification</button></li>
                <li><button onClick={() => openModal('booking')}>Telehealth Guidelines</button></li>
              </ul>
            </div>

            <div className="apple-footer-col">
              <h5>Pet Maya Values</h5>
              <ul>
                <li><a href="/privacy_policy.html" target="_blank">Privacy First</a></li>
                <li><a href="/terms_of_service.html" target="_blank">Terms of Service</a></li>
                <li><a href="/about.html" target="_blank">About Pet Maya</a></li>
                <li><a href="https://github.com/sadikmahmudadive/Pet-Maya" target="_blank" rel="noreferrer">Open Source GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="apple-footer-legal">
            <div>
              Copyright © 2026 Pet Maya Inc. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="/privacy_policy.html" target="_blank">Privacy Policy</a>
              <span>|</span>
              <a href="/terms_of_service.html" target="_blank">Terms of Use</a>
              <span>|</span>
              <a href="/about.html" target="_blank">Legal</a>
              <span>|</span>
              <a href="/sitemap.xml" target="_blank">Site Map</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
