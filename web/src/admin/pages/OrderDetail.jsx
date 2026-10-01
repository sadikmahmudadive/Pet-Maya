import { useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { arrayUnion } from '../../config/firebase';
import { useAdmin, useAdminWrite } from '../data.jsx';
import { StatusPill, statusUpdate } from './Orders.jsx';
import { Icon, Button, Pill, Avatar, Ph, Empty, Field } from '../../ui/index.jsx';
import { money, timeOfDay, shortDate, cx } from '../../lib/format.js';

const NEXT = { 'Rx review': ['Packing', 'Approve Rx'], Packing: ['In transit', 'Send out'], 'In transit': ['Delivered', 'Mark delivered'] };

export default function OrderDetail({ params, user }) {
  const { orders, customers, pets } = useAdmin();
  const write = useAdminWrite();
  const id = decodeURIComponent(params.id);
  const o = orders.find((x) => x.docId === id || x.id === id);
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState('');
  const [editCourier, setEditCourier] = useState(false);
  const [localNotes, setLocalNotes] = useState([]);

  if (!o) return <div className="card"><Empty icon="bag" title="Order not found"><Link to="/admin/orders" className="link">Back to orders</Link></Empty></div>;

  const cust = customers.find((c) => c.uid === o.userId || c.id === o.userId);
  const pet = pets.find((p) => p.name === o.pet && (p.ownerID === o.userId));
  const next = NEXT[o.status];
  const notes = [...o.notes, ...localNotes];
  const tlByStatus = Object.fromEntries((o.timeline || []).map((t) => [t.status, t]));

  const steps = [
    { title: 'Order placed', sub: `${timeOfDay(o.placedAt)} · ${o.payment}`, r: -99 },
    ...(o.hasRx ? [{ title: 'Prescription verified', r: 1, sub: tlByStatus.Packing ? `${timeOfDay(tlByStatus.Packing.at)} · ${tlByStatus.Packing.by}` : (o.status === 'Rx review' ? 'Waiting for vet review' : 'Verified') }] : []),
    { title: o.hasCold ? 'Cold-packed' : 'Packed', r: 2, sub: tlByStatus['In transit'] ? timeOfDay(tlByStatus['In transit'].at) : (o.status === 'In transit' || o.status === 'Delivered' ? 'Done' : 'Pharmacy bench') },
    { title: 'Out for delivery', r: 3, sub: o.courier ? `Courier ${o.courier}` : 'Courier not assigned' },
    { title: 'Delivered', sub: o.deliveredAt ? timeOfDay(o.deliveredAt) : 'Pending', r: 3 },
  ];
  const rank = { 'Rx review': 0, Packing: 1, 'In transit': 2, Delivered: 3 }[o.status] ?? -1;
  const isDone = (st) => rank >= st.r;
  const nowIdx = steps.findIndex((st) => !isDone(st));

  const advance = () => write('orders', o.docId, statusUpdate(next[0], user?.name), `${o.id} → ${next[0]}`);
  const refund = () => { if (window.confirm(`Mark ${o.id} as returned/refunded?`)) write('orders', o.docId, statusUpdate('Return', user?.name), 'Marked for refund'); };
  const saveNote = async () => {
    if (!note.trim()) return;
    const n = { by: user?.name || 'Admin', text: note.trim(), at: Date.now() };
    if (await write('orders', o.docId, { notes: arrayUnion(n) }, 'Note saved')) { setLocalNotes((l) => [...l, n]); setNote(''); }
  };
  const saveCourier = async () => {
    if (await write('orders', o.docId, { courier }, 'Courier assigned')) setEditCourier(false);
  };
  const printSlip = () => {
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    w.document.write(`<title>${o.id}</title><style>body{font-family:system-ui;margin:32px}td{padding:6px 0}table{width:100%;border-collapse:collapse}tr+tr td{border-top:1px solid #eee}</style><h2>Pet Maya · ${o.id}</h2><p>${o.customer}<br>${o.phone || ''}<br>${o.address || o.area}</p><table>${o.items.map((i) => `<tr><td>${i.name}${i.variant ? ` (${i.variant})` : ''}</td><td>× ${i.qty}</td><td style="text-align:right">৳${(i.price * i.qty).toLocaleString()}</td></tr>`).join('')}<tr><td><b>Total</b></td><td></td><td style="text-align:right"><b>৳${o.total.toLocaleString()}</b></td></tr></table>${o.hasCold ? '<p><b>KEEP COLD 2–8°C</b></p>' : ''}`);
    w.document.close(); w.focus(); w.print();
  };

  return (
    <>
      <div className="row between wrap gap-16" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Order detail</div>
          <h1 className="adm-title">Order {o.id}</h1>
          <div className="crumbs" style={{ paddingTop: 10 }}><Link to="/admin/orders">Orders</Link><span>/</span><span style={{ color: 'var(--ink)' }}>{o.id}</span></div>
        </div>
        <div className="row gap-8 wrap">
          <Button variant="outline" icon="printer" onClick={printSlip}>Print slip</Button>
          {o.status !== 'Return' && o.status !== 'Cancelled' && <Button variant="danger" onClick={refund}>Refund</Button>}
          {next && <Button variant="dark" icon="check" onClick={advance}>{next[1]}</Button>}
        </div>
      </div>
      <div className="row gap-8 wrap" style={{ margin: '14px 0 20px' }}>
        <StatusPill s={o.status} />
        <Pill tone="teal">{o.status === 'Delivered' || o.payment !== 'COD' ? 'Paid' : 'Due'} · {o.payment}</Pill>
        <Pill>Placed {timeOfDay(o.placedAt)}, {shortDate(o.placedAt)}</Pill>
      </div>

      <div className="adm-grid-side wide">
        <div className="stack gap-16">
          <div className="card">
            <div className="card-head"><div><h2 className="h-card">Items</h2><div className="sub">{o.items.length} lines{o.hasCold ? ` · ${o.items.filter((i) => i.coldChain).length} cold-chain` : ''}</div></div></div>
            <div className="list">
              {o.items.map((i, n) => (
                <div key={`${i.id}-${n}`} className="list-row" style={{ padding: '14px 0' }}>
                  <Ph src={i.image} label=" " style={{ width: 52, height: 52, minHeight: 0, borderRadius: 12 }} />
                  <div className="grow">
                    <div className="row gap-8 wrap"><b style={{ fontSize: 14 }}>{i.name}</b>{i.isRx && <Pill tone="yellow" sm icon="file">{o.status === 'Rx review' ? 'Rx pending' : 'Rx verified'}</Pill>}{i.coldChain && <Pill tone="teal" sm icon="cold">Cold</Pill>}</div>
                    <div className="sub" style={{ fontSize: 12 }}>{[i.brand, i.variant].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span className="sub">× {i.qty}</span>
                  <b style={{ minWidth: 70, textAlign: 'right' }}>{i.price ? money(i.price * i.qty) : 'Free'}</b>
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', maxWidth: 300, marginTop: 10 }}>
              <div className="kv"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="kv"><span>{o.coupon || 'Discount'}</span><span className="teal">−{money(o.discount)}</span></div>}
              <div className="kv"><span>Delivery</span><span className="teal">{o.shipping ? money(o.shipping) : 'Free'}</span></div>
              <div className="kv" style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 4 }}><b style={{ color: 'var(--ink)' }}>Total</b><b style={{ fontSize: 22 }}>{money(o.total)}</b></div>
            </div>
          </div>

          {o.hasCold && (
            <div className="card">
              <div className="card-head"><div><h2 className="h-card">Temperature log</h2><div className="sub">Safe range 2.0–8.0°C</div></div>{o.temps ? <Pill tone={o.temps.every((t) => t >= 2 && t <= 8) ? 'teal' : 'red'} icon="check" sm>{o.temps.every((t) => t >= 2 && t <= 8) ? 'In range' : 'Out of range'}</Pill> : <Pill sm>No logger data</Pill>}</div>
              {o.temps ? (
                <>
                  <div className="bars" style={{ height: 90, gap: 14 }}>
                    {o.temps.map((t, i) => <div key={i} className={cx('bar', (t > 8 || t < 2) && 'now')} style={{ height: `${(t / 10) * 100}%`, background: t > 8 || t < 2 ? 'var(--red)' : undefined }}><span className="tip">{t}°C</span></div>)}
                  </div>
                  <div className="row between mono sub" style={{ fontSize: 11, marginTop: 6 }}><span>Packed</span><span>Now {o.temps[o.temps.length - 1]}°C</span></div>
                </>
              ) : <p className="sub">Add a <span className="mono">temps</span> array (°C readings) to this order from your logger integration to see it here.</p>}
            </div>
          )}

          <div className="card">
            <div className="card-head"><div><h2 className="h-card">Fulfilment timeline</h2><div className="sub">Live</div></div></div>
            <div className="tl">
              {steps.map((s, i) => (
                <div key={s.title} className={cx('tl-item', isDone(s) && 'done', i === nowIdx && rank >= 0 && 'now')}>
                  <span className="tl-dot">{isDone(s) && <Icon name="check" size={12} stroke={3} />}</span>
                  <div><b style={{ fontSize: 14 }}>{s.title}</b><div className="sub" style={{ fontSize: 12 }}>{s.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack gap-16">
          <div className="card">
            <h2 className="h-card" style={{ marginBottom: 14 }}>Customer</h2>
            <div className="row gap-12"><Avatar name={o.customer} tone="teal" size="lg" /><div><b>{o.customer}</b><div className="sub" style={{ fontSize: 12 }}>{[o.phone, cust && `${cust.orders} orders`].filter(Boolean).join(' · ')}</div></div></div>
            {o.pet && <div className="panel row gap-10" style={{ marginTop: 14 }}><Icon name="paw" size={16} className="teal" /><div><b style={{ fontSize: 13 }}>{o.pet}{pet ? ` · ${pet.breed} · ${pet.weight}` : ''}</b><div className="sub" style={{ fontSize: 11 }}>{pet ? 'From Health Vault' : 'Pet on order'}</div></div></div>}
            {o.address && <div className="row gap-8 sub" style={{ marginTop: 12, fontSize: 13 }}><Icon name="pin" size={14} /> {o.address}</div>}
            {o.deliveryNote && <div className="sub" style={{ marginTop: 8, fontSize: 12 }}>Note: {o.deliveryNote}</div>}
            {cust && <Button variant="soft" size="sm" style={{ marginTop: 14 }} to={`/admin/customers?id=${encodeURIComponent(cust.id)}`}>View customer</Button>}
          </div>

          <div className="card">
            <h2 className="h-card" style={{ marginBottom: 14 }}>Courier</h2>
            {editCourier || !o.courier ? (
              <div className="row gap-8"><input className="input" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier name" aria-label="Courier name" /><Button variant="dark" onClick={saveCourier} disabled={!courier.trim()}>Assign</Button></div>
            ) : (
              <div className="row gap-12">
                <Avatar name={o.courier} tone="dark" />
                <div className="grow"><b>{o.courier}</b><div className="sub" style={{ fontSize: 12 }}>{o.hasCold ? 'Cold-chain delivery' : 'Standard delivery'}</div></div>
                <Button variant="outline" size="sm" onClick={() => { setCourier(o.courier); setEditCourier(true); }}>Change</Button>
              </div>
            )}
            {o.address && <a className="ph teal" style={{ height: 110, marginTop: 14 }} href={`https://www.google.com/maps/search/${encodeURIComponent(o.address)}`} target="_blank" rel="noreferrer"><span>[ open route in maps ]</span></a>}
          </div>

          <div className="card">
            <h2 className="h-card" style={{ marginBottom: 14 }}>Internal notes</h2>
            <div className="stack gap-8">
              {notes.map((n, i) => <div key={i} className="note-yellow"><b>{n.by}:</b> {n.text}</div>)}
            </div>
            <Field className="full" label="" style={{ marginTop: 10 }}>
              <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team…" style={{ marginTop: notes.length ? 10 : 0 }} />
            </Field>
            <Button variant="dark" size="sm" style={{ marginTop: 10 }} onClick={saveNote} disabled={!note.trim()}>Save note</Button>
          </div>
        </div>
      </div>
    </>
  );
}
