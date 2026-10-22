/**
 * Product feeds, generated on the fly.
 *
 *   https://www.petmaya.app/feeds/meta.xml         Meta Commerce Manager (Facebook & Instagram shops/ads)
 *   https://www.petmaya.app/feeds/google.xml       Google Merchant Center (Shopping ads, free listings)
 *   https://www.petmaya.app/feeds/marketplace.xml  marketplaces & comparison engines (same RSS 2.0 + g: format)
 *
 * Aliases: facebook, instagram → meta · gmc, shopping → google · comparison → marketplace.
 * Every request reads the live `products` collection (cached for a few minutes per instance and by the CDN), so
 * price, stock and new products reach the platforms on their next scheduled fetch with no export step.
 *
 * Prescription medicines (isRx) are never listed: Meta and Google both prohibit advertising them.
 * This file holds the pure builders (unit-tested); the HTTP handler is at the bottom.
 */
import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";

export type Channel = "meta" | "google" | "marketplace";

const ALIASES: Record<string, Channel> = {
  meta: "meta", facebook: "meta", instagram: "meta", fb: "meta",
  google: "google", gmc: "google", shopping: "google", merchant: "google",
  marketplace: "marketplace", marketplaces: "marketplace", comparison: "marketplace",
};
export const resolveChannel = (name: string | undefined): Channel | null => ALIASES[String(name || "").toLowerCase()] ?? null;

const LIMITS: Record<Channel, { title: number; description: number }> = {
  meta: { title: 200, description: 9999 },
  google: { title: 150, description: 5000 },
  marketplace: { title: 150, description: 5000 },
};
const UTM_SOURCE: Record<Channel, string> = { meta: "facebook", google: "google", marketplace: "marketplace" };

export const CURRENCY = "BDT";
export const MAX_PRODUCTS = 5000;

export interface FeedProduct {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  /** Names from the main category down to the product's own category (the admin's category tree). */
  categoryTrail: string[];
  pet: string;
  price: number;
  compareAt: number | null;
  image: string;
  images: string[];
  inStock: boolean;
  sku: string;
  barcode: string;
  isRx: boolean;
  listed: boolean;
}

// ── helpers ───────────────────────────────────────────────────────────────────────────────────────
const num = (v: unknown, d = 0): number => (typeof v === "number" ? v : parseFloat(String(v ?? "")) || d);
const flag = (v: unknown): boolean => v === true || v === "true" || v === 1;

/** XML 1.0: drop characters that are illegal in documents, then escape the five specials. */
export const xmlEscape = (v: unknown): string =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Plain text for titles/descriptions: no HTML, no runs of whitespace, cut on a word boundary. */
export function plainText(v: unknown, max: number): string {
  const s = String(v ?? "")
    .replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut).trim() + "…";
}

/** Same rules as web/src/lib/format.js slugify, so feed links equal the links the site itself builds. */
export function slugify(text: unknown, max = 70): string {
  return String(text ?? "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/, "");
}

export function productPath(p: { id: string; title: string }): string {
  const id = encodeURIComponent(p.id);
  const slug = slugify(p.title);
  return slug ? `/product/${slug}/${id}` : `/product/${id}`;
}

export const money = (n: number): string => `${n.toFixed(2)} ${CURRENCY}`;

/** GTIN-8/12/13/14 with a valid check digit; anything else is dropped (platforms reject bad GTINs). */
export function validGtin(v: unknown): string {
  const s = String(v ?? "").replace(/\D+/g, "");
  if (![8, 12, 13, 14].includes(s.length)) return "";
  const d = s.split("").map(Number);
  const check = d.pop() as number;
  const sum = d.reverse().reduce((a, x, i) => a + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check ? s : "";
}

/** https URL on any host; a bare path is resolved against the site. Returns "" for anything else. */
export function absoluteUrl(v: unknown, site: string): string {
  const s = String(v ?? "").trim();
  if (!s || s.startsWith("data:")) return "";
  try {
    const u = new URL(s, site + "/");
    return u.protocol === "https:" ? u.href : "";
  } catch { return ""; }
}

/** Google Shopping taxonomy ids that always exist (Pet Supplies / Dog Supplies / Cat Supplies). */
export function googleCategory(p: Pick<FeedProduct, "pet">): number {
  if (p.pet === "dog") return 4;
  if (p.pet === "cat") return 2;
  return 3237;
}

// ── Firestore document → product ──────────────────────────────────────────────────────────────────
/** Category ids → names, from the `categories` collection. */
export type CategoryNames = Map<string, string>;

export function toFeedProduct(id: string, d: Record<string, any> = {}, names: CategoryNames = new Map()): FeedProduct {
  const stockKnown = d.stockCount !== undefined && d.stockCount !== null;
  const stock = num(d.stockCount, 0);
  const gallery = [
    ...(Array.isArray(d.images) ? d.images : []),
    ...(Array.isArray(d.imageGallery) ? d.imageGallery : []),
  ].map(String);
  const category = String(d.category || "supplies").toLowerCase();
  const trail = (Array.isArray(d.categoryPath) ? d.categoryPath : []).map((c: unknown) => names.get(String(c)) || "").filter(Boolean);
  return {
    id,
    title: plainText(d.name || d.title, 500),
    description: plainText(d.longDescription || d.description || d.shortDescription || d.shortDesc || d.name, 10000),
    brand: String(d.brand || "Pet Maya").trim(),
    category,
    categoryTrail: trail.length ? trail : [category],
    pet: String(d.pet || d.petType || d.species || "both").toLowerCase(),
    price: num(d.price),
    compareAt: num(d.compareAt || d.originalPrice || d.mrp || d.oldPrice, 0) || null,
    image: String(d.imageUrl || d.image || gallery[0] || ""),
    images: gallery,
    // Same rule as the storefront: sold out when stockCount is 0 or inStock is false.
    inStock: d.inStock !== false && d.inStock !== "false" && (!stockKnown || stock > 0),
    sku: String(d.sku || "").trim(),
    barcode: String(d.barcode || ""),
    isRx: flag(d.isRx) || flag(d.requiresPrescription),
    listed: d.showOnStorefront !== false,
  };
}

// ── one <item> ────────────────────────────────────────────────────────────────────────────────────
export interface BuildOpts { site: string; now?: Date }

export function buildItem(p: FeedProduct, channel: Channel, site: string): string | null {
  if (p.isRx || !p.listed) return null; // never advertise prescription medicines
  const lim = LIMITS[channel];
  const title = plainText(p.title, lim.title);
  const image = absoluteUrl(p.image, site);
  if (!p.id || !title || !(p.price > 0) || !image) return null; // platforms reject incomplete items

  const link = `${site}${productPath(p)}?utm_source=${UTM_SOURCE[channel]}&utm_medium=product_feed`;
  const onSale = p.compareAt !== null && p.compareAt > p.price;
  const extra = [...new Set(p.images.map((u) => absoluteUrl(u, site)).filter((u) => u && u !== image))].slice(0, 10);
  const gtin = validGtin(p.barcode);
  const mpn = p.sku;
  const tags: Array<[string, unknown]> = [
    ["g:id", p.id],
    ["g:title", title],
    ["g:description", plainText(p.description || title, lim.description)],
    ["g:link", link],
    ["g:image_link", image],
    ...extra.map((u): [string, unknown] => ["g:additional_image_link", u]),
    ["g:availability", p.inStock ? "in stock" : "out of stock"],
    ["g:condition", "new"],
    ["g:price", money(onSale ? (p.compareAt as number) : p.price)],
    ...(onSale ? [["g:sale_price", money(p.price)] as [string, unknown]] : []),
    ["g:brand", p.brand],
    ...(gtin ? [["g:gtin", gtin] as [string, unknown]] : []),
    ...(mpn ? [["g:mpn", mpn] as [string, unknown]] : []),
    ...(!gtin && !mpn ? [["g:identifier_exists", "no"] as [string, unknown]] : []),
    ["g:google_product_category", googleCategory(p)],
    ["g:product_type", `Pet Supplies > ${p.pet === "dog" ? "Dogs" : p.pet === "cat" ? "Cats" : "Dogs & Cats"} > ${p.categoryTrail.join(" > ")}`],
    ["g:custom_label_0", p.pet],
    ["g:custom_label_1", p.category],
    ["g:adult", "no"],
  ];
  return "    <item>\n" + tags.map(([k, v]) => `      <${k}>${xmlEscape(v)}</${k}>`).join("\n") + "\n    </item>";
}

/** The whole feed document. Items that fail validation are skipped, and counted for the log. */
export function buildFeed(channel: Channel, products: FeedProduct[], opts: BuildOpts): { xml: string; items: number; skipped: number } {
  const site = opts.site.replace(/\/+$/, "");
  const items = products.map((p) => buildItem(p, channel, site)).filter((x): x is string => !!x);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    "    <title>Pet Maya</title>",
    `    <link>${xmlEscape(site)}</link>`,
    "    <description>Pet Maya products: pet food, supplements, grooming and smart GPS gear.</description>",
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
  return { xml, items: items.length, skipped: products.length - items.length };
}

// ── HTTP handler ──────────────────────────────────────────────────────────────────────────────────
const SITE_URL = defineString("SITE_URL", { default: "https://www.petmaya.app" });
const CACHE_MS = 5 * 60_000;
const cache = new Map<Channel, { at: number; xml: string }>();

export const feed = onRequest(
  { memory: "256MiB", timeoutSeconds: 30, maxInstances: 5, cors: false },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") { res.status(405).set("Allow", "GET, HEAD").end(); return; }
    const channel = resolveChannel(/([a-z0-9-]+)\.xml$/i.exec(req.path)?.[1]);
    if (!channel) { res.status(404).type("text/plain").send("Unknown feed. Use /feeds/meta.xml, /feeds/google.xml or /feeds/marketplace.xml"); return; }

    let hit = cache.get(channel);
    if (!hit || Date.now() - hit.at > CACHE_MS) {
      try {
        const [snap, cats] = await Promise.all([
          admin.firestore().collection("products").limit(MAX_PRODUCTS).get(),
          admin.firestore().collection("categories").limit(2000).get(),
        ]);
        const names: CategoryNames = new Map(cats.docs.map((c) => [c.id, String(c.data().name || "").trim()]));
        const built = buildFeed(channel, snap.docs.map((d) => toFeedProduct(d.id, d.data(), names)), { site: SITE_URL.value() });
        console.log(`[feed] ${channel}: ${built.items} items, ${built.skipped} skipped`);
        hit = { at: Date.now(), xml: built.xml };
        cache.set(channel, hit);
      } catch (e: any) {
        console.error("[feed] failed", e?.message || e);
        if (!hit) { res.status(503).set("Retry-After", "120").type("text/plain").send("Feed temporarily unavailable"); return; }
        // Serve the previous copy rather than an error: platforms drop products on failed fetches.
      }
    }
    if (!hit) { res.status(503).end(); return; }
    res.set({
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=900",
      "X-Robots-Tag": "noindex",
    });
    res.status(200).send(hit.xml);
  },
);
