import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Snowflake, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Minus, 
  FileText, 
  Check, 
  Clock, 
  Lock, 
  PhoneCall, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  Radio, 
  Zap, 
  Calendar,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Heart,
  Thermometer,
  FileCheck
} from 'lucide-react';

export default function CartPage({ onNavigate }) {
  const { 
    cart = [], 
    updateCartQty, 
    removeFromCart, 
    clearCart, 
    addToCart, 
    appliedCoupon, 
    applyCoupon, 
    openModal, 
    showToast,
    pets = []
  } = useApp();
  const { currentUser } = useAuth();

  const activePet = pets[0];
  const defaultPatientLabel = activePet 
    ? `${activePet.name} (${activePet.species || activePet.breed || 'Companion'}${activePet.weight ? ' • ' + activePet.weight + 'kg' : ''})` 
    : 'Companion Patient';

  // Normalize cart items with clinical styling fallbacks
  const items = (cart && cart.length > 0) ? cart.map(item => ({
    id: item.id,
    name: item.name,
    specBadge: item.specBadge || item.category || 'Clinical Form',
    badgeType: item.badgeType || (item.category === 'cold_chain' ? 'mint' : (item.isRx ? 'purple' : 'gray')),
    subtitle: item.subtitle || `${item.brand || 'Pet Maya Clinical'} • Verified Batch`,
    vaultTemp: item.vaultTemp || (item.category === 'cold_chain' || item.isRx ? 'Calibrated 4.2°C Vault' : null),
    patient: item.patient || defaultPatientLabel,
    clinicianApproval: item.clinicianApproval || 'Dr. Vance Approved',
    price: Number(item.price) || 500,
    qty: Number(item.qty || item.quantity) || 1,
    image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    rxType: item.rxType || (item.isRx ? 'Rx Only' : 'Clinical Care')
  })) : [];
  
  // Shipping Option: 'priority' (150 BDT) vs 'standard' (Free 0 BDT)
  const [shippingMethod, setShippingMethod] = useState('standard');

  // Coupon / Token state
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');

  // Protocol Modal state
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Quantity updates
  const handleUpdateQty = (id, delta) => {
    updateCartQty(id, delta);
  };

  // Remove item
  const handleRemove = (id) => {
    removeFromCart(id);
    showToast('Prescription formulation removed from bag', 'info');
  };

  const handleBrowseDispensary = () => {
    if (onNavigate) onNavigate('shop');
    else window.location.hash = 'shop';
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const freeShippingThreshold = 2500;
  const isQualifiedColdChain = subtotal >= freeShippingThreshold;
  const shippingCost = shippingMethod === 'priority' ? 150 : 0;
  const couponDiscount = typeof appliedCoupon?.discount === 'number' ? Math.round(subtotal * appliedCoupon.discount) : 0;
  
  // Total Honorarium
  const totalHonorarium = Math.max(0, subtotal - couponDiscount + shippingCost);

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput.trim());
  };

  // Proceed to Checkout
  const handleProceedCheckout = () => {
    if (items.length === 0) {
      showToast('Your dispensary bag is empty', 'warning');
      return;
    }
    handleRoute('checkout');
  };

  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  return (
    <div style={{
      backgroundColor: '#FAF7F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
      paddingBottom: '96px'
    }}>

      {/* ════════════════════════════════════════════════════════════════
          1. CLINICAL DISPENSARY STATUS HEADER BAR
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: '#F3EFEB',
        borderBottom: '1px solid #E5DFD9',
        padding: '10px 24px'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          fontSize: '11px',
          fontWeight: 600,
          color: '#525B57',
          letterSpacing: '0.08em'
        }}>
          {/* Left: Active Prescription & Vault Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981'
            }} />
            <span style={{ textTransform: 'uppercase' }}>
              CLINICAL DISPENSARY • ACTIVE PRESCRIPTIONS & COLD-CHAIN VAULT DISPATCH
            </span>
          </div>

          {/* Right: Telemetry readouts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Thermometer size={13} color="#0D9488" />
              <span>Vault Temp: 4.1°C Steady</span>
            </span>
            <span style={{ color: '#D1D5DB' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} color="#0D9488" />
              <span>GMP Batch Logged</span>
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. MAIN 2-COLUMN DISPENSARY BAG CONTENT
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '32px 24px 0 24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 410px',
          gap: '36px',
          alignItems: 'start'
        }} className="cart-grid-layout">

          {/* ────────────────────────────────────────────────────────────
              LEFT COLUMN: DISPENSARY ITEMS & DISPATCH PROTOCOL
              ──────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* A. Hermetic Cold-Chain Courier Tier Progress */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE5DF',
              borderRadius: '16px',
              padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(22, 15, 12, 0.02)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#E8F5F3',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Snowflake size={18} />
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#160F0C',
                    letterSpacing: '-0.01em'
                  }}>
                    Hermetic Cold-Chain Courier
                  </h3>
                </div>

                {/* Tier Tag */}
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#E6F4F1',
                  color: '#0D9488',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: '1px solid #C4E9E2',
                  letterSpacing: '0.04em'
                }}>
                  {isQualifiedColdChain 
                    ? `TIER UNLOCKED: ৳${subtotal.toLocaleString()} / ৳2,500` 
                    : `TIER PROGRESS: ৳${subtotal.toLocaleString()} / ৳2,500`}
                </div>
              </div>

              <p style={{
                fontSize: '13px',
                color: '#6B7280',
                margin: '8px 0 14px 0',
                lineHeight: 1.5
              }}>
                Complimentary vacuum-sealed temperature-controlled courier is qualified for this clinical dispatch batch.
              </p>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '7px',
                backgroundColor: '#E5E7EB',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%`,
                  height: '100%',
                  backgroundColor: '#1B5450',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              {/* Progress Labels */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                fontSize: '11.5px',
                color: '#6B7280'
              }}>
                <span>Threshold Qualified (≥ ৳2,500)</span>
                <span style={{ fontWeight: 600, color: '#1B5450' }}>
                  100% Hermetic Integrity Guaranteed
                </span>
              </div>
            </div>

            {/* B. Prescribed Items Section Header */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#160F0C',
                  margin: 0
                }}>
                  Prescribed Items in Dispensary Bag ({items.length})
                </h2>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  letterSpacing: '0.08em'
                }}>
                  VAULT BATCH REF: 9PH-8921-DH
                </span>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EBE5DF',
                  padding: '48px 24px',
                  textAlign: 'center'
                }}>
                  <FileText size={42} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#160F0C', marginBottom: '6px' }}>
                    Dispensary Bag is Empty
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#6B7280', marginBottom: '20px' }}>
                    No active prescriptions or wellness items currently staged for dispatch.
                  </p>
                  <button
                    onClick={handleBrowseDispensary}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Browse Clinical Dispensary
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="cart-item-card"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #EAE4DE',
                        borderRadius: '14px',
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '20px',
                        boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Left: Product Thumbnail with badge */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flex: 1,
                        minWidth: 0
                      }}>
                        <div style={{
                          position: 'relative',
                          width: '76px',
                          height: '76px',
                          flexShrink: 0,
                          borderRadius: '10px',
                          backgroundColor: '#F7F4F0',
                          overflow: 'hidden',
                          border: '1px solid #EBE5DF'
                        }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          {/* Rx Overlay Badge */}
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            backgroundColor: 'rgba(22, 15, 12, 0.85)',
                            color: '#FFFFFF',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '8.5px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backdropFilter: 'blur(4px)',
                            letterSpacing: '0.04em'
                          }}>
                            {item.rxType}
                          </div>
                        </div>

                        {/* Middle Info Column */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Title + Weight/Type Badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <h4 style={{
                              fontSize: '15.5px',
                              fontWeight: 700,
                              color: '#160F0C',
                              margin: 0,
                              lineHeight: 1.3
                            }}>
                              {item.name}
                            </h4>
                            <span style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: item.badgeType === 'purple' 
                                ? '#F3E8FF' 
                                : item.badgeType === 'mint' 
                                  ? '#E6F4F1' 
                                  : '#F3F4F6',
                              color: item.badgeType === 'purple' 
                                ? '#7E22CE' 
                                : item.badgeType === 'mint' 
                                  ? '#0D9488' 
                                  : '#4B5563',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              border: item.badgeType === 'purple'
                                ? '1px solid #E9D5FF'
                                : item.badgeType === 'mint'
                                  ? '1px solid #C4E9E2'
                                  : '1px solid #E5E7EB'
                            }}>
                              {item.specBadge}
                            </span>
                          </div>

                          {/* Subtitle & Vault/Exp telemetry */}
                          <div style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '6px'
                          }}>
                            <span>{item.subtitle}</span>
                            {item.vaultTemp && (
                              <>
                                <span style={{ color: '#D1D5DB' }}>•</span>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  color: '#0D9488',
                                  fontWeight: 600
                                }}>
                                  <Thermometer size={12} />
                                  {item.vaultTemp}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Patient & Clinician Row */}
                          <div style={{
                            fontSize: '12px',
                            color: '#4B5563',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🐾</span>
                              <span style={{ fontWeight: 600 }}>{item.patient}</span>
                            </span>
                            <span style={{ color: '#D1D5DB' }}>•</span>
                            <span style={{
                              color: '#10B981',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <CheckCircle2 size={12} />
                              {item.clinicianApproval}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Area: Price + Quantity Stepper + Trash */}
                      <div
                        className="cart-item-actions"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                          flexShrink: 0
                        }}
                      >
                        {/* Price */}
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#160F0C',
                          textAlign: 'right',
                          minWidth: '70px',
                          fontFamily: 'var(--font-sans, sans-serif)'
                        }}>
                          ৳{(item.price * item.qty).toLocaleString()}
                        </div>

                        {/* Quantity Stepper */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            aria-label="Decrease quantity"
                            style={{
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#6B7280',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{
                            padding: '0 8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#160F0C',
                            minWidth: '20px',
                            textAlign: 'center'
                          }}>
                            {item.qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            aria-label="Increase quantity"
                            style={{
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#6B7280',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          aria-label="Remove item"
                          title="Remove formulation"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#9CA3AF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#EF4444';
                            e.currentTarget.style.backgroundColor = '#FEE2E2';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = '#9CA3AF';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* C. Automated Digital Health Passport Sync Banner */}
            <div style={{
              backgroundColor: '#EDF7F6',
              border: '1px solid #CCE7E3',
              borderRadius: '14px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#D7EFEA',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <FileCheck size={18} />
              </div>
              <div>
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#134E4A',
                  margin: '0 0 4px 0'
                }}>
                  Automated Digital Health Passport Sync
                </h4>
                <p style={{
                  fontSize: '13px',
                  color: '#2D5D5A',
                  margin: 0,
                  lineHeight: 1.55
                }}>
                  These items are linked to <strong>{activePet?.name || 'Your Companion'} ({activePet?.microchip ? '#' + activePet.microchip : 'Active Profile'})</strong>. Upon courier handoff, dose administration schedules, anti-parasitic calendar reminders, and vaccine batch records will automatically synchronize with {activePet?.name || 'your companion'}'s lifelong veterinary health vault.
                </p>
              </div>
            </div>

            {/* D. Dispatch Protocol & Cold-Chain Tier Section */}
            <div style={{ marginTop: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '19px',
                  fontWeight: 700,
                  color: '#160F0C',
                  margin: 0
                }}>
                  Dispatch Protocol & Cold-Chain Tier
                </h3>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: '#E6F4F1',
                  color: '#0D9488',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #C4E9E2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Radio size={11} />
                  Continuous RFID Telemetry
                </span>
              </div>
              
              <p style={{
                fontSize: '13px',
                color: '#6B7280',
                margin: '0 0 16px 0'
              }}>
                Vaccines and sensitive biologics are sealed in insulated vacuum pods with built-in electronic threshold dataloggers.
              </p>

              {/* 2 Selectable Shipping Options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px'
              }}>
                {/* Option 1: Priority Courier (৳150) */}
                <div
                  onClick={() => setShippingMethod('priority')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: shippingMethod === 'priority' ? '2px solid #1B5450' : '1px solid #EBE5DF',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: shippingMethod === 'priority' ? '0 4px 12px rgba(27, 84, 80, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: shippingMethod === 'priority' ? '5px solid #1B5450' : '2px solid #D1D5DB',
                        backgroundColor: '#FFFFFF'
                      }} />
                      <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C' }}>
                        Hermetic Cold-Chain Courier
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C' }}>
                      ৳150
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 10px 26px', lineHeight: 1.45 }}>
                    Banani, Gulshan & Baridhara priority rapid courier. Active temperature tracking link provided.
                  </p>
                  <div style={{
                    marginLeft: '26px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Zap size={12} />
                    <span>Est. Delivery: Today, 3:45 PM</span>
                  </div>
                </div>

                {/* Option 2: Standard Refrigerated Van (Free - Default) */}
                <div
                  onClick={() => setShippingMethod('standard')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: shippingMethod === 'standard' ? '2px solid #1B5450' : '1px solid #EBE5DF',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: shippingMethod === 'standard' ? '0 4px 12px rgba(27, 84, 80, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: shippingMethod === 'standard' ? '5px solid #1B5450' : '2px solid #D1D5DB',
                        backgroundColor: '#FFFFFF'
                      }} />
                      <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C' }}>
                        Hermetic Cold-Chain Courier
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>
                      Free
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 10px 26px', lineHeight: 1.45 }}>
                    Next-day refrigerated van logistics. Calibrated dry-gel insulated carrier pods.
                  </p>
                  <div style={{
                    marginLeft: '26px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#525B57',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Calendar size={12} />
                    <span>Tomorrow, 10:00 AM - 1:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Cold-Chain Assurance Guarantee Banner */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE5DF',
                borderRadius: '12px',
                padding: '14px 18px',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} color="#10B981" />
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C', marginRight: '8px' }}>
                      Cold-Chain Assurance Guarantee
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Active vacuum insulated pod with digital logger ensures continuous 2°C - 8°C transit.
                    </span>
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #E5E7EB'
                }}>
                  ISO 9001:2015
                </div>
              </div>
            </div>

            {/* E. Attending Clinician Approval Bar */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE5DF',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80"
                  alt="Dr. Evelyn Vance"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #E5E7EB'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C' }}>
                      Hermetic Cold-Chain Courier
                    </span>
                    <CheckCircle2 size={14} color="#10B981" />
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                    Attending Veterinary Clinician • Pet Maya Care Board. Pre-verified active prescription. No client upload required.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowProtocolModal(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#0D9488',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 0'
                }}
              >
                <span>View Protocol</span>
                <span>→</span>
              </button>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────────────
              RIGHT COLUMN: DISPENSING SUMMARY & ACCREDITATIONS
              ──────────────────────────────────────────────────────────── */}
          <div style={{
            position: 'sticky',
            top: '84px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>

            {/* 1. Dispensing Summary Box */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE5DF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(22, 15, 12, 0.03)'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '21px',
                  fontWeight: 700,
                  color: '#160F0C',
                  margin: 0
                }}>
                  Dispensing Summary
                </h3>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  padding: '3px 9px',
                  borderRadius: '9999px'
                }}>
                  {items.length} Formulations
                </span>
              </div>

              {/* Line Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Prescription Formulations Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#160F0C' }}>
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#0D9488" />
                    <span>Cold-Chain Thermal Packaging</span>
                  </span>
                  <span style={{ color: '#0D9488', fontWeight: 600 }}>
                    Free ( ৳0 )
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <span>Veterinary Formulation Check</span>
                  </span>
                  <span style={{ fontWeight: 600, color: '#160F0C' }}>
                    Included
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Dispatch Logistics (Banani Vault)</span>
                  <span style={{ fontWeight: 600, color: shippingCost === 0 ? '#10B981' : '#160F0C' }}>
                    {shippingCost === 0 ? 'Free' : `৳${shippingCost}`}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: '#EBE5DF', margin: '18px 0' }} />

              {/* Clinical Voucher / Partner Token */}
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#6B7280',
                  letterSpacing: '0.08em',
                  marginBottom: '6px'
                }}>
                  CLINICAL VOUCHER / PARTNER TOKEN
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter token code"
                    style={{
                      flex: 1,
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 600,
                      color: '#160F0C',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#E5E7EB',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#160F0C',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#0D9488',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>✓</span>
                    <span>10% Wellness care credit applied at invoice settlement</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: '#EBE5DF', margin: '18px 0' }} />

              {/* Total Honorarium */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <div>
                  <h4 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#160F0C',
                    margin: 0
                  }}>
                    Total Honorarium
                  </h4>
                  <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                    Includes VAT • Cold-Chain Inspected
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#160F0C',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  ৳{totalHonorarium.toLocaleString()}
                </div>
              </div>

              {/* Proceed to Secure Checkout Button */}
              <button
                onClick={handleProceedCheckout}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 15, 12, 0.15)',
                  transition: 'transform 0.15s ease, background-color 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#261B16';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#160F0C';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Proceed to Secure Checkout</span>
                <Lock size={15} />
              </button>

              {/* Return to Shop Link */}
              <button
                onClick={() => handleRoute('shop')}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#525B57',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  marginTop: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '6px 0',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#160F0C'}
                onMouseLeave={e => e.currentTarget.style.color = '#525B57'}
              >
                ← Continue Browsing Care Formulary
              </button>

              {/* Pharmacist Inspection Note */}
              <div style={{
                backgroundColor: '#F3F9F8',
                border: '1px solid #D5EAE7',
                borderRadius: '10px',
                padding: '12px 14px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <FileText size={15} color="#0D9488" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{
                  fontSize: '11.5px',
                  color: '#374151',
                  margin: 0,
                  lineHeight: 1.45
                }}>
                  All prescription items are inspected by our Chief Pharmacist prior to refrigerated vehicle handoff.
                </p>
              </div>
            </div>

            {/* 2. Accredited Clinical Dispatch Row */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE5DF',
              borderRadius: '14px',
              padding: '16px 14px',
              boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)'
            }}>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                fontWeight: 700,
                color: '#9CA3AF',
                letterSpacing: '0.1em',
                textAlign: 'center',
                marginBottom: '12px',
                textTransform: 'uppercase'
              }}>
                ACCREDITED CLINICAL DISPATCH
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: '#E8F5F3',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Stethoscope size={14} />
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#374151' }}>
                    AAHA Dispense
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: '#E8F5F3',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Snowflake size={14} />
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#374151' }}>
                    Hermetic Logged
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: '#E8F5F3',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShieldCheck size={14} />
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#374151' }}>
                    256-Bit TLS
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Dispensary Desk Dhaka Live Help Card */}
            <div style={{
              backgroundColor: '#FAF5F2',
              border: '1px solid #EBE5DF',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#D1FAE5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PhoneCall size={16} />
                </div>
                <div>
                  <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Dispensary Desk Dhaka
                  </h5>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    Available 8 AM - 11 PM
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowConnectModal(true);
                  showToast('Connecting with Dispensary Pharmacist on Duty...', 'info');
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#0D9488',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Connect
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. PROTOCOL DETAILS MODAL
          ════════════════════════════════════════════════════════════════ */}
      {showProtocolModal && (
        <div
          onClick={() => setShowProtocolModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(22, 15, 12, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#E6F4F1',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Thermometer size={20} />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Hermetic Cold-Chain Protocol
                </h3>
              </div>
              <button
                onClick={() => setShowProtocolModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#9CA3AF'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
              All biologics, rabies vaccines, and temperature-sensitive antiparasitics dispatched by Pet Maya are packed in medical-grade hermetic polyurethane pods calibrated strictly to <strong>2.0°C – 8.0°C</strong>.
            </p>

            <div style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              padding: '14px',
              margin: '16px 0',
              border: '1px solid #E5E7EB',
              fontSize: '12.5px',
              color: '#374151'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Clinical Telemetry Checklist:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                <li>Continuous RFID & BLE thermal data-logger inside package.</li>
                <li>Digital temperature seal verified upon doorstep handoff.</li>
                <li>Instant sync to {activePet?.name || 'companion'}'s digital medical passport records.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowProtocolModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#160F0C',
                color: '#FFFFFF',
                borderRadius: '9999px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          4. DISPENSARY DESK CONNECT MODAL
          ════════════════════════════════════════════════════════════════ */}
      {showConnectModal && (
        <div
          onClick={() => setShowConnectModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(22, 15, 12, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#D1FAE5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PhoneCall size={18} />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '19px',
                    fontWeight: 700,
                    margin: 0
                  }}>
                    Dispensary Desk Dhaka
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                    ● Pharmacist On Duty: Dr. Navid Rahman, PharmD
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#9CA3AF'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6, marginBottom: '16px' }}>
              Have questions regarding formulation dosage, dietary transitions, or cold-chain delivery schedules for {activePet?.name || 'your companion'}?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <a
                href="tel:+8801700000000"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600
                }}
              >
                <PhoneCall size={15} />
                <span>Call Clinical Hotline (+880 1700-000000)</span>
              </a>

              <button
                onClick={() => {
                  setShowConnectModal(false);
                  openModal('teleconsult');
                }}
                style={{
                  padding: '12px',
                  backgroundColor: '#E6F4F1',
                  color: '#0D9488',
                  borderRadius: '9999px',
                  border: '1px solid #C4E9E2',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Start Telehealth Consultation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

