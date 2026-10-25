// Unit tests for community moderation logic (no Firebase/network required).
const test = require("node:test");
const assert = require("node:assert");
const mod = require("../lib/moderation.js");

test("asciiDigits converts Bengali numerals to ASCII", () => {
  assert.strictEqual(mod.asciiDigits("০১৭০০১২৩৪৫৬"), "01700123456");
  assert.strictEqual(mod.asciiDigits("১২৩৪৫"), "12345");
});

test("normalize handles homoglyphs, repeated chars, and leetspeak", () => {
  // Repeated chars squeezed to 2 max
  assert.strictEqual(mod.normalize("fuuuuuck"), "fuuck");
  // Homoglyphs (Cyrillic а, о, etc.)
  assert.strictEqual(mod.normalize("рet"), "pet");
});

test("wordFilter catches English, Banglish, and Bangla profanity", () => {
  // Hard English
  const res1 = mod.wordFilter("what the fuck is this");
  assert.ok(res1.hard.length > 0, "Expected hard hit for fuck");

  // Masked profanity f*ck
  const res2 = mod.wordFilter("this is f*cked up");
  assert.ok(res2.hard.length > 0, "Expected hard hit for f*ck");

  // 5h1t leetspeak
  const res3 = mod.wordFilter("such a 5h1t post");
  assert.ok(res3.hard.length > 0, "Expected hard hit for 5h1t");

  // Banglish abuse
  const res4 = mod.wordFilter("tui ekta bokachoda");
  assert.ok(res4.hard.length > 0, "Expected hard hit for bokachoda");

  // Bangla script abuse
  const res5 = mod.wordFilter("তুই একটা মাদারচোদ");
  assert.ok(res5.hard.length > 0, "Expected hard hit for Bangla abuse");
});

test("wordFilter allows pet words that contain substrings of profanity", () => {
  // cockatiel contains 'cock'
  const res1 = mod.wordFilter("Look at my cute cockatiel bird!");
  assert.strictEqual(res1.hard.length, 0);
  assert.strictEqual(res1.soft.length, 0);

  // Shih Tzu misspelling
  const res2 = mod.wordFilter("Adopt this cute shih tzu puppy");
  assert.strictEqual(res2.hard.length, 0);
  assert.strictEqual(res2.soft.length, 0);

  // Maine Coon
  const res3 = mod.wordFilter("My Maine Coon cat is 2 years old");
  assert.strictEqual(res3.hard.length, 0);
  assert.strictEqual(res3.soft.length, 0);
});

test("wordFilter routes ambiguous words to soft review", () => {
  const res = mod.wordFilter("My dog is a champion breeding bitch");
  assert.strictEqual(res.hard.length, 0);
  assert.ok(res.soft.includes("bitch"), "Expected bitch to be in soft words for admin review");
});

test("spamRules blocks off-site links but allows petmaya.app links", () => {
  const badLink = mod.spamRules("Check out my website https://scam-store.com/buy");
  assert.ok(badLink.some((s) => s.code === "link"));

  const goodLink = mod.spamRules("Read the article on https://petmaya.app/journal/tips");
  assert.strictEqual(goodLink.filter((s) => s.code === "link").length, 0);
});

test("spamRules enforces contact sharing rules based on context", () => {
  // Regular post with phone number -> blocked
  const resRegular = mod.spamRules("Call me at 01712345678 for details");
  assert.ok(resRegular.some((s) => s.code === "contact"), "Phone should be blocked in regular post");

  // Lost & Found with phone number -> allowed
  const resLost = mod.spamRules("Lost dog! Contact me at 01712345678", { allowContact: true });
  assert.strictEqual(resLost.filter((s) => s.code === "contact").length, 0, "Phone allowed in Lost & Found");
});

test("spamRules detects medicine selling", () => {
  const res = mod.spamRules("Bravecto dewormer tablets for sale inbox me for home delivery");
  assert.ok(res.some((s) => s.code === "selling_medicine"));
});

test("decide produces proper verdicts across layers", () => {
  // Hard word hit -> reject
  const d1 = mod.decide({
    words: { hard: ["fuck*"], soft: [] },
    spam: [],
    safety: "skipped",
    relevance: "skipped",
  });
  assert.strictEqual(d1.verdict, "reject");
  assert.strictEqual(d1.code, "abusive_language");

  // Off-topic hit -> reject
  const d2 = mod.decide({
    words: { hard: [], soft: [] },
    spam: [],
    safety: { scores: { hate: 0.01 } },
    relevance: { petRelated: "no", reason: "Discussing bitcoin" },
  });
  assert.strictEqual(d2.verdict, "reject");
  assert.strictEqual(d2.code, "off_topic");

  // Safety threshold hit -> reject
  const d3 = mod.decide({
    words: { hard: [], soft: [] },
    spam: [],
    safety: { scores: { hate: 0.85 } },
    relevance: { petRelated: "yes" },
  });
  assert.strictEqual(d3.verdict, "reject");
  assert.strictEqual(d3.code, "hate");

  // AI unavailable -> held as pending review
  const d4 = mod.decide({
    words: { hard: [], soft: [] },
    spam: [],
    safety: "unavailable",
    relevance: "skipped",
  });
  assert.strictEqual(d4.verdict, "pending");
  assert.strictEqual(d4.code, "needs_review");

  // Clean post -> approved
  const d5 = mod.decide({
    words: { hard: [], soft: [] },
    spam: [],
    safety: { scores: { hate: 0.01, harassment: 0.02 } },
    relevance: { petRelated: "yes" },
  });
  assert.strictEqual(d5.verdict, "approve");
  assert.strictEqual(d5.code, "ok");
});

test("needsRelevance logic allows short parent-context comments", () => {
  assert.strictEqual(
    mod.needsRelevance({ kind: "comment", text: "So cute 😍" }),
    false,
    "Short text-only comment should skip relevance AI check"
  );
  assert.strictEqual(
    mod.needsRelevance({ kind: "post", text: "Cute puppy" }),
    true,
    "Posts always require relevance check"
  );
  assert.strictEqual(
    mod.needsRelevance({ kind: "comment", text: "So cute", image: { base64: "...", mime: "image/png" } }),
    true,
    "Comments with images require relevance check"
  );
});

test("addStrike accumulates and triggers 7-day suspension on 3rd strike", () => {
  const now = Date.now();
  const res1 = mod.addStrike([], now);
  assert.strictEqual(res1.strikes.length, 1);
  assert.strictEqual(res1.suspendUntil, null);

  const res2 = mod.addStrike(res1.strikes, now + 1000);
  assert.strictEqual(res2.strikes.length, 2);
  assert.strictEqual(res2.suspendUntil, null);

  const res3 = mod.addStrike(res2.strikes, now + 2000);
  assert.strictEqual(res3.strikes.length, 0); // Reset on suspension
  assert.strictEqual(res3.suspendUntil, now + 2000 + 7 * 24 * 3600 * 1000);

  // Expired strike older than 30 days is ignored
  const oldStrike = now - 35 * 24 * 3600 * 1000;
  const resOld = mod.addStrike([oldStrike], now);
  assert.strictEqual(resOld.strikes.length, 1);
});
