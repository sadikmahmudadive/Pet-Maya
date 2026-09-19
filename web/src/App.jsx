import React, { useEffect, useState, useCallback } from 'react';
// Pet Maya Web Portal - v3.0.0 Duna-Inspired Editorial Architecture
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import GlobalBanner from './components/GlobalBanner';
import Header from './components/Header';
import Toast from './components/Toast';
import PermissionPrompt from './components/PermissionPrompt';
import ModalRoot from './components/Modals/ModalRoot';
import QuickActionSheet from './components/Common/QuickActionSheet';

// Editorial Components
import EditorialNavbar from './components/Navigation/EditorialNavbar';
import EditorialFooter from './components/Navigation/EditorialFooter';
import LandingPage from './components/Landing/LandingPage';
import ProductFeatures from './components/Pages/ProductFeatures';
import DigitalPassportPage from './components/Pages/DigitalPassportPage';
import AIPetCarePage from './components/Pages/AIPetCarePage';
import PetGPSPage from './components/Pages/PetGPSPage';
import ConnectedCarePage from './components/Pages/ConnectedCarePage';
import SolutionsPages from './components/Pages/SolutionsPages';
import PetHealthHub from './components/Pages/PetHealthHub';
import EditorialCompanyPages from './components/Pages/EditorialCompanyPages';
import AuthPage from './components/Pages/AuthPage';

// Functional App Platform Views
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
import VetBookingFlow from './components/Specialists/VetBookingFlow';

import { motion, AnimatePresence } from 'framer-motion';

const TAB_SEO_MAP = {
  landing: {
    title: 'Pet Maya — Better care for the pets you love | Connected Healthcare',
    description: 'Pet Maya brings digital health records, clinical AI triage, satellite GPS radar, and verified veterinary care together in one simple platform.'
  },
  features: {
    title: 'Platform Features & Connected Architecture | Pet Maya',
    description: 'Explore all capabilities of the Pet Maya connected pet healthcare ecosystem: Digital Passport, GPS Radar, AI Scanner, and Veterinary Telehealth.'
  },
  'digital-pet-passport': {
    title: 'Digital Pet Passport & ISO Microchip Health Vault | Pet Maya',
    description: 'Permanent cloud medical vault for vaccinations, rabies certification, surgical history, and paperless travel QR identity check.'
  },
  'ai-pet-care': {
    title: 'Clinical AI Vision Triage & Symptom Checker | Pet Maya',
    description: 'Multi-modal diagnostic triage that analyzes symptom photos, anatomical regions, and standardized veterinary urgency levels.'
  },
  'pet-gps': {
    title: 'Live GPS Satellite Radar & Smart Safety Collar | Pet Maya',
    description: 'Sub-2-meter multi-constellation GPS tracking, 3-second boundary geofence push alarms, and an 85dB recovery siren.'
  },
  'connected-care': {
    title: 'Connected Care & IoT Wearable Collar Sensors | Pet Maya',
    description: 'Continuous biometric telemetry, Bluetooth proximity beacons, and real-time cloud vitals synchronization for dogs and cats.'
  },
  'for-pet-parents': {
    title: 'Pet Maya for Pet Parents — Proactive Care for Family | Pet Maya',
    description: 'Keep your pet healthy, happy, and safe with automated vaccination timelines, smart radar tracking, and 24/7 veterinary support.'
  },
  'for-veterinarians': {
    title: 'For Verified Veterinarians & Specialists | Pet Maya Clinical Network',
    description: 'Join 500+ clinicians offering HD video teleconsultations, digital prescription dispensing, and verified EHR patient records.'
  },
  'for-clinics': {
    title: 'Veterinary Hospital & Multi-Doctor Scheduling | Pet Maya',
    description: 'Equip your veterinary clinic with unified digital health records, online appointment booking, and automated client follow-ups.'
  },
  'pet-health': {
    title: 'Pet Health Knowledge Hub & Preventative Care | Pet Maya',
    description: 'Evidence-based canine and feline health articles, vaccination guidelines, emergency first aid, and clinical nutrition.'
  },
  'pet-care': {
    title: 'Pet Nutrition & Scientific Breed Care Guides | Pet Maya',
    description: 'Veterinary-reviewed clinical nutrition advice, breed-specific dietary requirements, calorie calculators, and preventive care regimens.'
  },
  blog: {
    title: 'Pet Maya Journal — Stories in Veterinary Medicine & Tech',
    description: 'Editorial essays, clinical veterinary updates, canine lifestyle advice, and advances in pet health technology.'
  },
  about: {
    title: 'About Pet Maya — Our Mission, Ethics & Clinical Advisory Board',
    description: 'Learn why we started Pet Maya and our commitment to treating pet healthcare with the same dignity and precision as human health.'
  },
  contact: {
    title: 'Contact Pet Maya — Support & Veterinary Clinic Onboarding',
    description: 'Get in touch with the Pet Maya support team, order smart collars, or onboard your veterinary clinic to the clinical network.'
  },
  faq: {
    title: 'Frequently Asked Questions — Pet Maya Connected Ecosystem',
    description: 'Find answers about the Digital Pet Passport, GPS tracking accuracy, AI triage capabilities, and data security.'
  },
  privacy: {
    title: 'Privacy Policy & Medical Data Security | Pet Maya',
    description: 'How Pet Maya protects electronic health records with AES-256 cloud encryption and owner-controlled veterinary access.'
  },
  terms: {
    title: 'Terms of Service & Clinical Care Disclaimers | Pet Maya',
    description: 'Terms of service, emergency medical boundaries, and account responsibilities for the Pet Maya platform.'
  },
  // Platform App Views
  shop: {
    title: 'Prescription Formulary & Clinical Biologics | Pet Maya Veterinary Medicine',
    description: 'Cold-chain monitored pharmaceuticals, targeted veterinary nutrition, and bio-engineered therapeutics verified under strict veterinarian oversight.'
  },
  vets: {
    title: 'Find Verified Veterinarians & Teleconsultations | Pet Maya',
    description: 'Book online teleconsultations and in-clinic visits with 500+ verified veterinarians and pet specialists.'
  },
  ai: {
    title: 'Evidence-Based AI Veterinary Triage | Pet Maya Veterinary Medicine',
    description: "Pet Maya's algorithmic triage system cross-references 12,000+ veterinary protocols to calmly evaluate symptoms, identify urgency tiers, and provide immediate stabilizing steps."
  },
  wellness: {
    title: 'Evidence-Based AI Veterinary Triage | Pet Maya Veterinary Medicine',
    description: "Pet Maya's algorithmic triage system cross-references 12,000+ veterinary protocols to calmly evaluate symptoms, identify urgency tiers, and provide immediate stabilizing steps."
  },
  tracker: {
    title: 'Live GPS Radar & Smart Collar Telemetry | Pet Maya',
    description: 'Real-time cellular GPS tracking, geofence boundary escape alerts, activity telemetry, and acoustic chime.'
  },
  community: {
    title: 'Pet Parent Community Feed & Lost Pet Alerts | Pet Maya',
    description: 'Join verified pet owners across Bangladesh. Share clinical milestones, moments, and real-time Amber Alerts.'
  },
  food: {
    title: 'Pet Nutrition & Scientific Diets | Pet Maya',
    description: 'Veterinary calorie calculators, breed specs, and clinical feeding plans.'
  },
  vaccines: {
    title: 'Immunization Schedule & Digital Passport | Pet Maya',
    description: 'Official vaccination milestones, rabies booster alarms, and calendar export.'
  },
  dashboard: {
    title: 'My Pets & Health Dashboard | Pet Maya',
    description: 'Manage your pet family, monitor vital activity scores, and schedule upcoming vet appointments.'
  },
  profile: {
    title: 'My Profile & Cloud EHR Medical Records | Pet Maya',
    description: 'Encrypted Electronic Health Records (EHR), verified clinical diagnoses, and prescriptions history.'
  },
  'book-vet': {
    title: 'Schedule Veterinary Appointment & Teleconsultation | Pet Maya',
    description: '3-step appointment booking with verified veterinarians, in-clinic exams, and HD video consultations.'
  },
  login: {
    title: 'Guardian Portal Access & Sign In | Pet Maya Veterinary Medicine',
    description: 'Access your pet companion health vault, ISO microchip registry, telehealth consults, and clinical history.'
  },
  signin: {
    title: 'Guardian Portal Access & Sign In | Pet Maya Veterinary Medicine',
    description: 'Access your pet companion health vault, ISO microchip registry, telehealth consults, and clinical history.'
  },
  signup: {
    title: 'Register Sovereign Guardian Account & Microchip | Pet Maya',
    description: 'Create your Pet Maya guardian account. Link ISO 11784 microchips, unlock 24/7 veterinary triage, and digital health records.'
  },
  auth: {
    title: 'Guardian Portal Access & Sign In | Pet Maya Veterinary Medicine',
    description: 'Access your pet companion health vault, ISO microchip registry, telehealth consults, and clinical history.'
  }
};

const VALID_EDITORIAL_ROUTES = [
  'landing', 'features', 'digital-pet-passport', 'ai-pet-care', 'pet-gps', 
  'connected-care', 'for-pet-parents', 'for-veterinarians', 'for-clinics', 
  'pet-health', 'pet-care', 'blog', 'about', 'contact', 'faq', 'privacy', 'terms', 'book-vet',
  'login', 'signin', 'signup', 'auth', 'shop', 'ai', 'wellness', 'specialists', 'vets'
];

const VALID_APP_ROUTES = [
  'dashboard', 'vets', 'tracker', 'community', 'food', 'vaccines', 'profile'
];

function MainContent() {
  const { activeTab, setActiveTab } = useApp();
  const { currentUser } = useAuth();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Synchronize route from URL pathname and hash
  const resolveCurrentRoute = useCallback(() => {
    // 1. Check hash first if present (e.g. #dashboard, #shop, #tracker, #shop-product/p1)
    const rawHash = window.location.hash.replace('#', '');
    const hash = rawHash.toLowerCase();
    if (hash.startsWith('shop-product/')) {
      return 'shop';
    }
    if (hash && (VALID_EDITORIAL_ROUTES.includes(hash) || VALID_APP_ROUTES.includes(hash))) {
      return hash;
    }
    // 2. Check pathname (e.g. /digital-pet-passport, /features)
    const rawPath = window.location.pathname.replace(/^\//, '');
    const path = rawPath.toLowerCase();
    if (path.startsWith('shop-product/')) {
      return 'shop';
    }
    if (path && (VALID_EDITORIAL_ROUTES.includes(path) || VALID_APP_ROUTES.includes(path))) {
      return path;
    }
    return 'landing';
  }, []);

  // Initial and dynamic routing listener
  useEffect(() => {
    const handleRouteChange = () => {
      const route = resolveCurrentRoute();
      if (route) {
        setActiveTab(route);
      }
    };
    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [resolveCurrentRoute, setActiveTab]);

  // Dynamic SEO metadata update
  useEffect(() => {
    const seo = TAB_SEO_MAP[activeTab] || TAB_SEO_MAP.landing;
    document.title = seo.title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = seo.description;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = seo.title;
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = seo.description;

    // Sync URL cleanly
    if (activeTab && activeTab !== 'landing') {
      if (activeTab === 'shop' && window.location.hash.startsWith('#shop-product/')) {
        // Keep active product hash
      } else if (VALID_EDITORIAL_ROUTES.includes(activeTab)) {
        window.history.replaceState(null, '', `/${activeTab}`);
      } else {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } else if (activeTab === 'landing') {
      window.history.replaceState(null, '', '/');
    }
  }, [activeTab]);

  // Subdomain check: admin.petmaya.app / portal=admin / /admin
  const isAdminSubdomain = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('admin.') || 
    window.location.search.includes('portal=admin') ||
    window.location.pathname.startsWith('/admin')
  );

  if (isAdminSubdomain) {
    return (
      <div className="app-container" style={{ padding: '24px 16px' }}>
        <AdminPortal />
        <ModalRoot />
        <Toast />
      </div>
    );
  }

  // Navigation dispatcher
  const handleNavigate = (target) => {
    const cleanTarget = target.replace(/^\//, '').replace(/^#/, '');
    setActiveTab(cleanTarget);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine whether current view is an editorial marketing page
  const isEditorial = VALID_EDITORIAL_ROUTES.includes(activeTab) || activeTab === 'landing';

  // Render current screen component
  const renderActiveScreen = () => {
    switch (activeTab) {
      // Editorial marketing & product pages
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} key="landing" />;
      case 'features':
        return <ProductFeatures onNavigate={handleNavigate} key="features" />;
      case 'digital-pet-passport':
        return <DigitalPassportPage onNavigate={handleNavigate} key="passport" />;
      case 'ai-pet-care':
        return <HealthTriage key="ai-pet-care" onNavigate={handleNavigate} />;
      case 'pet-gps':
        return <PetGPSPage onNavigate={handleNavigate} key="pet-gps" />;
      case 'connected-care':
        return <ConnectedCarePage onNavigate={handleNavigate} key="connected-care" />;
      case 'for-pet-parents':
        return <SolutionsPages type="parents" onNavigate={handleNavigate} key="parents" />;
      case 'for-veterinarians':
        return <SolutionsPages type="vets" onNavigate={handleNavigate} key="vets" />;
      case 'for-clinics':
        return <SolutionsPages type="clinics" onNavigate={handleNavigate} key="clinics" />;
      case 'pet-health':
      case 'pet-care':
        return <PetHealthHub onNavigate={handleNavigate} key="health-hub" />;
      case 'about':
        return <EditorialCompanyPages page="about" onNavigate={handleNavigate} key="about" />;
      case 'contact':
        return <EditorialCompanyPages page="contact" onNavigate={handleNavigate} key="contact" />;
      case 'faq':
        return <LandingPage onNavigate={handleNavigate} key="faq" />;
      case 'blog':
        return <PetHealthHub onNavigate={handleNavigate} key="blog" />;
      case 'privacy':
        return <EditorialCompanyPages page="privacy" onNavigate={handleNavigate} key="privacy" />;
      case 'terms':
        return <EditorialCompanyPages page="terms" onNavigate={handleNavigate} key="terms" />;
      case 'book-vet':
        return <VetBookingFlow key="book-vet" onComplete={() => handleNavigate('dashboard')} />;
      case 'login':
      case 'signin':
      case 'auth':
        return <AuthPage initialMode="signin" onNavigate={handleNavigate} key="auth-signin" />;
      case 'signup':
        return <AuthPage initialMode="signup" onNavigate={handleNavigate} key="auth-signup" />;

      // Application platform views
      case 'dashboard':
        return <Dashboard key="dashboard" />;
      case 'tracker':
        return <PetTracker key="tracker" />;
      case 'specialists':
      case 'vets':
        return <Specialists key="specialists" onNavigate={handleNavigate} />;
      case 'ai':
      case 'wellness':
        return <HealthTriage key="ai" onNavigate={handleNavigate} />;
      case 'food':
        return <NutritionBreeds key="food" />;
      case 'community':
        return <Community key="community" />;
      case 'shop':
        return <Shop key="shop" onNavigate={handleNavigate} />;
      case 'vaccines':
        return <Reminders key="vaccines" />;
      case 'profile':
        return <Profile key="profile" />;
      default:
        return <LandingPage onNavigate={handleNavigate} key="landing-default" />;
    }
  };

  // Dedicated Guardian Portal Auth Screen (renders standalone with its own protocol header & footer)
  const isAuthRoute = ['login', 'signin', 'signup', 'auth'].includes(activeTab);

  if (isAuthRoute) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8F5' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AuthPage
              initialMode={activeTab === 'signup' ? 'signup' : 'signin'}
              onNavigate={handleNavigate}
            />
          </motion.div>
        </AnimatePresence>
        <ModalRoot />
        <Toast />
      </div>
    );
  }

  // If viewing an editorial marketing page, wrap in EditorialNavbar and EditorialFooter
  if (isEditorial) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
        <EditorialNavbar currentRoute={activeTab} onNavigate={handleNavigate} />
        <main style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {renderActiveScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
        <EditorialFooter onNavigate={handleNavigate} />
        <ModalRoot />
        <Toast />
      </div>
    );
  }

  // Otherwise, user is viewing an app platform screen (Dashboard, Shop, Specialists, Tracker, etc.)
  return (
    <div className="app-container">
      <GlobalBanner />
      <Header />
      <main className="app-main">
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

      {/* Floating Action Bar */}
      <div
        className="fab-dock"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px'
        }}
      >
        <motion.button
          className="fab-pulse-btn"
          onClick={() => setIsQuickActionOpen(true)}
          aria-label="Quick Action Trigger"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 8px 24px rgba(26, 182, 128, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚡</span>
        </motion.button>
      </div>

      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />

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
