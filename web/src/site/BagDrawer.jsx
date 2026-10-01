import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { useRouter } from '../lib/router.jsx';
import { Icon, Button, Ph, Portal } from '../ui/index.jsx';
import { money } from '../lib/format.js';
import { DELIVERY } from '../data/content.js';

export function Stepper({ value, onChange, min = 0 }) {
  return (
    <div className="stepper">
      <button aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))}><Icon name="minus" size={14} /></button>
      <span className="num">{value}</span>
      <button aria-label="Increase" onClick={() => onChange(value + 1)}><Icon name="plus" size={14} /></button>
    </div>
  );
}

export default function BagDrawer() {
  const { bagOpen, setBagOpen, cart, setQty, removeLine, totals, coupon, applyCoupon, removeCoupon, activePet, products, addToCart } = useStore();
  const { navigate } = useRouter();
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState('');

  useEffect(() => {
    if (!bagOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setBagOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [bagOpen, setBagOpen]);

  const pairs = useMemo(() => {
    const inBag = new Set(cart.map((i) => i.id));
    return (products.items || []).filter((p) => !inBag.has(p.id) && p.stockCount !== 0 && !p.isRx).slice(0, 4);
  }, [cart, products.items]);

  if (!bagOpen) return null;

  const pct = Math.min(100, Math.round(((totals.subtotal - totals.discount) / DELIVERY.freeOver) * 100));

  return (
    <Portal>
      <div className="scrim" onClick={() => setBagOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your care bag">
        <div className="drawer-head">
          <div>
            <h2 className="display-3">Your care bag</h2>
            <div className="sub" style={{ fontSize: 14, marginTop: 4 }}>
              {totals.count} {totals.count === 1 ? 'item' : 'items'}{activePet ? ` · for ${activePet.name}` : ''}
            </div>
          </div>
          <button className="btn btn-outline btn-square" onClick={() => setBagOpen(false)} aria-label="Close bag"><Icon name="x" /></button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty">
              <span className="well lg round" style={{ margin: '0 auto 12px' }}><Icon name="bag" size={22} /></span>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Your bag is empty</div>
              <div className="sub" style={{ marginTop: 4 }}>Medicines, food and gear you add will show up here.</div>
              <Button variant="dark" style={{ marginTop: 18 }} onClick={() => { setBagOpen(false); navigate('/shop'); }}>Browse the shop</Button>
            </div>
          ) : (
            <>
              <div className="free-bar">
                <span className="well round" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}><Icon name="cold" size={17} /></span>
                <div className="grow">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {totals.freeShip ? 'Free delivery unlocked' : `Add ${money(totals.toFree)} for free delivery`}
                  </div>
                  <div className="free-meter"><span style={{ width: `${totals.freeShip ? 100 : pct}%` }} /></div>
                </div>
              </div>

              {cart.map((i) => (
                <div key={`${i.id}-${i.variant}`} className="bag-line">
                  <div className="row gap-16" style={{ alignItems: 'flex-start' }}>
                    <Ph src={i.image} tone={i.coldChain ? 'teal' : ''} style={{ width: 84, height: 84, flex: 'none' }} label=" " />
                    <div className="grow">
                      <div className="row between" style={{ alignItems: 'flex-start' }}>
                        <div>
                          <div className="eyebrow muted" style={{ fontSize: 10 }}>{i.brand}</div>
                          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>{i.name}</div>
                        </div>
                        <button className="btn btn-ghost btn-square btn-sm" onClick={() => removeLine(i.id, i.variant)} aria-label={`Remove ${i.name}`}><Icon name="x" size={15} /></button>
                      </div>
                      <div className="row gap-6 wrap" style={{ marginTop: 8 }}>
                        {i.variant && <span className="pill">{i.variant}</span>}
                        {i.coldChain && <span className="pill teal">Cold-chain</span>}
                        {i.subscribe && <span className="pill teal">Auto-refill available</span>}
                      </div>
                    </div>
                  </div>
                  {i.isRx && (
                    <div className="rx-note">
                      <Icon name="file" size={15} />
                      <span className="grow">Vet approval needed before dispatch</span>
                      <span className="link" style={{ color: 'var(--yellow-ink)' }}>Upload at checkout</span>
                    </div>
                  )}
                  <div className="row between" style={{ marginTop: 14 }}>
                    <Stepper value={i.qty} onChange={(v) => setQty(i.id, i.variant, v)} />
                    <div className="row gap-8">
                      {i.compareAt > i.price && <s className="subtle" style={{ fontSize: 13 }}>{money(i.compareAt)}</s>}
                      <b style={{ fontSize: 17 }}>{money(i.price * i.qty)}</b>
                    </div>
                  </div>
                </div>
              ))}

              {pairs.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="row between" style={{ marginBottom: 10 }}>
                    <b style={{ fontSize: 14 }}>Pairs well with these</b>
                    {activePet && <span className="sub">Based on {activePet.name}'s plan</span>}
                  </div>
                  <div className="pair-row">
                    {pairs.map((p) => (
                      <div key={p.id} className="pair-card">
                        <Ph src={p.image} style={{ height: 70 }} label=" " />
                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, lineHeight: 1.3 }}>{p.name}</div>
                        <div className="row between" style={{ marginTop: 6 }}>
                          <span style={{ fontSize: 13 }}>{money(p.price)}</span>
                          <button className="btn btn-dark btn-sm btn-square" aria-label={`Add ${p.name}`} onClick={() => addToCart(p, { open: false })}><Icon name="plus" size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-foot">
            {coupon ? (
              <div className="coupon-applied">
                <Icon name="check" size={15} />
                <span className="mono grow" style={{ fontWeight: 500 }}>{coupon.code} applied</span>
                <button className="link" onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <form className="row gap-8" onSubmit={(e) => { e.preventDefault(); setCodeErr(applyCoupon(code) ? '' : 'That code isn’t valid'); }}>
                <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" aria-label="Promo code" style={{ height: 44 }} />
                <button className="btn btn-outline">Apply</button>
              </form>
            )}
            {codeErr && <div className="red" style={{ fontSize: 12, marginTop: 6 }}>{codeErr}</div>}
            <div style={{ marginTop: 12 }}>
              <div className="kv"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="kv"><span>Discount</span><span className="teal">−{money(totals.discount)}</span></div>}
              <div className="kv"><span>{totals.needsCold ? 'Cold-chain delivery' : 'Delivery'}</span><span className="teal">{totals.shipping ? money(totals.shipping) : 'Free'}</span></div>
            </div>
            <hr className="divider" style={{ margin: '10px 0' }} />
            <div className="row between">
              <b style={{ fontSize: 16 }}>Total</b>
              <b style={{ fontSize: 28, letterSpacing: '-0.02em' }}>{money(totals.total)}</b>
            </div>
            <Button variant="dark" size="lg" block icon="lock" style={{ marginTop: 14 }} onClick={() => { setBagOpen(false); navigate('/checkout'); }}>
              Checkout securely
            </Button>
            <div className="row gap-8" style={{ marginTop: 10 }}>
              <Button variant="outline" block onClick={() => { setBagOpen(false); navigate('/checkout?pay=bKash'); }}>bKash</Button>
              <Button variant="outline" block onClick={() => { setBagOpen(false); navigate('/checkout?pay=Nagad'); }}>Nagad</Button>
            </div>
          </div>
        )}
      </aside>
    </Portal>
  );
}
