import { useMemo, useState, useEffect } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { Icon, Pill, Empty } from '../../ui/index.jsx';
import ProductCard from '../ProductCard.jsx';
import { money, cx } from '../../lib/format.js';
import { Reveal } from '../../lib/motion.jsx';

const TITLES = {
  dogs: ['Dogs', 'Dog medicine, food & gear'],
  cats: ['Cats', 'Cat medicine, food & gear'],
  medicine: ['Medicine', 'Medicine & preventives'],
  prescription: ['Prescription', 'Prescription medicine'],
  food: ['Food & diets', 'Food & veterinary diets'],
  supplements: ['Supplements', 'Supplements'],
  grooming: ['Grooming & dental', 'Grooming & dental care'],
  'smart-gear': ['Smart gear', 'Smart gear & GPS collars'],
  skin: ['Skin & allergy', 'Skin, coat & allergy'],
  joint: ['Joints', 'Joints & mobility'],
  antiparasitics: ['Antiparasitics', 'Fleas, ticks & worms'],
  calming: ['Calming', 'Calm & anxiety'],
  preventives: ['Preventives', 'Preventives'],
  vaccines: ['Vaccines', 'Vaccines'],
};

const MEDICINE_CATS = ['preventives', 'antiparasitics', 'skin', 'joint', 'calming', 'vaccines', 'medicine'];

function inCategory(p, cat) {
  if (!cat) return true;
  if (cat === 'dogs') return p.pet === 'dog' || p.pet === 'both';
  if (cat === 'cats') return p.pet === 'cat' || p.pet === 'both';
  if (cat === 'prescription') return p.isRx;
  if (cat === 'medicine') return p.isRx || MEDICINE_CATS.includes(p.category);
  return p.category === cat;
}

const SORTS = {
  best: ['Best match', (a, b) => b.ratingCount - a.ratingCount],
  low: ['Price: low to high', (a, b) => a.price - b.price],
  high: ['Price: high to low', (a, b) => b.price - a.price],
  rating: ['Top rated', (a, b) => b.rating - a.rating],
};

function Check({ checked, onChange, label, count }) {
  return (
    <label className="fopt">
      <input type="checkbox" className="check" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
      {count != null && <span className="count-r">{count}</span>}
    </label>
  );
}

export default function Shop({ params }) {
  const { query } = useRouter();
  const { products, wishlist } = useStore();
  const cat = params.category || '';
  const q = (query.get('q') || '').toLowerCase();
  const savedOnly = query.get('saved') === '1';
  const subOnly = query.get('subscribe') === '1';
  const dealsOnly = query.get('deals') === '1';

  const [types, setTypes] = useState([]);
  const [rx, setRx] = useState(null);       // null | 'rx' | 'otc'
  const [brands, setBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [cold, setCold] = useState(false);
  const [sub, setSub] = useState(subOnly);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState('best');
  const [shown, setShown] = useState(9);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { setTypes([]); setBrands([]); setShown(9); }, [cat]);
  useEffect(() => setSub(subOnly), [subOnly]);

  const base = useMemo(() => products.items.filter((p) => p.showOnStorefront !== false && inCategory(p, cat)), [products.items, cat]);
  const priceCeil = useMemo(() => Math.max(500, ...base.map((p) => p.price)), [base]);
  const typeOpts = useMemo(() => countBy(base, (p) => p.category), [base]);
  const brandOpts = useMemo(() => countBy(base, (p) => p.brand), [base]);

  const list = useMemo(() => {
    let l = base;
    if (q) l = l.filter((p) => `${p.name} ${p.brand} ${p.category} ${p.shortDescription}`.toLowerCase().includes(q));
    if (savedOnly) l = l.filter((p) => wishlist.includes(p.id));
    if (dealsOnly) l = l.filter((p) => p.compareAt > p.price);
    if (types.length) l = l.filter((p) => types.includes(p.category));
    if (rx === 'rx') l = l.filter((p) => p.isRx);
    if (rx === 'otc') l = l.filter((p) => !p.isRx);
    if (brands.length) l = l.filter((p) => brands.includes(p.brand));
    if (minRating) l = l.filter((p) => p.rating >= minRating);
    if (cold) l = l.filter((p) => p.coldChain);
    if (sub) l = l.filter((p) => p.subscribe);
    if (maxPrice != null) l = l.filter((p) => p.price <= maxPrice);
    return [...l].sort(SORTS[sort][1]);
  }, [base, q, savedOnly, dealsOnly, types, rx, brands, minRating, cold, sub, maxPrice, sort, wishlist]);

  const [crumb, title] = TITLES[cat] || ['All products', 'Care shop'];
  const heading = q ? `Results for “${query.get('q')}”` : savedOnly ? 'Saved items' : dealsOnly ? 'Deals' : title;
  const active = [
    ...types.map((t) => ({ k: `t-${t}`, l: label(t), clear: () => setTypes(types.filter((x) => x !== t)) })),
    rx && { k: 'rx', l: rx === 'rx' ? 'Rx — vet approval' : 'No prescription', clear: () => setRx(null) },
    ...brands.map((b) => ({ k: `b-${b}`, l: b, clear: () => setBrands(brands.filter((x) => x !== b)) })),
    minRating && { k: 'r', l: `${minRating}★ & up`, clear: () => setMinRating(0) },
    cold && { k: 'c', l: 'Cold-chain', clear: () => setCold(false) },
    sub && { k: 's', l: 'Subscribe & save', clear: () => setSub(false) },
    maxPrice != null && { k: 'p', l: `Up to ${money(maxPrice)}`, clear: () => setMaxPrice(null) },
  ].filter(Boolean);
  const clearAll = () => { setTypes([]); setRx(null); setBrands([]); setMinRating(0); setCold(false); setSub(false); setMaxPrice(null); };

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span>/</span><Link to="/shop">Care Shop</Link>
        {cat && <><span>/</span><span style={{ color: 'var(--ink)' }}>{crumb}</span></>}
      </nav>

      <Reveal className="listing-hero">
        <div>
          <h1 className="display-1" style={{ maxWidth: '14ch' }}>{heading}</h1>
          <p className="muted" style={{ marginTop: 14, maxWidth: '58ch' }}>
            Genuine, vet-checked products. Prescription items are reviewed by a licensed vet before dispatch, and cold items travel at 2°C – 8°C.
          </p>
        </div>
        <div className="row gap-8 wrap">
          <Pill className="outline" icon="cold" style={{ height: 34, padding: '0 14px', background: 'var(--surface)' }}>Delivered at 2°C – 8°C</Pill>
          <Pill className="outline" icon="shield" style={{ height: 34, padding: '0 14px', background: 'var(--surface)' }}>100% genuine</Pill>
        </div>
      </Reveal>

      <div className="listing">
        <aside className={cx('filters', filtersOpen && 'open')} aria-label="Filters">
          <div className="row between" style={{ paddingBottom: 6 }}>
            <b style={{ fontSize: 16 }}>Filters</b>
            <button className="link" style={{ fontSize: 13 }} onClick={clearAll}>Clear all</button>
          </div>
          {Object.keys(typeOpts).length > 1 && (
            <section>
              <h4>Category</h4>
              {Object.entries(typeOpts).map(([t, c]) => (
                <Check key={t} label={label(t)} count={c} checked={types.includes(t)} onChange={(on) => setTypes(on ? [...types, t] : types.filter((x) => x !== t))} />
              ))}
            </section>
          )}
          <section>
            <h4>Prescription</h4>
            <Check label="No prescription needed" count={base.filter((p) => !p.isRx).length} checked={rx === 'otc'} onChange={(on) => setRx(on ? 'otc' : null)} />
            <Check label="Rx — vet approval" count={base.filter((p) => p.isRx).length} checked={rx === 'rx'} onChange={(on) => setRx(on ? 'rx' : null)} />
          </section>
          <section>
            <h4>Price (৳)</h4>
            <input type="range" className="range" min={0} max={priceCeil} step={50} value={maxPrice ?? priceCeil} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Maximum price" />
            <div className="row between sub"><span>৳0</span><span>{money(maxPrice ?? priceCeil)}</span></div>
          </section>
          <section>
            <h4>Brand</h4>
            {Object.entries(brandOpts).map(([b, c]) => (
              <Check key={b} label={b} count={c} checked={brands.includes(b)} onChange={(on) => setBrands(on ? [...brands, b] : brands.filter((x) => x !== b))} />
            ))}
          </section>
          <section>
            <h4>Rating</h4>
            <Check label="4★ & up" checked={minRating === 4} onChange={(on) => setMinRating(on ? 4 : 0)} />
            <Check label="4.5★ & up" checked={minRating === 4.5} onChange={(on) => setMinRating(on ? 4.5 : 0)} />
          </section>
          <section style={{ borderBottom: 0 }}>
            <h4>Delivery</h4>
            <Check label="Cold-chain items" checked={cold} onChange={setCold} />
            <Check label="Subscribe & save eligible" checked={sub} onChange={setSub} />
          </section>
        </aside>

        <div>
          <div className="row between gap-12 wrap" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14 }}><b>{list.length} products</b> <span className="muted">{cat ? `· ${crumb}` : ''}</span></div>
            <div className="row gap-8">
              <button className="btn btn-outline btn-sm show-sm" onClick={() => setFiltersOpen((o) => !o)}><Icon name="filter" size={14} /> Filters</button>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ height: 38, width: 'auto', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line-2)', fontSize: 13 }} aria-label="Sort">
                {Object.entries(SORTS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          {active.length > 0 && (
            <div className="row gap-6 wrap" style={{ marginBottom: 16 }}>
              {active.map((a) => (
                <button key={a.k} className="pill" onClick={a.clear} style={{ height: 30, padding: '0 12px' }}>{a.l} <Icon name="x" size={12} /></button>
              ))}
            </div>
          )}

          {products.loading && !products.items.length ? (
            <div className="product-grid cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 360 }} />)}</div>
          ) : list.length === 0 ? (
            <div className="card"><Empty icon="search" title="No products match">Try removing a filter or searching for something else.</Empty></div>
          ) : (
            <>
              <Reveal className="product-grid cols-3" stagger>
                {list.slice(0, shown).map((p) => <ProductCard key={p.id} p={p} />)}
              </Reveal>
              <div className="stack" style={{ alignItems: 'center', gap: 12, marginTop: 32 }}>
                <span className="sub">Showing {Math.min(shown, list.length)} of {list.length}</span>
                <div className="meter" style={{ width: 200 }}><span style={{ width: `${Math.min(100, (shown / list.length) * 100)}%` }} /></div>
                {shown < list.length && <button className="btn btn-outline" onClick={() => setShown((s) => s + 9)}>Load more products</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function countBy(list, fn) {
  const out = {};
  list.forEach((p) => { const k = fn(p); if (k) out[k] = (out[k] || 0) + 1; });
  return out;
}

function label(slug) {
  return (TITLES[slug]?.[0]) || String(slug).replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
