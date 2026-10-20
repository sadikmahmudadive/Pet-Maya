import { useEffect, useState } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../config/firebase';
import { Icon, Button, Ph, Pill, Field, Empty } from '../../ui/index.jsx';
import { money, cx } from '../../lib/format.js';
import { DELIVERY, PAYMENT_CONFIG, BD_DISTRICTS, DHAKA_AREAS } from '../../data/content.js';
import { validateUpload, ownUploadPath } from '../../lib/security.js';
import { track, toItem } from '../../lib/analytics.js';

const PAYMENTS = [
  { k: 'Cash on delivery', icon: 'cash', sub: 'Pay cash or mobile wallet on arrival' },
  { k: 'bKash', icon: 'phoneDevice', sub: 'Send Money · TrxID or pay on delivery' },
  { k: 'Nagad', icon: 'phoneDevice', sub: 'Send Money · TrxID or pay on delivery' },
];

export default function Checkout() {
  const { cart, totals, coupon, applyCoupon, removeCoupon, placeOrder, user, activePet, savedAddresses, saveAddress, toast } = useStore();
  const { navigate, query } = useRouter();
  const defaultAddr = (savedAddresses || []).find((a) => a.isDefault) || (savedAddresses || [])[0] || null;

  const [f, setF] = useState({
    email: user?.email || '',
    phone: defaultAddr?.phone || user?.phone || '',
    name: defaultAddr?.name || user?.name || '',
    address: defaultAddr?.address || user?.address || '',
    area: defaultAddr?.area || user?.area || '',
    district: defaultAddr?.district || user?.city || 'Dhaka',
    note: defaultAddr?.note || '',
  });
  const [selectedAddrId, setSelectedAddrId] = useState(defaultAddr?.id || '');
  const [saveAddrNextTime, setSaveAddrNextTime] = useState(!(savedAddresses && savedAddresses.length > 0));
  const [addrLabel, setAddrLabel] = useState('Home');
  const [delivery, setDelivery] = useState('standard');
  const [sms, setSms] = useState(true);
  const [pay, setPay] = useState(query.get('pay') || 'Cash on delivery');
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [code, setCode] = useState('');
  const [rxFile, setRxFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      setF((x) => ({
        ...x,
        email: x.email || user.email || '',
        name: x.name || user.name || '',
        phone: x.phone || user.phone || '',
        address: x.address || user.address || '',
        area: x.area || user.area || '',
        district: x.district || user.city || 'Dhaka',
      }));
    }
  }, [user]);
  useEffect(() => { if (totals.needsCold) setDelivery('express'); }, [totals.needsCold]);
  useEffect(() => { if (cart.length) track('begin_checkout', { value: totals.subtotal, items: cart.map((l) => toItem(l)) }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (cart.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="card"><Empty icon="bag" title="Your bag is empty"><Link to="/shop" className="link">Continue shopping</Link></Empty></div>
      </div>
    );
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isInsideDhaka = f.district === 'Dhaka';
  const coldEligible = !totals.needsCold || (DELIVERY.coldDistricts || ['Dhaka']).includes(f.district);

  let shipping = 0;
  let deliveryLabel = 'Standard (Inside Dhaka)';
  if (totals.needsCold) {
    if (delivery === 'express') {
      shipping = totals.freeShip ? 0 : DELIVERY.coldExpressFee;
      deliveryLabel = DELIVERY.coldExpressLabel;
    } else {
      shipping = DELIVERY.coldStandardFee;
      deliveryLabel = DELIVERY.coldStandardLabel;
    }
  } else if (isInsideDhaka) {
    if (delivery === 'express') {
      shipping = DELIVERY.insideDhakaExpressFee;
      deliveryLabel = 'Express Dhaka (3–4 hours)';
    } else {
      shipping = totals.freeShip ? 0 : DELIVERY.insideDhakaFee;
      deliveryLabel = 'Inside Dhaka (Same day)';
    }
  } else {
    shipping = totals.freeShip ? 0 : DELIVERY.outsideDhakaFee;
    deliveryLabel = `Outside Dhaka Courier (${f.district})`;
  }

  const total = Math.max(0, totals.subtotal - totals.discount + shipping);
  const walletNumber = pay === 'bKash' ? PAYMENT_CONFIG.bkashNumber : PAYMENT_CONFIG.nagadNumber;

  const copyWalletNumber = () => {
    navigator.clipboard?.writeText(walletNumber);
    toast(`Copied ${pay} number ${walletNumber}`);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.phone.trim() || !f.address.trim() || !f.name.trim()) {
      setErr('Please enter your full name, mobile number, and delivery address.');
      return;
    }
    const cleanPhone = f.phone.replace(/[\s()-]/g, '');
    if (!/^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone) && cleanPhone.length < 8) {
      setErr('Please enter a valid Bangladesh mobile number (e.g. 017XXXXXXXX or +88017XXXXXXXX).');
      return;
    }
    if (!coldEligible) {
      setErr(`Cold-chain medicines (${DELIVERY.coldRange}) can only be delivered to ${(DELIVERY.coldDistricts || ['Dhaka']).join(', ')} to guarantee temperature safety.`);
      return;
    }
    setBusy(true);
    try {
      let rxUrl = '';
      if (rxFile && storage && user?.uid && !String(user.uid).startsWith('demo_guest')) {
        try {
          const type = await validateUpload(rxFile, 'document');
          const r = ref(storage, ownUploadPath('prescriptions', user.uid, type.ext));
          await uploadBytesResumable(r, rxFile, { contentType: type.contentType });
          rxUrl = await getDownloadURL(r);
        } catch (uploadErr) {
          if (uploadErr?.message && !uploadErr.code) setErr(uploadErr.message);
        }
      }
      if (saveAddrNextTime) {
        saveAddress({
          id: selectedAddrId || undefined,
          label: addrLabel || 'Home',
          name: f.name.trim(),
          phone: f.phone.trim(),
          district: f.district,
          area: f.area.trim(),
          address: f.address.trim(),
          note: f.note.trim(),
          isDefault: !(savedAddresses && savedAddresses.length > 0),
        });
      }
      const id = await placeOrder({
        ...f,
        city: f.district,
        district: f.district,
        deliveryZone: isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka',
        address: [f.address, f.area, f.district].filter(Boolean).join(', '),
        delivery: deliveryLabel,
        shipping,
        payment: pay,
        paymentTrxId: (pay === 'bKash' || pay === 'Nagad') ? trxId.trim().toUpperCase() : '',
        paymentSender: (pay === 'bKash' || pay === 'Nagad') ? (senderPhone.trim() || f.phone.trim()) : '',
        smsUpdates: sms,
        prescriptionUrl: rxUrl,
      });
      navigate(`/account/orders/${id}?placed=1`);
    } catch (ex) {
      setErr(ex?.message || 'We couldn’t place your order. Please check your connection and try again.');
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
            <div className="card-head">
              <div>
                <h2 className="h-card" style={{ fontSize: 19 }}>Contact</h2>
                {!user && <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>Checking out as a guest · <Link to="/signin" className="link">Sign in</Link> to earn loyalty points</div>}
              </div>
              {user && <Pill tone="teal" sm>Signed in</Pill>}
            </div>
            <div className="fields">
              <Field label="Email" type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              <Field label="Mobile (Bangladesh)" type="tel" required value={f.phone} onChange={set('phone')} placeholder="017XX-XXXXXX" autoComplete="tel" />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2 className="h-card" style={{ fontSize: 19 }}>Delivery address</h2>
              <div className="row gap-6">
                <Pill tone={isInsideDhaka ? 'teal' : ''} sm>{isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka'}</Pill>
                {activePet && totals.needsRx && <Pill tone="yellow" sm>For {activePet.name}</Pill>}
              </div>
            </div>
            {(savedAddresses || []).length > 0 && (
              <div className="stack gap-8" style={{ marginBottom: 16 }}>
                <div className="sub" style={{ fontSize: 12 }}>Saved addresses — tap to autofill</div>
                <div className="row gap-8 wrap">
                  {savedAddresses.map((addr) => {
                    const active = selectedAddrId === addr.id;
                    return (
                      <button
                        type="button"
                        key={addr.id}
                        className={cx('pill', active ? 'solid-teal' : 'outline')}
                        style={{ height: 34, padding: '0 14px', cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedAddrId(addr.id);
                          setAddrLabel(addr.label || 'Home');
                          setF((prev) => ({
                            ...prev,
                            name: addr.name || prev.name,
                            phone: addr.phone || prev.phone,
                            district: addr.district || 'Dhaka',
                            area: addr.area || '',
                            address: addr.address || '',
                            note: addr.note || '',
                          }));
                        }}
                      >
                        <Icon name="pin" size={12} /> {addr.label || 'Address'} · {addr.area || addr.district}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="pill outline"
                    style={{ height: 34, padding: '0 12px', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedAddrId('');
                      setAddrLabel('Home');
                      setSaveAddrNextTime(true);
                      setF((prev) => ({ ...prev, address: '', area: '', note: '' }));
                    }}
                  >
                    + New address
                  </button>
                </div>
              </div>
            )}
            <div className="fields">
              <Field className="full" label="Full name" required value={f.name} onChange={set('name')} autoComplete="name" />
              <Field label="District" required>
                <select className="select" value={f.district} onChange={set('district')} aria-label="District">
                  {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label={isInsideDhaka ? 'Area / Thana' : 'Upazila / Area'} required>
                <input
                  className="input"
                  list={isInsideDhaka ? 'dhaka-areas-list' : undefined}
                  value={f.area}
                  onChange={set('area')}
                  placeholder={isInsideDhaka ? 'e.g. Gulshan 2, Banani, Dhanmondi' : 'e.g. Agrabad, Zindabazar'}
                  required
                />
                {isInsideDhaka && (
                  <datalist id="dhaka-areas-list">
                    {DHAKA_AREAS.map((a) => <option key={a} value={a} />)}
                  </datalist>
                )}
              </Field>
              <Field className="full" label="Full street address" required value={f.address} onChange={set('address')} placeholder="House #, Road #, Block/Sector, Flat/Floor" autoComplete="street-address" />
              <Field className="full" label="Delivery instructions for the courier" hint="optional">
                <input className="input" value={f.note} onChange={set('note')} placeholder="e.g. Ring the gate bell; call before arriving" />
              </Field>
            </div>
            <div className="row between wrap gap-10" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <label className="row gap-8" style={{ fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" className="check" checked={saveAddrNextTime} onChange={(e) => setSaveAddrNextTime(e.target.checked)} />
                Save this address for future orders
              </label>
              {saveAddrNextTime && (
                <div className="row gap-6">
                  {['Home', 'Office', 'Clinic', 'Other'].map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      className={cx('pill', addrLabel === lbl ? 'solid-teal' : 'outline')}
                      style={{ height: 26, padding: '0 10px', fontSize: 11, cursor: 'pointer' }}
                      onClick={() => setAddrLabel(lbl)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="h-card" style={{ fontSize: 19, marginBottom: 16 }}>Delivery method</h2>
            {!coldEligible && (
              <div className="rx-note" style={{ marginBottom: 14, background: 'rgba(217, 72, 65, 0.1)', color: 'var(--red)', borderColor: 'var(--red)' }}>
                <Icon name="thermo" size={16} />
                <span>
                  <b>Cold-chain zone notice:</b> Your bag contains temperature-sensitive items ({DELIVERY.coldRange}) which can only be delivered within {(DELIVERY.coldDistricts || ['Dhaka']).join(', ')}. Please select a supported district or remove cold-chain items.
                </span>
              </div>
            )}
            {totals.needsCold ? (
              <div className="stack gap-10">
                <label className={cx('ship-opt', delivery === 'express' && 'on')}>
                  <input type="radio" className="radio" name="ship" checked={delivery === 'express'} onChange={() => setDelivery('express')} />
                  <div className="grow">
                    <div className="row gap-8"><b style={{ fontSize: 15 }}>{DELIVERY.coldExpressLabel}</b><Pill tone="solid-teal" mono sm>{DELIVERY.coldRange.replace(/ /g, '')}</Pill></div>
                    <div className="sub">Insulated box with temperature tag · same day in Dhaka</div>
                  </div>
                  <b>{totals.freeShip || !DELIVERY.coldExpressFee ? 'Free' : money(DELIVERY.coldExpressFee)}</b>
                </label>
                <label className={cx('ship-opt', delivery === 'standard' && 'on')}>
                  <input type="radio" className="radio" name="ship" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} />
                  <div className="grow"><b style={{ fontSize: 15 }}>{DELIVERY.coldStandardLabel}</b><div className="sub">Refrigerated van · tomorrow 10 AM – 1 PM</div></div>
                  <b>{money(DELIVERY.coldStandardFee)}</b>
                </label>
              </div>
            ) : isInsideDhaka ? (
              <div className="stack gap-10">
                <label className={cx('ship-opt', delivery === 'standard' && 'on')}>
                  <input type="radio" className="radio" name="ship" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} />
                  <div className="grow">
                    <b style={{ fontSize: 15 }}>Inside Dhaka Standard</b>
                    <div className="sub">Same day inside Dhaka for orders placed before 4 PM (free over {money(DELIVERY.freeOver)})</div>
                  </div>
                  <b>{totals.freeShip ? 'Free' : money(DELIVERY.insideDhakaFee)}</b>
                </label>
                <label className={cx('ship-opt', delivery === 'express' && 'on')}>
                  <input type="radio" className="radio" name="ship" checked={delivery === 'express'} onChange={() => setDelivery('express')} />
                  <div className="grow">
                    <div className="row gap-8"><b style={{ fontSize: 15 }}>Express Dhaka Dispatch</b><Pill tone="teal" sm>3–4 hrs</Pill></div>
                    <div className="sub">Priority rider from our Gulshan 2 central pharmacy</div>
                  </div>
                  <b>{money(DELIVERY.insideDhakaExpressFee)}</b>
                </label>
              </div>
            ) : (
              <div className="ship-opt on">
                <Icon name="truck" size={20} className="teal" />
                <div className="grow">
                  <b style={{ fontSize: 15 }}>Outside Dhaka Nationwide Courier ({f.district})</b>
                  <div className="sub">2–4 business days via tracked doorstep courier (free over {money(DELIVERY.freeOver)})</div>
                </div>
                <b>{totals.freeShip ? 'Free' : money(DELIVERY.outsideDhakaFee)}</b>
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
            <div className="card-head">
              <h2 className="h-card" style={{ fontSize: 19 }}>Payment method</h2>
              <Pill tone="teal" sm>Pay on delivery or Send Money</Pill>
            </div>
            <div className="pay-grid">
              {PAYMENTS.map((p) => (
                <button
                  type="button"
                  key={p.k}
                  className={cx('pay-tile', pay === p.k && 'on')}
                  onClick={() => setPay(p.k)}
                >
                  <Icon name={p.icon} size={17} />
                  <div>
                    <b style={{ fontSize: 14 }}>{p.k}</b>
                    <div className="sub" style={{ fontSize: 11 }}>{p.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {pay === 'Cash on delivery' ? (
              <div className="panel" style={{ marginTop: 14, fontSize: 13.5 }}>
                Pay <b>{money(total)}</b> in cash (or via bKash/Nagad to the rider) when your order arrives at your doorstep.
                {totals.needsRx && ' Prescription items will be dispatched as soon as our vet approves your prescription.'}
              </div>
            ) : (
              <div className="panel stack gap-12" style={{ marginTop: 14 }}>
                <div className="row between wrap gap-8">
                  <div style={{ fontSize: 13.5 }}>
                    <b>{pay} Send Money / Payment:</b> <span className="mono">{walletNumber}</span>
                    <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>
                      Send <b>{money(total)}</b> to the number above and enter the Transaction ID below — or leave it blank to pay by {pay} on delivery.
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={copyWalletNumber}>Copy number</button>
                </div>
                <div className="fields">
                  <Field label={`${pay} Transaction ID (TrxID)`} hint="optional">
                    <input
                      className="input mono"
                      style={{ textTransform: 'uppercase' }}
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. BKA9281XYZ (or leave blank to pay on delivery)"
                    />
                  </Field>
                  <Field label={`Your ${pay} number`} hint="optional">
                    <input
                      className="input"
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder={f.phone || '017XX-XXXXXX'}
                    />
                  </Field>
                </div>
              </div>
            )}
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
                <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code (e.g. PETMAYA10)" aria-label="Promo code" />
                <button type="button" className="btn btn-soft" onClick={() => { if (!applyCoupon(code)) toast('That code isn’t valid', { tone: 'error' }); }}>Apply</button>
              </div>
            )}
            <hr className="divider" style={{ margin: '16px 0 8px' }} />
            <div className="kv"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div className="kv"><span>Voucher {coupon?.code}</span><span className="teal">−{money(totals.discount)}</span></div>}
            <div className="kv"><span>Delivery ({isInsideDhaka ? 'Inside Dhaka' : f.district})</span><span className="teal">{shipping ? money(shipping) : 'Free'}</span></div>
            {totals.needsRx && <div className="kv"><span>Vet prescription check</span><span className="teal">Included</span></div>}
            <hr className="divider" style={{ margin: '8px 0 14px' }} />
            <div className="row between" style={{ alignItems: 'baseline' }}>
              <b>Total</b>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em' }}>{money(total)}</div><div className="sub" style={{ fontSize: 11 }}>BDT · includes VAT</div></div>
            </div>
            {err && <div className="red" style={{ fontSize: 13, marginTop: 10 }}>{err}</div>}
            <Button type="submit" variant="dark" size="lg" block icon="check" style={{ marginTop: 16 }} disabled={busy || !coldEligible}>
              {busy ? 'Placing order…' : `Confirm order · ${money(total)}`}
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
