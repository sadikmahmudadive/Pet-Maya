import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Calendar, 
  Trash2, 
  ChevronRight, 
  Bell, 
  Star, 
  Briefcase, 
  Clock, 
  Video 
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

export default function Dashboard() {
  const { pets, vets, appointments, removeAppointment, setActiveTab, openModal, showToast } = useApp();
  const { currentUser } = useAuth();

  // Dynamic greeting based on user's current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  // Filter ONLY doctors and veterinary medical specialists (exclude grooming, boarding, pet shop)
  const topVets = vets
    .filter((v) => {
      const tag = (v.tag || '').toLowerCase();
      const qual = (v.qualification || '').toLowerCase();
      const role = (v.role || '').toLowerCase();
      const name = (v.name || '').toLowerCase();

      // Exclude explicit non-vet services
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

      // Include confirmed veterinarians
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
    })
    .slice(0, 3);

  // Format ISO / string dates to clean Apple format e.g. "Aug 26, 2026"
  const formatEventDate = (rawDate) => {
    if (!rawDate) return 'Aug 26, 2026';
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

  // Format time window e.g. "10:30 AM - 11:15 AM"
  const formatEventTime = (rawTime) => {
    if (!rawTime) return '10:30 AM - 11:15 AM';
    if (rawTime.includes('-')) return rawTime;
    return `${rawTime} - 11:15 AM`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* ── 1. USER GREETING HEADER BANNER ── */}
      <AppleReveal duration={0.8} yOffset={25}>
        <div 
          className="apple-solid-card" 
        style={{
          padding: '24px 30px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
            alt={currentUser?.name || 'User'} 
            style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }} 
          />
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{getGreeting()}</span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              {currentUser?.name || 'Pet Parent'}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Reward Points Badge */}
          <div 
            style={{ 
              background: 'rgba(147, 51, 234, 0.15)', 
              color: '#A855F7',
              padding: '6px 14px', 
              borderRadius: '999px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            <Star size={14} fill="#A855F7" />
            <span>{currentUser?.points ?? 15}</span>
          </div>

          {/* Notification Bell */}
          <button 
            className="icon-btn" 
            style={{ width: 40, height: 40, background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9' }}
            onClick={() => showToast('🔔 No unread push notifications.', 'info')}
            title="Notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>
      </AppleReveal>

      {/* ── 2. MY PETS SECTION ── */}
      <AppleReveal delay={0.1} yOffset={25}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>My Pets</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="apple-link-cta" onClick={() => openModal('addPet')}>
              <Plus size={14} />
              <span>Add Pet</span>
            </button>
          </div>
        </div>

        <AppleStagger className="apple-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {pets.map((pet) => (
            <div 
              key={pet.id || pet.petID} 
              className="apple-solid-card" 
              style={{
                padding: '20px',
                textAlign: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onClick={() => setActiveTab('tracker')}
            >
              <div style={{ width: 110, height: 110, borderRadius: '24px', overflow: 'hidden', marginBottom: '12px', background: '#000' }}>
                <img 
                  src={pet.photo || pet.photoUrl || 'assets/images/Pet_1.jpg'} 
                  alt={pet.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <strong style={{ fontSize: '17px', fontWeight: 700, display: 'block' }}>{pet.name}</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{pet.breed || pet.species}</span>
            </div>
          ))}

          {/* Add Pet Card */}
          <div 
            className="apple-solid-card" 
            style={{ 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '30px', 
              cursor: 'pointer',
              border: '2px dashed var(--border)',
              background: 'transparent'
            }}
            onClick={() => openModal('addPet')}
          >
            <div style={{ width: 60, height: 60, borderRadius: '20px', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Plus size={24} color="var(--primary)" />
            </div>
            <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>Add Another Pet</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sync records & AI trackers</span>
          </div>
        </AppleStagger>
      </AppleReveal>

      {/* ── 3. UPCOMING EVENTS SECTION ── */}
      <AppleReveal delay={0.15} yOffset={25}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Upcoming Events</h2>
          <button 
            className="apple-link-cta" 
            style={{ color: '#10B981', fontWeight: 600, fontSize: '13px' }} 
            onClick={() => openModal('booking')}
          >
            <span>See All</span>
          </button>
        </div>

        {appointments.length === 0 ? (
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: '24px 28px', 
              borderRadius: '24px', 
              textAlign: 'left',
              alignItems: 'stretch',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                VET APPOINTMENT
              </span>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Aug 26, 2026</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>10:30 AM - 11:15 AM</span>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
              Veterinarian: Dr. Nazmul Hoda
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
              <span>🐾</span>
              <span>Piku</span>
            </div>
          </div>
        ) : (
          <AppleStagger className="apple-grid-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {appointments.map((apt) => {
              const displayTitle = (apt.title?.startsWith('Veterinarian:') || apt.title?.includes(':'))
                ? apt.title
                : `Veterinarian: ${apt.doctor || 'Dr. Nazmul Hoda'}`;

              return (
                <div 
                  key={apt.id} 
                  className="apple-solid-card"
                  style={{
                    padding: '24px 28px',
                    borderRadius: '24px',
                    alignItems: 'stretch',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      color: '#10B981', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.06em' 
                    }}>
                      {apt.mode?.toUpperCase() || 'VET APPOINTMENT'}
                    </span>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {formatEventDate(apt.date)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {formatEventTime(apt.time)}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                    {displayTitle}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                    <span>🐾</span>
                    <span>{apt.petName || 'Piku'}</span>
                  </div>
                </div>
              );
            })}
          </AppleStagger>
        )}
      </AppleReveal>

      {/* ── 4. TOP VETERINARIANS SECTION ── */}
      <AppleReveal delay={0.2} yOffset={25}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Top Veterinarians</h2>
          <button className="apple-link-cta" onClick={() => setActiveTab('vets')}>
            <span>See All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <AppleStagger className="apple-grid-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {topVets.map((v) => (
            <div 
              key={v.id} 
              className="apple-solid-card" 
              style={{
                padding: '24px',
                alignItems: 'stretch',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Vet Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={v.photo || 'assets/images/Pet_1.jpg'} 
                  alt={v.name} 
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div>
                  <strong style={{ fontSize: '17px', fontWeight: 700, display: 'block' }}>{v.name}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                    {v.qualification || 'District Livestock Officer'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', marginTop: '2px' }}>
                    <Star size={13} fill="#F59E0B" color="#F59E0B" />
                    <strong>{v.rating || '5.0'}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>({v.reviews || v.reviewsCount || 1} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Professional Profile — inline, no nested box */}
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {v.bio || 'Experienced in complex surgeries and preventive care for small animals.'}
              </p>

              {/* Bottom Tags & Start Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--surface-alt)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} />
                    <span>{v.experience || '10 Years Exp'}</span>
                  </span>
                  <span style={{ background: 'var(--surface-alt)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{v.availability?.split('•')[0] || 'Daily Slots'}</span>
                  </span>
                </div>

                <button 
                  className="apple-btn-blue" 
                  style={{ background: 'var(--primary)', padding: '8px 18px', fontSize: '13px' }}
                  onClick={() => openModal('booking', { doctor: v.name, clinic: v.clinic })}
                >
                  <span>Start</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </AppleStagger>
      </AppleReveal>

    </div>
  );
}
