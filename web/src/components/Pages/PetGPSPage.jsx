import React, { useState, useEffect } from 'react';
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
  MapPin,
  Compass,
  Route,
  Signal,
  CheckCircle2,
  ChevronRight,
  Wifi,
  Heart,
  Plus,
  Bell,
  Sliders,
  Sparkles,
  PhoneCall,
  Headphones,
  Eye
} from 'lucide-react';

export default function PetGPSPage({ onNavigate }) {
  const { showToast, openModal } = useApp();

  // Map Mode State
  const [mapMode, setMapMode] = useState('paper'); // 'paper' | 'topo' | 'sat'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isChimeActive, setIsChimeActive] = useState(false);
  const [isAmberLostMode, setIsAmberLostMode] = useState(false);
  const [activeZone, setActiveZone] = useState('home');

  // Interactive Audio Acoustic Chime Synthesizer
  const triggerAcousticChime = () => {
    setIsChimeActive(true);
    showToast('🔊 85dB Acoustic Recovery Chime Emitted on Collar #HL-8821', 'info');

    // Web Audio API chirp
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.log('AudioContext unsupported', e);
    }

    setTimeout(() => {
      setIsChimeActive(false);
    }, 2500);
  };

  const toggleAmberMode = () => {
    const nextState = !isAmberLostMode;
    setIsAmberLostMode(nextState);
    if (nextState) {
      showToast('⚠️ AMBER LOST-MODE ACTIVATED: Continuous 1-Sec GNSS Burst + Mesh Beacon Broadcast', 'error');
    } else {
      showToast('Amber Lost-Mode deactivated. Standard 15s power-conserving cadence restored.', 'success');
    }
  };

  return (
    <div style={{
      backgroundColor: '#FAF7F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", sans-serif)',
      paddingBottom: '96px'
    }}>
      {/* ════════════════════════════════════════════════════════════════
          TOP SUB-HEADER & LIVE GNSS HARDWARE STATUS BAR
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        borderBottom: '1px solid #EBE4DF',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Left Title & Eyebrow */}
          <div>
            <div style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              color: '#707973',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              SAFETY INFRASTRUCTURE / HARDWARE TELEMETRY / <span style={{ color: '#346B73' }}>MAYA HALO V3 GNSS COLLAR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '26px',
                fontWeight: 600,
                color: '#160F0C',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Active Satellite Radar
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#E6F4F1',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#0D9488'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488', animation: 'pulse 1.8s infinite' }}></span>
                LIVE STREAM 10Hz
              </span>
            </div>
          </div>

          {/* Right 4 Hardware Status Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {/* Pill 1: GNSS Fix */}
            <div style={{
              backgroundColor: '#FAF7F5',
              border: '1px solid #E8E1DA',
              borderRadius: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Satellite size={16} color="#0D9488" />
              <div>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                  GNSS FIX
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C' }}>
                  Tri-Band • 14 Sats
                </div>
              </div>
            </div>

            {/* Pill 2: Battery State */}
            <div style={{
              backgroundColor: '#FAF7F5',
              border: '1px solid #E8E1DA',
              borderRadius: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Battery size={16} color="#0D9488" />
              <div>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                  BATTERY STATE
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C' }}>
                  89% (Est. 18 days)
                </div>
              </div>
            </div>

            {/* Pill 3: Cellular Signal */}
            <div style={{
              backgroundColor: '#FAF7F5',
              border: '1px solid #E8E1DA',
              borderRadius: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Radio size={16} color="#0D9488" />
              <div>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                  CELLULAR SIGNAL
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C' }}>
                  LTE-M & NB-IoT • -68 dBm
                </div>
              </div>
            </div>

            {/* Pill 4: Security */}
            <div style={{
              backgroundColor: '#FAF7F5',
              border: '1px solid #E8E1DA',
              borderRadius: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldCheck size={16} color="#0D9488" />
              <div>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                  SECURITY
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C' }}>
                  v3.4.1 SECURE
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '32px 24px 0 24px'
      }}>

        {/* ════════════════════════════════════════════════════════════════
            MAIN 2-COLUMN DASHBOARD (RADAR STAGE LEFT, TELEMETRY RIGHT)
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.75fr) minmax(340px, 1fr)',
          gap: '24px',
          alignItems: 'flex-start',
          marginBottom: '36px'
        }}>
          
          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN: RADAR MAP CANVAS & PHYSICAL COLLAR CONTROLS
              ───────────────────────────────────────────────────────────── */}
          <div>
            
            {/* Primary Map / Radar Canvas Box */}
            <div style={{
              backgroundColor: mapMode === 'sat' ? '#1A2328' : '#F5EFE9',
              backgroundImage: mapMode === 'paper' 
                ? 'radial-gradient(circle, #E6DDD4 1px, transparent 1px)' 
                : 'none',
              backgroundSize: '24px 24px',
              borderRadius: '24px',
              border: '1px solid #DFD7CF',
              height: '560px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0,0,0,0.04)',
              marginBottom: '16px'
            }}>
              
              {/* Polar Radar Range Rings & Crosshair Overlay (SVG) */}
              <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: 0.85
              }}>
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="radarGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(195, 182, 172, 0.25)" strokeWidth="0.8" />
                  </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#radarGrid)" />

                {/* Radar Polar Circles centered around (45%, 48%) */}
                <circle cx="45%" cy="48%" r="70" fill="none" stroke="rgba(195, 182, 172, 0.45)" strokeWidth="1" />
                <circle cx="45%" cy="48%" r="150" fill="none" stroke="rgba(195, 182, 172, 0.4)" strokeWidth="1" />
                <circle cx="45%" cy="48%" r="240" fill="none" stroke="#346B73" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
                <circle cx="45%" cy="48%" r="330" fill="none" stroke="rgba(195, 182, 172, 0.3)" strokeWidth="1" />

                {/* Compass Axes */}
                <line x1="45%" y1="0%" x2="45%" y2="100%" stroke="rgba(195, 182, 172, 0.35)" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="0%" y1="48%" x2="100%" y2="48%" stroke="rgba(195, 182, 172, 0.35)" strokeWidth="0.8" strokeDasharray="3 3" />

                {/* Diagonal Radials */}
                <line x1="10%" y1="10%" x2="80%" y2="86%" stroke="rgba(195, 182, 172, 0.2)" strokeWidth="0.8" />
                <line x1="10%" y1="86%" x2="80%" y2="10%" stroke="rgba(195, 182, 172, 0.2)" strokeWidth="0.8" />

                {/* Breadcrumb Trajectory Path from Home Hub to Milo */}
                <path
                  d="M 330 350 Q 380 320 460 260 T 540 180"
                  fill="none"
                  stroke="#346B73"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                
                {/* Historical Trail Dots */}
                <circle cx="330" cy="350" r="3" fill="#675C58" />
                <circle cx="380" cy="340" r="3" fill="#675C58" />
                <circle cx="430" cy="320" r="3" fill="#675C58" />
                <circle cx="470" cy="280" r="3" fill="#0D9488" />
                <circle cx="510" cy="230" r="3" fill="#0D9488" />
              </svg>

              {/* Compass Degree Markers */}
              <span style={{ position: 'absolute', top: '14px', left: '45%', transform: 'translateX(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', fontWeight: 600 }}>
                N 000°
              </span>
              <span style={{ position: 'absolute', top: '48%', right: '14px', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', fontWeight: 600 }}>
                E 090°
              </span>
              <span style={{ position: 'absolute', bottom: '14px', left: '45%', transform: 'translateX(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', fontWeight: 600 }}>
                S 180°
              </span>
              <span style={{ position: 'absolute', top: '48%', left: '14px', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', fontWeight: 600 }}>
                W 270°
              </span>

              {/* Safe-Zone Radius Pill on dashed circle */}
              <div style={{
                position: 'absolute',
                top: '74px',
                left: '45%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid #C8E5DF',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '9px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#346B73',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                HOME SANCTUARY SAFE-ZONE (350M RADIUS)
              </div>

              {/* Home Hub Base Station Marker */}
              <div style={{
                position: 'absolute',
                left: '37%',
                top: '46%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D6CDC5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 4px auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <Wifi size={16} color="#707973" />
                </div>
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: '#707973',
                  textTransform: 'uppercase'
                }}>
                  HOME HUB
                </span>
              </div>

              {/* Milo Live Animated Marker */}
              <div style={{
                position: 'absolute',
                left: '56%',
                top: '28%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
              }}>
                {/* Concentric Pulse Wave */}
                <div style={{
                  position: 'relative',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(13, 148, 136, 0.25)',
                    animation: 'radarPulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(13, 148, 136, 0.45)'
                  }} />
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#0D9488',
                    border: '2.5px solid #FFFFFF',
                    boxShadow: '0 0 10px #0D9488'
                  }} />
                </div>

                {/* Milo Floating Live Speed Pill */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  marginTop: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                  whiteSpace: 'nowrap'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                  <span>Milo • 1.1 km/h</span>
                </div>
              </div>

              {/* Top-Left Specimen Identifier Badge Overlay */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #DFD7CF',
                borderRadius: '16px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                zIndex: 10
              }}>
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&auto=format&fit=crop&q=80"
                  alt="Milo"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #0D9488'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C' }}>
                      Milo
                    </span>
                    <span style={{
                      backgroundColor: '#E6F4F1',
                      color: '#0D9488',
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      IN GEOFENCE
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#707973', fontFamily: 'var(--font-mono, monospace)' }}>
                    Golden Retriever • 28.4 kg • Collar #HL-8821
                  </div>
                </div>
              </div>

              {/* Top-Right Map Controls Overlay */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 10
              }}>
                {/* Map Mode Switcher */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #DFD7CF',
                  borderRadius: '9999px',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  {[
                    { id: 'paper', label: 'Paper Minimal' },
                    { id: 'topo', label: 'Topography' },
                    { id: 'sat', label: 'Satellite' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMapMode(m.id)}
                      style={{
                        backgroundColor: mapMode === m.id ? '#160F0C' : 'transparent',
                        color: mapMode === m.id ? '#FFFFFF' : '#707973',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Recenter & Compass Buttons */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #DFD7CF',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '3px'
                }}>
                  <button
                    onClick={() => showToast('Recentered on Milo GNSS Fix', 'info')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: '#160F0C',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Recenter"
                  >
                    <Target size={15} />
                  </button>
                  <button
                    onClick={() => showToast('Calibrated magnetic compass heading', 'info')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: '#160F0C',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Heading"
                  >
                    <Compass size={15} />
                  </button>
                </div>
              </div>

              {/* Bottom-Left Live GPS Coordinates */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #DFD7CF',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#160F0C',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 10
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
                23°47'38.2"N, 90°24'11.8"E • Accuracy: ±1.2m
              </div>

              {/* Bottom-Right Zoom Controls */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 10
              }}>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #DFD7CF',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#160F0C'
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #DFD7CF',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#160F0C'
                  }}
                >
                  −
                </button>
              </div>

            </div>

            {/* Emergency & Acoustic Action Bar (below radar) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              {/* Trigger Acoustic Chime Button */}
              <button
                onClick={triggerAcousticChime}
                style={{
                  backgroundColor: isChimeActive ? '#0D9488' : '#160F0C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(22, 15, 12, 0.14)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Volume2 size={16} className={isChimeActive ? 'animate-bounce' : ''} />
                <span>Trigger Acoustic 85dB Chime</span>
                <span>🔔</span>
              </button>

              {/* Vector Distance & Bearing Pill */}
              <div style={{
                backgroundColor: '#FAF7F5',
                border: '1px solid #EAE3DC',
                borderRadius: '12px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#675C58'
              }}>
                <span style={{ color: '#0D9488', fontWeight: 700 }}>↗</span>
                <div>
                  <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#707973' }}>
                    VECTOR DISTANCE & BEARING
                  </div>
                  <div style={{ fontWeight: 700, color: '#160F0C' }}>
                    42m North-East • Pacing 1.1 km/h
                  </div>
                </div>
              </div>

              {/* Amber Lost-Mode Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: isAmberLostMode ? '#DC2626' : '#160F0C' }}>
                    Amber Lost-Mode
                  </div>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                    Instant Broadcast
                  </div>
                </div>

                <button
                  onClick={toggleAmberMode}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '9999px',
                    backgroundColor: isAmberLostMode ? '#DC2626' : '#E2DAD3',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    padding: 0
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    top: '3px',
                    left: isAmberLostMode ? '23px' : '3px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
            </div>

            {/* 3 Hardware Spec Metric Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px'
            }}>
              {/* Card 1: Antenna Array */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Compass size={14} color="#0D9488" />
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                    ANTENNA ARRAY
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                  L1/L5 Dual-Band Helix
                </div>
              </div>

              {/* Card 2: Telemetry Interval */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <RefreshCw size={14} color="#0D9488" />
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                    TELEMETRY INTERVAL
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                  10-Second Continuous Burst
                </div>
              </div>

              {/* Card 3: Speed Vector */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Gauge size={14} color="#0D9488" />
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                    SPEED VECTOR
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                  Casual Gait • 0.31 m/s
                </div>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN: COLLAR TELEMETRY, SAFE-ZONES & TIMELINE
              ───────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. Power & Energetics Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="#0D9488" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Power & Energetics
                  </h3>
                </div>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  color: '#707973',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  SOLAR HYBRID
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#160F0C', letterSpacing: '-0.02em' }}>
                    89%
                  </span>
                  <span style={{ fontSize: '12px', color: '#707973' }}>remaining</span>
                </div>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 700 }}>
                  +0.4W/hr Trickle
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#EBE4DF',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '89%',
                  height: '100%',
                  backgroundColor: '#0D9488',
                  borderRadius: '9999px'
                }} />
              </div>

              {/* 2 Sub-Tiles */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '12px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', marginBottom: '2px' }}>
                    EST. AUTONOMOUS LIFE
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                    18 Days 4 Hours
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '12px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', marginBottom: '2px' }}>
                    PING CADENCE
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                    15s Safe-Zone Tier
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Physiological Vitals Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="#0D9488" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Physiological Vitals
                  </h3>
                </div>
                <span style={{
                  backgroundColor: '#E6F4F1',
                  color: '#0D9488',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  ALL NORMAL
                </span>
              </div>

              {/* 2x2 Grid of Vitals */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                {/* Vital 1: Resting HR */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '14px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase' }}>
                      RESTING HR
                    </span>
                    <Heart size={13} color="#E11D48" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                    68 <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>BPM</span>
                  </div>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                    Canine Norm: 60-100
                  </div>
                </div>

                {/* Vital 2: Sub-Dermal Temp */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '14px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase' }}>
                      SUB-DERMAL TEMP
                    </span>
                    <Thermometer size={13} color="#D97706" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                    38.3° <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>Celsius</span>
                  </div>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                    Optimum Homeostasis
                  </div>
                </div>

                {/* Vital 3: Activity Index */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '14px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase' }}>
                      ACTIVITY INDEX
                    </span>
                    <Footprints size={13} color="#0D9488" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                    4, 820 <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>steps</span>
                  </div>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                    72% of daily target
                  </div>
                </div>

                {/* Vital 4: Scratch / Shake */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '14px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase' }}>
                      SCRATCH / SHAKE
                    </span>
                    <Eye size={13} color="#675C58" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                    2% <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>score</span>
                  </div>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                    Dermatological Low
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Safe-Zone Governance Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#0D9488" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    Safe-Zone Governance
                  </h3>
                </div>
                <button
                  onClick={() => showToast('New Safe-Zone setup polygon wizard initialized', 'info')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#346B73',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  + New Zone
                </button>
              </div>

              {/* Zone List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {/* Zone 1: Home Sanctuary */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                        Home Sanctuary Zone
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                        Radius 350m • Wi-Fi Beacon Linked
                      </div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: '#E6F4F1',
                    color: '#0D9488',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px'
                  }}>
                    Active Now
                  </span>
                </div>

                {/* Zone 2: Gulshan Park */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#A09893' }}></span>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                        Gulshan Park Zone
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                        Automated Schedule • 06:00 - 09:00
                      </div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: '#EAE3DC',
                    color: '#675C58',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '9999px'
                  }}>
                    Standby
                  </span>
                </div>
              </div>

              {/* Breach Alerts Footer */}
              <div style={{
                fontSize: '11px',
                color: '#707973',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px'
              }}>
                <span>Breach Alerts:</span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#160F0C' }}>
                  ✉ SMS (2 Parents) • 📱 Push
                </span>
              </div>
            </div>

            {/* 4. 12-Hour Journey Trail Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Route size={16} color="#0D9488" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C', margin: 0 }}>
                    12-Hour Journey Trail
                  </h3>
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#707973',
                  fontWeight: 700
                }}>
                  TODAY
                </span>
              </div>

              {/* Timeline Scrub Bar */}
              <div style={{
                backgroundColor: '#FAF7F5',
                border: '1px solid #EAE3DC',
                borderRadius: '10px',
                padding: '8px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#707973'
              }}>
                <span>06:00 AM</span>
                <span style={{ color: '#0D9488', fontWeight: 700 }}>
                  Scrubbing: 02:45 PM (Backyard)
                </span>
                <span>NOW</span>
              </div>

              {/* Event Timeline List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Event 1 */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#675C58', marginTop: '4px' }}></span>
                    <div style={{ width: '1px', flex: 1, backgroundColor: '#EAE3DC', marginTop: '4px' }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                      Morning Perimeter Walk (1.8 km)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#707973', fontFamily: 'var(--font-mono, monospace)' }}>
                      07:15 AM - 08:02 AM • Normal Cadence
                    </div>
                  </div>
                </div>

                {/* Event 2 */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#675C58', marginTop: '4px' }}></span>
                    <div style={{ width: '1px', flex: 1, backgroundColor: '#EAE3DC', marginTop: '4px' }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                      Deep Rest at Living Vault
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#707973', fontFamily: 'var(--font-mono, monospace)' }}>
                      09:30 AM - 01:10 PM • Sleep Cycle Restorative
                    </div>
                  </div>
                </div>

                {/* Event 3 */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0D9488', marginTop: '4px' }}></span>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                      Afternoon Backyard Lawn Exploration
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#0D9488', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                      02:15 PM - Present • Speed: 1.1 km/h
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════════
            BOTTOM HARDWARE CERTIFICATIONS & CLINICAL CONCIERGE BAR
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EBE4DF',
          borderRadius: '20px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          {/* 4 Hardware Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FAF7F5',
              border: '1px solid #EAE3DC',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#346B73'
            }}>
              <ShieldCheck size={13} color="#0D9488" />
              IP68 Submersible 30m
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FAF7F5',
              border: '1px solid #EAE3DC',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#346B73'
            }}>
              <Zap size={13} color="#0D9488" />
              Wireless Qi Inductive Charging
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FAF7F5',
              border: '1px solid #EAE3DC',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#346B73'
            }}>
              <ShieldCheck size={13} color="#0D9488" />
              AAHA Safety Compliant
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FAF7F5',
              border: '1px solid #EAE3DC',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: '#346B73'
            }}>
              <ShieldCheck size={13} color="#0D9488" />
              38g Aero Titanium Clasp
            </span>
          </div>

          {/* Right Concierge Action Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C' }}>
                Need collar fitting or telemetry diagnosis?
              </div>
              <div style={{ fontSize: '10.5px', color: '#707973', fontFamily: 'var(--font-mono, monospace)' }}>
                Clinical hardware engineers ready 24/7
              </div>
            </div>

            <button
              onClick={() => showToast('Direct Hardware Concierge channel connected (Toll-Free 24/7)', 'info')}
              style={{
                backgroundColor: '#FAF7F5',
                border: '1px solid #D6CDC5',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#160F0C',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Headphones size={15} color="#346B73" />
              <span>Contact Hardware Concierge</span>
            </button>
          </div>

        </div>

      </div>

      {/* Embedded Animations Style */}
      <style>{`
        @keyframes radarPulse {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
