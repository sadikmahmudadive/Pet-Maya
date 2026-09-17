import React from 'react';
import { useApp } from '../../context/AppContext';
import { X } from 'lucide-react';
import VetBookingFlow from '../Specialists/VetBookingFlow';

export default function BookingModal() {
  const { closeModal, modalData } = useApp();

  return (
    <div className="modal-backdrop" onClick={closeModal} style={{ overflowY: 'auto', padding: '40px 16px' }}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: 'none',
          padding: '28px 32px 36px',
          borderRadius: '24px',
          backgroundColor: 'var(--bg)',
          position: 'relative',
          margin: 'auto'
        }}
      >
        <button 
          className="icon-btn" 
          onClick={closeModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label="Close booking modal"
        >
          <X size={18} />
        </button>

        <VetBookingFlow 
          initialVet={modalData?.vet} 
          onComplete={closeModal} 
          onCancel={closeModal} 
        />
      </div>
    </div>
  );
}
