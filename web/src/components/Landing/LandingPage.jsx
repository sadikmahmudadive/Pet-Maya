import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  Star, 
  ShoppingBag, 
  Clock, 
  Truck, 
  Sparkles, 
  Heart, 
  Stethoscope, 
  BookOpen, 
  MessageSquare, 
  Check, 
  Video, 
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const { setActiveTab, openModal, showToast, products, vets, addToCart } = useApp();
  const { currentUser, loginAsGuest } = useAuth();
  const carouselRef = useRef(null);

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
      showToast('Welcome to Pet Maya!', 'success');
    }
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Curated shop items for the carousel
  const shopItems = (products && products.length > 0) ? products.slice(0, 6) : [
    {
      id: 'p1',
      name: 'Royal Canin Golden Retriever Adult',
      brand: 'Royal Canin',
      price: 64.99,
      originalPrice: 79.99,
      rating: 4.9,
      ratingCount: 128,
      badge: 'BEST SELLER',
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 'p2',
      name: 'Simparica Trio Chewables (3-Pack)',
      brand: 'Zoetis Rx',
      price: 42.50,
      originalPrice: 49.99,
      rating: 5.0,
      ratingCount: 215,
      badge: 'VET APPROVED',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 'p3',
      name: 'Smart GPS & Health Collar V3',
      brand: 'Pet Maya Wearables',
      price: 89.00,
      originalPrice: 119.00,
      rating: 4.8,
      ratingCount: 94,
      badge: 'COLD-CHAIN',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 'p4',
      name: 'Hill\'s Prescription Diet Gastrointestinal Biome',
      brand: 'Hill\'s Pet Nutrition',
      price: 58.20,
      originalPrice: 68.00,
      rating: 4.9,
      ratingCount: 88,
      badge: 'CLINICAL RX',
      image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 'p5',
      name: 'ProDen PlaqueOff Dental Care Powder',
      brand: 'Swedencare',
      price: 24.50,
      originalPrice: 29.00,
      rating: 4.7,
      ratingCount: 142,
      badge: 'PREVENTATIVE',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&auto=format&fit=crop&q=80'
    }
  ];

  // Top veterinarians
  const topVets = (vets && vets.length > 0) ? vets.slice(0, 3) : [
    {
      id: 'v1',
      name: 'Dr. Sarah Jenkins',
      qualification: 'DVM, MRCVS • Small Animal Surgery',
      rating: 4.9,
      reviewsCount: 68,
      price: '৳500 / session',
      clinic: 'Greenwood Animal Hospital',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'v2',
      name: 'Dr. Aris Thorne',
      qualification: 'BVSc, PhD • Feline Medicine & Dermatology',
      rating: 5.0,
      reviewsCount: 42,
      price: '৳650 / session',
      clinic: 'Metropolitan Veterinary Center',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'v3',
      name: 'Dr. Emily Vance',
      qualification: 'DVM • Internal Medicine & Cardiology',
      rating: 4.8,
      reviewsCount: 51,
      price: '৳550 / session',
      clinic: 'City Vets & Diagnostics',
      photo: 'https://images.unsplash.com/photo-1594824813589-9a25b293883a?w=400&auto=format&fit=crop&q=80'
    }
  ];

  // Editorial blog posts
  const blogPosts = [
    {
      id: 1,
      tag: 'CLINICAL NUTRITION',
      title: 'The Mindful Transition: Switching Your Dog to Clinically Balanced Diets',
      excerpt: 'How gradual ratio adjustments protect gut microbiome health and prevent gastrointestinal sensitivity.',
      readTime: '5 min read',
      author: 'Dr. Aris Thorne, BVSc',
      image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      tag: 'FELINE HEALTH',
      title: 'Recognizing Seasonal Allergy and Dermatitis Patterns in Indoor Felines',
      excerpt: 'Subtle behavioral signs — from excessive paw-licking to focal coat thinning — that warrant an ear and skin check.',
      readTime: '7 min read',
      author: 'Dr. Sarah Jenkins, MRCVS',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      tag: 'TRAVEL & RECORDS',
      title: 'Digital Travel Clearance: What Border Control Looks for in Pet Passports',
      excerpt: 'A comprehensive guide to rabies titers, ISO 11784 microchip standards, and veterinary health certifications.',
      readTime: '4 min read',
      author: 'Pet Maya Clinical Editorial',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)', minHeight: '100vh' }}>
      
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 01: HERO (SPLIT LAYOUT WITH REAL PET PHOTOGRAPHY)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 96px) 24px clamp(40px, 6vw, 80px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(36px, 6vw, 72px)', alignItems: 'center' }}>
          
          {/* Hero Content Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: 'rgba(46, 204, 155, 0.12)', border: '1px solid rgba(46, 204, 155, 0.28)', color: '#158763', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2ECC9B' }} />
              <span>Veterinary-Led Companion Care</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(38px, 5.2vw, 66px)', fontWeight: 600, lineHeight: 1.12, letterSpacing: '-0.025em', color: 'var(--foreground)', margin: '0 0 24px 0' }}>
              Thoughtful healthcare and honest nutrition for everyday pets.
            </h1>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', lineHeight: 1.65, color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 0 36px 0' }}>
              A calm, modern ecosystem for the companions who give us everything. From temperature-guaranteed prescription nutrition to 24/7 AI first-aid triage, certified specialists, and encrypted health records.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <button
                onClick={handleGetStarted}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#1F2421',
                  fontWeight: 600,
                  fontSize: '15px',
                  padding: '13px 30px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(46, 204, 155, 0.28)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>Start Your Pet’s Vault</span>
                <ChevronRight size={17} />
              </button>

              <button
                onClick={() => handleRoute('shop')}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                  fontWeight: 500,
                  fontSize: '15px',
                  padding: '12px 26px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.18s ease'
                }}
              >
                <ShoppingBag size={16} />
                <span>Explore Care Shop</span>
              </button>
            </div>

            {/* Micro Trust Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#2ECC9B" />
                <span>ISO Microchip Ready</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={16} color="#D9A873" />
                <span>Cold-Chain Express</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <span>4.9/5 by 12,000+ Pets</span>
              </div>
            </div>
          </div>

          {/* Hero Image Right (Real Pet Photography with Floating Clinical Guarantee Card) */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 20px 48px rgba(0,0,0,0.08)', aspectRatio: '4/4.5', backgroundColor: '#EDECE8' }}>
              <img 
                src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=900&auto=format&fit=crop&q=85" 
                alt="Golden retriever looking healthy and peaceful"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            {/* Floating Quality Assurance Card */}
            <div 
              style={{
                position: 'absolute',
                bottom: '-20px',
                left: '-16px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '18px',
                padding: '16px 20px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
                maxWidth: '280px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(217, 168, 115, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9A873' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Clinical Quality</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14.5px', fontWeight: 600, color: 'var(--foreground)' }}>100% Guaranteed</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Authentic veterinary pharmaceuticals and climate-monitored courier transit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 02: 4-ITEM VALUE STRIP
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '36px 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '28px'
          }}>
            {[
              {
                icon: ShieldCheck,
                title: 'Veterinary-Formulated',
                desc: 'Every diet, medication, and supplement is strictly certified by licensed veterinary surgeons.'
              },
              {
                icon: Truck,
                title: 'Cold-Chain Express',
                desc: 'Guaranteed 24-hour temperature-monitored pharmaceutical delivery directly to your doorstep.'
              },
              {
                icon: Sparkles,
                title: 'Calm AI Triage',
                desc: 'Evidence-based symptom evaluation and immediate clinical first-aid protocol.'
              },
              {
                icon: Lock,
                title: 'Encrypted Passport',
                desc: 'Permanent ISO microchip records, vaccination milestones, and paperless travel QR.'
              }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(46, 204, 155, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2ECC9B',
                  flexShrink: 0
                }}>
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15.5px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 03: SHOP PRODUCT CAROUSEL (BOUTIQUE FORMULARY)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-block', marginBottom: '8px' }}>
                <span className="sand-badge">Curated Formulary</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--foreground)', margin: 0 }}>
                Veterinary-Grade Essentials
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '520px' }}>
                Authentic diets, clinically validated parasite prevention, and precision monitoring collars.
              </p>
            </div>

            {/* Carousel Controls & All Products link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => scrollCarousel('left')}
                aria-label="Scroll left"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--foreground)',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                aria-label="Scroll right"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--foreground)',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => handleRoute('shop')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--foreground)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '8px',
                  textDecoration: 'underline'
                }}
              >
                View Catalog
              </button>
            </div>
          </div>

          {/* Carousel Track */}
          <div
            ref={carouselRef}
            style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              paddingBottom: '16px',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {shopItems.map((item) => (
              <div
                key={item.id}
                style={{
                  flex: '0 0 290px',
                  scrollSnapAlign: 'start',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
              >
                {/* Image & Sand Badge */}
                <div 
                  onClick={() => {
                    window.location.hash = `shop-product/${item.id}`;
                    handleRoute('shop');
                  }}
                  style={{ position: 'relative', height: '220px', backgroundColor: '#F2F1ED', cursor: 'pointer', overflow: 'hidden' }}
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {item.badge && (
                    <span 
                      className="sand-badge"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(217, 168, 115, 0.94)',
                        color: '#FFFFFF',
                        border: 'none'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {item.brand}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <span>{item.rating}</span>
                    </div>
                  </div>

                  <h3 
                    onClick={() => {
                      window.location.hash = `shop-product/${item.id}`;
                      handleRoute('shop');
                    }}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '16.5px',
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: 'var(--foreground)',
                      margin: '0 0 12px 0',
                      cursor: 'pointer'
                    }}
                  >
                    {item.name}
                  </h3>

                  {/* Price Row & Add to Bag CTA */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>
                        ৳{item.price}
                      </span>
                      {item.originalPrice && (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'line-through', marginLeft: '6px' }}>
                          ৳{item.originalPrice}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        addToCart(item, 1);
                        openModal('cart');
                        showToast(`Added ${item.name} to shopping bag!`, 'success');
                      }}
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: '#1F2421',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        padding: '7px 16px',
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 04: AI SCANNER (CHAT-STYLE MOCK, ZERO SCI-FI RADAR)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(36px, 6vw, 64px)', alignItems: 'center' }}>
          
          {/* Section Description Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '9999px', backgroundColor: 'rgba(46, 204, 155, 0.12)', color: '#158763', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
              <Sparkles size={14} color="#2ECC9B" />
              <span>Calm Clinical Decision Support</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--foreground)', lineHeight: 1.15, margin: '0 0 20px 0' }}>
              Immediate first-aid triage, without the panic.
            </h2>

            <p style={{ fontSize: '16px', lineHeight: 1.65, color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
              When your pet exhibits subtle distress, you don’t need flashing graphs or alarming radars. Pet Maya’s clinical AI conducts a gentle conversational evaluation, assesses urgency levels, and delivers actionable first-aid steps validated by veterinary guidelines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Check size={18} color="#2ECC9B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '14px', color: 'var(--foreground)' }}><strong>Standardized Triage Levels</strong> — Clear categorization from routine to urgent care.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Check size={18} color="#2ECC9B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '14px', color: 'var(--foreground)' }}><strong>First-Aid Action Protocol</strong> — Exact step-by-step measures before veterinary arrival.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Check size={18} color="#2ECC9B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '14px', color: 'var(--foreground)' }}><strong>Direct Telehealth Bridge</strong> — Seamless handoff to licensed veterinarians.</span>
              </div>
            </div>

            <button
              onClick={() => handleRoute('ai')}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#1F2421',
                fontWeight: 600,
                fontSize: '14.5px',
                padding: '12px 28px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Try Triage Checker</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Chat-Style Mock Right (Clean, Elegant, Boutique DTC) */}
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            padding: '24px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Chat Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(46, 204, 155, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#158763' }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14.5px', fontWeight: 600, color: 'var(--foreground)' }}>Maya Clinical Triage</div>
                  <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 500 }}>Evidence-Based Model</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Case #4092</span>
            </div>

            {/* User Message */}
            <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px 16px 4px 16px',
                padding: '12px 16px',
                fontSize: '13.5px',
                lineHeight: 1.5,
                color: 'var(--foreground)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=100&auto=format&fit=crop&q=80" 
                    alt="Uploaded pet lesion photo" 
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Milo (Golden Retriever, 3y)</span>
                </div>
                Milo has been licking his left front paw obsessively for 2 days. The pad looks slightly inflamed and pink.
              </div>
            </div>

            {/* AI Assistant Response */}
            <div style={{ alignSelf: 'flex-start', maxWidth: '92%' }}>
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px 16px 16px 4px',
                padding: '16px 18px',
                fontSize: '13.5px',
                lineHeight: 1.5,
                color: 'var(--foreground)'
              }}>
                {/* Triage Urgency Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{
                    backgroundColor: 'rgba(217, 168, 115, 0.20)',
                    color: '#8A5D2E',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    letterSpacing: '0.02em'
                  }}>
                    Level 2 Triage — Non-Emergent / Monitor
                  </span>
                </div>

                <p style={{ margin: '0 0 10px 0' }}>
                  Based on anatomical inspection and presentation, this suggests mild <strong>interdigital dermatitis</strong> or environmental contact sensitivity. No visible deep punctures or purulent discharge.
                </p>

                {/* Protocol Checklist */}
                <div style={{ backgroundColor: 'var(--bg)', borderRadius: '10px', padding: '10px 12px', margin: '10px 0', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>First-Aid Protocol</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>1. Gently rinse the paw in lukewarm saline or dilute chlorhexidine.</div>
                    <div>2. Pat dry thoroughly; do not apply human hydrocortisone.</div>
                    <div>3. Utilize a soft recovery bootie if licking resumes.</div>
                  </div>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '10px 0 14px 0' }}>
                  Recommended: If erythema intensifies or limping develops within 24 hours, schedule a clinical consult.
                </p>

                {/* Consultation Trigger Button */}
                <button
                  onClick={() => handleRoute('book-vet')}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#1F2421',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Video size={14} />
                  <span>Book Consult with Dr. Thorne (৳500)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 05: VET MARKETPLACE GRID
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <div style={{ display: 'inline-block', marginBottom: '8px' }}>
              <span className="mint-badge">Verified Specialists</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
              Licensed Veterinary Surgeons &amp; Clinicians
            </h2>
            <p style={{ fontSize: '15.5px', color: 'var(--text-secondary)', margin: 0 }}>
              Access 500+ verified veterinarians for HD teleconsultations, electronic prescriptions, and second opinions.
            </p>
          </div>

          {/* Vets Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {topVets.map((vet) => (
              <div
                key={vet.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img 
                    src={vet.photo} 
                    alt={vet.name}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                      {vet.name}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {vet.qualification}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <span>{vet.rating}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({vet.reviewsCount} reviews)</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {vet.price}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {vet.clinic}
                  </span>
                  <button
                    onClick={() => handleRoute('book-vet')}
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#1F2421',
                      fontWeight: 600,
                      fontSize: '13px',
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Book Visit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 06: COMMUNITY & PET MAYA JOURNAL STRIP
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-block', marginBottom: '8px' }}>
                <span className="sand-badge">The Pet Maya Journal</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--foreground)', margin: 0 }}>
                Clinical Insights &amp; Companion Care
              </h2>
            </div>
            <button
              onClick={() => handleRoute('blog')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--foreground)',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'underline'
              }}
            >
              <span>Browse All Articles</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {blogPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => handleRoute('blog')}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ borderRadius: '16px', overflow: 'hidden', height: '210px', backgroundColor: '#F0EFEA' }}>
                  <img 
                    src={post.image} 
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.25s ease' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#D9A873', letterSpacing: '0.04em' }}>{post.tag}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, lineHeight: 1.35, color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                    {post.excerpt}
                  </p>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>
                    By {post.author}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 07: EDITORIAL BOUTIQUE FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: 'var(--bg)', padding: '64px 24px 40px 24px' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '48px' }}>
            
            {/* Brand column */}
            <div style={{ maxWidth: '320px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 12px 0' }}>
                Pet Maya
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                A modern connected pet healthcare companion. Built with dignity, clinical rigor, and endless love for our animal companions.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#158763', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2ECC9B' }} />
                <span>All Systems Clinical &amp; Operational</span>
              </div>
            </div>

            {/* Links column 1: Ecosystem */}
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--foreground)', fontWeight: 700, marginBottom: '16px' }}>
                Ecosystem
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <li><a onClick={() => handleRoute('digital-pet-passport')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Digital Passport</a></li>
                <li><a onClick={() => handleRoute('ai-pet-care')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>AI Symptom Triage</a></li>
                <li><a onClick={() => handleRoute('pet-gps')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Smart GPS Collar</a></li>
                <li><a onClick={() => handleRoute('connected-care')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Connected Telemetry</a></li>
              </ul>
            </div>

            {/* Links column 2: Care & Shop */}
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--foreground)', fontWeight: 700, marginBottom: '16px' }}>
                Care &amp; Pharmacy
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <li><a onClick={() => handleRoute('shop')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Curated Care Shop</a></li>
                <li><a onClick={() => handleRoute('vets')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Veterinary Marketplace</a></li>
                <li><a onClick={() => handleRoute('book-vet')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Book Consultation</a></li>
                <li><a onClick={() => handleRoute('vaccines')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Vaccine Milestones</a></li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--foreground)', fontWeight: 700, marginBottom: '16px' }}>
                The Mindful Companion
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                Receive clinical nutrition notes, preventive health alerts, and seasonal veterinary updates.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="email" 
                  placeholder="name@domain.com"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '9999px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: 'var(--foreground)',
                    flex: 1,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => showToast('Subscribed to the Pet Maya Journal!', 'success')}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#1F2421',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Join
                </button>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '28px', borderTop: '1px solid var(--border)', fontSize: '12.5px', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '12px' }}>
            <div>© {new Date().getFullYear()} Pet Maya Inc. All rights reserved. Clinical veterinary companion platform.</div>
            <div style={{ display: 'flex', gap: '18px' }}>
              <a onClick={() => handleRoute('privacy')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
              <a onClick={() => handleRoute('terms')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
              <a onClick={() => handleRoute('faq')} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Clinical FAQ</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
