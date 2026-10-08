import { useMemo, useState } from 'react';
import { useAdmin, downloadCsv } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { refundSale, printReceipt } from '../erp.js';
import { Modal } from './POS.jsx';
import { Icon, Button, Pill, Stat, Tabs, Empty, Field, Toggle } from '../../ui/index.jsx';
import { money, cx, shortDate, timeOfDay } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const dayStart = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const STATUS = { completed: ['Completed', 'teal'], partially_refunded: ['Part refunded', 'yellow'], refunded: ['Refunded', 'red'] };

function RefundModal({ sale, methods, onClose, user }) {
  const { toast } = useStore();
  const already = {};
  (sale.refunds || []).forEach((r) => r.items.forEach((i) => { already[i.index] = (already[i.index] || 0) + i.qty; }));
  const [qty, setQty] = useState(() => sale.items.map(() => 0));
  const [method, setMethod] = useState(sale.payments?.[0]?.method || 'Cash');
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(true);
  const [busy, setBusy] = useState(false);
  const base = (sale.gross || 0) - (sale.lineDiscount || 0);
  const est = sale.items.reduce((a, l, i) => a + (base > 0 ? (l.lineTotal / l.qty) * (sale.total / base) * qty[i] : 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await refundSale(sale, qty.map((q, index) => ({ index, qty: q })), { method, reason, by: user?.name, restock });
      toast(`Refunded ${money(r.amount)} by ${method}`);
      onClose();
    } catch (err) {
      toast(err.message || 'Refund failed', { tone: 'error' });
    }
    setBusy(false);
  };

  return (
    <Modal title={`Refund ${sale.number}`} onClose={onClose} width={560}>
      <form className="stack gap-14" onSubmit={submit}>
        <div className="list">
          {sale.items.map((l, i) => {
            const left = l.qty - (already[i] || 0);
            return (
              <div key={i} className="list-row">
                <div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block', fontSize: 14 }}>{l.name}</b><span className="sub" style={{ fontSize: 12 }}>Sold {l.qty} · {left} returnable</span></div>
                <input className="input" type="number" min="0" max={left} value={qty[i]} disabled={left <= 0} style={{ width: 80, height: 38 }}
                  onChange={(e) => setQty(qty.map((q, k) => (k === i ? Math.min(left, Math.max(0, parseInt(e.target.value, 10) || 0)) : q)))} aria-label={`Return quantity for ${l.name}`} />
                <button type="button" className="pill sm" disabled={left <= 0} onClick={() => setQty(qty.map((q, k) => (k === i ? left : q)))}>All</button>
              </div>
            );
          })}
        </div>
        <div className="fields">
          <Field label="Refund method">
            <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>{methods.map((m) => <option key={m}>{m}</option>)}</select>
          </Field>
          <Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Wrong size, damaged" required />
        </div>
        <div className="toggle-row"><span>Put returned items back into stock</span><Toggle checked={restock} onChange={setRestock} label="Restock" /></div>
        <Button type="submit" variant="dark" block icon="rotate" disabled={busy || !qty.some((q) => q > 0)}>{busy ? 'Refunding…' : `Refund ${money(est)}`}</Button>
      </form>
    </Modal>
  );
}

export default function Sales({ user }) {
  const { sales, shifts, settings } = useAdmin();
  const [tab, setTab] = useState('sales');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [when, setWhen] = useState('today');
  const [method, setMethod] = useState('');
  const [cashier, setCashier] = useState('');
  const [selId, setSelId] = useState(null);
  const [refund, setRefund] = useState(null);

  const from = when === 'all' ? 0 : dayStart() - ({ today: 0, '7d': 6, '30d': 29 }[when] || 0) * 864e5;
  const base = useMemo(() => sales.filter((s) => {
    if (s.createdAt < from) return false;
    if (q && !`${s.number} ${s.customer?.name} ${s.customer?.phone} ${s.items.map((i) => i.name).join(' ')}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (method && !(s.payments || []).some((p) => p.method === method)) return false;
    if (cashier && s.cashier?.name !== cashier) return false;
    return true;
  }), [sales, from, q, method, cashier]);
  const list = status === 'all' ? base : base.filter((s) => s.status === status);
  const sel = sales.find((s) => s.id === selId) || null;

  const gross = base.reduce((a, s) => a + (s.total || 0), 0);
  const refunds = base.reduce((a, s) => a + (s.refundedTotal || 0), 0);
  const profit = base.reduce((a, s) => a + (s.profit || 0), 0);
  const cashiers = [...new Set(sales.map((s) => s.cashier?.name).filter(Boolean))];

  const exportCsv = () => downloadCsv(`pos-sales-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Receipt', 'Date', 'Customer', 'Phone', 'Items', 'Gross', 'Discount', 'VAT', 'Total', 'Refunded', 'Payments', 'Cashier', 'Status'],
    ...list.map((s) => [s.number, new Date(s.createdAt).toISOString(), s.customer?.name, s.customer?.phone, s.units, s.gross, s.totalDiscount, s.vat, s.total, s.refundedTotal || 0, (s.payments || []).map((p) => `${p.method}:${p.amount}`).join(' '), s.cashier?.name, s.status]),
  ]);

  return (
    <>
      <PageHead eyebrow="Point of sale" title="Sales & returns">
        <Button variant="outline" icon="download" onClick={exportCsv}>Export CSV</Button>
        <Button variant="dark" icon="cash" to="/admin/pos">Open register</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Sales" value={base.length} icon="bag" note={when === 'today' ? 'today' : when === 'all' ? 'all time' : `last ${when}`} />
        <Stat label="Takings" value={money(gross)} icon="cash" note={`${money(refunds)} refunded`} />
        <Stat label="Avg. basket" value={money(base.length ? gross / base.length : 0)} icon="trend" />
        <Stat label="Gross profit" value={money(profit)} icon="pulse" note={gross ? `${Math.round((profit / gross) * 100)}% margin` : 'needs product costs'} />
      </div>

      <div className="card-tabs" style={{ padding: '16px 0 0', border: 0 }}>
        <Tabs items={[{ value: 'sales', label: 'Receipts', count: list.length }, { value: 'shifts', label: 'Shifts', count: shifts.length }]} value={tab} onChange={setTab} />
      </div>

      {tab === 'shifts' ? <Shifts shifts={shifts} sales={sales} /> : (
        <>
          <div className="filter-row" style={{ marginTop: 16 }}>
            <div className="searchbar"><Icon name="filter" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Receipt no., customer, phone or product" aria-label="Filter sales" /></div>
            <select className="filter-select" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Date"><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">All time</option></select>
            <select className="filter-select" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment"><option value="">Payment</option>{settings.paymentMethods.map((m) => <option key={m}>{m}</option>)}</select>
            <select className="filter-select" value={cashier} onChange={(e) => setCashier(e.target.value)} aria-label="Cashier"><option value="">Cashier</option>{cashiers.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="adm-grid-side wide">
            <div className="card flush">
              <div className="card-tabs"><Tabs items={[['all', 'All'], ['completed', 'Completed'], ['partially_refunded', 'Part refunded'], ['refunded', 'Refunded']].map(([v, l]) => ({ value: v, label: l, count: v === 'all' ? base.length : base.filter((s) => s.status === v).length }))} value={status} onChange={setStatus} /></div>
              {list.length === 0 ? <Empty icon="cash" title="No sales here yet">Sales rung up on the register appear here instantly.</Empty> : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Receipt</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Time</th></tr></thead>
                    <tbody>
                      {list.slice(0, 200).map((s) => {
                        const [label, tone] = STATUS[s.status] || STATUS.completed;
                        return (
                          <tr key={s.id} className={cx('clickable', selId === s.id && 'selected')} onClick={() => setSelId(s.id)}>
                            <td className="mono" style={{ fontWeight: 600 }}>{s.number}</td>
                            <td><div className="cell-title">{s.customer?.name || 'Walk-in'}</div><div className="cell-sub">{s.cashier?.name}</div></td>
                            <td className="muted">{s.units}</td>
                            <td><b>{money(s.total)}</b></td>
                            <td>{(s.payments || []).map((p) => <span key={p.method} className="pill sm" style={{ marginRight: 4 }}>{p.method}</span>)}</td>
                            <td><Pill tone={tone} sm>{label}</Pill></td>
                            <td className="muted" title={shortDate(s.createdAt)}>{when === 'today' ? timeOfDay(s.createdAt) : shortDate(s.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {sel ? (
              <div className="card" style={{ position: 'sticky', top: 84 }}>
                <div className="card-head"><div><h2 className="h-card mono">{sel.number}</h2><div className="sub">{new Date(sel.createdAt).toLocaleString('en-GB')} · {sel.cashier?.name}</div></div><Pill tone={(STATUS[sel.status] || STATUS.completed)[1]} sm>{(STATUS[sel.status] || STATUS.completed)[0]}</Pill></div>
                <div className="sub" style={{ marginBottom: 8 }}>{sel.customer?.name}{sel.customer?.phone ? ` · ${sel.customer.phone}` : ''}</div>
                <div className="list">
                  {sel.items.map((l, i) => (
                    <div key={i} className="list-row" style={{ padding: '8px 0' }}>
                      <div className="grow" style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontSize: 14 }}>{l.name}</div><div className="sub" style={{ fontSize: 12 }}>{l.qty} × {money(l.price)}{l.discount ? ` −${money(l.discount)}` : ''}</div></div>
                      <b>{money(l.lineTotal)}</b>
                    </div>
                  ))}
                </div>
                <div className="kv-grid" style={{ marginTop: 10 }}>
                  <span>Subtotal</span><b>{money(sel.gross)}</b>
                  {sel.totalDiscount > 0 && <><span>Discount</span><b>−{money(sel.totalDiscount)}</b></>}
                  {sel.vatRate > 0 && <><span>VAT {sel.vatRate}%</span><b>{money(sel.vat)}</b></>}
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>Total</span><b style={{ fontSize: 18 }}>{money(sel.total)}</b>
                  {(sel.payments || []).map((p, i) => [<span key={`k${i}`}>{p.method}{p.ref ? ` · ${p.ref}` : ''}</span>, <b key={`v${i}`}>{money(p.amount)}</b>])}
                  {sel.change > 0 && <><span>Change</span><b>{money(sel.change)}</b></>}
                  {sel.profit != null && <><span>Gross profit</span><b className="teal">{money(sel.profit)}</b></>}
                </div>
                {(sel.refunds || []).length > 0 && (
                  <div className="note-yellow" style={{ marginTop: 12 }}>
                    {sel.refunds.map((r, i) => <div key={i}>Refunded {money(r.amount)} by {r.method} · {r.reason} · {r.by} · {shortDate(r.at)}</div>)}
                  </div>
                )}
                <div className="row gap-8" style={{ marginTop: 14 }}>
                  <Button variant="outline" icon="printer" className="grow" onClick={() => printReceipt(sel, settings, { copy: true })}>Reprint</Button>
                  <Button variant="dark" icon="rotate" className="grow" disabled={sel.status === 'refunded'} onClick={() => setRefund(sel)}>Refund</Button>
                </div>
              </div>
            ) : <div className="card"><Empty icon="file" title="Select a receipt">Pick a sale to see its lines, payments and refunds.</Empty></div>}
          </div>
        </>
      )}
      {refund && <RefundModal sale={refund} methods={settings.paymentMethods} user={user} onClose={() => setRefund(null)} />}
    </>
  );
}

function Shifts({ shifts, sales }) {
  if (!shifts.length) return <div className="card" style={{ marginTop: 16 }}><Empty icon="clock" title="No shifts yet">Open the register to start the first cash-drawer shift.</Empty></div>;
  return (
    <div className="card flush" style={{ marginTop: 16 }}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Register</th><th>Opened</th><th>Closed</th><th>Sales</th><th>Takings</th><th>Expected cash</th><th>Counted</th><th>Variance</th></tr></thead>
          <tbody>
            {shifts.map((s) => {
              const n = sales.filter((x) => x.shiftId === s.id);
              const v = s.variance;
              return (
                <tr key={s.id}>
                  <td><div className="cell-title">{s.register}</div><div className="cell-sub">{s.openedBy?.name}</div></td>
                  <td className="muted">{new Date(s.openedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{s.status === 'open' ? <Pill tone="teal" sm>Open</Pill> : <span className="muted">{new Date(s.closedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>}</td>
                  <td>{n.length}</td>
                  <td>{money(n.reduce((a, x) => a + (x.total || 0), 0))}</td>
                  <td>{s.expectedCash != null ? money(s.expectedCash) : '—'}</td>
                  <td>{s.countedCash != null ? money(s.countedCash) : '—'}</td>
                  <td>{v == null ? '—' : <Pill tone={Math.abs(v) < 1 ? 'teal' : 'red'} sm>{v > 0 ? '+' : ''}{money(v)}</Pill>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
