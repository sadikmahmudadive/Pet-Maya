import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Video, Building2, Clock, Check } from 'lucide-react';

export default function BookingModal() {
  const { vets, pets, addAppointment, closeModal, modalData } = useApp();

  const [doctor, setDoctor] = useState(modalData?.doctor || vets[0]?.name || 'Dr. Sarah Jenkins');
  const [petName, setPetName] = useState(pets[0]?.name || 'Max');
  const [mode, setMode] = useState(modalData?.mode || 'In-Clinic Consultation');
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('10:30 AM');
  const [reason, setReason] = useState('Annual wellness checkup and preventative booster');

  const handleSubmit = (e) => {
    e.preventDefault();
    addAppointment({
      title: `${mode.includes('Tele') ? '📹 Video Tele-Consult' : '🏥 Clinical Visit'} with ${doctor}`,
      doctor,
      petName,
      date,
      time,
      mode
    });
    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Schedule Care Appointment</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified veterinary consultation &amp; tele-health booking.</p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              type="button"
              className={`chip-pill ${mode.includes('Clinic') ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              onClick={() => setMode('In-Clinic Consultation')}
            >
              <Building2 size={16} />
              <span>In-Clinic Visit</span>
            </button>

            <button 
              type="button"
              className={`chip-pill ${mode.includes('Tele') ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              onClick={() => setMode('HD Tele-Consultation')}
            >
              <Video size={16} />
              <span>Video Call</span>
            </button>
          </div>

          <div>
            <label className="label-mini">Care Specialist</label>
            <select className="input-clean" value={doctor} onChange={e => setDoctor(e.target.value)}>
              {vets.map(v => (
                <option key={v.id} value={v.name}>{v.name} ({v.tag} • {v.price})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-mini">Patient Pet</label>
            <select className="input-clean" value={petName} onChange={e => setPetName(e.target.value)}>
              {pets.map(p => (
                <option key={p.id} value={p.name}>{p.name} ({p.breed})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label className="label-mini">Appointment Date</label>
              <input type="date" className="input-clean" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div>
              <label className="label-mini">Time Slot</label>
              <select className="input-clean" value={time} onChange={e => setTime(e.target.value)}>
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:45 AM">11:45 AM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:15 PM">04:15 PM</option>
                <option value="06:00 PM">06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-mini">Reason / Chief Complaint</label>
            <input type="text" className="input-clean" placeholder="e.g. Skin itchiness, routine booster, or health review" value={reason} onChange={e => setReason(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '13px' }}>
            <Calendar size={16} />
            <span>Confirm &amp; Sync to Calendar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
