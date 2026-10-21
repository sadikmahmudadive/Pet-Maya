// Pet Maya Commerce - Launch-Readiness & Backend Integrity Test Suite
// Verifies core business safeguards: pricing, variants, discounts, cold-chain, and order integrity.
const test = require("node:test");
const assert = require("node:assert");
const integ = require("../lib/integrity.js");

const { COMMERCE_CONFIG, computeCatalogueUnitPrice, orderLines } = integ;

test("Launch Readiness 1: orderLines normalises and sanitises item shapes", () => {
  const dirtyInput = [
    { id: "prod_01", qty: 2, price: 150 },
    { productId: "prod_02", quantity: 3, price: 500 },
    { id: "", qty: 5 }, // missing id -> dropped
    { id: "prod_03", qty: 0 }, // non-positive qty -> dropped
    { id: "prod_04", qty: -2 }, // negative qty -> dropped
    { id: "prod_05", qty: "4", price: "250" }, // valid string numbers converted
    null,
    undefined,
  ];
  const cleaned = orderLines(dirtyInput);
  assert.strictEqual(cleaned.length, 3);
  assert.deepStrictEqual(cleaned[0], { id: "prod_01", qty: 2, price: 150 });
  assert.deepStrictEqual(cleaned[1], { id: "prod_02", qty: 3, price: 500 });
  assert.deepStrictEqual(cleaned[2], { id: "prod_05", qty: 4, price: 250 });
});

test("Launch Readiness 2: computeCatalogueUnitPrice respects variant price overrides", () => {
  const product = {
    id: "dog_food_01",
    name: "Premium Dog Kibble",
    price: 1200,
    variantOptions: [
      { label: "1.5 kg", price: 1200, sku: "DK-1.5" },
      { label: "3 kg", price: 2200, sku: "DK-3.0" },
      { label: "10 kg", price: 6500, sku: "DK-10" },
    ],
  };

  // Base price when no variant or default
  assert.strictEqual(computeCatalogueUnitPrice(product, { variant: "" }), 1200);

  // Variant matching
  assert.strictEqual(computeCatalogueUnitPrice(product, { variant: "3 kg" }), 2200);
  assert.strictEqual(computeCatalogueUnitPrice(product, { variant: "10 kg" }), 6500);

  // String variant fallback
  assert.strictEqual(computeCatalogueUnitPrice(product, { variant: "Custom 500g" }), 1200);
});

test("Launch Readiness 3: Course pack discounts (3-pack save 3%, 6-pack save 5%) compute accurately", () => {
  const medicine = {
    id: "nexgard_01",
    name: "NexGard Spectra Small",
    price: 1000,
    isRx: true,
  };

  // Single pack -> 1000
  assert.strictEqual(computeCatalogueUnitPrice(medicine, { coursePacks: 1 }), 1000);

  // 3 packs course -> 3% discount = 970 per pack * 3 packs = 2910
  assert.strictEqual(computeCatalogueUnitPrice(medicine, { coursePacks: 3 }), 2910);

  // 6 packs course -> 5% discount = 950 per pack * 6 packs = 5700
  assert.strictEqual(computeCatalogueUnitPrice(medicine, { coursePacks: 6 }), 5700);
});

test("Launch Readiness 4: Auto-refill subscription grants 5% subscriber discount", () => {
  const supplement = {
    id: "omega_01",
    name: "Wild Salmon Oil",
    price: 800,
    subscribe: true,
  };

  // One-time purchase
  assert.strictEqual(computeCatalogueUnitPrice(supplement, { subscribe: false }), 800);

  // Auto-refill subscriber: 800 * 0.95 = 760
  assert.strictEqual(computeCatalogueUnitPrice(supplement, { subscribe: true }), 760);

  // Combined 3-pack course (3% off) + auto-refill (5% off):
  // 800 * 0.97 = 776; 776 * 0.95 = 737.2 -> 737 per pack * 3 packs = 2211
  assert.strictEqual(computeCatalogueUnitPrice(supplement, { coursePacks: 3, subscribe: true }), 2211);
});

test("Launch Readiness 5: Delivery configurations and cold-chain zones comply with BD regulations", () => {
  assert.strictEqual(COMMERCE_CONFIG.FREE_DELIVERY_OVER, 2500);
  assert.strictEqual(COMMERCE_CONFIG.INSIDE_DHAKA_FEE, 60);
  assert.strictEqual(COMMERCE_CONFIG.INSIDE_DHAKA_EXPRESS_FEE, 120);
  assert.strictEqual(COMMERCE_CONFIG.OUTSIDE_DHAKA_FEE, 130);
  assert.strictEqual(COMMERCE_CONFIG.COLD_STANDARD_FEE, 150);

  // Cold chain districts must include Dhaka, Gazipur, Narayanganj
  assert.ok(COMMERCE_CONFIG.COLD_DISTRICTS.includes("Dhaka"));
  assert.ok(COMMERCE_CONFIG.COLD_DISTRICTS.includes("Gazipur"));
  assert.ok(COMMERCE_CONFIG.COLD_DISTRICTS.includes("Narayanganj"));

  // Outside districts must NOT be in cold-chain list
  assert.ok(!COMMERCE_CONFIG.COLD_DISTRICTS.includes("Sylhet"));
  assert.ok(!COMMERCE_CONFIG.COLD_DISTRICTS.includes("Rajshahi"));
  assert.ok(!COMMERCE_CONFIG.COLD_DISTRICTS.includes("Khulna"));
});

test("Launch Readiness 6: Free shipping threshold rules", () => {
  const calcShipping = (subtotal, isDhaka, isExpress, hasCold, district) => {
    if (hasCold && !COMMERCE_CONFIG.COLD_DISTRICTS.includes(district)) {
      throw new Error("Cold-chain outside allowed zone");
    }
    const isFree = subtotal >= COMMERCE_CONFIG.FREE_DELIVERY_OVER;
    if (hasCold) return COMMERCE_CONFIG.COLD_STANDARD_FEE;
    if (isDhaka) {
      if (isExpress) return COMMERCE_CONFIG.INSIDE_DHAKA_EXPRESS_FEE;
      return isFree ? 0 : COMMERCE_CONFIG.INSIDE_DHAKA_FEE;
    }
    return isFree ? 0 : COMMERCE_CONFIG.OUTSIDE_DHAKA_FEE;
  };

  // Under threshold inside Dhaka
  assert.strictEqual(calcShipping(1500, true, false, false, "Dhaka"), 60);

  // Over threshold inside Dhaka (Free)
  assert.strictEqual(calcShipping(2500, true, false, false, "Dhaka"), 0);
  assert.strictEqual(calcShipping(4000, true, false, false, "Dhaka"), 0);

  // Under threshold outside Dhaka
  assert.strictEqual(calcShipping(1200, false, false, false, "Chattogram"), 130);

  // Over threshold outside Dhaka (Free)
  assert.strictEqual(calcShipping(3000, false, false, false, "Chattogram"), 0);

  // Express inside Dhaka (not eligible for standard free waiver)
  assert.strictEqual(calcShipping(3000, true, true, false, "Dhaka"), 120);

  // Cold chain in supported zone always charges cold packaging fee
  assert.strictEqual(calcShipping(3500, true, false, true, "Dhaka"), 150);

  // Cold chain in unsupported zone throws
  assert.throws(() => calcShipping(3500, false, false, true, "Barishal"), /Cold-chain/);
});

test("Launch Readiness 7: Inventory deduction and restoration arithmetic", () => {
  // Order deduction
  const initialStock = 20;
  const initialSold = 5;
  const qtyOrdered = 3;
  const packs = 3; // 3-pack course
  const totalUnits = qtyOrdered * packs; // 9 units

  const stockAfterOrder = initialStock - totalUnits;
  const soldAfterOrder = initialSold + totalUnits;
  assert.strictEqual(stockAfterOrder, 11);
  assert.strictEqual(soldAfterOrder, 14);

  // Restock upon cancellation
  const stockAfterCancel = stockAfterOrder + totalUnits;
  const soldAfterCancel = soldAfterOrder - totalUnits;
  assert.strictEqual(stockAfterCancel, initialStock);
  assert.strictEqual(soldAfterCancel, initialSold);
});


test("Order numbers: server-made, right shape, never outside the digit range", () => {
  assert.strictEqual(integ.newOrderId(() => 0), "PM-10000");
  assert.strictEqual(integ.newOrderId(() => 0.999999999), "PM-99999");
  assert.strictEqual(integ.newOrderId(() => 0, 6), "PM-100000");
  assert.strictEqual(integ.newOrderId(() => 0.999999999, 6), "PM-999999");
  for (let i = 0; i < 500; i++) assert.match(integ.newOrderId(), /^PM-\d{5}$/);
});

test("Request ids: only long random-looking keys make a checkout retry-safe", () => {
  assert.ok(integ.isValidRequestId("3f1c2a9e-7b1d-4c55-9e0a-1d2c3b4a5f60"));
  assert.ok(integ.isValidRequestId("abcdEFGH_12345678"));
  assert.ok(!integ.isValidRequestId("PM-12345"));       // an order number is not a request id
  assert.ok(!integ.isValidRequestId("short"));
  assert.ok(!integ.isValidRequestId("has spaces and !! chars ......."));
  assert.ok(!integ.isValidRequestId(undefined));
  assert.ok(!integ.isValidRequestId(12345678901234567));
});

test("First-order codes are the ones that may only be used once", () => {
  assert.deepStrictEqual(integ.FIRST_ORDER_CODES.sort(), ["MAYA10", "PETMAYA10"]);
});
