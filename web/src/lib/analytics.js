// Google Tag Manager + server-side tracking.
//
//   track('add_to_cart', {...})  →  1. window.dataLayer (picked up by the GTM web container: GA4, Ads, Meta pixel…)
//                                   2. POST /collect (first-party; a Cloud Function forwards to Meta CAPI / GA4
//                                      with the same event_id so nothing is counted twice)
//
// Config (web/.env):  VITE_GTM_ID=GTM-XXXXXXX         — leave empty to disable the browser side
//                     VITE_SERVER_TRACKING=0|1        — default: on in production builds
//
// Consent: ads (marketing) is OFF until the visitor accepts; analytics follows Do-Not-Track. Global Privacy
// Control forces ads off. Consent Mode v2 signals are sent to GTM so Google tags honour the choice.

const GTM_ID = String(import.meta.env.VITE_GTM_ID || '').trim();
const SERVER_ON = import.meta.env.VITE_SERVER_TRACKING === '1' || (import.meta.env.PROD && import.meta.env.VITE_SERVER_TRACKING !== '0');
const CONSENT_KEY = 'pm_consent';
const CID_KEY = 'pm_cid';

const w = typeof window !== 'undefined' ? window : null;
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

// ── consent ────────────────────────────────────────────────────────────────────────────────────────
const dnt = () => safe(() => navigator.doNotTrack === '1' || w.doNotTrack === '1', false);
const gpc = () => safe(() => navigator.globalPrivacyControl === true, false);

export function getConsent() {
  const stored = safe(() => JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'), null);
  return {
    decided: !!stored,
    analytics: !dnt() && (stored ? stored.analytics !== false : true),
    ads: !gpc() && !dnt() && stored?.ads === true,
  };
}

// GTM only understands gtag commands pushed as the `arguments` object (an array is ignored).
function gtag() { if (w) (w.dataLayer = w.dataLayer || []).push(arguments); }

const consentSignals = (c) => ({
  analytics_storage: c.analytics ? 'granted' : 'denied',
  ad_storage: c.ads ? 'granted' : 'denied',
  ad_user_data: c.ads ? 'granted' : 'denied',
  ad_personalization: c.ads ? 'granted' : 'denied',
});

export function setConsent({ analytics = true, ads = false }) {
  safe(() => localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, ads, ts: Date.now() })));
  gtag('consent', 'update', consentSignals(getConsent()));
  w?.dispatchEvent(new Event('pm-consent'));
}

// ── identifiers (GA client/session ids and Meta cookies, so server events join the browser's) ──────
const cookie = (name) => safe(() => (document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')) || [])[1] || '', '');

function clientId() {
  const ga = cookie('_ga').split('.');
  if (ga.length >= 4) return `${ga[2]}.${ga[3]}`;
  let id = safe(() => localStorage.getItem(CID_KEY));
  if (!id) {
    id = `${Math.floor(Math.random() * 2 ** 31)}.${Math.floor(Date.now() / 1000)}`;
    safe(() => localStorage.setItem(CID_KEY, id));
  }
  return id;
}

function sessionId() {
  const m = safe(() => document.cookie.split('; ').find((c) => c.startsWith('_ga_')) || '', '');
  const hit = m.match(/GS1\.\d\.(\d{6,12})/) || m.match(/GS2\.\d\.s(\d{6,12})/);
  return hit ? hit[1] : undefined;
}

function metaClickId() {
  const fbc = decodeURIComponent(cookie('_fbc') || '');
  if (fbc) return fbc;
  const id = safe(() => new URLSearchParams(location.search).get('fbclid'), null);
  return id ? `fb.1.${Date.now()}.${id}` : undefined;
}

const newEventId = (name) => `${name}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Browser context stored on an order so the server can attribute the purchase after the fact. */
export function trackContext() {
  try {
    const c = getConsent();
    const ctx = {
      cid: clientId(), sid: sessionId(), fbp: cookie('_fbp') || undefined, fbc: metaClickId(),
      ua: safe(() => navigator.userAgent.slice(0, 300)), url: safe(() => location.href.split('#')[0]),
      consent: { analytics: c.analytics, ads: c.ads },
    };
    // Firestore rejects `undefined` values, which would fail the whole order: keep only real values.
    return Object.fromEntries(Object.entries(ctx).filter(([, v]) => v !== undefined && v !== ''));
  } catch {
    return {};
  }
}

// ── GTM loader ─────────────────────────────────────────────────────────────────────────────────────
let started = false;
export function initAnalytics() {
  if (!w || started) return;
  started = true;
  w.dataLayer = w.dataLayer || [];
  gtag('consent', 'default', { ...consentSignals(getConsent()), wait_for_update: 500 });
  if (!GTM_ID || !/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return;
  const load = () => {
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(s);
  };
  // Never compete with the first paint: start once the page has loaded and the browser is idle.
  const idle = () => ('requestIdleCallback' in w ? w.requestIdleCallback(load, { timeout: 4000 }) : setTimeout(load, 2000));
  if (document.readyState === 'complete') idle(); else w.addEventListener('load', idle, { once: true });
}

// ── events ─────────────────────────────────────────────────────────────────────────────────────────
const ECOMMERCE = new Set(['view_item', 'view_item_list', 'add_to_cart', 'begin_checkout', 'purchase']);

/** Maps a store product / cart line to the GA4 item shape. */
export const toItem = (p, qty) => ({
  item_id: String(p?.id ?? p?.item_id ?? ''),
  item_name: String(p?.name ?? p?.item_name ?? '').slice(0, 120),
  price: Number(p?.price) || 0,
  quantity: Math.max(1, Number(qty ?? p?.qty ?? p?.quantity) || 1),
  ...(p?.category ? { item_category: String(p.category).slice(0, 60) } : {}),
});

function sendToServer(name, eventId, params) {
  if (!SERVER_ON || name === 'purchase' || !w) return; // purchases are recorded from the order itself
  const c = getConsent();
  if (!c.analytics && !c.ads) return;
  const payload = JSON.stringify({
    name, event_id: eventId, client_id: clientId(), session_id: sessionId(),
    page_location: location.href.split('#')[0], page_title: document.title,
    fbp: cookie('_fbp') || undefined, fbc: metaClickId(),
    consent: { analytics: c.analytics, ads: c.ads }, params,
  });
  safe(() => {
    if (navigator.sendBeacon && navigator.sendBeacon('/collect', new Blob([payload], { type: 'text/plain' }))) return;
    fetch('/collect', { method: 'POST', body: payload, headers: { 'content-type': 'text/plain' }, keepalive: true, credentials: 'omit' }).catch(() => {});
  });
}

export function track(name, params = {}, eventId = newEventId(name)) {
  if (!w) return eventId;
  const dl = (w.dataLayer = w.dataLayer || []);
  if (ECOMMERCE.has(name)) {
    dl.push({ ecommerce: null }); // clear the previous ecommerce object (GTM recommendation)
    dl.push({ event: name, event_id: eventId, ecommerce: { currency: 'BDT', ...params } });
  } else {
    dl.push({ event: name, event_id: eventId, ...params });
  }
  sendToServer(name, eventId, { currency: 'BDT', ...params });
  return eventId;
}

let lastView = '';
/** SPA page view: one per distinct URL (React StrictMode and re-renders must not double count). */
export function trackPageView(path, search = '') {
  const key = path + search;
  if (key === lastView) return;
  lastView = key;
  track('page_view', { page_location: location.href.split('#')[0], page_path: path, page_title: document.title });
}
