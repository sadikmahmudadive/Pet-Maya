// Pure parts of the Support Center (no Firebase needed). Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const sup = require("../lib/support.js");

test("a ticket needs a subject and enough detail; the category falls back to Other", () => {
  assert.throws(() => sup.cleanTicketInput({ subject: "Hi", message: "My order is late please help" }), /subject/i);
  assert.throws(() => sup.cleanTicketInput({ subject: "Late order", message: "late" }), /detail/i);
  const t = sup.cleanTicketInput({ subject: "  Late order ", message: " My order has not arrived in 5 days ", category: "Nonsense", orderNumber: " PM-1001 " });
  assert.deepStrictEqual(t, { subject: "Late order", category: "Other", message: "My order has not arrived in 5 days", orderNumber: "PM-1001" });
  assert.strictEqual(sup.cleanTicketInput({ subject: "Late order", message: "My order has not arrived", category: "Delivery" }).category, "Delivery");
  assert.strictEqual(sup.cleanTicketInput({ subject: "x".repeat(300), message: "y".repeat(5000) }).subject.length, 100);
});

test("only support staff (admins and managers) count as staff", () => {
  assert.strictEqual(sup.isSupportStaff({ role: "admin" }), true);
  assert.strictEqual(sup.isSupportStaff({ role: "Pet Owner", staffRole: "Manager" }), true);
  assert.strictEqual(sup.isSupportStaff({ role: "Pet Owner", staffRole: "Cashier" }), false);
  assert.strictEqual(sup.isSupportStaff({ role: "petOwner" }), false);
});

test("a ticket photo must be the caller's own upload in support/<uid>/", () => {
  const url = (path) => `https://firebasestorage.googleapis.com/v0/b/pet-maya.firebasestorage.app/o/${encodeURIComponent(path)}?alt=media&token=t`;
  assert.ok(sup.cleanSupportImageUrl("alice", url("support/alice/1.jpg")));
  assert.strictEqual(sup.cleanSupportImageUrl("alice", url("support/bob/1.jpg")), "");
  assert.strictEqual(sup.cleanSupportImageUrl("alice", url("pets/alice/1.jpg")), "");
  assert.strictEqual(sup.cleanSupportImageUrl("alice", "https://evil.example/support/alice/1.jpg"), "");
  assert.strictEqual(sup.cleanSupportImageUrl("alice", "javascript:alert(1)"), "");
  assert.strictEqual(sup.cleanSupportImageUrl("alice", undefined), "");
});

test("status moves: staff reply starts work, a customer reply reopens a resolved ticket", () => {
  assert.strictEqual(sup.statusAfterMessage("open", "staff"), "in_progress");
  assert.strictEqual(sup.statusAfterMessage("in_progress", "staff"), "in_progress");
  assert.strictEqual(sup.statusAfterMessage("resolved", "staff"), "resolved");
  assert.strictEqual(sup.statusAfterMessage("resolved", "user"), "open");
  assert.strictEqual(sup.statusAfterMessage("in_progress", "user"), "in_progress");
  assert.strictEqual(sup.statusAfterMessage("open", "user"), "open");
});
