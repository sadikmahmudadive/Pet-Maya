import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Menu, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Radar, 
  Cpu, 
  Heart, 
  Stethoscope, 
  Building2, 
  Radio, 
  BookOpen, 
  HelpCircle,
  Sparkles,
  LayoutDashboard,
  ShoppingBag
} from 'lucide-react';

export default function EditorialNavbar({ currentRoute, onNavigate }) {
  const { openModal, showToast, setActiveTab, cart } = useApp();
  const { currentUser, loginAsGuest } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Detect scroll for backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavClick = (path, e) => {
    if (e) e.preventDefault();
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  const handleGetStarted = () => {
    setMobileMenuOpen(false);
    if (currentUser) {
      if (onNavigate) onNavigate('dashboard');
      else setActiveTab('dashboard');
    } else {
      loginAsGuest('Pet Owner');
      if (onNavigate) onNavigate('dashboard');
      else setActiveTab('dashboard');
      showToast('Welcome to Pet Maya Platform Demo!', 'success');
    }
  };

  const handleSignIn = () => {
    setMobileMenuOpen(false);
    openModal('auth');
  };

  const platformItems = [
    {
      title: 'Digital Pet Passport',
      path: '/digital-pet-passport',
      desc: 'Lifelong medical records, vaccinations, and ISO microchip identity.',
      icon: ShieldCheck,
    },
    {
      title: 'AI Health Care',
      path: '/ai-pet-care',
      desc: 'Clinical vision triage and smart symptom understanding.',
      icon: Activity,
    },
    {
      title: 'GPS & Location Safety',
      path: '/pet-gps',
      desc: 'Sub-meter live satellite radar and perimeter escape alerts.',
      icon: Radar,
    },
    {
      title: 'Connected Care / IoT',
      path: '/connected-care',
      desc: 'Biometric smart collars, BLE telemetry, and cloud synchronization.',
      icon: Cpu,
    },
    {
      title: 'All Platform Features',
      path: '/features',
      desc: 'Explore the complete connected pet healthcare ecosystem.',
      icon: Sparkles,
    },
  ];

  const solutionItems = [
    {
      title: 'For Pet Parents',
      path: '/for-pet-parents',
      desc: 'Daily health tracking, reminders, and proactive veterinary care.',
      icon: Heart,
    },
    {
      title: 'For Veterinarians',
      path: '/for-veterinarians',
      desc: 'Teleconsultation portal, digital Rx, and unified medical history.',
      icon: Stethoscope,
    },
    {
      title: 'For Clinics & Hospitals',
      path: '/for-clinics',
      desc: 'Multi-doctor scheduling, EHR records, and client follow-ups.',
      icon: Building2,
    },
    {
      title: 'Connected Devices',
      path: '/connected-care',
      desc: 'Pet Maya 4G Smart Collars and Bluetooth activity sensors.',
      icon: Radio,
    },
  ];

  const resourceItems = [
    {
      title: 'Pet Health Hub',
      path: '/pet-health',
      desc: 'Clinical guidance on canine and feline preventative health.',
      icon: Activity,
    },
    {
      title: 'Pet Maya Journal',
      path: '/blog',
      desc: 'Editorial stories, nutrition research, and veterinary updates.',
      icon: BookOpen,
    },
    {
      title: 'Care Guides & Diet',
      path: '/pet-care',
      desc: 'Scientific nutrition calculation and breed lifestyle guides.',
      icon: Heart,
    },
    {
      title: 'Frequently Asked Questions',
      path: '/faq',
      desc: 'Everything you need to know about Pet Maya technology.',
      icon: HelpCircle,
    },
  ];

  return (
    <nav
      ref={navRef}
      role="navigation"
      aria-label="Main Navigation"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div
        className="editorial-container"
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <a
          href="/"
          onClick={(e) => handleNavClick('/', e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'var(--foreground)',
          }}
        >
          <img
            src="/assets/images/tail_wagging_logo.png"
            alt="Pet Maya"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--foreground)',
            }}
          >
            Pet Maya
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div
          className="editorial-nav-desktop"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          {/* Platform Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'platform' ? null : 'platform')}
              aria-expanded={activeDropdown === 'platform'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '14.5px',
                fontWeight: 500,
                color: activeDropdown === 'platform' ? 'var(--foreground)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px 0',
                transition: 'color 0.15s ease',
              }}
            >
              <span>Platform</span>
              <ChevronDown
                size={14}
                style={{
                  transform: activeDropdown === 'platform' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'platform' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: '-20px',
                    width: '380px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {platformItems.map((item) => (
                    <a
                      key={item.title}
                      href={item.path}
                      onClick={(e) => handleNavClick(item.path, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--soft-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <item.icon size={17} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                          {item.desc}
                        </div>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Solutions Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
              aria-expanded={activeDropdown === 'solutions'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '14.5px',
                fontWeight: 500,
                color: activeDropdown === 'solutions' ? 'var(--foreground)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px 0',
                transition: 'color 0.15s ease',
              }}
            >
              <span>Solutions</span>
              <ChevronDown
                size={14}
                style={{
                  transform: activeDropdown === 'solutions' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'solutions' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: '-20px',
                    width: '380px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {solutionItems.map((item) => (
                    <a
                      key={item.title}
                      href={item.path}
                      onClick={(e) => handleNavClick(item.path, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--soft-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <item.icon size={17} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                          {item.desc}
                        </div>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resources Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
              aria-expanded={activeDropdown === 'resources'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '14.5px',
                fontWeight: 500,
                color: activeDropdown === 'resources' ? 'var(--foreground)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px 0',
                transition: 'color 0.15s ease',
              }}
            >
              <span>Resources</span>
              <ChevronDown
                size={14}
                style={{
                  transform: activeDropdown === 'resources' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'resources' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: '-20px',
                    width: '380px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {resourceItems.map((item) => (
                    <a
                      key={item.title}
                      href={item.path}
                      onClick={(e) => handleNavClick(item.path, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--soft-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <item.icon size={17} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                          {item.desc}
                        </div>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shop Link */}
          <a
            href="/shop"
            onClick={(e) => handleNavClick('shop', e)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14.5px',
              fontWeight: 500,
              color: currentRoute === 'shop' ? 'var(--foreground)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            Care Shop
          </a>

          {/* Specialists Link */}
          <a
            href="/vets"
            onClick={(e) => handleNavClick('vets', e)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14.5px',
              fontWeight: 500,
              color: currentRoute === 'vets' ? 'var(--foreground)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            Specialists
          </a>

          {/* About Link */}
          <a
            href="/about"
            onClick={(e) => handleNavClick('/about', e)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14.5px',
              fontWeight: 500,
              color: currentRoute === '/about' ? 'var(--foreground)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            About
          </a>
        </div>

        {/* Action Buttons (Right) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Shopping Bag Trigger Button */}
          <button
            onClick={() => openModal('cart')}
            aria-label="Open Shopping Bag"
            title="Shopping Bag"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag size={18} />
            {cart && cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: 'var(--primary)',
                color: '#1F2421',
                fontSize: '11px',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}>
                {cart.reduce((acc, i) => acc + (i.qty || 1), 0)}
              </span>
            )}
          </button>

          {currentUser ? (
            <button
              onClick={() => handleNavClick('dashboard')}
              className="editorial-btn-secondary"
              style={{ padding: '8px 18px', fontSize: '14px', gap: '6px' }}
            >
              <LayoutDashboard size={15} />
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                }}
              >
                Sign In
              </button>

              <button
                onClick={handleGetStarted}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#1F2421',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(46, 204, 155, 0.20)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'none',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--foreground)',
            }}
            className="editorial-mobile-toggle"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              overflow: 'hidden',
              backgroundColor: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              className="editorial-container"
              style={{ padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Platform
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {platformItems.map(item => (
                    <a
                      key={item.title}
                      href={item.path}
                      onClick={(e) => handleNavClick(item.path, e)}
                      style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Solutions & Resources
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <a href="/for-pet-parents" onClick={(e) => handleNavClick('/for-pet-parents', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>For Pet Parents</a>
                  <a href="/for-veterinarians" onClick={(e) => handleNavClick('/for-veterinarians', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>For Veterinarians</a>
                  <a href="/for-clinics" onClick={(e) => handleNavClick('/for-clinics', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>For Clinics</a>
                  <a href="/pet-health" onClick={(e) => handleNavClick('/pet-health', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>Health Hub</a>
                  <a href="/blog" onClick={(e) => handleNavClick('/blog', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>Journal</a>
                  <a href="/about" onClick={(e) => handleNavClick('/about', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>About</a>
                  <a href="/faq" onClick={(e) => handleNavClick('/faq', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>FAQ</a>
                  <a href="/contact" onClick={(e) => handleNavClick('/contact', e)} style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none', padding: '6px 0' }}>Contact</a>
                </div>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleGetStarted}
                  className="editorial-btn-primary"
                  style={{ width: '100%' }}
                >
                  Get Started
                </button>
                <button
                  onClick={handleSignIn}
                  className="editorial-btn-secondary"
                  style={{ width: '100%' }}
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 900px) {
          .editorial-nav-desktop {
            display: flex !important;
          }
          .editorial-mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
