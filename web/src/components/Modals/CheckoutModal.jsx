import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  X, CheckCircle2, MapPin, CreditCard, Banknote, 
  Truck, ShieldCheck, ShoppingBag, ArrowRight 
} from 'lucide-react';

export default function CheckoutModal() {
  const { closeModal, modalData, cart, placeOrder, openModal } = useApp();
  const { currentUser } = useAuth();

  const [address, setAddress] = useState(currentUser?.address || 'House 14, Road 7, Block D, Banani, Dhaka');
  const [phone, setPhone] = useState(currentUser?.phone || '+880 1712-345678');
  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka'); // 'inside_dhaka' (60) or 'outside_dhaka' (120)
  const [paymentMethod, setPaymentMethod] = useState('bKash / Mobile Banking');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single direct "Buy Now" product vs full cart
  const singleItem = modalData?.product;
  const items = singleItem 
    ? [{ id: singleItem.id, name: singleItem.name, price: singleItem.price, qty: 1, image: singleItem.image }]
    : cart;

  const subtotal = items.reduce((acc, item) => acc + item.price * (item.qty || 1), 0);
  const deliveryCharge = deliveryZone === 'inside_dhaka' ? 60 : 120;
  const total = subtotal + deliveryCharge;

  // Auto-detect zone if address changes
  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    if (val.toLowerCase().includes('dhaka')) {
      setDeliveryZone('inside_dhaka');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await placeOrder({
        address: `${address} (Zone: ${deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})`,
        phone,
        paymentMethod,
        shippingCharges: deliveryCharge,
        subtotal,
        total,
        items
      });
      closeModal();
      openModal('orderTracker');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '580px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                background: 'rgba(26,182,128,0.12)', 
                color: 'var(--primary)', 
                padding: '3px 8px', 
                borderRadius: '8px', 
                fontSize: '11px', 
                fontWeight: 800, 
                textTransform: 'uppercase' 
              }}>
                Instant Dispatch
              </span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Order Checkout
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Select your delivery destination zone and preferred payment mode.
            </p>
          </div>
          <button className="icon-btn" onClick={closeModal} title="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Items Summary Preview */}
          <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
              <span>ITEMS ORDERED ({items.length})</span>
              <span>SUBTOTAL: ৳{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.slice(0, 3).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                    {item.name} <strong style={{ color: 'var(--text-muted)' }}>×{item.qty || 1}</strong>
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    ৳{((item.price) * (item.qty || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
              {items.length > 3 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  + {items.length - 3} more item(s) in bag
                </span>
              )}
            </div>
          </div>

          {/* Delivery Zone Selector */}
          <div>
            <label className="label-mini" style={{ marginBottom: '8px', display: 'block' }}>Delivery Location Zone</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div 
                onClick={() => setDeliveryZone('inside_dhaka')}
                style={{
                  border: deliveryZone === 'inside_dhaka' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: deliveryZone === 'inside_dhaka' ? 'rgba(26,182,128,0.06)' : 'var(--surface-alt)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Inside Dhaka</strong>
                  <span style={{ 
                    background: 'var(--primary)', 
                    color: '#fff', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    padding: '2px 6px', 
                    borderRadius: '6px' 
                  }}>
                    ৳60
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  ⚡ Express 24-48 hrs delivery
                </span>
              </div>

              <div 
                onClick={() => setDeliveryZone('outside_dhaka')}
                style={{
                  border: deliveryZone === 'outside_dhaka' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: deliveryZone === 'outside_dhaka' ? 'rgba(26,182,128,0.06)' : 'var(--surface-alt)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Outside Dhaka</strong>
                  <span style={{ 
                    background: '#F59E0B', 
                    color: '#fff', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    padding: '2px 6px', 
                    borderRadius: '6px' 
                  }}>
                    ৳120
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  🚚 Courier Nationwide 3-5 days
                </span>
              </div>
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label className="label-mini">Delivery Street Address &amp; House Details</label>
            <textarea 
              className="input-clean" 
              rows={2} 
              value={address} 
              onChange={handleAddressChange} 
              placeholder="House, Road, Area, City"
              required 
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="label-mini">Contact Mobile Phone Number</label>
            <input 
              type="text" 
              className="input-clean" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+880 1..."
              required 
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="label-mini">Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button 
                type="button" 
                className={`chip-pill ${paymentMethod.includes('bKash') ? 'active' : ''}`}
                style={{ padding: '9px 6px', textAlign: 'center', fontSize: '12px' }}
                onClick={() => setPaymentMethod('bKash / Mobile Banking')}
              >
                <CreditCard size={14} style={{ display: 'inline', marginRight: 4 }} />
                <span>bKash / Nagad</span>
              </button>

              <button 
                type="button" 
                className={`chip-pill ${paymentMethod.includes('Card') ? 'active' : ''}`}
                style={{ padding: '9px 6px', textAlign: 'center', fontSize: '12px' }}
                onClick={() => setPaymentMethod('Card Payment')}
              >
                <CreditCard size={14} style={{ display: 'inline', marginRight: 4 }} />
                <span>Card</span>
              </button>

              <button 
                type="button" 
                className={`chip-pill ${paymentMethod.includes('Cash') ? 'active' : ''}`}
                style={{ padding: '9px 6px', textAlign: 'center', fontSize: '12px' }}
                onClick={() => setPaymentMethod('Cash on Delivery')}
              >
                <Banknote size={14} style={{ display: 'inline', marginRight: 4 }} />
                <span>COD</span>
              </button>
            </div>
          </div>

          {/* Price Calculation Summary Box */}
          <div style={{ 
            background: 'var(--surface-alt)', 
            padding: '14px', 
            borderRadius: 'var(--radius-sm)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Items Subtotal:</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Delivery Fee ({deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Nationwide'}):</span>
              <span>৳{deliveryCharge.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)', marginTop: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>Total Payable:</span>
              <strong style={{ fontSize: '22px', color: 'var(--primary)' }}>
                ৳{total.toFixed(2)}
              </strong>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || items.length === 0}
            className="btn-primary" 
            style={{ padding: '13px', fontSize: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <CheckCircle2 size={18} />
            <span>{isSubmitting ? 'Confirming Order...' : 'Confirm & Place Order'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
