import { useEffect, useState } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../config/firebase';
import { Icon, Button, Ph, Pill, Field, Empty } from '../../ui/index.jsx';
import { money, cx } from '../../lib/format.js';
import { DELIVERY } from '../../data/content.js';

const PAYMENTS = [
  { k: 'bKash', icon: 'phoneDevice', sub: 'Mobile payment' },
  { k: 'Nagad', icon: 'phoneDevice', sub: 'Mobile payment' },
  { k: 'Card', icon: 'card', sub: 'Visa · Mastercard · Amex' },
  { k: 'Cash on delivery', icon: 'cash', sub: 'Non-Rx orders only' },
];

export default function Checkout() {
  const { cart, totals, coupon, applyCoupon, removeCoupon, placeOrder, user, activePet, toast } = useStore();
  const { navigate, query } = useRouter();

  const [f, setF] = useState({
    email: user?.email || '', phone: user?.phone || '', name: user?.name || '',
    address: user?.address || '', area: '', city: 'Dhaka', note: '',
  });
  const [delivery, setDelivery] = useState('express');
  const [sms, setSms] = useState(true);
  const [pay, setPay] = useState(query.get('pay') || 'bKash');
  const [code, setCode] = useState('');
  const [rxFile, setRxFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) setF((x) => ({ ...x, email: x.email || user.email || '', name: x.name || user.name || '', phone: x.phone || user.phone || '', address: x.address || user.address || '' }));
  }, [user]);
  useEffect(() => { if (totals.needsRx && pay === 'Cash on delivery') setPay('bKash'); }, [totals.needsRx, pay]);

  if (cart.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="card"><Empty icon="bag" title="Your bag is empty"><Link to="/shop" className="link">Continue shopping</Link></Empty></div>
      </div>
    );
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const shipping = totals.needsCold
    ? (delivery === 'express' ? (totals.freeShip ? 0 : DELIVERY.coldExpressFee) : DELIVERY.coldStandardFee)
    : totals.shipping;
  const total = totals.subtotal - totals.discount + shipping;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.phone || !f.address || !f.name) { setErr('Please add your name, phone and delivery address.'); return; }
    setBusy(true);
    try {
      let rxUrl = '';
      if (rxFile && storage) {
        try {
          const r = ref(storage, `prescriptions/${user?.uid || 'guest'}/${Date.now()}_${rxFile.name}`);
          await uploadBytesResumable(r, rxFile);
          rxUrl = await getDownloadURL(r);
        } catch { /* order still goes through; pharmacy will ask for it */ }
      }
      const id = await placeOrder({
        ...f,
        address: [f.address, f.area, f.city].filter(Boolean).join(', '),
        delivery: totals.needsCold ? (delivery === 'express' ? DELIVERY.coldExpressLabel : DELIVERY.coldStandardLabel) : 'Standard',
        shipping,
        payment: pay,
        smsUpdates: sms,
        prescriptionUrl: rxUrl,
      });
      navigate(`/account/orders/${id}?placed=1`);
    } catch (ex) {
      setErr('We couldn’t place your order. Please check your connection and try again.');
      toast('Order failed — please try again', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="container" onSubmit={submit} style={{ paddingTop: 28 }}>
      <div className="steps">
        <div className="step done"><span className="n"><Icon name="check" size={14} stroke={2.5} /></span>Bag</div>
        <span className="step-line" />
        <div className="step now"><span className="n">2</span>Delivery & payment</div>
        <span className="step-line" />
        <div className="step"><span className="n">3</span>Confirmation</div>
      </div>

      <div className="split wide-right" style={{ marginTop: 24 }}>
        <div className="stack gap-16">
          <div className="card">
            <div className="eyebrow muted" style={{ textAlign: 'center', marginBottom: 14 }}>Express checkout</div>
            <div className="row gap-10">
              {['bKash', 'Nagad'].map((k) => (
                <button type="button" key={k} className="btn btn-outline grow" style={{ height: 50, borderColor: k === 'bKash' ? '#E2136E' : '#EC1C24', color: k === 'bKash' ? '#E2136E' : '#EC1C24', fontWeight: 600 }} onClick={() => setPay(k)}>{k}</button>
              ))}
              <button type="button" className="btn btn-outline grow" style={{ height: 50 }} onClick={() => setPay('Card')}><Icon name="lock" size={15} /> Card</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2 className="h-card" style={{ fontSize: 19 }}>Contact</h2>{!user && <Link to="/signin" className="link-plain" style={{ fontSize: 13 }}>Sign in</Link>}</div>
            <div className="fields">
              <Field label="Email" type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              <Field label="Mobile" type="tel" required value={f.phone} onChange={set('phone')} placeholder="+880 1XXX-XXXXXX" autoComplete="tel" />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2 className="h-card" style={{ fontSize: 19 }}>Delivery address</h2>{activePet && totals.needsRx && <Pill tone="teal" sm>For {activePet.name}</Pill>}</div>
            <div className="fields">
              <Field className="full" label="Full name" required value={f.name} onChange={set('name')} autoComplete="name" />
              <Field className="full" label="Address" required value={f.address} onChange={set('address')} placeholder="House, road, block" autoComplete="street-address" />
              <Field label="Area" value={f.area} onChange={set('area')} placeholder="e.g. Banani" />
              <Field label="City / postcode" value={f.city} onChange={set('city')} />
              <Field className="full" label="Note for the courier" hint="optional">
                <input className="input" value={f.note} onChange={set('note')} placeholder="e.g. Ring the gate bell; hand the box to me directly" />
              </Field>
            </div>
          </div>

          <div className="card">
            <h2 className="h-card" style={{ fontSize: 19, marginBottom: 16 }}>Delivery method</h2>
            {totals.needsCold ? (
              <div className="stack gap-10">
                <label className={cx('ship-opt', delivery === 'express' && 'on')}>
                  <input type="radio" className="radio" name="ship" checked={delivery === 'express'} onChange={() => setDelivery('express')} />
                  <div className="grow">
                    <div className="row gap-8"><b style={{ fontSize: 15 }}>{DELIVERY.coldExpressLabel}</b><Pill tone="solid-teal" mono sm>{DELIVERY.coldRange.replace(/ /g, '')}</Pill></div>
                    <div className="sub">Insulated box with temperature tag · today</div>
                  </div>
                  <b>{totals.freeShip || !DELIVERY.coldExpressFee ? 'Free' : money(DELIVERY.coldExpressFee)}</b>
                </label>
                <label className={cx('ship-opt', delivery === 'standard' && 'on')}>
                  <input type="radio" className="radio" name="ship" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} />
                  <div className="grow"><b style={{ fontSize: 15 }}>{DELIVERY.coldStandardLabel}</b><div className="sub">Refrigerated van · tomorrow 10 AM – 1 PM</div></div>
                  <b>{money(DELIVERY.coldStandardFee)}</b>
                </label>
              </div>
            ) : (
              <div className="ship-opt on">
                <Icon name="truck" size={20} className="teal" />
                <div className="grow"><b style={{ fontSize: 15 }}>Standard delivery</b><div className="sub">Same day inside Dhaka for orders before 4 PM</div></div>
                <b>{totals.shipping ? money(totals.shipping) : 'Free'}</b>
              </div>
            )}
            <label className="row gap-10" style={{ marginTop: 14, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" className="check" checked={sms} onChange={(e) => setSms(e.target.checked)} />
              Send delivery updates by SMS{f.phone ? ` to ${f.phone}` : ''}
            </label>
          </div>

          {totals.needsRx && (
            <div className="card" style={{ background: 'var(--yellow-tint)', borderColor: 'transparent' }}>
              <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                <span className="well white"><Icon name="file" /></span>
                <div className="grow">
                  <h2 className="h-card">Prescription needed</h2>
                  <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                    A licensed vet checks prescription items before we dispatch. Upload a photo now, or we’ll contact you after you order.
                  </p>
                  <label className="btn btn-outline btn-sm" style={{ marginTop: 12, cursor: 'pointer' }}>
                    <Icon name="upload" size={14} /> {rxFile ? rxFile.name : 'Upload prescription'}
                    <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => setRxFile(e.target.files?.[0] || null)} />
                  </label>
                  <span className="sub" style={{ marginLeft: 10 }}>No prescription? <Link to="/specialists" className="link">Book a vet</Link></span>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head"><h2 className="h-card" style={{ fontSize: 19 }}>Payment</h2><span className="row gap-6 sub"><Icon name="lock" size={13} /> Encrypted</span></div>
            <div className="pay-grid">
              {PAYMENTS.map((p) => {
                const disabled = p.k === 'Cash on delivery' && totals.needsRx;
                return (
                  <button type="button" key={p.k} disabled={disabled} className={cx('pay-tile', pay === p.k && 'on')} onClick={() => setPay(p.k)} style={disabled ? { opacity: 0.45 } : undefined}>
                    <Icon name={p.icon} size={17} />
                    <div><b style={{ fontSize: 14 }}>{p.k}</b><div className="sub" style={{ fontSize: 11 }}>{p.sub}</div></div>
                  </button>
                );
              })}
            </div>
            <div className="panel" style={{ marginTop: 14, fontSize: 13.5 }}>
              {pay === 'Cash on delivery'
                ? 'Pay the courier in cash or by mobile payment when your order arrives.'
                : `After you place the order you’ll complete payment securely with ${pay}. We never store your card or wallet PIN.`}
            </div>
          </div>
        </div>

        <aside className="stack gap-12" style={{ position: 'sticky', top: 150 }}>
          <div className="card" style={{ borderRadius: 28 }}>
            <div className="card-head"><h2 className="display-3" style={{ fontSize: 28 }}>Order summary</h2><Pill mono sm>{totals.count} items</Pill></div>
            <div className="stack gap-12">
              {cart.map((i) => (
                <div key={`${i.id}-${i.variant}`} className="row gap-12">
                  <div style={{ position: 'relative' }}>
                    <Ph src={i.image} label=" " style={{ width: 52, height: 52, minHeight: 0, borderRadius: 12 }} />
                    <span className="bag-count" style={{ position: 'absolute', top: -6, right: -6, background: 'var(--ink)', color: '#fff', minWidth: 18, height: 18, fontSize: 10 }}>{i.qty}</span>
                  </div>
                  <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</div><div className="sub" style={{ fontSize: 12 }}>{[i.variant, i.coldChain && 'requires 2°C–8°C'].filter(Boolean).join(' · ')}</div></div>
                  <b style={{ fontSize: 14 }}>{money(i.price * i.qty)}</b>
                </div>
              ))}
            </div>
            {coupon ? (
              <div className="coupon-applied" style={{ marginTop: 16 }}><Icon name="check" size={14} /><span className="mono grow">{coupon.code}</span><button type="button" className="link" onClick={removeCoupon}>Remove</button></div>
            ) : (
              <div className="row gap-8" style={{ marginTop: 16 }}>
                <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" aria-label="Promo code" />
                <button type="button" className="btn btn-soft" onClick={() => { if (!applyCoupon(code)) toast('That code isn’t valid', { tone: 'error' }); }}>Apply</button>
              </div>
            )}
            <hr className="divider" style={{ margin: '16px 0 8px' }} />
            <div className="kv"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div className="kv"><span>Voucher {coupon?.code}</span><span className="teal">−{money(totals.discount)}</span></div>}
            <div className="kv"><span>Delivery</span><span className="teal">{shipping ? money(shipping) : 'Free'}</span></div>
            {totals.needsRx && <div className="kv"><span>Vet prescription check</span><span className="teal">Included</span></div>}
            <hr className="divider" style={{ margin: '8px 0 14px' }} />
            <div className="row between" style={{ alignItems: 'baseline' }}>
              <b>Total</b>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em' }}>{money(total)}</div><div className="sub" style={{ fontSize: 11 }}>BDT · includes VAT</div></div>
            </div>
            {err && <div className="red" style={{ fontSize: 13, marginTop: 10 }}>{err}</div>}
            <Button type="submit" variant="dark" size="lg" block icon="lock" style={{ marginTop: 16 }} disabled={busy}>
              {busy ? 'Placing order…' : `Place order · ${money(total)}`}
            </Button>
            {totals.needsCold && (
              <div className="rx-note" style={{ alignItems: 'flex-start' }}>
                <Icon name="thermo" size={15} />
                <span><b>Cold hand-off:</b> check the temperature tag on arrival. If it shows the box got too warm, don’t accept it — we’ll send a free replacement.</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
