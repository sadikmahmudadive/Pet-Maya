import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';

export default function CartDrawer() {
  const { cart, cartTotal, updateCartQty, removeFromCart, appliedCoupon, applyCoupon, clearCart, openModal, closeModal } = useApp();
  const [couponInput, setCouponInput] = useState('');

  const discountAmount = appliedCoupon?.discountPct ? (cartTotal * appliedCoupon.discountPct) : 0;
  const shippingFee = (appliedCoupon?.freeShipping || cartTotal > 100 || cartTotal === 0) ? 0 : 5.00;
  const finalTotal = Math.max(0, cartTotal - discountAmount + shippingFee);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput.trim());
    setCouponInput('');
  };

  const handleProceedToCheckout = () => {
    closeModal();
    openModal('checkout', { subtotal: cartTotal, discount: discountAmount, shipping: shippingFee, total: finalTotal });
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        style={{ width: '100%', height: '100%', maxHeight: '100vh', borderRadius: '0', position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', margin: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} color="#10b981" />
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Your Shopping Cart</h3>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <strong style={{ display: 'block', fontSize: '16px' }}>Your cart is empty</strong>
              <span style={{ fontSize: '13px' }}>Add specialty diets, medications, or smart collars!</span>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id} 
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  background: 'var(--surface-alt)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <img src={item.image} alt={item.name} style={{ width: 52, height: 52, borderRadius: 'var(--radius-xs)', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '13.5px', display: 'block' }}>{item.name}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>${item.price.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => updateCartQty(item.id, -1)}>
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => updateCartQty(item.id, 1)}>
                    <Plus size={12} />
                  </button>
                  <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--danger)' }} onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Coupon & Checkout */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="Promo code (PETMAYA10, FREESHIP)" 
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '12.5px' }}
              />
              <button type="submit" className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                <Tag size={13} />
                <span>Apply</span>
              </button>
            </form>

            {appliedCoupon && (
              <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                <span>Coupon ({appliedCoupon.code}) Applied:</span>
                <span>{appliedCoupon.label}</span>
              </div>
            )}

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                  <span>Discount:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Delivery:</span>
                <span>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <span>Total:</span>
                <span style={{ color: 'var(--primary)' }}>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button className="btn-primary" style={{ padding: '12px', width: '100%', fontSize: '15px' }} onClick={handleProceedToCheckout}>
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
