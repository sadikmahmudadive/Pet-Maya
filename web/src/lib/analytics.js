// Google Tag Manager + server-side tracking.
//
//   track('add_to_cart', {...})  →  1. window.dataLayer (picked up by the GTM web container: GA4, Ads…)
//                                   2. Meta Pixel (browser; loaded only with ad consent)
//                                   3. POST /collect (first-party; a Cloud Function forwards to Meta CAPI / GA4
//                                      with the same event_id so nothing is counted twice)
//
// Config (web/.env):  VITE_GTM_ID=GTM-XXXXXXX         — leave empty to disable the browser side
//                     VITE_META_PIXEL_ID=…            — Meta Pixel id (public); set 0 to disable the browser pixel
//                     VITE_SERVER_TRACKING=0|1        — default: on in production builds
// The Meta Pixel is loaded here, so do NOT also add a Meta Pixel tag in GTM (it would count events twice).
//
// Consent: ads (marketing) is OFF until the visitor accepts; analytics follows Do-Not-Track. Global Privacy
// Control forces ads off. Consent Mode v2 signals are sent to GTM so Google tags honour the choice.

const GTM_ID = String(import.meta.env.VITE_GTM_ID || '').trim();
const META_PIXEL_ID = String(import.meta.env.VITE_META_PIXEL_ID ?? '1423036852741048').trim();
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
  syncMeta();
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

// ── Meta Pixel (browser) ───────────────────────────────────────────────────────────────────────────
// Same as Meta's snippet, minus the inline script (CSP) and the automatic PageView (we send our own, with an
// event_id the server's Conversions API call reuses, so Meta de-duplicates the pair).
const META_EVENT = {
  page_view: 'PageView', view_item: 'ViewContent', view_item_list: 'ViewContent', add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout', purchase: 'Purchase', search: 'Search', sign_up: 'CompleteRegistration',
  generate_lead: 'Lead',
};
const META_ON = /^\d{6,20}$/.test(META_PIXEL_ID);
let metaStarted = false;

function startMeta() {
  if (metaStarted || !META_ON || !w) return;
  metaStarted = true;
  if (!w.fbq) {
    const n = (w.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  }
  w.fbq('init', META_PIXEL_ID);
  const load = () => {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  };
  const idle = () => ('requestIdleCallback' in w ? w.requestIdleCallback(load, { timeout: 4000 }) : setTimeout(load, 2000));
  if (document.readyState === 'complete') idle(); else w.addEventListener('load', idle, { once: true });
}

/** Starts the pixel once ads are allowed; revokes it again if the visitor withdraws consent. */
function syncMeta() {
  if (!META_ON || !w) return;
  if (getConsent().ads) { startMeta(); w.fbq?.('consent', 'grant'); } else if (metaStarted) w.fbq?.('consent', 'revoke');
}

function metaData(params) {
  const items = Array.isArray(params.items) ? params.items : [];
  return {
    ...(params.currency ? { currency: params.currency } : {}),
    ...(params.value !== undefined ? { value: params.value } : {}),
    ...(params.search_term ? { search_string: params.search_term } : {}),
    ...(items.length ? {
      content_type: 'product',
      content_ids: items.map((i) => i.item_id),
      contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
      num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
    } : {}),
  };
}

function sendToMeta(name, eventId, params) {
  if (!metaStarted || !w.fbq || !getConsent().ads) return;
  const metaName = META_EVENT[name];
  safe(() => (metaName
    ? w.fbq('track', metaName, metaData(params), { eventID: eventId })
    : w.fbq('trackCustom', name, metaData(params), { eventID: eventId })));
}

// ── GTM loader ─────────────────────────────────────────────────────────────────────────────────────
let started = false;
export function initAnalytics() {
  if (!w || started) return;
  started = true;
  w.dataLayer = w.dataLayer || [];
  gtag('consent', 'default', { ...consentSignals(getConsent()), wait_for_update: 500 });
  syncMeta();
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
  const data = { currency: 'BDT', ...params };
  sendToMeta(name, eventId, data);
  sendToServer(name, eventId, data);
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
