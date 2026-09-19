import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  ChevronRight, 
  Check, 
  ArrowLeft, 
  ExternalLink,
  Info,
  Truck,
  Sparkles,
  Lock,
  Thermometer,
  RotateCcw,
  Star,
  Activity,
  Zap,
  Clock,
  Heart,
  FileText,
  AlertCircle,
  Video,
  ShoppingBag
} from 'lucide-react';

export default function ProductDetailPage({ productId, onBack, onNavigate }) {
  const { products, addToCart, openModal, showToast } = useApp();

  // Active Gallery Image
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [is360Mode, setIs360Mode] = useState(false);
  const [rotDegree, setRotDegree] = useState(0);

  // Gallery assets matching reference
  const galleryItems = [
    {
      id: 'box',
      label: 'Primary Pack',
      src: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&auto=format&fit=crop&q=80',
      alt: 'NexGard Spectra Packaging Box on natural stone pedestal'
    },
    {
      id: 'blister',
      label: 'Blister Foil',
      src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&auto=format&fit=crop&q=80',
      alt: 'Pharmaceutical foil blister pack with chewables'
    },
    {
      id: 'lab',
      label: 'GC-MS Assay',
      src: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&auto=format&fit=crop&q=80',
      alt: 'Analytical balance and HPLC chromatography in clinical lab'
    },
    {
      id: 'coldchain',
      label: 'Cold-Chain Log',
      src: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=900&auto=format&fit=crop&q=80',
      alt: 'Refrigerated cold-chain pharmaceutical insulated container'
    }
  ];

  // Weight & Dosage Range state (2x2 grid)
  const weightVariants = [
    {
      id: 'small',
      tier: 'Small Dog',
      range: '3.5 - 7.5 kg',
      molecules: 'Afoxolaner 18.75mg / Milbemycin 3.75mg',
      basePrice: 1250,
      origPrice: 1480,
      isRecommended: false
    },
    {
      id: 'medium',
      tier: 'Medium Dog',
      range: '7.5 - 15.0 kg',
      molecules: 'Afoxolaner 37.5mg / Milbemycin 7.5mg',
      basePrice: 1390,
      origPrice: 1650,
      isRecommended: false
    },
    {
      id: 'med-large',
      tier: 'Medium-Large Dog',
      range: '15.1 - 30.0 kg',
      molecules: 'Afoxolaner 75.0mg / Milbemycin 15.0mg',
      basePrice: 1568,
      origPrice: 1850,
      isRecommended: true
    },
    {
      id: 'large',
      tier: 'Large Dog',
      range: '30.1 - 60.0 kg',
      molecules: 'Afoxolaner 150.0mg / Milbemycin 30.0mg',
      basePrice: 1780,
      origPrice: 2100,
      isRecommended: false
    }
  ];
  const [selectedWeightId, setSelectedWeightId] = useState('med-large');
  const activeWeight = weightVariants.find(w => w.id === selectedWeightId) || weightVariants[2];

  // Supply Duration Packs
  const supplyPacks = [
    {
      id: '1-month',
      duration: '1-Month Dose',
      multiplier: 1,
      savingsNote: 'Standard Single Dose'
    },
    {
      id: '3-month',
      duration: '3-Month Supply',
      multiplier: 2.85,
      savingsNote: 'Save ৳236 • Seasonal Course'
    },
    {
      id: '6-month',
      duration: '6-Month Protocol',
      multiplier: 5.4,
      savingsNote: 'Save ৳948 • Semi-Annual Guard'
    }
  ];
  const [selectedPackId, setSelectedPackId] = useState('1-month');
  const activePack = supplyPacks.find(p => p.id === selectedPackId) || supplyPacks[0];

  // Purchase / Refill Mode
  const [purchaseMode, setPurchaseMode] = useState('single'); // 'single' | 'refill'

  // Pharmacology Sub-tab
  const [activePharmTab, setActivePharmTab] = useState('active_molecules'); // 'active_molecules' | 'pharmacokinetics' | 'safety' | 'admin'

  // Dynamic calculated price
  const calculatePrice = () => {
    let price = Math.round(activeWeight.basePrice * activePack.multiplier);
    if (purchaseMode === 'refill') {
      price = Math.round(price * 0.9); // 10% off auto-refill
    }
    return price;
  };

  const calculateOriginalPrice = () => {
    return Math.round(activeWeight.origPrice * activePack.multiplier);
  };

  const handleAddToCart = () => {
    const finalPrice = calculatePrice();
    const itemToAdd = {
      id: `nexgard-spectra-${selectedWeightId}-${selectedPackId}`,
      name: `NexGard Spectra® Chewables (${activeWeight.range})`,
      category: 'parasitology',
      price: finalPrice,
      originalPrice: calculateOriginalPrice(),
      image: galleryItems[0].src,
      selectedWeight: activeWeight.range,
      selectedPack: activePack.duration,
      mode: purchaseMode === 'refill' ? 'Auto-Refill (10% Off)' : 'Single Fill',
      quantity: 1
    };

    addToCart(itemToAdd, 1);
    openModal('cart');
    showToast(`Added ${itemToAdd.name} to Care Bag (৳${finalPrice.toLocaleString()})`, 'success');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('shop');
    } else {
      window.location.hash = 'shop';
    }
  };

  const handleVetConsult = () => {
    if (onNavigate) {
      onNavigate('specialists');
    } else {
      window.location.hash = 'specialists';
    }
  };

  return (
    <div style={{
      backgroundColor: '#FAF7F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", sans-serif)',
      paddingBottom: '96px'
    }}>
      {/* ════════════════════════════════════════════════════════════════
          TOP SUB-BAR: BREADCRUMBS & CLINICAL COMPLIANCE BADGES
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        borderBottom: '1px solid #EBE4DF',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Breadcrumb Path */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#707973'
          }}>
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: '#346B73',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 600,
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}
            >
              CARE SHOP
            </button>
            <span>/</span>
            <span>CLINICAL PARASITOLOGY</span>
            <span>/</span>
            <span style={{ color: '#160F0C', fontWeight: 600 }}>BROAD-SPECTRUM ENDECTOCIDES</span>
          </div>

          {/* Compliance Capsules */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#F3EFEA',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#346B73',
              letterSpacing: '0.04em'
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
              FDA & EMA VETERINARY APPROVED
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#F3EFEA',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#346B73',
              letterSpacing: '0.04em'
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
              BATCH VERIFIED VIA GC-MS
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#F3EFEA',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#346B73',
              letterSpacing: '0.04em'
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
              REFRIGERATED COLD-CHAIN DISPATCH
            </span>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '36px 24px 0 24px'
      }}>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1: HERO PRODUCT STAGE (2-COLUMN GRID)
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'clamp(32px, 4.5vw, 64px)',
          alignItems: 'flex-start',
          marginBottom: '48px'
        }}>
          
          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN: PRODUCT STAGING & SUPPLY CHAIN ASSURANCE
              ───────────────────────────────────────────────────────────── */}
          <div>
            {/* Primary Main Image Box */}
            <div style={{
              backgroundColor: '#EBE5DE',
              borderRadius: '24px',
              border: '1px solid #DFD7CF',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 16px 40px rgba(0,0,0,0.04)',
              marginBottom: '16px'
            }}>
              {/* Top Floating Badge Bar */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 5
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: '#0D9488',
                  letterSpacing: '0.05em'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
                  RESTRICTED CLINICAL COMPOUND
                </span>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: '#675C58',
                  letterSpacing: '0.05em'
                }}>
                  AUTHENTICITY: #9941M
                </span>
              </div>

              {/* Main Product Display Area - Full Fill */}
              <div style={{
                width: '100%',
                height: '460px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EBE5DE',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  transform: is360Mode ? `rotateY(${rotDegree}deg)` : 'none',
                  transition: 'transform 0.4s ease'
                }}>
                  <img
                    src={galleryItems[activeImageIdx].src}
                    alt={galleryItems[activeImageIdx].alt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>

                {/* 360 Interactive Preview Pill */}
                <button
                  onClick={() => {
                    setIs360Mode(!is360Mode);
                    setRotDegree(prev => prev + 90);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #D6CDC5',
                    borderRadius: '9999px',
                    padding: '7px 16px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    color: '#160F0C',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    zIndex: 5
                  }}
                >
                  <RotateCcw size={13} color="#346B73" />
                  <span>360° CLINICAL PACKAGING</span>
                </button>
              </div>

              {/* Bottom Meta Bar below Image */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid #DFD7CF',
                backgroundColor: '#F3EFEA',
                textAlign: 'center'
              }}>
                <div style={{ padding: '12px 8px', borderRight: '1px solid #DFD7CF' }}>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', marginBottom: '2px' }}>
                    SPECIFICATION
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                    {activeWeight.range}
                  </div>
                </div>

                <div style={{ padding: '12px 8px', borderRight: '1px solid #DFD7CF' }}>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', marginBottom: '2px' }}>
                    DOSAGE
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                    1 CHEW MONTHLY
                  </div>
                </div>

                <div style={{ padding: '12px 8px' }}>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', marginBottom: '2px' }}>
                    STATUS
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
                    IN CLINICAL DISPENSARY
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip (4 Images) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {galleryItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: activeImageIdx === idx ? '2px solid #346B73' : '1px solid #E5DED8',
                    borderRadius: '14px',
                    padding: '6px',
                    height: '84px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    style={{
                      width: '100%',
                      height: '52px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <span style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    color: activeImageIdx === idx ? '#346B73' : '#707973',
                    marginTop: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Supply-Chain Integrity Assurance Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#E6F4F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={18} color="#0D9488" />
                </div>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Authentic Veterinary Supply-Chain Guarantee
                  </h4>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                    DIRECT IMPORTER CERTIFICATE #EU-2026-BD
                  </div>
                </div>
              </div>

              <p style={{
                fontSize: '12px',
                lineHeight: 1.6,
                color: '#675C58',
                margin: '0 0 14px 0'
              }}>
                Every blister unit is directly imported via licensed European cold-chain corridors, verified for active compound potency via gas chromatography, and stored in humidity-controlled vaults.
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#FAF7F5',
                border: '1px solid #EFE8E2',
                borderRadius: '10px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#346B73'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} color="#0D9488" />
                  Attested to Microchip #981020002847192 • Vault Locked
                </span>
                <span style={{ fontWeight: 700, cursor: 'pointer' }}>
                  Verified Hash ↗
                </span>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN: PRODUCT TITLE, PRICING & CLINICAL ACTIONS
              ───────────────────────────────────────────────────────────── */}
          <div>
            
            {/* Category & Monograph Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#707973',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                BOEHRINGER INGELHEIM • RX PARASITICIDE
              </span>

              <a
                href="#clinical-monograph"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#346B73',
                  textDecoration: 'none'
                }}
              >
                <span>View Clinical Monograph</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Product Headline (Playfair Display) */}
            <h1 style={{
              fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(32px, 3.8vw, 42px)',
              lineHeight: 1.15,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#160F0C',
              margin: '0 0 12px 0'
            }}>
              NexGard Spectra®<br />
              <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Chewables</span>
            </h1>

            {/* Scientific Indication Subtitle */}
            <p style={{
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono, monospace)',
              lineHeight: 1.6,
              color: '#675C58',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              margin: '0 0 16px 0',
              maxWidth: '640px'
            }}>
              BROAD-SPECTRUM ORAL ENDECTOCIDE CHEWABLE TABLETS FOR DOGS. PREVENTS HEARTWORM DISEASE, KILLS TICKS, FLEAS, MITES, AND CONTROLS INTESTINAL NEMATODES.
            </p>

            {/* Rating & Prescription Badge Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#160F0C'
              }}>
                <div style={{ display: 'flex', color: '#D97706' }}>
                  <Star size={14} fill="#D97706" color="#D97706" />
                </div>
                <span>4.9</span>
                <span style={{ color: '#707973', fontWeight: 400, fontSize: '12px' }}>
                  (148 Clinical Reviews)
                </span>
              </div>

              <span style={{ color: '#D6CDC5' }}>•</span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#F7EBE5',
                color: '#9E3A1A',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                <Lock size={11} color="#9E3A1A" />
                VETERINARY PRESCRIPTION REQUIRED
              </span>
            </div>

            {/* Price Box with VAT & Cold Delivery Note */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    color: '#160F0C',
                    letterSpacing: '-0.02em'
                  }}>
                    ৳{calculatePrice().toLocaleString()}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#A09893',
                    textDecoration: 'line-through'
                  }}>
                    ৳{calculateOriginalPrice().toLocaleString()}
                  </span>
                  <span style={{
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}>
                    -15% OFF
                  </span>
                </div>

                <div style={{
                  fontSize: '11.5px',
                  color: '#0D9488',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Truck size={13} />
                  VAT Inclusive • Free Cold-Chain Delivery
                </div>
              </div>

              <div style={{
                fontSize: '11.5px',
                color: '#707973',
                lineHeight: 1.5
              }}>
                Prescription verification conducted instantly by Maya AI Triage or uploaded Rx during checkout.
              </div>
            </div>

            {/* Patient Linked Microchip Sync Box */}
            <div style={{
              backgroundColor: '#F0F8F6',
              border: '1px solid #C8E6DF',
              borderRadius: '16px',
              padding: '14px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  🐕
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                    PATIENT: Milo <span style={{ fontWeight: 400, color: '#675C58' }}>(Golden Retriever • 28.4 kg)</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#0D9488', fontFamily: 'var(--font-mono, monospace)' }}>
                    Recommended dosage auto-calculated: Medium-Large Dog (15.1 - 30.0kg)
                  </div>
                </div>
              </div>

              <button
                onClick={() => showToast('Switched patient profile context', 'info')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#346B73',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change Patient
              </button>
            </div>

            {/* Weight & Dosage Variant Selector (2x2 Grid) */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: '#160F0C',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>
                  SELECT CANINE BODY WEIGHT RANGE
                </span>

                <button
                  onClick={() => openModal('health')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#346B73',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Info size={12} />
                  <span>Weight Sizing Guide</span>
                </button>
              </div>

              {/* 2x2 Grid of Weight Options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                {weightVariants.map((item) => {
                  const isSelected = selectedWeightId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedWeightId(item.id)}
                      style={{
                        backgroundColor: isSelected ? '#FFFFFF' : '#FAF7F5',
                        border: isSelected ? '2px solid #0D9488' : '1px solid #E2DAD3',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: isSelected ? '0 4px 14px rgba(13,148,136,0.12)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.isRecommended && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '10px',
                          backgroundColor: '#0D9488',
                          color: '#FFFFFF',
                          fontSize: '8.5px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em'
                        }}>
                          RECOMMENDED FOR MILO
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                          {item.tier}
                        </span>
                        {isSelected && <Check size={14} color="#0D9488" />}
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#0D9488' : '#160F0C', marginBottom: '4px' }}>
                        {item.range}
                      </div>

                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.molecules}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Supply Duration / Pack Quantity Selector (3 Columns) */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#160F0C',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}>
                SELECT SUPPLY PROTOCOL DURATION
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
              }}>
                {supplyPacks.map((pack) => {
                  const isSelected = selectedPackId === pack.id;
                  const price = Math.round(activeWeight.basePrice * pack.multiplier);
                  return (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      style={{
                        backgroundColor: isSelected ? '#FFFFFF' : '#FAF7F5',
                        border: isSelected ? '2px solid #160F0C' : '1px solid #E2DAD3',
                        borderRadius: '14px',
                        padding: '12px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C', marginBottom: '2px' }}>
                        {pack.duration}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#160F0C', marginBottom: '4px' }}>
                        ৳{price.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: isSelected ? '#0D9488' : '#707973' }}>
                        {pack.savingsNote}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fulfillment Mode (Single vs Auto-Refill) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '28px'
            }}>
              {/* Option 1: Single Dispensary Fill */}
              <button
                onClick={() => setPurchaseMode('single')}
                style={{
                  backgroundColor: purchaseMode === 'single' ? '#FFFFFF' : '#FAF7F5',
                  border: purchaseMode === 'single' ? '2px solid #160F0C' : '1px solid #E2DAD3',
                  borderRadius: '16px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid #160F0C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {purchaseMode === 'single' && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#160F0C' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                    Single Dispensary Fill
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#675C58', margin: 0, lineHeight: 1.4 }}>
                  Dispatched today in climate box. Ideal for one-time seasonal prevention.
                </p>
              </button>

              {/* Option 2: Auto-Refill Protocol */}
              <button
                onClick={() => setPurchaseMode('refill')}
                style={{
                  backgroundColor: purchaseMode === 'refill' ? '#FFFFFF' : '#FAF7F5',
                  border: purchaseMode === 'refill' ? '2px solid #0D9488' : '1px solid #E2DAD3',
                  borderRadius: '16px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '12px',
                  backgroundColor: '#0D9488',
                  color: '#FFFFFF',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  SAVE 10%
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid #0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {purchaseMode === 'refill' && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                    Auto-Refill Protocol
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#675C58', margin: 0, lineHeight: 1.4 }}>
                  Delivered automatically every 30 days. Never miss a critical heartworm window. Cancel anytime.
                </p>
              </button>
            </div>

            {/* CTAs & Security Guarantee */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={handleAddToCart}
                style={{
                  width: '100%',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '16px 28px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(22, 15, 12, 0.18)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <ShoppingBag size={18} />
                <span>Authorize & Dispense to Bag (৳{calculatePrice().toLocaleString()})</span>
              </button>

              <button
                onClick={handleVetConsult}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#160F0C',
                  border: '1px solid #D6CDC5',
                  borderRadius: '9999px',
                  padding: '14px 28px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Video size={16} color="#346B73" />
                <span>Consult Vet for Instant Rx (15 min wait)</span>
              </button>
            </div>

            {/* Bottom Security Assurance Note */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: '#707973',
              lineHeight: 1.5,
              backgroundColor: '#F3EFEA',
              padding: '10px 14px',
              borderRadius: '12px'
            }}>
              <Lock size={14} color="#707973" style={{ flexShrink: 0 }} />
              <span>
                256-bit HIPAA compliant veterinary transaction. Dispensed exclusively under registered veterinary license #VS-198204-UK. Full cold-chain integrity logged.
              </span>
            </div>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: AI TRIAGE & PRESCRIPTION COMPATIBILITY CALLOUT
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#EFF7F5',
          border: '1px solid #C8E5DF',
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '720px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={22} />
            </div>

            <div>
              <div style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#0D9488',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                PET MAYA CLINICAL PASSPORT COMPLIANCE
              </div>
              <h3 style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: '#160F0C',
                margin: '0 0 4px 0'
              }}>
                Automatic Triage & Prescription Validation
              </h3>
              <p style={{ fontSize: '12.5px', color: '#576560', margin: 0, lineHeight: 1.5 }}>
                Prescription verified via Milo's linked Sovereign Health Vault. No paper prescription upload required if your companion has had an active clinical consult within the last 12 months.
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '6px',
            textAlign: 'right'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #B8E0D7',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              color: '#0D9488'
            }}>
              <Check size={13} color="#0D9488" />
              STATUS: APPROVED & ATTESTED
            </div>
            <div style={{ fontSize: '11px', color: '#707973', fontFamily: 'var(--font-mono, monospace)' }}>
              Attesting Clinician: Dr. Evelyn Vance, MRCVS
            </div>
            <a
              href="#digital-pet-passport"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#346B73',
                textDecoration: 'underline'
              }}
            >
              View Digital Rx ↗
            </a>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3: CLINICAL PHARMACOLOGY & PROTOCOLS
            ════════════════════════════════════════════════════════════════ */}
        <div id="clinical-monograph" style={{ marginBottom: '56px' }}>
          
          {/* Section Header with Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#707973',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                BIO-MOLECULAR PHARMACODYNAMICS
              </div>
              <h2 style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '28px',
                fontWeight: 600,
                color: '#160F0C',
                margin: 0
              }}>
                Clinical Pharmacology & Protocols
              </h2>
            </div>

            {/* Sub-Tabs */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#FFFFFF',
              padding: '4px',
              borderRadius: '9999px',
              border: '1px solid #E5DED8'
            }}>
              {[
                { id: 'active_molecules', label: 'Active Molecules' },
                { id: 'pharmacokinetics', label: 'Pharmacokinetics' },
                { id: 'safety', label: 'Safety & Toxicology' },
                { id: 'admin', label: 'Administration Guide' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePharmTab(tab.id)}
                  style={{
                    backgroundColor: activePharmTab === tab.id ? '#160F0C' : 'transparent',
                    color: activePharmTab === tab.id ? '#FFFFFF' : '#707973',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 16px',
                    fontSize: '11.5px',
                    fontFamily: 'var(--font-mono, monospace)',
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

          {/* 2-Card Pharmacology Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            
            {/* Left Card: Dual Parasite Targeted Strategy */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Zap size={18} color="#0D9488" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                  Dual Parasite Targeted Strategy
                </h3>
              </div>

              {/* Molecule 1: Afoxolaner */}
              <div style={{
                backgroundColor: '#FAF7F5',
                border: '1px solid #EFE8E2',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                    Afoxolaner (75.0mg)
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono, monospace)',
                    backgroundColor: '#EBE4DF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    color: '#675C58'
                  }}>
                    GABA-GATED CHLORIDE CHANNEL ANTAGONIST
                  </span>
                </div>
                <p style={{ fontSize: '12px', lineHeight: 1.55, color: '#675C58', margin: 0 }}>
                  Selectively blocks insect and acarine GABA-gated chloride ion channels, resulting in hyperexcitation and rapid mortality of fleas and ticks within 8 hours of attachment.
                </p>
              </div>

              {/* Molecule 2: Milbemycin Oxime */}
              <div style={{
                backgroundColor: '#FAF7F5',
                border: '1px solid #EFE8E2',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                    Milbemycin Oxime (15.0mg)
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono, monospace)',
                    backgroundColor: '#EBE4DF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    color: '#675C58'
                  }}>
                    MACROCYCLIC LACTONE ENDECTOCIDE
                  </span>
                </div>
                <p style={{ fontSize: '12px', lineHeight: 1.55, color: '#675C58', margin: 0 }}>
                  Binds to glutamate-gated chloride channels in invertebrate nerve and muscle cells, increasing membrane permeability to chloride ions and causing flaccid paralysis of tissue-stage heartworm microfilariae.
                </p>
              </div>

              <a
                href="https://pubchem.ncbi.nlm.nih.gov"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#346B73',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Complete Molecular Structure & Binding Profile (PubChem CID 91754124) ↗
              </a>
            </div>

            {/* Right Card: Parasite Clearance Profile */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Activity size={18} color="#0D9488" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                  Parasite Clearance Profile
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { parasite: 'Ctenocephalides felis (Fleas)', efficacy: '99.8% Cleared in 6h', status: 'optimal' },
                  { parasite: 'Ixodes ricinus & Rhipicephalus (Ticks)', efficacy: '99.2% Cleared in 12h', status: 'optimal' },
                  { parasite: 'Dirofilaria immitis (Heartworm L3/L4)', efficacy: '100% Prophylactic Efficacy', status: 'optimal' },
                  { parasite: 'Toxocara canis (Roundworms, Hookworms)', efficacy: '98.9% Clearance', status: 'optimal' },
                  { parasite: 'Demodex canis & Sarcoptes (Mange Mites)', efficacy: 'Complete Resolution in 14d', status: 'optimal' }
                ].map((row, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#FAF7F5',
                      border: '1px solid #EFE8E2',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#160F0C' }}>
                      {row.parasite}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      color: '#0D9488',
                      backgroundColor: '#E6F4F1',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '10.5px'
                    }}>
                      {row.efficacy}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: COLD-CHAIN TELEMETRY & TRANSIT LOG
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EBE4DF',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '56px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.02)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              color: '#707973',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              PHARMA-GRADE STORAGE MONITORING
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#E6F4F1',
              color: '#0D9488',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
              Cold-Chain Sensor Batch #SN-8821-TK
            </div>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
            fontSize: '24px',
            fontWeight: 600,
            color: '#160F0C',
            margin: '0 0 28px 0'
          }}>
            Hermetic Ambient Protection with Real-Time Thermal Logging
          </h2>

          {/* 4 Checkpoint Progress Line */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
            position: 'relative'
          }}>
            {[
              { step: '01', stage: 'Manufacture Vault', temp: '4.2°C', note: 'Compliant & Sealed', status: 'passed' },
              { step: '02', stage: 'Air Freight Cargo', temp: '3.8°C', note: 'Compliant In-Transit', status: 'passed' },
              { step: '03', stage: 'Dispensary Quarantine', temp: '4.0°C', note: 'Compliant Vault', status: 'passed' },
              { step: '04', stage: 'Local Express Delivery', temp: '4.5°C', note: 'Active Insulated Crate', status: 'active' }
            ].map((node, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '16px',
                  padding: '16px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    color: '#707973'
                  }}>
                    NODE {node.step}
                  </span>
                  <span style={{
                    backgroundColor: '#E6F4F1',
                    color: '#0D9488',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {node.temp}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', marginBottom: '2px' }}>
                  {node.stage}
                </div>
                <div style={{ fontSize: '11px', color: '#675C58' }}>
                  {node.note}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Compliance Attestation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #EBE4DF',
            paddingTop: '16px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#707973',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span>Thermal Drift Margin: ±0.3°C across 72h continuous transit</span>
            <a
              href="#nist-cert"
              style={{ color: '#346B73', fontWeight: 600, textDecoration: 'none' }}
            >
              NIST Traceable Sensor Certificate #9921-A2 ↗
            </a>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 5: ATTENDING CLINICIAN ENDORSEMENT
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EBE4DF',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80"
            alt="Dr. Evelyn Vance, MRCVS"
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #0D9488',
              flexShrink: 0
            }}
          />

          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h3 style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#160F0C',
                margin: 0
              }}>
                Dr. Evelyn Vance, MRCVS
              </h3>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                Faculty Head of Companion Parasitology
              </span>
            </div>

            <p style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#574E4A',
              fontStyle: 'italic',
              margin: '0 0 10px 0'
            }}>
              "NexGard Spectra remains our first-line preventative protocol for high-risk seasonal tick and heartworm exposure. The combination of afoxolaner and milbemycin oxime provides unmatched dual-action efficacy with zero dietary fat interference, meaning it can be given with or without food."
            </p>

            <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
              Board-Certified Royal College of Veterinary Surgeons • Clinical Review Conducted Feb 2026
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 6: VERIFIED PET GUARDIAN REVIEWS
            ════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '56px' }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#707973',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                EVIDENCE & PATIENT OUTCOMES
              </div>
              <h2 style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '28px',
                fontWeight: 600,
                color: '#160F0C',
                margin: 0
              }}>
                Verified Pet Guardian Reviews
              </h2>
            </div>

            <button
              onClick={() => showToast('Review modal will open after verification', 'info')}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D6CDC5',
                borderRadius: '9999px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#160F0C',
                cursor: 'pointer'
              }}
            >
              Write Clinical Review
            </button>
          </div>

          {/* 3 Review Cards in 3 Columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {[
              {
                patient: 'Milo (Golden Retriever, 3.4 yrs)',
                title: 'Zero Tick Incidents in 2 Years',
                text: 'Living near the woodlands, ticks were a constant nightmare until Dr. Vance switched Milo to NexGard Spectra. One chewable on the 1st of every month. No stomach upset, completely eliminated all flea and tick worries.',
                guardian: 'Jonathan K.',
                sync: 'Verified Health Vault Sync'
              },
              {
                patient: 'Barnaby (Labrador, 5.1 yrs)',
                title: 'Palatable & Easy to Dose',
                text: 'Unlike topical treatments that leave a greasy chemical residue on his fur, Barnaby thinks this is a beef treat. Swallows it in seconds. His quarterly fecal and heartworm antigen panels have been 100% clean.',
                guardian: 'Clara S.',
                sync: 'Verified Health Vault Sync'
              },
              {
                patient: 'Dexter (French Bulldog, 2.8 yrs)',
                title: 'Clinical-Grade Reliability',
                text: 'Our previous spot-on treatments caused skin dermatitis. Since transitioning to NexGard Spectra chewables, Dexter has had zero allergic reactions and absolute parasite protection.',
                guardian: 'Liam T.',
                sync: 'Verified Health Vault Sync'
              }
            ].map((rev, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EBE4DF',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      backgroundColor: '#E6F4F1',
                      color: '#0D9488',
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      VERIFIED PATIENT
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                      {rev.patient}
                    </span>
                  </div>

                  <div style={{ display: 'flex', color: '#D97706', marginBottom: '8px' }}>
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={13} fill="#D97706" color="#D97706" />
                    ))}
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C', margin: '0 0 8px 0' }}>
                    {rev.title}
                  </h4>

                  <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#675C58', margin: 0 }}>
                    "{rev.text}"
                  </p>
                </div>

                <div style={{
                  borderTop: '1px solid #F0EAE4',
                  paddingTop: '14px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#707973'
                }}>
                  <span>Guardian: {rev.guardian}</span>
                  <span style={{ color: '#0D9488', fontWeight: 600 }}>{rev.sync}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 7: FREQUENTLY PAIRED FORMULATIONS
            ════════════════════════════════════════════════════════════════ */}
        <div>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#707973',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                SYNERGISTIC PROTOCOLS
              </div>
              <h2 style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '28px',
                fontWeight: 600,
                color: '#160F0C',
                margin: 0
              }}>
                Frequently Paired Formulations
              </h2>
            </div>

            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: '#346B73',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Explore All Clinical Formulations</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 3 Formulations Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                id: 'rc-gastro',
                badge: 'DIETARY FORMULATION',
                name: 'Royal Canin Veterinary Gastrointestinal',
                desc: 'High-digestibility therapeutic kibble supporting gut microbiota during deworming cycles.',
                price: 3250,
                image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80'
              },
              {
                id: 'synacore',
                badge: 'MICROBIOME SUPPORT',
                name: 'Synacore Probiotic & Prebiotic Chews',
                desc: 'Multi-strain viable beneficial bacteria to optimize gastrointestinal balance post-parasiticide.',
                price: 1850,
                image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'
              },
              {
                id: 'nobivac',
                badge: 'PREVENTIVE IMMUNOLOGY',
                name: 'Nobivac DHPPi + L4 Core Vaccine',
                desc: 'Annual core immunization safeguarding against canine distemper, parvovirus, and leptospirosis.',
                price: 850,
                image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80'
              }
            ].map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EBE4DF',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{
                    height: '200px',
                    backgroundColor: '#F3EFEA',
                    position: 'relative',
                    overflow: 'hidden'
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
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(6px)',
                      color: '#675C58',
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      {item.badge}
                    </div>
                  </div>

                  <div style={{ padding: '20px 20px 12px 20px' }}>
                    <h4 style={{
                      fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#160F0C',
                      margin: '0 0 6px 0'
                    }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: '11.5px', color: '#707973', lineHeight: 1.5, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: '12px 20px 20px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#160F0C' }}>
                    ৳{item.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      addToCart({ ...item, quantity: 1 }, 1);
                      openModal('cart');
                      showToast(`Added ${item.name} to Care Bag`, 'success');
                    }}
                    style={{
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '8px 16px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
