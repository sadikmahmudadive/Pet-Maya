import {
  db, doc, collection, addDoc, setDoc, updateDoc, increment, arrayUnion, arrayRemove,
} from '../config/firebase';

/* ───────────────────────────────────────────────────────────
   Every Firestore write the storefront makes lives here, so
   collection names and field shapes stay in one place and
   match what the Flutter app already reads.

   Each function resolves to { ok, reason? } and never throws —
   a failed write must not break the page the visitor is on.
   ─────────────────────────────────────────────────────────── */

const ok = { ok: true };
const fail = (e) => ({
  ok: false,
  reason: /permission|insufficient/i.test(String(e?.code || e?.message)) ? 'permission' : 'network',
});

export const isRealUser = (u) => !!(u && u.uid && !String(u.uid).startsWith('demo_guest'));

/* ── Stock ─────────────────────────────────────────────────── */

/** Reduces stockCount for each ordered line. Runs after the order is written. */
export async function decrementStock(items = []) {
  const byId = {};
  items.forEach((i) => { if (i.id) byId[i.id] = (byId[i.id] || 0) + (Number(i.qty) || 1); });
  const ids = Object.keys(byId);
  if (!ids.length) return ok;
  try {
    await Promise.all(ids.map((id) => updateDoc(doc(db, 'products', id), {
      stockCount: increment(-byId[id]),
      unitsSold: increment(byId[id]),
      updatedAt: Date.now(),
    })));
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Loyalty points ────────────────────────────────────────── */

export async function awardPoints(user, points, note = '') {
  if (!isRealUser(user) || !points) return ok;
  try {
    await updateDoc(doc(db, 'users', user.uid), { points: increment(points), lastPointsNote: note, updatedAt: Date.now() });
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Notifications ─────────────────────────────────────────── */
/* Stored at notifications/{uid}/items/{autoId} — the same path
   the mobile app's notification centre reads.                 */

export async function notify(user, { title, body, category = 'system', url = '' }) {
  if (!isRealUser(user)) return ok;
  try {
    await addDoc(collection(db, 'notifications', user.uid, 'items'), {
      title, body, category, url, read: false, timestamp: Date.now(), createdAt: new Date().toISOString(),
    });
    return ok;
  } catch (e) { return fail(e); }
}

export async function markNotificationRead(user, id) {
  if (!isRealUser(user)) return ok;
  try {
    await updateDoc(doc(db, 'notifications', user.uid, 'items', id), { read: true });
    return ok;
  } catch (e) { return fail(e); }
}

export async function markAllNotificationsRead(user, ids = []) {
  if (!isRealUser(user) || !ids.length) return ok;
  try {
    await Promise.all(ids.map((id) => updateDoc(doc(db, 'notifications', user.uid, 'items', id), { read: true })));
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Wishlist ──────────────────────────────────────────────── */
/* Mirrored on the user document so saved items follow the
   visitor between devices and into the app.                   */

export async function syncWishlist(user, productId, add) {
  if (!isRealUser(user)) return ok;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      wishlist: add ? arrayUnion(productId) : arrayRemove(productId),
      updatedAt: Date.now(),
    }, { merge: true });
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Reviews ───────────────────────────────────────────────── */

export async function saveReview({ user, product, rating, title, text }) {
  if (!isRealUser(user)) return { ok: false, reason: 'signin' };
  try {
    await addDoc(collection(db, 'reviews'), {
      productId: product.id,
      productName: product.name,
      userId: user.uid,
      userName: user.name || 'Pet parent',
      userPhoto: user.photoUrl || '',
      rating: Number(rating) || 5,
      title: title || '',
      text: text || '',
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    });
    // Keep the product's headline rating roughly in step.
    try {
      const prev = Number(product.rating) || 0;
      const count = Number(product.ratingCount) || 0;
      await updateDoc(doc(db, 'products', product.id), {
        ratingCount: increment(1),
        rating: Number((((prev * count) + Number(rating)) / (count + 1)).toFixed(2)),
      });
    } catch { /* the review itself is what matters */ }
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Community comments ────────────────────────────────────── */

export async function addComment(postId, user, text) {
  if (!isRealUser(user)) return { ok: false, reason: 'signin' };
  try {
    await addDoc(collection(db, 'community_posts', postId, 'comments'), {
      userId: user.uid,
      userName: user.name || 'Pet parent',
      userPhoto: user.photoUrl || '',
      text,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    });
    try { await updateDoc(doc(db, 'community_posts', postId), { commentsCount: increment(1) }); } catch { /* count is cosmetic */ }
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Triage results ────────────────────────────────────────── */
/* Saved into service_records so the result shows up in the
   pet's Health Vault timeline and in the mobile app.          */

export async function saveTriageRecord({ user, pet, result, region, duration }) {
  if (!isRealUser(user)) return ok;
  try {
    await addDoc(collection(db, 'service_records'), {
      userId: user.uid,
      petId: pet?.id || '',
      petName: pet?.name || 'Pet',
      ownerName: user.name || '',
      serviceType: 'Symptom check',
      diagnosis: result.summary,
      urgency: result.tier,
      area: region,
      duration,
      prescription: 'None',
      cost: 0,
      source: 'web-triage',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    });
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Newsletter ────────────────────────────────────────────── */
/* Needs a rule for the `newsletter` collection; until that
   exists this returns { ok:false, reason:'permission' } and
   the caller says so rather than pretending it worked.        */

export async function subscribeNewsletter(email, source = 'footer') {
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false, reason: 'email' };
  try {
    await setDoc(doc(db, 'newsletter', clean.replace(/[^a-z0-9@._-]/g, '')), {
      email: clean, source, subscribedAt: Date.now(), createdAt: new Date().toISOString(),
    }, { merge: true });
    return ok;
  } catch (e) { return fail(e); }
}

/* ── Pets ──────────────────────────────────────────────────── */

export async function savePet(user, pet) {
  if (!isRealUser(user)) return { ok: false, reason: 'signin' };
  try {
    const id = pet.id || `pet_${Date.now()}`;
    await setDoc(doc(db, 'pets', id), {
      ...pet,
      id,
      type: pet.species,
      ownerID: user.uid,
      updatedAt: Date.now(),
      ...(pet.id ? {} : { createdAt: new Date().toISOString() }),
    }, { merge: true });
    return { ...ok, id };
  } catch (e) { return fail(e); }
}

/* ── Appointments ──────────────────────────────────────────── */

export async function bookAppointment(user, data) {
  if (!isRealUser(user)) return { ok: false, reason: 'signin' };
  try {
    const ref = await addDoc(collection(db, 'events'), { ...data, userId: user.uid, createdAt: new Date().toISOString(), timestamp: Date.now() });
    return { ...ok, id: ref.id };
  } catch (e) { return fail(e); }
}
