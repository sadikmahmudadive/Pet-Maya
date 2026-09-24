import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  INITIAL_PETS, 
  INITIAL_VETS, 
  INITIAL_PRODUCTS, 
  INITIAL_POSTS 
} from '../config/firebase';
import { useAuth } from './AuthContext';

export const INITIAL_DEVICES = [
  {
    id: 'pm_trk_01',
    name: "Max's GPS Collar",
    deviceType: 'gps_collar',
    modelNumber: 'PetMaya ProTrack Gen 2',
    serialNumber: 'PM-TRK-7821',
    petId: 'piku_01',
    petName: 'Piku',
    batteryLevel: 88,
    isOnline: true,
    signalStrength: 4,
    trackingMode: 'Real-Time (10s)',
    isSafeZone: true,
    firmwareVersion: 'v2.4.1',
    lastSync: '2m ago',
    latitude: 23.8103,
    longitude: 90.4125
  },
  {
    id: 'pm_trk_02',
    name: "Maya Smart Tag",
    deviceType: 'ble_beacon',
    modelNumber: 'PetMaya BLE Beacon Gen 1',
    serialNumber: 'PM-BLE-4109',
    petId: null,
    petName: 'Unassigned',
    batteryLevel: 95,
    isOnline: true,
    signalStrength: 3,
    trackingMode: 'Balanced (5m)',
    isSafeZone: true,
    firmwareVersion: 'v1.2.0',
    lastSync: '10m ago',
    latitude: 23.8115,
    longitude: 90.4140
  }
];

// Route to Tab Mapping & Document Titles
export const TAB_ROUTES = {
  landing: '/',
  overview: '/',
  features: '/features',
  'digital-pet-passport': '/digital-pet-passport',
  'ai-pet-care': '/ai-pet-care',
  'pet-gps': '/pet-gps',
  'connected-care': '/connected-care',
  'for-pet-parents': '/for-pet-parents',
  'for-veterinarians': '/for-veterinarians',
  'for-clinics': '/for-clinics',
  'pet-health': '/pet-health',
  'pet-care': '/pet-care',
  about: '/about',
  contact: '/contact',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  dashboard: '/dashboard',
  shop: '/shop',
  tracker: '/tracker',
  ai: '/ai',
  vets: '/specialists',
  community: '/community',
  food: '/blog',
  vaccines: '/reminders',
  profile: '/profile',
  admin: '/admin',
  'book-vet': '/book-vet',
  login: '/login',
  signin: '/login',
  signup: '/signup',
  auth: '/login',
  cart: '/cart',
  bag: '/cart',
  dispensary: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  tracking: '/orders',
  telemetry: '/orders',
  'order-tracking': '/orders',
};

export const ROUTE_TABS = {
  '/': 'landing',
  '/overview': 'landing',
  '/features': 'features',
  '/digital-pet-passport': 'digital-pet-passport',
  '/ai-pet-care': 'ai-pet-care',
  '/pet-gps': 'pet-gps',
  '/connected-care': 'connected-care',
  '/for-pet-parents': 'for-pet-parents',
  '/for-veterinarians': 'for-veterinarians',
  '/for-clinics': 'for-clinics',
  '/pet-health': 'pet-health',
  '/pet-care': 'pet-care',
  '/about': 'about',
  '/contact': 'contact',
  '/faq': 'faq',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/dashboard': 'dashboard',
  '/shop': 'shop',
  '/pet-shop': 'shop',
  '/cart': 'cart',
  '/bag': 'cart',
  '/dispensary': 'cart',
  '/checkout': 'checkout',
  '/orders': 'orders',
  '/order': 'orders',
  '/tracking': 'orders',
  '/telemetry': 'orders',
  '/order-tracking': 'orders',
  '/tracker': 'tracker',
  '/wellness': 'ai',
  '/ai': 'ai',
  '/specialists': 'vets',
  '/vets': 'vets',
  '/community': 'community',
  '/blog': 'blog',
  '/nutrition': 'food',
  '/reminders': 'vaccines',
  '/vaccines': 'vaccines',
  '/profile': 'profile',
  '/admin': 'admin',
  '/book-vet': 'book-vet',
  '/login': 'login',
  '/signin': 'login',
  '/signup': 'signup',
  '/auth': 'login',
};

const PAGE_TITLES = {
  landing: 'Pet Maya — Ultimate Pet Health, GPS Radar & Clinical Ecosystem',
  dashboard: 'Pet Maya — Real-Time Health & Pet Telemetry Dashboard',
  shop: 'Pet Maya — Veterinary Pharmacy, Diets & Smart GPS Collars',
  tracker: 'Pet Maya — Live GPS Radar, Sonar & Safe-Zone Telemetry',
  ai: 'Pet Maya — AI Vision Clinical Health Triage',
  vets: 'Pet Maya — Verified Specialists & Teleconsultation',
  community: 'Pet Maya — Pet Community & Moments Feed',
  food: 'Pet Maya — Clinical Nutrition & Veterinary Articles',
  vaccines: 'Pet Maya — Medical Passport & Vaccine Schedule',
  profile: 'Pet Maya — Account & Pet EHR Records',
  admin: 'Pet Maya — Administration Control Center',
  'book-vet': 'Pet Maya — Schedule Veterinary Appointment & Teleconsultation',
  login: 'Pet Maya — Guardian Portal Access & Sovereign Health Vault',
  signin: 'Pet Maya — Guardian Portal Access & Sovereign Health Vault',
  signup: 'Pet Maya — Register Sovereign Guardian Account & Microchip',
  auth: 'Pet Maya — Guardian Portal Access & Sovereign Health Vault',
};

const PAGE_DESCRIPTIONS = {
  landing: 'Pet Maya is the next-generation pet healthcare ecosystem: Sub-meter satellite GPS radar, AI vision health diagnostics, 500+ verified veterinary specialists, and genuine pet pharmacy.',
  dashboard: 'Monitor your pet’s health status, real-time GPS telemetry, upcoming clinic bookings, and biometric health score on the Pet Maya dashboard.',
  shop: 'Shop genuine veterinary prescription medications, specialty food diets, tick preventatives, and smart GPS radar tracking collars on Pet Maya.',
  tracker: 'Sub-meter satellite GPS pet radar with interactive sonar, geofence boundary breach alarms, and smart biometric collar sensors.',
  ai: 'Instant AI neural health triage: Scan pet eye, skin, dental, and mobility conditions with your smartphone camera for rapid symptom assessment.',
  vets: 'Book in-clinic consultations, surgeries, and HD video teleconsultations with 500+ verified veterinarians and livestock officers.',
  community: 'Join the Pet Maya pet parent community. Share moments, ask veterinary questions, like, comment, and celebrate pet memories.',
  food: 'Scientific RER/MER calorie calculators, dry/wet nutrition ratio guidelines, and expert veterinary dietary guides.',
  vaccines: 'Never miss an immunization: Digital vaccination passport with automated rabies reminders and 1-click Apple Calendar sync.',
  profile: 'Manage your verified pet owner profile, registered pets, electronic health records, and clinic appointment history.',
  admin: 'Pet Maya administrative control center for specialist approvals, inventory management, and platform metrics.',
  'book-vet': 'Schedule appointments and video teleconsultations with verified veterinarians and animal health clinicians.',
  login: 'Sign in to Pet Maya Guardian Portal. Manage electronic health records, cold-chain biologics formulary, and live collar telemetry.',
  signin: 'Sign in to Pet Maya Guardian Portal. Manage electronic health records, cold-chain biologics formulary, and live collar telemetry.',
  signup: 'Create your Pet Maya guardian account. Link ISO 11784 microchips, unlock 24/7 veterinary triage, and digital health records.',
  auth: 'Sign in to Pet Maya Guardian Portal. Manage electronic health records, cold-chain biologics formulary, and live collar telemetry.',
};

const resolveInitialTab = () => {
  if (typeof window === 'undefined') return 'landing';

  // 1. Check hash first if present (e.g. #dashboard, #shop, #shop-product/p1, #book-vet)
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  const hash = rawHash.toLowerCase();
  if (hash) {
    if (hash.startsWith('shop-product/') || hash.startsWith('product/')) return rawHash;
    if (hash === 'book-vet') return 'book-vet';
    if (ROUTE_TABS['/' + hash]) return ROUTE_TABS['/' + hash];
    if (TAB_ROUTES[hash]) return hash;
  }

  // 2. Check pathname (e.g. /digital-pet-passport, /features, /book-vet, /shop-product/p1)
  const rawPath = window.location.pathname.replace(/^\//, '');
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (pathname.startsWith('/shop-product/') || pathname.startsWith('/product/')) return rawPath;
  if (pathname !== '/' && ROUTE_TABS[pathname]) {
    return ROUTE_TABS[pathname];
  }

  if (pathname === '/') {
    return 'landing';
  }

  return localStorage.getItem('pm_active_tab') || 'landing';
};

const AppContext = createContext();

export function AppProvider({ children }) {
  const { currentUser, awardPoints } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState(resolveInitialTab);
  const [theme, setTheme] = useState(() => localStorage.getItem('pm_theme') || 'light');

  // Handle Browser Back / Forward button navigation
  useEffect(() => {
    const handlePopState = (event) => {
      const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const targetTab = ROUTE_TABS[pathname] || (event.state && event.state.tab);
      if (targetTab) {
        setActiveTab(targetTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize Browser Address Bar, Document Title & Meta Description when activeTab changes
  useEffect(() => {
    localStorage.setItem('pm_active_tab', activeTab);
    
    if (typeof window !== 'undefined') {
      const targetRoute = TAB_ROUTES[activeTab] || `/${activeTab}`;
      if (window.location.pathname !== targetRoute) {
        window.history.pushState({ tab: activeTab }, '', targetRoute);
      }

      if (PAGE_TITLES[activeTab]) {
        document.title = PAGE_TITLES[activeTab];
      }

      const metaDescTag = document.querySelector('meta[name="description"]');
      if (metaDescTag && PAGE_DESCRIPTIONS[activeTab]) {
        metaDescTag.setAttribute('content', PAGE_DESCRIPTIONS[activeTab]);
      }
    }
  }, [activeTab]);

  // Modals & Drawers
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Core Datasets with Client-Side Cache to eliminate initial flash of hardcoded mock data
  const [pets, setPets] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_cached_pets');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_PETS;
  });

  const [vets, setVets] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_cached_vets');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });
  const [isVetsLoading, setIsVetsLoading] = useState(() => {
    try {
      return !localStorage.getItem('pm_cached_vets');
    } catch (_) { return true; }
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_cached_products');
      if (saved) return JSON.parse(saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 24 && parsed[0]?.price >= 500) {
          return parsed;
        }
      }
    } catch (_) {}
    return INITIAL_PRODUCTS || [];
  });
  const [isProductsLoading, setIsProductsLoading] = useState(() => {
    try {
      return !localStorage.getItem('pm_cached_products');
    } catch (_) { return true; }
  });

  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_cached_posts');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_POSTS;
  });
  const [isPostsLoading, setIsPostsLoading] = useState(() => {
    try {
      return !localStorage.getItem('pm_cached_posts');
    } catch (_) { return true; }
  });
  const [usersMap, setUsersMap] = useState({});

  const [appointments, setAppointments] = useState([]);
  const [favoriteVetIds, setFavoriteVetIds] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_favorite_vets');
      return saved ? JSON.parse(saved) : ['vet-1', 'vet-2'];
    } catch (_) {
      return ['vet-1', 'vet-2'];
    }
  });
  const [medicalRecords, setMedicalRecords] = useState([]);

  // E-Commerce Cart
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('pm_cart', JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // Orders
  const [orders, setOrders] = useState([]);

  // Smart Hardware Devices (Trackers, GPS Collars, BLE Tags)
  const [devices, setDevices] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_cached_devices');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_DEVICES;
  });
  const [ringingDeviceId, setRingingDeviceId] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Global Promotional Banner
  const [globalBanner, setGlobalBanner] = useState(() => {
    const DEFAULT_BANNER = {
      isActive: true,
      text: "WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE WITH EVERY BESPOKE WELLNESS PLAN.",
      linkText: "",
      linkUrl: "#",
      bgColor: "#F8F3EF",
      textColor: "#707973"
    };
    try {
      const saved = localStorage.getItem('pm_global_banner');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.text && !parsed.text.includes('Shop online')) {
          return parsed;
        }
      }
    } catch (_) {}
    return DEFAULT_BANNER;
  });

  // Permissions & Device Geolocation
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [userLiveLocation, setUserLiveLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_user_location');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { lat: 23.8120, lng: 90.4150 };
  });

  // Request Device Location
  const requestLocationPermission = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'info');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLiveLocation(coords);
          setLocationPermission('granted');
          localStorage.setItem('pm_user_location', JSON.stringify(coords));
          showToast('📍 Live GPS location active & synced!', 'success');
          resolve(coords);
        },
        (err) => {
          console.warn('[Geolocation] Error:', err);
          setLocationPermission('denied');
          showToast('Location access was denied in browser settings', 'info');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  // Request Web Push Notifications
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Notifications are not supported by this browser', 'info');
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showToast('🔔 Live push alerts & boundary sirens enabled!', 'success');
        try {
          new Notification('Pet Maya Smart Care', {
            body: 'Live GPS boundary alarms and healthcare reminders are now active.',
            icon: '/assets/images/tail_wagging_logo.png'
          });
        } catch (_) {}
      } else if (permission === 'denied') {
        showToast('Notifications blocked in browser settings', 'info');
      }
      return permission;
    } catch (e) {
      console.warn('[Notification] request error:', e);
      return 'denied';
    }
  };

  // Dispatch Native Notification
  const sendPushNotification = (title, body, icon = '/assets/images/tail_wagging_logo.png') => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon });
      } catch (_) {}
    }
  };

  // Request both permissions in one click
  const requestAllPermissions = async () => {
    await requestNotificationPermission();
    await requestLocationPermission();
  };

  // ─── THEME SYNCHRONIZATION ───
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('pm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // ─── 1. FIREBASE REAL-TIME PETS LISTENER ───
  useEffect(() => {
    // Initial hydration from local cache
    const savedLocal = localStorage.getItem('pm_pets');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPets(parsed);
        }
      } catch (_) {}
    }

    if (!currentUser || currentUser.uid.startsWith('demo_guest')) {
      const saved = localStorage.getItem('pm_pets');
      setPets(saved ? JSON.parse(saved) : INITIAL_PETS);
      return;
    }

    try {
      const petsRef = collection(db, 'pets');
      const q = query(petsRef, where('ownerID', '==', currentUser.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedPets = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              petID: docSnap.id,
              name: data.name || 'Pet',
              species: data.species || data.type || 'Dove',
              breed: data.breed || 'Ring-necked Dove',
              gender: data.gender || 'Unknown',
              age: data.age || '1 Yr',
              weight: data.weight || '160 g',
              photo: data.photoUrl || data.photo || 'assets/images/Pet_1.jpg',
              microchip: data.microchip || data.microchipId || `PM-${docSnap.id.slice(0, 5).toUpperCase()}`,
              nextVaccine: data.nextVaccine || '2026-09-30'
            };
          });
          setPets(fetchedPets);
          try {
            localStorage.setItem('pm_pets', JSON.stringify(fetchedPets));
          } catch (_) {}
        } else {
          // User has no pets registered in Firestore yet
          setPets([]);
          try {
            localStorage.removeItem('pm_pets');
          } catch (_) {}
        }
      }, (err) => {
        console.warn('[Firebase] Pets stream warning:', err);
        setPets([]);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Error setting up pets listener:', e);
      const saved = localStorage.getItem('pm_pets');
      setPets(saved ? JSON.parse(saved) : INITIAL_PETS);
    }
  }, [currentUser]);

  // ─── 1.5 FIREBASE REAL-TIME GLOBAL BANNER LISTENER ───
  useEffect(() => {
    try {
      const savedLocal = localStorage.getItem('pm_global_banner');
      if (savedLocal) {
        try {
          setGlobalBanner(JSON.parse(savedLocal));
        } catch (_) {}
      }

      const bannerRef = doc(db, 'settings', 'globalBanner');
      const unsubscribe = onSnapshot(bannerRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGlobalBanner(data);
          localStorage.setItem('pm_global_banner', JSON.stringify(data));
        }
      }, (err) => {
        console.warn('[Firebase] Global banner stream warning:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Error setting up global banner listener:', e);
    }
  }, []);

  const updateGlobalBanner = async (newConfig) => {
    const sanitized = {
      isActive: Boolean(newConfig?.isActive),
      text: newConfig?.text || '',
      linkText: newConfig?.linkText || '',
      linkUrl: newConfig?.linkUrl || '',
      bgColor: newConfig?.bgColor || '#f5f5f7',
      textColor: newConfig?.textColor || '#1d1d1f',
      updatedAt: new Date().toISOString()
    };

    setGlobalBanner(sanitized); // Optimistic UI update
    localStorage.setItem('pm_global_banner', JSON.stringify(sanitized));

    try {
      const bannerRef = doc(db, 'settings', 'globalBanner');
      await setDoc(bannerRef, sanitized, { merge: true });
      showToast('🎉 Global banner updated successfully!', 'success');
    } catch (e) {
      console.warn('[Firebase] updateGlobalBanner notice:', e);
      // In guest or restricted rules mode, local persistence and active memory were already applied
      showToast('🎉 Global banner saved and active!', 'success');
    }
  };

  // ─── 2. FIREBASE REAL-TIME VETS LISTENER ───
  useEffect(() => {
    try {
      const vetsRef = collection(db, 'vets');
      const unsubscribe = onSnapshot(vetsRef, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedVets = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || 'Specialist',
              qualification: data.qualification || 'DVM',
              tag: data.tag || 'Veterinarian',
              rating: typeof data.rating === 'number' ? data.rating : (parseFloat(data.rating) || 4.9),
              reviewsCount: data.reviewsCount || data.reviews || 45,
              reviews: data.reviewsCount || data.reviews || 45,
              distance: data.distance || '1.5 km away',
              price: data.price || '৳35/visit',
              availability: data.businessHours || data.availability || 'Mon - Fri • 9am - 6pm',
              isVerified: data.isVerified ?? true,
              bio: data.bio || 'Dedicated veterinary specialist.',
              photo: data.photoUrl || data.photo || 'assets/images/Pet_1.jpg',
              clinic: data.clinic || data.businessHours || 'Animal Hospital'
            };
          });
          setVets(fetchedVets);
          setIsVetsLoading(false);
          try {
            localStorage.setItem('pm_cached_vets', JSON.stringify(fetchedVets));
          } catch (_) {}
        } else {
          setIsVetsLoading(false);
        }
      }, (err) => {
        console.warn('[Firebase] Vets listener warning:', err);
        setIsVetsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Vets setup error:', e);
      setIsVetsLoading(false);
    }
  }, []);

  // ─── 3. FIREBASE REAL-TIME PRODUCTS LISTENER ───
  useEffect(() => {
    try {
      const productsRef = collection(db, 'products');
      const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedProducts = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || 'Product',
              brand: data.brand || 'Pet Maya',
              category: (data.category || 'supplies').toLowerCase(),
              price: typeof data.price === 'number' ? data.price : (parseFloat(data.price) || 29.99),
              rating: typeof data.rating === 'number' ? data.rating : 4.8,
              ratingCount: data.ratingCount || 50,
              image: data.imageUrl || data.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop&q=80',
              description: data.description || 'High quality pet care supply.',
              isRx: data.isRx === true || data.isRx === 'true',
              inStock: data.inStock !== false && data.inStock !== 'false',
              stockCount: typeof data.stockCount === 'number' ? data.stockCount : (parseInt(data.stockCount, 10) || 50)
            };
          });
          setProducts(fetchedProducts);
          setIsProductsLoading(false);
          try {
            localStorage.setItem('pm_cached_products', JSON.stringify(fetchedProducts));
          } catch (_) {}
        } else {
          setProducts(INITIAL_PRODUCTS);
          setIsProductsLoading(false);
        }
      }, (err) => {
        console.warn('[Firebase] Products listener warning:', err);
        setIsProductsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Products setup error:', e);
      setIsProductsLoading(false);
    }
  }, []);

  // ─── 3.5. FIREBASE REAL-TIME USERS MAP ───
  useEffect(() => {
    try {
      const usersRef = collection(db, 'users');
      const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        if (!snapshot.empty) {
          const map = {};
          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const photo = data.photoUrl || data.photoURL || data.userPhoto || data.avatar || '';
            const name = (data.name || data.displayName || '').trim().toLowerCase();
            if (docSnap.id) map[docSnap.id] = photo;
            if (data.uid) map[data.uid] = photo;
            if (name) map[name] = photo;
          });
          setUsersMap(map);
        }
      }, (err) => {
        console.warn('[Firebase] users onSnapshot error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] users init listener error:', e);
    }
  }, []);

  // ─── 4. FIREBASE REAL-TIME COMMUNITY POSTS ───
  useEffect(() => {
    try {
      const postsRef = collection(db, 'community_posts');
      const unsubscribe = onSnapshot(postsRef, (snapshot) => {
        if (!snapshot.empty) {
          const myUid = currentUser?.uid || localStorage.getItem('pm_guest_uid') || '';

          const fetchedPosts = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            
            // Flexible likedBy parser (handles Array, Map, and numeric counts)
            // Flexible likedBy and reactions parser (aligns 100% with Flutter FeedPostModel)
            let isLiked = false;
            let likesCount = typeof data.likesCount === 'number' ? data.likesCount : (typeof data.likes === 'number' ? data.likes : 0);
            const likedBy = data.likedBy;
            const likedByUserIds = data.likedByUserIds;
            const rawUserReactions = (data.userReactions && typeof data.userReactions === 'object') ? data.userReactions : {};

            let userReaction = null;
            if (myUid && rawUserReactions[myUid]) {
              userReaction = rawUserReactions[myUid];
              isLiked = true;
            }

            if (Array.isArray(likedByUserIds)) {
              if (myUid && likedByUserIds.includes(myUid)) isLiked = true;
              if (likesCount === 0) likesCount = likedByUserIds.length;
            }
            if (Array.isArray(likedBy)) {
              if (myUid && likedBy.includes(myUid)) isLiked = true;
              if (likesCount === 0) likesCount = likedBy.length;
            } else if (likedBy && typeof likedBy === 'object') {
              if (myUid && (likedBy[myUid] === true || likedBy[myUid] === 'true' || likedBy[myUid] === 1)) isLiked = true;
              if (likesCount === 0) likesCount = Object.keys(likedBy).filter(k => likedBy[k] === true || likedBy[k] === 1).length;
            }

            if (isLiked && !userReaction) {
              userReaction = 'Like';
            }

            const activeReactionTypes = Array.from(new Set(Object.values(rawUserReactions))).filter(Boolean);
            if (activeReactionTypes.length === 0 && likesCount > 0) {
              activeReactionTypes.push('Like');
            }

            // Robust timestamp parser
            let rawTs = 0;
            if (typeof data.timestamp === 'number') {
              rawTs = data.timestamp;
            } else if (data.timestamp && typeof data.timestamp.toMillis === 'function') {
              rawTs = data.timestamp.toMillis();
            } else if (data.timestamp && typeof data.timestamp.seconds === 'number') {
              rawTs = data.timestamp.seconds * 1000;
            } else if (data.createdAt) {
              const parsed = new Date(data.createdAt).getTime();
              if (!isNaN(parsed)) rawTs = parsed;
            } else if (typeof data.timestamp === 'string') {
              const parsed = Date.parse(data.timestamp);
              if (!isNaN(parsed)) rawTs = parsed;
            }

            // Display time formatter matching mobile app (e.g. "Aug 15" or "2h ago")
            let displayTime = 'Recent';
            if (rawTs > 0) {
              const diffSec = Math.floor((Date.now() - rawTs) / 1000);
              if (diffSec < 60) displayTime = 'Just now';
              else if (diffSec < 3600) displayTime = `${Math.floor(diffSec / 60)}m ago`;
              else if (diffSec < 86400) displayTime = `${Math.floor(diffSec / 3600)}h ago`;
              else if (diffSec < 604800) displayTime = `${Math.floor(diffSec / 86400)}d ago`;
              else {
                const dateObj = new Date(rawTs);
                displayTime = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
            } else if (typeof data.time === 'string' && data.time) {
              displayTime = data.time;
            }

            const postType = (data.postType || data.category || 'MOMENT').toUpperCase();

            // Normalize comments array from Firestore
            const rawComments = Array.isArray(data.comments) ? data.comments.map(c => ({
              commentId: c.commentId || c.id || '',
              author: c.author || c.userName || 'Pet Parent',
              text: c.commentText || c.text || '',
              createdAt: c.createdAt || (c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString())
            })) : [];

            // Resolve author profile photo dynamically
            const postUserId = data.userId || data.authorId || data.uid || '';
            const postAuthor = data.userName || data.authorName || data.author || 'Pet Parent';
            let authorPhoto = data.userPhoto || data.authorPhoto || data.userPhotoUrl || data.photoUrl || '';
            if (!authorPhoto || authorPhoto.includes('tail_wagging_logo.png')) {
              if (postUserId && usersMap[postUserId]) {
                authorPhoto = usersMap[postUserId];
              } else if (postAuthor && usersMap[postAuthor.toLowerCase().trim()]) {
                authorPhoto = usersMap[postAuthor.toLowerCase().trim()];
              } else if (currentUser && (currentUser.uid === postUserId || currentUser.name?.toLowerCase().trim() === postAuthor?.toLowerCase().trim())) {
                authorPhoto = currentUser.photoUrl || '';
              }
            }

            return {
              id: docSnap.id,
              postId: data.postId || docSnap.id,
              userId: postUserId,
              author: postAuthor,
              authorPhoto: authorPhoto || '',
              petTag: data.petTag || (postType ? `${postType}` : 'Pet'),
              category: postType,
              time: displayTime,
              timestamp: rawTs || Date.now(),
              content: data.content || '',
              image: data.imageUrl || data.image || data.photoUrl || data.photo || '',
              likes: likesCount,
              isLiked: isLiked,
              userReaction: userReaction,
              userReactions: rawUserReactions,
              activeReactionTypes: activeReactionTypes,
              likedBy: Array.isArray(likedBy) ? likedBy : (likedBy ? Object.keys(likedBy) : []),
              comments: rawComments,
              commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : rawComments.length,
              sharesCount: data.sharesCount || 0,
              sharedPostId: data.sharedPostId,
              sharedPostAuthor: data.sharedPostAuthor,
              sharedPostContent: data.sharedPostContent,
              sharedPostImageUrl: data.sharedPostImageUrl,
              isAmberAlert: data.isAmberAlert === true || data.isAmberAlert === 'true' || postType.includes('LOST') || postType.includes('RESCUE') || (data.content && data.content.toLowerCase().includes('lost pet')),
              isResolved: data.isResolved === true || data.isResolved === 'true',
              petName: data.petName || '',
              petBreed: data.petBreed || '',
              location: data.location || '',
              contactPhone: data.contactPhone || '',
              microchipId: data.microchipId || '',
              collarTag: data.collarTag || '',
              reward: data.reward || ''
            };
          });

          // Sort posts by newest timestamp first
          fetchedPosts.sort((a, b) => b.timestamp - a.timestamp);

          setPosts(fetchedPosts);
        } else {
          setPosts(prev => prev.length > 0 ? prev : INITIAL_POSTS);
        }
        setIsPostsLoading(false);
      }, (err) => {
        console.warn('[Firebase] community_posts onSnapshot error:', err);
        setPosts(prev => prev.length > 0 ? prev : INITIAL_POSTS);
        setIsPostsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] community_posts init listener error:', e);
      setIsPostsLoading(false);
    }
  }, [currentUser, usersMap]);

  // ─── 5. FIREBASE APPOINTMENTS & EVENTS ───
  useEffect(() => {
    if (!currentUser || currentUser.uid.startsWith('demo_guest')) {
      const saved = localStorage.getItem('pm_appointments');
      setAppointments(saved ? JSON.parse(saved) : [
        { id: 'apt-1', title: 'Annual Nobivac Booster with Dr. Sarah Jenkins', doctor: 'Dr. Sarah Jenkins', clinic: 'Greenwood Animal Hospital', petName: 'Max', date: '2026-09-15', time: '10:30 AM', fromTime: '10:30 AM', toTime: '11:00 AM', mode: 'In-Clinic Consultation', status: 'Confirmed', isCompleted: false },
        { id: 'apt-2', title: 'Dermatology Follow-up & Allergy Review', doctor: 'Dr. Michael Chang', clinic: 'Pet Med Care Center', petName: 'Bella', date: '2026-09-18', time: '02:15 PM', fromTime: '02:15 PM', toTime: '02:45 PM', mode: 'Teleconsultation', status: 'Confirmed', isCompleted: false },
        { id: 'apt-3', title: 'Dental Scaling & Prophylaxis Clean', doctor: 'Dr. Emily Watson', clinic: 'Central Veterinary Clinic', petName: 'Luna', date: '2026-08-14', time: '11:00 AM', fromTime: '11:00 AM', toTime: '12:00 PM', mode: 'In-Clinic Consultation', status: 'Completed', isCompleted: true },
        { id: 'apt-4', title: 'Cardiology ECG & Ultrasound Screening', doctor: 'Dr. Sarah Jenkins', clinic: 'Greenwood Animal Hospital', petName: 'Max', date: '2026-07-20', time: '04:00 PM', fromTime: '04:00 PM', toTime: '04:30 PM', mode: 'In-Clinic Consultation', status: 'Completed', isCompleted: true }
      ]);
      return;
    }

    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('userId', '==', currentUser.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const fromTime = data.fromTime || data.time || '';
          const toTime = data.toTime || '';
          const timeStr = data.time || (fromTime && toTime ? `${fromTime} - ${toTime}` : fromTime);

          let dateVal = data.date || '';
          if (dateVal && typeof dateVal.toDate === 'function') {
            dateVal = dateVal.toDate().toISOString();
          } else if (dateVal && typeof dateVal.seconds === 'number') {
            dateVal = new Date(dateVal.seconds * 1000).toISOString();
          }

          let modeVal = data.category || data.mode || data.type || 'VET APPOINTMENT';
          if (modeVal.toLowerCase() === 'vet visit') modeVal = 'VET APPOINTMENT';

          return {
            id: docSnap.id,
            title: data.title || 'Veterinary Appointment',
            doctor: data.doctor || data.providerName || data.vetName || 'Dr. Specialist',
            clinic: data.clinic || data.location || 'Clinic',
            petName: data.petName || 'Pet',
            date: dateVal,
            fromTime: fromTime,
            toTime: toTime,
            time: timeStr,
            mode: modeVal,
            status: data.status || 'CONFIRMED',
            isCompleted: data.isCompleted === true || data.status === 'COMPLETED' || data.status === 'Completed'
          };
        });
        setAppointments(fetched);
      }, (err) => {
        console.warn('[Firebase] Events listener error:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Appointments setup error:', e);
    }
  }, [currentUser]);

  // ─── 6. FIREBASE MEDICAL RECORDS / SERVICE RECORDS ───
  useEffect(() => {
    if (!currentUser || currentUser.uid.startsWith('demo_guest')) {
      const saved = localStorage.getItem('pm_ehr');
      setMedicalRecords(saved ? JSON.parse(saved) : [
        { id: 'ehr-1', petName: 'Bella', ownerName: 'Alex Johnson', serviceType: 'Consultation', weight: '14.2 kg', diagnosis: 'Otitis Externa (mild fungal ear canal infection)', prescription: 'Otomax Drops 4 drops 2x daily (7 days). Apoquel 16mg daily.', cost: 45, date: '2026-08-15', nextBooster: '2026-08-25' },
        { id: 'ehr-2', petName: 'Max', ownerName: 'Alex Johnson', serviceType: 'Vaccination', weight: '28.4 kg', diagnosis: 'Routine Annual Immunization', prescription: 'Nobivac DHPP + Rabies 1ml SC administered.', cost: 35, date: '2026-08-10', nextBooster: '2027-08-10' }
      ]);
      return;
    }

    try {
      const recordsRef = collection(db, 'service_records');
      const q = query(recordsRef, where('userId', '==', currentUser.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            petName: data.petName || 'Pet',
            ownerName: data.ownerName || currentUser.name,
            serviceType: data.serviceType || 'Consultation',
            weight: data.weight || '10 kg',
            diagnosis: data.diagnosis || 'Routine checkup',
            prescription: data.prescription || 'None',
            cost: data.cost || 35,
            date: data.date || '',
            nextBooster: data.nextBooster || 'N/A'
          };
        });
        setMedicalRecords(fetched);
      }, (err) => {
        console.warn('[Firebase] Records listener error:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] EHR setup error:', e);
    }
  }, [currentUser]);

  // ─── 7. FIREBASE ORDERS ───
  useEffect(() => {
    if (!currentUser || currentUser.uid.startsWith('demo_guest')) {
      const saved = localStorage.getItem('pm_orders');
      setOrders(saved ? JSON.parse(saved) : [
        {
          id: 'PM-ORD-8941',
          date: '2026-08-24',
          items: [{ id: 'p1', name: 'Royal Canin Golden Retriever Adult', price: 64.99, qty: 1 }],
          total: 64.99,
          status: 'In Preparation',
          address: 'House 14, Road 7, Banani, Dhaka'
        }
      ]);
      return;
    }

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', currentUser.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            date: data.date || new Date().toISOString().split('T')[0],
            items: data.items || [],
            total: data.total || 0,
            status: data.status || 'Order Placed',
            address: data.deliveryAddress || data.address || 'Address'
          };
        });
        setOrders(fetched);
      }, (err) => {
        console.warn('[Firebase] Orders listener error:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Orders setup error:', e);
    }
  }, [currentUser]);

  // Persist Local Cart
  useEffect(() => {
    localStorage.setItem('pm_cart', JSON.stringify(cart));
  }, [cart]);

  // ─── ACTIONS ───

  const openModal = (modalName, data = null) => {
    setActiveModal(modalName);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, msg: message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Add Pet
  const addPet = async (petData) => {
    const newId = petData.id || ('pet_' + Date.now());
    const petObj = {
      id: newId,
      petID: newId,
      ownerID: currentUser ? currentUser.uid : 'demo_user_001',
      name: petData.name || 'Pet',
      species: petData.species || 'Canine',
      breed: petData.breed || 'Companion',
      gender: petData.gender || 'Unknown',
      age: petData.age || '1 Yr',
      weight: petData.weight || '12 kg',
      photo: petData.photo || petData.image || 'assets/images/Pet_1.jpg',
      microchip: petData.microchip || petData.microchipId || `PM-${newId.slice(-5).toUpperCase()}`,
      nextVaccine: petData.nextVaccine || '2026-11-15',
      ...petData
    };

    setPets(prev => {
      const next = [petObj, ...prev.filter(p => p.id !== newId && p.petID !== newId)];
      try { localStorage.setItem('pm_pets', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await setDoc(doc(db, 'pets', newId), petObj, { merge: true });
      } catch (e) {
        console.warn('[Firebase] addPet firestore error:', e);
      }
    }
    awardPoints(10);
    showToast(`🐾 Registered "${petObj.name}" in Sovereign Health Vault!`, 'success');
    return petObj;
  };

  // Update Pet
  const updatePet = async (petId, updatedFields) => {
    setPets(prev => {
      const updated = prev.map(p => (p.id === petId || p.petID === petId) ? { ...p, ...updatedFields } : p);
      try { localStorage.setItem('pm_pets', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await setDoc(doc(db, 'pets', petId), updatedFields, { merge: true });
      } catch (e) {
        console.warn('[Firebase] updatePet firestore error:', e);
      }
    }
    showToast('🐾 Companion health profile updated.', 'success');
  };

  // Delete Pet
  const deletePet = async (petId) => {
    setPets(prev => {
      const filtered = prev.filter(p => (p.id !== petId && p.petID !== petId));
      try { localStorage.setItem('pm_pets', JSON.stringify(filtered)); } catch (_) {}
      return filtered;
    });

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await deleteDoc(doc(db, 'pets', petId));
      } catch (e) {
        console.warn('[Firebase] deletePet error:', e);
      }
    }
    showToast('Companion record removed from Health Vault.', 'info');
  };

  // ── Smart Tracker Hardware Management ──
  const addDevice = (deviceData) => {
    const newId = deviceData.id || `pm_trk_${Date.now()}`;
    const newDevice = {
      id: newId,
      name: deviceData.name || 'Pet Tracker',
      deviceType: deviceData.deviceType || 'gps_collar',
      modelNumber: deviceData.modelNumber || 'PetMaya ProTrack Gen 2',
      serialNumber: deviceData.serialNumber || `PM-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      petId: deviceData.petId || null,
      petName: deviceData.petName || 'Unassigned',
      batteryLevel: deviceData.batteryLevel ?? 100,
      isOnline: true,
      signalStrength: 4,
      trackingMode: deviceData.trackingMode || 'Real-Time (10s)',
      isSafeZone: true,
      firmwareVersion: deviceData.firmwareVersion || 'v2.4.1',
      lastSync: 'Just now',
      latitude: deviceData.latitude || 23.8103,
      longitude: deviceData.longitude || 90.4125
    };
    const nextList = [newDevice, ...devices];
    setDevices(nextList);
    try {
      localStorage.setItem('pm_cached_devices', JSON.stringify(nextList));
    } catch (_) {}
    showToast(`📡 Paired "${newDevice.name}" successfully!`, 'success');
  };

  const updateDevice = (updatedDevice) => {
    const nextList = devices.map(d => d.id === updatedDevice.id ? updatedDevice : d);
    setDevices(nextList);
    try {
      localStorage.setItem('pm_cached_devices', JSON.stringify(nextList));
    } catch (_) {}
    showToast(`⚙️ Updated "${updatedDevice.name}" settings.`, 'success');
  };

  const removeDevice = (deviceId) => {
    const target = devices.find(d => d.id === deviceId);
    const nextList = devices.filter(d => d.id !== deviceId);
    setDevices(nextList);
    try {
      localStorage.setItem('pm_cached_devices', JSON.stringify(nextList));
    } catch (_) {}
    showToast(`🗑️ Unpaired "${target?.name || 'Device'}".`, 'info');
  };

  const triggerRingDevice = (device) => {
    setRingingDeviceId(device.id);
    showToast(`🔊 Emitting 85dB acoustic chime on ${device.name}...`, 'info');
    setTimeout(() => {
      setRingingDeviceId(null);
    }, 8000);
  };

  // Add Community Post
  const createPost = async (postData) => {
    const userDisplayName = postData.author || (currentUser ? currentUser.name : 'Pet Parent');
    const userPhotoUrl = currentUser?.photoUrl || '';
    const postType = (postData.category || 'MOMENT').toUpperCase();

    const isAmber = Boolean(postData.isAmberAlert || postData.category === 'Lost & Found' || postData.category === 'LOST_FOUND' || postData.category === 'LOST & FOUND');

    const newPost = {
      // Modern App Schema
      userId: currentUser ? currentUser.uid : 'guest',
      userName: userDisplayName,
      userPhoto: userPhotoUrl,
      postType: postType,
      content: postData.content || '',
      imageUrl: postData.image || '',
      timestamp: Date.now(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedBy: {},
      
      // Web Legacy compatibility fields
      authorName: userDisplayName,
      authorId: currentUser ? currentUser.uid : 'guest',
      authorPhoto: userPhotoUrl,
      petTag: postData.petTag || 'Pet',
      category: postData.category || 'Moment',
      mood: postData.mood || '🐾 Playful & Energetic',
      comments: [],
      createdAt: new Date().toISOString(),

      // Amber Alert / Lost Pet Fields
      isAmberAlert: isAmber,
      isResolved: false,
      petName: postData.petName || '',
      petBreed: postData.petBreed || '',
      location: postData.location || '',
      contactPhone: postData.contactPhone || '',
      microchipId: postData.microchipId || '',
      collarTag: postData.collarTag || '',
      reward: postData.reward || ''
    };

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await addDoc(collection(db, 'community_posts'), newPost);
      } catch (e) {
        console.warn('[Firebase] createPost error:', e);
      }
    } else {
      setPosts(prev => [{ 
        id: 'p_' + Date.now(), 
        author: userDisplayName,
        authorPhoto: userPhotoUrl,
        petTag: postData.petTag || 'Pet',
        category: postData.category || 'Moment',
        time: 'Just now',
        timestamp: Date.now(),
        content: postData.content || '',
        image: postData.image || '',
        likes: 0, 
        isLiked: false, 
        comments: [],
        isAmberAlert: isAmber,
        isResolved: false,
        petName: postData.petName || '',
        petBreed: postData.petBreed || '',
        location: postData.location || '',
        contactPhone: postData.contactPhone || '',
        microchipId: postData.microchipId || '',
        collarTag: postData.collarTag || '',
        reward: postData.reward || ''
      }, ...prev]);
    }
    awardPoints(5);
    showToast('✨ Story published to community feed!', 'success');
  };

  // Toggle Post Reaction (100% Parity with Flutter FeedPostModel & FirebaseService)
  const toggleReaction = async (postId, reactionType = 'Like') => {
    const post = posts.find(p => p.id === postId || p.postId === postId);
    if (!post) return;

    let myUid = currentUser?.uid;
    if (!myUid) {
      myUid = localStorage.getItem('pm_guest_uid');
      if (!myUid) {
        myUid = 'usr_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('pm_guest_uid', myUid);
      }
    }

    const currentReaction = post.userReaction;
    const isRemoving = currentReaction && currentReaction.toLowerCase() === reactionType.toLowerCase();
    const isNewReaction = !currentReaction;

    const newReaction = isRemoving ? null : reactionType;
    const newLiked = !isRemoving;
    let newLikesCount = post.likes || 0;
    if (isRemoving) {
      newLikesCount = Math.max(0, newLikesCount - 1);
    } else if (isNewReaction) {
      newLikesCount = newLikesCount + 1;
    }

    const newUserReactions = { ...(post.userReactions || {}) };
    if (isRemoving) {
      delete newUserReactions[myUid];
    } else {
      newUserReactions[myUid] = reactionType;
    }

    const newActiveReactionTypes = Array.from(new Set(Object.values(newUserReactions))).filter(Boolean);

    // 1. Instant Optimistic UI Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId || p.postId === postId) {
        return {
          ...p,
          likes: newLikesCount,
          isLiked: newLiked,
          userReaction: newReaction,
          userReactions: newUserReactions,
          activeReactionTypes: newActiveReactionTypes,
          likedBy: newLiked
            ? Array.from(new Set([...(p.likedBy || []), myUid]))
            : (p.likedBy || []).filter(u => u !== myUid)
        };
      }
      return p;
    }));

    // 2. Persist to Firestore with SetOptions merge (aligns with Flutter app)
    try {
      const postDocRef = doc(db, 'community_posts', postId);
      if (isRemoving) {
        await setDoc(postDocRef, {
          likesCount: increment(-1),
          likes: increment(-1),
          likedByUserIds: arrayRemove(myUid),
          likedBy: { [myUid]: false },
          userReactions: { [myUid]: deleteField() }
        }, { merge: true });
      } else {
        const payload = {
          likedByUserIds: arrayUnion(myUid),
          likedBy: { [myUid]: true },
          userReactions: { [myUid]: reactionType }
        };
        if (isNewReaction) {
          payload.likesCount = increment(1);
          payload.likes = increment(1);
        }
        await setDoc(postDocRef, payload, { merge: true });
      }
    } catch (e) {
      console.warn('[Firebase] toggleReaction error:', e);
    }
  };

  // Toggle Like Post (Calls toggleReaction with 'Like' or current reaction)
  const toggleLike = async (postId) => {
    const post = posts.find(p => p.id === postId || p.postId === postId);
    const activeReaction = post?.userReaction || 'Like';
    return toggleReaction(postId, activeReaction);
  };

  // Add Comment to Post (Reliable Sync with Firestore Document and Subcollection)
  const addComment = async (postId, text, authorName) => {
    if (!text || !text.trim()) return;

    let myUid = currentUser?.uid;
    if (!myUid) {
      myUid = localStorage.getItem('pm_guest_uid');
      if (!myUid) {
        myUid = 'usr_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('pm_guest_uid', myUid);
      }
    }

    const myName = authorName || currentUser?.name || 'Pet Parent';
    const myPhoto = currentUser?.photoUrl || '';
    const nowTs = Date.now();
    const commentId = 'cmt_' + Math.random().toString(36).substring(2, 9);

    const commentObj = {
      commentId,
      postId,
      userId: myUid,
      userName: myName,
      author: myName,
      userPhoto: myPhoto,
      commentText: text.trim(),
      text: text.trim(),
      timestamp: nowTs,
      createdAt: new Date().toISOString()
    };

    // 1. Instant Optimistic UI Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          comments: [...(p.comments || []), commentObj],
          commentsCount: (p.commentsCount || (p.comments?.length || 0)) + 1
        };
      }
      return p;
    }));

    // 2. Persist to Firestore: update main document and subcollection
    try {
      const postDocRef = doc(db, 'community_posts', postId);
      
      // Update comments array and count on post doc
      await setDoc(postDocRef, {
        commentsCount: increment(1),
        comments: arrayUnion(commentObj)
      }, { merge: true });

      // Add to subcollection for Flutter app comments stream
      const subColRef = collection(db, 'community_posts', postId, 'comments');
      await addDoc(subColRef, commentObj);
    } catch (e) {
      console.warn('[Firebase] addComment error:', e);
    }

    showToast('Comment posted!', 'success');
  };

  // Resolve Lost Pet / Amber Alert
  const resolveAmberAlert = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId || p.postId === postId) {
        return { ...p, isResolved: true };
      }
      return p;
    }));

    try {
      const postDocRef = doc(db, 'community_posts', postId);
      await setDoc(postDocRef, { isResolved: true }, { merge: true });
    } catch (e) {
      console.warn('[Firebase] resolveAmberAlert notice:', e);
    }
    showToast('🎉 Wonderful news! Pet marked as safely reunited!', 'success');
  };

  // Update Community Post (Content, Category, Pet Tag, Image)
  const updatePost = async (postId, updatedFields) => {
    // Optimistic local state update
    setPosts(prev => prev.map(p => {
      if (p.id === postId || p.postId === postId) {
        return { ...p, ...updatedFields };
      }
      return p;
    }));

    try {
      const postDocRef = doc(db, 'community_posts', postId);
      const payload = {
        updatedAt: Date.now()
      };
      if (updatedFields.content !== undefined) payload.content = updatedFields.content;
      if (updatedFields.category !== undefined) {
        payload.category = updatedFields.category;
        payload.postType = (updatedFields.category || 'MOMENT').toUpperCase();
      }
      if (updatedFields.petTag !== undefined) payload.petTag = updatedFields.petTag;
      if (updatedFields.image !== undefined) {
        payload.imageUrl = updatedFields.image;
        payload.image = updatedFields.image;
      }
      await setDoc(postDocRef, payload, { merge: true });
      showToast('✅ Post updated successfully!', 'success');
    } catch (e) {
      console.warn('[Firebase] updatePost error:', e);
      showToast('Saved locally, could not reach database', 'info');
    }
  };

  // Delete Community Post
  const deletePost = async (postId) => {
    // Optimistic local state update
    setPosts(prev => prev.filter(p => p.id !== postId && p.postId !== postId));

    try {
      const postDocRef = doc(db, 'community_posts', postId);
      await deleteDoc(postDocRef);
      showToast('🗑️ Post deleted from community feed', 'info');
    } catch (e) {
      console.warn('[Firebase] deletePost error:', e);
      showToast('Removed locally, could not reach database', 'info');
    }
  };

  // Add Appointment / Event
  const addAppointment = async (aptData) => {
    const newApt = {
      title: aptData.title || `${aptData.mode} with ${aptData.doctor}`,
      doctor: aptData.doctor,
      clinic: aptData.clinic || 'Specialist Clinic',
      petName: aptData.petName || 'Pet',
      date: aptData.date,
      time: aptData.time,
      mode: aptData.mode || 'In-Clinic Consultation',
      status: 'Confirmed',
      userId: currentUser ? currentUser.uid : 'demo_user_001',
      createdAt: new Date().toISOString()
    };

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await addDoc(collection(db, 'events'), newApt);
      } catch (e) {
        console.warn('[Firebase] addAppointment error:', e);
      }
    } else {
      setAppointments(prev => [{ id: 'apt_' + Date.now(), ...newApt }, ...prev]);
    }
    awardPoints(15);
    showToast('📅 Appointment confirmed and scheduled!', 'success');
  };

  // Remove Appointment
  const removeAppointment = async (aptId) => {
    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await deleteDoc(doc(db, 'events', aptId));
      } catch (e) {
        console.warn('[Firebase] removeAppointment error:', e);
      }
    }
    setAppointments(prev => prev.filter(a => a.id !== aptId));
    showToast('Appointment removed.', 'info');
  };

  // Complete Appointment
  const completeAppointment = async (aptId) => {
    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await updateDoc(doc(db, 'events', aptId), { isCompleted: true, status: 'Completed' });
      } catch (e) {
        console.warn('[Firebase] completeAppointment error:', e);
      }
    }
    setAppointments(prev => {
      const updated = prev.map(a => a.id === aptId ? { ...a, isCompleted: true, status: 'Completed' } : a);
      localStorage.setItem('pm_appointments', JSON.stringify(updated));
      return updated;
    });
    awardPoints(15);
    showToast('Appointment marked as completed! (+15 pts)', 'success');
  };

  // Toggle Favorite Vet
  const toggleFavoriteVet = (vetId) => {
    setFavoriteVetIds(prev => {
      const exists = prev.includes(vetId);
      const updated = exists ? prev.filter(id => id !== vetId) : [...prev, vetId];
      try {
        localStorage.setItem('pm_favorite_vets', JSON.stringify(updated));
      } catch (_) {}
      showToast(exists ? 'Removed from favorite veterinarians.' : 'Added to favorite veterinarians! ❤️', exists ? 'info' : 'success');
      return updated;
    });
  };

  // Add Medical Record
  const addMedicalRecord = async (recordData) => {
    const newId = recordData.id || ('ehr_' + Date.now());
    const newRecord = {
      id: newId,
      petName: recordData.petName || 'Companion',
      petId: recordData.petId || null,
      ownerName: currentUser ? currentUser.name : 'Alex Johnson',
      serviceType: recordData.serviceType || 'Consultation',
      weight: recordData.weight || '12 kg',
      diagnosis: recordData.diagnosis || 'Routine clinical assessment',
      prescription: recordData.prescription || 'N/A',
      cost: parseFloat(recordData.cost) || 40,
      date: recordData.date || new Date().toISOString().split('T')[0],
      nextBooster: recordData.nextBooster || 'N/A',
      userId: currentUser ? currentUser.uid : 'demo_user_001',
      createdAt: new Date().toISOString(),
      ...recordData
    };

    setMedicalRecords(prev => {
      const next = [newRecord, ...prev.filter(r => r.id !== newId)];
      try { localStorage.setItem('pm_ehr', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await addDoc(collection(db, 'service_records'), newRecord);
      } catch (e) {
        console.warn('[Firebase] addMedicalRecord error:', e);
      }
    }
    awardPoints(10);
    showToast('📋 Clinical medical record saved to EHR!', 'success');
    return newRecord;
  };

  // Delete Medical Record
  const deleteMedicalRecord = async (recordId) => {
    setMedicalRecords(prev => {
      const filtered = prev.filter(r => r.id !== recordId);
      try { localStorage.setItem('pm_ehr', JSON.stringify(filtered)); } catch (_) {}
      return filtered;
    });
    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await deleteDoc(doc(db, 'service_records', recordId));
      } catch (e) {
        console.warn('[Firebase] deleteMedicalRecord error:', e);
      }
    }
    showToast('Medical record removed from EHR.', 'info');
  };

  // E-Commerce Cart Actions
  const addToCart = (product, quantity = 1) => {
    const numQty = Number(quantity || product.qty || product.quantity) || 1;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const curQty = Number(existing.qty || existing.quantity) || 1;
        return prev.map(item => item.id === product.id ? { ...item, qty: curQty + numQty } : item);
      }
      return [...prev, { ...product, qty: numQty }];
    });
    showToast(`Added "${product.name || 'item'}" to dispensary bag!`, 'success');
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const curQty = Number(item.qty || item.quantity) || 1;
        const newQty = curQty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const applyCoupon = (code) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'PETMAYA10' || clean === 'PETHAYA10' || clean === 'MAYA10') {
      setAppliedCoupon({ code: clean, discount: 0.10, label: '10% Launch Discount' });
      showToast('🎉 Coupon PETMAYA10 applied (10% OFF)!', 'success');
    } else if (clean === 'FREESHIP') {
      setAppliedCoupon({ code: clean, discount: 'free_shipping', label: 'Free Express Shipping' });
      showToast('🚚 Free shipping coupon applied!', 'success');
    } else {
      setAppliedCoupon({ code: clean, discount: 0.05, label: `${clean} Activated` });
      showToast(`Partner voucher token ${clean} activated (5% OFF)!`, 'success');
    }
  };

  // Checkout & Place Order
  const checkoutOrder = async (orderDataOrAddress) => {
    let deliveryAddress = currentUser?.address || 'Banani, Dhaka';
    let phone = currentUser?.phone || currentUser?.phoneNumber || '';
    let paymentMethod = 'bKash / Mobile Banking';
    let shipping = appliedCoupon?.discount === 'free_shipping' ? 0 : 60;
    let customTotal = null;
    let orderItems = cart.map(i => ({ 
      id: i.id, 
      name: i.name, 
      price: i.price, 
      qty: i.qty || i.quantity || 1,
      image: i.image || i.imageUrl || '',
      specBadge: i.specBadge || ''
    }));
    let patient = pets && pets.length > 0 ? `${pets[0].name} (${pets[0].species || 'Canine'}${pets[0].weight ? ` • ${pets[0].weight}` : ''})` : 'Registered Companion';
    let microchip = pets && pets.length > 0 && pets[0].microchip ? pets[0].microchip : (pets && pets[0]?.transponderId ? pets[0].transponderId : 'UNREGISTERED');
    let deliveryNote = 'Standard insulated cold-chain handoff.';

    if (typeof orderDataOrAddress === 'string') {
      deliveryAddress = orderDataOrAddress;
    } else if (orderDataOrAddress && typeof orderDataOrAddress === 'object') {
      deliveryAddress = orderDataOrAddress.address || orderDataOrAddress.deliveryAddress || deliveryAddress;
      phone = orderDataOrAddress.phone || phone;
      paymentMethod = orderDataOrAddress.paymentMethod || paymentMethod;
      if (orderDataOrAddress.shippingCharges !== undefined) {
        shipping = orderDataOrAddress.shippingCharges;
      }
      if (orderDataOrAddress.total !== undefined) {
        customTotal = orderDataOrAddress.total;
      }
      if (orderDataOrAddress.items && orderDataOrAddress.items.length > 0) {
        orderItems = orderDataOrAddress.items;
      }
      if (orderDataOrAddress.patient) patient = orderDataOrAddress.patient;
      if (orderDataOrAddress.microchip) microchip = orderDataOrAddress.microchip;
      if (orderDataOrAddress.deliveryNote) deliveryNote = orderDataOrAddress.deliveryNote;
    }

    const subtotal = orderItems.reduce((acc, item) => acc + item.price * (item.qty || 1), 0);
    const discount = typeof appliedCoupon?.discount === 'number' ? Math.round(subtotal * appliedCoupon.discount) : (orderDataOrAddress?.discount || 0);
    const calculatedTotal = Math.max(0, subtotal - discount + shipping);
    const total = customTotal !== null ? customTotal : parseFloat(calculatedTotal.toFixed(2));
    const newOrderId = 'PM-ORD-' + Math.floor(1000 + Math.random() * 9000);

    const newOrder = {
      id: newOrderId,
      orderId: newOrderId,
      items: orderItems,
      subtotal,
      shipping,
      discount,
      total,
      phone,
      paymentMethod,
      deliveryAddress,
      patient,
      microchip,
      deliveryNote,
      batch: 'COLD-' + Math.floor(1000 + Math.random() * 9000),
      cryptoHash: '0x' + Math.random().toString(16).slice(2, 10) + '...cold',
      status: 'In Preparation',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      userId: currentUser ? currentUser.uid : 'demo_user_001'
    };

    setOrders(prev => {
      const next = [newOrder, ...prev.filter(o => o.id !== newOrderId && o.orderId !== newOrderId)];
      try { localStorage.setItem('pm_orders', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await addDoc(collection(db, 'orders'), newOrder);
      } catch (e) {
        console.warn('[Firebase] checkoutOrder error:', e);
      }
    }

    clearCart();
    awardPoints(25);
    showToast('📦 Order placed successfully! Live cold-chain dispatch active.', 'success');
    return newOrder;
  };

  // Upload Image Helper (Firebase Storage + Local FileReader Fallback)
  const uploadImageFile = async (file, folder = 'community_images') => {
    if (!file) return null;
    try {
      const cleanName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${folder}/${Date.now()}_${cleanName}`;
      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.warn('[Firebase Storage] Upload notice, using inline data URL:', error);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            } catch (err) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            }
          }
        );
      });
    } catch (e) {
      console.warn('[Firebase Storage] Fallback to FileReader:', e);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
  };

  // ─── ADMIN PRODUCT & INVENTORY MANAGEMENT ACTIONS ───
  const addProduct = async (productData) => {
    const id = productData.id || 'p_' + Date.now();
    const newProduct = {
      id,
      name: productData.name || 'New Product',
      brand: productData.brand || 'Pet Maya',
      category: productData.category || 'supplies',
      price: typeof productData.price === 'number' ? productData.price : (parseFloat(productData.price) || 19.99),
      rating: typeof productData.rating === 'number' ? productData.rating : 4.8,
      ratingCount: productData.ratingCount || 1,
      image: productData.image || productData.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop&q=80',
      description: productData.description || 'Premium pet care item.',
      isRx: !!productData.isRx,
      inStock: productData.inStock !== false,
      stockCount: typeof productData.stockCount === 'number' ? productData.stockCount : 50,
      createdAt: Date.now()
    };

    setProducts(prev => [newProduct, ...prev.filter(p => p.id !== id)]);
    try {
      localStorage.setItem('pm_cached_products', JSON.stringify([newProduct, ...products.filter(p => p.id !== id)]));
    } catch (_) {}

    try {
      await setDoc(doc(db, 'products', id), newProduct, { merge: true });
      showToast(`🛍️ Product "${newProduct.name}" saved to catalog!`, 'success');
    } catch (e) {
      console.warn('[Firebase] addProduct error:', e);
      showToast(`🛍️ Product "${newProduct.name}" saved!`, 'success');
    }
    return newProduct;
  };

  const updateProduct = async (productId, updatedFields) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedFields } : p));
    try {
      const updatedList = products.map(p => p.id === productId ? { ...p, ...updatedFields } : p);
      localStorage.setItem('pm_cached_products', JSON.stringify(updatedList));
    } catch (_) {}

    try {
      await setDoc(doc(db, 'products', productId), updatedFields, { merge: true });
      showToast('✅ Product updated successfully.', 'success');
    } catch (e) {
      console.warn('[Firebase] updateProduct error:', e);
      showToast('✅ Product updated.', 'success');
    }
  };

  const deleteProduct = async (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    try {
      const filtered = products.filter(p => p.id !== productId);
      localStorage.setItem('pm_cached_products', JSON.stringify(filtered));
    } catch (_) {}

    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast('🗑️ Product removed from catalog.', 'info');
    } catch (e) {
      console.warn('[Firebase] deleteProduct error:', e);
      showToast('🗑️ Product removed.', 'info');
    }
  };

  // ─── ADMIN ORDER MANAGEMENT ACTIONS ───
  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderId === orderId) ? { ...o, status: newStatus, updatedAt: Date.now() } : o));
    try {
      const updatedList = orders.map(o => (o.id === orderId || o.orderId === orderId) ? { ...o, status: newStatus, updatedAt: Date.now() } : o);
      localStorage.setItem('pm_orders', JSON.stringify(updatedList));
    } catch (_) {}

    try {
      await setDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: Date.now() }, { merge: true });
      showToast(`📦 Order ${orderId} status updated to "${newStatus}".`, 'success');
    } catch (e) {
      console.warn('[Firebase] updateOrderStatus error:', e);
      showToast(`📦 Order status updated to "${newStatus}".`, 'success');
    }
  };

  const deleteOrder = async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId && o.orderId !== orderId));
    try {
      const filtered = orders.filter(o => o.id !== orderId && o.orderId !== orderId);
      localStorage.setItem('pm_orders', JSON.stringify(filtered));
    } catch (_) {}

    try {
      await deleteDoc(doc(db, 'orders', orderId));
      showToast(`🗑️ Order ${orderId} removed.`, 'info');
    } catch (e) {
      console.warn('[Firebase] deleteOrder error:', e);
      showToast(`🗑️ Order removed.`, 'info');
    }
  };

  // ─── ADMIN SERVICE & CLINICIAN MANAGEMENT ACTIONS ───
  const addService = async (serviceData) => {
    const id = serviceData.id || 'v_' + Date.now();
    const newService = {
      id,
      name: serviceData.name || 'New Specialist',
      qualification: serviceData.qualification || 'DVM, MRCVS',
      tag: serviceData.tag || 'Veterinarian',
      clinic: serviceData.clinic || 'Animal Care Hospital',
      licenseNumber: serviceData.licenseNumber || `BMDC-VET-${Math.floor(10000 + Math.random() * 90000)}`,
      rating: typeof serviceData.rating === 'number' ? serviceData.rating : 4.9,
      reviewsCount: serviceData.reviewsCount || 1,
      distance: serviceData.distance || '1.0 km away',
      price: serviceData.price ? (serviceData.price.startsWith('৳') ? serviceData.price : `৳${serviceData.price}/visit`) : '৳400/visit',
      availability: serviceData.availability || 'Mon - Fri • 9am - 6pm',
      isVerified: serviceData.isVerified !== false,
      isEmergencyOnCall: !!serviceData.isEmergencyOnCall,
      bio: serviceData.bio || 'Licensed clinical specialist.',
      photo: serviceData.photo || 'assets/images/Pet_1.jpg',
      createdAt: Date.now()
    };

    setVets(prev => [newService, ...prev.filter(v => v.id !== id)]);
    try {
      localStorage.setItem('pm_cached_vets', JSON.stringify([newService, ...vets.filter(v => v.id !== id)]));
    } catch (_) {}

    try {
      await setDoc(doc(db, 'vets', id), newService, { merge: true });
      showToast(`🩺 Service "${newService.name}" published to directory!`, 'success');
    } catch (e) {
      console.warn('[Firebase] addService error:', e);
      showToast(`🩺 Service "${newService.name}" saved!`, 'success');
    }
    return newService;
  };

  const updateService = async (serviceId, updatedFields) => {
    setVets(prev => prev.map(v => v.id === serviceId ? { ...v, ...updatedFields } : v));
    try {
      const updatedList = vets.map(v => v.id === serviceId ? { ...v, ...updatedFields } : v);
      localStorage.setItem('pm_cached_vets', JSON.stringify(updatedList));
    } catch (_) {}

    try {
      await setDoc(doc(db, 'vets', serviceId), updatedFields, { merge: true });
      showToast('✅ Service details updated successfully.', 'success');
    } catch (e) {
      console.warn('[Firebase] updateService error:', e);
      showToast('✅ Service details updated.', 'success');
    }
  };

  const deleteService = async (serviceId) => {
    setVets(prev => prev.filter(v => v.id !== serviceId));
    try {
      const filtered = vets.filter(v => v.id !== serviceId);
      localStorage.setItem('pm_cached_vets', JSON.stringify(filtered));
    } catch (_) {}

    try {
      await deleteDoc(doc(db, 'vets', serviceId));
      showToast('🗑️ Service listing removed from network.', 'info');
    } catch (e) {
      console.warn('[Firebase] deleteService error:', e);
      showToast('🗑️ Service listing removed.', 'info');
    }
  };

  const updateServiceVerification = async (serviceId, isVerified) => {
    await updateService(serviceId, { isVerified, licenseStatus: isVerified ? 'VERIFIED' : 'PENDING' });
    showToast(`🛡️ Service medical license marked as ${isVerified ? 'VERIFIED' : 'PENDING'}.`, 'success');
  };

  // ─── ADMIN USER VERIFICATION & ROLE MANAGEMENT ACTIONS ───
  const updateUserRole = async (userId, newRole) => {
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole, updatedAt: Date.now() }, { merge: true });
      showToast(`👤 User role updated to "${newRole}".`, 'success');
    } catch (e) {
      console.warn('[Firebase] updateUserRole error:', e);
      showToast(`👤 User role updated to "${newRole}".`, 'success');
    }
  };

  const updateUserVerification = async (userId, isVerified) => {
    try {
      await setDoc(doc(db, 'users', userId), { 
        isVerified, 
        verificationStatus: isVerified ? 'VERIFIED' : 'PENDING',
        verifiedAt: isVerified ? Date.now() : null 
      }, { merge: true });
      showToast(`🛡️ User KYC profile marked as ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`, 'success');
    } catch (e) {
      console.warn('[Firebase] updateUserVerification error:', e);
      showToast(`🛡️ User KYC updated.`, 'success');
    }
  };

  const updateUserAccountStatus = async (userId, status) => {
    try {
      await setDoc(doc(db, 'users', userId), { accountStatus: status, updatedAt: Date.now() }, { merge: true });
      showToast(`⚠️ User account status updated to "${status}".`, 'info');
    } catch (e) {
      console.warn('[Firebase] updateUserAccountStatus error:', e);
      showToast(`User status updated to "${status}".`, 'info');
    }
  };

  const cartCount = (cart || []).reduce((acc, item) => acc + (Number(item.qty || item.quantity) || 1), 0);
  const cartTotal = (cart || []).reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.qty || item.quantity) || 1)), 0);

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      theme,
      toggleTheme,
      activeModal,
      modalData,
      openModal,
      closeModal,
      toasts,
      showToast,
      pets,
      activePet: pets && pets.length > 0 ? pets[0] : null,
      addPet,
      updatePet,
      deletePet,
      devices,
      addDevice,
      updateDevice,
      removeDevice,
      triggerRingDevice,
      ringingDeviceId,
      vets,
      isVetsLoading,
      addService,
      updateService,
      deleteService,
      updateServiceVerification,
      products,
      isProductsLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      posts,
      isPostsLoading,
      usersMap,
      createPost,
      updatePost,
      deletePost,
      toggleLike,
      toggleReaction,
      addComment,
      resolveAmberAlert,
      uploadImageFile,
      appointments,
      addAppointment,
      removeAppointment,
      completeAppointment,
      favoriteVetIds,
      toggleFavoriteVet,
      medicalRecords,
      addMedicalRecord,
      deleteMedicalRecord,
      cart,
      cartCount,
      cartTotal,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      appliedCoupon,
      applyCoupon,
      orders,
      checkoutOrder,
      placeOrder: checkoutOrder,
      updateOrderStatus,
      deleteOrder,
      updateUserRole,
      updateUserVerification,
      updateUserAccountStatus,
      globalBanner,
      updateGlobalBanner,
      locationPermission,
      notificationPermission,
      userLiveLocation,
      requestLocationPermission,
      requestNotificationPermission,
      sendPushNotification,
      requestAllPermissions
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
