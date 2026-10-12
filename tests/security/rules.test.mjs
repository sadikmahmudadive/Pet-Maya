// Security-rule tests for firestore.rules and storage.rules.
// Run from this folder: npm install && npm test   (needs Java + Firebase CLI;
// emulators:exec sets FIRESTORE_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST)
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where,
  increment, arrayUnion, deleteField,
} from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-petmaya',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
    storage: { rules: readFileSync(new URL('../../storage.rules', import.meta.url), 'utf8') },
  });
});
after(async () => { await env?.cleanup(); });

const USERS = {
  alice: { name: 'Alice', email: 'alice@x.com', phone: '017', role: 'petOwner', isVerified: false, points: 15 },
  bob: { name: 'Bob', email: 'bob@x.com', role: 'petOwner', isVerified: false, points: 15 },
  vet: { name: 'Dr Vet', role: 'veterinarian', isVerified: true },
  fakevet: { name: 'Fake Vet', role: 'veterinarian', isVerified: false },
  shop: { name: 'Shop', role: 'petShop', isVerified: true },
  admin: { name: 'Admin', role: 'admin' },
  cashier: { name: 'Cashier', role: 'petOwner', staffRole: 'Cashier' },
};

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, u] of Object.entries(USERS)) await setDoc(doc(db, 'users', uid), u);
    await setDoc(doc(db, 'pets', 'pet_a'), { ownerID: 'alice', name: 'Piku' });
    await setDoc(doc(db, 'pets', 'pet_b'), { ownerID: 'bob', name: 'Tom' });
    await setDoc(doc(db, 'service_records', 'rec_a'), { petId: 'pet_a', ownerId: 'alice', providerId: 'vet', diagnosis: 'ok' });
    await setDoc(doc(db, 'service_records', 'rec_b'), { petId: 'pet_b', ownerId: 'bob', providerId: 'vet', diagnosis: 'private' });
    await setDoc(doc(db, 'orders', 'o1'), { userId: 'alice', total: 500, status: 'Pending', address: 'Dhaka' });
    await setDoc(doc(db, 'products', 'p1'), { name: 'Food', price: 100, stockCount: 10, unitsSold: 0, rating: 4, ratingCount: 1 });
    await setDoc(doc(db, 'community_posts', 'post1'), {
      userId: 'bob', content: 'hello', likesCount: 0, likedByUserIds: [], userReactions: {}, comments: [],
    });
    await setDoc(doc(db, 'devices', 'PML-0000AAAA'), { ownerId: 'alice', petId: 'pet_a', latitude: 23.8, longitude: 90.4 });
    await setDoc(doc(db, 'notifications', 'alice', 'items', 'n1'), { title: 'Hi', isRead: false });
  });
});

const as = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

// ── Users (PII exposure, privilege escalation) ──────────────────────────────
test('users: private to the owner, admins and staff', async () => {
  await assertFails(getDoc(doc(as(null), 'users', 'alice')));
  await assertFails(getDoc(doc(as('bob'), 'users', 'alice')));
  await assertFails(getDocs(collection(as('bob'), 'users')));
  await assertSucceeds(getDoc(doc(as('alice'), 'users', 'alice')));
  await assertSucceeds(getDocs(collection(as('admin'), 'users')));
  await assertSucceeds(getDoc(doc(as('cashier'), 'users', 'alice')));
});

test('users: sign-up cannot self-grant admin, verification, staff access or points', async () => {
  const db = as('newbie');
  const base = { name: 'N', email: 'n@x.com', role: 'Pet Owner', isVerified: false, points: 25 };
  await assertFails(setDoc(doc(db, 'users', 'newbie'), { ...base, role: 'admin' }));
  await assertFails(setDoc(doc(db, 'users', 'newbie'), { ...base, role: 'veterinarian', isVerified: true }));
  await assertFails(setDoc(doc(db, 'users', 'newbie'), { ...base, staffRole: 'Manager' }));
  await assertFails(setDoc(doc(db, 'users', 'newbie'), { ...base, points: 100000 }));
  await assertFails(setDoc(doc(db, 'users', 'newbie'), { ...base, referredBy: 'PMXXXXXX' }));
  await assertFails(setDoc(doc(as('newbie'), 'users', 'someone_else'), base));
  await assertSucceeds(setDoc(doc(db, 'users', 'newbie'), { ...base, role: 'veterinarian' }));
});

test('users: self-updates are limited to profile fields', async () => {
  const db = as('alice');
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), { name: 'Alice B', phone: '018' }));
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), { points: increment(10) }));
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { points: increment(-5) }));
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { points: increment(100000) }));
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { isVerified: true }));
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { staffRole: 'Manager' }));
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { role: 'Super Admin' }));
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { isSuspended: false, referredBy: 'X' }));
  await assertFails(updateDoc(doc(db, 'users', 'bob'), { name: 'hacked' }));
  // Unverified users may switch to a provider role; verified providers can't move their badge.
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), { role: 'veterinarian' }));
  await assertFails(updateDoc(doc(as('vet'), 'users', 'vet'), { role: 'petShop' }));
  await assertSucceeds(updateDoc(doc(as('admin'), 'users', 'fakevet'), { isVerified: true }));
});

// ── Pets & medical records (broken object-level authorisation) ─────────────
test('pets: owners see their own; only verified providers/admins see everyone’s', async () => {
  await assertSucceeds(getDocs(query(collection(as('alice'), 'pets'), where('ownerID', '==', 'alice'))));
  await assertFails(getDoc(doc(as('alice'), 'pets', 'pet_b')));
  await assertFails(getDocs(collection(as('alice'), 'pets')));
  await assertFails(getDocs(collection(as(null), 'pets')));
  await assertFails(getDocs(collection(as('fakevet'), 'pets')));
  await assertSucceeds(getDocs(collection(as('vet'), 'pets')));
  await assertSucceeds(setDoc(doc(as('alice'), 'pets', 'pet_new'), { ownerID: 'alice', name: 'New' }));
  await assertFails(setDoc(doc(as('alice'), 'pets', 'pet_x'), { ownerID: 'bob', name: 'Planted' }));
  await assertFails(updateDoc(doc(as('alice'), 'pets', 'pet_a'), { ownerID: 'bob' }));
  await assertFails(updateDoc(doc(as('vet'), 'pets', 'pet_a'), { ownerID: 'vet' }));
  await assertSucceeds(updateDoc(doc(as('vet'), 'pets', 'pet_a'), { weight: '12 kg' }));
  await assertFails(deleteDoc(doc(as('bob'), 'pets', 'pet_a')));
});

test('service records: owners only get their pets’ records', async () => {
  await assertSucceeds(getDocs(query(collection(as('alice'), 'service_records'), where('ownerId', '==', 'alice'))));
  await assertFails(getDocs(collection(as('alice'), 'service_records')));
  await assertFails(getDoc(doc(as('alice'), 'service_records', 'rec_b')));
  await assertFails(getDocs(collection(as('fakevet'), 'service_records')));
  await assertSucceeds(getDocs(collection(as('vet'), 'service_records')));
  // Owners may attach reports to their own pets only.
  await assertSucceeds(setDoc(doc(as('alice'), 'service_records', 'r1'), { petId: 'pet_a', ownerId: 'alice', providerId: 'alice' }));
  await assertFails(setDoc(doc(as('alice'), 'service_records', 'r2'), { petId: 'pet_b', ownerId: 'bob', providerId: 'alice' }));
  await assertFails(setDoc(doc(as('alice'), 'service_records', 'r3'), { petId: 'pet_a', ownerId: 'alice', providerId: 'vet' }));
  await assertFails(setDoc(doc(as('fakevet'), 'service_records', 'r4'), { petId: 'pet_b', providerId: 'fakevet' }));
  await assertSucceeds(setDoc(doc(as('vet'), 'service_records', 'r5'), { petId: 'pet_b', ownerId: 'bob', providerId: 'vet' }));
  await assertFails(setDoc(doc(as('vet'), 'service_records', 'r6'), { petId: 'pet_b', ownerId: 'alice', providerId: 'vet' }));
  await assertSucceeds(updateDoc(doc(as('alice'), 'service_records', 'rec_a'), { isSharedWithVets: false }));
  await assertFails(updateDoc(doc(as('alice'), 'service_records', 'rec_a'), { diagnosis: 'forged' }));
});

// ── Orders, products, money ─────────────────────────────────────────────────
test('orders: customers only see and create their own, and can only cancel', async () => {
  await assertFails(getDoc(doc(as('bob'), 'orders', 'o1')));
  await assertFails(getDocs(collection(as('alice'), 'orders')));
  await assertFails(getDocs(collection(as('vet'), 'orders')));
  await assertSucceeds(getDocs(query(collection(as('alice'), 'orders'), where('userId', '==', 'alice'))));
  await assertSucceeds(getDocs(collection(as('shop'), 'orders')));
  await assertSucceeds(getDocs(collection(as('cashier'), 'orders')));
  await assertSucceeds(addDoc(collection(as('bob'), 'orders'), { userId: 'bob', total: 200, status: 'Pending' }));
  await assertFails(addDoc(collection(as('bob'), 'orders'), { userId: 'alice', total: 200 }));
  await assertFails(addDoc(collection(as('bob'), 'orders'), { userId: 'bob', total: 200, priceCheck: 'ok' }));
  await assertFails(addDoc(collection(as('bob'), 'orders'), { userId: 'bob', total: -50 }));
  await assertSucceeds(updateDoc(doc(as('alice'), 'orders', 'o1'), { status: 'Cancelled' }));
  await assertFails(updateDoc(doc(as('alice'), 'orders', 'o1'), { status: 'Delivered' }));
  await assertFails(updateDoc(doc(as('alice'), 'orders', 'o1'), { total: 1 }));
});

test('products: shoppers only make bounded checkout/review changes', async () => {
  const db = as('alice');
  await assertSucceeds(updateDoc(doc(db, 'products', 'p1'), { stockCount: increment(-2), unitsSold: increment(2), updatedAt: 1 }));
  await assertFails(updateDoc(doc(db, 'products', 'p1'), { stockCount: increment(-500), unitsSold: increment(500) }));
  await assertFails(updateDoc(doc(db, 'products', 'p1'), { stockCount: increment(5), unitsSold: increment(-5) }));
  await assertFails(updateDoc(doc(db, 'products', 'p1'), { price: 1 }));
  await assertSucceeds(updateDoc(doc(db, 'products', 'p1'), { ratingCount: increment(1), rating: 4.5 }));
  await assertFails(updateDoc(doc(db, 'products', 'p1'), { ratingCount: increment(1), rating: 50 }));
  await assertFails(setDoc(doc(db, 'products', 'p2'), { name: 'Fake', price: 1 }));
  await assertFails(setDoc(doc(as(null), 'products', 'p2'), { name: 'Fake', price: 1 }));
  await assertSucceeds(updateDoc(doc(as('shop'), 'products', 'p1'), { price: 120 }));
  await assertSucceeds(getDoc(doc(as(null), 'products', 'p1')));
});

// ── Community: reactions can only touch the caller's own entry ─────────────
test('community: likes/comments are limited to my own entry', async () => {
  const db = as('alice');
  await assertSucceeds(updateDoc(doc(db, 'community_posts', 'post1'), {
    likedByUserIds: arrayUnion('alice'), likesCount: increment(1), 'userReactions.alice': 'Like',
  }));
  await assertFails(updateDoc(doc(db, 'community_posts', 'post1'), { likedByUserIds: arrayUnion('carol') }));
  await assertFails(updateDoc(doc(db, 'community_posts', 'post1'), { likesCount: increment(1000) }));
  await assertFails(updateDoc(doc(db, 'community_posts', 'post1'), { 'userReactions.bob': 'Angry' }));
  await assertFails(updateDoc(doc(db, 'community_posts', 'post1'), { content: 'defaced' }));
  await assertSucceeds(updateDoc(doc(db, 'community_posts', 'post1'), {
    commentsCount: increment(1), comments: arrayUnion({ userId: 'alice', text: 'nice' }),
  }));
  await assertFails(updateDoc(doc(db, 'community_posts', 'post1'), { comments: [] }));
  await assertFails(updateDoc(doc(db, 'community_posts', 'post1'), { comments: arrayUnion({ userId: 'bob', text: 'forged' }) }));
  await assertSucceeds(updateDoc(doc(as('bob'), 'community_posts', 'post1'), { content: 'edited by author' }));
  await assertFails(setDoc(doc(db, 'community_posts', 'post2'), { userId: 'bob', content: 'impersonation' }));
  await assertFails(deleteDoc(doc(db, 'community_posts', 'post1')));
});

// ── Notifications (stored XSS / phishing links) ────────────────────────────
test('notifications: only safe internal links, owner-only reads', async () => {
  const items = (uid) => collection(as(uid), 'notifications', 'alice', 'items');
  await assertSucceeds(addDoc(items('bob'), { title: 'Bob liked your post', body: 'x', url: '/community/post1', isRead: false }));
  await assertFails(addDoc(items('bob'), { title: 'x', url: 'javascript:alert(document.cookie)' }));
  await assertFails(addDoc(items('bob'), { title: 'x', url: 'https://evil.example/login' }));
  await assertFails(addDoc(items('bob'), { title: 'x', url: '//evil.example' }));
  await assertFails(addDoc(items('bob'), { title: 'x', fromUserId: 'admin' }));
  await assertFails(addDoc(items(null), { title: 'x' }));
  await assertFails(getDocs(items('bob')));
  await assertSucceeds(getDocs(items('alice')));
  await assertSucceeds(updateDoc(doc(as('alice'), 'notifications', 'alice', 'items', 'n1'), { isRead: true }));
  await assertFails(updateDoc(doc(as('alice'), 'notifications', 'alice', 'items', 'n1'), { title: 'changed' }));
});

// ── Devices (live location) ─────────────────────────────────────────────────
test('devices: owner-only location; clients cannot create or claim collars', async () => {
  await assertSucceeds(getDoc(doc(as('alice'), 'devices', 'PML-0000AAAA')));
  await assertFails(getDoc(doc(as('bob'), 'devices', 'PML-0000AAAA')));
  await assertFails(getDocs(collection(as('bob'), 'devices')));
  await assertSucceeds(getDocs(query(collection(as('alice'), 'devices'), where('ownerId', '==', 'alice'))));
  await assertSucceeds(updateDoc(doc(as('alice'), 'devices', 'PML-0000AAAA'), { ringRequestedAt: 1, updatedAt: 1 }));
  await assertFails(updateDoc(doc(as('alice'), 'devices', 'PML-0000AAAA'), { ownerId: 'bob' }));
  await assertFails(updateDoc(doc(as('alice'), 'devices', 'PML-0000AAAA'), { latitude: 0 }));
  await assertFails(updateDoc(doc(as('alice'), 'devices', 'PML-0000AAAA'), { petId: 'pet_b' }));
  await assertFails(setDoc(doc(as('bob'), 'devices', 'PML-1111BBBB'), { ownerId: 'bob' }));
});

// ── Admin-only configuration ────────────────────────────────────────────────
test('settings, promos, coupons and broadcasts are admin-only writes', async () => {
  await assertFails(setDoc(doc(as('alice'), 'settings', 'global'), { maintenance_mode: true }));
  await assertFails(setDoc(doc(as('alice'), 'settings', 'globalBanner'), { text: '<script>' }));
  await assertSucceeds(setDoc(doc(as('admin'), 'settings', 'global'), { maintenance_mode: false }));
  await assertFails(setDoc(doc(as('alice'), 'coupons', 'FREE100'), { pct: 100 }));
  await assertFails(setDoc(doc(as('alice'), 'promos', 'x'), { title: 'x' }));
  await assertFails(getDocs(collection(as('alice'), 'rate_limits')));
  await assertSucceeds(getDoc(doc(as(null), 'settings', 'global')));
});

test('newsletter: anonymous sign-up only with a valid address', async () => {
  await assertSucceeds(setDoc(doc(as(null), 'newsletter', 'a@b.com'), { email: 'a@b.com', source: 'footer', subscribedAt: 1, createdAt: 'x' }));
  await assertFails(setDoc(doc(as(null), 'newsletter', 'x'), { email: 'not-an-email' }));
  await assertFails(setDoc(doc(as(null), 'newsletter', 'y'), { email: 'a@b.com', isAdmin: true }));
  await assertFails(getDocs(collection(as('alice'), 'newsletter')));
});

test('vets: providers manage their own listing but cannot self-verify or edit ratings', async () => {
  await assertSucceeds(setDoc(doc(as('fakevet'), 'vets', 'fakevet'), { name: 'Fake Vet', isVerified: false, rating: 0, reviewsCount: 0 }));
  await assertFails(setDoc(doc(as('bob'), 'vets', 'bob'), { name: 'Bob', isVerified: true }));
  await assertFails(setDoc(doc(as('bob'), 'vets', 'fakevet'), { name: 'Hijack', isVerified: false }));
  await assertSucceeds(updateDoc(doc(as('fakevet'), 'vets', 'fakevet'), { price: '500' }));
  await assertFails(updateDoc(doc(as('fakevet'), 'vets', 'fakevet'), { isVerified: true }));
  await assertFails(updateDoc(doc(as('fakevet'), 'vets', 'fakevet'), { rating: 5 }));
  await assertFails(updateDoc(doc(as('fakevet'), 'vets', 'fakevet'), { reviewsCount: 999 }));
  await assertSucceeds(updateDoc(doc(as('admin'), 'vets', 'fakevet'), { isVerified: true }));
});

test('blogs: authors cannot self-approve', async () => {
  await assertSucceeds(setDoc(doc(as('alice'), 'blogs', 'b1'), { authorId: 'alice', title: 't', status: 'PENDING', isApproved: false }));
  await assertFails(setDoc(doc(as('alice'), 'blogs', 'b2'), { authorId: 'alice', title: 't', status: 'APPROVED', isApproved: true }));
  await assertFails(setDoc(doc(as('alice'), 'blogs', 'b3'), { authorId: 'bob', title: 't', status: 'PENDING', isApproved: false }));
});

// ── Storage: file upload validation & ownership ─────────────────────────────
const img = (bytes = 1024) => new Uint8Array(bytes);
const st = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage();

test('storage: uploads go to my own folder, as real images, under 5 MB', async () => {
  await assertSucceeds(uploadBytes(ref(st('alice'), 'profile_pics/alice/me.jpg'), img(), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(st('bob'), 'profile_pics/alice/me.jpg'), img(), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(st(null), 'profile_pics/anon/me.jpg'), img(), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(st('alice'), 'profile_pics/alice/x.html'), img(), { contentType: 'text/html' }));
  await assertFails(uploadBytes(ref(st('alice'), 'profile_pics/alice/x.svg'), img(), { contentType: 'image/svg+xml' }));
  await assertFails(uploadBytes(ref(st('alice'), 'profile_pics/alice/big.jpg'), img(6 * 1024 * 1024), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(st('alice'), 'profile_pics/legacy.jpg'), img(), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(st('alice'), 'random/alice/x.jpg'), img(), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(st('alice'), 'shop_products/alice/p.jpg'), img(), { contentType: 'image/jpeg' }));
  await assertSucceeds(uploadBytes(ref(st('shop'), 'shop_products/shop/p.jpg'), img(), { contentType: 'image/jpeg' }));
});

test('storage: medical files are private to owner and care team', async () => {
  await assertSucceeds(uploadBytes(ref(st('alice'), 'pets/pet_a/reports/r.pdf'), img(), { contentType: 'application/pdf' }));
  await assertFails(uploadBytes(ref(st('bob'), 'pets/pet_a/reports/r2.pdf'), img(), { contentType: 'application/pdf' }));
  await assertFails(uploadBytes(ref(st('alice'), 'pets/pet_a/reports/r.exe'), img(), { contentType: 'application/x-msdownload' }));
  await assertFails(getBytes(ref(st('bob'), 'pets/pet_a/reports/r.pdf')));
  await assertSucceeds(getBytes(ref(st('vet'), 'pets/pet_a/reports/r.pdf')));
  await assertSucceeds(uploadBytes(ref(st('alice'), 'prescriptions/alice/rx.pdf'), img(), { contentType: 'application/pdf' }));
  await assertFails(getBytes(ref(st('bob'), 'prescriptions/alice/rx.pdf')));
  await assertSucceeds(getBytes(ref(st('cashier'), 'prescriptions/alice/rx.pdf')));
  await assertFails(uploadBytes(ref(st('alice'), 'prescriptions/guest/rx.pdf'), img(), { contentType: 'application/pdf' }));
});
