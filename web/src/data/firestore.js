import { useEffect, useState } from 'react';
import {
  db, collection, doc, query, where, onSnapshot, setDoc, addDoc, updateDoc,
} from '../config/firebase';
import { toMillis } from '../lib/format.js';
import { resolveSpecies } from '../lib/species.js';

/* ───────────────────────────────────────────────────────────
   Normalisers — accept every field name the Flutter app and
   the previous web app have written, return one clean shape.
   ─────────────────────────────────────────────────────────── */

const n = (v, d = 0) => (typeof v === 'number' ? v : (parseFloat(v) || d));
const bool = (v) => v === true || v === 'true' || v === 1;

export function normVariantOption(v, fallbackPrice = 0, fallbackStock = null) {
  if (!v) return null;
  if (typeof v === 'string') {
    const label = v.trim();
    return label ? { label, sku: '', price: null, compareAt: null, stockCount: null } : null;
  }
  if (typeof v === 'object') {
    const label = String(v.label || v.name || v.size || v.value || '').trim();
    if (!label) return null;
    return {
      label,
      sku: String(v.sku || ''),
      price: v.price != null && v.price !== '' ? n(v.price, fallbackPrice) : null,
      compareAt: v.compareAt != null && v.compareAt !== '' ? n(v.compareAt, 0) : null,
      stockCount: v.stockCount != null && v.stockCount !== '' ? n(v.stockCount, fallbackStock ?? 0) : null,
    };
  }
  return null;
}

export function normProduct(id, d = {}) {
  const rawVariants = Array.isArray(d.variantOptions) && d.variantOptions.length
    ? d.variantOptions
    : (Array.isArray(d.variants) ? d.variants : (Array.isArray(d.sizes) ? d.sizes : []));
  const basePrice = n(d.price);
  const baseStock = n(d.stockCount, 0);
  const variantOptions = rawVariants.map((v) => normVariantOption(v, basePrice, baseStock)).filter(Boolean);
  const variants = variantOptions.map((vo) => vo.label);

  return {
    id,
    name: d.name || 'Product',
    brand: d.brand || 'Pet Maya',
    category: String(d.category || 'supplies').toLowerCase(),
    pet: String(d.pet || d.petType || d.species || 'both').toLowerCase(),
    price: basePrice,
    compareAt: n(d.compareAt || d.originalPrice || d.mrp, 0) || null,
    rating: n(d.rating, 4.8),
    ratingCount: n(d.ratingCount || d.reviewsCount, 0),
    image: d.imageUrl || d.image || '',
    images: Array.isArray(d.images) ? d.images : [],
    shortDescription: d.shortDescription || d.shortDesc || (d.description ? String(d.description).slice(0, 110) : ''),
    description: d.longDescription || d.description || d.shortDescription || '',
    ingredients: d.ingredients || d.composition || '',
    usageInstructions: d.usageInstructions || d.dosingGuide || '',
    suitableAge: d.suitableAge || d.lifeStage || 'All life stages',
    isRx: bool(d.isRx) || bool(d.requiresPrescription),
    coldChain: bool(d.coldChain) || bool(d.isColdChain),
    showOnStorefront: d.showOnStorefront !== false,
    autoRefill: bool(d.autoRefill),
    subscribe: bool(d.subscribe) || bool(d.autoRefill),
    inStock: d.inStock !== false && d.inStock !== 'false',
    stockCount: baseStock,
    stockTarget: n(d.stockTarget, 0) || Math.max(100, baseStock),
    reorderPoint: n(d.reorderPoint, 20),
    sku: d.sku || `PM-${String(id).slice(0, 5).toUpperCase()}`,
    barcode: String(d.barcode || ''),
    cost: n(d.cost ?? d.costPrice, 0),
    unit: d.unit || 'pc',
    supplier: d.supplier || d.brand || '',
    expiresInDays: d.expiresInDays != null ? n(d.expiresInDays) : null,
    badge: d.badge || '',
    variants,
    variantOptions,
  };
}

export const ORDER_STATUSES = ['Rx review', 'Packing', 'In transit', 'Delivered', 'Return', 'Cancelled'];

export function normStatus(s = '') {
  const v = String(s).toLowerCase();
  if (/cancel/.test(v)) return 'Cancelled';
  if (/return|refund/.test(v)) return 'Return';
  if (/deliver(ed)?$|complete/.test(v) && !/out for/.test(v)) return 'Delivered';
  if (/transit|ship|dispatch|out for|on the way/.test(v)) return 'In transit';
  if (/rx|review|verif|prescription/.test(v)) return 'Rx review';
  return 'Packing';
}

export function normOrder(id, d = {}) {
  const items = (Array.isArray(d.items) ? d.items : []).map((i) => ({
    id: i.id || i.productId || '',
    name: i.name || 'Item',
    brand: i.brand || '',
    sku: i.sku || '',
    price: n(i.price),
    basePrice: i.basePrice != null ? n(i.basePrice) : n(i.price),
    qty: n(i.qty || i.quantity, 1),
    image: i.image || i.imageUrl || '',
    isRx: bool(i.isRx),
    coldChain: bool(i.coldChain),
    subscribe: bool(i.subscribe),
    coursePacks: n(i.coursePacks, 1),
    variant: i.variant || i.specBadge || '',
    variantLabel: i.variantLabel || '',
  }));
  const subtotal = d.subtotal != null ? n(d.subtotal) : items.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = n(d.discount);
  const shipping = n(d.shipping ?? d.shippingCharges);
  const placedAt = toMillis(d.placedAt || d.timestamp || d.createdAt || d.date);
  const patient = String(d.patient || '');
  const payment = d.payment || d.paymentMethod || 'Cash on delivery';
  const paymentTrxId = String(d.paymentTrxId || d.trxId || '').trim();
  const paymentSender = String(d.paymentSender || '').trim();
  const status = normStatus(d.status);
  const paymentStatus = d.paymentStatus
    || (status === 'Cancelled'
      ? 'cancelled'
      : status === 'Return'
        ? 'refund_pending'
        : status === 'Delivered'
          ? 'paid'
          : paymentTrxId
            ? 'verification_pending'
            : 'cod_pending');
  return {
    id: d.orderId || id,
    docId: id,
    userId: d.userId || '',
    customer: d.customer || d.customerName || d.name || d.userName || 'Customer',
    phone: d.phone || '',
    email: d.email || '',
    pet: d.pet || patient.split(' (')[0] || '',
    district: d.district || d.city || 'Dhaka',
    deliveryZone: d.deliveryZone || ((d.district || d.city || 'Dhaka') === 'Dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'),
    area: d.area || (d.deliveryAddress ? String(d.deliveryAddress).split(',').slice(-2, -1)[0]?.trim() : '') || '',
    address: d.address || d.deliveryAddress || '',
    items,
    subtotal,
    discount,
    coupon: d.coupon || d.couponCode || '',
    shipping,
    total: d.total != null ? n(d.total) : Math.max(0, subtotal - discount + shipping),
    status,
    rawStatus: d.status || '',
    rxStatus: d.rxStatus || '',
    payment,
    paymentStatus,
    paymentTrxId,
    paymentSender,
    paidAt: toMillis(d.paidAt),
    paidVerifiedBy: d.paidVerifiedBy || '',
    placedAt,
    courier: d.courier || '',
    delivery: d.delivery || 'Standard',
    deliveryNote: d.deliveryNote || '',
    cancelReason: d.cancelReason || '',
    cancelledAt: toMillis(d.cancelledAt),
    returnRequest: d.returnRequest || null,
    refundRecord: d.refundRecord || null,
    refundedAt: toMillis(d.refundedAt),
    auditLog: Array.isArray(d.auditLog) ? d.auditLog : [],
    priceCheck: d.priceCheck || '',
    priceCheckNotes: Array.isArray(d.priceCheckNotes) ? d.priceCheckNotes : [],
    notes: Array.isArray(d.notes) ? d.notes : [],
    timeline: Array.isArray(d.timeline) ? d.timeline : [],
    prescriptionUrl: d.prescriptionUrl || '',
    prescriber: d.prescriber || '',
    prescriberLicence: d.prescriberLicence || '',
    temps: Array.isArray(d.temps) ? d.temps : null,
    deliveredAt: toMillis(d.deliveredAt),
    hasRx: items.some((i) => i.isRx) || bool(d.hasRx),
    hasCold: items.some((i) => i.coldChain),
    stockDeducted: bool(d.stockDeducted),
  };
}

export function normVet(id, d = {}) {
  return {
    id,
    name: d.name || 'Specialist',
    specialty: d.specialty || d.speciality || d.qualificationArea || (d.tag && d.tag !== 'Veterinarian' ? d.tag : '') || 'General practice',
    tag: d.tag || 'Veterinarian',
    qualification: d.qualification || '',
    price: n(String(d.price ?? '').replace(/[^\d.]/g, ''), 500),
    rating: n(d.rating, 5),
    reviewsCount: n(d.reviewsCount ?? d.reviews, 0),
    availability: d.availability || d.businessHours || 'See schedule',
    focus: Array.isArray(d.focus) ? d.focus : (Array.isArray(d.tags) ? d.tags : []),
    bio: d.bio || '',
    photo: d.photoUrl || d.photo || '',
    clinic: d.clinic || '',
    phone: d.phone || '',
    emergency: bool(d.emergency) || /emergenc/i.test(d.specialty || d.tag || ''),
    isVerified: d.isVerified !== false,
  };
}

export function normPet(id, d = {}) {
  const list = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  return {
    id,
    ownerID: d.ownerID || d.ownerId || '',
    name: d.name || 'Pet',
    // The stored type is often just the old default "Dog": read the breed too (lib/species.js), like the mobile app does.
    species: resolveSpecies({ type: d.type, species: d.species, breed: d.breed }),
    breed: d.breed || '',
    age: d.age || '',
    dob: d.dob || '',
    weight: d.weight || '',
    height: d.height || '',
    color: d.color || '',
    gender: d.gender || '',
    neutered: bool(d.neutered) || bool(d.isNeutered),
    photo: d.photoUrl || d.photo || '',
    microchip: d.microchip || d.microchipId || '',
    nextVaccine: d.nextVaccine || '',
    bio: d.description || '',
    mood: d.mood || '',
    sound: d.sound || '',
    healthIndex: Number.isFinite(Number(d.healthIndex)) && d.healthIndex !== null ? Number(d.healthIndex) : null,
    allergies: Array.isArray(d.allergies) ? list(d.allergies).join(', ') : String(d.allergies || ''),
    foodName: d.currentFoodName || '',
    foodType: d.foodType || '',
    calorieGoal: Number(d.dailyCalorieGoal) || 0,
    feedingTimes: list(d.feedingTimes),
    vaccination: typeof d.vaccinationDetails === 'string' ? d.vaccinationDetails : '',
  };
}

export function normUser(id, d = {}) {
  const addr = String(d.address || '');
  return {
    id,
    uid: d.uid || id,
    name: (d.name || d.displayName || '').trim() || 'Pet parent',
    email: d.email || '',
    phone: d.phone || '',
    address: addr,
    area: d.area || addr.split(',').slice(-2, -1)[0]?.trim() || addr.split(',')[0] || '',
    city: d.city || 'Dhaka',
    role: d.role || 'Pet Owner',
    staffRole: d.staffRole || '',
    photo: d.photoUrl || d.photoURL || '',
    createdAt: toMillis(d.createdAt),
    points: n(d.points),
  };
}

export function normEvent(id, d = {}) {
  let start = toMillis(d.start || d.startAt);
  if (!start) {
    const date = toMillis(d.date);
    const t = String(d.fromTime || d.time || '').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (date) {
      const dt = new Date(date);
      if (t) {
        let h = Number(t[1]) % 12;
        if (/pm/i.test(t[3] || '') || (!t[3] && Number(t[1]) < 8)) h += 12;
        if (!t[3] && Number(t[1]) >= 12) h = Number(t[1]);
        dt.setHours(h, Number(t[2] || 0), 0, 0);
      }
      start = dt.getTime();
    }
  }
  return {
    id,
    pet: d.petName || d.pet || 'Pet',
    reason: d.reason || d.title || 'Consultation',
    doctor: d.doctor || d.vetName || d.providerName || '',
    vetId: d.vetId || d.providerId || '',
    start,
    minutes: n(d.minutes || d.duration, 60),
    mode: /video|tele/i.test(d.mode || '') ? 'Video' : 'Clinic',
    status: d.status || 'Confirmed',
    userId: d.userId || '',
    customer: d.ownerName || d.customer || '',
    urgent: bool(d.urgent) || /urgent|emergenc/i.test(d.title || d.reason || ''),
  };
}

export function normPost(id, d = {}) {
  return {
    id,
    author: d.userName || d.author || d.authorName || 'Pet parent',
    authorPhoto: d.userPhoto || d.authorPhoto || '',
    userId: d.userId || d.authorId || '',
    category: d.category || d.postType || 'Moment',
    petTag: d.petTag || '',
    title: d.title || '',
    content: d.content || d.text || '',
    image: d.imageUrl || d.image || '',
    likes: n(d.likesCount ?? d.likes),
    comments: n(d.commentsCount ?? (Array.isArray(d.comments) ? d.comments.length : d.comments)),
    time: toMillis(d.timestamp || d.createdAt || d.time),
    metrics: d.metrics || null,
    vetNote: d.vetNote || null,
    scores: d.scores || null,
    isAmberAlert: bool(d.isAmberAlert),
    isResolved: bool(d.isResolved),
    petName: d.petName || '',
    petBreed: d.petBreed || '',
    location: d.location || '',
    microchipId: d.microchipId || '',
    contactPhone: d.contactPhone || '',
  };
}

export function normBlog(id, d = {}) {
  const body = d.content || d.body || '';
  return {
    id,
    title: d.title || 'Untitled',
    excerpt: d.excerpt || d.summary || String(body).replace(/<[^>]+>/g, '').slice(0, 160),
    category: d.category || 'Pet care',
    author: d.authorName || d.author || 'Pet Maya',
    readMin: n(d.readMin || d.readTime, Math.max(3, Math.round(String(body).split(/\s+/).length / 220))),
    date: d.date || '',
    image: d.coverUrl || d.coverImage || d.imageUrl || d.image || '',
    featured: bool(d.featured),
    tone: d.tone || '',
    content: body,
  };
}

/* ───────────────────────────────────────────────────────────
   Live collection hook with sample fallback
   ─────────────────────────────────────────────────────────── */

export function useCollection(name, { map = (id, d) => ({ id, ...d }), sample = [], filters = [], enabled = true, sampleWhenEmpty = true } = {}) {
  const key = JSON.stringify(filters);
  const [state, setState] = useState({ items: sample, loading: enabled, live: false });

  useEffect(() => {
    if (!enabled) { setState({ items: sample, loading: false, live: false }); return undefined; }
    let unsub = () => {};
    try {
      const ref = collection(db, name);
      const q = filters.length ? query(ref, ...filters.map(([f, op, v]) => where(f, op, v))) : ref;
      unsub = onSnapshot(q, (snap) => {
        if (snap.empty) {
          setState({ items: sampleWhenEmpty ? sample : [], loading: false, live: !sampleWhenEmpty });
        } else {
          setState({ items: snap.docs.map((s) => map(s.id, s.data())), loading: false, live: true });
        }
      }, () => setState({ items: sample, loading: false, live: false }));
    } catch {
      setState({ items: sample, loading: false, live: false });
    }
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key, enabled]);

  return state;
}

/* ───────────────────────────────────────────────────────────
   Writes — merge so fields used by the Flutter app survive.
   ─────────────────────────────────────────────────────────── */

export async function saveDoc(name, id, data) {
  await setDoc(doc(db, name, id), { ...data, updatedAt: Date.now() }, { merge: true });
}

export async function addDocument(name, data) {
  const ref = await addDoc(collection(db, name), { ...data, createdAt: new Date().toISOString(), timestamp: Date.now() });
  return ref.id;
}

export async function patchDoc(name, id, data) {
  await updateDoc(doc(db, name, id), { ...data, updatedAt: Date.now() });
}

/** Live single document. Returns { data, loading } and never throws. */
export function useDoc(name, id, { map = (i, d) => ({ id: i, ...d }), enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: !!enabled });
  useEffect(() => {
    if (!enabled || !id) { setState({ data: null, loading: false }); return undefined; }
    let unsub = () => {};
    try {
      unsub = onSnapshot(doc(db, name, id),
        (snap) => setState({ data: snap.exists() ? map(snap.id, snap.data()) : null, loading: false }),
        () => setState({ data: null, loading: false }));
    } catch { setState({ data: null, loading: false }); }
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, id, enabled]);
  return state;
}
