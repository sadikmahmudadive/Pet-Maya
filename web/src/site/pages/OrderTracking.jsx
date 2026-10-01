import { useMemo } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { normOrder } from '../../data/firestore.js';
import { SAMPLES } from '../../data/hooks.js';
import { Icon, Button, Ph, Pill, Empty, Avatar } from '../../ui/index.jsx';
import { money, cx, timeOfDay, shortDate } from '../../lib/format.js';

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
    const local = (localOrders || []).map((o) => normOrder(o.id || o.orderId, o));
    const seen = new Set();
    return [...myOrders.items, ...local].filter((o) => (seen.has(o.id) ? false : seen.add(o.id))).sort((a, b) => b.placedAt - a.placedAt);
  }, [myOrders.items, localOrders]);
}

export default function OrderTracking({ params }) {
  const orders = useAllMyOrders();
  if (!params.id) return <OrderList orders={orders} />;
  const order = orders.find((o) => o.id === params.id || o.docId === params.id)
    || SAMPLES.orders.find((o) => o.id === params.id);
  return order ? <OrderDetail order={order} /> : (
    <div className="container" style={{ paddingTop: 48 }}>
      <div className="card"><Empty icon="bag" title="We couldn’t find that order">Sign in with the account you ordered from, or <Link to="/account/orders" className="link">see all orders</Link>.</Empty></div>
    </div>
  );
}

function OrderList({ orders }) {
  const { user } = useStore();
  const { navigate } = useRouter();
  return (
    <div className="container page-head">
      <div className="eyebrow">Account</div>
      <h1 className="display-2" style={{ marginTop: 10 }}>Your orders</h1>
      <div className="card flush" style={{ marginTop: 24 }}>
        {orders.length === 0 ? (
          <Empty icon="bag" title="No orders yet">
            {user ? 'When you place an order it will appear here.' : <>Already ordered? <Link to="/signin" className="link">Sign in</Link> to see it.</>}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Placed</th><th>Items</th><th>Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="clickable" onClick={() => navigate(`/account/orders/${o.id}`)}>
                    <td className="mono" style={{ fontWeight: 600 }}>{o.id}</td>
                    <td>{shortDate(o.placedAt)}</td>
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

function OrderDetail({ order: o }) {
  const { query } = useRouter();
  const { addToCart, products } = useStore();
  const idx = stageIndex(o.status);
  const stages = o.hasRx ? STAGES : STAGES.slice(1);
  const cur = o.hasRx ? idx : Math.max(0, idx - 1);
  const placed = query.get('placed') === '1';

  const reorder = () => {
    o.items.forEach((i, n) => {
      const p = products.items.find((x) => x.id === i.id) || { ...i };
      addToCart(p, { qty: i.qty, variant: i.variant, open: n === o.items.length - 1, silent: n < o.items.length - 1 });
    });
  };

  return (
    <div className="container">
      <nav className="crumbs"><Link to="/vault">Account</Link><span>/</span><Link to="/account/orders">Orders</Link><span>/</span><span style={{ color: 'var(--ink)' }}>#{o.id}</span></nav>

      {placed && (
        <div className="card row gap-12" style={{ marginTop: 18, background: 'var(--teal-tint)', borderColor: 'transparent' }}>
          <span className="well round" style={{ background: 'var(--teal)', color: '#fff' }}><Icon name="check" stroke={2.4} /></span>
          <div><b>Order placed — thank you!</b><div className="sub" style={{ color: 'var(--teal-deep)' }}>We’ve sent the details{o.phone ? ` to ${o.phone}` : ''}. {o.hasRx ? 'A vet will check your prescription shortly.' : ''}</div></div>
        </div>
      )}

      <div className="row between wrap gap-16" style={{ marginTop: 22, alignItems: 'flex-end' }}>
        <div>
          <h1 className="display-1" style={{ fontSize: 'clamp(34px,4.6vw,56px)' }}>{HEADLINE[o.status]}</h1>
          <p className="muted" style={{ marginTop: 10 }}>Order #{o.id} · Placed {timeOfDay(o.placedAt)}, {shortDate(o.placedAt)}{o.area ? ` · ${o.area}` : ''}</p>
        </div>
        <div className="row gap-8">
          <Button variant="outline" icon="download" onClick={() => window.print()}>Download invoice</Button>
          <Button variant="dark" icon="message" to="mailto:support@petmaya.app">Help with this order</Button>
        </div>
      </div>

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
        <div className="card flush">
          <div className="route-map">
            <svg viewBox="0 0 600 260" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path d="M90 40 V120 H300 V200 H470" fill="none" stroke="var(--teal-deep)" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
            </svg>
            <span className="map-label" style={{ left: '9%', top: '10%' }}><span className="dot" style={{ background: 'var(--ink)' }} /> Pet Maya pharmacy</span>
            {o.status === 'In transit' && <><span className="map-pin" style={{ left: '50%', top: '46%' }} /><span className="map-label dark" style={{ left: '44%', top: '30%' }}>On the way</span></>}
            <span className="map-label" style={{ left: '70%', top: '78%' }}><span className="dot" style={{ background: 'var(--ink)' }} /> {o.area || 'Your address'}</span>
          </div>
          <div className="row gap-12" style={{ padding: 18 }}>
            <Avatar name={o.courier || 'Courier'} tone="dark" />
            <div className="grow">
              <b style={{ fontSize: 14 }}>{o.courier || (o.status === 'In transit' ? 'Your courier' : 'Courier not assigned yet')}</b>
              <div className="sub">{o.hasCold ? 'Insulated cold-chain delivery' : 'Standard delivery'}</div>
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
              <div className="kv"><span>Address</span><span style={{ textAlign: 'right' }}>{o.address || '—'}</span></div>
              <div className="kv"><span>Phone</span><span>{o.phone || '—'}</span></div>
              {o.deliveryNote && <div className="kv"><span>Note</span><span style={{ textAlign: 'right' }}>{o.deliveryNote}</span></div>}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h2 className="display-3" style={{ fontSize: 26 }}>Items in this order</h2><span className="sub">{o.items.length} items{o.pet ? ` · for ${o.pet}` : ''}</span></div>
          <div className="list">
            {o.items.map((i) => (
              <div key={`${i.id}-${i.name}`} className="list-row">
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
          <div className="eyebrow muted">Payment</div>
          <h2 className="display-3" style={{ fontSize: 26, margin: '6px 0 12px' }}>Payment summary</h2>
          <div className="kv"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
          {o.discount > 0 && <div className="kv"><span>Voucher {o.coupon}</span><span className="teal">−{money(o.discount)}</span></div>}
          <div className="kv"><span>Delivery</span><span className="teal">{o.shipping ? money(o.shipping) : 'Free'}</span></div>
          <div className="panel row between" style={{ marginTop: 12, padding: '18px 20px' }}>
            <b>Total {o.status === 'Delivered' || o.payment !== 'Cash on delivery' ? 'paid' : 'due'}</b>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em' }}>{money(o.total)}</span>
          </div>
          <div className="sub" style={{ marginTop: 8 }}>{o.payment}</div>
        </div>
      </div>
    </div>
  );
}
