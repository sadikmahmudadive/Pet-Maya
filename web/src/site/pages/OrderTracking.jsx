import { useMemo, useState } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { normOrder } from '../../data/firestore.js';
import { cancelCustomerOrder, requestOrderReturn } from '../../data/actions.js';
import { Icon, Button, Ph, Pill, Empty, Avatar, Field, Portal } from '../../ui/index.jsx';
import { money, cx, timeOfDay, shortDate } from '../../lib/format.js';
import GoogleMapView from '../../components/Common/GoogleMapView.jsx';

const STAGES = [
  { key: 'Rx review', title: 'Verified & prescribed', short: 'Checked' },
  { key: 'Packing', title: 'Packed', short: 'Packed' },
  { key: 'In transit', title: 'Out for delivery', short: 'On the way' },
  { key: 'Delivered', title: 'Delivered', short: 'Delivered' },
];
const stageIndex = (s) => ({ 'Rx review': 0, Packing: 1, 'In transit': 2, Delivered: 3 }[s] ?? 1);

const HEADLINE = {
  'Rx review': 'A vet is checking your prescription.',
  Packing: 'We’re packing your order.',
  'In transit': 'Out for delivery.',
  Delivered: 'Delivered. Enjoy!',
  Return: 'Return in progress.',
  Cancelled: 'This order was cancelled.',
};

const TONE = { 'Rx review': 'yellow', Packing: '', 'In transit': 'teal', Delivered: '', Return: 'red', Cancelled: 'red' };

function useAllMyOrders() {
  const { myOrders, localOrders } = useStore();
  return useMemo(() => {
    const local = (localOrders || []).map((o) => normOrder(o.docId || o.id || o.orderId, o));
    const seen = new Set();
    return [...myOrders.items, ...local]
      .filter((o) => (seen.has(o.id) ? false : seen.add(o.id)))
      .sort((a, b) => b.placedAt - a.placedAt);
  }, [myOrders.items, localOrders]);
}

export default function OrderTracking({ params }) {
  const orders = useAllMyOrders();
  if (!params.id) return <OrderList orders={orders} />;
  const order = orders.find((o) => o.id === params.id || o.docId === params.id);
  return order ? <OrderDetail order={order} /> : (
    <div className="container" style={{ paddingTop: 48 }}>
      <div className="card"><Empty icon="bag" title="We couldn’t find that order">Sign in with the account you ordered from, or <Link to="/account/orders" className="link">see all orders</Link>.</Empty></div>
    </div>
  );
}

function OrderList({ orders }) {
  const { user, toast } = useStore();
  const { navigate } = useRouter();
  const [lookupId, setLookupId] = useState('');

  const handleLookup = (e) => {
    e.preventDefault();
    const clean = lookupId.trim().toUpperCase();
    if (!clean) return;
    const hit = orders.find((o) => o.id.toUpperCase() === clean || String(o.docId).toUpperCase() === clean);
    if (hit) navigate(`/account/orders/${hit.id}`);
    else toast(`Order ${clean} wasn't found in this browser. Sign in if you placed it from another device.`, { tone: 'error' });
  };

  return (
    <div className="container page-head">
      <div className="row between wrap gap-16" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Account</div>
          <h1 className="display-2" style={{ marginTop: 10 }}>Your orders</h1>
        </div>
        <form className="row gap-8" onSubmit={handleLookup}>
          <input
            className="input mono"
            style={{ width: 210, height: 42 }}
            placeholder="Track ID (e.g. PM-12345)"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            aria-label="Order ID"
          />
          <Button type="submit" variant="outline" size="sm" icon="search">Track</Button>
        </form>
      </div>
      <div className="card flush" style={{ marginTop: 24 }}>
        {orders.length === 0 ? (
          <Empty icon="bag" title="No orders yet">
            {user ? 'When you place an order it will appear here.' : <>Already ordered? <Link to="/signin" className="link">Sign in</Link> to see orders from your other devices, or <Link to="/shop" className="link">browse the shop</Link>.</>}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Placed</th><th>Zone</th><th>Items</th><th>Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="clickable" onClick={() => navigate(`/account/orders/${o.id}`)}>
                    <td className="mono" style={{ fontWeight: 600 }}>{o.id}</td>
                    <td>{shortDate(o.placedAt)}</td>
                    <td className="sub">{o.deliveryZone || o.district || 'Dhaka'}</td>
                    <td>{o.items.length} {o.items.length === 1 ? 'item' : 'items'}</td>
                    <td><b>{money(o.total)}</b></td>
                    <td><Pill tone={TONE[o.status]}>{o.status}</Pill></td>
                    <td><Icon name="arrowRight" size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered the wrong size or product',
  'Need to update delivery address or phone',
  'Delivery time doesn’t work for me',
  'Other reason',
];

const RETURN_REASONS = [
  'Damaged or leaking item on arrival',
  'Cold-chain temperature tag out of safe range (2–8°C)',
  'Incorrect item or variant delivered',
  'Unopened non-Rx item return (within 7 days)',
];

function OrderDetail({ order: o }) {
  const { query } = useRouter();
  const { addToCart, products, updateLocalOrder, toast } = useStore();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDetails, setReturnDetails] = useState('');
  const [busyAction, setBusyAction] = useState(false);

  const idx = stageIndex(o.status);
  const stages = o.hasRx ? STAGES : STAGES.slice(1);
  const cur = o.hasRx ? idx : Math.max(0, idx - 1);
  const placed = query.get('placed') === '1';

  const canCancel = o.status === 'Rx review' || o.status === 'Packing';
  const canReturn = o.status === 'Delivered';

  const reorder = () => {
    o.items.forEach((i, n) => {
      const p = products.items.find((x) => x.id === i.id) || { ...i };
      addToCart(p, { qty: i.qty, variant: i.variant, open: n === o.items.length - 1, silent: n < o.items.length - 1 });
    });
  };

  const submitCancel = async (e) => {
    e.preventDefault();
    setBusyAction(true);
    await cancelCustomerOrder(o.docId || o.id, cancelReason);
    updateLocalOrder(o.id, { status: 'Cancelled', cancelReason, cancelledAt: Date.now() });
    setBusyAction(false);
    setShowCancel(false);
    toast(`Order ${o.id} has been cancelled`);
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    setBusyAction(true);
    const req = { reason: returnReason, details: returnDetails, requestedAt: Date.now(), status: 'pending' };
    await requestOrderReturn(o.docId || o.id, req);
    updateLocalOrder(o.id, { status: 'Return', returnRequest: req });
    setBusyAction(false);
    setShowReturn(false);
    toast(`Return request submitted for ${o.id}`);
  };

  return (
    <div className="container">
      <nav className="crumbs"><Link to="/vault">Account</Link><span>/</span><Link to="/account/orders">Orders</Link><span>/</span><span style={{ color: 'var(--ink)' }}>#{o.id}</span></nav>

      {placed && (
        <div className="card row gap-12" style={{ marginTop: 18, background: 'var(--teal-tint)', borderColor: 'transparent' }}>
          <span className="well round" style={{ background: 'var(--teal)', color: '#fff' }}><Icon name="check" stroke={2.4} /></span>
          <div><b>Order placed — thank you!</b><div className="sub" style={{ color: 'var(--teal-ink, var(--teal))' }}>We’ve sent the details{o.phone ? ` to ${o.phone}` : ''}. {o.hasRx ? 'A vet will check your prescription shortly.' : ''}</div></div>
        </div>
      )}

      <div className="row between wrap gap-16" style={{ marginTop: 22, alignItems: 'flex-end' }}>
        <div>
          <h1 className="display-1" style={{ fontSize: 'clamp(34px,4.6vw,56px)' }}>{HEADLINE[o.status]}</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            Order #{o.id} · Placed {timeOfDay(o.placedAt)}, {shortDate(o.placedAt)}
            {o.area ? ` · ${o.area}` : ''}
            {o.district ? `, ${o.district}` : ''}
          </p>
        </div>
        <div className="row gap-8 wrap">
          <Button variant="outline" icon="download" onClick={() => window.print()}>Download invoice</Button>
          {canCancel && <Button variant="outline" icon="x" onClick={() => setShowCancel(true)}>Cancel order</Button>}
          {canReturn && <Button variant="outline" icon="arrowRight" onClick={() => setShowReturn(true)}>Request return</Button>}
          <Button variant="dark" icon="message" to="mailto:support@petmaya.app">Help with this order</Button>
        </div>
      </div>

      {o.status === 'Cancelled' && o.cancelReason && (
        <div className="card" style={{ marginTop: 18, borderColor: 'var(--red)' }}>
          <b>Cancellation reason:</b> <span className="muted">{o.cancelReason}</span>
        </div>
      )}

      {o.status === 'Return' && o.returnRequest && (
        <div className="card" style={{ marginTop: 18, borderColor: 'var(--yellow)' }}>
          <div className="row between wrap gap-8">
            <div>
              <b>Return / Replacement Request:</b> {o.returnRequest.reason}
              {o.returnRequest.details && <div className="sub" style={{ marginTop: 4 }}>{o.returnRequest.details}</div>}
            </div>
            <Pill tone="yellow" sm>Under review</Pill>
          </div>
        </div>
      )}

      {o.status !== 'Cancelled' && o.status !== 'Return' && (
        <div className="card track-steps" style={{ marginTop: 24 }}>
          {stages.map((s, i) => (
            <div key={s.key} className={cx('track-step', i < cur && 'done', i === cur && 'now')}>
              <div className="row gap-10">
                <span className="n">{i < cur ? <Icon name="check" size={14} stroke={2.5} /> : i + 1}</span>
                <span className="bar" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 10, color: i <= cur ? (i < cur ? 'var(--teal)' : 'var(--ink)') : 'var(--muted)' }}>{s.title}</div>
              <div className="sub" style={{ fontSize: 12 }}>{i < cur ? 'Done' : i === cur ? 'In progress' : 'Up next'}</div>
            </div>
          ))}
        </div>
      )}

      <div className="track-grid" style={{ marginTop: 16 }}>
        <div className="card flush" style={{ overflow: 'hidden' }}>
          <div className="route-map" style={{ height: 280 }}>
            <GoogleMapView
              center={{ lat: 23.7915, lng: 90.4080 }}
              zoom={14}
              height="100%"
              markers={[
                { lat: 23.7939, lng: 90.4032, title: 'Pet Maya Central Pharmacy', label: 'Rx', type: 'pharmacy', info: 'Gulshan 2, Dhaka' },
                { lat: 23.7880, lng: 90.4130, title: o.area ? `Delivery: ${o.area}` : 'Destination Address', label: 'Dest', info: o.area || 'Customer Address' },
                ...(o.status === 'In transit' ? [{ lat: 23.7910, lng: 90.4080, title: `Courier: ${o.courier || 'On the way'}`, label: 'Courier', type: 'pet', info: 'Live Cold-chain Courier' }] : []),
              ]}
              routePath={[
                { lat: 23.7939, lng: 90.4032 },
                { lat: 23.7910, lng: 90.4080 },
                { lat: 23.7880, lng: 90.4130 },
              ]}
            />
          </div>
          <div className="row gap-12" style={{ padding: 18 }}>
            <Avatar name={o.courier || 'Courier'} tone="dark" />
            <div className="grow">
              <b style={{ fontSize: 14 }}>{o.courier || (o.status === 'In transit' ? 'Your courier' : 'Courier not assigned yet')}</b>
              <div className="sub">{o.hasCold ? 'Insulated cold-chain delivery' : (o.delivery || 'Standard delivery')} · {o.deliveryZone}</div>
            </div>
            <Button variant="outline" size="sm" icon="phone" to="tel:+880">Contact</Button>
          </div>
        </div>

        <div className="card">
          <div className="eyebrow muted">{o.hasCold ? 'Cold-chain' : 'Delivery'}</div>
          <h2 className="display-3" style={{ fontSize: 28, marginTop: 6 }}>{o.hasCold ? 'Kept cold all the way' : 'Delivery details'}</h2>
          {o.hasCold ? (
            <>
              <div className="row gap-6" style={{ alignItems: 'baseline', marginTop: 16 }}>
                <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>2–8</span><span className="muted" style={{ fontSize: 20 }}>°C</span>
              </div>
              <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>Cold items are packed in an insulated box with a temperature tag.</p>
              <div className="coupon-applied" style={{ marginTop: 16, alignItems: 'flex-start' }}>
                <Icon name="shield" size={16} />
                <span><b>On arrival:</b> check the temperature tag. If it shows the box got too warm, don’t accept it — we’ll send a free replacement.</span>
              </div>
            </>
          ) : (
            <div className="stack gap-6" style={{ marginTop: 14 }}>
              <div className="kv"><span>Recipient</span><span style={{ textAlign: 'right' }}>{o.customer || '—'}</span></div>
              <div className="kv"><span>Zone</span><span style={{ textAlign: 'right' }}>{o.deliveryZone} ({o.district || 'Dhaka'})</span></div>
              <div className="kv"><span>Address</span><span style={{ textAlign: 'right' }}>{o.address || '—'}</span></div>
              <div className="kv"><span>Phone</span><span>{o.phone || '—'}</span></div>
              {o.deliveryNote && <div className="kv"><span>Instructions</span><span style={{ textAlign: 'right' }}>{o.deliveryNote}</span></div>}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h2 className="display-3" style={{ fontSize: 26 }}>Items in this order</h2><span className="sub">{o.items.length} items{o.pet ? ` · for ${o.pet}` : ''}</span></div>
          <div className="list">
            {o.items.map((i) => (
              <div key={`${i.id}-${i.name}-${i.variant}`} className="list-row">
                <Ph src={i.image} label=" " style={{ width: 52, height: 52, minHeight: 0, borderRadius: 12 }} />
                <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</div><div className="sub" style={{ fontSize: 12 }}>{[i.variant, i.qty > 1 && `× ${i.qty}`, i.coldChain && 'Cold-chain'].filter(Boolean).join(' · ')}</div></div>
                <b>{i.price ? money(i.price * i.qty) : 'Free'}</b>
              </div>
            ))}
          </div>
          <div className="row gap-8" style={{ marginTop: 14 }}>
            <Button variant="dark" icon="arrowRight" onClick={reorder}>Reorder all</Button>
            {o.pet && <Button variant="outline" icon="cloud" to="/vault">Add to {o.pet}’s vault</Button>}
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ alignItems: 'center' }}>
            <div className="eyebrow muted">Payment</div>
            <Pill tone={o.paymentStatus === 'paid' ? 'teal' : o.paymentStatus === 'verification_pending' || o.paymentStatus === 'cod_pending' ? 'yellow' : ''} sm>
              {o.paymentStatus === 'paid'
                ? 'Paid'
                : o.paymentStatus === 'verification_pending'
                  ? 'TrxID · Pending verification'
                  : o.paymentStatus === 'cod_pending'
                    ? 'Pay on delivery'
                    : o.paymentStatus}
            </Pill>
          </div>
          <h2 className="display-3" style={{ fontSize: 26, margin: '6px 0 12px' }}>Payment summary</h2>
          <div className="kv"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
          {o.discount > 0 && <div className="kv"><span>Voucher {o.coupon}</span><span className="teal">−{money(o.discount)}</span></div>}
          <div className="kv"><span>Delivery ({o.deliveryZone})</span><span className="teal">{o.shipping ? money(o.shipping) : 'Free'}</span></div>
          <div className="panel row between" style={{ marginTop: 12, padding: '18px 20px' }}>
            <b>Total {o.paymentStatus === 'paid' || o.status === 'Delivered' ? 'paid' : 'due'}</b>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em' }}>{money(o.total)}</span>
          </div>
          <div className="sub" style={{ marginTop: 8 }}>
            Method: {o.payment}
            {o.paymentTrxId ? ` · TrxID: ${o.paymentTrxId}` : ''}
            {o.paymentSender ? ` (${o.paymentSender})` : ''}
          </div>
        </div>
      </div>

      {showCancel && (
        <Portal>
          <div className="scrim" onClick={() => setShowCancel(false)} />
          <form className="modal" onSubmit={submitCancel} role="dialog" aria-modal="true" aria-label="Cancel order">
            <div className="row between">
              <h2 className="serif" style={{ fontSize: 24 }}>Cancel Order #{o.id}</h2>
              <button type="button" className="btn btn-outline btn-square btn-sm" onClick={() => setShowCancel(false)} aria-label="Close"><Icon name="x" size={15} /></button>
            </div>
            <p className="sub" style={{ marginTop: 6 }}>Since this order hasn’t left our pharmacy yet, you can cancel it immediately.</p>
            <Field label="Reason for cancellation" style={{ marginTop: 16 }}>
              <select className="select" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <div className="row gap-8" style={{ marginTop: 20 }}>
              <Button type="button" variant="outline" className="grow" onClick={() => setShowCancel(false)}>Keep order</Button>
              <Button type="submit" variant="danger" className="grow" disabled={busyAction}>{busyAction ? 'Cancelling…' : 'Confirm cancel'}</Button>
            </div>
          </form>
        </Portal>
      )}

      {showReturn && (
        <Portal>
          <div className="scrim" onClick={() => setShowReturn(false)} />
          <form className="modal" onSubmit={submitReturn} role="dialog" aria-modal="true" aria-label="Request return">
            <div className="row between">
              <h2 className="serif" style={{ fontSize: 24 }}>Request Return / Replacement</h2>
              <button type="button" className="btn btn-outline btn-square btn-sm" onClick={() => setShowReturn(false)} aria-label="Close"><Icon name="x" size={15} /></button>
            </div>
            <p className="sub" style={{ marginTop: 6 }}>Tell us what went wrong with Order #{o.id} and our pharmacy support team will arrange a pickup or replacement.</p>
            <div className="stack gap-12" style={{ marginTop: 16 }}>
              <Field label="Reason">
                <select className="select" value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                  {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Additional details (batch number, item name, or issue)">
                <textarea className="textarea" rows={3} value={returnDetails} onChange={(e) => setReturnDetails(e.target.value)} placeholder="Describe the issue so we can resolve it quickly…" required />
              </Field>
            </div>
            <div className="row gap-8" style={{ marginTop: 20 }}>
              <Button type="button" variant="outline" className="grow" onClick={() => setShowReturn(false)}>Back</Button>
              <Button type="submit" variant="dark" className="grow" disabled={busyAction}>{busyAction ? 'Submitting…' : 'Submit return request'}</Button>
            </div>
          </form>
        </Portal>
      )}
    </div>
  );
}
