import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Star, 
  Video, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Check, 
  Stethoscope, 
  Building, 
  Phone, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Activity, 
  Flame, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Specialty Filter Categories fallback ─────────────────────────────────────
const STATIC_SPECIALTY_CATEGORIES = [
  { id: 'all',       label: 'All Specialties' },
  { id: 'ortho',     label: 'Orthopedics & Soft Tissue' },
  { id: 'internal',  label: 'Internal Medicine & Oncology' },
  { id: 'derma',     label: 'Dermatology & Allergies' },
  { id: 'nutrition', label: 'Clinical Nutrition & Metabolism' },
];

// ── Faculty Specialists Data Matching Reference ──────────────────────────────
const FACULTY_CLINICIANS = [
  {
    id: 'dr_sarah',
    name: 'Dr. Sarah Jenkins, MRCVS',
    degrees: 'MRCVS, BVM&S',
    role: 'Companion Internal Medicine & Feline Longevity Therapeutics',
    specialtyId: 'internal',
    rating: 4.98,
    reviewsCount: 184,
    availability: 'AVAILABLE IN 15M',
    availabilityType: 'normal',
    price: 650,
    unit: '/ 25 min',
    priceLabel: 'TELEHEALTH STANDARD',
    bio: '12 years of clinical research at Cambridge Veterinary School. Specialized in chronic renal management, complex endocrine disorders, and preventative metabolic...',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    badgeType: 'video',
    slots: [
      { id: 's1', time: '15:15 - 15:40' },
      { id: 's2', time: '16:00 - 16:25' },
      { id: 's3', time: '17:30 - 17:55' }
    ]
  },
  {
    id: 'dr_nazmul',
    name: 'Dr. Nazmul Hoda, DVM, MS',
    degrees: 'DVM, MS (Surg)',
    role: 'Orthopedics & Canine Cruciate Biomechanical Rehabilitation',
    specialtyId: 'ortho',
    rating: 4.99,
    reviewsCount: 312,
    availability: 'AVAILABLE TODAY 16:30',
    availabilityType: 'normal',
    price: 500,
    unit: '/ 25 min',
    priceLabel: 'TELEHEALTH STANDARD',
    bio: 'Certified canine sports rehabilitation specialist. Pioneering non-invasive biomechanical joint therapies, post-operative TPLO recoveries, and geriatric...',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
    badgeType: 'stethoscope',
    slots: [
      { id: 'n1', time: '15:00 - 15:25' },
      { id: 'n2', time: '16:30 - 16:55' },
      { id: 'n3', time: '18:15 - 18:40' }
    ]
  },
  {
    id: 'dr_ananya',
    name: 'Dr. Ananya Roy, DVM, Dip. ECVD',
    degrees: 'DVM, Dip. ECVD',
    role: 'Clinical Dermatology & Tropical Atopic Allergies',
    specialtyId: 'derma',
    rating: 4.96,
    reviewsCount: 97,
    availability: 'AVAILABLE TODAY 18:00',
    availabilityType: 'normal',
    price: 500,
    unit: '/ 25 min',
    priceLabel: 'TELEHEALTH STANDARD',
    bio: 'European Board diplomat specializing in canine refractory pruritus, feline eosinophilic granuloma complex, and cytology-guided immunotherapy for humid...',
    image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&auto=format&fit=crop&q=80',
    badgeType: 'stethoscope',
    slots: [
      { id: 'a1', time: '18:00 - 18:25' },
      { id: 'a2', time: '19:00 - 19:25' },
      { id: 'a3', time: '20:15 - 20:40' }
    ]
  },
  {
    id: 'dr_samira',
    name: 'Dr. Samira Khan, DVM',
    degrees: 'DVM (Emergency & ICU)',
    role: 'Emergency & Critical Care Intensivist',
    specialtyId: 'internal',
    rating: 5.0,
    reviewsCount: 420,
    availability: 'ON-CALL EMERGENCY NOW',
    availabilityType: 'emergency',
    price: 600,
    unit: '/ Priority Queue',
    priceLabel: 'URGENT TELECONSULT',
    bio: 'Senior veterinary triage intensivist. Immediate evaluation of acute respiratory distress, toxic ingestion protocols, traumatic shock triage, and bedside telemetry...',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
    badgeType: 'emergency',
    slots: [
      { id: 'e1', time: 'Instant Connect (0m wait)' },
      { id: 'e2', time: 'Priority Escalation' }
    ]
  }
];
// ── Helper: generate rolling 4-day date options from today ───────────────────
function getRollingDates() {
  const now = new Date();
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return {
      id: i === 0 ? 'today' : i === 1 ? 'tomorrow' : days[d.getDay()].toLowerCase() + i,
      day: i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : days[d.getDay()],
      date: `${months[d.getMonth()]} ${d.getDate()}`,
      isoDate: d.toISOString().split('T')[0]
    };
  });
}

export default function Specialists({ onNavigate }) {
  const { pets = [], openModal, showToast, addAppointment, vets = [], isVetsLoading, medicalRecords = [] } = useApp();
  const { currentUser } = useAuth();

  // Mode: 'telehealth' | 'clinic'
  const [consultMode, setConsultMode] = useState('telehealth');

  // Specialty category filter — derived dynamically from vets
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Dynamic specialty categories from vets collection
  const specialtyCategories = useMemo(() => {
    const dynamicSpecialties = [...new Set(
      vets.map(v => v.specialty || v.specialtyId).filter(Boolean)
    )];
    const base = [{ id: 'all', label: `All Specialties${vets.length ? ` (${vets.length})` : ''}` }];
    if (dynamicSpecialties.length > 0) {
      return [...base, ...dynamicSpecialties.map(s => ({ id: s, label: s }))];
    }
    return STATIC_SPECIALTY_CATEGORIES;
  }, [vets]);

  // Map vets from Firestore to card-compatible shape
  const mappedVets = useMemo(() => vets.map((v, idx) => ({
    id: v.id,
    name: v.name || 'Veterinary Specialist',
    degrees: v.qualification || v.degrees || 'DVM',
    role: v.tag || v.specialty || v.role || 'Veterinary Specialist',
    specialtyId: v.specialty || v.specialtyId || 'internal',
    rating: typeof v.rating === 'number' ? v.rating : 4.9,
    reviewsCount: v.reviewsCount || 0,
    availability: v.availability || 'AVAILABLE TODAY',
    availabilityType: (v.availability || '').toLowerCase().includes('emergency') ? 'emergency' : 'normal',
    price: typeof v.price === 'number' ? v.price : (parseInt(v.price) || 500),
    unit: '/ 25 min',
    priceLabel: 'TELEHEALTH STANDARD',
    bio: v.bio || v.description || 'Board-certified veterinary specialist with extensive clinical experience.',
    image: v.photo || v.image || '',
    badgeType: idx === 0 ? 'video' : (v.specialty || '').toLowerCase().includes('emergency') ? 'emergency' : 'stethoscope',
    slots: v.slots || [
      { id: `${v.id}_s1`, time: '10:00 - 10:25' },
      { id: `${v.id}_s2`, time: '14:00 - 14:25' },
      { id: `${v.id}_s3`, time: '16:30 - 16:55' },
    ]
  })), [vets]);

  // Rolling 4-day date options
  const rollingDates = useMemo(() => getRollingDates(), []);

  // Selected Clinician (default to first from Firestore or static)
  const [selectedClinicianId, setSelectedClinicianId] = useState('dr_nazmul');
  const activeClinician = mappedVets.find(c => c.id === selectedClinicianId) || mappedVets[0] || FACULTY_CLINICIANS[0];

  // Schedule Dates
  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedSlot, setSelectedSlot] = useState('16:30 - 16:55');

  // Companion Patient selection
  const [selectedCompanionId, setSelectedCompanionId] = useState(() => pets[0]?.id || pets[0]?.petID || '');
  const selectedCompanion = (pets || []).find(p => (p.id || p.petID) === selectedCompanionId) || pets[0];

  // AI Triage Scan Link — link to most recent triage record for selected pet
  const [linkAiScan, setLinkAiScan] = useState(true);
  const latestTriageScan = useMemo(() => {
    const petId = selectedCompanion?.id || selectedCompanion?.petID;
    return medicalRecords.find(r => r.petId === petId && (r.type === 'triage' || r.category === 'triage'));
  }, [medicalRecords, selectedCompanion]);

  // Symptoms description
  const [symptomNotes, setSymptomNotes] = useState('');

  // Booking process state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Clinicians
  const filteredClinicians = useMemo(() => {
    if (selectedSpecialty === 'all') return mappedVets.length > 0 ? mappedVets : FACULTY_CLINICIANS;
    return (mappedVets.length > 0 ? mappedVets : FACULTY_CLINICIANS).filter(c => c.specialtyId === selectedSpecialty || (c.role || '').toLowerCase().includes(selectedSpecialty));
  }, [mappedVets, selectedSpecialty]);

  // Handle Selection of Clinician
  const handleSelectClinician = (clinician) => {
    setSelectedClinicianId(clinician.id);
    if (clinician.slots && clinician.slots.length > 0) {
      setSelectedSlot(clinician.slots[0].time);
    }
    showToast(`Selected ${clinician.name} for Clinical Session`, 'info');
  };

  // Handle Final Booking Confirmation
  const handleConfirmConsultation = () => {
    if (!activeClinician) { showToast('Please select a clinician first', 'error'); return; }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const chosenDate = rollingDates.find(d => d.id === selectedDate);
      const newAppt = {
        id: `appt_${Date.now()}`,
        vetId: activeClinician.id,
        vetName: activeClinician.name,
        doctor: activeClinician.name,
        clinic: activeClinician.clinic || 'Pet Maya Clinical Center',
        petId: selectedCompanion?.id || selectedCompanion?.petID,
        petName: selectedCompanion?.name || 'Companion',
        date: selectedDate === 'today' ? new Date().toISOString().split('T')[0] : '2026-02-25',
        time: selectedSlot || '10:00 AM',
        type: consultMode === 'telehealth' ? 'Video Telehealth' : 'In-Clinic Physical',
        status: 'confirmed',
        fee: activeClinician.price,
        linkedTriageScan: linkAiScan ? latestTriageScan?.id : null,
        notes: symptomNotes || 'Routine clinical assessment.'
      };

      if (typeof addAppointment === 'function') {
        addAppointment(newAppt);
      }

      showToast(`Consultation Confirmed with ${activeClinician.name}! Encrypted room ready.`, 'success');
      if (typeof openModal === 'function') {
        openModal('bookingSuccess', { appointment: newAppt });
      }
    }, 600);
  };


  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF7F5',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, sans-serif)',
      paddingBottom: '80px'
    }}>

      {/* ── 1. HERO HEADER SECTION ── */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '36px 32px 28px 32px'
      }}>
        {/* Top Flex Row: Eyebrow + Mode Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Eyebrow Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#EDF5F3',
            border: '1px solid #C4DCD6',
            borderRadius: '9999px',
            padding: '4px 14px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9.5px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#346B73',
            textTransform: 'uppercase'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
            <span>LIVE CLINICAL REGISTRY</span>
          </div>

          {/* Mode Switcher: HD Video Teleconsultation vs In-Clinic Visit */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px',
            backgroundColor: '#EFEFEA',
            borderRadius: '9999px',
            border: '1px solid #DFE8E5',
            gap: '4px'
          }}>
            <button
              onClick={() => setConsultMode('telehealth')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                border: consultMode === 'telehealth' ? '1px solid #DFE8E5' : 'none',
                backgroundColor: consultMode === 'telehealth' ? '#FFFFFF' : 'transparent',
                color: consultMode === 'telehealth' ? '#160F0C' : '#707973',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: consultMode === 'telehealth' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Video size={14} color={consultMode === 'telehealth' ? '#346B73' : '#707973'} />
              <span>HD Video Teleconsultation</span>
            </button>

            <button
              onClick={() => setConsultMode('clinic')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                border: consultMode === 'clinic' ? '1px solid #DFE8E5' : 'none',
                backgroundColor: consultMode === 'clinic' ? '#FFFFFF' : 'transparent',
                color: consultMode === 'clinic' ? '#160F0C' : '#707973',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: consultMode === 'clinic' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Building size={14} color={consultMode === 'clinic' ? '#346B73' : '#707973'} />
              <span>In-Clinic Physical Visit</span>
            </button>
          </div>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
          fontSize: 'clamp(30px, 3.4vw, 42px)',
          fontWeight: 600,
          color: '#160F0C',
          letterSpacing: '-0.025em',
          lineHeight: 1.18,
          margin: '0 0 12px 0'
        }}>
          Consult board-certified clinicians without<br />
          friction.
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '14px',
          color: '#5C524E',
          lineHeight: 1.55,
          maxWidth: '680px',
          margin: '0 0 24px 0'
        }}>
          Choose between high-definition video teleconsultations or in-clinic physical appointments
          with direct electronic health record synchronization.
        </p>

        {/* Specialty Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {specialtyCategories.map(category => {
            const isSelected = selectedSpecialty === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedSpecialty(category.id)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  border: isSelected ? 'none' : '1px solid #EAE5E1',
                  backgroundColor: isSelected ? '#160F0C' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#5C524E',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 2. MAIN 2-COLUMN LAYOUT: CLINICIANS + CHECKOUT ── */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 32px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 390px',
          gap: '32px',
          alignItems: 'start'
        }} className="specialists-main-grid">

          {/* ══════════════════════════════════════════════════════════════
              LEFT COLUMN: FACULTY CLINICIANS DIRECTORY + ASSURANCE BANNER
             ══════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Loading skeleton when vets are loading */}
            {isVetsLoading && [1, 2, 3].map(i => (
              <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #EAE5E1', padding: '24px', height: '160px', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
            ))}

            {/* Empty state when no vets in DB */}
            {!isVetsLoading && filteredClinicians.length === 0 && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #EAE5E1', padding: '40px 24px', textAlign: 'center' }}>
                <Stethoscope size={32} color="#DFE8E5" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#160F0C', marginBottom: '6px' }}>No clinicians available</div>
                <div style={{ fontSize: '12px', color: '#8C827A' }}>Check back soon — our registry is being updated.</div>
              </div>
            )}

            {filteredClinicians.map((doctor) => {
              const isSelected = doctor.id === selectedClinicianId;
              const isEmergency = doctor.availabilityType === 'emergency';

              return (
                <div
                  key={doctor.id}
                  onClick={() => handleSelectClinician(doctor)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    border: isSelected ? '1.5px solid #346B73' : '1px solid #EAE5E1',
                    padding: '24px',
                    boxShadow: isSelected ? '0 4px 18px rgba(52, 107, 115, 0.08)' : '0 2px 10px rgba(22, 15, 12, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr',
                    gap: '22px',
                    alignItems: 'start'
                  }} className="doctor-card-grid">

                    {/* Avatar with Floating Badge */}
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #F5F1EE'
                        }}
                      />
                      {doctor.image ? (
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #F5F1EE'
                          }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        backgroundColor: '#EDF5F3',
                        border: '2px solid #C4DCD6',
                        display: doctor.image ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#346B73'
                      }}>
                        {(doctor.name || 'V').charAt(0)}
                      </div>
                      {/* Floating Badge Icon */}
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isEmergency ? '#DC2626' : '#346B73',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #FFFFFF',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        {doctor.badgeType === 'video' && <Video size={12} />}
                        {doctor.badgeType === 'stethoscope' && <Stethoscope size={12} />}
                        {doctor.badgeType === 'emergency' && <Flame size={12} />}
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                      {/* Top Meta: Availability Pill + Rating */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {/* Availability Tag */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: isEmergency ? '#FEF2F2' : '#EDF5F3',
                          border: isEmergency ? '1px solid #FCA5A5' : '1px solid #C4DCD6',
                          color: isEmergency ? '#DC2626' : '#0D9488',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase'
                        }}>
                          {isEmergency && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626' }} />}
                          <span>{doctor.availability}</span>
                        </div>

                        {/* Star Rating */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#160F0C'
                        }}>
                          <Star size={13} color="#F59E0B" fill="#F59E0B" />
                          <span>{doctor.rating.toFixed(2)}</span>
                          <span style={{ color: '#707973', fontWeight: 500, fontSize: '11px' }}>
                            ({doctor.reviewsCount} reviews)
                          </span>
                        </div>
                      </div>

                      {/* Doctor Name */}
                      <h3 style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        color: '#160F0C',
                        margin: '0 0 3px 0',
                        letterSpacing: '-0.01em'
                      }}>
                        {doctor.name}
                      </h3>

                      {/* Department / Specialty */}
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#5C524E',
                        marginBottom: '8px'
                      }}>
                        {doctor.role}
                      </div>

                      {/* Bio Snippet */}
                      <p style={{
                        fontSize: '11.5px',
                        color: '#707973',
                        lineHeight: 1.45,
                        margin: '0 0 16px 0'
                      }}>
                        {doctor.bio}
                      </p>

                      {/* Bottom Pricing & Action Button Row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid #F5F1EE',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        {/* Price Breakdown */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '8.5px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: '#707973',
                            textTransform: 'uppercase'
                          }}>
                            {doctor.priceLabel}
                          </span>
                          <span style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#160F0C',
                            letterSpacing: '-0.02em'
                          }}>
                            ৳{doctor.price}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#707973' }}>
                            {doctor.unit}
                          </span>
                        </div>

                        {/* CTA Select / Active Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectClinician(doctor);
                          }}
                          style={{
                            padding: '8px 22px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: isSelected ? '#346B73' : '#160F0C',
                            color: '#FFFFFF',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 2px 8px rgba(52, 107, 115, 0.25)' : 'none',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          {isSelected ? 'Clinician Active' : 'Select Clinician'}
                        </button>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}

            {/* ── PEER-REVIEWED FACULTY STANDARDS BOTTOM CARD ── */}
            <div style={{
              backgroundColor: '#F8F6F4',
              borderRadius: '24px',
              border: '1px solid #EAE5E1',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DFE8E5',
                  color: '#346B73',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C', marginBottom: '2px' }}>
                    Peer-Reviewed Faculty Standards
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#707973', lineHeight: 1.4 }}>
                    All clinicians hold active surgical licensure, peer credential verification, and automated EHR indemnity bonding.
                  </div>
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#346B73',
                textTransform: 'uppercase'
              }}>
                AAHA CERTIFIED
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════
              RIGHT COLUMN: STICKY TELEHEALTH CHECKOUT PANEL
             ══════════════════════════════════════════════════════════════ */}
          <div style={{
            position: 'sticky',
            top: '84px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #DFE8E5',
            padding: '24px',
            boxShadow: '0 2px 14px rgba(22, 15, 12, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>

            {/* Header: Title + Encrypted Badge */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#707973',
                  textTransform: 'uppercase'
                }}>
                  TELEHEALTH CHECKOUT
                </span>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#EDF5F3',
                  border: '1px solid #C4DCD6',
                  color: '#0D9488',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
                  <span>Encrypted Vitals</span>
                </span>
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: '20px',
                fontWeight: 600,
                color: '#160F0C',
                margin: 0
              }}>
                Reserve Clinical Session
              </h2>
            </div>

            {/* 3-Step Stepper Progress Bar */}
            <div>
              {/* Top Accent Line */}
              <div style={{
                height: '3px',
                backgroundColor: '#346B73',
                borderRadius: '9999px',
                marginBottom: '8px'
              }} />

              {/* Stepper Labels */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#160F0C',
                textTransform: 'uppercase'
              }}>
                <span>1. CLINICIAN</span>
                <span>2. SCHEDULE</span>
                <span>3. COMPANION</span>
              </div>
            </div>

            {/* STEP 01: ACTIVE FACULTY CARD */}
            <div>
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #C4DCD6',
                borderRadius: '18px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #A7D0C8',
                    color: '#346B73',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '8px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#707973',
                      textTransform: 'uppercase',
                      marginBottom: '1px'
                    }}>
                      STEP 01 • ACTIVE FACULTY
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C' }}>
                      {activeClinician.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#707973' }}>
                      {activeClinician.role.split('&')[0]}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  color: '#0D9488',
                  backgroundColor: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #C4DCD6',
                  whiteSpace: 'nowrap'
                }}>
                  {activeClinician.availability.replace('AVAILABLE ', '')}
                </span>
              </div>
            </div>

            {/* STEP 02: SELECT DATE & WINDOW */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}>
                STEP 02 • SELECT DATE &amp; WINDOW
              </div>

              {/* Date Capsule Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '6px',
                marginBottom: '10px'
              }}>
                {rollingDates.map(item => {
                  const isSelected = selectedDate === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDate(item.id)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '14px',
                        border: isSelected ? 'none' : '1px solid #EAE5E1',
                        backgroundColor: isSelected ? '#160F0C' : '#FAF7F5',
                        color: isSelected ? '#FFFFFF' : '#160F0C',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: isSelected ? '#D1D5DB' : '#707973'
                      }}>
                        {item.day}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>
                        {item.date}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Time Window Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '6px'
              }}>
                {(activeClinician.slots || [
                  { id: '1', time: '15:00 - 15:25' },
                  { id: '2', time: '16:30 - 16:55' },
                  { id: '3', time: '18:15 - 18:40' }
                ]).map(slot => {
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.time)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #346B73' : '1px solid #EAE5E1',
                        backgroundColor: isSelected ? '#EDF5F3' : '#FFFFFF',
                        color: isSelected ? '#346B73' : '#160F0C',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 03: PATIENT INTAKE & MEDICAL TRIAGE */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}>
                STEP 03 • PATIENT INTAKE &amp; MEDICAL TRIAGE
              </div>

              {/* Companion Patients Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: (pets || []).length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                gap: '10px',
                marginBottom: '12px'
              }}>
                {(pets || []).length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: '12px', color: '#8C827A' }}>
                    No companions registered. <button type="button" onClick={() => openModal ? openModal('addPet') : null} style={{ background: 'none', border: 'none', color: '#0D9488', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Add Companion</button>
                  </div>
                ) : (
                  (pets || []).map((p, idx) => {
                    const pId = p.id || p.petID || `pet-${idx}`;
                    const isSelected = selectedCompanionId === pId || (!selectedCompanionId && idx === 0);
                    return (
                      <div
                        key={pId}
                        onClick={() => setSelectedCompanionId(pId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '16px',
                          backgroundColor: isSelected ? '#EFEFEA' : '#FAF7F5',
                          border: isSelected ? '1px solid #DFE8E5' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img
                          src={p.photo || p.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#707973' }}>
                            {p.breed || p.species || 'Companion'}{p.age ? ` • ${p.age}${String(p.age).includes('yr') ? '' : ' yrs'}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Linked AI Triage Scan Integration Box */}
              <div
                onClick={() => setLinkAiScan(!linkAiScan)}
                style={{
                  backgroundColor: '#EDF5F3',
                  border: '1px solid #C4DCD6',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: '#346B73', flexShrink: 0 }}>
                    <Activity size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C' }}>
                      Link Maya AI Triage Scan #4092
                      {latestTriageScan
                        ? `Link Maya AI Triage Scan #${latestTriageScan.id?.slice(-4) || '—'}`
                        : 'No recent triage scan found'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#707973' }}>
                      Gait anomaly analysis • Timestamp 09:12 Today
                      {latestTriageScan
                        ? `${latestTriageScan.diagnosis || latestTriageScan.type || 'Clinical assessment'} • ${latestTriageScan.date || 'Recent'}`
                        : 'Complete a triage session to link it here'}
                    </div>
                  </div>
                </div>

                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  backgroundColor: linkAiScan ? '#346B73' : '#FFFFFF',
                  border: linkAiScan ? 'none' : '1px solid #C4DCD6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  {linkAiScan && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              {/* Chief Complaint / Symptoms Input */}
              <div>
                <textarea
                  rows={2}
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  placeholder="Briefly describe symptoms (e.g. slight right-hind limp after running, no vocal distress)..."
                  style={{
                    width: '100%',
                    backgroundColor: '#FAF7F5',
                    border: '1px solid #EAE5E1',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    fontSize: '11.5px',
                    color: '#160F0C',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.45
                  }}
                />
              </div>
            </div>

            {/* Price Breakdown Section */}
            <div style={{
              paddingTop: '12px',
              borderTop: '1px solid #F5F1EE',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#5C524E' }}>
                <span>Clinician Video Teleconsultation</span>
                <span style={{ fontWeight: 600, color: '#160F0C' }}>৳{activeClinician.price}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#5C524E' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Digital Prescription Protocol</span>
                  <CheckCircle2 size={12} color="#0D9488" />
                </span>
                <span style={{ fontWeight: 600, color: '#0D9488' }}>৳0</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#5C524E' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Maya Health Vault Cloud Sync</span>
                  <Lock size={11} color="#0D9488" />
                </span>
                <span style={{ fontWeight: 600, color: '#0D9488' }}>৳0</span>
              </div>

              {/* Total Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingTop: '8px',
                borderTop: '1px solid #EAE5E1',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                  Total Medical Honorarium
                </span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#346B73', letterSpacing: '-0.02em' }}>
                  ৳{activeClinician.price}
                </span>
              </div>
            </div>

            {/* Action Button: Confirm & Secure Consultation */}
            <button
              onClick={handleConfirmConsultation}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '9999px',
                backgroundColor: '#160F0C',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 10px rgba(22, 15, 12, 0.15)',
                transition: 'all 0.18s ease'
              }}
            >
              <Video size={16} />
              <span>{isSubmitting ? 'Securing Encrypted Room...' : `Confirm & Secure Consultation (৳${activeClinician.price})`}</span>
            </button>

            {/* Continuity Guarantee Footer Note */}
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#707973',
              textTransform: 'uppercase'
            }}>
              PROTECTED BY PET MAYA 100% CLINICAL CONTINUITY GUARANTEE
            </div>

          </div>

        </div>
      </section>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        @media (max-width: 1080px) {
          .specialists-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .doctor-card-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .doctor-card-grid > div:first-child {
            margin: 0 auto;
          }
        }
      `}</style>

    </div>
  );
}
