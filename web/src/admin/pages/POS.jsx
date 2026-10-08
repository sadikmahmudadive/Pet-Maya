import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../data.jsx';
import {
  cartTotals, completeSale, openShift, closeShift, cashMove, shiftSummary, printReceipt,
} from '../erp.js';
import { Icon, Button, Pill, Ph, Field, Portal, Empty } from '../../ui/index.jsx';
import { money, cx } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const REGISTER_KEY = 'pm_pos_register';
const HELD_KEY = 'pm_pos_held';
const readLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

function Modal({ title, onClose, width = 520, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ width: `min(${width}px, calc(100vw - 32px))` }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>{title}</h2>
          <button type="button" className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>
        </div>
        {children}
      </div>
    </Portal>
  );
}
export { Modal };

/* ── Pay ───────────────────────────────────────────────────── */
function PayModal({ totals, methods, hasRx, onClose, onComplete, busy }) {
  const [payments, setPayments] = useState([]);
  const [method, setMethod] = useState(methods[0] || 'Cash');
  const [amount, setAmount] = useState(String(totals.total));
  const [ref, setRef] = useState('');
  const [rxOk, setRxOk] = useState(!hasRx);
  const paid = payments.reduce((a, p) => a + Number(p.amount), 0);
  const due = Math.max(0, totals.total - paid);
  const change = Math.max(0, paid - totals.total);
  const inputRef = useRef(null);
  useEffect(() => { setAmount(String(due)); inputRef.current?.select(); }, [due, method]);

  const add = (v = amount) => {
    const n = Math.round(Number(v) * 100) / 100;
    if (!(n > 0)) return;
    if (method !== 'Cash' && n > due + 0.001) return; // only cash can be over-tendered
    setPayments((p) => [...p, { method, amount: n, ref: ref.trim() }]);
    setRef('');
  };
  const quick = [...new Set([due, Math.ceil(due / 100) * 100, Math.ceil(due / 500) * 500, Math.ceil(due / 1000) * 1000])].filter((v) => v > 0).slice(0, 4);
  const done = paid >= totals.total - 0.001 && rxOk;

  return (
    <Modal title="Take payment" onClose={onClose} width={560}>
      <div className="pos-due">
        <div><div className="sub">Amount due</div><div className="pos-due-v">{money(due)}</div></div>
        <div style={{ textAlign: 'right' }}><div className="sub">Total</div><b style={{ fontSize: 18 }}>{money(totals.total)}</b>{change > 0 && <div className="teal" style={{ fontWeight: 700, marginTop: 4 }}>Change {money(change)}</div>}</div>
      </div>

      <div className="pos-methods" role="radiogroup" aria-label="Payment method">
        {methods.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={method === m} className={cx('pos-method', method === m && 'on')} onClick={() => setMethod(m)}>
            <Icon name={m === 'Cash' ? 'cash' : m === 'Card' ? 'card' : 'phoneDevice'} size={18} />{m}
          </button>
        ))}
      </div>

      {due > 0 && (
        <form className="stack gap-10" style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); add(); }}>
          <div className="row gap-8">
            <input ref={inputRef} className="input grow" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" autoFocus />
            {method !== 'Cash' && <input className="input" style={{ width: 170 }} placeholder={method === 'Card' ? 'Approval code' : 'Transaction ID'} value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Reference" />}
            <Button type="submit" variant="dark" icon="plus">Add</Button>
          </div>
          {method === 'Cash' && (
            <div className="row gap-6 wrap">
              {quick.map((v) => <button key={v} type="button" className="pill" onClick={() => add(v)}>{money(v)}</button>)}
            </div>
          )}
        </form>
      )}

      {payments.length > 0 && (
        <div className="list" style={{ marginTop: 14 }}>
          {payments.map((p, i) => (
            <div key={i} className="list-row">
              <Icon name={p.method === 'Cash' ? 'cash' : p.method === 'Card' ? 'card' : 'phoneDevice'} size={16} />
              <span className="grow">{p.method}{p.ref && <span className="subtle mono" style={{ fontSize: 12 }}> · {p.ref}</span>}</span>
              <b>{money(p.amount)}</b>
              <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => setPayments(payments.filter((_, k) => k !== i))} aria-label="Remove payment"><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {hasRx && (
        <label className="note-yellow row gap-10" style={{ marginTop: 14, cursor: 'pointer' }}>
          <input type="checkbox" className="check" checked={rxOk} onChange={(e) => setRxOk(e.target.checked)} />
          <span>This sale contains prescription medicine. I have checked a valid prescription.</span>
        </label>
      )}

      <Button variant="dark" size="lg" block icon="check" style={{ marginTop: 16 }} disabled={!done || busy} onClick={() => onComplete(payments)}>
        {busy ? 'Completing…' : done ? `Complete sale${change > 0 ? ` · change ${money(change)}` : ''}` : `Still due ${money(due)}`}
      </Button>
    </Modal>
  );
}

/* ── Shift (cash drawer) ───────────────────────────────────── */
function OpenShiftCard({ register, onOpen, busy }) {
  const [float, setFloat] = useState('2000');
  return (
    <div className="pos-open">
      <div className="card" style={{ width: 'min(440px, 100%)', padding: 28 }}>
        <span className="well round lg"><Icon name="cash" size={22} /></span>
        <h2 className="serif" style={{ fontSize: 28, marginTop: 16 }}>Open the cash drawer</h2>
        <p className="sub" style={{ marginTop: 6 }}>Count the cash in <b>{register}</b> before your first sale. You’ll reconcile it when you close the shift.</p>
        <form className="stack gap-12" style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); onOpen(Number(float) || 0); }}>
          <Field label="Opening float (BDT)" type="number" min="0" value={float} onChange={(e) => setFloat(e.target.value)} autoFocus />
          <Button type="submit" variant="dark" size="lg" block icon="check" disabled={busy}>Open shift</Button>
        </form>
      </div>
    </div>
  );
}

function CloseShiftModal({ shift, sales, onClose, onDone, settings }) {
  const s = useMemo(() => shiftSummary(shift, sales), [shift, sales]);
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const variance = counted === '' ? null : Number(counted) - s.expectedCash;
  const print = () => {
    const rows = Object.entries(s.byMethod).map(([m, v]) => `<tr><td>${m}</td><td class="r">${money(v)}</td></tr>`).join('');
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return;
    w.document.write(`<title>Z report</title><style>body{font:12px/1.4 ui-monospace,monospace;width:74mm;margin:0 auto}table{width:100%}.r{text-align:right}h1{font-size:15px;text-align:center}hr{border:0;border-top:1px dashed #000}</style>
      <h1>${settings.businessName}<br>Z REPORT</h1><p>${shift.register} · opened ${new Date(shift.openedAt).toLocaleString('en-GB')} by ${shift.openedBy?.name || ''}<br>closed ${new Date().toLocaleString('en-GB')}</p><hr>
      <table><tr><td>Sales</td><td class="r">${s.sales}</td></tr><tr><td>Gross</td><td class="r">${money(s.gross)}</td></tr><tr><td>Refunds</td><td class="r">${money(s.refunds)}</td></tr><tr><td><b>Net</b></td><td class="r"><b>${money(s.net)}</b></td></tr></table><hr>
      <table>${rows}</table><hr><table><tr><td>Opening float</td><td class="r">${money(shift.openingFloat)}</td></tr><tr><td>Paid in</td><td class="r">${money(s.paidIn)}</td></tr><tr><td>Paid out</td><td class="r">${money(s.paidOut)}</td></tr>
      <tr><td>Expected cash</td><td class="r">${money(s.expectedCash)}</td></tr><tr><td>Counted</td><td class="r">${counted === '' ? '—' : money(counted)}</td></tr><tr><td>Variance</td><td class="r">${variance == null ? '—' : money(variance)}</td></tr></table>
      <script>window.onload=()=>window.print()<\/script>`);
    w.document.close();
  };
  return (
    <Modal title="Close shift" onClose={onClose} width={520}>
      <div className="kv-grid">
        <span>Sales</span><b>{s.sales}</b>
        <span>Gross takings</span><b>{money(s.gross)}</b>
        <span>Refunds</span><b>{money(s.refunds)}</b>
        {Object.entries(s.byMethod).map(([m, v]) => [<span key={`${m}k`}>{m}</span>, <b key={`${m}v`}>{money(v)}</b>])}
        <span>Opening float</span><b>{money(shift.openingFloat)}</b>
        <span>Paid in / out</span><b>{money(s.paidIn)} / {money(s.paidOut)}</b>
        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Expected cash in drawer</span><b style={{ fontSize: 18 }}>{money(s.expectedCash)}</b>
      </div>
      <div className="stack gap-12" style={{ marginTop: 16 }}>
        <Field label="Counted cash (BDT)" type="number" min="0" value={counted} onChange={(e) => setCounted(e.target.value)} autoFocus />
        {variance != null && (
          <div className={cx('pos-variance', Math.abs(variance) < 1 ? 'ok' : variance < 0 ? 'short' : 'over')}>
            {Math.abs(variance) < 1 ? 'Drawer balances ✓' : variance < 0 ? `Short by ${money(-variance)}` : `Over by ${money(variance)}`}
          </div>
        )}
        <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. ৳50 paid for courier from drawer" />
        <div className="row gap-8">
          <Button variant="outline" icon="printer" onClick={print}>Print Z report</Button>
          <Button variant="dark" icon="check" className="grow" disabled={counted === ''} onClick={() => onDone(Number(counted), s, note)}>Close shift</Button>
        </div>
      </div>
    </Modal>
  );
}

function CashMoveModal({ onClose, onSave }) {
  const [type, setType] = useState('out');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  return (
    <Modal title="Cash in / out" onClose={onClose} width={440}>
      <form className="stack gap-12" onSubmit={(e) => { e.preventDefault(); if (Number(amount) > 0) onSave({ type, amount: Number(amount), reason }); }}>
        <div className="pos-methods">
          <button type="button" className={cx('pos-method', type === 'in' && 'on')} onClick={() => setType('in')}><Icon name="download" size={16} />Paid in</button>
          <button type="button" className={cx('pos-method', type === 'out' && 'on')} onClick={() => setType('out')}><Icon name="upload" size={16} />Paid out</button>
        </div>
        <Field label="Amount (BDT)" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
        <Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder={type === 'out' ? 'e.g. Courier, tea, petty supplies' : 'e.g. Extra change from bank'} />
        <Button type="submit" variant="dark" block icon="check">Record</Button>
      </form>
    </Modal>
  );
}

/* ── Receipt after sale ────────────────────────────────────── */
function DoneModal({ sale, settings, onNew }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter') onNew(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNew]);
  return (
    <Modal title="Sale complete" onClose={onNew} width={420}>
      <div style={{ textAlign: 'center' }}>
        <span className="well round lg teal"><Icon name="check" size={22} /></span>
        <div className="mono subtle" style={{ marginTop: 12 }}>{sale.number}</div>
        <div className="serif" style={{ fontSize: 40, marginTop: 4 }}>{money(sale.total)}</div>
        {sale.change > 0 && <div className="pos-change">Give change: {money(sale.change)}</div>}
        {sale.training && <div className="note-yellow" style={{ marginTop: 12 }}>Training mode — not saved.</div>}
      </div>
      <div className="row gap-8" style={{ marginTop: 18 }}>
        <Button variant="outline" icon="printer" className="grow" onClick={() => printReceipt(sale, settings)}>Print receipt</Button>
        <Button variant="dark" icon="plus" className="grow" onClick={onNew}>New sale ⏎</Button>
      </div>
    </Modal>
  );
}

/* ── Register ──────────────────────────────────────────────── */
export default function POS({ user }) {
  const { products, customers, shifts, sales, settings, live } = useAdmin();
  const { toast } = useStore();
  // Training mode: sample catalogue or a dev preview session — sell freely, write nothing.
  const training = !live.products || !!user?.preview;
  const [register, setRegister] = useState(() => readLS(REGISTER_KEY, 'Till 1'));
  const shift = shifts.find((s) => s.status === 'open' && s.register === register);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [lines, setLines] = useState([]);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [custQ, setCustQ] = useState('');
  const [held, setHeld] = useState(() => readLS(HELD_KEY, []));
  const [modal, setModal] = useState(null); // pay | close | cash | held | done | discount
  const [busy, setBusy] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [editLine, setEditLine] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => writeLS(HELD_KEY, held), [held]);
  useEffect(() => writeLS(REGISTER_KEY, register), [register]);
  useEffect(() => { document.body.classList.add('pos-mode'); return () => document.body.classList.remove('pos-mode'); }, []);

  const totals = useMemo(() => cartTotals(lines, { cartDiscount, vatRate: settings.vatRate, pricesIncludeVat: settings.pricesIncludeVat }), [lines, cartDiscount, settings]);
  const cats = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => (!cat || p.category === cat) && (!t || `${p.name} ${p.sku} ${p.barcode} ${p.brand}`.toLowerCase().includes(t))).slice(0, 60);
  }, [products, q, cat]);
  const custMatches = useMemo(() => {
    const t = custQ.trim().toLowerCase();
    if (t.length < 2) return [];
    return customers.filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(t)).slice(0, 6);
  }, [customers, custQ]);
  const inCart = (id) => lines.filter((l) => l.productId === id).reduce((a, l) => a + l.qty, 0);
  const hasRx = lines.some((l) => l.isRx);

  const add = (p) => {
    const left = p.stockCount - inCart(p.id);
    if (left <= 0 && !settings.allowNegativeStock && !training) { toast(`${p.name} is out of stock`, { tone: 'error' }); return; }
    setLines((ls) => {
      const i = ls.findIndex((l) => l.productId === p.id && !l.discount);
      if (i >= 0) return ls.map((l, k) => (k === i ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { key: `${p.id}-${Date.now()}`, productId: p.id, name: p.name, sku: p.sku, price: p.price, cost: p.cost, qty: 1, discount: 0, isRx: p.isRx, image: p.image, stock: p.stockCount }];
    });
    if (p.isRx && !lines.some((l) => l.productId === p.id)) toast('Prescription item — check the prescription before handing over', { duration: 4000 });
  };
  const setQty = (key, qty) => setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, qty } : l))));

  // Barcode scanners type the code + Enter into the focused search box.
  const onSearchEnter = () => {
    const t = q.trim().toLowerCase();
    if (!t) { if (lines.length) setModal('pay'); return; }
    const exact = products.find((p) => p.barcode && p.barcode.toLowerCase() === t) || products.find((p) => p.sku.toLowerCase() === t);
    const pick = exact || (shown.length === 1 ? shown[0] : null);
    if (pick) { add(pick); setQ(''); } else toast(`No product matches “${q}”`, { tone: 'error' });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (modal) return;
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F9' && lines.length) { e.preventDefault(); setModal('pay'); }
      if (e.key === 'F4') { e.preventDefault(); document.getElementById('pos-cust')?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, lines.length]);

  const reset = () => { setLines([]); setCartDiscount(0); setCustomer(null); setCustQ(''); setTimeout(() => searchRef.current?.focus(), 50); };
  const hold = () => {
    if (!lines.length) return;
    setHeld((h) => [{ id: Date.now(), lines, cartDiscount, customer, at: Date.now(), total: totals.total }, ...h].slice(0, 20));
    reset();
    toast('Sale parked');
  };
  const resume = (h) => { setLines(h.lines); setCartDiscount(h.cartDiscount || 0); setCustomer(h.customer || null); setHeld((all) => all.filter((x) => x.id !== h.id)); setModal(null); };

  const complete = async (payments) => {
    setBusy(true);
    const payload = { lines, totals, payments, customer, cashier: user, shiftId: shift?.id || '', settings, cartDiscount };
    try {
      let sale;
      if (training) {
        const paid = payments.reduce((a, p) => a + p.amount, 0);
        sale = { ...totals, number: `TRAIN-${String(Date.now()).slice(-5)}`, items: lines.map((l) => ({ ...l, lineTotal: l.price * l.qty - (l.discount || 0) })), payments, paid, change: Math.max(0, paid - totals.total), customer: customer || { name: 'Walk-in' }, cashier: user, createdAt: Date.now(), vatRate: settings.vatRate, pricesIncludeVat: settings.pricesIncludeVat, training: true };
      } else {
        sale = await completeSale(payload);
      }
      setLastSale(sale);
      setModal('done');
      reset();
    } catch (e) {
      toast(e.message || 'Sale failed — nothing was charged or deducted', { tone: 'error', duration: 6000 });
    } finally {
      setBusy(false);
    }
  };

  if (settings.requireShift && !shift && !training) {
    return (
      <>
        <PosBar register={register} setRegister={setRegister} shift={null} training={training} held={held.length} />
        <OpenShiftCard register={register} busy={busy} onOpen={async (float) => {
          setBusy(true);
          try { await openShift({ float, user, register }); toast(`${register} is open`); } catch { toast('Couldn’t open the shift — check permissions', { tone: 'error' }); }
          setBusy(false);
        }} />
      </>
    );
  }

  return (
    <>
      <PosBar register={register} setRegister={setRegister} shift={shift} training={training} held={held.length}
        onHeld={() => setModal('held')} onCash={() => setModal('cash')} onClose={() => setModal('close')}
        onReprint={lastSale ? () => printReceipt(lastSale, settings, { copy: true }) : null} />

      <div className="pos">
        {/* Products */}
        <section className="pos-browse">
          <form className="searchbar pos-search" onSubmit={(e) => { e.preventDefault(); onSearchEnter(); }}>
            <Icon name="search" size={17} />
            <input ref={searchRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Scan barcode or search name / SKU" aria-label="Scan or search products" />
            <span className="kbd hide-sm">F2</span>
          </form>
          <div className="pos-cats">
            <button className={cx('chip', !cat && 'active')} onClick={() => setCat('')}>All</button>
            {cats.map((c) => <button key={c} className={cx('chip', cat === c && 'active')} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          {shown.length === 0 ? <Empty icon="search" title="No products match" /> : (
            <div className="pos-grid">
              {shown.map((p) => {
                const left = p.stockCount - inCart(p.id);
                const out = left <= 0 && !settings.allowNegativeStock;
                return (
                  <button key={p.id} className={cx('pos-tile', out && 'out')} onClick={() => add(p)} title={`${p.name} · ${p.sku}`}>
                    <Ph src={p.image} label=" " className="pos-tile-img" />
                    <div className="pos-tile-name">{p.name}</div>
                    <div className="row between" style={{ marginTop: 'auto', width: '100%' }}>
                      <b>{money(p.price)}</b>
                      <span className={cx('pos-stock', left <= 0 ? 'red' : left <= p.reorderPoint ? 'amber' : '')}>{left <= 0 ? 'Out' : `${left}`}</span>
                    </div>
                    {p.isRx && <span className="pos-rx">Rx</span>}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Cart */}
        <aside className="pos-cart">
          <div className="pos-cust">
            {customer ? (
              <div className="row gap-10">
                <span className="avatar sm">{(customer.name || '?').slice(0, 1)}</span>
                <div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{customer.name}</b><span className="sub" style={{ fontSize: 12 }}>{customer.phone || customer.email || 'Customer'}{customer.tier ? ` · ${customer.tier}` : ''}</span></div>
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => setCustomer(null)} aria-label="Remove customer"><Icon name="x" size={14} /></button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div className="searchbar" style={{ height: 40 }}>
                  <Icon name="user" size={15} />
                  <input id="pos-cust" value={custQ} onChange={(e) => setCustQ(e.target.value)} placeholder="Customer name or phone (F4)" aria-label="Find customer" />
                </div>
                {(custMatches.length > 0 || custQ.trim().length >= 3) && (
                  <div className="pos-pop">
                    {custMatches.map((c) => (
                      <button key={c.id} onClick={() => { setCustomer({ id: c.uid || c.id, name: c.name, phone: c.phone, email: c.email, tier: c.tier }); setCustQ(''); }}>
                        <b>{c.name}</b><span className="sub">{c.phone || c.email} · {c.tier}</span>
                      </button>
                    ))}
                    {custQ.trim().length >= 3 && (
                      <button onClick={() => { const v = custQ.trim(); setCustomer(/^[+\d\s-]{6,}$/.test(v) ? { name: 'Walk-in', phone: v } : { name: v, phone: '' }); setCustQ(''); }}>
                        <b>Use “{custQ.trim()}”</b><span className="sub">for this sale only</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pos-lines">
            {lines.length === 0 ? (
              <div className="pos-empty"><Icon name="bag" size={28} /><div>Scan or tap a product to start</div><div className="subtle" style={{ fontSize: 12 }}>F2 search · F4 customer · F9 pay · Enter on empty search = pay</div></div>
            ) : lines.map((l) => (
              <div key={l.key} className="pos-line">
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>{l.name}{l.isRx && <span className="pos-rx inline">Rx</span>}</div>
                  <button className="link sub" style={{ fontSize: 12 }} onClick={() => setEditLine(l)}>
                    {money(l.price)}{l.discount ? ` · −${money(l.discount)}` : ''} · edit
                  </button>
                </div>
                <div className="pos-qty">
                  <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Decrease">−</button>
                  <input value={l.qty} onChange={(e) => setQty(l.key, Math.max(0, parseInt(e.target.value, 10) || 0))} aria-label="Quantity" />
                  <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="Increase">+</button>
                </div>
                <b className="pos-line-total">{money(l.price * l.qty - (l.discount || 0))}</b>
              </div>
            ))}
          </div>

          <div className="pos-totals">
            <div className="row between"><span>Subtotal · {totals.units} item{totals.units === 1 ? '' : 's'}</span><span>{money(totals.gross)}</span></div>
            {totals.totalDiscount > 0 && <div className="row between teal"><span>Discounts</span><span>−{money(totals.totalDiscount)}</span></div>}
            {settings.vatRate > 0 && <div className="row between subtle"><span>VAT {settings.vatRate}%{settings.pricesIncludeVat ? ' incl.' : ''}</span><span>{money(totals.vat)}</span></div>}
            <div className="row between pos-grand"><span>Total</span><span>{money(totals.total)}</span></div>
          </div>
          <div className="pos-actions">
            <Button variant="outline" icon="tag" disabled={!lines.length} onClick={() => setModal('discount')}>Discount</Button>
            <Button variant="outline" icon="clock" disabled={!lines.length} onClick={hold}>Park</Button>
            <Button variant="outline" icon="x" disabled={!lines.length} onClick={() => { if (window.confirm('Clear this sale?')) reset(); }}>Clear</Button>
          </div>
          <Button variant="teal" size="lg" block icon="cash" className="pos-pay" disabled={!lines.length} onClick={() => setModal('pay')}>
            Pay {money(totals.total)} <span className="pos-kbd">F9</span>
          </Button>
        </aside>
      </div>

      {modal === 'pay' && <PayModal totals={totals} methods={settings.paymentMethods} hasRx={hasRx} busy={busy} onClose={() => setModal(null)} onComplete={complete} />}
      {modal === 'done' && lastSale && <DoneModal sale={lastSale} settings={settings} onNew={() => setModal(null)} />}
      {modal === 'discount' && (
        <Modal title="Cart discount" onClose={() => setModal(null)} width={400}>
          <DiscountForm base={totals.gross - totals.lineDiscount} value={cartDiscount} onApply={(v) => { setCartDiscount(v); setModal(null); }} />
        </Modal>
      )}
      {editLine && (
        <Modal title={editLine.name} onClose={() => setEditLine(null)} width={400}>
          <LineForm line={editLine} onSave={(patch) => { setLines((ls) => ls.map((l) => (l.key === editLine.key ? { ...l, ...patch } : l))); setEditLine(null); }} onRemove={() => { setQty(editLine.key, 0); setEditLine(null); }} />
        </Modal>
      )}
      {modal === 'held' && (
        <Modal title="Parked sales" onClose={() => setModal(null)} width={480}>
          {held.length === 0 ? <div className="sub">Nothing parked.</div> : (
            <div className="list">
              {held.map((h) => (
                <div key={h.id} className="list-row">
                  <div className="grow"><b>{h.customer?.name || 'Walk-in'}</b><div className="sub" style={{ fontSize: 12 }}>{h.lines.length} lines · {new Date(h.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div></div>
                  <b>{money(h.total)}</b>
                  <Button size="sm" variant="dark" onClick={() => resume(h)} disabled={lines.length > 0}>Resume</Button>
                  <button className="btn btn-ghost btn-square btn-sm" onClick={() => setHeld(held.filter((x) => x.id !== h.id))} aria-label="Delete parked sale"><Icon name="x" size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {lines.length > 0 && held.length > 0 && <div className="sub" style={{ marginTop: 10 }}>Finish or park the current sale before resuming another.</div>}
        </Modal>
      )}
      {modal === 'cash' && shift && (
        <CashMoveModal onClose={() => setModal(null)} onSave={async (m) => {
          try { await cashMove(shift.id, { ...m, by: user?.name }); toast(m.type === 'in' ? 'Paid in recorded' : 'Paid out recorded'); setModal(null); } catch { toast('Couldn’t record — check permissions', { tone: 'error' }); }
        }} />
      )}
      {modal === 'close' && shift && (
        <CloseShiftModal shift={shift} sales={sales} settings={settings} onClose={() => setModal(null)} onDone={async (counted, summary, note) => {
          try { await closeShift(shift.id, { counted, summary, user, note }); toast(`${register} closed`); setModal(null); } catch { toast('Couldn’t close the shift', { tone: 'error' }); }
        }} />
      )}
    </>
  );
}

function PosBar({ register, setRegister, shift, training, held, onHeld, onCash, onClose, onReprint }) {
  return (
    <div className="pos-bar">
      <div className="row gap-10 wrap">
        <h1 className="adm-title" style={{ fontSize: 28, marginTop: 0 }}>Point of sale</h1>
        <select className="filter-select" style={{ height: 36 }} value={register} onChange={(e) => setRegister(e.target.value)} aria-label="Register" disabled={!!shift}>
          {['Till 1', 'Till 2', 'Till 3', 'Pharmacy counter', 'Clinic desk'].map((r) => <option key={r}>{r}</option>)}
        </select>
        {training && <Pill tone="yellow" icon="alert">Training mode · nothing is saved</Pill>}
        {shift && <Pill tone="teal" icon="clock">Shift open since {new Date(shift.openedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {shift.openedBy?.name}</Pill>}
      </div>
      <div className="row gap-8 wrap">
        {onReprint && <Button variant="outline" size="sm" icon="printer" onClick={onReprint}>Reprint last</Button>}
        {onHeld && <Button variant="outline" size="sm" icon="clock" onClick={onHeld}>Parked{held ? ` (${held})` : ''}</Button>}
        {shift && onCash && <Button variant="outline" size="sm" icon="cash" onClick={onCash}>Cash in/out</Button>}
        {shift && onClose && <Button variant="dark" size="sm" icon="lock" onClick={onClose}>Close shift</Button>}
      </div>
    </div>
  );
}

function DiscountForm({ base, value, onApply }) {
  const [mode, setMode] = useState('amount');
  const [v, setV] = useState(value ? String(value) : '');
  const amount = mode === 'pct' ? Math.round((base * Math.min(100, Number(v) || 0)) / 100) : Math.min(base, Number(v) || 0);
  return (
    <form className="stack gap-12" onSubmit={(e) => { e.preventDefault(); onApply(amount); }}>
      <div className="pos-methods">
        <button type="button" className={cx('pos-method', mode === 'amount' && 'on')} onClick={() => setMode('amount')}>৳ Amount</button>
        <button type="button" className={cx('pos-method', mode === 'pct' && 'on')} onClick={() => setMode('pct')}>% Percent</button>
      </div>
      <Field label={mode === 'pct' ? 'Percent off' : 'Amount off (BDT)'} type="number" min="0" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
      <div className="sub">Discount: <b>{money(amount)}</b> of {money(base)}</div>
      <div className="row gap-8">
        <Button variant="outline" onClick={() => onApply(0)}>Remove</Button>
        <Button type="submit" variant="dark" className="grow" icon="check">Apply</Button>
      </div>
    </form>
  );
}

function LineForm({ line, onSave, onRemove }) {
  const [price, setPrice] = useState(String(line.price));
  const [qty, setQty] = useState(String(line.qty));
  const [disc, setDisc] = useState(String(line.discount || 0));
  return (
    <form className="stack gap-12" onSubmit={(e) => { e.preventDefault(); onSave({ price: Number(price) || 0, qty: Math.max(1, parseInt(qty, 10) || 1), discount: Math.max(0, Number(disc) || 0) }); }}>
      <div className="fields">
        <Field label="Unit price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Field label="Quantity" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        <Field className="full" label="Line discount (BDT)" type="number" min="0" value={disc} onChange={(e) => setDisc(e.target.value)} />
      </div>
      <div className="row gap-8">
        <Button variant="outline" icon="x" onClick={onRemove}>Remove</Button>
        <Button type="submit" variant="dark" className="grow" icon="check">Update line</Button>
      </div>
    </form>
  );
}
