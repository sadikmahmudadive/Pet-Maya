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
  ChevronRight
} from 'lucide-react';

export default function Shop() {
  const { products, addToCart, openModal, orders } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── HEADER & SEARCH ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span className="apple-card-eyebrow" style={{ color: '#6366F1' }}>Apple &amp; Pet Store</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>Pharmacy &amp; Supplies</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Veterinary-grade diets, genuine prescription medications, smart GPS collars &amp; toys.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {orders.length > 0 && (
            <button className="btn-ghost" onClick={() => openModal('orderTracker', orders[0])}>
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

        <select 
          className="input-clean" 
          style={{ width: 'auto', fontWeight: 600 }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="nutrition">Diets &amp; Nutrition</option>
          <option value="pharmacy">Pharmacy &amp; Rx</option>
          <option value="tech">Smart Collars &amp; Tech</option>
          <option value="comfort">Beds &amp; Accessories</option>
        </select>
      </div>

      {/* ── PRODUCT GRID (APPLE STORE STYLE) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {filteredProducts.map((p) => (
          <div 
            key={p.id} 
            className="apple-promo-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '22px', textAlign: 'left', alignItems: 'stretch' }}
          >
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '14px', background: '#FFFFFF' }}>
              <img 
                src={p.image} 
                alt={p.name} 
                style={{ width: '100%', height: 180, objectFit: 'contain', padding: '12px', transition: 'transform 0.3s ease' }} 
              />
              {p.isRx && (
                <span className="badge badge-red" style={{ position: 'absolute', top: 10, left: 10 }}>
                  Rx Prescription
                </span>
              )}
            </div>

            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {p.category}
            </span>

            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 6px', lineHeight: 1.3 }}>
              {p.name}
            </h3>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '12px' }}>
              {p.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <div>
                <strong style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                  ${p.price.toFixed(2)}
                </strong>
              </div>

              <button 
                className="apple-btn-blue" 
                style={{ padding: '7px 16px', fontSize: '12.5px' }}
                onClick={() => addToCart(p)}
              >
                <Plus size={14} />
                <span>Add to Bag</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
