import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Radar, 
  Activity, 
  Utensils, 
  Stethoscope, 
  Plus, 
  Calendar, 
  Trash2, 
  Award,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Bell,
  Heart,
  DollarSign,
  MapPin,
  MessageCircle,
  BookOpen,
  Star,
  Briefcase,
  Clock,
  Video
} from 'lucide-react';

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

  const topVets = vets.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1120px', margin: '0 auto', width: '100%' }}>
      
      {/* ── 1. USER GREETING HEADER BANNER ── */}
      <div 
        className="apple-promo-card" 
        style={{
          background: 'var(--surface-solid)',
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
            style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
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
              border: '1px solid rgba(147, 51, 234, 0.3)',
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
            style={{ width: 40, height: 40, background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', border: '1px solid rgba(14, 165, 233, 0.3)' }}
            onClick={() => showToast('🔔 No unread push notifications.', 'info')}
            title="Notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* ── 2. MY PETS SECTION ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>My Pets</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="apple-link-cta" onClick={() => openModal('addPet')}>
              <Plus size={14} />
              <span>Add Pet</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {pets.map((pet) => (
            <div 
              key={pet.id || pet.petID} 
              className="apple-promo-card" 
              style={{
                padding: '20px',
                textAlign: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onClick={() => setActiveTab('tracker')}
            >
              <div style={{ width: 110, height: 110, borderRadius: '24px', overflow: 'hidden', marginBottom: '12px', border: '1.5px solid var(--border)', background: '#000' }}>
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
            className="apple-promo-card" 
            style={{ 
              border: '2px dashed var(--border)', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '24px', 
              cursor: 'pointer',
              background: 'transparent',
              minHeight: '180px'
            }}
            onClick={() => openModal('addPet')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <Plus size={20} />
            </div>
            <strong style={{ fontSize: '14px', fontWeight: 600 }}>Add New Pet</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dog, Cat, Bird or Rabbit</span>
          </div>
        </div>
      </div>

      {/* ── 3. DISCOVER MORE (7 MATCHING DISCOVERY CARDS) ── */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Discover More</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          
          {/* 1. Pet Shop */}
          <div 
            className="apple-promo-card" 
            style={{ padding: '22px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('shop')}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <DollarSign size={20} />
            </div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Pet Shop</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '16px' }}>
              Premium treats &amp; food
            </span>
            <span className="apple-link-cta" style={{ fontSize: '12px', fontWeight: 700, marginTop: 'auto', color: '#10B981' }}>
              <span>SHOP</span>
              <ChevronRight size={13} />
            </span>
          </div>

          {/* 2. Tracker */}
          <div 
            className="apple-promo-card" 
            style={{ padding: '22px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('tracker')}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <MapPin size={20} />
            </div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Tracker</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '16px' }}>
              Live GPS location
            </span>
            <span className="apple-link-cta" style={{ fontSize: '12px', fontWeight: 700, marginTop: 'auto', color: '#3B82F6' }}>
              <span>LOCATE</span>
              <ChevronRight size={13} />
            </span>
          </div>

          {/* 3. Wellness */}
          <div 
            className="apple-promo-card" 
            style={{ padding: '22px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('ai')}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(147, 51, 234, 0.15)', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <MessageCircle size={20} />
            </div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Wellness</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '16px' }}>
              AI health scan
            </span>
            <span className="apple-link-cta" style={{ fontSize: '12px', fontWeight: 700, marginTop: 'auto', color: '#A855F7' }}>
              <span>CHECK</span>
              <ChevronRight size={13} />
            </span>
          </div>

          {/* 4. Specialists */}
          <div 
            className="apple-promo-card" 
            style={{ padding: '22px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('vets')}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Stethoscope size={20} />
            </div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Specialists</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '16px' }}>
              Verified clinicians
            </span>
            <span className="apple-link-cta" style={{ fontSize: '12px', fontWeight: 700, marginTop: 'auto', color: '#F59E0B' }}>
              <span>FIND</span>
              <ChevronRight size={13} />
            </span>
          </div>

          {/* 5. Community */}
          <div 
            className="apple-promo-card" 
            style={{ padding: '22px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('community')}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Heart size={20} />
            </div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Community</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '16px' }}>
              Global feed
            </span>
            <span className="apple-link-cta" style={{ fontSize: '12px', fontWeight: 700, marginTop: 'auto', color: '#22C55E' }}>
              <span>EXPLORE</span>
              <ChevronRight size={13} />
            </span>
          </div>

          {/* 6. Blog */}
          <div 
            className="apple-promo-card" 
            style={{ padding: '22px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('food')}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(249, 115, 22, 0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <BookOpen size={20} />
            </div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Blog</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '16px' }}>
              Expert advice &amp; diet
            </span>
            <span className="apple-link-cta" style={{ fontSize: '12px', fontWeight: 700, marginTop: 'auto', color: '#F97316' }}>
              <span>READ</span>
              <ChevronRight size={13} />
            </span>
          </div>

          {/* 7. Reminders */}
          <div 
            className="apple-promo-card" 
            style={{ padding: '22px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('vaccines')}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Calendar size={20} />
            </div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Reminders</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '16px' }}>
              Schedule care
            </span>
            <span className="apple-link-cta" style={{ fontSize: '12px', fontWeight: 700, marginTop: 'auto', color: '#EF4444' }}>
              <span>VIEW</span>
              <ChevronRight size={13} />
            </span>
          </div>

        </div>
      </div>

      {/* ── 4. UPCOMING EVENTS SECTION ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Upcoming Events</h2>
          <button className="apple-link-cta" onClick={() => openModal('booking')}>
            <span>See All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="apple-promo-card" style={{ padding: '32px', textAlign: 'center' }}>
            <Calendar size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <strong style={{ fontSize: '15px' }}>No Upcoming Events</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '14px' }}>
              Schedule a veterinary visit, grooming session, or medication reminder.
            </p>
            <button className="apple-btn-blue" onClick={() => openModal('booking')}>
              <span>Book Appointment</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.map((apt) => (
              <div 
                key={apt.id} 
                className="apple-promo-card"
                style={{
                  padding: '20px 24px',
                  alignItems: 'stretch',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    VET APPOINTMENT
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {apt.date} • {apt.time}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0' }}>
                  Veterinarian: {apt.doctor}
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    🐾 {apt.petName}
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {apt.mode?.includes('Tele') && (
                      <button 
                        className="apple-btn-blue" 
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => openModal('teleconsult', { doctor: apt.doctor })}
                      >
                        <Video size={13} />
                        <span>Join Call</span>
                      </button>
                    )}
                    <button 
                      className="icon-btn" 
                      onClick={() => removeAppointment(apt.id)}
                      title="Cancel Event"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. TOP VETERINARIANS SECTION ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Top Veterinarians</h2>
          <button className="apple-link-cta" onClick={() => setActiveTab('vets')}>
            <span>See All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {topVets.map((v) => (
            <div 
              key={v.id} 
              className="apple-promo-card" 
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
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
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

              {/* Professional Profile Inner Card */}
              <div style={{ background: 'var(--surface-alt)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span className="label-mini" style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>PROFESSIONAL PROFILE</span>
                <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.45, margin: 0 }}>
                  {v.bio || 'Experienced in complex surgeries and preventive care for small animals.'}
                </p>
              </div>

              {/* Bottom Tags & Start Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} />
                    <span>{v.experience || '10 Years Exp'}</span>
                  </span>
                  <span style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
        </div>
      </div>

    </div>
  );
}
