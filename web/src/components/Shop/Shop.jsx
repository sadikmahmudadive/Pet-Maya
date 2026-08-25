import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  ShoppingCart, 
  Truck, 
  Plus,
  PackageCheck
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER & SEARCH ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>Pet Maya Store &amp; Pharmacy</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Veterinary-grade diets, genuine prescription medications, smart GPS collars &amp; supplies.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {orders.length > 0 && (
            <button className="btn-ghost" onClick={() => openModal('orderTracker', orders[0])}>
              <PackageCheck size={16} />
              <span>Track Orders ({orders.length})</span>
            </button>
          )}
          <button className="btn-primary" onClick={() => openModal('cart')}>
            <ShoppingCart size={16} />
            <span>Open Cart</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & CATEGORIES ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            type="text" 
            className="input-clean" 
            placeholder="Search food, Simparica, smart GPS collars, beds..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '42px' }}
          />
        </div>
      </div>

      <div className="chip-row">
        <button className={`chip-pill ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All Items</button>
        <button className={`chip-pill ${selectedCategory === 'food' ? 'active' : ''}`} onClick={() => setSelectedCategory('food')}>🥩 Food &amp; Diets</button>
        <button className={`chip-pill ${selectedCategory === 'pharma' ? 'active' : ''}`} onClick={() => setSelectedCategory('pharma')}>💊 Pharmacy &amp; Rx</button>
        <button className={`chip-pill ${selectedCategory === 'tech' ? 'active' : ''}`} onClick={() => setSelectedCategory('tech')}>🛰️ GPS &amp; Tech</button>
        <button className={`chip-pill ${selectedCategory === 'supplies' ? 'active' : ''}`} onClick={() => setSelectedCategory('supplies')}>🛏️ Beds &amp; Supplies</button>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredProducts.map(product => (
          <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <img 
              src={product.image} 
              alt={product.name} 
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="badge badge-green">{product.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800 }}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <span>{product.rating}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({product.ratingCount})</span>
                </div>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 800, marginTop: '6px' }}>{product.name}</h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                {product.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Price</span>
                <strong style={{ fontSize: '18px', color: 'var(--primary)' }}>${product.price.toFixed(2)}</strong>
              </div>

              <button className="btn-primary" onClick={() => addToCart(product, 1)}>
                <Plus size={16} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
