import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import GlobalBanner from './components/GlobalBanner';
import Header from './components/Header';
import Toast from './components/Toast';
import ModalRoot from './components/Modals/ModalRoot';

import LandingPage from './components/Landing/LandingPage';
import Dashboard from './components/Dashboard/Dashboard';
import PetTracker from './components/Tracker/PetTracker';
import Specialists from './components/Specialists/Specialists';
import HealthTriage from './components/Triage/HealthTriage';
import NutritionBreeds from './components/Nutrition/NutritionBreeds';
import Community from './components/Community/Community';
import Shop from './components/Shop/Shop';
import Reminders from './components/Reminders/Reminders';
import Profile from './components/Profile/Profile';
import AdminPortal from './components/Admin/AdminPortal';

import { motion, AnimatePresence } from 'framer-motion';

function MainContent() {
  const { activeTab } = useApp();
  const { currentUser } = useAuth();

  // Subdomain check: admin.petmaya.app (or admin.localhost, ?portal=admin, /admin)
  const isAdminSubdomain = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('admin.') || 
    window.location.search.includes('portal=admin') ||
    window.location.pathname.startsWith('/admin')
  );

  // If accessed via admin subdomain, route directly to dedicated Admin Portal
  if (isAdminSubdomain) {
    return (
      <div className="app-container" style={{ padding: '24px 16px' }}>
        <AdminPortal />
        <ModalRoot />
        <Toast />
      </div>
    );
  }

  // Standard consumer site: enforce landing page presentation for unsigned users
  const isLanding = !currentUser || activeTab === 'landing';

  const renderActiveScreen = () => {
    if (isLanding) {
      return <LandingPage key="landing" />;
    }

    switch (activeTab) {
      case 'landing':
        return <LandingPage key="landing" />;
      case 'dashboard':
        return <Dashboard key="dashboard" />;
      case 'tracker':
        return <PetTracker key="tracker" />;
      case 'vets':
        return <Specialists key="vets" />;
      case 'ai':
        return <HealthTriage key="ai" />;
      case 'food':
        return <NutritionBreeds key="food" />;
      case 'community':
        return <Community key="community" />;
      case 'shop':
        return <Shop key="shop" />;
      case 'vaccines':
        return <Reminders key="vaccines" />;
      case 'profile':
        return <Profile key="profile" />;
      default:
        return currentUser ? <Dashboard key="dashboard" /> : <LandingPage key="landing" />;
    }
  };

  return (
    <div className="app-container">
      <Header />
      <GlobalBanner />
      <main className={isLanding ? "apple-landing-main" : "app-main"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%' }}
          >
            {renderActiveScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      <ModalRoot />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}
