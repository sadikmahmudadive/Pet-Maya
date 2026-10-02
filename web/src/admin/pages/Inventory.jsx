import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '../../lib/router.jsx';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../config/firebase';
import { useAdmin, useAdminWrite, downloadCsv, ADMIN_CONFIG } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Tabs, Ph, Toggle, Field, Empty } from '../../ui/index.jsx';
import { money, cx } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const statusOf = (p) => {
  if (p.stockCount <= 0) return ['Out of stock', 'red', 'x'];
  if (p.expiresInDays != null && p.expiresInDays <= ADMIN_CONFIG.expiringDays) return ['Expiring', 'red', 'clock'];
  if (p.stockCount <= p.reorderPoint) return ['Low stock', 'yellow', 'flask'];
  return ['Healthy', 'teal', 'check'];
};

const BLANK = { id: '', name: '', brand: '', category: 'medicine', sku: '', price: 0, stockCount: 0, reorderPoint: 20, stockTarget: 100, isRx: false, coldChain: false, showOnStorefront: true, autoRefill: false, image: '', shortDescription: '', variants: [] };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `p-${Date.now()}`;

function parseCsv(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return [];
  const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

export default function Inventory() {
  const { products } = useAdmin();
  const write = useAdminWrite();
  const { toast } = useStore();
  const { query } = useRouter();
  const [tab, setTab] = useState(query.get('tab') || 'all');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [brand, setBrand] = useState('');
  const [storageF, setStorageF] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef(null);
  const csvRef = useRef(null);

  const isLow = (p) => p.stockCount > 0 && p.stockCount <= p.reorderPoint;
  const isExp = (p) => p.expiresInDays != null && p.expiresInDays <= ADMIN_CONFIG.expiringDays;

  const filtered = useMemo(() => products.filter((p) => {
    if (q && !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && p.category !== cat) return false;
    if (brand && p.brand !== brand) return false;
    if (storageF === 'cold' && !p.coldChain) return false;
    if (storageF === 'ambient' && p.coldChain) return false;
    return true;
  }), [products, q, cat, brand, storageF]);
  const TABS = [
    ['all', 'All SKUs', () => true], ['low', 'Low stock', isLow], ['cold', 'Cold-chain', (p) => p.coldChain], ['exp', `Expiring ${ADMIN_CONFIG.expiringDays}d`, isExp], ['out', 'Out of stock', (p) => p.stockCount <= 0],
  ];
  const list = filtered.filter(TABS.find((t) => t[0] === tab)?.[2] || (() => true));

  const selected = products.find((p) => p.id === editId) || (editId === null ? list[0] : null);
  useEffect(() => {
    if (editId === '__new') { setForm({ ...BLANK }); setDirty(false); return; }
    if (selected) { setForm({ ...selected }); setDirty(false); }
  }, [editId, selected?.id]); // eslint-disable-line

  const stockValue = products.reduce((a, p) => a + p.price * Math.max(0, p.stockCount), 0);
  const low = products.filter((p) => p.stockCount <= p.reorderPoint);
  const reorder = low.map((p) => ({ p, qty: Math.max(p.reorderPoint, p.stockTarget - p.stockCount) })).sort((a, b) => a.p.stockCount - b.p.stockCount);
  const cats = [...new Set(products.map((p) => p.category))].sort();
  const brands = [...new Set(products.map((p) => p.brand))].sort();

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
  const save = async () => {
    if (!form.name.trim()) { toast('Give the product a name', { tone: 'error' }); return; }
    const id = form.id || slug(form.name);
    const data = {
      name: form.name, brand: form.brand, category: form.category, sku: form.sku, price: Number(form.price) || 0,
      stockCount: Number(form.stockCount) || 0, reorderPoint: Number(form.reorderPoint) || 0, stockTarget: Number(form.stockTarget) || 0,
      inStock: Number(form.stockCount) > 0, isRx: !!form.isRx, coldChain: !!form.coldChain, showOnStorefront: !!form.showOnStorefront,
      autoRefill: !!form.autoRefill, image: form.image || '', imageUrl: form.image || '', shortDescription: form.shortDescription || '',
      ...(form.id ? {} : { rating: 4.8, ratingCount: 0, createdAt: Date.now() }),
    };
    if (await write('products', id, data, form.id ? 'Product saved' : 'Product added')) { setDirty(false); setEditId(id); }
  };
  const uploadPhoto = async (file) => {
    if (!file) return;
    if (!storage) { set('image', URL.createObjectURL(file)); return; }
    try {
      const r = ref(storage, `shop_products/${Date.now()}_${file.name}`);
      await uploadBytesResumable(r, file);
      set('image', await getDownloadURL(r));
    } catch { toast('Photo upload failed', { tone: 'error' }); }
  };
  const importCsv = async (file) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (!rows.length) { toast('No rows found. Columns: name, sku, brand, category, price, stockCount, reorderPoint, isRx, coldChain', { tone: 'error', duration: 7000 }); return; }
    let n = 0;
    for (const r of rows) {
      if (!r.name) continue;
      const ok = await write('products', r.id || slug(r.sku || r.name), {
        name: r.name, sku: r.sku || '', brand: r.brand || 'Pet Maya', category: (r.category || 'supplies').toLowerCase(), price: Number(r.price) || 0,
        stockCount: Number(r.stockCount ?? r.stock) || 0, reorderPoint: Number(r.reorderPoint) || 20, isRx: /^(1|true|yes)$/i.test(r.isRx || ''),
        coldChain: /^(1|true|yes)$/i.test(r.coldChain || ''), inStock: (Number(r.stockCount ?? r.stock) || 0) > 0,
      });
      if (ok) n++;
    }
    toast(`Imported ${n} products`);
  };

  return (
    <>
      <PageHead eyebrow="Catalogue & stock" title="Inventory">
        <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = ''; }} />
        <Button variant="outline" icon="download" onClick={() => csvRef.current?.click()}>Import CSV</Button>
        <Button variant="dark" icon="plus" onClick={() => setEditId('__new')}>Add product</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Active SKUs" value={products.length.toLocaleString('en-US')} icon="flask" note={`${products.filter((p) => p.showOnStorefront).length} on storefront`} />
        <Stat label="Stock value" value={money(stockValue, { compact: true })} icon="trend" note="at retail price" />
        <Stat label="Low stock" value={low.length} icon="bell" delta={low.filter((p) => p.coldChain).length ? `${low.filter((p) => p.coldChain).length} cold` : null} deltaTone="red" note="at or below reorder point" />
        <Stat label={`Expiring ${ADMIN_CONFIG.expiringDays} d`} value={products.filter(isExp).length} icon="clock" note="needs action" />
      </div>

      <div className="filter-row" style={{ marginTop: 16 }}>
        <div className="searchbar"><Icon name="filter" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, SKU or brand" aria-label="Filter products" /></div>
        <select className="filter-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">Category</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="filter-select" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Supplier"><option value="">Supplier</option>{brands.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="filter-select" value={storageF} onChange={(e) => setStorageF(e.target.value)} aria-label="Storage"><option value="">Storage</option><option value="cold">Cold-chain</option><option value="ambient">Ambient</option></select>
      </div>

      <div className="adm-grid-side wide">
        <div className="stack gap-16">
          <div className="card flush">
            <div className="card-tabs"><Tabs items={TABS.map(([v, l, fn]) => ({ value: v, label: l, count: filtered.filter(fn).length }))} value={tab} onChange={setTab} /></div>
            {list.length === 0 ? <Empty icon="flask" title="Nothing here" /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Product</th><th>SKU</th><th style={{ minWidth: 150 }}>Stock</th><th>Price</th><th>Status</th></tr></thead>
                  <tbody>
                    {list.map((p) => {
                      const [label, tone, icon] = statusOf(p);
                      const ratio = Math.min(1, p.stockCount / Math.max(1, p.stockTarget));
                      return (
                        <tr key={p.id} className={cx('clickable', (form?.id === p.id) && 'selected')} onClick={() => setEditId(p.id)}>
                          <td><div className="row gap-10"><Ph src={p.image} label=" " style={{ width: 38, height: 38, minHeight: 0, borderRadius: 10, flex: 'none' }} /><div><div className="cell-title">{p.name}</div><div className="cell-sub">{p.brand}</div></div></div></td>
                          <td className="mono muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{p.sku}</td>
                          <td>
                            <div className="row between" style={{ fontSize: 13 }}><b>{p.stockCount}</b><span className="subtle">/ {p.stockTarget}</span></div>
                            <div className={cx('meter', tone === 'red' ? 'red' : tone === 'yellow' ? 'amber' : '')} style={{ marginTop: 6, height: 5 }}><span style={{ width: `${Math.max(2, ratio * 100)}%` }} /></div>
                          </td>
                          <td>{money(p.price)}</td>
                          <td><Pill tone={tone} icon={icon} sm>{label}</Pill></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="h-card">Reorder suggestions</h2>
            <div className="sub" style={{ marginBottom: 10 }}>Brings each low item back to its target stock</div>
            {reorder.length === 0 ? <div className="sub">Everything is above its reorder point.</div> : (
              <>
                <div className="list">
                  {reorder.slice(0, 6).map(({ p, qty }) => (
                    <div key={p.id} className="list-row"><div className="grow"><b style={{ fontSize: 14 }}>{p.name}</b><div className="sub" style={{ fontSize: 12 }}>{p.brand} · {p.stockCount <= 0 ? 'Out of stock' : `${p.stockCount} left`}</div></div><b>+{qty}</b></div>
                  ))}
                </div>
                <Button variant="teal" block icon="arrowRight" style={{ marginTop: 14 }} onClick={() => downloadCsv(`purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`, [['Supplier', 'SKU', 'Product', 'Order qty', 'Current stock'], ...reorder.map(({ p, qty }) => [p.supplier || p.brand, p.sku, p.name, qty, p.stockCount])])}>
                  Download purchase orders
                </Button>
              </>
            )}
          </div>
        </div>

        {form && (
          <div className="card" style={{ position: 'sticky', top: 84 }}>
            <div className="card-head"><div><h2 className="h-card">{form.id ? 'Edit product' : 'New product'}</h2><div className="sub ellipsis" style={{ maxWidth: 240 }}>{form.name || 'Untitled'}</div></div>{dirty && <Pill sm>Unsaved</Pill>}</div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadPhoto(e.target.files?.[0])} />
            <button className="edit-drop" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>{form.image ? <img src={form.image} alt="" /> : '[ click to add photo ]'}</button>
            <div className="fields" style={{ marginTop: 16 }}>
              <Field className="full" label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Field label="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
              <Field label="Sale Price (BDT)" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
              <Field label="Regular Price (BDT)" type="number" min="0" value={form.compareAt || ''} onChange={(e) => set('compareAt', e.target.value)} />
              <Field label="Stock Count">
                <div className="stack gap-6">
                  <input className="input" type="number" value={form.stockCount} onChange={(e) => set('stockCount', e.target.value)} />
                  <div className="row gap-4 wrap" style={{ fontSize: 11 }}>
                    <button type="button" className="pill sm" onClick={() => set('stockCount', (Number(form.stockCount) || 0) + 10)}>+10</button>
                    <button type="button" className="pill sm" onClick={() => set('stockCount', (Number(form.stockCount) || 0) + 50)}>+50</button>
                    <button type="button" className="pill sm" onClick={() => set('stockCount', Number(form.stockTarget) || 100)}>Fill target</button>
                  </div>
                </div>
              </Field>
              <Field label="Reorder point" type="number" value={form.reorderPoint} onChange={(e) => set('reorderPoint', e.target.value)} />
              <Field label="Brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              <Field label="Category">
                <input className="input" list="cats" value={form.category} onChange={(e) => set('category', e.target.value.toLowerCase())} />
                <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
            </div>
            <div style={{ marginTop: 12 }}>
              {[['isRx', 'Requires prescription'], ['coldChain', 'Cold-chain 2–8°C'], ['showOnStorefront', 'Show on storefront'], ['autoRefill', 'Allow auto-refill']].map(([k, l]) => (
                <div key={k} className="toggle-row"><span>{l}</span><Toggle checked={!!form[k]} onChange={(v) => set(k, v)} label={l} /></div>
              ))}
            </div>
            <div className="row gap-8" style={{ marginTop: 14 }}>
              <Button variant="dark" icon="check" className="grow" onClick={save} disabled={!dirty}>Save changes</Button>
              {form.id && <Button variant="outline" icon="eye" to={`/product/${form.id}`} target="_blank">Preview</Button>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
