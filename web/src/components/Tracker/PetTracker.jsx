import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Zap, 
  Volume2, 
  RefreshCw, 
  Layers, 
  Crosshair, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Gauge, 
  Target,
  Satellite,
  Thermometer,
  Battery,
  AlertTriangle,
  Radio,
  Footprints,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

export default function PetTracker() {
  const { pets, showToast } = useApp();
  
  // Tracked pet
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || 'piku_01');
  const activePet = pets.find(p => p.id === selectedPetId) || pets[0] || {
    id: 'piku_01',
    name: 'Piku',
    breed: 'Dove / Ringneck',
    photo: 'assets/images/Pet_2.jpg'
  };

  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark', 'satellite', 'radar'
  const [isSafeZone, setIsSafeZone] = useState(false); // Outside safe area alert
  const [isLostMode, setIsLostMode] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [currentActivity, setCurrentActivity] = useState('Resting in Backyard');
  const [speed, setSpeed] = useState('2.4 km/h');
  const [lastSync, setLastSync] = useState('2m ago');
  const [accuracy, setAccuracy] = useState('98%');
  const [geofenceRadius, setGeofenceRadius] = useState(250);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  // Coordinates
  const [petPos, setPetPos] = useState({ x: 40, y: -20 });
  const [userPos, setUserPos] = useState({ x: -140, y: 70 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Play Sound Buzzer via Web Audio API
  const handlePlaySound = () => {
    setIsPlayingSound(true);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, audioCtx.currentTime + 0.3);
      osc.frequency.setValueAtTime(920, audioCtx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(540, audioCtx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (_) {}

    showToast(`🔊 High-pitch collar buzzer sounding on ${activePet.name}'s smart tracker!`, 'info');
    setTimeout(() => setIsPlayingSound(false), 800);
  };

  // Trigger Telemetry Movement Simulation
  const handleRefreshMovement = () => {
    setLastSync('Just now');
    const newX = (Math.random() - 0.5) * 180;
    const newY = (Math.random() - 0.5) * 180;
    setPetPos({ x: newX, y: newY });
    
    const activities = ['Walking along Lane 6', 'Resting in Backyard', 'Exploring DOHS Bypass', 'Running in Garden'];
    const act = activities[Math.floor(Math.random() * activities.length)];
    setCurrentActivity(act);
    setSpeed((Math.random() * 3.5 + 0.5).toFixed(1) + ' km/h');
    
    const distFromCenter = Math.sqrt(newX * newX + newY * newY);
    setIsSafeZone(distFromCenter < (geofenceRadius / 2.5));

    showToast(`🔄 Telemetry synced: ${activePet.name} is ${act}`, 'success');
  };

  // Toggle Emergency Lost Mode
  const toggleLostMode = () => {
    setIsLostMode(prev => {
      const next = !prev;
      if (next) {
        showToast(`🚨 Emergency Lost Mode Broadcast Active for ${activePet.name}!`, 'error');
      } else {
        showToast('✅ Lost Mode deactivated. Standard tracking active.', 'success');
      }
      return next;
    });
  };

  // Center on Pet
  const handleCenterPet = () => {
    setPanOffset({ x: -petPos.x, y: -petPos.y });
    showToast(`🎯 Centered on ${activePet.name}`, 'info');
  };

  // Center on User / Home
  const handleCenterUser = () => {
    setPanOffset({ x: -userPos.x, y: -userPos.y });
    showToast('📍 Centered on your position', 'info');
  };

  // Canvas Map Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2 + panOffset.x;
      const cy = h / 2 + panOffset.y;

      ctx.clearRect(0, 0, w, h);

      // ── 1. Map Base Background ──
      if (mapStyle === 'dark') {
        ctx.fillStyle = '#0F141A';
      } else if (mapStyle === 'satellite') {
        ctx.fillStyle = '#080E16';
      } else {
        ctx.fillStyle = '#040F0B';
      }
      ctx.fillRect(0, 0, w, h);

      // ── 2. Vector Roads & City Blocks Grid ──
      ctx.save();

      const roadColor = mapStyle === 'dark' ? '#1B232E' : (mapStyle === 'satellite' ? '#141F2D' : 'rgba(16, 185, 129, 0.07)');
      const mainRoadColor = mapStyle === 'dark' ? '#253140' : (mapStyle === 'satellite' ? '#1E2C3F' : 'rgba(16, 185, 129, 0.14)');

      // Draw Grid / Buildings blocks
      ctx.fillStyle = roadColor;
      for (let x = -1000; x <= 1000; x += 140) {
        for (let y = -1000; y <= 1000; y += 95) {
          ctx.fillRect(cx + x + 10, cy + y + 10, 120, 75);
        }
      }

      // Draw Main Roads
      ctx.strokeStyle = mainRoadColor;
      ctx.lineWidth = 16;
      ctx.beginPath();
      // DOHS Bypass diagonal curve
      ctx.moveTo(cx - 700, cy + 400);
      ctx.bezierCurveTo(cx - 300, cy + 150, cx + 150, cy - 250, cx + 700, cy - 550);
      ctx.stroke();

      // Horizontal lanes
      ctx.lineWidth = 9;
      ctx.strokeStyle = roadColor;
      for (let y = -700; y <= 700; y += 95) {
        ctx.beginPath();
        ctx.moveTo(cx - 1000, cy + y);
        ctx.lineTo(cx + 1000, cy + y);
        ctx.stroke();
      }

      // Vertical lanes
      for (let x = -900; x <= 900; x += 140) {
        ctx.beginPath();
        ctx.moveTo(cx + x, cy - 1000);
        ctx.lineTo(cx + x, cy + 1000);
        ctx.stroke();
      }

      // ── 3. Road Name Labels ──
      ctx.fillStyle = '#64748B';
      ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      
      const labels = [
        { text: 'Lane - 1', x: -220, y: -260 },
        { text: 'Lane - 2', x: -160, y: -190 },
        { text: 'Lane - 3', x: 20, y: -220 },
        { text: 'Lane - 4', x: 100, y: -140 },
        { text: 'Lane - 5', x: -100, y: -80 },
        { text: 'Lane - 6', x: -40, y: -20 },
        { text: 'Lane - 7', x: 20, y: 40 },
        { text: 'Lane - 8', x: 80, y: 110 },
        { text: 'Lane - 9', x: 140, y: 180 },
        { text: 'Lane - 10', x: 200, y: 250 },
        { text: 'Eastern Rd', x: 260, y: -80 },
        { text: 'DOHS Bypass', x: -300, y: 190 },
        { text: 'Rd No 11', x: 280, y: 200 },
        { text: 'Rd 12', x: 200, y: 120 },
        { text: 'লেন - ৭', x: -340, y: 80 },
      ];

      labels.forEach(lbl => {
        ctx.fillText(lbl.text, cx + lbl.x, cy + lbl.y);
      });

      // ── 4. Safe Zone Geofence Circle ──
      const safeRadiusPx = (geofenceRadius / 250) * 120;
      ctx.beginPath();
      ctx.arc(cx, cy, safeRadiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = isSafeZone ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isSafeZone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)';
      ctx.fill();

      // Home Base Pin
      ctx.beginPath();
      ctx.arc(cx + userPos.x, cy + userPos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#0071E3';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 11px -apple-system, sans-serif';
      ctx.fillText('You / Home', cx + userPos.x + 12, cy + userPos.y + 4);

      // ── 5. Pulsing Sonar Rings around Pet ──
      const petScreenX = cx + petPos.x;
      const petScreenY = cy + petPos.y;

      const t = Date.now() / 1000;
      for (let i = 0; i < 3; i++) {
        const ringT = (t + i * 0.6) % 1.8;
        const ringR = 40 + ringT * 42;
        const ringAlpha = Math.max(0, 1 - ringT / 1.8) * 0.5;

        ctx.beginPath();
        ctx.arc(petScreenX, petScreenY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = isSafeZone 
          ? `rgba(16, 185, 129, ${ringAlpha})` 
          : `rgba(239, 68, 68, ${ringAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [panOffset, petPos, userPos, isSafeZone, mapStyle, geofenceRadius]);

  // Handle Dragging
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      
      {/* ── LOST MODE BEACON BANNER ── */}
      <AnimatePresence>
        {isLostMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
              color: '#FFFFFF',
              padding: '18px 24px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 12px 32px rgba(239, 68, 68, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radio size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '16px', display: 'block' }}>EMERGENCY LOST PET BEACON BROADCASTING</strong>
                <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>High-rate telemetry active. Nearby Pet Maya community &amp; clinics notified.</p>
              </div>
            </div>
            <button className="apple-btn-blue" style={{ background: '#FFFFFF', color: '#B91C1C', fontWeight: 700 }} onClick={toggleLostMode}>
              Deactivate Lost Mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER & ACTIONS ── */}
      <AppleReveal duration={0.35} yOffset={15}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Find My Pets</span>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 6px' }}>
              Live GPS Radar &amp; Telemetry
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Real-time satellite collar tracking, safe perimeter geofencing, and smart biometric sensors.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={handlePlaySound}>
              <Volume2 size={15} color="var(--primary)" />
              <span>Collar Buzzer</span>
            </button>
            <button className="btn-ghost" onClick={handleRefreshMovement}>
              <RefreshCw size={15} color="var(--primary)" />
              <span>Sync Movement</span>
            </button>
            <button 
              className="apple-btn-blue" 
              style={{ background: isLostMode ? '#374151' : '#EF4444' }} 
              onClick={toggleLostMode}
            >
              <AlertTriangle size={15} />
              <span>{isLostMode ? 'Cancel Alert' : 'Lost Mode'}</span>
            </button>
          </div>
        </div>
      </AppleReveal>

      {/* ── PET SELECTOR TABS ── */}
      {pets && pets.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tracking:
          </span>
          {pets.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPetId(p.id);
                showToast(`Switched radar to ${p.name}`, 'info');
              }}
              className="chip-pill"
              style={{
                background: (selectedPetId === p.id || (!selectedPetId && p.id === pets[0].id)) ? 'var(--text-main)' : 'var(--surface-alt)',
                color: (selectedPetId === p.id || (!selectedPetId && p.id === pets[0].id)) ? 'var(--bg-pure)' : 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              <span>🐾 {p.name} ({p.breed || 'Pet'})</span>
            </button>
          ))}
        </div>
      )}

      {/* ── MAIN DASHBOARD DUAL-COLUMN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '24px', width: '100%', alignItems: 'start' }}>
        
        {/* ── LEFT COLUMN: EXPANSIVE RADAR MAP VIEWPORT ── */}
        <AppleReveal duration={0.35} yOffset={15}>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              height: '560px', 
              position: 'relative',
              background: '#0B0F14',
              borderRadius: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Top Floating App Bar (Matching Mobile App design) */}
            <div 
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                zIndex: 90,
                background: 'rgba(26, 32, 40, 0.88)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isSafeZone ? '#10B981' : '#EF4444', boxShadow: isSafeZone ? '0 0 10px #10B981' : '0 0 10px #EF4444' }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                    {activePet.name}'s Radar
                  </h3>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: isSafeZone ? '#4ADE80' : '#EF4444'
                  }}>
                    {isSafeZone ? 'Connected • Safe Zone' : 'Alert • Outside Safe Area'}
                  </span>
                </div>
              </div>

              {/* Battery Indicator */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  color: '#10B981',
                  fontWeight: 800,
                  fontSize: '12px'
                }}
              >
                <Zap size={13} fill="#10B981" />
                <span>{batteryLevel}%</span>
              </div>
            </div>

            {/* Draggable Map Canvas Surface */}
            <div 
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                cursor: 'grab',
                perspective: '1000px',
                overflow: 'hidden'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div 
                style={{
                  width: '100%',
                  height: '100%',
                  transform: is3D ? 'rotateX(35deg) scale(1.15) translateY(-20px)' : 'none',
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                  transformOrigin: 'center center'
                }}
              >
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

                {/* Real-time Pet Avatar Marker */}
                <div 
                  style={{
                    position: 'absolute',
                    top: `calc(50% + ${panOffset.y + petPos.y}px)`,
                    left: `calc(50% + ${panOffset.x + petPos.x}px)`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 60,
                    pointerEvents: 'none'
                  }}
                >
                  <motion.div 
                    animate={{ scale: [1, 1.06, 1] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '3px solid #10B981',
                      background: '#0B0F14',
                      boxShadow: '0 0 24px rgba(16, 185, 129, 0.7), 0 8px 20px rgba(0,0,0,0.6)',
                      padding: '2px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={activePet.photo || 'assets/images/Pet_2.jpg'} 
                      alt={activePet.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }} 
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Right Map Controls */}
            <div 
              style={{
                position: 'absolute',
                top: '84px',
                right: '16px',
                zIndex: 90,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <button 
                onClick={() => setIs3D(!is3D)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: is3D ? '#10B981' : 'rgba(26, 32, 40, 0.92)',
                  border: is3D ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: is3D ? '#FFFFFF' : '#10B981',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                  transition: 'all 0.2s ease'
                }}
                title="Toggle 3D View"
              >
                {is3D ? '3D' : '2D'}
              </button>

              <button 
                onClick={handleCenterUser}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(26, 32, 40, 0.92)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
                }}
                title="Center on Home / Me"
              >
                <Crosshair size={18} />
              </button>

              <button 
                onClick={handleCenterPet}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(26, 32, 40, 0.92)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
                }}
                title={`Center on ${activePet.name}`}
              >
                <Footprints size={18} />
              </button>

              <button 
                onClick={() => setShowStylePicker(!showStylePicker)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(26, 32, 40, 0.92)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
                }}
                title="Map Style"
              >
                <Layers size={18} />
              </button>
            </div>

            {/* Map Style Dropdown */}
            <AnimatePresence>
              {showStylePicker && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  style={{
                    position: 'absolute',
                    top: '250px',
                    right: '16px',
                    zIndex: 95,
                    background: '#1A1F26',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.7)'
                  }}
                >
                  {[
                    { id: 'dark', label: 'Streets' },
                    { id: 'satellite', label: 'Satellite' },
                    { id: 'radar', label: 'Sonar HUD' }
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => { setMapStyle(st.id); setShowStylePicker(false); }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: mapStyle === st.id ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        color: mapStyle === st.id ? '#10B981' : '#A1A1A6',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Overlay Badges */}
            <div 
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '16px',
                zIndex: 80,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(10px)',
                color: '#A1A1A6',
                padding: '5px 12px',
                borderRadius: '10px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
            >
              23.8103° N, 90.4125° E • Precision ±1.8m
            </div>
          </div>
        </AppleReveal>

        {/* ── RIGHT COLUMN: TELEMETRY, ACTIVITY & GEOFENCE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Current Activity & Real-time Metrics */}
          <AppleReveal delay={0.05} duration={0.35} yOffset={15}>
            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      background: 'rgba(16, 185, 129, 0.16)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Activity size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      CURRENT ACTIVITY
                    </span>
                    <strong style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>
                      {currentActivity}
                    </strong>
                  </div>
                </div>

                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    color: '#10B981',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                  <span>LIVE</span>
                </div>
              </div>

              {/* 3 Telemetry Grid Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: 'var(--surface-solid)', padding: '12px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                    <Gauge size={16} />
                  </div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{speed}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Speed</span>
                </div>

                <div style={{ background: 'var(--surface-solid)', padding: '12px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                    <Clock size={16} />
                  </div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{lastSync}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last Sync</span>
                </div>

                <div style={{ background: 'var(--surface-solid)', padding: '12px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                    <Target size={16} />
                  </div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{accuracy}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accuracy</span>
                </div>
              </div>

              {/* Sound Action Button */}
              <button 
                onClick={handlePlaySound}
                className="apple-btn-blue"
                style={{ 
                  width: '100%', 
                  background: isPlayingSound ? '#059669' : 'var(--primary)', 
                  justifyContent: 'center', 
                  padding: '12px 18px',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                <Volume2 size={16} />
                <span>PLAY SOUND BEACON</span>
              </button>
            </div>
          </AppleReveal>

          {/* Card 2: Collar Sensors & Battery Health */}
          <AppleReveal delay={0.1} duration={0.35} yOffset={15}>
            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left' }}>
              <span className="label-mini" style={{ marginBottom: '14px' }}>Collar Telemetry &amp; Sensors</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Battery size={17} color="#10B981" />
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>Battery Power</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Est. 4 Days Remaining</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>{batteryLevel}%</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Satellite size={17} color="#3B82F6" />
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>GPS Satellite Lock</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>14 Satellites Active</span>
                    </div>
                  </div>
                  <span className="badge badge-blue">High Lock</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Thermometer size={17} color="#F59E0B" />
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>Collar Temperature</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Comfortable &amp; Safe</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>23.8°C</span>
                </div>
              </div>
            </div>
          </AppleReveal>

          {/* Card 3: Geofence Boundary Radius Slider */}
          <AppleReveal delay={0.15} duration={0.35} yOffset={15}>
            <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>Safe-Zone Geofence</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automated perimeter breach alerts</span>
                </div>
                <span className="badge badge-green" style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {geofenceRadius} Meters
                </span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="600" 
                step="25" 
                value={geofenceRadius} 
                onChange={(e) => setGeofenceRadius(Number(e.target.value))} 
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginTop: '6px' }} 
              />
            </div>
          </AppleReveal>

        </div>
      </div>

    </div>
  );
}
