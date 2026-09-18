import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Search, 
  ShoppingBag, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldCheck, 
  PlayCircle 
} from 'lucide-react';

export default function AuthPage({ initialMode = 'signin', onNavigate }) {
  const { showToast, openModal, cart } = useApp();
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginAsGuest, currentUser } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('tanzim@petmaya.app');
  const [microchip, setMicrochip] = useState('');
  const [password, setPassword] = useState('calmclinical2025!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleRoute = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        showToast('Signed in to Health Vault', 'success');
        handleRoute('dashboard');
      } else {
        await signupWithEmail(name || 'Pet Guardian', email, password);
        showToast('Guardian registry created successfully! Welcome to Pet Maya.', 'success');
        handleRoute('dashboard');
      }
    } catch (err) {
      console.warn('Auth error:', err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      showToast('Signed in via Google Sovereign Vault', 'success');
      handleRoute('dashboard');
    } catch (err) {
      console.warn('Google auth error:', err);
      setError('Google authentication could not be completed.');
      showToast('Google authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = () => {
    showToast('Apple Sign-In is configured for iOS Native / Safari client.', 'info');
  };

  const handleDemoAccess = () => {
    loginAsGuest('Pet Owner');
    showToast('Signed in as Guest Guardian (Milo\'s Profile)', 'success');
    handleRoute('dashboard');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your registered clinical email.', 'error');
      return;
    }
    showToast(`Password reset dossier dispatched to ${email}`, 'success');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#FDF8F5',
      color: '#160F0C',
      fontFamily: 'var(--font-body)'
    }}>
      {/* ── TOP ANNOUNCEMENT PROTOCOL TICKER ── */}
      <div style={{
        width: '100%',
        backgroundColor: '#F8F3EF',
        borderBottom: '1px solid #DED9D6',
        padding: '8px 16px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#707973'
      }}>
        WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE WITH EVERY BESPOKE WELLNESS PLAN.
      </div>

      {/* ── TOP NAVIGATION BAR ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(253, 248, 245, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #DED9D6',
        padding: '0 24px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Brand Logotype */}
          <a
            href="#landing"
            onClick={(e) => { e.preventDefault(); handleRoute('landing'); }}
            style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', cursor: 'pointer' }}
          >
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#191C1B',
              lineHeight: 1
            }}>
              PET MAYA
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#45848D',
              marginTop: '3px',
              lineHeight: 1
            }}>
              VETERINARY MEDICINE
            </span>
          </a>

          {/* Action Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Return to Store */}
            <button
              onClick={() => handleRoute('shop')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: '1px solid rgba(222, 217, 214, 0.7)',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#707973',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#191C1B'; e.currentTarget.style.borderColor = '#191C1B'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#707973'; e.currentTarget.style.borderColor = 'rgba(222, 217, 214, 0.7)'; }}
            >
              <ArrowLeft size={14} />
              <span>Return to Store</span>
            </button>

            {/* Emergency 24/7 Hotline Badge */}
            <button
              onClick={() => showToast('Connecting to 24/7 Emergency Clinician Dispatch...', 'info')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(190, 58, 52, 0.08)',
                border: '1px solid rgba(190, 58, 52, 0.25)',
                color: '#BE3A34',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span className="pulse-beacon" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#BE3A34' }}></span>
              <span>Emergency 24/7 Hotline</span>
            </button>

            {/* Search circular button */}
            <button
              onClick={() => handleRoute('shop')}
              aria-label="Search"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: '1px solid #DED9D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#707973',
                cursor: 'pointer'
              }}
            >
              <Search size={16} />
            </button>

            {/* Shopping Bag */}
            <button
              onClick={() => openModal('cart')}
              aria-label="Bag"
              style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #DED9D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#191C1B',
                cursor: 'pointer'
              }}
            >
              <ShoppingBag size={16} />
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#191C1B',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {totalCartCount || 2}
              </span>
            </button>

            {/* Elevated Black "BOOK CONSULT" Pill */}
            <button
              onClick={() => handleRoute('book-vet')}
              className="btn-elevate"
              style={{
                backgroundColor: '#1F2421',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              Book Consult
            </button>

            {/* Profile Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#45848D',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px'
            }}>
              {currentUser && currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN SPLIT AUTH CONTAINER ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px'
      }}>
        <div style={{
          maxWidth: '1140px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '32px',
          alignItems: 'stretch'
        }}>

          {/* ═════════════════════════════════════════════════════════════
              LEFT COLUMN: CLINICAL HERITAGE CARD
              ═════════════════════════════════════════════════════════════ */}
          <section style={{
            backgroundColor: '#F8F3EF',
            border: '1px solid #DED9D6',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Ecosystem Badge Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #DED9D6',
                paddingBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="ambient-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#45848D' }}></span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#45848D'
                  }}>
                    PET MAYA CLINICAL ECOSYSTEM
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: '#898683',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  STANDARDS V3.4
                </span>
              </div>

              {/* Editorial Serif Headline */}
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 3.5vw, 36px)',
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#160F0C',
                margin: 0
              }}>
                A calmer, more thoughtful standard of animal medicine.
              </h1>

              {/* Pet Hero Portrait Card */}
              <div style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #DED9D6',
                aspectRatio: '16 / 10',
                width: '100%',
                backgroundColor: '#ECE7E4'
              }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0Prr7aYyo07rpD9iLCkKftywJ8lHGRxqtqSyAKiZBW4fjCxSJ0UmDyzawYAXXFZ53Pp3udPPTBip_gvNSTpX-f7VshOPY0V3K3xjWbAGKRX-ciPi3sVSBYsUVqOnLjf6PdIqn-wSW86S28bv2rYEv0ytffB8OJEM7XcIKMXrr88EPZ7Y2ya-QmTe3d89axfxHr9Cw7roIWkbFMiMziIuZlQkNoBJYeHFQEs3muapmOKx9kjDqOI0H"
                  alt="A serene golden retriever resting on a sunlit rug"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(22, 15, 12, 0.75) 0%, transparent 50%)'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                  fontSize: '11px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(22, 15, 12, 0.65)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#92D1DA' }}></span>
                    <span style={{ fontWeight: 500 }}>Milo • Golden Retriever</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    ID: #MY-9820
                  </span>
                </div>
              </div>

              {/* Editorial Quote Card */}
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid #DED9D6'
              }}>
                <p style={{
                  fontFamily: 'var(--font-heading)',
                  fontStyle: 'italic',
                  fontSize: '13.5px',
                  lineHeight: 1.55,
                  color: '#160F0C',
                  margin: 0
                }}>
                  “Every companion deserves absolute veterinary continuity, zero guesswork, and calm, unhurried clinical care.”
                </p>
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#675C58' }}>
                    — Dr. Evelyn Vance, MRCVS
                  </span>
                </div>
              </div>

              {/* 3 Clinical Pillars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Pillar 1 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DED9D6'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(174, 237, 247, 0.3)',
                    border: '1px solid rgba(33, 101, 109, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#21656D',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>fingerprint</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C', margin: 0 }}>
                      Biometric Health Vault
                    </h2>
                    <p style={{ fontSize: '11px', color: '#675C58', margin: '2px 0 0', lineHeight: 1.35 }}>
                      Sovereign ISO-11784 microchip records and instant travel passports.
                    </p>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DED9D6'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(174, 237, 247, 0.3)',
                    border: '1px solid rgba(33, 101, 109, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#21656D',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>ac_unit</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C', margin: 0 }}>
                      Hermetic Cold-Chain Formulary
                    </h2>
                    <p style={{ fontSize: '11px', color: '#675C58', margin: '2px 0 0', lineHeight: 1.35 }}>
                      2°C–8°C certified prescription dispatch within 120 minutes.
                    </p>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DED9D6'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(174, 237, 247, 0.3)',
                    border: '1px solid rgba(33, 101, 109, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#21656D',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cell_tower</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C', margin: 0 }}>
                      24/7 Emergency Telemetry
                    </h2>
                    <p style={{ fontSize: '11px', color: '#675C58', margin: '2px 0 0', lineHeight: 1.35 }}>
                      Real-time geofencing and active continuous vitals monitoring.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Verification Tokens */}
            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid #DED9D6',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              color: '#898683',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              <span>256-BIT TLS VAULT ENCRYPTED</span>
              <span>•</span>
              <span>ISO 11784 COMPLIANT</span>
              <span>•</span>
              <span>ZERO THIRD-PARTY DISCLOSURE</span>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════
              RIGHT COLUMN: UNIFIED GUARDIAN PORTAL CARD
              ═════════════════════════════════════════════════════════════ */}
          <section style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #DED9D6',
            borderRadius: '16px',
            padding: 'clamp(28px, 4vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

              {/* Segmented Tab Switcher */}
              <div style={{
                borderRadius: '8px',
                backgroundColor: '#F8F3EF',
                padding: '4px',
                border: '1px solid #DED9D6',
                display: 'flex',
                marginBottom: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: mode === 'signin' ? 600 : 500,
                    color: mode === 'signin' ? '#1F2421' : '#898683',
                    backgroundColor: mode === 'signin' ? '#FFFFFF' : 'transparent',
                    boxShadow: mode === 'signin' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  Sign In to Portal
                </button>

                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: mode === 'signup' ? 600 : 500,
                    color: mode === 'signup' ? '#1F2421' : '#898683',
                    backgroundColor: mode === 'signup' ? '#FFFFFF' : 'transparent',
                    boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  Create Guardian Account
                </button>
              </div>

              {/* Header Title & Subtitle */}
              <div style={{ marginBottom: '22px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '24px',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  color: '#160F0C',
                  margin: '0 0 6px'
                }}>
                  {mode === 'signin'
                    ? "Welcome back to your companion's care hub"
                    : "Create your sovereign guardian registry"}
                </h2>
                <p style={{ fontSize: '12.5px', color: '#675C58', margin: 0, lineHeight: 1.5 }}>
                  {mode === 'signin'
                    ? "Access Milo's vitals, verified medical records, cold-chain prescriptions, and collar radar telemetry."
                    : "Establish an encrypted clinical record, connect your veterinary clinic, and configure urgent telemetry."}
                </p>
              </div>

              {/* Social SSO Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="btn-elevate"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #DED9D6',
                    backgroundColor: 'rgba(253, 248, 245, 0.4)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#160F0C',
                    cursor: 'pointer'
                  }}
                >
                  <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} viewBox="0 0 24 24">
                    <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z" fill="#EA4335" />
                    <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z" fill="#4285F4" />
                    <path d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" fill="#FBBC05" />
                    <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 20.1 7.4 23 12 23z" fill="#34A853" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleAuth}
                  className="btn-elevate"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #DED9D6',
                    backgroundColor: 'rgba(253, 248, 245, 0.4)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#160F0C',
                    cursor: 'pointer'
                  }}
                >
                  <svg style={{ width: '16px', height: '16px', flexShrink: 0, fill: 'currentColor' }} viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 0.92-2.84-.9.04-2 .6-2.65 1.35-.57.65-1.07 1.71-.93 2.72 1 .08 2.04-.48 2.66-1.23z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              </div>

              {/* Divider */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ width: '100%', borderTop: '1px solid #DED9D6' }}></div>
                <span style={{
                  position: 'absolute',
                  padding: '0 12px',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9.5px',
                  letterSpacing: '0.12em',
                  color: '#898683',
                  textTransform: 'uppercase'
                }}>
                  OR CONTINUE WITH CLINICAL EMAIL
                </span>
              </div>

              {/* Error Alert */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(190, 58, 52, 0.08)',
                  border: '1px solid rgba(190, 58, 52, 0.2)',
                  color: '#BE3A34',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Full Legal Name (Sign Up only) */}
                {mode === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C' }}>
                      Guardian Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Eleanor Vance"
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #DED9D6',
                        backgroundColor: 'rgba(253, 248, 245, 0.5)',
                        padding: '10px 14px',
                        fontSize: '13.5px',
                        color: '#160F0C',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Email Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C' }}>
                    Registered Clinical Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tanzim@petmaya.app"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid #DED9D6',
                      backgroundColor: 'rgba(253, 248, 245, 0.5)',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      color: '#160F0C',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 15-Digit Microchip Field (Sign Up only) */}
                {mode === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C' }}>
                        Pet 15-Digit Microchip (ISO 11784)
                      </label>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#45848D', textTransform: 'uppercase' }}>
                        Optional on Sign Up
                      </span>
                    </div>
                    <input
                      type="text"
                      value={microchip}
                      onChange={(e) => setMicrochip(e.target.value)}
                      placeholder="982 000 410 923 881"
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #DED9D6',
                        backgroundColor: 'rgba(253, 248, 245, 0.5)',
                        padding: '10px 14px',
                        fontSize: '13.5px',
                        color: '#160F0C',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Vault Master Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C' }}>
                      Vault Master Password
                    </label>
                    <a
                      href="#forgot"
                      onClick={handleForgotPassword}
                      style={{ fontSize: '11.5px', color: '#45848D', textDecoration: 'none', fontWeight: 500 }}
                    >
                      Forgot password?
                    </a>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #DED9D6',
                        backgroundColor: 'rgba(253, 248, 245, 0.5)',
                        padding: '10px 40px 10px 14px',
                        fontSize: '13.5px',
                        color: '#160F0C',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: '#898683',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Keep Authenticated Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="check-remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#45848D', cursor: 'pointer' }}
                  />
                  <label htmlFor="check-remember" style={{ fontSize: '12px', color: '#675C58', cursor: 'pointer', userSelect: 'none' }}>
                    Keep session authenticated on this trusted terminal (30 days)
                  </label>
                </div>

                {/* Primary CTA Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-elevate"
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: '#1F2421',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                  }}
                >
                  <span>
                    {loading
                      ? 'Authenticating ISO Dossier...'
                      : mode === 'signin'
                      ? 'Sign In to Health Vault'
                      : 'Register Guardian & Microchip'}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Register Callout Notice Box */}
              <div style={{
                backgroundColor: '#F8F3EF',
                border: '1px solid #DED9D6',
                borderRadius: '8px',
                padding: '14px',
                marginTop: '20px',
                fontSize: '12px',
                color: '#1F2421',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#45848D', flexShrink: 0, marginTop: '2px' }}>
                  verified_user
                </span>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: '#160F0C' }}>New to Pet Maya?</strong> Register your pet's microchip to activate continuous cold-chain protection and receive a complimentary 10-minute telehealth welcome consult with a veterinarian.
                </p>
              </div>

              {/* Quick Demo Access Button */}
              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#45848D',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  <PlayCircle size={15} />
                  <span>Quick Demo Access: Sign In as Guest Guardian (Milo's Profile)</span>
                </button>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* ── GLOBAL FOOTER ── */}
      <footer style={{
        width: '100%',
        borderTop: '1px solid #DED9D6',
        backgroundColor: '#F8F3EF',
        padding: '20px 24px',
        fontSize: '12px',
        color: '#675C58'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#160F0C' }}>Pet Maya Clinical Ecosystem</span>
            <span style={{ color: '#898683' }}>•</span>
            <span>© 2025 Pet Maya Health, Inc. All rights reserved.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a onClick={() => handleRoute('privacy')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Privacy Policy</a>
            <a onClick={() => handleRoute('terms')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Terms of Service</a>
            <a onClick={() => showToast('Opening Telehealth Consent & Disclosure document...', 'info')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Telehealth Consent &amp; Disclosure</a>
            <a onClick={() => handleRoute('features')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Clinical Standards</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
