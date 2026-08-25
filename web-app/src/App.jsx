import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Toast from './components/Toast';
import ModalRoot from './components/Modals/ModalRoot';

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

  const renderActiveScreen = () => {
    switch (activeTab) {
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
      case 'admin':
        return <AdminPortal />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="app-main">
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
