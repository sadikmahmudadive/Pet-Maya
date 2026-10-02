import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAhmOHCWgWf7exFnjQ1nns8cDjPZvKRTto';

// Dark OLED / Obsidian Theme for Google Maps
const googleMapsDarkTheme = [
  { elementType: "geometry", stylers: [{ color: "#12151B" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#12151B" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8E9AA8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#A3B3C2" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4EA3B0" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#162522" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3EB382" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1E242F" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#161B24" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9AA5B4" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#233040" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#18222E" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4EA3B0" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1B222D" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0D1924" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4EA3B0" }],
  },
];

// Light Paper / Warm Minimal Theme for Google Maps
const googleMapsLightTheme = [
  { elementType: "geometry", stylers: [{ color: "#FCF8F5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FCF8F5" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5C5752" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ECE6DE" }]
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1A1917" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#37747F" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#EBF3F0" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2F7D5B" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E8E2D9" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#F7F0E6" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E4DAD0" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#DCEBEC" }]
  },
];

let scriptLoadingPromise = null;

export function loadGoogleMapsScript(apiKey = GOOGLE_MAPS_API_KEY) {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-api-script');
    if (existingScript) {
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        window.__gmapsReady = () => resolve(window.google);
      }
      return;
    }

    window.__gmapsReady = () => {
      resolve(window.google);
    };

    const script = document.createElement('script');
    script.id = 'google-maps-api-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly&callback=__gmapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      console.error('[Google Maps] Script load error:', err);
      reject(err);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export default function GoogleMapView({
  center = { lat: 23.79395, lng: 90.40328 },
  zoom = 15,
  markers = [],
  routePath = [],
  circle = null,
  mapType = 'roadmap', // 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  style = {},
  className = '',
  height = '320px',
  interactive = true,
  showControls = true,
  onMapClick,
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstancesRef = useRef([]);
  const polylineRef = useRef(null);
  const circleRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync dark mode state with document theme
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript()
      .then(() => {
        if (isMounted) setIsLoaded(true);
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[GoogleMapView] Falling back to standard interactive container:', err);
          setError('Map API unavailable');
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Initialize and update Map Instance
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.google || !window.google.maps) return;

    try {
      const mapStyles = isDarkMode ? googleMapsDarkTheme : googleMapsLightTheme;
      const typeId = mapType === 'satellite' ? window.google.maps.MapTypeId.HYBRID : (mapType === 'terrain' ? window.google.maps.MapTypeId.TERRAIN : window.google.maps.MapTypeId.ROADMAP);

      if (!mapInstanceRef.current) {
        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom,
          mapTypeId: typeId,
          styles: mapType === 'satellite' ? null : mapStyles,
          disableDefaultUI: !showControls,
          zoomControl: showControls,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: showControls,
          gestureHandling: interactive ? 'auto' : 'none',
        });

        if (onMapClick) {
          map.addListener('click', (e) => {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          });
        }

        mapInstanceRef.current = map;
      } else {
        const map = mapInstanceRef.current;
        map.setCenter(center);
        map.setZoom(zoom);
        map.setMapTypeId(typeId);
        map.setOptions({ styles: mapType === 'satellite' ? null : mapStyles });
      }

      const map = mapInstanceRef.current;

      // 1. Clear existing markers
      markerInstancesRef.current.forEach((m) => m.setMap(null));
      markerInstancesRef.current = [];

      // 2. Render Markers
      markers.forEach((m) => {
        if (!m.lat || !m.lng) return;
        const marker = new window.google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: m.title || '',
          label: m.label ? { text: m.label, color: '#ffffff', fontWeight: 'bold', fontSize: '11px' } : undefined,
          icon: m.icon || (m.type === 'pet' ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4EA3B0',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          } : m.type === 'pharmacy' ? {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#37747F',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          } : undefined),
        });

        if (m.info) {
          const infoWindow = new window.google.maps.InfoWindow({ content: `<div style="color:#1a1917;font-family:sans-serif;font-size:12px;padding:4px"><b>${m.title || ''}</b><div>${m.info}</div></div>` });
          marker.addListener('click', () => infoWindow.open(map, marker));
        }

        markerInstancesRef.current.push(marker);
      });

      // 3. Render Route Path (Polyline)
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      if (routePath && routePath.length > 1) {
        const polyline = new window.google.maps.Polyline({
          path: routePath.map((p) => ({ lat: p.lat, lng: p.lng })),
          geodesic: true,
          strokeColor: '#4EA3B0',
          strokeOpacity: 0.9,
          strokeWeight: 4,
          map,
        });
        polylineRef.current = polyline;

        // Auto-fit bounds if multiple route points
        const bounds = new window.google.maps.LatLngBounds();
        routePath.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      }

      // 4. Render Geofence Circle
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
      if (circle && circle.center && circle.radius) {
        const circleInstance = new window.google.maps.Circle({
          strokeColor: '#4EA3B0',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#4EA3B0',
          fillOpacity: 0.15,
          map,
          center: circle.center,
          radius: circle.radius,
        });
        circleRef.current = circleInstance;
      }
    } catch (e) {
      console.warn('[GoogleMapView] Error updating map:', e);
    }
  }, [isLoaded, center.lat, center.lng, zoom, markers, routePath, circle, mapType, isDarkMode, showControls, interactive, onMapClick]);

  return (
    <div
      className={`google-map-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 'inherit',
        overflow: 'hidden',
        background: isDarkMode ? '#12151B' : '#FCF8F5',
        ...style,
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {!isLoaded && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(2px)' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--teal)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            Loading live Google Maps...
          </div>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', padding: 16, textAlign: 'center', background: 'var(--sunk)', color: 'var(--ink)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Google Maps (Live Transit Mode)</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Lat: {center.lat}, Lng: {center.lng}</div>
        </div>
      )}
    </div>
  );
}
