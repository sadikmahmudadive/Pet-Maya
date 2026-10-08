import { useMemo, useState } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useAdmin, downloadCsv, ADMIN_CONFIG } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Well } from '../../ui/index.jsx';
import { money, timeOfDay, greeting, cx } from '../../lib/format.js';
import { SAMPLE_REVENUE_14D, SAMPLE_COLDCHAIN } from '../../data/sample.js';
import { StatusPill } from './Orders.jsx';

const dayKey = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const pct = (a, b) => (b ? `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(1)}%` : '—');

export default function Dashboard({ user }) {
  const { orders, products, events, rxQueue, live, sales = [], purchases = [], coupons = [] } = useAdmin();
  const { navigate } = useRouter();
  const [range, setRange] = useState(14);

  const m = useMemo(() => {
    const today = dayKey(Date.now());
    const yesterday = today - 864e5;
    const valid = orders.filter((o) => o.status !== 'Cancelled' && o.status !== 'Return');
    const todays = valid.filter((o) => dayKey(o.placedAt) === today);
    const yest = valid.filter((o) => dayKey(o.placedAt) === yesterday);
    const rev = (l) => l.reduce((a, o) => a + o.total, 0);

    // Revenue series
    let series = Array.from({ length: range }, (_, i) => {
      const day = today - (range - 1 - i) * 864e5;
      return { day, value: rev(valid.filter((o) => dayKey(o.placedAt) === day)) };
    });
    const sampleSeries = !live.orders;
    if (sampleSeries) series = series.map((s, i) => ({ ...s, value: SAMPLE_REVENUE_14D[(i + 14 - range) % 14] || 0 }));
    const half = Math.floor(range / 2);
    const growth = pct(series.slice(half).reduce((a, s) => a + s.value, 0), series.slice(0, half).reduce((a, s) => a + s.value, 0));

    const delivered = valid.filter((o) => o.deliveredAt && o.placedAt);
    const avgDelivery = delivered.length ? Math.round(delivered.reduce((a, o) => a + (o.deliveredAt - o.placedAt), 0) / delivered.length / 60000) : null;

    const cold = live.orders
      ? orders.filter((o) => o.status === 'In transit' && o.hasCold).map((o) => ({ order: o.id, customer: o.customer, eta: '—', temp: o.temps?.length ? Number(o.temps[o.temps.length - 1]) : null }))
      : SAMPLE_COLDCHAIN;

    const lowStock = products.filter((p) => p.stockCount <= p.reorderPoint);
    const unassigned = events.filter((e) => !e.doctor && !e.vetId && e.status !== 'Completed');
    const slowPacking = orders.filter((o) => o.status === 'Packing' && Date.now() - o.placedAt > ADMIN_CONFIG.packingSlaMin * 60000);

    const units = {};
    (todays.length ? todays : valid.slice(0, 40)).forEach((o) => o.items.forEach((i) => { units[i.name] = (units[i.name] || 0) + i.qty; }));
    let top = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!live.orders) top = [['NexGard Spectra Chews', 148], ['Royal Canin Renal', 96], ['Apoquel 16mg', 71], ['Nobivac Rabies', 64], ['Synoquin EFA', 52]];

    // In-store (POS) takings, net of refunds — counted alongside online revenue.
    const posRev = (day) => sales.filter((x) => dayKey(x.createdAt) === day).reduce((a, x) => a + (x.total || 0) - (x.refundedTotal || 0), 0);
    const posToday = posRev(today);
    const posCount = sales.filter((x) => dayKey(x.createdAt) === today).length;
    series = series.map((s) => ({ ...s, value: s.value + posRev(s.day) }));
    const toReceive = purchases.filter((p) => p.status === 'Ordered' || p.status === 'Partially received');
    const activeCoupons = coupons.filter((c) => c.active && (!c.expiresAt || c.expiresAt > Date.now())).length;

    return {
      posToday, posCount, toReceive, activeCoupons,
      revToday: (live.orders ? rev(todays) : 118400) + posToday, revYest: (live.orders ? rev(yest) : 105270) + posRev(yesterday),
      ordToday: live.orders ? todays.length : 184, ordYest: live.orders ? yest.length : 169,
      series, growth, avgDelivery: avgDelivery ?? (!live.orders ? 52 : null), cold, lowStock, unassigned, slowPacking, top,
    };
  }, [orders, products, events, live, range, sales, purchases, coupons]);

  const max = Math.max(...m.series.map((s) => s.value), 1);
  const oldestRx = rxQueue.reduce((a, r) => Math.max(a, r.waitingMin || 0), 0);
  const alert = m.cold.find((c) => c.temp != null && (c.temp > 8 || c.temp < 2));

  const exportReport = () => downloadCsv(`pet-maya-orders-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Order', 'Placed', 'Customer', 'Items', 'Total', 'Status', 'Payment'],
    ...orders.map((o) => [o.id, new Date(o.placedAt).toISOString(), o.customer, o.items.length, o.total, o.status, o.payment]),
  ]);

  const firstName = (user?.name || '').split(' ')[0];
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <PageHead eyebrow={dateLabel} title={`${greeting()}${firstName && firstName !== 'Preview' ? `, ${firstName}` : ''}`}>
        <select className="filter-select" value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Date range">
          <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option>
        </select>
        <Button variant="dark" icon="download" onClick={exportReport}>Export report</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Revenue today" value={money(m.revToday)} icon="trend" delta={pct(m.revToday, m.revYest)} note={m.posToday ? `incl. ${money(m.posToday, { compact: true })} in store` : 'vs yesterday'} />
        <Stat label="Orders" value={m.ordToday.toLocaleString('en-US')} icon="bag" delta={pct(m.ordToday, m.ordYest)} note="vs yesterday" />
        <Stat label="Rx pending" value={rxQueue.length} icon="file" delta={oldestRx ? `${oldestRx} min` : '0'} deltaTone={oldestRx > ADMIN_CONFIG.rxSlaMin ? 'red' : 'teal'} note="oldest waiting" />
        <Stat label="Avg. delivery" value={m.avgDelivery != null ? `${m.avgDelivery} min` : '—'} icon="clock" delta={m.avgDelivery != null ? 'live' : null} note={m.avgDelivery != null ? 'placed → delivered' : 'Needs deliveredAt on orders'} />
      </div>

      <div className="adm-grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <div><h2 className="h-card">Revenue · last {range} days</h2><div className="sub">Online + in-store, BDT</div></div>
            <Pill tone="teal" sm>{m.growth} vs prior {Math.floor(range / 2)} days</Pill>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="gridlines" style={{ height: 180 }}>{[1, 0.66, 0.33, 0].map((f) => <div key={f}>{money(max * f, { compact: true })}</div>)}</div>
            <div className="bars" style={{ paddingLeft: 40 }}>
              {m.series.map((s, i) => (
                <div key={s.day} className={cx('bar', i === m.series.length - 1 && 'now')} style={{ height: `${(s.value / max) * 100}%` }}>
                  <span className="tip">{new Date(s.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {money(s.value)}</span>
                </div>
              ))}
            </div>
            <div className="bar-labels" style={{ paddingLeft: 44 }}>{m.series.map((s) => <span key={s.day}>{range > 14 && new Date(s.day).getDate() % 3 ? '' : new Date(s.day).getDate()}</span>)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div><h2 className="h-card">Cold-chain in transit</h2><div className="sub">{m.cold.length} deliveries on the road</div></div>
            <span className="mono teal" style={{ fontSize: 11 }}>2°C – 8°C</span>
          </div>
          {m.cold.length === 0 ? <div className="sub" style={{ padding: '24px 0' }}>No cold-chain deliveries out right now.</div> : (
            <div className="stack gap-12">
              {m.cold.slice(0, 5).map((c) => {
                const bad = c.temp != null && (c.temp > 8 || c.temp < 2);
                return (
                  <Link key={c.order} to={`/admin/orders/${c.order}`} className="row gap-12">
                    <Well icon="cold" size="sm" round tone={bad ? 'red' : 'teal'} />
                    <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>{c.order} · {c.customer}</div><div className="sub" style={{ fontSize: 12 }}>ETA {c.eta}</div></div>
                    <span className={cx('mono', bad ? 'red' : 'teal')} style={{ fontSize: 13 }}>{c.temp != null ? `${c.temp.toFixed(1)}°C` : 'no log'}</span>
                  </Link>
                );
              })}
            </div>
          )}
          {alert && (
            <div className="row gap-10" style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: 'var(--red-tint)', color: 'var(--red)', fontSize: 13 }}>
              <Icon name="bell" size={15} /><span className="grow">{alert.order} is outside the safe range</span><Link to={`/admin/orders/${alert.order}`} className="link" style={{ color: 'var(--red)' }}>Review</Link>
            </div>
          )}
        </div>
      </div>

      <div className="adm-grid-2 even" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><div><h2 className="h-card">Needs your attention</h2><div className="sub">Sorted by urgency</div></div></div>
          <div className="stack gap-6">
            {[
              ['file', 'yellow', 'Prescriptions to verify', oldestRx ? `Oldest waiting ${oldestRx} min` : 'All clear', rxQueue.length, '/admin/prescriptions'],
              ['flask', 'red', 'SKUs below reorder point', `${m.lowStock.filter((p) => p.coldChain).length} are cold-chain`, m.lowStock.length, '/admin/inventory?tab=low'],
              ['tag', 'teal', 'Active promo codes', 'Drive storefront conversions', m.activeCoupons, '/admin/promotions'],
              ['truck', 'teal', 'Deliveries to receive', m.toReceive.length ? 'Check them in under Purchasing' : 'Nothing on order', m.toReceive.length, '/admin/purchasing'],
              ['cash', '', 'Till receipts today', m.posCount ? `${money(m.posToday)} taken in store` : 'Open the register to start selling', m.posCount, '/admin/sales'],
              ['calendar', 'teal', 'Consults without a vet', m.unassigned.length ? 'Assign before the slot starts' : 'All assigned', m.unassigned.length, '/admin/appointments'],
              ['bag', '', `Orders packing > ${ADMIN_CONFIG.packingSlaMin} min`, 'Check the pharmacy bench', m.slowPacking.length, '/admin/orders?status=Packing'],
            ].map(([icon, tone, title, sub, n, to]) => (
              <button key={title} className="row gap-12" style={{ padding: '10px 4px', textAlign: 'left' }} onClick={() => navigate(to)}>
                <Well icon={icon} tone={tone} />
                <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div><div className="sub" style={{ fontSize: 12 }}>{sub}</div></div>
                <b style={{ fontSize: 20 }}>{n}</b><Icon name="arrowRight" size={15} />
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2 className="h-card">Top products</h2><div className="sub">Units sold today</div></div></div>
          <div className="stack gap-14">
            {m.top.length === 0 ? <div className="sub">No sales yet today.</div> : m.top.map(([name, n], i) => (
              <div key={name}>
                <div className="row between" style={{ fontSize: 14 }}><span><span className="mono subtle" style={{ fontSize: 11, marginRight: 10 }}>{i + 1}</span>{name}</span><b>{n}</b></div>
                <div className="meter" style={{ marginTop: 6, height: 5 }}><span style={{ width: `${(n / m.top[0][1]) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card flush" style={{ marginTop: 16 }}>
        <div className="row between" style={{ padding: '20px 22px' }}>
          <div><h2 className="h-card">Recent orders</h2><div className="sub">{live.orders ? 'Live feed' : 'Sample data'}</div></div>
          <Button variant="outline" icon="arrowRight" to="/admin/orders">View all</Button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.docId} className="clickable" onClick={() => navigate(`/admin/orders/${o.docId}`)}>
                  <td className="mono" style={{ fontWeight: 600 }}>{o.id}</td>
                  <td><div className="cell-title">{o.customer}</div><div className="cell-sub">{[o.pet, o.area].filter(Boolean).join(' · ')}</div></td>
                  <td>{money(o.total)}</td>
                  <td><StatusPill s={o.status} /></td>
                  <td className="muted">{timeOfDay(o.placedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
