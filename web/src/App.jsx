import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { RouterProvider, useRouter, match } from './lib/router.jsx';
import { StoreProvider } from './lib/store.jsx';
import SiteLayout from './site/SiteLayout.jsx';
import Home from './site/pages/Home.jsx';
import Shop from './site/pages/Shop.jsx';
import Product from './site/pages/Product.jsx';
import Checkout from './site/pages/Checkout.jsx';
import OrderTracking from './site/pages/OrderTracking.jsx';
import Specialists from './site/pages/Specialists.jsx';
import Triage from './site/pages/Triage.jsx';
import Gps from './site/pages/Gps.jsx';
import Vault from './site/pages/Vault.jsx';
import PetDashboard from './site/pages/PetDashboard.jsx';
import Community from './site/pages/Community.jsx';
import Journal from './site/pages/Journal.jsx';
import SignIn from './site/pages/SignIn.jsx';
import NotFound from './site/pages/NotFound.jsx';

const Admin = lazy(() => import('./admin/AdminApp.jsx'));

const SITE_ROUTES = [
  ['/', Home, 'Pet Maya — Pet medicine, vets & care in one place'],
  ['/shop', Shop, 'Care shop'],
  ['/shop/:category', Shop, 'Care shop'],
  ['/product/:id', Product, null],
  ['/checkout', Checkout, 'Checkout', { minimal: true }],
  ['/account/orders', OrderTracking, 'Your orders'],
  ['/account/orders/:id', OrderTracking, 'Order status'],
  ['/specialists', Specialists, 'Book a vet'],
  ['/triage', Triage, 'AI symptom triage'],
  ['/gps', Gps, 'GPS radar'],
  ['/vault', Vault, 'Health vault'],
  ['/dashboard', PetDashboard, 'My dashboard'],
  ['/community', Community, 'Community'],
  ['/journal', Journal, 'Journal'],
  ['/journal/:id', Journal, 'Journal'],
  ['/signin', SignIn, 'Sign in'],
];

function Routes() {
  const { path } = useRouter();

  const isAdmin = path === '/admin' || path.startsWith('/admin/') || window.location.hostname.startsWith('admin.');

  let page = null;
  if (!isAdmin) {
    for (const [pattern, Comp, title, opts] of SITE_ROUTES) {
      const params = match(pattern, path);
      if (params) { page = { Comp, params, title, opts: opts || {} }; break; }
    }
  }

  useEffect(() => {
    if (page?.title) document.title = page.title.startsWith('Pet Maya') ? page.title : `${page.title} · Pet Maya`;
  }, [page?.title]);

  if (isAdmin) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <Admin />
      </Suspense>
    );
  }

  const { Comp = NotFound, params = {}, opts = {} } = page || {};
  return (
    <SiteLayout minimal={opts.minimal}>
      <div key={path} className="page-enter">
        <Comp params={params} />
      </div>
    </SiteLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <StoreProvider>
          <Routes />
        </StoreProvider>
      </RouterProvider>
    </AuthProvider>
  );
}
