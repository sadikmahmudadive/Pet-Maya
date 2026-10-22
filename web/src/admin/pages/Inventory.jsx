import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '../../lib/router.jsx';
import { useAdmin, useAdminWrite, downloadCsv, ADMIN_CONFIG } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Tabs, Ph, Toggle, Field, Empty } from '../../ui/index.jsx';
import { money, cx, productPath } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';
import ProductPhotos from '../ProductPhotos.jsx';
import CategoryPicker from '../CategoryPicker.jsx';
import { makeResolver, flatten, buildTree, productFields } from '../../lib/categories.js';
import { CATEGORIES, UNITS, buildProductData, formFromProduct, validateProduct, cleanPhotoUrl, MAX_PHOTOS } from '../productForm.js';

const statusOf = (p) => {
  if (p.stockCount <= 0) return ['Out of stock', 'red', 'x'];
  if (p.expiresInDays != null && p.expiresInDays <= ADMIN_CONFIG.expiringDays) return ['Expiring', 'red', 'clock'];
  if (p.stockCount <= p.reorderPoint) return ['Low stock', 'yellow', 'flask'];
  return ['Healthy', 'teal', 'check'];
};

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
  const { products, categories } = useAdmin();
  const write = useAdminWrite();
  const { toast } = useStore();
  const { query } = useRouter();
  const [tab, setTab] = useState(query.get('tab') || 'all');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [brand, setBrand] = useState('');
  const [storageF, setStorageF] = useState('');
  const [editId, setEditId] = useState(query.get('edit') || null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(0);
  const csvRef = useRef(null);

  const isLow = (p) => p.stockCount > 0 && p.stockCount <= p.reorderPoint;
  const isExp = (p) => p.expiresInDays != null && p.expiresInDays <= ADMIN_CONFIG.expiringDays;

  const tree = useMemo(() => (categories.length ? makeResolver(categories) : null), [categories]);
  const filtered = useMemo(() => products.filter((p) => {
    if (q && !`${p.name} ${p.sku} ${p.brand} ${p.barcode}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && !(tree ? tree.inNode(p, cat) : p.category === cat)) return false;
    if (brand && p.brand !== brand) return false;
    if (storageF === 'cold' && !p.coldChain) return false;
    if (storageF === 'ambient' && p.coldChain) return false;
    return true;
  }), [products, q, cat, brand, storageF, tree]);
  const TABS = [
    ['all', 'All SKUs', () => true], ['low', 'Low stock', isLow], ['cold', 'Cold-chain', (p) => p.coldChain], ['exp', `Expiring ${ADMIN_CONFIG.expiringDays}d`, isExp], ['out', 'Out of stock', (p) => p.stockCount <= 0],
  ];
  const list = filtered.filter(TABS.find((t) => t[0] === tab)?.[2] || (() => true));

  const selected = products.find((p) => p.id === editId) || (editId === null ? list[0] : null);
  useEffect(() => {
    if (selected) { setForm(formFromProduct(selected, categories)); setDirty(false); }
  }, [editId, selected?.id]); // eslint-disable-line

  const stockValue = products.reduce((a, p) => a + p.price * Math.max(0, p.stockCount), 0);
  const low = products.filter((p) => p.stockCount <= p.reorderPoint);
  const reorder = low.map((p) => ({ p, qty: Math.max(p.reorderPoint, p.stockTarget - p.stockCount) })).sort((a, b) => a.p.stockCount - b.p.stockCount);
  const cats = [...new Set([...CATEGORIES, ...products.map((p) => p.category)])].filter(Boolean).sort();
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  const catOptions = useMemo(() => flatten(buildTree(categories).roots), [categories]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const addVariantRow = () => {
    set('variantOptions', [...(form.variantOptions || []), { label: '', sku: '', price: '', compareAt: '', cost: '', stockCount: '' }]);
  };
  const updateVariantRow = (idx, field, val) => {
    const next = (form.variantOptions || []).map((vo, i) => (i === idx ? { ...vo, [field]: val } : vo));
    set('variantOptions', next);
  };
  const removeVariantRow = (idx) => {
    set('variantOptions', (form.variantOptions || []).filter((_, i) => i !== idx));
  };

  const onPhotos = (urls, isBusy, failed = 0) => {
    setPhotosBusy(isBusy);
    setPhotoFailed(failed);
    setForm((f) => {
      if (!f || (f.photos.length === urls.length && f.photos.every((u, i) => u === urls[i]))) return f;
      setDirty(true);
      return { ...f, photos: urls };
    });
  };

  const save = async () => {
    const { errors } = validateProduct(form, products, { editingId: form.id, uploading: photosBusy, categories });
    if (errors.length) { toast(errors[0].message, { tone: 'error' }); return; }
    if (await write('products', form.id, buildProductData(form, { categories }), 'Product saved')) setDirty(false);
  };
  const exportCatalogCsv = () => {
    const header = [
      'id', 'name', 'sku', 'barcode', 'brand', 'supplier', 'category', 'pet', 'unit',
      'price', 'compareAt', 'cost', 'stockCount', 'reorderPoint', 'stockTarget',
      'isRx', 'coldChain', 'showOnStorefront', 'autoRefill', 'variants', 'shortDescription', 'image', 'images',
    ];
    const rows = list.map((p) => {
      const varStr = Array.isArray(p.variantOptions) && p.variantOptions.length
        ? p.variantOptions.map((vo) => `${vo.label}:${vo.price ?? p.price}:${vo.stockCount ?? p.stockCount}`).join('|')
        : (p.variants || []).join('|');
      return [
        p.id, p.name, p.sku || '', p.barcode || '', p.brand || '', p.supplier || p.brand || '',
        (p.categorySlugs || []).at(-1) || p.category || 'medicine', p.pet || 'both', p.unit || 'pc',
        p.price || 0, p.compareAt || '', p.cost || 0, p.stockCount || 0, p.reorderPoint || 20, p.stockTarget || 100,
        p.isRx ? 'true' : 'false', p.coldChain ? 'true' : 'false',
        p.showOnStorefront !== false ? 'true' : 'false', p.autoRefill ? 'true' : 'false',
        varStr, p.shortDescription || '', p.image || '', (p.images || []).join('|'),
      ];
    });
    downloadCsv(`pet-maya-products-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    toast(`Exported ${rows.length} products to CSV`);
  };

  const importCsv = async (file) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (!rows.length) { toast('No rows found. Columns: name, sku, barcode, brand, supplier, category, pet, price, compareAt, cost, stockCount, reorderPoint, isRx, coldChain, variants', { tone: 'error', duration: 7000 }); return; }
    let n = 0;
    const resolver = categories.length ? makeResolver(categories) : null;
    for (const r of rows) {
      if (!r.name) continue;
      const rawVars = String(r.variants || '').trim();
      const parsedVariantOptions = rawVars
        ? rawVars.split('|').map((chunk) => {
          const [lbl, pr, st] = chunk.split(':').map((s) => s.trim());
          return lbl ? {
            label: lbl,
            sku: '',
            price: pr !== undefined && pr !== '' ? Number(pr) : null,
            stockCount: st !== undefined && st !== '' ? Number(st) : null,
          } : null;
        }).filter(Boolean)
        : [];
      const stockNum = Number(r.stockCount ?? r.stock) || 0;
      const ok = await write('products', r.id || slug(r.sku || r.name), {
        name: r.name,
        sku: r.sku || '',
        brand: r.brand || 'Pet Maya',
        // A category name that matches the tree (any level) is placed there; anything else keeps the plain label.
        ...((node) => (node ? productFields(node.id, categories) : { category: (r.category || 'supplies').toLowerCase() }))(resolver?.nodeBySlug((r.category || '').trim().toLowerCase())),
        pet: (r.pet || 'both').toLowerCase(),
        unit: r.unit || 'pc',
        price: Number(r.price) || 0,
        ...(r.compareAt ? { compareAt: Number(r.compareAt) || null } : {}),
        ...(r.cost ? { cost: Number(r.cost) || 0 } : {}),
        ...(r.barcode ? { barcode: r.barcode } : {}),
        ...(r.supplier ? { supplier: r.supplier } : {}),
        ...(r.shortDescription ? { shortDescription: r.shortDescription } : {}),
        ...(() => {
          const cover = cleanPhotoUrl(r.image) || (r.image ? r.image.trim() : '');
          const more = String(r.images || '').split('|').map(cleanPhotoUrl).filter(Boolean).filter((u) => u !== cover);
          const all = [cover, ...more].filter(Boolean).slice(0, MAX_PHOTOS);
          return all.length ? { image: all[0], imageUrl: all[0], images: all.slice(1), imageGallery: all } : {};
        })(),
        ...(parsedVariantOptions.length ? {
          variants: parsedVariantOptions.map((v) => v.label),
          variantOptions: parsedVariantOptions,
        } : {}),
        stockCount: stockNum,
        reorderPoint: Number(r.reorderPoint) || 20,
        stockTarget: Number(r.stockTarget) || 100,
        isRx: /^(1|true|yes)$/i.test(r.isRx || ''),
        coldChain: /^(1|true|yes)$/i.test(r.coldChain || ''),
        showOnStorefront: r.showOnStorefront !== undefined && r.showOnStorefront !== '' ? /^(1|true|yes)$/i.test(r.showOnStorefront) : true,
        autoRefill: /^(1|true|yes)$/i.test(r.autoRefill || ''),
        inStock: stockNum > 0,
      });
      if (ok) n++;
    }
    toast(`Imported ${n} products`);
  };

  return (
    <>
      <PageHead eyebrow="Catalogue & stock" title="Inventory">
        <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = ''; }} />
        <Button variant="outline" icon="upload" onClick={() => csvRef.current?.click()}>Import CSV</Button>
        <Button variant="outline" icon="download" onClick={exportCatalogCsv}>Export CSV</Button>
        <Button variant="outline" icon="layers" to="/admin/stock">Stock control</Button>
        <Button variant="dark" icon="plus" to="/admin/products/new">Add product</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Active SKUs" value={products.length.toLocaleString('en-US')} icon="flask" note={`${products.filter((p) => p.showOnStorefront).length} on storefront`} />
        <Stat label="Stock value" value={money(stockValue, { compact: true })} icon="trend" note="at retail price" />
        <Stat label="Low stock" value={low.length} icon="bell" delta={low.filter((p) => p.coldChain).length ? `${low.filter((p) => p.coldChain).length} cold` : null} deltaTone="red" note="at or below reorder point" />
        <Stat label={`Expiring ${ADMIN_CONFIG.expiringDays} d`} value={products.filter(isExp).length} icon="clock" note="needs action" />
      </div>

      <div className="filter-row" style={{ marginTop: 16 }}>
        <div className="searchbar"><Icon name="filter" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, SKU or brand" aria-label="Filter products" /></div>
        <select className="filter-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">Category</option>{tree ? catOptions.map((n) => <option key={n.id} value={n.id}>{'  '.repeat(n.depth)}{n.name}</option>) : cats.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="filter-select" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Supplier"><option value="">Supplier</option>{brands.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="filter-select" value={storageF} onChange={(e) => setStorageF(e.target.value)} aria-label="Storage"><option value="">Storage</option><option value="cold">Cold-chain</option><option value="ambient">Ambient</option></select>
      </div>

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
                        <tr key={p.id} className={cx('clickable', (form?.id === p.id) && 'selected')} onClick={() => { setEditId(p.id); setTimeout(() => document.getElementById('inv-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }}>
                          <td><div className="row gap-10"><Ph src={p.image} label=" " style={{ width: 38, height: 38, minHeight: 0, borderRadius: 10, flex: 'none' }} /><div><div className="cell-title">{p.name}</div><div className="cell-sub">{p.brand}{p.variants?.length ? ` · ${p.variants.length} variants` : ''}</div></div></div></td>
                          <td className="mono muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{p.sku}</td>
                          <td>
                            <div className="row between" style={{ fontSize: 13 }}><b>{p.stockCount}</b><span className="subtle">/ {p.stockTarget}</span></div>
                            <div className={cx('meter', tone === 'red' ? 'red' : tone === 'yellow' ? 'amber' : '')} style={{ marginTop: 6, height: 5 }}><span style={{ width: `${Math.max(2, ratio * 100)}%` }} /></div>
                          </td>
                          <td>{money(p.price)}{p.cost > 0 && <div className="cell-sub">{Math.round(((p.price - p.cost) / (p.price || 1)) * 100)}% margin</div>}</td>
                          <td><Pill tone={tone} icon={icon} sm>{label}</Pill></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {form && (
          <div className="card" id="inv-editor" style={{ scrollMarginTop: 84 }}>
            <div className="card-head"><div><h2 className="h-card">Edit product</h2><div className="sub ellipsis" style={{ maxWidth: 520 }}>{form.name || 'Untitled'}</div></div>{dirty && <Pill sm>Unsaved</Pill>}</div>
            <div style={{ marginTop: 12 }}><ProductPhotos key={form.id} value={form.photos} onChange={onPhotos} toast={toast} />{photoFailed > 0 && <span className="field-err" role="alert">{photoFailed} photo{photoFailed > 1 ? 's' : ''} failed to upload and will not be saved.</span>}</div>
            <div className="fields" style={{ marginTop: 16 }}>
              <Field className="full" label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Field label="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
              <Field label="Sale Price (BDT)" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
              <Field label="Regular Price (BDT)" type="number" min="0" value={form.compareAt || ''} onChange={(e) => set('compareAt', e.target.value)} />
              <Field label="Cost price (BDT)" hint={Number(form.cost) > 0 && Number(form.price) > 0 ? `${Math.round(((form.price - form.cost) / form.price) * 100)}% margin` : 'for profit reports'} type="number" min="0" step="0.01" value={form.cost || ''} onChange={(e) => set('cost', e.target.value)} />
              <Field label="Barcode" hint="scan into the field" value={form.barcode || ''} onChange={(e) => set('barcode', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
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
              <Field label="Supplier" value={form.supplier || ''} onChange={(e) => set('supplier', e.target.value)} placeholder={form.brand} />
              <Field label="Unit">
                <select className="select" value={form.unit || 'pc'} onChange={(e) => set('unit', e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
              </Field>
              <Field className={categories.length ? 'full' : undefined} label="Category">
                {categories.length ? (
                  <CategoryPicker value={form.categoryId} categories={categories} legacyLabel={form.category} onChange={(id) => set('categoryId', id)} />
                ) : (
                  <>
                    <input className="input" list="cats" value={form.category} onChange={(e) => set('category', e.target.value.toLowerCase())} />
                    <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
                  </>
                )}
              </Field>
              <Field label="Pet type">
                <select className="select" value={form.pet || 'both'} onChange={(e) => set('pet', e.target.value)}>
                  <option value="both">Dogs & Cats</option>
                  <option value="dog">Dogs</option>
                  <option value="cat">Cats</option>
                </select>
              </Field>
              <Field className="full" label="Short summary" value={form.shortDescription || ''} onChange={(e) => set('shortDescription', e.target.value)} placeholder="1-line summary shown on cards" />
              <Field className="full" label="Full description">
                <textarea className="textarea" rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Detailed product description, dosing & benefits…" />
              </Field>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <b style={{ fontSize: 13 }}>Variants (Size / Weight / Pack)</b>
                <button type="button" className="link" style={{ fontSize: 12 }} onClick={addVariantRow}>+ Add variant</button>
              </div>
              {(form.variantOptions || []).length === 0 ? (
                <div className="sub" style={{ fontSize: 12 }}>Single variant product. Click "+ Add variant" for size/weight options with independent prices & stock.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div className="stack gap-6" style={{ minWidth: 640 }}>
                    <div className="variant-grid no-sku subtle" style={{ fontSize: 12 }} aria-hidden="true">
                      <span>Label</span><span>Sale price</span><span>Regular price</span><span>Cost price</span><span>Stock</span><span />
                    </div>
                    {(form.variantOptions || []).map((vo, idx) => (
                      <div key={idx} className="variant-grid no-sku">
                        <input className="input" style={{ height: 34, fontSize: 13 }} placeholder="e.g. Small" aria-label={`Variant ${idx + 1} label`} value={vo.label || ''} onChange={(e) => updateVariantRow(idx, 'label', e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" style={{ height: 34, fontSize: 13 }} placeholder="৳" aria-label={`Variant ${idx + 1} sale price`} value={vo.price ?? ''} onChange={(e) => updateVariantRow(idx, 'price', e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" style={{ height: 34, fontSize: 13 }} placeholder="৳" aria-label={`Variant ${idx + 1} regular price`} value={vo.compareAt ?? ''} onChange={(e) => updateVariantRow(idx, 'compareAt', e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" style={{ height: 34, fontSize: 13 }} placeholder="৳" aria-label={`Variant ${idx + 1} cost price`} value={vo.cost ?? ''} onChange={(e) => updateVariantRow(idx, 'cost', e.target.value)} />
                        <input className="input" type="number" min="0" step="1" style={{ height: 34, fontSize: 13 }} placeholder="0" aria-label={`Variant ${idx + 1} stock`} value={vo.stockCount ?? ''} onChange={(e) => updateVariantRow(idx, 'stockCount', e.target.value)} />
                        <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => removeVariantRow(idx)} aria-label="Remove variant"><Icon name="x" size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              {[['isRx', 'Requires prescription'], ['coldChain', 'Cold-chain 2–8°C'], ['showOnStorefront', 'Show on storefront'], ['autoRefill', 'Allow auto-refill']].map(([k, l]) => (
                <div key={k} className="toggle-row"><span>{l}</span><Toggle checked={!!form[k]} onChange={(v) => set(k, v)} label={l} /></div>
              ))}
            </div>
            <div className="row gap-8" style={{ marginTop: 14 }}>
              <Button variant="dark" icon="check" className="grow" onClick={save} disabled={!dirty || photosBusy}>{photosBusy ? 'Uploading photos…' : 'Save changes'}</Button>
              {form.id && <Button variant="outline" icon="eye" to={productPath(form)} target="_blank">Preview</Button>}
            </div>
          </div>
        )}

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
                <Button variant="dark" block icon="truck" style={{ marginTop: 14 }} to="/admin/purchasing">Create purchase order</Button>
                <Button variant="outline" block icon="download" style={{ marginTop: 8 }} onClick={() => downloadCsv(`purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`, [['Supplier', 'SKU', 'Product', 'Order qty', 'Current stock'], ...reorder.map(({ p, qty }) => [p.supplier || p.brand, p.sku, p.name, qty, p.stockCount])])}>
                  Download reorder list (CSV)
                </Button>
              </>
            )}
          </div>
      </div>
    </>
  );
}
