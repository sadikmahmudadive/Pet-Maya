import { useEffect, useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useCollection } from '../../data/firestore.js';
import { Icon, Button, Ph, Pill, StarRow, Avatar, Empty } from '../../ui/index.jsx';
import { Stepper } from '../BagDrawer.jsx';
import ProductCard from '../ProductCard.jsx';
import ReviewModal from '../ReviewModal.jsx';
import { Reveal } from '../../lib/motion.jsx';
import { money, cx, ago, toMillis } from '../../lib/format.js';
import { DELIVERY } from '../../data/content.js';
import { SAMPLE_REVIEWS } from '../../data/sample.js';

// Weight bands for products sold by size (used to match the active pet).
const BANDS = {
  Toy: [2, 4.5], Small: [4.5, 10], 'Small & medium': [7.5, 15], Medium: [10, 25], Large: [15.1, 30], Giant: [30.1, 60],
};
const kg = (w) => parseFloat(String(w || '').replace(/[^\d.]/g, '')) || 0;

const normReview = (id, d) => ({
  id, name: d.userName || d.name || 'Pet parent', pet: d.petName || '', title: d.title || '',
  text: d.text || d.comment || d.review || '', stars: Number(d.rating || d.stars || 5), time: toMillis(d.timestamp || d.createdAt),
});

export default function Product({ params }) {
  const { products, addToCart, activePet, totals, wishlist, toggleWish, toast } = useStore();
  const p = products.items.find((x) => x.id === params.id);
  const reviews = useCollection('reviews', {
    map: normReview, sample: SAMPLE_REVIEWS.map((r, i) => normReview(`s${i}`, r)), filters: [['productId', '==', params.id]],
  });

  const petKg = kg(activePet?.weight);
  const matchVariant = useMemo(() => {
    if (!p?.variants?.length || !petKg) return '';
    return p.variants.find((v) => BANDS[v] && petKg >= BANDS[v][0] && petKg <= BANDS[v][1]) || '';
  }, [p, petKg]);

  const [variant, setVariant] = useState('');
  const [course, setCourse] = useState(1);
  const [refill, setRefill] = useState(false);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState('overview');
  const [showSticky, setShowSticky] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => { setVariant(matchVariant || p?.variants?.[0] || ''); setQty(1); setCourse(1); setImg(0); }, [p?.id, matchVariant]);
  useEffect(() => { if (p) document.title = `${p.name} · Pet Maya`; }, [p]);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!p) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        {products.loading ? <div className="skeleton" style={{ height: 480 }} /> : (
          <div className="card"><Empty icon="search" title="We couldn’t find that product"><Link className="link" to="/shop">Back to the shop</Link></Empty></div>
        )}
      </div>
    );
  }

  const courses = p.subscribe || p.isRx
    ? [{ n: 1, label: 'Single', note: '1 pack', save: 0 }, { n: 3, label: 'Quarterly', note: '3 packs', save: 3 }, { n: 6, label: 'Bi-annual', note: '6 packs', save: 5 }]
    : null;
  const c = courses?.find((x) => x.n === course) || { n: 1, save: 0 };
  const unit = Math.round(p.price * (1 - c.save / 100) * (refill ? 0.95 : 1));
  const lineTotal = unit * c.n * qty;
  const save = p.compareAt > p.price ? p.compareAt - p.price : 0;
  const toFree = Math.max(0, DELIVERY.freeOver - totals.subtotal - lineTotal);
  const images = [p.image, ...(p.images || [])].filter(Boolean);
  const gallery = images.length ? images : [''];
  const related = products.items.filter((x) => x.id !== p.id && (x.category === p.category || x.pet === p.pet)).slice(0, 3);
  const bundle = [p, ...related.slice(0, 2)];
  const bundleTotal = bundle.reduce((a, x) => a + x.price, 0);
  const avg = reviews.items.length ? reviews.items.reduce((a, r) => a + r.stars, 0) / reviews.items.length : p.rating;
  const soldOut = p.stockCount === 0 || !p.inStock;

  const add = () => addToCart({ ...p, price: unit * c.n, subscribe: refill || p.subscribe }, { qty, variant: [variant, c.n > 1 ? `${c.n} packs` : '', refill ? 'Auto-refill' : ''].filter(Boolean).join(' · ') });

  const TABS = [
    ['overview', 'Overview'],
    ['dosing', 'How to use'],
    ['storage', 'Storage & delivery'],
    ['safety', 'Safety'],
  ];

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span>/</span><Link to="/shop">Care Shop</Link><span>/</span>
        <Link to={`/shop/${p.pet === 'cat' ? 'cats' : 'dogs'}`}>{p.pet === 'cat' ? 'Cats' : 'Dogs'}</Link><span>/</span>
        <span style={{ color: 'var(--ink)' }}>{p.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="card" style={{ padding: 16, borderRadius: 28 }}>
            <Ph className="main" src={gallery[img]} tone={p.coldChain ? 'teal' : ''} label={`product photo — ${p.name}`}>
              {p.coldChain && <span className="pill teal mono" style={{ position: 'absolute', top: 16, left: 16 }}><span className="dot" /> Ships at 2°C – 8°C</span>}
              <button className={cx('pcard-fav', wishlist.includes(p.id) && 'on')} style={{ top: 16, right: 16, width: 42, height: 42 }} onClick={() => toggleWish(p.id)} aria-label="Save"><Icon name="heart" size={17} /></button>
              <span className="pill" style={{ position: 'absolute', left: 16, bottom: 16, background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', height: 30 }}><Icon name="shield" size={13} /> Authentic batch</span>
            </Ph>
          </div>
          {gallery.length > 1 && (
            <div className="thumbs">
              {gallery.slice(0, 4).map((src, i) => (
                <button key={src || i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}><Ph src={src} className={cx(i === img && 'on')} label={String(i + 1)} /></button>
              ))}
            </div>
          )}
          <div className="card flat row" style={{ marginTop: 14, justifyContent: 'space-around', textAlign: 'center' }}>
            {[['Stock', soldOut ? 'Sold out' : p.stockCount > 20 ? 'In stock' : `${p.stockCount} left`], ['SKU', p.sku], ['Dispatch', p.isRx ? 'After vet check' : 'Same day']].map(([k, v]) => (
              <div key={k}><div className="stat-label">{k}</div><div className="mono" style={{ fontSize: 16, marginTop: 6 }}>{v}</div></div>
            ))}
          </div>
        </div>

        <div>
          <div className="row gap-8 wrap">
            <span className="eyebrow">{p.brand}</span>
            {p.isRx && <Pill tone="yellow" sm>Rx — vet approval</Pill>}
            {p.coldChain && <Pill tone="teal" sm icon="cold">Cold-chain</Pill>}
          </div>
          <h1 className="display-1" style={{ marginTop: 14 }}>{p.name}</h1>
          <p className="lead" style={{ marginTop: 14 }}>{p.shortDescription || p.description}</p>
          <div className="row gap-8" style={{ marginTop: 12 }}>
            <StarRow n={Math.round(p.rating)} />
            <b style={{ fontSize: 14 }}>{p.rating.toFixed(1)}</b>
            <a href="#reviews" className="link" style={{ color: 'var(--muted)', fontSize: 14 }}>({p.ratingCount} reviews)</a>
          </div>

          <div className="card" style={{ marginTop: 22, padding: 22, borderRadius: 28 }}>
            <div className="row gap-10 wrap" style={{ alignItems: 'baseline' }}>
              <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.03em' }}>{money(p.price)}</span>
              {save > 0 && <><s className="subtle" style={{ fontSize: 16 }}>{money(p.compareAt)}</s><Pill tone="red" sm>Save {money(save)}</Pill></>}
              <span className="sub">VAT included</span>
            </div>

            <div className="panel" style={{ marginTop: 18 }}>
              <div className="row between" style={{ fontSize: 14 }}>
                <span>Free delivery</span>
                <span className="teal" style={{ fontWeight: 600 }}>{toFree ? `Add ${money(toFree)}` : 'Unlocked'}</span>
              </div>
              <div className="meter" style={{ marginTop: 10, height: 4, background: 'var(--sunk-2)' }}><span style={{ width: `${Math.min(100, ((DELIVERY.freeOver - toFree) / DELIVERY.freeOver) * 100)}%` }} /></div>
            </div>

            {activePet && (
              <div className="panel row gap-12" style={{ marginTop: 10 }}>
                <Avatar name={activePet.name} src={activePet.photo} />
                <div className="grow" style={{ fontSize: 14 }}>
                  <b>{activePet.name}</b>{matchVariant ? <span className="muted"> · size matched</span> : null}
                  <div className="sub">{[activePet.breed, activePet.weight, activePet.age].filter(Boolean).join(' · ')}</div>
                </div>
                <Link to="/vault" className="link-plain" style={{ fontSize: 13 }}>Change</Link>
              </div>
            )}

            {p.variants?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="row between" style={{ marginBottom: 10 }}><b style={{ fontSize: 14 }}>{BANDS[p.variants[0]] ? 'Weight tier' : 'Size'}</b>{BANDS[p.variants[0]] && <a href="#details" onClick={() => setTab('dosing')} className="link-plain" style={{ fontSize: 13 }}>Dosage guide</a>}</div>
                <div className="opt-grid">
                  {p.variants.map((v) => (
                    <button key={v} className={cx('opt', v === variant && 'on')} onClick={() => setVariant(v)}>
                      <b>{v}</b>
                      {BANDS[v] && <small>{BANDS[v][0]} – {BANDS[v][1]} kg{v === matchVariant && activePet ? ` · ${activePet.name}’s size` : ''}</small>}
                      {v === matchVariant && <span className="pill solid-teal mono sm tagr">Match</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {courses && (
              <div style={{ marginTop: 20 }}>
                <b style={{ fontSize: 14, display: 'block', marginBottom: 10 }}>Course</b>
                <div className="opt-grid three">
                  {courses.map((x) => (
                    <button key={x.n} className={cx('opt', x.n === course && 'on')} onClick={() => setCourse(x.n)}>
                      <b>{x.label}</b><small>{x.note}</small>
                      <div style={{ fontWeight: 600, marginTop: 6 }}>{money(Math.round(p.price * (1 - x.save / 100)) * x.n)}</div>
                      {x.save > 0 && <span className="pill yellow sm" style={{ marginTop: 4 }}>Save {x.save}%</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {p.subscribe && (
              <button className={cx('ship-opt', refill && 'on')} style={{ marginTop: 14, width: '100%', textAlign: 'left' }} onClick={() => setRefill(!refill)} aria-pressed={refill}>
                <input type="radio" className="radio" readOnly checked={refill} tabIndex={-1} />
                <div className="grow">
                  <b style={{ fontSize: 14 }}>Auto-refill</b> <span className="muted" style={{ fontSize: 14 }}>· save 5%</span>
                  <div className="sub">Delivered every 30 days{activePet ? ` for ${activePet.name}` : ''}. Skip or cancel anytime.</div>
                </div>
                <span className="pill solid-teal mono sm">Save 5%</span>
              </button>
            )}

            <div className="row gap-10" style={{ marginTop: 18 }}>
              <Stepper value={qty} onChange={setQty} min={1} />
              <Button variant="dark" size="lg" icon="bag" className="grow" disabled={soldOut} onClick={add}>
                {soldOut ? 'Sold out' : `Add to Care Bag · ${money(lineTotal)}`}
              </Button>
            </div>
            {p.isRx && (
              <Button variant="outline" size="lg" block icon="video" to="/specialists" style={{ marginTop: 10 }}>No prescription? Get one from a vet</Button>
            )}
            <div className="row gap-8 wrap" style={{ marginTop: 12 }}>
              {p.coldChain && <span className="panel row gap-8" style={{ padding: '10px 14px', fontSize: 13 }}><Icon name="cold" size={15} className="teal" /> Insulated pack, temperature-tagged</span>}
              <span className="panel row gap-8" style={{ padding: '10px 14px', fontSize: 13 }}><Icon name="clock" size={15} className="teal" /> Order by 4 PM for same-day in Dhaka</span>
            </div>
          </div>
        </div>
      </div>

      <section className="section" id="details">
        <h2 className="display-2" style={{ marginBottom: 18 }}>Details & guidance</h2>
        <div className="row gap-4" style={{ background: 'var(--sunk)', borderRadius: 999, padding: 5, width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
          {TABS.map(([k, l]) => <button key={k} className={cx('tab', tab === k && 'active')} style={{ height: 40, padding: '0 20px' }} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="card" style={{ marginTop: 18, padding: 28 }}>
          {tab === 'overview' && <p style={{ maxWidth: '75ch', lineHeight: 1.7 }}>{p.description || p.shortDescription}</p>}
          {tab === 'dosing' && (
            <div className="stack gap-12" style={{ maxWidth: '75ch' }}>
              <p>Always follow the dose on your vet’s prescription or the product label.</p>
              {BANDS[p.variants?.[0]] && (
                <div className="list">
                  {p.variants.map((v) => BANDS[v] && <div key={v} className="list-row between"><span>{v}</span><span className="mono teal">{BANDS[v][0]} – {BANDS[v][1]} kg</span></div>)}
                </div>
              )}
              <p className="muted">Not sure which size? <Link to="/specialists" className="link">Ask a vet</Link> — it takes a few minutes.</p>
            </div>
          )}
          {tab === 'storage' && (
            <div className="stack gap-12" style={{ maxWidth: '75ch' }}>
              <p>{p.coldChain ? `Keep refrigerated at ${DELIVERY.coldRange}. We pack it in an insulated box with a temperature tag; if the tag shows it got too warm, don’t accept it and we’ll replace it free.` : 'Store in a cool, dry place out of direct sunlight and away from children and pets.'}</p>
              <p className="muted">Free delivery over {money(DELIVERY.freeOver)}. Unopened, non-prescription items can be returned within {DELIVERY.returnsDays} days.</p>
            </div>
          )}
          {tab === 'safety' && (
            <div className="stack gap-12" style={{ maxWidth: '75ch' }}>
              {p.isRx && <p><b>Prescription medicine.</b> A licensed vet reviews your prescription before we dispatch. Upload it at checkout, or book a consult if you don’t have one.</p>}
              <p>Tell your vet about any other medicines, pregnancy, or previous reactions before starting. Stop and contact a vet if you notice vomiting, lethargy, tremors or swelling.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section" id="reviews">
        <div className="section-head">
          <div><div className="eyebrow">Reviews</div><h2 className="display-2">What pet parents say</h2></div>
          <Button variant="outline" icon="star" onClick={() => setReviewing(true)}>Write a review</Button>
        </div>
        <Reveal className="product-grid" stagger>
          <div className="card flat stack gap-8" style={{ padding: 26 }}>
            <div style={{ fontSize: 54, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>{avg.toFixed(1)}</div>
            <StarRow n={Math.round(avg)} size={15} />
            <div className="sub">{Math.max(p.ratingCount, reviews.items.length)} reviews</div>
          </div>
          {reviews.items.slice(0, 3).map((r) => (
            <div key={r.id} className="card stack gap-10">
              <div className="row between"><StarRow n={r.stars} size={12} /><Pill tone="teal" mono sm>Verified buyer</Pill></div>
              {r.title && <h3 className="serif" style={{ fontSize: 20 }}>{r.title}</h3>}
              <p className="muted" style={{ fontSize: 14 }}>{r.text}</p>
              <div style={{ fontSize: 12, marginTop: 'auto' }}><b>{r.name}</b>{r.pet && <span className="muted"> · {r.pet}’s parent</span>}{r.time ? <span className="muted"> · {ago(r.time)}</span> : null}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {bundle.length > 1 && (
        <section className="section">
          <div className="card flat" style={{ padding: 'clamp(24px,4vw,44px)', borderRadius: 32, background: 'var(--sunk-2)' }}>
            <div className="eyebrow">Frequently paired</div>
            <h2 className="display-2" style={{ margin: '10px 0 24px' }}>Complete the routine</h2>
            <div className="bundle">
              {bundle.map((b, i) => (
                <div key={b.id} className="row gap-12" style={{ alignItems: 'center' }}>
                  {i > 0 && <Icon name="plus" size={16} className="subtle" />}
                  <Link to={`/product/${b.id}`} style={{ width: '100%' }}>
                    <Ph src={b.image} tone="teal" label=" " style={{ height: 120 }} />
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 10 }}>{b.name}</div>
                    <div className="sub">{money(b.price)}</div>
                  </Link>
                </div>
              ))}
              <div className="card" style={{ borderRadius: 24 }}>
                <div className="stat-label">Bundle total · {bundle.length} items</div>
                <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 10 }}>{money(bundleTotal)}</div>
                {bundleTotal >= DELIVERY.freeOver && <div className="teal" style={{ fontSize: 13, marginTop: 6 }}>Free delivery unlocked</div>}
                <Button variant="dark" size="lg" block icon="plus" style={{ marginTop: 16 }} onClick={() => bundle.forEach((b, i) => addToCart(b, { open: i === bundle.length - 1, silent: i < bundle.length - 1 }))}>Add all to bag</Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="display-2">You may also need</h2></div>
          <div className="product-grid cols-3">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}

      {reviewing && <ReviewModal product={p} onClose={() => setReviewing(false)} />}

      {showSticky && !soldOut && (
        <div className="sticky-buy hide-sm">
          <Ph src={p.image} label=" " style={{ width: 40, height: 40, minHeight: 0, borderRadius: '50%' }} />
          <div className="grow">
            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}{variant ? ` · ${variant}` : ''}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{p.coldChain ? 'Cold-chain' : 'Same-day in Dhaka'}</div>
          </div>
          <b style={{ fontSize: 18 }}>{money(lineTotal)}</b>
          <button className="btn btn-on-dark" onClick={add}><Icon name="bag" size={16} /> Add to Care Bag</button>
        </div>
      )}
    </div>
  );
}
