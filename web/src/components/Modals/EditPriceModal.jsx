import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check } from 'lucide-react';

export default function EditPriceModal() {
  const { closeModal, modalData, updateVetPrice } = useApp();

  const [price, setPrice] = useState(modalData?.currentPrice || '$35/visit');
  const vetId = modalData?.vetId;
  const name = modalData?.name || 'Doctor';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!price.trim() || !vetId) return;

    updateVetPrice(vetId, price.trim());
    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Update Consultation Fee</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Setting fee for <strong style={{ color: 'var(--primary)' }}>{name}</strong>.</p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="label-mini">New Consultation Price</label>
            <input 
              type="text" 
              className="input-clean" 
              placeholder="e.g. $45/visit or $30/session" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px' }}>
            <Check size={16} />
            <span>Update Consultation Fee</span>
          </button>
        </form>
      </div>
    </div>
  );
}
