import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeIncomingCalls, declineCall } from '../../lib/call';

/* Global incoming tele-vet call overlay: rings (looped tone + system
   notification when the tab is hidden) and lets the user accept or decline. */

function useRingtone(active) {
  const ctxRef = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
    let timer;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const beep = () => {
        [0, 0.45].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 480;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + offset + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.35);
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.4);
        });
      };
      beep();
      timer = setInterval(beep, 2500);
    } catch { /* autoplay may be blocked until the user interacts */ }
    return () => {
      clearInterval(timer);
      try { ctxRef.current?.close(); } catch { /* noop */ }
    };
  }, [active]);
}

export default function IncomingCallListener() {
  const { currentUser } = useAuth();
  const { openModal, activeModal } = useApp();
  const [calls, setCalls] = useState([]);
  const notified = useRef(new Set());

  const uid = currentUser?.uid;
  const real = uid && !String(uid).startsWith('demo_guest');

  useEffect(() => {
    if (!real) { setCalls([]); return undefined; }
    return subscribeIncomingCalls(uid, setCalls);
  }, [real, uid]);

  // Busy in another consultation: the backend rejects with "busy"; don't ring.
  const call = activeModal === 'teleconsult' ? null : calls[0];
  useRingtone(!!call);

  useEffect(() => {
    if (!call || notified.current.has(call.id)) return;
    notified.current.add(call.id);
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      const n = new Notification('Incoming video call', {
        body: `${call.callerName || 'Pet Maya'} is calling${call.petName ? ` about ${call.petName}` : ''}`,
        icon: '/favicon-96x96.png',
        tag: `call_${call.id}`,
        requireInteraction: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
    }
  }, [call]);

  if (!call) return null;

  return (
    <div role="alertdialog" aria-label="Incoming video call" style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(9,13,22,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#0f172a', color: '#fff', borderRadius: 24, padding: '32px 28px', width: 'min(360px, 92vw)',
        textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          width: 84, height: 84, borderRadius: '50%', margin: '0 auto 16px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)',
          animation: 'pulse 1.4s infinite',
        }}>
          <Video size={36} color="#22c55e" />
        </div>
        <div style={{ fontSize: 12, letterSpacing: 1.2, color: '#94a3b8', fontWeight: 700 }}>INCOMING VIDEO CALL</div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 4px' }}>{call.callerName || 'Pet Maya'}</div>
        {call.petName && <div style={{ fontSize: 13, color: '#94a3b8' }}>Consultation for {call.petName}</div>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 36, marginTop: 28 }}>
          <button type="button" onClick={() => declineCall(call.id, uid)} aria-label="Decline" style={btn('#ef4444')}>
            <PhoneOff size={26} />
          </button>
          <button type="button" onClick={() => openModal('teleconsult', { callId: call.id })} aria-label="Answer" style={btn('#22c55e')}>
            <Phone size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}

const btn = (bg) => ({
  width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#fff',
  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: `0 8px 24px ${bg}66`,
});
