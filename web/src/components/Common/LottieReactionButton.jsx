import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lottie from 'lottie-web';
import { ThumbsUp } from 'lucide-react';

export const REACTION_CONFIGS = [
  { key: 'Like', label: 'Like', color: '#1877F2', path: '/assets/lottie/reaction_like.json', fallbackEmoji: '👍' },
  { key: 'Love', label: 'Love', color: '#F33E58', path: '/assets/lottie/reaction_love.json', fallbackEmoji: '❤️' },
  { key: 'Haha', label: 'Haha', color: '#F7B125', path: '/assets/lottie/reaction_haha.json', fallbackEmoji: '😆' },
  { key: 'Clap', label: 'Clap', color: '#1AB680', path: '/assets/lottie/reaction_clap.json', fallbackEmoji: '👏' },
  { key: 'Insight', label: 'Insight', color: '#F5A623', path: '/assets/lottie/reaction_insight.json', fallbackEmoji: '💡' },
  { key: 'Care', label: 'Care', color: '#9C27B0', path: '/assets/lottie/reaction_care.json', fallbackEmoji: '💜' },
];

const lottieDataCache = {};

// Eagerly prefetch all 6 Lottie JSONs so they render instantaneously on hover
if (typeof window !== 'undefined') {
  REACTION_CONFIGS.forEach(r => {
    fetch(r.path)
      .then(res => {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(json => {
        lottieDataCache[r.path] = json;
      })
      .catch(() => {});
  });
}

export function useLottieAnimation(path) {
  const [data, setData] = useState(() => lottieDataCache[path] || null);

  useEffect(() => {
    if (!path) return;
    if (lottieDataCache[path]) {
      setData(lottieDataCache[path]);
      return;
    }
    let isMounted = true;
    fetch(path)
      .then(res => {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(json => {
        lottieDataCache[path] = json;
        if (isMounted) setData(json);
      })
      .catch(err => {
        console.warn('[useLottieAnimation] Failed to load at', path, err);
      });
    return () => { isMounted = false; };
  }, [path]);

  return data;
}

export function ReactionIcon({ config, size = 38, loop = true }) {
  const animData = useLottieAnimation(config.path);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !animData) return;
    let anim;
    try {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: loop,
        autoplay: true,
        animationData: animData,
      });
    } catch (err) {
      console.warn('[ReactionIcon] Lottie error:', err);
    }
    return () => {
      if (anim) anim.destroy();
    };
  }, [animData, loop]);

  if (animData) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          width: size, 
          height: size, 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'none'
        }} 
      />
    );
  }

  return (
    <span style={{ fontSize: `${size * 0.7}px`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', lineHeight: 1 }}>
      {config.fallbackEmoji}
    </span>
  );
}

export default function LottieReactionButton({ 
  userReaction = null,
  isLiked = false,
  onReact, 
  className = ''
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const touchTimerRef = useRef(null);

  const activeReactionKey = userReaction || (isLiked ? 'Like' : null);
  const activeConfig = REACTION_CONFIGS.find(r => r.key.toLowerCase() === (activeReactionKey || '').toLowerCase());
  const isReacted = !!activeConfig;

  // Mouse Enter: Clear leave timeout and gracefully open picker
  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 120);
  };

  // Mouse Leave: Clear hover timeout and set gentle delay before closing
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setShowPicker(false);
      setHoveredReaction(null);
    }, 320);
  };

  // Touch / Mobile Support: Long press opens picker; quick tap toggles reaction
  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 350);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

    if (isReacted) {
      onReact(activeConfig.key);
    } else {
      onReact('Like');
    }
    setShowPicker(false);
  };

  const handleSelectReaction = (reactionKey, e) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

    onReact(reactionKey);
    setShowPicker(false);
    setHoveredReaction(null);
  };

  return (
    <div 
      style={{ position: 'relative', flex: 1, display: 'flex' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── FLOATING REACTION PICKER POPUP ── */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.65, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 450 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% - 2px)',
              left: '0',
              zIndex: 999,
              paddingBottom: '14px', // Invisible hover bridge between picker and button
              cursor: 'default'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px 6px',
                background: 'var(--surface, #FFFFFF)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '36px',
                border: '1px solid var(--border)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.12)'
              }}
            >
              {REACTION_CONFIGS.map((r) => {
                const isItemHovered = hoveredReaction === r.key;
                return (
                  <motion.div
                    key={r.key}
                    onMouseEnter={() => setHoveredReaction(r.key)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    onClick={(e) => handleSelectReaction(r.key, e)}
                    whileHover={{ scale: 1.38, y: -6 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '2px 4px',
                      borderRadius: '50%'
                    }}
                  >
                    {/* Floating Tooltip Pill Above Hovered Reaction */}
                    <AnimatePresence>
                      {isItemHovered && (
                        <motion.span
                          initial={{ opacity: 0, y: 4, scale: 0.75 }}
                          animate={{ opacity: 1, y: -16, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.75 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            background: 'rgba(15, 23, 42, 0.92)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 1000
                          }}
                        >
                          {r.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Reaction Animated Icon */}
                    <ReactionIcon config={r} size={38} loop={true} />

                    {/* Subtle label below icon matching Flutter _ReactionItem */}
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: isItemHovered ? 800 : 600,
                        color: isItemHovered ? r.color : 'var(--text-muted)',
                        marginTop: '1px',
                        transition: 'color 0.15s ease, font-weight 0.15s ease',
                        pointerEvents: 'none'
                      }}
                    >
                      {r.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN LIKE / REACTION BUTTON ── */}
      <button 
        type="button"
        className={`fb-action-btn ${isReacted ? 'reacted' : ''} ${className}`}
        onClick={handleButtonClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          color: isReacted ? activeConfig.color : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: isReacted ? 700 : 600,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          background: isReacted ? `${activeConfig.color}15` : 'transparent',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          userSelect: 'none'
        }}
      >
        {isReacted ? (
          <motion.div
            key={activeConfig.key}
            initial={{ scale: 0.3, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 14 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ReactionIcon config={activeConfig} size={20} loop={false} />
          </motion.div>
        ) : (
          <ThumbsUp size={18} fill="none" />
        )}
        <span style={{ fontSize: '13.5px' }}>
          {activeConfig ? activeConfig.label : 'Like'}
        </span>
      </button>
    </div>
  );
}
