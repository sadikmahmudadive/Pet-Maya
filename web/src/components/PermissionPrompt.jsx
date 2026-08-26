import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, MapPin, X, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PermissionPrompt() {
  const { 
    notificationPermission, 
    locationPermission, 
    requestAllPermissions,
    requestLocationPermission,
    requestNotificationPermission
  } = useApp();

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('pm_hide_perm_prompt') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // If already granted both or user dismissed, don't show
  const needsPermission = notificationPermission === 'default' || locationPermission === 'prompt';
  if (!needsPermission || isDismissed) return null;

  const handleAllowAll = async () => {
    await requestAllPermissions();
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pm_hide_perm_prompt', 'true');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
          maxWidth: '440px',
          width: 'calc(100vw - 48px)',
          background: 'rgba(22, 28, 36, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1.2px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.2)',
          padding: '20px 22px',
          color: '#FFFFFF',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                Enable Live Radar &amp; Alerts
              </h4>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '2px 0 0' }}>
                Allow Location &amp; Push Notifications for real-time safe zone breach alarms.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* Feature Pills */}
        <div style={{ display: 'flex', gap: '8px', margin: '14px 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '10px', fontSize: '11.5px', color: '#CBD5E1' }}>
            <MapPin size={13} color="#10B981" />
            <span>Precise Geofencing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '10px', fontSize: '11.5px', color: '#38BDF8' }}>
            <Bell size={13} color="#38BDF8" />
            <span>Instant Siren Alerts</span>
          </div>
        </div>

        {/* Action Button Row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleAllowAll}
            className="apple-btn-blue"
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '12px'
            }}
          >
            <Check size={16} />
            <span>Enable Location &amp; Alerts</span>
          </button>

          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Not Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
