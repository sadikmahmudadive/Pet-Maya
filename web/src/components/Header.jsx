import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, 
  Moon, 
  ShoppingBag, 
  Sparkles,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';

export default function Header() {
  const { activeTab, setActiveTab, theme, toggleTheme, cartCount, openModal, showToast } = useApp();
  const { currentUser, loginAsGuest } = useAuth();

  const role = currentUser?.role || 'Pet Owner';

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

  return (
    <header className="apple-nav-wrapper">
      <div className="apple-nav-inner">
        {/* Apple Brand Logo */}
        <div className="apple-brand" onClick={handleBrandClick}>
          <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" />
          <span>Pet Maya</span>
        </div>

        {/* Apple.com Global Navigation Links */}
        <ul className="apple-nav-links">
          {currentUser ? (
            <>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tracker')}
                >
                  Sonar Radar
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ai')}
                >
                  AI Vision
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'vets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vets')}
                >
                  Specialists
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'food' ? 'active' : ''}`}
                  onClick={() => setActiveTab('food')}
                >
                  Nutrition
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'shop' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shop')}
                >
                  Store
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'vaccines' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vaccines')}
                >
                  Passport
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'landing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('landing')}
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
                  onClick={() => setActiveTab('landing')}
                >
                  Overview
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tracker')}
                >
                  Sonar Radar
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ai')}
                >
                  AI Triage
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'vets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vets')}
                >
                  Specialists
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'food' ? 'active' : ''}`}
                  onClick={() => setActiveTab('food')}
                >
                  Nutrition
                </button>
              </li>
              <li>
                <button 
                  className={`apple-nav-item ${activeTab === 'shop' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shop')}
                >
                  Pharmacy &amp; Store
                </button>
              </li>
              <li>
                <a 
                  href="#mobile-downloads" 
                  className="apple-nav-item"
                  onClick={() => setActiveTab('landing')}
                >
                  iOS &amp; Android App
                </a>
              </li>
            </>
          )}

          {/* Super Admin Access */}
          <li>
            <button 
              className={`apple-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              style={{ color: '#EF4444' }}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          </li>
        </ul>

        {/* Right Nav Utilities */}
        <div className="apple-nav-actions">
          {/* Shopping Bag */}
          <button 
            className="icon-btn" 
            onClick={() => openModal('cart')} 
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
              onClick={() => setActiveTab('profile')}
              title="Account & EHR"
            >
              <img 
                src={currentUser.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                alt={currentUser.name} 
                style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary)' }} 
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
        </div>
      </div>
    </header>
  );
}
