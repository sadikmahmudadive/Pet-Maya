import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  FileText, 
  Send, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

export default function TeleConsultModal() {
  const { closeModal, modalData, addMedicalRecord, showToast } = useApp();

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [rx, setRx] = useState('Otomax Drops: 4 drops 2x daily (7 days). Apoquel 16mg daily.');

  const doctorName = modalData?.doctor || 'Dr. Sarah Jenkins';
  const petName = modalData?.petName || 'Max';

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDispenseRx = () => {
    addMedicalRecord({
      petName,
      ownerName: 'Alex Johnson',
      serviceType: 'Tele-Consultation',
      weight: '28.4 kg',
      diagnosis: notes || 'Feline/Canine Allergic Dermatitis & Otitis review',
      prescription: rx,
      cost: 35,
      nextBooster: '2026-10-15'
    });
    showToast('💊 Digital prescription saved & dispatched to Pet Owner!', 'success');
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.2s infinite' }} />
            <strong style={{ fontSize: '16px' }}>HD Teleconsultation Session • {formatTime(seconds)}</strong>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {/* Video Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '18px' }}>
          {/* Main Doctor Stream */}
          <div style={{ position: 'relative', height: 260, background: '#0f172a', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {videoOn ? (
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80" 
                alt="Doctor Stream" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ color: '#fff', textAlign: 'center' }}>Camera Paused</div>
            )}
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>{doctorName} (Active)</span>
            </div>
          </div>

          {/* Patient / Notes Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative', height: 120, background: '#1e293b', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img 
                src="assets/images/Pet_1.jpg" 
                alt="Patient Stream" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px' }}>
                Patient: {petName}
              </div>
            </div>

            <div>
              <label className="label-mini">Live Consultation Notes</label>
              <textarea 
                className="input-clean" 
                rows={3} 
                placeholder="Clinical observations during video call..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                style={{ fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        {/* Prescription Box */}
        <div style={{ background: 'var(--surface-alt)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '18px' }}>
          <label className="label-mini" style={{ color: 'var(--primary)', fontWeight: 800 }}>Digital Rx Prescription Generator</label>
          <input 
            type="text" 
            className="input-clean" 
            value={rx} 
            onChange={e => setRx(e.target.value)} 
            placeholder="e.g. Antibiotic / Antifungal dosage instructions..."
            style={{ fontSize: '13px', marginBottom: '8px' }}
          />
          <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={handleDispenseRx}>
            <FileText size={14} />
            <span>Dispense Rx to Owner Passport</span>
          </button>
        </div>

        {/* Call Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
          <button 
            className="icon-btn" 
            style={{ background: micOn ? 'var(--surface-alt)' : '#ef4444', color: micOn ? 'var(--text-main)' : '#fff' }}
            onClick={() => setMicOn(!micOn)}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <button 
            className="icon-btn" 
            style={{ background: videoOn ? 'var(--surface-alt)' : '#ef4444', color: videoOn ? 'var(--text-main)' : '#fff' }}
            onClick={() => setVideoOn(!videoOn)}
            title={videoOn ? 'Turn Video Off' : 'Turn Video On'}
          >
            {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          <button 
            className="btn-primary" 
            style={{ background: '#ef4444', padding: '10px 24px' }}
            onClick={closeModal}
          >
            <PhoneOff size={18} />
            <span>End Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
