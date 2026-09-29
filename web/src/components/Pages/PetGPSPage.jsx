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

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAhmOHCWgWf7exFnjQ1nns8cDjPZvKRTto';

// Google Maps Custom Paper Minimal Theme (Pet Maya aesthetic)
const googleMapsPaperTheme = [
  { elementType: "geometry", stylers: [{ color: "#F7F3EE" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F7F3EE" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#675C58" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E0D7CE" }]
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2B2625" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#346B73" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#E4ECE7" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3E7B6C" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#EBE3DA" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#F0E8DF" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#DFD6CC" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#D7E9E5" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#346B73" }]
  }
];

export default function PetGPSPage({ onNavigate }) {
  const { 
    showToast, 
    openModal, 
    devices = [], 
    updateDevice, 
    triggerRingDevice, 
    ringingDeviceId, 
    pets = [], 
    userLiveLocation 
  } = useApp ? useApp() : { showToast: () => {}, openModal: () => {} };

  const activeDevice = devices && devices.length > 0 ? devices[0] : {
    id: 'tracker_default',
    name: 'Smart GPS Tracker',
    collarId: 'PM-GPS',
    batteryLevel: 100,
    signalStrength: 4,
    lat: userLiveLocation?.lat || 23.7937,
    lng: userLiveLocation?.lng || 90.4066,
    isOnline: true
  };

  const activePet = pets && pets.length > 0 ? pets[0] : {
    name: 'Registered Companion',
    breed: 'Companion',
    weight: 'N/A',
    photo: '',
    device: activeDevice.name
  };

  // Map Mode State
  const [mapMode, setMapMode] = useState('paper'); // 'paper' | 'topo' | 'sat'
  const [isChimeActive, setIsChimeActive] = useState(false);
  const [isAmberLostMode, setIsAmberLostMode] = useState(false);
  const [activeZone, setActiveZone] = useState('home');

  // Google Maps State & Refs
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState('');
  
  const initialPetLat = activeDevice.lat || userLiveLocation?.lat || 23.7939;
  const initialPetLng = activeDevice.lng || userLiveLocation?.lng || 90.4033;
  const [petLatLng, setPetLatLng] = useState({ lat: initialPetLat, lng: initialPetLng });
  
  const homeHubLatLng = {
    lat: initialPetLat - 0.0012,
    lng: initialPetLng - 0.0016
  };

  const mapContainerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const petOverlayRef = useRef(null);
  const homeHubOverlayRef = useRef(null);
  const safeZoneOverlayRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const breadcrumbPolylineRef = useRef(null);

  // 1. DYNAMICALLY LOAD GOOGLE MAPS JAVASCRIPT API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
      } else {
        const prevCb = window.__gmapsReady;
        window.__gmapsReady = () => {
          if (typeof prevCb === 'function') prevCb();
          setGoogleMapsLoaded(true);
        };
      }
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      setMapsError('No Google Maps API key configured.');
      return;
    }

    window.__gmapsReady = () => {
      setGoogleMapsLoaded(true);
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&v=weekly&callback=__gmapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      console.error('[Google Maps] Failed to load:', err);
      setMapsError('Google Maps failed to load. Check API key permissions or network.');
    };
    document.head.appendChild(script);

    return () => {
      // Keep __gmapsReady clean
    };
  }, []);

  // 2. INITIALIZE GOOGLE MAPS ONCE SCRIPT LOADS
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current || !window.google || !window.google.maps) return;

    try {
      const mapOptions = {
        center: petLatLng,
        zoom: 17.2,
        mapTypeId: mapMode === 'sat' 
          ? window.google.maps.MapTypeId.HYBRID 
          : (mapMode === 'topo' ? window.google.maps.MapTypeId.TERRAIN : window.google.maps.MapTypeId.ROADMAP),
        styles: mapMode === 'paper' ? googleMapsPaperTheme : null,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        backgroundColor: '#F5EFE9'
      };

      const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
      googleMapInstanceRef.current = map;

      // Geofence Circle (350m radius around Home Hub)
      const circle = new window.google.maps.Circle({
        map: map,
        center: homeHubLatLng,
        radius: 350,
        strokeColor: '#0D9488',
        strokeOpacity: 0.75,
        strokeWeight: 1.5,
        strokeDasharray: '4 4',
        fillColor: '#0D9488',
        fillOpacity: 0.07,
        zIndex: 2
      });
      geofenceCircleRef.current = circle;

      // Home Hub Base Station Custom Overlay
      class HomeHubOverlay extends window.google.maps.OverlayView {
        constructor(position) {
          super();
          this.position = position;
          this.div = null;
        }
        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.transform = 'translate(-50%, -50%)';
          div.style.zIndex = '8';
          div.style.pointerEvents = 'none';
          div.innerHTML = `
            <div style="text-align: center;">
              <div style="
                width: 32px; height: 32px; border-radius: 8px;
                background-color: #FFFFFF; border: 1.5px solid #D6CDC5;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 4px auto; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#707973" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </div>
              <span style="
                font-size: 9px; font-family: monospace; font-weight: 700;
                color: #707973; text-transform: uppercase; background: rgba(255,255,255,0.9);
                padding: 1px 5px; border-radius: 4px; border: 1px solid #E8E1DA; white-space: nowrap;
              ">
                HOME HUB
              </span>
            </div>
          `;
          this.div = div;
          this.getPanes().overlayMouseTarget.appendChild(div);
        }
        draw() {
          const projection = this.getProjection();
          if (!projection || !this.div) return;
          const point = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(this.position.lat, this.position.lng));
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
      }
      const homeOverlay = new HomeHubOverlay(homeHubLatLng);
      homeOverlay.setMap(map);
      homeHubOverlayRef.current = homeOverlay;

      // Safe-Zone Perimeter Label Overlay
      class SafeZoneLabelOverlay extends window.google.maps.OverlayView {
        constructor(position) {
          super();
          this.position = position;
          this.div = null;
        }
        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.transform = 'translate(-50%, -50%)';
          div.style.zIndex = '6';
          div.style.pointerEvents = 'none';
          div.innerHTML = `
            <div style="
              background-color: rgba(255, 255, 255, 0.95);
              border: 1px solid #C8E5DF;
              border-radius: 9999px;
              padding: 2px 10px;
              font-size: 9px;
              font-family: monospace;
              color: #346B73;
              font-weight: 700;
              letter-spacing: 0.04em;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            ">
              HOME SANCTUARY SAFE-ZONE (350M RADIUS)
            </div>
          `;
          this.div = div;
          this.getPanes().overlayMouseTarget.appendChild(div);
        }
        draw() {
          const projection = this.getProjection();
          if (!projection || !this.div) return;
          const point = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(this.position.lat, this.position.lng));
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
      }
      const topPerimeterPos = {
        lat: homeHubLatLng.lat + (350 / 111320),
        lng: homeHubLatLng.lng
      };
      const safeLabel = new SafeZoneLabelOverlay(topPerimeterPos);
      safeLabel.setMap(map);
      safeZoneOverlayRef.current = safeLabel;

      // Breadcrumb Trajectory Path Polyline
      const breadcrumbCoords = [
        { lat: homeHubLatLng.lat, lng: homeHubLatLng.lng },
        { lat: homeHubLatLng.lat + 0.0003, lng: homeHubLatLng.lng + 0.0004 },
        { lat: homeHubLatLng.lat + 0.0006, lng: homeHubLatLng.lng + 0.0009 },
        { lat: homeHubLatLng.lat + 0.0009, lng: homeHubLatLng.lng + 0.0012 },
        { lat: petLatLng.lat, lng: petLatLng.lng }
      ];
      const polyline = new window.google.maps.Polyline({
        map: map,
        path: breadcrumbCoords,
        strokeColor: '#0D9488',
        strokeOpacity: 0.85,
        strokeWeight: 2.5
      });
      breadcrumbPolylineRef.current = polyline;

      // Companion Live Animated Marker Custom Overlay
      class PetMarkerOverlay extends window.google.maps.OverlayView {
        constructor(position, pet, speed) {
          super();
          this.position = position;
          this.pet = pet;
          this.speed = speed;
          this.div = null;
        }
        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.transform = 'translate(-50%, -50%)';
          div.style.zIndex = '15';
          div.style.cursor = 'pointer';
          div.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                <div style="
                  position: absolute; width: 100%; height: 100%; border-radius: 50%;
                  background-color: rgba(13, 148, 136, 0.25);
                  animation: radarPulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
                "></div>
                <div style="
                  position: absolute; width: 26px; height: 26px; border-radius: 50%;
                  background-color: rgba(13, 148, 136, 0.45);
                "></div>
                <div style="
                  width: 32px; height: 32px; border-radius: 50%;
                  border: 2px solid #0D9488; overflow: hidden;
                  background-color: #FFFFFF; box-shadow: 0 0 12px rgba(13, 148, 136, 0.6);
                  display: flex; align-items: center; justify-content: center; z-index: 2;
                ">
                  <img src="${this.pet.photo || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&auto=format&fit=crop&q=80'}" 
                       alt="${this.pet.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              </div>

              <div style="
                display: inline-flex; align-items: center; gap: 5px;
                background-color: #160F0C; color: #FFFFFF;
                padding: 4px 10px; border-radius: 9999px;
                font-size: 11px; font-family: monospace; font-weight: 700;
                margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.18);
                white-space: nowrap;
              ">
                <span style="width: 5px; height: 5px; border-radius: 50%; background-color: #10B981;"></span>
                <span>${this.pet.name} • ${this.speed || '1.1 km/h'}</span>
              </div>
            </div>
          `;
          this.div = div;
          this.getPanes().overlayMouseTarget.appendChild(div);
        }
        draw() {
          const projection = this.getProjection();
          if (!projection || !this.div) return;
          const point = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(this.position.lat, this.position.lng));
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
        update(pos, speed) {
          this.position = pos;
          if (speed) this.speed = speed;
          if (this.div) {
            this.draw();
          }
        }
      }

      const petOverlay = new PetMarkerOverlay(petLatLng, activePet, '1.1 km/h');
      petOverlay.setMap(map);
      petOverlayRef.current = petOverlay;

      setTimeout(() => {
        if (googleMapInstanceRef.current && window.google?.maps?.event) {
          window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
          googleMapInstanceRef.current.panTo(petLatLng);
        }
      }, 200);

    } catch (err) {
      console.error('[Google Maps in PetGPSPage] Init error:', err);
      setMapsError('Failed to initialize Google Maps: ' + (err.message || String(err)));
    }
  }, [googleMapsLoaded]);

  // 3. MAP MODE SWITCHER EFFECT
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google || !window.google.maps) return;
    const map = googleMapInstanceRef.current;
    if (mapMode === 'sat') {
      map.setMapTypeId(window.google.maps.MapTypeId.HYBRID);
      map.setOptions({ styles: null });
    } else if (mapMode === 'topo') {
      map.setMapTypeId(window.google.maps.MapTypeId.TERRAIN);
      map.setOptions({ styles: null });
    } else {
      map.setMapTypeId(window.google.maps.MapTypeId.ROADMAP);
      map.setOptions({ styles: googleMapsPaperTheme });
    }
  }, [mapMode]);

  // Zoom & Center Control Handlers
  const handleRecenter = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo(petLatLng);
      googleMapInstanceRef.current.setZoom(17.2);
      showToast(`Recentered on ${activePet.name} GNSS Fix`, 'info');
    }
  };

  const handleCompassReset = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setHeading(0);
      googleMapInstanceRef.current.setTilt(0);
      showToast('Calibrated magnetic compass heading to North', 'info');
    }
  };

  const handleZoomIn = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom(googleMapInstanceRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom(googleMapInstanceRef.current.getZoom() - 1);
    }
  };

  // Helper to format lat/lng to degrees, minutes, seconds string
  const formatCoordinates = (lat, lng) => {
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
    const latSec = (((Math.abs(lat) - latDeg) * 60 - latMin) * 60).toFixed(1);
    const latDir = lat >= 0 ? 'N' : 'S';

    const lngDeg = Math.floor(Math.abs(lng));
    const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60);
    const lngSec = (((Math.abs(lng) - lngDeg) * 60 - lngMin) * 60).toFixed(1);
    const lngDir = lng >= 0 ? 'E' : 'W';

    return `${latDeg}°${latMin}'${latSec}"${latDir}, ${lngDeg}°${lngMin}'${lngSec}"${lngDir} • Accuracy: ±1.2m`;
  };

  // Interactive Audio Acoustic Chime Synthesizer
  const triggerAcousticChime = async () => {
    setIsChimeActive(true);
    if (triggerRingDevice) {
      await triggerRingDevice(activeDevice.id || 'halo-01');
    }
    showToast(`🔊 85dB Acoustic Recovery Chime Emitted on Collar #${activeDevice.collarId || activeDevice.id || 'HALO'}`, 'info');

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
                  {activeDevice.batteryLevel || 89}% (Est. {Math.round((activeDevice.batteryLevel || 89) * 0.2)} days)
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
        }} className="petgps-main-layout">
          
          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN: RADAR MAP CANVAS & PHYSICAL COLLAR CONTROLS
              ───────────────────────────────────────────────────────────── */}
          <div>
            
            {/* Primary Map / Radar Canvas Box */}
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
              
              {/* Google Maps Real Interactive Canvas Container */}
              <div
                ref={mapContainerRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1
                }}
              />

              {/* Map Loading State */}
              {!googleMapsLoaded && !mapsError && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(245, 239, 233, 0.88)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 20,
                  gap: '12px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '3px solid rgba(13, 148, 136, 0.2)',
                    borderTop: '3px solid #0D9488',
                    animation: 'radarSpin 0.9s linear infinite'
                  }} />
                  <span style={{ fontSize: '12px', color: '#675C58', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>
                    INITIALIZING SATELLITE GNSS MAP…
                  </span>
                  <style>{`@keyframes radarSpin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {/* Map Error State */}
              {mapsError && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(245, 239, 233, 0.95)',
                  zIndex: 20,
                  gap: '12px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px' }}>🗺️</div>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#DC2626' }}>Map Connection Issue</span>
                  <span style={{ fontSize: '12px', color: '#675C58', maxWidth: '340px', lineHeight: '1.6' }}>{mapsError}</span>
                  <button
                    onClick={() => { setMapsError(''); window.location.reload(); }}
                    style={{
                      marginTop: '8px',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      backgroundColor: '#0D9488',
                      border: 'none',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Retry Loading
                  </button>
                </div>
              )}

              {/* Polar Radar Range Rings & Crosshair Overlay (HUD layer on top of Google Map) */}
              <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: mapMode === 'sat' ? 0.35 : 0.45,
                zIndex: 4
              }}>
                <defs>
                  <pattern id="radarGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(195, 182, 172, 0.25)" strokeWidth="0.8" />
                  </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#radarGrid)" />

                {/* Radar Polar Circles */}
                <circle cx="50%" cy="50%" r="70" fill="none" stroke="rgba(195, 182, 172, 0.45)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="150" fill="none" stroke="rgba(195, 182, 172, 0.4)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="240" fill="none" stroke="#346B73" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.6" />
                <circle cx="50%" cy="50%" r="330" fill="none" stroke="rgba(195, 182, 172, 0.3)" strokeWidth="1" />

                {/* Compass Axes */}
                <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(195, 182, 172, 0.35)" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(195, 182, 172, 0.35)" strokeWidth="0.8" strokeDasharray="3 3" />

                {/* Diagonal Radials */}
                <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="rgba(195, 182, 172, 0.2)" strokeWidth="0.8" />
                <line x1="10%" y1="90%" x2="90%" y2="10%" stroke="rgba(195, 182, 172, 0.2)" strokeWidth="0.8" />

                {/* Fallback Trajectory only if Google Maps fails to load */}
                {!googleMapsLoaded && (
                  <>
                    <path
                      d="M 330 350 Q 380 320 460 260 T 540 180"
                      fill="none"
                      stroke="#346B73"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.85"
                    />
                    <circle cx="330" cy="350" r="3" fill="#675C58" />
                    <circle cx="380" cy="340" r="3" fill="#675C58" />
                    <circle cx="430" cy="320" r="3" fill="#675C58" />
                    <circle cx="470" cy="280" r="3" fill="#0D9488" />
                    <circle cx="510" cy="230" r="3" fill="#0D9488" />
                  </>
                )}
              </svg>

              {/* Compass Degree Markers (HUD Layer) */}
              <span style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: mapMode === 'sat' ? '#94A3B8' : '#707973', fontWeight: 600, pointerEvents: 'none', zIndex: 5 }}>
                N 000°
              </span>
              <span style={{ position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: mapMode === 'sat' ? '#94A3B8' : '#707973', fontWeight: 600, pointerEvents: 'none', zIndex: 5 }}>
                E 090°
              </span>
              <span style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: mapMode === 'sat' ? '#94A3B8' : '#707973', fontWeight: 600, pointerEvents: 'none', zIndex: 5 }}>
                S 180°
              </span>
              <span style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: mapMode === 'sat' ? '#94A3B8' : '#707973', fontWeight: 600, pointerEvents: 'none', zIndex: 5 }}>
                W 270°
              </span>

              {/* Fallback Static Markers (rendered only if Google Maps not loaded) */}
              {!googleMapsLoaded && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '74px',
                    left: '50%',
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
                      <span>{activePet.name} • 1.1 km/h</span>
                    </div>
                  </div>
                </>
              )}

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
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                zIndex: 10
              }}>
                <img
                  src={activePet.photo || "https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&auto=format&fit=crop&q=80"}
                  alt={activePet.name || "Companion"}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    minHeight: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    aspectRatio: '1 / 1',
                    border: '1.5px solid #0D9488'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C' }}>
                      {activePet.name}
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
                    {activePet.breed || 'Companion'}{activePet.weight ? ` • ${activePet.weight} kg` : ''} • Collar #{activeDevice.collarId || activeDevice.id || 'HALO'}
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
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
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
                    onClick={handleRecenter}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: '#160F0C',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Recenter Map on Pet"
                  >
                    <Target size={15} />
                  </button>
                  <button
                    onClick={handleCompassReset}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: '#160F0C',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Reset Compass Heading"
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
                {formatCoordinates(petLatLng.lat, petLatLng.lng)}
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
                  onClick={handleZoomIn}
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
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
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
                  title="Zoom Out"
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
                    {activeDevice.batteryLevel ?? 92}%
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
                  width: `${activeDevice.batteryLevel ?? 92}%`,
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
