/**
 * Server-side replacements for writes that clients used to make on other
 * people's documents, plus data the security rules rely on:
 *
 *  apply_referral         — credits a referrer (+5) once per user, transactionally.
 *  sync_public_profile    — mirrors name/photo/role into public_profiles/{uid}, so
 *                           users/{uid} (email, phone, address) can stay private.
 *  stamp_record_owner     — stamps service_records.ownerId from the pet, which the
 *                           rules use to give owners access to their pets' records.
 *  check_order_prices     — recomputes order totals from the catalogue and flags
 *                           tampered prices/discounts for staff (priceCheck).
 *  backfill_security_data — one-off admin job for documents written before the above.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { clip, isAdminRole, rateLimit, requireUser } from "./security";

const REFERRAL_POINTS = 5;

export const apply_referral = onCall(async (request) => {
  const { uid } = await requireUser(request);
  await rateLimit("referral", uid, [{ limit: 10, seconds: 3600 }]);

  const code = clip(request.data?.code, 20).toUpperCase();
  if (!/^[A-Z0-9]{4,20}$/.test(code)) {
    throw new HttpsError("invalid-argument", "That referral code doesn't look right.");
  }

  const db = admin.firestore();
  const match = await db.collection("users").where("referralCode", "==", code).limit(1).get();
  if (match.empty) throw new HttpsError("not-found", `Referral code "${code}" is invalid or does not exist`);
  const referrerRef = match.docs[0].ref;
  if (referrerRef.id === uid) throw new HttpsError("failed-precondition", "You cannot use your own referral code");

  const meRef = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const me = await tx.get(meRef);
    if (clip(me.data()?.referredBy, 40)) {
      throw new HttpsError("already-exists", "You have already redeemed a referral code");
    }
    tx.set(meRef, { referredBy: code, referredAt: Date.now() }, { merge: true });
    tx.update(referrerRef, { points: admin.firestore.FieldValue.increment(REFERRAL_POINTS) });
    tx.set(db.collection("notifications").doc(referrerRef.id).collection("items").doc(), {
      title: "🎉 +5 Referral Points Earned!",
      message: `A friend just joined Pet Maya using your referral code ${code}. You received ${REFERRAL_POINTS} points!`,
      body: `A friend just joined Pet Maya using your referral code ${code}.`,
      type: "reward", category: "reward", timestamp: Date.now(), isRead: false, read: false,
    });
  });
  return { success: true };
});

/** Fields anyone may see about a user (community author cards, reviews). */
export function publicProfileOf(d: Record<string, any>) {
  return {
    name: clip(d.name ?? d.displayName, 80) || "Pet Maya member",
    photoUrl: clip(d.photoUrl ?? d.photoURL ?? d.avatar, 500),
    role: clip(d.role, 40),
    isVerified: d.isVerified === true,
  };
}

export const sync_public_profile = onDocumentWritten("users/{uid}", async (event) => {
  const ref = admin.firestore().collection("public_profiles").doc(event.params.uid);
  const after = event.data?.after?.data();
  if (!after) { await ref.delete(); return; }
  const next = publicProfileOf(after);
  const before = event.data?.before?.data();
  if (before && JSON.stringify(publicProfileOf(before)) === JSON.stringify(next)) return;
  await ref.set({ ...next, updatedAt: Date.now() });
});

export const stamp_record_owner = onDocumentWritten("service_records/{id}", async (event) => {
  const rec = event.data?.after?.data();
  if (!rec || !rec.petId) return;
  const pet = (await admin.firestore().collection("pets").doc(String(rec.petId)).get()).data();
  const ownerId = pet?.ownerID ?? null;
  if (ownerId && rec.ownerId !== ownerId) {
    await event.data!.after.ref.update({ ownerId });
  }
});

/** Normalises app (productId/quantity) and web (id/qty) order lines. */
export function orderLines(items: unknown): { id: string; qty: number; price: number }[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 200).map((i: any) => ({
    id: String(i?.productId ?? i?.id ?? ""),
    qty: Math.max(0, Math.floor(Number(i?.quantity ?? i?.qty) || 0)),
    price: Number(i?.price) || 0,
  })).filter((l) => l.id && l.qty > 0);
}

export const check_order_prices = onDocumentCreated("orders/{orderId}", async (event) => {
  const order = event.data?.data();
  if (!order) return;
  const db = admin.firestore();
  const lines = orderLines(order.items);
  const refs = lines.map((l) => db.collection("products").doc(l.id));
  const snaps = refs.length ? await db.getAll(...refs) : [];

  const problems: string[] = [];
  let catalogueSubtotal = 0;
  lines.forEach((l, i) => {
    const p = snaps[i]?.data();
    if (!p) { problems.push(`unknown product ${l.id}`); return; }
    const price = Number(p.price) || 0;
    catalogueSubtotal += price * l.qty;
    if (Math.abs(price - l.price) > 0.01) problems.push(`${l.id}: charged ${l.price}, catalogue ${price}`);
  });

  const claimedSubtotal = Number(order.subtotal) || 0;
  const discount = Number(order.discount) || 0;
  if (Math.abs(claimedSubtotal - catalogueSubtotal) > 0.01) {
    problems.push(`subtotal ${claimedSubtotal} vs catalogue ${catalogueSubtotal}`);
  }
  if (discount < 0 || discount > catalogueSubtotal) problems.push(`discount ${discount} out of range`);
  const total = Number(order.total) || 0;
  if (total < 0) problems.push(`negative total ${total}`);

  await event.data!.ref.update({
    priceCheck: problems.length ? "mismatch" : "ok",
    priceCheckNotes: problems.slice(0, 20),
    verifiedSubtotal: catalogueSubtotal,
    priceCheckedAt: Date.now(),
  });
  if (problems.length) console.warn(`Order ${event.params.orderId} price mismatch:`, problems);
});

export const backfill_security_data = onCall({ timeoutSeconds: 540, memory: "512MiB" }, async (request) => {
  const { profile } = await requireUser(request);
  if (!isAdminRole(profile.role)) throw new HttpsError("permission-denied", "Admin only");

  const db = admin.firestore();
  let profiles = 0;
  let records = 0;

  const users = await db.collection("users").get();
  for (let i = 0; i < users.docs.length; i += 400) {
    const batch = db.batch();
    users.docs.slice(i, i + 400).forEach((u) => {
      batch.set(db.collection("public_profiles").doc(u.id), { ...publicProfileOf(u.data()), updatedAt: Date.now() });
      profiles++;
    });
    await batch.commit();
  }

  const owners = new Map<string, string | null>();
  const recs = await db.collection("service_records").get();
  let batch = db.batch();
  let pending = 0;
  for (const r of recs.docs) {
    const petId = String(r.data().petId ?? "");
    if (!petId) continue;
    if (!owners.has(petId)) {
      owners.set(petId, (await db.collection("pets").doc(petId).get()).data()?.ownerID ?? null);
    }
    const ownerId = owners.get(petId);
    if (ownerId && r.data().ownerId !== ownerId) {
      batch.update(r.ref, { ownerId });
      records++;
      if (++pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
    }
  }
  if (pending) await batch.commit();
  return { profiles, records };
});
