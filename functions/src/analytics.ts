/**
 * Server-side tracking.
 *
 *  • collect         — first-party endpoint (POST /collect on the website). The browser sends the same events it
 *                      pushes to Google Tag Manager, with the same event_id. We validate them, add what only a
 *                      server knows (IP, user agent) and forward to Meta Conversions API (when the visitor
 *                      allowed ads) and, for the events in GA4_SERVER_EVENTS, to GA4 Measurement Protocol.
 *  • track_purchase  — fires when an order document is created, so revenue comes from the database, not from
 *                      whatever a browser claims. Uses the same event_id (the order id) as the browser's
 *                      dataLayer push, so Meta and GA4 de-duplicate it.
 *
 * Secrets:  firebase functions:secrets:set GA4_API_SECRET   (GA4 → Admin → Data streams → Measurement Protocol)
 *           firebase functions:secrets:set META_CAPI_TOKEN  (Events Manager → Settings → Conversions API)
 * Config:   functions/.env  →  GA4_MEASUREMENT_ID, META_PIXEL_ID, GA4_SERVER_EVENTS, META_TEST_EVENT_CODE
 */
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import {
  CleanEvent, IpLimiter, buildGa4Body, buildMetaBody, cleanEvent, cleanItems, clientIp, isAllowedOrigin,
  parseEventList, sha256, shouldSendToGa4, UserHints,
} from "./tracking";

const GA4_API_SECRET = defineSecret("GA4_API_SECRET");
const GA4_MEASUREMENT_ID = defineString("GA4_MEASUREMENT_ID", { default: "G-WSN2ZQE4PF" });
const META_PIXEL_ID = defineString("META_PIXEL_ID", { default: "" });
const GA4_SERVER_EVENTS = defineString("GA4_SERVER_EVENTS", { default: "purchase" });
const META_TEST_EVENT_CODE = defineString("META_TEST_EVENT_CODE", { default: "" });

// Meta is opt-in: the CAPI token secret is bound (and required at deploy) only once META_PIXEL_ID is set in
// functions/.env. Until then the functions deploy and run with GA4 only.
const META_ENABLED = !!(process.env.META_PIXEL_ID || "").trim();
// defineSecret registers the secret with the deploy tool, so it must not even be declared while Meta is off.
const META_CAPI_TOKEN = META_ENABLED ? defineSecret("META_CAPI_TOKEN") : null;
const SECRETS = META_CAPI_TOKEN ? [GA4_API_SECRET, META_CAPI_TOKEN] : [GA4_API_SECRET];

const limiter = new IpLimiter(120, 60_000);

async function postJson(url: string, body: unknown, label: string): Promise<void> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    if (!r.ok) console.warn(`[tracking] ${label} responded ${r.status}`);
  } catch (e: any) {
    console.warn(`[tracking] ${label} failed: ${e?.name || "error"}`); // never log URLs: they contain the secret
  } finally { clearTimeout(t); }
}

/** Sends one validated event to every destination the visitor's consent and our config allow. */
export async function forward(e: CleanEvent, u: UserHints): Promise<{ ga4: boolean; meta: boolean }> {
  const sent = { ga4: false, meta: false };
  const jobs: Promise<void>[] = [];

  const apiSecret = GA4_API_SECRET.value();
  const mid = GA4_MEASUREMENT_ID.value() || "G-WSN2ZQE4PF";
  if (apiSecret && mid && shouldSendToGa4(parseEventList(GA4_SERVER_EVENTS.value(), ["purchase"]), e)) {
    sent.ga4 = true;
    const base = process.env.GA4_DEBUG === "1" ? "https://www.google-analytics.com/debug/mp/collect" : "https://www.google-analytics.com/mp/collect";
    jobs.push(postJson(`${base}?measurement_id=${encodeURIComponent(mid)}&api_secret=${encodeURIComponent(apiSecret)}`, buildGa4Body(e, u), "ga4"));
  }

  const pixel = META_PIXEL_ID.value();
  const token = META_CAPI_TOKEN && pixel ? META_CAPI_TOKEN.value() : "";
  if (token && pixel && e.consent.ads) {
    sent.meta = true;
    jobs.push(postJson(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pixel)}/events?access_token=${encodeURIComponent(token)}`,
      buildMetaBody(e, u, META_TEST_EVENT_CODE.value() || undefined),
      "meta",
    ));
  }
  await Promise.all(jobs);
  return sent;
}

export const collect = onRequest(
  { secrets: SECRETS, maxInstances: 10, timeoutSeconds: 15, memory: "256MiB", cors: false },
  async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (req.method !== "POST") { res.status(405).end(); return; }
    if (!isAllowedOrigin(req.get("origin"))) { res.status(403).end(); return; }

    const ip = clientIp(req.get("x-forwarded-for"), req.ip);
    if (!limiter.allow(sha256(ip || "unknown"))) { res.status(429).end(); return; }

    // sendBeacon posts text/plain; fetch posts application/json. Either way the body is JSON and tiny.
    let body: any = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body || JSON.stringify(body).length > 8192) { res.status(400).end(); return; }

    const event = cleanEvent(body);
    if (!event || (!event.url && event.name !== "purchase")) { res.status(400).end(); return; }
    // Revenue is recorded from the order trigger, never from a browser request.
    if (event.name === "purchase") { res.status(204).end(); return; }

    await forward(event, { ip, ua: String(req.get("user-agent") || "").slice(0, 300) });
    res.status(204).end();
  },
);

/** Authoritative purchase event, straight from the new order document. */
export const track_purchase = onDocumentCreated(
  { document: "orders/{orderId}", secrets: SECRETS, memory: "256MiB", timeoutSeconds: 30 },
  async (event) => {
    const o = event.data?.data();
    if (!o) return;
    const t = o._track && typeof o._track === "object" ? o._track : {};
    const orderId = String(o.orderId || event.params.orderId).slice(0, 64);

    const clean = cleanEvent({
      name: "purchase",
      event_id: `purchase_${orderId}`,
      client_id: t.cid || sha256(`order:${orderId}`).slice(0, 20),
      session_id: t.sid,
      page_location: t.url || "https://www.petmaya.app/checkout",
      page_title: "Checkout",
      fbp: t.fbp,
      fbc: t.fbc,
      consent: { analytics: t.consent?.analytics === true, ads: t.consent?.ads === true },
      params: {
        currency: "BDT",
        value: Number(o.total),
        transaction_id: orderId,
        items: cleanItems(Array.isArray(o.items) ? o.items.map((i: any) => ({ ...i, item_id: i.id ?? i.item_id })) : []),
      },
    });
    if (!clean) { console.warn("[tracking] order produced an invalid purchase event"); return; }

    await forward(clean, {
      ua: typeof t.ua === "string" ? t.ua.slice(0, 300) : undefined,
      phone: clean.consent.ads ? o.phone : undefined,
      email: clean.consent.ads ? o.email : undefined,
      externalId: o.userId && !String(o.userId).startsWith("demo") ? sha256(String(o.userId)) : undefined,
    });
  },
);
