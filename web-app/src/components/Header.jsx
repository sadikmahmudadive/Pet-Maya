import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Radar, 
  Stethoscope, 
  Activity, 
  Utensils, 
  Users, 
  ShoppingBag, 
  Bell, 
  User, 
  ShieldAlert, 
  Sun, 
  Moon, 
  ShoppingCart,
  Award,
  Sparkles
} from 'lucide-react';

export default function Header() {
  const { activeTab, setActiveTab, theme, toggleTheme, cartCount, openModal } = useApp();
  const { currentUser, switchRole } = useAuth();

  const role = currentUser?.role || 'Pet Owner';

  // Define tab navigation based on active user role
  const getNavTabs = () => {
    if (role.toLowerCase().includes('vet') || role.toLowerCase().includes('doctor')) {
      return [
        { id: 'dashboard', label: 'Console', icon: Activity },
        { id: 'vets', label: 'Appointments', icon: Stethoscope },
        { id: 'vaccines', label: 'Patient EHR', icon: Bell },
        { id: 'shop', label: 'Supplies', icon: ShoppingBag },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'profile', label: 'Clinic Profile', icon: User }
      ];
    } else if (role.toLowerCase().includes('shop') || role.toLowerCase().includes('merchant')) {
      return [
        { id: 'shop', label: 'Catalog & Orders', icon: ShoppingBag },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'profile', label: 'Store Profile', icon: User }
      ];
    } else if (role.toLowerCase().includes('groom') || role.toLowerCase().includes('board')) {
      return [
        { id: 'vets', label: 'Service Queue', icon: Stethoscope },
        { id: 'vaccines', label: 'Guest Pets', icon: Bell },
        { id: 'shop', label: 'Supplies', icon: ShoppingBag },
        { id: 'profile', label: 'Provider Profile', icon: User }
      ];
    } else {
      // Default: Pet Owner
      return [
        { id: 'dashboard', label: 'Home', icon: Home },
        { id: 'tracker', label: 'Pet Tracker', icon: Radar },
        { id: 'vets', label: 'Specialists', icon: Stethoscope },
        { id: 'ai', label: 'Health Triage', icon: Activity },
        { id: 'food', label: 'Nutrition & Breeds', icon: Utensils },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'shop', label: 'Shop', icon: ShoppingBag },
        { id: 'vaccines', label: 'Reminders', icon: Bell },
        { id: 'profile', label: 'Profile', icon: User }
      ];
    }
  };

  const navTabs = getNavTabs();

  return (
    <header className="app-header">
      {/* Brand Logo & Name */}
      <div className="brand-wrap" onClick={() => setActiveTab('dashboard')}>
        <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" className="brand-logo" />
        <span className="brand-title">Pet Maya</span>
      </div>

      {/* Navigation Pills */}
      <nav className="nav-tabs">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Admin Tab (Always accessible for demo governance) */}
        <button
          className={`nav-pill ${activeTab === 'admin' ? 'active' : ''}`}
          style={{ background: activeTab === 'admin' ? '#ef4444' : 'rgba(239,68,68,0.1)', color: activeTab === 'admin' ? '#fff' : '#ef4444' }}
          onClick={() => setActiveTab('admin')}
        >
          <ShieldAlert size={16} />
          <span>Admin</span>
        </button>
      </nav>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Reward Points Pill */}
        {currentUser && (
          <div 
            className="badge badge-yellow" 
            style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
            onClick={() => setActiveTab('profile')}
            title="Earn points by referring friends & completing pet care milestones"
          >
            <Award size={14} />
            <span>{currentUser.points ?? 45} pts</span>
          </div>
        )}

        {/* Cart Button */}
        <button className="icon-btn" onClick={() => openModal('cart')} style={{ position: 'relative' }}>
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#10b981',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(16,185,129,0.5)'
            }}>
              {cartCount}
            </span>
          )}
        </button>

        {/* Dark/Light Theme Toggle */}
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Profile Avatar / Sign-In Button */}
        {currentUser ? (
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => setActiveTab('profile')}
          >
            <img 
              src={currentUser.photoUrl || 'assets/images/tail_wagging_logo.png'} 
              alt={currentUser.name} 
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
            />
          </div>
        ) : (
          <button className="btn-primary" onClick={() => openModal('auth')}>
            <Sparkles size={16} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
