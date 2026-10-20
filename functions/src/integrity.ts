/**
 * Server-side replacements for writes that clients used to make on other
 * people's documents, plus data the security rules rely on:
 *
 *  apply_referral         — credits a referrer (+5) once per user, transactionally.
 *  sync_public_profile    — mirrors name/photo/role into public_profiles/{uid}, so
 *                           users/{uid} (email, phone, address) can stay private.
 *  stamp_record_owner     — stamps service_records.ownerId from the pet, which the
 *                           rules use to give owners access to their pets' records.
 *  create_order           — server-authoritative checkout transaction (stock check,
 *                           variant/course pricing, coupon validation, Dhaka/Outside
 *                           Dhaka shipping, and guest + signed-in order creation).
 *  check_order_prices     — recomputes order totals from the catalogue and flags
 *                           tampered prices/discounts for staff (priceCheck).
 *  backfill_security_data — one-off admin job for documents written before the above.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { clip, isAdminRole, rateLimit, requireUser } from "./security";

const REFERRAL_POINTS = 5;
const FREE_DELIVERY_OVER = 2500;
const INSIDE_DHAKA_FEE = 60;
const INSIDE_DHAKA_EXPRESS_FEE = 120;
const OUTSIDE_DHAKA_FEE = 130;
const COLD_STANDARD_FEE = 150;
const COLD_DISTRICTS = ["Dhaka", "Gazipur", "Narayanganj"];

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

/**
 * Computes the expected catalogue unit price for a line item, accounting for:
 * - Variant-specific price in `product.variantOptions`
 * - Course pack bundles (3 packs = 3% off, 6 packs = 5% off)
 * - Auto-refill subscription (5% off when product allows subscribe/autoRefill)
 */
export function computeCatalogueUnitPrice(product: Record<string, any>, rawItem: Record<string, any> = {}): number {
  let basePrice = Number(product.price) || 0;
  const variantStr = String(rawItem.variantLabel || rawItem.variant || "").split(" · ")[0].trim();
  if (variantStr && Array.isArray(product.variantOptions)) {
    const vo = product.variantOptions.find((x: any) => String(x?.label || "").trim() === variantStr);
    if (vo && Number(vo.price) > 0) {
      basePrice = Number(vo.price);
    }
  }
  const fullVariant = String(rawItem.variant || "");
  const packMatch = fullVariant.match(/(\d+)\s*packs/i);
  const packsRaw = Number(rawItem.coursePacks) || (packMatch ? Number(packMatch[1]) : 1);
  const packs = packsRaw === 3 || packsRaw === 6 ? packsRaw : 1;
  const courseSave = packs === 6 ? 5 : packs === 3 ? 3 : 0;
  const canSub = Boolean(product.subscribe || product.autoRefill || product.isRx);
  const isRefill = canSub && (rawItem.subscribe === true || /auto-refill/i.test(fullVariant));
  const unit = Math.round(basePrice * (1 - courseSave / 100) * (isRefill ? 0.95 : 1));
  return unit * packs;
}

export const create_order = onCall(async (request) => {
  const uid = request.auth?.uid || "guest";
  const callerKey = request.auth?.uid
    || crypto.createHash("sha256").update(String(request.rawRequest?.ip || "anon")).digest("hex").slice(0, 16);
  await rateLimit("create_order", callerKey, [{ limit: 15, seconds: 600 }, { limit: 40, seconds: 86_400 }]);

  const data = request.data ?? {};
  const rawItems: any[] = Array.isArray(data.items) ? data.items.slice(0, 50) : [];
  const lines = orderLines(rawItems);
  if (lines.length === 0) {
    throw new HttpsError("invalid-argument", "Your bag is empty.");
  }

  const customer = clip(data.customer ?? data.name, 100);
  const phone = clip(data.phone, 30);
  const address = clip(data.address ?? data.deliveryAddress, 400);
  const district = clip(data.district ?? data.city, 60) || "Dhaka";
  const area = clip(data.area, 100);
  if (!customer || !phone || !address) {
    throw new HttpsError("invalid-argument", "Name, phone number and delivery address are required.");
  }

  const db = admin.firestore();
  const orderId = /^PM-\d{5}$/.test(String(data.orderId || ""))
    ? String(data.orderId)
    : `PM-${Math.floor(10000 + Math.random() * 89999)}`;
  const couponCode = clip(data.coupon, 30).toUpperCase();

  // Look up coupon before transaction if provided
  let couponSnap: admin.firestore.QueryDocumentSnapshot | null = null;
  if (couponCode && !["PETMAYA10", "MAYA10", "FREESHIP"].includes(couponCode)) {
    const q = await db.collection("coupons").where("code", "==", couponCode).limit(1).get();
    if (!q.empty) couponSnap = q.docs[0];
  }

  const result = await db.runTransaction(async (tx) => {
    const prodRefs = lines.map((l) => db.collection("products").doc(l.id));
    const prodSnaps = await tx.getAll(...prodRefs);

    let subtotal = 0;
    let needsRx = false;
    let needsCold = false;
    const verifiedItems: Record<string, any>[] = [];
    const stockDeductions = new Map<string, number>();

    lines.forEach((l, idx) => {
      const snap = prodSnaps[idx];
      const p = snap?.data();
      const raw = rawItems[idx] || {};
      if (!p) {
        throw new HttpsError("not-found", `Product "${raw.name || l.id}" is no longer available.`);
      }
      const packs = Math.max(1, Number(raw.coursePacks) || 1);
      const unitsNeeded = l.qty * (packs === 3 || packs === 6 ? packs : 1);
      const currentStock = Number(p.stockCount ?? 0);
      if (p.inStock === false || currentStock < unitsNeeded) {
        throw new HttpsError("failed-precondition", `${p.name || l.id} is out of stock (only ${Math.max(0, currentStock)} left).`);
      }

      const unitPrice = computeCatalogueUnitPrice(p, raw);
      subtotal += unitPrice * l.qty;
      const itemRx = Boolean(p.isRx || p.requiresPrescription);
      const itemCold = Boolean(p.coldChain || p.isColdChain);
      if (itemRx) needsRx = true;
      if (itemCold) needsCold = true;

      stockDeductions.set(l.id, (stockDeductions.get(l.id) || 0) + unitsNeeded);
      verifiedItems.push({
        id: l.id,
        name: clip(p.name || raw.name, 140),
        brand: clip(p.brand || raw.brand, 80),
        sku: clip(raw.sku || p.sku, 40),
        price: unitPrice,
        qty: l.qty,
        variant: clip(raw.variant, 100),
        variantLabel: clip(raw.variantLabel, 60),
        coursePacks: packs === 3 || packs === 6 ? packs : 1,
        subscribe: Boolean(raw.subscribe),
        isRx: itemRx,
        coldChain: itemCold,
        image: clip(p.imageUrl || p.image || raw.image, 500),
      });
    });

    if (needsCold && !COLD_DISTRICTS.includes(district)) {
      throw new HttpsError(
        "failed-precondition",
        `Cold-chain medicines (2°C–8°C) can only be delivered within ${COLD_DISTRICTS.join(", ")}.`,
      );
    }

    const payment = clip(data.payment ?? data.paymentMethod, 40) || "bKash";
    const isCod = /cash|cod/i.test(payment);
    if (needsRx && isCod) {
      throw new HttpsError("failed-precondition", "Prescription orders require digital payment (bKash, Nagad, or Card).");
    }

    // Coupon discount calculation
    let discount = 0;
    let freeShippingCoupon = false;
    if (couponSnap) {
      const cDoc = await tx.get(couponSnap.ref);
      const c = cDoc.data();
      const valid = c && c.active !== false
        && (!c.expiresAt || Number(c.expiresAt) > Date.now())
        && (!c.maxUsage || Number(c.usageCount || 0) < Number(c.maxUsage))
        && subtotal >= Number(c.minOrder || 0);
      if (valid) {
        if (c.discountType === "percent") {
          discount = Math.round((subtotal * (Number(c.value) || 0)) / 100);
        } else {
          discount = Math.min(subtotal, Math.round(Number(c.value) || 0));
        }
        if (couponCode === "FREESHIP") freeShippingCoupon = true;
        tx.update(couponSnap.ref, {
          usageCount: admin.firestore.FieldValue.increment(1),
          updatedAt: Date.now(),
        });
      }
    } else if (couponCode === "PETMAYA10" || couponCode === "MAYA10") {
      discount = Math.round(subtotal * 0.10);
    } else if (couponCode === "FREESHIP") {
      freeShippingCoupon = true;
    }

    const freeShip = freeShippingCoupon || (subtotal - discount) >= FREE_DELIVERY_OVER;
    const deliveryLabel = clip(data.delivery, 80) || "Standard";
    const isInsideDhaka = district === "Dhaka";
    let shipping = 0;
    if (needsCold) {
      shipping = /next day|standard/i.test(deliveryLabel) ? COLD_STANDARD_FEE : 0;
    } else if (isInsideDhaka) {
      shipping = /express/i.test(deliveryLabel) ? INSIDE_DHAKA_EXPRESS_FEE : (freeShip ? 0 : INSIDE_DHAKA_FEE);
    } else {
      shipping = freeShip ? 0 : OUTSIDE_DHAKA_FEE;
    }

    const total = Math.max(0, subtotal - discount + shipping);
    const now = Date.now();
    const orderDocRef = db.collection("orders").doc();

    // Deduct stock atomically
    stockDeductions.forEach((units, prodId) => {
      tx.update(db.collection("products").doc(prodId), {
        stockCount: admin.firestore.FieldValue.increment(-units),
        unitsSold: admin.firestore.FieldValue.increment(units),
        updatedAt: now,
      });
    });

    const orderPayload: Record<string, any> = {
      orderId,
      userId: uid,
      isGuest: uid === "guest",
      customer,
      email: clip(data.email, 160),
      phone,
      address,
      deliveryAddress: address,
      area,
      district,
      city: district,
      deliveryZone: isInsideDhaka ? "Inside Dhaka" : "Outside Dhaka",
      deliveryNote: clip(data.deliveryNote ?? data.note, 300),
      delivery: deliveryLabel,
      items: verifiedItems,
      subtotal,
      discount,
      coupon: discount > 0 || freeShippingCoupon ? couponCode : "",
      shipping,
      total,
      payment,
      paymentMethod: payment,
      paymentStatus: isCod ? "cod_pending" : "paid",
      smsUpdates: data.smsUpdates !== false,
      prescriptionUrl: clip(data.prescriptionUrl, 500),
      pet: clip(data.pet, 60),
      patient: clip(data.patient, 120),
      status: needsRx ? "Rx review" : "Packing",
      rxStatus: needsRx ? "pending" : "",
      hasRx: needsRx,
      hasCold: needsCold,
      stockDeducted: true,
      priceCheck: "ok",
      verifiedSubtotal: subtotal,
      verifiedTotal: total,
      priceCheckedAt: now,
      placedAt: now,
      createdAt: new Date(now).toISOString(),
      timestamp: now,
      date: new Date(now).toISOString().split("T")[0],
      timeline: [{ status: "Placed", at: now, by: customer }],
      ...(data._track && typeof data._track === "object" ? { _track: data._track } : {}),
    };

    tx.set(orderDocRef, orderPayload);

    if (uid !== "guest") {
      const points = Math.max(5, Math.round(total / 100));
      tx.set(db.collection("users").doc(uid), {
        points: admin.firestore.FieldValue.increment(points),
        lastPointsNote: `Order ${orderId}`,
        updatedAt: now,
      }, { merge: true });
      tx.set(db.collection("notifications").doc(uid).collection("items").doc(), {
        title: "Order placed",
        body: needsRx
          ? `${orderId} is with our vet for a prescription check. We'll message you once it's approved.`
          : `${orderId} is being packed. You'll get an update when it's on the way.`,
        category: "order",
        url: `/account/orders/${orderId}`,
        read: false,
        isRead: false,
        timestamp: now,
        createdAt: new Date(now).toISOString(),
      });
    }

    return { ok: true, orderId, docId: orderDocRef.id };
  });

  return result;
});

export const check_order_prices = onDocumentCreated("orders/{orderId}", async (event) => {
  const order = event.data?.data();
  if (!order) return;
  // Orders created via create_order are already verified in the transaction.
  if (order.priceCheck === "ok" && order.stockDeducted === true) return;

  const db = admin.firestore();
  const rawItems: any[] = Array.isArray(order.items) ? order.items : [];
  const lines = orderLines(rawItems);
  const refs = lines.map((l) => db.collection("products").doc(l.id));
  const snaps = refs.length ? await db.getAll(...refs) : [];

  const problems: string[] = [];
  let catalogueSubtotal = 0;
  lines.forEach((l, i) => {
    const p = snaps[i]?.data();
    if (!p) { problems.push(`unknown product ${l.id}`); return; }
    const expectedPrice = computeCatalogueUnitPrice(p, rawItems[i] || {});
    const flatPrice = Number(p.price) || 0;
    const matchedPrice = Math.abs(expectedPrice - l.price) <= 1 ? expectedPrice : flatPrice;
    catalogueSubtotal += matchedPrice * l.qty;
    if (Math.abs(expectedPrice - l.price) > 1 && Math.abs(flatPrice - l.price) > 1) {
      problems.push(`${l.id}: charged ${l.price}, catalogue ${expectedPrice}`);
    }
  });

  const claimedSubtotal = Number(order.subtotal) || 0;
  const discount = Number(order.discount) || 0;
  if (Math.abs(claimedSubtotal - catalogueSubtotal) > 2) {
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
