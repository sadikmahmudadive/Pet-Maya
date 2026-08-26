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
  Compass,
  Flame,
  Route,
  Signal,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Cpu,
  Wifi,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleReveal } from '../Animations/AppleReveal';

const GOOGLE_MAPS_API_KEY = "AIzaSyAhmOHCWgWf7exFnjQ1nns8cDjPZvKRTto";

// Google Maps Custom Apple Dark/OLED Style
const googleMapsDarkTheme = [
  { elementType: "geometry", stylers: [{ color: "#11161D" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#11161D" }] },
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
    stylers: [{ color: "#13231B" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#238636" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1E2733" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#161E27" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b949e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#273545" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a232e" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#10B981" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a212c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#090E13" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#388bfd" }],
  },
];

export default function PetTracker() {
  const { pets, showToast } = useApp();
  
  // Tracked Pet Selection
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || 'piku_01');
  const activePet = pets.find(p => p.id === selectedPetId) || pets[0] || {
    id: 'piku_01',
    name: 'Piku',
    breed: 'Dove / Ringneck',
    photo: 'assets/images/Pet_2.jpg'
  };

  // Right Deck Tab Navigation: 'activity', 'geofence', 'hardware'
  const [activeDeckTab, setActiveDeckTab] = useState('activity');

  // Telemetry & Settings
  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark', 'satellite', 'terrain'
  const [isSafeZone, setIsSafeZone] = useState(false);
  const [isLostMode, setIsLostMode] = useState(false);
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [currentActivity, setCurrentActivity] = useState('Resting in Backyard');
  const [speed, setSpeed] = useState(2.4);
  const [steps, setSteps] = useState(4820);
  const [calories, setCalories] = useState(285);
  const [lastSync, setLastSync] = useState('2m ago');
  const [accuracy, setAccuracy] = useState('98%');
  const [geofenceRadius, setGeofenceRadius] = useState(250);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Lat/Lng Coordinates
  const [petLatLng, setPetLatLng] = useState({ lat: 23.8103, lng: 90.4125 });
  const [userLatLng, setUserLatLng] = useState({ lat: 23.8120, lng: 90.4150 });
  const [breadcrumbs, setBreadcrumbs] = useState([
    { lat: 23.8095, lng: 90.4110 },
    { lat: 23.8099, lng: 90.4118 },
    { lat: 23.8103, lng: 90.4125 }
  ]);

  const mapContainerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const petMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const breadcrumbPolylineRef = useRef(null);
  const autoWalkIntervalRef = useRef(null);

  // ── 1. DYNAMICALLY LOAD GOOGLE MAPS API ──
  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    script.onerror = () => console.warn('[Google Maps] Script load fallback active.');
    document.head.appendChild(script);
  }, []);

  // ── 2. INITIALIZE GOOGLE MAPS INSTANCE ──
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current || !window.google || !window.google.maps) return;

    try {
      const mapOptions = {
        center: petLatLng,
        zoom: 17.2,
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
        strokeOpacity: 0.65,
        strokeWeight: 2,
        fillColor: isSafeZone ? '#10B981' : '#EF4444',
        fillOpacity: 0.08,
      });
      geofenceCircleRef.current = circle;

      // Home Marker
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
        title: 'Home Base / User Location'
      });

      // Breadcrumbs Trail Polyline
      const polyline = new window.google.maps.Polyline({
        path: breadcrumbs,
        geodesic: true,
        strokeColor: '#10B981',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map: showBreadcrumbs ? map : null
      });
      breadcrumbPolylineRef.current = polyline;

      // Custom Pet Avatar HTML Marker
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
                width: 62px;
                height: 62px;
                border-radius: 50%;
                border: 3.5px solid ${this.isSafe ? '#10B981' : '#EF4444'};
                background: #0B0F14;
                box-shadow: 0 0 26px ${this.isSafe ? 'rgba(16, 185, 129, 0.75)' : 'rgba(239, 68, 68, 0.75)'}, 0 8px 24px rgba(0,0,0,0.6);
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
                background: rgba(11, 15, 20, 0.88);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.15);
                color: #FFF;
                font-size: 11px;
                font-weight: 800;
                padding: 3px 9px;
                border-radius: 8px;
                white-space: nowrap;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
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
      console.warn('[Google Maps] Init notice:', err);
    }
  }, [googleMapsLoaded, activePet]);

  // ── 3. SYNC MAP SETTINGS & PROPERTIES ──
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google || !window.google.maps) return;
    const map = googleMapInstanceRef.current;

    map.setTilt(is3D ? 45 : 0);
    map.setHeading(is3D ? 25 : 0);

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

    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.setRadius(geofenceRadius);
      geofenceCircleRef.current.setOptions({
        strokeColor: isSafeZone ? '#10B981' : '#EF4444',
        fillColor: isSafeZone ? '#10B981' : '#EF4444'
      });
    }

    if (breadcrumbPolylineRef.current) {
      breadcrumbPolylineRef.current.setPath(breadcrumbs);
      breadcrumbPolylineRef.current.setMap(showBreadcrumbs ? map : null);
    }

    if (petMarkerRef.current && petMarkerRef.current.setPosition) {
      petMarkerRef.current.setPosition(petLatLng, isSafeZone);
    }
  }, [is3D, mapStyle, geofenceRadius, isSafeZone, petLatLng, breadcrumbs, showBreadcrumbs]);

  // ── 4. AUTO-WALK SIMULATOR LOOP ──
  useEffect(() => {
    if (isAutoWalking) {
      autoWalkIntervalRef.current = setInterval(() => {
        setPetLatLng(prev => {
          const latDelta = (Math.random() - 0.45) * 0.0003;
          const lngDelta = (Math.random() - 0.45) * 0.0003;
          const newPos = { lat: prev.lat + latDelta, lng: prev.lng + lngDelta };

          setBreadcrumbs(b => [...b.slice(-15), newPos]);
          setSteps(s => s + Math.floor(Math.random() * 8 + 3));
          setCalories(c => c + 0.4);

          // Check Geofence
          const distMeters = Math.sqrt(
            Math.pow((newPos.lat - userLatLng.lat) * 111000, 2) +
            Math.pow((newPos.lng - userLatLng.lng) * 111000, 2)
          );
          setIsSafeZone(distMeters <= geofenceRadius);

          if (googleMapInstanceRef.current) {
            googleMapInstanceRef.current.panTo(newPos);
          }
          return newPos;
        });
      }, 2500);
    } else {
      if (autoWalkIntervalRef.current) clearInterval(autoWalkIntervalRef.current);
    }

    return () => {
      if (autoWalkIntervalRef.current) clearInterval(autoWalkIntervalRef.current);
    };
  }, [isAutoWalking, geofenceRadius, userLatLng]);

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

    showToast(`🔊 High-frequency collar siren sounding on ${activePet.name}'s smart tracker!`, 'info');
    setTimeout(() => setIsPlayingSound(false), 800);
  };

  // Sync Telemetry Manual Button
  const handleRefreshMovement = () => {
    setLastSync('Just now');
    const latDelta = (Math.random() - 0.5) * 0.0015;
    const lngDelta = (Math.random() - 0.5) * 0.0015;
    const newPos = { lat: 23.8103 + latDelta, lng: 90.4125 + lngDelta };
    setPetLatLng(newPos);
    setBreadcrumbs(prev => [...prev, newPos]);

    const activities = ['Walking along Lane 6', 'Resting in Backyard', 'Exploring DOHS Bypass', 'Running in Garden'];
    const act = activities[Math.floor(Math.random() * activities.length)];
    setCurrentActivity(act);
    setSpeed(parseFloat((Math.random() * 3.5 + 0.5).toFixed(1)));

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
      
      {/* ── LOST MODE BEACON ALERT BANNER ── */}
      <AnimatePresence>
        {isLostMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
              color: '#FFFFFF',
              padding: '20px 26px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 12px 36px rgba(239, 68, 68, 0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radio size={26} className="animate-pulse" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '17px', display: 'block', letterSpacing: '-0.01em' }}>
                  EMERGENCY LOST PET BEACON BROADCASTING
                </strong>
                <p style={{ fontSize: '13.5px', opacity: 0.92, margin: '2px 0 0' }}>
                  High-rate sub-second GPS telemetry active. Nearby Pet Maya community &amp; animal clinics dispatched.
                </p>
              </div>
            </div>
            <button className="apple-btn-blue" style={{ background: '#FFFFFF', color: '#B91C1C', fontWeight: 800 }} onClick={toggleLostMode}>
              Deactivate Lost Mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. HEADER SECTION & STATUS CONTROLS ── */}
      <AppleReveal duration={0.35} yOffset={15}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '18px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="apple-card-eyebrow" style={{ color: 'var(--primary)', margin: 0 }}>
                Dual-Band GNSS Telemetry
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.14)', color: '#10B981', padding: '2px 8px', borderRadius: '12px' }}>
                L1/L5 Precision
              </span>
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 6px' }}>
              Live GPS Radar &amp; Telemetry
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Real-time Google Maps telemetry, geofence boundary perimeter alarms, and continuous biometric diagnostics.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn-ghost" 
              onClick={() => {
                setIsAutoWalking(!isAutoWalking);
                showToast(isAutoWalking ? '⏹️ Live walk simulation paused' : '🐾 Live walk simulation started!', 'info');
              }}
              style={{ borderColor: isAutoWalking ? 'var(--primary)' : 'var(--border)' }}
            >
              {isAutoWalking ? <Pause size={15} color="var(--primary)" /> : <Play size={15} color="var(--primary)" />}
              <span>{isAutoWalking ? 'Pause Walk' : 'Simulate Walk'}</span>
            </button>
            <button className="btn-ghost" onClick={handlePlaySound}>
              <Volume2 size={15} color="var(--primary)" />
              <span>Collar Siren</span>
            </button>
            <button className="btn-ghost" onClick={handleRefreshMovement}>
              <RefreshCw size={15} color="var(--primary)" />
              <span>Sync Now</span>
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

      {/* ── 2. PET SELECTOR CARDS STRIP ── */}
      {pets && pets.length > 0 && (
        <AppleReveal delay={0.04} duration={0.35} yOffset={12}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', width: '100%' }}>
            {pets.map(p => {
              const isSelected = selectedPetId === p.id || (!selectedPetId && p.id === pets[0].id);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPetId(p.id);
                    showToast(`Tracking active on ${p.name}`, 'info');
                  }}
                  className="apple-solid-card"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    background: isSelected ? 'var(--surface-solid)' : 'var(--surface-alt)',
                    boxShadow: isSelected ? '0 8px 24px rgba(16, 185, 129, 0.15)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={p.photo || 'assets/images/Pet_2.jpg'} 
                      alt={p.name} 
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)' }} 
                    />
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{p.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.breed || 'Pet'}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 800, fontSize: '12px' }}>
                      <Zap size={13} fill="#10B981" />
                      <span>88%</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Online</span>
                  </div>
                </div>
              );
            })}
          </div>
        </AppleReveal>
      )}

      {/* ── 3. MAIN DUAL-COLUMN DASHBOARD GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)', gap: '24px', width: '100%', alignItems: 'start' }}>
        
        {/* ── LEFT COLUMN: EXPANSIVE GOOGLE MAPS RADAR HUB ── */}
        <AppleReveal duration={0.35} yOffset={15}>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              height: '600px', 
              position: 'relative',
              background: '#0B0F14',
              borderRadius: '28px',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)'
            }}
          >
            {/* Top Floating Glass HUD */}
            <div 
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                zIndex: 90,
                background: 'rgba(22, 28, 36, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '22px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 10px 36px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: isSafeZone ? '#10B981' : '#EF4444', boxShadow: isSafeZone ? '0 0 12px #10B981' : '0 0 12px #EF4444' }} />
                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                    {activePet.name}'s Radar
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: isSafeZone ? '#4ADE80' : '#EF4444'
                    }}>
                      {isSafeZone ? 'Connected • Safe Zone' : 'Alert • Outside Safe Area'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>•</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      142m from Home
                    </span>
                  </div>
                </div>
              </div>

              {/* Signal & Battery Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38BDF8', fontSize: '11.5px', fontWeight: 700 }}>
                  <Signal size={14} />
                  <span>4G LTE</span>
                </div>
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
            </div>

            {/* Google Map Container Canvas */}
            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
            />

            {/* Right Map Action Floating Toolbar */}
            <div 
              style={{
                position: 'absolute',
                top: '90px',
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
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: is3D ? '#10B981' : 'rgba(22, 28, 36, 0.92)',
                  border: is3D ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  color: is3D ? '#FFFFFF' : '#10B981',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                  transition: 'all 0.2s ease'
                }}
                title="Toggle Google Maps 3D View"
              >
                {is3D ? '3D' : '2D'}
              </button>

              <button 
                onClick={handleCenterUser}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(22, 28, 36, 0.92)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
                }}
                title="Center on Home / Me"
              >
                <Crosshair size={18} />
              </button>

              <button 
                onClick={handleCenterPet}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(22, 28, 36, 0.92)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
                }}
                title={`Center on ${activePet.name}`}
              >
                <Footprints size={18} />
              </button>

              <button 
                onClick={() => {
                  setShowBreadcrumbs(!showBreadcrumbs);
                  showToast(showBreadcrumbs ? 'Path history hidden' : 'Showing live GPS path history', 'info');
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: showBreadcrumbs ? 'rgba(16, 185, 129, 0.2)' : 'rgba(22, 28, 36, 0.92)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
                }}
                title="Toggle GPS Breadcrumb Trail"
              >
                <Route size={18} />
              </button>

              <button 
                onClick={() => setShowStylePicker(!showStylePicker)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(22, 28, 36, 0.92)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
                }}
                title="Map Themes"
              >
                <Layers size={18} />
              </button>
            </div>

            {/* Map Theme Dropdown */}
            <AnimatePresence>
              {showStylePicker && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  style={{
                    position: 'absolute',
                    top: '300px',
                    right: '16px',
                    zIndex: 95,
                    background: '#1A212B',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '16px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 14px 36px rgba(0,0,0,0.7)'
                  }}
                >
                  {[
                    { id: 'dark', label: 'Dark Roadmap' },
                    { id: 'satellite', label: 'Satellite Hybrid' },
                    { id: 'terrain', label: 'Terrain Topo' }
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => { setMapStyle(st.id); setShowStylePicker(false); }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: mapStyle === st.id ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                        color: mapStyle === st.id ? '#10B981' : '#CBD5E1',
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

            {/* Bottom Left Coordinate Bar */}
            <div 
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                zIndex: 80,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                color: '#94A3B8',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <MapPin size={13} color="#10B981" />
              <span>{petLatLng.lat.toFixed(4)}° N, {petLatLng.lng.toFixed(4)}° E • Bearing 315° NW • ±1.8m</span>
            </div>
          </div>
        </AppleReveal>

        {/* ── RIGHT COLUMN: INTERACTIVE TELEMETRY & DIAGNOSTICS DECK ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Deck Tab Switcher */}
          <div style={{ display: 'flex', background: 'var(--surface-alt)', padding: '4px', borderRadius: 'var(--radius-md)', gap: '4px' }}>
            <button
              onClick={() => setActiveDeckTab('activity')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeDeckTab === 'activity' ? 'var(--surface-solid)' : 'transparent',
                color: activeDeckTab === 'activity' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeDeckTab === 'activity' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Live Activity
            </button>
            <button
              onClick={() => setActiveDeckTab('geofence')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeDeckTab === 'geofence' ? 'var(--surface-solid)' : 'transparent',
                color: activeDeckTab === 'geofence' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeDeckTab === 'geofence' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Geofence
            </button>
            <button
              onClick={() => setActiveDeckTab('hardware')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeDeckTab === 'hardware' ? 'var(--surface-solid)' : 'transparent',
                color: activeDeckTab === 'hardware' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeDeckTab === 'hardware' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Collar Sensors
            </button>
          </div>

          {/* TAB 1: LIVE ACTIVITY & BIOMETRICS */}
          {activeDeckTab === 'activity' && (
            <AppleReveal duration={0.3} yOffset={10}>
              <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'rgba(16, 185, 129, 0.16)',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Activity size={22} />
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'var(--surface-solid)', padding: '14px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                      <Gauge size={16} />
                    </div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{speed} km/h</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Velocity</span>
                  </div>

                  <div style={{ background: 'var(--surface-solid)', padding: '14px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ color: '#38BDF8', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                      <Footprints size={16} />
                    </div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{steps.toLocaleString()}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Steps</span>
                  </div>

                  <div style={{ background: 'var(--surface-solid)', padding: '14px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ color: '#F59E0B', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                      <Flame size={16} />
                    </div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{Math.floor(calories)} kcal</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Burned</span>
                  </div>
                </div>

                {/* Daily Goal Activity Progress Bar */}
                <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    <span>Daily Exercise Goal</span>
                    <span style={{ color: 'var(--primary)' }}>78%</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg, #10B981, #38BDF8)', borderRadius: '10px' }} />
                  </div>
                </div>

                {/* Sound Siren Trigger Button */}
                <button 
                  onClick={handlePlaySound}
                  className="apple-btn-blue"
                  style={{ 
                    width: '100%', 
                    background: isPlayingSound ? '#059669' : 'var(--primary)', 
                    justifyContent: 'center', 
                    padding: '13px 18px',
                    fontWeight: 800,
                    fontSize: '13px'
                  }}
                >
                  <Volume2 size={17} />
                  <span>{isPlayingSound ? 'SOUNDING BUZZER...' : 'PLAY SOUND BEACON'}</span>
                </button>
              </div>
            </AppleReveal>
          )}

          {/* TAB 2: SAFETY & GEOFENCING */}
          {activeDeckTab === 'geofence' && (
            <AppleReveal duration={0.3} yOffset={10}>
              <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15.5px', color: 'var(--text-main)', display: 'block' }}>Safe Perimeter Geofence</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Automated breach push notifications</span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '13px', padding: '5px 12px' }}>
                    {geofenceRadius}m Radius
                  </span>
                </div>

                <input 
                  type="range" 
                  min="100" 
                  max="800" 
                  step="25" 
                  value={geofenceRadius} 
                  onChange={(e) => setGeofenceRadius(Number(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} 
                />

                {/* Preset Zones */}
                <div>
                  <span className="label-mini" style={{ marginBottom: '8px' }}>Preset Geofence Zones</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { name: 'Home Perimeter', radius: 200, icon: CheckCircle2 },
                      { name: 'City Dog Park', radius: 450, icon: Target },
                      { name: 'Vet Clinic', radius: 700, icon: ShieldCheck }
                    ].map((zone, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setGeofenceRadius(zone.radius);
                          showToast(`Set Geofence to ${zone.name} (${zone.radius}m)`, 'info');
                        }}
                        style={{
                          background: geofenceRadius === zone.radius ? 'var(--surface-solid)' : 'var(--surface-alt)',
                          borderColor: geofenceRadius === zone.radius ? 'var(--primary)' : 'transparent',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <zone.icon size={16} color="var(--primary)" />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{zone.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{zone.radius}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AppleReveal>
          )}

          {/* TAB 3: HARDWARE & COLLAR SENSORS */}
          {activeDeckTab === 'hardware' && (
            <AppleReveal duration={0.3} yOffset={10}>
              <div className="apple-solid-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="label-mini">Pet Maya Collar Telemetry</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Satellite size={17} color="#38BDF8" />
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>GNSS Satellite Lock</strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>16 Satellites (L1/L5 Dual-Band)</span>
                      </div>
                    </div>
                    <span className="badge badge-blue">High Lock</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Thermometer size={17} color="#F59E0B" />
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>Collar Temperature</strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Body Contact Sensor</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>23.8°C</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Cpu size={17} color="#A855F7" />
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>Firmware &amp; Specs</strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>v2.4.1 • IP68 Waterproof</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Up to date</span>
                  </div>
                </div>
              </div>
            </AppleReveal>
          )}

          {/* Quick Info Card */}
          <div className="apple-solid-card" style={{ padding: '18px 22px', textAlign: 'left', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(0,0,0,0))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
              <ShieldCheck size={18} />
              <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>24/7 Smart Tele-Radar Active</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
              Automatic boundary alarms, health telemetry, and cloud synchronization are always active on Pet Maya Web &amp; Mobile.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
