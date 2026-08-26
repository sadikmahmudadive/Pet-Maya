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

  // Synchronize Browser Address Bar & Document Title when activeTab changes
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
    return [];
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
              species: data.species || data.type || 'Dog',
              breed: data.breed || 'Mixed',
              gender: data.gender || 'Unknown',
              age: data.age || '1 Yr',
              weight: data.weight || '10 kg',
              photo: data.photoUrl || data.photo || 'assets/images/Pet_1.jpg',
              microchip: data.microchip || data.microchipId || `PM-${docSnap.id.slice(0, 5).toUpperCase()}`,
              nextVaccine: data.nextVaccine || '2026-09-30'
            };
          });
          setPets(fetchedPets);
        } else {
          // If user has no pets in Firestore yet, start with default
          setPets([]);
        }
      }, (err) => {
        console.warn('[Firebase] Pets stream warning:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Error setting up pets listener:', e);
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
          const fetchedPosts = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            const likedList = data.likedBy || [];
            const isLiked = currentUser ? likedList.includes(currentUser.uid) : false;

            return {
              id: docSnap.id,
              author: data.authorName || data.author || 'Pet Parent',
              authorPhoto: data.authorPhoto || 'assets/images/tail_wagging_logo.png',
              petTag: data.petTag || 'Pet',
              time: data.time || data.timestamp || 'Recent',
              content: data.content || '',
              image: data.imageUrl || data.image || '',
              likes: data.likesCount ?? (likedList.length || 0),
              isLiked: isLiked,
              likedBy: likedList,
              comments: data.comments || []
            };
          });
          setPosts(fetchedPosts);
        } else {
          setPosts(INITIAL_POSTS);
        }
      }, (err) => {
        console.warn('[Firebase] Community posts listener warning:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firebase] Posts setup error:', e);
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
          return {
            id: docSnap.id,
            title: data.title || 'Veterinary Appointment',
            doctor: data.doctor || data.providerName || 'Dr. Specialist',
            clinic: data.clinic || data.location || 'Clinic',
            petName: data.petName || 'Pet',
            date: data.date || '',
            time: data.time || '',
            mode: data.mode || data.type || 'In-Clinic Consultation',
            status: data.status || 'Confirmed'
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
    const newPost = {
      authorName: postData.author || (currentUser ? currentUser.name : 'Pet Parent'),
      authorId: currentUser ? currentUser.uid : 'guest',
      authorPhoto: currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png',
      petTag: postData.petTag || 'Pet',
      content: postData.content,
      imageUrl: postData.image || '',
      likesCount: 0,
      likedBy: [],
      comments: [],
      timestamp: 'Just now',
      createdAt: new Date().toISOString()
    };

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        await addDoc(collection(db, 'community_posts'), newPost);
      } catch (e) {
        console.warn('[Firebase] createPost error:', e);
      }
    } else {
      setPosts(prev => [{ id: 'p_' + Date.now(), ...newPost, likes: 0, isLiked: false }, ...prev]);
    }
    awardPoints(5);
    showToast('✨ Story published to community feed!', 'success');
  };

  // Toggle Like Post
  const toggleLike = async (postId) => {
    if (!currentUser) {
      openModal('auth');
      showToast('🔒 Please sign in to like posts', 'info');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.isLiked;

    if (!currentUser.uid.startsWith('demo_guest')) {
      try {
        const postDocRef = doc(db, 'community_posts', postId);
        await updateDoc(postDocRef, {
          likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
          likesCount: increment(isLiked ? -1 : 1)
        });
      } catch (e) {
        console.warn('[Firebase] toggleLike error:', e);
      }
    } else {
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
            isLiked: !isLiked
          };
        }
        return p;
      }));
    }
  };

  // Add Comment to Post
  const addComment = async (postId, text, authorName) => {
    const commentObj = {
      author: authorName || (currentUser ? currentUser.name : 'Pet Parent'),
      text,
      createdAt: new Date().toISOString()
    };

    if (currentUser && !currentUser.uid.startsWith('demo_guest')) {
      try {
        const postDocRef = doc(db, 'community_posts', postId);
        await updateDoc(postDocRef, {
          comments: arrayUnion(commentObj)
        });
      } catch (e) {
        console.warn('[Firebase] addComment error:', e);
      }
    } else {
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...(p.comments || []), commentObj] };
        }
        return p;
      }));
    }
    showToast('💬 Comment posted!', 'success');
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
      posts,
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
