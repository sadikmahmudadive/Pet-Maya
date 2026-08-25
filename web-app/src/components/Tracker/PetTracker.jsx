import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BellRing, 
  Footprints, 
  AlertTriangle, 
  Battery, 
  Satellite, 
  Gauge, 
  Thermometer, 
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function PetTracker() {
  const { pets, showToast } = useApp();
  const canvasRef = useRef(null);

  const [geofenceRadius, setGeofenceRadius] = useState(250);
  const [isWalking, setIsWalking] = useState(false);
  const [isLostMode, setIsLostMode] = useState(false);
  const [telemetry, setTelemetry] = useState({
    battery: 88,
    satellites: 14,
    speed: 0.6,
    temp: 23.8,
    lat: 23.8103,
    lng: 90.4125
  });

  const stateRef = useRef({
    petX: 0,
    petY: 0,
    targetX: 0,
    targetY: 0,
    sonarAngle: 0,
    breadcrumbs: []
  });

  // Sound Collar Buzzer using Web Audio API
  const soundCollarBuzzer = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
    showToast('🔔 Sound buzzer activated on pet collar!', 'success');
  };

  const toggleSimulateWalk = () => {
    setIsWalking(prev => {
      const next = !prev;
      if (next) {
        stateRef.current.targetX = (Math.random() - 0.5) * 140;
        stateRef.current.targetY = (Math.random() - 0.5) * 140;
        setTelemetry(t => ({ ...t, speed: 1.8 }));
        showToast('🚶 Live GPS walk tracking active!', 'success');
      } else {
        setTelemetry(t => ({ ...t, speed: 0.0 }));
        showToast('Pet tracking paused.');
      }
      return next;
    });
  };

  const toggleLostMode = () => {
    setIsLostMode(prev => {
      const next = !prev;
      if (next) {
        showToast('🚨 EMERGENCY LOST PET BEACON ACTIVATED!', 'error');
      } else {
        showToast('Lost pet mode deactivated.', 'info');
      }
      return next;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const maxR = Math.min(cx, cy) - 20;

      // Concentric Range Rings
      const rings = [0.25, 0.5, 0.75, 1.0];
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;

      rings.forEach(pct => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * pct, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.font = '10px monospace';
        const meters = Math.round(pct * 1000);
        ctx.fillText(`${meters}m`, cx + 4, cy - (maxR * pct) + 12);
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx, 10); ctx.lineTo(cx, h - 10);
      ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy);
      ctx.stroke();

      // Geofence Circle
      const geofenceVisualR = (geofenceRadius / 1000) * maxR;
      ctx.beginPath();
      ctx.arc(cx, cy, geofenceVisualR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fill();
      ctx.strokeStyle = isLostMode ? '#ef4444' : 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sonar Rotating Sweep
      stateRef.current.sonarAngle += 0.03;
      if (stateRef.current.sonarAngle > Math.PI * 2) stateRef.current.sonarAngle = 0;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, stateRef.current.sonarAngle - 0.35, stateRef.current.sonarAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Breadcrumbs
      if (stateRef.current.breadcrumbs.length > 1) {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        stateRef.current.breadcrumbs.forEach((pt, i) => {
          const px = cx + pt.x;
          const py = cy + pt.y;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      // Smooth Movement Interpolation
      if (isWalking) {
        stateRef.current.petX += (stateRef.current.targetX - stateRef.current.petX) * 0.05;
        stateRef.current.petY += (stateRef.current.targetY - stateRef.current.petY) * 0.05;

        if (Math.hypot(stateRef.current.targetX - stateRef.current.petX, stateRef.current.targetY - stateRef.current.petY) < 3) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * (geofenceVisualR * 0.85);
          stateRef.current.targetX = Math.cos(angle) * dist;
          stateRef.current.targetY = Math.sin(angle) * dist;
          stateRef.current.breadcrumbs.push({ x: stateRef.current.petX, y: stateRef.current.petY });
          if (stateRef.current.breadcrumbs.length > 25) stateRef.current.breadcrumbs.shift();

          const newLat = 23.8103 + (stateRef.current.petY / 10000);
          const newLng = 90.4125 + (stateRef.current.petX / 10000);
          setTelemetry(t => ({ ...t, lat: newLat, lng: newLng }));
        }
      }

      // Pet Pin
      const petScreenX = cx + stateRef.current.petX;
      const petScreenY = cy + stateRef.current.petY;

      // Pulse
      const pulseR = 12 + Math.sin(Date.now() / 200) * 4;
      ctx.beginPath();
      ctx.arc(petScreenX, petScreenY, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = isLostMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(74, 222, 128, 0.35)';
      ctx.fill();

      // Pin Center
      ctx.beginPath();
      ctx.arc(petScreenX, petScreenY, 7, 0, Math.PI * 2);
      ctx.fillStyle = isLostMode ? '#ef4444' : '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pet Name Label
      const activePetName = pets.length > 0 ? pets[0].name : 'Max';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`${activePetName} 🐾`, petScreenX + 10, petScreenY - 6);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [geofenceRadius, isWalking, isLostMode, pets]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── LOST MODE BEACON BANNER ── */}
      {isLostMode && (
        <div 
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            color: '#fff',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Radio size={26} className="animate-pulse" />
            <div>
              <strong style={{ fontSize: '15px' }}>EMERGENCY LOST PET BEACON BROADCASTING</strong>
              <p style={{ fontSize: '12px', opacity: 0.9 }}>High-rate telemetry active. Nearby Pet Maya community &amp; clinics notified.</p>
            </div>
          </div>
          <button className="btn-ghost" style={{ background: '#fff', color: '#b91c1c', border: 'none' }} onClick={toggleLostMode}>
            Deactivate
          </button>
        </div>
      )}

      {/* ── HEADER ACTIONS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>Live Pet Radar &amp; GPS Telemetry</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Real-time collar tracking, activity velocity, and boundary alarms.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={soundCollarBuzzer}>
            <BellRing size={16} />
            <span>Collar Buzzer</span>
          </button>
          <button className="btn-ghost" onClick={toggleSimulateWalk}>
            <Footprints size={16} />
            <span>{isWalking ? 'Pause Walk' : 'Simulate Walk'}</span>
          </button>
          <button 
            className="btn-primary" 
            style={{ background: isLostMode ? '#374151' : '#ef4444' }} 
            onClick={toggleLostMode}
          >
            <AlertTriangle size={16} />
            <span>{isLostMode ? 'Cancel Alert' : 'Lost Pet Mode'}</span>
          </button>
        </div>
      </div>

      {/* ── RADAR CANVAS DISPLAY ── */}
      <div className="radar-screen-wrap">
        <canvas ref={canvasRef} className="radar-canvas" />
        <div className="radar-overlay-badge">
          <ShieldCheck size={16} />
          <span>{pets[0]?.name || 'Max'} • Safe Zone (Inside Home)</span>
        </div>
        <div 
          style={{
            position: 'absolute',
            bottom: 14,
            right: 14,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '11.5px',
            fontFamily: 'monospace'
          }}
        >
          {telemetry.lat.toFixed(4)}° N, {telemetry.lng.toFixed(4)}° E (±1.8m)
        </div>
      </div>

      {/* ── TELEMETRY TILES ── */}
      <div className="radar-telemetry-grid">
        <div className="telemetry-tile">
          <span className="t-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Battery size={14} /> Collar Battery
          </span>
          <span className="t-val" style={{ color: '#10b981' }}>{telemetry.battery}% 🔋</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. 4 Days Remaining</span>
        </div>

        <div className="telemetry-tile">
          <span className="t-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Satellite size={14} /> GPS Lock
          </span>
          <span className="t-val" style={{ color: '#3b82f6' }}>{telemetry.satellites} Sats 🛰️</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High Precision (±1.8m)</span>
        </div>

        <div className="telemetry-tile">
          <span className="t-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Gauge size={14} /> Movement Speed
          </span>
          <span className="t-val">{telemetry.speed} km/h 🐾</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isWalking ? 'Walking in yard' : 'Stationary'}</span>
        </div>

        <div className="telemetry-tile">
          <span className="t-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Thermometer size={14} /> Collar Temp
          </span>
          <span className="t-val">{telemetry.temp}°C 🌡️</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Comfortable / Normal</span>
        </div>
      </div>

      {/* ── GEOFENCE SLIDER ── */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Safe-Zone Geofence Perimeter</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Set the boundary radius around your home. Triggers instant push alarms if breached.</p>
          </div>
          <span className="badge badge-green" style={{ fontSize: '13px', padding: '6px 14px' }}>
            {geofenceRadius} Meters Radius
          </span>
        </div>
        <input 
          type="range" 
          min="100" 
          max="1000" 
          step="50" 
          value={geofenceRadius} 
          onChange={(e) => setGeofenceRadius(Number(e.target.value))} 
          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} 
        />
      </div>
    </div>
  );
}
