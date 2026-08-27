import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, 
  Moon, 
  ShoppingBag,
  X,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LottieMenuIcon from './Common/LottieMenuIcon';

export default function Header() {
  const { activeTab, setActiveTab, theme, toggleTheme, cartCount, openModal, showToast } = useApp();
  const { currentUser, loginAsGuest } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to increase nav blur intensity
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBrandClick = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (currentUser) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('landing');
    }
  };

  const handleDemoClick = () => {
    loginAsGuest('Pet Owner');
    setActiveTab('dashboard');
    showToast('🚀 Welcome to Pet Maya Demo Mode!', 'success');
  };

  const navTo = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Primary nav items (logged-in)
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'shop',      label: 'Pet Shop'   },
    { id: 'ai',        label: 'Wellness'   },
    { id: 'vets',      label: 'Specialists'},
    { id: 'community', label: 'Community'  },
    { id: 'food',      label: 'Blog'       },
  ];

  // Extra items in "More" (logged-in)
  const moreNavItems = [
    { id: 'tracker',  label: 'Tracker'   },
    { id: 'vaccines', label: 'Reminders' },
    { id: 'landing',  label: 'Overview'  },
  ];

  // Guest nav
  const guestNavItems = [
    { id: 'landing',   label: 'Overview'   },
    { id: 'shop',      label: 'Pet Shop'   },
    { id: 'ai',        label: 'Wellness'   },
    { id: 'vets',      label: 'Specialists'},
    { id: 'community', label: 'Community'  },
    { id: 'food',      label: 'Blog'       },
  ];

  const allItems = currentUser
    ? [...primaryNavItems, ...moreNavItems]
    : guestNavItems;

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.045, duration: 0.25, ease: [0.25, 1, 0.5, 1] } }),
    exit:   { opacity: 0, x: -8, transition: { duration: 0.15 } }
  };

  return (
    <header
      className="apple-nav-wrapper"
      style={{
        backdropFilter: scrolled ? 'blur(28px) saturate(200%)' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(200%)' : 'blur(20px) saturate(180%)',
        boxShadow: scrolled ? '0 1px 0 var(--border), 0 4px 16px rgba(0,0,0,0.04)' : '0 1px 0 var(--border)',
        transition: 'backdrop-filter 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <div className="apple-nav-inner">
        {/* Brand Logo */}
        <motion.div
          className="apple-brand"
          onClick={handleBrandClick}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          style={{ flexShrink: 0 }}
        >
          <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" />
          <span>Pet Maya</span>
        </motion.div>

        {/* Desktop Nav */}
        <ul className="apple-nav-links" style={{ position: 'relative' }}>
          {(currentUser ? primaryNavItems : guestNavItems).map((item) => (
            <li key={item.id} style={{ position: 'relative' }}>
              <button
                className={`apple-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => navTo(item.id)}
                style={{ position: 'relative', paddingBottom: '4px' }}
              >
                {item.label}
                {/* Framer Motion layoutId sliding underline indicator */}
                {activeTab === item.id && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="nav-active-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                  />
                )}
              </button>
            </li>
          ))}

          {/* More dropdown (logged-in only, desktop) */}
          {currentUser && (
            <li style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MoreDropdown
                items={moreNavItems}
                activeTab={activeTab}
                navTo={navTo}
              />
            </li>
          )}

          {/* Guest: iOS & Android link */}
          {!currentUser && (
            <li>
              <a
                href="#mobile-downloads"
                className="apple-nav-item"
                onClick={() => { navTo('landing'); }}
              >
                iOS &amp; Android
              </a>
            </li>
          )}
        </ul>

        {/* Right Nav Utilities */}
        <div className="apple-nav-actions">
          {/* Shopping Bag */}
          <button
            className="icon-btn"
            onClick={() => {
              if (currentUser) {
                openModal('cart');
              } else {
                openModal('auth');
                showToast('🔒 Please sign in to view your bag', 'info');
              }
            }}
            style={{ width: 32, height: 32, position: 'relative' }}
            title="Shopping Bag"
          >
            <ShoppingBag size={16} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key="cart-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 700,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--bg-pure)'
                  }}
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Theme Switcher */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            style={{ width: 32, height: 32 }}
            title="Toggle Light/Dark Theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -20, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 20, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* User Profile Avatar / Sign In */}
          {currentUser ? (
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', position: 'relative' }}
              onClick={() => { navTo('profile'); }}
              title="Account & EHR"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={currentUser.photoUrl || 'assets/images/tail_wagging_logo.png'}
                  alt={currentUser.name}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary)',
                  }}
                />
                {/* Online presence dot */}
                <span
                  className="presence-dot"
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: 8,
                    height: 8,
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn-minimal"
                style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                onClick={handleDemoClick}
              >
                Demo
              </button>
              <button
                className="apple-btn-blue"
                style={{ padding: '5px 14px', fontSize: '12px' }}
                onClick={() => openModal('auth')}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="icon-btn mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ width: 34, height: 34, marginLeft: '2px' }}
            title={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <LottieMenuIcon isOpen={isMobileMenuOpen} size={22} isDark={theme === 'dark'} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            style={{
              overflow: 'hidden',
              borderTop: '1px solid var(--border)',
              background: 'var(--nav-bg)',
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            }}
          >
            <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {allItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  custom={i}
                  variants={mobileItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="apple-nav-item"
                  onClick={() => navTo(item.id)}
                  style={{
                    textAlign: 'left',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: activeTab === item.id ? 600 : 400,
                    background: activeTab === item.id ? 'var(--primary-tint)' : 'transparent',
                    color: activeTab === item.id ? 'var(--primary)' : 'var(--text-main)',
                    width: '100%',
                    opacity: 1,
                  }}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// "More" dropdown component for desktop overflow nav items
function MoreDropdown({ items, activeTab, navTo }) {
  const [open, setOpen] = useState(false);
  const hasActive = items.some(i => i.id === activeTab);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        className={`apple-nav-item ${hasActive ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '3px', position: 'relative', paddingBottom: '4px' }}
      >
        More
        {hasActive && (
          <motion.span
            layoutId="nav-active-pill"
            className="nav-active-indicator"
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to close */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                minWidth: 160,
                zIndex: 200,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { navTo(item.id); setOpen(false); }}
                  style={{
                    textAlign: 'left',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === item.id ? 'var(--primary-tint)' : 'transparent',
                    color: activeTab === item.id ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '13.5px',
                    fontWeight: activeTab === item.id ? 600 : 400,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background 0.15s ease',
                    fontFamily: 'inherit',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'var(--surface-alt)'; }}
                  onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
