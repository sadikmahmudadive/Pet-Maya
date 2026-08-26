import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronLeft, 
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
  Sparkles,
  Radio,
  Footprints
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PetTracker() {
  const { pets, setActiveTab, showToast } = useApp();
  
  // Active tracked pet (default to Piku or first pet)
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || 'piku_01');
  const activePet = pets.find(p => p.id === selectedPetId) || pets[0] || {
    id: 'piku_01',
    name: 'Piku',
    breed: 'Dove / Ringneck',
    photo: 'assets/images/Pet_2.jpg'
  };

  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark', 'satellite', 'radar'
  const [isSafeZone, setIsSafeZone] = useState(false); // Matching screenshot "Alert • Outside Safe Area"
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [currentActivity, setCurrentActivity] = useState('Resting in Backyard');
  const [speed, setSpeed] = useState('2.4 km/h');
  const [lastSync, setLastSync] = useState('2m ago');
  const [accuracy, setAccuracy] = useState('98%');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  // Coordinates & Simulation
  const [petPos, setPetPos] = useState({ x: 0, y: 0 }); // relative offset
  const [userPos, setUserPos] = useState({ x: -120, y: 80 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Play Sound Buzzer (Web Audio Synthesizer)
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

  // Trigger Simulated Movement
  const handleRefreshMovement = () => {
    setLastSync('Just now');
    const newX = (Math.random() - 0.5) * 160;
    const newY = (Math.random() - 0.5) * 160;
    setPetPos({ x: newX, y: newY });
    
    // Toggle activity and speed
    const activities = ['Walking along Lane 6', 'Resting in Backyard', 'Exploring DOHS Bypass', 'Running in Garden'];
    const act = activities[Math.floor(Math.random() * activities.length)];
    setCurrentActivity(act);
    setSpeed((Math.random() * 3.5 + 0.5).toFixed(1) + ' km/h');
    
    const distFromCenter = Math.sqrt(newX * newX + newY * newY);
    setIsSafeZone(distFromCenter < 90);

    showToast(`🔄 Telemetry updated: ${activePet.name} is ${act}`, 'success');
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
        ctx.fillStyle = '#11161B';
      } else if (mapStyle === 'satellite') {
        ctx.fillStyle = '#0a1017';
      } else {
        ctx.fillStyle = '#05120e';
      }
      ctx.fillRect(0, 0, w, h);

      // ── 2. Vector Roads & City Blocks Grid ──
      ctx.save();

      // Road styles
      const roadColor = mapStyle === 'dark' ? '#1D2530' : (mapStyle === 'satellite' ? '#162332' : 'rgba(16, 185, 129, 0.08)');
      const mainRoadColor = mapStyle === 'dark' ? '#263242' : (mapStyle === 'satellite' ? '#203046' : 'rgba(16, 185, 129, 0.15)');

      // Draw Grid / Buildings blocks
      ctx.fillStyle = roadColor;
      for (let x = -800; x <= 800; x += 130) {
        for (let y = -800; y <= 800; y += 90) {
          ctx.fillRect(cx + x + 10, cy + y + 10, 110, 70);
        }
      }

      // Draw Main Roads
      ctx.strokeStyle = mainRoadColor;
      ctx.lineWidth = 14;
      ctx.beginPath();
      // DOHS Bypass diagonal curve
      ctx.moveTo(cx - 500, cy + 300);
      ctx.bezierCurveTo(cx - 200, cy + 100, cx + 100, cy - 200, cx + 500, cy - 450);
      ctx.stroke();

      // Horizontal lanes
      ctx.lineWidth = 8;
      ctx.strokeStyle = roadColor;
      for (let y = -500; y <= 500; y += 90) {
        ctx.beginPath();
        ctx.moveTo(cx - 800, cy + y);
        ctx.lineTo(cx + 800, cy + y);
        ctx.stroke();
      }

      // Vertical lanes
      for (let x = -700; x <= 700; x += 130) {
        ctx.beginPath();
        ctx.moveTo(cx + x, cy - 800);
        ctx.lineTo(cx + x, cy + 800);
        ctx.stroke();
      }

      // ── 3. Road Name Labels ──
      ctx.fillStyle = '#64748B';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      
      const labels = [
        { text: 'Lane - 1', x: -160, y: -240 },
        { text: 'Lane - 2', x: -120, y: -180 },
        { text: 'Lane - 3', x: 20, y: -200 },
        { text: 'Lane - 4', x: 80, y: -130 },
        { text: 'Lane - 5', x: -80, y: -80 },
        { text: 'Lane - 6', x: -40, y: -20 },
        { text: 'Lane - 7', x: 10, y: 30 },
        { text: 'Lane - 8', x: 60, y: 90 },
        { text: 'Lane - 9', x: 100, y: 150 },
        { text: 'Lane - 10', x: 140, y: 210 },
        { text: 'Eastern Rd', x: 210, y: -70 },
        { text: 'DOHS Bypass', x: -220, y: 160 },
        { text: 'Rd No 11', x: 220, y: 180 },
        { text: 'Rd 12', x: 160, y: 100 },
        { text: 'লেন - ৭', x: -280, y: 70 },
      ];

      labels.forEach(lbl => {
        ctx.fillText(lbl.text, cx + lbl.x, cy + lbl.y);
      });

      // ── 4. Safe Zone Geofence Circle ──
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.strokeStyle = isSafeZone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isSafeZone ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)';
      ctx.fill();

      // Safe Zone Center Badge / Home Base
      ctx.beginPath();
      ctx.arc(cx + userPos.x, cy + userPos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#0071E3';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 10px -apple-system, sans-serif';
      ctx.fillText('You / Home', cx + userPos.x + 12, cy + userPos.y + 3);

      // ── 5. Pulsing Sonar Rings around Pet ──
      const petScreenX = cx + petPos.x;
      const petScreenY = cy + petPos.y;

      const t = Date.now() / 1000;
      for (let i = 0; i < 3; i++) {
        const ringT = (t + i * 0.6) % 1.8;
        const ringR = 40 + ringT * 40;
        const ringAlpha = Math.max(0, 1 - ringT / 1.8) * 0.45;

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
  }, [panOffset, petPos, userPos, isSafeZone, mapStyle]);

  // Handle Drag / Pan Map
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
    <div style={{ maxWidth: '1040px', margin: '0 auto', width: '100%', padding: '0 16px' }}>
      
      {/* ── PHONE / RADAR CONTAINER FRAME ── */}
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '820px',
          margin: '0 auto',
          background: '#0B0F14',
          borderRadius: '44px',
          border: '10px solid #1E242B',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none'
        }}
      >
        
        {/* Dynamic Island / Top Camera Notch */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90px',
          height: '24px',
          background: '#000000',
          borderRadius: '20px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111827' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', opacity: 0.8 }} />
        </div>

        {/* ── 1. FLOATING TOP APP BAR ── */}
        <div 
          style={{
            position: 'absolute',
            top: '46px',
            left: '16px',
            right: '16px',
            zIndex: 90,
            background: 'rgba(30, 36, 43, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1.2px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Back Icon */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#FFFFFF', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              padding: '6px'
            }}
            title="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Title & Safe Zone Status */}
          <div style={{ flex: 1, paddingLeft: '8px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
              {activePet.name}'s Radar
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <div 
                style={{ 
                  width: '7px', 
                  height: '7px', 
                  borderRadius: '50%', 
                  background: isSafeZone ? '#10B981' : '#EF4444' 
                }} 
              />
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: isSafeZone ? '#4ADE80' : '#EF4444',
                letterSpacing: '0.01em'
              }}>
                {isSafeZone ? 'Connected • Safe Zone' : 'Alert • Outside Safe Area'}
              </span>
            </div>
          </div>

          {/* Battery Indicator Badge */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 10px',
              borderRadius: '12px',
              color: '#10B981',
              fontWeight: 800,
              fontSize: '12px'
            }}
          >
            <Zap size={14} fill="#10B981" />
            <span>{batteryLevel}%</span>
          </div>
        </div>

        {/* ── 2. MAP CANVAS SURFACE (Draggable & 3D Perspective) ── */}
        <div 
          style={{
            flex: 1,
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
              transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
              transformOrigin: 'center center'
            }}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

            {/* ── REAL-TIME PET AVATAR MARKER (Centered with pulse) ── */}
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
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  border: '3.5px solid #10B981',
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

        {/* ── 3. RIGHT FLOATING MAP CONTROLS ── */}
        <div 
          style={{
            position: 'absolute',
            top: '124px',
            right: '16px',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* 3D / 2D Toggle */}
          <button 
            onClick={() => setIs3D(!is3D)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: is3D ? '#10B981' : 'rgba(30, 36, 43, 0.92)',
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
            title="Toggle 3D Perspective"
          >
            {is3D ? '3D' : '2D'}
          </button>

          {/* Center on User */}
          <button 
            onClick={handleCenterUser}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(30, 36, 43, 0.92)',
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
            <Crosshair size={20} />
          </button>

          {/* Center on Pet */}
          <button 
            onClick={handleCenterPet}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(30, 36, 43, 0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#10B981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
            }}
            title={`Locate ${activePet.name}`}
          >
            <Footprints size={20} />
          </button>

          {/* Map Layer Style Picker */}
          <button 
            onClick={() => setShowStylePicker(!showStylePicker)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(30, 36, 43, 0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#10B981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
            }}
            title="Map Themes"
          >
            <Layers size={20} />
          </button>
        </div>

        {/* Style Picker Popup */}
        <AnimatePresence>
          {showStylePicker && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              style={{
                position: 'absolute',
                top: '290px',
                right: '16px',
                zIndex: 95,
                background: '#1A1F26',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '18px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
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
                    borderRadius: '10px',
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

        {/* ── 4. BOTTOM TELEMETRY PANEL (Exact replica of mobile app) ── */}
        <div 
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            zIndex: 90,
            background: 'rgba(22, 26, 32, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1.2px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Activity Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}
              >
                <Activity size={22} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ 
                  fontSize: '9.5px', 
                  fontWeight: 800, 
                  color: '#86868B', 
                  letterSpacing: '0.08em', 
                  textTransform: 'uppercase',
                  display: 'block'
                }}>
                  CURRENT ACTIVITY
                </span>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', display: 'block', marginTop: '2px' }}>
                  {currentActivity}
                </strong>
              </div>
            </div>

            {/* LIVE Badge */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
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

          {/* Telemetry Metric Boxes (Speed, Last Sync, Accuracy) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div 
              style={{
                background: '#222933',
                borderRadius: '16px',
                padding: '12px 6px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Gauge size={15} color="#10B981" />
              <strong style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>{speed}</strong>
              <span style={{ fontSize: '10.5px', color: '#86868B', fontWeight: 600 }}>Speed</span>
            </div>

            <div 
              style={{
                background: '#222933',
                borderRadius: '16px',
                padding: '12px 6px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Clock size={15} color="#10B981" />
              <strong style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>{lastSync}</strong>
              <span style={{ fontSize: '10.5px', color: '#86868B', fontWeight: 600 }}>Last Sync</span>
            </div>

            <div 
              style={{
                background: '#222933',
                borderRadius: '16px',
                padding: '12px 6px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Target size={15} color="#10B981" />
              <strong style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>{accuracy}</strong>
              <span style={{ fontSize: '10.5px', color: '#86868B', fontWeight: 600 }}>Accuracy</span>
            </div>
          </div>

          {/* Action Row: Play Sound & Refresh Movement */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={handlePlaySound}
              style={{
                flex: 1,
                background: isPlayingSound ? '#059669' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontWeight: 800,
                fontSize: '13px',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Volume2 size={18} />
              <span>PLAY SOUND</span>
            </button>

            <button 
              onClick={handleRefreshMovement}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#222933',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#10B981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
              title="Simulate Movement / Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

      </div>

      {/* ── PET SELECTOR PILLS (Switch between tracked pets) ── */}
      {pets && pets.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
          {pets.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPetId(p.id)}
              className="chip-pill"
              style={{
                background: selectedPetId === p.id ? 'var(--primary)' : 'var(--surface-alt)',
                color: selectedPetId === p.id ? '#FFFFFF' : 'var(--text-main)',
                borderColor: selectedPetId === p.id ? 'var(--primary)' : 'var(--border)',
                fontWeight: 700
              }}
            >
              <span>🐾 {p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
