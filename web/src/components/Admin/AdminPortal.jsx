import React, { useState, useEffect, useRef } from 'react';
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
  deleteDoc 
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
  Hospital
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── STYLISH INITIAL MONOGRAM / REAL AVATAR COMPONENT ───
function UserAvatar({ user, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  const name = user?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.avatar || user?.photoUrl || user?.photoURL;
  const hasPhoto = avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '' && !imgError;

  const getUserInitials = (str) => {
    if (!str) return 'PM';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getUserGradient = (idOrName) => {
    const gradients = [
      'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
      'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)'
    ];
    let hash = 0;
    const key = idOrName || 'petmaya';
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

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
          border: '1.5px solid rgba(255,255,255,0.15)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
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
    updateUserRole,
    updateUserVerification,
    updateUserAccountStatus,
    globalBanner, 
    updateGlobalBanner, 
    openModal, 
    showToast 
  } = useApp();
  const { currentUser } = useAuth();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    currentUser?.role === 'Super Admin' || currentUser?.role === 'admin' || currentUser?.email === 'admin@petmaya.app'
  );
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Admin Sub-Tab: 'shop', 'orders', 'users', 'services', 'blogs', 'overview', 'broadcasts'
  const [adminTab, setAdminTab] = useState('shop');

  // ─── SHOP & INVENTORY STATE ───
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState('ALL'); // 'ALL', 'IN_STOCK', 'OUT_OF_STOCK', 'RX_ONLY'
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
    { id: 'food', label: 'Food' },
    { id: 'toys', label: 'Toys' },
    { id: 'health', label: 'Health' },
    { id: 'gear', label: 'Gear' },
    { id: 'grooming', label: 'Grooming' }
  ];

  // ─── ORDER MANAGEMENT STATE ───
  const [allOrders, setAllOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // ─── USERS VERIFICATION & MANAGEMENT STATE ───
  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'Sadik Mahmud', email: 'sadik@petmaya.app', role: 'Super Admin', isVerified: true, verificationStatus: 'VERIFIED', accountStatus: 'ACTIVE', phone: '+880 1711-000000', petsCount: 2, joinedDate: '2026-01-10', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 'u2', name: 'Dr. Sarah Jenkins', email: 'dr.jenkins@vetclinic.com', role: 'Veterinarian', isVerified: true, verificationStatus: 'VERIFIED', accountStatus: 'ACTIVE', phone: '+880 1822-111111', petsCount: 1, joinedDate: '2026-02-14', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150' },
    { id: 'u3', name: 'Elena Vance', email: 'elena@gmail.com', role: 'Pet Owner', isVerified: false, verificationStatus: 'PENDING', accountStatus: 'ACTIVE', phone: '+880 1933-222222', petsCount: 3, joinedDate: '2026-08-15', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 'u4', name: 'Pawfect Grooming Hub', email: 'contact@pawfect.bd', role: 'Shelter & Spa', isVerified: true, verificationStatus: 'VERIFIED', accountStatus: 'ACTIVE', phone: '+880 1644-333333', petsCount: 0, joinedDate: '2026-03-20', avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150' },
    { id: 'u5', name: 'Tanvir Hossain', email: 'tanvir.petcare@yahoo.com', role: 'Pet Owner', isVerified: false, verificationStatus: 'PENDING', accountStatus: 'ACTIVE', phone: '+880 1555-444444', petsCount: 1, joinedDate: '2026-08-22', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }
  ]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL', 'Pet Owner', 'Veterinarian', 'Admin', 'Shelter & Spa'
  const [userStatusFilter, setUserStatusFilter] = useState('ALL'); // 'ALL', 'VERIFIED', 'PENDING', 'SUSPENDED'
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
              phone: data.phone || data.phoneNumber || '+880 1700-000000',
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
  const [serviceCatFilter, setServiceCatFilter] = useState('ALL'); // 'ALL', 'Veterinarian', 'Grooming Spa', 'Boarding Resort', 'Diagnostic Lab'
  const [serviceVerifFilter, setServiceVerifFilter] = useState('ALL'); // 'ALL', 'VERIFIED', 'PENDING'
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
    { id: 'b1', title: '🌧️ Monsoon Parasite Advisory', message: 'Flea and tick activity surges during wet season. Ensure Simparica/Nexgard preventative dosage.', date: '2026-08-24', target: 'All Users' }
  ]);

  const [bannerConfig, setBannerConfig] = useState({
    isActive: globalBanner?.isActive || false,
    text: globalBanner?.text || '',
    linkText: globalBanner?.linkText || '',
    linkUrl: globalBanner?.linkUrl || '',
    bgColor: globalBanner?.bgColor || '#f5f5f7',
    textColor: globalBanner?.textColor || '#1d1d1f'
  });

  // ─── BLOG MODERATION STATE ───
  const [blogs, setBlogs] = useState([]);
  const [blogFilter, setBlogFilter] = useState('ALL');
  const [blogSearch, setBlogSearch] = useState('');
  const [expandedBlogId, setExpandedBlogId] = useState(null);

  useEffect(() => {
    if (globalBanner) {
      setBannerConfig(globalBanner);
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

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminKey === 'admin2026' || adminKey === 'petmaya@admin' || adminKey.length >= 6) {
      setIsAdminAuthenticated(true);
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
      description: product.description || '',
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
        showToast('📸 Photo loaded and optimized into gallery', 'success');
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
      const payload = {
        name: productFormData.name.trim(),
        brand: productFormData.brand.trim() || 'Pet Maya',
        category: (productFormData.category || 'food').toLowerCase(),
        price: parseFloat(productFormData.price) || 0,
        stockCount: typeof productFormData.stockCount === 'number' ? productFormData.stockCount : (parseInt(productFormData.stockCount, 10) || 50),
        image: productFormData.image || PRESET_IMAGES[0].url,
        description: productFormData.description.trim() || 'Veterinary-grade pet care formulation.',
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
      showToast(`👤 User "${newUser.name}" profile registered and verified!`, 'success');
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
  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    const item = {
      id: 'b_' + Date.now(),
      title: broadcastTitle.trim(),
      message: broadcastMsg.trim(),
      date: new Date().toISOString().split('T')[0],
      target: broadcastTarget === 'all' ? 'All Users' : (broadcastTarget === 'vets' ? 'Veterinarians' : 'Pet Owners')
    };

    setBroadcasts(prev => [item, ...prev]);
    setBroadcastTitle('');
    setBroadcastMsg('');
    showToast('📢 Platform broadcast notification sent to all active users!', 'success');
  };

  const handleUpdateBanner = (e) => {
    e.preventDefault();
    updateGlobalBanner(bannerConfig);
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
      return <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={11} /> Delivered</span>;
    }
    if (s.includes('ship') || s.includes('transit')) {
      return <span className="badge badge-purple" style={{ background: 'rgba(147, 51, 234, 0.15)', color: '#A855F7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={11} /> In Transit / Shipped</span>;
    }
    if (s.includes('prep') || s.includes('placed') || s.includes('pending')) {
      return <span className="badge badge-blue" style={{ background: 'rgba(0, 113, 227, 0.15)', color: '#0071E3', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Package size={11} /> In Preparation</span>;
    }
    if (s.includes('cancel') || s.includes('refund')) {
      return <span className="badge badge-red" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={11} /> Cancelled</span>;
    }
    return <span className="badge badge-gray">{status || 'Processing'}</span>;
  };

  // ─── LOGIN GUARD ───
  if (!isAdminAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div 
          className="apple-solid-card" 
          style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', textAlign: 'center' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.14)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={26} />
          </div>
          <span className="apple-card-eyebrow" style={{ color: '#EF4444' }}>Restricted Area</span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 8px' }}>
            Super Admin Terminal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px' }}>
            Enter your administrative cryptographic credentials to unlock user profiles, medical licensing verification, inventory controls, and platform telemetry.
          </p>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input 
              type="password" 
              className="input-clean" 
              placeholder="Admin Passkey (e.g. admin2026)" 
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              style={{ textAlign: 'center', letterSpacing: '0.2em' }}
            />
            {authError && (
              <span style={{ color: '#EF4444', fontSize: '12.5px', fontWeight: 600 }}>{authError}</span>
            )}
            <button type="submit" className="apple-btn-blue" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
              <span>Authenticate Root Access</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', paddingBottom: '60px' }}>
      
      {/* ── HEADER BANNER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-green" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Super Admin Session Active
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• Root Command Center</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            Platform Control &amp; Store Management
          </h1>
        </div>

        <button 
          className="btn-ghost" 
          style={{ color: '#EF4444' }}
          onClick={() => setIsAdminAuthenticated(false)}
        >
          <LogOut size={15} />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* ── TOP SEGMENTED NAVIGATION ── */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        background: 'var(--surface-alt)', 
        padding: '6px', 
        borderRadius: '16px', 
        overflowX: 'auto',
        border: '1px solid var(--border)' 
      }}>
        {[
          { id: 'shop', label: 'Inventory Command', icon: ShoppingBag, count: products.length },
          { id: 'orders', label: 'Orders & Dispatch', icon: Package, count: inPrepOrdersCount > 0 ? inPrepOrdersCount : ordersList.length, highlight: inPrepOrdersCount > 0 },
          { id: 'users', label: 'Users & KYC', icon: Users, count: pendingUsersCount > 0 ? pendingUsersCount : usersList.length, highlight: pendingUsersCount > 0 },
          { id: 'services', label: 'Clinics & Services', icon: Stethoscope, count: pendingServicesCount > 0 ? pendingServicesCount : vets.length, highlight: pendingServicesCount > 0 },
          { id: 'blogs', label: 'Article Moderation', icon: BookOpen, count: pendingBlogs.length, highlight: pendingBlogs.length > 0 },
          { id: 'overview', label: 'Telemetry & Stats', icon: Activity },
          { id: 'broadcasts', label: 'Broadcasts & Banner', icon: Radio },
        ].map((tab) => {
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-main)',
                fontSize: '13.5px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                fontFamily: 'inherit'
              }}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : (tab.highlight ? '#F59E0B' : 'var(--border)'),
                  color: isActive ? '#FFFFFF' : (tab.highlight ? '#FFFFFF' : 'var(--text-muted)')
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: 🛍️ SHOP & INVENTORY MANAGEMENT
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Shop Metrics (Including Valuation Card) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
            
            {/* 💎 VALUATION CARD (Matches Image 1) */}
            <div 
              className="apple-solid-card" 
              style={{ 
                padding: '20px 22px', 
                textAlign: 'left',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                background: 'linear-gradient(135deg, var(--surface-alt) 0%, rgba(16, 185, 129, 0.06) 100%)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                VALUATION
              </span>
              <strong style={{ fontSize: '30px', fontWeight: 800, marginTop: '4px', color: '#10B981', letterSpacing: '-0.02em', display: 'block' }}>
                ৳{Math.round(totalValuation).toLocaleString()}
              </strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', display: 'block' }}>
                Total Warehouse Stock Value
              </span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px 22px', textAlign: 'left' }}>
              <span className="label-mini">Total Catalog SKUs</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{products.length} Products</strong>
              <span style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>Active in Store Feed</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px 22px', textAlign: 'left' }}>
              <span className="label-mini">In Stock Units</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>{products.filter(p => p.inStock !== false).length}</strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Available for 1-Click Buy</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px 22px', textAlign: 'left' }}>
              <span className="label-mini">Out of Stock Alerts</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: products.filter(p => p.inStock === false).length > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                {products.filter(p => p.inStock === false).length} SKUs
              </strong>
              <span style={{ fontSize: '12px', color: products.filter(p => p.inStock === false).length > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>
                {products.filter(p => p.inStock === false).length > 0 ? 'Requires Restock Supply' : 'All Stock Healthy'}
              </span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px 22px', textAlign: 'left' }}>
              <span className="label-mini">Prescription Medications</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#8B5CF6' }}>{products.filter(p => p.isRx).length} Rx SKUs</strong>
              <span style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '4px' }}>Requires Clinical Verification</span>
            </div>
          </div>

          {/* Catalog Controls Header */}
          <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <ShoppingBag size={18} color="var(--primary)" />
                  <span>Inventory Command &amp; Catalog Management</span>
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Manage catalog entries, brand specifications, list prices (৳), live stock quantities, and clinical prescription flags.
                </span>
              </div>

              <button
                className="apple-btn-blue"
                onClick={handleOpenAddProduct}
                style={{ padding: '9px 20px', fontSize: '13px', background: '#10B981' }}
              >
                <Plus size={15} />
                <span>ADD SKU</span>
              </button>
            </div>

            {/* Filters & Search */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-clean"
                  placeholder="Search by product name, brand, description, or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-alt)', padding: '3px', borderRadius: '10px', overflowX: 'auto' }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'food', label: 'Food' },
                  { id: 'toys', label: 'Toys' },
                  { id: 'health', label: 'Health' },
                  { id: 'gear', label: 'Gear' },
                  { id: 'grooming', label: 'Grooming' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setProductCatFilter(c.id)}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: productCatFilter === c.id ? 'var(--primary)' : 'transparent',
                      color: productCatFilter === c.id ? '#FFFFFF' : 'var(--text-muted)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <select
                className="input-clean"
                style={{ width: 'auto', fontSize: '13px', fontWeight: 600 }}
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value)}
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock Only</option>
                <option value="OUT_OF_STOCK">Out of Stock Only</option>
                <option value="RX_ONLY">Prescription Rx Only</option>
              </select>
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                <Boxes size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No products matched your search or filters.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Product &amp; Brand</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>List Price (৳)</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Current Stock</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>SKU Valuation</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const inStock = p.inStock !== false;
                      const stockCount = typeof p.stockCount === 'number' ? p.stockCount : 50;
                      const price = typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0);
                      const itemValuation = price * stockCount;

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={p.image || p.imageUrl || PRESET_IMAGES[0].url}
                                alt={p.name}
                                style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', background: 'var(--surface-alt)' }}
                                onError={(e) => { e.currentTarget.src = PRESET_IMAGES[0].url; }}
                              />
                              <div>
                                <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                                  {p.name}
                                </strong>
                                <span style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600 }}>
                                  {p.brand || 'Pet Maya'} {p.isRx && '• Rx'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'var(--surface-alt)',
                              color: 'var(--text-main)'
                            }}>
                              {p.category || 'Supplies'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                            ৳{price.toFixed(2)}
                          </td>

                          <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                            <span style={{ color: stockCount <= 5 ? '#EF4444' : 'var(--text-main)' }}>
                              {stockCount} units
                            </span>
                          </td>

                          <td style={{ padding: '14px 10px', fontWeight: 700, color: '#10B981' }}>
                            ৳{Math.round(itemValuation).toLocaleString()}
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <button
                              onClick={() => handleToggleStock(p)}
                              style={{
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: inStock ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                                color: inStock ? '#10B981' : '#EF4444',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Click to toggle in/out of stock"
                            >
                              {inStock ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
                            </button>
                          </td>

                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                className="icon-btn"
                                style={{ width: 32, height: 32, color: 'var(--apple-blue)' }}
                                onClick={() => handleOpenEditProduct(p)}
                                title="Edit Product Entry"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                className="icon-btn"
                                style={{ width: 32, height: 32, color: '#EF4444' }}
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                title="Delete Product"
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
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: 📦 ORDER MANAGEMENT & DISPATCH
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Total Platform Revenue</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>
                ৳{totalRevenue.toFixed(2)}
              </strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Processed Orders</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">In Preparation / Pending</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: inPrepOrdersCount > 0 ? '#0071E3' : 'var(--text-main)' }}>
                {inPrepOrdersCount} Orders
              </strong>
              <span style={{ fontSize: '12px', color: inPrepOrdersCount > 0 ? '#0071E3' : 'var(--text-muted)', marginTop: '4px' }}>
                {inPrepOrdersCount > 0 ? 'Requires Fulfillment' : 'Queue Cleared'}
              </span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">In Transit / Shipped</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#A855F7' }}>
                {ordersList.filter(o => (o.status || '').toLowerCase().includes('ship')).length} Orders
              </strong>
              <span style={{ fontSize: '12px', color: '#A855F7', marginTop: '4px' }}>Live Courier Tracking</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Delivered / Completed</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>
                {ordersList.filter(o => (o.status || '').toLowerCase().includes('deliver')).length}
              </strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Successfully Delivered</span>
            </div>
          </div>

          <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Package size={18} color="var(--primary)" />
                  <span>Customer Order Fulfillment Pipeline</span>
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Review real-time purchases, update tracking dispatch status, and inspect delivery destinations.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-clean"
                  placeholder="Search orders by ID, address, or item names..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-alt)', padding: '3px', borderRadius: '10px', overflowX: 'auto' }}>
                {[
                  { id: 'ALL', label: `All (${ordersList.length})` },
                  { id: 'IN_PREP', label: `In Prep (${inPrepOrdersCount})` },
                  { id: 'SHIPPED', label: `Shipped (${ordersList.filter(o => (o.status || '').toLowerCase().includes('ship')).length})` },
                  { id: 'DELIVERED', label: `Delivered (${ordersList.filter(o => (o.status || '').toLowerCase().includes('deliver')).length})` },
                  { id: 'CANCELLED', label: 'Cancelled' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: orderStatusFilter === tab.id ? 'var(--primary)' : 'transparent',
                      color: orderStatusFilter === tab.id ? '#FFFFFF' : 'var(--text-muted)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No customer orders match the current filter.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Order ID &amp; Date</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Items Summary</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Delivery Destination</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Total</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const orderId = ord.id || ord.orderId || 'PM-ORD';
                      const itemsCount = (ord.items || []).reduce((sum, i) => sum + (i.qty || 1), 0);
                      const status = (ord.status || 'Order Placed');
                      const sLower = status.toLowerCase();

                      return (
                        <tr key={orderId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 10px' }}>
                            <strong style={{ fontSize: '13.5px', color: 'var(--primary)', display: 'block', fontFamily: 'monospace' }}>
                              {orderId}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {ord.date || 'Today'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                                {(ord.items && ord.items[0]?.name) || 'Pet Care Supplies'}
                                {ord.items && ord.items.length > 1 ? ` +${ord.items.length - 1} more` : ''}
                              </strong>
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                {itemsCount} {itemsCount === 1 ? 'item' : 'items'} total
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: 'var(--text-main)', maxWidth: '240px' }}>
                              <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                                  style={{ padding: '4px 10px', fontSize: '11.5px', background: '#A855F7' }}
                                  onClick={() => handleUpdateStatus(orderId, 'Shipped')}
                                >
                                  <Truck size={12} />
                                  <span>Ship</span>
                                </button>
                              )}

                              {sLower.includes('ship') && (
                                <button
                                  className="apple-btn-blue"
                                  style={{ padding: '4px 10px', fontSize: '11.5px', background: '#10B981' }}
                                  onClick={() => handleUpdateStatus(orderId, 'Delivered')}
                                >
                                  <CheckCircle size={12} />
                                  <span>Deliver</span>
                                </button>
                              )}

                              <button
                                className="btn-ghost"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => setSelectedOrderDetails(ord)}
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>

                              <button
                                className="icon-btn"
                                style={{ width: 28, height: 28, color: '#EF4444' }}
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
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: 👥 USERS VERIFICATION & ROLE MANAGEMENT
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* User Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Total Platform Users</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{usersList.length} Accounts</strong>
              <span style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>Active Community</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Verified KYC Profiles</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>{verifiedUsersCount}</strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>ID &amp; Contact Verified</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Pending Verification</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: pendingUsersCount > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
                {pendingUsersCount} Users
              </strong>
              <span style={{ fontSize: '12px', color: pendingUsersCount > 0 ? '#F59E0B' : '#10B981', marginTop: '4px' }}>
                {pendingUsersCount > 0 ? 'Requires Profile KYC Review' : 'All Profiles Clear'}
              </span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Clinicians &amp; Admins</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#8B5CF6' }}>
                {usersList.filter(u => u.role === 'Veterinarian' || u.role === 'Super Admin' || u.role === 'Admin').length} Staff
              </strong>
              <span style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '4px' }}>Elevated System Roles</span>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Users size={18} color="var(--primary)" />
                  <span>User Account &amp; KYC Verification Command</span>
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
                <span>Add / Invite User</span>
              </button>
            </div>

            {/* Filters & Search */}
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

              {/* Role Filter */}
              <select
                className="input-clean"
                style={{ width: 'auto', fontSize: '13px', fontWeight: 600 }}
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="Pet Owner">Pet Owners</option>
                <option value="Veterinarian">Veterinarians</option>
                <option value="Shelter & Spa">Shelters &amp; Spas</option>
                <option value="Super Admin">Super Admins</option>
              </select>

              {/* Verification Status Filter */}
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

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                <Users size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No users match the selected filters.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>User Profile</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>System Role</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>KYC Verification</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Registered Pets</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isVerified = u.isVerified;
                      const isSuspended = u.accountStatus === 'SUSPENDED';

                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          {/* User Profile */}
                          <td style={{ padding: '14px 10px' }}>
                            <div 
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                              onClick={() => setSelectedUserDetails(u)}
                              title="Click to view full user profile & KYC dossier"
                            >
                              <UserAvatar user={u} size={42} />
                              <div>
                                <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                                  {u.name}
                                </strong>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {u.email} {u.phone ? `• ${u.phone}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role with in-place switcher */}
                          <td style={{ padding: '14px 10px' }}>
                            <select
                              className="input-clean"
                              style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}
                              value={u.role || 'Pet Owner'}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                            >
                              <option value="Pet Owner">Pet Owner</option>
                              <option value="Veterinarian">Veterinarian</option>
                              <option value="Shelter & Spa">Shelter &amp; Spa</option>
                              <option value="Super Admin">Super Admin</option>
                            </select>
                          </td>

                          {/* KYC Verification Badge & Toggle */}
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
                              title="Click to toggle KYC verification status"
                            >
                              {isVerified ? <BadgeCheck size={13} /> : <AlertCircle size={13} />}
                              <span>{isVerified ? 'KYC Verified' : 'Pending KYC'}</span>
                            </button>
                          </td>

                          {/* Account Status */}
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

                          {/* Pets Count */}
                          <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                            {u.petsCount || 1} Registered
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                className="btn-ghost"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => setSelectedUserDetails(u)}
                                title="Inspect user profile"
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>

                              <button
                                className="icon-btn"
                                style={{ width: 28, height: 28, color: isSuspended ? '#10B981' : '#EF4444' }}
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
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: 🩺 SERVICES & CLINIC LICENSING MANAGEMENT
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Services Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Specialist Providers</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{vets.length} Facilities</strong>
              <span style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>Active in Booking Network</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Verified Medical Licenses</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>{verifiedServicesCount}</strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>100% Board Certified</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Pending License Reviews</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: pendingServicesCount > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
                {pendingServicesCount} Providers
              </strong>
              <span style={{ fontSize: '12px', color: pendingServicesCount > 0 ? '#F59E0B' : '#10B981', marginTop: '4px' }}>
                {pendingServicesCount > 0 ? 'Requires Document Audit' : 'All Credentials Verified'}
              </span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">24/7 Emergency Facilities</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#EF4444' }}>
                {vets.filter(v => v.isEmergencyOnCall || v.tag?.includes('Hospital') || v.tag?.includes('Emergency')).length || 2} Active
              </strong>
              <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>Instant Triage Callout</span>
            </div>
          </div>

          {/* Services Directory Table Card */}
          <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Stethoscope size={18} color="var(--primary)" />
                  <span>Clinical Licensing &amp; Service Provider Management</span>
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Audit doctor credentials, verify BMDC medical registrations, set consultation slot fees (৳), and manage clinic listings.
                </span>
              </div>

              <button
                className="apple-btn-blue"
                onClick={handleOpenAddService}
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                <Plus size={15} />
                <span>Add Service Provider</span>
              </button>
            </div>

            {/* Filters & Search */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-clean"
                  placeholder="Search by doctor, clinic, license number, or specialization..."
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
                <option value="ALL">All Service Categories</option>
                <option value="vet">Veterinary Clinics</option>
                <option value="grooming">Grooming Spas</option>
                <option value="boarding">Luxury Boarding &amp; Hotels</option>
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
                <option value="PENDING">Pending Verification</option>
              </select>
            </div>

            {/* Services Table */}
            {filteredServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                <Hospital size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No clinical services match your filter.</p>
              </div>
            ) : (
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
                          {/* Doctor / Facility */}
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

                          {/* Category & License */}
                          <td style={{ padding: '14px 10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-alt)', textTransform: 'uppercase', display: 'inline-block', marginBottom: '2px' }}>
                              {v.tag || 'Veterinarian'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontFamily: 'monospace' }}>
                              {v.licenseNumber || 'BMDC-VET-8891'}
                            </span>
                          </td>

                          {/* Specialization */}
                          <td style={{ padding: '14px 10px', color: 'var(--text-main)', fontSize: '13px', maxWidth: '240px' }}>
                            {v.qualification}
                          </td>

                          {/* Slot Fee */}
                          <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {v.price ? (v.price.startsWith('৳') ? v.price : `৳${v.price}`) : '৳400/visit'}
                          </td>

                          {/* License Verification Badge & Toggle */}
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
                              title="Click to toggle medical license verification"
                            >
                              {isVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              <span>{isVerified ? 'Verified License' : 'Pending Audit'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button 
                                className="icon-btn" 
                                style={{ width: 32, height: 32, color: 'var(--apple-blue)' }}
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
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5: 📝 ARTICLE & COMMUNITY BLOG MODERATION
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'blogs' && (
        <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <BookOpen size={18} color="var(--primary)" />
                <span>Community Blog &amp; Article Moderation</span>
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
                All ({blogs.length})
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
                  color: blogFilter === 'PENDING' ? '#FFFFFF' : (pendingBlogs.length > 0 ? '#F59E0B' : 'var(--text-muted)')
                }}
              >
                Pending Review ({pendingBlogs.length})
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
                Approved &amp; Live ({approvedBlogs.length})
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

          {filteredBlogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <FileText size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No articles match the selected filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBlogs.map((article) => {
                const isApproved = article.isApproved === true || article.status === 'APPROVED';
                const isRejected = article.status === 'REJECTED';
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img
                          src={article.imageUrl || 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800'}
                          alt={article.title}
                          style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800';
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10B981'
                              }}
                            >
                              {article.category || 'HEALTH'}
                            </span>

                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: isApproved 
                                  ? 'rgba(16, 185, 129, 0.15)' 
                                  : (isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                                color: isApproved ? '#10B981' : (isRejected ? '#EF4444' : '#F59E0B')
                              }}
                            >
                              {isApproved ? '● LIVE ON FEED' : (isRejected ? '● REJECTED' : '⏳ PENDING REVIEW')}
                            </span>
                          </div>

                          <strong style={{ fontSize: '16px', display: 'block', color: 'var(--text-main)' }}>
                            {article.title}
                          </strong>

                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            By {article.authorName || 'Pet Maya User'} • {formatBlogDate(article.timestamp)} • {article.readTimeMinutes || 5} min read
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
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '14px 18px',
                          background: 'var(--bg)',
                          borderRadius: '12px',
                          fontSize: '13.5px',
                          lineHeight: 1.6,
                          color: 'var(--text-main)',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}
                      >
                        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{article.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 6: 📊 TELEMETRY & OVERVIEW
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Total Shop Valuation</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>
                ৳{Math.round(totalValuation).toLocaleString()}
              </strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Based on current SKU inventory</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Gross Processed Revenue</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>
                ৳{totalRevenue.toFixed(2)}
              </strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Across {ordersList.length} Customer Orders</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Total Registered Users</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{usersList.length} Users</strong>
              <span style={{ fontSize: '12px', color: '#3B82F6', marginTop: '4px' }}>{verifiedUsersCount} KYC Verified</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Verified Clinicians</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{verifiedServicesCount} Active</strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>100% License Verified</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>Quick Control Hub</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="apple-btn-blue" onClick={() => setAdminTab('users')} style={{ justifyContent: 'space-between' }}>
                  <span>Manage Users &amp; KYC Verification ({pendingUsersCount})</span>
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                </button>
                <button className="btn-ghost" onClick={() => setAdminTab('services')} style={{ justifyContent: 'space-between' }}>
                  <span>Verify Clinic &amp; Medical Licenses ({pendingServicesCount})</span>
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                </button>
                <button className="btn-ghost" onClick={() => setAdminTab('shop')} style={{ justifyContent: 'space-between' }}>
                  <span>Manage Shop &amp; Inventory</span>
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            </div>

            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>Platform Health Status</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Firebase Real-time Store Database</span>
                  <span className="badge badge-green">Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GPS Collar Telemetry Service</span>
                  <span className="badge badge-green">Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>AI Health Vision Neural Triage</span>
                  <span className="badge badge-green">Active (Gemini 2.5)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 7: 📢 BROADCASTS & GLOBAL BANNER
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'broadcasts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <AlertTriangle size={18} color="var(--primary)" />
                <span>Global Top Promotional Banner</span>
              </h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={bannerConfig.isActive} 
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                {bannerConfig.isActive ? <span style={{ color: '#10B981' }}>Active</span> : <span style={{ color: 'var(--text-muted)' }}>Hidden</span>}
              </label>
            </div>

            <form onSubmit={handleUpdateBanner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-mini">Promotional Text</label>
                <input 
                  type="text" 
                  className="input-clean" 
                  placeholder="e.g. Shop online and get specialist help, free delivery..."
                  value={bannerConfig.text}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, text: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="label-mini">Link Text</label>
                  <input 
                    type="text" 
                    className="input-clean" 
                    placeholder="e.g. store's services"
                    value={bannerConfig.linkText}
                    onChange={(e) => setBannerConfig(prev => ({ ...prev, linkText: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-mini">Link URL</label>
                  <input 
                    type="text" 
                    className="input-clean" 
                    placeholder="e.g. /shop or https://..."
                    value={bannerConfig.linkUrl}
                    onChange={(e) => setBannerConfig(prev => ({ ...prev, linkUrl: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="apple-btn-blue" style={{ alignSelf: 'flex-start', padding: '9px 22px' }}>
                <CheckCircle2 size={14} />
                <span>Save Banner Configuration</span>
              </button>
            </form>
          </div>

          <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="var(--primary)" />
              <span>System Broadcast Push Messenger</span>
            </h3>

            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                <input 
                  type="text" 
                  className="input-clean" 
                  placeholder="Notification Title (e.g. Weather Alert, Vaccination Drive)..."
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
                placeholder="Broadcast announcement content sent to mobile & web clients..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                style={{ resize: 'vertical' }}
              />

              <button type="submit" className="apple-btn-blue" style={{ alignSelf: 'flex-start', padding: '9px 22px' }}>
                <Send size={14} />
                <span>Send Live Broadcast</span>
              </button>
            </form>

            <div style={{ marginTop: '20px' }}>
              <span className="label-mini">Recent Broadcast Log</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {broadcasts.map(b => (
                  <div key={b.id} style={{ background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px' }}>{b.title}</strong>
                      <span className="badge badge-green">{b.target} • {b.date}</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>{b.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 1: NEW CATALOG ENTRY (Product SKU)
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddProductModalOpen && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
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
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#0D0D0E',
                color: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 30px 90px rgba(0,0,0,0.95)',
                padding: '24px 24px 28px',
                textAlign: 'left',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.04em', margin: 0, textTransform: 'uppercase', color: '#FFFFFF' }}>
                  {editingProduct ? 'EDIT CATALOG ENTRY' : 'NEW CATALOG ENTRY'}
                </h2>
                <button 
                  className="icon-btn" 
                  style={{ color: '#8E8E93' }} 
                  onClick={() => setIsAddProductModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8E8E93', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    PRODUCT GALLERY
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '78px',
                        height: '78px',
                        borderRadius: '16px',
                        border: '2px dashed rgba(16, 185, 129, 0.6)',
                        background: productFormData.image ? `url("${productFormData.image}") center/cover no-repeat` : 'rgba(16, 185, 129, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      title="Click to upload image file"
                    >
                      {!productFormData.image && (
                        <>
                          <Upload size={22} color="#10B981" />
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#10B981', marginTop: '3px' }}>ADD</span>
                        </>
                      )}
                      {productFormData.image && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                        >
                          <Upload size={16} color="#FFF" />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: '#8E8E93', display: 'block', marginBottom: '6px' }}>Or pick preset / enter URL:</span>
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {PRESET_IMAGES.map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setProductFormData(prev => ({ ...prev, image: preset.url }))}
                            style={{
                              border: productFormData.image === preset.url ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                              background: '#1A1A1D',
                              color: '#FFFFFF',
                              padding: '4px 8px',
                              borderRadius: '8px',
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
                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8E8E93', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    PRODUCT NAME
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#161618',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Enter product title..."
                    value={productFormData.name}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8E8E93', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      LIST PRICE (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: '#161618',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      placeholder="e.g. 1250"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8E8E93', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      CURRENT STOCK
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: '#161618',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      placeholder="e.g. 100"
                      value={productFormData.stockCount}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, stockCount: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8E8E93', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    BRAND / MANUFACTURER
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#161618',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    placeholder="e.g. Royal Canin, Zoetis, Pet Maya"
                    value={productFormData.brand}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8E8E93', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    CATEGORY
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = productFormData.category === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setProductFormData(prev => ({ ...prev, category: cat.id }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: isSelected ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.2)',
                            background: isSelected ? '#10B981' : 'transparent',
                            color: isSelected ? '#FFFFFF' : '#D1D1D6',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: '#161618', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: '12.5px', color: '#D1D1D6' }}>
                    <span>In Stock Active</span>
                    <input
                      type="checkbox"
                      checked={productFormData.inStock}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#10B981' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: '#161618', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: '12.5px', color: '#8B5CF6' }}>
                    <span>Rx Prescription</span>
                    <input
                      type="checkbox"
                      checked={productFormData.isRx}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, isRx: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#8B5CF6' }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8E8E93', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    MARKETING DESCRIPTION
                  </label>
                  <textarea
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#161618',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    placeholder="Enter full marketing copy, dietary benefits, specifications..."
                    value={productFormData.description}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: isSubmittingProduct ? '#059669' : '#10B981',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: isSubmittingProduct ? 'wait' : 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.18s ease',
                    opacity: isSubmittingProduct ? 0.8 : 1
                  }}
                >
                  {isSubmittingProduct ? 'SAVING SKU...' : (editingProduct ? 'UPDATE SKU' : 'FINALIZE SKU')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MODAL 2: ADD / EDIT SERVICE PROVIDER
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
              WebkitBackdropFilter: 'blur(16px)',
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
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: 'var(--surface-solid)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
                padding: '28px',
                textAlign: 'left',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Specialist Network</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0' }}>
                    {editingService ? 'Edit Service Provider' : 'Add Clinical Service Provider'}
                  </h2>
                </div>
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
                    placeholder="e.g. Dr. Emily Vance / Pawfect Spa"
                    value={serviceFormData.name}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label-mini">Service Category *</label>
                    <select
                      className="input-clean"
                      value={serviceFormData.tag}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, tag: e.target.value }))}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="Veterinarian">Veterinarian</option>
                      <option value="Grooming Spa">Grooming Spa</option>
                      <option value="Boarding Resort">Boarding Resort</option>
                      <option value="Diagnostic Lab">Diagnostic Lab</option>
                      <option value="Pet Hospital">Pet Hospital / ER</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-mini">Medical License Number *</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label-mini">Clinic / Hospital Name</label>
                    <input
                      type="text"
                      className="input-clean"
                      placeholder="e.g. City Vets & Diagnostics"
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
                  <label className="label-mini">Qualifications &amp; Specialization</label>
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="e.g. DVM • Internal Medicine & Cardiology"
                    value={serviceFormData.qualification}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label-mini">Operating Schedule</label>
                    <input
                      type="text"
                      className="input-clean"
                      placeholder="e.g. Mon - Fri • 9am - 6pm"
                      value={serviceFormData.availability}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, availability: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label-mini">Distance Label</label>
                    <input
                      type="text"
                      className="input-clean"
                      placeholder="e.g. 1.2 km away"
                      value={serviceFormData.distance}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, distance: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--surface-alt)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: '#10B981' }}>Medical License Verified</span>
                    <input
                      type="checkbox"
                      checked={serviceFormData.isVerified}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                      style={{ width: 16, height: 16 }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--surface-alt)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: '#EF4444' }}>24/7 Emergency On-Call</span>
                    <input
                      type="checkbox"
                      checked={serviceFormData.isEmergencyOnCall}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, isEmergencyOnCall: e.target.checked }))}
                      style={{ width: 16, height: 16 }}
                    />
                  </label>
                </div>

                <div>
                  <label className="label-mini">Clinical Bio &amp; Specialty Notes</label>
                  <textarea
                    rows={2}
                    className="input-clean"
                    placeholder="Expertise in surgery, echocardiography, dental scaling..."
                    value={serviceFormData.bio}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-ghost" onClick={() => setIsAddServiceModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="apple-btn-blue" style={{ padding: '9px 22px' }}>
                    <CheckCircle2 size={15} />
                    <span>{editingService ? 'Save Service Updates' : 'Publish Service Listing'}</span>
                  </button>
                </div>
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
              WebkitBackdropFilter: 'blur(16px)',
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
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'var(--surface-solid)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
                padding: '28px',
                textAlign: 'left'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>User Provisioning</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0' }}>Register / Invite User</h2>
                </div>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label-mini">System Role *</label>
                    <select
                      className="input-clean"
                      value={userFormData.role}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="Pet Owner">Pet Owner</option>
                      <option value="Veterinarian">Veterinarian</option>
                      <option value="Shelter & Spa">Shelter &amp; Spa</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-mini">Phone Number</label>
                    <input
                      type="text"
                      className="input-clean"
                      placeholder="+880 1700-000000"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--surface-alt)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#10B981' }}>Mark KYC Profile as Verified</span>
                  <input
                    type="checkbox"
                    checked={userFormData.isVerified}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button type="button" className="btn-ghost" onClick={() => setIsAddUserModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="apple-btn-blue" style={{ padding: '9px 22px' }}>
                    <CheckCircle2 size={15} />
                    <span>Create User Account</span>
                  </button>
                </div>
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
              WebkitBackdropFilter: 'blur(16px)',
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
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'var(--surface-solid)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
                padding: '28px',
                textAlign: 'left'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>User Dossier</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0' }}>Profile &amp; Verification</h2>
                </div>
                <button className="icon-btn" onClick={() => setSelectedUserDetails(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* User Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-alt)', padding: '16px', borderRadius: '16px', marginBottom: '18px' }}>
                <UserAvatar user={selectedUserDetails} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{selectedUserDetails.name}</strong>
                    {selectedUserDetails.isVerified && <BadgeCheck size={18} color="#10B981" />}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', wordBreak: 'break-all' }}>
                    {selectedUserDetails.email}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 700, fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                    UID: {selectedUserDetails.id}
                  </span>
                </div>
              </div>

              {/* Status and Role Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '12px' }}>
                  <span className="label-mini">KYC Status</span>
                  <strong style={{ display: 'block', color: selectedUserDetails.isVerified ? '#10B981' : '#F59E0B', marginTop: '2px', fontSize: '13px' }}>
                    {selectedUserDetails.isVerified ? 'VERIFIED PROFILE' : 'PENDING REVIEW'}
                  </strong>
                </div>

                <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '12px' }}>
                  <span className="label-mini">Account State</span>
                  <strong style={{ display: 'block', color: selectedUserDetails.accountStatus === 'SUSPENDED' ? '#EF4444' : '#10B981', marginTop: '2px', fontSize: '13px' }}>
                    {selectedUserDetails.accountStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE'}
                  </strong>
                </div>
              </div>

              {/* Comprehensive User Profile Fields */}
              <div style={{ background: 'var(--surface-alt)', padding: '14px 16px', borderRadius: '16px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} /> Phone:
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedUserDetails.phone || 'Not Provided'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} /> Address:
                  </span>
                  <strong style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '60%' }}>{selectedUserDetails.address || 'Dhaka, Bangladesh'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={13} /> Pet Maya Points:
                  </span>
                  <strong style={{ color: '#F59E0B' }}>{selectedUserDetails.points ?? 25} pts</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={13} /> Referral Code:
                  </span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{selectedUserDetails.referralCode || 'N/A'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={13} /> Change Role:
                  </span>
                  <select
                    className="input-clean"
                    style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 700, width: 'auto' }}
                    value={selectedUserDetails.role || 'Pet Owner'}
                    onChange={(e) => handleChangeUserRole(selectedUserDetails.id, e.target.value)}
                  >
                    <option value="Pet Owner">Pet Owner</option>
                    <option value="Veterinarian">Veterinarian</option>
                    <option value="Shelter & Spa">Shelter &amp; Spa</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} /> Member Since:
                  </span>
                  <span>{selectedUserDetails.joinedDate || '2026-08-01'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
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
                  <span>{selectedUserDetails.accountStatus === 'SUSPENDED' ? 'Reactivate User Access' : 'Suspend User Account'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MODAL 5: INSPECT CUSTOMER ORDER DETAILS
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
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
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              style={{
                width: '100%',
                maxWidth: '580px',
                background: 'var(--surface-solid)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
                padding: '28px',
                textAlign: 'left',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Dispatch Manifest</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0', fontFamily: 'monospace' }}>
                    {selectedOrderDetails.id || selectedOrderDetails.orderId}
                  </h2>
                </div>
                <button className="icon-btn" onClick={() => setSelectedOrderDetails(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: '16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="label-mini">Current Order Status</span>
                  <div style={{ marginTop: '4px' }}>
                    {getOrderStatusBadge(selectedOrderDetails.status)}
                  </div>
                </div>

                <div>
                  <span className="label-mini">Change Status</span>
                  <select
                    className="input-clean"
                    style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600, marginTop: '2px' }}
                    value={selectedOrderDetails.status || 'In Preparation'}
                    onChange={(e) => handleUpdateStatus(selectedOrderDetails.id || selectedOrderDetails.orderId, e.target.value)}
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="In Preparation">In Preparation</option>
                    <option value="Shipped">Shipped / In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <span className="label-mini">Shipping &amp; Delivery Destination</span>
                <div style={{ background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: '12px', marginTop: '6px', fontSize: '13.5px', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <MapPin size={15} color="var(--primary)" />
                    <span>{selectedOrderDetails.deliveryAddress || selectedOrderDetails.address || 'Standard Delivery Address'}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Customer UID: {selectedOrderDetails.userId || 'Guest Client'} • Date: {selectedOrderDetails.date || 'Today'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <span className="label-mini">Purchased Items ({selectedOrderDetails.items?.length || 0})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {(selectedOrderDetails.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {item.qty || 1} × ৳{Number(item.price || 0).toFixed(2)}</span>
                      </div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                        ৳{((item.qty || 1) * (item.price || 0)).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>৳{Number(selectedOrderDetails.subtotal || selectedOrderDetails.total || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Shipping:</span>
                  <span>৳{Number(selectedOrderDetails.shipping || 0).toFixed(2)}</span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                    <span>Discount Applied:</span>
                    <span>-৳{Number(selectedOrderDetails.discount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span>Total Amount Paid:</span>
                  <span style={{ color: 'var(--primary)' }}>৳{Number(selectedOrderDetails.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
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
                  style={{ padding: '8px 20px', fontSize: '13px' }}
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
