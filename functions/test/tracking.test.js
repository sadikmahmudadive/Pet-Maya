// Server-side tracking helpers (no network, no Firebase). Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const t = require("../lib/tracking.js");

const good = {
  name: "add_to_cart",
  event_id: "evt_1234abcd",
  client_id: "1234567890.1700000000",
  page_location: "https://www.petmaya.app/product/dog-food/abc?x=1#frag",
  page_title: "Dog food",
  fbp: "fb.1.1700000000000.123456789",
  consent: { analytics: true, ads: true },
  params: { currency: "bdt", value: "1250.456", items: [{ id: "p1", name: "Food", price: 625, qty: 2 }] },
};

test("a valid browser event is cleaned and normalised", () => {
  const e = t.cleanEvent(good, 1_700_000_000_000);
  assert.strictEqual(e.name, "add_to_cart");
  assert.strictEqual(e.currency, "BDT");
  assert.strictEqual(e.value, 1250.46);
  assert.strictEqual(e.url, "https://www.petmaya.app/product/dog-food/abc?x=1");
  assert.deepStrictEqual(e.items, [{ item_id: "p1", item_name: "Food", price: 625, quantity: 2 }]);
  assert.strictEqual(e.eventTime, 1_700_000_000);
});

test("unknown events, bad ids and foreign pages are dropped or blanked", () => {
  assert.strictEqual(t.cleanEvent({ ...good, name: "delete_everything" }), null);
  assert.strictEqual(t.cleanEvent({ ...good, event_id: "x" }), null);
  assert.strictEqual(t.cleanEvent({ ...good, client_id: "<script>" }), null);
  assert.strictEqual(t.cleanEvent(null), null);
  assert.strictEqual(t.cleanEvent({ ...good, page_location: "https://evil.example/phish" }).url, "");
  assert.strictEqual(t.cleanEvent({ ...good, page_location: "javascript:alert(1)" }).url, "");
});

test("consent defaults to denied unless explicitly true", () => {
  const e = t.cleanEvent({ ...good, consent: { analytics: "yes", ads: 1 } });
  assert.deepStrictEqual(e.consent, { analytics: false, ads: false });
  assert.strictEqual(t.cleanEvent({ ...good, consent: undefined }).consent.ads, false);
});

test("items are capped and quantities clamped", () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ id: "p" + i, name: "n", price: 1, qty: 99999 }));
  const out = t.cleanItems(items);
  assert.strictEqual(out.length, 20);
  assert.strictEqual(out[0].quantity, 999);
  assert.deepStrictEqual(t.cleanItems([{ name: "no id" }]), []);
});

test("emails and Bangladeshi phone numbers are normalised before hashing", () => {
  assert.strictEqual(t.hashEmail("  Foo@Example.COM "), t.sha256("foo@example.com"));
  assert.strictEqual(t.hashEmail("not-an-email"), undefined);
  const want = t.sha256("8801712345678");
  assert.strictEqual(t.hashPhone("01712-345678"), want);
  assert.strictEqual(t.hashPhone("+880 1712 345678"), want);
  assert.strictEqual(t.hashPhone("1712345678"), want);
  assert.strictEqual(t.hashPhone("123"), undefined);
});

test("Meta payload carries event_id for de-duplication and never raw PII", () => {
  const e = t.cleanEvent(good);
  const body = t.buildMetaBody(e, { ip: "1.2.3.4", ua: "UA", email: "a@b.co", phone: "01712345678" }, "TEST1");
  const d = body.data[0];
  assert.strictEqual(d.event_name, "AddToCart");
  assert.strictEqual(d.event_id, "evt_1234abcd");
  assert.strictEqual(d.action_source, "website");
  assert.deepStrictEqual(d.user_data.em, [t.sha256("a@b.co")]);
  assert.ok(!JSON.stringify(body).includes("a@b.co"));
  assert.ok(!JSON.stringify(body).includes("01712345678"));
  assert.deepStrictEqual(d.custom_data.content_ids, ["p1"]);
  assert.strictEqual(body.test_event_code, "TEST1");
});

test("GA4 payload uses the browser client_id and honours ad consent", () => {
  const e = t.cleanEvent({ ...good, consent: { analytics: true, ads: false }, params: { ...good.params, transaction_id: "PM-ORD-1" } });
  const body = t.buildGa4Body(e, {});
  assert.strictEqual(body.client_id, "1234567890.1700000000");
  assert.strictEqual(body.events[0].params.transaction_id, "PM-ORD-1");
  assert.strictEqual(body.consent.ad_user_data, "DENIED");
  assert.strictEqual(body.non_personalized_ads, true);
});

test("GA4 forwarding follows the configured event list and analytics consent", () => {
  const e = t.cleanEvent(good);
  assert.strictEqual(t.shouldSendToGa4(["purchase"], e), false);
  assert.strictEqual(t.shouldSendToGa4(["add_to_cart"], e), true);
  assert.strictEqual(t.shouldSendToGa4("*", { ...e, consent: { analytics: false, ads: true } }), false);
  assert.strictEqual(t.parseEventList("a, b", []).length, 2);
  assert.strictEqual(t.parseEventList("*", []), "*");
  assert.deepStrictEqual(t.parseEventList("", ["purchase"]), ["purchase"]);
});

test("origin allow-list and per-IP limiter", () => {
  assert.ok(t.isAllowedOrigin("https://www.petmaya.app"));
  assert.ok(t.isAllowedOrigin(undefined));
  assert.ok(!t.isAllowedOrigin("https://evil.example"));
  assert.ok(!t.isAllowedOrigin("not a url"));
  const lim = new t.IpLimiter(2, 1000);
  assert.ok(lim.allow("a", 0) && lim.allow("a", 1));
  assert.ok(!lim.allow("a", 2));
  assert.ok(lim.allow("a", 1500));
  assert.strictEqual(t.clientIp("9.9.9.9, 10.0.0.1", "x"), "9.9.9.9");
});
