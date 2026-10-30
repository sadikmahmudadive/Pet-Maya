// Daily login reward and referral amounts (pure parts, no Firebase needed). Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const integ = require("../lib/integrity.js");

test("the reward amounts are 5 a day and 100 per referral", () => {
  assert.strictEqual(integ.DAILY_POINTS, 5);
  assert.strictEqual(integ.REFERRAL_POINTS, 100);
});

test("the daily reward day is the Bangladesh calendar day (UTC+6)", () => {
  // 17:59 UTC is 23:59 in Dhaka: still the same day
  assert.strictEqual(integ.dhakaDayKey(Date.UTC(2026, 9, 30, 17, 59, 59)), "2026-10-30");
  // 18:00 UTC is midnight in Dhaka: the next day
  assert.strictEqual(integ.dhakaDayKey(Date.UTC(2026, 9, 30, 18, 0, 0)), "2026-10-31");
  assert.strictEqual(integ.dhakaDayKey(Date.UTC(2026, 11, 31, 19, 0, 0)), "2027-01-01");
});
