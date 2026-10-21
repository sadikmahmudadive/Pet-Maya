import { useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { arrayUnion } from '../../config/firebase';
import { useAdmin, useAdminWrite } from '../data.jsx';
import { StatusPill, statusUpdate, syncOrderStock } from './Orders.jsx';
import { printOrderInvoice, printPackingSlip } from '../erp.js';
import { Icon, Button, Pill, Avatar, Ph, Empty, Field, Portal } from '../../ui/index.jsx';
import { money, timeOfDay, shortDate, cx, tipSide } from '../../lib/format.js';

const NEXT = { 'Rx review': ['Packing', 'Approve Rx'], Packing: ['In transit', 'Send out'], 'In transit': ['Delivered', 'Mark delivered'] };

export default function OrderDetail({ params, user }) {
  const { orders, customers, pets, live, settings } = useAdmin();
  const write = useAdminWrite();
  const id = decodeURIComponent(params.id);
  const o = orders.find((x) => x.docId === id || x.id === id);
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState('');
  const [editCourier, setEditCourier] = useState(false);
  const [localNotes, setLocalNotes] = useState([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [rf, setRf] = useState({
    amount: o?.total || 0,
    method: o?.payment === 'bKash' || o?.payment === 'Nagad' ? o.payment : 'bKash',
    ref: '',
    reason: o?.returnRequest?.reason || 'Customer return / refund',
  });

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

  const advance = async () => {
    const actor = user?.name || 'Admin';
    const patch = {
      ...statusUpdate(next[0], actor),
      ...(next[0] === 'Delivered' ? { paymentStatus: 'paid', paidAt: Date.now() } : {}),
      auditLog: arrayUnion({
        action: `Status changed to ${next[0]}`,
        by: actor,
        at: Date.now(),
      }),
    };
    if (await write('orders', o.docId, patch, `${o.id} → ${next[0]}`)) await syncOrderStock(o, next[0], actor, live);
  };

  const openRefund = () => {
    setRf({
      amount: o.total || 0,
      method: o.payment === 'bKash' || o.payment === 'Nagad' ? o.payment : 'bKash',
      ref: '',
      reason: o.returnRequest?.reason || 'Customer return / refund',
    });
    setShowRefundModal(true);
  };

  const submitRefund = async (e) => {
    e.preventDefault();
    const actor = user?.name || 'Admin';
    const nowMs = Date.now();
    const refundRecord = {
      amount: Number(rf.amount) || o.total || 0,
      method: rf.method || 'bKash',
      ref: rf.ref.trim(),
      reason: rf.reason.trim() || 'Refunded',
      by: actor,
      at: nowMs,
    };
    await write('orders', o.docId, {
      ...statusUpdate('Return', actor),
      paymentStatus: 'refunded',
      refundedAt: nowMs,
      refundRecord,
      ...(o.returnRequest ? { returnRequest: { ...o.returnRequest, status: 'approved', resolvedBy: actor, resolvedAt: nowMs } } : {}),
      auditLog: arrayUnion({
        action: `Refunded ${money(refundRecord.amount)} via ${refundRecord.method}${refundRecord.ref ? ` (Ref: ${refundRecord.ref})` : ''}`,
        by: actor,
        at: nowMs,
      }),
      notes: arrayUnion({
        by: actor,
        text: `Refunded ${money(refundRecord.amount)} via ${refundRecord.method}${refundRecord.ref ? ` · Ref ${refundRecord.ref}` : ''} — ${refundRecord.reason}`,
        at: nowMs,
      }),
    }, 'Order marked as returned & refunded');
    setShowRefundModal(false);
  };

  const cancelOrder = () => {
    if (window.confirm(`Cancel order ${o.id}?`)) {
      const actor = user?.name || 'Admin';
      const nowMs = Date.now();
      write('orders', o.docId, {
        ...statusUpdate('Cancelled', actor),
        cancelReason: 'Cancelled by staff',
        cancelledAt: nowMs,
        auditLog: arrayUnion({
          action: 'Order cancelled by staff',
          by: actor,
          at: nowMs,
        }),
      }, 'Order cancelled');
    }
  };

  const markPaid = () => {
    const actor = user?.name || 'Admin';
    const nowMs = Date.now();
    write('orders', o.docId, {
      paymentStatus: 'paid',
      paidAt: nowMs,
      paidVerifiedBy: actor,
      auditLog: arrayUnion({
        action: `Payment verified & marked paid (${o.payment}${o.paymentTrxId ? ` · TrxID ${o.paymentTrxId}` : ''})`,
        by: actor,
        at: nowMs,
      }),
      notes: arrayUnion({
        by: actor,
        text: `Payment marked as paid (${o.payment}${o.paymentTrxId ? ` · TrxID ${o.paymentTrxId}` : ''})`,
        at: nowMs,
      }),
    }, 'Order marked as paid');
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    const n = { by: user?.name || 'Admin', text: note.trim(), at: Date.now() };
    if (await write('orders', o.docId, { notes: arrayUnion(n) }, 'Note saved')) { setLocalNotes((l) => [...l, n]); setNote(''); }
  };

  const saveCourier = async () => {
    const actor = user?.name || 'Admin';
    if (await write('orders', o.docId, {
      courier,
      auditLog: arrayUnion({ action: `Courier assigned: ${courier}`, by: actor, at: Date.now() }),
    }, 'Courier assigned')) setEditCourier(false);
  };

  const auditEvents = [
    { at: o.placedAt, by: o.customer || 'Customer', action: `Order placed (${o.payment}${o.paymentTrxId ? ` · TrxID ${o.paymentTrxId}` : ''})` },
    ...(o.timeline || []).map((t) => ({ at: t.at, by: t.by || 'Staff', action: `Fulfilment status → ${t.status}` })),
    ...(o.auditLog || []),
    ...(o.paidAt ? [{ at: o.paidAt, by: o.paidVerifiedBy || 'Staff', action: `Payment reconciled (${money(o.total)})` }] : []),
    ...(o.refundRecord ? [{ at: o.refundRecord.at || o.refundedAt, by: o.refundRecord.by || 'Staff', action: `Refund processed: ${money(o.refundRecord.amount)} via ${o.refundRecord.method}` }] : []),
  ].filter((x) => x.at).sort((a, b) => b.at - a.at);

  return (
    <>
      <div className="row between wrap gap-16" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Order detail</div>
          <h1 className="adm-title">Order {o.id}</h1>
          <div className="crumbs" style={{ paddingTop: 10 }}><Link to="/admin/orders">Orders</Link><span>/</span><span style={{ color: 'var(--ink)' }}>{o.id}</span></div>
        </div>
        <div className="row gap-8 wrap">
          <Button variant="outline" icon="file" onClick={() => printOrderInvoice(o, settings)}>Tax invoice</Button>
          <Button variant="outline" icon="printer" onClick={() => printPackingSlip(o, settings)}>Packing slip</Button>
          {o.paymentStatus !== 'paid' && o.status !== 'Cancelled' && o.status !== 'Return' && (
            <Button variant="teal" icon="check" onClick={markPaid}>
              {o.paymentTrxId ? 'Verify TrxID & Mark Paid' : 'Mark Paid'}
            </Button>
          )}
          {o.status !== 'Cancelled' && o.status !== 'Delivered' && o.status !== 'Return' && <Button variant="outline" onClick={cancelOrder}>Cancel</Button>}
          {o.status !== 'Return' && o.status !== 'Cancelled' && <Button variant="danger" onClick={openRefund}>Refund / Return</Button>}
          {next && <Button variant="dark" icon="check" onClick={advance}>{next[1]}</Button>}
        </div>
      </div>
      <div className="row gap-8 wrap" style={{ margin: '14px 0 20px' }}>
        <StatusPill s={o.status} />
        <Pill tone={o.paymentStatus === 'paid' || o.status === 'Delivered' ? 'teal' : o.paymentStatus === 'refunded' ? 'red' : 'yellow'}>
          {o.paymentStatus === 'paid' || o.status === 'Delivered'
            ? 'Paid'
            : o.paymentStatus === 'verification_pending'
              ? 'Verify TrxID'
              : o.paymentStatus === 'refunded'
                ? 'Refunded'
                : 'Pay on Delivery'} · {o.payment}
        </Pill>
        {o.paymentTrxId && <Pill mono sm>TrxID: {o.paymentTrxId}</Pill>}
        <Pill>{o.deliveryZone || 'Inside Dhaka'} ({o.district || 'Dhaka'})</Pill>
        {o.priceCheck === 'ok' && <Pill tone="teal" icon="check" sm>Catalogue price verified</Pill>}
        {o.priceCheck === 'mismatch' && <Pill tone="red" sm>Price check warning</Pill>}
        <Pill>Placed {timeOfDay(o.placedAt)}, {shortDate(o.placedAt)}</Pill>
      </div>

      {o.paymentTrxId && o.paymentStatus !== 'paid' && o.paymentStatus !== 'refunded' && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--yellow)' }}>
          <div className="row between wrap gap-12">
            <div>
              <div className="eyebrow">{o.payment} Transaction Verification</div>
              <b style={{ fontSize: 15 }}>TrxID: <span className="mono">{o.paymentTrxId}</span></b>
              <div className="sub" style={{ marginTop: 4 }}>
                Sender wallet: <b>{o.paymentSender || o.phone || '—'}</b> · Amount expected: <b>{money(o.total)}</b>
              </div>
            </div>
            <Button variant="teal" size="sm" icon="check" onClick={markPaid}>Verify & Mark Paid</Button>
          </div>
        </div>
      )}

      {o.returnRequest && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--yellow)' }}>
          <div className="row between wrap gap-12">
            <div>
              <div className="eyebrow">Customer Return / Replacement Request</div>
              <b style={{ fontSize: 15 }}>{o.returnRequest.reason}</b>
              {o.returnRequest.details && <div className="sub" style={{ marginTop: 4 }}>{o.returnRequest.details}</div>}
            </div>
            <div className="row gap-8">
              <Pill tone={o.returnRequest.status === 'approved' ? 'teal' : 'yellow'}>{o.returnRequest.status || 'pending'}</Pill>
              {o.returnRequest.status !== 'approved' && <Button variant="dark" size="sm" onClick={openRefund}>Approve & Refund</Button>}
            </div>
          </div>
        </div>
      )}

      {o.refundRecord && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--teal)' }}>
          <div className="row between wrap gap-12">
            <div>
              <div className="eyebrow">Refund Processed</div>
              <b style={{ fontSize: 15 }}>{money(o.refundRecord.amount)} refunded via {o.refundRecord.method}</b>
              <div className="sub" style={{ marginTop: 4 }}>
                {o.refundRecord.ref ? `Ref: ${o.refundRecord.ref} · ` : ''}{o.refundRecord.reason} · By {o.refundRecord.by}
              </div>
            </div>
            <Pill tone="teal">Refunded</Pill>
          </div>
        </div>
      )}

      {o.cancelReason && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <b>Cancellation reason:</b> <span className="muted">{o.cancelReason}</span>
        </div>
      )}

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
                    <div className="sub" style={{ fontSize: 12 }}>{[i.brand, i.sku, i.variant].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span className="sub">× {i.qty}</span>
                  <b style={{ minWidth: 70, textAlign: 'right' }}>{i.price ? money(i.price * i.qty) : 'Free'}</b>
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', maxWidth: 300, marginTop: 10 }}>
              <div className="kv"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="kv"><span>{o.coupon || 'Discount'}</span><span className="teal">−{money(o.discount)}</span></div>}
              <div className="kv"><span>Delivery ({o.deliveryZone})</span><span className="teal">{o.shipping ? money(o.shipping) : 'Free'}</span></div>
              <div className="kv" style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 4 }}><b style={{ color: 'var(--ink)' }}>Total</b><b style={{ fontSize: 22 }}>{money(o.total)}</b></div>
            </div>
          </div>

          {o.hasCold && (
            <div className="card">
              <div className="card-head"><div><h2 className="h-card">Temperature log</h2><div className="sub">Safe range 2.0–8.0°C</div></div>{o.temps ? <Pill tone={o.temps.every((t) => t >= 2 && t <= 8) ? 'teal' : 'red'} icon="check" sm>{o.temps.every((t) => t >= 2 && t <= 8) ? 'In range' : 'Out of range'}</Pill> : <Pill sm>No logger data</Pill>}</div>
              {o.temps ? (
                <>
                  <div className="bars" style={{ height: 90, gap: 14 }}>
                    {o.temps.map((t, i) => <div key={i} className={cx('bar', (t > 8 || t < 2) && 'now')} style={{ height: `${(t / 10) * 100}%`, background: t > 8 || t < 2 ? 'var(--red)' : undefined }}><span className={tipSide(i, o.temps.length)}>{t}°C</span></div>)}
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

          <div className="card">
            <div className="card-head">
              <div>
                <h2 className="h-card">Audit log & payment reconciliation</h2>
                <div className="sub">Chronological record of order & payment actions</div>
              </div>
              <Pill mono sm>{auditEvents.length} events</Pill>
            </div>
            <div className="list">
              {auditEvents.map((ev, idx) => (
                <div key={idx} className="list-row" style={{ padding: '10px 0', fontSize: 13 }}>
                  <div className="grow">
                    <b>{ev.action}</b>
                    <div className="sub" style={{ fontSize: 11 }}>By {ev.by}</div>
                  </div>
                  <span className="mono sub" style={{ fontSize: 11 }}>{shortDate(ev.at)} · {timeOfDay(ev.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack gap-16">
          <div className="card">
            <div className="row between" style={{ marginBottom: 14 }}>
              <h2 className="h-card">Customer</h2>
              {o.userId === 'guest' && <Pill sm>Guest checkout</Pill>}
            </div>
            <div className="row gap-12"><Avatar name={o.customer} tone="teal" size="lg" /><div><b>{o.customer}</b><div className="sub" style={{ fontSize: 12 }}>{[o.phone, o.email, cust && `${cust.orders} orders`].filter(Boolean).join(' · ')}</div></div></div>
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

      {showRefundModal && (
        <Portal>
          <div className="scrim" onClick={() => setShowRefundModal(false)} />
          <form className="modal" onSubmit={submitRefund} role="dialog" aria-modal="true" aria-label="Process refund">
            <div className="row between">
              <h2 className="serif" style={{ fontSize: 24 }}>Process Return & Refund</h2>
              <button type="button" className="btn btn-outline btn-square btn-sm" onClick={() => setShowRefundModal(false)} aria-label="Close"><Icon name="x" size={15} /></button>
            </div>
            <p className="sub" style={{ marginTop: 4 }}>Record refund payout details for order <b>{o.id}</b> ({o.customer}).</p>
            <div className="fields" style={{ marginTop: 16 }}>
              <Field label="Refund amount (BDT)">
                <input className="input" type="number" min="0" required value={rf.amount} onChange={(e) => setRf({ ...rf, amount: e.target.value })} />
              </Field>
              <Field label="Refund method">
                <select className="select" value={rf.method} onChange={(e) => setRf({ ...rf, method: e.target.value })}>
                  <option value="bKash">bKash Send Money</option>
                  <option value="Nagad">Nagad Send Money</option>
                  <option value="Cash">Cash</option>
                  <option value="Store credit">Store credit / Replacement</option>
                </select>
              </Field>
              <Field className="full" label="Refund TrxID / Reference" hint="optional">
                <input className="input mono" value={rf.ref} onChange={(e) => setRf({ ...rf, ref: e.target.value })} placeholder="e.g. BKA99123REF" />
              </Field>
              <Field className="full" label="Reason / resolution note" required>
                <input className="input" required value={rf.reason} onChange={(e) => setRf({ ...rf, reason: e.target.value })} />
              </Field>
            </div>
            <div className="row gap-8" style={{ marginTop: 20 }}>
              <Button type="button" variant="outline" className="grow" onClick={() => setShowRefundModal(false)}>Cancel</Button>
              <Button type="submit" variant="danger" className="grow" icon="check">Confirm Refund</Button>
            </div>
          </form>
        </Portal>
      )}
    </>
  );
}
