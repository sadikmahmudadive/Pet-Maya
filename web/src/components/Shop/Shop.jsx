import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  ShoppingBag, 
  Snowflake, 
  Star, 
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
import ProductDetailPage from './ProductDetailPage';

// ── Category Filter Definitions ───────────────────────────────────────────────
const BASE_FILTER_CHIPS = [
  { id: 'all', label: 'All Formulations', filter: null },
  { id: 'canine_rx', label: 'Canine Rx', filter: 'canine_rx' },
  { id: 'feline_care', label: 'Feline Care', filter: 'feline_care' },
  { id: 'cold_chain', label: '❄️ Cold-Chain Biologics', filter: 'cold_chain' },
  { id: 'clinical_diets', label: 'Clinical Diets', filter: 'clinical_diets' },
  { id: 'joint_mobility', label: 'Joint & Mobility', filter: 'joint_mobility' },
];

export default function Shop({ onNavigate }) {
  const { products = [], addToCart, removeFromCart, cart, openModal } = useApp();
  const { currentUser } = useAuth();

  const filterChips = useMemo(() => [
    { id: 'all', label: `All Formulations${products?.length ? ` (${products.length})` : ''}`, filter: null },
    ...BASE_FILTER_CHIPS.slice(1)
  ], [products]);

  // Search & Filter State
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [addedItemMap, setAddedItemMap] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);


  // Handle Quick Add with visual feedback
  const handleQuickAdd = (product, e) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    setAddedItemMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap(prev => ({ ...prev, [product.id]: false }));
    }, 1600);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products];

    // Category filter
    if (selectedFilter !== 'all') {
      list = list.filter(p => p.category === selectedFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.subtag && p.subtag.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [products, selectedFilter, searchQuery, sortBy]);

  // Care Bag calculations
  const cartItems = cart || [];
  const cartFormulationCount = cartItems.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || item.quantity || 1), 0);
  const COURIER_GOAL = 2500;
  const courierProgress = Math.min(100, Math.round((cartSubtotal / COURIER_GOAL) * 100));
  const remainingForCourier = Math.max(0, COURIER_GOAL - cartSubtotal);

  // If a specific product detail page is active
  if (selectedProduct) {
    return (
      <ProductDetailPage 
        productId={selectedProduct.id} 
        onBack={() => setSelectedProduct(null)} 
        onNavigate={onNavigate} 
      />
    );
  }

  return (
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
                color: '#160F0C'
              }}>
                Under 120m Dhaka Dispatch
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. FILTER CAPSULES & SEARCH BAR ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '28px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(222, 217, 214, 0.6)'
        }}>
          {/* Left: Category Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {filterChips.map(chip => {
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

          {/* Right: Search & Sort */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
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
                  onClick={() => setSearchQuery('')}
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

            {/* Sort Select */}
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                <option value="recommended">Clinician Recommended ⌵</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
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

        {/* ── 3. MAIN CATALOG GRID & SIDEBAR LAYOUT ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 350px',
          gap: '28px',
          alignItems: 'start'
        }} className="shop-main-layout">

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
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '20px'
              }} className="shop-products-grid">
                {filteredProducts.map((product) => {
                  const isAdded = !!addedItemMap[product.id];
                  const isCold = product.category === 'cold_chain' || product.badgeType === 'cold' || product.badge?.includes('REFRIGERATED');
                  const isPrescriptionControlled = product.badge?.includes('PRESCRIPTION') || product.isRx;

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
            )}
          </div>

          {/* RIGHT: Sticky Care Bag & Support Sidebar */}
          <div style={{
            position: 'sticky',
            top: '84px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>

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
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0284C7',
                    backgroundColor: '#E0F2FE',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    ৳{COURIER_GOAL.toLocaleString()} Goal
                  </span>
                </div>

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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #F5F1EE'
                      }}
                    >
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
              </div>

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
                <span>Proceed to Clinical Dispatch</span>
                <ArrowRight size={15} />
              </button>

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
                <Stethoscope size={14} color="#45848D" />
                <span>Launch AI Pre-Triage</span>
              </button>
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
                  <div style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#160F0C',
                    letterSpacing: '-0.01em',
                    marginBottom: '2px'
                  }}>
                    2.4°C – 6.1°C
                  </div>
                  <div style={{ fontSize: '11px', color: '#45848D', fontWeight: 600 }}>
                    Real-time audited
                  </div>
                </div>

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
                  src="https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=700&auto=format&fit=crop&q=80"
                  alt="Medical Cold Chain Pod"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

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
