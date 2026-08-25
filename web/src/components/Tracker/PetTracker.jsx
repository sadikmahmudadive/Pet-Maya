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
  Radio,
  Volume2
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
    showToast('🔔 Sound buzzer triggered on collar!', 'success');
  };

  const toggleSimulateWalk = () => {
    setIsWalking(prev => {
      const next = !prev;
      if (next) {
        showToast('🐾 Simulating pet walk in neighborhood…', 'info');
      } else {
        showToast('⏹️ Walk simulation paused.', 'info');
      }
      return next;
    });
  };

  const toggleLostMode = () => {
    setIsLostMode(prev => {
      const next = !prev;
      if (next) {
        showToast('🚨 Emergency Lost Mode Broadcast Active!', 'error');
      } else {
        showToast('✅ Lost Mode deactivated. Standard tracking restored.', 'success');
      }
      return next;
    });
  };

  // 2D HTML5 Canvas Radar Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 380;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) - 20;

      ctx.clearRect(0, 0, w, h);

      // Radar Dark Canvas Background
      ctx.fillStyle = '#010503';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.stroke();

      // Concentric Rings
      for (let r = 1; r <= 4; r++) {
        const rad = (maxR / 4) * r;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.strokeStyle = r === 4 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)';
        ctx.stroke();

        ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillText(`${(geofenceRadius * (r / 4)).toFixed(0)}m`, cx + 6, cy - rad + 12);
      }

      // Safe-Zone Boundary Circle
      const safeR = (geofenceRadius / 1000) * maxR * 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(safeR, maxR), 0, Math.PI * 2);
      ctx.strokeStyle = isLostMode ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating Sweep Laser Line
      stateRef.current.sonarAngle = (stateRef.current.sonarAngle + 0.025) % (Math.PI * 2);
      const angle = stateRef.current.sonarAngle;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, angle, angle + 0.35);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Update Pet Coordinates
      if (isWalking) {
        if (Math.abs(stateRef.current.petX - stateRef.current.targetX) < 2 && Math.abs(stateRef.current.petY - stateRef.current.targetY) < 2) {
          const bound = safeR * 0.7;
          stateRef.current.targetX = (Math.random() - 0.5) * bound * 2;
          stateRef.current.targetY = (Math.random() - 0.5) * bound * 2;
        }
        stateRef.current.petX += (stateRef.current.targetX - stateRef.current.petX) * 0.02;
        stateRef.current.petY += (stateRef.current.targetY - stateRef.current.petY) * 0.02;

        if (Math.random() < 0.08) {
          stateRef.current.breadcrumbs.push({
            x: stateRef.current.petX,
            y: stateRef.current.petY,
            time: Date.now()
          });
          if (stateRef.current.breadcrumbs.length > 25) stateRef.current.breadcrumbs.shift();
        }
      }

      // Draw Breadcrumbs
      stateRef.current.breadcrumbs.forEach((crumb) => {
        ctx.beginPath();
        ctx.arc(cx + crumb.x, cy + crumb.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(74, 222, 128, 0.4)';
        ctx.fill();
      });

      // Home Base Pin
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3B82F6';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText('Home Base', cx + 8, cy + 3);

      // Pet Pin
      const petScreenX = cx + stateRef.current.petX;
      const petScreenY = cy + stateRef.current.petY;

      // Pulse Ring
      const pulseR = 12 + Math.sin(Date.now() / 200) * 4;
      ctx.beginPath();
      ctx.arc(petScreenX, petScreenY, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = isLostMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(74, 222, 128, 0.35)';
      ctx.fill();

      // Pin Center
      ctx.beginPath();
      ctx.arc(petScreenX, petScreenY, 7, 0, Math.PI * 2);
      ctx.fillStyle = isLostMode ? '#EF4444' : '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pet Name Label
      const activePetName = pets.length > 0 ? pets[0].name : 'Max';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px -apple-system, sans-serif';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── LOST MODE BEACON BANNER ── */}
      {isLostMode && (
        <div 
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
            color: '#FFFFFF',
            padding: '18px 24px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Radio size={24} />
            <div>
              <strong style={{ fontSize: '15px' }}>EMERGENCY LOST PET BEACON BROADCASTING</strong>
              <p style={{ fontSize: '12.5px', opacity: 0.9 }}>High-rate telemetry active. Nearby Pet Maya community &amp; clinics notified.</p>
            </div>
          </div>
          <button className="apple-btn-blue" style={{ background: '#FFFFFF', color: '#B91C1C' }} onClick={toggleLostMode}>
            Deactivate
          </button>
        </div>
      )}

      {/* ── HEADER & ACTIONS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Find My Pets</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>Live Sonar Radar &amp; GPS</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Real-time satellite collar tracking, safe perimeter geofence, and sound beacon.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={soundCollarBuzzer}>
            <Volume2 size={15} />
            <span>Collar Buzzer</span>
          </button>
          <button className="btn-ghost" onClick={toggleSimulateWalk}>
            <Footprints size={15} />
            <span>{isWalking ? 'Pause Walk' : 'Simulate Walk'}</span>
          </button>
          <button 
            className="apple-btn-blue" 
            style={{ background: isLostMode ? '#374151' : '#EF4444' }} 
            onClick={toggleLostMode}
          >
            <AlertTriangle size={15} />
            <span>{isLostMode ? 'Cancel Lost Alert' : 'Lost Mode'}</span>
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
            color: '#FFFFFF',
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
          <span className="t-val" style={{ color: '#10B981' }}>{telemetry.battery}%</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. 4 Days Remaining</span>
        </div>

        <div className="telemetry-tile">
          <span className="t-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Satellite size={14} /> GPS Satellite Lock
          </span>
          <span className="t-val" style={{ color: '#3B82F6' }}>{telemetry.satellites} Sats</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High Precision (±1.8m)</span>
        </div>

        <div className="telemetry-tile">
          <span className="t-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Gauge size={14} /> Movement Velocity
          </span>
          <span className="t-val">{telemetry.speed} km/h</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isWalking ? 'Walking in yard' : 'Stationary'}</span>
        </div>

        <div className="telemetry-tile">
          <span className="t-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Thermometer size={14} /> Collar Temperature
          </span>
          <span className="t-val">{telemetry.temp}°C</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Normal &amp; Comfortable</span>
        </div>
      </div>

      {/* ── GEOFENCE SLIDER CARD ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '24px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ fontSize: '17px', fontWeight: 700 }}>Safe-Zone Boundary Perimeter</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sets the geofence perimeter around home. Sends immediate push alarms if your pet crosses the line.</p>
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
