// Product feed builders (no network, no Firebase). Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const f = require("../lib/feed.js");

const SITE = "https://www.petmaya.app";
const base = {
  name: "Royal Canin Gastro <b>Low Fat</b> 4kg & more", brand: "Royal Canin", category: "Food", pet: "dog", price: 3450, compareAt: 3900,
  imageUrl: "https://cdn.example.com/rc.jpg", images: ["https://cdn.example.com/rc2.jpg", "http://insecure.example.com/x.jpg", "https://cdn.example.com/rc.jpg"],
  description: "Veterinary diet.\n\n  For <i>digestive</i> upsets.", sku: "RC-7712", barcode: "4006381333931", stockCount: 420,
};
const item = (d, ch = "google", id = "rc-1") => f.buildItem(f.toFeedProduct(id, d), ch, SITE);

test("an item has the required fields, a sale price and a site link identical to the storefront's", () => {
  const x = item(base);
  assert.match(x, /<g:id>rc-1<\/g:id>/);
  assert.match(x, /<g:title>Royal Canin Gastro Low Fat 4kg &amp; more<\/g:title>/);
  assert.match(x, /<g:description>Veterinary diet\. For digestive upsets\.<\/g:description>/);
  assert.match(x, /<g:link>https:\/\/www\.petmaya\.app\/product\/royal-canin-gastro-low-fat-4kg-and-more\/rc-1\?utm_source=google&amp;utm_medium=product_feed<\/g:link>/);
  assert.match(x, /<g:availability>in stock<\/g:availability>/);
  assert.match(x, /<g:price>3900\.00 BDT<\/g:price>/);
  assert.match(x, /<g:sale_price>3450\.00 BDT<\/g:sale_price>/);
  assert.match(x, /<g:gtin>4006381333931<\/g:gtin>/);
  assert.match(x, /<g:mpn>RC-7712<\/g:mpn>/);
  assert.doesNotMatch(x, /identifier_exists/);
});

test("only https, de-duplicated additional images are listed", () => {
  const x = item(base);
  assert.deepStrictEqual([...x.matchAll(/<g:additional_image_link>(.*?)</g)].map((m) => m[1]), ["https://cdn.example.com/rc2.jpg"]);
});

test("prescription, hidden and incomplete products are skipped", () => {
  assert.strictEqual(item({ ...base, isRx: true }), null);
  assert.strictEqual(item({ ...base, requiresPrescription: "true" }), null);
  assert.strictEqual(item({ ...base, showOnStorefront: false }), null);
  assert.strictEqual(item({ ...base, price: 0 }), null);
  assert.strictEqual(item({ ...base, imageUrl: "" , images: []}), null);
  assert.strictEqual(item({ ...base, imageUrl: "http://insecure.example.com/x.jpg", images: [] }), null);
  assert.strictEqual(item({ ...base, name: "" }), null);
});

test("stock follows the storefront rule: stockCount 0 or inStock false means out of stock", () => {
  assert.match(item({ ...base, stockCount: 0 }), /out of stock/);
  assert.match(item({ ...base, inStock: false }), /out of stock/);
  assert.match(item({ ...base, stockCount: undefined }), /<g:availability>in stock/);
});

test("bad GTINs are dropped and identifier_exists is only set when there is no id at all", () => {
  assert.strictEqual(f.validGtin("4006381333931"), "4006381333931");
  assert.strictEqual(f.validGtin("4006381333932"), "");
  assert.strictEqual(f.validGtin("12345"), "");
  const x = item({ ...base, barcode: "123", sku: "" });
  assert.doesNotMatch(x, /<g:gtin>/);
  assert.match(x, /<g:identifier_exists>no<\/g:identifier_exists>/);
});

test("channels differ in title limits and utm source", () => {
  const long = { ...base, name: "A".repeat(10) + " " + "word ".repeat(60) };
  const meta = item(long, "meta"), google = item(long, "google");
  const len = (x) => x.match(/<g:title>(.*?)<\/g:title>/)[1].length;
  assert.ok(len(meta) <= 200 && len(google) <= 150 && len(meta) > len(google));
  assert.match(meta, /utm_source=facebook/);
  assert.match(item(base, "marketplace"), /utm_source=marketplace/);
});

test("XML is escaped and illegal control characters removed", () => {
  assert.strictEqual(f.xmlEscape(`a&b<c>"d"'e'\u0001\u0008x`), "a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;x");
});

test("feed document wraps the items and counts what it skipped", () => {
  const ps = [f.toFeedProduct("a", base), f.toFeedProduct("b", { ...base, isRx: true }), f.toFeedProduct("c", { ...base, price: 100, compareAt: null })];
  const { xml, items, skipped } = f.buildFeed("meta", ps, { site: SITE + "/" });
  assert.strictEqual(items, 2);
  assert.strictEqual(skipped, 1);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0" xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0">/);
  assert.strictEqual((xml.match(/<item>/g) || []).length, 2);
  assert.doesNotMatch(xml, /g:sale_price>100/);
});

test("channel names and aliases resolve", () => {
  assert.strictEqual(f.resolveChannel("facebook"), "meta");
  assert.strictEqual(f.resolveChannel("Instagram"), "meta");
  assert.strictEqual(f.resolveChannel("gmc"), "google");
  assert.strictEqual(f.resolveChannel("comparison"), "marketplace");
  assert.strictEqual(f.resolveChannel("nope"), null);
});

test("product paths match the website's slug rules", () => {
  assert.strictEqual(f.productPath({ id: "x1", title: "Café Crème — 2 kg!" }), "/product/cafe-creme-2-kg/x1");
  assert.strictEqual(f.productPath({ id: "x 1", title: "খাবার" }), "/product/x%201");
});
