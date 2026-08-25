import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, Circle, Truck, Package, Clock } from 'lucide-react';

const STEPS = ['Placed', 'Confirmed', 'In Preparation', 'Out for Delivery', 'Delivered'];

export default function OrderTrackerModal() {
  const { closeModal, modalData } = useApp();

  const order = modalData || {
    id: 'PM-ORD-8941',
    date: '2026-08-24',
    status: 'In Preparation',
    address: 'House 14, Road 7, Banani, Dhaka',
    total: 64.99,
    items: [{ id: 'p1', name: 'Royal Canin Golden Retriever Adult', price: 64.99, qty: 1 }]
  };

  const currentStepIdx = Math.max(0, STEPS.indexOf(order.status || 'Placed'));

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Live Order Tracking</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Order ID: <strong style={{ color: 'var(--primary)' }}>{order.id}</strong></p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {/* Stepper Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
          {STEPS.map((step, idx) => {
            const isDone = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div 
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isDone ? '#10b981' : 'var(--surface-alt)',
                    color: isDone ? '#fff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: isCurrent ? '2px solid var(--primary)' : 'none',
                    boxShadow: isCurrent ? '0 0 12px rgba(16,185,129,0.5)' : 'none'
                  }}
                >
                  {isDone ? <CheckCircle2 size={18} /> : (idx + 1)}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '14px', color: isDone ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {step}
                  </strong>
                  {isCurrent && (
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                      Current status • Driver dispatched shortly
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Details */}
        <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Destination:</span>
            <strong>{order.address}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Order Total:</span>
            <strong style={{ color: 'var(--primary)' }}>${order.total?.toFixed ? order.total.toFixed(2) : order.total}</strong>
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', marginTop: '18px', padding: '12px' }} onClick={closeModal}>
          Done
        </button>
      </div>
    </div>
  );
}
