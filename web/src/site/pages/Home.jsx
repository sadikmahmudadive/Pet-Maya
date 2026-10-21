import { useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useBlogs } from '../../data/hooks.js';
import { Icon, Button, Ph, Avatar, StarRow, Pill } from '../../ui/index.jsx';
import ProductCard from '../ProductCard.jsx';
import HaloBreakdown from '../HaloBreakdown.jsx';
import RefillArt from '../RefillArt.jsx';
import { speciesKind, productFitsPet, speciesShopPath } from '../../lib/species.js';
import { money, cx, productPath } from '../../lib/format.js';
import { Reveal, Count, useSpotlight } from '../../lib/motion.jsx';
import { CATEGORIES, CONCERNS, CARE_KITS, BRANDS, PROMOS, DELIVERY, TRUST } from '../../data/content.js';
import { SAMPLE_REVIEWS } from '../../data/sample.js';

const FILTERS = [
  { v: 'all', l: 'All' }, { v: 'dog', l: 'Dogs' }, { v: 'cat', l: 'Cats' },
  { v: 'rx', l: 'Prescription' }, { v: 'supplements', l: 'Supplements' }, { v: 'smart-gear', l: 'Smart gear' },
];

function SectionHead({ eyebrow, title, link, to }) {
  return (
    <Reveal className="section-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="display-2">{title}</h2>
      </div>
      {link && <Link to={to} className="link-plain row gap-6" style={{ fontSize: 14, flex: 'none' }}>{link} <Icon name="arrowUpRight" size={14} /></Link>}
    </Reveal>
  );
}

export default function Home() {
  const { products, vets, pets, activePet, setPetId, addToCart, toast } = useStore();
  const blogs = useBlogs();
  const [filter, setFilter] = useState('all');
  const spot = useSpotlight();

  const all = products.items.filter((p) => p.showOnStorefront !== false);
  const best = useMemo(() => {
    const list = all.filter((p) => {
      if (filter === 'all') return true;
      if (filter === 'rx') return p.isRx;
      if (filter === 'dog' || filter === 'cat') return p.pet === filter || p.pet === 'both';
      return p.category === filter;
    });
    return [...list].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 4);
  }, [all, filter]);

  // Personalized recommendations based on activePet's species & profile
  const petRecommendations = useMemo(() => {
    if (!activePet) return [];
    const kind = speciesKind(activePet);
    return all
      .filter((p) => productFitsPet(p.pet, kind) && p.stockCount > 0)
      .sort((a, b) => (b.rating * 10 + (b.subscribe ? 3 : 0)) - (a.rating * 10 + (a.subscribe ? 3 : 0)))
      .slice(0, 4);
  }, [all, activePet]);

  // Resolve Curated Care Kits against live catalog products
  const resolvedKits = useMemo(() => CARE_KITS.map((kit) => {
    let items = (kit.productIds || []).map((id) => all.find((p) => p.id === id)).filter(Boolean);
    if (items.length < 2) {
      items = all.filter((p) => (kit.categories || []).includes(p.category) && p.stockCount > 0).slice(0, 3);
    }
    const regularTotal = items.reduce((a, p) => a + p.price, 0);
    const kitTotal = Math.round(regularTotal * (1 - (kit.savePct || 8) / 100));
    return { ...kit, items, regularTotal, kitTotal, savings: regularTotal - kitTotal };
  }).filter((k) => k.items.length >= 2), [all]);

  const addKitToBag = (kit) => {
    kit.items.forEach((p, idx) => {
      const discounted = Math.round(p.price * (1 - (kit.savePct || 8) / 100));
      addToCart(
        { ...p, price: discounted, compareAt: p.price },
        { qty: 1, variant: `${kit.title.split(' ')[0]} Kit (−${kit.savePct}%)`, basePrice: p.price, open: idx === kit.items.length - 1, silent: idx < kit.items.length - 1 },
      );
    });
    toast(`${kit.title} added to your care bag (saved ${money(kit.savings)})`);
  };

  const reviewCount = all.reduce((a, p) => a + (p.ratingCount || 0), 0);
  const avgRating = all.length ? all.reduce((a, p) => a + p.rating * (p.ratingCount || 1), 0) / Math.max(1, all.reduce((a, p) => a + (p.ratingCount || 1), 0)) : 4.9;
  const twoVets = vets.items.slice(0, 2);
  const minFee = vets.items.length ? Math.min(...vets.items.map((v) => v.price || PROMOS.vetConsultFrom)) : PROMOS.vetConsultFrom;

  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <div className="hero-main spotlight" ref={spot.ref} onMouseMove={spot.onMouseMove}>
          <span className="orb" aria-hidden="true" style={{ width: 340, height: 340, right: -90, top: -110, background: 'radial-gradient(circle, rgba(159,208,207,.5), transparent 70%)' }} />
          <span className="orb b" aria-hidden="true" style={{ width: 260, height: 260, left: -80, bottom: -90, background: 'radial-gradient(circle, rgba(46,204,155,.3), transparent 70%)' }} />
          <svg aria-hidden="true" width="420" height="420" style={{ position: 'absolute', right: -120, top: -140, opacity: .18 }}>
            <circle cx="210" cy="210" r="200" fill="none" stroke="#fff" strokeDasharray="2 6" />
            <circle cx="210" cy="210" r="140" fill="none" stroke="#fff" />
          </svg>
          <div>
            <span className="pill mono" style={{ background: 'rgba(255,255,255,.1)', color: '#fff' }}><Icon name="cold" size={12} /> Cold-chain delivery across Dhaka</span>
            <h1>Everything their health needs, <em>delivered</em> with clinical care.</h1>
            <p>Genuine medicine, vet-approved food and smart gear — with a vet, AI triage and live GPS one tap away.</p>
            <div className="row gap-10 wrap" style={{ marginTop: 28 }}>
              <Button className="btn-on-dark" size="lg" icon="arrowRight" to="/shop">Shop the dispensary</Button>
              <Button className="btn-ghost-dark" variant="ghost" size="lg" icon="stethoscope" to="/specialists">Book a vet</Button>
            </div>
          </div>
          <div className="hero-stats" style={{ borderTop: '1px solid rgba(255,255,255,.14)', paddingTop: 24 }}>
            <div><b><Count value={vets.items.length} /></b><span>vets on Pet Maya</span></div>
            <div><b><Count value={100} format={(n) => `${Math.round(n)}%`} /></b><span>genuine stock</span></div>
            <div><b><Count value={avgRating} format={(n) => `${n.toFixed(1)} ★`} /></b><span>average rating</span></div>
            <div><b><Count value={minFee} format={(n) => money(n)} /></b><span>consults from</span></div>
          </div>
        </div>
        <div className="hero-side">
          <div className="hero-tile" style={{ background: 'var(--sunk-2)' }}>
            <div className="row between gap-16 wrap" style={{ alignItems: 'center', height: '100%' }}>
              <div>
                <div className="eyebrow">Live tracking</div>
                <h3>Follow your order from pharmacy to door.</h3>
                <Link to="/account/orders" className="link-plain row gap-6" style={{ marginTop: 14, fontSize: 14 }}>Track an order <Icon name="arrowRight" size={14} /></Link>
              </div>
              <div className="card" style={{ minWidth: 170, padding: 18 }}>
                <div className="stat-label">Cold items</div>
                <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 8 }}>2–8°C</div>
                <div className="row gap-6 teal" style={{ fontSize: 12, marginTop: 6 }}><span className="dot" /> Packed & insulated</div>
              </div>
            </div>
          </div>
          <div className="hero-tile" style={{ background: 'var(--yellow-tint)' }}>
            <div className="row between gap-16" style={{ alignItems: 'center', height: '100%' }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--yellow-ink)' }}>Subscribe & save</div>
                <h3>Auto-refill. 5% off. Never run out.</h3>
                <Link to="/shop?subscribe=1" className="row gap-6" style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: 'var(--yellow-ink)' }}>See refill plans <Icon name="arrowRight" size={14} /></Link>
              </div>
              <RefillArt className="hide-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <SectionHead eyebrow="Shop by pet & need" title="Find the right care, faster." link="All categories" to="/shop" />
        <Reveal className="cat-grid" stagger>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={c.to || `/shop/${c.slug}`} className={cx('cat-tile', c.tone)}>
              <span className="well round"><Icon name={c.icon} size={18} /></span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{c.label}</div>
                <div className="sub" style={{ fontSize: 12 }}>{c.sub}</div>
              </div>
            </Link>
          ))}
        </Reveal>
        <div className="card trust-inline" style={{ marginTop: 28 }}>
          <div className="trust-row" style={{ border: 0, padding: 0 }}>
            {[TRUST[0], TRUST[1], TRUST[2], { icon: 'check', title: 'Pay your way', text: 'Cash on Delivery · bKash · Nagad' }].map((t) => (
              <div key={t.title} className="row gap-12">
                <Icon name={t.icon} size={18} className="teal" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                  <div className="sub" style={{ fontSize: 12 }}>{t.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="brand-strip marquee" style={{ marginTop: 40 }}>
          <div className="marquee-track" aria-hidden="true">
            {[...BRANDS, ...BRANDS].map((b, i) => <span key={`${b}-${i}`}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* Recommended for your pet */}
      {activePet && petRecommendations.length > 0 && (
        <section className="section">
          <div className="row between wrap gap-12" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow">Personalised for your pet</div>
              <h2 className="display-2" style={{ marginTop: 6 }}>Recommended for {activePet.name}.</h2>
              <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
                Matched to {[activePet.species, activePet.breed, activePet.weight, activePet.age].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="row gap-8 wrap">
              {(pets.items || []).map((petItem) => (
                <button
                  key={petItem.id}
                  type="button"
                  className={cx('chip', petItem.id === activePet.id && 'active')}
                  onClick={() => setPetId(petItem.id)}
                >
                  <Avatar name={petItem.name} src={petItem.photo} size="sm" />
                  <span>{petItem.name}</span>
                </button>
              ))}
              <Link to={speciesShopPath(speciesKind(activePet))} className="btn btn-outline btn-sm">
                See all for {activePet.name} <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>
          <Reveal className="product-grid" stagger key={activePet.id}>
            {petRecommendations.map((p) => <ProductCard key={p.id} p={p} />)}
          </Reveal>
        </section>
      )}

      {/* Maya Halo — Pet Maya's exclusive collar: a full-screen, scroll-driven product breakdown */}
      <div className="hxf-bleed"><HaloBreakdown /></div>

      {/* Best sellers */}
      <section className="section">
        <SectionHead eyebrow="Best sellers" title="What pet parents reorder most." link="Browse all" to="/shop" />
        <div className="tabs" style={{ gap: 8, marginBottom: 20 }}>
          {FILTERS.map((f) => (
            <button key={f.v} className={cx('chip', filter === f.v && 'active')} onClick={() => setFilter(f.v)}>{f.l}</button>
          ))}
        </div>
        <Reveal className="product-grid" stagger key={filter}>
          {best.map((p) => <ProductCard key={p.id} p={p} />)}
        </Reveal>
      </section>

      {/* Curated Care Kits */}
      {resolvedKits.length > 0 && (
        <section className="section">
          <SectionHead eyebrow="Vet-curated bundles" title="Complete Care Kits — save 8%." link="Explore all products" to="/shop" />
          <Reveal className="trio" stagger>
            {resolvedKits.map((kit) => (
              <div key={kit.id} className="card stack gap-14" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="row between">
                    <Pill tone={kit.tone || 'teal'} sm>{kit.eyebrow}</Pill>
                    <span className="sub">{kit.items.length} products</span>
                  </div>
                  <h3 className="serif" style={{ fontSize: 23, marginTop: 12 }}>{kit.title}</h3>
                  <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{kit.description}</p>
                  <div className="stack gap-8" style={{ marginTop: 14 }}>
                    {kit.items.map((item) => (
                      <Link key={item.id} to={productPath(item)} className="panel row gap-10" style={{ padding: '8px 12px' }}>
                        <Ph src={item.image} label=" " style={{ width: 38, height: 38, minHeight: 0, borderRadius: 8, flex: 'none' }} />
                        <div className="grow" style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }} className="ellipsis">{item.name}</div>
                          <div className="sub" style={{ fontSize: 11 }}>{item.brand}</div>
                        </div>
                        <span className="mono" style={{ fontSize: 12.5 }}>{money(item.price)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                  <div className="row between" style={{ alignItems: 'baseline', marginBottom: 12 }}>
                    <div>
                      <div className="stat-label">Kit price</div>
                      <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 2 }}>
                        <b style={{ fontSize: 24 }}>{money(kit.kitTotal)}</b>
                        <s className="subtle" style={{ fontSize: 13 }}>{money(kit.regularTotal)}</s>
                      </div>
                    </div>
                    <Pill tone="teal" sm>Save {money(kit.savings)}</Pill>
                  </div>
                  <Button variant="dark" block icon="bag" onClick={() => addKitToBag(kit)}>Add kit to Care Bag</Button>
                </div>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* Promos */}
      <Reveal as="section" className="section promo-pair" stagger>
        <div className="promo" style={{ background: 'var(--sunk-2)' }}>
          <div>
            <div className="eyebrow muted">Not sure what they need?</div>
            <h3>Ask a vet before you buy.</h3>
            <p className="muted" style={{ marginTop: 14, maxWidth: '42ch' }}>Describe symptoms, share photos and get a clear plan from a licensed vet — then order exactly what they prescribe.</p>
          </div>
          <div><Button variant="dark" icon="arrowRight" to="/specialists">Book a consult</Button></div>
        </div>
        <div className="promo dark-card">
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Code {PROMOS.firstOrderCode}</div>
            <h3>{PROMOS.firstOrderPct}% off your first order.</h3>
            <p style={{ marginTop: 14, color: 'rgba(255,255,255,.75)', maxWidth: '44ch' }}>
              Applies to food, supplements and gear. Free delivery over {money(DELIVERY.freeOver)}.
            </p>
          </div>
          <div><Button className="btn-on-dark" icon="arrowRight" to="/shop">Start shopping</Button></div>
        </div>
      </Reveal>

      {/* Care built in */}
      <section className="section">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Care, built in</div>
        <h2 className="display-2" style={{ maxWidth: '20ch', marginBottom: 24 }}>A vet, a triage tool and a GPS collar — all connected to your cart.</h2>
        <Reveal className="trio" stagger>
          <Link to="/triage" className="card stack gap-16">
            <div className="row gap-12"><span className="well teal"><Icon name="pulse" /></span><span className="serif" style={{ fontSize: 22 }}>AI Triage</span></div>
            <p className="muted" style={{ fontSize: 14 }}>Photo-based symptom check that tells you how urgent it is.</p>
            <div className="panel stack gap-10">
              <span className="pill dark" style={{ alignSelf: 'flex-end', height: 34, padding: '0 14px', fontSize: 13 }}>He keeps scratching his ear.</span>
              <div className="card tight" style={{ borderRadius: 14 }}>
                <span className="pill yellow sm">See a vet within 48h</span>
                <div className="sub" style={{ marginTop: 6 }}>Not an emergency — but don’t wait a week.</div>
              </div>
            </div>
          </Link>
          <Link to="/specialists" className="card stack gap-16">
            <div className="row gap-12"><span className="well teal"><Icon name="stethoscope" /></span><span className="serif" style={{ fontSize: 22 }}>Book a vet</span></div>
            <p className="muted" style={{ fontSize: 14 }}>Clinic visits from {money(minFee)}, with prescriptions sent straight to your bag.</p>
            <div className="stack gap-8">
              {twoVets.map((v) => (
                <div key={v.id} className="panel row gap-12">
                  <Avatar name={v.name.replace('Dr. ', '')} src={v.photo} size="sm" />
                  <div className="grow"><div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div><div className="sub" style={{ fontSize: 12 }}>{v.availability}</div></div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{money(v.price)}</span>
                </div>
              ))}
            </div>
          </Link>
          <Link to="/gps" className="card stack gap-16">
            <div className="row gap-12"><span className="well teal"><Icon name="target" /></span><span className="serif" style={{ fontSize: 22 }}>GPS Radar</span></div>
            <p className="muted" style={{ fontSize: 14 }}>Live location, safe zones and instant alerts with the Maya Halo collar.</p>
            <div className="radar" style={{ aspectRatio: '2.6 / 1', borderRadius: 16, backgroundSize: '22px 22px' }}>
              <div className="zone" style={{ width: 180, height: 180 }} />
              <div className="ring" style={{ width: 90, height: 90 }} />
              <div className="pet-dot" style={{ left: '62%', top: '48%', width: 16, height: 16, borderWidth: 3 }} />
              <span className="compass" style={{ left: 12, bottom: 10, color: 'var(--teal)' }}>● LIVE</span>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* Concerns */}
      <section className="section">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Shop by concern</div>
        <h2 className="display-2" style={{ marginBottom: 22 }}>What’s bothering them?</h2>
        <Reveal className="row gap-10 wrap" stagger>
          {CONCERNS.map((c) => (
            <Link key={c.label} to={`/shop/${c.cat}`} className="chip" style={{ height: 50, padding: '0 20px 0 8px', fontSize: 14.5 }}>
              <span className="well round sm"><Icon name={c.icon} size={14} /></span>{c.label}
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Reviews */}
      <section className="section">
        <Reveal className="reviews-grid" stagger>
          <div className="card flat stack" style={{ justifyContent: 'center', gap: 10, padding: 28 }}>
            <div className="eyebrow">Customer reviews</div>
            <div style={{ fontSize: 60, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}><Count value={avgRating} format={(n) => n.toFixed(1)} /></div>
            <StarRow n={5} size={16} />
            <div className="sub"><Count value={reviewCount} /> product reviews</div>
          </div>
          {SAMPLE_REVIEWS.slice(0, 2).map((r) => (
            <div key={r.title} className="card stack gap-12">
              <StarRow n={r.stars} size={12} />
              <h3 className="serif" style={{ fontSize: 20 }}>{r.title}</h3>
              <p className="muted" style={{ fontSize: 14 }}>{r.text}</p>
              <div style={{ fontSize: 12, marginTop: 'auto' }}><b>{r.name}</b> <span className="muted">· {r.pet}’s parent</span></div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Journal */}
      <section className="section">
        <SectionHead eyebrow="The Pet Maya journal" title="Vet know-how, written for pet parents." link="Read the journal" to="/journal" />
        <Reveal className="trio" stagger>
          {blogs.items.filter((b) => !b.featured).slice(0, 3).map((b) => (
            <Link key={b.id} to={`/journal/${b.id}`} className="card tight article-card">
              <Ph src={b.image} tone="teal" label="photo" style={{ height: 180 }} />
              <div className="eyebrow" style={{ fontSize: 10, marginTop: 4 }}>{b.category} · {b.readMin} min</div>
              <h3>{b.title}</h3>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* App banner */}
      <section className="section">
        <Reveal className="app-banner">
          <div>
            <h2 style={{ font: '400 clamp(32px,4vw,48px)/1.05 var(--serif)', letterSpacing: '-0.025em' }}>Your pet’s care,<br />in your pocket.</h2>
            <p style={{ color: 'rgba(255,255,255,.75)', marginTop: 14, maxWidth: '46ch' }}>Order, track deliveries, talk to a vet and watch the GPS radar — one app, one pet profile.</p>
            <div className="row gap-10" style={{ marginTop: 24 }}>
              <Button className="btn-on-dark" icon="apple" to="https://apps.apple.com/">App Store</Button>
              <Button className="btn-ghost-dark" variant="ghost" icon="playStore" to="https://play.google.com/store">Google Play</Button>
            </div>
          </div>
          <div className="app-banner-visual">
            <img
              src="/assets/images/Smartphones_displaying_app_screen.jpg"
              alt="Pet Maya mobile app screen showcasing smart care hub, AI health scanner, veterinary services and community"
              className="app-banner-img"
              loading="lazy"
            />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
