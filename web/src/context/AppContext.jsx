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
  INITIAL_PETS, 
  INITIAL_VETS, 
  INITIAL_PRODUCTS, 
  INITIAL_POSTS 
} from '../config/firebase';
import { useAuth } from './AuthContext';

// Route to Tab Mapping & Document Titles
export const TAB_ROUTES = {
  landing: '/',
  overview: '/',
  dashboard: '/dashboard',
  shop: '/shop',
  tracker: '/tracker',
  ai: '/wellness',
  vets: '/specialists',
  community: '/community',
  food: '/blog',
  vaccines: '/reminders',
  profile: '/profile',
  admin: '/admin',
};

export const ROUTE_TABS = {
  '/': 'landing',
  '/overview': 'landing',
  '/dashboard': 'dashboard',
  '/shop': 'shop',
  '/pet-shop': 'shop',
  '/tracker': 'tracker',
  '/wellness': 'ai',
  '/ai': 'ai',
  '/specialists': 'vets',
  '/vets': 'vets',
  '/community': 'community',
  '/blog': 'food',
  '/nutrition': 'food',
  '/reminders': 'vaccines',
  '/vaccines': 'vaccines',
  '/profile': 'profile',
  '/admin': 'admin',
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
  admin: 'Pet Maya administrative control center for specialist approvals, inventory management, and platform metrics.'
};

const resolveInitialTab = () => {
  if (typeof window === 'undefined') return 'dashboard';
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (ROUTE_TABS[pathname]) {
    return ROUTE_TABS[pathname];
  }
  // Support hash routing fallback (#/shop or #tracker)
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash && (ROUTE_TABS['/' + hash] || TAB_ROUTES[hash])) {
    return ROUTE_TABS['/' + hash] || hash;
  }
  return localStorage.getItem('pm_active_tab') || 'dashboard';
};

const AppContext = createContext();

export function AppProvider({ children }) {
  const { currentUser, awardPoints } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState(resolveInitialTab);
  const [theme, setTheme] = useState(() => localStorage.getItem('pm_theme') || 'dark');

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
    return [];
  });
  const [isPostsLoading, setIsPostsLoading] = useState(() => {
    try {
      return !localStorage.getItem('pm_cached_posts');
    } catch (_) { return true; }
  });

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  // E-Commerce Cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pm_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Orders
  const [orders, setOrders] = useState([]);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Global Promotional Banner
  const [globalBanner, setGlobalBanner] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_global_banner');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      isActive: true,
      text: "Shop online and get specialist help, free delivery, and more.",
      linkText: "store's services",
      linkUrl: "#",
      bgColor: "#f5f5f7",
      textColor: "#1d1d1f"
    };
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
          // If query returned empty, check local storage or use initial pets
          const saved = localStorage.getItem('pm_pets');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPets(parsed);
                return;
              }
            } catch (_) {}
          }
          setPets(INITIAL_PETS);
        }
      }, (err) => {
        console.warn('[Firebase] Pets stream warning:', err);
        const saved = localStorage.getItem('pm_pets');
        setPets(saved ? JSON.parse(saved) : INITIAL_PETS);
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
              category: data.category || 'supplies',
              price: typeof data.price === 'number' ? data.price : (parseFloat(data.price) || 29.99),
              rating: data.rating || 4.8,
              ratingCount: data.ratingCount || 50,
              image: data.imageUrl || data.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop&q=80',
              description: data.description || 'High quality pet care supply.',
              isRx: data.isRx || false
            };
          });
          setProducts(fetchedProducts);
          setIsProductsLoading(false);
          try {
            localStorage.setItem('pm_cached_products', JSON.stringify(fetchedProducts));
          } catch (_) {}
        } else {
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
            let isLiked = false;
            let likesCount = typeof data.likesCount === 'number' ? data.likesCount : (typeof data.likes === 'number' ? data.likes : 0);
            const likedBy = data.likedBy;
            const likedByUserIds = data.likedByUserIds;

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

            return {
              id: docSnap.id,
              postId: data.postId || docSnap.id,
              author: data.userName || data.authorName || data.author || 'Pet Parent',
              authorPhoto: data.userPhoto || data.authorPhoto || data.userPhotoUrl || data.photoUrl || 'assets/images/tail_wagging_logo.png',
              petTag: data.petTag || (postType ? `${postType}` : 'Pet'),
              category: postType,
              time: displayTime,
              timestamp: rawTs || Date.now(),
              content: data.content || '',
              image: data.imageUrl || data.image || data.photoUrl || data.photo || '',
              likes: likesCount,
              isLiked: isLiked,
              likedBy: Array.isArray(likedBy) ? likedBy : (likedBy ? Object.keys(likedBy) : []),
              comments: rawComments,
              commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : rawComments.length,
              sharesCount: data.sharesCount || 0,
              sharedPostId: data.sharedPostId,
              sharedPostAuthor: data.sharedPostAuthor,
              sharedPostContent: data.sharedPostContent,
              sharedPostImageUrl: data.sharedPostImageUrl
            };
          });

          // Sort posts by newest timestamp first
          fetchedPosts.sort((a, b) => b.timestamp - a.timestamp);

          setPosts(fetchedPosts);
        }
        setIsPostsLoading(false);
      }, (err) => {
        console.warn('[Firebase] community_posts onSnapshot error:', err);
        setIsPostsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] community_posts init listener error:', e);
      setIsPostsLoading(false);
    }
  }, [currentUser]);

  // ─── 5. FIREBASE APPOINTMENTS & EVENTS ───
  useEffect(() => {
    if (!currentUser || currentUser.uid.startsWith('demo_guest')) {
      const saved = localStorage.getItem('pm_appointments');
      setAppointments(saved ? JSON.parse(saved) : [
        { id: 'apt-1', title: 'Annual Nobivac Booster with Dr. Sarah Jenkins', doctor: 'Dr. Sarah Jenkins', clinic: 'Greenwood Animal Hospital', petName: 'Max', date: '2026-08-28', time: '10:30 AM', mode: 'In-Clinic Consultation', status: 'Confirmed' }
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
    const newId = 'pet_' + Date.now();
    const petObj = {
      id: newId,
      petID: newId,
      ownerID: currentUser ? currentUser.uid : 'demo_user_001',
      ...petData
    };

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await setDoc(doc(db, 'pets', newId), petObj, { merge: true });
      } catch (e) {
        console.warn('[Firebase] addPet firestore error:', e);
      }
    } else {
      setPets(prev => [petObj, ...prev]);
    }
    awardPoints(10);
  };

  // Delete Pet
  const deletePet = async (petId) => {
    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await deleteDoc(doc(db, 'pets', petId));
      } catch (e) {
        console.warn('[Firebase] deletePet error:', e);
      }
    }
    setPets(prev => prev.filter(p => (p.id !== petId && p.petID !== petId)));
  };

  // Add Community Post
  const createPost = async (postData) => {
    const userDisplayName = postData.author || (currentUser ? currentUser.name : 'Pet Parent');
    const userPhotoUrl = currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png';
    const postType = (postData.category || 'MOMENT').toUpperCase();

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
      createdAt: new Date().toISOString()
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
        content: postData.content || '',
        image: postData.image || '',
        likes: 0, 
        isLiked: false, 
        comments: [] 
      }, ...prev]);
    }
    awardPoints(5);
    showToast('✨ Story published to community feed!', 'success');
  };

  // Toggle Like Post (Reliable Sync with Firestore and Flutter)
  const toggleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    let myUid = currentUser?.uid;
    if (!myUid) {
      myUid = localStorage.getItem('pm_guest_uid');
      if (!myUid) {
        myUid = 'usr_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('pm_guest_uid', myUid);
      }
    }

    const isCurrentlyLiked = !!post.isLiked;
    const newLiked = !isCurrentlyLiked;
    const newLikesCount = newLiked ? (post.likes + 1) : Math.max(0, post.likes - 1);

    // 1. Instant Optimistic UI Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: newLikesCount,
          isLiked: newLiked,
          likedBy: newLiked ? [...(p.likedBy || []), myUid] : (p.likedBy || []).filter(u => u !== myUid)
        };
      }
      return p;
    }));

    // 2. Persist to Firestore with SetOptions merge
    try {
      const postDocRef = doc(db, 'community_posts', postId);
      await setDoc(postDocRef, {
        likesCount: increment(newLiked ? 1 : -1),
        likes: increment(newLiked ? 1 : -1),
        likedByUserIds: newLiked ? arrayUnion(myUid) : arrayRemove(myUid),
        likedBy: { [myUid]: newLiked }
      }, { merge: true });
    } catch (e) {
      console.warn('[Firebase] toggleLike error:', e);
    }
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

  // Add Medical Record
  const addMedicalRecord = async (recordData) => {
    const newRecord = {
      petName: recordData.petName,
      ownerName: currentUser ? currentUser.name : 'Alex Johnson',
      serviceType: recordData.serviceType || 'Consultation',
      weight: recordData.weight || '12 kg',
      diagnosis: recordData.diagnosis,
      prescription: recordData.prescription,
      cost: parseFloat(recordData.cost) || 40,
      date: recordData.date || new Date().toISOString().split('T')[0],
      nextBooster: recordData.nextBooster || 'N/A',
      userId: currentUser ? currentUser.uid : 'demo_user_001',
      createdAt: new Date().toISOString()
    };

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await addDoc(collection(db, 'service_records'), newRecord);
      } catch (e) {
        console.warn('[Firebase] addMedicalRecord error:', e);
      }
    } else {
      setMedicalRecords(prev => [{ id: 'ehr_' + Date.now(), ...newRecord }, ...prev]);
    }
    awardPoints(10);
    showToast('📋 Clinical medical record saved to EHR!', 'success');
  };

  // E-Commerce Cart Actions
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + quantity } : item);
      }
      return [...prev, { ...product, qty: quantity }];
    });
    showToast(`🛒 Added "${product.name}" to bag!`, 'success');
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.qty + delta;
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
    if (clean === 'PETMAYA10') {
      setAppliedCoupon({ code: clean, discount: 0.10, label: '10% Launch Discount' });
      showToast('🎉 Coupon PETMAYA10 applied (10% OFF)!', 'success');
    } else if (clean === 'FREESHIP') {
      setAppliedCoupon({ code: clean, discount: 'free_shipping', label: 'Free Express Shipping' });
      showToast('🚚 Free shipping coupon applied!', 'success');
    } else {
      showToast('❌ Invalid coupon code.', 'error');
    }
  };

  // Checkout & Place Order
  const checkoutOrder = async (deliveryAddress) => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const shipping = appliedCoupon?.discount === 'free_shipping' || subtotal > 50 ? 0 : 5.99;
    const discount = typeof appliedCoupon?.discount === 'number' ? subtotal * appliedCoupon.discount : 0;
    const total = Math.max(0, subtotal - discount + shipping);

    const newOrder = {
      orderId: 'PM-ORD-' + Math.floor(1000 + Math.random() * 9000),
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal,
      shipping,
      discount,
      total: parseFloat(total.toFixed(2)),
      deliveryAddress: deliveryAddress || 'Home Address',
      status: 'In Preparation',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      userId: currentUser ? currentUser.uid : 'demo_user_001'
    };

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await addDoc(collection(db, 'orders'), newOrder);
      } catch (e) {
        console.warn('[Firebase] checkoutOrder error:', e);
      }
    } else {
      setOrders(prev => [newOrder, ...prev]);
    }

    clearCart();
    awardPoints(25);
    showToast('📦 Order placed successfully! Live dispatch tracking active.', 'success');
    return newOrder;
  };

  // ─── ADMIN PRODUCT & INVENTORY MANAGEMENT ACTIONS ───
  const addProduct = async (productData) => {
    const id = productData.id || 'p_' + Date.now();
    const newProduct = {
      id,
      name: productData.name || 'New Product',
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

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

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
      addPet,
      deletePet,
      vets,
      isVetsLoading,
      products,
      isProductsLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      posts,
      isPostsLoading,
      createPost,
      toggleLike,
      addComment,
      appointments,
      addAppointment,
      removeAppointment,
      medicalRecords,
      addMedicalRecord,
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
      updateOrderStatus,
      deleteOrder,
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
