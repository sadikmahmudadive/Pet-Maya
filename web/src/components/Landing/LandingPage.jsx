import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage({ onNavigate }) {
  const { showToast, addToCart, pets = [], vets = [], products = [], isProductsLoading, posts = [], isPostsLoading } = useApp();
  const { currentUser, loginAsGuest } = useAuth();

  const displayPet = pets[0] || null;
  const companionName = displayPet?.name || 'Companion';
  const companionBreed = displayPet ? `${displayPet.breed || 'Companion'} · ${displayPet.age || '3y'}` : 'Golden Retriever · 3y';
  const companionInitial = (companionName || 'C').charAt(0).toUpperCase();
  const companionChip = displayPet?.microchip || 'ISO 11784 Verified';

  // Dynamic telemetry pulse states
  const [vitalsState, setVitalsState] = useState('Vitals Optimal (68 bpm)');
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    const vitalStates = [
      'Vitals Optimal (68 bpm)',
      'Vitals Optimal (71 bpm)',
      'Resting Pulse Calm (66 bpm)',
      'Vitals Optimal (69 bpm)'
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % vitalStates.length;
      setVitalsState(vitalStates[idx]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleRoute = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  const handleGetStarted = () => {
    if (currentUser) {
      handleRoute('dashboard');
    } else {
      loginAsGuest('Pet Owner');
      handleRoute('dashboard');
      showToast('Welcome to Pet Maya Platform!', 'success');
      handleRoute('signup');
    }
  };

  const handleQuickAdd = (product) => {
    addToCart(product, 1);
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    showToast(`${product.name} added to dispatch bag`, 'success');
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Dynamic 4-item prescription formulary from Firestore products collection (with fallback)
  const fallbackFormulary = [
    {
      id: 'p1',
      name: 'NexGard Spectra Chews',
      badge: 'Schedule Rx',
      category: 'Broad Spectrum Antiparasitic',
      desc: 'Monthly oral prophylaxis against heartworm, ticks, fleas, and mites.',
      price: 1650,
      unit: '3-month blister',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'p2',
      name: 'Royal Canin Gastro Low Fat',
      badge: 'Clinical Diet',
      category: 'Digestive Microbiome Support',
      desc: 'Formulated with highly digestible proteins, prebiotics, and EPA/DHA.',
      price: 3450,
      unit: '4.0 kg bag',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'p3',
      name: 'Nobivac Rabies 1-Dose',
      badge: 'Cold-Chain Biologic',
      category: 'Inactivated Immunization',
      desc: 'Insulated temp-logged delivery with certified clinical batch serial.',
      price: 850,
      unit: 'Single Vial + Ice Core',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'p4',
      name: 'Synoquin EFA Joint Care',
      badge: 'Joint Therapy',
      category: 'High Purity Glucosamine + Dexahan',
      desc: 'Clinically proven chondroprotective support for senior & active mobility.',
      price: 2100,
      unit: '30 Chewable Tabs',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const formularyItems = products.length > 0 ? products.slice(0, 4).map((p) => {
    const rawDesc = p.shortDescription || p.description || 'Veterinary-grade formulation.';
    const cleanDesc = rawDesc.replace(/\s+/g, ' ').trim();
    const shortDesc = cleanDesc.length > 85 ? cleanDesc.slice(0, 82) + '…' : cleanDesc;

    return {
      id: p.id,
      name: p.name || 'Veterinary Formulation',
      badge: p.isRx ? 'Schedule Rx' : (p.badge || p.category || 'Clinical'),
      category: p.category || p.brand || 'Formulation',
      desc: shortDesc,
      price: typeof p.price === 'number' ? p.price : (parseInt(p.price) || 0),
      unit: p.unit || p.size || '1 Unit',
      image: p.image || p.photo || 'assets/images/Pet_1.jpg'
    };
  }) : fallbackFormulary;

  // Faculty specialists — derived from live Firestore vets collection (capped at 3 for homepage)
  const clinicalFaculty = vets.slice(0, 3).map((v) => ({
    id: v.id,
    name: v.name,
    title: v.qualification || v.tag || '',
    bio: v.bio || '',
    price: v.price ? `৳${v.price}` : '৳500',
    status: v.availability || 'Available',
    statusType: (v.availability || '').toLowerCase().includes('now') || (v.availability || '').toLowerCase().includes('duty')
      ? 'pulse'
      : (v.availability || '').toLowerCase().includes('min') || (v.availability || '').toLowerCase().includes('soon')
        ? 'beacon'
        : 'static',
    rating: v.rating ? String(v.rating) : '5.0',
    reviews: v.reviewsCount ? `${v.reviewsCount}+ consults` : '—',
    image: v.photo || ''
  }));

  // Editorial journal dispatches derived from live community posts (or filtered for article type with fallback)
  const fallbackJournalArticles = [
    {
      id: 'art1',
      category: 'Clinical Nutrition',
      readTime: '6 Min Read',
      title: 'Beyond Kibble: Microbiome Diversification in Senior Canines',
      excerpt: 'A veterinary look at short-chain fatty acids, enterocyte vitality, and the scientific calibration of gut biodiversity.',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'art2',
      category: 'Preventive Biomarkers',
      readTime: '4 Min Read',
      title: 'The Silent Renal Index: Deciphering SDMA Before Creatinine Spikes',
      excerpt: 'How contemporary symmetric dimethylarginine screening detects kidney dysfunction up to 17 months earlier than conventional tests.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApSEASDFKwzPeG9HuGX4dTl68IVTage1i_V6SCTa3xjwbqCO-36_BQaD7KRP508Lih3lb8iDBGoRmqkvDFyuCkRpi2RebI_IqHn4tdO05kMnVBvWvPiqglBEhhf3j1xYfSKVwZFstVUyV6qRlkg2QlXMnbR4DnXqIpytXPKwJSnlKM1Hvz-bCMJ0j58yi1PBFG9Wi-QxRsTDSzCsr0w94zxUAFH6CtnLOQJHl-Qbce7OXQUh5_mrt4'
    },
    {
      id: 'art3',
      category: 'Global Biosecurity',
      readTime: '8 Min Read',
      title: 'Navigating UK, EU & UAE Pet Export: A Step-by-Step Biosecurity Protocol',
      excerpt: 'FAVN titre windows, USDA/DEFRA endorsements, tapeworm timing, and avoiding traumatic port quarantine holdovers.',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const journalArticles = posts.length > 0
    ? posts
        .filter((p) => p.postType === 'article' || p.category === 'article' || p.category === 'journal' || !p.postType)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          category: p.category || p.postType || 'Clinical Dispatch',
          readTime: p.readTime || '5 Min Read',
          title: p.title || p.content?.substring(0, 70) || 'Clinical Dispatch',
          excerpt: p.excerpt || p.content?.substring(0, 130) || '',
          image: p.image || p.authorPhoto || ''
        }))
    : fallbackJournalArticles;

  return (
    <div style={{ backgroundColor: '#FDF8F5', color: '#160F0C', minHeight: '100vh' }}>
      
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: HERO (Duna-Inspired Split Editorial)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px 56px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          {/* Left Editorial Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#F8F3EF',
              border: '1px solid rgba(222, 217, 214, 0.5)',
              width: 'fit-content'
            }}>
              <span className="ambient-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#45848D' }}></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#160F0C' }}>
                Next-Gen Veterinary Collective
              </span>
            </div>

            {/* Editorial Headline */}
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(36px, 5.5vw, 56px)',
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#160F0C',
              margin: 0
            }}>
              Thoughtful veterinary care, <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-heading)', color: '#45848D' }}>designed</span> for everyday peace of mind.
            </h1>

            {/* Narrative Subtitle */}
            <p style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: '#675C58',
              margin: 0,
              maxWidth: '540px'
            }}>
              Pet Maya unifies 24/7 AI-guided symptom triage, cold-chain biologics delivery, and connected longitudinal health records into one serene daily sanctuary for your companion.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
              <button
                onClick={() => handleRoute('shop')}
                className="btn-elevate"
                style={{
                  padding: '14px 28px',
                  borderRadius: '9999px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>Explore Formulary</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>

              <button
                onClick={() => handleRoute('profile')}
                className="btn-elevate"
                style={{
                  padding: '14px 28px',
                  borderRadius: '9999px',
                  backgroundColor: '#F8F3EF',
                  color: '#160F0C',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: '1px solid rgba(222, 217, 214, 0.5)',
                  cursor: 'pointer'
                }}
              >
                Start Health Vault
              </button>
            </div>

            {/* Trust Signals Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              paddingTop: '16px'
            }}>
              <div style={{
                backgroundColor: 'rgba(248, 243, 239, 0.7)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(222, 217, 214, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span className="material-symbols-outlined" style={{ color: '#45848D', fontSize: '20px' }}>verified_user</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>AAHA Protocols</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#160F0C' }}>Clinical rigor</span>
              </div>

              <div style={{
                backgroundColor: 'rgba(248, 243, 239, 0.7)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(222, 217, 214, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span className="material-symbols-outlined" style={{ color: '#45848D', fontSize: '20px' }}>ac_unit</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>Cold-Chain</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#160F0C' }}>2°C – 8°C Monitored</span>
              </div>

              <div style={{
                backgroundColor: 'rgba(248, 243, 239, 0.7)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(222, 217, 214, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span className="material-symbols-outlined" style={{ color: '#45848D', fontSize: '20px' }}>medical_services</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>Faculty Vets</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#160F0C' }}>MRCVS &amp; DVM Lead</span>
              </div>
            </div>
          </div>

          {/* Right Cinematic Visual Column */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '520px',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#EFEFEA'
            }}>
              <img
                src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80"
                alt="A tranquil golden retriever resting peacefully beside sunlit minimalist window"
                onError={(e) => { e.target.src = 'assets/images/Pet_1.jpg'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Floating Status Badge Companion */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '14px 18px',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(22, 15, 12, 0.1)',
                border: '1px solid rgba(222, 217, 214, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#EFEFEA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '16px',
                    color: '#160F0C'
                  }}>
                    {companionInitial}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '15px', color: '#160F0C' }}>{companionName}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: '#F8F3EF',
                        color: '#45848D',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        border: '1px solid rgba(222, 217, 214, 0.5)'
                      }}>
                        {companionBreed}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#675C58' }}>
                      <span style={{ fontWeight: 600, color: '#160F0C', transition: 'all 0.3s ease' }}>{vitalsState}</span> · Heartgard Cycle Active (Day 18/30)
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#F8F3EF',
                  padding: '5px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(69, 132, 141, 0.2)'
                }}>
                  <span className="material-symbols-outlined pulse-beacon" style={{ fontSize: '15px', color: '#45848D' }}>signal_cellular_alt</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 600, color: '#45848D' }}>Live Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: CURATED FORMULARY & DAILY ESSENTIALS
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F8F3EF', borderTop: '1px solid rgba(222, 217, 214, 0.3)', borderBottom: '1px solid rgba(222, 217, 214, 0.3)', padding: '56px 24px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#675C58', fontWeight: 600 }}>
                Veterinary Formulary
              </span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '30px', fontWeight: 400, letterSpacing: '-0.02em', color: '#160F0C', margin: 0 }}>
                Prescription essentials &amp; targeted biologics.
              </h2>
            </div>
            <a
              onClick={() => handleRoute('shop')}
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                color: '#45848D',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none'
              }}
            >
              <span>Browse Full Dispensary (140+)</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>north_east</span>
            </a>
          </div>

          {/* Product Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {formularyItems.map((item) => (
              <div
                key={item.id}
                className="interactive-card"
                onClick={() => onNavigate ? onNavigate(`shop-product/${item.id}`) : (window.location.hash = `shop-product/${item.id}`)}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--surface-alt)',
                    marginBottom: '14px'
                  }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => { e.target.src = 'assets/images/Pet_1.jpg'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: '#160F0C',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}>
                      {item.badge}
                    </span>
                  </div>

                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                    {item.category}
                  </span>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    margin: '4px 0 6px',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.name}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '38px'
                  }}>
                    {item.desc}
                  </p>
                </div>

                <div style={{
                  paddingTop: '16px',
                  marginTop: '16px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>৳{item.price.toLocaleString()}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{item.unit}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAdd(item);
                    }}
                    className="btn-elevate"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      backgroundColor: addedItems[item.id] ? 'var(--primary)' : 'var(--text-main)',
                      color: addedItems[item.id] ? '#FFFFFF' : 'var(--bg)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {addedItems[item.id] ? 'check' : 'add'}
                    </span>
                    <span>{addedItems[item.id] ? 'Added' : 'Quick Add'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: DETERMINISTIC AI ENGINE (Clinical Precision)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1360px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{
          backgroundColor: '#F8F3EF',
          borderRadius: '24px',
          padding: 'clamp(24px, 4vw, 48px)',
          border: '1px solid rgba(222, 217, 214, 0.5)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            {/* Left Story Narrative */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#45848D',
                border: '1px solid rgba(222, 217, 214, 0.5)',
                width: 'fit-content'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>health_and_safety</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Deterministic AI Engine
                </span>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#160F0C', margin: 0 }}>
                Clinical precision, zero panic.
              </h2>

              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#675C58', margin: 0 }}>
                When subtle symptoms arise late at night, avoid frantic searches. Pet Maya’s clinical triage evaluates species, weight, vitals, and onset velocity against 12,000+ veterinary protocols—calmly delineating between immediate home observation and urgent clinical dispatch.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(69, 132, 141, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#45848D' }}>check</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#160F0C', margin: 0, fontWeight: 500 }}>
                    Immediate protocol checklists vetted by emergency veterinary intensivists.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(69, 132, 141, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#45848D' }}>check</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#160F0C', margin: 0, fontWeight: 500 }}>
                    One-tap escalation to live on-duty faculty DVM with full pre-loaded context.
                  </p>
                </div>
              </div>

              <div style={{ paddingTop: '8px' }}>
                <button
                  onClick={() => handleRoute('ai')}
                  className="btn-elevate"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: '#45848D',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat_bubble_outline</span>
                  <span>Launch Symptom Evaluation</span>
                </button>
              </div>
            </div>

            {/* Right Diagnostic Live Card Mockup */}
            <div>
              <div className="interactive-card" style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid rgba(222, 217, 214, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid rgba(222, 217, 214, 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F8F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#160F0C' }}>
                      {companionInitial}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#160F0C', margin: 0 }}>{companionName} · Case #PM-8924</h4>
                      <p style={{ fontSize: '12px', color: '#675C58', margin: '2px 0 0' }}>Evaluated 4 minutes ago · {companionBreed}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#F8F3EF', border: '1px solid rgba(222, 217, 214, 0.5)' }}>
                    <span className="ambient-pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#45848D' }}></span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#45848D', fontWeight: 600 }}>Triage Resolved</span>
                  </div>
                </div>

                {/* Metric Wells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: '#F8F3EF', padding: '12px', borderRadius: '10px', border: '1px solid rgba(222, 217, 214, 0.3)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>Reported Symptom</span>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#160F0C', margin: '4px 0 2px' }}>Mild Lethargy</p>
                    <span style={{ fontSize: '11px', color: '#675C58' }}>Duration: 3 hours</span>
                  </div>

                  <div style={{ backgroundColor: '#F8F3EF', padding: '12px', borderRadius: '10px', border: '1px solid rgba(222, 217, 214, 0.3)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>Hydration Index</span>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#160F0C', margin: '4px 0 2px' }}>Normal (1.1s)</p>
                    <span style={{ fontSize: '11px', color: '#675C58' }}>Capillary refill ok</span>
                  </div>

                  <div style={{ backgroundColor: '#F8F3EF', padding: '12px', borderRadius: '10px', border: '1px solid rgba(222, 217, 214, 0.3)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>Clinical Risk</span>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#45848D', margin: '4px 0 2px' }}>Low Severity</p>
                    <span style={{ fontSize: '11px', color: '#675C58' }}>Tier 1 Monitoring</span>
                  </div>
                </div>

                {/* Recommended Home Protocol Checklist */}
                <div style={{ backgroundColor: '#FDF8F5', padding: '16px', borderRadius: '12px', border: '1px solid rgba(222, 217, 214, 0.4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Recommended Home Protocol <span className="cursor-blink"></span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#45848D', backgroundColor: '#F8F3EF', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                      Next Checkpoint: 22:00
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#160F0C' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#45848D' }}>radio_button_checked</span>
                      <span>Offer 150ml cool water with electrolyte powder (hydrating well)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#160F0C' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#45848D' }}>radio_button_checked</span>
                      <span>Withhold high-fat treats for 6 hours; prepare steamed white rice + lean chicken</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#160F0C' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#45848D' }}>radio_button_checked</span>
                      <span>Monitor respiration rate at rest (expected baseline: 18-24 breaths/min)</span>
                    </div>
                  </div>
                </div>

                {/* Doctor Handshake Footer */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#675C58' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#45848D' }}>verified</span>
                    <span>Reviewed by On-Duty Triage Clinician {vets[0]?.name || 'On-Duty Clinician'}</span>
                  </div>
                  <button
                    onClick={() => handleRoute('vets')}
                    className="btn-elevate"
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      backgroundColor: '#F8F3EF',
                      color: '#160F0C',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid rgba(222, 217, 214, 0.6)',
                      cursor: 'pointer'
                    }}
                  >
                    Connect Live Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: CONNECTED PET HEALTH VAULT & DIGITAL PASSPORT
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FDF8F5', borderBottom: '1px solid rgba(222, 217, 214, 0.3)', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#675C58', fontWeight: 600 }}>
              Connected Infrastructure
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 400, letterSpacing: '-0.02em', color: '#160F0C', margin: 0 }}>
              The Pet Maya Digital Passport.
            </h2>
            <p style={{ fontSize: '15px', color: '#675C58', margin: 0, lineHeight: 1.6 }}>
              No lost paper vaccination booklets. An immutable biometric record with ISO microchip telemetry, valid for border customs and clinical handoffs worldwide.
            </p>
          </div>

          {/* Passport Card Component */}
          <div className="interactive-card" style={{
            maxWidth: '920px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: 'clamp(20px, 3.5vw, 36px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            border: '1px solid rgba(222, 217, 214, 0.5)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
              alignItems: 'center'
            }}>
              {/* Left Visual Passport Card */}
              <div style={{
                backgroundColor: '#F8F3EF',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                border: '1px solid rgba(222, 217, 214, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>Pet Passport ID</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#45848D', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(222, 217, 214, 0.4)', fontWeight: 600 }}>
                    ISO 11784 Compliant
                  </span>
                </div>

                <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#EFEFEA' }}>
                  <img
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80"
                    alt={companionName}
                    onError={(e) => { e.target.src = 'assets/images/Pet_2.jpg'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#160F0C', margin: '0 0 2px' }}>{companionName} of Kensington</h3>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#675C58', margin: 0 }}>CHIP: {companionChip}</p>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(222, 217, 214, 0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#45848D' }}>qr_code_2</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#160F0C' }}>Instant Scan Token</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>AES-256 Valid</span>
                </div>
              </div>

              {/* Right Clinical History Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>
                    Telemetry &amp; Active Immunization
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#160F0C', margin: '4px 0 0' }}>Verified Clinical History</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8F3EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(222, 217, 214, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#45848D' }}>vaccines</span>
                      <div>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#160F0C', margin: 0 }}>Nobivac DHPPi + L4</p>
                        <span style={{ fontSize: '11.5px', color: '#675C58' }}>Administered Nov 14, 2024 · Batch #NB-092</span>
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FFFFFF', color: '#45848D', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Valid (320d)
                    </span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8F3EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(222, 217, 214, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#45848D' }}>verified</span>
                      <div>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#160F0C', margin: 0 }}>Rabies Antibody Titre (FAVN)</p>
                        <span style={{ fontSize: '11.5px', color: '#675C58' }}>Titre Level: 2.45 IU/mL (&gt;0.5 IU/mL required)</span>
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FFFFFF', color: '#45848D', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Customs Cleared
                    </span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8F3EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(222, 217, 214, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#45848D' }}>monitor_heart</span>
                      <div>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#160F0C', margin: 0 }}>Annual Preventive Blood Panel</p>
                        <span style={{ fontSize: '11.5px', color: '#675C58' }}>ALT 32 U/L · BUN 14 mg/dL · Creatinine 0.9</span>
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FFFFFF', color: '#160F0C', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Optimal
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <p style={{ fontSize: '12px', color: '#675C58', margin: 0 }}>
                    Auto-syncs across Dhaka, Chittagong, Singapore, and UK quarantine networks.
                  </p>
                  <a
                    onClick={() => {
                      showToast('Exporting Clinical Passport PDF...', 'info');
                      setTimeout(() => showToast('Passport exported successfully', 'success'), 1500);
                    }}
                    style={{
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: '#45848D',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Export PDF</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>file_download</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: DIRECT CONSULT WITH BOARD SPECIALISTS
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F8F3EF', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#675C58', fontWeight: 600 }}>
                Clinical Faculty
              </span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '30px', fontWeight: 400, letterSpacing: '-0.02em', color: '#160F0C', margin: 0 }}>
                Direct consult with board specialists.
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: '#675C58', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
              Transparent flat consults at ৳500 with zero surprise billings. Instant HD clinical tele-sessions with digital prescriptions issued to your door.
            </p>
          </div>

          {/* Clinicians Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {clinicalFaculty.length === 0
              ? [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      border: '1px solid rgba(222, 217, 214, 0.4)'
                    }}
                  >
                    <div style={{ width: '100%', height: '240px', borderRadius: '12px', backgroundColor: '#EFEFEA', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: '16px', width: '70%', borderRadius: '8px', backgroundColor: '#EFEFEA', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: '12px', width: '90%', borderRadius: '6px', backgroundColor: '#EFEFEA', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: '12px', width: '60%', borderRadius: '6px', backgroundColor: '#EFEFEA', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                ))
              : clinicalFaculty.map((vet) => (

              <div
                key={vet.id}
                className="interactive-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(222, 217, 214, 0.4)'
                }}
              >
                <div>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '240px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#EFEFEA',
                    marginBottom: '14px'
                  }}>
                    <img
                      src={vet.image}
                      alt={vet.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}>
                      <span className={vet.statusType === 'pulse' ? 'ambient-pulse-dot' : vet.statusType === 'beacon' ? 'pulse-beacon' : ''} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#45848D' }}></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#45848D', fontWeight: 600 }}>
                        {vet.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#160F0C', margin: 0 }}>{vet.name}</h3>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#160F0C' }}>{vet.price}</span>
                  </div>

                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#675C58', margin: '4px 0 8px' }}>
                    {vet.title}
                  </p>
                  <p style={{ fontSize: '13px', color: '#675C58', margin: 0, lineHeight: 1.5 }}>
                    {vet.bio}
                  </p>
                </div>

                <div style={{
                  paddingTop: '16px',
                  marginTop: '16px',
                  borderTop: '1px solid rgba(222, 217, 214, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#675C58' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#45848D' }}>star</span>
                    <span style={{ fontWeight: 600, color: '#160F0C' }}>{vet.rating}</span>
                    <span>({vet.reviews})</span>
                  </div>
                  <button
                    onClick={() => handleRoute('book-vet')}
                    className="btn-elevate"
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Book Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: THE COMPANION JOURNAL
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1360px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#675C58', fontWeight: 600 }}>
                The Companion Journal
              </span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '30px', fontWeight: 400, letterSpacing: '-0.02em', color: '#160F0C', margin: 0 }}>
                Clinical intelligence for curious caretakers.
              </h2>
            </div>
            <a
              onClick={() => handleRoute('blog')}
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                color: '#45848D',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none'
              }}
            >
              <span>Read All Dispatches</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </a>
          </div>

          {/* Article Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {journalArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => handleRoute('blog')}
                className="interactive-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(222, 217, 214, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ width: '100%', height: '200px', overflow: 'hidden', backgroundColor: '#EFEFEA' }}>
                    <img
                      src={art.image}
                      alt={art.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#45848D', fontWeight: 600 }}>
                        {art.category}
                      </span>
                      <span style={{ color: '#675C58' }}>•</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#675C58' }}>
                        {art.readTime}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#160F0C', margin: 0, lineHeight: 1.35 }}>
                      {art.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#675C58', margin: 0, lineHeight: 1.5 }}>
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 600, color: '#160F0C' }}>
                  <span>Read Article</span>
                  <span>→</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7: COMPANION MOBILITY (APP DOWNLOAD SHOWCASE)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{
          backgroundColor: '#F8F3EF',
          borderRadius: '24px',
          padding: 'clamp(24px, 4vw, 48px)',
          border: '1px solid rgba(222, 217, 214, 0.5)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            {/* Left Narrative & Download CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#45848D',
                border: '1px solid rgba(222, 217, 214, 0.5)',
                width: 'fit-content'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>phone_iphone</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Companion Mobility • iOS &amp; Android Ecosystem
                </span>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#160F0C', margin: 0 }}>
                Clinical continuity in your pocket. <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-heading)', color: '#45848D' }}>Wherever</span> your companion travels.
              </h2>

              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#675C58', margin: 0 }}>
                Pet Maya unifies 24/7 AI-guided triage, continuous collar vitals telemetry, and express cold-chain formulary replenishment right to your palm. Keep validated travel microchip passports and emergency clinician hotlines primed at every checkpoint.
              </p>

              {/* Feature Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#160F0C',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(222, 217, 214, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#45848D' }}>bolt</span>
                  <span>Instant 24/7 Triage</span>
                </span>

                <span style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#160F0C',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(222, 217, 214, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#45848D' }}>qr_code_scanner</span>
                  <span>ISO Telemetry Vault</span>
                </span>

                <span style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#160F0C',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(222, 217, 214, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#45848D' }}>wifi_off</span>
                  <span>Offline Emergency Protocols</span>
                </span>
              </div>

              {/* App Download Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                  {/* Apple App Store */}
                  <a
                    href="#download-ios"
                    onClick={(e) => { e.preventDefault(); showToast('Directing to Apple TestFlight / App Store build...', 'info'); }}
                    className="btn-elevate"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      textDecoration: 'none'
                    }}
                  >
                    <svg style={{ width: '22px', height: '22px', fill: 'currentColor' }} viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.04-.51 2.68-1.26z"></path>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Download on the</span>
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>App Store</span>
                    </div>
                  </a>

                  {/* Google Play */}
                  <a
                    href="#download-android"
                    onClick={(e) => { e.preventDefault(); showToast('Directing to Google Play Store build...', 'info'); }}
                    className="btn-elevate"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      color: '#160F0C',
                      textDecoration: 'none',
                      border: '1px solid rgba(222, 217, 214, 0.6)'
                    }}
                  >
                    <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a1.954 1.954 0 0 1-.61-1.42V3.234c0-.547.226-1.048.61-1.42z" fill="#4285F4"></path>
                      <path d="M17.478 8.314L14.743 11.05 4.56 0.866a1.93 1.93 0 0 1 1.09-.328c.552 0 1.08.196 1.554.508l10.274 7.268z" fill="#EA4335"></path>
                      <path d="M17.478 15.686L7.204 22.954c-.474.312-1.002.508-1.554.508a1.93 1.93 0 0 1-1.09-.328L14.743 12.95l2.735 2.736z" fill="#34A853"></path>
                      <path d="M21.282 12.87l-2.88 1.92-2.906-2.906 2.906-2.906 2.88 1.92c.718.479 1.15 1.198 1.15 1.986s-.432 1.507-1.15 1.986z" fill="#FBBC04"></path>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#675C58', fontWeight: 600 }}>GET IT ON</span>
                        <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '9999px', backgroundColor: '#F8F3EF', color: '#45848D', fontWeight: 600 }}>v3.2.0</span>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>Google Play</span>
                    </div>
                  </a>
                </div>

                {/* Direct IPA Package & QR Code row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '12.5px', color: '#675C58' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#45848D' }}>inventory_2</span>
                    <span>Direct Enterprise Build <strong style={{ fontFamily: 'var(--font-mono)', color: '#160F0C' }}>.IPA</strong></span>
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#45848D' }}>qr_code_2</span>
                    <span>Scan below or on mobile browser</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Right Phone Chassis Visual Showcase */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="interactive-card" style={{
                position: 'relative',
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '24px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                border: '1px solid rgba(222, 217, 214, 0.5)',
                maxWidth: '340px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Phone Mockup Image */}
                <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#EFEFEA' }}>
                  <img
                    src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80"
                    alt="Pet Maya mobile app preview"
                    onError={(e) => { e.target.src = 'assets/images/Pet_1.jpg'; }}
                    style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                {/* QR Badge — inline below the image, fully visible */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#FAF7F5',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  border: '1px solid rgba(222, 217, 214, 0.6)'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(222, 217, 214, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#160F0C' }}>qr_code_2</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: '#45848D', fontWeight: 700, letterSpacing: '0.06em' }}>Scan to Install</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#160F0C' }}>iOS &amp; Android Ready</span>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#8C827A', textAlign: 'right', lineHeight: 1.4 }}>
                    <div>Point camera</div>
                    <div>at QR code</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8: ONBOARD IN 2 MINUTES BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{
          backgroundColor: '#EFEFEA',
          borderRadius: '24px',
          padding: 'clamp(32px, 6vw, 64px)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(222, 217, 214, 0.5)'
        }}>
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#675C58', fontWeight: 600 }}>
              Onboard in 2 Minutes
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#160F0C', margin: 0, lineHeight: 1.2 }}>
              Your companion deserves clinical continuity, not reactive guesswork.
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.65, color: '#675C58', margin: 0 }}>
              Join thousands of mindful pet guardians who trust Pet Maya for cold-chain home delivery, live physician triage, and unified medical documentation.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', paddingTop: '8px' }}>
              <button
                onClick={handleGetStarted}
                className="btn-elevate"
                style={{
                  padding: '14px 30px',
                  borderRadius: '9999px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 15, 12, 0.16)'
                }}
              >
                Create Companion Account
              </button>
              <button
                onClick={() => handleRoute('shop')}
                className="btn-elevate"
                style={{
                  padding: '14px 30px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#160F0C',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  border: '1px solid rgba(222, 217, 214, 0.5)',
                  cursor: 'pointer'
                }}
              >
                Order Prescriptions
              </button>
            </div>
          </div>

          {/* Ambient Decorative Paw Seal */}
          <div style={{
            position: 'absolute',
            bottom: '-48px',
            right: '-48px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            backgroundColor: 'rgba(242, 237, 233, 0.6)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '160px', color: 'rgba(69, 132, 141, 0.1)' }}>pets</span>
          </div>
        </div>
      </section>

    </div>
  );
}
