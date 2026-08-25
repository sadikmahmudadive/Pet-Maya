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
  Heart
} from 'lucide-react';

export default function Dashboard() {
  const { pets, appointments, removeAppointment, setActiveTab, openModal } = useApp();
  const { currentUser } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── APPLE TITANIUM WELCOME CARD ── */}
      <div 
        className="apple-promo-card" 
        style={{
          background: 'var(--surface-solid)',
          alignItems: 'stretch',
          textAlign: 'left',
          padding: '32px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>
            Pet Parent Console
          </span>
          <h1 style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '4px' }}>
            Welcome, {currentUser ? currentUser.name.split(' ')[0] : 'Pet Parent'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {pets.length} {pets.length === 1 ? 'pet profile' : 'pet profiles'} connected across your Apple &amp; Android devices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {/* Reward Points */}
          <div 
            style={{ 
              background: 'var(--surface-alt)', 
              border: '1px solid var(--border)',
              padding: '12px 20px', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}
          >
            <Award size={24} color="#F59E0B" />
            <div>
              <strong style={{ fontSize: '18px', fontWeight: 700, display: 'block', lineHeight: 1.1 }}>
                {currentUser?.points ?? 45} pts
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Care Reward Points</span>
            </div>
          </div>

          <button 
            className="apple-btn-blue" 
            onClick={() => openModal('addPet')}
            style={{ padding: '12px 22px' }}
          >
            <Plus size={16} />
            <span>Add Pet Profile</span>
          </button>
        </div>
      </div>

      {/* ── MY PETS FAMILY SECTION ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Pet Family</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time biometric profiles and telemetry</span>
          </div>
          <button className="apple-link-cta" onClick={() => openModal('addPet')}>
            <Plus size={15} />
            <span>Register New Pet</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {pets.map((pet) => (
            <div 
              key={pet.id} 
              className="apple-promo-card" 
              style={{ padding: '24px', alignItems: 'stretch', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img 
                  src={pet.photo || 'assets/images/Pet_1.jpg'} 
                  alt={pet.name} 
                  style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} 
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>{pet.name}</strong>
                    <span className="badge badge-green">{pet.species}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{pet.breed}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', background: 'var(--surface-alt)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Age:</span> <strong style={{ color: 'var(--text-main)' }}>{pet.age}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Weight:</span> <strong style={{ color: 'var(--text-main)' }}>{pet.weight}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong style={{ color: 'var(--text-main)' }}>{pet.gender}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Microchip:</span> <strong style={{ color: 'var(--text-main)' }}>{pet.microchip}</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                <button 
                  className="btn-ghost" 
                  style={{ flex: 1, fontSize: '12.5px', padding: '7px' }}
                  onClick={() => setActiveTab('tracker')}
                >
                  <Radar size={14} color="var(--primary)" />
                  <span>Sonar GPS</span>
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ flex: 1, fontSize: '12.5px', padding: '7px' }}
                  onClick={() => setActiveTab('vaccines')}
                >
                  <Bell size={14} color="#3B82F6" />
                  <span>Passport</span>
                </button>
              </div>
            </div>
          ))}

          {/* Add Pet Empty Card */}
          <div 
            className="apple-promo-card" 
            style={{ 
              border: '2px dashed var(--border)', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '36px', 
              cursor: 'pointer',
              background: 'transparent'
            }}
            onClick={() => openModal('addPet')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <Plus size={22} />
            </div>
            <strong style={{ fontSize: '15px', fontWeight: 600 }}>Add Pet Profile</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Dog, Cat, Bird or Rabbit</span>
          </div>
        </div>
      </div>

      {/* ── APPLE QUICK HUB MATRIX ── */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Care Services</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Quick access to live telemetry, triage, and specialists</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div 
            className="apple-promo-card" 
            style={{ padding: '24px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('tracker')}
          >
            <Radar size={24} color="#10B981" style={{ marginBottom: '8px' }} />
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Live Sonar Radar</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '12px' }}>
              Continuous GPS geofencing with audio collar sound buzzer.
            </p>
            <span className="apple-link-cta" style={{ fontSize: '13px', marginTop: 'auto' }}>
              <span>Open Radar</span>
              <ChevronRight size={14} />
            </span>
          </div>

          <div 
            className="apple-promo-card" 
            style={{ padding: '24px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('ai')}
          >
            <Activity size={24} color="#3B82F6" style={{ marginBottom: '8px' }} />
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>AI Vision Diagnostic</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '12px' }}>
              Computer vision inspection for skin lesions, eyes and ears.
            </p>
            <span className="apple-link-cta" style={{ fontSize: '13px', marginTop: 'auto' }}>
              <span>Scan photo</span>
              <ChevronRight size={14} />
            </span>
          </div>

          <div 
            className="apple-promo-card" 
            style={{ padding: '24px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('vets')}
          >
            <Stethoscope size={24} color="#F59E0B" style={{ marginBottom: '8px' }} />
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Specialist Network</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '12px' }}>
              Book slots with 500+ verified veterinarians &amp; teleconsultants.
            </p>
            <span className="apple-link-cta" style={{ fontSize: '13px', marginTop: 'auto' }}>
              <span>Find specialist</span>
              <ChevronRight size={14} />
            </span>
          </div>

          <div 
            className="apple-promo-card" 
            style={{ padding: '24px', textAlign: 'left', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => setActiveTab('food')}
          >
            <Utensils size={24} color="#EC4899" style={{ marginBottom: '8px' }} />
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>Daily Nutrition Formula</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '12px' }}>
              Scientific calorie portion targets and breed explorer.
            </p>
            <span className="apple-link-cta" style={{ fontSize: '13px', marginTop: 'auto' }}>
              <span>Calculate diet</span>
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* ── APPOINTMENTS SCHEDULE ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Upcoming Appointments</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Confirmed veterinary visits and digital teleconsults</span>
          </div>
          <button className="apple-link-cta" onClick={() => openModal('booking')}>
            <Plus size={15} />
            <span>Book Visit</span>
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="apple-promo-card" style={{ padding: '36px', textAlign: 'center' }}>
            <Calendar size={32} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
            <strong style={{ fontSize: '16px' }}>No upcoming appointments</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>
              Schedule an in-clinic checkup or instant video teleconsultation with a verified specialist.
            </p>
            <button className="apple-btn-blue" onClick={() => openModal('booking')}>
              <span>Book Appointment</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map((apt) => (
              <div 
                key={apt.id} 
                className="apple-promo-card"
                style={{ padding: '16px 20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', gap: '14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '16px', fontWeight: 600 }}>{apt.doctor}</strong>
                      <span className="badge badge-blue">{apt.type || 'Clinic Visit'}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {apt.clinic} • {apt.date} at {apt.time}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {apt.type === 'Video Tele-Consult' && (
                    <button 
                      className="apple-btn-blue" 
                      style={{ padding: '6px 14px', fontSize: '12.5px' }}
                      onClick={() => openModal('teleconsult', { doctor: apt.doctor })}
                    >
                      Join Video Call
                    </button>
                  )}
                  <button 
                    className="icon-btn" 
                    onClick={() => removeAppointment(apt.id)}
                    title="Cancel Appointment"
                  >
                    <Trash2 size={15} color="#EF4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
