import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Check,
  CheckCircle2,
  Lock,
  CreditCard,
  Smartphone,
  Wallet,
  Truck,
  FileText,
  AlertTriangle,
  Zap,
  PhoneCall,
  Calendar,
  Thermometer,
  FileCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Snowflake
} from 'lucide-react';

export default function CheckoutPage({ onNavigate }) {
  const { openModal, showToast, placeOrder, clearCart } = useApp();
  const { currentUser } = useAuth();

  // Form State
  const [selectedPatient, setSelectedPatient] = useState('milo');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'bkash', 'wallet', 'cod'
  const [smsTelemetry, setSmsTelemetry] = useState(true);
  const [saveVaultCredentials, setSaveVaultCredentials] = useState(true);
  const [deliveryNote, setDeliveryNote] = useState(
    'Ring gate bell. Hand insulated pod directly to guardian Tanzim or keep shaded in porch.'
  );

  // Card Inputs
  const [cardNumber, setCardNumber] = useState('4820 8811 0024 8831');
  const [expDate, setExpDate] = useState('08 / 27');
  const [cvv, setCvv] = useState('742');
  const [cardName, setCardName] = useState('TANZIM RAHMAN');

  // Mobile Banking Inputs
  const [mobileNumber, setMobileNumber] = useState('01711209482');
  const [mobileProvider, setMobileProvider] = useState('bKash');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);

  // Modal states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Pricing constants (matches reference 1:1)
  const prescriptionSubtotal = 5868;
  const privilegeDiscount = 232;
  const netPayable = prescriptionSubtotal - privilegeDiscount; // ৳5,636

  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  // Submit payment & trigger dispatch
  const handleAuthorizeDispatch = async () => {
    setIsProcessing(true);
    showToast('Auditing thermal continuity & processing 256-bit TLS authorization...', 'info');

    setTimeout(async () => {
      try {
        if (placeOrder) {
          await placeOrder({
            patient: 'Milo (Canine • 28.4kg)',
            microchip: '985141002938411',
            address: 'House 42, Road 11, Block D, Banani, Dhaka-1213',
            deliveryNote,
            paymentMethod: paymentMethod === 'card' ? 'Visa / MC 256-Bit Vault' : paymentMethod,
            subtotal: prescriptionSubtotal,
            discount: privilegeDiscount,
            total: netPayable,
            items: [
              { name: 'NexGard Spectra® Chewables (15.1-30.0kg)', price: 1568, qty: 1 },
              { name: 'Royal Canin Gastrointestinal Low Fat (4.0kg)', price: 3450, qty: 1 },
              { name: 'Nobivac® Rabies Biologic 1-Dose', price: 850, qty: 1 }
            ]
          });
        }
      } catch (err) {}

      setIsProcessing(false);
      setIsOrderComplete(true);
      showToast('🎉 Dispatch Authorized! Digital cold-chain ledger synchronized.', 'success');
      
      // Auto open Order Tracker after 1.5s
      setTimeout(() => {
        openModal('orderTracker', { orderId: 'ORD-9821-COLD', total: netPayable });
      }, 1200);
    }, 1800);
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
          1. CHECKOUT TOP BAR & SUB-NAV
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: '#FDF8F5',
        borderBottom: '1px solid #EBE5DF',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Left: Return to Care Bag */}
          <button
            onClick={() => handleRoute('cart')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#525B57',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#160F0C'}
            onMouseLeave={e => e.currentTarget.style.color = '#525B57'}
          >
            <ArrowLeft size={16} />
            <span>Return to Care Bag</span>
          </button>

          {/* Center: Brand Logo */}
          <div
            onClick={() => handleRoute('landing')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
          >
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '17px',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#160F0C',
              lineHeight: 1
            }}>
              PET MAYA
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '7.5px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#45848D',
              marginTop: '3px',
              lineHeight: 1
            }}>
              VETERINARY MEDICINE
            </span>
          </div>

          {/* Right: Security Tag & Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EBF5F3',
              border: '1px solid #CDEBE5',
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#0D9488'
            }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 5px #10B981'
              }} />
              <span>End to End Cold-Chain Telemetry Encrypted</span>
            </div>

            {/* Dynamic Logged-in User Avatar Placeholder */}
            <div
              onClick={() => handleRoute(currentUser ? 'dashboard' : 'login')}
              title={currentUser ? (currentUser.name || 'Guardian Profile') : 'Sign In to Health Vault'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1.5px solid #0D9488',
                backgroundColor: '#45848D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}
            >
              <img
                src={currentUser?.photoUrl || currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'Guardian Profile'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. STEP PROGRESS WIZARD (4 Steps)
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: '1360px',
        margin: '24px auto 0 auto',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Step 1: Care Bag (Completed) */}
          <button
            onClick={() => handleRoute('cart')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EBE5DF',
              border: '1px solid #DDD6CE',
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#525B57',
              cursor: 'pointer'
            }}
          >
            <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span>
            <span>1. Care Bag</span>
          </button>

          {/* Step 2: Cold-Chain & Address (Completed) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#EBF5F3',
            border: '1px solid #C4E9E2',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#0D9488'
          }}>
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700
            }}>2</span>
            <span>2. Cold-Chain & Address</span>
          </div>

          {/* Step 3: Payment & Ledger (Active Step) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#D1EAE5',
            border: '1.5px solid #0D9488',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0F766E',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.15)'
          }}>
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#0F766E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700
            }}>3</span>
            <span>3. Payment & Ledger</span>
          </div>

          {/* Step 4: Dispatch & Sync (Upcoming) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#F3EFEB',
            border: '1px solid #E5DFD9',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#9CA3AF'
          }}>
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#E5DFD9',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700
            }}>4</span>
            <span>4. Dispatch & Sync</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. PAGE TITLE & PROTOCOL BADGE
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: '1360px',
        margin: '24px auto 0 auto',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #EBE5DF',
          paddingBottom: '20px'
        }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#0D9488',
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: '4px'
            }}>
              PROTOCOL #CLIN-AA9D2-DX
            </span>
            <h1 style={{
              fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
              fontSize: '28px',
              fontWeight: 700,
              color: '#160F0C',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              Cold-Chain Checkout & Honorarium Settlement
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#6B7280',
              margin: 0,
              maxWidth: '780px',
              lineHeight: 1.5
            }}>
              Controlled pharmaceutical release requiring thermal continuity audit (&lt;8°C) and clinical pharmacist verification prior to dispatch courier seal.
            </p>
          </div>

          {/* Right Microchip Verified Tag */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5DFD9',
            padding: '8px 14px',
            borderRadius: '10px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: '#374151'
          }}>
            <ShieldCheck size={16} color="#0D9488" />
            <span>Microchip Verified: <strong>#985141002938411</strong></span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          4. TWO-COLUMN MAIN CHECKOUT LAYOUT
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: '1360px',
        margin: '28px auto 0 auto',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 420px',
          gap: '32px',
          alignItems: 'start'
        }} className="checkout-grid-layout">

          {/* ────────────────────────────────────────────────────────────
              LEFT COLUMN: PATIENT VERIFICATION & SETTLEMENT METHODS
              ──────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* A. Patient Verification & Clinical Dispatch Destination Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE5DF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#0D9488" />
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Patient Verification & Clinical Dispatch Destination
                  </h3>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#E6F4F1',
                  color: '#0D9488',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #C4E9E2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✓</span>
                  <span>Rx Matched</span>
                </span>
              </div>

              {/* Milo Specimen Box */}
              <div style={{
                backgroundColor: '#FAF8F5',
                border: '1px solid #EBE5DF',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&auto=format&fit=crop&q=80"
                    alt="Milo"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #DDD6CE'
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#160F0C' }}>Milo</span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>Canine • Golden Retriever</span>
                    </div>
                    <div style={{
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: '#525B57',
                      marginTop: '2px'
                    }}>
                      Weight: <strong>28.4 kg</strong> • Prescribing Clinician: <strong>Dr. Evelyn Vance (MRCVS)</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowPatientModal(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#0D9488',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Switch Patient</span>
                  <span>⇄</span>
                </button>
              </div>

              {/* Guardian Destination Address */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#6B7280',
                    letterSpacing: '0.08em'
                  }}>
                    GUARDIAN DESTINATION ADDRESS
                  </label>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#0D9488',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Change Address
                  </button>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5DFD9',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C' }}>
                        {currentUser?.name || 'Tanzim R.'}
                      </span>
                      <span style={{
                        backgroundColor: '#E0F2FE',
                        color: '#0284C7',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-mono, monospace)'
                      }}>
                        Primary Residence
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: 1.45 }}>
                      {currentUser?.address || 'House 42, Road 11, Block D, Banani'}<br />
                      Dhaka-1213, Bangladesh • {currentUser?.phone || '+880 1711-209482'}
                    </div>
                  </div>
                  <MapPin size={18} color="#0D9488" style={{ marginTop: '2px' }} />
                </div>

                {/* Special Delivery Note */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                      Special Cold-Chain Courier Delivery Note:
                    </label>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      color: '#0D9488',
                      fontWeight: 600
                    }}>
                      Logged on Dispatch Pod
                    </span>
                  </div>
                  <input
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#FAF8F5',
                      border: '1px solid #DDD6CE',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: '#160F0C',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Thermal Delivery Specification */}
              <div style={{ marginTop: '20px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#6B7280',
                  letterSpacing: '0.08em',
                  marginBottom: '10px'
                }}>
                  THERMAL DELIVERY SPECIFICATION
                </label>

                {/* Selected Thermal Express Box */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #0D9488',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: '#E6F4F1',
                        color: '#0D9488',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Snowflake size={15} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C' }}>
                        120m Cold Express
                      </span>
                      <span style={{
                        backgroundColor: '#E6F4F1',
                        color: '#0D9488',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-mono, monospace)',
                        border: '1px solid #C4E9E2'
                      }}>
                        Active 2°C-8°C Guarantee
                      </span>
                    </div>

                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#0D9488',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      ✓
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px 34px', lineHeight: 1.45 }}>
                    Sealed hermetic vacuum pod with calibrated RFID digital temperature datalogger. Synchronizes continuous telemetry upon handoff.
                  </p>

                  <div style={{ marginLeft: '34px', fontSize: '11.5px', color: '#6B7280' }}>
                    <span>Standard rate: <strike>৳450</strike></span>
                    <span style={{ marginLeft: '8px', color: '#0D9488', fontWeight: 600 }}>
                      Complimentary tier applied: ৳0
                    </span>
                  </div>
                </div>

                {/* SMS Telemetry Notification Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#FAF8F5',
                  borderRadius: '10px',
                  border: '1px solid #EBE5DF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#160F0C', fontWeight: 500 }}>
                    <span style={{ color: '#0D9488', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>&gt;&gt;</span>
                    <span>Send live continuous temperature SMS telemetry to <strong>+880 1711-209482</strong></span>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    onClick={() => setSmsTelemetry(!smsTelemetry)}
                    style={{
                      width: '36px',
                      height: '20px',
                      backgroundColor: smsTelemetry ? '#0D9488' : '#D1D5DB',
                      borderRadius: '9999px',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: smsTelemetry ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* B. Clinical Honorarium Settlement Method (Payment) Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE5DF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} color="#0D9488" />
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Clinical Honorarium Settlement Method
                  </h3>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  color: '#6B7280'
                }}>
                  256-bit TLS Encrypted
                </span>
              </div>

              {/* 4 Payment Method Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {/* 1. Card Payment */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    backgroundColor: paymentMethod === 'card' ? '#EEF7F6' : '#FFFFFF',
                    border: paymentMethod === 'card' ? '2px solid #0D9488' : '1px solid #E5DFD9',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CreditCard size={18} color={paymentMethod === 'card' ? '#0D9488' : '#6B7280'} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>Card Payment</div>
                  <div style={{ fontSize: '9.5px', color: '#6B7280', marginTop: '2px' }}>Visa / MC / Amex</div>
                </div>

                {/* 2. bKash / Nagad */}
                <div
                  onClick={() => setPaymentMethod('bkash')}
                  style={{
                    position: 'relative',
                    backgroundColor: paymentMethod === 'bkash' ? '#EEF7F6' : '#FFFFFF',
                    border: paymentMethod === 'bkash' ? '2px solid #0D9488' : '1px solid #E5DFD9',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '6px',
                    backgroundColor: '#F59E0B',
                    color: '#FFFFFF',
                    fontSize: '8.5px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}>
                    1.5% Back
                  </span>
                  <Smartphone size={18} color={paymentMethod === 'bkash' ? '#0D9488' : '#6B7280'} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>bKash / Nagad</div>
                  <div style={{ fontSize: '9.5px', color: '#6B7280', marginTop: '2px' }}>Direct Mobile Pay</div>
                </div>

                {/* 3. Care Wallet */}
                <div
                  onClick={() => setPaymentMethod('wallet')}
                  style={{
                    backgroundColor: paymentMethod === 'wallet' ? '#EEF7F6' : '#FFFFFF',
                    border: paymentMethod === 'wallet' ? '2px solid #0D9488' : '1px solid #E5DFD9',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Wallet size={18} color={paymentMethod === 'wallet' ? '#0D9488' : '#6B7280'} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>Care Wallet</div>
                  <div style={{ fontSize: '9.5px', color: '#0D9488', fontWeight: 600, marginTop: '2px' }}>৳9,200 Bal</div>
                </div>

                {/* 4. Cold Handoff */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  style={{
                    backgroundColor: paymentMethod === 'cod' ? '#EEF7F6' : '#FFFFFF',
                    border: paymentMethod === 'cod' ? '2px solid #0D9488' : '1px solid #E5DFD9',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Truck size={18} color={paymentMethod === 'cod' ? '#0D9488' : '#6B7280'} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>Cold Handoff</div>
                  <div style={{ fontSize: '9.5px', color: '#6B7280', marginTop: '2px' }}>POS / Micro-Audit</div>
                </div>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Card Number */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                        Card Number
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '1px 5px', borderRadius: '3px' }}>VISA</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '1px 5px', borderRadius: '3px' }}>MC</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '1px 5px', borderRadius: '3px' }}>AMEX</span>
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 40px 11px 14px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#160F0C',
                          outline: 'none',
                          letterSpacing: '0.08em'
                        }}
                      />
                      <Lock size={15} color="#9CA3AF" style={{ position: 'absolute', right: '14px', top: '13px' }} />
                    </div>
                  </div>

                  {/* Expiration Date & CVV Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        placeholder="MM / YY"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: '#160F0C',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Security CVV</label>
                        <span style={{ fontSize: '10.5px', color: '#9CA3AF' }}>3 or 4 digits</span>
                      </div>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: '#160F0C',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Cardholder Legal Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Cardholder Legal Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#160F0C',
                        outline: 'none',
                        letterSpacing: '0.04em'
                      }}
                    />
                  </div>

                  {/* Save Credentials Checkbox */}
                  <div
                    onClick={() => setSaveVaultCredentials(!saveVaultCredentials)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: saveVaultCredentials ? '1px solid #0D9488' : '1px solid #D1D5DB',
                      backgroundColor: saveVaultCredentials ? '#0D9488' : '#FFFFFF',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      marginTop: '2px',
                      flexShrink: 0
                    }}>
                      {saveVaultCredentials && '✓'}
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#525B57', lineHeight: 1.45 }}>
                      Save tokenized credentials in Pet Maya Secure Vault for Milo's scheduled quarterly parasite prophylaxis refills.
                    </span>
                  </div>
                </div>
              )}

              {/* bKash / Nagad Form */}
              {paymentMethod === 'bkash' && (
                <div style={{
                  backgroundColor: '#FAF8F5',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #EBE5DF'
                }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    {['bKash', 'Nagad', 'Upay'].map(p => (
                      <button
                        key={p}
                        onClick={() => setMobileProvider(p)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: mobileProvider === p ? '1.5px solid #0D9488' : '1px solid #D1D5DB',
                          backgroundColor: mobileProvider === p ? '#E6F4F1' : '#FFFFFF',
                          color: mobileProvider === p ? '#0D9488' : '#374151',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    {mobileProvider} Account Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                  <p style={{ fontSize: '11.5px', color: '#6B7280', margin: '8px 0 0' }}>
                    A secure push payment prompt will be routed to your {mobileProvider} app upon dispatch confirmation.
                  </p>
                </div>
              )}

              {/* Care Wallet View */}
              {paymentMethod === 'wallet' && (
                <div style={{
                  backgroundColor: '#E6F4F1',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #C4E9E2'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#134E4A' }}>Pet Maya Care Wallet Balance</span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#0D9488', fontFamily: 'var(--font-mono)' }}>৳9,200.00</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#2D5D5A', lineHeight: 1.45 }}>
                    Sufficient funds available. <strong>৳{netPayable.toLocaleString()}</strong> will be automatically settled from Milo's wellness ledger.
                  </div>
                </div>
              )}

              {/* Cold Handoff View */}
              {paymentMethod === 'cod' && (
                <div style={{
                  backgroundColor: '#FAF8F5',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #EBE5DF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Truck size={16} color="#0D9488" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>Doorstep Cold-Chain POS Settlement</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.45 }}>
                    Pay via contactless card or mobile banking directly to the certified cold-chain courier upon physical temperature datalogger audit.
                  </p>
                </div>
              )}

              {/* Divider & Compliance Footer */}
              <div style={{ height: '1px', backgroundColor: '#EBE5DF', margin: '18px 0 14px' }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                color: '#6B7280'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0D9488', fontWeight: 600 }}>
                  <ShieldCheck size={13} />
                  <span>PCI DSS Level 1 Encrypted Settlement Gateway</span>
                </span>
                <span>AAHA VET AUDIT #V-2024 • ISO 9001:2015 COLD LOGISTICS</span>
              </div>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────────────
              RIGHT COLUMN: ORDER & FORMULATION SUMMARY & CLINICIAN APPROVAL
              ──────────────────────────────────────────────────────────── */}
          <div style={{
            position: 'sticky',
            top: '76px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>

            {/* 1. Order & Formulation Summary Card */}
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
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#9CA3AF',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    COLD LEDGER AUDIT
                  </span>
                  <h3 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#160F0C',
                    margin: 0
                  }}>
                    Order & Formulation Summary
                  </h3>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}>
                  3 Regulated Items
                </span>
              </div>

              {/* 3 Item Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {/* Item 1: NexGard Spectra */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #F3EFEB'
                }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: '#F3E8FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      💊
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                        NexGard Spectra® Chewables
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        15.1-30.0 kg • 3 Chews (Purple Box)
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '9.5px',
                        color: '#9CA3AF',
                        marginTop: '2px',
                        display: 'flex',
                        gap: '6px'
                      }}>
                        <span>Batch: #NX-887</span>
                        <span style={{ color: '#0D9488' }}>Exp: Nov 2026</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C' }}>৳1,568</div>
                    <div style={{ fontSize: '10.5px', color: '#9CA3AF' }}>Qty: 1 box</div>
                  </div>
                </div>

                {/* Item 2: Royal Canin Gastro */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #F3EFEB'
                }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      🍲
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                        Royal Canin Gastrointestinal Low Fat
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        Dry Veterinary Diet • 4.0 kg
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '9.5px',
                        color: '#9CA3AF',
                        marginTop: '2px'
                      }}>
                        <span>Batch: #RC-99021</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C' }}>৳3,450</div>
                    <div style={{ fontSize: '10.5px', color: '#9CA3AF' }}>Qty: 1 bag</div>
                  </div>
                </div>

                {/* Item 3: Nobivac Rabies */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #F3EFEB'
                }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: '#E6F4F1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      🧪
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                          Nobivac® Rabies Biologic
                        </span>
                        <span style={{
                          backgroundColor: '#E6F4F1',
                          color: '#0D9488',
                          fontSize: '8.5px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          Cold-Chain Only
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        1-Dose Sealed Hermetic Pod
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '9.5px',
                        color: '#0D9488',
                        marginTop: '2px'
                      }}>
                        <span>Requires 2°C-8°C</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C' }}>৳850</div>
                    <div style={{ fontSize: '10.5px', color: '#9CA3AF' }}>Qty: 1 vial</div>
                  </div>
                </div>
              </div>

              {/* Ledger Breakdown Lines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Prescription Ledger Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#160F0C' }}>৳{prescriptionSubtotal.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Hermetic Cold Thermal Packaging</span>
                    <ShieldCheck size={12} color="#0D9488" />
                  </span>
                  <span style={{ color: '#0D9488', fontWeight: 600 }}>Free ( ৳0 )</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Clinical Pharmacist Review (Dr. Vance)</span>
                  <span style={{ color: '#0D9488', fontWeight: 600 }}>Included ( ৳0 )</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>120m Express Direct Courier</span>
                  <span style={{ color: '#0D9488', fontWeight: 600 }}>Complimentary ( ৳0 )</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0D9488', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Care Partner Privilege (PETMAYA10)</span>
                    <span>🏷</span>
                  </span>
                  <span>-৳{privilegeDiscount}</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: '#EBE5DF', margin: '16px 0' }} />

              {/* Total Honorarium Settlement */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '18px'
              }}>
                <div>
                  <h4 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#160F0C',
                    margin: 0
                  }}>
                    Total Honorarium Settlement
                  </h4>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    Includes 5% Clinical VAT & Datalogger Certification
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-sans, sans-serif)',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#160F0C',
                    letterSpacing: '-0.02em',
                    lineHeight: 1
                  }}>
                    ৳{netPayable.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                    BDT Net Payable
                  </span>
                </div>
              </div>

              {/* Primary Dispatch Action Button */}
              <button
                onClick={handleAuthorizeDispatch}
                disabled={isProcessing}
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
                  cursor: isProcessing ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 15, 12, 0.15)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = '#261B16';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = '#160F0C';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>{isProcessing ? 'Auditing Cold-Chain...' : `Authorize & Confirm Dispatch • ৳${netPayable.toLocaleString()}`}</span>
                <span>→</span>
              </button>

              {/* Return link */}
              <button
                onClick={() => handleRoute('cart')}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#525B57',
                  fontSize: '12px',
                  fontWeight: 500,
                  marginTop: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '4px 0'
                }}
              >
                ← Return to Care Bag & Edit Items
              </button>

              {/* Cold Hand-Off Verification Rule Alert Card */}
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '10px',
                padding: '12px 14px',
                marginTop: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#92400E',
                  marginBottom: '4px'
                }}>
                  <Zap size={14} />
                  <span>Cold Hand-Off Verification Rule:</span>
                </div>
                <p style={{
                  fontSize: '11.5px',
                  color: '#78350F',
                  margin: 0,
                  lineHeight: 1.45
                }}>
                  Recipient must inspect the integrated digital datalogger screen upon courier handoff. If the core pod registers above 8°C, do not sign; an automated free replacement pod is dispatched immediately.
                </p>
              </div>
            </div>

            {/* 2. Attending Clinician Approval Stamp Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE5DF',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
                  alt="Dr. Evelyn Vance"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #E5DFD9'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                      Dr. Evelyn Vance, MRCVS
                    </span>
                    <CheckCircle2 size={13} color="#10B981" />
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10.5px',
                    color: '#6B7280',
                    marginTop: '1px'
                  }}>
                    Lic. #VM-992014-CA • Attending Clinician
                  </div>
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                fontWeight: 800,
                color: '#059669',
                border: '1.5px solid #059669',
                padding: '4px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em'
              }}>
                AUDITED & SIGNED
              </div>
            </div>

            {/* 3. Dispensary Desk Helpline Card */}
            <div style={{
              backgroundColor: '#FAF5F2',
              border: '1px solid #EBE5DF',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(22, 15, 12, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={15} color="#0D9488" />
                <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 500 }}>
                  Pharmacy Triage Helpline: <strong>+880 9610-PETMAYA</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  setShowChatModal(true);
                  showToast('Connecting with Dispensary Desk Pharmacist...', 'info');
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#0D9488',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Instant Chat
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          5. BOTTOM 3 CLINICAL TRUST TILES
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: '1360px',
        margin: '48px auto 0 auto',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          borderTop: '1px solid #EBE5DF',
          paddingTop: '32px'
        }}>
          {/* Tile 1 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#EBF5F3',
              color: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Lock size={16} />
            </div>
            <div>
              <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C', margin: '0 0 3px 0' }}>
                Encrypted Patient Vault
              </h5>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                All diagnostic, biometric, and prescription ledger archives comply with international veterinary confidentiality directives.
              </p>
            </div>
          </div>

          {/* Tile 2 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#EBF5F3',
              color: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C', margin: '0 0 3px 0' }}>
                Authenticity Guaranteed
              </h5>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                100% genuine cold chain pharmaceuticals sourced directly from Boehringer Ingelheim, MSD Animal Health, and Royal Canin.
              </p>
            </div>
          </div>

          {/* Tile 3 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#EBF5F3',
              color: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Thermometer size={16} />
            </div>
            <div>
              <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C', margin: '0 0 3px 0' }}>
                Zero-Loss Temperature Protocol
              </h5>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                Automated instant indemnity: any breach in cold chain fidelity triggers an immediate priority replacement at zero charge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          6. LEGAL & REGULATORY FOOTER
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: '1360px',
        margin: '40px auto 0 auto',
        padding: '24px 24px 0 24px',
        borderTop: '1px solid #EBE5DF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        color: '#6B7280'
      }}>
        <span>© 2026 Pet Maya Veterinary Clinic & Apothecary Ltd. All clinical rights reserved.</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a onClick={() => handleRoute('terms')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Prescription Terms</a>
          <span>•</span>
          <a onClick={() => handleRoute('faq')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Cold Chain Guarantee</a>
          <span>•</span>
          <a onClick={() => handleRoute('privacy')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Privacy Codex</a>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          7. EDIT ADDRESS MODAL
          ════════════════════════════════════════════════════════════════ */}
      {showAddressModal && (
        <div
          onClick={() => setShowAddressModal(false)}
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
              maxWidth: '500px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Update Clinical Delivery Address
              </h3>
              <button onClick={() => setShowAddressModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Recipient Name</label>
                <input defaultValue="Tanzim R." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Street Address</label>
                <input defaultValue="House 42, Road 11, Block D, Banani" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>City & Zone</label>
                <input defaultValue="Dhaka-1213, Bangladesh" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Direct Phone</label>
                <input defaultValue="+880 1711-209482" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '4px' }} />
              </div>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  showToast('Delivery address updated and re-verified for cold-chain route.', 'success');
                }}
                style={{
                  padding: '12px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          8. SWITCH PATIENT MODAL
          ════════════════════════════════════════════════════════════════ */}
      {showPatientModal && (
        <div
          onClick={() => setShowPatientModal(false)}
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
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Select Registered Patient
              </h3>
              <button onClick={() => setShowPatientModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                onClick={() => {
                  setSelectedPatient('milo');
                  setShowPatientModal(false);
                  showToast('Active patient set to Milo', 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: selectedPatient === 'milo' ? '2px solid #0D9488' : '1px solid #E5DFD9',
                  backgroundColor: selectedPatient === 'milo' ? '#E6F4F1' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&auto=format&fit=crop&q=80" alt="Milo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Milo (Active)</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Golden Retriever • 28.4 kg • #985141002938411</div>
                </div>
              </div>

              <div
                onClick={() => {
                  setSelectedPatient('luna');
                  setShowPatientModal(false);
                  showToast('Active patient set to Luna', 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: selectedPatient === 'luna' ? '2px solid #0D9488' : '1px solid #E5DFD9',
                  backgroundColor: selectedPatient === 'luna' ? '#E6F4F1' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&auto=format&fit=crop&q=80" alt="Luna" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Luna</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>British Shorthair • 4.2 kg • #985141088219033</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          9. PHARMACY TRIAGE CHAT MODAL
          ════════════════════════════════════════════════════════════════ */}
      {showChatModal && (
        <div
          onClick={() => setShowChatModal(false)}
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
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={18} color="#0D9488" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Dispensary Triage Chat</h3>
              </div>
              <button onClick={() => setShowChatModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '14px', marginBottom: '14px', fontSize: '12.5px', color: '#374151' }}>
              <strong>Dr. Navid Rahman, PharmD:</strong><br />
              "Hello Tanzim, I have verified Milo's NexGard and Nobivac cold batch records. All units are currently resting in our 4.1°C calibrated vault ready for 120m dispatch."
            </div>
            <input placeholder="Type response..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', marginBottom: '12px' }} />
            <button
              onClick={() => {
                setShowChatModal(false);
                showToast('Message sent to attending dispensary pharmacist.', 'success');
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#160F0C',
                color: '#FFFFFF',
                borderRadius: '9999px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Send Message
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
