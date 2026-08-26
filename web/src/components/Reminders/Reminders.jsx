import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  Calendar, 
  Download, 
  Plus, 
  Trash2, 
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

const SCHEDULES = {
  dog: [
    { milestone: 'Core Vaccine #1', care: 'DHPP / DAPP (Distemper, Parvo)', freq: 'Every 3-4 Weeks (Puppy Series)', status: 'Essential 💉' },
    { milestone: 'Core Vaccine #2', care: 'Rabies (1-Year or 3-Year)', freq: 'At 16 Weeks & Annual Booster', status: 'Mandatory 🛡️' },
    { milestone: 'Parasite Prevention', care: 'Heartworm + Flea & Tick (Simparica/NexGard)', freq: 'Monthly Oral Chew', status: 'Active 💊' },
    { milestone: 'Deworming Protocol', care: 'Broad-Spectrum Deworming (Pyrantel/Praziquantel)', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled 🐾' },
    { milestone: 'Annual Wellness', care: 'Complete Blood Count & Dental Scaling', freq: 'Every 12 Months', status: 'Recommended 🩺' }
  ],
  cat: [
    { milestone: 'Core Vaccine #1', care: 'FVRCP (Feline Viral Rhinotracheitis, Calici, Panleukopenia)', freq: 'Every 3-4 Weeks (Kitten Series)', status: 'Essential 💉' },
    { milestone: 'Core Vaccine #2', care: 'Rabies & FeLV (Feline Leukemia)', freq: 'At 12-16 Weeks & Annual Booster', status: 'Mandatory 🛡️' },
    { milestone: 'Parasite Prevention', care: 'Topical Flea, Tick & Ear Mite (Revolution Plus)', freq: 'Monthly Topical Dose', status: 'Active 💊' },
    { milestone: 'Deworming Protocol', care: 'Intestinal Deworming Treatment', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled 🐾' },
    { milestone: 'Wellness Exam', care: 'Kidney Health Screening & Dental Check', freq: 'Every 12 Months', status: 'Recommended 🩺' }
  ]
};

export default function Reminders() {
  const { appointments, removeAppointment, openModal, showToast } = useApp();
  const [petType, setPetType] = useState('dog');

  const downloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pet Maya//Vaccine Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:Pet Maya: ${petType === 'dog' ? 'Canine' : 'Feline'} Vaccine & Wellness Due
DESCRIPTION:Scheduled veterinary reminder from Pet Maya platform. Checkup, booster, and parasite preventative due date.
STATUS:CONFIRMED
RRULE:FREQ=MONTHLY;INTERVAL=1
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Pet_Maya_${petType}_Schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📅 Vaccine calendar (.ics) exported!', 'success');
  };

  const list = SCHEDULES[petType] || SCHEDULES.dog;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── HEADER ── */}
      <AppleReveal duration={0.8} yOffset={25}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span className="apple-card-eyebrow" style={{ color: '#10B981' }}>Medical Records</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>Pet Passport &amp; Vaccine Planner</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Synchronized preventive immunizations, parasite protection schedules, and calendar alarms.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={downloadICS}>
            <Download size={15} />
            <span>Export to Apple Calendar (.ics)</span>
          </button>
          <button className="apple-btn-blue" onClick={() => openModal('booking')}>
            <Plus size={15} />
            <span>Add Care Alarm</span>
          </button>
        </div>
      </div>
      </AppleReveal>

      {/* ── IMMUNIZATION MATRIX TABLE ── */}
      <AppleReveal delay={0.1} yOffset={25}>
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Core Immunization &amp; Wellness Matrix</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="label-mini" style={{ margin: 0 }}>Species:</span>
            <select 
              className="input-clean" 
              style={{ width: 'auto', padding: '6px 12px', fontWeight: 600 }}
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
            >
              <option value="dog">🐕 Canine (Dog)</option>
              <option value="cat">🐈 Feline (Cat)</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Milestone</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Preventive Care / Vaccine</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Frequency</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 10px', fontWeight: 600, color: 'var(--text-main)' }}>{item.milestone}</td>
                  <td style={{ padding: '14px 10px' }}>{item.care}</td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>{item.freq}</td>
                  <td style={{ padding: '14px 10px' }}>
                    <span className="badge badge-green">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </AppleReveal>

      {/* ── ACTIVE SCHEDULED ALARMS ── */}
      <AppleReveal delay={0.2} yOffset={25}>
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Active Scheduled Alarms &amp; Visits</h3>
          <button className="apple-link-cta" onClick={() => openModal('booking')}>
            <Plus size={14} />
            <span>Schedule New</span>
          </button>
        </div>

        {appointments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No active alarms configured.</p>
        ) : (
          <AppleStagger className="apple-grid-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map(a => (
              <div 
                key={a.id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--surface-alt)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div>
                  <strong style={{ fontSize: '15px', fontWeight: 600, display: 'block' }}>{a.title}</strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{a.petName} • {a.date} at {a.time}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-blue">{a.mode}</span>
                  <button 
                    className="icon-btn" 
                    style={{ width: 32, height: 32, color: 'var(--danger)' }}
                    onClick={() => removeAppointment(a.id)}
                    title="Delete Reminder"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </AppleStagger>
        )}
      </div>
      </AppleReveal>
    </div>
  );
}
