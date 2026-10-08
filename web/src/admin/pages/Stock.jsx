import { useMemo, useState } from 'react';
import { useAdmin, downloadCsv } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { adjustStock } from '../erp.js';
import { Modal } from './POS.jsx';
import { Icon, Button, Pill, Stat, Tabs, Empty, Field } from '../../ui/index.jsx';
import { money, cx, shortDate } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const TYPE = {
  sale: ['POS sale', ''], online: ['Online order', ''], purchase: ['Goods received', 'teal'], return: ['Customer return', 'teal'], adjustment: ['Adjustment', 'yellow'],
};
const REASONS = ['Count correction', 'Damaged', 'Expired', 'Lost / stolen', 'Internal use (clinic)', 'Found', 'Sample / giveaway', 'Other'];

function AdjustModal({ products, preset, user, onClose }) {
  const { toast } = useStore();
  const [pid, setPid] = useState(preset || products[0]?.id || '');
  const [mode, setMode] = useState('remove');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('Damaged');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const p = products.find((x) => x.id === pid);
  const after = !p || qty === '' ? null : mode === 'set' ? Number(qty) : p.stockCount + (mode === 'add' ? 1 : -1) * Number(qty);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const n = await adjustStock(pid, mode === 'set' ? { setTo: Number(qty), reason, note, by: user?.name } : { delta: (mode === 'add' ? 1 : -1) * Number(qty), reason, note, by: user?.name });
      toast(`${p.name}: stock now ${n}`);
      onClose();
    } catch (err) { toast(err.message || 'Adjustment failed', { tone: 'error' }); }
    setBusy(false);
  };
  return (
    <Modal title="Adjust stock" onClose={onClose} width={500}>
      <form className="stack gap-12" onSubmit={submit}>
        <Field label="Product">
          <select className="select" value={pid} onChange={(e) => setPid(e.target.value)}>{products.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.sku} · {x.stockCount} in stock</option>)}</select>
        </Field>
        <div className="pos-methods">
          {[['remove', 'Remove'], ['add', 'Add'], ['set', 'Set to count']].map(([v, l]) => <button key={v} type="button" className={cx('pos-method', mode === v && 'on')} onClick={() => setMode(v)}>{l}</button>)}
        </div>
        <div className="fields">
          <Field label={mode === 'set' ? 'Counted quantity' : 'Quantity'} type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} required autoFocus />
          <Field label="Reason"><select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field className="full" label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Batch, who found it, where…" />
        </div>
        {after != null && <div className={cx('pos-variance', after < 0 ? 'short' : 'ok')}>{p.stockCount} → {after}{p.cost ? ` · value change ${money((after - p.stockCount) * p.cost)}` : ''}</div>}
        <Button type="submit" variant="dark" block icon="check" disabled={busy || qty === '' || after < 0}>Post adjustment</Button>
      </form>
    </Modal>
  );
}

export default function Stock({ user }) {
  const { products, stockMoves, live } = useAdmin();
  const { toast } = useStore();
  const [tab, setTab] = useState('ledger');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [when, setWhen] = useState('30d');
  const [adjust, setAdjust] = useState(null);
  const [counts, setCounts] = useState({});
  const [posting, setPosting] = useState(false);

  const from = when === 'all' ? 0 : Date.now() - ({ today: 1, '7d': 7, '30d': 30 }[when] || 30) * 864e5;
  const moves = useMemo(() => stockMoves.filter((m) => m.at >= from && (!type || m.type === type) && (!q || `${m.name} ${m.ref} ${m.reason}`.toLowerCase().includes(q.toLowerCase()))), [stockMoves, from, type, q]);
  const atCost = products.reduce((a, p) => a + Math.max(0, p.stockCount) * (p.cost || 0), 0);
  const atRetail = products.reduce((a, p) => a + Math.max(0, p.stockCount) * p.price, 0);
  const noCost = products.filter((p) => !p.cost).length;
  const shrink = stockMoves.filter((m) => m.type === 'adjustment' && m.qty < 0 && m.at >= Date.now() - 30 * 864e5).reduce((a, m) => a - m.qty, 0);

  const countRows = products.filter((p) => !q || `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(q.toLowerCase()));
  const variances = Object.entries(counts).filter(([, v]) => v !== '').map(([id, v]) => {
    const p = products.find((x) => x.id === id);
    return p ? { p, counted: Number(v), diff: Number(v) - p.stockCount } : null;
  }).filter((x) => x && x.diff !== 0);

  const postCount = async () => {
    if (!variances.length) return;
    if (!window.confirm(`Post ${variances.length} stock corrections?`)) return;
    setPosting(true);
    let ok = 0;
    for (const v of variances) {
      try { await adjustStock(v.p.id, { setTo: v.counted, reason: 'Stock take', note: `Counted ${v.counted}, system ${v.p.stockCount}`, by: user?.name }); ok++; } catch { /* reported below */ }
    }
    setPosting(false);
    setCounts({});
    toast(ok === variances.length ? `Posted ${ok} corrections` : `Posted ${ok} of ${variances.length} — check permissions`, { tone: ok === variances.length ? undefined : 'error' });
  };

  return (
    <>
      <PageHead eyebrow="Inventory control" title="Stock">
        <Button variant="outline" icon="download" onClick={() => downloadCsv('stock-valuation.csv', [['SKU', 'Product', 'Category', 'Qty', 'Unit cost', 'Value at cost', 'Price', 'Value at retail'], ...products.map((p) => [p.sku, p.name, p.category, p.stockCount, p.cost, p.stockCount * p.cost, p.price, p.stockCount * p.price])])}>Valuation CSV</Button>
        <Button variant="dark" icon="layers" onClick={() => setAdjust({})} disabled={!live.products}>Adjust stock</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Stock at cost" value={money(atCost, { compact: true })} icon="layers" note={noCost ? `${noCost} SKUs missing cost` : 'all SKUs costed'} />
        <Stat label="Stock at retail" value={money(atRetail, { compact: true })} icon="tag" note={atRetail && atCost ? `${Math.round(((atRetail - atCost) / atRetail) * 100)}% potential margin` : 'add cost prices to see margin'} />
        <Stat label="Movements" value={moves.length} icon="refresh" note={when === 'all' ? 'all time' : `last ${when}`} />
        <Stat label="Shrinkage 30 d" value={`${shrink} units`} icon="alert" deltaTone="red" note="damaged, expired, lost" />
      </div>

      <div style={{ marginTop: 16 }}><Tabs items={[{ value: 'ledger', label: 'Movement ledger' }, { value: 'value', label: 'Valuation' }, { value: 'count', label: 'Stock take', count: variances.length || null }]} value={tab} onChange={setTab} /></div>

      <div className="filter-row" style={{ marginTop: 16 }}>
        <div className="searchbar"><Icon name="filter" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'ledger' ? 'Product, reference or reason' : 'Product, SKU or barcode'} aria-label="Filter" /></div>
        {tab === 'ledger' && <>
          <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="">All movements</option>{Object.entries(TYPE).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
          <select className="filter-select" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Period"><option value="today">24 hours</option><option value="7d">7 days</option><option value="30d">30 days</option><option value="all">All time</option></select>
        </>}
      </div>

      {tab === 'ledger' && (
        <div className="card flush">
          {moves.length === 0 ? <Empty icon="refresh" title="No stock movements">Sales, returns, deliveries received and adjustments are all logged here.</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>When</th><th>Product</th><th>Movement</th><th>Reference</th><th>Change</th><th>Balance</th><th>By</th></tr></thead>
                <tbody>
                  {moves.slice(0, 300).map((m) => {
                    const [label, tone] = TYPE[m.type] || [m.type, ''];
                    return (
                      <tr key={m.id}>
                        <td className="muted">{new Date(m.at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="cell-title">{m.name}</td>
                        <td><Pill tone={tone} sm>{label}</Pill>{m.reason && <div className="cell-sub">{m.reason}</div>}</td>
                        <td className="mono muted">{m.ref || '—'}</td>
                        <td><b className={m.qty < 0 ? 'red' : 'teal'}>{m.qty > 0 ? '+' : ''}{m.qty}</b></td>
                        <td>{m.balanceAfter}</td>
                        <td className="muted">{m.by || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'value' && (
        <div className="card flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit cost</th><th>Value at cost</th><th>Price</th><th>Margin</th><th /></tr></thead>
              <tbody>
                {[...countRows].sort((a, b) => b.stockCount * (b.cost || 0) - a.stockCount * (a.cost || 0)).map((p) => {
                  const margin = p.price && p.cost ? Math.round(((p.price - p.cost) / p.price) * 100) : null;
                  return (
                    <tr key={p.id}>
                      <td><div className="cell-title">{p.name}</div><div className="cell-sub mono">{p.sku}</div></td>
                      <td>{p.stockCount}</td>
                      <td>{p.cost ? money(p.cost) : <span className="subtle">not set</span>}</td>
                      <td><b>{money(p.stockCount * (p.cost || 0))}</b></td>
                      <td>{money(p.price)}</td>
                      <td>{margin == null ? '—' : <Pill tone={margin < 10 ? 'red' : margin < 25 ? 'yellow' : 'teal'} sm>{margin}%</Pill>}</td>
                      <td><Button size="sm" variant="outline" disabled={!live.products} onClick={() => setAdjust({ preset: p.id })}>Adjust</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'count' && (
        <>
          {variances.length > 0 && (
            <div className="bulk-bar">
              <b>{variances.length} differences</b>
              <span className="hide-sm" style={{ opacity: 0.7, fontSize: 13 }}>net {variances.reduce((a, v) => a + v.diff, 0)} units · {money(variances.reduce((a, v) => a + v.diff * (v.p.cost || 0), 0))} at cost</span>
              <div className="row gap-8" style={{ marginLeft: 'auto' }}>
                <Button variant="outline" size="sm" onClick={() => setCounts({})}>Clear</Button>
                <Button variant="teal" size="sm" icon="check" disabled={posting || !live.products} onClick={postCount}>{posting ? 'Posting…' : 'Post corrections'}</Button>
              </div>
            </div>
          )}
          <div className="card flush">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Product</th><th>System qty</th><th style={{ width: 130 }}>Counted</th><th>Difference</th></tr></thead>
                <tbody>
                  {countRows.map((p) => {
                    const v = counts[p.id] ?? '';
                    const diff = v === '' ? null : Number(v) - p.stockCount;
                    return (
                      <tr key={p.id}>
                        <td><div className="cell-title">{p.name}</div><div className="cell-sub mono">{p.sku}{p.barcode ? ` · ${p.barcode}` : ''}</div></td>
                        <td>{p.stockCount}</td>
                        <td><input className="input" type="number" min="0" value={v} style={{ height: 36 }} onChange={(e) => setCounts({ ...counts, [p.id]: e.target.value })} aria-label={`Counted ${p.name}`} /></td>
                        <td>{diff == null ? <span className="subtle">—</span> : diff === 0 ? <Pill tone="teal" sm>Matches</Pill> : <b className={diff < 0 ? 'red' : 'teal'}>{diff > 0 ? '+' : ''}{diff}</b>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {adjust && <AdjustModal products={products} preset={adjust.preset} user={user} onClose={() => setAdjust(null)} />}
    </>
  );
}
