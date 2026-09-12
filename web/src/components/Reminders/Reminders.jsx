import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Calendar, 
  Download, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  Syringe, 
  FileText, 
  Clock, 
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleReveal } from '../Animations/AppleReveal';

const SCHEDULES = {
  dog: [
    { milestone: 'Core Vaccine #1', care: 'DHPP / DAPP (Distemper, Parvo)', freq: 'Every 3-4 Weeks (Puppy Series)', status: 'Essential' },
    { milestone: 'Core Vaccine #2', care: 'Rabies (1-Year or 3-Year)', freq: 'At 16 Weeks & Annual Booster', status: 'Mandatory' },
    { milestone: 'Parasite Prevention', care: 'Heartworm + Flea & Tick (Simparica/NexGard)', freq: 'Monthly Oral Chew', status: 'Active' },
    { milestone: 'Deworming Protocol', care: 'Broad-Spectrum Deworming (Pyrantel/Praziquantel)', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled' },
    { milestone: 'Annual Wellness', care: 'Complete Blood Count & Dental Scaling', freq: 'Every 12 Months', status: 'Recommended' }
  ],
  cat: [
    { milestone: 'Core Vaccine #1', care: 'FVRCP (Feline Viral Rhinotracheitis, Calici, Panleukopenia)', freq: 'Every 3-4 Weeks (Kitten Series)', status: 'Essential' },
    { milestone: 'Core Vaccine #2', care: 'Rabies & FeLV (Feline Leukemia)', freq: 'At 12-16 Weeks & Annual Booster', status: 'Mandatory' },
    { milestone: 'Parasite Prevention', care: 'Topical Flea, Tick & Ear Mite (Revolution Plus)', freq: 'Monthly Topical Dose', status: 'Active' },
    { milestone: 'Deworming Protocol', care: 'Intestinal Deworming Treatment', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled' },
    { milestone: 'Wellness Exam', care: 'Kidney Health Screening & Dental Check', freq: 'Every 12 Months', status: 'Recommended' }
  ]
};

export default function Reminders() {
  const { 
    pets = [], 
    medicalRecords = [], 
    appointments = [], 
    removeAppointment, 
    openModal, 
    showToast,
    addMedicalRecord
  } = useApp();

  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || pets[0]?.petID || 'default_pet');

  const selectedPet = pets.find(p => p.id === selectedPetId || p.petID === selectedPetId) || pets[0] || {
    name: 'Miko',
    breed: 'Domestic Shorthair',
    healthIndex: 100,
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80'
  };

  const petSpecies = (selectedPet.breed || selectedPet.species || '').toLowerCase().includes('dog') ? 'dog' : 'cat';
  const list = SCHEDULES[petSpecies] || SCHEDULES.cat;

  // Filter records for selected pet
  const petRecords = medicalRecords.filter(r => 
    !r.petName || r.petName.toLowerCase() === selectedPet.name.toLowerCase()
  );

  const healthScore = selectedPet.healthIndex ?? 100;
  const isProtected = healthScore >= 80;

  const downloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pet Maya//Vaccine Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:Pet Maya: ${selectedPet.name} Vaccine & Wellness Due
DESCRIPTION:Scheduled veterinary reminder from Pet Maya platform for ${selectedPet.name}. Checkup, booster, and parasite preventative due date.
STATUS:CONFIRMED
RRULE:FREQ=MONTHLY;INTERVAL=1
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Pet_Maya_${selectedPet.name}_Vaccine_Schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Vaccine schedule (.ics) for ${selectedPet.name} exported!`, 'success');
  };

  const handleQuickLogVaccine = () => {
    addMedicalRecord({
      petName: selectedPet.name,
      serviceType: 'Vaccination',
      diagnosis: 'Routine Rabies & DHPP/FVRCP Booster',
      prescription: 'Annual immunization verified and updated.',
      cost: 45,
      date: new Date().toISOString().split('T')[0],
      nextBooster: '1 Year'
    });
    showToast(`Vaccine logged! ${selectedPet.name}'s profile updated to Fully Protected ✅`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {/* ── HEADER & ACTIONS ── */}
      <AppleReveal duration={0.6} yOffset={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              CLINICAL MEDICAL VAULT
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
              Immunization &amp; Vaccines
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
              Synchronized vaccine passports, WHO-aligned boosters, and automated alarms.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => openModal('petPassport', { pet: selectedPet })}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '14px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileText size={15} />
              <span>Digital Passport</span>
            </button>

            <button 
              onClick={downloadICS}
              style={{
                background: 'var(--surface-alt)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={15} />
              <span>Export .ics</span>
            </button>
          </div>
        </div>
      </AppleReveal>

      {/* ── PET SELECTOR PILLS ── */}
      {pets.length > 0 && (
        <AppleReveal delay={0.05} yOffset={12}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {pets.map((p) => {
              const isSelected = selectedPet.id === p.id || selectedPet.petID === p.petID;
              return (
                <button
                  key={p.id || p.petID}
                  onClick={() => setSelectedPetId(p.id || p.petID)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 16px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #10B981' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface)',
                    color: isSelected ? '#10B981' : 'var(--text-main)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img 
                    src={p.photo || p.photoUrl || 'assets/images/Pet_1.jpg'} 
                    alt={p.name} 
                    style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </AppleReveal>
      )}

      {/* ── BENTO HERO: COMPLIANCE GAUGE (Matching Flutter App) ── */}
      <AppleReveal delay={0.1} yOffset={16}>
        <div 
          style={{
            background: 'var(--surface-alt)',
            borderRadius: '24px',
            padding: '24px 26px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}
        >
          {/* Circular Progress Indicator */}
          <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={88} height={88} viewBox="0 0 88 88" style={{ position: 'absolute', inset: 0 }}>
              <circle
                cx={44}
                cy={44}
                r={38}
                fill="none"
                stroke="rgba(16, 185, 129, 0.15)"
                strokeWidth={8}
              />
              <circle
                cx={44}
                cy={44}
                r={38}
                fill="none"
                stroke={isProtected ? '#10B981' : '#F59E0B'}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - (healthScore / 100))}
                transform="rotate(-90 44 44)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', display: 'block', lineHeight: 1 }}>
                {healthScore}%
              </span>
              <span style={{ fontSize: '8.5px', fontWeight: 900, color: isProtected ? '#10B981' : '#F59E0B', letterSpacing: '0.5px' }}>
                {isProtected ? 'PROTECTED' : 'ATTENTION'}
              </span>
            </div>
          </div>

          {/* Compliance Profile Info */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: isProtected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isProtected ? '#10B981' : '#D97706',
                fontSize: '10.5px',
                fontWeight: 900,
                padding: '3px 9px',
                borderRadius: '8px',
                letterSpacing: '0.4px'
              }}>
                {isProtected ? 'FULLY PROTECTED' : 'BOOSTER ADVISORY'}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
              {selectedPet.name} Immunization Profile
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
              {isProtected 
                ? `Core vaccinations and rabies immunity are active and compliant with Pet Maya digital standards.`
                : `Booster due date pending. Schedule appointment to restore full immunization coverage.`}
            </p>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={handleQuickLogVaccine}
            style={{
              background: '#10B981',
              color: '#FFF',
              border: 'none',
              borderRadius: '16px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Plus size={15} />
            <span>Log Vaccine</span>
          </button>
        </div>
      </AppleReveal>

      {/* ── ADMINISTERED VACCINES & CLINICAL LOGS ── */}
      <AppleReveal delay={0.14} yOffset={16}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Administered Vaccines &amp; Clinical Logs
          </h3>

          <div style={{
            background: 'var(--surface-alt)',
            borderRadius: '24px',
            padding: '18px 22px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {petRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Syringe size={32} color="#10B981" style={{ opacity: 0.5, margin: '0 auto 8px', display: 'block' }} />
                <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-main)' }}>No vaccine records logged yet</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  When you or your clinician log a vaccine for {selectedPet.name}, it will appear here.
                </span>
                <button
                  onClick={handleQuickLogVaccine}
                  style={{
                    margin: '12px auto 0',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} />
                  <span>Log First Vaccine</span>
                </button>
              </div>
            ) : (
              petRecords.map((rec, idx) => (
                <div 
                  key={rec.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: idx < petRecords.length - 1 ? '12px' : '0',
                    borderBottom: idx < petRecords.length - 1 ? '1px solid var(--border)' : 'none',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Syringe size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                        {rec.diagnosis || rec.serviceType || 'Routine Vaccine Booster'}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {rec.prescription || rec.title || 'Annual immunization'} • {rec.date || 'Recent'}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#10B981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    flexShrink: 0
                  }}>
                    Verified
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </AppleReveal>

      {/* ── CORE IMMUNIZATION MATRIX TABLE ── */}
      <AppleReveal delay={0.18} yOffset={16}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Core Immunization Schedule Matrix
          </h3>

          <div style={{
            background: 'var(--surface-alt)',
            borderRadius: '24px',
            padding: '20px 24px',
            border: '1px solid var(--border)',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Milestone</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Preventive Vaccine</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Frequency</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < list.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--text-main)' }}>{item.milestone}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-main)' }}>{item.care}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{item.freq}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10B981',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppleReveal>
    </div>
  );
}
