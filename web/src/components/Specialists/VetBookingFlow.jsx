import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  Star, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  User,
  Heart,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function VetBookingFlow({ initialVet, onComplete, onCancel }) {
  const { vets, pets, addAppointment, showToast, setActiveTab } = useApp();
  const { currentUser } = useAuth();

  // 3-Step Horizontal Progress: 1 = Choose Vet, 2 = Date & Time, 3 = Confirm
  const [currentStep, setCurrentStep] = useState(initialVet ? 2 : 1);

  // Step 1 State: Choose Vet
  const [selectedVet, setSelectedVet] = useState(initialVet || vets[0] || {
    id: 'v1',
    name: 'Dr. Sarah Jenkins',
    qualification: 'DVM, MRCVS • Small Animal Surgery',
    id: '',
    name: 'Veterinary Specialist',
    qualification: 'DVM',
    rating: 4.9,
    reviewsCount: 68,
    reviewsCount: 0,
    price: '৳500 / session',
    clinic: 'Greenwood Animal Hospital',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'
    clinic: 'Pet Maya Clinical Center',
    photo: ''
  });
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [consultationMode, setConsultationMode] = useState('In-Clinic Consultation');

  // Step 2 State: Date & Time & Pet
  const [selectedPet, setSelectedPet] = useState(pets[0]?.name || 'Companion');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [reason, setReason] = useState('Annual wellness checkup and preventative consultation');

  // Step 3: Confirmation complete state
  const [isBooked, setIsBooked] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // 7-day upcoming date options
  const upcomingDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  const morningSlots = ['09:30 AM', '10:30 AM', '11:45 AM'];
  const afternoonSlots = ['02:30 PM', '04:15 PM', '06:00 PM'];
  const morningSlots = selectedVet?.morningSlots || ['09:30 AM', '10:30 AM', '11:45 AM'];
  const afternoonSlots = selectedVet?.afternoonSlots || ['02:30 PM', '04:15 PM', '06:00 PM'];

  // Specialties
  // Dynamic Specialties from vets
  const specialties = [
    { id: 'all', label: 'All Specialties' },
    { id: 'surgery', label: 'Surgery' },
    { id: 'dermatology', label: 'Dermatology' },
    { id: 'cardiology', label: 'Cardiology' },
    { id: 'nutrition', label: 'Nutrition' }
    ...Array.from(new Set((vets || []).map(v => v.specialty || v.tag).filter(Boolean))).map(s => ({ id: s.toLowerCase(), label: s }))
  ];

  const filteredVets = (vets && vets.length > 0) ? vets.filter(v => {
    if (selectedSpecialty === 'all') return true;
    return (v.qualification || '').toLowerCase().includes(selectedSpecialty) ||
           (v.specialty || '').toLowerCase().includes(selectedSpecialty) ||
           (v.tag || '').toLowerCase().includes(selectedSpecialty) ||
           (v.bio || '').toLowerCase().includes(selectedSpecialty);
  }) : [selectedVet];

  const handleConfirmAppointment = () => {
    const newId = 'PM-APT-' + Math.floor(100000 + Math.random() * 900000);
    const newId = `appt_${Date.now()}`;
    setBookingId(newId);

    addAppointment({
      id: newId,
      title: `${consultationMode.includes('Video') ? 'Video Tele-Consult' : 'Clinical Visit'} with ${selectedVet.name}`,
      doctor: selectedVet.name,
      doctorPhoto: selectedVet.photo,
      clinic: selectedVet.clinic,
      clinic: selectedVet.clinic || 'Pet Maya Health Center',
      petName: selectedPet,
      date: selectedDate,
      time: selectedTime,
      mode: consultationMode,
      fee: selectedVet.price || '৳500',
      reason
    });

    setIsBooked(true);
    showToast('Care appointment confirmed successfully!', 'success');
  };

  // Success Confirmation Screen
  if (isBooked) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          padding: 'clamp(32px, 5vw, 48px)',
          textAlign: 'center',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(46, 204, 155, 0.15)',
            color: '#158763',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <div className="mint-badge" style={{ marginBottom: '12px' }}>
            Confirmed • Appointment #{bookingId}
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Your consultation is scheduled.
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 28px 0' }}>
            A confirmation with prep instructions and calendar invite has been sent to your registered email.
          </p>

          {/* Details Card */}
          <div style={{
            backgroundColor: 'var(--surface-alt)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border)',
            textAlign: 'left',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Veterinary Specialist:</span>
              <strong style={{ color: 'var(--foreground)' }}>{selectedVet.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Consultation Mode:</span>
              <strong style={{ color: 'var(--foreground)' }}>{consultationMode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date &amp; Time:</span>
              <strong style={{ color: 'var(--foreground)' }}>{selectedDate} at {selectedTime}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Patient Pet:</span>
              <strong style={{ color: 'var(--foreground)' }}>{selectedPet}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Fee:</span>
              <strong style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)', fontSize: '16px' }}>{selectedVet.price || '৳500'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (onComplete) onComplete();
                else setActiveTab('dashboard');
              }}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '14.5px',
                padding: '12px 28px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setIsBooked(false);
                setCurrentStep(1);
              }}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                fontWeight: 500,
                fontSize: '14.5px',
                padding: '12px 24px',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                cursor: 'pointer'
              }}
            >
              Book Another Visit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)', minHeight: '100vh', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="mint-badge" style={{ marginBottom: '10px' }}>
            Veterinary Appointment Booking
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 10px 0' }}>
            Schedule Clinical Care
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            Connect with certified veterinary doctors for in-clinic evaluations and video teleconsultations.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            3-STEP HORIZONTAL PROGRESS BAR
            Step 1: Choose Vet ➔ Step 2: Time ➔ Step 3: Confirm
            ═══════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '36px',
          backgroundColor: 'var(--surface)',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          {[
            { step: 1, label: 'Choose Vet', sub: 'Specialist' },
            { step: 2, label: 'Date & Time', sub: 'Select slot' },
            { step: 3, label: 'Confirm', sub: 'Review & book' }
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <div
                key={item.step}
                onClick={() => {
                  if (isCompleted) setCurrentStep(item.step);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(46, 204, 155, 0.10)' : 'transparent',
                  cursor: isCompleted ? 'pointer' : 'default',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#2ECC9B' : isActive ? 'var(--primary)' : 'var(--surface-alt)',
                  color: (isCompleted || isActive) ? '#1F2421' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {isCompleted ? <Check size={14} /> : item.step}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: (isActive || isCompleted) ? 700 : 500, color: 'var(--foreground)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            STEP 1: CHOOSE SPECIALIST
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div>
            {/* Consultation Mode Switcher */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <button
                type="button"
                onClick={() => setConsultationMode('In-Clinic Consultation')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: consultationMode.includes('Clinic') ? '2px solid #2ECC9B' : '1px solid var(--border)',
                  backgroundColor: consultationMode.includes('Clinic') ? 'rgba(46, 204, 155, 0.08)' : 'var(--surface)',
                  color: consultationMode.includes('Clinic') ? '#158763' : 'var(--foreground)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Building2 size={18} />
                <span>In-Clinic Visit</span>
              </button>

              <button
                type="button"
                onClick={() => setConsultationMode('HD Video Teleconsult')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: consultationMode.includes('Video') ? '2px solid #2ECC9B' : '1px solid var(--border)',
                  backgroundColor: consultationMode.includes('Video') ? 'rgba(46, 204, 155, 0.08)' : 'var(--surface)',
                  color: consultationMode.includes('Video') ? '#158763' : 'var(--foreground)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Video size={18} />
                <span>HD Video Teleconsult</span>
              </button>
            </div>

            {/* Specialty Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
              {specialties.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpecialty(spec.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: selectedSpecialty === spec.id ? '1.5px solid #2ECC9B' : '1px solid var(--border)',
                    backgroundColor: selectedSpecialty === spec.id ? 'rgba(46, 204, 155, 0.10)' : 'var(--surface)',
                    color: selectedSpecialty === spec.id ? '#158763' : 'var(--foreground)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {spec.label}
                </button>
              ))}
            </div>

            {/* Veterinarians List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {filteredVets.map((v) => {
                const isSelected = selectedVet?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVet(v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      padding: '20px',
                      borderRadius: '18px',
                      backgroundColor: 'var(--surface)',
                      border: isSelected ? '2px solid #2ECC9B' : '1px solid var(--border)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 6px 20px rgba(46, 204, 155, 0.12)' : 'var(--shadow-xs)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img
                      src={v.photo || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80'}
                      alt={v.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--border)',
                        flexShrink: 0
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                          {v.name}
                        </h3>
                        <ShieldCheck size={16} color="#2ECC9B" />
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 6px' }}>
                        {v.qualification}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 600 }}>
                          <Star size={13} fill="#F59E0B" /> {v.rating}
                        </span>
                        <span>•</span>
                        <span>{v.clinic}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                        {v.price || '৳500'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>per session</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 1 Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>Continue to Date &amp; Time</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2: DATE, TIME & PET SELECTION
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div>
            {/* Selected Vet Summary Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface)',
              padding: '14px 20px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              marginBottom: '28px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={selectedVet.photo || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'}
                  alt={selectedVet.name}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {selectedVet.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {consultationMode} • {selectedVet.price || '৳500'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#158763',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Change Specialist
              </button>
            </div>

            {/* Patient Pet Selector */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px' }}>
                Select Patient Pet
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {pets && pets.length > 0 ? (
                  pets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPet(p.name)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: selectedPet === p.name ? '2px solid #2ECC9B' : '1px solid var(--border)',
                        backgroundColor: selectedPet === p.name ? 'rgba(46, 204, 155, 0.09)' : 'var(--surface)',
                        color: selectedPet === p.name ? '#158763' : 'var(--foreground)',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        cursor: 'pointer'
                      }}
                    >
                      🐾 {p.name} ({p.breed || 'Dog'})
                    </button>
                  ))
                ) : (
                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    No companion registered yet. Consultation will be scheduled for your companion patient.
                  </div>
                )}
              </div>
            </div>

            {/* 7-Day Calendar Strip */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px' }}>
                Choose Appointment Date
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
                {upcomingDays.map((day) => {
                  const isSelected = selectedDate === day.iso;
                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setSelectedDate(day.iso)}
                      style={{
                        padding: '14px 8px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #2ECC9B' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'rgba(46, 204, 155, 0.12)' : 'var(--surface)',
                        color: isSelected ? '#158763' : 'var(--foreground)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '11.5px', color: isSelected ? '#158763' : 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {day.dayName}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        {day.dayNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {day.month}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px' }}>
                Available Time Slots
              </label>
              
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Morning</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {morningSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      border: selectedTime === slot ? '2px solid #2ECC9B' : '1px solid var(--border)',
                      backgroundColor: selectedTime === slot ? 'rgba(46, 204, 155, 0.12)' : 'var(--surface)',
                      color: selectedTime === slot ? '#158763' : 'var(--foreground)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Afternoon / Evening</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {afternoonSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      border: selectedTime === slot ? '2px solid #2ECC9B' : '1px solid var(--border)',
                      backgroundColor: selectedTime === slot ? 'rgba(46, 204, 155, 0.12)' : 'var(--surface)',
                      color: selectedTime === slot ? '#158763' : 'var(--foreground)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Consultation Notes */}
            <div style={{ marginBottom: '36px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
                Reason for Consultation / Symptoms
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe any symptoms, recent diet changes, or specific questions for the doctor..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>Review &amp; Confirm</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 3: CONFIRM & BOOK
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div>
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: 'clamp(24px, 4vw, 36px)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.04)',
              marginBottom: '32px'
            }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 20px 0' }}>
                Consultation Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Specialist:</span>
                  <strong style={{ color: 'var(--foreground)' }}>{selectedVet.name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Clinic Affiliation:</span>
                  <span style={{ color: 'var(--foreground)' }}>{selectedVet.clinic}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Consultation Mode:</span>
                  <span className="mint-badge">{consultationMode}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Scheduled Date &amp; Time:</span>
                  <strong style={{ color: 'var(--foreground)' }}>{selectedDate} at {selectedTime}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Patient:</span>
                  <strong style={{ color: 'var(--foreground)' }}>{selectedPet}</strong>
                </div>

                {reason && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Clinical Symptoms / Notes:</span>
                    <div style={{ backgroundColor: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>
                      {reason}
                    </div>
                  </div>
                )}

                {/* Transparent Fee Breakdown */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Veterinary Fee:</span>
                    <span>{selectedVet.price || '৳500'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Platform Booking Fee:</span>
                    <span style={{ color: '#2ECC9B', fontWeight: 600 }}>৳0 (Free)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }}>
                    <span>Total Due at Visit:</span>
                    <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)' }}>
                      {selectedVet.price || '৳500'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: 'var(--surface-alt)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                ℹ️ <strong>Cancellation Policy:</strong> Free rescheduling or cancellation up to 4 hours before your scheduled appointment time.
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAppointment}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 600,
                  padding: '14px 32px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(46, 204, 155, 0.25)'
                }}
              >
                <Check size={18} />
                <span>Confirm Appointment</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

