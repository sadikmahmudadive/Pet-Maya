import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { X, CheckCircle, MapPin, CreditCard, Banknote } from 'lucide-react';

export default function CheckoutModal() {
  const { closeModal, modalData, placeOrder } = useApp();
  const { currentUser } = useAuth();

  const [address, setAddress] = useState(currentUser?.address || 'House 14, Road 7, Block D, Banani, Dhaka');
  const [phone, setPhone] = useState(currentUser?.phone || '+880 1712-345678');
  const [paymentMethod, setPaymentMethod] = useState('bKash / Mobile Banking');

  const total = modalData?.total || 64.99;

  const handleSubmit = (e) => {
    e.preventDefault();
    placeOrder({
      address: `${address} (Phone: ${phone})`,
      paymentMethod,
      total
    });
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Fast Order Checkout</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Confirm your delivery address &amp; payment method.</p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="label-mini">Delivery Street Address</label>
            <textarea 
              className="input-clean" 
              rows={2} 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="label-mini">Contact Phone Number</label>
            <input 
              type="text" 
              className="input-clean" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="label-mini">Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                type="button" 
                className={`chip-pill ${paymentMethod.includes('bKash') ? 'active' : ''}`}
                style={{ padding: '10px', textAlign: 'center' }}
                onClick={() => setPaymentMethod('bKash / Mobile Banking')}
              >
                <CreditCard size={15} style={{ display: 'inline', marginRight: 6 }} />
                <span>bKash / Card</span>
              </button>

              <button 
                type="button" 
                className={`chip-pill ${paymentMethod.includes('Cash') ? 'active' : ''}`}
                style={{ padding: '10px', textAlign: 'center' }}
                onClick={() => setPaymentMethod('Cash on Delivery')}
              >
                <Banknote size={15} style={{ display: 'inline', marginRight: 6 }} />
                <span>Cash on Delivery</span>
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Total Payable:</span>
            <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>৳{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '13px', fontSize: '15px' }}>
            <CheckCircle size={16} />
            <span>Place Order Now</span>
          </button>
        </form>
      </div>
    </div>
  );
}
