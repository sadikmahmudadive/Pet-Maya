import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export default function CartDrawer() {
  const { cart, cartTotal, updateCartQty, removeFromCart, appliedCoupon, applyCoupon, openModal, closeModal } = useApp();
  const [couponInput, setCouponInput] = useState('');

  const freeShipThreshold = 1000;
  const isFreeShipping = appliedCoupon?.freeShipping || cartTotal >= freeShipThreshold || cartTotal === 0;
  const discountAmount = appliedCoupon?.discountPct ? (cartTotal * appliedCoupon.discountPct) : 0;
  const shippingFee = isFreeShipping ? 0 : 60.00;
  const finalTotal = Math.max(0, cartTotal - discountAmount + shippingFee);
  const freeShipProgress = Math.min(100, Math.round((cartTotal / freeShipThreshold) * 100));

  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput.trim());
    setCouponInput('');
  };

  const handleQuickApplyCoupon = (code) => {
    applyCoupon(code);
  };

  const handleProceedToCheckout = () => {
    closeModal();
    openModal('checkout', { 
      subtotal: cartTotal, 
      discount: discountAmount, 
      shipping: shippingFee, 
      total: finalTotal 
    });
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        style={{ 
          width: '100%', 
          maxWidth: '440px',
          height: '100%', 
          maxHeight: '100vh', 
          borderRadius: '0', 
          position: 'fixed', 
          right: 0, 
          top: 0, 
          bottom: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          margin: 0,
          background: 'var(--surface-solid, var(--surface))',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.35)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Your Shopping Bag</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {cart.reduce((acc, i) => acc + (i.qty || 1), 0)} items in bag
              </span>
            </div>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {/* Free Shipping Progress Bar */}
        {cart.length > 0 && (
          <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '12px', marginTop: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} color={isFreeShipping ? '#10B981' : 'var(--text-muted)'} />
                <span style={{ fontWeight: 700, color: isFreeShipping ? '#10B981' : 'var(--text-main)' }}>
                  {isFreeShipping 
                    ? '✓ FREE Express Delivery Unlocked!' 
                    : `Add ৳${(freeShipThreshold - cartTotal).toFixed(2)} more for FREE delivery`}
                </span>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{freeShipProgress}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${freeShipProgress}%`, 
                  height: '100%', 
                  background: isFreeShipping ? '#10B981' : 'linear-gradient(90deg, #3B82F6, #10B981)',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 0', scrollbarWidth: 'thin' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShoppingBag size={28} style={{ opacity: 0.4 }} />
              </div>
              <strong style={{ display: 'block', fontSize: '17px', color: 'var(--text-main)', marginBottom: '6px' }}>Your shopping bag is empty</strong>
              <p style={{ fontSize: '13px', margin: '0 0 18px 0', lineHeight: 1.5 }}>
                Explore veterinary-grade diets, genuine prescription medications, and smart GPS collars!
              </p>
              <button 
                className="apple-btn-blue" 
                style={{ padding: '10px 20px', margin: '0 auto' }} 
                onClick={closeModal}
              >
                Browse Pet Shop
              </button>
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
                  borderRadius: '14px',
                  border: '1px solid var(--border)'
                }}
              >
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{ width: 56, height: 56, borderRadius: '10px', objectFit: 'cover', background: '#FFF' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '13px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                    {item.name}
                  </strong>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>
                    ৳{Number(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button 
                    className="icon-btn" 
                    style={{ width: 28, height: 28 }} 
                    onClick={() => updateCartQty(item.id, -1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>
                    {item.qty}
                  </span>
                  <button 
                    className="icon-btn" 
                    style={{ width: 28, height: 28 }} 
                    onClick={() => updateCartQty(item.id, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                  <button 
                    className="icon-btn" 
                    style={{ width: 28, height: 28, color: '#EF4444', marginLeft: '2px' }} 
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    title="Remove item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Promo & Checkout */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Promo Code Input & Quick Chips */}
            <div>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  className="input-clean" 
                  placeholder="Promo code..." 
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '12.5px', flex: 1 }}
                />
                <button type="submit" className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                  <Tag size={13} />
                  <span>Apply</span>
                </button>
              </form>

              {/* Quick Promo Chips */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Quick:</span>
                <button 
                  type="button" 
                  onClick={() => handleQuickApplyCoupon('PETMAYA10')}
                  style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', border: '1px dashed var(--primary)', borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  PETMAYA10 (-10%)
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickApplyCoupon('FREESHIP')}
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px dashed #3B82F6', borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  FREESHIP
                </button>
              </div>

              {appliedCoupon && (
                <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span>Coupon ({appliedCoupon.code}) Active:</span>
                  <span>{appliedCoupon.label}</span>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>৳{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                  <span>Discount:</span>
                  <span>-৳{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Delivery:</span>
                <span>{shippingFee === 0 ? <strong style={{ color: '#10B981' }}>FREE</strong> : `৳${shippingFee.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <span>Total:</span>
                <span style={{ color: 'var(--primary)' }}>৳{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Trust Guarantee Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '4px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} color="#10B981" />
                <span>SSL Encrypted</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} color="#3B82F6" />
                <span>Cash on Delivery</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} color="#F59E0B" />
                <span>bKash / Cards</span>
              </span>
            </div>

            {/* Checkout CTA */}
            <button 
              className="btn-primary" 
              style={{ padding: '12px', width: '100%', fontSize: '15px', justifyContent: 'center' }} 
              onClick={handleProceedToCheckout}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
