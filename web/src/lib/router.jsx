import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

// Tiny history-API router. Firebase Hosting / Vercel already rewrite every path to index.html.

const RouterCtx = createContext({ path: '/', query: new URLSearchParams(), navigate: () => {} });

// Old URLs from the previous site keep working.
const LEGACY = {
  '/ai-pet-care': '/triage', '/ai': '/triage', '/wellness': '/triage',
  '/pet-gps': '/gps', '/tracker': '/gps', '/connected-care': '/gps',
  '/digital-pet-passport': '/vault', '/profile': '/vault', '/vaccines': '/vault',
  '/vets': '/specialists', '/book-vet': '/specialists', '/for-veterinarians': '/specialists', '/for-clinics': '/specialists',
  '/login': '/signin', '/auth': '/signin', '/signup': '/signin?mode=signup',
  '/blog': '/journal', '/gazette': '/journal', '/pet-health': '/journal', '/pet-care': '/journal',
  '/features': '/', '/for-pet-parents': '/', '/landing': '/',
  '/cart': '/shop?bag=1', '/orders': '/account/orders', '/tracking': '/account/orders',
  '/food': '/shop/food', '/privacy': '/privacy-policy', '/terms': '/terms-of-service',
};

function normalize(pathname) {
  let p = pathname.replace(/\/+$/, '') || '/';
  if (LEGACY[p]) return LEGACY[p];
  const m = p.match(/^\/(?:shop-product|product)\/(.+)$/);
  if (m) return `/product/${m[1]}`;
  return null;
}

function readLocation() {
  return { path: window.location.pathname.replace(/\/+$/, '') || '/', search: window.location.search };
}

export function RouterProvider({ children }) {
  const [loc, setLoc] = useState(readLocation);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (to === window.location.pathname + window.location.search) return;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
    setLoc(readLocation());
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, []);

  useEffect(() => {
    const fixed = normalize(window.location.pathname);
    if (fixed && fixed !== window.location.pathname) navigate(fixed, { replace: true });
    const onPop = () => setLoc(readLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [navigate]);

  // Hard reload for the static legal pages served outside the SPA.
  useEffect(() => {
    if (loc.path === '/privacy-policy' || loc.path === '/terms-of-service') {
      window.location.replace(loc.path === '/privacy-policy' ? '/privacy_policy.html' : '/terms_of_service.html');
    }
  }, [loc.path]);

  const value = useMemo(() => ({
    path: loc.path,
    query: new URLSearchParams(loc.search),
    navigate,
  }), [loc, navigate]);

  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

export function useRouter() {
  return useContext(RouterCtx);
}

/** Match "/product/:id" against a path → params object or null. */
export function match(pattern, path) {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function Link({ to, children, onClick, replace, ...rest }) {
  const { navigate } = useRouter();
  const external = /^(https?:|mailto:|tel:)/.test(to) || to?.endsWith('.html') || rest.target === '_blank';
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || external || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to, { replace });
      }}
    >
      {children}
    </a>
  );
}
