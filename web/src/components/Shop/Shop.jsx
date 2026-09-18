import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  ShoppingBag, 
  Search, 
  Snowflake, 
  Star, 
  ShoppingCart, 
  Truck, 
  Plus,
  Minus,
  PackageCheck,
  ChevronRight,
  ShieldCheck,
  Info,
  X,
  Heart,
  UtensilsCrossed,
  Pill,
  Radio,
  Package,
  RotateCcw,
  Snowflake,
  Filter,
  ArrowUpDown,
  Check,
  SlidersHorizontal,
  Tag,
  Sparkles
  Check, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  X, 
  FileText, 
  Stethoscope, 
  Sparkles,
  QrCode,
  Activity,
  ChevronDown
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';
import ProductDetailPage from './ProductDetailPage';

// ── Category icon tiles shown above the product grid ───────────────────────
const CATEGORY_TILES = [
  { id: 'food',     icon: UtensilsCrossed, label: 'Food',       subtitle: 'Diets & Nutrition', color: '#10B981' },
  { id: 'pharma',   icon: Pill,            label: 'Pharmacy',   subtitle: 'Rx & Medications',  color: '#3B82F6' },
  { id: 'tech',     icon: Radio,           label: 'Smart Tech',  subtitle: 'GPS & Wearables',   color: '#8B5CF6' },
  { id: 'supplies', icon: Package,         label: 'Supplies',   subtitle: 'Beds & Toys',       color: '#F59E0B' },
// ── Category Filter Definitions Matching Reference ───────────────────────────
const FILTER_CHIPS = [
  { id: 'all', label: 'All Formulations (24)', filter: null },
  { id: 'canine_rx', label: 'Canine Rx', filter: 'canine_rx' },
  { id: 'feline_care', label: 'Feline Care', filter: 'feline_care' },
  { id: 'cold_chain', label: '❄️ Cold-Chain Biologics', filter: 'cold_chain' },
  { id: 'clinical_diets', label: 'Clinical Diets', filter: 'clinical_diets' },
  { id: 'joint_mobility', label: 'Joint & Mobility', filter: 'joint_mobility' },
];

// ── Delivery ETA helper ─────────────────────────────────────────────────────
function getDeliveryETA(p) {
  const cat = (p.category || '').toLowerCase();
  if (cat.includes('pharma') || cat.includes('med') || p.isRx)
    return { label: 'Express (24h Cold-Chain)', color: '#10B981' };
  if (cat.includes('food') || cat.includes('nutri'))
    return { label: 'Standard (2–3 days)',       color: '#6B7280' };
  return   { label: 'Standard Delivery',        color: '#6B7280' };
}
export default function Shop({ onNavigate }) {
  const { products, addToCart, removeFromCart, cart, openModal } = useApp();
  const { currentUser } = useAuth();

// ── Stock badge helper ──────────────────────────────────────────────────────
function getStockInfo(p, idx) {
  if (p.stock !== undefined) {
    if (p.stock === 0)   return { label: 'Out of Stock',                  color: '#EF4444', bg: 'rgba(239,68,68,0.10)', urgent: true };
    if (p.stock <= 8)    return { label: `Only ${p.stock} left in stock`, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', urgent: true };
    return                      { label: 'In Stock — Dispatches Today',   color: '#10B981', bg: 'rgba(16,185,129,0.10)', urgent: false };
  }
  if (idx % 2 === 0)     return { label: 'Low Stock — 4 left',            color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', urgent: true };
  return                        { label: 'In Stock — Dispatches Today',   color: '#10B981', bg: 'rgba(16,185,129,0.10)', urgent: false };
}
  // Search & Filter State
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [addedItemMap, setAddedItemMap] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

// ── Simple toast component ──────────────────────────────────────────────────
function Toast({ message, onDone }) {
  // Auto-populate reference cart if completely empty on first visit
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
    try {
      const hasInit = localStorage.getItem('pm_shop_sample_initialized');
      if (!hasInit && (!cart || cart.length === 0) && products && products.length >= 4) {
        const p1 = products.find(p => p.id === 'p1') || products[0];
        const p4 = products.find(p => p.id === 'p4') || products[3];
        if (p1 && p4) {
          addToCart(p1, 1);
          addToCart(p4, 1);
          localStorage.setItem('pm_shop_sample_initialized', 'true');
        }
      }
    } catch (_) {}
  }, [products]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1F2937',
      color: '#fff',
      padding: '10px 22px',
      borderRadius: '24px',
      fontSize: '13.5px',
      fontWeight: 600,
      zIndex: 9999,
      boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}
  // Handle Quick Add with visual feedback
  const handleQuickAdd = (product, e) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    setAddedItemMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap(prev => ({ ...prev, [product.id]: false }));
    }, 1600);
  };

export default function Shop() {
  const { products, isProductsLoading, addToCart, openModal, orders } = useApp();
  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products];

  // Search & Filter State
  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedCategory,   setSelectedCategory]   = useState('all');
  const [sortBy,             setSortBy]             = useState('featured');
  const [filterRxOnly,       setFilterRxOnly]       = useState(false);
  const [filterInStockOnly,  setFilterInStockOnly]  = useState(false);
  const [showWishlistOnly,   setShowWishlistOnly]   = useState(false);

  // Modal State
  const [selectedProduct,    setSelectedProduct]    = useState(null);
  const [modalQty,           setModalQty]           = useState(1);
  const [modalTab,           setModalTab]           = useState('details'); // 'details' | 'specs' | 'guarantee'
  const [orderTrackingModal, setOrderTrackingModal] = useState(false);

  // Persistent Wishlist in localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_shop_wishlist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    // Category filter
    if (selectedFilter !== 'all') {
      list = list.filter(p => p.category === selectedFilter);
    }
  });

  const [toastMsg, setToastMsg] = useState(null);

  // Reset modal quantity when selectedProduct changes
  useEffect(() => {
    setModalQty(1);
    setModalTab('details');
  }, [selectedProduct]);

  // Wishlist toggle with localStorage persistence
  function toggleWishlist(p) {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
        setToastMsg(`Removed from Wishlist`);
      } else {
        next.add(p.id);
        setToastMsg(`Saved "${p.name.slice(0, 20)}..." to Wishlist`);
      }
      try {
        localStorage.setItem('pm_shop_wishlist', JSON.stringify([...next]));
      } catch (err) {
        console.warn('Wishlist storage error:', err);
      }
      return next;
    });
  }

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    const list = products.filter(p => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        (p.name || '').toLowerCase().includes(q) || 
        (p.description || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q);
      
      let matchesCat = true;
      if (selectedCategory !== 'all') {
        const cat = (p.category || '').toLowerCase();
        if (selectedCategory === 'food')          matchesCat = cat.includes('food') || cat.includes('nutri') || cat.includes('diet');
        else if (selectedCategory === 'pharma')   matchesCat = cat.includes('pharma') || cat.includes('med') || p.isRx;
        else if (selectedCategory === 'tech')     matchesCat = cat.includes('tech') || cat.includes('collar') || cat.includes('gps');
        else if (selectedCategory === 'supplies') matchesCat = cat.includes('suppl') || cat.includes('bed') || cat.includes('toy');
      }
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.subtag && p.subtag.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

      const matchesRx = !filterRxOnly || p.isRx;
      const matchesStock = !filterInStockOnly || (p.stock === undefined || p.stock > 0);
      const matchesWishlist = !showWishlistOnly || wishlist.has(p.id);

      return matchesQuery && matchesCat && matchesRx && matchesStock && matchesWishlist;
    });

    // Sort order
    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (Number(b.discountPct) || 0) - (Number(a.discountPct) || 0));
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [products, searchQuery, selectedCategory, filterRxOnly, filterInStockOnly, showWishlistOnly, wishlist, sortBy]);
  }, [products, selectedFilter, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || filterRxOnly || filterInStockOnly || showWishlistOnly || sortBy !== 'featured';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
    setFilterRxOnly(false);
    setFilterInStockOnly(false);
    setShowWishlistOnly(false);
  };

  // Active Product Detail Page View
  const [viewingProductId, setViewingProductId] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#shop-product/')) {
      return window.location.hash.replace('#shop-product/', '');
  // Limit to 6 hero formulations by default on All tab to match reference layout
  const displayedProducts = useMemo(() => {
    if (selectedFilter !== 'all' || searchQuery.trim() || showAll) {
      return filteredProducts;
    }
    return null;
  });
    return filteredProducts.slice(0, 6);
  }, [filteredProducts, selectedFilter, searchQuery, showAll]);

  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash.startsWith('#shop-product/')) {
        setViewingProductId(window.location.hash.replace('#shop-product/', ''));
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  // Care Bag calculations
  const cartItems = cart || [];
  const cartFormulationCount = cartItems.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || item.quantity || 1), 0);
  const COURIER_GOAL = 2500;
  const courierProgress = Math.min(100, Math.round((cartSubtotal / COURIER_GOAL) * 100));
  const remainingForCourier = Math.max(0, COURIER_GOAL - cartSubtotal);

  if (viewingProductId) {
  // If a specific product detail page is active
  if (selectedProduct) {
    return (
      <ProductDetailPage
        productId={viewingProductId}
        onBack={() => {
          setViewingProductId(null);
          if (typeof window !== 'undefined' && window.location.hash.startsWith('#shop-product/')) {
            window.location.hash = 'shop';
          }
        }}
      <ProductDetailPage 
        productId={selectedProduct.id} 
        onBack={() => setSelectedProduct(null)} 
        onNavigate={onNavigate} 
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}
    <div style={{
      backgroundColor: '#FDF8F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", sans-serif)',
      paddingBottom: '80px'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '36px 24px 0 24px'
      }}>

      {/* ── HEADER & SHOP UTILITIES ── */}
      <AppleReveal duration={0.8} yOffset={25}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        {/* ── 1. HERO & CLINICAL NODE HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="sand-badge" style={{ margin: 0 }}>Verified Veterinary Pharmacy &amp; Store</span>
              <span className="mint-badge">
                Cold-Chain 24h
              </span>
            {/* Clinical Formulary Node Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#EBF4F4',
              border: '1px solid rgba(69, 132, 141, 0.3)',
              borderRadius: '9999px',
              padding: '4px 14px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#346B73',
              textTransform: 'uppercase',
              marginBottom: '14px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#45848D' }} />
              <span>• CLINICAL FORMULARY NODE</span>
              <span>• VAULT ACTIVE</span>
              <span>• ISO 9001:2015 COLD-CHAIN STANDARD</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--foreground)' }}>
              Care Shop &amp; Clinical Pharmacy

            {/* Main Headline */}
            <h1 style={{
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 600,
              color: '#160F0C',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 10px 0'
            }}>
              Prescription Formulary &amp; Clinical Biologics
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
              Veterinary-grade diets, genuine prescription medications, smart GPS collars, and specialty accessories.

            {/* Subtitle */}
            <p style={{
              fontSize: '14.5px',
              color: '#675C58',
              lineHeight: 1.5,
              maxWidth: '680px',
              margin: 0
            }}>
              Cold-chain monitored pharmaceuticals, targeted veterinary nutrition, and bio-engineered therapeutics verified under strict veterinarian oversight.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {orders.length > 0 && (
              <button className="btn-ghost" onClick={() => setOrderTrackingModal(true)}>
                <PackageCheck size={15} />
                <span>Track Orders ({orders.length})</span>
              </button>
            )}
            <button 
              onClick={() => openModal('cart')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
          {/* Right Floating Cold-Chain Express Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #DED9D6',
            borderRadius: '9999px',
            padding: '8px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            marginTop: '4px'
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#160F0C',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Snowflake size={14} color="#7DD3FC" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#45848D',
                  textTransform: 'uppercase'
                }}>
                  COLD-CHAIN EXPRESS
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0284C7'
                }}>
                  2°C – 8°C
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                fontSize: '14px',
                padding: '10px 22px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(46, 204, 155, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <ShoppingCart size={16} />
              <span>View Shopping Bag</span>
            </button>
                color: '#160F0C'
              }}>
                Under 120m Dhaka Dispatch
              </span>
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── E-COMMERCE VALUE PROPOSITION & TRUST BAR ── */}
      <AppleReveal delay={0.06} yOffset={20}>
        {/* ── 2. FILTER CAPSULES & SEARCH BAR ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          background: 'var(--surface-alt)',
          padding: '16px 18px',
          borderRadius: '16px',
          border: '1px solid var(--border)'
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '28px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(222, 217, 214, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-main)' }}>Free Express Shipping</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On all orders over ৳1,000</span>
            </div>
          {/* Left: Category Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {FILTER_CHIPS.map(chip => {
              const isActive = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedFilter(chip.id)}
                  style={{
                    backgroundColor: isActive ? '#160F0C' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#525B57',
                    border: isActive ? '1px solid #160F0C' : '1px solid #DED9D6',
                    borderRadius: '9999px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-main)' }}>100% Genuine Certified</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Licensed pharmaceutical supply</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Snowflake size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-main)' }}>Cold-Chain Delivery</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Temperature-monitored packaging</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RotateCcw size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-main)' }}>Easy 7-Day Returns</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hassle-free exchange guarantee</span>
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── SEARCH, SORTING & ADVANCED FILTERS BAR ── */}
      <AppleReveal delay={0.1} yOffset={20}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Right: Search & Sort */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                className="input-clean" 
                placeholder="Search food, Simparica, GPS collar, Purina..." 
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  color: '#9A8F8A', 
                  pointerEvents: 'none' 
                }} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="Search molecule, brand, DIN..."
                style={{
                  padding: '8px 14px 8px 36px',
                  borderRadius: '9999px',
                  border: '1px solid #DED9D6',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  color: '#160F0C',
                  outline: 'none',
                  width: '240px',
                  transition: 'border-color 0.18s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#160F0C'}
                onBlur={(e) => e.target.style.borderColor = '#DED9D6'}
              />
              {searchQuery && (
                <button 
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#9A8F8A',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <select 
                className="input-clean" 
                value={sortBy} 
            {/* Sort Select */}
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '8px 12px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DED9D6',
                  borderRadius: '9999px',
                  padding: '8px 32px 8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#160F0C',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="featured">Featured (Recommended)</option>
                <option value="recommended">Clinician Recommended ⌵</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ChevronDown 
                size={14} 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#675C58', 
                  pointerEvents: 'none' 
                }} 
              />
            </div>
          </div>
        </div>

          {/* Quick Filter Toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                className={`chip-pill ${filterInStockOnly ? 'active' : ''}`}
                onClick={() => setFilterInStockOnly(!filterInStockOnly)}
              >
                In Stock Only
              </button>
        {/* ── 3. MAIN CATALOG GRID & SIDEBAR LAYOUT ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 350px',
          gap: '28px',
          alignItems: 'start'
        }} className="shop-main-layout">

              <button 
                className={`chip-pill ${filterRxOnly ? 'active' : ''}`}
                onClick={() => setFilterRxOnly(!filterRxOnly)}
              >
                Rx Prescriptions Only
              </button>

              <button 
                className={`chip-pill ${showWishlistOnly ? 'active' : ''}`}
                onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              >
                Wishlist Saved ({wishlist.size})
              </button>

              {hasActiveFilters && (
                <button 
                  onClick={resetFilters}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}
          {/* LEFT: 3-Column Product Cards Grid */}
          <div>
            {filteredProducts.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #DED9D6',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#160F0C', marginBottom: '8px' }}>
                  No clinical formulations matched your query
                </p>
                <p style={{ fontSize: '13px', color: '#675C58', marginBottom: '20px' }}>
                  Try adjusting filters or searching for another molecule or brand name.
                </p>
                <button
                  onClick={() => { setSelectedFilter('all'); setSearchQuery(''); }}
                  style={{
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear All Filters
                  Reset All Filters
                </button>
              )}
            </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '20px'
              }} className="shop-products-grid">
                {displayedProducts.map((product) => {
                  const isAdded = !!addedItemMap[product.id];
                  const isCold = product.category === 'cold_chain' || product.badgeType === 'cold' || product.badge?.includes('REFRIGERATED');
                  const isPrescriptionControlled = product.badge?.includes('PRESCRIPTION') || product.isRx;

            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>
        </div>
      </AppleReveal>
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #EAE5E2',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 1px 4px rgba(22, 15, 12, 0.02)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(22, 15, 12, 0.06)';
                        e.currentTarget.style.borderColor = '#DED9D6';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(22, 15, 12, 0.02)';
                        e.currentTarget.style.borderColor = '#EAE5E2';
                      }}
                    >
                      {/* Card Top: Badges & Rating */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        minHeight: '22px'
                      }}>
                        {/* Category/Status Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: isCold ? '#E0F2FE' : '#F5F1EE',
                          color: isCold ? '#0369A1' : '#675C58',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          {product.badge || 'CLINICAL FORMULATION'}
                        </span>

      {/* ── CATEGORY ICON TILES (CLEAN SVG ICONS) ── */}
      <AppleReveal delay={0.14} yOffset={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
          {CATEGORY_TILES.map(tile => {
            const isActive = selectedCategory === tile.id;
            const IconComp = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => setSelectedCategory(isActive ? 'all' : tile.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '18px 10px',
                  borderRadius: '16px',
                  border: '1.5px solid',
                  borderColor: isActive ? '#10B981' : 'var(--border)',
                  background: isActive ? 'rgba(16,185,129,0.09)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? '0 0 0 2px rgba(16,185,129,0.18)' : 'none',
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(16,185,129,0.18)' : 'var(--surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? '#10B981' : tile.color,
                  transition: 'all 0.18s ease',
                }}>
                  <IconComp size={22} strokeWidth={2} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isActive ? '#10B981' : 'var(--text-main)' }}>{tile.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tile.subtitle}</span>
              </button>
            );
          })}
        </div>
      </AppleReveal>
                        {/* Rating or Right Tag */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: product.tagRight ? '#707973' : '#160F0C',
                          fontFamily: product.tagRight ? 'var(--font-mono)' : 'inherit'
                        }}>
                          {product.tagRight ? (
                            product.tagRight
                          ) : (
                            <>
                              <Star size={11} fill="#F59E0B" color="#F59E0B" />
                              <span>{product.rating || '4.9'}</span>
                              <span style={{ color: '#9A8F8A', fontWeight: 400 }}>({product.ratingCount || 100})</span>
                            </>
                          )}
                        </span>
                      </div>

      {/* ── PRODUCT GRID (CONVERSION & SEO OPTIMIZED) ── */}
      <AppleStagger className="apple-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px' }}>
        {isProductsLoading && products.length === 0 ? (
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="apple-promo-card" style={{ opacity: 0.6 }}>
              <div className="apple-card-image-box" style={{ background: 'var(--surface-alt)' }} />
              <div style={{ width: '70%', height: 18, background: 'var(--surface-alt)', borderRadius: 4, margin: '14px 0 8px' }} />
              <div style={{ width: '90%', height: 14, background: 'var(--surface-alt)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: '50%', height: 16, background: 'var(--surface-alt)', borderRadius: 4, marginTop: 'auto' }} />
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', background: 'var(--surface-alt)', borderRadius: '20px' }}>
            <ShoppingBag size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>No matching products found</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Try loosening your search query or reset your filters to view the full veterinary catalog.
            </p>
            <button className="apple-btn-blue" onClick={resetFilters}>
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredProducts.map((p, idx) => {
            const stock    = getStockInfo(p, idx);
            const delivery = getDeliveryETA(p);
            const isWished = wishlist.has(p.id);
            const isOOS    = p.stock === 0;
            const originalPrice = p.originalPrice || (p.price ? (p.price * 1.2).toFixed(2) : null);
            const discountPct = p.discountPct || (originalPrice ? Math.round(((originalPrice - p.price) / originalPrice) * 100) : null);
                      {/* Card Middle: Podium Image Frame with Subtag Overlay */}
                      <div style={{
                        position: 'relative',
                        backgroundColor: '#F7F3EF',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        height: '180px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '14px'
                      }}>
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80';
                          }}
                        />

            return (
              <article key={p.id} className="apple-promo-card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Product Image & Badges */}
                <div 
                  className="apple-card-image-box" 
                  onClick={() => setViewingProductId(p.id)} 
                  style={{ cursor: 'pointer', background: (p.category || '').includes('food') ? '#f3f4f6' : '#f8fafc', position: 'relative' }}
                >
                  <img src={p.image} alt={p.name} loading="lazy" />
                  
                  {/* Top-Left: Badge or Discount */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
                    {p.badge && (
                      <span className="sand-badge" style={{ backgroundColor: 'rgba(217, 168, 115, 0.92)', color: '#FFFFFF', border: 'none' }}>
                        {p.badge}
                      </span>
                    )}
                    {discountPct && discountPct > 0 && (
                      <span style={{ background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 7px', borderRadius: '6px' }}>
                        SAVE {discountPct}%
                      </span>
                    )}
                  </div>
                        {/* Sub-tag Pill at bottom of image */}
                        {product.subtag && (
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: isCold ? '#388E9C' : 'rgba(255, 255, 255, 0.92)',
                            color: isCold ? '#FFFFFF' : '#160F0C',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '9.5px',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                          }}>
                            {product.subtag}
                          </div>
                        )}
                      </div>

                  {/* Top-Right: Rx Badge */}
                  {p.isRx && (
                    <span className="badge badge-red" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                      Prescription Rx
                    </span>
                  )}
                </div>
                      {/* Card Body: Brand, Title, Description */}
                      <div style={{ flex: 1, marginBottom: '14px' }}>
                        <div style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#45848D',
                          marginBottom: '4px'
                        }}>
                          {product.brand || 'VETERINARY FORMULATIONS'}
                        </div>
                        <h3 style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#160F0C',
                          lineHeight: 1.25,
                          margin: '0 0 6px 0'
                        }}>
                          {product.name}
                        </h3>
                        <p style={{
                          fontSize: '12px',
                          color: '#675C58',
                          lineHeight: 1.4,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {product.description}
                        </p>
                      </div>

                {/* Brand & Social Proof Stars */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {p.brand || 'Pet Maya'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#F59E0B', fontWeight: 700 }}>
                    <Star size={13} fill="#F59E0B" color="#F59E0B" />
                    <span>{p.rating || '4.9'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500 }}>({p.ratingCount || '80+'})</span>
                  </div>
                      {/* Card Bottom: Verified Price & Action Button */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '10px',
                        borderTop: '1px solid #F0ECE9'
                      }}>
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '8.5px',
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: '#9A8F8A'
                          }}>
                            VERIFIED PRICE
                          </div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#160F0C',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '2px'
                          }}>
                            <span>৳</span>
                            <span>{(product.price || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Specific Action CTA */}
                        <button
                          onClick={(e) => handleQuickAdd(product, e)}
                          style={{
                            backgroundColor: isAdded 
                              ? '#10B981' 
                              : (product.ctaText?.includes('Reserve') 
                                  ? '#346B73' 
                                  : '#160F0C'),
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '7px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.18s ease',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          {isAdded ? (
                            <>
                              <Check size={13} />
                              <span>Added</span>
                            </>
                          ) : (
                            <span>{product.ctaText || '+ Quick Add'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expand / Collapse toggle for complete catalog */}
              {selectedFilter === 'all' && !searchQuery.trim() && filteredProducts.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button
                    onClick={() => setShowAll(!showAll)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#160F0C',
                      border: '1px solid #DED9D6',
                      borderRadius: '9999px',
                      padding: '10px 24px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8F3EF'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    {showAll ? 'Show Hero Formulations (6) ⌃' : `View All ${filteredProducts.length} Formulations ⌵`}
                  </button>
                </div>
              )}
            </>
          )}
          </div>

                {/* Product Title */}
                <h3 
                  className="apple-card-title" 
                  onClick={() => setViewingProductId(p.id)} 
                  style={{ cursor: 'pointer', margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}
                >
                  {p.name}
                </h3>
          {/* RIGHT: Sticky Care Bag & Support Sidebar */}
          <div style={{
            position: 'sticky',
            top: '84px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>

                {/* Product Description snippet */}
                <p className="apple-card-desc" style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px 0', flex: 1 }}>
                  {p.description}
                </p>
            {/* ── Care Bag Card ── */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #DED9D6',
              padding: '20px',
              boxShadow: '0 2px 12px rgba(22, 15, 12, 0.03)'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} color="#160F0C" />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Care Bag
                  </h2>
                </div>
                <span style={{
                  backgroundColor: '#F5F1EE',
                  color: '#675C58',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {cartFormulationCount} {cartFormulationCount === 1 ? 'formulation' : 'formulations'}
                </span>
              </div>

                {/* Price Row with Strikethrough Comparison */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0' }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    ৳{Number(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {/* Cold-Chain Courier Waiver Goal Banner */}
              <div style={{
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0369A1' }}>
                    Cold-Chain Courier Waiver
                  </span>
                  {originalPrice && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ৳{Number(originalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                {/* Stock Indicator */}
                <div style={{ marginBottom: '6px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: stock.bg,
                    color: stock.color,
                    display: 'inline-block'
                    color: '#0284C7',
                    backgroundColor: '#E0F2FE',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {stock.label}
                    ৳{COURIER_GOAL.toLocaleString()} Goal
                  </span>
                </div>

                {/* Delivery ETA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
                  <Truck size={12} color={delivery.color} />
                  <span style={{ fontSize: '11px', color: delivery.color, fontWeight: 600 }}>{delivery.label}</span>
                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#E0F2FE',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    width: `${courierProgress}%`,
                    height: '100%',
                    backgroundColor: '#0284C7',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Actions Row */}
                <div className="apple-card-actions" style={{ alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <button
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 500,
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                      opacity: isOOS ? 0.5 : 1
                    }}
                    onClick={() => setViewingProductId(p.id)}
                    disabled={isOOS}
                  >
                    View Details
                  </button>
                {/* Remaining Notice */}
                <div style={{ fontSize: '11px', color: '#0369A1', lineHeight: 1.3 }}>
                  {remainingForCourier === 0 ? (
                    <span style={{ fontWeight: 600, color: '#059669' }}>
                      ✓ Complimentary insulated courier unlocked!
                    </span>
                  ) : (
                    <span>
                      Add <strong>৳{remainingForCourier.toLocaleString()}</strong> more for complimentary insulated courier
                    </span>
                  )}
                </div>
              </div>

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={() => toggleWishlist(p)}
                    aria-label={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '1.5px solid',
                      borderColor: isWished ? '#EF4444' : 'var(--border)',
                      background: isWished ? 'rgba(239,68,68,0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      flexShrink: 0,
                    }}
                  >
                    <Heart size={14} color={isWished ? '#EF4444' : 'var(--text-muted)'} fill={isWished ? '#EF4444' : 'none'} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <button 
              {/* Items List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px',
                maxHeight: '280px',
                overflowY: 'auto'
              }}>
                {cartItems.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px 12px',
                    color: '#9A8F8A',
                    fontSize: '13px'
                  }}>
                    Your care bag is empty. Add verified formulations from the catalog.
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: 'var(--primary)',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(46, 204, 155, 0.20)',
                        transition: 'all 0.15s ease'
                        justifyContent: 'space-between',
                        gap: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #F5F1EE'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p, 1);
                        openModal('cart');
                        setToastMsg(`Added ${p.name} to shopping bag!`);
                      }}
                      title="Add to Shopping Bag"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                    <button 
                      className="apple-link-cta" 
                      style={{ fontSize: '12.5px', fontWeight: 800 }} 
                      onClick={() => openModal('checkout', { product: p })}
                    >
                      <span>Buy Now</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </AppleStagger>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            backgroundColor: '#F5F1EE',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#160F0C',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.name}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#707973',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            Qty: {item.qty || item.quantity || 1} • {item.categoryLabel || item.brand || 'Rx'}
                          </div>
                        </div>
                      </div>

      {/* ── ENHANCED PRODUCT DETAILS MODAL (E-COMMERCE FRIENDLY) ── */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-green">{selectedProduct.category}</span>
                {selectedProduct.brand && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Brand: {selectedProduct.brand}
                  </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                          ৳{((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#9A8F8A',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {selectedProduct.isRx && (
                  <span className="badge badge-red">Prescription Required</span>
                )}
              </div>
              <button className="icon-btn" onClick={() => setSelectedProduct(null)}><X size={18} /></button>
            </div>

            {/* Product Image */}
            <figure style={{ background: '#FFF', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', margin: '0 0 16px 0' }}>
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain' }} 
              />
            </figure>
              {/* Price Breakdown */}
              <div style={{
                borderTop: '1px solid #EAE5E2',
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  color: '#675C58'
                }}>
                  <span>Formulary Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#160F0C' }}>
                    ৳{cartSubtotal.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  color: '#675C58'
                }}>
                  <span>Cold-Chain Vault Pack</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>
                    ৳0 Complimentary
                  </span>
                </div>

            {/* Ratings & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#F59E0B' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={14} fill="#F59E0B" color="#F59E0B" />
                ))}
                <div style={{
                  height: '1px',
                  backgroundColor: '#EAE5E2',
                  margin: '4px 0'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#160F0C'
                }}>
                  <span>Total Amount</span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em'
                  }}>
                    ৳{cartSubtotal.toLocaleString()}
                  </span>
                </div>
              </div>
              <strong style={{ fontSize: '13px' }}>{selectedProduct.rating || '4.9'}</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({selectedProduct.ratingCount || 128} verified reviews)</span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              {selectedProduct.name}
            </h2>

            {/* Price & Savings Callout */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                ৳{Number(selectedProduct.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {selectedProduct.originalPrice && (
                <span style={{ fontSize: '15px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ৳{Number(selectedProduct.originalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
              {selectedProduct.discountPct && (
                <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                  {selectedProduct.discountPct}% OFF
                </span>
              )}
            </div>

            {/* Tabs Selector */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
              <button 
                onClick={() => setModalTab('details')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  fontWeight: modalTab === 'details' ? 800 : 500,
                  color: modalTab === 'details' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: modalTab === 'details' ? '2px solid var(--primary)' : 'none',
                  cursor: 'pointer' 
              {/* Proceed to Clinical Dispatch Button */}
              <button
                disabled={cartItems.length === 0}
                onClick={() => openModal('checkout')}
                className="btn-elevate"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '9999px',
                  backgroundColor: cartItems.length === 0 ? '#A8A29E' : '#160F0C',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  border: 'none',
                  cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(22, 15, 12, 0.15)',
                  marginBottom: '14px'
                }}
              >
                Overview &amp; Benefits
                <span>Proceed to Clinical Dispatch</span>
                <ArrowRight size={15} />
              </button>
              <button 
                onClick={() => setModalTab('specs')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  fontWeight: modalTab === 'specs' ? 800 : 500,
                  color: modalTab === 'specs' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: modalTab === 'specs' ? '2px solid var(--primary)' : 'none',
                  cursor: 'pointer' 

              {/* Paper Prescription Trust Callout */}
              <div 
                onClick={() => openModal('checkout')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#FBF9F7',
                  border: '1px dashed #DED9D6',
                  cursor: 'pointer'
                }}
              >
                Specs &amp; Guide
              </button>
              <button 
                onClick={() => setModalTab('guarantee')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  fontWeight: modalTab === 'guarantee' ? 800 : 500,
                  color: modalTab === 'guarantee' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: modalTab === 'guarantee' ? '2px solid var(--primary)' : 'none',
                  cursor: 'pointer' 
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: '#EBF4F4',
                  color: '#346B73',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#160F0C' }}>
                    Have a paper prescription?
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#707973' }}>
                    Instant review by registered vets
                  </div>
                </div>
              </div>
            </div>

            {/* ── Live Clinician Support Card ── */}
            <div style={{
              backgroundColor: '#F8F3EF',
              border: '1px solid #DED9D6',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(22, 15, 12, 0.02)'
            }}>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#707973',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px'
              }}>
                LIVE CLINICIAN SUPPORT
              </span>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#160F0C',
                margin: '0 0 6px 0'
              }}>
                Unsure of dosage?
              </h3>
              <p style={{
                fontSize: '12px',
                color: '#675C58',
                lineHeight: 1.45,
                margin: '0 0 14px 0'
              }}>
                Connect with a licensed veterinary pharmacologist to review your companion's biomarker history.
              </p>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('ai');
                  } else {
                    window.location.hash = 'ai';
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#160F0C',
                  border: '1px solid #DED9D6',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.18s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5F1EE'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                Quality Assurance
                <Stethoscope size={14} color="#45848D" />
                <span>Launch AI Pre-Triage</span>
              </button>
            </div>

            {/* Tab Contents */}
            {modalTab === 'details' && (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                  {selectedProduct.description}
                </p>
                <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '12px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Key Formula Highlights:</span>
                  <span>• Veterinary medical grade certified with full batch traceability</span>
                  <span>• Free from artificial fillers, binders, or unverified additives</span>
                  <span>• Stored in temperature-stabilized depot compliant with WHO GSP norms</span>
                </div>
          </div>
        </div>

        {/* ── 4. COLD-CHAIN TELEMETRY & THERMAL PRESERVATION SECTION ── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #DED9D6',
          padding: '40px',
          marginTop: '56px',
          boxShadow: '0 2px 16px rgba(22, 15, 12, 0.03)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: '40px',
            alignItems: 'center'
          }} className="shop-coldchain-grid">

            {/* Left: Assurance Details & Telemetry Metrics */}
            <div>
              {/* Monospace Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#45848D',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                <span>• BIOLOGICS COLD-CHAIN GUARANTEE •</span>
              </div>
            )}

            {modalTab === 'specs' && (
              <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedProduct.specifications ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                      <div key={key} style={{ background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{val}</strong>
                      </div>
                    ))}
              {/* Title */}
              <h2 style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(24px, 3.2vw, 36px)',
                fontWeight: 600,
                lineHeight: 1.22,
                color: '#160F0C',
                letterSpacing: '-0.02em',
                margin: '0 0 16px 0'
              }}>
                Uncompromising thermal preservation from formulation laboratory to doorstep.
              </h2>

              {/* Body */}
              <p style={{
                fontSize: '14px',
                color: '#675C58',
                lineHeight: 1.6,
                maxWidth: '620px',
                margin: '0 0 28px 0'
              }}>
                Biologics and vaccines degrade irreversibly if exposed beyond narrow thermal thresholds. Pet Maya employs hermetic vacuum-insulated pods fitted with calibrated digital thermal dataloggers, guaranteeing zero temperature breach across Dhaka Metro.
              </p>

              {/* 3 Metric Stat Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '14px',
                marginBottom: '28px'
              }}>
                {/* Metric 1 */}
                <div style={{
                  backgroundColor: '#FBF9F7',
                  border: '1px solid #EAE5E2',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#707973',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    THERMAL WINDOW
                  </div>
                ) : (
                  <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                    Standard veterinary specifications verified by Pet Maya Clinical Board.
                  <div style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#160F0C',
                    letterSpacing: '-0.01em',
                    marginBottom: '2px'
                  }}>
                    2.4°C – 6.1°C
                  </div>
                )}
                {selectedProduct.usageGuide && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                    <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '4px' }}>Recommended Administration:</strong>
                    <span>{selectedProduct.usageGuide}</span>
                  <div style={{ fontSize: '11px', color: '#45848D', fontWeight: 600 }}>
                    Real-time audited
                  </div>
                )}
              </div>
            )}
                </div>

            {modalTab === 'guarantee' && (
              <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px' }}>
                  <ShieldCheck size={20} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>Direct Pharma Sourcing</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sourced directly from authorized distributors (Zoetis, Royal Canin, Merck, Purina) with certificate of analysis.</span>
                {/* Metric 2 */}
                <div style={{
                  backgroundColor: '#FBF9F7',
                  border: '1px solid #EAE5E2',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#707973',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    ACTIVE TRANSIT
                  </div>
                  <div style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#160F0C',
                    letterSpacing: '-0.01em',
                    marginBottom: '2px'
                  }}>
                    &lt; 120 Mins
                  </div>
                  <div style={{ fontSize: '11px', color: '#45848D', fontWeight: 600 }}>
                    Express dispatch
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px' }}>
                  <Snowflake size={20} color="#3B82F6" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>Verified Cold-Chain Transit</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vaccines, antibiotics, and biologics travel in insulated thermal cases monitored with digital data loggers.</span>

                {/* Metric 3 */}
                <div style={{
                  backgroundColor: '#FBF9F7',
                  border: '1px solid #EAE5E2',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#707973',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    BATCH INTEGRITY
                  </div>
                  <div style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#160F0C',
                    letterSpacing: '-0.01em',
                    marginBottom: '2px'
                  }}>
                    100% QR Scanned
                  </div>
                  <div style={{ fontSize: '11px', color: '#45848D', fontWeight: 600 }}>
                    Anti-counterfeit DIN
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selector & Live Subtotal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <button 
                    className="icon-btn" 
                    style={{ width: 30, height: 30 }}
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                    disabled={modalQty <= 1}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 800, fontSize: '14px' }}>{modalQty}</span>
                  <button 
                    className="icon-btn" 
                    style={{ width: 30, height: 30 }}
                    onClick={() => setModalQty(modalQty + 1)}
                  >
                    <Plus size={13} />
                  </button>
              {/* Protocol CTA Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setProtocolModalOpen(true)}
                  style={{
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '11px 22px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span>Review Temperature Protocol</span>
                </button>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  color: '#707973',
                  fontWeight: 600
                }}>
                  AAHA &amp; WHO-GMP Standard
                </span>
              </div>
            </div>

            {/* Right: High-Tech Telemetry Shipper Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #DED9D6',
              boxShadow: '0 8px 32px rgba(22, 15, 12, 0.08)',
              overflow: 'hidden'
            }}>
              {/* Shipper Card Top Bar */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#F8F3EF',
                borderBottom: '1px solid #EAE5E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#160F0C'
                  }}>
                    ACTIVE TELEMETRY SHIPPER: 234-4019
                  </span>
                </div>
                <span style={{
                  backgroundColor: '#ECFDF5',
                  color: '#047857',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Calibrated
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Subtotal:</span>
                <strong style={{ fontSize: '17px', color: 'var(--primary)' }}>
                  ৳{(Number(selectedProduct.price || 0) * modalQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              {/* Insulated Shipper Visual Box */}
              <div style={{
                position: 'relative',
                height: '210px',
                backgroundColor: '#EDF5F6',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&auto=format&fit=crop&q=80"
                  alt="Medical Cold Chain Pod"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* Pod Center LCD Display Simulation matching reference */}
                <div style={{
                  position: 'absolute',
                  backgroundColor: '#0F172A',
                  border: '2px solid #334155',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(4px)'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '8px',
                    color: '#94A3B8',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}>
                    INTERNAL POD
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#38BDF8',
                    letterSpacing: '0.05em'
                  }}>
                    4.2°C
                  </div>
                </div>

                {/* Core Sensor Pill Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(22, 15, 12, 0.85)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span>Sensor Core: 3.8°C</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button 
                className="btn-ghost" 
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                onClick={() => {
                  addToCart(selectedProduct, modalQty);
                  setSelectedProduct(null);
                }}
              >
                <Plus size={16} />
                <span>Add {modalQty} to Bag</span>
              </button>
              {/* Live Temperature Log Area */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#707973',
                    textTransform: 'uppercase'
                  }}>
                    TRANSIT TEMPERATURE LOG (LAST 90M)
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#0284C7'
                  }}>
                    TARGET: 2.0°C – 8.0°C
                  </span>
                </div>

              <button 
                className="apple-btn-blue" 
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                onClick={() => {
                  addToCart(selectedProduct, modalQty);
                  const sub = Number(selectedProduct.price || 0) * modalQty;
                  setSelectedProduct(null);
                  openModal('checkout', { 
                    product: { ...selectedProduct, qty: modalQty },
                    subtotal: sub,
                    shipping: sub > 1000 ? 0 : 60.00,
                    total: sub + (sub > 1000 ? 0 : 60.00)
                  });
                }}
              >
                <ShoppingBag size={16} />
                <span>Buy Now</span>
              </button>
            </div>
                {/* Continuous Telemetry Curved SVG Graph */}
                <div style={{
                  height: '52px',
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <svg viewBox="0 0 320 44" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="coldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Safe bounds guides */}
                    <line x1="0" y1="8" x2="320" y2="8" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="0" y1="36" x2="320" y2="36" stroke="#E2E8F0" strokeDasharray="3 3" />
                    {/* Filled Area */}
                    <path
                      d="M 0,22 Q 40,18 80,24 T 160,20 T 240,23 T 320,21 L 320,44 L 0,44 Z"
                      fill="url(#coldGradient)"
                    />
                    {/* Smooth curve line */}
                    <path
                      d="M 0,22 Q 40,18 80,24 T 160,20 T 240,23 T 320,21"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="2"
                    />
                    {/* Active pulse point */}
                    <circle cx="320" cy="21" r="4" fill="#0284C7" />
                    <circle cx="320" cy="21" r="7" fill="#0284C7" opacity="0.3" />
                  </svg>
                </div>

            {/* Frequently Bought Together Recommendation */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                Frequently Bought Together
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {products
                  .filter(p => p.id !== selectedProduct.id)
                  .slice(0, 2)
                  .map(rel => (
                    <div key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-alt)', padding: '10px', borderRadius: '12px' }}>
                      <img src={rel.image} alt={rel.name} style={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '12px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rel.name}
                        </strong>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                          ৳{Number(rel.price || 0).toFixed(2)}
                        </span>
                      </div>
                      <button 
                        className="btn-ghost" 
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '10px' }}
                        onClick={() => addToCart(rel, 1)}
                        title="Add to bag"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ))}
                {/* Waypoint Stages */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '9px',
                  color: '#707973',
                  textTransform: 'uppercase'
                }}>
                  <span>Dispatch (Cold-chain Vault)</span>
                  <span>In Active Transit</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>Delivered (Validated Audited)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── LIVE ORDER TRACKING MODAL ── */}
      {orderTrackingModal && (
        <div className="modal-backdrop" onClick={() => setOrderTrackingModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Orders &amp; Dispatch Tracking</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Real-time 5-stage pharmacy delivery tracker.</p>
              </div>
              <button className="icon-btn" onClick={() => setOrderTrackingModal(false)}><X size={18} /></button>
        {/* ── 5. BESPOKE COMPOUNDING & SPECIAL ORDERS BANNER ── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #DED9D6',
          padding: '20px 28px',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 1px 4px rgba(22, 15, 12, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#EBF4F4',
              color: '#346B73',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#160F0C',
                margin: '0 0 3px 0'
              }}>
                Bespoke Compounding &amp; Special Orders
              </h4>
              <p style={{
                fontSize: '13px',
                color: '#675C58',
                margin: 0
              }}>
                Looking for specialized veterinary oncology or custom liquid formulations? Our compounding lab prepares tailor-dosed suspensions.
              </p>
            </div>
          </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((ord, idx) => (
                <div key={ord.id || idx} style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '15px' }}>Order #{ord.id || `PM-ORD-${idx + 1}`}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Date: {ord.date}</span>
                    </div>
                    <span className="badge badge-green">{ord.status || 'In Preparation'}</span>
                  </div>
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('contact');
              } else {
                window.location.hash = 'contact';
              }
            }}
            style={{
              padding: '9px 20px',
              backgroundColor: '#FFFFFF',
              color: '#160F0C',
              border: '1px solid #DED9D6',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.18s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5F1EE'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            Contact Pharmacist Faculty
          </button>
        </div>

                  {/* 5-Stage Stepper */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0 12px', position: 'relative' }}>
                    {['Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'].map((step, sIdx) => {
                      const isCompleted = sIdx <= 2;
                      return (
                        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: isCompleted ? 'var(--primary)' : 'var(--border)', color: '#FFF', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {sIdx + 1}
                          </div>
                          <span style={{ fontSize: '10px', color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', maxWidth: '60px' }}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
      </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Delivery to: {ord.address || 'Banani, Dhaka'}</span>
                    <strong>Total: ৳{Number(ord.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
      {/* ── 6. TEMPERATURE PROTOCOL MODAL ── */}
      {protocolModalOpen && (
        <div 
          onClick={() => setProtocolModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(22, 15, 12, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #DED9D6',
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setProtocolModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#675C58'
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '14px'
            }}>
              <Snowflake size={12} />
              <span>COLD-CHAIN AUDIT PROTOCOL 2026</span>
            </div>

            <h3 style={{
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontSize: '22px',
              fontWeight: 700,
              color: '#160F0C',
              margin: '0 0 12px 0'
            }}>
              Continuous Thermal Assurance Framework
            </h3>

            <p style={{ fontSize: '13.5px', color: '#675C58', lineHeight: 1.55, marginBottom: '20px' }}>
              Every biologic, antibody, and attenuated vaccine distributed by Pet Maya is packaged inside hermetic vacuum insulation panels (VIP) calibrated to maintain strict 2.0°C – 8.0°C core temperatures for up to 36 hours.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Check size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12.5px', color: '#160F0C' }}>
                  <strong>Digital Datalogger Telemetry:</strong> An NIST-traceable digital sensor logs temperatures once every 10 seconds throughout dispatch.
                </div>
              ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Check size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12.5px', color: '#160F0C' }}>
                  <strong>Zero-Breach Guarantee:</strong> If delivery temperature breaches outside 2°C – 8°C, the batch is quarantined and immediately re-dispatched at no cost.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Check size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12.5px', color: '#160F0C' }}>
                  <strong>QR Serial Authentication:</strong> Scan the tamper-evident seal on delivery to inspect batch expiry, manufacturer DIN, and transit telemetry logs.
                </div>
              </div>
            </div>

            <button
              onClick={() => setProtocolModalOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9999px',
                backgroundColor: '#160F0C',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}

      {/* ── 7. RESPONSIVE MEDIA QUERIES ── */}
      <style>{`
        @media (max-width: 1100px) {
          .shop-main-layout {
            grid-template-columns: 1fr !important;
          }
          .shop-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .shop-coldchain-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .shop-products-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
