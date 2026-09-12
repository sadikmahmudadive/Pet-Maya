import React, { useEffect } from 'react';
// Pet Maya Web Portal - v2.5.0 Production Build
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import GlobalBanner from './components/GlobalBanner';
import Header from './components/Header';
import Toast from './components/Toast';
import PermissionPrompt from './components/PermissionPrompt';
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

const TAB_SEO_MAP = {
  landing: {
    title: 'Pet Maya — Modern Pet Healthcare, Live GPS Radar & AI Triage Portal',
    description: 'Pet Maya is the next-generation pet healthcare ecosystem: Sub-meter satellite GPS radar, AI vision health diagnostics, 500+ verified veterinary specialists, genuine pet pharmacy, and community network.'
  },
  shop: {
    title: 'Pet Shop & Pharmacy — Buy Diets, Meds & GPS Collars | Pet Maya',
    description: 'Shop authentic veterinary prescription medications, clinically formulated diets (Royal Canin, Purina), and 4G smart GPS tracking collars with cold-chain delivery across Bangladesh.'
  },
  vets: {
    title: 'Find Verified Veterinarians & Specialists | Pet Maya Healthcare',
    description: 'Book online teleconsultations and in-clinic visits with 500+ verified veterinarians, surgeons, dermatologists, and pet specialists in Dhaka, Chittagong, and Sylhet.'
  },
  ai: {
    title: 'Clinical AI Vision Health Triage & Symptom Checker | Pet Maya',
    description: 'Free multi-modal AI pet symptom checker. Instant first-aid triage protocol, lesion analysis, and differential veterinary guidance for dogs, cats, birds, and rabbits.'
  },
  tracker: {
    title: 'Live Pet Radar & Satellite GPS Smart Collar Tracking | Pet Maya',
    description: 'Real-time cellular GPS tracking, geofence boundary escape alerts, activity telemetry, and acoustic chime with sub-2-meter satellite accuracy.'
  },
  community: {
    title: 'Pet Parent Community Feed & Lost Pet Alerts | Pet Maya',
    description: 'Join verified pet owners across Bangladesh. Share clinical milestones, moments, adoption stories, and real-time community lost & found pet radar alerts.'
  },
  food: {
    title: 'Pet Nutrition & Scientific Breed Care Guides | Pet Maya',
    description: 'Veterinary-reviewed clinical nutrition advice, breed-specific dietary requirements, calorie calculators, and preventive care regimens.'
  },
  vaccines: {
    title: 'Digital Pet Passport & Vaccination Schedule Reminders | Pet Maya',
    description: 'Official WHO-aligned vaccination milestones, rabies booster alarms, calendar export, and paperless electronic medical passport.'
  },
  dashboard: {
    title: 'My Pets & Health Dashboard | Pet Maya',
    description: 'Manage your pet family, monitor vital activity scores, schedule upcoming vet appointments, and access quick medical triage.'
  },
  profile: {
    title: 'My Profile & Cloud EHR Medical Records | Pet Maya',
    description: 'Encrypted Electronic Health Records (EHR), verified clinical diagnoses, prescriptions history, referral rewards, and account security.'
  }
};

function MainContent() {
  const { activeTab, setActiveTab } = useApp();
  const { currentUser } = useAuth();

  // Initial URL hash navigation on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const validTabs = ['landing', 'shop', 'vets', 'ai', 'tracker', 'community', 'food', 'vaccines', 'dashboard', 'profile'];
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, [setActiveTab]);

  // Dynamic SEO metadata & URL hash update on tab change
  useEffect(() => {
    const seo = TAB_SEO_MAP[activeTab] || TAB_SEO_MAP.landing;
    document.title = seo.title;
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = seo.description;

    // Update OpenGraph title and description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = seo.title;
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = seo.description;

    // Sync URL hash for bookmarking and SEO
    if (activeTab && activeTab !== 'landing') {
      window.history.replaceState(null, '', `#${activeTab}`);
    } else if (activeTab === 'landing') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [activeTab]);

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

  // Standard consumer site: landing page for overview or default unsigned visit
  const isLanding = activeTab === 'landing' || (!currentUser && activeTab === 'dashboard');

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
      <PermissionPrompt />
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
