/* ─────────────────────────────────────────────────────────────
   ERP / POS business logic for the admin console.
   Every operation that moves stock or money runs in a Firestore
   transaction so concurrent tills and the online shop can't
   oversell, double-count or lose a movement.

   Collections
     pos_sales        till receipts (S-000123)
     pos_shifts       cash-drawer sessions (open float → counted close)
     stock_moves      append-only stock ledger (every +/- with reason)
     suppliers        vendors with running payable `balance`
     purchase_orders  PO-00012 with partial receiving
     supplier_payments
     expenses         operating costs (rent, salaries, utilities…)
     staff, attendance, payroll
     counters/{key}   document-number sequences
     settings/erp     business & POS settings
   ───────────────────────────────────────────────────────────── */
import {
  doc, collection, runTransaction, increment, arrayUnion, setDoc, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const DEFAULT_SETTINGS = {
  businessName: 'Pet Maya',
  branch: 'Main branch',
  address: '',
  phone: '',
  email: '',
  bin: '',                     // VAT registration (BIN)
  vatRate: 0,                  // % — set to your applicable rate
  pricesIncludeVat: true,
  receiptFooter: 'Thank you for caring for your pet with Pet Maya 🐾',
  allowNegativeStock: false,
  requireShift: true,          // a cash drawer must be open to sell
  paymentMethods: ['Cash', 'bKash', 'Nagad', 'Card'],
  expenseCategories: ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Delivery', 'Supplies', 'Maintenance', 'Bank charges', 'Other'],
  receiptWidthMm: 80,
};

export const STAFF_ROLES = ['Manager', 'Cashier', 'Pharmacist', 'Accountant', 'Storekeeper'];

/** Which console paths each role may open (admins see everything). */
export const ROLE_ACCESS = {
  Manager: ['*'],
  Cashier: ['/admin/pos', '/admin/sales', '/admin/customers'],
  Pharmacist: ['/admin', '/admin/orders', '/admin/prescriptions', '/admin/inventory', '/admin/pos', '/admin/sales', '/admin/stock'],
  Accountant: ['/admin', '/admin/finance', '/admin/reports', '/admin/purchasing', '/admin/sales', '/admin/orders'],
  Storekeeper: ['/admin/inventory', '/admin/stock', '/admin/purchasing'],
};

export function canAccess(role, path) {
  if (/^(admin|super ?admin|superadmin)$/i.test(String(role || '').trim())) return true;
  const allowed = ROLE_ACCESS[role] || [];
  if (allowed.includes('*')) return true;
  return allowed.some((p) => (p === '/admin' ? path === '/admin' : path === p || path.startsWith(`${p}/`)));
}

export const homeFor = (role) => {
  const a = ROLE_ACCESS[role];
  return !a || a.includes('*') || a.includes('/admin') ? '/admin' : a[0];
};

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const now = () => Date.now();

/* ── Cart maths (shared by POS screen and receipts) ─────────── */
export function cartTotals(lines, { cartDiscount = 0, vatRate = 0, pricesIncludeVat = true } = {}) {
  const gross = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const lineDiscount = lines.reduce((a, l) => a + Math.min(l.discount || 0, l.price * l.qty), 0);
  const afterLines = gross - lineDiscount;
  const discount = Math.min(Math.max(0, Number(cartDiscount) || 0), afterLines);
  const net = afterLines - discount;
  const rate = (Number(vatRate) || 0) / 100;
  const vat = pricesIncludeVat ? net - net / (1 + rate) : net * rate;
  const total = pricesIncludeVat ? net : net + vat;
  const cost = lines.reduce((a, l) => a + (Number(l.cost) || 0) * l.qty, 0);
  const units = lines.reduce((a, l) => a + l.qty, 0);
  return {
    gross: r2(gross), lineDiscount: r2(lineDiscount), discount: r2(discount), totalDiscount: r2(lineDiscount + discount),
    net: r2(net), vat: r2(vat), total: Math.round(total), cost: r2(cost), profit: r2(net - (pricesIncludeVat ? vat : 0) - cost), units,
  };
}

async function nextNumber(tx, key, prefix, pad) {
  const ref = doc(db, 'counters', key);
  const snap = await tx.get(ref);
  const n = (snap.data()?.n || 0) + 1;
  return { ref, n, number: `${prefix}${String(n).padStart(pad, '0')}` };
}

/* ── POS ───────────────────────────────────────────────────── */
/**
 * Completes a till sale: numbers it, decrements stock (refusing to oversell unless
 * allowed), writes the stock ledger and the receipt — all or nothing.
 */
export async function completeSale({ lines, totals, payments, customer, cashier, shiftId, note, settings, cartDiscount }) {
  return runTransaction(db, async (tx) => {
    const seq = await nextNumber(tx, 'pos_sale', 'S-', 6);
    const stockLines = lines.filter((l) => l.productId);
    const ids = [...new Set(stockLines.map((l) => l.productId))];
    const snaps = await Promise.all(ids.map((id) => tx.get(doc(db, 'products', id))));
    const stock = Object.fromEntries(snaps.map((s) => [s.id, s.exists() ? { exists: true, qty: Number(s.data().stockCount) || 0 } : { exists: false }]));

    const need = {};
    stockLines.forEach((l) => { need[l.productId] = (need[l.productId] || 0) + l.qty; });
    for (const [id, qty] of Object.entries(need)) {
      const s = stock[id];
      if (s.exists && !settings.allowNegativeStock && s.qty < qty) {
        const name = lines.find((l) => l.productId === id)?.name || id;
        throw new Error(`Not enough stock for ${name}: ${s.qty} left, ${qty} in cart.`);
      }
    }

    const saleRef = doc(collection(db, 'pos_sales'));
    const paid = r2(payments.reduce((a, p) => a + (Number(p.amount) || 0), 0));
    const at = now();
    const sale = {
      number: seq.number,
      items: lines.map((l) => ({
        productId: l.productId || null, name: l.name, sku: l.sku || '', qty: l.qty, price: l.price,
        cost: Number(l.cost) || 0, discount: r2(l.discount || 0), lineTotal: r2(l.price * l.qty - (l.discount || 0)), isRx: !!l.isRx,
      })),
      ...totals,
      cartDiscount: r2(cartDiscount || 0),
      vatRate: Number(settings.vatRate) || 0,
      pricesIncludeVat: !!settings.pricesIncludeVat,
      payments: payments.filter((p) => Number(p.amount) > 0).map((p) => ({ method: p.method, amount: r2(p.amount), ref: p.ref || '' })),
      paid,
      change: r2(Math.max(0, paid - totals.total)),
      customer: customer ? { id: customer.id || '', name: customer.name || 'Walk-in', phone: customer.phone || '' } : { id: '', name: 'Walk-in', phone: '' },
      cashier: { uid: cashier?.uid || '', name: cashier?.name || 'Staff' },
      shiftId: shiftId || '',
      note: note || '',
      status: 'completed',
      refundedTotal: 0,
      channel: 'pos',
      branch: settings.branch || '',
      createdAt: at,
    };

    for (const [id, qty] of Object.entries(need)) {
      const s = stock[id];
      if (!s.exists) continue;
      const after = s.qty - qty;
      tx.update(doc(db, 'products', id), { stockCount: after, inStock: after > 0, updatedAt: at });
      tx.set(doc(collection(db, 'stock_moves')), {
        productId: id, name: lines.find((l) => l.productId === id)?.name || '', qty: -qty, balanceAfter: after,
        type: 'sale', ref: seq.number, refId: saleRef.id, by: cashier?.name || '', at,
      });
    }
    tx.set(seq.ref, { n: seq.n }, { merge: true });
    tx.set(saleRef, sale);
    return { id: saleRef.id, ...sale };
  });
}

/** Refund some or all lines of a sale; restocks returned items. */
export async function refundSale(sale, returns, { method, reason, by, restock = true }) {
  return runTransaction(db, async (tx) => {
    const saleRef = doc(db, 'pos_sales', sale.id);
    const fresh = await tx.get(saleRef);
    if (!fresh.exists()) throw new Error('Sale not found');
    const data = fresh.data();
    const already = {};
    (data.refunds || []).forEach((r) => r.items.forEach((i) => { already[i.index] = (already[i.index] || 0) + i.qty; }));

    const items = returns.filter((r) => r.qty > 0).map((r) => {
      const line = data.items[r.index];
      const left = line.qty - (already[r.index] || 0);
      if (r.qty > left) throw new Error(`Only ${left} × ${line.name} can still be returned.`);
      // Refund what was actually paid for each unit: its line price scaled by
      // total ÷ (gross − line discounts), which spreads any cart discount and
      // any VAT added on top proportionally across all lines.
      const base = (data.gross || 0) - (data.lineDiscount || 0);
      const unit = base > 0 ? (line.lineTotal / line.qty) * (data.total / base) : 0;
      return { index: r.index, productId: line.productId, name: line.name, qty: r.qty, amount: r2(unit * r.qty) };
    });
    if (!items.length) throw new Error('Choose at least one item to return.');

    const ids = [...new Set(items.filter((i) => i.productId).map((i) => i.productId))];
    const snaps = restock ? await Promise.all(ids.map((id) => tx.get(doc(db, 'products', id)))) : [];
    const amount = r2(items.reduce((a, i) => a + i.amount, 0));
    const at = now();
    const refund = { items, amount, method, reason: reason || '', by: by || '', at, restocked: !!restock };
    const refundedTotal = r2((data.refundedTotal || 0) + amount);
    const allBack = data.items.every((l, idx) => (already[idx] || 0) + (items.filter((i) => i.index === idx).reduce((a, i) => a + i.qty, 0)) >= l.qty);

    snaps.forEach((s) => {
      if (!s.exists()) return;
      const qty = items.filter((i) => i.productId === s.id).reduce((a, i) => a + i.qty, 0);
      const after = (Number(s.data().stockCount) || 0) + qty;
      tx.update(s.ref, { stockCount: after, inStock: after > 0, updatedAt: at });
      tx.set(doc(collection(db, 'stock_moves')), {
        productId: s.id, name: s.data().name || '', qty, balanceAfter: after, type: 'return', ref: data.number, refId: sale.id, reason: reason || '', by: by || '', at,
      });
    });
    tx.update(saleRef, { refunds: arrayUnion(refund), refundedTotal, status: allBack ? 'refunded' : 'partially_refunded', updatedAt: at });
    return refund;
  });
}

/* ── Cash drawer shifts ────────────────────────────────────── */
export async function openShift({ float, user, register }) {
  const ref = await addDoc(collection(db, 'pos_shifts'), {
    status: 'open', openingFloat: r2(float), openedAt: now(), openedBy: { uid: user?.uid || '', name: user?.name || '' }, register: register || 'Till 1',
    cashMoves: [],
  });
  return ref.id;
}

export async function cashMove(shiftId, { type, amount, reason, by }) {
  await updateDoc(doc(db, 'pos_shifts', shiftId), { cashMoves: arrayUnion({ type, amount: r2(amount), reason: reason || '', by: by || '', at: now() }) });
}

export async function closeShift(shiftId, { counted, summary, user, note }) {
  await updateDoc(doc(db, 'pos_shifts', shiftId), {
    status: 'closed', closedAt: now(), closedBy: { uid: user?.uid || '', name: user?.name || '' }, countedCash: r2(counted),
    expectedCash: summary.expectedCash, variance: r2(counted - summary.expectedCash), summary, note: note || '',
  });
}

/** Totals for a shift from its sales (cash-in-drawer reconciliation). */
export function shiftSummary(shift, sales) {
  const mine = sales.filter((s) => s.shiftId === shift.id);
  const byMethod = {};
  let refundsCash = 0;
  mine.forEach((s) => {
    (s.payments || []).forEach((p) => { byMethod[p.method] = r2((byMethod[p.method] || 0) + p.amount); });
    if (s.change) byMethod.Cash = r2((byMethod.Cash || 0) - s.change);
    (s.refunds || []).forEach((r) => { if (r.method === 'Cash') refundsCash += r.amount; });
  });
  const moves = shift.cashMoves || [];
  const paidIn = moves.filter((m) => m.type === 'in').reduce((a, m) => a + m.amount, 0);
  const paidOut = moves.filter((m) => m.type === 'out').reduce((a, m) => a + m.amount, 0);
  const gross = mine.reduce((a, s) => a + (s.total || 0), 0);
  const refunds = mine.reduce((a, s) => a + (s.refundedTotal || 0), 0);
  return {
    sales: mine.length, gross: r2(gross), refunds: r2(refunds), net: r2(gross - refunds), byMethod,
    paidIn: r2(paidIn), paidOut: r2(paidOut),
    expectedCash: r2((shift.openingFloat || 0) + (byMethod.Cash || 0) + paidIn - paidOut - refundsCash),
  };
}

/* ── Inventory ─────────────────────────────────────────────── */
/** Manual stock change (count correction, damage, expiry, internal use…). */
export async function adjustStock(productId, { delta, setTo, reason, note, by }) {
  return runTransaction(db, async (tx) => {
    const ref = doc(db, 'products', productId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Product not found');
    const before = Number(snap.data().stockCount) || 0;
    const after = setTo != null ? Number(setTo) : before + Number(delta);
    if (after < 0) throw new Error('Stock can’t go below zero.');
    const at = now();
    tx.update(ref, { stockCount: after, inStock: after > 0, updatedAt: at });
    tx.set(doc(collection(db, 'stock_moves')), {
      productId, name: snap.data().name || '', qty: after - before, balanceAfter: after, type: 'adjustment', reason: reason || 'Adjustment', note: note || '', by: by || '', at,
    });
    return after;
  });
}

/** Deduct stock for an online order once, when it leaves the warehouse. Idempotent. */
export async function deductOrderStock(order, by) {
  return runTransaction(db, async (tx) => {
    const oref = doc(db, 'orders', order.docId);
    const osnap = await tx.get(oref);
    if (!osnap.exists() || osnap.data().stockDeducted) return false;
    const need = {};
    order.items.filter((i) => i.id).forEach((i) => { need[i.id] = (need[i.id] || 0) + i.qty; });
    const snaps = await Promise.all(Object.keys(need).map((id) => tx.get(doc(db, 'products', id))));
    const at = now();
    snaps.forEach((s) => {
      if (!s.exists()) return;
      const after = (Number(s.data().stockCount) || 0) - need[s.id];
      tx.update(s.ref, { stockCount: after, inStock: after > 0, updatedAt: at });
      tx.set(doc(collection(db, 'stock_moves')), {
        productId: s.id, name: s.data().name || '', qty: -need[s.id], balanceAfter: after, type: 'online', ref: order.id, refId: order.docId, by: by || '', at,
      });
    });
    tx.update(oref, { stockDeducted: true, stockDeductedAt: at });
    return true;
  });
}

/* ── Purchasing ────────────────────────────────────────────── */
export async function createPurchaseOrder(po) {
  return runTransaction(db, async (tx) => {
    const seq = await nextNumber(tx, 'purchase_order', 'PO-', 5);
    const ref = doc(collection(db, 'purchase_orders'));
    const items = po.items.map((i) => ({ ...i, qty: Number(i.qty) || 0, cost: r2(i.cost), received: 0 }));
    tx.set(seq.ref, { n: seq.n }, { merge: true });
    tx.set(ref, {
      ...po, number: seq.number, items, total: r2(items.reduce((a, i) => a + i.qty * i.cost, 0)), receivedValue: 0, paid: 0,
      status: po.status || 'Draft', createdAt: now(),
    });
    return { id: ref.id, number: seq.number };
  });
}

/**
 * Goods received: adds stock, updates each product's weighted-average cost,
 * raises the supplier payable and writes the stock ledger.
 */
export async function receivePurchase(po, receipts, { by }) {
  return runTransaction(db, async (tx) => {
    const poRef = doc(db, 'purchase_orders', po.id);
    const poSnap = await tx.get(poRef);
    if (!poSnap.exists()) throw new Error('Purchase order not found');
    const data = poSnap.data();
    const lines = receipts.filter((r) => Number(r.qty) > 0);
    if (!lines.length) throw new Error('Enter a received quantity.');
    const snaps = await Promise.all(lines.map((r) => tx.get(doc(db, 'products', data.items[r.index].productId))));
    const supRef = data.supplierId ? doc(db, 'suppliers', data.supplierId) : null;
    if (supRef) await tx.get(supRef);

    const at = now();
    const items = data.items.map((i) => ({ ...i }));
    let value = 0;
    lines.forEach((r, k) => {
      const line = items[r.index];
      const qty = Number(r.qty);
      const cost = r2(r.cost ?? line.cost);
      line.received = (line.received || 0) + qty;
      value += qty * cost;
      const s = snaps[k];
      if (!s.exists()) return;
      const before = Number(s.data().stockCount) || 0;
      const oldCost = Number(s.data().cost) || cost;
      const after = before + qty;
      const avgCost = after > 0 ? r2((Math.max(0, before) * oldCost + qty * cost) / (Math.max(0, before) + qty)) : cost;
      tx.update(s.ref, { stockCount: after, inStock: after > 0, cost: avgCost, lastCost: cost, supplier: data.supplierName || s.data().supplier || '', updatedAt: at });
      tx.set(doc(collection(db, 'stock_moves')), {
        productId: s.id, name: s.data().name || line.name, qty, balanceAfter: after, unitCost: cost, type: 'purchase', ref: data.number, refId: po.id, by: by || '', at,
      });
    });
    const complete = items.every((i) => (i.received || 0) >= i.qty);
    tx.update(poRef, {
      items, receivedValue: r2((data.receivedValue || 0) + value), status: complete ? 'Received' : 'Partially received',
      receivedAt: at, receipts: arrayUnion({ at, by: by || '', value: r2(value), lines: lines.map((r) => ({ index: r.index, qty: Number(r.qty) })) }),
    });
    if (supRef) tx.set(supRef, { balance: increment(r2(value)), updatedAt: at }, { merge: true });
    return r2(value);
  });
}

export async function paySupplier({ supplier, po, amount, method, ref, by, note }) {
  return runTransaction(db, async (tx) => {
    const at = now();
    const payRef = doc(collection(db, 'supplier_payments'));
    if (po) {
      const poRef = doc(db, 'purchase_orders', po.id);
      const snap = await tx.get(poRef);
      tx.update(poRef, { paid: r2((snap.data()?.paid || 0) + Number(amount)), updatedAt: at });
    }
    tx.set(doc(db, 'suppliers', supplier.id), { balance: increment(-r2(amount)), updatedAt: at }, { merge: true });
    tx.set(payRef, {
      supplierId: supplier.id, supplierName: supplier.name, poId: po?.id || '', poNumber: po?.number || '', amount: r2(amount), method, ref: ref || '', note: note || '', by: by || '', at,
    });
  });
}

/* ── Simple writes ─────────────────────────────────────────── */
export const saveRecord = (name, id, data) => (id
  ? setDoc(doc(db, name, id), { ...data, updatedAt: now() }, { merge: true })
  : addDoc(collection(db, name), { ...data, createdAt: now() }));
export const removeRecord = (name, id) => deleteDoc(doc(db, name, id));

/** Monthly payroll → one expense per active employee; refuses to run twice for a month. */
export async function runPayroll(month, staff, { by }) {
  return runTransaction(db, async (tx) => {
    const ref = doc(db, 'payroll', month);
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error(`Payroll for ${month} has already been run.`);
    const at = now();
    const lines = staff.filter((s) => s.active !== false && Number(s.salary) > 0).map((s) => ({ staffId: s.id, name: s.name, role: s.role, amount: r2(s.salary) }));
    lines.forEach((l) => tx.set(doc(collection(db, 'expenses')), {
      date: at, category: 'Salaries', description: `Salary ${month} — ${l.name} (${l.role})`, amount: l.amount, method: 'Bank', paidTo: l.name, ref: `PAY-${month}`, by: by || '', createdAt: at,
    }));
    tx.set(ref, { month, lines, total: r2(lines.reduce((a, l) => a + l.amount, 0)), by: by || '', at });
    return lines.length;
  });
}

/* ── Printing ──────────────────────────────────────────────── */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tk = (v) => `৳${(Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Thermal-printer friendly receipt (58/80 mm) in a print window. */
export function printReceipt(sale, settings, { copy = false } = {}) {
  const w = window.open('', '_blank', 'width=420,height=720');
  if (!w) return;
  const width = settings.receiptWidthMm || 80;
  const rows = sale.items.map((i) => `<tr><td colspan="3">${esc(i.name)}</td></tr><tr class="s"><td>${i.qty} × ${tk(i.price)}${i.discount ? ` −${tk(i.discount)}` : ''}</td><td></td><td class="r">${tk(i.lineTotal)}</td></tr>`).join('');
  const pays = (sale.payments || []).map((p) => `<tr><td>${esc(p.method)}${p.ref ? ` (${esc(p.ref)})` : ''}</td><td></td><td class="r">${tk(p.amount)}</td></tr>`).join('');
  w.document.write(`<!doctype html><title>${esc(sale.number)}</title><style>
    @page{size:${width}mm auto;margin:3mm}body{font:12px/1.35 ui-monospace,Menlo,monospace;width:${width - 6}mm;margin:0 auto;color:#000}
    h1{font-size:15px;text-align:center;margin:4px 0}p{margin:2px 0;text-align:center}table{width:100%;border-collapse:collapse}
    td{padding:1px 0;vertical-align:top}.r{text-align:right}.s td{color:#333}hr{border:0;border-top:1px dashed #000;margin:6px 0}.t td{font-weight:700;font-size:14px}
  </style><h1>${esc(settings.businessName)}</h1>
  ${settings.branch ? `<p>${esc(settings.branch)}</p>` : ''}${settings.address ? `<p>${esc(settings.address)}</p>` : ''}${settings.phone ? `<p>${esc(settings.phone)}</p>` : ''}
  ${settings.bin ? `<p>BIN: ${esc(settings.bin)}</p>` : ''}<hr>
  <p>${copy ? '*** COPY ***<br>' : ''}Receipt ${esc(sale.number)}<br>${new Date(sale.createdAt).toLocaleString('en-GB')}<br>Cashier: ${esc(sale.cashier?.name)}${sale.customer?.name && sale.customer.name !== 'Walk-in' ? `<br>Customer: ${esc(sale.customer.name)}` : ''}</p><hr>
  <table>${rows}</table><hr><table>
  <tr><td>Subtotal</td><td></td><td class="r">${tk(sale.gross)}</td></tr>
  ${sale.totalDiscount ? `<tr><td>Discount</td><td></td><td class="r">−${tk(sale.totalDiscount)}</td></tr>` : ''}
  ${sale.vatRate ? `<tr><td>VAT ${sale.vatRate}%${sale.pricesIncludeVat ? ' (incl.)' : ''}</td><td></td><td class="r">${tk(sale.vat)}</td></tr>` : ''}
  <tr class="t"><td>TOTAL</td><td></td><td class="r">${tk(sale.total)}</td></tr></table><hr><table>${pays}
  ${sale.change ? `<tr><td>Change</td><td></td><td class="r">${tk(sale.change)}</td></tr>` : ''}</table>
  ${sale.refundedTotal ? `<hr><p>Refunded: ${tk(sale.refundedTotal)}</p>` : ''}<hr><p>${esc(settings.receiptFooter)}</p>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}<\/script>`);
  w.document.close();
}

/** Generic A4 document (purchase order, report) in a print window. */
export function printDocument(title, html) {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return;
  w.document.write(`<!doctype html><title>${esc(title)}</title><style>
    body{font:13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:28px;color:#1a1917}h1{font:600 24px Georgia,serif;margin:0 0 4px}
    table{width:100%;border-collapse:collapse;margin-top:14px}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}th{background:#f3efe9;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
    .r{text-align:right}.muted{color:#6c6862}.tot td{font-weight:700;border-top:2px solid #1a1917}
  </style>${html}<script>window.onload=()=>window.print()<\/script>`);
  w.document.close();
}
export { esc as escapeHtml, tk as takaText };
