import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lottie from 'lottie-web';
import { ThumbsUp } from 'lucide-react';

export const REACTION_CONFIGS = [
  { key: 'Like', label: 'Like', color: '#1877F2', path: '/assets/lottie/reaction_like.json', fallbackEmoji: '👍' },
  { key: 'Love', label: 'Love', color: '#EF4444', path: '/assets/lottie/reaction_love.json', fallbackEmoji: '❤️' },
  { key: 'Haha', label: 'Haha', color: '#F59E0B', path: '/assets/lottie/reaction_haha.json', fallbackEmoji: '😆' },
  { key: 'Clap', label: 'Clap', color: '#10B981', path: '/assets/lottie/reaction_clap.json', fallbackEmoji: '👏' },
  { key: 'Insight', label: 'Insight', color: '#FBBF24', path: '/assets/lottie/reaction_insight.json', fallbackEmoji: '💡' },
  { key: 'Care', label: 'Care', color: '#8B5CF6', path: '/assets/lottie/reaction_care.json', fallbackEmoji: '💜' },
];

const lottieDataCache = {};

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
      .then(res => res.json())
      .then(json => {
        lottieDataCache[path] = json;
        if (isMounted) setData(json);
      })
      .catch(err => {
        console.warn('Failed to load Lottie at', path, err);
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
        style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
      />
    );
  }

  return (
    <span style={{ fontSize: `${size * 0.65}px`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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

  const activeReactionKey = userReaction || (isLiked ? 'Like' : null);
  const activeConfig = REACTION_CONFIGS.find(r => r.key.toLowerCase() === (activeReactionKey || '').toLowerCase());
  const isReacted = !!activeConfig;

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowPicker(false);
    setHoveredReaction(null);
  };

  const handleButtonClick = () => {
    if (isReacted) {
      onReact(activeConfig.key);
    } else {
      onReact('Like');
    }
    setShowPicker(false);
  };

  const handleSelectReaction = (reactionKey, e) => {
    e.stopPropagation();
    onReact(reactionKey);
    setShowPicker(false);
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: -4 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'rgba(28, 28, 30, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              marginBottom: '8px'
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
                  whileHover={{ scale: 1.35, y: -6 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 15 }}
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
                  <AnimatePresence>
                    {isItemHovered && (
                      <motion.span
                        initial={{ opacity: 0, y: 4, scale: 0.8 }}
                        animate={{ opacity: 1, y: -18, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#fff',
                          background: 'rgba(0,0,0,0.85)',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {r.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <ReactionIcon config={r} size={36} loop={true} />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        className={`fb-action-btn ${isReacted ? 'reacted' : ''} ${className}`}
        onClick={handleButtonClick}
        style={{ 
          color: isReacted ? activeConfig.color : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: isReacted ? 700 : 500,
          transition: 'all 0.2s ease',
          background: isReacted ? `${activeConfig.color}15` : 'transparent',
          padding: '6px 14px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {isReacted ? (
          <motion.div
            key={activeConfig.key}
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ReactionIcon config={activeConfig} size={20} loop={false} />
          </motion.div>
        ) : (
          <ThumbsUp size={18} fill="none" />
        )}
        <span style={{ fontSize: '13.5px' }}>{activeConfig ? activeConfig.label : 'Like'}</span>
      </button>
    </div>
  );
}
