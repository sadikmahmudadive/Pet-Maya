import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import GlobalBanner from '../GlobalBanner';

export default function EditorialNavbar({ currentRoute, onNavigate }) {
  const { openModal, showToast, cart } = useApp();
  const { currentUser, loginAsGuest } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    { label: 'Journal', path: 'blog' },
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
      backgroundColor: scrolled ? 'rgba(253, 248, 245, 0.94)' : '#FDF8F5',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(222, 217, 214, 0.6)',
      transition: 'all 0.25s ease'
    }}>
      {/* Global Top Promotional Banner */}
      <GlobalBanner />

      {/* Main Navbar Bar */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Left: Brand Logotype */}
        <a
          href="#landing"
          onClick={(e) => handleNavClick('landing', e)}
          style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', cursor: 'pointer' }}
        >
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '19px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#160F0C',
            lineHeight: 1
          }}>
            PET MAYA
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8.5px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#45848D',
            marginTop: '3px',
            lineHeight: 1
          }}>
            VETERINARY MEDICINE
          </span>
        </a>

        {/* Center: Floating Capsule Nav Links (Desktop) */}
        <nav
          className="editorial-desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(248, 243, 239, 0.85)',
            padding: '4px 8px',
            borderRadius: '9999px',
            border: '1px solid rgba(222, 217, 214, 0.6)',
            boxShadow: '0 1px 4px rgba(22, 15, 12, 0.02)'
          }}
        >
          {navLinks.map((link) => {
            const isActive = currentRoute === link.path || 
              (link.path === 'shop' && (currentRoute === '/shop' || currentRoute === 'shop')) ||
              (link.path === 'ai' && (currentRoute === 'ai' || currentRoute === '/ai' || currentRoute === 'ai-pet-care' || currentRoute === '/ai-pet-care' || currentRoute === 'wellness' || currentRoute === '/wellness')) ||
              (link.path === 'specialists' && (currentRoute === 'specialists' || currentRoute === '/specialists' || currentRoute === 'vets' || currentRoute === '/vets' || currentRoute === 'for-veterinarians' || currentRoute === '/for-veterinarians')) ||
              (link.path === 'digital-pet-passport' && (currentRoute === 'digital-pet-passport' || currentRoute === '/digital-pet-passport' || currentRoute === 'health-vault' || currentRoute === '/health-vault')) ||
              (link.path === 'pet-gps' && (currentRoute === 'pet-gps' || currentRoute === '/pet-gps' || currentRoute === 'tracker' || currentRoute === '/tracker' || currentRoute === 'gps' || currentRoute === '/gps' || currentRoute === 'radar' || currentRoute === '/radar'));
              (link.path === 'community' && (currentRoute === 'community' || currentRoute === '/community' || currentRoute === 'social' || currentRoute === '/social')) ||
              (link.path === 'dashboard' && (currentRoute === 'dashboard' || currentRoute === '/dashboard' || currentRoute === 'portal' || currentRoute === '/portal'));
            return (
              <a
                key={link.label}
                href={`#${link.path}`}
                onClick={(e) => handleNavClick(link.path, e)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#160F0C' : '#525B57',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                  textDecoration: 'none',
                  transition: 'all 0.18s ease'
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
              color: '#525B57',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Search size={18} />
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
              backgroundColor: currentRoute === 'cart' || currentRoute === '/cart' ? '#160F0C' : '#FFFFFF',
              border: '1px solid rgba(222, 217, 214, 0.7)',
              color: currentRoute === 'cart' || currentRoute === '/cart' ? '#FFFFFF' : '#160F0C',
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
              backgroundColor: '#160F0C',
              color: '#FFFFFF',
              border: '2px solid #FDF8F5',
              fontSize: '10px',
              fontWeight: 700,
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

          {/* Stitch Elevated "Book Consult" Button */}
          <button
            onClick={() => handleNavClick('book-vet')}
            className="btn-elevate editorial-book-consult-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#160F0C',
              color: '#FFFFFF',
              padding: '9px 20px',
              borderRadius: '9999px',
              fontSize: '12px',
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
              backgroundColor: '#45848D',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(69, 132, 141, 0.25)',
              marginLeft: '2px'
            }}
          >
            {currentUser && currentUser.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.src = '/assets/images/tail_wagging_logo.png'; }}
              />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
            )}
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
              border: '1px solid rgba(222, 217, 214, 0.7)',
              backgroundColor: '#FFFFFF',
              color: '#160F0C',
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
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(222, 217, 214, 0.7)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={`#${link.path}`}
              onClick={(e) => handleNavClick(link.path, e)}
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: '#160F0C',
                textDecoration: 'none',
                padding: '8px 0'
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(222, 217, 214, 0.5)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleNavClick('book-vet')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9999px',
                backgroundColor: '#160F0C',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
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
                backgroundColor: '#F8F3EF',
                color: '#160F0C',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid #DED9D6',
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
