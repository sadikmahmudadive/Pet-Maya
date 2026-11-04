import { Fragment, useMemo, useState, useEffect } from 'react';
import { track } from '../../lib/analytics.js';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { Icon, Empty } from '../../ui/index.jsx';
import ProductCard from '../ProductCard.jsx';
import { money, cx } from '../../lib/format.js';
import { speciesKind, productFitsPet } from '../../lib/species.js';
import { PET_AISLES, aisleBySlug, fitsAisle } from '../../lib/pets.js';
import { Reveal } from '../../lib/motion.jsx';
import { makeResolver, pathOf } from '../../lib/categories.js';

const TITLES = {
  dogs: ['Dogs', 'Dog medicine, food & gear'],
  cats: ['Cats', 'Cat medicine, food & gear'],
  medicine: ['Medicine', 'Medicine & preventives'],
  prescription: ['Prescription', 'Prescription medicine'],
  food: ['Food & diets', 'Food & veterinary diets'],
  supplements: ['Supplements', 'Supplements & wellness'],
  grooming: ['Grooming & dental', 'Grooming & dental care'],
  toys: ['Toys & enrichment', 'Toys, chews & enrichment'],
  accessories: ['Accessories & travel', 'Harnesses, beds, carriers & travel'],
  travel: ['Travel', 'Carriers, crates & travel gear'],
  'smart-gear': ['Smart gear', 'Smart gear & GPS collars'],
  skin: ['Skin & allergy', 'Skin, coat & allergy'],
  joint: ['Joints', 'Joints & mobility'],
  antiparasitics: ['Antiparasitics', 'Fleas, ticks & worms'],
  calming: ['Calming', 'Calm & anxiety'],
  preventives: ['Preventives', 'Preventives'],
  vaccines: ['Vaccines', 'Vaccines'],
};

const MEDICINE_CATS = ['preventives', 'antiparasitics', 'skin', 'joint', 'calming', 'vaccines', 'medicine'];

// Slugs with their own rules keep working exactly as before; any other slug is looked up in the category tree.
const SPECIAL = new Set(['dogs', 'cats', 'birds', 'rabbits', 'small-pets', 'fish', 'prescription', 'medicine', 'accessories']);

function inCategory(p, cat, tree) {
  if (!cat) return true;
  const aisle = aisleBySlug(cat);
  if (aisle) return fitsAisle(p.pet, aisle);
  if (cat === 'prescription') return p.isRx;
  if (cat === 'medicine') return p.isRx || MEDICINE_CATS.includes(p.category);
  if (cat === 'accessories') return p.category === 'accessories' || p.category === 'travel' || p.category === 'supplies';
  const node = tree?.nodeBySlug(cat);
  if (node) return tree.inNode(p, node.id);
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
  const { products, categories, wishlist, activePet } = useStore();
  const cat = params.category || '';
  const q = (query.get('q') || '').toLowerCase();
  useEffect(() => { if (q.length >= 2) { const t = setTimeout(() => track('search', { search_term: q }), 800); return () => clearTimeout(t); } }, [q]);
  const savedOnly = query.get('saved') === '1';
  const subOnly = query.get('subscribe') === '1';
  const dealsOnly = query.get('deals') === '1';

  const [types, setTypes] = useState([]);
  const [rx, setRx] = useState(null);       // null | 'rx' | 'otc'
  const [brands, setBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [cold, setCold] = useState(false);
  const [sub, setSub] = useState(subOnly);
  const [petMatch, setPetMatch] = useState(false);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState('best');
  const [shown, setShown] = useState(9);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { setTypes([]); setBrands([]); setShown(9); }, [cat]);
  useEffect(() => setSub(subOnly), [subOnly]);

  const tree = useMemo(() => (categories?.items?.length ? makeResolver(categories.items) : null), [categories?.items]);
  const node = !SPECIAL.has(cat) ? tree?.nodeBySlug(cat) || null : null;
  const base = useMemo(() => products.items.filter((p) => p.showOnStorefront !== false && inCategory(p, cat, tree)), [products.items, cat, tree]);
  const priceCeil = useMemo(() => Math.max(500, ...base.map((p) => p.price)), [base]);
  // Category facet: the subcategories of the page you are on (or the main categories), else the plain category values.
  const typeOpts = useMemo(() => {
    if (!tree) return Object.entries(countBy(base, (p) => p.category)).map(([key, count]) => ({ key, label: label(key), count }));
    const parentId = node ? node.id : '';
    const parentOf = (c) => (c.parentId && tree.byId.has(c.parentId) ? c.parentId : '');
    return [...tree.byId.values()]
      .filter((c) => parentOf(c) === parentId && c.active !== false)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map((c) => ({ key: c.id, label: c.name, count: base.filter((p) => tree.inNode(p, c.id)).length }))
      .filter((o) => o.count > 0);
  }, [base, tree, node]);
  const brandOpts = useMemo(() => countBy(base, (p) => p.brand), [base]);
  const hasRx = useMemo(() => base.some((p) => p.isRx), [base]);

  const list = useMemo(() => {
    let l = base;
    if (q) l = l.filter((p) => `${p.name} ${p.brand} ${tree ? tree.label(p) || p.category : p.category} ${p.shortDescription}`.toLowerCase().includes(q));
    if (savedOnly) l = l.filter((p) => wishlist.includes(p.id));
    if (dealsOnly) l = l.filter((p) => p.compareAt > p.price);
    if (petMatch && activePet) {
      const kind = speciesKind(activePet);
      l = l.filter((p) => productFitsPet(p.pet, kind));
    }
    if (types.length) l = l.filter((p) => types.some((t) => (tree ? tree.inNode(p, t) : p.category === t)));
    if (rx === 'rx') l = l.filter((p) => p.isRx);
    if (rx === 'otc') l = l.filter((p) => !p.isRx);
    if (brands.length) l = l.filter((p) => brands.includes(p.brand));
    if (minRating) l = l.filter((p) => p.rating >= minRating);
    if (cold) l = l.filter((p) => p.coldChain);
    if (sub) l = l.filter((p) => p.subscribe);
    if (maxPrice != null) l = l.filter((p) => p.price <= maxPrice);
    return [...l].sort(SORTS[sort][1]);
  }, [base, tree, q, savedOnly, dealsOnly, petMatch, activePet, types, rx, brands, minRating, cold, sub, maxPrice, sort, wishlist]);

  const aisle = aisleBySlug(cat);
  const [crumb, title] = node ? [node.name, node.name] : aisle ? [aisle.label, aisle.label] : TITLES[cat] || (cat && tree ? [label(cat), label(cat)] : ['All products', 'Care shop']);
  const trail = node ? pathOf(node.id, tree.byId).slice(0, -1) : [];
  const heading = q ? `Results for “${query.get('q')}”` : savedOnly ? 'Saved items' : dealsOnly ? 'Deals' : title;
  const active = [
    petMatch && activePet && { k: 'pet', l: `For ${activePet.name}`, clear: () => setPetMatch(false) },
    ...types.map((t) => ({ k: `t-${t}`, l: typeOpts.find((o) => o.key === t)?.label || label(t), clear: () => setTypes(types.filter((x) => x !== t)) })),
    rx && { k: 'rx', l: rx === 'rx' ? 'Vet approval (Rx)' : 'No prescription', clear: () => setRx(null) },
    ...brands.map((b) => ({ k: `b-${b}`, l: b, clear: () => setBrands(brands.filter((x) => x !== b)) })),
    minRating && { k: 'r', l: `${minRating}★ & up`, clear: () => setMinRating(0) },
    cold && { k: 'c', l: 'Cold-chain', clear: () => setCold(false) },
    sub && { k: 's', l: 'Subscribe & save', clear: () => setSub(false) },
    maxPrice != null && { k: 'p', l: `Up to ${money(maxPrice)}`, clear: () => setMaxPrice(null) },
  ].filter(Boolean);
  const clearAll = () => { setPetMatch(false); setTypes([]); setRx(null); setBrands([]); setMinRating(0); setCold(false); setSub(false); setMaxPrice(null); };

  return (
    <div className="container shop-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span>/</span><Link to="/shop">Care Shop</Link>
        {trail.map((c) => <Fragment key={c.id}><span>/</span><Link to={`/shop/${c.slug}`}>{c.name}</Link></Fragment>)}
        {cat && <><span>/</span><span style={{ color: 'var(--ink)' }}>{crumb}</span></>}
      </nav>

      <header className="shop-head">
        <div className="shop-head-main">
          <h1>{heading}</h1>
          <span className="sub">{list.length} {list.length === 1 ? 'product' : 'products'}</span>
        </div>
        <div className="row gap-8 wrap">
          {activePet && (
            <button
              type="button"
              className={cx('pill', petMatch ? 'solid-teal' : 'outline')}
              style={{ height: 34, padding: '0 14px', cursor: 'pointer', background: petMatch ? undefined : 'var(--surface)' }}
              onClick={() => setPetMatch((v) => !v)}
              aria-pressed={petMatch}
            >
              <Icon name="paw" size={14} /> For {activePet.name}
            </button>
          )}
          <button className="btn btn-outline btn-sm show-sm" onClick={() => setFiltersOpen((o) => !o)}><Icon name="filter" size={14} /> Filters</button>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ height: 36, width: 'auto', maxWidth: '100%', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line-2)', fontSize: 13 }} aria-label="Sort">
            {Object.entries(SORTS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </header>

      <nav className="aisles" aria-label="Shop by pet">
        <Link to="/shop" className={cx('aisle', !aisle && 'on')}>All pets</Link>
        {PET_AISLES.map((a) => <Link key={a.slug} to={`/shop/${a.slug}`} className={cx('aisle', cat === a.slug && 'on')} title={a.hint}>{a.label}</Link>)}
      </nav>

      <div className="listing">
        <aside className={cx('filters', filtersOpen && 'open')} aria-label="Filters">
          {active.length > 0 && (
            <div className="row between" style={{ paddingBottom: 4 }}>
              <b style={{ fontSize: 14 }}>Filters</b>
              <button className="link" style={{ fontSize: 13 }} onClick={clearAll}>Clear all</button>
            </div>
          )}
          {typeOpts.length > (tree ? 0 : 1) && (
            <section>
              <h4>{node ? 'Subcategory' : 'Category'}</h4>
              {typeOpts.map((o) => (
                <Check key={o.key} label={o.label} count={o.count} checked={types.includes(o.key)} onChange={(on) => setTypes(on ? [...types, o.key] : types.filter((x) => x !== o.key))} />
              ))}
            </section>
          )}
          {hasRx && (
            <section>
              <h4>Prescription</h4>
              <Check label="No prescription" count={base.filter((p) => !p.isRx).length} checked={rx === 'otc'} onChange={(on) => setRx(on ? 'otc' : null)} />
              <Check label="Vet approval (Rx)" count={base.filter((p) => p.isRx).length} checked={rx === 'rx'} onChange={(on) => setRx(on ? 'rx' : null)} />
            </section>
          )}
          <section>
            <h4>Price</h4>
            <input type="range" className="range" min={0} max={priceCeil} step={50} value={maxPrice ?? priceCeil} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Maximum price" />
            <div className="row between sub"><span>৳0</span><span>{money(maxPrice ?? priceCeil)}</span></div>
          </section>
          {Object.keys(brandOpts).length > 1 && (
            <section>
              <h4>Brand</h4>
              {Object.entries(brandOpts).map(([b, c]) => (
                <Check key={b} label={b} count={c} checked={brands.includes(b)} onChange={(on) => setBrands(on ? [...brands, b] : brands.filter((x) => x !== b))} />
              ))}
            </section>
          )}
          <section style={{ borderBottom: 0 }}>
            <h4>More</h4>
            <Check label="4★ & up" checked={minRating === 4} onChange={(on) => setMinRating(on ? 4 : 0)} />
            <Check label="Cold-chain" checked={cold} onChange={setCold} />
            <Check label="Subscribe & save" checked={sub} onChange={setSub} />
          </section>
        </aside>

        <div>
          {active.length > 0 && (
            <div className="row gap-6 wrap" style={{ marginBottom: 12 }}>
              {active.map((a) => (
                <button key={a.k} className="pill" onClick={a.clear} style={{ height: 30, padding: '0 12px' }}>{a.l} <Icon name="x" size={12} /></button>
              ))}
            </div>
          )}

          {products.loading && !products.items.length ? (
            <div className="product-grid cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 360 }} />)}</div>
          ) : list.length === 0 ? (
            <div className="card">
              {aisle && base.length === 0
                ? <Empty icon="paw" title={`Nothing for ${aisle.label.toLowerCase()} yet`}>We are adding products for this group. <Link to="/shop" className="link">See everything in the shop</Link></Empty>
                : <Empty icon="search" title="No products match">Try removing a filter or searching for something else.</Empty>}
            </div>
          ) : (
            <>
              <Reveal className="product-grid cols-3" stagger>
                {list.slice(0, shown).map((p) => <ProductCard key={p.id} p={p} />)}
              </Reveal>
              {shown < list.length && (
                <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
                  <button className="btn btn-outline" onClick={() => setShown((x) => x + 9)}>Show more</button>
                </div>
              )}
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
