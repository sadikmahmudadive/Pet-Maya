import { createContext, useContext, useMemo } from 'react';
import { useStore } from '../lib/store.jsx';
import { saveDoc, useCollection, useDoc, normProduct, normOrder, normVet, normUser, normEvent, normPet } from '../data/firestore.js';
import { DEFAULT_SETTINGS } from './erp.js';
import { SAMPLES } from '../data/hooks.js';
import { SAMPLE_CUSTOMERS, SAMPLE_APPOINTMENTS, SAMPLE_REQUESTS, SAMPLE_RX, SAMPLE_COUPONS } from '../data/sample.js';

const Ctx = createContext(null);

// Business settings for the console — edit here.
export const ADMIN_CONFIG = {
  vetSharePct: 70,          // share of consult fee paid to the vet
  rxSlaMin: 20,             // target minutes to review a prescription
  packingSlaMin: 30,        // flag orders packing longer than this
  expiringDays: 90,
  vipLifetime: 50000,       // BDT lifetime spend for Platinum
  goldLifetime: 20000,
  atRiskDays: 60,
  dayStartHour: 9,
  dayEndHour: 18,
};

export const tierFor = (lifetime) => (lifetime >= ADMIN_CONFIG.vipLifetime ? 'Platinum' : lifetime >= ADMIN_CONFIG.goldLifetime ? 'Gold' : 'Member');

const sampleUsers = SAMPLE_CUSTOMERS.map((c) => ({ ...normUser(c.id, c), area: c.area, city: c.city, ...c }));
const sampleEvents = SAMPLE_APPOINTMENTS.map((a) => {
  const v = SAMPLES.vets.find((x) => x.id === a.vetId);
  return { ...normEvent(a.id, {}), ...a, doctor: v?.name || '', status: 'Confirmed' };
}).concat(SAMPLE_REQUESTS.map((r) => ({ ...normEvent(r.id, {}), ...r, start: Date.now() + 3600e3, status: 'Pending', doctor: '', vetId: '', requestedAt: Date.now() - r.waitingMin * 60000 })));

export function AdminDataProvider({ children }) {
  const orders = useCollection('orders', { map: normOrder, sample: SAMPLES.orders });
  const products = useCollection('products', { map: normProduct, sample: SAMPLES.products });
  const vets = useCollection('vets', { map: normVet, sample: SAMPLES.vets });
  const users = useCollection('users', { map: normUser, sample: sampleUsers });
  const events = useCollection('events', { map: (id, d) => ({ ...normEvent(id, d), requestedAt: Number(d.timestamp) || Date.parse(d.createdAt) || 0 }), sample: sampleEvents });
  const pets = useCollection('pets', { map: normPet, sample: [] });
  const coupons = useCollection('coupons', { sample: SAMPLE_COUPONS });
  // ERP / POS — empty collections are real (not sample) once connected.
  const raw = (id, d) => ({ id, ...d });
  const erp = { map: raw, sample: [], sampleWhenEmpty: false };
  const sales = useCollection('pos_sales', erp);
  const shifts = useCollection('pos_shifts', erp);
  const moves = useCollection('stock_moves', erp);
  const suppliers = useCollection('suppliers', erp);
  const purchases = useCollection('purchase_orders', erp);
  const supplierPayments = useCollection('supplier_payments', erp);
  const expenses = useCollection('expenses', erp);
  const staff = useCollection('staff', erp);
  const attendance = useCollection('attendance', erp);
  const payroll = useCollection('payroll', erp);
  const settingsDoc = useDoc('settings', 'erp');

  const value = useMemo(() => {
    const ordersSorted = [...orders.items].sort((a, b) => b.placedAt - a.placedAt);
    // Prescriptions = orders waiting on Rx review (sample details merged when in sample mode).
    const rxQueue = orders.live
      ? ordersSorted.filter((o) => o.status === 'Rx review').map((o) => ({
        id: `RX-${o.id.replace(/\D/g, '').slice(-5) || o.docId.slice(0, 5)}`,
        orderId: o.id, docId: o.docId, order: o, pet: o.pet || 'Pet', breed: '', drug: o.items.find((i) => i.isRx)?.name || o.items[0]?.name || '—',
        uploadedBy: o.customer, uploadedAt: o.placedAt, waitingMin: Math.round((Date.now() - o.placedAt) / 60000),
        prescriber: o.prescriber || '', licence: o.prescriberLicence || '', weightKg: null, dose: '', issuedDaysAgo: null, validDays: null,
        imageUrl: o.prescriptionUrl || '',
      }))
      : SAMPLE_RX.map((r) => ({ ...r, order: ordersSorted.find((o) => o.id === r.orderId) || null, docId: r.orderId || r.id }));

    const ordersByUser = {};
    ordersSorted.forEach((o) => { (ordersByUser[o.userId] ||= []).push(o); });

    const petsByOwner = {};
    pets.items.forEach((p) => { (petsByOwner[p.ownerID] ||= []).push(p); });

    const customers = (users.live ? users.items.filter((u) => !(/admin|vet|veterinarian|groom|board|merchant/i.test(u.role) || u.staffRole)) : users.items).map((u) => {
      const os = ordersByUser[u.uid] || ordersByUser[u.id] || [];
      const lifetime = u.lifetime ?? os.reduce((a, o) => a + (o.status === 'Cancelled' ? 0 : o.total), 0);
      const lastOrder = os[0]?.placedAt || 0;
      const petList = u.pets || (petsByOwner[u.uid] || []).map((p) => `${p.name} · ${p.breed || p.species}`);
      return {
        ...u,
        pets: petList,
        orders: u.orders ?? os.length,
        lifetime,
        lastOrder,
        avgBasket: (u.orders ?? os.length) ? Math.round(lifetime / (u.orders ?? os.length)) : 0,
        tier: tierFor(lifetime),
        atRisk: u.atRisk ?? (os.length > 0 && Date.now() - lastOrder > ADMIN_CONFIG.atRiskDays * 864e5),
        isNew: u.isNew ?? (u.createdAt && Date.now() - u.createdAt < 7 * 864e5),
        subscriber: !!u.subscription || os.some((o) => o.items.some((i) => /auto-refill/i.test(i.variant))),
        orderList: os,
      };
    }).sort((a, b) => b.lifetime - a.lifetime);

    const byNewest = (l, k = 'createdAt') => [...l.items].sort((a, b) => (b[k] || 0) - (a[k] || 0));
    return {
      sales: byNewest(sales), shifts: byNewest(shifts, 'openedAt'), stockMoves: byNewest(moves, 'at'),
      suppliers: [...suppliers.items].sort((a, b) => String(a.name).localeCompare(String(b.name))),
      purchases: byNewest(purchases), supplierPayments: byNewest(supplierPayments, 'at'), expenses: byNewest(expenses, 'date'),
      staff: [...staff.items].sort((a, b) => String(a.name).localeCompare(String(b.name))), attendance: attendance.items, payroll: payroll.items,
      settings: { ...DEFAULT_SETTINGS, ...(settingsDoc.data || {}) },
      erpLive: sales.live || shifts.live || suppliers.live,
      allUsers: users.items,
      orders: ordersSorted, products: products.items, vets: vets.items, events: events.items, customers, rxQueue, pets: pets.items, coupons: coupons.items,
      live: { orders: orders.live, products: products.live, vets: vets.live, users: users.live, events: events.live, coupons: coupons.live },
      anySample: !(orders.live && products.live && users.live),
      loading: orders.loading || products.loading,
    };
  }, [orders, products, vets, users, events, pets, coupons, sales, shifts, moves, suppliers, purchases, supplierPayments, expenses, staff, attendance, payroll, settingsDoc.data]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAdmin = () => useContext(Ctx);

export function downloadCsv(filename, rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Write helper: saves to Firestore when that collection is live; otherwise explains it’s sample data. */
export function useAdminWrite() {
  const { live } = useAdmin();
  const { toast } = useStore();
  const LIVE_KEY = { orders: 'orders', products: 'products', events: 'events', users: 'users', vets: 'vets' };
  return async (collectionName, id, data, okMessage) => {
    const isLive = live[LIVE_KEY[collectionName]] ?? true;
    if (!isLive) { toast(`${okMessage || 'Saved'} (sample data — not stored)`); return true; }
    try {
      await saveDoc(collectionName, id, data);
      if (okMessage) toast(okMessage);
      return true;
    } catch (e) {
      toast('Couldn’t save — check your connection or permissions', { tone: 'error' });
      return false;
    }
  };
}
