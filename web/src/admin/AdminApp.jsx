import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useRouter, match } from '../lib/router.jsx';
import { Icon, Button, Avatar, Field, ThemeToggle } from '../ui/index.jsx';
import { cx } from '../lib/format.js';
import Toasts from '../site/Toasts.jsx';
import { AdminDataProvider, useAdmin } from './data.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import Inventory from './pages/Inventory.jsx';
import Appointments from './pages/Appointments.jsx';
import Customers from './pages/Customers.jsx';

const ADMIN_ROLES = /^(admin|super ?admin|superadmin)$/i;

const ROUTES = [
  ['/admin', Dashboard, 'Dashboard'],
  ['/admin/orders', Orders, 'Orders'],
  ['/admin/orders/:id', OrderDetail, 'Order'],
  ['/admin/prescriptions', Prescriptions, 'Prescriptions'],
  ['/admin/inventory', Inventory, 'Inventory'],
  ['/admin/appointments', Appointments, 'Appointments'],
  ['/admin/customers', Customers, 'Customers'],
];

function Sidebar({ open, onClose, user }) {
  const { path } = useRouter();
  const { orders, rxQueue } = useAdmin();
  const openOrders = orders.filter((o) => o.status === 'Packing' || o.status === 'Rx review' || o.status === 'In transit').length;
  const nav = [
    ['Operations', [
      ['/admin', 'Dashboard', 'grid'],
      ['/admin/orders', 'Orders', 'bag', openOrders],
      ['/admin/prescriptions', 'Prescriptions', 'file', rxQueue.length],
      ['/admin/inventory', 'Inventory', 'flask'],
    ]],
    ['Care', [
      ['/admin/appointments', 'Appointments', 'calendar'],
      ['/admin/customers', 'Customers', 'user'],
    ]],
  ];
  return (
    <>
      {open && <div className="scrim adm-scrim" onClick={onClose} />}
      <aside className={cx('adm-side', open && 'open')}>
        <Link to="/admin" className="adm-brand">
          <span className="logo-word" style={{ color: '#fff' }}>PET MAYA</span>
          <span className="logo-sub" style={{ color: '#9FD0CF' }}>Admin console</span>
        </Link>
        <nav className="stack" style={{ gap: 22, marginTop: 30 }}>
          {nav.map(([group, items]) => (
            <div key={group}>
              <div className="adm-group">{group}</div>
              {items.map(([to, label, icon, count]) => {
                const active = to === '/admin' ? path === '/admin' : path.startsWith(to);
                return (
                  <Link key={to} to={to} className={cx('adm-link', active && 'active')} onClick={onClose}>
                    <Icon name={icon} size={16} /><span className="grow">{label}</span>
                    {count > 0 && <span className="adm-count">{count}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }} className="stack gap-12">
          <Link to="/" className="adm-link"><Icon name="arrowUpRight" size={16} /> View storefront</Link>
          <div className="adm-user">
            <Avatar name={user?.name || 'Admin'} src={user?.photoUrl} />
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }} className="ellipsis">{user?.name || 'Admin'}</div><div style={{ fontSize: 12, color: '#9FD0CF' }}>{user?.role || 'Preview'}</div></div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu }) {
  const { navigate } = useRouter();
  const { anySample, rxQueue } = useAdmin();
  const { logout } = useAuth() || {};
  const [q, setQ] = useState('');
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('adm-search')?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <header className="adm-top">
      <button className="btn btn-ghost btn-square adm-menu" onClick={onMenu} aria-label="Menu"><Icon name="menu" /></button>
      <form className="searchbar" style={{ flex: 1, maxWidth: 520, height: 44 }} onSubmit={(e) => { e.preventDefault(); navigate(`/admin/orders?q=${encodeURIComponent(q)}`); }}>
        <Icon name="search" size={16} />
        <input id="adm-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, customers, SKUs…" aria-label="Search" />
        <span className="kbd hide-sm">⌘K</span>
      </form>
      <div className="row gap-10" style={{ marginLeft: 'auto' }}>
        <span className={cx('pill', anySample ? 'yellow' : 'teal')} title={anySample ? 'Some collections are empty — showing sample data there' : 'Connected to Firestore'}>
          <Icon name="pulse" size={12} /> {anySample ? 'Sample data' : 'Live data'}
        </span>
        <ThemeToggle />
        <Link to="/admin/prescriptions" className="btn btn-outline btn-square" style={{ position: 'relative' }} aria-label={`${rxQueue.length} prescriptions waiting`}>
          <Icon name="bell" size={17} />
          {rxQueue.length > 0 && <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />}
        </Link>
        {logout && <button className="btn btn-ghost btn-square hide-sm" onClick={logout} aria-label="Sign out" title="Sign out"><Icon name="logout" size={17} /></button>}
      </div>
    </header>
  );
}

function Gate({ children }) {
  const { currentUser, loading, loginWithEmail, loginWithGoogle, logout } = useAuth();
  const [preview, setPreview] = useState(() => import.meta.env.DEV && (new URLSearchParams(window.location.search).has('preview') || sessionStorage.getItem('pm_admin_preview') === '1'));
  useEffect(() => { if (preview) sessionStorage.setItem('pm_admin_preview', '1'); }, [preview]);
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const isAdmin = currentUser && ADMIN_ROLES.test(String(currentUser.role || '').trim());
  const canPreview = import.meta.env.DEV;

  if (loading) return <div className="adm-gate"><div className="skeleton" style={{ width: 320, height: 200 }} /></div>;
  if (isAdmin || (preview && canPreview)) return children(isAdmin ? currentUser : { name: 'Preview', role: 'Sample data' });

  return (
    <div className="adm-gate">
      <div className="card" style={{ width: 'min(420px, 100%)', padding: 32, borderRadius: 28 }}>
        <span className="logo-word">PET MAYA</span>
        <div className="logo-sub" style={{ marginTop: 4 }}>Admin console</div>
        {currentUser && !String(currentUser.uid).startsWith('demo_guest') ? (
          <>
            <h1 className="serif" style={{ fontSize: 28, marginTop: 24 }}>No access</h1>
            <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>You’re signed in as {currentUser.email}, which isn’t an admin account. Ask a super admin to change your role.</p>
            <div className="row gap-8" style={{ marginTop: 20 }}><Button variant="outline" onClick={logout}>Sign out</Button><Button variant="ghost" to="/">Back to store</Button></div>
          </>
        ) : (
          <form className="stack gap-14" style={{ marginTop: 24 }} onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await loginWithEmail(f.email, f.password); } catch { setErr('Email or password is incorrect.'); } }}>
            <h1 className="serif" style={{ fontSize: 28 }}>Sign in</h1>
            <Field label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Field label="Password" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            {err && <div className="red" style={{ fontSize: 13 }}>{err}</div>}
            <Button type="submit" variant="dark" size="lg" block>Sign in</Button>
            <Button variant="outline" block onClick={() => loginWithGoogle().catch(() => setErr('Google sign-in failed.'))}>Continue with Google</Button>
            {canPreview && <button type="button" className="link" style={{ fontSize: 13 }} onClick={() => setPreview(true)}>Preview with sample data (dev only)</button>}
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { path } = useRouter();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);

  let page = null;
  for (const [pattern, Comp, title] of ROUTES) {
    const params = match(pattern, path);
    if (params) { page = { Comp, params, title }; break; }
  }
  useEffect(() => { document.title = `${page?.title || 'Admin'} · Pet Maya Admin`; }, [page?.title]);
  const { Comp = Dashboard, params = {} } = page || {};

  return (
    <Gate>
      {(user) => (
        <AdminDataProvider>
          <div className="adm">
            <Sidebar open={menu} onClose={() => setMenu(false)} user={user} />
            <div className="adm-main">
              <Topbar onMenu={() => setMenu(true)} />
              <main className="adm-content"><Comp params={params} user={user} /></main>
            </div>
          </div>
          <Toasts />
        </AdminDataProvider>
      )}
    </Gate>
  );
}

export function PageHead({ eyebrow, title, children }) {
  return (
    <div className="row between wrap gap-16" style={{ alignItems: 'flex-end', marginBottom: 22 }}>
      <div><div className="eyebrow">{eyebrow}</div><h1 className="adm-title">{title}</h1></div>
      <div className="row gap-8 wrap">{children}</div>
    </div>
  );
}
