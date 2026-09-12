import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Calendar, 
  ChevronRight, 
  Bell, 
  Star, 
  Clock, 
  Radio, 
  Sparkles, 
  Syringe, 
  ShoppingBag, 
  Users, 
  FileText, 
  Briefcase, 
  History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleReveal } from '../Animations/AppleReveal';

// ─── Circular Vitality Progress Ring ──────────────────────────────────────────
function VitalityRing({ score = 100, size = 76, strokeWidth = 4, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const ringColor = score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(16, 185, 129, 0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { 
    pets = [], 
    vets = [], 
    appointments = [], 
    devices = [], 
    setActiveTab, 
    openModal, 
    showToast 
  } = useApp();
  const { currentUser } = useAuth();

  // ── Hero Pet Carousel State (Auto-sweep every 10s) ──────────────────────────
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const activePets = pets.length > 0 ? pets : [
    {
      id: 'default-miko',
      name: 'Miko',
      breed: 'Domestic Shorthair',
      age: '1 Year, 4 Months',
      weight: '3',
      photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80',
      healthIndex: 100,
    }
  ];

  // Auto-sweep every 10 seconds to show all user pets
  useEffect(() => {
    if (activePets.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentPetIndex((prev) => (prev + 1) % activePets.length);
    }, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activePets.length, isPaused]);

  const activePet = activePets[currentPetIndex] || activePets[0];

  // Dynamic greeting based on user's local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  // Has paired GPS device
  const hasGpsDevice = devices?.some((d) => d.deviceType === 'gps_collar' || d.isOnline);

  // Doctors / Specialists only
  const filteredVets = vets.filter((v) => {
    const tag = (v.tag || '').toLowerCase();
    const qual = (v.qualification || '').toLowerCase();
    const role = (v.role || '').toLowerCase();
    const name = (v.name || '').toLowerCase();

    if (tag.includes('groom') || tag.includes('shop') || tag.includes('store') || tag.includes('hotel') || tag.includes('board')) {
      return false;
    }
    return tag.includes('vet') || role.includes('vet') || name.startsWith('dr') || qual.includes('dvm') || qual.includes('surgeon') || qual.includes('officer');
  });

  const topVets = (filteredVets.length > 0 ? filteredVets : vets).slice(0, 3);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px', 
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '8px 0 32px'
      }}
    >

      {/* ── 1. HEADER ROW (Avatar, Greeting, Star Points, Notification Bell) ── */}
      <AppleReveal duration={0.45} yOffset={12}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'}
                alt={currentUser?.name || 'Sm Adive'}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(16, 185, 129, 0.25)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              />
            </div>
            <div>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', fontWeight: 500, lineHeight: 1.2 }}>
                {getGreeting()}
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
                {currentUser?.name || 'Sm Adive'}
              </h1>
            </div>
          </div>

          {/* Right Badges: Points Pill & Bell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Star Points Badge */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#8B5CF6',
                padding: '6px 14px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '13.5px',
                letterSpacing: '-0.01em',
              }}
            >
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF'
              }}>
                <Star size={10} fill="#FFF" />
              </div>
              <span>{currentUser?.points ?? 20}</span>
            </div>

            {/* Notification Bell Button */}
            <button
              className="icon-btn"
              onClick={() => showToast('🔔 All caught up! No unread notifications.', 'info')}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#0284C7',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>
      </AppleReveal>

      {/* ── 2. HERO ACTIVE PET BENTO CARD (10s Auto-Sweeping Carousel) ── */}
      <AppleReveal delay={0.06} yOffset={14}>
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div 
            style={{
              background: 'var(--surface-alt)',
              borderRadius: '24px',
              padding: '20px 22px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activePet.id || activePet.petID || currentPetIndex}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Top Section: Avatar with Ring + Pet Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  {/* Avatar + 100% Vitality Ring */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <VitalityRing score={activePet.healthIndex ?? 100} size={76} strokeWidth={4}>
                      <img
                        src={activePet.photo || activePet.photoUrl || 'assets/images/Pet_1.jpg'}
                        alt={activePet.name}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </VitalityRing>
                    {/* 100% Health Badge */}
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        right: -3,
                        background: '#10B981',
                        color: '#FFFFFF',
                        fontSize: '9px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
                      }}
                    >
                      {activePet.healthIndex ?? 100}%
                    </div>
                  </div>

                  {/* Pet Info & Chips */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                      {activePet.name}
                    </h2>
                    
                    {/* Attribute Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{
                        background: 'var(--surface)',
                        color: 'var(--text-muted)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid var(--border)'
                      }}>
                        {activePet.breed || 'Domestic Shorthair'}
                      </span>
                      <span style={{
                        background: 'var(--surface)',
                        color: 'var(--text-muted)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid var(--border)'
                      }}>
                        {activePet.age ? (activePet.age.toString().includes('yr') ? activePet.age : `${activePet.age} yrs`) : '1 Year, 4 Months yrs'}
                      </span>
                      <span style={{
                        background: 'var(--surface)',
                        color: 'var(--text-muted)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid var(--border)'
                      }}>
                        {activePet.weight ? `${activePet.weight} kg` : '3 kg'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: 3 Action Pills (Passport, Vaccines, Radar) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' }}>
                  {/* Passport Action */}
                  <button
                    onClick={() => openModal('petPassport')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '16px',
                      padding: '10px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#10B981',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FileText size={16} />
                    <span>Passport</span>
                  </button>

                  {/* Vaccines Action */}
                  <button
                    onClick={() => setActiveTab('vaccines')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '16px',
                      padding: '10px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#10B981',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Syringe size={16} />
                    <span>Vaccines</span>
                  </button>

                  {/* Radar Action */}
                  <button
                    onClick={() => setActiveTab('tracker')}
                    style={{
                      background: 'rgba(2, 136, 209, 0.08)',
                      border: '1px solid rgba(2, 136, 209, 0.25)',
                      borderRadius: '16px',
                      padding: '10px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#0284C7',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Radio size={16} />
                    <span>Radar</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Pagination Indicator (Active Green Pill + Inactive Dots) */}
          {activePets.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              {activePets.map((p, idx) => {
                const isActive = idx === currentPetIndex;
                return (
                  <button
                    key={p.id || idx}
                    onClick={() => setCurrentPetIndex(idx)}
                    aria-label={`Go to pet ${p.name}`}
                    style={{
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      width: isActive ? 22 : 6,
                      height: 5,
                      borderRadius: '3px',
                      background: isActive ? '#10B981' : 'var(--border)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </AppleReveal>

      {/* ── 3. MY PETS SECTION (Header + Horizontal Cards) ── */}
      <AppleReveal delay={0.1} yOffset={14}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              My Pets
            </h2>
            <button 
              onClick={() => openModal('addPet')}
              style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', padding: 0 }}
            >
              See All
            </button>
          </div>

          {/* Horizontal Pet Cards Strip */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '14px', 
              overflowX: 'auto', 
              paddingBottom: '6px',
              scrollbarWidth: 'none'
            }}
          >
            {activePets.map((pet, idx) => {
              const isCurrent = idx === currentPetIndex;
              return (
                <motion.div
                  key={pet.id || idx}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentPetIndex(idx)}
                  style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '22px',
                    padding: '16px 14px',
                    minWidth: '140px',
                    flex: '0 0 140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    border: isCurrent ? '2px solid #10B981' : '1px solid var(--border)',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 4px 14px rgba(16, 185, 129, 0.12)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <VitalityRing score={pet.healthIndex ?? 100} size={64} strokeWidth={3}>
                    <img
                      src={pet.photo || pet.photoUrl || 'assets/images/Pet_1.jpg'}
                      alt={pet.name}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </VitalityRing>

                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {pet.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {pet.breed || pet.species || 'Domestic Shorthair'}
                  </span>
                </motion.div>
              );
            })}

            {/* Add Pet Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal('addPet')}
              style={{
                background: 'transparent',
                borderRadius: '22px',
                padding: '16px 14px',
                minWidth: '120px',
                flex: '0 0 120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '2px dashed var(--border)',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--surface-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}>
                <Plus size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                Add Pet
              </span>
            </motion.div>
          </div>
        </div>
      </AppleReveal>

      {/* ── 4. SMART CARE HUB (2x2 Grid + Full-Width Community Feed) ── */}
      <AppleReveal delay={0.14} yOffset={14}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Smart Care Hub
          </h2>

          {/* 2x2 Bento Hub Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {/* 1. GPS Radar */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('tracker')}
              style={{
                background: 'var(--surface-alt)',
                borderRadius: '22px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '14px',
                  background: 'rgba(2, 136, 209, 0.12)',
                  color: '#0288D1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Radio size={20} />
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.4px',
                  background: hasGpsDevice ? 'rgba(16, 185, 129, 0.15)' : '#FEF3C7',
                  color: hasGpsDevice ? '#10B981' : '#D97706',
                }}>
                  {hasGpsDevice ? 'LIVE' : 'INACTIVE'}
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 3px', color: 'var(--text-main)' }}>
                  GPS Radar
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hasGpsDevice ? 'Live perimeter & telemetry' : 'No GPS device paired • Tap to pair'}
                </p>
              </div>
            </motion.div>

            {/* 2. AI Health Scan */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('ai')}
              style={{
                background: 'var(--surface-alt)',
                borderRadius: '22px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '14px',
                  background: 'rgba(124, 77, 255, 0.12)',
                  color: '#7C4DFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={20} />
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(124, 77, 255, 0.15)',
                  color: '#7C4DFF',
                  letterSpacing: '0.4px',
                }}>
                  AI 2.0
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 3px', color: 'var(--text-main)' }}>
                  AI Health Scan
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Instant triage & visual vitals
                </p>
              </div>
            </motion.div>

            {/* 3. Vaccine Hub */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('vaccines')}
              style={{
                background: 'var(--surface-alt)',
                borderRadius: '22px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '14px',
                  background: 'rgba(0, 191, 165, 0.12)',
                  color: '#00BFA5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Syringe size={20} />
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0, 191, 165, 0.15)',
                  color: '#00BFA5',
                  letterSpacing: '0.4px',
                }}>
                  100%
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 3px', color: 'var(--text-main)' }}>
                  Vaccine Hub
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Immunization schedule & doses
                </p>
              </div>
            </motion.div>

            {/* 4. Care Shop */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('shop')}
              style={{
                background: 'var(--surface-alt)',
                borderRadius: '22px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '14px',
                  background: 'rgba(255, 145, 0, 0.12)',
                  color: '#FF9100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShoppingBag size={20} />
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 145, 0, 0.15)',
                  color: '#FF9100',
                  letterSpacing: '0.4px',
                }}>
                  PHARMA
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 3px', color: 'var(--text-main)' }}>
                  Care Shop
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Prescription diets & treats
                </p>
              </div>
            </motion.div>
          </div>

          {/* Full-Width Card: Community & Vet Feed */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveTab('community')}
            style={{
              background: 'var(--surface-alt)',
              borderRadius: '22px',
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                background: 'rgba(26, 182, 128, 0.12)',
                color: '#1AB680',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Users size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-main)' }}>
                  Community & Vet Feed
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                  Connect with 10k+ pet parents & clinicians
                </p>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </motion.div>
        </div>
      </AppleReveal>

      {/* ── 5. UPCOMING EVENTS SECTION ── */}
      <AppleReveal delay={0.18} yOffset={14}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Upcoming Events
            </h2>
            <button 
              onClick={() => openModal('myAppointments')}
              style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', padding: 0 }}
            >
              See All
            </button>
          </div>

          {appointments.length === 0 ? (
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              No upcoming events.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {appointments.slice(0, 2).map((apt) => (
                <div 
                  key={apt.id}
                  style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{apt.title || 'Veterinary Consultation'}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      {apt.petName ? `For ${apt.petName}` : 'Scheduled visit'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
                    {apt.date ? apt.date.toString().split('T')[0] : 'Upcoming'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppleReveal>

      {/* ── 6. TOP VETERINARIANS SECTION (Detailed Cards) ── */}
      <AppleReveal delay={0.22} yOffset={14}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Top Veterinarians
            </h2>
            <button 
              onClick={() => setActiveTab('vets')}
              style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', padding: 0 }}
            >
              See All
            </button>
          </div>

          {/* Detailed Vet Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topVets.map((vet) => (
              <motion.div
                key={vet.id}
                whileHover={{ y: -2 }}
                style={{
                  background: 'var(--surface-alt)',
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
                }}
              >
                {/* Header: Photo + Name + Designation + Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={vet.photo || vet.photoUrl || 'assets/images/Pet_1.jpg'}
                    alt={vet.name}
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(16, 185, 129, 0.25)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
                      {vet.name}
                    </h3>
                    <span style={{ fontSize: '13px', color: '#10B981', fontWeight: 700, display: 'block' }}>
                      {vet.qualification || 'District Livestock Officer'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px' }}>
                      <Star size={13} fill="#F59E0B" color="#F59E0B" />
                      <strong style={{ color: 'var(--text-main)', fontWeight: 800 }}>{vet.rating || '5.0'}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>({vet.reviews || vet.reviewsCount || 1} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Professional Profile Box */}
                <div 
                  style={{
                    background: 'var(--surface)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    margin: '16px 0',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>
                    PROFESSIONAL PROFILE
                  </span>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    {vet.bio || 'Experienced in complex surgeries and preventive care for small animals.'}
                  </p>
                </div>

                {/* Footer: Exp Pills + Start CTA Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'var(--surface)',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)'
                    }}>
                      <Briefcase size={12} />
                      <span>{vet.experience || '10 Years'} Exp</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'var(--surface)',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)'
                    }}>
                      <History size={12} />
                      <span>N/A Last</span>
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={() => openModal('booking', { doctor: vet.name, clinic: vet.clinic })}
                    style={{
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '999px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <span>Start</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AppleReveal>

    </div>
  );
}
