import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  ShoppingCart, 
  Truck, 
  Plus,
  PackageCheck,
  ChevronRight,
  ShieldCheck,
  Info,
  X,
  Heart        // NEW – wishlist
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

// ── Category icon tiles shown above the product grid ───────────────────────
const CATEGORY_TILES = [
  { id: 'food',     emoji: '🥩', label: 'Food',       subtitle: 'Diets & Nutrition' },
  { id: 'pharma',   emoji: '💊', label: 'Pharmacy',   subtitle: 'Rx & Medications'  },
  { id: 'tech',     emoji: '📡', label: 'Smart Tech',  subtitle: 'GPS & Wearables'   },
  { id: 'supplies', emoji: '🛋️', label: 'Supplies',   subtitle: 'Beds & Toys'       },
];

// ── Delivery ETA helper ─────────────────────────────────────────────────────
function getDeliveryETA(p) {
  const cat = (p.category || '').toLowerCase();
  if (cat.includes('pharma') || cat.includes('med') || p.isRx)
    return { label: 'Express (24h)',      color: '#10B981' };
  if (cat.includes('food') || cat.includes('nutri'))
    return { label: 'Standard (3–5 days)', color: '#6B7280' };
  return   { label: 'Standard',           color: '#6B7280' };
}

// ── Stock badge helper ──────────────────────────────────────────────────────
function getStockInfo(p, idx) {
  if (p.stock !== undefined) {
    if (p.stock === 0)   return { label: 'Out of Stock',            color: '#EF4444', bg: 'rgba(239,68,68,0.10)'   };
    if (p.stock <= 10)   return { label: `Low Stock (${p.stock} left)`, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    return                      { label: 'In Stock',                color: '#10B981', bg: 'rgba(16,185,129,0.10)'  };
  }
  // Simulate: even index → Low Stock, odd → In Stock
  if (idx % 2 === 0)     return { label: 'Low Stock (5 left)',      color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  };
  return                        { label: 'In Stock',                color: '#10B981', bg: 'rgba(16,185,129,0.10)'  };
}

// ── Simple toast component ──────────────────────────────────────────────────
function Toast({ message, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2200);
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

  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedCategory,   setSelectedCategory]   = useState('all');
  const [selectedProduct,    setSelectedProduct]    = useState(null);
  const [orderTrackingModal, setOrderTrackingModal] = useState(false);

  // ── NEW STATE ────────────────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState(new Set()); // Set of product IDs
  const [toastMsg, setToastMsg] = useState(null);      // toast text | null

  // ── Wishlist toggle ──────────────────────────────────────────────────────
  function toggleWishlist(p) {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
        setToastMsg('Removed from Wishlist');
      } else {
        next.add(p.id);
        setToastMsg('Added to Wishlist ❤️');
      }
      return next;
    });
  }

  const filteredProducts = products.filter(p => {
    const matchesQuery = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCat = true;
    if (selectedCategory !== 'all') {
      const cat = (p.category || '').toLowerCase();
      if (selectedCategory === 'food')          matchesCat = cat.includes('food') || cat.includes('nutri') || cat.includes('diet');
      else if (selectedCategory === 'pharma')   matchesCat = cat.includes('pharma') || cat.includes('med') || p.isRx;
      else if (selectedCategory === 'tech')     matchesCat = cat.includes('tech') || cat.includes('collar') || cat.includes('gps');
      else if (selectedCategory === 'supplies') matchesCat = cat.includes('suppl') || cat.includes('bed') || cat.includes('toy');
    }

    return matchesQuery && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      {/* ── HEADER & SEARCH ── */}
      <AppleReveal duration={0.8} yOffset={25}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span className="apple-card-eyebrow" style={{ color: '#10B981' }}>Pharmacy &amp; Supplies</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>Pet Shop</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Veterinary-grade diets, genuine prescription medications, smart GPS collars &amp; supplies.</p>
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

      {/* ── SEARCH & CATEGORIES ── */}
      <AppleReveal delay={0.1} yOffset={25}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            type="text" 
            className="input-clean" 
            placeholder="Search food, Simparica, smart GPS collars..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div className="chip-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={`chip-pill ${selectedCategory === 'all'      ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All</button>
          <button className={`chip-pill ${selectedCategory === 'food'     ? 'active' : ''}`} onClick={() => setSelectedCategory('food')}>Diets &amp; Nutrition</button>
          <button className={`chip-pill ${selectedCategory === 'pharma'   ? 'active' : ''}`} onClick={() => setSelectedCategory('pharma')}>Pharmacy &amp; Rx</button>
          <button className={`chip-pill ${selectedCategory === 'tech'     ? 'active' : ''}`} onClick={() => setSelectedCategory('tech')}>Smart Tech</button>
          <button className={`chip-pill ${selectedCategory === 'supplies' ? 'active' : ''}`} onClick={() => setSelectedCategory('supplies')}>Beds &amp; Supplies</button>
        </div>
      </div>
      </AppleReveal>

      {/* ── NEW: CATEGORY ICON TILES ── */}
      <AppleReveal delay={0.15} yOffset={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
          {CATEGORY_TILES.map(tile => {
            const isActive = selectedCategory === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => setSelectedCategory(isActive ? 'all' : tile.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
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
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{tile.emoji}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isActive ? '#10B981' : 'var(--text-main)' }}>{tile.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tile.subtitle}</span>
              </button>
            );
          })}
        </div>
      </AppleReveal>

      {/* ── PRODUCT GRID (APPLE STORE STYLE) ── */}
      <AppleStagger className="apple-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {isProductsLoading && products.length === 0 ? (
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="apple-promo-card" style={{ opacity: 0.6 }}>
              <div className="apple-card-image-box" style={{ background: 'var(--surface-alt)' }} />
              <div style={{ width: '70%', height: 18, background: 'var(--surface-alt)', borderRadius: 4, margin: '14px 0 8px' }} />
              <div style={{ width: '90%', height: 14, background: 'var(--surface-alt)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: '50%', height: 16, background: 'var(--surface-alt)', borderRadius: 4, marginTop: 'auto' }} />
            </div>
          ))
        ) : (
          filteredProducts.map((p, idx) => {
            const stock    = getStockInfo(p, idx);
            const delivery = getDeliveryETA(p);
            const isWished = wishlist.has(p.id);
            const isOOS    = p.stock === 0;

            return (
              <div key={p.id} className="apple-promo-card">
                
                <div className="apple-card-image-box" onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer', background: (p.category || '').includes('Food') ? '#f3f4f6' : '#f8fafc' }}>
                  <img src={p.image} alt={p.name} />
                  {p.isRx && (
                    <span className="badge badge-red" style={{ position: 'absolute', top: 14, left: 14, zIndex: 10 }}>
                      Rx
                    </span>
                  )}
                </div>

                <div className="apple-card-dots">
                  <div className="apple-card-dot" style={{ background: '#3b82f6' }} />
                  <div className="apple-card-dot" style={{ background: '#10b981' }} />
                  <div className="apple-card-dot" style={{ background: '#f43f5e' }} />
                </div>

                <h3 className="apple-card-title" onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>
                  {p.name}
                </h3>

                <p className="apple-card-desc">
                  {p.description}
                </p>

                <div className="apple-card-price" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 6px' }}>
                  ৳{Number(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* ── NEW: Stock Badge ── */}
                <div style={{ marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: stock.bg,
                    color: stock.color,
                  }}>
                    {stock.label}
                  </span>
                </div>

                {/* ── NEW: Delivery ETA Badge ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                  <Truck size={11} color={delivery.color} />
                  <span style={{ fontSize: '11px', color: delivery.color, fontWeight: 600 }}>{delivery.label}</span>
                </div>

                <div className="apple-card-actions" style={{ alignItems: 'center' }}>
                  <button
                    className="apple-btn-blue"
                    style={{ fontSize: '13px', padding: '6px 16px', opacity: isOOS ? 0.5 : 1 }}
                    onClick={() => setSelectedProduct(p)}
                    disabled={isOOS}
                  >
                    Learn more
                  </button>

                  {/* ── NEW: Wishlist Heart Button ── */}
                  <button
                    onClick={() => toggleWishlist(p)}
                    title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: '1.5px solid',
                      borderColor: isWished ? '#EF4444' : 'var(--border)',
                      background: isWished ? 'rgba(239,68,68,0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      flexShrink: 0,
                    }}
                  >
                    <Heart size={15} color={isWished ? '#EF4444' : 'var(--text-muted)'} fill={isWished ? '#EF4444' : 'none'} />
                  </button>

                  <button className="apple-link-cta" style={{ fontSize: '14px' }} onClick={() => addToCart(p)}>
                    <span>Buy</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                
              </div>
            );
          })
        )}
      </AppleStagger>

      {/* ── PRODUCT DETAILS MODAL ── */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-dialog" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge badge-green">{selectedProduct.category}</span>
              <button className="icon-btn" onClick={() => setSelectedProduct(null)}><X size={18} /></button>
            </div>

            <div style={{ background: '#FFF', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
              <img src={selectedProduct.image} alt={selectedProduct.name} style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>{selectedProduct.name}</h2>
            <strong style={{ fontSize: '22px', color: 'var(--primary)', display: 'block', marginBottom: '12px' }}>
              ৳{Number(selectedProduct.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              {selectedProduct.description}
            </p>

            <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <ShieldCheck size={15} color="#10B981" />
                <span>Veterinary Quality Certified</span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>Authentic formulation. Shipped in temperature-monitored medical packaging.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-ghost" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                <Plus size={16} />
                <span>Add to Bag</span>
              </button>

              <button 
                className="apple-btn-blue" 
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                  openModal('checkout', { 
                    subtotal: selectedProduct.price,
                    shipping: selectedProduct.price > 1000 ? 0 : 50.00,
                    total: selectedProduct.price + (selectedProduct.price > 1000 ? 0 : 50.00)
                  });
                }}
              >
                <ShoppingBag size={16} />
                <span>Buy Now</span>
              </button>
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
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Orders &amp; Dispatch Tracking</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time 5-stage pharmacy delivery tracker.</p>
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
                      const isCompleted = sIdx <= 2; // Simulated stage
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
