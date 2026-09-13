import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  BookOpen, 
  CalendarPlus, 
  X,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickActionSheet({ isOpen, onClose }) {
  const { setActiveTab, openModal, showToast } = useApp();

  if (!isOpen) return null;

  const handleAction = (type) => {
    onClose();
    switch (type) {
      case 'scanner':
        setActiveTab('ai');
        break;
      case 'addPet':
        openModal('addPet');
        break;
      case 'createPost':
        setActiveTab('community');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-create-post'));
        }, 150);
        break;
      case 'writeBlog':
        setActiveTab('food');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-article-editor'));
        }, 150);
        break;
      case 'addEvent':
        openModal('booking');
        break;
      default:
        break;
    }
  };

  const actions = [
    {
      id: 'scanner',
      label: 'AI Scanner',
      icon: Sparkles,
      color: '#7C4DFF',
      bgColor: 'rgba(124, 77, 255, 0.12)',
      borderColor: 'rgba(124, 77, 255, 0.25)',
    },
    {
      id: 'addPet',
      label: 'Add Pet',
      icon: Plus,
      color: '#1AB680',
      bgColor: 'rgba(26, 182, 128, 0.12)',
      borderColor: 'rgba(26, 182, 128, 0.25)',
    },
    {
      id: 'createPost',
      label: 'Create Post',
      icon: Edit3,
      color: '#1877F2',
      bgColor: 'rgba(24, 119, 242, 0.12)',
      borderColor: 'rgba(24, 119, 242, 0.25)',
    },
    {
      id: 'writeBlog',
      label: 'Write Blog',
      icon: BookOpen,
      color: '#00B6D2',
      bgColor: 'rgba(0, 182, 210, 0.12)',
      borderColor: 'rgba(0, 182, 210, 0.25)',
    },
    {
      id: 'addEvent',
      label: 'Add Event',
      icon: CalendarPlus,
      color: '#FF9500',
      bgColor: 'rgba(255, 149, 0, 0.12)',
      borderColor: 'rgba(255, 149, 0, 0.25)',
    },
  ];

  return (
    <AnimatePresence>
      <div 
        className="modal-backdrop" 
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '24px',
          zIndex: 99999,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          className="modal-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '520px',
            width: '92%',
            borderRadius: '28px',
            padding: '24px 24px 28px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '10px', 
                  background: 'var(--primary-tint)', 
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Zap size={18} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Quick Actions ⚡
              </h3>
            </div>
            <button 
              className="icon-btn" 
              onClick={onClose} 
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color="var(--text-muted)" />
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="quick-action-grid">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  className="quick-action-card"
                  onClick={() => handleAction(act.id)}
                >
                  <div
                    className="quick-action-icon-box"
                    style={{
                      background: act.bgColor,
                      border: `1.5px solid ${act.borderColor}`,
                      color: act.color,
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="quick-action-label">{act.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

