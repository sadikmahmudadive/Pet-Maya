import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '../../lib/router.jsx';
import { arrayUnion } from '../../config/firebase';
import { useAdmin, useAdminWrite, downloadCsv } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Tabs, Empty } from '../../ui/index.jsx';
import { money, timeOfDay, shortDate, cx } from '../../lib/format.js';

const STATUS_STYLE = {
  'Rx review': ['yellow', 'file'], Packing: ['', 'bag'], 'In transit': ['teal', 'pin'], Delivered: ['', 'check'], Return: ['red', 'arrowRight'], Cancelled: ['red', 'x'],
};
export function StatusPill({ s }) {
  const [tone, icon] = STATUS_STYLE[s] || ['', 'bag'];
  return <Pill tone={tone} icon={icon}>{s}</Pill>;
}

export const statusUpdate = (status, by) => ({
  status,
  ...(status === 'Delivered' ? { deliveredAt: Date.now() } : {}),
  timeline: arrayUnion({ status, at: Date.now(), by: by || 'Admin' }),
});

const TABS = [['all', 'All'], ['Rx review', 'Needs Rx'], ['Packing', 'Packing'], ['In transit', 'In transit'], ['Delivered', 'Delivered'], ['Return', 'Returns']];
const PAGE = 10;

import { Portal, Field } from '../../ui/index.jsx';

function ManualOrderModal({ onClose, onSave, products = [], customers = [] }) {
  const [custName, setCustName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Gulshan');
  const [payment, setPayment] = useState('COD');
  const [shipping, setShipping] = useState(60);
  const [status, setStatus] = useState('Packing');
  const [selectedProd, setSelectedProd] = useState(products[0]?.id || '');
  const [cartItems, setCartItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const addItem = () => {
    const p = products.find((x) => x.id === selectedProd);
    if (!p) return;
    setCartItems((prev) => {
      const existing = prev.find((x) => x.id === p.id);
      if (existing) {
        return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { id: p.id, name: p.name, brand: p.brand, price: p.price, qty: 1, isRx: p.isRx, coldChain: p.coldChain, image: p.image || '' }];
    });
  };

  const removeItem = (id) => setCartItems((prev) => prev.filter((x) => x.id !== id));

  const updateQty = (id, delta) => {
    setCartItems((prev) => prev.map((x) => {
      if (x.id !== id) return x;
      const n = Math.max(1, x.qty + delta);
      return { ...x, qty: n };
    }));
  };

  const subtotal = cartItems.reduce((a, i) => a + i.price * i.qty, 0);
  const total = subtotal + Number(shipping || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!custName.trim() || !cartItems.length) return;
    setBusy(true);
    const numId = Math.floor(10000 + Math.random() * 90000);
    const orderId = `PM-${numId}`;
    const docId = `ord_${Date.now()}`;
    const data = {
      id: orderId,
      docId,
      customer: custName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area,
      payment,
      items: cartItems,
      subtotal,
      shipping: Number(shipping || 0),
      total,
      status,
      placedAt: Date.now(),
      hasCold: cartItems.some((i) => i.coldChain),
      hasRx: cartItems.some((i) => i.isRx),
      notes: [{ by: 'Admin', text: 'Manual order created from console', at: Date.now() }],
      timeline: [{ status: 'Placed', at: Date.now(), by: 'Admin' }],
    };
    await onSave('orders', docId, data, `Order ${orderId} created!`);
    setBusy(false);
    onClose();
  };

  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Create manual order" style={{ maxWidth: 600 }}>
        <div className="row between">
          <h2 className="serif" style={{ fontSize: 24 }}>Create Manual Order</h2>
          <button type="button" className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>
        </div>
        <p className="sub" style={{ marginTop: 4 }}>Place an order on behalf of a phone/WhatsApp customer.</p>

        <div className="stack gap-14" style={{ marginTop: 16 }}>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Customer name">
              <input className="input" required placeholder="e.g. Tanzim Rahman" value={custName} onChange={(e) => setCustName(e.target.value)} />
            </Field>
            <Field label="Phone number">
              <input className="input" placeholder="e.g. +880 1711 000000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Delivery Area">
              <input className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Gulshan-2, Dhaka" />
            </Field>
            <Field label="Full Address">
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House #, Road #, Apt #" />
            </Field>
          </div>

          <div className="card" style={{ padding: 14, background: 'var(--sunk-2)' }}>
            <b style={{ fontSize: 14 }}>Add Items</b>
            <div className="row gap-8" style={{ marginTop: 8 }}>
              <select className="select grow" value={selectedProd} onChange={(e) => setSelectedProd(e.target.value)}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({money(p.price)})</option>
                ))}
              </select>
              <Button variant="dark" size="sm" type="button" icon="plus" onClick={addItem}>Add</Button>
            </div>

            {cartItems.length > 0 && (
              <div className="stack gap-8" style={{ marginTop: 12 }}>
                {cartItems.map((item) => (
                  <div key={item.id} className="row between" style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b>{item.name}</b>
                      <div className="sub" style={{ fontSize: 11 }}>{money(item.price)} each</div>
                    </div>
                    <div className="row gap-8">
                      <button type="button" className="btn btn-outline btn-square btn-sm" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button type="button" className="btn btn-outline btn-square btn-sm" onClick={() => updateQty(item.id, 1)}>+</button>
                      <b style={{ minWidth: 60, textAlign: 'right' }}>{money(item.price * item.qty)}</b>
                      <button type="button" className="btn btn-ghost btn-square btn-sm" style={{ color: 'var(--red)' }} onClick={() => removeItem(item.id)}><Icon name="x" size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid-3" style={{ gap: 12 }}>
            <Field label="Payment Method">
              <select className="select" value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="bKash">bKash</option>
                <option value="Card">Credit/Debit Card</option>
              </select>
            </Field>
            <Field label="Delivery Charge (BDT)">
              <input className="input" type="number" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </Field>
            <Field label="Initial Status">
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Packing">Packing</option>
                <option value="In transit">In transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </Field>
          </div>

          <div className="row between" style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}>
            <span>Total Amount:</span>
            <b style={{ fontSize: 20 }}>{money(total)}</b>
          </div>
        </div>

        <Button type="submit" variant="dark" size="lg" block icon="check" style={{ marginTop: 18 }} disabled={busy || !custName.trim() || !cartItems.length}>
          {busy ? 'Creating Order…' : 'Place Order'}
        </Button>
      </form>
    </Portal>
  );
}

export default function Orders({ user }) {
  const { orders, products, customers } = useAdmin();
  const write = useAdminWrite();
  const { query, navigate } = useRouter();
  const [tab, setTab] = useState(query.get('status') || 'all');
  const [q, setQ] = useState(query.get('q') || '');
  const [pay, setPay] = useState('');
  const [zone, setZone] = useState('');
  const [when, setWhen] = useState('all');
  const [sel, setSel] = useState([]);
  const [page, setPage] = useState(0);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => { setQ(query.get('q') || ''); }, [query]);
  useEffect(() => { setPage(0); setSel([]); }, [tab, q, pay, zone, when]);

  const base = useMemo(() => orders.filter((o) => {
    if (q) {
      const hay = `${o.id} ${o.customer} ${o.phone} ${o.pet} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (pay && !o.payment.toLowerCase().includes(pay.toLowerCase())) return false;
    if (zone && o.area !== zone) return false;
    if (when !== 'all') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const from = when === 'today' ? start.getTime() : start.getTime() - (when === '7d' ? 6 : 29) * 864e5;
      if (o.placedAt < from) return false;
    }
    return true;
  }), [orders, q, pay, zone, when]);

  const counts = useMemo(() => Object.fromEntries(TABS.map(([k]) => [k, k === 'all' ? base.length : base.filter((o) => o.status === k).length])), [base]);
  const list = tab === 'all' ? base : base.filter((o) => o.status === tab);
  const pageItems = list.slice(page * PAGE, page * PAGE + PAGE);
  const zones = [...new Set(orders.map((o) => o.area).filter(Boolean))].sort();
  const payments = [...new Set(orders.map((o) => o.payment).filter((p) => p && p !== '—'))];
  const allOnPage = pageItems.length > 0 && pageItems.every((o) => sel.includes(o.docId));
  const selected = orders.filter((o) => sel.includes(o.docId));

  const bulk = async (status) => {
    for (const o of selected) await write('orders', o.docId, statusUpdate(status, user?.name));
    setSel([]);
  };
  const printLabels = () => {
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    w.document.write(`<title>Labels</title><style>body{font-family:system-ui;margin:24px}.l{border:1px dashed #999;border-radius:12px;padding:18px;margin-bottom:14px;page-break-inside:avoid}b{font-size:20px}</style>${selected.map((o) => `<div class="l"><b>${o.id}</b><div>${o.customer} · ${o.phone || ''}</div><div>${o.address || o.area}</div><div>${o.items.length} items${o.hasCold ? ' · KEEP COLD 2–8°C' : ''}</div></div>`).join('')}`);
    w.document.close(); w.focus(); w.print();
  };

  return (
    <>
      <PageHead eyebrow="Fulfilment" title="Orders">
        <Button variant="outline" icon="download" onClick={() => downloadCsv('orders.csv', [['Order', 'Placed', 'Customer', 'Phone', 'Area', 'Items', 'Total', 'Status', 'Payment'], ...list.map((o) => [o.id, new Date(o.placedAt).toISOString(), o.customer, o.phone, o.area, o.items.length, o.total, o.status, o.payment])])}>Export CSV</Button>
        <Button variant="dark" icon="plus" onClick={() => setShowManualModal(true)}>Create manual order</Button>
      </PageHead>

      <div className="filter-row">
        <div className="searchbar"><Icon name="filter" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, order ID, phone or product" aria-label="Filter orders" /></div>
        <select className="filter-select" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment"><option value="">Payment</option>{payments.map((p) => <option key={p}>{p}</option>)}</select>
        <select className="filter-select" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Delivery zone"><option value="">Delivery zone</option>{zones.map((z) => <option key={z}>{z}</option>)}</select>
        <select className="filter-select" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Date"><option value="all">Any date</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select>
      </div>

      {sel.length > 0 && (
        <div className="bulk-bar">
          <b>{sel.length} selected</b>
          <span className="hide-sm" style={{ opacity: 0.6, fontSize: 13 }}>{selected.slice(0, 3).map((o) => o.id).join(', ')}{sel.length > 3 ? '…' : ''}</span>
          <div className="row gap-8" style={{ marginLeft: 'auto' }}>
            <Button variant="outline" size="sm" icon="printer" onClick={printLabels}>Print labels</Button>
            <Button variant="outline" size="sm" icon="check" onClick={() => bulk('Packing')}>Mark packed</Button>
            <Button variant="teal" size="sm" icon="truck" onClick={() => bulk('In transit')}>Send out</Button>
            <button className="btn btn-ghost btn-sm" style={{ color: '#fff' }} onClick={() => setSel([])}>Clear</button>
          </div>
        </div>
      )}

      <div className="card flush">
        <div className="card-tabs"><Tabs items={TABS.map(([v, l]) => ({ value: v, label: l, count: counts[v] }))} value={tab} onChange={setTab} /></div>
        {list.length === 0 ? <Empty icon="bag" title="No orders match">Try another tab or clear the filters.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>
                <th style={{ width: 44 }}><input type="checkbox" className="check" checked={allOnPage} onChange={(e) => setSel(e.target.checked ? [...new Set([...sel, ...pageItems.map((o) => o.docId)])] : sel.filter((id) => !pageItems.some((o) => o.docId === id)))} aria-label="Select page" /></th>
                <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Placed</th><th />
              </tr></thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr key={o.docId} className={cx('clickable', sel.includes(o.docId) && 'selected')} onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.docId)}`)}>
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" className="check" checked={sel.includes(o.docId)} onChange={(e) => setSel(e.target.checked ? [...sel, o.docId] : sel.filter((x) => x !== o.docId))} aria-label={`Select ${o.id}`} /></td>
                    <td className="mono" style={{ fontWeight: 600 }}>{o.id}</td>
                    <td><div className="cell-title">{o.customer}</div><div className="cell-sub">{[o.pet, o.area].filter(Boolean).join(' · ')}</div></td>
                    <td className="muted">{o.items.length} {o.items.length === 1 ? 'item' : 'items'}</td>
                    <td><b>{money(o.total)}</b></td>
                    <td><StatusPill s={o.status} /></td>
                    <td><span className="pill">{o.payment}</span></td>
                    <td className="muted" title={shortDate(o.placedAt)}>{timeOfDay(o.placedAt)}</td>
                    <td><Icon name="arrowRight" size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="row between" style={{ padding: '14px 18px', borderTop: '1px solid var(--line)' }}>
          <span className="sub">Showing {list.length ? page * PAGE + 1 : 0}–{Math.min(list.length, (page + 1) * PAGE)} of {list.length} orders</span>
          <div className="row gap-8">
            <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="dark" iconRight="arrowRight" disabled={(page + 1) * PAGE >= list.length} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>

      {showManualModal && (
        <ManualOrderModal
          onClose={() => setShowManualModal(false)}
          onSave={write}
          products={products}
          customers={customers}
        />
      )}
    </>
  );
}
