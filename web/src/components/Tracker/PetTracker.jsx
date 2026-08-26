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
  MapPin,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleReveal } from '../Animations/AppleReveal';

const GOOGLE_MAPS_API_KEY = "AIzaSyAhmOHCWgWf7exFnjQ1nns8cDjPZvKRTto";

// Google Maps Custom Apple Dark/OLED Style
const googleMapsDarkTheme = [
  { elementType: "geometry", stylers: [{ color: "#12171E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#12171E" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#748092" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b9bb4" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#58a6ff" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#14251E" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#238636" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1F2834" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#171F29" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b949e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#293748" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1b2430" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#10B981" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1c232f" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0B1015" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#388bfd" }],
  },
];

export default function PetTracker() {
  const { pets, showToast } = useApp();
  
  // Tracked Pet
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || 'piku_01');
  const activePet = pets.find(p => p.id === selectedPetId) || pets[0] || {
    id: 'piku_01',
    name: 'Piku',
    breed: 'Dove / Ringneck',
    photo: 'assets/images/Pet_2.jpg'
  };

  // Telemetry & States
  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark', 'satellite', 'terrain'
  const [isSafeZone, setIsSafeZone] = useState(false);
  const [isLostMode, setIsLostMode] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [currentActivity, setCurrentActivity] = useState('Resting in Backyard');
  const [speed, setSpeed] = useState('2.4 km/h');
  const [lastSync, setLastSync] = useState('2m ago');
  const [accuracy, setAccuracy] = useState('98%');
  const [geofenceRadius, setGeofenceRadius] = useState(250);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState(false);

  // Lat/Lng Coordinates (Default: Dhaka Mirpur / DOHS neighborhood)
  const [petLatLng, setPetLatLng] = useState({ lat: 23.8103, lng: 90.4125 });
  const [userLatLng, setUserLatLng] = useState({ lat: 23.8120, lng: 90.4150 });

  const mapContainerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const petMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const geofenceCircleRef = useRef(null);

  // ── 1. LOAD GOOGLE MAPS JAVASCRIPT API SCRIPT ──
  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-script';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setGoogleMapsLoaded(true);
    };

    script.onerror = () => {
      console.warn('[Google Maps] Error loading Google Maps JS API. Falling back to internal HUD.');
      setGoogleMapsError(true);
    };

    document.head.appendChild(script);
  }, []);

  // ── 2. INITIALIZE GOOGLE MAP INSTANCE ──
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current || !window.google || !window.google.maps) return;

    try {
      const mapOptions = {
        center: petLatLng,
        zoom: 17,
        tilt: is3D ? 45 : 0,
        heading: is3D ? 25 : 0,
        mapTypeId: mapStyle === 'satellite' ? window.google.maps.MapTypeId.HYBRID : (mapStyle === 'terrain' ? window.google.maps.MapTypeId.TERRAIN : window.google.maps.MapTypeId.ROADMAP),
        styles: mapStyle === 'dark' ? googleMapsDarkTheme : null,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        backgroundColor: '#0B0F14'
      };

      const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
      googleMapInstanceRef.current = map;

      // Geofence Circle
      const circle = new window.google.maps.Circle({
        map: map,
        center: userLatLng,
        radius: geofenceRadius,
        strokeColor: isSafeZone ? '#10B981' : '#EF4444',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: isSafeZone ? '#10B981' : '#EF4444',
        fillOpacity: 0.08,
      });
      geofenceCircleRef.current = circle;

      // Home / User Marker
      const homeIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#0071E3',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5
      };
      userMarkerRef.current = new window.google.maps.Marker({
        position: userLatLng,
        map: map,
        icon: homeIcon,
        title: 'Home Base / Your Location'
      });

      // Custom Pet Avatar HTML Marker / Overlay
      class PetAvatarOverlay extends window.google.maps.OverlayView {
        constructor(position, petData, isSafe) {
          super();
          this.position = position;
          this.petData = petData;
          this.isSafe = isSafe;
          this.div = null;
        }

        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.cursor = 'pointer';
          div.style.transform = 'translate(-50%, -50%)';
          div.style.zIndex = '100';

          div.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <!-- Sonar Pulse Ring -->
              <div style="
                position: absolute;
                width: 90px;
                height: 90px;
                border-radius: 50%;
                border: 2px solid ${this.isSafe ? '#10B981' : '#EF4444'};
                opacity: 0.6;
                animation: sonarPulse 2s infinite ease-out;
              "></div>
              
              <!-- Avatar Circle -->
              <div style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: 3.5px solid ${this.isSafe ? '#10B981' : '#EF4444'};
                background: #0B0F14;
                box-shadow: 0 0 24px ${this.isSafe ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'}, 0 8px 24px rgba(0,0,0,0.6);
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <img src="${this.petData.photo || 'assets/images/Pet_2.jpg'}" alt="${this.petData.name}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>

              <!-- Name Pill -->
              <div style="
                position: absolute;
                bottom: -22px;
                background: rgba(11, 15, 20, 0.85);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.15);
                color: #FFF;
                font-size: 10.5px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 8px;
                white-space: nowrap;
              ">
                🐾 ${this.petData.name}
              </div>
            </div>
          `;

          this.div = div;
          const panes = this.getPanes();
          panes.overlayMouseTarget.appendChild(div);
        }

        draw() {
          const overlayProjection = this.getProjection();
          if (!overlayProjection || !this.div) return;
          const point = overlayProjection.fromLatLngToDivPixel(new window.google.maps.LatLng(this.position.lat, this.position.lng));
          if (point) {
            this.div.style.left = point.x + 'px';
            this.div.style.top = point.y + 'px';
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }

        setPosition(newPos, isSafe) {
          this.position = newPos;
          this.isSafe = isSafe;
          if (this.div) {
            this.onRemove();
            this.onAdd();
            this.draw();
          }
        }
      }

      const avatarOverlay = new PetAvatarOverlay(petLatLng, activePet, isSafeZone);
      avatarOverlay.setMap(map);
      petMarkerRef.current = avatarOverlay;

    } catch (err) {
      console.warn('[Google Maps] Initialization notice:', err);
    }
  }, [googleMapsLoaded, activePet]);

  // ── 3. SYNC MAP CONTROLS & UPDATES ──
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google || !window.google.maps) return;
    const map = googleMapInstanceRef.current;

    // Update Tilt
    map.setTilt(is3D ? 45 : 0);
    map.setHeading(is3D ? 25 : 0);

    // Update Map Type & Style
    if (mapStyle === 'satellite') {
      map.setMapTypeId(window.google.maps.MapTypeId.HYBRID);
      map.setOptions({ styles: null });
    } else if (mapStyle === 'terrain') {
      map.setMapTypeId(window.google.maps.MapTypeId.TERRAIN);
      map.setOptions({ styles: null });
    } else {
      map.setMapTypeId(window.google.maps.MapTypeId.ROADMAP);
      map.setOptions({ styles: googleMapsDarkTheme });
    }

    // Update Geofence Circle
    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.setRadius(geofenceRadius);
      geofenceCircleRef.current.setOptions({
        strokeColor: isSafeZone ? '#10B981' : '#EF4444',
        fillColor: isSafeZone ? '#10B981' : '#EF4444'
      });
    }

    // Update Pet Marker
    if (petMarkerRef.current && petMarkerRef.current.setPosition) {
      petMarkerRef.current.setPosition(petLatLng, isSafeZone);
    }
  }, [is3D, mapStyle, geofenceRadius, isSafeZone, petLatLng]);

  // Play Sound Buzzer (Web Audio API)
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

  // Movement Simulation
  const handleRefreshMovement = () => {
    setLastSync('Just now');
    const latDelta = (Math.random() - 0.5) * 0.0015;
    const lngDelta = (Math.random() - 0.5) * 0.0015;
    const newPos = { lat: 23.8103 + latDelta, lng: 90.4125 + lngDelta };
    setPetLatLng(newPos);

    const activities = ['Walking along Lane 6', 'Resting in Backyard', 'Exploring DOHS Bypass', 'Running in Garden'];
    const act = activities[Math.floor(Math.random() * activities.length)];
    setCurrentActivity(act);
    setSpeed((Math.random() * 3.5 + 0.5).toFixed(1) + ' km/h');

    // Check distance to user
    const distMeters = Math.sqrt(
      Math.pow((newPos.lat - userLatLng.lat) * 111000, 2) +
      Math.pow((newPos.lng - userLatLng.lng) * 111000, 2)
    );
    setIsSafeZone(distMeters <= geofenceRadius);

    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo(newPos);
    }

    showToast(`🔄 Telemetry synced: ${activePet.name} is ${act}`, 'success');
  };

  // Lost Mode
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
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo(petLatLng);
      googleMapInstanceRef.current.setZoom(17.5);
    }
    showToast(`🎯 Centered Google Map on ${activePet.name}`, 'info');
  };

  // Center on Home
  const handleCenterUser = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo(userLatLng);
      googleMapInstanceRef.current.setZoom(17);
    }
    showToast('📍 Centered on your position', 'info');
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
                <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>Google Maps high-rate telemetry active. Nearby Pet Maya community &amp; clinics notified.</p>
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
            <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Google Maps Telemetry</span>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 6px' }}>
              Live GPS Radar &amp; Telemetry
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Powered by Google Maps API: real-time satellite collar tracking, safe perimeter geofencing, and biometric sensors.
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
        
        {/* ── LEFT COLUMN: GOOGLE MAPS VIEWPORT ── */}
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
            {/* Top Floating App Bar */}
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

            {/* Google Map Container Element */}
            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
            />

            {/* Map Controls (3D, Center, Locate, Style) */}
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
                title="Toggle Google Maps 3D View"
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
                title="Google Map Styles"
              >
                <Layers size={18} />
              </button>
            </div>

            {/* Google Map Style Dropdown */}
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
                    { id: 'dark', label: 'Dark Roadmap' },
                    { id: 'satellite', label: 'Satellite Hybrid' },
                    { id: 'terrain', label: 'Terrain' }
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
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MapPin size={13} color="#10B981" />
              <span>{petLatLng.lat.toFixed(4)}° N, {petLatLng.lng.toFixed(4)}° E • Google Maps API Active</span>
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
                  <span className="badge badge-blue">Google Maps Lock</span>
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
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>Google Maps Safe Geofence</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interactive circle radius boundary</span>
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
