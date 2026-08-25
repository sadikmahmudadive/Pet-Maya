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
  X
} from 'lucide-react';

export default function Shop() {
  const { products, addToCart, openModal, orders } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderTrackingModal, setOrderTrackingModal] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesQuery = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCat = true;
    if (selectedCategory !== 'all') {
      const cat = (p.category || '').toLowerCase();
      if (selectedCategory === 'food') matchesCat = cat.includes('food') || cat.includes('nutri') || cat.includes('diet');
      else if (selectedCategory === 'pharma') matchesCat = cat.includes('pharma') || cat.includes('med') || p.isRx;
      else if (selectedCategory === 'tech') matchesCat = cat.includes('tech') || cat.includes('collar') || cat.includes('gps');
      else if (selectedCategory === 'supplies') matchesCat = cat.includes('suppl') || cat.includes('bed') || cat.includes('toy');
    }

    return matchesQuery && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1120px', margin: '0 auto', width: '100%' }}>
      {/* ── HEADER & SEARCH ── */}
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

      {/* ── SEARCH & CATEGORIES ── */}
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
          <button className={`chip-pill ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All</button>
          <button className={`chip-pill ${selectedCategory === 'food' ? 'active' : ''}`} onClick={() => setSelectedCategory('food')}>🥣 Diets &amp; Nutrition</button>
          <button className={`chip-pill ${selectedCategory === 'pharma' ? 'active' : ''}`} onClick={() => setSelectedCategory('pharma')}>💊 Pharmacy &amp; Rx</button>
          <button className={`chip-pill ${selectedCategory === 'tech' ? 'active' : ''}`} onClick={() => setSelectedCategory('tech')}>📍 Smart Tech</button>
          <button className={`chip-pill ${selectedCategory === 'supplies' ? 'active' : ''}`} onClick={() => setSelectedCategory('supplies')}>🛏️ Beds &amp; Supplies</button>
        </div>
      </div>

      {/* ── PRODUCT GRID (APPLE STORE STYLE) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {filteredProducts.map((p) => (
          <div 
            key={p.id} 
            className="apple-promo-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '22px', textAlign: 'left', alignItems: 'stretch' }}
          >
            <div 
              style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '14px', background: '#FFFFFF', cursor: 'pointer' }}
              onClick={() => setSelectedProduct(p)}
            >
              <img 
                src={p.image} 
                alt={p.name} 
                style={{ width: '100%', height: 180, objectFit: 'contain', padding: '12px', transition: 'transform 0.3s ease' }} 
              />
              {p.isRx && (
                <span className="badge badge-red" style={{ position: 'absolute', top: 10, left: 10 }}>
                  Rx Required
                </span>
              )}
            </div>

            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {p.category}
            </span>

            <h3 
              style={{ fontSize: '16.5px', fontWeight: 700, margin: '4px 0 6px', lineHeight: 1.3, cursor: 'pointer' }}
              onClick={() => setSelectedProduct(p)}
            >
              {p.name}
            </h3>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '14px', flex: 1 }}>
              {p.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
              <div>
                <strong style={{ fontSize: '18px', fontWeight: 700 }}>${p.price.toFixed(2)}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Star size={11} fill="#F59E0B" color="#F59E0B" />
                  <span>{p.rating || 4.9}</span>
                  <span>({p.ratingCount || 100})</span>
                </div>
              </div>

              <button 
                className="apple-btn-blue" 
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => addToCart(p)}
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>

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
              ${selectedProduct.price.toFixed(2)}
            </strong>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              {selectedProduct.description}
            </p>

            <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '20px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <ShieldCheck size={15} color="#10B981" />
                <span>Veterinary Quality Certified</span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>Authentic formulation. Shipped in temperature-monitored medical packaging.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="apple-btn-blue" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                <Plus size={16} />
                <span>Add to Shopping Bag</span>
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
                <div key={ord.id || idx} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
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
                    <strong>Total: ${(ord.total || 0).toFixed(2)}</strong>
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
