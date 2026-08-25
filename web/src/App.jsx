import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
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
      return <LandingPage />;
    }

    switch (activeTab) {
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <Dashboard />;
      case 'tracker':
        return <PetTracker />;
      case 'vets':
        return <Specialists />;
      case 'ai':
        return <HealthTriage />;
      case 'food':
        return <NutritionBreeds />;
      case 'community':
        return <Community />;
      case 'shop':
        return <Shop />;
      case 'vaccines':
        return <Reminders />;
      case 'profile':
        return <Profile />;
      default:
        return currentUser ? <Dashboard /> : <LandingPage />;
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className={isLanding ? "apple-landing-main" : "app-main"}>
        {renderActiveScreen()}
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
