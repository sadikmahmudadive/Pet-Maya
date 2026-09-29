import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  MapPin, 
  Syringe, 
  ShoppingBag, 
  Stethoscope, 
  BrainCircuit, 
  MessageSquare, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDrawer() {
  const { 
    notifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    addNotification,
    closeModal, 
    notificationPermission, 
    requestNotificationPermission, 
    sendPushNotification,
    setActiveTab,
    showToast,
    theme
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all');
  const isDark = theme === 'dark';

  // Chip Scroll & A11y Refs
  const chipsScrollRef = useRef(null);
  const chipRefs = useRef({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (chipsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = chipsScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [notifications]);

  // Scroll active chip into view smoothly
  const handleSelectFilter = (id) => {
    setActiveFilter(id);
    if (chipRefs.current[id]) {
      chipRefs.current[id].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  const handleScrollLeft = () => {
    if (chipsScrollRef.current) {
      chipsScrollRef.current.scrollBy({ left: -140, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (chipsScrollRef.current) {
      chipsScrollRef.current.scrollBy({ left: 140, behavior: 'smooth' });
    }
  };

  const filterCategories = [
    { id: 'all', label: 'All', icon: '🔔', count: notifications.length },
    { id: 'radar', label: 'Radar', icon: '🚨', count: notifications.filter(n => n.type === 'radar').length },
    { id: 'vaccine', label: 'Vaccines', icon: '💉', count: notifications.filter(n => n.type === 'vaccine').length },
    { id: 'order', label: 'Orders', icon: '📦', count: notifications.filter(n => n.type === 'order').length },
    { id: 'vet', label: 'Clinical', icon: '🩺', count: notifications.filter(n => n.type === 'vet' || n.type === 'ai').length },
    { id: 'community', label: 'Social', icon: '💬', count: notifications.filter(n => n.type === 'community').length }
  ];

  // Keyboard navigation for tablist (ArrowLeft, ArrowRight, Home, End)
  const handleChipKeyDown = (e, currentIndex) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % filterCategories.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + filterCategories.length) % filterCategories.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = filterCategories.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextCategory = filterCategories[nextIndex];
      handleSelectFilter(nextCategory.id);
      if (chipRefs.current[nextCategory.id]) {
        chipRefs.current[nextCategory.id].focus();
      }
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'vet') return notif.type === 'vet' || notif.type === 'ai';
    return notif.type === activeFilter;
  });

  const getCategoryConfig = (type) => {
    switch (type) {
      case 'radar':
        return {
          icon: <MapPin size={16} />,
          color: '#EF4444',
          bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
          badgeText: 'GPS Radar'
        };
      case 'vaccine':
        return {
          icon: <Syringe size={16} />,
          color: '#0D9488',
          bg: isDark ? 'rgba(13, 148, 136, 0.18)' : '#CCFBF1',
          badgeText: 'Vaccine Alert'
        };
      case 'order':
        return {
          icon: <ShoppingBag size={16} />,
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
          badgeText: 'Pharmacy Order'
        };
      case 'vet':
        return {
          icon: <Stethoscope size={16} />,
          color: '#3B82F6',
          bg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE',
          badgeText: 'Veterinary Care'
        };
      case 'ai':
        return {
          icon: <BrainCircuit size={16} />,
          color: '#8B5CF6',
          bg: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE',
          badgeText: 'AI Triage'
        };
      case 'community':
        return {
          icon: <MessageSquare size={16} />,
          color: '#EC4899',
          bg: isDark ? 'rgba(236, 72, 153, 0.18)' : '#FCE7F3',
          badgeText: 'Community'
        };
      default:
        return {
          icon: <Bell size={16} />,
          color: '#10B981',
          bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5',
          badgeText: 'System'
        };
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffSecs = Math.max(0, Math.floor((now - time) / 1000));

    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    closeModal();
    if (notif.actionUrl) {
      if (typeof notif.actionUrl === 'string') {
        const route = notif.actionUrl.replace('/', '').replace('#', '');
        if (setActiveTab) setActiveTab(route);
        else window.location.hash = route;
      }
    }
  };

  const handleSendTestPush = () => {
    const testTypes = [
      {
        title: '🚨 Radar Safe-Zone Alert',
        body: 'Buddy entered Dhanmondi Lake Geofence. Cellular beacon synced at 99.8% precision.',
        type: 'radar',
        actionUrl: 'pet-gps'
      },
      {
        title: '💉 Clinical Rabies Booster Due',
        body: 'Annual DHPP & Rabies booster due in 48 hours for Milo. Passport QR updated.',
        type: 'vaccine',
        actionUrl: 'vaccines'
      },
      {
        title: '📦 Express Cold-Chain Dispatched',
        body: 'Dispensary Order #PM-9042 with refrigerated vaccine pack is out for delivery.',
        type: 'order',
        actionUrl: 'shop'
      }
    ];

    const randomTest = testTypes[Math.floor(Math.random() * testTypes.length)];
    addNotification(randomTest);
    showToast('🔔 Generated new notification & dispatched native push!', 'success');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={closeModal}
    >
      {/* ── CSS Styles for custom sleek mini scrollbar ── */}
      <style>{`
        .notif-chips-mini-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? 'rgba(16, 185, 129, 0.45) rgba(255, 255, 255, 0.04)' : 'rgba(13, 148, 136, 0.4) rgba(0, 0, 0, 0.04)'};
        }
        .notif-chips-mini-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .notif-chips-mini-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'};
          border-radius: 9999px;
          margin: 0 16px;
        }
        .notif-chips-mini-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(16, 185, 129, 0.45)' : 'rgba(13, 148, 136, 0.45)'};
          border-radius: 9999px;
          transition: background 0.2s ease;
        }
        .notif-chips-mini-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#10B981' : '#0D9488'};
        }
      `}</style>

      <motion.div
        initial={{ x: '100%', opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: isDark ? '#021B1D' : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#111827',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.45)',
          borderLeft: isDark ? '1px solid rgba(26, 182, 128, 0.2)' : '1px solid #E5E7EB',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── DRAWER HEADER ── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isDark ? '#032325' : '#FAF9F8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: isDark ? 'rgba(26, 182, 128, 0.2)' : '#E6F4F1',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Notifications
                </h3>
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    backgroundColor: '#10B981',
                    color: '#021E20',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}>
                    {unreadNotificationsCount} NEW
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: isDark ? '#94A3B8' : '#6B7280' }}>
                Live radar alerts, clinical updates &amp; reminders
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E5E7EB',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#CBD5E1' : '#4B5563',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── NATIVE PUSH PERMISSION STATUS STRIP ── */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
          borderBottom: isDark ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid #DCFCE7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: notificationPermission === 'granted' ? '#10B981' : (notificationPermission === 'denied' ? '#EF4444' : '#38BDF8'),
              boxShadow: notificationPermission === 'granted' ? '0 0 6px #10B981' : 'none'
            }} />
            <span style={{ fontWeight: 600, color: isDark ? '#E2E8F0' : '#1F2937' }}>
              {notificationPermission === 'granted'
                ? 'Chrome Web Push Active'
                : notificationPermission === 'denied'
                ? 'Push Blocked in Browser'
                : 'Native Push Available'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {notificationPermission !== 'granted' ? (
              <button
                onClick={() => requestNotificationPermission()}
                style={{
                  backgroundColor: '#10B981',
                  color: '#021E20',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Enable Push
              </button>
            ) : (
              <button
                onClick={handleSendTestPush}
                title="Send a sample push notification to test"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #D1D5DB',
                  color: isDark ? '#FFFFFF' : '#111827',
                  borderRadius: '8px',
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} color="#10B981" />
                <span>Test Alert</span>
              </button>
            )}
          </div>
        </div>

        {/* ── ACCESSIBLE FILTER CHIP SELECTOR WITH MINI SCROLLBAR ── */}
        <div style={{
          position: 'relative',
          backgroundColor: isDark ? '#021618' : '#FAF9F8',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EBE4DF'
        }}>
          {/* Left Scroll Chevron Button */}
          {canScrollLeft && (
            <button
              onClick={handleScrollLeft}
              aria-label="Scroll filter categories left"
              style={{
                position: 'absolute',
                left: '6px',
                top: 'calc(50% - 3px)',
                transform: 'translateY(-50%)',
                zIndex: 5,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(3, 35, 37, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #DFD7CF',
                color: isDark ? '#FFFFFF' : '#160F0C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Left Fade Gradient Mask */}
          {canScrollLeft && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: '4px',
              width: '32px',
              background: isDark
                ? 'linear-gradient(to right, #021618 30%, transparent 100%)'
                : 'linear-gradient(to right, #FAF9F8 30%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 3
            }} />
          )}

          {/* Scrollable Chip Track with Mini Scrollbar */}
          <div
            ref={chipsScrollRef}
            onScroll={checkScroll}
            onWheel={(e) => {
              if (e.deltaY !== 0 && chipsScrollRef.current) {
                chipsScrollRef.current.scrollLeft += e.deltaY;
                checkScroll();
              }
            }}
            className="notif-chips-mini-scrollbar"
            role="tablist"
            aria-label="Filter notifications by category"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              padding: '12px 20px 8px 20px',
              alignItems: 'center'
            }}
          >
            {filterCategories.map((cat, idx) => {
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={(el) => (chipRefs.current[cat.id] = el)}
                  role="tab"
                  id={`notif-tab-${cat.id}`}
                  aria-selected={isActive}
                  aria-controls="notifications-panel"
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => handleChipKeyDown(e, idx)}
                  onClick={() => handleSelectFilter(cat.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '36px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 600,
                    fontFamily: 'var(--font-sans, inherit)',
                    backgroundColor: isActive
                      ? (isDark ? '#10B981' : '#160F0C')
                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF'),
                    border: isActive
                      ? (isDark ? '1px solid #10B981' : '1px solid #160F0C')
                      : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2DAD3'),
                    color: isActive
                      ? (isDark ? '#021E20' : '#FFFFFF')
                      : (isDark ? '#E2E8F0' : '#374151'),
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: isActive
                      ? (isDark ? '0 2px 10px rgba(16, 185, 129, 0.35)' : '0 2px 8px rgba(22, 15, 12, 0.2)')
                      : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 0 0 2px #10B981'
                      : '0 0 0 2px #0D9488';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = isActive
                      ? (isDark ? '0 2px 10px rgba(16, 185, 129, 0.35)' : '0 2px 8px rgba(22, 15, 12, 0.2)')
                      : '0 1px 3px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '13px' }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span
                    aria-label={`${cat.count} notifications`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: isActive
                        ? (isDark ? 'rgba(2, 30, 32, 0.25)' : 'rgba(255, 255, 255, 0.22)')
                        : (isDark ? 'rgba(255, 255, 255, 0.14)' : '#EDE7E1'),
                      color: isActive
                        ? (isDark ? '#021E20' : '#FFFFFF')
                        : (isDark ? '#CBD5E1' : '#675C58')
                    }}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Scroll Chevron Button */}
          {canScrollRight && (
            <button
              onClick={handleScrollRight}
              aria-label="Scroll filter categories right"
              style={{
                position: 'absolute',
                right: '6px',
                top: 'calc(50% - 3px)',
                transform: 'translateY(-50%)',
                zIndex: 5,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(3, 35, 37, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #DFD7CF',
                color: isDark ? '#FFFFFF' : '#160F0C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* Right Fade Gradient Mask */}
          {canScrollRight && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: '4px',
              width: '32px',
              background: isDark
                ? 'linear-gradient(to left, #021618 30%, transparent 100%)'
                : 'linear-gradient(to left, #FAF9F8 30%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 3
            }} />
          )}
        </div>

        {/* ── ACTION TOOLBAR (MARK READ / CLEAR) ── */}
        <div style={{
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          color: isDark ? '#94A3B8' : '#6B7280',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid #F9FAFB'
        }}>
          <span>Showing {filteredNotifications.length} items</span>
          <div style={{ display: 'flex', gap: '14px' }}>
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#10B981',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#64748B' : '#9CA3AF',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* ── NOTIFICATIONS SCROLLABLE LIST ── */}
        <div 
          id="notifications-panel"
          role="tabpanel"
          aria-label={`${activeFilter} notifications`}
          aria-live="polite"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const config = getCategoryConfig(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      backgroundColor: notif.read
                        ? (isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF')
                        : (isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4'),
                      border: notif.read
                        ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E5E7EB')
                        : (isDark ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid #86EFAC'),
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      position: 'relative',
                      boxShadow: notif.read ? 'none' : '0 4px 16px rgba(16, 185, 129, 0.08)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Icon Badge */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      backgroundColor: config.bg,
                      color: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: config.color
                        }}>
                          {config.badgeText}
                        </span>
                        <span style={{ fontSize: '11px', color: isDark ? '#64748B' : '#9CA3AF' }}>
                          {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>

                      <h4 style={{
                        margin: '0 0 4px 0',
                        fontSize: '13.5px',
                        fontWeight: notif.read ? 600 : 750,
                        color: isDark ? '#FFFFFF' : '#111827',
                        lineHeight: 1.3
                      }}>
                        {notif.title}
                      </h4>

                      <p style={{
                        margin: 0,
                        fontSize: '12.5px',
                        color: isDark ? '#94A3B8' : '#4B5563',
                        lineHeight: 1.4
                      }}>
                        {notif.body}
                      </p>

                      {notif.actionUrl && (
                        <div style={{
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#10B981'
                        }}>
                          <span>View in app</span>
                          <ExternalLink size={12} />
                        </div>
                      )}
                    </div>

                    {/* Right side status / delete */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {!notif.read && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                          boxShadow: '0 0 8px #10B981'
                        }} />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isDark ? '#475569' : '#9CA3AF',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: notif.read ? 0 : '12px'
                        }}
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#64748B' : '#9CA3AF',
                  marginBottom: '16px'
                }}>
                  <Bell size={28} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700 }}>
                  All caught up!
                </h4>
                <p style={{ margin: '0 0 18px', fontSize: '13px', color: isDark ? '#94A3B8' : '#6B7280', maxWidth: '240px' }}>
                  No notifications in this category. You will receive live alerts as they occur.
                </p>
                <button
                  onClick={handleSendTestPush}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#10B981',
                    color: '#021E20',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={14} />
                  <span>Send Sample Alert</span>
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
          backgroundColor: isDark ? '#032325' : '#FAF9F8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#6B7280' }}>
            🛰️ Synchronized with Satellite GPS &amp; EHR
          </span>
          <button
            onClick={closeModal}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
              color: isDark ? '#FFFFFF' : '#111827',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
