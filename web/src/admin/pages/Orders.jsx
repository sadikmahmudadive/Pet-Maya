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

export default function Orders({ user }) {
  const { orders } = useAdmin();
  const write = useAdminWrite();
  const { query, navigate } = useRouter();
  const [tab, setTab] = useState(query.get('status') || 'all');
  const [q, setQ] = useState(query.get('q') || '');
  const [pay, setPay] = useState('');
  const [zone, setZone] = useState('');
  const [when, setWhen] = useState('all');
  const [sel, setSel] = useState([]);
  const [page, setPage] = useState(0);

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
        <Button variant="dark" icon="plus" to="/shop">Create manual order</Button>
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
    </>
  );
}
