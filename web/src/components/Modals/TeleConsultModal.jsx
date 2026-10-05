import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { WebCall } from '../../lib/call';
import {
  X, Mic, MicOff, Video, VideoOff, PhoneOff, FileText,
  ShieldCheck, CameraOff, AlertCircle, Loader2,
} from 'lucide-react';

const isVetRole = (role) => /vet/i.test(role || '');

export default function TeleConsultModal() {
  const { closeModal, modalData, addMedicalRecord, showToast, vets = [], pets = [] } = useApp();
  const { currentUser } = useAuth();

  const [state, setState] = useState({ phase: 'preparing', muted: false, videoOff: false });
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [rx, setRx] = useState('');
  const [fatal, setFatal] = useState(null);

  const callRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const iAmVet = isVetRole(currentUser?.role);
  const isIncoming = !!modalData?.callId;
  const doctor = modalData?.doctor;
  const apt = modalData?.appointment;
  const otherName = isIncoming
    ? state.call?.callerName
    : (iAmVet ? (apt?.ownerName || apt?.userName || 'Pet owner') : (doctor?.name || apt?.vetName || modalData?.vetName || vets[0]?.name));
  const petName = state.call?.petName || apt?.petName || modalData?.petName || pets[0]?.name || 'Companion';

  // Place or answer the call once.
  useEffect(() => {
    let cancelled = false;
    const uid = currentUser?.uid;
    if (!uid || String(uid).startsWith('demo_guest')) {
      setFatal('Please sign in with your account to start a video consultation.');
      return undefined;
    }
    (async () => {
      let call;
      if (isIncoming) {
        call = await WebCall.answerIncoming({ callId: modalData.callId, uid });
      } else {
        const calleeId = iAmVet
          ? (apt?.userId || apt?.ownerId)
          : (doctor?.id || doctor?.uid || apt?.providerId || apt?.vetId);
        if (!calleeId) {
          setFatal('Choose a veterinarian or an appointment to start a video consultation.');
          return;
        }
        const pet = pets.find((p) => p.id === (apt?.petId || modalData?.petId)) || pets[0];
        call = await WebCall.startOutgoing({
          uid,
          name: iAmVet && !/^dr\b/i.test(currentUser.name || '') ? `Dr. ${currentUser.name}` : (currentUser.name || 'Pet Parent'),
          photo: currentUser.photoUrl,
          calleeId,
          calleeName: iAmVet ? (apt?.ownerName || 'Pet owner') : (doctor?.name || apt?.vetName || ''),
          petId: apt?.petId || pet?.id || '',
          petName: apt?.petName || pet?.name || '',
          appointmentId: apt?.id || '',
        });
      }
      if (cancelled) { call.dispose(); return; }
      callRef.current = call;
      call.subscribe(setState);
    })();
    return () => {
      cancelled = true;
      callRef.current?.dispose();
      callRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach media streams.
  useEffect(() => {
    if (localVideoRef.current && state.localStream) localVideoRef.current.srcObject = state.localStream;
  }, [state.localStream, state.phase]);
  useEffect(() => {
    if (remoteVideoRef.current && state.remoteStream) remoteVideoRef.current.srcObject = state.remoteStream;
  }, [state.remoteStream, state.phase]);

  // Session timer (from when media actually connected).
  useEffect(() => {
    if (!state.connectedAt) return undefined;
    const tick = () => setSeconds(Math.floor((Date.now() - state.connectedAt) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [state.connectedAt]);

  // Auto-close shortly after the call ends, telling the user why if it never connected.
  const endedHandled = useRef(false);
  useEffect(() => {
    if (state.phase !== 'ended' || endedHandled.current) return;
    endedHandled.current = true;
    if (!state.connectedAt) {
      showToast(state.endReason || 'Call ended.', state.error ? 'error' : 'info');
      closeModal();
    } else {
      showToast('Consultation ended.', 'success');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleEnd = async () => {
    await callRef.current?.hangUp();
    closeModal();
  };

  const formatTime = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

  const handleDispenseRx = () => {
    if (!rx.trim()) { showToast('Enter a prescription first.', 'warning'); return; }
    addMedicalRecord({
      petName,
      ownerName: otherName || 'Pet owner',
      serviceType: 'Tele-Consultation',
      diagnosis: notes || 'Tele-consultation review',
      prescription: rx,
      cost: 0,
    });
    showToast('Digital prescription saved & dispatched to the pet owner.', 'success');
  };

  const { phase, muted, videoOff } = state;
  const live = phase === 'connected' || phase === 'reconnecting';
  const statusText = {
    preparing: 'Starting call…',
    ringing: `Calling ${otherName || 'specialist'}…`,
    connecting: 'Connecting…',
    reconnecting: 'Poor connection — reconnecting…',
    connected: 'Live',
    ended: 'Call ended',
  }[phase];

  if (fatal) {
    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal-dialog" style={{ maxWidth: 420, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <AlertCircle size={36} color="#f59e0b" />
          <p style={{ margin: '12px 0 18px' }}>{fatal}</p>
          <button className="btn-primary" onClick={closeModal}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: live ? '#10b981' : '#f59e0b', animation: 'pulse 1.2s infinite' }} />
            <strong style={{ fontSize: '16px' }}>
              Teleconsultation{otherName ? ` • ${otherName}` : ''} {live ? `• ${formatTime(seconds)}` : ''}
            </strong>
            <span style={{ background: live ? '#10b981' : '#64748b', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
              {statusText}
            </span>
          </div>
          <button className="icon-btn" onClick={handleEnd} aria-label="End call"><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: iAmVet ? '1.4fr 1fr' : '1fr', gap: '16px', marginBottom: '18px' }}>
          {/* Remote stream with local picture-in-picture */}
          <div style={{ position: 'relative', height: 320, background: '#0f172a', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: state.remoteStream ? 'block' : 'none' }} />
            {!state.remoteStream && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#94a3b8' }}>
                {phase === 'ended'
                  ? <AlertCircle size={32} color="#f59e0b" />
                  : <Loader2 size={32} style={{ animation: 'spin 0.9s linear infinite' }} />}
                <span style={{ fontSize: 12.5, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
                  {phase === 'ended' ? (state.endReason || 'Call ended.') : statusText}
                </span>
              </div>
            )}
            <div style={{ position: 'absolute', right: 12, bottom: 12, width: 130, height: 92, borderRadius: 12, overflow: 'hidden', background: '#1e293b', border: '2px solid rgba(255,255,255,0.4)' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: state.localStream && !videoOff ? 'block' : 'none' }} />
              {(videoOff || !state.localStream) && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <CameraOff size={22} />
                </div>
              )}
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>{otherName || 'Waiting for participant'} • Patient: {petName}</span>
            </div>
          </div>

          {iAmVet && (
            <div>
              <label className="label-mini">Live Consultation Notes</label>
              <textarea className="input-clean" rows={9} placeholder="Clinical observations during video call..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ fontSize: '12px' }} />
            </div>
          )}
        </div>

        {iAmVet && (
          <div style={{ background: 'var(--surface-alt)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '18px' }}>
            <label className="label-mini" style={{ color: 'var(--primary)', fontWeight: 800 }}>Digital Rx Prescription</label>
            <input type="text" className="input-clean" value={rx} onChange={(e) => setRx(e.target.value)} placeholder="e.g. medication, dosage and duration" style={{ fontSize: '13px', marginBottom: '8px' }} />
            <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={handleDispenseRx}>
              <FileText size={14} />
              <span>Dispense Rx to Owner Passport</span>
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
          <button className="icon-btn" style={{ background: muted ? '#ef4444' : 'var(--surface-alt)', color: muted ? '#fff' : 'var(--text-main)' }} onClick={() => callRef.current?.toggleMute()} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button className="icon-btn" style={{ background: videoOff ? '#ef4444' : 'var(--surface-alt)', color: videoOff ? '#fff' : 'var(--text-main)' }} onClick={() => callRef.current?.toggleVideo()} title={videoOff ? 'Turn video on' : 'Turn video off'}>
            {videoOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button className="btn-primary" style={{ background: '#ef4444', padding: '10px 24px' }} onClick={handleEnd}>
            <PhoneOff size={18} />
            <span>{phase === 'ringing' ? 'Cancel Call' : phase === 'ended' ? 'Close' : 'End Consultation'}</span>
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
