import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingBag, Menu, X, Sun, Moon } from 'lucide-react';
import GlobalBanner from '../GlobalBanner';
import UserAvatar from '../Common/UserAvatar';

export default function EditorialNavbar({ currentRoute, onNavigate }) {
  const { openModal, showToast, cart, theme, toggleTheme } = useApp();
  const { currentUser, loginAsGuest } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (path, e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  const navLinks = [
    { label: 'Care Shop', path: 'shop' },
    { label: 'AI Triage', path: 'ai' },
    { label: 'Specialists', path: 'specialists' },
    { label: 'Health Vault', path: 'digital-pet-passport' },
    { label: 'Journal', path: 'journal' },
    { label: 'GPS Radar', path: 'pet-gps' },
    { label: 'Community', path: 'community' },
    { label: 'Dashboard', path: 'dashboard' },
  ];

  const totalCartCount = (cart || []).reduce((sum, item) => sum + (Number(item.qty || item.quantity) || 1), 0);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: isDark 
        ? (scrolled ? 'rgba(2, 30, 32, 0.96)' : '#021E20')
        : (scrolled ? 'rgba(253, 248, 245, 0.94)' : '#FDF8F5'),
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: isDark ? '1px solid rgba(26, 182, 128, 0.22)' : '1px solid rgba(222, 217, 214, 0.6)',
      transition: 'all 0.25s ease'
    }}>
      {/* Global Top Promotional Banner */}
      <GlobalBanner />

      {/* Main Navbar Bar */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '10px clamp(12px, 3vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        {/* Left: Brand Logotype */}
        <a
          href="#landing"
          onClick={(e) => handleNavClick('landing', e)}
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <span style={{
            fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
            fontSize: 'clamp(17px, 4.5vw, 20px)',
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: isDark ? '#FFFFFF' : '#160F0C',
            lineHeight: 1,
            transition: 'color 0.2s ease',
            whiteSpace: 'nowrap'
          }}>
            PET MAYA
          </span>
        </a>

        {/* Center: Floating Capsule Nav Links (Desktop) */}
        <nav
          className="editorial-desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: isDark ? 'rgba(11, 40, 38, 0.88)' : 'rgba(240, 236, 230, 0.88)',
            padding: '4px 6px',
            borderRadius: '9999px',
            border: isDark ? '1px solid rgba(26, 182, 128, 0.25)' : '1px solid rgba(220, 214, 206, 0.85)',
            boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(22, 15, 12, 0.03)',
            transition: 'all 0.25s ease'
          }}
        >
          {navLinks.map((link) => {
            const isActive = currentRoute === link.path || 
              (link.path === 'shop' && (currentRoute === '/shop' || currentRoute === 'shop')) ||
              (link.path === 'ai' && (currentRoute === 'ai' || currentRoute === '/ai' || currentRoute === 'ai-pet-care' || currentRoute === '/ai-pet-care' || currentRoute === 'wellness' || currentRoute === '/wellness')) ||
              (link.path === 'specialists' && (currentRoute === 'specialists' || currentRoute === '/specialists' || currentRoute === 'vets' || currentRoute === '/vets' || currentRoute === 'for-veterinarians' || currentRoute === '/for-veterinarians')) ||
              (link.path === 'digital-pet-passport' && (currentRoute === 'digital-pet-passport' || currentRoute === '/digital-pet-passport' || currentRoute === 'health-vault' || currentRoute === '/health-vault')) ||
              ((link.path === 'journal' || link.path === 'blog') && (currentRoute === 'blog' || currentRoute === '/blog' || currentRoute === 'journal' || currentRoute === '/journal' || currentRoute === 'gazette' || currentRoute === '/gazette' || currentRoute === 'pet-health' || currentRoute === 'pet-care')) ||
              (link.path === 'pet-gps' && (currentRoute === 'pet-gps' || currentRoute === '/pet-gps' || currentRoute === 'tracker' || currentRoute === '/tracker' || currentRoute === 'gps' || currentRoute === '/gps' || currentRoute === 'radar' || currentRoute === '/radar')) ||
              (link.path === 'community' && (currentRoute === 'community' || currentRoute === '/community' || currentRoute === 'social' || currentRoute === '/social' || currentRoute === 'circle' || currentRoute === '/circle')) ||
              (link.path === 'dashboard' && (currentRoute === 'dashboard' || currentRoute === '/dashboard' || currentRoute === 'portal' || currentRoute === '/portal'));
            
            const activeBg = isDark ? '#103330' : '#FFFFFF';
            const activeColor = isDark ? '#FFFFFF' : '#160F0C';
            const inactiveColor = isDark ? '#8EA6A2' : '#55605C';

            return (
              <a
                key={link.label}
                href={`#${link.path}`}
                onClick={(e) => handleNavClick(link.path, e)}
                style={{
                  padding: isActive ? '6px 16px' : '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? activeColor : inactiveColor,
                  backgroundColor: isActive ? activeBg : 'transparent',
                  border: isActive && isDark ? '1px solid rgba(26, 182, 128, 0.35)' : '1px solid transparent',
                  boxShadow: isActive ? (isDark ? '0 1px 6px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)') : 'none',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = isDark ? '#FFFFFF' : '#160F0C';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = inactiveColor;
                }}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right: Utility Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Search Button (desktop/tablet) */}
          <button
            onClick={() => handleNavClick('shop')}
            aria-label="Search formulary and clinical database"
            title="Search"
            className="editorial-nav-search-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              color: isDark ? '#8EA6A2' : '#55605C',
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? '#FFFFFF' : '#160F0C'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? '#8EA6A2' : '#55605C'; }}
          >
            <Search size={18} />
          </button>

          {/* Theme Toggle Button (Light/Dark mode) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Light and Dark Mode"
            title={isDark ? "Switch to Light Mode" : "Switch to Deep Emerald Dark Mode"}
            className="btn-elevate theme-toggle-nav-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isDark ? '#0B2826' : '#FFFFFF',
              border: isDark ? '1px solid rgba(26, 182, 128, 0.35)' : '1px solid rgba(222, 217, 214, 0.9)',
              color: isDark ? '#1AB680' : '#160F0C',
              cursor: 'pointer',
              boxShadow: isDark ? '0 1px 6px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Shopping Bag Button with Badge */}
          <button
            onClick={(e) => handleNavClick('cart', e)}
            aria-label="View shopping bag & clinical dispensary"
            title="Dispensary Bag"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isDark 
                ? (currentRoute === 'cart' || currentRoute === '/cart' ? '#1AB680' : '#0B2826')
                : (currentRoute === 'cart' || currentRoute === '/cart' ? '#160F0C' : '#FFFFFF'),
              border: isDark ? '1px solid rgba(26, 182, 128, 0.35)' : '1px solid rgba(222, 217, 214, 0.9)',
              color: isDark 
                ? (currentRoute === 'cart' || currentRoute === '/cart' ? '#021E20' : '#FFFFFF')
                : (currentRoute === 'cart' || currentRoute === '/cart' ? '#FFFFFF' : '#160F0C'),
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.18s ease',
              flexShrink: 0
            }}
          >
            <ShoppingBag size={17} />
            {totalCartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: isDark ? '#1AB680' : '#160F0C',
                color: isDark ? '#021E20' : '#FFFFFF',
                border: isDark ? '2px solid #021E20' : '2px solid #FAF7F5',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}>
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Elevated "BOOK CONSULT" Button */}
          <button
            onClick={() => handleNavClick('book-vet')}
            className="btn-elevate editorial-book-consult-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? '#1AB680' : '#160F0C',
              color: isDark ? '#021E20' : '#FFFFFF',
              padding: '9px 20px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isDark ? '0 2px 10px rgba(26, 182, 128, 0.35)' : '0 2px 6px rgba(0,0,0,0.12)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            BOOK CONSULT
          </button>

          {/* Profile / Portal Access Button */}
          {(() => {
            const isProfileActive = currentRoute === 'profile' || currentRoute === '/profile' || currentRoute === 'account' || currentRoute === 'guardian-profile';
            return (
              <button
                onClick={() => {
                  handleNavClick('profile');
                }}
                aria-label="Account profile"
                title={currentUser ? (currentUser.name || 'Guardian Profile') : 'Guardian Profile & Account'}
                className="btn-elevate"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#0B2826' : '#EBE5DF',
                  border: isProfileActive
                    ? (isDark ? '2px solid #1AB680' : '2px solid #160F0C')
                    : (isDark ? '1.5px solid rgba(26, 182, 128, 0.4)' : '1px solid rgba(222, 217, 214, 0.9)'),
                  boxShadow: isProfileActive
                    ? (isDark ? '0 0 0 3px rgba(26, 182, 128, 0.4)' : '0 0 0 3px rgba(22, 15, 12, 0.25)')
                    : 'none',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <UserAvatar user={currentUser} size={36} />
              </button>
            );
          })()}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="editorial-mobile-toggle"
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: isDark ? '1px solid rgba(26, 182, 128, 0.35)' : '1px solid rgba(222, 217, 214, 0.7)',
              backgroundColor: isDark ? '#0B2826' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#160F0C',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: isDark ? '#0B2826' : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(26, 182, 128, 0.25)' : '1px solid rgba(222, 217, 214, 0.7)',
          padding: '16px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.7)' : '0 12px 30px rgba(0,0,0,0.08)',
          maxHeight: 'calc(100vh - 70px)',
          overflowY: 'auto'
        }}>
          {/* Quick Search in Drawer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '9999px',
            backgroundColor: isDark ? '#07211F' : '#F4EFEB',
            marginBottom: '8px'
          }}>
            <Search size={16} color={isDark ? '#1AB680' : '#707973'} />
            <input 
              type="text" 
              placeholder="Search formulary, articles, records..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNavClick('shop');
                }
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: isDark ? '#FFFFFF' : '#160F0C',
                width: '100%'
              }}
            />
          </div>

          {navLinks.map((link) => {
            const isActive = currentRoute === link.path || 
              (link.path === 'shop' && (currentRoute === '/shop' || currentRoute === 'shop')) ||
              (link.path === 'ai' && (currentRoute === 'ai' || currentRoute === '/ai')) ||
              (link.path === 'specialists' && (currentRoute === 'specialists' || currentRoute === '/specialists')) ||
              (link.path === 'digital-pet-passport' && (currentRoute === 'digital-pet-passport' || currentRoute === '/digital-pet-passport')) ||
              (link.path === 'journal' && (currentRoute === 'journal' || currentRoute === 'blog')) ||
              (link.path === 'pet-gps' && (currentRoute === 'pet-gps' || currentRoute === 'tracker')) ||
              (link.path === 'community' && (currentRoute === 'community' || currentRoute === '/community')) ||
              (link.path === 'dashboard' && (currentRoute === 'dashboard' || currentRoute === '/dashboard'));

            return (
              <a
                key={link.label}
                href={`#${link.path}`}
                onClick={(e) => handleNavClick(link.path, e)}
                style={{
                  fontSize: '14.5px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? (isDark ? '#1AB680' : '#160F0C') : (isDark ? '#9DB4B0' : '#55605C'),
                  backgroundColor: isActive ? (isDark ? 'rgba(26, 182, 128, 0.12)' : 'rgba(22, 15, 12, 0.05)') : 'transparent',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#1AB680' : '#160F0C'
                  }} />
                )}
              </a>
            );
          })}

          {/* Dedicated Guardian Profile link for mobile */}
          {(() => {
            const isProfileActive = currentRoute === 'profile' || currentRoute === 'account' || currentRoute === 'guardian-profile';
            return (
              <a
                href="#profile"
                onClick={(e) => handleNavClick('profile', e)}
                style={{
                  fontSize: '14.5px',
                  fontWeight: isProfileActive ? 700 : 500,
                  color: isProfileActive ? (isDark ? '#1AB680' : '#160F0C') : (isDark ? '#9DB4B0' : '#55605C'),
                  backgroundColor: isProfileActive ? (isDark ? 'rgba(26, 182, 128, 0.12)' : 'rgba(22, 15, 12, 0.05)') : 'transparent',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Guardian Profile &amp; Account</span>
                {isProfileActive && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#1AB680' : '#160F0C'
                  }} />
                )}
              </a>
            );
          })()}

          <div style={{ 
            paddingTop: '14px', 
            borderTop: isDark ? '1px solid rgba(26, 182, 128, 0.2)' : '1px solid rgba(222, 217, 214, 0.5)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            marginTop: '6px'
          }}>
            {/* Mobile Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '9999px',
                backgroundColor: isDark ? '#103330' : '#F3F3EF',
                color: isDark ? '#1AB680' : '#160F0C',
                fontSize: '13px',
                fontWeight: 600,
                border: isDark ? '1px solid rgba(26, 182, 128, 0.3)' : '1px solid #DED9D6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>

            <button
              onClick={() => handleNavClick('book-vet')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9999px',
                backgroundColor: isDark ? '#1AB680' : '#160F0C',
                color: isDark ? '#021E20' : '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Book Consult (৳500)
            </button>
            <button
              onClick={() => handleNavClick(currentUser ? 'dashboard' : 'login')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9999px',
                backgroundColor: isDark ? '#103330' : '#F8F3EF',
                color: isDark ? '#FFFFFF' : '#160F0C',
                fontSize: '13px',
                fontWeight: 600,
                border: isDark ? '1px solid rgba(26, 182, 128, 0.3)' : '1px solid #DED9D6',
                cursor: 'pointer'
              }}
            >
              {currentUser ? 'Guardian Dashboard' : 'Sign In to Guardian Portal'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1140px) {
          .editorial-book-consult-btn {
            display: none !important;
          }
          .editorial-desktop-nav a {
            padding: 5px 10px !important;
            font-size: 12.5px !important;
          }
        }
        @media (max-width: 992px) {
          .editorial-desktop-nav {
            display: none !important;
          }
          .editorial-mobile-toggle {
            display: flex !important;
          }
          .editorial-book-consult-btn {
            display: none !important;
          }
        }
        @media (max-width: 600px) {
          .editorial-nav-search-btn {
            display: none !important;
          }
          .editorial-mobile-toggle {
            width: 32px !important;
            height: 32px !important;
          }
        }
      `}</style>
    </header>
  );
}
