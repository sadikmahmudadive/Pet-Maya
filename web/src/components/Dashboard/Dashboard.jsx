import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Calendar, 
  ChevronRight, 
  Bell, 
  Star, 
  Clock, 
  MapPin,
  Stethoscope,
  ShoppingBag,
  Syringe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

export default function Dashboard() {
  const { pets, vets, appointments, removeAppointment, setActiveTab, openModal, showToast } = useApp();
  const { currentUser } = useAuth();

  // Dynamic greeting based on user's current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Filter ONLY doctors and veterinary medical specialists (exclude grooming, boarding, pet shop)
  const filteredVets = vets.filter((v) => {
    const tag = (v.tag || '').toLowerCase();
    const qual = (v.qualification || '').toLowerCase();
    const role = (v.role || '').toLowerCase();
    const name = (v.name || '').toLowerCase();

    if (
      tag.includes('groom') || 
      tag.includes('board') || 
      tag.includes('spa') || 
      tag.includes('shop') || 
      tag.includes('hotel') ||
      tag.includes('store') ||
      qual.includes('groom') ||
      qual.includes('boarding') ||
      qual.includes('hotel') ||
      name.includes('groom') ||
      name.includes('boarding') ||
      name.includes('spa')
    ) {
      return false;
    }

    return (
      tag.includes('vet') || 
      role.includes('vet') || 
      name.startsWith('dr.') || 
      name.startsWith('dr ') ||
      qual.includes('dvm') || 
      qual.includes('bvsc') || 
      qual.includes('mrcvs') || 
      qual.includes('officer') ||
      qual.includes('surgeon') ||
      qual.includes('veterin')
    );
  });

  const topVets = (filteredVets.length > 0 ? filteredVets : vets).slice(0, 3);

  // Format ISO / string dates
  const formatEventDate = (rawDate) => {
    if (!rawDate) return 'Aug 27, 2026';
    try {
      const cleanStr = rawDate.split('T')[0];
      const [year, month, day] = cleanStr.split('-');
      if (year && month && day) {
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (_) {}
    return rawDate;
  };

  // Format time window
  const formatEventTime = (rawTime, fromTime, toTime) => {
    if (fromTime && toTime) return `${fromTime} – ${toTime}`;
    if (rawTime) {
      if (rawTime.includes('-')) return rawTime;
      return `${rawTime}`;
    }
    if (fromTime) return fromTime;
    return '10:30 AM';
  };

  // Parse date safely
  const parseEventDate = (rawDate) => {
    if (!rawDate) return null;
    try {
      if (typeof rawDate === 'object' && rawDate !== null) {
        if (typeof rawDate.toDate === 'function') {
          const d = rawDate.toDate();
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        if (typeof rawDate.seconds === 'number') {
          const d = new Date(rawDate.seconds * 1000);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
          return new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
        }
      }
      if (typeof rawDate === 'string') {
        const str = rawDate.trim();
        if (str.includes('-')) {
          const datePart = str.split('T')[0];
          const parts = datePart.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
              return new Date(y, m, d);
            }
          }
        }
        const parsedMs = Date.parse(str);
        if (!isNaN(parsedMs)) {
          const d = new Date(parsedMs);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
      }
    } catch (_) {}
    return null;
  };

  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingAppointments = appointments
    .filter((apt) => {
      const statusLower = (apt.status || '').toLowerCase();
      if (apt.isCompleted === true || statusLower === 'completed' || statusLower === 'cancelled') {
        return false;
      }
      const evDate = parseEventDate(apt.date);
      if (!evDate) return false;
      return evDate.getTime() >= todayNorm.getTime();
    })
    .sort((a, b) => {
      const dateA = parseEventDate(a.date)?.getTime() || Infinity;
      const dateB = parseEventDate(b.date)?.getTime() || Infinity;
      return dateA - dateB;
    });

  // Quick actions
  const quickActions = [
    { label: 'Book Vet', icon: Stethoscope, color: '#10B981', bg: 'rgba(16,185,129,0.1)', action: () => openModal('booking') },
    { label: 'Tracker', icon: MapPin, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', action: () => setActiveTab('tracker') },
    { label: 'Reminder', icon: Syringe, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', action: () => openModal('booking') },
    { label: 'Shop', icon: ShoppingBag, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', action: () => setActiveTab('shop') },
  ];

  // Appointment type colors
  const aptTypeColor = (mode) => {
    const m = (mode || '').toLowerCase();
    if (m.includes('video') || m.includes('online') || m.includes('tele')) return '#3B82F6';
    if (m.includes('home')) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>

      {/* ── 1. GREETING HEADER ── */}
      <AppleReveal duration={0.55} yOffset={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          {/* Text block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'}
                alt={currentUser?.name || 'User'}
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              />
              <span className="presence-dot" style={{ position: 'absolute', bottom: 0, right: 0 }} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                {getGreeting()},
              </p>
              <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>
                {currentUser?.name || 'Pet Parent'} 👋
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 400 }}>
                {dateLabel}
              </p>
            </div>
          </div>

          {/* Right badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'rgba(147,51,234,0.1)',
                color: '#A855F7',
                padding: '6px 14px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'default',
              }}
            >
              <Star size={13} fill="#A855F7" />
              <span>{currentUser?.points ?? 15} pts</span>
            </motion.div>
            <button
              className="icon-btn"
              style={{ width: 38, height: 38, color: '#0EA5E9' }}
              onClick={() => showToast('🔔 No unread notifications.', 'info')}
              title="Notifications"
            >
              <Bell size={17} />
            </button>
          </div>
        </div>
      </AppleReveal>

      {/* ── 2. QUICK ACTIONS ── */}
      <AppleReveal delay={0.07} yOffset={14}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {quickActions.map((qa, i) => (
            <motion.button
              key={qa.label}
              onClick={qa.action}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                background: qa.bg,
                border: 'none',
                borderRadius: '16px',
                padding: '14px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '12px',
                background: qa.bg,
                border: `1px solid ${qa.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: qa.color,
              }}>
                <qa.icon size={18} />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                {qa.label}
              </span>
            </motion.button>
          ))}
        </div>
      </AppleReveal>

      {/* ── 3. MY PETS ── */}
      <AppleReveal delay={0.1} yOffset={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>My Pets</h2>
          <button className="btn-minimal" onClick={() => openModal('addPet')}>
            <Plus size={13} />
            Add Pet
          </button>
        </div>

        {/* Horizontal scrollable pet strip */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}>
          {/* Existing pets as circles */}
          {pets.map((pet) => (
            <motion.div
              key={pet.id || pet.petID}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              onClick={() => setActiveTab('tracker')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                flexShrink: 0,
                minWidth: '72px',
              }}
            >
              <div style={{
                width: 64, height: 64,
                borderRadius: '22px',
                overflow: 'hidden',
                border: '2px solid var(--primary)',
                boxShadow: '0 0 0 3px var(--primary-tint)',
                background: 'var(--surface-alt)',
              }}>
                <img
                  src={pet.photo || pet.photoUrl || 'assets/images/Pet_1.jpg'}
                  alt={pet.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.01em', textAlign: 'center' }}>
                {pet.name}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: -4 }}>
                {pet.breed || pet.species || ''}
              </span>
            </motion.div>
          ))}

          {/* Add pet button */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => openModal('addPet')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: '72px',
            }}
          >
            <div style={{
              width: 64, height: 64,
              borderRadius: '22px',
              border: '2px dashed var(--border)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}>
              <Plus size={20} />
            </div>
            <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center' }}>
              Add Pet
            </span>
          </motion.div>
        </div>
      </AppleReveal>

      {/* ── 4. UPCOMING EVENTS (TIMELINE) ── */}
      <AppleReveal delay={0.14} yOffset={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Upcoming Events</h2>
          <button
            className="btn-minimal"
            onClick={() => openModal('booking')}
          >
            <Plus size={13} />
            Book
          </button>
        </div>

        {upcomingAppointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="apple-solid-card"
            style={{ padding: '28px 24px', textAlign: 'center', alignItems: 'center', gap: '12px', background: 'var(--surface-alt)', borderRadius: '18px' }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 8px',
            }}>
              <Calendar size={18} />
            </div>
            <strong style={{ fontSize: '14.5px', display: 'block', color: 'var(--text-main)' }}>No upcoming events</strong>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>You're all clear — no scheduled appointments.</span>
            <button
              className="apple-btn-blue"
              style={{ marginTop: '8px', padding: '7px 18px', fontSize: '13px' }}
              onClick={() => openModal('booking')}
            >
              <Plus size={14} />
              <span>Book Appointment</span>
            </button>
          </motion.div>
        ) : (
          <AppleStagger style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingAppointments.slice(0, 3).map((apt) => {
              const accentColor = aptTypeColor(apt.mode);
              const displayTitle = (apt.title?.includes(':'))
                ? apt.title
                : `Dr. ${apt.doctor || 'Nazmul Hoda'}`;

              return (
                <motion.div
                  key={apt.id}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: '0',
                    background: 'var(--surface-alt)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Color left border strip */}
                  <div style={{ width: '4px', background: accentColor, flexShrink: 0, borderRadius: '16px 0 0 16px' }} />
                  
                  <div style={{ flex: 1, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '3px' }}>
                        {apt.mode?.toUpperCase() || 'VET APPOINTMENT'}
                      </span>
                      <strong style={{ fontSize: '15px', fontWeight: 700, display: 'block', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayTitle}
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        🐾 {apt.petName || 'Piku'}
                      </span>
                    </div>

                    {/* Date chip */}
                    <div style={{
                      background: `${accentColor}14`,
                      color: accentColor,
                      borderRadius: '10px',
                      padding: '6px 12px',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700 }}>{formatEventDate(apt.date)}</div>
                      <div style={{ fontSize: '10.5px', opacity: 0.8, marginTop: '1px' }}>{formatEventTime(apt.time, apt.fromTime, apt.toTime)}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AppleStagger>
        )}
      </AppleReveal>

      {/* ── 5. TOP VETERINARIANS (COMPACT 2-COL GRID) ── */}
      <AppleReveal delay={0.18} yOffset={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Top Veterinarians</h2>
          <button className="btn-minimal" onClick={() => setActiveTab('vets')}>
            See all <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {topVets.map((v) => (
            <motion.div
              key={v.id}
              whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                background: 'var(--surface-alt)',
                borderRadius: '18px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
              }}
              onClick={() => openModal('booking', { doctor: v.name, clinic: v.clinic })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={v.photo || 'assets/images/Pet_1.jpg'}
                  alt={v.name}
                  style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '14.5px', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.name}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.qualification || 'Veterinarian'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <Star size={11} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{v.rating || '5.0'}</span>
                    <span>· {v.reviews || v.reviewsCount || 1} reviews</span>
                  </div>
                </div>
              </div>

              {/* Book button */}
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '8px 14px', fontSize: '13px', borderRadius: '12px' }}
                onClick={(e) => { e.stopPropagation(); openModal('booking', { doctor: v.name, clinic: v.clinic }); }}
              >
                Book Appointment
              </button>
            </motion.div>
          ))}
        </div>
      </AppleReveal>

    </div>
  );
}
