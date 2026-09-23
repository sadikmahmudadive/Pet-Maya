import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import EditorialNavbar from '../Navigation/EditorialNavbar';
import { generateOrderInvoicePDF } from '../../services/pdfGenerator';
import {
  FileText,
  Headphones,
  Snowflake,
  Activity,
  MapPin,
  Phone,
  ShieldCheck,
  Check,
  RotateCw,
  ExternalLink,
  ChevronRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Truck,
  Layers,
  Thermometer,
  Radio,
  Clock,
  ArrowUpRight,
  Shield,
  CreditCard,
  Building2,
  Lock,
  Search,
  X,
  Compass
} from 'lucide-react';

export default function OrdersPage({ onNavigate }) {
  const { orders = [], showToast, openModal, addToCart, vets = [] } = useApp ? useApp() : { orders: [], showToast: () => {}, openModal: () => {}, addToCart: () => {}, vets: [] };
  const { currentUser } = useAuth ? useAuth() : { currentUser: null };

  // Archive Filter Tab State
  const [archiveFilter, setArchiveFilter] = useState('all'); // 'all', 'cold-chain', 'hardware', 'auto-refill'
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [activeCert, setActiveCert] = useState(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState(null);
  const [showContactCourierModal, setShowContactCourierModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  const [conciergeMsg, setConciergeMsg] = useState('');
  const [conciergeChat, setConciergeChat] = useState([
    {
      sender: 'pharmacist',
      name: vets[0]?.name ? `${vets[0].name}, MRCVS` : 'Dr. Evelyn Vance, MRCVS',
      title: 'Lead Clinical Pharmacist',
      text: 'Good morning! Welcome to the Pet Maya Clinical Pharmacy Concierge. Let me know if you need batch verification, dosage guidance, or cold-chain protocol counsel.'
    }
  ]);

  // Live Telemetry Simulation
  const [liveTemp, setLiveTemp] = useState(3.8);
  const [liveDrift, setLiveDrift] = useState('+0.04');
  const [isLiveTelemetryActive, setIsLiveTelemetryActive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Micro fluctuation between 3.75°C and 3.85°C to simulate active 4G datalogger telemetry
      const delta = (Math.random() * 0.08 - 0.04);
      setLiveTemp((prev) => {
        const next = Math.max(3.6, Math.min(4.0, +(prev + delta).toFixed(2)));
        return next;
      });
      setLiveDrift((Math.random() * 0.06 - 0.03 >= 0 ? '+' : '-') + (Math.random() * 0.05).toFixed(2));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  const handleReorder = (itemTitle, price) => {
    if (addToCart) {
      addToCart({
        id: 'reorder-' + Date.now(),
        name: itemTitle,
        price: price,
        quantity: 1,
        prescriptionRequired: true
      });
    }
    showToast(`Added "${itemTitle}" to Dispensary Bag`, 'success');
  };

  const handleOpenCertificate = (orderId, product, batch, temp, hash) => {
    setActiveCert({ orderId, product, batch, temp, hash });
    setShowCertificateModal(true);
  };

  const handleSendConcierge = (e) => {
    e.preventDefault();
    if (!conciergeMsg.trim()) return;
    const userText = conciergeMsg;
    setConciergeChat(prev => [...prev, { sender: 'user', text: userText }]);
    setConciergeMsg('');
    setTimeout(() => {
      setConciergeChat(prev => [
        ...prev,
        {
          sender: 'pharmacist',
          name: 'Dr. Evelyn Vance, MRCVS',
          title: 'Lead Clinical Pharmacist',
          text: `Acknowledged: "${userText}". Datalogger audit is verified. Your clinical consultation and dispatch protocols are synchronized.`
        }
      ]);
    }, 1000);
  };

  // Real orders from Firestore / local cache
  const allOrders = useMemo(() => {
    return (orders || []).map(o => ({
      id: o.orderId || o.id,
      rawOrder: o,
      status: (o.status || 'In Preparation').toUpperCase() + ' • ' + (o.date || new Date().toISOString().split('T')[0]),
      statusColor: o.status === 'Delivered' ? '#10B981' : '#0284C7',
      recipient: o.patient ? o.patient.split(' ')[0] : 'Companion',
      category: o.category || 'cold-chain',
      tempTag: o.tempTag || '🌡 Temp Verified at Pod: 3.8°C (Optimal Stasis)',
      tempTagColor: '#047857',
      tempTagBg: 'rgba(16, 185, 129, 0.1)',
      title: Array.isArray(o.items) && o.items.length > 0 
        ? o.items.map(i => `${i.name || i.title || 'Item'} (x${i.qty || 1})`).join(' • ')
        : (o.title || 'Veterinary Clinical Prescription'),
      total: `৳${Number(o.total || 0).toLocaleString()}`,
      paymentMethod: o.paymentMethod || 'bKash Merchant Sync',
      syncNote: '⚡ Sovereign Health Vault Cold Ledger Synchronized',
      priceNum: o.total || 0,
      batch: o.batch || 'PM-BATCH-891',
      cryptoHash: o.cryptoHash || '0x44ce...e1091a'
    }));
  }, [orders]);

  const activeHeroOrder = useMemo(() => {
    return allOrders.find(o => !o.rawOrder?.status || o.rawOrder?.status.toLowerCase() === 'in preparation' || o.rawOrder?.status.toLowerCase() === 'in transit') || (allOrders.length > 0 ? allOrders[0] : null);
  }, [allOrders]);

  const countAll = allOrders.length;
  const countCold = allOrders.filter(o => (o.category || '').includes('cold-chain')).length;
  const countHardware = allOrders.filter(o => (o.category || '').includes('hardware')).length;
  const countAutoRefill = allOrders.filter(o => (o.category || '').includes('auto-refill')).length;

  const filteredOrders = allOrders.filter(order => {
    if (archiveFilter === 'all') return true;
    if (archiveFilter === 'cold-chain') return (order.category || '').includes('cold-chain');
    if (archiveFilter === 'hardware') return (order.category || '').includes('hardware');
    if (archiveFilter === 'auto-refill') return (order.category || '').includes('auto-refill');
    return true;
  });

  const handleDownloadInvoice = (order) => {
    const target = order?.rawOrder || order || activeHeroOrder?.rawOrder || activeHeroOrder;
    if (!target) {
      showToast('No orders recorded to download invoice', 'error');
      return;
    }
    generateOrderInvoicePDF({
      order: {
        orderId: target.orderId || target.id || 'ORDER',
        items: target.items || [
          { name: target.title || 'Veterinary Clinical Prescription', price: target.priceNum || target.total || 0, qty: 1 }
        ],
        subtotal: target.subtotal || target.priceNum || target.total || 0,
        total: target.total || target.priceNum || 0,
        discount: target.discount || 0,
        patient: target.patient || target.recipient || 'Companion',
        deliveryAddress: target.shippingAddress || target.deliveryAddress || currentUser?.address || 'Registered Delivery Address',
        phone: target.phone || currentUser?.phone || ''
      },
      user: currentUser
    });
    showToast('Official Cold-Chain PDF Invoice downloaded', 'success');
  };

  return (
    <div style={{
      backgroundColor: '#FAF7F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ════════════════════════════════════════════════════════════════
          1. TOP GLOBAL PROTOCOL BANNER & EDITORIAL NAVBAR
          ════════════════════════════════════════════════════════════════ */}
      <EditorialNavbar currentRoute="orders" onNavigate={handleRoute} />

      {/* ════════════════════════════════════════════════════════════════
          MAIN BODY CONTAINER
          ════════════════════════════════════════════════════════════════ */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', width: '100%', padding: '32px 24px 80px' }}>

        {/* ── 1. Page Header & Breadcrumbs ── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#3E7B84',
              marginBottom: '10px'
            }}>
              <span style={{ cursor: 'pointer' }} onClick={() => handleRoute('dashboard')}>CARE ACCOUNT</span>
              <span style={{ color: '#B6ACA6' }}>/</span>
              <span style={{ cursor: 'pointer' }} onClick={() => handleRoute('shop')}>DISPENSARY DISPATCHES</span>
              <span style={{ color: '#B6ACA6' }}>/</span>
              <span style={{ color: '#160F0C' }}>ACTIVE TRACKING</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#160F0C',
              margin: '0 0 8px 0',
              lineHeight: 1.15
            }}>
              Dispensary Orders & Cold-Chain Telemetry
            </h1>

            <p style={{
              fontSize: '14px',
              color: '#675C58',
              margin: 0,
              maxWidth: '720px',
              lineHeight: 1.55
            }}>
              Live thermal monitoring, continuous datalogger telemetry (&lt;8°C), and automated medical vault ledger synchronization.
            </p>
          </div>

          {/* Top Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                setActiveInvoiceOrder(allOrders[0] || null);
                setShowInvoiceModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D6CEC7',
                color: '#160F0C',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#160F0C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D6CEC7'; }}
            >
              <Download size={15} color="#45848D" />
              Download Tax Invoice (PDF)
            </button>

            <button
              onClick={() => setShowConciergeModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '9999px',
                backgroundColor: '#160F0C',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2C221E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#160F0C'; }}
            >
              <Headphones size={15} color="#45848D" />
              Pharmacy Concierge
            </button>
          </div>
        </div>

        {/* ── 2. Active Order Master Cockpit ── */}
        {!activeHeroOrder ? (
          <div style={{
            backgroundColor: '#F7F3EE',
            borderRadius: '24px',
            border: '1px solid #E5DED6',
            padding: '48px 24px',
            textAlign: 'center',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(22, 15, 12, 0.03)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(62, 123, 132, 0.1)',
              color: '#3E7B84',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Truck size={28} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
              fontSize: '22px',
              fontWeight: 800,
              color: '#160F0C',
              margin: '0 0 8px 0'
            }}>
              No Active Orders in Transit
            </h2>
            <p style={{
              fontSize: '13.5px',
              color: '#675C58',
              maxWidth: '480px',
              margin: '0 auto 24px',
              lineHeight: 1.55
            }}>
              When you place a prescription or wellness consignment from the dispensary, live cold-chain telemetry, courier GPS routing, and thermal dataloggers will synchronize here in real-time.
            </p>
            <button
              onClick={() => handleRoute('shop')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '9999px',
                backgroundColor: '#160F0C',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Visit Clinical Dispensary
            </button>
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: '#F7F3EE',
              borderRadius: '24px',
              border: '1px solid #E5DED6',
              padding: '24px',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(22, 15, 12, 0.03)'
            }}>

              {/* Master Status Strip */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #EBE5DF'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D6CEC7',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#160F0C'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: activeHeroOrder.statusColor,
                      boxShadow: `0 0 0 3px ${activeHeroOrder.statusColor}33`
                    }} />
                    {activeHeroOrder.status}
                  </div>

                  <div style={{
                    fontSize: '12.5px',
                    color: '#675C58',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}>
                    Order ID: <strong style={{ color: '#160F0C' }}>#{activeHeroOrder.id}</strong> • Dispatch Vault: <span style={{ color: '#160F0C' }}>{activeHeroOrder.rawOrder?.vaultLocation || 'Central Apothecary Vault'}</span>
                  </div>
                </div>

                {/* Live Telemetry Pulse Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(62, 123, 132, 0.1)',
                  border: '1px solid rgba(62, 123, 132, 0.25)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#3E7B84',
                  letterSpacing: '0.05em'
                }}>
                  <span>LIVE TELEMETRY SYNC</span>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#3E7B84',
                    color: '#FFFFFF',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Radio size={10} /> 4G LTE Linked
                  </span>
                </div>
              </div>

              {/* 2-Column Telemetry Matrix + Live Cartography Map */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '24px',
                marginBottom: '24px'
              }}>

                {/* LEFT SUB-CARD: Core Thermal Matrix */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid #EBE5DF',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: '#3E7B84'
                      }}>
                        HERMETIC POD TELEMETRY
                      </div>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(62, 123, 132, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Snowflake size={16} color="#3E7B84" className="animate-spin-slow" />
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#160F0C',
                      margin: '0 0 4px 0'
                    }}>
                      Core Thermal Matrix
                    </h3>
                    <p style={{ fontSize: '12px', color: '#707973', margin: '0 0 16px 0' }}>
                      Continuous vacuum-insulated biological monitoring
                    </p>

                    {/* Big Temperature Display + Metrics Grid */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 18px',
                      backgroundColor: '#FAF7F5',
                      borderRadius: '14px',
                      border: '1px solid #EFE9E4',
                      marginBottom: '18px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '48px',
                            fontWeight: 800,
                            color: '#160F0C',
                            lineHeight: 1
                          }}>
                            {liveTemp.toFixed(1)}
                          </span>
                          <span style={{
                            fontSize: '22px',
                            fontWeight: 600,
                            color: '#3E7B84'
                          }}>
                            °C
                          </span>
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '6px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: '#047857',
                          fontSize: '10.5px',
                          fontWeight: 700
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                          OPTIMAL CLINICAL STASIS (2.0°C - 8.0°C)
                        </div>
                      </div>

                      {/* Micro Specs */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '11px',
                        color: '#675C58',
                        textAlign: 'right'
                      }}>
                        <div>Sensor Drift: <strong style={{ color: '#160F0C' }}>{liveDrift}°C</strong></div>
                        <div>Delta to Peak: <strong style={{ color: '#160F0C' }}>+0.21°C</strong></div>
                        <div>Safety Margin: <strong style={{ color: '#3E7B84' }}>96.2%</strong></div>
                      </div>
                    </div>

                    {/* Spline Thermal Curve Graphic */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #EBE5DF',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#8C827A',
                        letterSpacing: '0.05em',
                        marginBottom: '8px'
                      }}>
                        <span>TRANSIT THERMAL LOG</span>
                        <span style={{ color: '#3E7B84' }}>VARIANCE: 0.3°C MAX</span>
                      </div>

                      {/* SVG Spline Graph */}
                      <div style={{ height: '70px', width: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 380 70" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3E7B84" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#3E7B84" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Threshold corridor (2°C to 8°C safety band) */}
                          <line x1="0" y1="12" x2="380" y2="12" stroke="#E5DED6" strokeDasharray="3 3" strokeWidth="1" />
                          <line x1="0" y1="58" x2="380" y2="58" stroke="#E5DED6" strokeDasharray="3 3" strokeWidth="1" />

                          {/* Fill area under curve */}
                          <path
                            d="M 0 45 C 50 48, 100 42, 160 46 C 220 50, 290 38, 380 40 L 380 70 L 0 70 Z"
                            fill="url(#tempGradient)"
                          />

                          {/* Spline line */}
                          <path
                            d="M 0 45 C 50 48, 100 42, 160 46 C 220 50, 290 38, 380 40"
                            fill="none"
                            stroke="#3E7B84"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          {/* Key point nodes */}
                          <circle cx="0" cy="45" r="3.5" fill="#3E7B84" />
                          <circle cx="160" cy="46" r="3.5" fill="#3E7B84" />
                          <circle cx="380" cy="40" r="5" fill="#3E7B84" />
                          <circle cx="380" cy="40" r="8" fill="#3E7B84" opacity="0.3" className="animate-ping" />
                        </svg>
                      </div>

                      {/* Graph Timestamps */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#8C827A',
                        fontFamily: 'var(--font-mono, monospace)',
                        marginTop: '4px'
                      }}>
                        <span>Vault Exit</span>
                        <span>In Transit</span>
                        <span style={{ color: '#160F0C', fontWeight: 700 }}>Telemetry Live</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Spec Pills */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    paddingTop: '6px'
                  }}>
                    <div style={{
                      backgroundColor: '#FAF7F5',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid #EFE9E4'
                    }}>
                      <div style={{ fontSize: '9.5px', color: '#8C827A', textTransform: 'uppercase', fontWeight: 600 }}>RFID LOGGER</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#160F0C', fontFamily: 'monospace' }}>#{activeHeroOrder.batch || 'DL-9921'}</div>
                    </div>

                    <div style={{
                      backgroundColor: '#FAF7F5',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid #EFE9E4'
                    }}>
                      <div style={{ fontSize: '9.5px', color: '#8C827A', textTransform: 'uppercase', fontWeight: 600 }}>BATTERY</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>94% Active</div>
                    </div>

                    <div style={{
                      backgroundColor: '#FAF7F5',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid #EFE9E4'
                    }}>
                      <div style={{ fontSize: '9.5px', color: '#8C827A', textTransform: 'uppercase', fontWeight: 600 }}>HARDWARE</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#160F0C' }}>Sensitech Ultra2</div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SUB-CARD: Live Route Map & Courier Logistics */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid #EBE5DF',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Map Graphic Canvas */}
                  <div style={{
                    position: 'relative',
                    height: '240px',
                    backgroundColor: '#EBE5DC',
                    backgroundImage: `
                      radial-gradient(#D6CEC7 1px, transparent 1px),
                      linear-gradient(to right, rgba(214, 206, 199, 0.3) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(214, 206, 199, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px',
                    overflow: 'hidden'
                  }}>
                    {/* Subtle map roads / rivers */}
                    <svg viewBox="0 0 450 240" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                      {/* Road Network */}
                      <path d="M 0 90 Q 120 70 200 130 T 450 140" fill="none" stroke="#DFD7CE" strokeWidth="16" />
                      <path d="M 120 0 L 140 240" fill="none" stroke="#DFD7CE" strokeWidth="10" />
                      <path d="M 320 0 L 300 240" fill="none" stroke="#DFD7CE" strokeWidth="12" />
                      
                      {/* Active Cold Route Corridor */}
                      <path
                        d="M 80 55 L 170 55 L 170 120 L 290 120 L 290 180 L 370 180"
                        fill="none"
                        stroke="#3E7B84"
                        strokeWidth="3.5"
                        strokeDasharray="6 4"
                      />

                      {/* Origin Marker */}
                      <circle cx="80" cy="55" r="7" fill="#160F0C" />
                      <circle cx="80" cy="55" r="3" fill="#FFFFFF" />
                      <text x="96" y="58" fill="#160F0C" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">APOTHECARY DISPATCH</text>

                      {/* Live Courier Marker */}
                      <g transform="translate(260, 110)">
                        <rect x="0" y="0" width="70" height="22" rx="11" fill="#160F0C" />
                        <text x="35" y="14" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="monospace">COURIER</text>
                        <circle cx="35" cy="11" r="14" fill="#3E7B84" opacity="0.3" className="animate-ping" />
                      </g>

                      {/* Destination Marker */}
                      <circle cx="370" cy="180" r="7" fill="#047857" />
                      <circle cx="370" cy="180" r="3" fill="#FFFFFF" />
                      <text x="382" y="184" fill="#160F0C" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                        {activeHeroOrder.rawOrder?.shippingAddress?.split(',')[0] || currentUser?.address?.split(',')[0] || 'Destination'}
                      </text>
                    </svg>

                    {/* Top Badge on Map */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#160F0C',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(222, 217, 214, 0.8)'
                    }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                      DISPATCH CORRIDOR • TRANSIT ACTIVE
                    </div>

                    {/* Bottom Stats Badge on Map */}
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono, monospace)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>SPEED: 24 KM/H</span>
                      <span>•</span>
                      <span>POD BATTERY: 94%</span>
                    </div>
                  </div>

                  {/* Courier Profile & Handshake Protocol */}
                  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Courier Profile Box */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #EBE5DF'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(62, 123, 132, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#3E7B84'
                        }}>
                          <Truck size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C' }}>
                              {activeHeroOrder.rawOrder?.courierName || 'Designated Courier'}
                            </span>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              backgroundColor: 'rgba(62, 123, 132, 0.12)',
                              color: '#3E7B84',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              COLD-CERTIFIED
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#707973', marginTop: '2px' }}>
                            {activeHeroOrder.rawOrder?.courierPod || 'Sealed Electric Cargo Pod • Dual Compartment Buffer'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowContactCourierModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '9999px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D6CEC7',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#160F0C',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#160F0C'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D6CEC7'; }}
                      >
                        <Phone size={13} color="#45848D" />
                        Contact Courier
                      </button>
                    </div>

                    {/* Protocol Notice */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      backgroundColor: 'rgba(62, 123, 132, 0.06)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(62, 123, 132, 0.15)'
                    }}>
                      <ShieldCheck size={16} color="#3E7B84" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '11px', color: '#4B5563', lineHeight: 1.45 }}>
                        <strong style={{ color: '#160F0C' }}>COLD-CHAIN TEMPERATURE HANDSHAKE PROTOCOL: </strong>
                        Upon arrival, courier presents the external digital LCD datalogger. If temperature registers ≥8.0°C, rejection protocol triggers instant clinical replacement at zero honorarium.
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 4-Stage Timeline Stepper Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #EBE5DF'
              }}>

                {/* STAGE 01 */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EFE9E4'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      STAGE 01
                    </span>
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}>
                      ✓
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', marginBottom: '4px' }}>
                    Order Verified & Prescribed
                  </div>
                  <div style={{ fontSize: '11px', color: '#707973' }}>
                    Apothecary Clinical Review Passed
                  </div>
                </div>

                {/* STAGE 02 */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EFE9E4'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      STAGE 02
                    </span>
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}>
                      ✓
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', marginBottom: '4px' }}>
                    Hermetic Cold Packing & Seal
                  </div>
                  <div style={{ fontSize: '11px', color: '#707973' }}>
                    Calibrated Datalogger Attached
                  </div>
                </div>

                {/* STAGE 03 - ACTIVE */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(62, 123, 132, 0.08)',
                  border: '1.5px solid #3E7B84'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#3E7B84', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      ● ACTIVE STAGE 03
                    </span>
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#3E7B84',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>
                      3
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', marginBottom: '4px' }}>
                    Out for Priority Cold Dispatch
                  </div>
                  <div style={{ fontSize: '11px', color: '#3E7B84' }}>
                    Live GPS Corridor Synchronized
                  </div>
                </div>

                {/* STAGE 04 */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EFE9E4',
                  opacity: 0.8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      STAGE 04
                    </span>
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#D6CEC7',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>
                      4
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', marginBottom: '4px' }}>
                    Guardian Thermal Handshake
                  </div>
                  <div style={{ fontSize: '11px', color: '#707973' }}>
                    Direct digital sign-off via Health Vault
                  </div>
                </div>

              </div>

            </div>

            {/* ── 3. Manifest & Settlement Row (2-Column Grid) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '28px',
              marginBottom: '48px'
            }}>

              {/* LEFT COLUMN: Patient Header + Prescription Manifest */}
              <div>
                {/* Patient Header Card */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EBE5DF',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#EED9CC',
                      color: '#7C3C24',
                      fontSize: '17px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {(activeHeroOrder.recipient || 'C')[0]}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#160F0C' }}>
                          {activeHeroOrder.recipient}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(62, 123, 132, 0.12)',
                          color: '#3E7B84',
                          padding: '2px 8px',
                          borderRadius: '9999px'
                        }}>
                          Patient
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#707973', marginTop: '2px' }}>
                        {activeHeroOrder.rawOrder?.patientInfo || 'Registered Companion • Sovereign Health Vault'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '10.5px',
                    fontFamily: 'monospace',
                    backgroundColor: '#FAF7F5',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #EFE9E4',
                    color: '#675C58'
                  }}>
                    {activeHeroOrder.rawOrder?.microchip ? `MICROCHIP: #${activeHeroOrder.rawOrder.microchip}` : `ORDER: #${activeHeroOrder.id}`}
                  </div>
                </div>

                {/* Manifest List Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}>
                  <h2 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#160F0C',
                    margin: 0
                  }}>
                    Prescription & Formulation Manifest
                  </h2>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#8C827A',
                    letterSpacing: '0.06em'
                  }}>
                    {activeHeroOrder.rawOrder?.items?.length || 1} DISPENSARY ITEMS
                  </span>
                </div>

                {/* Items List */}
                {activeHeroOrder.rawOrder?.items && activeHeroOrder.rawOrder.items.length > 0 ? (
                  activeHeroOrder.rawOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #EBE5DF',
                        padding: '16px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: '#F5EFEB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#45848D'
                        }}>
                          <Layers size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C' }}>
                              {it.name || it.title || 'Formulation Item'}
                            </span>
                            {it.prescriptionRequired && (
                              <span style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                backgroundColor: 'rgba(62, 123, 132, 0.1)',
                                color: '#3E7B84',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                Rx Verified
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#675C58', marginTop: '2px' }}>
                            {it.subtitle || it.category || 'Dispensary Item'}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#8C827A', fontFamily: 'monospace', marginTop: '2px' }}>
                            {it.batch ? `Batch #${it.batch}` : `Batch #${activeHeroOrder.batch}`} • Controlled Stasis
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>
                          ৳{Number((it.price || 0) * (it.qty || 1)).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8C827A' }}>Qty: {it.qty || 1}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #EBE5DF',
                    padding: '16px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#F5EFEB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#45848D'
                      }}>
                        <Layers size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C' }}>
                          {activeHeroOrder.title}
                        </span>
                        <div style={{ fontSize: '12px', color: '#675C58', marginTop: '2px' }}>
                          Clinical Prescription Consignment
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>{activeHeroOrder.total}</div>
                      <div style={{ fontSize: '11px', color: '#8C827A' }}>Qty: 1</div>
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: Payment & Vault Sync */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #EBE5DF',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#3E7B84',
                    marginBottom: '4px'
                  }}>
                    SETTLEMENT LEDGER
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#160F0C',
                    margin: '0 0 16px 0'
                  }}>
                    Payment & Vault Sync
                  </h2>

                  {/* Cost Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#675C58' }}>
                      <span>Prescription Subtotal</span>
                      <span style={{ fontWeight: 600, color: '#160F0C' }}>
                        ৳{Number(activeHeroOrder.rawOrder?.subtotal || activeHeroOrder.priceNum || 0).toLocaleString()}
                      </span>
                    </div>
                    {Number(activeHeroOrder.rawOrder?.discount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#675C58' }}>
                        <span>Dispensary Voucher</span>
                        <span style={{ fontWeight: 600, color: '#047857' }}>
                          -৳{Number(activeHeroOrder.rawOrder.discount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#675C58' }}>
                      <span>Cold Express Logistics</span>
                      <span style={{ fontWeight: 600, color: '#3E7B84' }}>Complimentary (৳0)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#675C58' }}>
                      <span>Regulatory Datalogger Certification</span>
                      <span style={{ fontWeight: 600, color: '#160F0C' }}>৳0.00</span>
                    </div>
                  </div>

                  {/* Total Paid Highlight Box */}
                  <div style={{
                    backgroundColor: '#FAF7F5',
                    borderRadius: '12px',
                    border: '1px solid #EFE9E4',
                    padding: '14px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C' }}>Total Paid</span>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '24px',
                        fontWeight: 800,
                        color: '#160F0C'
                      }}>
                        {activeHeroOrder.total}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#707973', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={13} />
                      {activeHeroOrder.rawOrder?.paymentDetails || activeHeroOrder.paymentMethod}
                    </div>
                  </div>

                  {/* Automated EHR Ledger Sync Box */}
                  <div style={{
                    backgroundColor: 'rgba(62, 123, 132, 0.08)',
                    border: '1px solid rgba(62, 123, 132, 0.2)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Activity size={16} color="#3E7B84" />
                      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#3E7B84', textTransform: 'uppercase' }}>
                        AUTOMATED EHR LEDGER SYNC
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
                      Upon courier digital temperature handshake confirmation, batch numbers, certificates, and dispensing records will instantly attach to {activeHeroOrder.recipient}'s official Pet Maya Health Vault.
                    </p>
                  </div>
                </div>

                {/* Bottom Security Certification Label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#8C827A',
                  fontFamily: 'var(--font-mono, monospace)',
                  borderTop: '1px solid #EBE5DF',
                  paddingTop: '12px'
                }}>
                  <Lock size={12} />
                  BSEC TEMPERATURE VERIFICATION #R-78217
                </div>
              </div>

            </div>
          </>
        )}

        {/* ── 4. Past Formulations & Hardware Dispatches (Dispensary Archive) ── */}
        <div style={{ marginBottom: '56px' }}>
          
          {/* Header & Category Switcher */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#3E7B84',
                marginBottom: '4px'
              }}>
                DISPENSARY ARCHIVE
              </div>
              <h2 style={{
                fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                fontSize: '26px',
                fontWeight: 800,
                color: '#160F0C',
                margin: '0 0 6px 0'
              }}>
                Past Formulations & Hardware Dispatches
              </h2>
              <p style={{ fontSize: '13px', color: '#707973', margin: 0 }}>
                Historical verification logs, batch certificates, and biometric synchronization records.
              </p>
            </div>

            {/* Filter Tabs Capsule */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#EBE5DC',
              padding: '4px',
              borderRadius: '9999px'
            }}>
              {[
                { id: 'all', label: `All Orders (${countAll})` },
                { id: 'cold-chain', label: `Cold-Chain Prescriptions (${countCold})` },
                { id: 'hardware', label: `Hardware & Supplies (${countHardware})` },
                { id: 'auto-refill', label: `Auto-Refill Active (${countAutoRefill})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setArchiveFilter(tab.id)}
                  style={{
                    backgroundColor: archiveFilter === tab.id ? '#160F0C' : 'transparent',
                    color: archiveFilter === tab.id ? '#FFFFFF' : '#675C58',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Archive Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #EBE5DF',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(62, 123, 132, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3E7B84',
                  margin: '0 auto 16px'
                }}>
                  <Truck size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#160F0C', margin: '0 0 8px 0' }}>
                  No Order Manifests in Cold Ledger
                </h3>
                <p style={{ fontSize: '13px', color: '#675C58', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  {archiveFilter === 'all'
                    ? 'No prescription consignments or telemetry hardware orders recorded yet.'
                    : `No orders match the "${archiveFilter}" filter criteria.`}
                </p>
                <button
                  onClick={() => handleRoute('shop')}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '9999px',
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Explore Clinical Dispensary
                </button>
              </div>
            ) : (
              filteredOrders.map(order => (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EBE5DF',
                  padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                {/* Card Top Row: Order ID + Status Badge + Recipient + Temp/Telemetry Pill */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#160F0C'
                    }}>
                      Order #{order.id}
                    </span>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: order.statusColor,
                      backgroundColor: order.statusColor === '#10B981' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em'
                    }}>
                      {order.status}
                    </span>

                    <span style={{ fontSize: '11.5px', color: '#707973' }}>
                      Recipient: <strong>{order.recipient}</strong>
                    </span>
                  </div>

                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: order.tempTagColor,
                    backgroundColor: order.tempTagBg,
                    padding: '4px 10px',
                    borderRadius: '9999px'
                  }}>
                    {order.tempTag}
                  </div>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#160F0C',
                  margin: '0 0 12px 0',
                  lineHeight: 1.4
                }}>
                  {order.title}
                </h3>

                {/* Bottom Row: Payment & Sync Status on Left + Action Buttons on Right */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #F5EFEB'
                }}>
                  <div style={{ fontSize: '12px', color: '#675C58', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span>Total: <strong style={{ color: '#160F0C' }}>{order.total}</strong></span>
                    <span>•</span>
                    <span>Payment: {order.paymentMethod}</span>
                    <span>•</span>
                    <span style={{ color: '#3E7B84', fontWeight: 600 }}>{order.syncNote}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {order.category.includes('hardware') ? (
                      <>
                        <button
                          onClick={() => showToast('Hardware diagnostic initiated: Collar Telemetry Firmware v4.8 verified OK (100% Signal)', 'info')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D6CEC7',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#160F0C',
                            cursor: 'pointer'
                          }}
                        >
                          ⚙ Hardware Diagnostic
                        </button>
                        <button
                          onClick={() => handleRoute('pet-gps')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D6CEC7',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#160F0C',
                            cursor: 'pointer'
                          }}
                        >
                          🗺 View Radar Map
                        </button>
                        <button
                          onClick={() => handleReorder('Maya Halo™ Extra Strap (Titanium)', 2500)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            backgroundColor: '#160F0C',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          Order Extra Strap
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setActiveInvoiceOrder(order);
                            setShowInvoiceModal(true);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D6CEC7',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#160F0C',
                            cursor: 'pointer'
                          }}
                        >
                          📄 Tax Invoice
                        </button>
                        <button
                          onClick={() => handleOpenCertificate(order.id, order.title, order.batch, '4.2°C', order.cryptoHash)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D6CEC7',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#160F0C',
                            cursor: 'pointer'
                          }}
                        >
                          🔬 Batch Cert
                        </button>
                        <button
                          onClick={() => {
                            showToast(`Cryptographic receipt synced to ${order.recipient || 'Companion'}'s Vault ledger!`, 'success');
                            handleRoute('digital-pet-passport');
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D6CEC7',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#160F0C',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Sync to Health Vault
                        </button>
                        <button
                          onClick={() => handleReorder(order.title, order.priceNum)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '9999px',
                            backgroundColor: '#160F0C',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          Reorder with 1-Click
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          </div>

        </div>

        {/* ── 5. Trust Pillars Bar ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#F5EFEB',
          borderRadius: '18px',
          border: '1px solid #E5DED6',
          marginBottom: '56px'
        }}>
          {/* Pillar 1 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                100% Genuine Biologics
              </div>
              <div style={{ fontSize: '11.5px', color: '#675C58', lineHeight: 1.45 }}>
                Direct sourcing from licensed European & Swiss manufacturers.
              </div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3E7B84',
              flexShrink: 0
            }}>
              <Snowflake size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                ISO 9001:2015 Cold Logistics
              </div>
              <div style={{ fontSize: '11.5px', color: '#675C58', lineHeight: 1.45 }}>
                Unbroken 2°C - 8°C hermetic telemetry on all live antigen parcels.
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7C3C24',
              flexShrink: 0
            }}>
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                AAHA Accredited Supply Chain
              </div>
              <div style={{ fontSize: '11.5px', color: '#675C58', lineHeight: 1.45 }}>
                Overseen by resident licensed veterinary pharmacists round the clock.
              </div>
            </div>
          </div>

          {/* Pillar 4 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#45848D',
              flexShrink: 0
            }}>
              <Activity size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                Direct Microchip EHR Sync
              </div>
              <div style={{ fontSize: '11.5px', color: '#675C58', lineHeight: 1.45 }}>
                Instant digital vaccination ledger update to companion's permanent Health Vault.
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ════════════════════════════════════════════════════════════════
          REFERENCE-EXACT CLINICAL EDITORIAL FOOTER
          ════════════════════════════════════════════════════════════════ */}
      <footer style={{
        backgroundColor: '#FDF8F5',
        borderTop: '1px solid rgba(222, 217, 214, 0.8)',
        padding: '48px 24px 28px',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          
          {/* Main Footer Directory Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px',
            paddingBottom: '36px',
            borderBottom: '1px solid #EBE5DF'
          }}>
            {/* Col 1: Brand & Philosophy */}
            <div>
              <div style={{
                fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '8px'
              }}>
                Pet Maya
              </div>
              <p style={{ fontSize: '13px', color: '#675C58', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                Elevated veterinary apothecary and clinical intelligence crafted for longevity and serene companion care.
              </p>
              <div style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#047857',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                AAHA CERTIFIED FACILITY #9012
              </div>
            </div>

            {/* Col 2: Clinical Directives */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '14px'
              }}>
                CLINICAL DIRECTIVES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <a onClick={() => handleRoute('ai')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Emergency Protocols</a>
                <a onClick={() => handleRoute('specialists')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Accredited Specialists</a>
                <a onClick={() => handleRoute('shop')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Compounded Rx Pharmacy</a>
                <a onClick={() => handleRoute('digital-pet-passport')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Microchip & Vitals Vault</a>
              </div>
            </div>

            {/* Col 3: Pet Guardian Services */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '14px'
              }}>
                PET GUARDIAN SERVICES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <a onClick={() => handleRoute('shop')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Prescription Refills</a>
                <a onClick={() => handleRoute('digital-pet-passport')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Diagnostic Records</a>
                <a onClick={() => handleRoute('pet-gps')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Telemetry & Radar Sync</a>
                <a onClick={() => handleRoute('shop')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Autoship Management</a>
              </div>
            </div>

            {/* Col 4: 24/7 Helpline */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '14px'
              }}>
                24/7 VETERINARY HELPLINE
              </div>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EBE5DF',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', color: '#707973', fontWeight: 600 }}>Licensed On-Call Triage</span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#160F0C',
                  fontFamily: 'var(--font-mono, monospace)'
                }}>
                  1-080-PET-MAYA (738-6292)
                </span>
                <span style={{ fontSize: '10px', color: '#8C827A' }}>
                  National Pharmacist Permit: ARX-88210
                </span>
              </div>
            </div>

          </div>

          {/* Legal Bottom Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingTop: '20px',
            fontSize: '11.5px',
            color: '#8C827A'
          }}>
            <div>
              © 2026 PET MAYA APOTHECARY & CLINIC LTD. STRICTLY ADHERES TO AAHI AND AVMA PRACTICE STANDARDS.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span onClick={() => handleRoute('privacy')} style={{ cursor: 'pointer' }}>CLINICAL PRIVACY</span>
              <span>•</span>
              <span onClick={() => handleRoute('terms')} style={{ cursor: 'pointer' }}>PRESCRIPTION COMPLIANCE</span>
              <span>•</span>
              <span onClick={() => handleRoute('terms')} style={{ cursor: 'pointer' }}>TELEHEALTH TERMS</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          INTERACTIVE MODALS
          ════════════════════════════════════════════════════════════════ */}

      {/* 1. Batch Certificate Modal */}
      {showCertificateModal && activeCert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowCertificateModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8C827A'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ShieldCheck size={28} color="#047857" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#160F0C' }}>
                  Clinical Batch & Cold-Chain Certificate
                </h3>
                <div style={{ fontSize: '11.5px', color: '#707973' }}>
                  Authenticated by Pet Maya Quality Control Laboratory
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#FAF7F5',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '12.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px',
              border: '1px solid #EBE5DF'
            }}>
              <div><strong>Dispensary Order:</strong> #{activeCert.orderId}</div>
              <div><strong>Formulation:</strong> {activeCert.product}</div>
              <div><strong>Lot & Batch Code:</strong> <code>{activeCert.batch}</code></div>
              <div><strong>Datalogger Final Handoff Temp:</strong> <span style={{ color: '#047857', fontWeight: 700 }}>{activeCert.temp}</span></div>
              <div><strong>Cryptographic Hash:</strong> <code>{activeCert.hash}</code></div>
              <div><strong>QC Pharmacist:</strong> Dr. Evelyn Vance, MRCVS (Lic #AA872)</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('Certificate PDF downloaded', 'success');
                  setShowCertificateModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '9999px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Download Official Certificate
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: '#FAF7F5',
                  color: '#160F0C',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1px solid #D6CEC7',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Contact Pod Courier Modal */}
      {showContactCourierModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowContactCourierModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8C827A'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(62, 123, 132, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3E7B84'
              }}>
                <Phone size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#160F0C' }}>
                  Contact Courier Kamrul Hasan
                </h3>
                <div style={{ fontSize: '12px', color: '#707973' }}>
                  Electric Pod #09 • Banani Sector 11
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#675C58', lineHeight: 1.5, marginBottom: '20px' }}>
              Direct encrypted cellular link to cold-chain delivery vehicle. Courier will confirm the LCD datalogger reading before opening the nitrogen buffer pod.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="tel:01711000000"
                onClick={() => {
                  showToast('Connecting to Courier Pod #09...', 'info');
                  setShowContactCourierModal(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '9999px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                <Phone size={15} /> Call Courier Directly (+880 1711-000000)
              </a>
              <button
                onClick={() => {
                  showToast('Gate buzz notification sent to courier pod LCD', 'success');
                  setShowContactCourierModal(false);
                }}
                style={{
                  padding: '11px',
                  borderRadius: '9999px',
                  backgroundColor: '#FAF7F5',
                  color: '#160F0C',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1px solid #D6CEC7',
                  cursor: 'pointer'
                }}
              >
                Send Automated "Ring Gate Bell" Ping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tax Invoice Modal */}
      {showInvoiceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowInvoiceModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8C827A'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ borderBottom: '1px solid #EBE5DF', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.15em', color: '#45848D', textTransform: 'uppercase' }}>
                PET MAYA APOTHECARY & CLINIC LTD.
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0', color: '#160F0C' }}>
                Tax Invoice & Manifest #{activeInvoiceOrder?.id || activeInvoiceOrder?.orderId || 'PM-INVOICE'}
              </h2>
              <div style={{ fontSize: '12px', color: '#707973', marginTop: '4px' }}>
                Issued: {activeInvoiceOrder?.rawOrder?.date || activeInvoiceOrder?.date || new Date().toISOString().split('T')[0]} • Patient: {activeInvoiceOrder?.recipient || activeInvoiceOrder?.rawOrder?.patient || 'Companion'}
              </div>
            </div>

            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {activeInvoiceOrder?.rawOrder?.items && activeInvoiceOrder.rawOrder.items.length > 0 ? (
                activeInvoiceOrder.rawOrder.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.name || it.title} (x{it.qty || 1})</span>
                    <strong>৳{Number((it.price || 0) * (it.qty || 1)).toLocaleString()}</strong>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{activeInvoiceOrder?.title || 'Prescription Order Consignment'}</span>
                  <strong>{activeInvoiceOrder?.total || '৳0.00'}</strong>
                </div>
              )}
              {Number(activeInvoiceOrder?.rawOrder?.discount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                  <span>Dispensary Voucher</span>
                  <strong>-৳{Number(activeInvoiceOrder.rawOrder.discount).toLocaleString()}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EBE5DF', paddingTop: '10px', fontSize: '15px' }}>
                <strong>Total Amount Paid</strong>
                <strong>{activeInvoiceOrder?.total || (activeInvoiceOrder?.rawOrder ? `৳${Number(activeInvoiceOrder.rawOrder.total || 0).toLocaleString()}` : '৳5,636.00')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  handleDownloadInvoice(activeInvoiceOrder || allOrders[0]);
                  setShowInvoiceModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '9999px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Download PDF
              </button>
              <button
                onClick={() => setShowInvoiceModal(false)}
                style={{
                  padding: '11px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#FAF7F5',
                  color: '#160F0C',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1px solid #D6CEC7',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Pharmacy Concierge Live Chat Modal */}
      {showConciergeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#FDF8F5',
              borderBottom: '1px solid #EBE5DF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Headphones size={18} color="#45848D" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#160F0C' }}>
                    Clinical Pharmacy Concierge
                  </h3>
                  <div style={{ fontSize: '11px', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    Live • Dr. Evelyn Vance, MRCVS
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowConciergeModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#FAF7F5'
            }}>
              {conciergeChat.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: msg.sender === 'user' ? '#160F0C' : '#FFFFFF',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#160F0C',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    border: msg.sender === 'user' ? 'none' : '1px solid #EBE5DF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  {msg.sender === 'pharmacist' && (
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#3E7B84', marginBottom: '4px' }}>
                      {msg.name} ({msg.title})
                    </div>
                  )}
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendConcierge}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #EBE5DF',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                gap: '8px'
              }}
            >
              <input
                type="text"
                value={conciergeMsg}
                onChange={(e) => setConciergeMsg(e.target.value)}
                placeholder="Ask about storage, dosing, or cold-chain integrity..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #D6CEC7',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Inline Keyframes for rotating snowflake & ping */}
      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 14s linear infinite;
        }
      `}</style>
    </div>
  );
}

