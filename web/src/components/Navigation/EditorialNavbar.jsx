import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingBag, Menu, X, Sun, Moon } from 'lucide-react';
import GlobalBanner from '../GlobalBanner';

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

  const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

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
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Left: Brand Logotype */}
        <a
          href="#landing"
          onClick={(e) => handleNavClick('landing', e)}
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}
        >
          <span style={{
            fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: isDark ? '#FFFFFF' : '#160F0C',
            lineHeight: 1,
            transition: 'color 0.2s ease'
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
              (link.path === 'digital-pet-passport' && (currentRoute === 'digital-pet-passport' || currentRoute === '/digital-pet-passport' || currentRoute === 'health-vault' || currentRoute === '/health-vault' || currentRoute === 'profile' || currentRoute === '/profile')) ||
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Button */}
          <button
            onClick={() => handleNavClick('shop')}
            aria-label="Search formulary and clinical database"
            title="Search"
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
              transition: 'all 0.2s ease'
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
              transition: 'all 0.18s ease'
            }}
          >
            <ShoppingBag size={17} />
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
              {totalCartCount > 0 ? totalCartCount : 3}
            </span>
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
              transition: 'all 0.2s ease'
            }}
          >
            BOOK CONSULT
          </button>

          {/* Profile / Portal Access Button */}
          <button
            onClick={() => {
              handleNavClick('profile');
            }}
            aria-label="Account profile"
            title={currentUser ? (currentUser.name || 'Profile') : 'Guardian Profile & Health Vault'}
            className="btn-elevate"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isDark ? '#0B2826' : '#EBE5DF',
              border: isDark ? '1.5px solid rgba(26, 182, 128, 0.4)' : '1px solid rgba(222, 217, 214, 0.9)',
              cursor: 'pointer',
              overflow: 'hidden',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '2px'
            }}
          >
            <img
              src={currentUser?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt="Guardian Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
              }}
            />
          </button>

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
              cursor: 'pointer'
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
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={`#${link.path}`}
              onClick={(e) => handleNavClick(link.path, e)}
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: isDark ? '#FFFFFF' : '#160F0C',
                textDecoration: 'none',
                padding: '8px 0'
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ 
            paddingTop: '12px', 
            borderTop: isDark ? '1px solid rgba(26, 182, 128, 0.2)' : '1px solid rgba(222, 217, 214, 0.5)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px' 
          }}>
            {/* Mobile Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                width: '100%',
                padding: '10px 16px',
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
        @media (max-width: 900px) {
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
      `}</style>
    </header>
  );
}
