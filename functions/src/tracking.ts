/**
 * Server-side analytics: pure helpers (validation, hashing, payload builders) used by the `collect`
 * endpoint and the order trigger in index.ts. Network calls live in index.ts so these stay unit-testable.
 */
import * as crypto from "crypto";

export const EVENT_NAMES = [
  "page_view", "view_item", "view_item_list", "add_to_cart", "begin_checkout",
  "purchase", "search", "sign_up", "login", "generate_lead",
] as const;
export type EventName = typeof EVENT_NAMES[number];

/** GA4 name → Meta Conversions API name. */
export const META_EVENT: Record<EventName, string> = {
  page_view: "PageView", view_item: "ViewContent", view_item_list: "ViewContent", add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout", purchase: "Purchase", search: "Search", sign_up: "CompleteRegistration",
  login: "CustomEvent", generate_lead: "Lead",
};

export const ALLOWED_HOSTS = [
  "www.petmaya.app", "petmaya.app", "pet-maya.web.app", "pet-maya.firebaseapp.com", "localhost", "127.0.0.1",
];

export interface Item { item_id: string; item_name: string; price: number; quantity: number; item_category?: string }
export interface Consent { analytics: boolean; ads: boolean }
export interface CleanEvent {
  name: EventName;
  eventId: string;
  eventTime: number; // seconds
  url: string;
  title: string;
  clientId: string;
  sessionId?: string;
  fbp?: string;
  fbc?: string;
  consent: Consent;
  currency?: string;
  value?: number;
  transactionId?: string;
  searchTerm?: string;
  items: Item[];
}

export const sha256 = (v: string): string => crypto.createHash("sha256").update(v).digest("hex");

/** Meta/Google both want trimmed, lower-cased values hashed with SHA-256. */
export const hashEmail = (v: unknown): string | undefined => {
  const s = String(v ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? sha256(s) : undefined;
};

/** Digits only, with Bangladesh's country code (880) when a local number is given. */
export const hashPhone = (v: unknown): string | undefined => {
  let d = String(v ?? "").replace(/\D+/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "880" + d.slice(1);
  else if (d.length === 10 && d.startsWith("1")) d = "880" + d;
  return d.length >= 10 && d.length <= 15 ? sha256(d) : undefined;
};

const clip = (v: unknown, max: number): string => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.round(n * 100) / 100 : undefined;
};

/** Returns the URL only if it is an https/http page on one of our hosts. */
export function safePageUrl(v: unknown): string {
  try {
    const u = new URL(String(v ?? ""));
    if (!ALLOWED_HOSTS.includes(u.hostname)) return "";
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.origin + u.pathname + u.search.slice(0, 200);
  } catch { return ""; }
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // sendBeacon from same origin may omit it; the host allow-list on page_location still applies
  try { return ALLOWED_HOSTS.includes(new URL(origin).hostname); } catch { return false; }
}

export function cleanItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map((i: any) => ({
    item_id: clip(i?.item_id ?? i?.id, 80),
    item_name: clip(i?.item_name ?? i?.name, 120),
    price: num(i?.price) ?? 0,
    quantity: Math.min(999, Math.max(1, Math.round(Number(i?.quantity ?? i?.qty ?? 1)) || 1)),
    ...(i?.item_category ? { item_category: clip(i.item_category, 60) } : {}),
  })).filter((i) => i.item_id);
}

/** Validates an untrusted browser payload. Returns null when it should be dropped. */
export function cleanEvent(body: any, nowMs = Date.now()): CleanEvent | null {
  if (!body || typeof body !== "object") return null;
  const name = body.name as EventName;
  if (!EVENT_NAMES.includes(name)) return null;
  const eventId = clip(body.event_id, 64);
  if (!/^[A-Za-z0-9_.:-]{8,64}$/.test(eventId)) return null;
  const clientId = clip(body.client_id, 64);
  if (!/^[A-Za-z0-9_.-]{6,64}$/.test(clientId)) return null;
  const p = body.params && typeof body.params === "object" ? body.params : {};
  const currency = clip(p.currency, 3).toUpperCase();
  const fbp = clip(body.fbp, 80);
  const fbc = clip(body.fbc, 200);
  return {
    name,
    eventId,
    eventTime: Math.floor(nowMs / 1000),
    url: safePageUrl(body.page_location),
    title: clip(body.page_title, 150),
    clientId,
    sessionId: /^\d{6,12}$/.test(clip(body.session_id, 12)) ? clip(body.session_id, 12) : undefined,
    fbp: /^fb\.\d\.\d+\.\d+$/.test(fbp) ? fbp : undefined,
    fbc: /^fb\.\d\.\d+\.[\w-]+$/.test(fbc) ? fbc : undefined,
    consent: { analytics: body.consent?.analytics === true, ads: body.consent?.ads === true },
    currency: /^[A-Z]{3}$/.test(currency) ? currency : undefined,
    value: num(p.value),
    transactionId: p.transaction_id ? clip(p.transaction_id, 64) : undefined,
    searchTerm: p.search_term ? clip(p.search_term, 100) : undefined,
    items: cleanItems(p.items),
  };
}

export function parseEventList(csv: string | undefined, fallback: string[]): "*" | string[] {
  const parts = String(csv ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.includes("*")) return "*";
  return parts.length ? parts : fallback;
}

export const shouldSendToGa4 = (list: "*" | string[], e: Pick<CleanEvent, "name" | "consent">) =>
  e.consent.analytics && (list === "*" || list.includes(e.name));

export interface UserHints { ip?: string; ua?: string; email?: string; phone?: string; externalId?: string }

/** GA4 Measurement Protocol body. */
export function buildGa4Body(e: CleanEvent, u: UserHints) {
  const params: Record<string, unknown> = {
    engagement_time_msec: 1,
    ...(e.sessionId ? { session_id: e.sessionId } : {}),
    ...(e.url ? { page_location: e.url } : {}),
    ...(e.title ? { page_title: e.title } : {}),
    ...(e.currency ? { currency: e.currency } : {}),
    ...(e.value !== undefined ? { value: e.value } : {}),
    ...(e.transactionId ? { transaction_id: e.transactionId } : {}),
    ...(e.searchTerm ? { search_term: e.searchTerm } : {}),
    ...(e.items.length ? { items: e.items } : {}),
  };
  return {
    client_id: e.clientId,
    ...(u.externalId ? { user_id: u.externalId } : {}),
    timestamp_micros: e.eventTime * 1_000_000,
    non_personalized_ads: !e.consent.ads,
    consent: { ad_user_data: e.consent.ads ? "GRANTED" : "DENIED", ad_personalization: e.consent.ads ? "GRANTED" : "DENIED" },
    events: [{ name: e.name, params }],
  };
}

/**
 * Measurement Protocol body for a *server* GTM container (its GA4 client accepts /mp/collect). On top of the
 * GA4 body it carries what the server tags need: the shared event_id (Meta de-duplication), fbp/fbc, the
 * visitor's IP and user agent, hashed contact data, and ads_consent so a Meta/Ads tag can be told not to fire.
 */
export function buildSgtmBody(e: CleanEvent, u: UserHints) {
  const body = buildGa4Body(e, u);
  const em = e.consent.ads ? hashEmail(u.email) : undefined;
  const ph = e.consent.ads ? hashPhone(u.phone) : undefined;
  const extra = {
    event_id: e.eventId,
    ads_consent: e.consent.ads ? "granted" : "denied",
    ...(e.fbp ? { fbp: e.fbp } : {}),
    ...(e.fbc ? { fbc: e.fbc } : {}),
    ...(u.ip ? { ip_override: u.ip } : {}),
    ...(u.ua ? { user_agent: u.ua } : {}),
  };
  return {
    ...body,
    ...(em || ph ? { user_data: { ...(em ? { sha256_email_address: [em] } : {}), ...(ph ? { sha256_phone_number: [ph] } : {}) } } : {}),
    events: [{ name: e.name, params: { ...body.events[0].params, ...extra } }],
  };
}

/** Meta Conversions API body (one event). Only called with ad consent. */
export function buildMetaBody(e: CleanEvent, u: UserHints, testCode?: string) {
  const userData: Record<string, unknown> = {
    ...(u.ip ? { client_ip_address: u.ip } : {}),
    ...(u.ua ? { client_user_agent: u.ua } : {}),
    ...(e.fbp ? { fbp: e.fbp } : {}),
    ...(e.fbc ? { fbc: e.fbc } : {}),
    ...(hashEmail(u.email) ? { em: [hashEmail(u.email)] } : {}),
    ...(hashPhone(u.phone) ? { ph: [hashPhone(u.phone)] } : {}),
    ...(u.externalId ? { external_id: [u.externalId] } : {}),
  };
  const custom: Record<string, unknown> = {
    ...(e.currency ? { currency: e.currency } : {}),
    ...(e.value !== undefined ? { value: e.value } : {}),
    ...(e.searchTerm ? { search_string: e.searchTerm } : {}),
    ...(e.items.length ? {
      content_type: "product",
      content_ids: e.items.map((i) => i.item_id),
      contents: e.items.map((i) => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
      num_items: e.items.reduce((n, i) => n + i.quantity, 0),
    } : {}),
    ...(e.transactionId ? { order_id: e.transactionId } : {}),
  };
  return {
    data: [{
      event_name: META_EVENT[e.name],
      event_time: e.eventTime,
      event_id: e.eventId,
      action_source: "website",
      ...(e.url ? { event_source_url: e.url } : {}),
      user_data: userData,
      custom_data: custom,
    }],
    ...(testCode ? { test_event_code: testCode } : {}),
  };
}

/** Small in-memory per-IP limiter (per function instance): blunts floods without a database write per event. */
export class IpLimiter {
  private hits = new Map<string, { start: number; count: number }>();
  constructor(private limit = 120, private windowMs = 60_000) {}
  allow(key: string, now = Date.now()): boolean {
    if (this.hits.size > 5000) this.hits.clear();
    const h = this.hits.get(key);
    if (!h || now - h.start >= this.windowMs) { this.hits.set(key, { start: now, count: 1 }); return true; }
    h.count += 1;
    return h.count <= this.limit;
  }
}

export function clientIp(xff: string | undefined, fallback: string | undefined): string {
  const first = String(xff ?? "").split(",")[0].trim();
  return first || fallback || "";
}
