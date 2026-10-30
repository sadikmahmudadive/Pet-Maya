import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { Icon, Button, ThemeToggle, Ph, Pill } from '../ui/index.jsx';
import { money, cx, productPath } from '../lib/format.js';
import { useScrolled, useBump, Reveal } from '../lib/motion.jsx';
import { subscribeNewsletter } from '../data/actions.js';
import { TRUST, BRAND } from '../data/content.js';
import AnnouncementBar, { useAnnouncementConfig } from './AnnouncementBar.jsx';
import BagDrawer from './BagDrawer.jsx';
import CompareDrawer from './CompareDrawer.jsx';
import AiShoppingAssistant from './AiShoppingAssistant.jsx';
import AccountButton from './AccountButton.jsx';
import NotificationBell from './NotificationBell.jsx';
import Toasts from './Toasts.jsx';
import ConsentBar from './ConsentBar.jsx';
import { trackPageView } from '../lib/analytics.js';
import { useApp } from '../context/AppContext.jsx';

// ~240 KB of modal code and animation library: fetched the first time any modal opens
const ModalRoot = lazy(() => import('../components/Modals/ModalRoot.jsx'));
function Modals() {
  const { activeModal } = useApp();
  return activeModal ? <Suspense fallback={null}><ModalRoot /></Suspense> : null;
}

const NAV = [
  { to: '/shop', label: 'Care Shop', match: (p) => p === '/shop' },
  { to: '/shop/dogs', label: 'Dogs' },
  { to: '/shop/cats', label: 'Cats' },
  { to: '/shop/medicine', label: 'Medicine' },
  { to: '/specialists', label: 'Specialists' },
  { to: '/triage', label: 'AI Triage' },
  { to: '/gps', label: 'GPS Radar' },
  { to: '/vault', label: 'Health Vault' },
  { to: '/community', label: 'Community' },
  { to: '/journal', label: 'Journal', match: (p) => p.startsWith('/journal') },
  { to: '/dashboard', label: 'Dashboard' },
];

const QUICK_CATS = [
  { label: 'Dogs', to: '/shop/dogs' },
  { label: 'Cats', to: '/shop/cats' },
  { label: 'Medicine', to: '/shop/medicine' },
  { label: 'Food & Diets', to: '/shop/food' },
  { label: 'Toys', to: '/shop/toys' },
  { label: 'Accessories', to: '/shop/accessories' },
];

export function Logo({ sub = true }) {
  return (
    <Link to="/" className="logo" aria-label="Pet Maya home">
      <span className="logo-word">PET MAYA</span>
      {sub && <span className="logo-sub">{BRAND.tagline}</span>}
    </Link>
  );
}

function Header() {
  const { path, navigate } = useRouter();
  const { totals, setBagOpen, products, addToCart } = useStore();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const scrolled = useScrolled(10);
  const bump = useBump(totals.count);

  useEffect(() => { setMenu(false); setSearchOpen(false); }, [path]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('site-search')?.focus();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return (products?.items || [])
      .filter((p) => p.showOnStorefront !== false && `${p.name} ${p.brand} ${p.category} ${p.sku || ''} ${p.shortDescription || ''}`.toLowerCase().includes(term))
      .slice(0, 5);
  }, [q, products?.items]);

  const submit = (e) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className={cx('site-header', scrolled && 'scrolled')}>
      <div className="container">
        <div className="hdr-row">
          <button className="btn btn-ghost btn-square show-sm" aria-label="Menu" onClick={() => setMenu((m) => !m)}>
            <Icon name={menu ? 'x' : 'menu'} size={20} />
          </button>
          <Logo />
          <div className="hdr-search hide-sm" style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
            <form className="searchbar" onSubmit={submit} role="search" style={{ width: '100%' }}>
              <Icon name="search" size={17} />
              <input
                id="site-search"
                value={q}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
                onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
                placeholder="Search medicine, food, brands, SKUs or vets…"
                aria-label="Search"
              />
              {q && (
                <button type="button" className="link" style={{ fontSize: 12 }} onClick={() => setQ('')} aria-label="Clear search">
                  <Icon name="x" size={13} />
                </button>
              )}
              <span className="kbd">⌘K</span>
            </form>

            {searchOpen && (q.trim().length >= 2 || QUICK_CATS.length > 0) && (
              <div
                className="card stack gap-10"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  zIndex: 95,
                  padding: 14,
                  borderRadius: 18,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.16)',
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {q.trim().length >= 2 ? (
                  suggestions.length > 0 ? (
                    <>
                      <div className="row between">
                        <span className="eyebrow muted" style={{ fontSize: 10 }}>Instant Catalog Matches</span>
                        <button type="button" className="link" style={{ fontSize: 12 }} onClick={submit}>
                          See all results for “{q.trim()}” →
                        </button>
                      </div>
                      <div className="stack gap-6">
                        {suggestions.map((p) => (
                          <div key={p.id} className="row gap-10" style={{ padding: '6px 8px', borderRadius: 12, background: 'var(--sunk-2)' }}>
                            <Ph src={p.image} label=" " style={{ width: 40, height: 40, minHeight: 0, borderRadius: 10 }} />
                            <div className="grow" style={{ minWidth: 0 }}>
                              <Link
                                to={productPath(p)}
                                onClick={() => setSearchOpen(false)}
                                style={{ fontWeight: 600, fontSize: 13.5, display: 'block' }}
                                className="ellipsis"
                              >
                                {p.name}
                              </Link>
                              <div className="sub" style={{ fontSize: 11.5 }}>
                                {p.brand} · <b>{money(p.price)}</b>
                                {p.isRx ? ' · Rx' : ''}
                                {p.coldChain ? ' · Cold 2–8°C' : ''}
                              </div>
                            </div>
                            <Button
                              variant="dark"
                              size="sm"
                              icon="plus"
                              disabled={p.stockCount <= 0 || !p.inStock}
                              onClick={() => { addToCart(p, { variant: p.variants?.[0] || '' }); setSearchOpen(false); }}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="sub" style={{ fontSize: 13, padding: '6px 4px' }}>
                      No instant matches for “{q.trim()}”. Press Enter to search all categories.
                    </div>
                  )
                ) : (
                  <div>
                    <div className="eyebrow muted" style={{ fontSize: 10, marginBottom: 8 }}>Popular Categories</div>
                    <div className="row gap-6 wrap">
                      {QUICK_CATS.map((c) => (
                        <Link
                          key={c.to}
                          to={c.to}
                          className="pill outline sm"
                          onClick={() => setSearchOpen(false)}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="row gap-4 hdr-actions">
            <Link to="/shop?saved=1" className="btn btn-ghost btn-square hide-sm" aria-label="Saved items"><Icon name="heart" /></Link>
            <NotificationBell />
            <ThemeToggle />
            <AccountButton />
            <button className="btn btn-dark bag-btn" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${totals.count} items`}>
              <Icon name="bag" size={17} />
              <span className="hide-sm">Bag · {money(totals.subtotal)}</span>
              <span className={cx('bag-count', bump && 'bump')}>{totals.count}</span>
            </button>
          </div>
        </div>
        <nav className={cx('hdr-nav', menu && 'open')} aria-label="Main">
          <form className="searchbar show-sm" onSubmit={submit} role="search" style={{ marginBottom: 8 }}>
            <Icon name="search" size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search medicine, food, vets…" aria-label="Search" />
          </form>
          <div className="nav-links">
            {NAV.map((n) => {
              const active = n.match ? n.match(path) : path === n.to;
              return <Link key={n.to} to={n.to} className={cx('nav-link', active && 'active')}>{n.label}</Link>;
            })}
          </div>
          <div className="row gap-8 nav-cta">
            <Link to="/shop?deals=1" className="pill red" style={{ height: 36, padding: '0 16px', fontSize: 14, fontWeight: 600 }}>Deals</Link>
            <Button variant="teal" icon="stethoscope" to="/specialists">Book a vet</Button>
            <div className="show-sm" style={{ marginTop: 6, display: 'flex', justifyContent: 'center', width: '100%' }}>
              <ThemeToggle mode="segmented" />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

// Editable from the admin console (Announcement bar); see lib/announcement.js for the defaults.
function Announcement() {
  const config = useAnnouncementConfig();
  return <AnnouncementBar config={config} />;
}

export function TrustRow() {
  return (
    <Reveal className="trust-row" stagger>
      {TRUST.map((t) => (
        <div key={t.title} className="row gap-12">
          <span className="well round white"><Icon name={t.icon} size={17} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
            <div className="sub" style={{ fontSize: 12 }}>{t.text}</div>
          </div>
        </div>
      ))}
    </Reveal>
  );
}

function Footer() {
  const { toast } = useStore();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await subscribeNewsletter(email, 'footer');
    setBusy(false);
    if (res.ok) { toast('Thanks — your 10% code is on its way'); setEmail(''); }
    else if (res.reason === 'email') toast('That email address doesn’t look right', { tone: 'error' });
    else if (res.reason === 'permission') toast('Sign-up isn’t switched on yet — add a rule for the newsletter collection', { tone: 'error', duration: 7000 });
    else toast('Couldn’t sign you up — please try again', { tone: 'error' });
  };
  return (
    <footer className="site-footer">
      <div className="container">
        <TrustRow />
        <div className="footer-main">
          <div className="footer-brand">
            <div className="logo-word" style={{ fontSize: 20 }}>PET MAYA</div>
            <div className="eyebrow" style={{ marginTop: 14 }}>Veterinary medicine · Pet care</div>
            <p className="muted" style={{ marginTop: 12, maxWidth: 420, fontSize: 14 }}>{BRAND.footerBlurb}</p>
            <div style={{ marginTop: 22, fontWeight: 600, fontSize: 14 }}>Get 10% off your first order</div>
            <div className="sub" style={{ marginTop: 4 }}>Plus a monthly note on pet health. No spam.</div>
            <form className="newsletter" onSubmit={subscribe}>
              <input className="input white" type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
              <button className="btn btn-dark" disabled={busy}>{busy ? 'Signing up…' : 'Subscribe'}</button>
            </form>
          </div>
          <div className="footer-cols">
            <div>
              <div className="eyebrow muted">Shop</div>
              <Link to="/shop/dogs">Dogs</Link><Link to="/shop/cats">Cats</Link>
              <Link to="/shop/prescription">Prescription medicine</Link><Link to="/shop/smart-gear">Smart gear</Link>
              <Link to="/shop?subscribe=1">Subscriptions</Link>
            </div>
            <div>
              <div className="eyebrow muted">Care</div>
              <Link to="/specialists">Book a vet</Link><Link to="/triage">AI Triage</Link>
              <Link to="/gps">GPS Radar</Link><Link to="/halo">Maya Halo collar</Link><Link to="/vault">Health Vault</Link>
              <Link to={BRAND.playStoreUrl} target="_blank" rel="noopener noreferrer">Android app on Google Play</Link>
            </div>
            <div>
              <div className="eyebrow muted">Help</div>
              <Link to="/account/orders">Track order</Link><Link to="/terms_of_service.html">Delivery & returns</Link>
              <Link to="/shop/prescription">Prescriptions</Link><Link to={`mailto:${BRAND.supportEmail}`}>Contact us</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="row gap-8 wrap">
            <span className="sub">We accept</span>
            {['bKash', 'Nagad', 'Visa', 'Mastercard', 'Cash on delivery'].map((p) => <span key={p} className="pay-pill">{p}</span>)}
          </div>
          <div className="sub">
            {BRAND.copyright} · <Link to="/privacy_policy.html">Privacy</Link> · <Link to="/terms_of_service.html">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MinimalHeader() {
  return (
    <header className="site-header">
      <div className="container hdr-row" style={{ minHeight: 74 }}>
        <Logo />
        <span className="row gap-6 teal hide-sm" style={{ fontSize: 13 }}><Icon name="lock" size={14} /> Secure checkout</span>
        <div className="row gap-8" style={{ marginLeft: 'auto' }}>
          <ThemeToggle />
          <AccountButton />
          <Link to="/shop?bag=1" className="row gap-6" style={{ fontSize: 14, fontWeight: 500 }}><Icon name="arrowLeft" size={16} /> Back to bag</Link>
        </div>
      </div>
    </header>
  );
}

export default function SiteLayout({ minimal, children }) {
  const { path, query } = useRouter();
  const { setBagOpen } = useStore();
  // One page_view per URL change (the SPA never reloads, so GTM's own page view would fire only once).
  const search = query.toString();
  useEffect(() => { const t = setTimeout(() => trackPageView(path, search), 120); return () => clearTimeout(t); }, [path, search]);
  useEffect(() => { if (query.get('bag') === '1') setBagOpen(true); }, [query, setBagOpen]);

  return (
    <div className="site">
      <Announcement />
      {minimal ? <MinimalHeader /> : <Header />}
      <main className="site-main">{children}</main>
      <Footer />
      <BagDrawer />
      {!minimal && <CompareDrawer />}
      {!minimal && <AiShoppingAssistant />}
      <Modals />
      <Toasts />
      <ConsentBar />
    </div>
  );
}
