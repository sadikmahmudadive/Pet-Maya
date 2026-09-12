import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingBag, 
  Search, 
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
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

// ── Category icon tiles shown above the product grid ───────────────────────
const CATEGORY_TILES = [
  { id: 'food',     icon: UtensilsCrossed, label: 'Food',       subtitle: 'Diets & Nutrition', color: '#10B981' },
  { id: 'pharma',   icon: Pill,            label: 'Pharmacy',   subtitle: 'Rx & Medications',  color: '#3B82F6' },
  { id: 'tech',     icon: Radio,           label: 'Smart Tech',  subtitle: 'GPS & Wearables',   color: '#8B5CF6' },
  { id: 'supplies', icon: Package,         label: 'Supplies',   subtitle: 'Beds & Toys',       color: '#F59E0B' },
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

// ── Simple toast component ──────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

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

export default function Shop() {
  const { products, isProductsLoading, addToCart, openModal, orders } = useApp();

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

      const matchesRx = !filterRxOnly || p.isRx;
      const matchesStock = !filterInStockOnly || (p.stock === undefined || p.stock > 0);
      const matchesWishlist = !showWishlistOnly || wishlist.has(p.id);

      return matchesQuery && matchesCat && matchesRx && matchesStock && matchesWishlist;
    });

    // Sort order
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (Number(b.discountPct) || 0) - (Number(a.discountPct) || 0));
    }

    return list;
  }, [products, searchQuery, selectedCategory, filterRxOnly, filterInStockOnly, showWishlistOnly, wishlist, sortBy]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || filterRxOnly || filterInStockOnly || showWishlistOnly || sortBy !== 'featured';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
    setFilterRxOnly(false);
    setFilterInStockOnly(false);
    setShowWishlistOnly(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}

      {/* ── HEADER & SHOP UTILITIES ── */}
      <AppleReveal duration={0.8} yOffset={25}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="apple-card-eyebrow" style={{ color: '#10B981', margin: 0 }}>Verified Veterinary Pharmacy &amp; Store</span>
              <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.12)', color: '#10B981', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                Cold-Chain Ready
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Pet Shop &amp; Pharmacy</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Veterinary-grade diets, genuine prescription medications, smart GPS collars, and specialty accessories.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {orders.length > 0 && (
              <button className="btn-ghost" onClick={() => setOrderTrackingModal(true)}>
                <PackageCheck size={15} />
                <span>Track Orders ({orders.length})</span>
              </button>
            )}
            <button className="apple-btn-blue" onClick={() => openModal('cart')}>
              <ShoppingCart size={15} />
              <span>View Bag</span>
            </button>
          </div>
        </div>
      </AppleReveal>

      {/* ── E-COMMERCE VALUE PROPOSITION & TRUST BAR ── */}
      <AppleReveal delay={0.06} yOffset={20}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          background: 'var(--surface-alt)',
          padding: '16px 18px',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-main)' }}>Free Express Shipping</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On all orders over ৳1,000</span>
            </div>
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
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                className="input-clean" 
                placeholder="Search food, Simparica, GPS collar, Purina..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', width: '100%' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
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
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '8px 12px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <option value="featured">Featured (Recommended)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
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
                >
                  Clear All Filters
                </button>
              )}
            </div>

            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>
        </div>
      </AppleReveal>

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

            return (
              <article key={p.id} className="apple-promo-card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Product Image & Badges */}
                <div 
                  className="apple-card-image-box" 
                  onClick={() => setSelectedProduct(p)} 
                  style={{ cursor: 'pointer', background: (p.category || '').includes('food') ? '#f3f4f6' : '#f8fafc', position: 'relative' }}
                >
                  <img src={p.image} alt={p.name} loading="lazy" />
                  
                  {/* Top-Left: Badge or Discount */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
                    {p.badge && (
                      <span style={{ background: '#10B981', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.04em' }}>
                        {p.badge}
                      </span>
                    )}
                    {discountPct && discountPct > 0 && (
                      <span style={{ background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 7px', borderRadius: '6px' }}>
                        SAVE {discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Top-Right: Rx Badge */}
                  {p.isRx && (
                    <span className="badge badge-red" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                      Prescription Rx
                    </span>
                  )}
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
                </div>

                {/* Product Title */}
                <h3 className="apple-card-title" onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer', margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, lineHeight: 1.3 }}>
                  {p.name}
                </h3>

                {/* Product Description snippet */}
                <p className="apple-card-desc" style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px 0', flex: 1 }}>
                  {p.description}
                </p>

                {/* Price Row with Strikethrough Comparison */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0' }}>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                    ৳{Number(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: stock.bg,
                    color: stock.color,
                    display: 'inline-block'
                  }}>
                    {stock.label}
                  </span>
                </div>

                {/* Delivery ETA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
                  <Truck size={12} color={delivery.color} />
                  <span style={{ fontSize: '11px', color: delivery.color, fontWeight: 600 }}>{delivery.label}</span>
                </div>

                {/* Actions Row */}
                <div className="apple-card-actions" style={{ alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <button
                    className="apple-btn-blue"
                    style={{ fontSize: '12.5px', padding: '6px 14px', opacity: isOOS ? 0.5 : 1 }}
                    onClick={() => setSelectedProduct(p)}
                    disabled={isOOS}
                  >
                    Quick View
                  </button>

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
                      className="btn-ghost" 
                      style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '14px', border: '1px solid var(--border)' }} 
                      onClick={() => addToCart(p, 1)}
                      title="Add to Bag"
                    >
                      <Plus size={12} />
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

            {/* Ratings & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#F59E0B' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={14} fill="#F59E0B" color="#F59E0B" />
                ))}
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
                }}
              >
                Overview &amp; Benefits
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
                }}
              >
                Quality Assurance
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
                  </div>
                ) : (
                  <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                    Standard veterinary specifications verified by Pet Maya Clinical Board.
                  </div>
                )}
                {selectedProduct.usageGuide && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                    <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '4px' }}>Recommended Administration:</strong>
                    <span>{selectedProduct.usageGuide}</span>
                  </div>
                )}
              </div>
            )}

            {modalTab === 'guarantee' && (
              <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px' }}>
                  <ShieldCheck size={20} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>Direct Pharma Sourcing</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sourced directly from authorized distributors (Zoetis, Royal Canin, Merck, Purina) with certificate of analysis.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px' }}>
                  <Snowflake size={20} color="#3B82F6" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>Verified Cold-Chain Transit</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vaccines, antibiotics, and biologics travel in insulated thermal cases monitored with digital data loggers.</span>
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
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Subtotal:</span>
                <strong style={{ fontSize: '17px', color: 'var(--primary)' }}>
                  ৳{(Number(selectedProduct.price || 0) * modalQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Delivery to: {ord.address || 'Banani, Dhaka'}</span>
                    <strong>Total: ৳{Number(ord.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
