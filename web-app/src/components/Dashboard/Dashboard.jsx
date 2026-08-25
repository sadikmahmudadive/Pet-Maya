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
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { pets, appointments, removeAppointment, setActiveTab, openModal } = useApp();
  const { currentUser } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── WELCOME BANNER ── */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #047857 50%, #065f46 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '28px 32px'
        }}
      >
        <div>
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>
            Pet Parent Dashboard
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.6px', marginTop: '4px' }}>
            Welcome back, {currentUser ? currentUser.name.split(' ')[0] : 'Pet Parent'}! 🐾
          </h1>
          <p style={{ fontSize: '14.5px', opacity: 0.9, marginTop: '4px' }}>
            {pets.length} pet {pets.length === 1 ? 'profile' : 'profiles'} active & synchronized across web and mobile.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div 
            style={{ 
              background: 'rgba(255, 255, 255, 0.18)', 
              backdropFilter: 'blur(12px)',
              padding: '14px 20px', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}
          >
            <Award size={26} color="#fbbf24" />
            <div>
              <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1.1 }}>{currentUser?.points ?? 45} pts</strong>
              <span style={{ fontSize: '11px', opacity: 0.85 }}>Reward Points</span>
            </div>
          </div>

          <button 
            className="btn-primary" 
            style={{ background: '#ffffff', color: '#065f46' }}
            onClick={() => openModal('addPet')}
          >
            <Plus size={16} />
            <span>Add Pet</span>
          </button>
        </div>
      </div>

      {/* ── MY PETS SECTION ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>My Pet Family</h3>
          <button className="btn-ghost" onClick={() => openModal('addPet')}>
            <Plus size={14} />
            <span>Register Pet</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {pets.map((pet) => (
            <div key={pet.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img 
                  src={pet.photo || 'assets/images/Pet_1.jpg'} 
                  alt={pet.name} 
                  style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} 
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '17px', fontWeight: 800 }}>{pet.name}</strong>
                    <span className="badge badge-green" style={{ fontSize: '10px' }}>{pet.species}</span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{pet.breed}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: 'var(--radius-xs)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Age:</span> <strong>{pet.age}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Weight:</span> <strong>{pet.weight}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong>{pet.gender}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Microchip:</span> <strong>{pet.microchip}</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button 
                  className="btn-ghost" 
                  style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  onClick={() => setActiveTab('tracker')}
                >
                  Track GPS 🛰️
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  onClick={() => setActiveTab('vaccines')}
                >
                  EHR Passport 📋
                </button>
              </div>
            </div>
          ))}

          <div 
            className="glass-card" 
            style={{ 
              border: '2px dashed var(--border)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '30px', 
              cursor: 'pointer',
              background: 'transparent'
            }}
            onClick={() => openModal('addPet')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <Plus size={22} />
            </div>
            <strong style={{ fontSize: '15px' }}>Add Another Pet</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dog, Cat, Bird or Rabbit</span>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '14px' }}>
          Smart Pet Hub
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div 
            className="glass-card" 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
            onClick={() => setActiveTab('tracker')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radar size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', display: 'block' }}>Live GPS Radar</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sonar &amp; Safe-Zone Geofence</span>
            </div>
          </div>

          <div 
            className="glass-card" 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
            onClick={() => setActiveTab('ai')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', display: 'block' }}>AI Health Triage</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vision Scanner &amp; First Aid</span>
            </div>
          </div>

          <div 
            className="glass-card" 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
            onClick={() => setActiveTab('food')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', display: 'block' }}>Nutrition &amp; Food</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Calorie &amp; Breed Guide</span>
            </div>
          </div>

          <div 
            className="glass-card" 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
            onClick={() => setActiveTab('vets')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', display: 'block' }}>Book Specialist</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Clinics &amp; Tele-Health</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── UPCOMING APPOINTMENTS ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            Upcoming Appointments &amp; Reminders
          </h3>
          <button className="btn-ghost" onClick={() => openModal('booking')}>
            <Calendar size={14} />
            <span>Book Visit</span>
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
            No upcoming events scheduled. Click "Book Visit" to schedule one!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.map((apt) => (
              <div 
                key={apt.id} 
                className="glass-card" 
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '15.5px', display: 'block' }}>{apt.title}</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Patient: <strong>{apt.petName}</strong> • {apt.date} at {apt.time} ({apt.mode})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-green">{apt.status}</span>
                  {apt.mode?.includes('Tele') && (
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => openModal('teleconsult', { doctor: apt.doctor, petName: apt.petName })}
                    >
                      Join Video Room 📹
                    </button>
                  )}
                  <button 
                    className="icon-btn" 
                    style={{ width: 34, height: 34, color: 'var(--danger)' }}
                    onClick={() => removeAppointment(apt.id)}
                    title="Cancel"
                  >
                    <Trash2 size={16} />
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
