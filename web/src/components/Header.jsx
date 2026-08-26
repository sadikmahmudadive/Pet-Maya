import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, 
  Moon, 
  ShoppingBag, 
  Sparkles,
  ShieldAlert,
  ChevronDown,
  MoreVertical,
  X
} from 'lucide-react';

export default function Header() {
  const { activeTab, setActiveTab, theme, toggleTheme, cartCount, openModal, showToast } = useApp();
  const { currentUser, loginAsGuest } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleBrandClick = (e) => {
    e.preventDefault();
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

  const handleProtectedNav = (tabId, featureName) => {
    if (currentUser) {
      setActiveTab(tabId);
    } else {
      openModal('auth');
      showToast(`🔒 Please sign in to access ${featureName}`, 'info');
    }
  };

  return (
    <header className="apple-nav-wrapper">
      <div className="apple-nav-inner">
        {/* Apple Brand Logo */}
        <div className="apple-brand" onClick={handleBrandClick}>
          <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" />
          <span>Pet Maya</span>
        </div>

        {/* Global Navigation Links - Perfectly Aligned with Discover More */}
        <ul className={`apple-nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          {currentUser ? (
            <>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'shop' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('shop'); setIsMobileMenuOpen(false); }}
                >
                  Pet Shop
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('tracker'); setIsMobileMenuOpen(false); }}
                >
                  Tracker
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('ai'); setIsMobileMenuOpen(false); }}
                >
                  Wellness
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'vets' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('vets'); setIsMobileMenuOpen(false); }}
                >
                  Specialists
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'community' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('community'); setIsMobileMenuOpen(false); }}
                >
                  Community
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'food' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('food'); setIsMobileMenuOpen(false); }}
                >
                  Blog
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'vaccines' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('vaccines'); setIsMobileMenuOpen(false); }}
                >
                  Reminders
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'landing' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('landing'); setIsMobileMenuOpen(false); }}
                >
                  Overview
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'landing' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('landing'); setIsMobileMenuOpen(false); }}
                >
                  Overview
                </button>
              </li>
              <li>
                <button 
                  className="apple-nav-item"
                  onClick={() => { handleProtectedNav('shop', 'Pet Shop'); setIsMobileMenuOpen(false); }}
                >
                  Pet Shop
                </button>
              </li>
              <li>
                <button 
                  className="apple-nav-item"
                  onClick={() => { handleProtectedNav('tracker', 'Tracker'); setIsMobileMenuOpen(false); }}
                >
                  Tracker
                </button>
              </li>
              <li>
                <button 
                  className="apple-nav-item"
                  onClick={() => { handleProtectedNav('ai', 'Wellness'); setIsMobileMenuOpen(false); }}
                >
                  Wellness
                </button>
              </li>
              <li>
                <button 
                  className="apple-nav-item"
                  onClick={() => { handleProtectedNav('vets', 'Specialists'); setIsMobileMenuOpen(false); }}
                >
                  Specialists
                </button>
              </li>
              <li>
                <button 
                  className="apple-nav-item"
                  onClick={() => { handleProtectedNav('community', 'Community'); setIsMobileMenuOpen(false); }}
                >
                  Community
                </button>
              </li>
              <li>
                <button 
                  className="apple-nav-item"
                  onClick={() => { handleProtectedNav('food', 'Blog'); setIsMobileMenuOpen(false); }}
                >
                  Blog
                </button>
              </li>
              <li>
                <button 
                  className="apple-nav-item"
                  onClick={() => { handleProtectedNav('vaccines', 'Reminders'); setIsMobileMenuOpen(false); }}
                >
                  Reminders
                </button>
              </li>
              <li>
                <a 
                  href="#mobile-downloads" 
                  className="apple-nav-item"
                  onClick={() => { setActiveTab('landing'); setIsMobileMenuOpen(false); }}
                >
                  iOS &amp; Android App
                </a>
              </li>
            </>
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
            style={{ width: 30, height: 30, position: 'relative' }}
            title="Shopping Bag"
          >
            <ShoppingBag size={15} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: 'var(--primary)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button 
            className="icon-btn" 
            onClick={toggleTheme} 
            style={{ width: 30, height: 30 }}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User Profile Avatar / Sign In */}
          {currentUser ? (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
              title="Account & EHR"
            >
              <img 
                src={currentUser.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                alt={currentUser.name} 
                style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} 
              />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                className="apple-link-cta" 
                style={{ fontSize: '12px' }} 
                onClick={handleDemoClick}
              >
                Demo
              </button>
              <button 
                className="apple-btn-blue" 
                style={{ padding: '4px 12px', fontSize: '12px' }} 
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
            style={{ width: 30, height: 30, marginLeft: '4px' }}
            title="Menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <MoreVertical size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
