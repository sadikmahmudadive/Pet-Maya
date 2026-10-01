import { useEffect, useState } from 'react';
import { Link, useRouter } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { Icon, Button } from '../ui/index.jsx';
import { money, cx } from '../lib/format.js';
import { useScrolled, useBump, Reveal } from '../lib/motion.jsx';
import { subscribeNewsletter } from '../data/actions.js';
import { ANNOUNCEMENTS, TRUST, BRAND } from '../data/content.js';
import BagDrawer from './BagDrawer.jsx';
import NotificationBell from './NotificationBell.jsx';
import Toasts from './Toasts.jsx';

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
  const { totals, setBagOpen, user } = useStore();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const scrolled = useScrolled(10);
  const bump = useBump(totals.count);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('site-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e) => {
    e.preventDefault();
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
          <form className="searchbar hdr-search hide-sm" onSubmit={submit} role="search">
            <Icon name="search" size={17} />
            <input id="site-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search medicine, food, brands or vets…" aria-label="Search" />
            <span className="kbd">⌘K</span>
          </form>
          <div className="row gap-4 hdr-actions">
            <Link to="/shop?saved=1" className="btn btn-ghost btn-square hide-sm" aria-label="Saved items"><Icon name="heart" /></Link>
            <NotificationBell />
            <Link to={user ? '/dashboard' : '/signin'} className="btn btn-ghost btn-square" aria-label={user ? 'Your account' : 'Sign in'}><Icon name="user" /></Link>
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
            {[...NAV, { to: '/dashboard', label: 'Dashboard', icon: 'grid' }].map((n) => {
              const active = n.match ? n.match(path) : path === n.to;
              return <Link key={n.to} to={n.to} className={cx('nav-link', active && 'active', n.icon && 'nav-admin')}>{n.icon && <Icon name={n.icon} size={14} />}{n.label}</Link>;
            })}
          </div>
          <div className="row gap-8 nav-cta">
            <Link to="/shop?deals=1" className="pill red" style={{ height: 36, padding: '0 16px', fontSize: 14, fontWeight: 600 }}>Deals</Link>
            <Button variant="teal" icon="video" to="/specialists">Book a vet</Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Announcement() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % ANNOUNCEMENTS.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="announce">
      <div className="container row between">
        <span key={i} className="announce-text">{ANNOUNCEMENTS[i]}</span>
        <Link to="/account/orders" className="announce-text">Track order →</Link>
      </div>
    </div>
  );
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
              <Link to="/gps">GPS Radar</Link><Link to="/vault">Health Vault</Link>
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
        <Link to="/shop?bag=1" className="row gap-6" style={{ fontSize: 14, fontWeight: 500 }}><Icon name="arrowLeft" size={16} /> Back to bag</Link>
      </div>
    </header>
  );
}

export default function SiteLayout({ minimal, children }) {
  const { query } = useRouter();
  const { setBagOpen } = useStore();
  useEffect(() => { if (query.get('bag') === '1') setBagOpen(true); }, [query, setBagOpen]);

  return (
    <div className="site">
      <Announcement />
      {minimal ? <MinimalHeader /> : <Header />}
      <main className="site-main">{children}</main>
      <Footer />
      <BagDrawer />
      <Toasts />
    </div>
  );
}
