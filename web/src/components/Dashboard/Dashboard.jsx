import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Calendar, 
  ChevronRight, 
  Bell, 
  Star, 
  Clock, 
  Radio, 
  Sparkles, 
  Syringe, 
  ShoppingBag, 
  Users, 
  FileText, 
  Briefcase, 
  History,
  Activity,
  Heart,
  Thermometer,
  Moon,
  Footprints,
  PhoneCall,
  ShieldCheck,
  Zap,
  MapPin,
  Volume2,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Pill,
  ExternalLink,
  Repeat,
  Scale,
  Smile,
  Truck,
  FlaskConical,
  Wifi,
  Lock
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const { 
    pets = [], 
    vets = [], 
    appointments = [], 
    medicalRecords = [],
    devices = [], 
    setActiveTab, 
    openModal, 
    showToast 
  } = useApp();
  const { currentUser } = useAuth();

  const guardianDisplayName = currentUser?.name || currentUser?.displayName || 'Pet Guardian';
  const activePet = pets[0] || {
    name: 'Companion',
    breed: 'Companion',
    id: 'placeholder',
    name: 'Maya',
    breed: 'Golden Retriever',
    weight: '15.0',
    age: '3 yrs',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80',
    microchip: 'UNREGISTERED'
  };
  const activeDevice = devices[0] || {
    collarId: 'HALO-BLE',
    batteryLevel: 92
  };
  const nextAppt = appointments.find(a => a.status === 'confirmed' || a.status === 'upcoming') || appointments[0] || null;

  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else if (setActiveTab) setActiveTab(path);
    else window.location.hash = path.replace('/', '');
  };

  // Sound Tone Simulation
  const handleSoundTone = () => {
    showToast(`🔊 Acoustic Chime Emitted on Collar #${activeDevice.collarId || activeDevice.id || 'HALO'}`, 'info');
    showToast(`🔊 Acoustic Chime Emitted on Collar #${activeDevice?.collarId || activeDevice?.id || 'HALO'}`, 'info');
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1840, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  return (
    <div style={{
      backgroundColor: '#FAF7F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", sans-serif)',
      paddingBottom: '96px'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '36px 24px 0 24px'
      }}>
        
        {/* ════════════════════════════════════════════════════════════════
            1. TOP HEADER & USER GREETING
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              color: '#707973',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
              <span>TELEMETRY SYNCED • 2M AGO</span>
              <span>|</span>
              <span style={{ color: '#346B73' }}>EHR: PM-8820-DH</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(30px, 3.5vw, 40px)',
              fontWeight: 600,
              color: '#160F0C',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              Good morning{guardianDisplayName ? `, ${guardianDisplayName}` : ''}.
            </h1>

            <p style={{
              fontSize: '13px',
              color: '#675C58',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: '620px'
            }}>
              {activePet.name}'s clinical vitals and preventative schedule are fully in sync. Zero acute anomalies detected in the last 72 hours.
            </p>
          </div>

          {/* Emergency Trauma Dispatch Pill */}
          <button
            onClick={() => showToast('Direct 24/7 Clinical Emergency Trauma Dispatch Connected: +1 (800) 555-0198', 'error')}
            style={{
              backgroundColor: '#FBEBE8',
              border: '1px solid #F5C6BE',
              borderRadius: '9999px',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: '#9E3A1A',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 2px 8px rgba(158, 58, 26, 0.06)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E11D48', animation: 'pulse 1.5s infinite' }}></span>
            <span>EMERGENCY TRAUMA DISPATCH</span>
            <span style={{ color: '#C2410C' }}>|</span>
            <span>24/7 Clinical Line</span>
            <PhoneCall size={14} color="#9E3A1A" />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            2. ACTIVE COMPANION BANNER
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EBE4DF',
          borderRadius: '24px',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}>
          {/* Companion Info Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={activePet.photo || activePet.image || "https://images.unsplash.com/photo-1552053831-71594a27632d?w=160&auto=format&fit=crop&q=80"}
                alt={activePet.name}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #0D9488'
                }}
              />
              <span style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                backgroundColor: '#0D9488',
                borderRadius: '50%',
                border: '2px solid #FFFFFF'
              }}></span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#160F0C',
                  margin: 0
                }}>
                  {activePet.name}
                </h2>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  color: '#675C58',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  {activePet.breed || activePet.species || 'Companion'}
                </span>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  color: '#675C58',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  Verified Companion
                </span>
              </div>

              <div style={{
                fontSize: '11.5px',
                color: '#707973',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <span>{activePet.weight ? `${activePet.weight} kg (Ideal)` : 'Weight Recorded'}</span>
                <span>•</span>
                <span>{activePet.age || 'Adult'}</span>
                <span>•</span>
                <button
                  onClick={() => {
                    const chip = activePet.microchip || 'UNREGISTERED';
                    if (chip !== 'UNREGISTERED') {
                      navigator.clipboard.writeText(chip);
                      showToast(`Microchip #${chip} copied to clipboard`, 'success');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#0D9488',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>● Microchip: #{activePet.microchip || 'UNREGISTERED'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Health Score & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: '#FAF7F5',
              border: '1px solid #EAE3DC',
              borderRadius: '9999px',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                HEALTH INDEX:
              </span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>
                96 <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>/ 100</span>
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
                OPTIMAL
              </span>
            </div>

            <button
              onClick={() => showToast(`Switched to ${activePet.name} active telemetry profile`, 'info')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FAF7F5',
                border: '1px solid #EAE3DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#675C58'
              }}
              title="Switch Pet"
            >
              <Repeat size={15} />
            </button>

            <button
              onClick={() => openModal('addPet')}
              style={{
                backgroundColor: '#FAF7F5',
                border: '1px solid #D6CDC5',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#160F0C',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} />
              <span>Add Pet</span>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            3. QUICK ACTION FEATURE LAUNCHPAD (6 CARDS IN 1 ROW)
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '36px'
        }}>
          {[
            {
              category: 'CLINICAL',
              title: 'Book Visit & Teleconsult',
              icon: StethoscopeIcon,
              route: 'specialists',
              accent: '#346B73'
            },
            {
              category: 'DIAGNOSTIC',
              title: 'AI Vision Triage Check',
              icon: Sparkles,
              route: 'ai',
              accent: '#0D9488'
            },
            {
              category: 'DISPENSARY',
              title: 'Order Care Formulary',
              icon: ShoppingBag,
              route: 'shop',
              accent: '#346B73'
            },
            {
              category: 'TELEMETRY',
              title: 'Live Collar GPS Radar',
              icon: Radio,
              route: 'pet-gps',
              accent: '#0D9488'
            },
            {
              category: 'IDENTITY',
              title: 'Digital Pet Passport',
              icon: FileText,
              route: 'digital-pet-passport',
              accent: '#346B73'
            },
            {
              category: 'PROPHYLAXIS',
              title: 'Vaccine & Pill Reminders',
              icon: Bell,
              route: 'vaccines',
              accent: '#346B73'
            }
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleRoute(item.route)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EBE4DF',
                  borderRadius: '18px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '110px'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <IconComp size={16} color={item.accent} />
                </div>

                <div>
                  <div style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    color: item.category === 'DIAGNOSTIC' ? '#0D9488' : '#707973',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '2px'
                  }}>
                    {item.category}
                  </div>
                  <div style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#160F0C',
                    lineHeight: 1.3
                  }}>
                    {item.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            4. MAIN 3-COLUMN CLINICAL TELEMETRY SECTION
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'flex-start',
          marginBottom: '40px'
        }}>
        }} className="dashboard-main-grid">
          
          {/* ─────────────────────────────────────────────────────────────
              COLUMN 1 (LEFT): BIOMETRIC COMPOSITE - REAL-TIME VITALS
              ───────────────────────────────────────────────────────────── */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#707973', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  BIOMETRIC COMPOSITE
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#160F0C',
                  margin: 0
                }}>
                  Real-Time Vitals
                </h3>
              </div>

              <span style={{
                backgroundColor: '#E6F4F1',
                color: '#0D9488',
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
                Live Stream
              </span>
            </div>

            {/* Top Score Card: Cardiopulmonary & Kinetic Equilibrium */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                {/* Circular Score Gauge */}
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  border: '4px solid #0D9488',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: '#F0F8F6'
                }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#160F0C', lineHeight: 1 }}>
                    96
                  </span>
                  <span style={{ fontSize: '7.5px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#0D9488', marginTop: '2px' }}>
                    OPTIMAL
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', margin: '0 0 4px 0' }}>
                    Cardiopulmonary & Kinetic Equilibrium
                  </h4>
                  <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#675C58', margin: 0 }}>
                    Biometric markers indicate peak musculoskeletal stamina and undisturbed slow-wave sleep cycles.
                  </p>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #F3EFEA',
                paddingTop: '8px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#346B73',
                fontWeight: 600
              }}>
                Validated by Maya AI Clinical Model v3.9
              </div>
            </div>

            {/* 4-Tile Vitals Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '14px'
            }}>
              {/* Tile 1: Resting Pulse */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                    RESTING PULSE
                  </span>
                  <Heart size={13} color="#E11D48" />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                  68 <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>BPM</span>
                </div>
                <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                  Canine Norm: 60-100
                </div>
              </div>

              {/* Tile 2: Body Temp */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                    BODY TEMP
                  </span>
                  <Thermometer size={13} color="#D97706" />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                  38.3 <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>°C</span>
                </div>
                <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                  Euthermic (38.0-39.2°C)
                </div>
              </div>

              {/* Tile 3: Kinetic Index */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                    KINETIC INDEX
                  </span>
                  <Footprints size={13} color="#0D9488" />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                  9, 480 <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>/ 12k</span>
                </div>
                <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                  Target Met
                </div>
              </div>

              {/* Tile 4: Sleep Rest */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 600 }}>
                    SLEEP REST
                  </span>
                  <Moon size={13} color="#675C58" />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                  9.2 <span style={{ fontSize: '11px', fontWeight: 400, color: '#707973' }}>hrs</span>
                </div>
                <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', color: '#0D9488', fontWeight: 600 }}>
                  6h Deep Slow-Wave
                </div>
              </div>
            </div>

            {/* 6-Month Weight Trajectory Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '18px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#707973', textTransform: 'uppercase', fontWeight: 700 }}>
                  6-MONTH WEIGHT TRAJECTORY
                </div>
                <span style={{ fontSize: '10.5px', color: '#346B73', fontWeight: 600, cursor: 'pointer' }}>
                  Full History ↗
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#160F0C' }}>
                  28.4 kg
                </span>
                <span style={{
                  backgroundColor: '#E6F4F1',
                  color: '#0D9488',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Standard Deviation: ±0.4 kg
                </span>
              </div>

              {/* Smooth Bezier Weight Curve Chart */}
              <div style={{ height: '80px', width: '100%', position: 'relative' }}>
                <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Reference dashed baseline */}
                  <line x1="0" y1="40" x2="300" y2="40" stroke="#EAE3DC" strokeDasharray="3 3" strokeWidth="1" />

                  {/* Area fill */}
                  <path
                    d="M 10 55 Q 60 48 110 44 T 210 38 T 290 35 L 290 80 L 10 80 Z"
                    fill="url(#weightGrad)"
                  />

                  {/* Line */}
                  <path
                    d="M 10 55 Q 60 48 110 44 T 210 38 T 290 35"
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="2.5"
                  />

                  {/* Data points */}
                  <circle cx="10" cy="55" r="3" fill="#0D9488" />
                  <circle cx="65" cy="50" r="3" fill="#0D9488" />
                  <circle cx="120" cy="44" r="3" fill="#0D9488" />
                  <circle cx="175" cy="41" r="3" fill="#0D9488" />
                  <circle cx="230" cy="38" r="3" fill="#0D9488" />
                  <circle cx="290" cy="35" r="4.5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </div>

              {/* Month Axis Labels */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#707973',
                marginTop: '4px'
              }}>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span style={{ color: '#0D9488', fontWeight: 700 }}>Oct [Current]</span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              COLUMN 2 (MIDDLE): PROPHYLAXIS & CARE - CLINICAL AGENDA
              ───────────────────────────────────────────────────────────── */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#707973', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  PROPHYLAXIS & CARE
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#160F0C',
                  margin: 0
                }}>
                  Clinical Agenda
                </h3>
              </div>

              <Calendar size={18} color="#707973" />
            </div>

            {/* Confirmed Appointment Card */}
            {nextAppt ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '20px',
                padding: '22px',
                marginBottom: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    backgroundColor: '#E6F4F1',
                    color: '#0D9488',
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {nextAppt.status ? nextAppt.status.toUpperCase() : 'UPCOMING'}
                  </span>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                    {nextAppt.date || 'Scheduled'}
                  </span>
                </div>
                <h4 style={{
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#160F0C',
                  margin: '0 0 2px 0'
                }}>
                  {nextAppt.doctor || nextAppt.vetName || 'Specialist Clinician'}
                </h4>
                <div style={{ fontSize: '11.5px', color: '#675C58', marginBottom: '14px' }}>
                  {nextAppt.notes || nextAppt.type || 'Veterinary Consultation'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', fontSize: '11.5px', color: '#160F0C' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={13} color="#0D9488" />
                    <span>{nextAppt.date} • {nextAppt.time || '10:00 AM'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={13} color="#0D9488" />
                    <span>{nextAppt.clinic || 'Pet Maya Clinical Center, Dhaka'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => showToast('Check-in documents and digital intake questionnaire prepared', 'success')}
                    style={{
                      flex: 1,
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '9px 14px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Prepare Check-In
                  </button>
                  <button
                    onClick={() => handleRoute('specialists')}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D6CDC5',
                      borderRadius: '9999px',
                      padding: '9px 14px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#160F0C',
                      cursor: 'pointer'
                    }}
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE4DF',
                borderRadius: '20px',
                padding: '24px 20px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <Calendar size={28} color="#DFE8E5" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C', marginBottom: '4px' }}>No Upcoming Consultations</div>
                <div style={{ fontSize: '11.5px', color: '#8C827A', marginBottom: '14px' }}>Schedule a clinical video consult or in-person visit.</div>
                <button
                  onClick={() => handleRoute('specialists')}
                  style={{
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 18px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Book Specialist
                </button>
              </div>
            )}

            {/* Active Pharmacy Formulary Section */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#707973',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                ACTIVE PHARMACY FORMULARY
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {medicalRecords.filter(r => r.type === 'prescription' || r.type === 'vaccine' || r.type === 'medication').slice(0, 2).map((rec) => (
                  <div key={rec.id} style={{
                    backgroundColor: '#FAF7F5',
                    border: '1px solid #EAE3DC',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#E6F4F1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {rec.type === 'vaccine' ? <Syringe size={16} color="#0D9488" /> : <Pill size={16} color="#0D9488" />}
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>
                          {rec.title || rec.name || 'Prescription Medication'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#707973' }}>
                          {rec.dosage || rec.notes || rec.date || 'Active prescription'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: '#E6F4F1',
                        color: '#0D9488',
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        Active
                      </span>
                    </div>
                  </div>
                ))}
                {medicalRecords.filter(r => r.type === 'prescription' || r.type === 'vaccine' || r.type === 'medication').length === 0 && (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#8C827A', fontSize: '11.5px' }}>
                    No active prescriptions in EHR. Visit the dispensary to browse formulations.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              COLUMN 3 (RIGHT): TELEMETRY NODE - MAYA HALO™ COLLAR
              ───────────────────────────────────────────────────────────── */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#707973', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  TELEMETRY NODE
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#160F0C',
                  margin: 0
                }}>
                  Maya Halo™ Collar
                </h3>
              </div>

              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0D9488' }}></span>
            </div>

            {/* Radar Mini Map Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE4DF',
              borderRadius: '20px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              {/* Mini Map Canvas Staging */}
              <div
                onClick={() => handleRoute('pet-gps')}
                style={{
                  height: '140px',
                  borderRadius: '14px',
                  backgroundColor: '#EBE5DE',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  marginBottom: '14px',
                  border: '1px solid #DFD7CF'
                }}
              >
                {/* SVG Mini Map Grid */}
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                  <circle cx="50%" cy="50%" r="55" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
                  <circle cx="50%" cy="50%" r="30" fill="rgba(13, 148, 136, 0.1)" />
                  <circle cx="50%" cy="50%" r="6" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                </svg>

                {/* Overlay Pin Pill */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(6px)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#346B73',
                  fontWeight: 700
                }}>
                  HOME SANCTUARY GEOFENCE (350M)
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700
                }}>
                  ● {activePet.name} • Indoors
                </div>
              </div>

              {/* Status Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#707973' }}>Sanctuary Perimeter:</span>
                  <span style={{ fontWeight: 700, color: '#160F0C' }}>Safe • Indoors</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#707973' }}>Hardware Battery:</span>
                  <span style={{ fontWeight: 700, color: '#0D9488' }}>🔋 {activeDevice.batteryLevel ?? 92}% (6.5 days)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#707973' }}>Cellular Uplink:</span>
                  <span style={{ fontWeight: 700, color: '#0D9488' }}>LTE-M • High Sync</span>
                </div>
              </div>

              {/* Sound Collar Tone Button */}
              <button
                onClick={handleSoundTone}
                style={{
                  width: '100%',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #D6CDC5',
                  borderRadius: '12px',
                  padding: '9px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#160F0C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Volume2 size={14} color="#346B73" />
                <span>Sound Collar Tone</span>
              </button>
            </div>

            {/* Seasonal Care Advisory Card */}
            <div style={{
              backgroundColor: '#EFF7F5',
              border: '1px solid #C8E5DF',
              borderRadius: '20px',
              padding: '18px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#0D9488',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>🌿</span>
                <span>SEASONAL CARE ADVISORY</span>
              </div>

              <p style={{ fontSize: '11.5px', lineHeight: 1.55, color: '#52625D', margin: '0 0 10px 0' }}>
                High ambient pollen counts logged in your precinct this week. Inspect {activePet.name}'s interdigital paws and outer pinnae following morning walks.
              </p>

              <a
                href="#blog"
                onClick={(e) => { e.preventDefault(); handleRoute('blog'); }}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0D9488',
                  textDecoration: 'none'
                }}
              >
                Read Seasonal Canine Bulletin ↗
              </a>
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════════
            5. BOTTOM SECTION: LONGITUDINAL MEDICAL VAULT
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EBE4DF',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <div style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: '#707973',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                LONGITUDINAL MEDICAL VAULT
              </div>
              <h3 style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '22px',
                fontWeight: 600,
                color: '#160F0C',
                margin: 0
              }}>
                Recent Care Journal & Events
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => showToast(`Exported ${activePet.name} Certified EHR Dossier (PDF)`, 'success')}
                style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #D6CDC5',
                  borderRadius: '9999px',
                  padding: '8px 16px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#160F0C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={13} color="#346B73" />
                <span>Download Certified EHR (PDF)</span>
              </button>

              <button
                onClick={() => showToast('Filter options toggled', 'info')}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #D6CDC5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#675C58'
                }}
                title="Filter"
              >
                <Filter size={14} />
              </button>
            </div>
          </div>

          {/* Timeline Event Cards from Medical Records */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {medicalRecords.slice(0, 4).map((record, i) => (
              <div
                key={record.id || i}
                style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE3DC',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '720px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#E6F4F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Activity size={18} color="#0D9488" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                        {record.title || record.type || 'Clinical Record'}
                      </span>
                      <span style={{
                        backgroundColor: '#EBE4DF',
                        color: '#675C58',
                        fontSize: '9.5px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {record.badge || record.category || 'Vault Record'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#675C58', margin: 0 }}>
                      {record.notes || record.desc || record.diagnosis || 'Recorded in Pet Maya Health Vault.'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#160F0C' }}>
                    {record.date || record.timestamp || 'Recorded'}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#707973' }}>
                    {record.attestation || record.vetName || 'EHR Verified'}
                  </div>
                </div>
              </div>
            ))}
            {medicalRecords.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#FAF7F5', borderRadius: '16px', border: '1px solid #EAE3DC' }}>
                <Activity size={24} color="#C4DCD6" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#160F0C' }}>No clinical vault events yet</div>
                <div style={{ fontSize: '11.5px', color: '#8C827A', marginTop: '2px' }}>Consultation notes, prescriptions, and lab panels will appear here automatically.</div>
              </div>
            )}
          </div>

          {/* View All Records Link */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => handleRoute('digital-pet-passport')}
              style={{
                background: 'none',
                border: 'none',
                color: '#346B73',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)'
              }}
            >
              View all {medicalRecords.length} historical records in Vault ↗
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Stethoscope Helper Component
function StethoscopeIcon({ size = 16, color = "#346B73" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
