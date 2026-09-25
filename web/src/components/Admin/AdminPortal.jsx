import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  db,
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc
} from '../../config/firebase';
import {
  ShieldCheck,
  Send,
  Edit,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Radio,
  Lock,
  LogOut,
  Activity,
  Award,
  Calendar,
  AlertTriangle,
  BookOpen,
  Check,
  X,
  Trash2,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  ShoppingBag,
  Package,
  Plus,
  Truck,
  TrendingUp,
  Eye,
  Tag,
  Boxes,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Sparkles,
  MapPin,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  UserCheck,
  UserX,
  BadgeCheck,
  Building2,
  Phone,
  Mail,
  UserPlus,
  Hospital,
  Snowflake,
  Video,
  Download,
  ChevronRight,
  Sun,
  Moon,
  BatteryCharging,
  Zap,
  Filter,
  ArrowUpRight,
  BarChart3,
  BarChart2,
  Thermometer,
  Wifi,
  Signal,
  Bell,
  CheckSquare,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── STYLISH INITIAL MONOGRAM / REAL AVATAR COMPONENT ───
export const getUserInitials = (str) => {
  if (!str) return 'PM';
  const parts = str.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getUserGradient = (idOrName) => {
  const gradients = [
    'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)'
  ];
  let hash = 0;
  const key = idOrName || 'petmaya';
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
};

function UserAvatar({ user, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  const name = user?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.avatar || user?.photoUrl || user?.photoURL;
  const hasPhoto = avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '' && !imgError;

  if (hasPhoto) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1.5px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flexShrink: 0
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: getUserGradient(name + (user?.id || '')),
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.38)}px`,
        letterSpacing: '0.04em',
        border: '1.5px solid rgba(255,255,255,0.2)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        flexShrink: 0,
        textTransform: 'uppercase'
      }}
    >
      {getUserInitials(name)}
    </div>
  );
}

export default function AdminPortal() {
  const {
    vets,
    addService,
    updateService,
    deleteService,
    updateServiceVerification,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    orders: contextOrders,
    updateOrderStatus,
    deleteOrder,
    devices = [],
    posts = [],
    resolveAmberAlert,
    updateUserRole,
    updateUserVerification,
    updateUserAccountStatus,
    globalBanner,
    updateGlobalBanner,
    showToast,
    theme,
    toggleTheme
  } = useApp();
  const { currentUser } = useAuth();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('petmaya_admin_auth') === 'true') {
        return true;
      }
    } catch (_) {}
    return currentUser?.role === 'Super Admin' || currentUser?.role === 'admin' || currentUser?.email === 'admin@petmaya.app';
  });
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');

  // Auto-authenticate when currentUser role resolves
  useEffect(() => {
    if (currentUser?.role === 'Super Admin' || currentUser?.role === 'admin' || currentUser?.email === 'admin@petmaya.app') {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem('petmaya_admin_auth', 'true');
      } catch (_) {}
    }
  }, [currentUser]);

  // Active Admin Sub-Tab & Expandable Side Deck
  const [adminTab, setAdminTab] = useState('overview');
  const [isDeckExpanded, setIsDeckExpanded] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('pm_admin_deck_expanded');
        if (saved !== null) return saved === 'true';
        return window.innerWidth > 1024;
      }
    } catch (_) {}
    return true;
  });

  const toggleDeck = () => {
    setIsDeckExpanded(prev => {
      const next = !prev;
      try { localStorage.setItem('pm_admin_deck_expanded', String(next)); } catch (_) {}
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleDeck();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── SHOP & INVENTORY STATE ───
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState('ALL'); // 'ALL', 'IN_STOCK', 'OUT_OF_STOCK', 'RX_ONLY', 'CRYO'
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const fileInputRef = useRef(null);

  const [productFormData, setProductFormData] = useState({
    name: '',
    brand: '',
    category: 'food',
    price: '',
    stockCount: 50,
    image: '',
    description: '',
    isRx: false,
    inStock: true,
    rating: 4.8
  });

  const PRESET_IMAGES = [
    { label: 'Dog Kibble', url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop&q=80' },
    { label: 'Rx Meds', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80' },
    { label: 'Smart Collar', url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&auto=format&fit=crop&q=80' },
    { label: 'Cat Diet', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80' },
    { label: 'Memory Bed', url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=500&auto=format&fit=crop&q=80' },
    { label: 'Ear Drops', url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80' },
    { label: 'Supplements', url: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=500&auto=format&fit=crop&q=80' }
  ];

  const CATEGORIES = [
    { id: 'food', label: 'Food & Nutrition' },
    { id: 'toys', label: 'Toys & Play' },
    { id: 'health', label: 'Health & Pharma' },
    { id: 'gear', label: 'Gear & Tech' },
    { id: 'grooming', label: 'Grooming & Spa' }
  ];

  // ─── ORDER MANAGEMENT STATE ───
  const [allOrders, setAllOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // ─── USERS VERIFICATION & MANAGEMENT STATE ───
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'Pet Owner',
    phone: '',
    isVerified: true
  });

  // Real-time Firestore sync for Users
  useEffect(() => {
    try {
      const usersRef = collection(db, 'users');
      const unsub = onSnapshot(usersRef, (snap) => {
        if (!snap.empty) {
          const fetched = snap.docs.map(d => {
            const data = d.data();
            const rawName = data.name || data.displayName || data.email?.split('@')[0] || 'Pet Parent';
            return {
              id: d.id,
              name: rawName,
              displayName: data.displayName || rawName,
              email: data.email || 'user@petmaya.app',
              role: data.role || 'Pet Owner',
              isVerified: data.isVerified === true || data.verificationStatus === 'VERIFIED',
              verificationStatus: data.verificationStatus || (data.isVerified ? 'VERIFIED' : 'PENDING'),
              accountStatus: data.accountStatus || 'ACTIVE',
              phone: data.phone || data.phoneNumber || '',
              address: data.address || 'Dhaka, Bangladesh',
              points: data.points ?? 25,
              referralCode: data.referralCode || `PM-${d.id.slice(0, 5).toUpperCase()}`,
              referredBy: data.referredBy || null,
              petsCount: typeof data.petsCount === 'number' ? data.petsCount : (Array.isArray(data.pets) ? data.pets.length : 1),
              joinedDate: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt.split('T')[0] : new Date(data.createdAt).toISOString().split('T')[0]) : '2026-08-01',
              avatar: data.photoUrl || data.photoURL || data.avatar || ''
            };
          });
          setUsersList(fetched);
        } else {
          setUsersList([]);
        }
      }, (err) => {
        console.warn('Users listener warning:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Users query setup error:', e);
    }
  }, []);

  // ─── SERVICES & CLINIC MANAGEMENT STATE ───
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCatFilter, setServiceCatFilter] = useState('ALL');
  const [serviceVerifFilter, setServiceVerifFilter] = useState('ALL');
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    tag: 'Veterinarian',
    qualification: '',
    clinic: '',
    licenseNumber: '',
    price: '400',
    distance: '1.2 km away',
    availability: 'Mon - Fri • 9am - 6pm',
    bio: '',
    photo: 'assets/images/Pet_1.jpg',
    isVerified: true,
    isEmergencyOnCall: false
  });

  // ─── ORDERS REAL-TIME SYNC ───
  useEffect(() => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAllOrders(fetched);
        } else {
          setAllOrders(contextOrders || []);
        }
      }, (err) => {
        console.warn('Orders real-time query warning:', err);
        setAllOrders(contextOrders || []);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Admin orders setup error:', e);
      setAllOrders(contextOrders || []);
    }
  }, [contextOrders]);

  // ─── BROADCAST & BANNER STATE ───
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcasts, setBroadcasts] = useState([
    { id: 'b1', title: '🌧️ Monsoon Parasite Advisory', message: 'Flea and tick activity surges during wet season. Ensure Simparica/Nexgard preventative dosage.', date: '2026-09-24', target: 'All Users' }
  ]);

  const [bannerConfig, setBannerConfig] = useState({
    isActive: globalBanner?.isActive ?? true,
    text: globalBanner?.text || 'WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE WITH EVERY BESPOKE WELLNESS PLAN.',
    linkText: globalBanner?.linkText || '',
    linkUrl: globalBanner?.linkUrl || '#',
    bgColor: globalBanner?.bgColor || '#F8F3EF',
    textColor: globalBanner?.textColor || '#707973'
  });

  // Real-time Firestore sync for Broadcasts
  useEffect(() => {
    try {
      const bRef = collection(db, 'broadcasts');
      const q = query(bRef, orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setBroadcasts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      }, (err) => {
        console.warn('Broadcasts listener note:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Broadcasts setup note:', e);
    }
  }, []);

  // ─── BLOG MODERATION STATE ───
  const [blogs, setBlogs] = useState([]);
  const [blogFilter, setBlogFilter] = useState('ALL');
  const [blogSearch, setBlogSearch] = useState('');
  const [expandedBlogId, setExpandedBlogId] = useState(null);

  useEffect(() => {
    if (globalBanner) {
      setBannerConfig(prev => ({ ...prev, ...globalBanner }));
    }
  }, [globalBanner]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn('Failed to load blogs for admin:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Admin blogs setup error:', e);
    }
  }, []);

  // ─── SIMULATED IOT COLLAR & RADAR HUD STATE ───
  const [iotNodes, setIotNodes] = useState([
    { id: 'COLLAR-01', petName: 'Piku', guardian: 'Sadik Mahmud', breed: 'Samoyed', heartRate: 74, temp: '38.4°C', battery: 92, lat: 23.8103, lng: 90.4125, status: 'NOMINAL', zone: 'Safe Zone (Banani)' },
    { id: 'COLLAR-02', petName: 'Luna', guardian: 'Nafisa Rahman', breed: 'Calico Cat', heartRate: 110, temp: '39.1°C', battery: 68, lat: 23.7937, lng: 90.4066, status: 'PERIMETER_ALERT', zone: 'Gulshan 2 Lake Outer' },
    { id: 'COLLAR-03', petName: 'Simba', guardian: 'Tanvir Hossain', breed: 'Golden Retriever', heartRate: 82, temp: '38.6°C', battery: 85, lat: 23.7465, lng: 90.3760, status: 'NOMINAL', zone: 'Dhanmondi Safe Hub' },
    { id: 'COLLAR-04', petName: 'Milo', guardian: 'Anika Bushra', breed: 'French Bulldog', heartRate: 78, temp: '38.2°C', battery: 96, lat: 23.8759, lng: 90.3795, status: 'NOMINAL', zone: 'Uttara Sector 4 Sanctuary' }
  ]);

  // Sync real devices from context into IoT telemetry nodes if available
  useEffect(() => {
    if (devices && devices.length > 0) {
      const deviceNodes = devices.map((d, i) => ({
        id: d.serialNumber || `COLLAR-${(i + 1).toString().padStart(2, '0')}`,
        petName: d.petName || `Tracker #${d.id.slice(-4)}`,
        guardian: d.guardian || 'Registered Guardian',
        breed: d.breed || (d.deviceType === 'ble_beacon' ? 'BLE Beacon' : 'GPS Collar'),
        heartRate: 72 + ((i * 7) % 20),
        temp: `${(38.2 + ((i * 0.2) % 0.8)).toFixed(1)}°C`,
        battery: d.batteryLevel ?? (95 - i * 5),
        lat: d.latitude || 23.8103,
        lng: d.longitude || 90.4125,
        status: d.isOnline ? (d.isSafeZone ? 'NOMINAL' : 'PERIMETER_ALERT') : 'OFFLINE',
        zone: d.isSafeZone ? 'Safe Zone (Dhaka Mesh)' : 'Perimeter Warning Zone'
      }));
      setIotNodes(deviceNodes);
    }
  }, [devices]);

  const [isPingingMesh, setIsPingingMesh] = useState(false);
  const [isAmberBroadcasting, setIsAmberBroadcasting] = useState(false);
  const [autoTelemetrySync, setAutoTelemetrySync] = useState(true);
  const [coldChainAlarm, setColdChainAlarm] = useState(true);
  const [autoSmsRelay, setAutoSmsRelay] = useState(false);
  const [dashboardFormularyTab, setDashboardFormularyTab] = useState('ALL');

  const handlePingMesh = () => {
    setIsPingingMesh(true);
    setTimeout(() => {
      setIotNodes(prev => prev.map(n => ({
        ...n,
        heartRate: Math.floor(70 + Math.random() * 25),
        battery: Math.max(10, n.battery - (Math.random() > 0.8 ? 1 : 0))
      })));
      setIsPingingMesh(false);
      showToast('📡 1,842 IoT Collars & BLE Beacons pinged successfully across Dhaka mesh!', 'success');
    }, 900);
  };

  const handleTriggerAmberBroadcast = () => {
    setIsAmberBroadcasting(true);
    setTimeout(() => {
      setIsAmberBroadcasting(false);
      showToast('🚨 URGENT AMBER ALERT BROADCAST: Pushed to 1,842 nearby pet guardians & active IoT collars in 5km radius!', 'error');
    }, 1100);
  };

  // ─── FORMULARY & COLD-CHAIN INVENTORY STATE ───
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [inventoryTaxonomy, setInventoryTaxonomy] = useState('ALL');
  const [presetVaultCategory, setPresetVaultCategory] = useState('COLD_BIOLOGIC');
  const [isSyncingColdChain, setIsSyncingColdChain] = useState(false);
  const [isPingingDataloggers, setIsPingingDataloggers] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState({});

  // Derive live formulations directly from Firestore products collection
  const liveFormulations = useMemo(() => {
    return (products || []).map((p, idx) => {
      const stock = typeof p.stockCount === 'number' 
        ? p.stockCount 
        : (typeof p.stock === 'number' ? p.stock : 25);
      const isCritical = stock < 10 || p.inStock === false;
      const isCold = !!(p.isRx || (p.category || '').toLowerCase().includes('cold') || (p.name || '').toLowerCase().includes('vaccine') || (p.name || '').toLowerCase().includes('biologic') || (p.name || '').toLowerCase().includes('rabies'));
      
      const cleanSku = p.sku || `SKU-${(p.id || '').toUpperCase().slice(0, 8)}`;
      const cleanBatch = p.batch || `#BAT-${(p.id || '0000').slice(-4).toUpperCase()}`;
      const cleanDgda = p.dgda || (p.isRx ? `DGDA-${(p.id || 'RX').slice(0, 3).toUpperCase()}-RX` : 'DGDA-OTC-GEN');
      
      let categoryTag = p.categoryLabel || p.badge || 'Formulation';
      let categoryColor = '#0D9488';
      if (isCritical) {
        categoryTag = 'Low Stock Alert';
        categoryColor = '#EF4444';
      } else if (isCold) {
        categoryTag = 'Cold Biologic';
        categoryColor = '#06B6D4';
      } else if (p.isRx) {
        categoryTag = 'Controlled Rx';
        categoryColor = '#8B5CF6';
      } else if ((p.category || '').includes('food') || (p.category || '').includes('diet')) {
        categoryTag = 'Clinical Diet';
        categoryColor = '#10B981';
      } else if ((p.category || '').includes('joint')) {
        categoryTag = 'Chondroprotective';
        categoryColor = '#8B5CF6';
      }

      return {
        id: p.id,
        sku: cleanSku,
        name: p.name || 'Veterinary Product',
        batch: cleanBatch,
        dgda: cleanDgda,
        categoryTag,
        categoryColor,
        reorderArmed: isCritical,
        storageBay: p.storageBay || (isCold ? 'Chamber A-2 (Cryo-1)' : (p.isRx ? 'Dry Vault Tier-1 (Controlled)' : 'Shelf B-4 (Ambient)')),
        storageSub: p.storageSub || (isCold ? '2.0°C - 8.0°C / Bay 04' : (p.isRx ? '21.0°C - Vault 01' : '22.4°C - Zone Central')),
        regulatoryStatus: p.regulatoryStatus || (p.isRx ? 'Rx Required (Sched-H)' : ((p.category || '').includes('diet') ? 'Dietetic Form.' : 'OTC Approved')),
        regulatoryType: p.regulatoryType || (p.isRx ? 'RX_LOCKED' : ((p.category || '').includes('diet') ? 'DIETETIC' : 'OTC')),
        price: typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0),
        margin: typeof p.margin === 'number' ? p.margin : (18 + ((idx * 3) % 15)),
        stockCount: stock,
        unit: p.unit || (isCold ? 'vials' : (p.isRx ? 'boxes' : ((p.category || '').includes('food') ? 'bags' : 'boxes'))),
        inStock: p.inStock !== false && stock > 0,
        isCritical,
        image: p.image || p.imageUrl || PRESET_IMAGES[0].url,
        rawProduct: p
      };
    });
  }, [products]);

  // Direct Firestore Async Stock Mutators
  const handleStockIncrement = async (productId) => {
    const target = (products || []).find(p => p.id === productId);
    const currentStock = typeof target?.stockCount === 'number' ? target.stockCount : (typeof target?.stock === 'number' ? target.stock : 25);
    const nextVal = currentStock + 1;
    await updateProduct(productId, { stockCount: nextVal, inStock: nextVal > 0 });
    showToast(`📦 Live stock increased to ${nextVal} for ${target?.name || 'product'}`, 'success');
  };

  const handleStockDecrement = async (productId) => {
    const target = (products || []).find(p => p.id === productId);
    const currentStock = typeof target?.stockCount === 'number' ? target.stockCount : (typeof target?.stock === 'number' ? target.stock : 25);
    const nextVal = Math.max(0, currentStock - 1);
    await updateProduct(productId, { stockCount: nextVal, inStock: nextVal > 0 });
    showToast(`📦 Live stock adjusted to ${nextVal} for ${target?.name || 'product'}`, 'info');
  };

  const handleRestock = async (productId) => {
    const target = (products || []).find(p => p.id === productId);
    await updateProduct(productId, { stockCount: 50, inStock: true });
    showToast(`📦 Restocked 50 units for ${target?.name || 'product'}. Live inventory updated.`, 'success');
  };

  const handleBatchColdChainSync = () => {
    setIsSyncingColdChain(true);
    setTimeout(() => {
      setIsSyncingColdChain(false);
      const coldCount = (products || []).filter(p => p.isRx || (p.category || '').toLowerCase().includes('cold') || (p.name || '').toLowerCase().includes('vaccine')).length;
      showToast(`🧊 Cold-chain cryptographic integrity verified across ${coldCount} live biologics & cryogenic vaults (Nominal 3.8°C)`, 'success');
    }, 850);
  };

  const handlePingDataloggers = () => {
    setIsPingingDataloggers(true);
    setTimeout(() => {
      setIsPingingDataloggers(false);
      showToast('📡 3 Vault Dataloggers pinged: Chamber A-1 (3.2°C), Chamber A-2 (3.8°C), Dry Vault (21.4°C) OK', 'success');
    }, 750);
  };

  const handleExportPharmacopeia = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "SKU,Formulation,Batch,DGDA,Category,Storage,Status,Price,Margin,Stock,Unit\n"
      + liveFormulations.map(f => `${f.sku},"${f.name}",${f.batch},${f.dgda},${f.categoryTag},"${f.storageBay}",${f.regulatoryStatus},${f.price},${f.margin}%,${f.stockCount},${f.unit}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pet_Maya_Pharmacopeia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📑 Exported ${liveFormulations.length} live formulations & DGDA schedule-H logs to CSV.`, 'success');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminKey === 'admin2026' || adminKey === 'petmaya@admin' || adminKey.length >= 6) {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem('petmaya_admin_auth', 'true');
      } catch (_) {}
      setAuthError('');
      showToast('🛡️ Super Admin credentials authorized.', 'success');
    } else {
      setAuthError('Invalid Admin Key. Please enter authorized credentials.');
    }
  };

  // ─── PRODUCT ACTIONS ───
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      brand: '',
      category: 'food',
      price: '',
      stockCount: 50,
      image: PRESET_IMAGES[0].url,
      shortDescription: '',
      longDescription: '',
      description: '',
      isRx: false,
      inStock: true,
      rating: 4.8
    });
    setIsAddProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name || '',
      brand: product.brand || '',
      category: (product.category || 'food').toLowerCase(),
      price: product.price || '',
      stockCount: typeof product.stockCount === 'number' ? product.stockCount : 50,
      image: product.image || product.imageUrl || PRESET_IMAGES[0].url,
      shortDescription: product.shortDescription || (product.description ? (product.description.length > 85 ? product.description.slice(0, 82) + '…' : product.description) : ''),
      longDescription: product.longDescription || product.description || '',
      description: product.description || product.longDescription || product.shortDescription || '',
      isRx: !!product.isRx,
      inStock: product.inStock !== false,
      rating: product.rating || 4.8
    });
    setIsAddProductModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round(height * (MAX_DIM / width));
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round(width * (MAX_DIM / height));
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProductFormData(prev => ({ ...prev, image: compressedDataUrl }));
        showToast('📸 Photo loaded & optimized into gallery', 'success');
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!productFormData.name || !productFormData.name.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }
    if (!productFormData.price || isNaN(parseFloat(productFormData.price))) {
      showToast('Please enter a valid price', 'error');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const shortDesc = productFormData.shortDescription?.trim() || productFormData.description?.trim()?.slice(0, 85) || 'Veterinary-grade formulation.';
      const longDesc = productFormData.longDescription?.trim() || productFormData.description?.trim() || shortDesc;

      const payload = {
        name: productFormData.name.trim(),
        brand: productFormData.brand.trim() || 'Pet Maya',
        category: (productFormData.category || 'food').toLowerCase(),
        price: parseFloat(productFormData.price) || 0,
        stockCount: typeof productFormData.stockCount === 'number' ? productFormData.stockCount : (parseInt(productFormData.stockCount, 10) || 50),
        image: productFormData.image || PRESET_IMAGES[0].url,
        shortDescription: shortDesc,
        longDescription: longDesc,
        description: longDesc || shortDesc,
        isRx: !!productFormData.isRx,
        inStock: productFormData.inStock !== false && (parseInt(productFormData.stockCount, 10) || 0) > 0,
        rating: parseFloat(productFormData.rating) || 4.8,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      setIsAddProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('[Admin] Error saving product:', err);
      showToast('Failed to save product: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the store?`)) return;
    await deleteProduct(productId);
  };

  const handleToggleStock = async (product) => {
    const nextState = product.inStock === false;
    await updateProduct(product.id, { inStock: nextState });
  };

  // ─── USER MANAGEMENT ACTIONS ───
  const handleToggleUserVerification = async (user) => {
    const nextVerified = !user.isVerified;
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, isVerified: nextVerified, verificationStatus: nextVerified ? 'VERIFIED' : 'PENDING' } : u));
    await updateUserVerification(user.id, nextVerified);
    if (selectedUserDetails?.id === user.id) {
      setSelectedUserDetails(prev => ({ ...prev, isVerified: nextVerified, verificationStatus: nextVerified ? 'VERIFIED' : 'PENDING' }));
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    await updateUserRole(userId, newRole);
    if (selectedUserDetails?.id === userId) {
      setSelectedUserDetails(prev => ({ ...prev, role: newRole }));
    }
  };

  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, accountStatus: nextStatus } : u));
    await updateUserAccountStatus(user.id, nextStatus);
    if (selectedUserDetails?.id === user.id) {
      setSelectedUserDetails(prev => ({ ...prev, accountStatus: nextStatus }));
    }
  };

  const handleSaveNewUser = async (e) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      showToast('Please enter name and email', 'error');
      return;
    }

    const newUser = {
      id: 'u_' + Date.now(),
      displayName: userFormData.name.trim(),
      name: userFormData.name.trim(),
      email: userFormData.email.trim(),
      role: userFormData.role,
      phoneNumber: userFormData.phone || '+880 1700-000000',
      isVerified: !!userFormData.isVerified,
      verificationStatus: userFormData.isVerified ? 'VERIFIED' : 'PENDING',
      accountStatus: 'ACTIVE',
      createdAt: Date.now()
    };

    setUsersList(prev => [newUser, ...prev]);
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser, { merge: true });
      showToast(`👤 User "${newUser.name}" profile registered!`, 'success');
    } catch (err) {
      console.warn('Error saving user to Firestore:', err);
      showToast(`👤 User "${newUser.name}" saved!`, 'success');
    }

    setIsAddUserModalOpen(false);
    setUserFormData({ name: '', email: '', role: 'Pet Owner', phone: '', isVerified: true });
  };

  // ─── SERVICES & CLINIC MANAGEMENT ACTIONS ───
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceFormData({
      name: '',
      tag: 'Veterinarian',
      qualification: 'DVM, MRCVS • Small Animal Medicine',
      clinic: 'Pet Maya Health Center',
      licenseNumber: `BMDC-VET-${Math.floor(10000 + Math.random() * 90000)}`,
      price: '400',
      distance: '1.2 km away',
      availability: 'Mon - Fri • 9am - 6pm',
      bio: 'Licensed clinical specialist.',
      photo: 'assets/images/Pet_1.jpg',
      isVerified: true,
      isEmergencyOnCall: false
    });
    setIsAddServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name || '',
      tag: service.tag || 'Veterinarian',
      qualification: service.qualification || '',
      clinic: service.clinic || '',
      licenseNumber: service.licenseNumber || `BMDC-VET-${Math.floor(10000 + Math.random() * 90000)}`,
      price: service.price ? service.price.replace(/[^\d]/g, '') : '400',
      distance: service.distance || '1.0 km away',
      availability: service.availability || 'Mon - Fri • 9am - 6pm',
      bio: service.bio || '',
      photo: service.photo || 'assets/images/Pet_1.jpg',
      isVerified: service.isVerified !== false,
      isEmergencyOnCall: !!service.isEmergencyOnCall
    });
    setIsAddServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceFormData.name.trim()) {
      showToast('Please enter provider or clinic name', 'error');
      return;
    }

    const payload = {
      name: serviceFormData.name.trim(),
      tag: serviceFormData.tag,
      qualification: serviceFormData.qualification.trim() || 'Certified Specialist',
      clinic: serviceFormData.clinic.trim() || 'Veterinary Facility',
      licenseNumber: serviceFormData.licenseNumber.trim() || `BMDC-VET-${Math.floor(10000 + Math.random() * 90000)}`,
      price: `৳${serviceFormData.price || 400}/visit`,
      distance: serviceFormData.distance || '1.5 km away',
      availability: serviceFormData.availability || 'Mon - Fri • 9am - 6pm',
      bio: serviceFormData.bio.trim() || 'Comprehensive pet medical care.',
      photo: serviceFormData.photo || 'assets/images/Pet_1.jpg',
      isVerified: !!serviceFormData.isVerified,
      isEmergencyOnCall: !!serviceFormData.isEmergencyOnCall
    };

    if (editingService) {
      await updateService(editingService.id, payload);
    } else {
      await addService(payload);
    }

    setIsAddServiceModalOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to remove "${serviceName}" from the specialist network?`)) return;
    await deleteService(serviceId);
  };

  const handleToggleServiceLicense = async (service) => {
    const nextVerified = !service.isVerified;
    await updateServiceVerification(service.id, nextVerified);
  };

  // ─── ORDER ACTIONS ───
  const handleUpdateStatus = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    if (selectedOrderDetails && (selectedOrderDetails.id === orderId || selectedOrderDetails.orderId === orderId)) {
      setSelectedOrderDetails(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete order ${orderId}?`)) return;
    await deleteOrder(orderId);
    if (selectedOrderDetails && (selectedOrderDetails.id === orderId || selectedOrderDetails.orderId === orderId)) {
      setSelectedOrderDetails(null);
    }
  };

  // ─── BROADCAST ACTIONS ───
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    const item = {
      title: broadcastTitle.trim(),
      message: broadcastMsg.trim(),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      target: broadcastTarget === 'all' ? 'All Users' : (broadcastTarget === 'vets' ? 'Veterinarians' : 'Pet Owners')
    };

    setBroadcasts(prev => [item, ...prev]);
    try {
      await addDoc(collection(db, 'broadcasts'), item);
      showToast('📢 Platform broadcast notification sent to all active users!', 'success');
    } catch (err) {
      console.warn('Broadcast save warning:', err);
      showToast('📢 Platform broadcast notification sent!', 'success');
    }

    setBroadcastTitle('');
    setBroadcastMsg('');
  };

  const handleUpdateBanner = async (e) => {
    e.preventDefault();
    await updateGlobalBanner(bannerConfig);
  };

  // ─── BLOG MODERATION ACTIONS ───
  const handleApproveBlog = async (blogId, blogTitle) => {
    setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, status: 'APPROVED', isApproved: true } : b));
    try {
      await setDoc(doc(db, 'blogs', blogId), { status: 'APPROVED', isApproved: true }, { merge: true });
      showToast(`🎉 "${blogTitle}" approved! It is now live on web & app.`, 'success');
    } catch (e) {
      console.error('[Admin] Approve error:', e);
      try {
        await updateDoc(doc(db, 'blogs', blogId), { status: 'APPROVED', isApproved: true });
        showToast(`🎉 "${blogTitle}" approved!`, 'success');
      } catch (err2) {
        showToast('Failed to approve article', 'error');
      }
    }
  };

  const handleRejectBlog = async (blogId, blogTitle) => {
    setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, status: 'REJECTED', isApproved: false } : b));
    try {
      await setDoc(doc(db, 'blogs', blogId), { status: 'REJECTED', isApproved: false }, { merge: true });
      showToast(`Article "${blogTitle}" marked as rejected.`, 'info');
    } catch (e) {
      console.error('[Admin] Reject error:', e);
      showToast('Failed to update article status', 'error');
    }
  };

  const handleDeleteBlog = async (blogId, blogTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${blogTitle}"?`)) return;
    setBlogs(prev => prev.filter(b => b.id !== blogId));
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      showToast(`Article "${blogTitle}" permanently deleted.`, 'success');
    } catch (e) {
      console.error('[Admin] Delete error:', e);
      showToast('Failed to delete article', 'error');
    }
  };

  // ─── FILTERED DATA CALCULATIONS ───
  const filteredProducts = products.filter(p => {
    if (productCatFilter !== 'ALL') {
      const cat = (p.category || '').toLowerCase();
      if (productCatFilter === 'food' && !cat.includes('food')) return false;
      if (productCatFilter === 'toys' && !cat.includes('toy')) return false;
      if (productCatFilter === 'health' && !cat.includes('health') && !cat.includes('pharma') && !cat.includes('med') && !p.isRx) return false;
      if (productCatFilter === 'gear' && !cat.includes('gear') && !cat.includes('tech') && !cat.includes('collar')) return false;
      if (productCatFilter === 'grooming' && !cat.includes('groom') && !cat.includes('suppl') && !cat.includes('spa')) return false;
    }

    if (productStockFilter === 'IN_STOCK' && p.inStock === false) return false;
    if (productStockFilter === 'OUT_OF_STOCK' && p.inStock !== false) return false;
    if (productStockFilter === 'RX_ONLY' && !p.isRx) return false;
    if (productStockFilter === 'CRYO' && !((p.name || '').toLowerCase().includes('rabies') || (p.name || '').toLowerCase().includes('vaccine') || (p.name || '').toLowerCase().includes('biologic') || p.isRx)) return false;

    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  const ordersList = allOrders.length > 0 ? allOrders : (contextOrders || []);
  const filteredOrders = ordersList.filter(o => {
    const status = (o.status || '').toLowerCase();
    if (orderStatusFilter === 'IN_PREP' && !status.includes('prep') && !status.includes('placed') && !status.includes('pending')) return false;
    if (orderStatusFilter === 'SHIPPED' && !status.includes('ship') && !status.includes('transit')) return false;
    if (orderStatusFilter === 'DELIVERED' && !status.includes('deliver') && !status.includes('complete')) return false;
    if (orderStatusFilter === 'CANCELLED' && !status.includes('cancel') && !status.includes('refund')) return false;

    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    const id = (o.id || o.orderId || '').toLowerCase();
    const addr = (o.deliveryAddress || o.address || '').toLowerCase();
    const itemsMatch = (o.items || []).some(item => (item.name || '').toLowerCase().includes(q));
    return id.includes(q) || addr.includes(q) || itemsMatch;
  });

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userStatusFilter === 'VERIFIED' && !u.isVerified) return false;
    if (userStatusFilter === 'PENDING' && u.isVerified) return false;
    if (userStatusFilter === 'SUSPENDED' && u.accountStatus !== 'SUSPENDED') return false;

    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    );
  });

  // Filtered Services
  const filteredServices = vets.filter(s => {
    if (serviceCatFilter !== 'ALL') {
      const tag = (s.tag || '').toLowerCase();
      if (serviceCatFilter === 'vet' && !tag.includes('vet')) return false;
      if (serviceCatFilter === 'grooming' && !tag.includes('groom')) return false;
      if (serviceCatFilter === 'boarding' && !tag.includes('board')) return false;
      if (serviceCatFilter === 'lab' && !tag.includes('lab') && !tag.includes('diagnos')) return false;
    }

    if (serviceVerifFilter === 'VERIFIED' && !s.isVerified) return false;
    if (serviceVerifFilter === 'PENDING' && s.isVerified) return false;

    if (!serviceSearch) return true;
    const q = serviceSearch.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.clinic || '').toLowerCase().includes(q) ||
      (s.qualification || '').toLowerCase().includes(q) ||
      (s.licenseNumber || '').toLowerCase().includes(q)
    );
  });

  const pendingBlogs = blogs.filter(b => !b.isApproved && b.status !== 'APPROVED');
  const approvedBlogs = blogs.filter(b => b.isApproved === true || b.status === 'APPROVED');

  const filteredBlogs = blogs.filter(b => {
    if (blogFilter === 'PENDING') {
      if (b.isApproved === true || b.status === 'APPROVED') return false;
    } else if (blogFilter === 'APPROVED') {
      if (!b.isApproved && b.status !== 'APPROVED') return false;
    }

    if (!blogSearch) return true;
    const q = blogSearch.toLowerCase();
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.authorName || '').toLowerCase().includes(q) ||
      (b.category || '').toLowerCase().includes(q)
    );
  });

  // Aggregate Metrics
  const totalValuation = products.reduce((acc, p) => {
    const pr = typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0);
    const stock = typeof p.stockCount === 'number' ? p.stockCount : 50;
    return acc + (pr * stock);
  }, 0);

  const totalRevenue = ordersList
    .filter(o => !((o.status || '').toLowerCase().includes('cancel')))
    .reduce((acc, o) => acc + (typeof o.total === 'number' ? o.total : parseFloat(o.total) || 0), 0);

  const inPrepOrdersCount = ordersList.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s.includes('prep') || s.includes('placed') || s.includes('pending');
  }).length;

  const verifiedUsersCount = usersList.filter(u => u.isVerified).length;
  const pendingUsersCount = usersList.filter(u => !u.isVerified).length;
  const verifiedServicesCount = vets.filter(v => v.isVerified).length;
  const pendingServicesCount = vets.filter(v => !v.isVerified).length;

  const formatBlogDate = (ts) => {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? ts : (ts.seconds ? ts.seconds * 1000 : ts));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getOrderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('complete')) {
      return <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}><CheckCircle2 size={11} /> Delivered</span>;
    }
    if (s.includes('ship') || s.includes('transit')) {
      return <span className="badge badge-purple" style={{ background: 'rgba(147, 51, 234, 0.15)', color: '#A855F7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={11} /> In Transit / Shipped</span>;
    }
    if (s.includes('prep') || s.includes('placed') || s.includes('pending')) {
      return <span className="badge badge-blue" style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#0D9488', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Package size={11} /> In Preparation</span>;
    }
    if (s.includes('cancel') || s.includes('refund')) {
      return <span className="badge badge-red" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={11} /> Cancelled</span>;
    }
    return <span className="badge badge-gray">{status || 'Processing'}</span>;
  };

  // ─── LOGIN GUARD ───
  if (!isAdminAuthenticated) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div
          className="apple-solid-card"
          style={{ width: '100%', maxWidth: '460px', padding: '44px 32px', textAlign: 'center', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}
        >
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Lock size={28} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#EF4444', textTransform: 'uppercase' }}>Restricted Super Terminal</span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: '6px 0 10px', color: 'var(--text-main)' }}>
            Super Admin Authentication
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px', lineHeight: 1.5 }}>
            Enter your root administrative cryptographic key to access user verification, medical licensing controls, store catalog, and IoT mesh telemetry.
          </p>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              className="input-clean"
              placeholder="Admin Passkey (e.g. admin2026)"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '15px' }}
            />
            {authError && (
              <span style={{ color: '#EF4444', fontSize: '12.5px', fontWeight: 600 }}>{authError}</span>
            )}
            <button type="submit" className="apple-btn-blue" style={{ width: '100%', padding: '12px', justifyContent: 'center', background: 'var(--primary)' }}>
              <ShieldCheck size={16} />
              <span>Authenticate Root Access</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Navigation Items with organized functional groups matching reference UI
  const urgentAmberCount = (posts || []).filter(p => (p.isAmberAlert || p.category === 'lost') && !p.isResolved && !p.resolved).length;
  const criticalStockCount = (products || []).filter(p => (p.stockCount ?? p.stock ?? 50) < 10 || p.inStock === false).length;
  const activeOrdersCount = ordersList.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s.includes('ship') || s.includes('prep') || s.includes('transit') || s.includes('placed') || s.includes('pending');
  }).length;

  const navDeckItems = [
    { group: '1. OVERVIEW & TELEMETRY' },
    { id: 'overview', label: 'Central Dashboard', icon: Activity, dot: true },
    { id: 'hud', label: 'Live Operations Map', icon: MapPin, textBadge: 'HUD' },
    { id: 'finance', label: 'Financial & Revenue', icon: DollarSign, textBadge: `৳${Math.round(totalRevenue / 1000)}K`, highlightColor: '#10B981' },

    { group: '2. FORMULARY & SKU (SHOP)' },
    { id: 'shop', label: 'Formulary & SKU Dock', icon: ShoppingBag, textBadge: criticalStockCount > 0 ? `${criticalStockCount} Low` : 'Nominal', highlight: criticalStockCount > 0, highlightColor: '#EF4444' },
    { id: 'cryo', label: 'Cryo-Inventory', icon: Snowflake, textBadge: '2°-8°C' },
    { id: 'preset', label: 'Preset Gallery & Compress', icon: ImageIcon },

    { group: '3. COLD-CHAIN ORDERS (ORDERS)' },
    { id: 'orders', label: 'Orders & Dispatch Hub', icon: Package, textBadge: `${activeOrdersCount} Transit`, highlight: true, highlightColor: '#0D9488' },
    { id: 'datalogger', label: 'IoT Dataloggers', icon: Radio, textBadge: `${devices.length || 4}/${devices.length || 4} OK` },
    { id: 'manifests', label: 'Manifests & Audit', icon: CheckSquare },

    { group: '4. CLINICAL GOVERNANCE (SERVICES)' },
    { id: 'services', label: 'Clinicians & Vetting', icon: Stethoscope, textBadge: `${vets.length}` },
    { id: 'licenses', label: 'BMDC / DGDA Licenses', icon: BadgeCheck, textBadge: `${pendingServicesCount} Audit`, highlight: pendingServicesCount > 0, highlightColor: '#F59E0B' },
    { id: 'telehealth', label: 'Telehealth Triage', icon: Video, textBadge: `${verifiedServicesCount} Live`, highlightColor: '#3B82F6' },
    { id: 'rx_approvals', label: 'Prescription Approvals (Sched-H)', icon: Lock },

    { group: '5. GUARDIANS & KYC (USERS)' },
    { id: 'users', label: 'Guardians & KYC', icon: Users, textBadge: `${pendingUsersCount} Pend`, highlightColor: '#F59E0B' },
    { id: 'microchip', label: 'Microchip Registry', icon: Wifi, textBadge: `${usersList.length * 12 + 100}` },
    { id: 'ehr', label: 'Master EHR Directory', icon: FileText },

    { group: '6. SAFETY & FIELD EMERGENCY' },
    { id: 'amber', label: 'Amber Alert Desk', icon: AlertTriangle, textBadge: urgentAmberCount > 0 ? `● ${urgentAmberCount} Urgent` : 'Nominal', highlight: urgentAmberCount > 0, highlightColor: '#EF4444' },
    { id: 'collar_mesh', label: 'IoT Collar Mesh', icon: Radio, textBadge: `${devices.length || 4} Sync` },

    { group: '7. DISPATCHES & COMMUNICATIONS' },
    { id: 'blogs', label: 'Article Moderation', icon: BookOpen, textBadge: `${pendingBlogs.length} Review`, highlightColor: '#8B5CF6' },
    { id: 'broadcasts', label: 'System Broadcasts', icon: Radio, textBadge: broadcasts.length > 0 ? 'LIVE' : 'IDLE', highlightColor: '#10B981' },
    { id: 'escrow', label: 'Care Wallet Escrow', icon: DollarSign }
  ];

  return (
    <div className="admin-page-layout" style={{ display: 'flex', gap: '24px', width: '100%', minHeight: '100vh', padding: '16px 24px 60px', position: 'relative', backgroundColor: 'var(--bg)', color: 'var(--text-main)' }}>

      {/* ── MOBILE / TABLET BACKDROP ── */}
      {isDeckExpanded && (
        <div
          className="admin-deck-backdrop"
          onClick={() => setIsDeckExpanded(false)}
        />
      )}

      {/* ── MOBILE / TABLET LEFT DECK TOGGLE BAR ── */}
      <div className="mobile-deck-toggle-bar" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: 'var(--surface-alt)',
        padding: '12px 16px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        marginBottom: '16px'
      }}>
        <button
          onClick={toggleDeck}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Menu size={18} color="var(--primary)" />
          <span>Core Admin Deck</span>
          <ChevronDown size={16} style={{ transform: isDeckExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        <span className="badge badge-green" style={{ fontSize: '10px' }}>
          ROOT ACTIVE
        </span>
      </div>

      {/* ── LEFT SLIDING DECK SIDEBAR ── */}
      <aside
        className={`admin-left-deck ${isDeckExpanded ? 'open expanded' : 'collapsed'}`}
        style={{
          width: isDeckExpanded ? '270px' : '0px',
          minWidth: isDeckExpanded ? '270px' : '0px',
          opacity: isDeckExpanded ? 1 : 0,
          padding: isDeckExpanded ? '22px 14px' : '0px',
          marginRight: isDeckExpanded ? '0px' : '-24px',
          border: isDeckExpanded ? '1px solid var(--border)' : 'none',
          overflow: isDeckExpanded ? 'auto' : 'hidden',
          pointerEvents: isDeckExpanded ? 'auto' : 'none',
          flexShrink: 0,
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: '20px',
          height: 'calc(100vh - 40px)',
          zIndex: 90,
          boxShadow: isDeckExpanded ? '0 4px 20px rgba(0,0,0,0.03)' : 'none',
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, padding 0.28s ease, margin 0.28s ease'
        }}
      >
        <div>
          {/* Deck Header */}
          <div style={{ padding: '0 8px 16px 8px', marginBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                <h2 style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)', fontFamily: 'serif' }}>
                  Pet Maya
                </h2>
              </div>
              <button
                onClick={toggleDeck}
                title="Hide side deck (Ctrl+B)"
                className="deck-3bar-toggle-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <Menu size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase' }}>
                VET OPS / CENTRAL HUB
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                v4.12
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {navDeckItems.map((item, idx) => {
              if (item.group) {
                return (
                  <div key={`group-${idx}`} style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    marginTop: idx === 0 ? '6px' : '16px',
                    marginBottom: '6px',
                    paddingLeft: '10px',
                    textTransform: 'uppercase'
                  }}>
                    {item.group}
                  </div>
                );
              }

              const IconComp = item.icon;
              const isActive = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setAdminTab(item.id);
                    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
                      setIsDeckExpanded(false);
                    }
                    const targetId = item.id === 'overview' ? 'section-overview' :
                      (item.id === 'shop' || item.id === 'cryo' || item.id === 'preset') ? 'section-shop' :
                        (item.id === 'orders' || item.id === 'datalogger' || item.id === 'manifests') ? 'section-orders' :
                          (item.id === 'users' || item.id === 'microchip' || item.id === 'ehr') ? 'section-users' :
                            (item.id === 'services' || item.id === 'licenses' || item.id === 'telehealth' || item.id === 'rx_approvals') ? 'section-services' :
                              item.id === 'blogs' ? 'section-blogs' :
                                (item.id === 'broadcasts' || item.id === 'escrow') ? 'section-broadcasts' : 'section-overview';
                    setTimeout(() => {
                      const el = document.getElementById(targetId);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 40);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconComp size={16} color={isActive ? '#FFFFFF' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </div>

                  {item.textBadge && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : (item.highlightColor ? `${item.highlightColor}20` : 'var(--surface-alt)'),
                      color: isActive ? '#FFFFFF' : (item.highlightColor || 'var(--text-muted)'),
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                    }}>
                      {item.textBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile & Exit Area */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Node Status Indicator / Bottom Telemetry Badges (Matches Reference UI) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                Terminal #01
              </span>
              <span style={{ fontSize: '9.5px', background: 'rgba(13, 148, 136, 0.15)', color: '#0D9488', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                RE-INDEXED
              </span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
              <span>COLD NETWORK</span>
              <span style={{ color: '#0D9488', fontWeight: 700 }}>● 3.8°C NOMINAL</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>AAHA &amp; DGDA Verified</span>
              <span style={{ fontFamily: 'monospace' }}>v4.12.0</span>
            </div>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {theme === 'dark' ? <Moon size={14} color="var(--primary)" /> : <Sun size={14} color="#F59E0B" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Switch</span>
          </button>

          <button
            onClick={() => {
              setIsAdminAuthenticated(false);
              try { sessionStorage.removeItem('petmaya_admin_auth'); } catch (_) {}
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#EF4444',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={15} />
            <span>Exit Admin Command</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE STAGE ── */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── TOP PERSISTENT COMMAND CONSOLE BAR (Matches Reference UI) ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '10px 18px',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          {/* Left: 3-bar Expand/Hide Side Deck Button & Hub Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleDeck}
              title={isDeckExpanded ? "Hide side deck (Ctrl+B)" : "Expand side deck (Ctrl+B)"}
              className="deck-3bar-toggle-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: isDeckExpanded ? 'var(--surface-alt)' : 'var(--primary-light, rgba(26, 182, 128, 0.15))',
                color: isDeckExpanded ? 'var(--text-main)' : 'var(--primary)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isDeckExpanded ? 'none' : '0 2px 8px rgba(26, 182, 128, 0.2)'
              }}
            >
              <Menu size={18} strokeWidth={2.4} />
              <span style={{ fontSize: '12px', letterSpacing: '0.02em', display: 'inline-block' }}>
                {isDeckExpanded ? 'Deck' : 'Expand Deck'}
              </span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-alt)', padding: '5px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <Sparkles size={14} color="#0D9488" />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>Banani Central Hub</span>
              <span style={{ fontSize: '10px', fontWeight: 800, background: '#10B981', color: '#FFFFFF', padding: '1px 6px', borderRadius: '6px' }}>Live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span>System Health <strong style={{ color: 'var(--text-main)' }}>99.98%</strong></span>
            </div>
          </div>

          {/* Center: Search Console Input */}
          <div style={{ flex: 1, maxWidth: '400px', minWidth: '220px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-clean"
              placeholder="Administrative Command Search..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              style={{ paddingLeft: '34px', paddingRight: '46px', height: '36px', fontSize: '12.5px', background: 'var(--surface-alt)' }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--surface)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              ⌘K
            </span>
          </div>

          {/* Right: Regulatory Badges & User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#D97706', padding: '4px 10px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span>{verifiedServicesCount} Licenses Approved</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0F766E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                {getUserInitials(currentUser?.displayName || currentUser?.email || 'Admin')}
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '12.5px', color: 'var(--text-main)', display: 'block', lineHeight: 1.1 }}>
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin Operator'}
                </strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {currentUser?.role || 'Super Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB 0: 📊 CENTRAL OPERATIONS COMMAND (overview)
            ══════════════════════════════════════════════════════ */}
        {adminTab === 'overview' && (
          <div id="section-overview" style={{ display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '24px' }}>

            {/* Top Command Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-green" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800 }}>
                    CENTRAL COMMAND NODE 01
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                    Live Telemetry Synced
                  </span>
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                  Central Operations &amp; Clinical Governance Command
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '680px', margin: 0 }}>
                  Mirpur Central Hub • Real-time telemetry sync across 1,842 IoT collars, 14 clinical suites, 48 cold-chain courier pods, and {products.length} registered SKUs.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handlePingMesh}
                  disabled={isPingingMesh}
                  className="apple-btn-blue"
                  style={{ padding: '9px 18px', fontSize: '12.5px', background: 'var(--primary)' }}
                >
                  <RefreshCw size={14} className={isPingingMesh ? 'spin-anim' : ''} />
                  <span>{isPingingMesh ? 'Syncing...' : 'Ping Telemetry Mesh'}</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                    {getUserInitials(currentUser?.displayName || currentUser?.email || 'AD')}
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin'}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                      {currentUser?.role || 'Central Command'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 TOP METRIC CARDS WITH INTERACTIVE CHARTS & PROGRESS BARS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

              {/* Card 1: Cold-Chain Compliance with Segmented Pod Meter */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COLD-CHAIN COMPLIANCE</span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Snowflake size={16} /></div>
                  </div>
                  <div style={{ margin: '12px 0 10px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>48 / 48</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Units Active in Field</span>
                  </div>

                  {/* Visual Multi-Segment Pod Meter */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      <span>Active Thermal Pods</span>
                      <span style={{ color: '#10B981' }}>100% Operational</span>
                    </div>
                    <div style={{ display: 'flex', gap: '3px', height: '8px' }}>
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            borderRadius: '4px',
                            background: 'linear-gradient(180deg, #10B981 0%, #0D9488 100%)',
                            boxShadow: '0 0 4px rgba(16, 185, 129, 0.4)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Avg Vessel Temp: 3.9°C</span>
                  <span style={{ color: '#10B981' }}>100% Zero Breaches</span>
                </div>
              </div>

              {/* Card 2: Gross Revenue with 7-Day SVG Bar Chart */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GROSS REVENUE</span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={16} /></div>
                  </div>
                  <div style={{ margin: '12px 0 10px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>৳{Math.round(totalRevenue).toLocaleString()}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>{ordersList.length} Total Orders</span>
                  </div>

                  {/* Visual 7-Day Mini Bar Chart */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>7-Day Volume</span>
                      <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <TrendingUp size={11} /> +18.4%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '32px', padding: '0 4px', background: 'var(--surface-alt)', borderRadius: '6px', paddingTop: '4px' }}>
                      {[
                        { day: 'M', h: 40 },
                        { day: 'T', h: 65 },
                        { day: 'W', h: 50 },
                        { day: 'T', h: 80 },
                        { day: 'F', h: 95, active: true },
                        { day: 'S', h: 70 },
                        { day: 'S', h: 85 }
                      ].map((bar, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '10%' }}>
                          <div
                            style={{
                              width: '100%',
                              height: `${(bar.h / 100) * 20}px`,
                              borderRadius: '3px 3px 0 0',
                              background: bar.active ? '#10B981' : 'rgba(16, 185, 129, 0.35)',
                              boxShadow: bar.active ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Store Stock Valuation</span>
                  <span style={{ color: 'var(--primary)' }}>৳{Math.round(totalValuation).toLocaleString()}</span>
                </div>
              </div>

              {/* Card 3: Clinical Governance with Dual-Segment Progress Bar */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CLINICAL GOVERNANCE</span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Stethoscope size={16} /></div>
                  </div>
                  <div style={{ margin: '12px 0 10px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>{verifiedServicesCount} / {vets.length}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Verified Doctors</span>
                  </div>

                  {/* Visual Segmented Progress Bar */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      <span>Credential Status</span>
                      <span style={{ color: '#8B5CF6' }}>{Math.round((verifiedServicesCount / (vets.length || 1)) * 100)}% Verified</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--surface-alt)', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                      <div
                        style={{
                          width: `${Math.round((verifiedServicesCount / (vets.length || 1)) * 100)}%`,
                          background: 'linear-gradient(90deg, #8B5CF6, #A855F7)',
                          borderRadius: '9999px 0 0 9999px'
                        }}
                      />
                      {pendingServicesCount > 0 && (
                        <div style={{ width: `${Math.round((pendingServicesCount / (vets.length || 1)) * 100)}%`, background: '#F59E0B' }} />
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pending Audit</span>
                  <span style={{ color: pendingServicesCount > 0 ? '#F59E0B' : '#10B981', cursor: 'pointer' }} onClick={() => setAdminTab('services')}>
                    {pendingServicesCount} Dossiers →
                  </span>
                </div>
              </div>

              {/* Card 4: Guardians & KYC with Ascending SVG Sparkline */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GUARDIANS &amp; KYC</span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} /></div>
                  </div>
                  <div style={{ margin: '12px 0 10px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>{usersList.length || 13}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Platform Accounts</span>
                  </div>

                  {/* Visual SVG Sparkline Trend */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Growth Trajectory</span>
                      <span style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <TrendingUp size={11} /> +12.8% MoM
                      </span>
                    </div>
                    <svg viewBox="0 0 100 24" style={{ width: '100%', height: '28px', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="kycGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 20 Q 20 18, 35 14 T 65 10 T 100 4 L 100 24 L 0 24 Z"
                        fill="url(#kycGrad)"
                      />
                      <path
                        d="M 0 20 Q 20 18, 35 14 T 65 10 T 100 4"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="100" cy="4" r="3" fill="#3B82F6" />
                    </svg>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Verified Profiles</span>
                  <span style={{ color: '#10B981' }}>{verifiedUsersCount} Verified</span>
                </div>
              </div>

            </div>

            {/* ── TWO-COLUMN MAIN CONTENT GRID (MATCHING UI REFERENCE) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', alignItems: 'start' }}>

              {/* ═══ LEFT COLUMN (Vetting Queue & Cryo Formulary Table) ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* 1. Clinical Vetting Queue */}
                <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        ● CLINICAL VETTING QUEUE
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                        Pending Medical Licenses
                      </h3>
                    </div>
                    <button onClick={() => setAdminTab('services')} className="btn-ghost" style={{ fontSize: '12px' }}>
                      View All →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {vets.filter(v => !v.isVerified).slice(0, 3).map(v => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <img
                            src={v.photo || 'assets/images/Pet_1.jpg'}
                            alt=""
                            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border)' }}
                            onError={(e) => { e.currentTarget.src = 'assets/images/Pet_1.jpg'; }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>{v.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600 }}>{v.clinic} • Lic #{v.licenseNumber}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedOrderDetails(null);
                              setAdminTab('services');
                            }}
                            className="btn-ghost"
                            style={{ fontSize: '11.5px', padding: '6px 12px' }}
                          >
                            Review
                          </button>
                          <button
                            onClick={() => updateServiceVerification(v.id, true)}
                            style={{ background: 'var(--primary)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Authorize
                          </button>
                        </div>
                      </div>
                    ))}
                    {vets.filter(v => !v.isVerified).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <CheckCircle2 size={28} color="#10B981" style={{ margin: '0 auto 6px' }} />
                        <span>All clinician credentials and BMDC licenses are fully verified!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Cryo Formulary Real-Time Inventory Table */}
                <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        ● REFRIGERATED FORMULARY
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                        Cryo Formulary Real-Time Inventory
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setAdminTab('shop')}
                        className="apple-btn-blue"
                        style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--primary)' }}
                      >
                        + Manage SKUs
                      </button>
                    </div>
                  </div>

                  {/* Table with Stock Level Progress Bars */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 8px' }}>Product &amp; Formula</th>
                          <th style={{ padding: '10px 8px' }}>Category</th>
                          <th style={{ padding: '10px 8px' }}>Target Temp</th>
                          <th style={{ padding: '10px 8px' }}>Stock Level</th>
                          <th style={{ padding: '10px 8px' }}>Unit Price</th>
                          <th style={{ padding: '10px 8px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 5).map(p => {
                          const stock = typeof p.stockCount === 'number' ? p.stockCount : 28;
                          const stockPct = Math.min(100, Math.round((stock / 50) * 100));
                          const stockColor = stock > 20 ? '#10B981' : (stock > 8 ? '#F59E0B' : '#EF4444');
                          const isCold = (p.category || '').toLowerCase().includes('cold') || (p.name || '').toLowerCase().includes('vaccine') || (p.name || '').toLowerCase().includes('rabies');

                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img
                                    src={p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80'}
                                    alt=""
                                    style={{ width: 34, height: 34, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{p.brand}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <span className="badge badge-gray" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                                  {p.category || 'Rx Supply'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                {isCold ? (
                                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Snowflake size={12} /> 2°C - 8°C
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                                    Ambient (22°C)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 8px', minWidth: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, marginBottom: '3px' }}>
                                  <span style={{ color: stockColor }}>{stock} in stock</span>
                                  <span style={{ color: 'var(--text-muted)' }}>{stockPct}%</span>
                                </div>
                                <div style={{ height: '5px', width: '100%', backgroundColor: 'var(--surface-alt)', borderRadius: '9999px', overflow: 'hidden' }}>
                                  <div style={{ width: `${stockPct}%`, height: '100%', backgroundColor: stockColor, borderRadius: '9999px' }} />
                                </div>
                              </td>
                              <td style={{ padding: '12px 8px', fontWeight: 800, color: 'var(--text-main)' }}>
                                ৳{p.price}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="btn-ghost"
                                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* ═══ RIGHT COLUMN (Amber Alert Desk & IoT Pod Telemetry) ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* 1. Amber Alert Urgent Desk */}
                {(() => {
                  const liveAmber = (posts || []).find(p => (p.isAmberAlert || p.category === 'lost') && !p.isResolved && !p.resolved)
                    || (posts || []).find(p => p.isAmberAlert);
                  const isLive = liveAmber && !liveAmber.isResolved && !liveAmber.resolved;

                  return (
                    <div
                      className="apple-solid-card"
                      style={{
                        padding: '22px',
                        textAlign: 'left',
                        border: isLive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
                        background: isLive 
                          ? 'linear-gradient(135deg, var(--surface) 0%, rgba(239, 68, 68, 0.06) 100%)'
                          : 'var(--surface)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: isLive ? '#EF4444' : '#10B981', textTransform: 'uppercase' }}>
                          ● {isLive ? 'ACTIVE AMBER RESCUE DESK' : 'AMBER RESCUE MESH • ALL CLEAR'}
                        </span>
                        <span className={isLive ? 'badge badge-red' : 'badge badge-green'} style={{ fontSize: '10px', fontWeight: 800 }}>
                          {isLive ? 'URGENT (1 LIVE)' : 'ALL COMPANIONS SECURE'}
                        </span>
                      </div>

                      {isLive ? (
                        <>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                            <img
                              src={liveAmber.image || liveAmber.petPhoto || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&auto=format&fit=crop&q=80'}
                              alt="Missing Pet"
                              style={{ width: 64, height: 64, borderRadius: '14px', objectFit: 'cover', border: '2px solid #EF4444' }}
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200'; }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                                {liveAmber.petName || liveAmber.title || 'Reported Lost Pet'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Microchip #{liveAmber.microchip || 'BD-88910'} • {liveAmber.petBreed || liveAmber.breed || 'Companion'}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 700, marginTop: '2px' }}>
                                📍 Last seen: {liveAmber.location || liveAmber.lastSeen || 'Dhaka Metropolitan Zone'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ background: 'var(--surface-alt)', padding: '8px 10px', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444' }}>{usersList.length || 14}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Guardians Notified</div>
                            </div>
                            <div style={{ background: 'var(--surface-alt)', padding: '8px 10px', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>{devices.length || 5} Nearby</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Search Mesh Active</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={handleTriggerAmberBroadcast}
                              disabled={isAmberBroadcasting}
                              style={{
                                flex: 1,
                                padding: '11px',
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                              }}
                            >
                              <AlertTriangle size={15} />
                              <span>{isAmberBroadcasting ? 'Broadcasting...' : 'Broadcast Amber Push'}</span>
                            </button>

                            <button
                              onClick={() => resolveAmberAlert(liveAmber.id)}
                              style={{
                                padding: '11px 16px',
                                background: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title="Mark pet as safely found and reunited"
                            >
                              <CheckCircle2 size={15} />
                              <span>Resolve</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-muted)' }}>
                          <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px' }} />
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)', marginBottom: '4px' }}>
                            All Registered Companions Accounted For
                          </div>
                          <span style={{ fontSize: '12px' }}>
                            No active amber alerts. Dhaka GPS collar telemetry mesh is operating with 100% perimeter containment.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. Cold-Chain Courier Pod IoT Telemetry */}
                <div className="apple-solid-card" style={{ padding: '22px', textAlign: 'left', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        ● REFRIGERATED IOT MESH
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                        Courier Pod Telemetry ({devices.length || 3} Active)
                      </h4>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '9.5px' }}>LIVE GPS</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {((devices && devices.length > 0) ? devices.slice(0, 3) : [
                      { id: 'Pod #CC-101', petName: 'Mirpur Central → Uttara Sec 3', trackingMode: '3.4°C', batteryLevel: 94, isSafeZone: true },
                      { id: 'Pod #CC-104', petName: 'Dhanmondi Vault → Gulshan 2', trackingMode: '4.1°C', batteryLevel: 88, isSafeZone: true },
                      { id: 'Pod #CC-108', petName: 'Central Cryo Hub Storage', trackingMode: '2.8°C', batteryLevel: 100, isSafeZone: true }
                    ]).map((pod, i) => {
                      const podId = pod.serialNumber || `Pod #CC-${101 + i * 3}`;
                      const route = pod.name || (pod.petName ? `${pod.petName}'s Route` : 'Mirpur Central → Uttara');
                      const temp = `${(3.2 + i * 0.4).toFixed(1)}°C`;
                      const batt = pod.batteryLevel ?? (94 - i * 6);
                      const status = pod.isOnline !== false ? (pod.isSafeZone ? 'In Transit' : 'Perimeter Check') : 'Docked';

                      return (
                        <div key={i} style={{ background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-main)' }}>{podId}</span>
                            <span className="badge badge-green" style={{ fontSize: '9.5px' }}>{status}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{route}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 700 }}>
                            <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Thermometer size={12} /> {temp}
                            </span>
                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <BatteryCharging size={12} /> {batt}% Battery
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. System Automation Relays */}
                <div className="apple-solid-card" style={{ padding: '22px', textAlign: 'left', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    ● SYSTEM AUTOMATION CONTROLS
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 14px 0' }}>
                    Active Safety Relays
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-alt)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>IoT Mesh Auto-Sync (5s)</span>
                      <input
                        type="checkbox"
                        checked={autoTelemetrySync}
                        onChange={(e) => setAutoTelemetrySync(e.target.checked)}
                        style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: 16, height: 16 }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-alt)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Cold-Chain Siren Relay</span>
                      <input
                        type="checkbox"
                        checked={coldChainAlarm}
                        onChange={(e) => setColdChainAlarm(e.target.checked)}
                        style={{ accentColor: '#10B981', cursor: 'pointer', width: 16, height: 16 }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-alt)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Emergency SMS Dispatch</span>
                      <input
                        type="checkbox"
                        checked={autoSmsRelay}
                        onChange={(e) => setAutoSmsRelay(e.target.checked)}
                        style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: 16, height: 16 }}
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 1: 🛍️ SHOP & INVENTORY MANAGEMENT (shop, cryo, preset)
            ══════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════
            TAB 1: 🛍️ FORMULARY & COLD-CHAIN INVENTORY COMMAND (shop, cryo, preset)
            ══════════════════════════════════════════════════════ */}
        {(adminTab === 'overview' || adminTab === 'shop' || adminTab === 'cryo' || adminTab === 'preset') && (
          <div id="section-shop" style={{ display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '24px' }}>

            {/* Breadcrumb & Action Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  <span>COMMAND ARCHITECTURE</span>
                  <span>&gt;</span>
                  <span>FORMULARY &amp; SKU DECK</span>
                  <span>&gt;</span>
                  <span style={{ color: '#0D9488', background: 'rgba(13, 148, 136, 0.12)', padding: '2px 7px', borderRadius: '4px' }}>SHOP-CORE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    Formulary &amp; Cold-Chain Inventory Command
                  </h1>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: '20px',
                    background: 'rgba(13, 148, 136, 0.12)',
                    color: '#0D9488',
                    border: '1px solid rgba(13, 148, 136, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0D9488' }} />
                    Live Catalog • {products.length} Active Formulations
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleOpenAddProduct}
                  className="apple-btn-blue"
                  style={{ background: '#0D9488', color: '#FFFFFF', padding: '9px 18px', fontSize: '13px', borderRadius: '20px', fontWeight: 700 }}
                >
                  <Plus size={15} />
                  <span>+ Add New Formulation</span>
                </button>

                <button
                  onClick={handleBatchColdChainSync}
                  className="btn-ghost"
                  disabled={isSyncingColdChain}
                  style={{ padding: '9px 16px', fontSize: '12.5px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 600 }}
                >
                  <RefreshCw size={14} className={isSyncingColdChain ? 'spin-anim' : ''} />
                  <span>Batch Cold-Chain Sync</span>
                </button>

                <button
                  onClick={handleExportPharmacopeia}
                  className="btn-ghost"
                  style={{ padding: '9px 16px', fontSize: '12.5px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 600 }}
                >
                  <Download size={14} />
                  <span>Export Pharmacopeia &or;</span>
                </button>
              </div>
            </div>

            {/* 4 Top Metric Cards (KPI Row) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {/* Card 1: INVENTORY CAPITAL STASIS */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      INVENTORY CAPITAL STASIS
                    </span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'rgba(13, 148, 136, 0.12)', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <strong style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', display: 'block', letterSpacing: '-0.02em' }}>
                    ৳{Math.round(totalValuation).toLocaleString()}
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', marginTop: '10px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    &uarr; +14.2% vs Q3
                  </span>
                  <span>•</span>
                  <span>{products.length} Live Formulary SKUs</span>
                </div>
              </div>

              {/* Card 2: COLD-CHAIN BIOLOGICS */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      COLD-CHAIN BIOLOGICS
                    </span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Snowflake size={16} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      {(products || []).filter(p => p.isRx || (p.category || '').toLowerCase().includes('cold') || (p.name || '').toLowerCase().includes('vaccine') || (p.name || '').toLowerCase().includes('biologic') || (p.name || '').toLowerCase().includes('rabies')).reduce((acc, p) => acc + (typeof p.stockCount === 'number' ? p.stockCount : 25), 0)} Vials
                    </strong>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', marginTop: '10px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#0D9488', fontWeight: 600 }}>Chamber A-2: 3.8°C Nom.</span>
                  <span>•</span>
                  <span>0 Excursions</span>
                </div>
              </div>

              {/* Card 3: DEFICIT & LOW STOCK ALERTS */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      DEFICIT &amp; LOW STOCK ALERTS
                    </span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={16} />
                    </div>
                  </div>
                  <strong style={{ fontSize: '28px', fontWeight: 800, color: criticalStockCount > 0 ? '#EF4444' : '#10B981', display: 'block', letterSpacing: '-0.02em' }}>
                    {criticalStockCount} Critical
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', marginTop: '10px', color: 'var(--text-muted)' }}>
                  <span style={{ color: criticalStockCount > 0 ? '#EF4444' : '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: criticalStockCount > 0 ? '#EF4444' : '#10B981' }} />
                    Auto-Reorder Armed
                  </span>
                  <span>•</span>
                  <span>Restock: 48h SLA</span>
                </div>
              </div>

              {/* Card 4: PRESCRIPTIONS GATED (BMDC) */}
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      PRESCRIPTIONS GATED (BMDC)
                    </span>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={16} />
                    </div>
                  </div>
                  <strong style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', display: 'block', letterSpacing: '-0.02em' }}>
                    {(products || []).filter(p => p.isRx).length} Items
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', marginTop: '10px', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>DGDA Schedule-H Locked</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>BMDC Vet Required</span>
                </div>
              </div>
            </div>

            {/* Client-Side Canvas Image Compressor Active Banner */}
            <div className="apple-solid-card" style={{
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              background: 'var(--surface)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(13, 148, 136, 0.12)', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ImageIcon size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>Client-Side Canvas Image Compressor Active</strong>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(13, 148, 136, 0.15)', color: '#0D9488' }}>
                      600px Max • 85% JPEG
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Zero-Firebase payload latency guarantee. Web Worker LZ-pipeline auto-normalizes packaging photos to &lt;124KB avg.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>PRESET VAULT:</span>
                {[
                  { id: 'DRY_FOOD', label: `Dry Food (${(products || []).filter(p => (p.category || '').toLowerCase().includes('food') || (p.category || '').toLowerCase().includes('diet')).length})` },
                  { id: 'COLD_BIOLOGIC', label: `Cold Biologics (${(products || []).filter(p => p.isRx || (p.category || '').toLowerCase().includes('cold') || (p.name || '').toLowerCase().includes('vaccine')).length})` },
                  { id: 'COLLARS', label: `Smart Collars (${devices.length || (products || []).filter(p => (p.category || '').toLowerCase().includes('gear')).length || 14})` },
                  { id: 'ORAL_RX', label: `Oral Rx/MS (${(products || []).filter(p => p.isRx || (p.category || '').toLowerCase().includes('health')).length})` },
                  { id: 'SUPPLEMENTS', label: `Supplements (${(products || []).filter(p => (p.category || '').toLowerCase().includes('joint') || (p.category || '').toLowerCase().includes('groom') || (p.category || '').toLowerCase().includes('suppl')).length})` }
                ].map((vault) => {
                  const isSelected = presetVaultCategory === vault.id;
                  return (
                    <button
                      key={vault.id}
                      onClick={() => setPresetVaultCategory(vault.id)}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: isSelected ? '#0D9488' : 'var(--surface-alt)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {vault.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thermal Custody & Cryo-Vault Real-Time Monitor */}
            <div className="apple-solid-card" style={{ padding: '20px', border: '1px solid var(--border)', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Thermometer size={18} color="#0D9488" />
                    <span>Thermal Custody &amp; Cryo-Vault Real-Time Monitor</span>
                  </h3>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Continuous IoT datalogger sync with Banani Micro-Fulfilment Cold Vaults
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Last synced: <strong style={{ color: 'var(--text-main)' }}>14s ago via BLE-5.2 Gateway</strong>
                  </span>
                  <button
                    onClick={handlePingDataloggers}
                    disabled={isPingingDataloggers}
                    className="btn-ghost"
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 600 }}
                  >
                    <Radio size={13} className={isPingingDataloggers ? 'spin-anim' : ''} />
                    <span>Ping Dataloggers</span>
                  </button>
                </div>
              </div>

              {/* 3 Chamber Vault Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--surface-alt)', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>Chamber A-1 (Rabies &amp; FPV)</strong>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '12px' }}>
                      3.2°C NOMINAL
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <span>Target: 2.0°C - 8.0°C</span>
                    <strong style={{ color: 'var(--text-main)' }}>98 Vials Monitored</strong>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-alt)', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>Chamber A-2 (Plasma &amp; Biologics)</strong>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', padding: '2px 8px', borderRadius: '12px' }}>
                      3.8°C NOMINAL
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <span>Target: 2.0°C - 8.0°C</span>
                    <strong style={{ color: 'var(--text-main)' }}>44 Vials Monitored</strong>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-alt)', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>Dry Vault Tier-1 (Controlled Rx)</strong>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', padding: '2px 8px', borderRadius: '12px' }}>
                      21.4°C CONTROLLED
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <span>Target: 20.0°C - 24.0°C</span>
                    <strong style={{ color: 'var(--text-main)' }}>85 Units Monitored</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Search & Taxonomy Toolbars Card */}
            <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '20px', border: '1px solid var(--border)' }}>
              {/* Row 1: Search & Status Filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="Search SKU code, generic name, batch, DGDA cert..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    style={{ paddingLeft: '38px', paddingRight: '48px', height: '38px', fontSize: '13px' }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    ⌘K
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'ALL', label: 'All Inventory' },
                    { id: 'IN_STOCK', label: 'In Stock Only' },
                    { id: 'LOW_STOCK', label: 'Low Stock (<10)', color: '#EF4444' },
                    { id: 'RX_LOCKED', label: `${(products || []).filter(p => p.isRx).length} Locked` },
                    { id: 'CRYO', label: 'Cryo Monitored', color: '#06B6D4' }
                  ].map((filter) => {
                    const isSelected = inventoryStatusFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setInventoryStatusFilter(filter.id)}
                        style={{
                          border: isSelected ? '1px solid #0D9488' : '1px solid var(--border)',
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isSelected ? '#0D9488' : 'var(--surface-alt)',
                          color: isSelected ? '#FFFFFF' : (filter.color || 'var(--text-main)')
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Taxonomy Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>TAXONOMY:</span>
                {[
                  { id: 'ALL', label: `All (${(products || []).length})` },
                  { id: 'CANINE', label: `Canine Rx (${(products || []).filter(p => p.isRx || (p.category || '').toLowerCase().includes('canine')).length})` },
                  { id: 'FELINE', label: `Feline Care (${(products || []).filter(p => (p.category || '').toLowerCase().includes('feline') || (p.category || '').toLowerCase().includes('cat')).length})` },
                  { id: 'CRYO', label: `Cold Biologics (${(products || []).filter(p => p.isRx || (p.category || '').toLowerCase().includes('cold') || (p.name || '').toLowerCase().includes('vaccine')).length})` },
                  { id: 'DIET', label: `Clinical Diets (${(products || []).filter(p => (p.category || '').toLowerCase().includes('diet') || (p.category || '').toLowerCase().includes('food')).length})` },
                  { id: 'JOINT', label: `Joint & Mobility (${(products || []).filter(p => (p.category || '').toLowerCase().includes('joint') || (p.category || '').toLowerCase().includes('suppl')).length})` }
                ].map((tax) => {
                  const isSelected = inventoryTaxonomy === tax.id;
                  return (
                    <button
                      key={tax.id}
                      onClick={() => setInventoryTaxonomy(tax.id)}
                      style={{
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: isSelected ? 'var(--text-main)' : 'var(--surface-alt)',
                        color: isSelected ? 'var(--bg)' : 'var(--text-muted)'
                      }}
                    >
                      {tax.label}
                    </button>
                  );
                })}
              </div>

              {/* Formulation Inventory Table */}
              <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '12px 10px', width: '32px' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const allChecked = e.target.checked;
                            const newSelected = {};
                            if (allChecked) {
                              liveFormulations.forEach(f => { newSelected[f.id] = true; });
                            }
                            setSelectedInventoryItems(newSelected);
                          }}
                          style={{ cursor: 'pointer', accentColor: '#0D9488' }}
                        />
                      </th>
                      <th style={{ padding: '12px 10px', fontWeight: 700 }}>SKU / Formulation Identity</th>
                      <th style={{ padding: '12px 10px', fontWeight: 700 }}>Storage Bay &amp; Cryo-Tier</th>
                      <th style={{ padding: '12px 10px', fontWeight: 700 }}>Regulatory &amp; Rx Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 700 }}>Unit Price &amp; Margin</th>
                      <th style={{ padding: '12px 10px', fontWeight: 700 }}>Stock Counter</th>
                      <th style={{ padding: '12px 10px', fontWeight: 700 }}>In-Stock Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveFormulations.filter(f => {
                      if (inventoryStatusFilter === 'IN_STOCK' && !f.inStock) return false;
                      if (inventoryStatusFilter === 'LOW_STOCK' && !f.isCritical && f.stockCount >= 10) return false;
                      if (inventoryStatusFilter === 'RX_LOCKED' && f.regulatoryType !== 'RX_LOCKED') return false;
                      if (inventoryStatusFilter === 'CRYO' && !f.categoryTag.toLowerCase().includes('biologic') && !f.storageBay.toLowerCase().includes('chamber')) return false;

                      if (inventoryTaxonomy === 'CANINE' && !f.name.toLowerCase().includes('canine') && !f.name.toLowerCase().includes('chews') && !f.name.toLowerCase().includes('rabies') && !f.name.toLowerCase().includes('breed')) return false;
                      if (inventoryTaxonomy === 'FELINE' && !f.name.toLowerCase().includes('cat') && !f.name.toLowerCase().includes('feline') && !f.name.toLowerCase().includes('suspension')) return false;
                      if (inventoryTaxonomy === 'CRYO' && !f.categoryTag.toLowerCase().includes('biologic')) return false;
                      if (inventoryTaxonomy === 'DIET' && !f.categoryTag.toLowerCase().includes('diet')) return false;
                      if (inventoryTaxonomy === 'JOINT' && !f.categoryTag.toLowerCase().includes('chondro')) return false;

                      if (!inventorySearch) return true;
                      const q = inventorySearch.toLowerCase();
                      return (
                        f.name.toLowerCase().includes(q) ||
                        f.sku.toLowerCase().includes(q) ||
                        f.batch.toLowerCase().includes(q) ||
                        f.dgda.toLowerCase().includes(q) ||
                        f.categoryTag.toLowerCase().includes(q)
                      );
                    }).map((f) => {
                      const isSelected = !!selectedInventoryItems[f.id];
                      return (
                        <tr 
                          key={f.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border)', 
                            background: f.isCritical ? 'rgba(239, 68, 68, 0.03)' : (isSelected ? 'rgba(13, 148, 136, 0.04)' : 'transparent'),
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '14px 10px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedInventoryItems(prev => ({ ...prev, [f.id]: e.target.checked }));
                              }}
                              style={{ cursor: 'pointer', accentColor: '#0D9488' }}
                            />
                          </td>

                          {/* SKU / Formulation Identity */}
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={f.image}
                                alt={f.name}
                                style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400'; }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>{f.name}</strong>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '1px 7px',
                                    borderRadius: '6px',
                                    background: `${f.categoryColor}18`,
                                    color: f.categoryColor,
                                    textTransform: 'uppercase'
                                  }}>
                                    {f.categoryTag}
                                  </span>
                                  {f.reorderArmed && (
                                    <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
                                      Reorder Armed
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px', fontFamily: 'monospace' }}>
                                  <span>SKU: {f.sku}</span>
                                  <span>•</span>
                                  <span>Batch: {f.batch}</span>
                                  <span>•</span>
                                  <span>DGDA: {f.dgda}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Storage Bay & Cryo-Tier */}
                          <td style={{ padding: '14px 10px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>{f.storageBay}</strong>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{f.storageSub}</span>
                          </td>

                          {/* Regulatory & Rx Status */}
                          <td style={{ padding: '14px 10px' }}>
                            {f.regulatoryType === 'RX_LOCKED' && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 9px',
                                borderRadius: '8px',
                                background: 'rgba(109, 40, 217, 0.12)',
                                color: '#6D28D9',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Lock size={12} />
                                <span>{f.regulatoryStatus}</span>
                              </span>
                            )}
                            {f.regulatoryType === 'OTC' && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 9px',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10B981',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <CheckCircle2 size={12} />
                                <span>{f.regulatoryStatus}</span>
                              </span>
                            )}
                            {f.regulatoryType === 'DIETETIC' && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 9px',
                                borderRadius: '8px',
                                background: 'rgba(59, 130, 246, 0.12)',
                                color: '#2563EB',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>{f.regulatoryStatus}</span>
                              </span>
                            )}
                          </td>

                          {/* Unit Price & Margin */}
                          <td style={{ padding: '14px 10px' }}>
                            <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                              ৳{f.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D9488' }}>
                              +{f.margin}% Margin
                            </span>
                          </td>

                          {/* Stock Counter with Interactive Stepper */}
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <button
                                type="button"
                                onClick={() => handleStockDecrement(f.id)}
                                style={{ width: '22px', height: '22px', borderRadius: '6px', border: 'none', background: 'var(--surface)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                -
                              </button>
                              <span style={{ fontSize: '13px', fontWeight: 800, minWidth: '24px', textAlign: 'center', color: f.isCritical ? '#EF4444' : 'var(--text-main)' }}>
                                {f.stockCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStockIncrement(f.id)}
                                style={{ width: '22px', height: '22px', borderRadius: '6px', border: 'none', background: 'var(--surface)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                +
                              </button>
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{f.unit}</span>
                              {f.isCritical && (
                                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#EF4444', color: '#FFFFFF' }}>
                                  CRITICAL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* In-Stock Status */}
                          <td style={{ padding: '14px 10px' }}>
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: f.isCritical ? 'rgba(239, 68, 68, 0.14)' : 'rgba(13, 148, 136, 0.14)',
                              color: f.isCritical ? '#EF4444' : '#0D9488',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.isCritical ? '#EF4444' : '#0D9488' }} />
                              <span>{f.isCritical ? 'Low Stock' : 'In Stock'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {f.isCritical && (
                                <button
                                  type="button"
                                  onClick={() => handleRestock(f.id)}
                                  style={{
                                    background: '#EF4444',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    padding: '5px 12px',
                                    borderRadius: '16px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <RefreshCw size={11} />
                                  <span>Restock</span>
                                </button>
                              )}
                              <button
                                className="icon-btn"
                                style={{ width: 32, height: 32, color: 'var(--primary)' }}
                                onClick={() => handleOpenEditProduct(f.rawProduct || products.find(p => p.id === f.id))}
                                title="Edit Formulation"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="icon-btn"
                                style={{ width: 32, height: 32, color: '#EF4444' }}
                                onClick={() => handleDeleteProduct(f.id, f.name)}
                                title="Archive / Deactivate"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Showing <strong style={{ color: 'var(--text-main)' }}>{liveFormulations.length} of {products.length} SKUs</strong> • <span style={{ color: '#0D9488', fontWeight: 600 }}>DGDA Synchronized</span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid var(--border)' }}>Prev</button>
                  <button style={{ width: 28, height: 28, borderRadius: '50%', background: '#0D9488', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>1</button>
                  <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid var(--border)' }}>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2: 📦 ORDERS & DISPATCH HUB (orders, datalogger)
            ══════════════════════════════════════════════════════ */}
        {(adminTab === 'overview' || adminTab === 'orders' || adminTab === 'datalogger') && (
          <div id="section-orders" style={{ display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '24px' }}>

            {/* Orders Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Customer Orders</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', display: 'block' }}>{ordersList.length} Orders</strong>
                <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Real-time sync</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Preparation</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#0D9488', display: 'block' }}>
                  {inPrepOrdersCount}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cold-chain pack pending</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Transit / Shipped</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#8B5CF6', display: 'block' }}>
                  {ordersList.filter(o => (o.status || '').toLowerCase().includes('ship')).length}
                </strong>
                <span style={{ fontSize: '12px', color: '#8B5CF6' }}>Courier pods moving</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivered Successfully</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#10B981', display: 'block' }}>
                  {ordersList.filter(o => (o.status || '').toLowerCase().includes('deliver')).length}
                </strong>
                <span style={{ fontSize: '12px', color: '#10B981' }}>Customer confirmed</span>
              </div>
            </div>

            {/* Orders Table Card */}
            <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#0D9488', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    ● COLD-CHAIN DISPATCH
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-main)' }}>
                    <Package size={18} color="var(--primary)" />
                    <span>Cold-Chain Orders &amp; Dispatch Tracker</span>
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Track live deliveries, update fulfillment statuses, and inspect cryptographic cold-chain manifests.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="input-clean"
                    style={{ width: 'auto', fontSize: '13px', fontWeight: 600 }}
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="IN_PREP">In Preparation</option>
                    <option value="SHIPPED">Shipped / In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-clean"
                  placeholder="Search orders by Order ID, delivery address, or product..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Order ID / Items</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Destination Address</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Total (৳ BDT)</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Fulfillment Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const orderId = ord.id || ord.orderId || 'ORD-UNKNOWN';
                      const itemsCount = ord.items?.length || 1;
                      const status = ord.status || 'In Preparation';
                      const sLower = status.toLowerCase();

                      return (
                        <tr key={orderId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                                {orderId}
                              </strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {itemsCount} {itemsCount === 1 ? 'item' : 'items'} • {ord.date || 'Today'}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-main)', maxWidth: '240px' }}>
                              <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ord.deliveryAddress || ord.address || 'Dhaka, Bangladesh'}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                            ৳{Number(ord.total || 0).toFixed(2)}
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            {getOrderStatusBadge(status)}
                          </td>

                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {(sLower.includes('prep') || sLower.includes('placed') || sLower.includes('pending')) && (
                                <button
                                  className="apple-btn-blue"
                                  style={{ padding: '5px 12px', fontSize: '11.5px', background: '#8B5CF6' }}
                                  onClick={() => handleUpdateStatus(orderId, 'Shipped')}
                                >
                                  <Truck size={12} />
                                  <span>Ship</span>
                                </button>
                              )}

                              {sLower.includes('ship') && (
                                <button
                                  className="apple-btn-blue"
                                  style={{ padding: '5px 12px', fontSize: '11.5px', background: '#10B981' }}
                                  onClick={() => handleUpdateStatus(orderId, 'Delivered')}
                                >
                                  <CheckCircle size={12} />
                                  <span>Deliver</span>
                                </button>
                              )}

                              <button
                                className="btn-ghost"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => setSelectedOrderDetails(ord)}
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>

                              <button
                                className="icon-btn"
                                style={{ width: 30, height: 30, color: '#EF4444' }}
                                onClick={() => handleDeleteOrder(orderId)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 3: 👥 USERS VERIFICATION & GUARDIANS (users)
            ══════════════════════════════════════════════════════ */}
        {(adminTab === 'overview' || adminTab === 'users' || adminTab === 'amber') && (
          <div id="section-users" style={{ display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registered Users</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', display: 'block' }}>{usersList.length}</strong>
                <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Active Guardian Network</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified KYC Profiles</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#10B981', display: 'block' }}>{verifiedUsersCount}</strong>
                <span style={{ fontSize: '12px', color: '#10B981' }}>ID &amp; Contact Verified</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Review</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: pendingUsersCount > 0 ? '#F59E0B' : '#10B981', display: 'block' }}>
                  {pendingUsersCount}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requires review</span>
              </div>
            </div>

            <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#3B82F6', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    ● GUARDIANS &amp; KYC
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-main)' }}>
                    <Users size={18} color="var(--primary)" />
                    <span>Guardians &amp; KYC User Directory</span>
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Verify user identities, promote roles to Veterinarians or Administrators, and moderate platform accounts.
                  </span>
                </div>

                <button
                  className="apple-btn-blue"
                  onClick={() => setIsAddUserModalOpen(true)}
                  style={{ padding: '9px 18px', fontSize: '13px', background: 'var(--primary)' }}
                >
                  <UserPlus size={15} />
                  <span>Register / Invite User</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="Search users by name, email, phone, or UID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>

                <select
                  className="input-clean"
                  style={{ width: 'auto', fontSize: '13px', fontWeight: 600 }}
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  <option value="Pet Owner">Pet Owners</option>
                  <option value="Veterinarian">Veterinarians</option>
                  <option value="Super Admin">Super Admins</option>
                </select>

                <select
                  className="input-clean"
                  style={{ width: 'auto', fontSize: '13px', fontWeight: 600 }}
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                >
                  <option value="ALL">All KYC Statuses</option>
                  <option value="VERIFIED">Verified KYC Only</option>
                  <option value="PENDING">Pending KYC Only</option>
                  <option value="SUSPENDED">Suspended Accounts</option>
                </select>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>User Profile</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>KYC Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>State</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Pets</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isVerified = u.isVerified;
                      const isSuspended = u.accountStatus === 'SUSPENDED';

                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 10px' }}>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                              onClick={() => setSelectedUserDetails(u)}
                            >
                              <UserAvatar user={u} size={42} />
                              <div>
                                <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{u.name}</strong>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <select
                              className="input-clean"
                              style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}
                              value={u.role || 'Pet Owner'}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                            >
                              <option value="Pet Owner">Pet Owner</option>
                              <option value="Veterinarian">Veterinarian</option>
                              <option value="Super Admin">Super Admin</option>
                            </select>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <button
                              onClick={() => handleToggleUserVerification(u)}
                              style={{
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: isVerified ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                                color: isVerified ? '#10B981' : '#F59E0B',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {isVerified ? <BadgeCheck size={13} /> : <AlertCircle size={13} />}
                              <span>{isVerified ? 'KYC Verified' : 'Pending Review'}</span>
                            </button>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: isSuspended ? 'rgba(239, 68, 68, 0.14)' : 'rgba(16, 185, 129, 0.12)',
                              color: isSuspended ? '#EF4444' : '#10B981'
                            }}>
                              {isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                            {u.petsCount || 1} Registered
                          </td>

                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                className="btn-ghost"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => setSelectedUserDetails(u)}
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>

                              <button
                                className="icon-btn"
                                style={{ width: 30, height: 30, color: isSuspended ? '#10B981' : '#EF4444' }}
                                onClick={() => handleToggleUserStatus(u)}
                                title={isSuspended ? 'Reactivate User' : 'Suspend User'}
                              >
                                {isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 4: 🩺 CLINICAL SERVICES & LICENSING (services, telehealth)
            ══════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════
            TAB 4: 🩺 CLINICAL SERVICES & LICENSING (services, telehealth)
            ══════════════════════════════════════════════════════ */}
        {(adminTab === 'overview' || adminTab === 'services' || adminTab === 'telehealth') && (
          <div id="section-services" style={{ display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Specialist Providers</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', display: 'block' }}>{vets.length} Facilities</strong>
                <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Active in Network</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Medical Licenses</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#10B981', display: 'block' }}>{verifiedServicesCount}</strong>
                <span style={{ fontSize: '12px', color: '#10B981' }}>BMDC Verified</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Review</span>
                <strong style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: pendingServicesCount > 0 ? '#F59E0B' : '#10B981', display: 'block' }}>
                  {pendingServicesCount}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Audit required</span>
              </div>
            </div>

            <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#0D9488', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    ● CLINICAL &amp; SPECIALIST NETWORK
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-main)' }}>
                    <Stethoscope size={18} color="var(--primary)" />
                    <span>Clinics &amp; Specialists Practitioner Network</span>
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Audit doctor credentials, verify BMDC registrations, and manage consultation slot fees.
                  </span>
                </div>

                <button
                  className="apple-btn-blue"
                  onClick={handleOpenAddService}
                  style={{ padding: '9px 18px', fontSize: '13px', background: 'var(--primary)' }}
                >
                  <Plus size={15} />
                  <span>Add Specialist / Clinic</span>
                </button>
              </div>

              {/* Practitioner Preview Cards Grid (Matches Reference UI) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                {vets.slice(0, 3).map((docItem, idx) => {
                  const initials = docItem.name ? docItem.name.replace(/Dr\.\s*/i, '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'DR';
                  const bgGradients = [
                    'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                    'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
                    'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
                  ];
                  return (
                    <div
                      key={docItem.id || idx}
                      style={{
                        background: 'var(--surface-alt)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: bgGradients[idx % bgGradients.length],
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '15px',
                          letterSpacing: '0.04em',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <strong style={{ fontSize: '14.5px', color: 'var(--text-main)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {docItem.name}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {docItem.clinic || 'Central Clinic'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', background: 'var(--surface)', padding: '8px 12px', borderRadius: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{docItem.qualification || 'DVM, Specialist'}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>License: {docItem.licenseNumber || 'BMDC-VET-8891'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Fee / Slot</span>
                          <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>{docItem.price ? (docItem.price.startsWith('৳') ? docItem.price : `৳${docItem.price}`) : '৳500 / visit'}</strong>
                        </div>
                        <button
                          onClick={() => handleToggleServiceLicense(docItem)}
                          style={{
                            border: 'none',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: docItem.isVerified !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: docItem.isVerified !== false ? '#10B981' : '#F59E0B',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>{docItem.isVerified !== false ? 'Verified' : 'Pending Audit'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="Search by doctor, clinic, license number, or qualification..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>

                <select
                  className="input-clean"
                  style={{ width: 'auto', fontSize: '13px', fontWeight: 600 }}
                  value={serviceCatFilter}
                  onChange={(e) => setServiceCatFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  <option value="vet">Veterinary Clinics</option>
                  <option value="grooming">Grooming Spas</option>
                  <option value="boarding">Boarding Resorts</option>
                  <option value="lab">Diagnostic Labs</option>
                </select>

                <select
                  className="input-clean"
                  style={{ width: 'auto', fontSize: '13px', fontWeight: 600 }}
                  value={serviceVerifFilter}
                  onChange={(e) => setServiceVerifFilter(e.target.value)}
                >
                  <option value="ALL">All License Statuses</option>
                  <option value="VERIFIED">Verified Licenses Only</option>
                  <option value="PENDING">Pending Audit Only</option>
                </select>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Doctor / Facility</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Category &amp; License</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Specialization</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Slot Fee (৳)</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>License Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((v) => {
                      const isVerified = v.isVerified !== false;

                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={v.photo || 'assets/images/Pet_1.jpg'}
                                alt={v.name}
                                style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }}
                                onError={(e) => { e.currentTarget.src = 'assets/images/Pet_1.jpg'; }}
                              />
                              <div>
                                <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{v.name}</strong>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.clinic}</span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-alt)', textTransform: 'uppercase', display: 'inline-block', marginBottom: '2px' }}>
                              {v.tag || 'Veterinarian'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontFamily: 'monospace' }}>
                              {v.licenseNumber || 'BMDC-VET-8891'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 10px', color: 'var(--text-main)', fontSize: '13px' }}>
                            {v.qualification}
                          </td>

                          <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {v.price ? (v.price.startsWith('৳') ? v.price : `৳${v.price}`) : '৳400/visit'}
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <button
                              onClick={() => handleToggleServiceLicense(v)}
                              style={{
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: isVerified ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                                color: isVerified ? '#10B981' : '#F59E0B',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {isVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              <span>{isVerified ? 'Verified' : 'Pending'}</span>
                            </button>
                          </td>

                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                className="icon-btn"
                                style={{ width: 32, height: 32, color: 'var(--primary)' }}
                                onClick={() => handleOpenEditService(v)}
                                title="Edit Service"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="icon-btn"
                                style={{ width: 32, height: 32, color: '#EF4444' }}
                                onClick={() => handleDeleteService(v.id, v.name)}
                                title="Remove Service"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 5: 📝 BLOG & CONTENT MODERATION (blogs)
            ══════════════════════════════════════════════════════ */}
        {(adminTab === 'overview' || adminTab === 'blogs') && (
          <div id="section-blogs" className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px', border: '1px solid var(--border)', scrollMarginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#0D9488', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  ● CLINICAL EDITORIAL &amp; COMMUNITY DISPATCHES
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-main)' }}>
                  <BookOpen size={18} color="var(--primary)" />
                  <span>Educational Dispatches &amp; Article Moderation</span>
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Approve user-submitted articles so they appear live across the web and mobile app feeds.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-alt)', padding: '4px', borderRadius: '12px' }}>
                <button
                  onClick={() => setBlogFilter('ALL')}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: blogFilter === 'ALL' ? 'var(--primary)' : 'transparent',
                    color: blogFilter === 'ALL' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  All ({blogs.length > 0 ? blogs.length : 18})
                </button>
                <button
                  onClick={() => setBlogFilter('PENDING')}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: blogFilter === 'PENDING' ? '#F59E0B' : 'transparent',
                    color: blogFilter === 'PENDING' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  Pending ({pendingBlogs.length > 0 ? pendingBlogs.length : 2})
                </button>
                <button
                  onClick={() => setBlogFilter('APPROVED')}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: blogFilter === 'APPROVED' ? '#10B981' : 'transparent',
                    color: blogFilter === 'APPROVED' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  Approved ({approvedBlogs.length > 0 ? approvedBlogs.length : 16})
                </button>
              </div>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-clean"
                placeholder="Search articles by title, author, or category..."
                value={blogSearch}
                onChange={(e) => setBlogSearch(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>

            {/* Display Articles (filtered or rich clinical defaults if database not yet populated) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(filteredBlogs.length > 0 ? filteredBlogs : [
                {
                  id: 'article_ref_1',
                  title: 'Post-Monsoon Canine Skin Infections & Prevention Protocols',
                  authorName: 'Dr. Farhana Yasmin',
                  category: 'DOG HEALTH',
                  isApproved: false,
                  status: 'PENDING',
                  timestamp: Date.now() - 7200000,
                  imageUrl: 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800',
                  content: 'Comprehensive clinical guide on addressing fungal and bacterial dermatitis in humid sub-tropical conditions.'
                },
                {
                  id: 'article_ref_2',
                  title: 'Raw Food Diet for Persian Cats: Clinical Pros & Cons',
                  authorName: 'Dr. Imtiaz Ahmed',
                  category: 'FELINE NUTRITION',
                  isApproved: true,
                  status: 'APPROVED',
                  timestamp: Date.now() - 86400000,
                  imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
                  content: 'Veterinary nutritional breakdown of raw meats versus micronutrient-balanced wet food formulations.'
                }
              ]).map((article) => {
                const isApproved = article.isApproved === true || article.status === 'APPROVED';
                const isExpanded = expandedBlogId === article.id;

                return (
                  <div
                    key={article.id}
                    style={{
                      background: 'var(--surface-alt)',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img
                          src={article.imageUrl || 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800'}
                          alt={article.title}
                          style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800';
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '6px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                              {article.category || 'HEALTH'}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '6px', background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isApproved ? '#10B981' : '#F59E0B' }}>
                              {isApproved ? '● LIVE ON FEED' : '⏳ PENDING REVIEW'}
                            </span>
                          </div>

                          <strong style={{ fontSize: '14.5px', display: 'block', color: 'var(--text-main)' }}>
                            {article.title}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            By {article.authorName || 'Pet Maya Author'} • {formatBlogDate(article.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isApproved && (
                          <button
                            className="apple-btn-blue"
                            style={{ padding: '6px 14px', fontSize: '12px', background: '#10B981' }}
                            onClick={() => handleApproveBlog(article.id, article.title)}
                          >
                            <Check size={14} />
                            <span>Approve &amp; Publish</span>
                          </button>
                        )}

                        {isApproved && (
                          <button
                            className="btn-ghost"
                            style={{ padding: '6px 12px', fontSize: '12px', color: '#F59E0B' }}
                            onClick={() => handleRejectBlog(article.id, article.title)}
                          >
                            <X size={14} />
                            <span>Unpublish</span>
                          </button>
                        )}

                        <button
                          className="btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => setExpandedBlogId(isExpanded ? null : article.id)}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{isExpanded ? 'Hide' : 'Read'}</span>
                        </button>

                        <button
                          className="icon-btn"
                          style={{ width: 32, height: 32, color: '#EF4444' }}
                          onClick={() => handleDeleteBlog(article.id, article.title)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '8px', padding: '14px 18px', background: 'var(--surface)', borderRadius: '12px', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-main)', maxHeight: '300px', overflowY: 'auto' }}>
                        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{article.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 6: 📢 SYSTEM BROADCASTS & GLOBAL BANNER (broadcasts)
            ══════════════════════════════════════════════════════ */}
        {(adminTab === 'overview' || adminTab === 'broadcasts') && (
          <div id="section-broadcasts" style={{ display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '24px' }}>

            {/* Global Banner Card */}
            <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#0D9488', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    ● SYSTEM BROADCASTS &amp; GLOBAL BANNER COMMAND DECK
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-main)' }}>
                    <AlertTriangle size={18} color="var(--primary)" />
                    <span>System Broadcasts &amp; Global Banner Command Deck</span>
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Controls the prominent announcement banner displayed across the top header of all website pages.
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={bannerConfig.isActive}
                    onChange={(e) => setBannerConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  {bannerConfig.isActive ? <span style={{ color: '#10B981' }}>Active Live</span> : <span style={{ color: 'var(--text-muted)' }}>Hidden</span>}
                </label>
              </div>

              {/* Visual Banner Preview Pill (Matches Reference UI) */}
              <div style={{
                background: bannerConfig.bgColor || '#0F4C44',
                color: bannerConfig.textColor || '#FFFFFF',
                borderRadius: '14px',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                  <span>{bannerConfig.text || 'WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE WITH EVERY BESPOKE WELLNESS PLAN.'}</span>
                </div>
                <button
                  type="button"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  Learn More &rarr;
                </button>
              </div>

              <form onSubmit={handleUpdateBanner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label-mini" style={{ marginBottom: '6px', display: 'block' }}>Promotional Headline / Text Prompt *</label>
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="e.g. WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE..."
                    value={bannerConfig.text}
                    onChange={(e) => setBannerConfig(prev => ({ ...prev, text: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Banner Accent Theme:</span>
                    {[
                      { bg: '#0F4C44', label: 'Teal' },
                      { bg: '#0F172A', label: 'Navy' },
                      { bg: '#6D28D9', label: 'Purple' },
                      { bg: '#92400E', label: 'Amber' },
                      { bg: '#991B1B', label: 'Crimson' }
                    ].map((theme) => (
                      <button
                        type="button"
                        key={theme.bg}
                        onClick={() => setBannerConfig(prev => ({ ...prev, bgColor: theme.bg, textColor: '#FFFFFF' }))}
                        title={theme.label}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: theme.bg,
                          border: bannerConfig.bgColor === theme.bg ? '2.5px solid var(--primary)' : '2px solid rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setBannerConfig({
                        isActive: true,
                        text: 'WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE WITH EVERY BESPOKE WELLNESS PLAN.',
                        bgColor: '#0F4C44',
                        textColor: '#FFFFFF',
                        linkText: 'Learn More',
                        linkUrl: '#'
                      })}
                      className="btn-ghost"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      Reset to Standard
                    </button>
                    <button type="submit" className="apple-btn-blue" style={{ padding: '8px 20px', background: '#0D9488', fontSize: '12.5px' }}>
                      <CheckCircle2 size={14} />
                      <span>Save &amp; Broadcast Live</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Instant Push Messenger Card */}
            <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Radio size={18} color="var(--primary)" />
                <span>System Push Broadcast Messenger</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Dispatch instant push alerts across web browsers and native mobile applications.
              </p>

              <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="Broadcast Title (e.g. Parasite Season Advisory, Vaccination Drive)..."
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                  <select
                    className="input-clean"
                    style={{ width: 'auto', fontWeight: 600 }}
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                  >
                    <option value="all">Broadcast to All Users</option>
                    <option value="owners">Pet Owners Only</option>
                    <option value="vets">Clinicians Only</option>
                  </select>
                </div>

                <textarea
                  className="input-clean"
                  rows={2}
                  placeholder="Enter broadcast message content..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  style={{ resize: 'vertical' }}
                />

                <button type="submit" className="apple-btn-blue" style={{ alignSelf: 'flex-start', padding: '9px 22px', background: 'var(--primary)' }}>
                  <Send size={14} />
                  <span>Send Broadcast Now</span>
                </button>
              </form>

              <div style={{ marginTop: '24px' }}>
                <span className="label-mini">Recent Broadcast Log ({broadcasts.length})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {broadcasts.map(b => (
                    <div key={b.id || b.timestamp} style={{ background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{b.title}</strong>
                        <span className="badge badge-green" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{b.target} • {b.date || 'Recent'}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>{b.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 7: 🗺️ LIVE OPERATIONS HUD & COLLAR MESH (hud)
            ══════════════════════════════════════════════════════ */}
        {adminTab === 'hud' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>● LIVE GPS SATELLITE MESH</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-main)' }}>Real-Time Geofence &amp; Collar Telemetry</h3>
                </div>
                <button onClick={handlePingMesh} disabled={isPingingMesh} className="apple-btn-blue" style={{ background: 'var(--primary)', padding: '8px 16px', fontSize: '12.5px' }}>
                  <Radio size={14} className={isPingingMesh ? 'pulse-beacon' : ''} />
                  <span>Sync 1,842 Collar Nodes</span>
                </button>
              </div>

              {/* Simulated Visual Radar Stream */}
              <div style={{
                background: 'linear-gradient(180deg, #091512 0%, #0F231E 100%)',
                borderRadius: '16px',
                padding: '24px',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} className="pulse-beacon" />
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em' }}>DHAKA SANCTUARY MESH • 4 NODES INSPECTED</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#10B981', fontFamily: 'monospace' }}>LATENCY: 12ms</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', zIndex: 2, margin: '20px 0' }}>
                  {iotNodes.map(node => (
                    <div key={node.id} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', padding: '12px 14px', borderRadius: '12px', border: node.status === 'PERIMETER_ALERT' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: node.status === 'PERIMETER_ALERT' ? '#EF4444' : '#FFFFFF' }}>{node.petName} ({node.breed})</span>
                        <span style={{ fontSize: '10px', background: node.status === 'PERIMETER_ALERT' ? '#EF4444' : '#10B981', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{node.battery}%</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#A3A8A4' }}>Guardian: {node.guardian}</div>
                      <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>Heart Rate: {node.heartRate} bpm • Temp {node.temp}</div>
                      <div style={{ fontSize: '10.5px', color: node.status === 'PERIMETER_ALERT' ? '#EF4444' : '#A3A8A4', marginTop: '4px' }}>Zone: {node.zone}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#A3A8A4', zIndex: 2 }}>
                  <span>ISO 11784 RFID Microchips • Sub-dermal sync enabled</span>
                  <button onClick={() => setAdminTab('amber')} style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>
                    View Active Amber Alerts →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 8: 💰 FINANCIAL & ESCROW TERMINAL (finance)
            ══════════════════════════════════════════════════════ */}
        {adminTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span className="label-mini">Gross Settled Revenue</span>
                <strong style={{ fontSize: '30px', fontWeight: 800, marginTop: '4px', color: '#10B981', display: 'block' }}>
                  ৳{Math.round(totalRevenue).toLocaleString()}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From {ordersList.length} completed transactions</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span className="label-mini">Cold-Chain Escrow Vault</span>
                <strong style={{ fontSize: '30px', fontWeight: 800, marginTop: '4px', color: 'var(--primary)', display: 'block' }}>
                  ৳{Math.round(totalRevenue * 0.18).toLocaleString()}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Locked until thermal delivery receipt</span>
              </div>

              <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', border: '1px solid var(--border)' }}>
                <span className="label-mini">Clinical Payout Ledger</span>
                <strong style={{ fontSize: '30px', fontWeight: 800, marginTop: '4px', color: '#8B5CF6', display: 'block' }}>
                  ৳{Math.round(verifiedServicesCount * 12400).toLocaleString()}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Disbursed to {verifiedServicesCount} verified doctors</span>
              </div>
            </div>

            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Transaction Escrow Ledger</h3>
                <button
                  onClick={() => showToast('📥 Financial settlement statement generated as CSV!', 'success')}
                  className="btn-ghost"
                  style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Export Settlement Audit
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px', fontWeight: 600 }}>Reference</th>
                      <th style={{ padding: '10px', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '10px', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '10px', fontWeight: 600 }}>Escrow Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.slice(0, 8).map((o, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{o.id || o.orderId || `TX-${1000 + idx}`}</td>
                        <td style={{ padding: '12px 10px' }}>E-Commerce Cold-Chain Order</td>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: '#10B981' }}>৳{Number(o.total || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Settled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 9: 🚨 AMBER ALERT FIELD EMERGENCY DESK (amber)
            ══════════════════════════════════════════════════════ */}
        {adminTab === 'amber' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', border: '1px solid #FECACA', background: 'rgba(239, 68, 68, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} className="pulse-beacon" />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#B91C1C' }}>ACTIVE EMERGENCY AMBER RESCUE DESK</h3>
                </div>
                <span style={{ background: '#FEE2E2', color: '#EF4444', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  PRIORITY 1 ESCALATION
                </span>
              </div>

              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200" alt="" style={{ width: 72, height: 72, borderRadius: '16px', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Luna • Calico Feline (ISO Chip #981020003412001)</h4>
                  <div style={{ fontSize: '12.5px', color: '#EF4444', fontWeight: 600 }}>Last pinged 45m ago near Gulshan 2 Lake Walk</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Guardian: Nafisa Rahman • Emergency Contact: +880 1711-000000</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Perimeter Guardians Notified</div>
                  <strong style={{ fontSize: '20px', color: 'var(--text-main)' }}>14 Active</strong>
                </div>
                <div style={{ background: 'var(--surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Search Perimeter Radius</div>
                  <strong style={{ fontSize: '20px', color: '#EF4444' }}>1.5 km Geofence</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => showToast('🚨 Emergency Geofenced Push broadcast dispatched to 14 guardians around Gulshan 2!', 'success')}
                  style={{ background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Radio size={14} /> Dispatch Geofenced Guardian Alert
                </button>
                <button
                  onClick={() => showToast('✅ Emergency Amber Alert successfully marked as RESOLVED.', 'success')}
                  className="btn-ghost"
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  Mark Case as Rescued
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════
          MODAL 1: ADD / EDIT PRODUCT SKU
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddProductModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsAddProductModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                maxWidth: '500px',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                padding: '28px',
                textAlign: 'left',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {editingProduct ? 'EDIT FORMULARY SKU' : 'NEW FORMULARY SKU'}
                </h2>
                <button className="icon-btn" onClick={() => setIsAddProductModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="label-mini">PRODUCT GALLERY &amp; IMAGE</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '14px',
                        border: '2px dashed var(--primary)',
                        background: productFormData.image ? `url("${productFormData.image}") center/cover no-repeat` : 'var(--surface-alt)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Upload photo"
                    >
                      {!productFormData.image && (
                        <>
                          <Upload size={18} color="var(--primary)" />
                          <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>UPLOAD</span>
                        </>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Preset Images:</span>
                      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {PRESET_IMAGES.map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setProductFormData(prev => ({ ...prev, image: preset.url }))}
                            style={{
                              border: productFormData.image === preset.url ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                              background: 'var(--surface-alt)',
                              color: 'var(--text-main)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-mini">PRODUCT TITLE *</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="Enter product title..."
                    value={productFormData.name}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label-mini">PRICE (৳ BDT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      className="input-clean"
                      placeholder="e.g. 1250"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label-mini">INVENTORY STOCK *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="input-clean"
                      placeholder="e.g. 100"
                      value={productFormData.stockCount}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, stockCount: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label-mini">BRAND *</label>
                    <input
                      type="text"
                      className="input-clean"
                      placeholder="e.g. Royal Canin"
                      value={productFormData.brand}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, brand: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label-mini">CATEGORY *</label>
                    <select
                      className="input-clean"
                      value={productFormData.category}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="food">Food &amp; Nutrition</option>
                      <option value="toys">Toys &amp; Play</option>
                      <option value="health">Health &amp; Pharma</option>
                      <option value="gear">Gear &amp; Tech</option>
                      <option value="grooming">Grooming &amp; Spa</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12.5px' }}>
                    <span>In-Stock Active</span>
                    <input
                      type="checkbox"
                      checked={productFormData.inStock}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12.5px' }}>
                    <span style={{ color: '#8B5CF6', fontWeight: 600 }}>Rx Prescription</span>
                    <input
                      type="checkbox"
                      checked={productFormData.isRx}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, isRx: e.target.checked }))}
                      style={{ accentColor: '#8B5CF6' }}
                    />
                  </label>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="label-mini" style={{ margin: 0 }}>SHORT DESCRIPTION (CARD SYNOPSIS) *</label>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Shown on catalog &amp; homepage cards</span>
                  </div>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="e.g. Monthly oral chewable prophylaxis against heartworm & ticks."
                    value={productFormData.shortDescription}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="label-mini" style={{ margin: 0 }}>LONG DESCRIPTION (CLINICAL MONOGRAPH &amp; DOSAGE) *</label>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Shown on product detail page</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    className="input-clean"
                    placeholder="Enter complete indications, active molecules, administration dosage, storage temperature, dietary profile, and precautions..."
                    value={productFormData.longDescription}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, longDescription: e.target.value, description: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: isSubmittingProduct ? 'wait' : 'pointer',
                    marginTop: '6px'
                  }}
                >
                  {isSubmittingProduct ? 'Saving SKU...' : (editingProduct ? 'Update SKU' : 'Publish SKU to Catalog')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MODAL 2: ADD / EDIT SPECIALIST CLINICIAN
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddServiceModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setIsAddServiceModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                maxWidth: '500px',
                background: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '28px',
                textAlign: 'left',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {editingService ? 'Edit Service Provider' : 'Add Clinical Specialist'}
                </h2>
                <button className="icon-btn" onClick={() => setIsAddServiceModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="label-mini">Doctor or Facility Name *</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="e.g. Dr. Emily Vance"
                    value={serviceFormData.name}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label-mini">Category *</label>
                    <select
                      className="input-clean"
                      value={serviceFormData.tag}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, tag: e.target.value }))}
                    >
                      <option value="Veterinarian">Veterinarian</option>
                      <option value="Grooming Spa">Grooming Spa</option>
                      <option value="Boarding Resort">Boarding Resort</option>
                      <option value="Diagnostic Lab">Diagnostic Lab</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-mini">BMDC License Number *</label>
                    <input
                      type="text"
                      required
                      className="input-clean"
                      placeholder="e.g. BMDC-VET-88492"
                      value={serviceFormData.licenseNumber}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label-mini">Clinic / Hospital</label>
                    <input
                      type="text"
                      className="input-clean"
                      placeholder="e.g. Pet Maya Care Center"
                      value={serviceFormData.clinic}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, clinic: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label-mini">Slot Fee (৳ BDT) *</label>
                    <input
                      type="number"
                      required
                      className="input-clean"
                      placeholder="e.g. 450"
                      value={serviceFormData.price}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-mini">Specialization &amp; Degrees</label>
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="e.g. DVM, MRCVS • Small Animal Medicine"
                    value={serviceFormData.qualification}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12.5px' }}>
                    <span style={{ fontWeight: 600, color: '#10B981' }}>License Verified</span>
                    <input
                      type="checkbox"
                      checked={serviceFormData.isVerified}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12.5px' }}>
                    <span style={{ fontWeight: 600, color: '#EF4444' }}>24/7 Emergency</span>
                    <input
                      type="checkbox"
                      checked={serviceFormData.isEmergencyOnCall}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, isEmergencyOnCall: e.target.checked }))}
                    />
                  </label>
                </div>

                <button type="submit" className="apple-btn-blue" style={{ width: '100%', padding: '12px', background: 'var(--primary)', justifyContent: 'center' }}>
                  <CheckCircle2 size={15} />
                  <span>{editingService ? 'Save Service Updates' : 'Publish Service Listing'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MODAL 3: ADD / INVITE USER
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setIsAddUserModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{
                width: '100%',
                maxWidth: '460px',
                background: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '28px',
                textAlign: 'left'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Register / Invite User</h2>
                <button className="icon-btn" onClick={() => setIsAddUserModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveNewUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="label-mini">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="e.g. Sadik Mahmud"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="label-mini">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="input-clean"
                    placeholder="e.g. user@petmaya.app"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label-mini">Role *</label>
                    <select
                      className="input-clean"
                      value={userFormData.role}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="Pet Owner">Pet Owner</option>
                      <option value="Veterinarian">Veterinarian</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-mini">Phone</label>
                    <input
                      type="text"
                      className="input-clean"
                      placeholder="+880 1700-000000"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <button type="submit" className="apple-btn-blue" style={{ width: '100%', padding: '12px', background: 'var(--primary)', justifyContent: 'center' }}>
                  <CheckCircle2 size={15} />
                  <span>Create User Account</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MODAL 4: INSPECT USER PROFILE DETAILS
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedUserDetails && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedUserDetails(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '28px',
                textAlign: 'left'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>User Dossier &amp; KYC</h2>
                <button className="icon-btn" onClick={() => setSelectedUserDetails(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--surface-alt)', padding: '14px', borderRadius: '16px', marginBottom: '16px' }}>
                <UserAvatar user={selectedUserDetails} size={54} />
                <div>
                  <strong style={{ fontSize: '16px', color: 'var(--text-main)', display: 'block' }}>{selectedUserDetails.name}</strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{selectedUserDetails.email}</span>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                    UID: {selectedUserDetails.id}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: '10px' }}>
                  <span className="label-mini">KYC Status</span>
                  <strong style={{ display: 'block', color: selectedUserDetails.isVerified ? '#10B981' : '#F59E0B', fontSize: '12.5px' }}>
                    {selectedUserDetails.isVerified ? 'VERIFIED PROFILE' : 'PENDING REVIEW'}
                  </strong>
                </div>

                <div style={{ background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: '10px' }}>
                  <span className="label-mini">Account State</span>
                  <strong style={{ display: 'block', color: selectedUserDetails.accountStatus === 'SUSPENDED' ? '#EF4444' : '#10B981', fontSize: '12.5px' }}>
                    {selectedUserDetails.accountStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <button
                  className="apple-btn-blue"
                  style={{ width: '100%', justifyContent: 'center', background: selectedUserDetails.isVerified ? '#F59E0B' : '#10B981' }}
                  onClick={() => handleToggleUserVerification(selectedUserDetails)}
                >
                  <BadgeCheck size={15} />
                  <span>{selectedUserDetails.isVerified ? 'Revoke KYC Verification' : 'Verify KYC Identity'}</span>
                </button>

                <button
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', color: selectedUserDetails.accountStatus === 'SUSPENDED' ? '#10B981' : '#EF4444' }}
                  onClick={() => handleToggleUserStatus(selectedUserDetails)}
                >
                  {selectedUserDetails.accountStatus === 'SUSPENDED' ? <UserCheck size={15} /> : <UserX size={15} />}
                  <span>{selectedUserDetails.accountStatus === 'SUSPENDED' ? 'Reactivate User' : 'Suspend User'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MODAL 5: INSPECT DISPATCH MANIFEST (ORDER DETAILS)
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedOrderDetails(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '28px',
                textAlign: 'left',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Dispatch Manifest</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', fontFamily: 'monospace' }}>
                    {selectedOrderDetails.id || selectedOrderDetails.orderId}
                  </h2>
                </div>
                <button className="icon-btn" onClick={() => setSelectedOrderDetails(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="label-mini">Status</span>
                  <div style={{ marginTop: '2px' }}>{getOrderStatusBadge(selectedOrderDetails.status)}</div>
                </div>

                <select
                  className="input-clean"
                  style={{ padding: '6px 10px', fontSize: '12.5px', fontWeight: 600, width: 'auto' }}
                  value={selectedOrderDetails.status || 'In Preparation'}
                  onChange={(e) => handleUpdateStatus(selectedOrderDetails.id || selectedOrderDetails.orderId, e.target.value)}
                >
                  <option value="In Preparation">In Preparation</option>
                  <option value="Shipped">Shipped / In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span className="label-mini">Delivery Destination</span>
                <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px', marginTop: '4px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span>{selectedOrderDetails.deliveryAddress || selectedOrderDetails.address || 'Dhaka, Bangladesh'}</span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Client: {selectedOrderDetails.userId || 'Guest Client'} • Date: {selectedOrderDetails.date || 'Today'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span className="label-mini">Items Ordered ({selectedOrderDetails.items?.length || 0})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  {(selectedOrderDetails.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}>
                      <div>
                        <strong>{item.name}</strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>Qty: {item.qty || 1} × ৳{Number(item.price || 0).toFixed(2)}</span>
                      </div>
                      <strong>৳{((item.qty || 1) * (item.price || 0)).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Total Paid:</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>৳{Number(selectedOrderDetails.total || 0).toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button
                  className="btn-destructive"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                  onClick={() => handleDeleteOrder(selectedOrderDetails.id || selectedOrderDetails.orderId)}
                >
                  <Trash2 size={13} />
                  <span>Delete Order</span>
                </button>

                <button
                  className="apple-btn-blue"
                  onClick={() => setSelectedOrderDetails(null)}
                  style={{ padding: '8px 20px', fontSize: '13px', background: 'var(--primary)' }}
                >
                  <span>Close Window</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
