import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, Mic, MicOff, Video, VideoOff, PhoneOff, FileText,
  ShieldCheck, CameraOff, AlertCircle
} from 'lucide-react';

export default function TeleConsultModal() {
  const { closeModal, modalData, addMedicalRecord, showToast, vets = [], pets = [] } = useApp();

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [rx, setRx] = useState('Otomax Drops: 4 drops 2x daily (7 days). Apoquel 16mg daily.');
  const [cameraError, setCameraError] = useState(null);
  const [streamReady, setStreamReady] = useState(false);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  const doctorName = modalData?.doctor || modalData?.vetName || vets[0]?.name || 'Specialist Clinician';
  const petName = modalData?.petName || pets[0]?.name || 'Companion';

  // Session Timer
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Camera & Mic access
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('getUserMedia not supported on this browser');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (!mounted) { 
          stream.getTracks().forEach(t => t.stop()); 
          return; 
        }
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStreamReady(true);
        setCameraError(null);
      } catch (err) {
        if (!mounted) return;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. Please allow camera & microphone in browser permissions.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
        } else {
          setCameraError('Camera stream notice: ' + err.message);
        }
      }
    };
    startCamera();
    return () => {
      mounted = false;
      if (streamRef.current) { 
        streamRef.current.getTracks().forEach(t => t.stop()); 
        streamRef.current = null; 
      }
    };
  }, []);

  const handleMicToggle = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    }
    setMicOn(prev => !prev);
    showToast(micOn ? 'Microphone muted' : 'Microphone unmuted', 'info');
  };

  const handleVideoToggle = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !videoOn; });
    }
    setVideoOn(prev => !prev);
  };

  const handleEndCall = () => {
    if (streamRef.current) { 
      streamRef.current.getTracks().forEach(t => t.stop()); 
      streamRef.current = null; 
    }
    closeModal();
  };

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
    showToast('Digital prescription saved & dispatched to Pet Owner!', 'success');
  };

  return (
    <div className="modal-backdrop" onClick={handleEndCall}>
      <div className="modal-dialog" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.2s infinite' }} />
            <strong style={{ fontSize: '16px' }}>HD Teleconsultation Session • {formatTime(seconds)}</strong>
            {streamReady && (
              <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>● LIVE</span>
            )}
          </div>
          <button className="icon-btn" onClick={handleEndCall}><X size={18} /></button>
        </div>

        {/* Video Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '18px' }}>
          {/* Main — Local Camera Stream */}
          <div style={{ position: 'relative', height: 260, background: '#0f172a', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: (streamReady && videoOn) ? 'block' : 'none',
              }}
            />
            {cameraError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', textAlign: 'center' }}>
                <AlertCircle size={32} color="#f59e0b" />
                <span style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.5 }}>{cameraError}</span>
              </div>
            )}
            {!streamReady && !cameraError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#64748b', fontSize: '12px' }}>Requesting camera access…</span>
              </div>
            )}
            {streamReady && !videoOn && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                <CameraOff size={32} />
                <span style={{ fontSize: '12px' }}>Camera Paused</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>You ({doctorName})</span>
            </div>
          </div>

          {/* Right — patient photo + notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative', height: 120, background: '#1e293b', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img src="/assets/images/Pet_1.jpg" alt="Patient Stream" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px' }}>
                Patient: {petName}
              </div>
            </div>
            <div>
              <label className="label-mini">Live Consultation Notes</label>
              <textarea className="input-clean" rows={3} placeholder="Clinical observations during video call..." value={notes} onChange={e => setNotes(e.target.value)} style={{ fontSize: '12px' }} />
            </div>
          </div>
        </div>

        {/* Prescription Box */}
        <div style={{ background: 'var(--surface-alt)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '18px' }}>
          <label className="label-mini" style={{ color: 'var(--primary)', fontWeight: 800 }}>Digital Rx Prescription Generator</label>
          <input type="text" className="input-clean" value={rx} onChange={e => setRx(e.target.value)} placeholder="e.g. Antibiotic / Antifungal dosage instructions..." style={{ fontSize: '13px', marginBottom: '8px' }} />
          <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={handleDispenseRx}>
            <FileText size={14} />
            <span>Dispense Rx to Owner Passport</span>
          </button>
        </div>

        {/* Call Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
          <button className="icon-btn" style={{ background: micOn ? 'var(--surface-alt)' : '#ef4444', color: micOn ? 'var(--text-main)' : '#fff' }} onClick={handleMicToggle} title={micOn ? 'Mute' : 'Unmute'}>
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button className="icon-btn" style={{ background: videoOn ? 'var(--surface-alt)' : '#ef4444', color: videoOn ? 'var(--text-main)' : '#fff' }} onClick={handleVideoToggle} title={videoOn ? 'Turn Video Off' : 'Turn Video On'}>
            {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <button className="btn-primary" style={{ background: '#ef4444', padding: '10px 24px' }} onClick={handleEndCall}>
            <PhoneOff size={18} />
            <span>End Consultation</span>
          </button>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}