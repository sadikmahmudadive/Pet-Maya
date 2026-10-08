import { useMemo, useState } from 'react';
import { useAdmin, downloadCsv } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Button, Pill, Stat, Empty } from '../../ui/index.jsx';
import { money } from '../../lib/format.js';

const DAY = 864e5;
const dayKey = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

function Bars({ series, height = 180, fmt = (v) => money(v, { compact: true }) }) {
  const max = Math.max(...series.map((s) => s.value), 1);
  return (
    <div style={{ position: 'relative' }}>
      <div className="gridlines" style={{ height }}>{[1, 0.5, 0].map((f) => <div key={f}>{fmt(max * f)}</div>)}</div>
      <div className="bars" style={{ paddingLeft: 40, height }}>
        {series.map((s, i) => (
          <div key={i} className="bar" style={{ height: `${(s.value / max) * 100}%`, background: s.color }}>
            <span className="tip">{s.label} · {fmt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Table({ title, sub, head, rows, file }) {
  return (
    <div className="card flush">
      <div className="row between" style={{ padding: '16px 20px' }}>
        <div><h2 className="h-card">{title}</h2>{sub && <div className="sub">{sub}</div>}</div>
        {file && <Button size="sm" variant="outline" icon="download" onClick={() => downloadCsv(file, [head, ...rows.map((r) => r.map((c) => (typeof c === 'object' ? c?.csv ?? '' : c)))])}>CSV</Button>}
      </div>
      {rows.length === 0 ? <Empty icon="trend" title="No data in this period" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{rows.slice(0, 25).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{typeof c === 'object' && c !== null ? c.ui : c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { orders, sales, products } = useAdmin();
  const [days, setDays] = useState(30);
  const from = dayKey(Date.now()) - (days - 1) * DAY;

  const r = useMemo(() => {
    const prod = Object.fromEntries(products.map((p) => [p.id, p]));
    const online = orders.filter((o) => o.placedAt >= from && o.status !== 'Cancelled' && o.status !== 'Return');
    const pos = sales.filter((s) => s.createdAt >= from);

    // Normalise both channels into line records
    const lines = [];
    online.forEach((o) => o.items.forEach((i) => lines.push({ id: i.id, name: i.name, qty: i.qty, revenue: i.price * i.qty, cost: (prod[i.id]?.cost || 0) * i.qty, channel: 'Online', at: o.placedAt })));
    pos.forEach((s) => {
      const keep = s.total ? 1 - (s.refundedTotal || 0) / s.total : 1;
      const ratio = (s.gross - (s.lineDiscount || 0)) > 0 ? s.total / (s.gross - (s.lineDiscount || 0)) : 1;
      s.items.forEach((i) => lines.push({ id: i.productId, name: i.name, qty: i.qty * keep, revenue: i.lineTotal * ratio * keep, cost: (i.cost || 0) * i.qty * keep, channel: 'Store', at: s.createdAt }));
    });

    const series = Array.from({ length: days }, (_, k) => {
      const d = from + k * DAY;
      const on = online.filter((o) => dayKey(o.placedAt) === d).reduce((a, o) => a + o.total, 0);
      const st = pos.filter((s) => dayKey(s.createdAt) === d).reduce((a, s) => a + s.total - (s.refundedTotal || 0), 0);
      return { d, on, st };
    });

    const group = (keyFn) => {
      const g = {};
      lines.forEach((l) => { const k = keyFn(l); if (!k) return; g[k] ||= { qty: 0, revenue: 0, cost: 0 }; g[k].qty += l.qty; g[k].revenue += l.revenue; g[k].cost += l.cost; });
      return Object.entries(g).sort((a, b) => b[1].revenue - a[1].revenue);
    };
    const byProduct = group((l) => l.name);
    const byCategory = group((l) => prod[l.id]?.category || 'other');

    const pay = {};
    online.forEach((o) => { pay[o.payment] = (pay[o.payment] || 0) + o.total; });
    pos.forEach((s) => (s.payments || []).forEach((p) => { pay[p.method] = (pay[p.method] || 0) + p.amount - (p.method === 'Cash' ? s.change || 0 : 0); }));

    const hours = Array.from({ length: 24 }, (_, h) => ({ h, n: 0, v: 0 }));
    pos.forEach((s) => { const h = new Date(s.createdAt).getHours(); hours[h].n++; hours[h].v += s.total; });
    online.forEach((o) => { const h = new Date(o.placedAt).getHours(); hours[h].n++; hours[h].v += o.total; });

    const soldIds = new Set(lines.filter((l) => l.at >= Date.now() - 30 * DAY).map((l) => l.id));
    const slow = products.filter((p) => p.stockCount > 0 && !soldIds.has(p.id)).sort((a, b) => b.stockCount * (b.cost || b.price) - a.stockCount * (a.cost || a.price));

    const onlineRev = online.reduce((a, o) => a + o.total, 0);
    const storeRev = pos.reduce((a, s) => a + s.total - (s.refundedTotal || 0), 0);
    const revenue = lines.reduce((a, l) => a + l.revenue, 0);
    const cost = lines.reduce((a, l) => a + l.cost, 0);
    return { series, byProduct, byCategory, pay: Object.entries(pay).sort((a, b) => b[1] - a[1]), hours, slow, onlineRev, storeRev, onlineN: online.length, storeN: pos.length, revenue, cost };
  }, [orders, sales, products, from, days]);

  const total = r.onlineRev + r.storeRev;
  const pctCell = (v, base) => ({ ui: <Pill sm tone={v / (base || 1) < 0.15 ? 'red' : 'teal'}>{base ? Math.round((v / base) * 100) : 0}%</Pill>, csv: base ? Math.round((v / base) * 100) : 0 });
  const peak = [...r.hours].sort((a, b) => b.n - a.n)[0];

  return (
    <>
      <PageHead eyebrow="Analytics" title="Reports">
        <select className="filter-select" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period">
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 12 months</option>
        </select>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Total sales" value={money(total, { compact: true })} icon="trend" note={`${r.onlineN + r.storeN} transactions`} />
        <Stat label="Online" value={money(r.onlineRev, { compact: true })} icon="bag" delta={total ? `${Math.round((r.onlineRev / total) * 100)}%` : null} note={`${r.onlineN} orders`} />
        <Stat label="In store" value={money(r.storeRev, { compact: true })} icon="cash" delta={total ? `${Math.round((r.storeRev / total) * 100)}%` : null} note={`${r.storeN} receipts`} />
        <Stat label="Gross margin" value={r.revenue ? `${Math.round(((r.revenue - r.cost) / r.revenue) * 100)}%` : '—'} icon="pulse" note={money(r.revenue - r.cost, { compact: true }) + ' gross profit'} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div><h2 className="h-card">Sales by day</h2><div className="sub">Online + store, net of store refunds</div></div>
          <div className="row gap-8"><span className="pill sm"><span className="dot" style={{ background: 'var(--teal)' }} /> Online</span><span className="pill sm"><span className="dot" style={{ background: 'var(--amber)' }} /> Store</span></div>
        </div>
        <Bars series={r.series.flatMap((s) => [{ value: s.on, label: `${new Date(s.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} online` }, { value: s.st, color: 'var(--amber)', label: `${new Date(s.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} store` }]).slice(-Math.min(days * 2, 62))} />
        {days > 31 && <div className="sub" style={{ marginTop: 8 }}>Chart shows the most recent 31 days; tables cover the full period.</div>}
      </div>

      <div className="adm-grid-2 even" style={{ marginTop: 16 }}>
        <Table title="Sales by category" file="sales-by-category.csv" head={['Category', 'Units', 'Revenue', 'Gross profit', 'Margin']}
          rows={r.byCategory.map(([k, v]) => [k, Math.round(v.qty), money(v.revenue), money(v.revenue - v.cost), pctCell(v.revenue - v.cost, v.revenue)])} />
        <Table title="Payment methods" file="payment-methods.csv" head={['Method', 'Amount', 'Share']}
          rows={r.pay.map(([k, v]) => [k, money(v), pctCell(v, total)])} />
      </div>

      <div style={{ marginTop: 16 }}>
        <Table title="Top products" sub="Both channels, ranked by revenue" file="top-products.csv" head={['Product', 'Units', 'Revenue', 'Cost', 'Gross profit', 'Margin']}
          rows={r.byProduct.map(([k, v]) => [k, Math.round(v.qty), money(v.revenue), money(v.cost), money(v.revenue - v.cost), pctCell(v.revenue - v.cost, v.revenue)])} />
      </div>

      <div className="adm-grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><div><h2 className="h-card">Busiest hours</h2><div className="sub">{peak?.n ? `Peak at ${String(peak.h).padStart(2, '0')}:00 — staff the till then` : 'No transactions yet'}</div></div></div>
          <Bars height={150} fmt={(v) => String(Math.round(v))} series={r.hours.slice(7, 23).map((h) => ({ value: h.n, label: `${String(h.h).padStart(2, '0')}:00 · ${h.n} sales` }))} />
          <div className="bar-labels" style={{ paddingLeft: 44 }}>{r.hours.slice(7, 23).map((h) => <span key={h.h}>{h.h}</span>)}</div>
        </div>
        <Table title="Slow movers" sub="In stock, no sales in 30 days — consider a promotion" file="slow-movers.csv" head={['Product', 'Stock', 'Tied-up value']}
          rows={r.slow.map((p) => [p.name, p.stockCount, money(p.stockCount * (p.cost || p.price))])} />
      </div>
    </>
  );
}

