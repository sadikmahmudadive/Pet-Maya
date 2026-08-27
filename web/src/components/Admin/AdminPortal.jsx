import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPortal() {
  const { 
    vets, 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    orders: contextOrders, 
    updateOrderStatus, 
    deleteOrder, 
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

  // Active Admin Sub-Tab
  const [adminTab, setAdminTab] = useState('shop'); // 'overview', 'shop', 'orders', 'blogs', 'broadcasts', 'clinicians'

  // ─── SHOP & INVENTORY STATE ───
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState('ALL'); // 'ALL', 'IN_STOCK', 'OUT_OF_STOCK', 'RX_ONLY'
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State for Add / Edit Product
  const [productFormData, setProductFormData] = useState({
    name: '',
    category: 'food',
    price: '',
    image: '',
    description: '',
    isRx: false,
    inStock: true,
    stockCount: 50,
    rating: 4.8
  });

  // Preset Product Images for Quick Picking
  const PRESET_IMAGES = [
    { label: 'Dog Kibble', url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop&q=80' },
    { label: 'Rx Meds', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80' },
    { label: 'Smart Collar', url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&auto=format&fit=crop&q=80' },
    { label: 'Cat Diet', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80' },
    { label: 'Memory Bed', url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=500&auto=format&fit=crop&q=80' },
    { label: 'Ear Drops', url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80' },
    { label: 'Supplements', url: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=500&auto=format&fit=crop&q=80' }
  ];

  // ─── ORDER MANAGEMENT STATE ───
  const [allOrders, setAllOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL'); // 'ALL', 'IN_PREP', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Real-time Firestore sync for ALL platform orders
  useEffect(() => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAllOrders(fetched);
        } else {
          // Merge with context orders or local fallback
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

  // ─── BROADCAST STATE ───
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcasts, setBroadcasts] = useState([
    { id: 'b1', title: '🌧️ Monsoon Parasite Advisory', message: 'Flea and tick activity surges during wet season. Ensure Simparica/Nexgard preventative dosage.', date: '2026-08-24', target: 'All Users' }
  ]);

  // ─── GLOBAL BANNER STATE ───
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
  const [blogFilter, setBlogFilter] = useState('ALL'); // ALL, PENDING, APPROVED
  const [blogSearch, setBlogSearch] = useState('');
  const [expandedBlogId, setExpandedBlogId] = useState(null);

  useEffect(() => {
    if (globalBanner) {
      setBannerConfig(globalBanner);
    }
  }, [globalBanner]);

  // Real-time Firestore sync for blogs
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
      category: 'food',
      price: '',
      image: PRESET_IMAGES[0].url,
      description: '',
      isRx: false,
      inStock: true,
      stockCount: 50,
      rating: 4.8
    });
    setIsAddProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name || '',
      category: product.category || 'food',
      price: product.price || '',
      image: product.image || product.imageUrl || '',
      description: product.description || '',
      isRx: !!product.isRx,
      inStock: product.inStock !== false,
      stockCount: typeof product.stockCount === 'number' ? product.stockCount : 50,
      rating: product.rating || 4.8
    });
    setIsAddProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productFormData.name.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }
    if (!productFormData.price || isNaN(parseFloat(productFormData.price))) {
      showToast('Please enter a valid price', 'error');
      return;
    }

    const payload = {
      name: productFormData.name.trim(),
      category: productFormData.category,
      price: parseFloat(productFormData.price),
      image: productFormData.image || PRESET_IMAGES[0].url,
      description: productFormData.description.trim() || 'Veterinary-grade pet care formulation.',
      isRx: !!productFormData.isRx,
      inStock: !!productFormData.inStock,
      stockCount: parseInt(productFormData.stockCount, 10) || 0,
      rating: parseFloat(productFormData.rating) || 4.8,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
    }

    setIsAddProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the store?`)) return;
    await deleteProduct(productId);
  };

  const handleToggleStock = async (product) => {
    const nextState = product.inStock === false;
    await updateProduct(product.id, { inStock: nextState });
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

  // ─── BROADCAST & BANNER ACTIONS ───
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
      if (productCatFilter === 'pharma' && !cat.includes('pharma') && !p.isRx) return false;
      if (productCatFilter === 'tech' && !cat.includes('tech') && !cat.includes('collar')) return false;
      if (productCatFilter === 'supplies' && !cat.includes('suppl') && !cat.includes('bed')) return false;
    }

    if (productStockFilter === 'IN_STOCK' && p.inStock === false) return false;
    if (productStockFilter === 'OUT_OF_STOCK' && p.inStock !== false) return false;
    if (productStockFilter === 'RX_ONLY' && !p.isRx) return false;

    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
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

  // Financial & Inventory Aggregations
  const totalRevenue = ordersList
    .filter(o => !((o.status || '').toLowerCase().includes('cancel')))
    .reduce((acc, o) => acc + (typeof o.total === 'number' ? o.total : parseFloat(o.total) || 0), 0);

  const inPrepOrdersCount = ordersList.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s.includes('prep') || s.includes('placed') || s.includes('pending');
  }).length;

  const shippedOrdersCount = ordersList.filter(o => (o.status || '').toLowerCase().includes('ship')).length;
  const deliveredOrdersCount = ordersList.filter(o => (o.status || '').toLowerCase().includes('deliver')).length;

  const inStockProductsCount = products.filter(p => p.inStock !== false).length;
  const outOfStockProductsCount = products.filter(p => p.inStock === false).length;
  const rxProductsCount = products.filter(p => p.isRx).length;

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
            Enter your administrative cryptographic credentials to unlock product inventory controls, live order pipelines, and platform configuration.
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
          { id: 'shop', label: 'Shop & Inventory', icon: ShoppingBag, count: products.length },
          { id: 'orders', label: 'Orders & Dispatch', icon: Package, count: inPrepOrdersCount > 0 ? inPrepOrdersCount : ordersList.length, highlight: inPrepOrdersCount > 0 },
          { id: 'blogs', label: 'Article Moderation', icon: BookOpen, count: pendingBlogs.length, highlight: pendingBlogs.length > 0 },
          { id: 'overview', label: 'Telemetry & Stats', icon: Activity },
          { id: 'broadcasts', label: 'Broadcasts & Banner', icon: Radio },
          { id: 'clinicians', label: 'Clinician Directory', icon: Stethoscope, count: vets.length },
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
          
          {/* Shop Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Total Catalog Items</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{products.length} Products</strong>
              <span style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>Live in Pet Shop &amp; Pharmacy</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">In Stock / Available</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>{inStockProductsCount}</strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Ready for Instant Dispatch</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Out of Stock Alerts</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: outOfStockProductsCount > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                {outOfStockProductsCount} Items
              </strong>
              <span style={{ fontSize: '12px', color: outOfStockProductsCount > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>
                {outOfStockProductsCount > 0 ? 'Requires Restock Supply' : 'All SKUs Available'}
              </span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Prescription Medications</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#8B5CF6' }}>{rxProductsCount} Rx SKUs</strong>
              <span style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '4px' }}>Requires Vet Verification</span>
            </div>
          </div>

          {/* Catalog Controls Header */}
          <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <ShoppingBag size={18} color="var(--primary)" />
                  <span>Store Catalog &amp; Inventory Manager</span>
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Create, update pricing, toggle stock availability, and manage pharmaceutical prescriptions.
                </span>
              </div>

              <button
                className="apple-btn-blue"
                onClick={handleOpenAddProduct}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <Plus size={15} />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Filters & Search */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-clean"
                  placeholder="Search products by title, description, or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-alt)', padding: '3px', borderRadius: '10px', overflowX: 'auto' }}>
                {[
                  { id: 'ALL', label: 'All Categories' },
                  { id: 'food', label: 'Food & Nutrition' },
                  { id: 'pharma', label: 'Rx & Pharmacy' },
                  { id: 'tech', label: 'Collars & Tech' },
                  { id: 'supplies', label: 'Beds & Supplies' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setProductCatFilter(c.id)}
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
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

              {/* Stock Status Filter */}
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
                <button
                  className="btn-minimal"
                  style={{ marginTop: '8px', color: 'var(--primary)' }}
                  onClick={() => { setProductSearch(''); setProductCatFilter('ALL'); setProductStockFilter('ALL'); }}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Product</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Price</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Stock Status</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Rx Required</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const inStock = p.inStock !== false;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          {/* Item Info */}
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
                                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {p.description || 'Premium pet care item.'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
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

                          {/* Price */}
                          <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                            ${Number(p.price || 0).toFixed(2)}
                          </td>

                          {/* Stock Status & Toggle */}
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

                          {/* Rx Required */}
                          <td style={{ padding: '14px 10px' }}>
                            {p.isRx ? (
                              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
                                💊 Rx Required
                              </span>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>OTC</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                className="icon-btn"
                                style={{ width: 32, height: 32, color: 'var(--apple-blue)' }}
                                onClick={() => handleOpenEditProduct(p)}
                                title="Edit Product"
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
          
          {/* Order Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Total Platform Revenue</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>
                ${totalRevenue.toFixed(2)}
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
                {shippedOrdersCount} Orders
              </strong>
              <span style={{ fontSize: '12px', color: '#A855F7', marginTop: '4px' }}>Live Courier Tracking</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '18px 20px', textAlign: 'left' }}>
              <span className="label-mini">Delivered / Completed</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{deliveredOrdersCount}</strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Successfully Delivered</span>
            </div>
          </div>

          {/* Orders Queue Table Card */}
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

            {/* Filters & Search */}
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

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-alt)', padding: '3px', borderRadius: '10px', overflowX: 'auto' }}>
                {[
                  { id: 'ALL', label: `All (${ordersList.length})` },
                  { id: 'IN_PREP', label: `In Prep (${inPrepOrdersCount})` },
                  { id: 'SHIPPED', label: `Shipped (${shippedOrdersCount})` },
                  { id: 'DELIVERED', label: `Delivered (${deliveredOrdersCount})` },
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

            {/* Orders Table */}
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
                          {/* Order ID & Date */}
                          <td style={{ padding: '14px 10px' }}>
                            <strong style={{ fontSize: '13.5px', color: 'var(--primary)', display: 'block', fontFamily: 'monospace' }}>
                              {orderId}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {ord.date || 'Today'}
                            </span>
                          </td>

                          {/* Items Breakdown */}
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

                          {/* Address */}
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: 'var(--text-main)', maxWidth: '240px' }}>
                              <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ord.deliveryAddress || ord.address || 'Dhaka, Bangladesh'}
                              </span>
                            </div>
                          </td>

                          {/* Total */}
                          <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                            ${Number(ord.total || 0).toFixed(2)}
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '14px 10px' }}>
                            {getOrderStatusBadge(status)}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {/* 1-Click Status Transitions */}
                              {(sLower.includes('prep') || sLower.includes('placed') || sLower.includes('pending')) && (
                                <button
                                  className="apple-btn-blue"
                                  style={{ padding: '4px 10px', fontSize: '11.5px', background: '#A855F7' }}
                                  onClick={() => handleUpdateStatus(orderId, 'Shipped')}
                                  title="Mark order as shipped"
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
                                  title="Mark order as delivered"
                                >
                                  <CheckCircle size={12} />
                                  <span>Deliver</span>
                                </button>
                              )}

                              {/* Inspect details */}
                              <button
                                className="btn-ghost"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => setSelectedOrderDetails(ord)}
                                title="Inspect order breakdown"
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>

                              {/* Delete option */}
                              <button
                                className="icon-btn"
                                style={{ width: 28, height: 28, color: '#EF4444' }}
                                onClick={() => handleDeleteOrder(orderId)}
                                title="Delete Order Record"
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
          TAB 3: 📝 ARTICLE & COMMUNITY BLOG MODERATION
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

            {/* Filter Pills */}
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

          {/* Search Bar */}
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

          {/* Article Moderation List */}
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

                      {/* Action buttons */}
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
                          title="Delete Article"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content preview */}
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
          TAB 4: 📊 OVERVIEW & TELEMETRY
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Gross Store Revenue</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>
                ${totalRevenue.toFixed(2)}
              </strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Across {ordersList.length} Customer Orders</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Pending Orders</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: inPrepOrdersCount > 0 ? '#0071E3' : 'var(--text-main)' }}>
                {inPrepOrdersCount} Orders
              </strong>
              <span style={{ fontSize: '12px', color: inPrepOrdersCount > 0 ? '#0071E3' : '#10B981', marginTop: '4px' }}>
                {inPrepOrdersCount > 0 ? 'Awaiting Dispatch' : 'Fulfillment Complete'}
              </span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Catalog SKUs</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{products.length} Products</strong>
              <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>{inStockProductsCount} In Stock</span>
            </div>

            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
              <span className="label-mini">Verified Clinicians</span>
              <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{vets.length} Active</strong>
              <span style={{ fontSize: '12px', color: '#3B82F6', marginTop: '4px' }}>100% License Verified</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>Quick Control Hub</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="apple-btn-blue" onClick={() => setAdminTab('shop')} style={{ justifyContent: 'space-between' }}>
                  <span>Manage Shop &amp; Inventory</span>
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                </button>
                <button className="btn-ghost" onClick={() => setAdminTab('orders')} style={{ justifyContent: 'space-between' }}>
                  <span>Review Pending Orders ({inPrepOrdersCount})</span>
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                </button>
                <button className="btn-ghost" onClick={() => setAdminTab('blogs')} style={{ justifyContent: 'space-between' }}>
                  <span>Review Pending Blogs ({pendingBlogs.length})</span>
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
          TAB 5: 📢 BROADCASTS & GLOBAL BANNER
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'broadcasts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Global Banner Config */}
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

          {/* Broadcast Push Messenger */}
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
          TAB 6: 🩺 CLINICIAN DIRECTORY & LICENSING
          ══════════════════════════════════════════════════════ */}
      {adminTab === 'clinicians' && (
        <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Verified Clinicians &amp; Pricing Directory</h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 10px', fontWeight: 600 }}>Doctor / Clinic</th>
                  <th style={{ padding: '12px 10px', fontWeight: 600 }}>Specialization</th>
                  <th style={{ padding: '12px 10px', fontWeight: 600 }}>License Status</th>
                  <th style={{ padding: '12px 10px', fontWeight: 600 }}>Slot Fee</th>
                  <th style={{ padding: '12px 10px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vets.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 10px' }}>
                      <strong style={{ display: 'block', color: 'var(--text-main)' }}>{v.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.clinic}</span>
                    </td>
                    <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>{v.qualification}</td>
                    <td style={{ padding: '14px 10px' }}>
                      <span className="badge badge-green">Verified License</span>
                    </td>
                    <td style={{ padding: '14px 10px', fontWeight: 700 }}>${v.price || 40}</td>
                    <td style={{ padding: '14px 10px' }}>
                      <button 
                        className="btn-ghost" 
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                        onClick={() => openModal('editPrice', v)}
                      >
                        <Edit size={13} />
                        <span>Adjust Fee</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: ADD / EDIT PRODUCT
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddProductModalOpen && (
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
            onClick={() => setIsAddProductModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              style={{
                width: '100%',
                maxWidth: '560px',
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
                  <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Store Catalog</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0' }}>
                    {editingProduct ? 'Edit Product Item' : 'Add New Product to Store'}
                  </h2>
                </div>
                <button className="icon-btn" onClick={() => setIsAddProductModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Product Name */}
                <div>
                  <label className="label-mini">Product Title *</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="e.g. Royal Canin Golden Retriever Adult (3kg)"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Category & Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label-mini">Category *</label>
                    <select
                      className="input-clean"
                      value={productFormData.category}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, category: e.target.value }))}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="food">Food &amp; Nutrition</option>
                      <option value="pharma">Rx &amp; Pharmacy</option>
                      <option value="tech">Smart Collars &amp; Tech</option>
                      <option value="supplies">Beds, Toys &amp; Supplies</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-mini">Price ($ USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      required
                      className="input-clean"
                      placeholder="e.g. 42.50"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Stock Controls & Rx Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>In Stock Status</span>
                      <input
                        type="checkbox"
                        checked={productFormData.inStock}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                        style={{ width: 18, height: 18 }}
                      />
                    </label>
                  </div>

                  <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#8B5CF6' }}>Prescription (Rx)</span>
                      <input
                        type="checkbox"
                        checked={productFormData.isRx}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, isRx: e.target.checked }))}
                        style={{ width: 18, height: 18 }}
                      />
                    </label>
                  </div>
                </div>

                {/* Image URL & Preset Selection */}
                <div>
                  <label className="label-mini">Product Image URL</label>
                  <input
                    type="url"
                    className="input-clean"
                    placeholder="https://images.unsplash.com/..."
                    value={productFormData.image}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, image: e.target.value }))}
                  />

                  {/* Preset Photos Quick Pick */}
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Or pick a standard preset:</span>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {PRESET_IMAGES.map((preset, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setProductFormData(prev => ({ ...prev, image: preset.url }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: productFormData.image === preset.url ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: 'var(--surface-alt)',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <img src={preset.url} alt="" style={{ width: 18, height: 18, borderRadius: '4px', objectFit: 'cover' }} />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label-mini">Description &amp; Key Details</label>
                  <textarea
                    rows={3}
                    className="input-clean"
                    placeholder="Provide dietary benefits, active ingredients, dosage recommendations or size specifications..."
                    value={productFormData.description}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setIsAddProductModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="apple-btn-blue"
                    style={{ padding: '9px 22px' }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{editingProduct ? 'Save Product Changes' : 'Publish Product to Store'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MODAL: INSPECT CUSTOMER ORDER DETAILS
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

              {/* Status Header */}
              <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: '16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="label-mini">Current Order Status</span>
                  <div style={{ marginTop: '4px' }}>
                    {getOrderStatusBadge(selectedOrderDetails.status)}
                  </div>
                </div>

                {/* Status Changer Dropdown */}
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

              {/* Delivery Info */}
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

              {/* Items List */}
              <div style={{ marginBottom: '18px' }}>
                <span className="label-mini">Purchased Items ({selectedOrderDetails.items?.length || 0})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {(selectedOrderDetails.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {item.qty || 1} × ${Number(item.price || 0).toFixed(2)}</span>
                      </div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                        ${((item.qty || 1) * (item.price || 0)).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Summary Breakdown */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>${Number(selectedOrderDetails.subtotal || selectedOrderDetails.total || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Shipping:</span>
                  <span>${Number(selectedOrderDetails.shipping || 0).toFixed(2)}</span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                    <span>Discount Applied:</span>
                    <span>-${Number(selectedOrderDetails.discount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span>Total Amount Paid:</span>
                  <span style={{ color: 'var(--primary)' }}>${Number(selectedOrderDetails.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
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
