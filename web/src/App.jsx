import { lazy, Suspense, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { RouterProvider, useRouter, match } from './lib/router.jsx';
import { StoreProvider } from './lib/store.jsx';
import SiteLayout from './site/SiteLayout.jsx';
import Home from './site/pages/Home.jsx';

// Pages load on demand (Home is the usual landing page, so it ships in the entry).
const Shop = lazy(() => import('./site/pages/Shop.jsx'));
const Product = lazy(() => import('./site/pages/Product.jsx'));
const Checkout = lazy(() => import('./site/pages/Checkout.jsx'));
const OrderTracking = lazy(() => import('./site/pages/OrderTracking.jsx'));
const Specialists = lazy(() => import('./site/pages/Specialists.jsx'));
const Triage = lazy(() => import('./site/pages/Triage.jsx'));
const Gps = lazy(() => import('./site/pages/Gps.jsx'));
const Vault = lazy(() => import('./site/pages/Vault.jsx'));
const PetDashboard = lazy(() => import('./site/pages/PetDashboard.jsx'));
const Profile = lazy(() => import('./site/pages/Profile.jsx'));
const Community = lazy(() => import('./site/pages/Community.jsx'));
const Journal = lazy(() => import('./site/pages/Journal.jsx'));
const SignIn = lazy(() => import('./site/pages/SignIn.jsx'));
const NotFound = lazy(() => import('./site/pages/NotFound.jsx'));
const Admin = lazy(() => import('./admin/AdminApp.jsx'));
// three.js + the 3D collar: loaded only when someone opens /halo
const Halo = lazy(() => import('./site/pages/Halo.jsx'));

const SITE_ROUTES = [
  ['/', Home, 'Pet Maya — Pet medicine, vets & care in one place'],
  ['/shop', Shop, 'Care shop'],
  ['/shop/:category', Shop, 'Care shop'],
  ['/product/:slug/:id', Product, null],
  ['/product/:id', Product, null], // older links without the name
  ['/checkout', Checkout, 'Checkout', { minimal: true }],
  ['/account/orders', OrderTracking, 'Your orders'],
  ['/account/orders/:id', OrderTracking, 'Order status'],
  ['/specialists', Specialists, 'Book a vet'],
  ['/triage', Triage, 'AI symptom triage'],
  ['/gps', Gps, 'GPS radar'],
  ['/halo', Halo, 'Maya Halo GPS collar'],
  ['/vault', Vault, 'Health vault'],
  ['/dashboard', PetDashboard, 'My dashboard'],
  ['/profile', Profile, 'Your profile'],
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
        <Suspense fallback={<div style={{ minHeight: '70vh' }} aria-busy="true" />}>
          <Comp params={params} />
        </Suspense>
      </div>
    </SiteLayout>
  );
}

// After first paint, fetch the most visited pages in the background (idle time only).
const warmRoutes = () => {
  const run = () => ['Shop', 'Product', 'Specialists'].forEach((n) => import(`./site/pages/${n}.jsx`));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 6000 }); else setTimeout(run, 4000);
};

export default function App() {
  useEffect(() => {
    if (document.readyState === 'complete') warmRoutes();
    else window.addEventListener('load', warmRoutes, { once: true });
  }, []);
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <RouterProvider>
            <StoreProvider>
              <Routes />
            </StoreProvider>
          </RouterProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
