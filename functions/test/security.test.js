// Pure security helpers (no Firebase needed). Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const sec = require("../lib/security.js");
const integ = require("../lib/integrity.js");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]).toString("base64");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]).toString("base64");

test("accepts real JPEG/PNG base64 and reports the sniffed type", () => {
  assert.strictEqual(sec.validateBase64Image(JPEG).mime, "image/jpeg");
  assert.strictEqual(sec.validateBase64Image(PNG).mime, "image/png");
});

test("rejects URLs, data URLs, non-images and oversize payloads (SSRF / abuse)", () => {
  for (const bad of ["https://169.254.169.254/latest/meta-data", "data:image/png;base64," + PNG,
                     Buffer.from("<svg onload=alert(1)>").toString("base64"), "", null, 42]) {
    assert.throws(() => sec.validateBase64Image(bad), (e) => e.code === "invalid-argument");
  }
  assert.throws(() => sec.validateBase64Image("A".repeat(6 * 1024 * 1024)), /too large/);
});

test("notification links stay inside the app", () => {
  assert.strictEqual(sec.safeInternalLink("/account/orders/PM-12345"), "/account/orders/PM-12345");
  for (const bad of ["javascript:alert(1)", "//evil.com", String.raw`/\evil.com`, "https://evil.com", "data:text/html,x", 5]) {
    assert.strictEqual(sec.safeInternalLink(bad), "/");
  }
});

test("rate limiter allows up to the limit per window, then blocks until reset", () => {
  const w = [{ limit: 2, seconds: 60 }];
  let s;
  let r = sec.nextWindowState(s, w, 0); assert.ok(r.allowed); s = r.state;
  r = sec.nextWindowState(s, w, 1000); assert.ok(r.allowed); s = r.state;
  r = sec.nextWindowState(s, w, 2000); assert.ok(!r.allowed); assert.strictEqual(r.retryAfterS, 58);
  r = sec.nextWindowState(s, w, 61_000); assert.ok(r.allowed);
});

test("rate limiter enforces every window (burst and daily)", () => {
  const w = [{ limit: 5, seconds: 60 }, { limit: 6, seconds: 86_400 }];
  let s; let t = 0;
  for (let i = 0; i < 5; i++) { const r = sec.nextWindowState(s, w, t); assert.ok(r.allowed); s = r.state; }
  t = 120_000; let r = sec.nextWindowState(s, w, t); assert.ok(r.allowed); s = r.state; // 6th of the day
  t = 240_000; r = sec.nextWindowState(s, w, t); assert.ok(!r.allowed);                  // daily cap
});

test("order lines normalise app and web shapes", () => {
  assert.deepStrictEqual(
    integ.orderLines([{ productId: "a", quantity: 2, price: 10 }, { id: "b", qty: 1, price: 5 }, { id: "", qty: 3 }, { id: "c", qty: 0 }]),
    [{ id: "a", qty: 2, price: 10 }, { id: "b", qty: 1, price: 5 }]);
});

test("public profile never leaks private fields", () => {
  const p = integ.publicProfileOf({ name: "Ana", email: "a@x.com", phone: "123", address: "Dhaka", photoUrl: "u", role: "petOwner", fcmTokens: ["t"] });
  assert.deepStrictEqual(Object.keys(p).sort(), ["isVerified", "name", "photoUrl", "role"]);
});

test("computeCatalogueUnitPrice handles variant options, course packs, and auto-refill discounts", () => {
  const prod = {
    price: 1000,
    subscribe: true,
    variantOptions: [
      { label: "Small", price: 1000 },
      { label: "Large", price: 1500 },
    ],
  };
  assert.strictEqual(integ.computeCatalogueUnitPrice(prod, { variant: "Small" }), 1000);
  assert.strictEqual(integ.computeCatalogueUnitPrice(prod, { variant: "Large" }), 1500);
  // 3-pack course (3% off) on Large (1500 * 0.97 = 1455 * 3 = 4365)
  assert.strictEqual(integ.computeCatalogueUnitPrice(prod, { variant: "Large · 3 packs", coursePacks: 3 }), 4365);
  // Auto-refill (5% off) on Small (1000 * 0.95 = 950)
  assert.strictEqual(integ.computeCatalogueUnitPrice(prod, { variant: "Small · Auto-refill", subscribe: true }), 950);
});
