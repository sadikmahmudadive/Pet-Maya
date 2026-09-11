import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, Calendar, Clock, Video, CheckCircle2, AlertCircle, 
  Trash2, Plus, MapPin, User, Stethoscope, ChevronRight 
} from 'lucide-react';

export default function MyAppointmentsModal() {
  const { 
    closeModal, 
    openModal, 
    appointments = [], 
    removeAppointment, 
    completeAppointment,
    pets = []
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('upcoming'); // 'upcoming', 'completed', 'all'

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter(apt => {
    const isPast = apt.isCompleted || (apt.date && apt.date < todayStr);
    if (activeFilter === 'upcoming') return !isPast;
    if (activeFilter === 'completed') return isPast;
    return true;
  });

  const upcomingCount = appointments.filter(a => !a.isCompleted && !(a.date && a.date < todayStr)).length;
  const completedCount = appointments.filter(a => a.isCompleted || (a.date && a.date < todayStr)).length;

  const getModeBadge = (mode = '') => {
    const m = mode.toLowerCase();
    if (m.includes('video') || m.includes('tele')) {
      return { label: 'Video Teleconsult', icon: Video, color: 'var(--primary)', bg: 'rgba(26,182,128,0.1)' };
    }
    if (m.includes('home')) {
      return { label: 'Home Visit', icon: MapPin, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    }
    return { label: 'In-Clinic Visit', icon: Stethoscope, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Scheduled Soon';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '640px', width: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                background: 'rgba(26,182,128,0.12)', 
                color: 'var(--primary)', 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px' 
              }}>
                Care Management
              </span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              My Appointments
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              View and manage veterinary checkups, teleconsults, and follow-ups.
            </p>
          </div>
          <button className="icon-btn" onClick={closeModal} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveFilter('upcoming')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === 'upcoming' ? 'var(--primary)' : 'var(--surface-alt)',
              color: activeFilter === 'upcoming' ? '#fff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>Upcoming</span>
            <span style={{
              background: activeFilter === 'upcoming' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {upcomingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === 'completed' ? 'var(--primary)' : 'var(--surface-alt)',
              color: activeFilter === 'completed' ? '#fff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>Completed</span>
            <span style={{
              background: activeFilter === 'completed' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === 'all' ? 'var(--primary)' : 'var(--surface-alt)',
              color: activeFilter === 'all' ? '#fff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>All History</span>
            <span style={{
              background: activeFilter === 'all' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {appointments.length}
            </span>
          </button>
        </div>

        {/* Scrollable Appointment List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredAppointments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 20px', 
              background: 'var(--surface-alt)', 
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)'
            }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'rgba(26,182,128,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'var(--primary)'
              }}>
                <Calendar size={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                {activeFilter === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments Found'}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto 18px' }}>
                {activeFilter === 'upcoming' 
                  ? 'Schedule clinical checkups, vaccination boosters, or instant teleconsultations with certified veterinarians.'
                  : 'Your past completed consultation notes, digital prescriptions, and receipts will appear here.'}
              </p>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ padding: '9px 18px', fontSize: '13px', margin: '0 auto' }}
                onClick={() => {
                  closeModal();
                  openModal('booking');
                }}
              >
                <Plus size={15} />
                <span>Book Appointment Now</span>
              </button>
            </div>
          ) : (
            filteredAppointments.map(apt => {
              const modeInfo = getModeBadge(apt.mode);
              const ModeIcon = modeInfo.icon;
              const isToday = apt.date === todayStr;

              return (
                <div 
                  key={apt.id} 
                  style={{
                    background: 'var(--surface)',
                    border: isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {/* Top row: Mode badge and Status pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: modeInfo.bg,
                      color: modeInfo.color,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase'
                    }}>
                      <ModeIcon size={12} />
                      <span>{modeInfo.label}</span>
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isToday && !apt.isCompleted && (
                        <span style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: '#EF4444',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 900,
                          letterSpacing: '0.5px'
                        }}>
                          TODAY
                        </span>
                      )}
                      <span style={{
                        background: apt.isCompleted 
                          ? 'rgba(16,185,129,0.1)' 
                          : 'rgba(59,130,246,0.1)',
                        color: apt.isCompleted ? '#10B981' : '#3B82F6',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {apt.isCompleted ? 'Completed' : 'Confirmed'}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {apt.title || 'Veterinary Appointment'}
                  </h4>

                  {/* Doctor & Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Stethoscope size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{apt.doctor || 'Dr. Specialist'}</span>
                    <span>•</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.clinic || 'Pet Maya Health Center'}
                    </span>
                  </div>

                  {/* Date & Time Row */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '9px 12px', 
                    background: 'var(--surface-alt)', 
                    borderRadius: '8px', 
                    fontSize: '12px',
                    margin: '10px 0' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 700 }}>
                      <Calendar size={13} style={{ color: 'var(--primary)' }} />
                      <span>{formatDate(apt.date)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Clock size={13} style={{ color: '#F59E0B' }} />
                      <span>{apt.time || (apt.fromTime ? `${apt.fromTime} - ${apt.toTime}` : 'Morning Slot')}</span>
                    </div>
                    {apt.petName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Pet:</span>
                        <strong style={{ color: 'var(--primary)' }}>🐾 {apt.petName}</strong>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(apt.mode?.toLowerCase().includes('tele') || apt.mode?.toLowerCase().includes('video')) && !apt.isCompleted && (
                        <button 
                          type="button" 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            closeModal();
                            openModal('teleconsult', { appointment: apt });
                          }}
                        >
                          <Video size={13} />
                          <span>Join Video Room</span>
                        </button>
                      )}

                      {!apt.isCompleted && (
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => completeAppointment(apt.id)}
                          title="Mark this session completed"
                        >
                          <CheckCircle2 size={13} style={{ color: 'var(--primary)' }} />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => removeAppointment(apt.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Cancel / Remove Appointment"
                    >
                      <Trash2 size={13} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Quick Add */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Need immediate care? 24/7 emergency consults available.
          </span>
          <button 
            type="button" 
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '13px' }}
            onClick={() => {
              closeModal();
              openModal('booking');
            }}
          >
            <Plus size={14} />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
}

