import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '../../lib/router.jsx';
import { useAdmin, useAdminWrite } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Toggle, Field, Ph } from '../../ui/index.jsx';
import { money } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';
import ProductPhotos from '../ProductPhotos.jsx';
import CategoryPicker from '../CategoryPicker.jsx';
import {
  BLANK_PRODUCT, CATEGORIES, UNITS, MAX_PHOTOS, buildProductData, newProductId, suggestSku, validateProduct,
} from '../productForm.js';

const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Settings that usually stay the same from one product to the next when adding several in a row. */
const carryOver = (f) => ({
  ...BLANK_PRODUCT, photos: [], variantOptions: [],
  brand: f.brand, supplier: f.supplier, category: f.category, categoryId: f.categoryId, pet: f.pet, unit: f.unit,
  isRx: f.isRx, coldChain: f.coldChain, showOnStorefront: f.showOnStorefront, autoRefill: f.autoRefill,
  reorderPoint: f.reorderPoint, stockTarget: f.stockTarget,
});

export default function AddProduct() {
  const { products, categories } = useAdmin();
  const write = useAdminWrite();
  const { toast } = useStore();
  const { navigate } = useRouter();

  const [form, setForm] = useState(() => ({ ...BLANK_PRODUCT, photos: [], variantOptions: [] }));
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showProblems, setShowProblems] = useState(false);
  const [formKey, setFormKey] = useState(0); // new key = fresh photo manager (after "Save & add another")
  const [added, setAdded] = useState([]);    // products added during this visit

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
  const text = (k) => ({ value: form[k] ?? '', onChange: (e) => set(k, e.target.value) });

  const onPhotos = (urls, isBusy, failed = 0) => {
    setUploading(isBusy);
    setPhotoFailed(failed);
    setForm((f) => {
      if (sameList(f.photos, urls)) return f;
      setDirty(true);
      return { ...f, photos: urls };
    });
  };

  const { errors, warnings } = useMemo(() => validateProduct(form, products, { uploading, categories }), [form, products, uploading, categories]);
  const errAt = (field) => (showProblems ? errors.find((e) => e.field === field)?.message : '');
  const warnAt = (field) => warnings.find((w) => w.field === field)?.message;
  const hint = (field) => {
    const e = errAt(field); const w = warnAt(field);
    return e ? <span className="field-err" role="alert">{e}</span> : (w ? <span className="field-warn">{w}</span> : null);
  };

  useEffect(() => { // closing the tab with unsaved work
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const cats = useMemo(() => [...new Set([...CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])].sort(), [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(), [products]);
  const suppliers = useMemo(() => [...new Set(products.map((p) => p.supplier).filter(Boolean))].sort(), [products]);

  const price = Number(form.price) || 0;
  const cost = Number(form.cost) || 0;
  const regular = Number(form.compareAt) || 0;
  const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null;
  const discount = regular > price && price > 0 ? Math.round(((regular - price) / regular) * 100) : 0;

  const checklist = [
    ['Name', !!form.name.trim()],
    ['Sale price', price > 0],
    ['At least one photo', form.photos.length > 0],
    ['Category', categories.length ? !!form.categoryId : !!String(form.category).trim()],
    ['SKU', !!String(form.sku).trim()],
    ['In stock', Number(form.stockCount) > 0],
  ];

  const addVariant = () => set('variantOptions', [...form.variantOptions, { label: '', sku: '', price: '', compareAt: '', cost: '', stockCount: '' }]);
  const setVariant = (i, k, v) => set('variantOptions', form.variantOptions.map((vo, j) => (j === i ? { ...vo, [k]: v } : vo)));
  const dropVariant = (i) => set('variantOptions', form.variantOptions.filter((_, j) => j !== i));

  const save = async (another) => {
    setShowProblems(true);
    if (errors.length) {
      toast(errors[0].message, { tone: 'error' });
      // After the re-render that marks the fields invalid, jump to the first one.
      setTimeout(() => {
        const el = document.querySelector('[aria-invalid="true"]');
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el?.focus?.({ preventScroll: true });
      }, 0);
      return;
    }
    setBusy(true);
    const id = newProductId(products.map((p) => p.id));
    const ok = await write('products', id, buildProductData(form, { isNew: true, categories }));
    setBusy(false);
    if (!ok) return;
    setDirty(false);
    setAdded((list) => [{ id, name: form.name.trim() }, ...list]);
    if (another) {
      toast(`“${form.name.trim()}” added. Ready for the next one.`);
      setForm(carryOver(form));
      setFormKey((k) => k + 1);
      setShowProblems(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast(`“${form.name.trim()}” added`);
      navigate(`/admin/inventory?edit=${encodeURIComponent(id)}`);
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm('Discard this product? Photos already uploaded stay in storage but the product will not be created.')) return;
    setDirty(false);
    navigate('/admin/inventory');
  };

  const bad = (f) => (errAt(f) ? 'true' : undefined);

  return (
    <>
      <PageHead eyebrow="Catalogue & stock" title="Add product">
        {dirty && <Pill sm>Unsaved changes</Pill>}
        <Button variant="outline" icon="arrowLeft" onClick={cancel}>Back to inventory</Button>
      </PageHead>

      {added.length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }} role="status">
          <div className="row gap-8 wrap" style={{ fontSize: 14 }}>
            <Icon name="check" size={16} /> Added this session:
            {added.slice(0, 5).map((p) => <Button key={p.id} variant="outline" size="sm" to={`/admin/inventory?edit=${encodeURIComponent(p.id)}`}>{p.name}</Button>)}
            {added.length > 5 && <span className="subtle">+{added.length - 5} more</span>}
          </div>
        </div>
      )}

      <div className="adm-grid-2">
        <div className="stack gap-16">
          <section className="card">
            <h2 className="h-card">Basics</h2>
            <div className="fields" style={{ marginTop: 12 }}>
              <Field className="full" label="Product name" hint="required">
                <input className="input" maxLength={150} placeholder="e.g. Royal Canin Gastro Low Fat 4 kg" aria-invalid={bad('name')} {...text('name')} />
                {hint('name')}
              </Field>
              <Field label="Brand">
                <input className="input" list="brands" placeholder="e.g. Royal Canin" {...text('brand')} />
                <datalist id="brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
              </Field>
              <Field label="Category" hint="required">
                {categories.length ? (
                  <CategoryPicker value={form.categoryId} categories={categories} invalid={!!errAt('category')} onChange={(id) => set('categoryId', id)} />
                ) : (
                  <>
                    <input className="input" list="cats" aria-invalid={bad('category')} value={form.category} onChange={(e) => set('category', e.target.value.toLowerCase())} />
                    <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
                  </>
                )}
                {hint('category')}
              </Field>
              <Field label="Pet type">
                <select className="select" value={form.pet} onChange={(e) => set('pet', e.target.value)}>
                  <option value="both">Dogs &amp; Cats</option><option value="dog">Dogs</option><option value="cat">Cats</option>
                </select>
              </Field>
              <Field label="Unit">
                <select className="select" value={form.unit} onChange={(e) => set('unit', e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
              </Field>
              <Field className="full" label="Short summary" hint={`${form.shortDescription.length}/160 · shown on product cards`}>
                <input className="input" maxLength={160} placeholder="One line that sells it" {...text('shortDescription')} />
              </Field>
              <Field className="full" label="Full description">
                <textarea className="textarea" rows={4} placeholder="Benefits, dosing, what is in the box…" {...text('description')} />
              </Field>
              <Field className="full" label="Ingredients / composition" hint="optional">
                <textarea className="textarea" rows={2} {...text('ingredients')} />
              </Field>
            </div>
          </section>

          <section className="card">
            <h2 className="h-card">Photos</h2>
            <div className="sub" style={{ marginBottom: 12 }}>Add up to {MAX_PHOTOS}. The first one is the cover shown in the shop, search and ads.</div>
            <ProductPhotos key={formKey} value={form.photos} onChange={onPhotos} toast={toast} />
            {hint('photos')}
            {photoFailed > 0 && <span className="field-err" role="alert">{photoFailed} photo{photoFailed > 1 ? 's' : ''} failed to upload and will not be saved. Retry or remove {photoFailed > 1 ? 'them' : 'it'}.</span>}
          </section>

          <section className="card">
            <h2 className="h-card">Pricing</h2>
            <div className="fields" style={{ marginTop: 12 }}>
              <Field label="Sale price (৳)" hint="required">
                <input className="input" type="number" min="0" step="0.01" inputMode="decimal" aria-invalid={bad('price')} {...text('price')} />
                {hint('price')}
              </Field>
              <Field label="Regular price (৳)" hint={discount ? `${discount}% off shows on the shop` : 'optional · shows a discount'}>
                <input className="input" type="number" min="0" step="0.01" inputMode="decimal" {...text('compareAt')} />
                {hint('compareAt')}
              </Field>
              <Field label="Cost price (৳)" hint={margin !== null ? `${margin}% margin` : 'for profit reports'}>
                <input className="input" type="number" min="0" step="0.01" inputMode="decimal" aria-invalid={bad('cost')} {...text('cost')} />
                {hint('cost')}
              </Field>
            </div>
          </section>

          <section className="card">
            <h2 className="h-card">Inventory &amp; identifiers</h2>
            <div className="fields" style={{ marginTop: 12 }}>
              <Field label="SKU">
                <div className="row gap-8">
                  <input className="input grow" aria-invalid={bad('sku')} {...text('sku')} />
                  <Button variant="outline" size="sm" onClick={() => set('sku', suggestSku(form, products.map((p) => p.sku)))}>Generate</Button>
                </div>
                {hint('sku')}
              </Field>
              <Field label="Barcode (EAN / UPC)" hint="scan into the field">
                <input className="input" inputMode="numeric" aria-invalid={bad('barcode')} {...text('barcode')} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
                {hint('barcode')}
              </Field>
              <Field label="Stock on hand">
                <input className="input" type="number" min="0" step="1" aria-invalid={bad('stockCount')} {...text('stockCount')} />
                {hint('stockCount')}
              </Field>
              <Field label="Reorder point">
                <input className="input" type="number" min="0" step="1" aria-invalid={bad('reorderPoint')} {...text('reorderPoint')} />
                {hint('reorderPoint')}
              </Field>
              <Field label="Target stock">
                <input className="input" type="number" min="0" step="1" aria-invalid={bad('stockTarget')} {...text('stockTarget')} />
                {hint('stockTarget')}
              </Field>
              <Field label="Shelf life (days)" hint="optional · flags expiring stock">
                <input className="input" type="number" min="0" step="1" aria-invalid={bad('expiresInDays')} {...text('expiresInDays')} />
                {hint('expiresInDays')}
              </Field>
              <Field className="full" label="Supplier" hint="defaults to the brand">
                <input className="input" list="suppliers" {...text('supplier')} />
                <datalist id="suppliers">{suppliers.map((s) => <option key={s} value={s} />)}</datalist>
              </Field>
            </div>
          </section>

          <section className="card">
            <div className="row between wrap gap-8">
              <div><h2 className="h-card">Variants</h2><div className="sub">Sizes, weights or packs with their own price and stock. Leave empty for a single product.</div></div>
              <Button variant="outline" size="sm" icon="plus" onClick={addVariant}>Add variant</Button>
            </div>
            {form.variantOptions.length > 0 && (
              <div style={{ marginTop: 12, overflowX: 'auto' }}>
                <div className="stack gap-8" style={{ minWidth: 760 }}>
                  <div className="variant-grid subtle" style={{ fontSize: 12 }} aria-hidden="true">
                    <span>Label</span><span>SKU</span><span>Sale price</span><span>Regular price</span><span>Cost price</span><span>Stock</span><span />
                  </div>
                  {form.variantOptions.map((vo, i) => (
                    <div key={i}>
                      <div className="variant-grid">
                        <input className="input" placeholder="e.g. 2 kg" aria-label={`Variant ${i + 1} label`} aria-invalid={bad(`variant-${i}`)} value={vo.label} onChange={(e) => setVariant(i, 'label', e.target.value)} />
                        <input className="input" placeholder="SKU" aria-label={`Variant ${i + 1} SKU`} value={vo.sku} onChange={(e) => setVariant(i, 'sku', e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" placeholder="৳" aria-label={`Variant ${i + 1} sale price`} value={vo.price} onChange={(e) => setVariant(i, 'price', e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" placeholder="৳" aria-label={`Variant ${i + 1} regular price`} value={vo.compareAt ?? ''} onChange={(e) => setVariant(i, 'compareAt', e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" placeholder="৳" aria-label={`Variant ${i + 1} cost price`} value={vo.cost ?? ''} onChange={(e) => setVariant(i, 'cost', e.target.value)} />
                        <input className="input" type="number" min="0" step="1" placeholder="0" aria-label={`Variant ${i + 1} stock`} value={vo.stockCount} onChange={(e) => setVariant(i, 'stockCount', e.target.value)} />
                        <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => dropVariant(i)} aria-label={`Remove variant ${i + 1}`}><Icon name="x" size={14} /></button>
                      </div>
                      {errAt(`variant-${i}`) && <span className="field-err" role="alert">{errAt(`variant-${i}`)}</span>}
                    </div>
                  ))}
                  <div className="sub" style={{ fontSize: 12 }}>Leave a price empty to use the product’s own. Cost price is only for your profit reports.</div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="stack gap-16" style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
          <section className="card">
            <h2 className="h-card">Shop preview</h2>
            <div className="row gap-12" style={{ marginTop: 12, alignItems: 'center' }}>
              <Ph src={form.photos[0]} label=" " style={{ width: 84, height: 84, minHeight: 0, borderRadius: 14, flex: 'none' }} />
              <div style={{ minWidth: 0 }}>
                <div className="subtle" style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>{form.brand || 'Brand'}</div>
                <div className="ellipsis" style={{ fontWeight: 600 }}>{form.name || 'Product name'}</div>
                <div className="row gap-8"><b>{money(price)}</b>{discount > 0 && <span className="subtle" style={{ textDecoration: 'line-through' }}>{money(regular)}</span>}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="h-card">Visibility &amp; handling</h2>
            <div style={{ marginTop: 8 }}>
              {[['showOnStorefront', 'Show on storefront'], ['isRx', 'Requires prescription'], ['coldChain', 'Cold-chain 2–8°C'], ['autoRefill', 'Allow auto-refill']].map(([k, l]) => (
                <div key={k} className="toggle-row"><span>{l}</span><Toggle checked={!!form[k]} onChange={(v) => set(k, v)} label={l} /></div>
              ))}
            </div>
            {form.isRx && <div className="sub" style={{ marginTop: 8, fontSize: 12 }}>Prescription products need a vet check at checkout and are left out of the Google and Meta product feeds.</div>}
          </section>

          <section className="card">
            <h2 className="h-card">Ready to publish?</h2>
            <ul className="stack gap-6" style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', fontSize: 14 }}>
              {checklist.map(([label, done]) => (
                <li key={label} className="row gap-8" style={{ opacity: done ? 1 : 0.65 }}>
                  <Icon name={done ? 'check' : 'minus'} size={15} /> {label}
                </li>
              ))}
            </ul>
            {showProblems && errors.length > 0 && (
              <div role="alert" style={{ marginTop: 12, fontSize: 13, color: 'var(--red, #c0392b)' }}>
                <b>Fix before saving:</b>
                <ul style={{ margin: '4px 0 0 18px' }}>{errors.map((e) => <li key={e.field + e.message}>{e.message}</li>)}</ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <b>Worth a look:</b>
                <ul style={{ margin: '4px 0 0 18px' }}>{warnings.map((w) => <li key={w.field + w.message}>{w.message}</li>)}</ul>
              </div>
            )}
            <div className="stack gap-8" style={{ marginTop: 14 }}>
              <Button variant="dark" icon="check" block disabled={busy || uploading} onClick={() => save(false)}>
                {uploading ? 'Uploading photos…' : busy ? 'Saving…' : 'Save product'}
              </Button>
              <Button variant="outline" icon="plus" block disabled={busy || uploading} onClick={() => save(true)}>Save &amp; add another</Button>
              <Button variant="ghost" block onClick={cancel}>Cancel</Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
