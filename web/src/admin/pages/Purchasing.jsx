import { useMemo, useState } from 'react';
import { useRouter } from '../../lib/router.jsx';
import { useAdmin, downloadCsv } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import {
  createPurchaseOrder, receivePurchase, paySupplier, saveRecord, printDocument, escapeHtml as esc, canAccess,
} from '../erp.js';
import { Modal } from './POS.jsx';
import { Icon, Button, Pill, Stat, Tabs, Empty, Field } from '../../ui/index.jsx';
import { money, cx, shortDate } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const PO_TONE = { Draft: '', Ordered: 'teal', 'Partially received': 'yellow', Received: 'teal', Cancelled: 'red' };

function SupplierModal({ supplier, onClose }) {
  const { toast } = useStore();
  const [f, setF] = useState({ name: '', contact: '', phone: '', email: '', address: '', termsDays: 30, notes: '', ...supplier });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      await saveRecord('suppliers', supplier?.id, { name: f.name.trim(), contact: f.contact, phone: f.phone, email: f.email, address: f.address, termsDays: Number(f.termsDays) || 0, notes: f.notes, ...(supplier?.id ? {} : { balance: 0 }) });
      toast(supplier?.id ? 'Supplier saved' : 'Supplier added');
      onClose();
    } catch { toast('Couldn’t save — check permissions', { tone: 'error' }); }
  };
  return (
    <Modal title={supplier?.id ? 'Edit supplier' : 'New supplier'} onClose={onClose} width={560}>
      <form className="stack gap-14" onSubmit={save}>
        <div className="fields">
          <Field className="full" label="Company name" value={f.name} onChange={set('name')} required autoFocus />
          <Field label="Contact person" value={f.contact} onChange={set('contact')} />
          <Field label="Phone" value={f.phone} onChange={set('phone')} />
          <Field label="Email" type="email" value={f.email} onChange={set('email')} />
          <Field label="Payment terms (days)" type="number" min="0" value={f.termsDays} onChange={set('termsDays')} />
          <Field className="full" label="Address" value={f.address} onChange={set('address')} />
          <Field className="full" label="Notes"><textarea className="textarea" rows={2} value={f.notes} onChange={set('notes')} /></Field>
        </div>
        <Button type="submit" variant="dark" block icon="check">Save supplier</Button>
      </form>
    </Modal>
  );
}

function POModal({ suppliers, products, onClose, preset }) {
  const { toast } = useStore();
  const [supplierId, setSupplierId] = useState(preset?.supplierId || suppliers[0]?.id || '');
  const [expectedAt, setExpectedAt] = useState(new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [items, setItems] = useState(preset?.items || []);
  const [pick, setPick] = useState(products[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const supplier = suppliers.find((s) => s.id === supplierId);

  const addProduct = (p, qty = 1) => setItems((it) => (it.some((i) => i.productId === p.id) ? it
    : [...it, { productId: p.id, name: p.name, sku: p.sku, qty, cost: p.lastCost || p.cost || Math.round(p.price * 0.7) }]));
  const addLow = () => {
    const low = products.filter((p) => p.stockCount <= p.reorderPoint && (!supplier || !p.supplier || p.supplier === supplier.name || p.brand === supplier.name));
    low.forEach((p) => addProduct(p, Math.max(p.reorderPoint, p.stockTarget - p.stockCount)));
    if (!low.length) toast('No low-stock items for this supplier');
  };
  const total = items.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.cost) || 0), 0);

  const save = async (status) => {
    if (!supplier) { toast('Add a supplier first', { tone: 'error' }); return; }
    if (!items.length) { toast('Add at least one item', { tone: 'error' }); return; }
    setBusy(true);
    try {
      const r = await createPurchaseOrder({ supplierId: supplier.id, supplierName: supplier.name, expectedAt: Date.parse(expectedAt) || null, note, items, status, ...(status === 'Ordered' ? { orderedAt: Date.now() } : {}) });
      toast(`${r.number} ${status === 'Draft' ? 'saved as draft' : 'created'}`);
      onClose();
    } catch (e) { toast(e.message || 'Couldn’t create the PO', { tone: 'error' }); }
    setBusy(false);
  };

  return (
    <Modal title="New purchase order" onClose={onClose} width={720}>
      <div className="fields">
        <Field label="Supplier">
          <select className="select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {suppliers.length === 0 && <option value="">Add a supplier first</option>}
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Expected delivery" type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 14, background: 'var(--sunk-2)', marginTop: 14 }}>
        <div className="row gap-8 wrap">
          <select className="select grow" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Product">
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.sku} · stock {p.stockCount}</option>)}
          </select>
          <Button variant="dark" size="sm" icon="plus" onClick={() => { const p = products.find((x) => x.id === pick); if (p) addProduct(p); }}>Add</Button>
          <Button variant="outline" size="sm" icon="flask" onClick={addLow}>Add low-stock items</Button>
        </div>
        {items.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead><tr><th>Item</th><th style={{ width: 90 }}>Qty</th><th style={{ width: 110 }}>Unit cost</th><th>Line</th><th /></tr></thead>
              <tbody>
                {items.map((i, k) => (
                  <tr key={i.productId}>
                    <td><div className="cell-title">{i.name}</div><div className="cell-sub mono">{i.sku}</div></td>
                    <td><input className="input" type="number" min="1" value={i.qty} style={{ height: 36 }} onChange={(e) => setItems(items.map((x, j) => (j === k ? { ...x, qty: e.target.value } : x)))} aria-label="Quantity" /></td>
                    <td><input className="input" type="number" min="0" step="0.01" value={i.cost} style={{ height: 36 }} onChange={(e) => setItems(items.map((x, j) => (j === k ? { ...x, cost: e.target.value } : x)))} aria-label="Unit cost" /></td>
                    <td><b>{money((Number(i.qty) || 0) * (Number(i.cost) || 0))}</b></td>
                    <td><button className="btn btn-ghost btn-square btn-sm" onClick={() => setItems(items.filter((_, j) => j !== k))} aria-label="Remove"><Icon name="x" size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Field label="Note to supplier" value={note} onChange={(e) => setNote(e.target.value)} className="" />
      <div className="row between" style={{ marginTop: 14 }}>
        <span>Order total <b style={{ fontSize: 20, marginLeft: 6 }}>{money(total)}</b></span>
        <div className="row gap-8">
          <Button variant="outline" disabled={busy} onClick={() => save('Draft')}>Save draft</Button>
          <Button variant="dark" icon="send" disabled={busy} onClick={() => save('Ordered')}>Place order</Button>
        </div>
      </div>
    </Modal>
  );
}

function ReceiveModal({ po, user, onClose }) {
  const { toast } = useStore();
  const [rows, setRows] = useState(po.items.map((i) => ({ qty: Math.max(0, i.qty - (i.received || 0)), cost: i.cost })));
  const [busy, setBusy] = useState(false);
  const value = rows.reduce((a, r) => a + (Number(r.qty) || 0) * (Number(r.cost) || 0), 0);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const v = await receivePurchase(po, rows.map((r, index) => ({ index, qty: Number(r.qty) || 0, cost: Number(r.cost) })), { by: user?.name });
      toast(`Received ${money(v)} into stock`);
      onClose();
    } catch (err) { toast(err.message || 'Receiving failed', { tone: 'error' }); }
    setBusy(false);
  };
  return (
    <Modal title={`Receive ${po.number}`} onClose={onClose} width={640}>
      <form onSubmit={submit}>
        <p className="sub">Enter what actually arrived. Stock, average cost and the supplier balance update together.</p>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="table">
            <thead><tr><th>Item</th><th>Ordered</th><th>Received</th><th style={{ width: 90 }}>Now</th><th style={{ width: 110 }}>Unit cost</th></tr></thead>
            <tbody>
              {po.items.map((i, k) => (
                <tr key={k}>
                  <td className="cell-title">{i.name}</td><td>{i.qty}</td><td>{i.received || 0}</td>
                  <td><input className="input" type="number" min="0" value={rows[k].qty} style={{ height: 36 }} onChange={(e) => setRows(rows.map((r, j) => (j === k ? { ...r, qty: e.target.value } : r)))} aria-label="Received now" /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={rows[k].cost} style={{ height: 36 }} onChange={(e) => setRows(rows.map((r, j) => (j === k ? { ...r, cost: e.target.value } : r)))} aria-label="Unit cost" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="submit" variant="dark" block icon="download" style={{ marginTop: 14 }} disabled={busy || value <= 0}>{busy ? 'Receiving…' : `Receive goods · ${money(value)}`}</Button>
      </form>
    </Modal>
  );
}

function PayModal({ supplier, po, methods, user, onClose }) {
  const { toast } = useStore();
  const due = po ? Math.max(0, (po.receivedValue || po.total) - (po.paid || 0)) : Math.max(0, supplier.balance || 0);
  const [amount, setAmount] = useState(String(Math.round(due)));
  const [method, setMethod] = useState('Bank');
  const [ref, setRef] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      await paySupplier({ supplier, po, amount: Number(amount), method, ref, by: user?.name });
      toast(`Paid ${money(amount)} to ${supplier.name}`);
      onClose();
    } catch (err) { toast(err.message || 'Payment failed', { tone: 'error' }); }
  };
  return (
    <Modal title={`Pay ${supplier.name}`} onClose={onClose} width={440}>
      <form className="stack gap-12" onSubmit={submit}>
        <div className="sub">{po ? `${po.number} · outstanding ${money(due)}` : `Account balance ${money(supplier.balance || 0)}`}</div>
        <Field label="Amount (BDT)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
        <Field label="Method"><select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>{['Bank', ...methods].map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Reference" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Cheque / transfer / trx ID" />
        <Button type="submit" variant="dark" block icon="check">Record payment</Button>
      </form>
    </Modal>
  );
}

export default function Purchasing({ user }) {
  const { purchases, suppliers, supplierPayments, products, settings } = useAdmin();
  const { query } = useRouter();
  const { toast } = useStore();
  const [tab, setTab] = useState(query.get('tab') || 'orders');
  const [status, setStatus] = useState('open');
  const [selId, setSelId] = useState(null);
  const [modal, setModal] = useState(null);
  const sel = purchases.find((p) => p.id === selId) || null;
  const canPay = canAccess(user?.role, '/admin/finance'); // payments are an accounting task

  const open = purchases.filter((p) => ['Ordered', 'Partially received', 'Draft'].includes(p.status));
  const payable = suppliers.reduce((a, s) => a + Math.max(0, s.balance || 0), 0);
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
  const spentMonth = supplierPayments.filter((p) => p.at >= thisMonth.getTime()).reduce((a, p) => a + p.amount, 0);
  const lowCount = products.filter((p) => p.stockCount <= p.reorderPoint).length;
  const list = useMemo(() => (status === 'open' ? open : status === 'all' ? purchases : purchases.filter((p) => p.status === status)), [purchases, open, status]);

  const printPO = (po) => {
    const s = suppliers.find((x) => x.id === po.supplierId) || {};
    printDocument(po.number, `
      <div style="display:flex;justify-content:space-between"><div><h1>Purchase order</h1><div class="muted">${esc(po.number)} · ${new Date(po.createdAt).toLocaleDateString('en-GB')}</div></div>
      <div style="text-align:right"><b>${esc(settings.businessName)}</b><div class="muted">${esc(settings.address)}<br>${esc(settings.phone)}${settings.bin ? `<br>BIN ${esc(settings.bin)}` : ''}</div></div></div>
      <p><b>Supplier:</b> ${esc(s.name || po.supplierName)}<br>${esc(s.contact || '')} ${esc(s.phone || '')}<br>${esc(s.address || '')}</p>
      ${po.expectedAt ? `<p><b>Deliver by:</b> ${new Date(po.expectedAt).toLocaleDateString('en-GB')}</p>` : ''}
      <table><tr><th>SKU</th><th>Item</th><th class="r">Qty</th><th class="r">Unit cost</th><th class="r">Amount</th></tr>
      ${po.items.map((i) => `<tr><td>${esc(i.sku)}</td><td>${esc(i.name)}</td><td class="r">${i.qty}</td><td class="r">${money(i.cost)}</td><td class="r">${money(i.qty * i.cost)}</td></tr>`).join('')}
      <tr class="tot"><td colspan="4">Total</td><td class="r">${money(po.total)}</td></tr></table>
      ${po.note ? `<p><b>Note:</b> ${esc(po.note)}</p>` : ''}<p class="muted" style="margin-top:40px">Authorised by ____________________</p>`);
  };
  const setPOStatus = async (po, s) => {
    try { await saveRecord('purchase_orders', po.id, { status: s, ...(s === 'Ordered' ? { orderedAt: Date.now() } : {}) }); toast(`${po.number} → ${s}`); } catch { toast('Couldn’t update', { tone: 'error' }); }
  };

  return (
    <>
      <PageHead eyebrow="Procurement" title="Purchasing">
        <Button variant="outline" icon="user" onClick={() => setModal({ type: 'supplier' })}>New supplier</Button>
        <Button variant="dark" icon="plus" onClick={() => setModal({ type: 'po' })}>New purchase order</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Open POs" value={open.length} icon="file" note={money(open.reduce((a, p) => a + (p.total || 0), 0), { compact: true }) + ' on order'} />
        <Stat label="Payable to suppliers" value={money(payable)} icon="cash" deltaTone="red" note={`${suppliers.filter((s) => (s.balance || 0) > 0).length} suppliers`} />
        <Stat label="Paid this month" value={money(spentMonth)} icon="trend" />
        <Stat label="Items to reorder" value={lowCount} icon="flask" note="at or below reorder point" />
      </div>

      <div style={{ marginTop: 16 }}><Tabs items={[{ value: 'orders', label: 'Purchase orders', count: purchases.length }, { value: 'suppliers', label: 'Suppliers', count: suppliers.length }, { value: 'payments', label: 'Payments', count: supplierPayments.length }]} value={tab} onChange={setTab} /></div>

      {tab === 'orders' && (
        <div className="adm-grid-side wide" style={{ marginTop: 16 }}>
          <div className="card flush">
            <div className="card-tabs"><Tabs items={[['open', 'Open'], ['Received', 'Received'], ['Cancelled', 'Cancelled'], ['all', 'All']].map(([v, l]) => ({ value: v, label: l }))} value={status} onChange={setStatus} /></div>
            {list.length === 0 ? <Empty icon="file" title="No purchase orders">Create one, or use “Add low-stock items” to build it from reorder suggestions.</Empty> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>PO</th><th>Supplier</th><th>Items</th><th>Total</th><th>Received</th><th>Paid</th><th>Status</th></tr></thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.id} className={cx('clickable', selId === p.id && 'selected')} onClick={() => setSelId(p.id)}>
                        <td className="mono" style={{ fontWeight: 600 }}>{p.number}</td>
                        <td><div className="cell-title">{p.supplierName}</div><div className="cell-sub">{shortDate(p.createdAt)}</div></td>
                        <td className="muted">{p.items?.length}</td>
                        <td><b>{money(p.total)}</b></td>
                        <td>{money(p.receivedValue || 0)}</td>
                        <td>{money(p.paid || 0)}</td>
                        <td><Pill tone={PO_TONE[p.status]} sm>{p.status}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {sel ? (
            <div className="card" style={{ position: 'sticky', top: 84 }}>
              <div className="card-head"><div><h2 className="h-card mono">{sel.number}</h2><div className="sub">{sel.supplierName}{sel.expectedAt ? ` · due ${new Date(sel.expectedAt).toLocaleDateString('en-GB')}` : ''}</div></div><Pill tone={PO_TONE[sel.status]} sm>{sel.status}</Pill></div>
              <div className="list">
                {sel.items.map((i, k) => (
                  <div key={k} className="list-row" style={{ padding: '8px 0' }}>
                    <div className="grow" style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontSize: 14 }}>{i.name}</div><div className="sub" style={{ fontSize: 12 }}>{i.received || 0}/{i.qty} received · {money(i.cost)} each</div></div>
                    <b>{money(i.qty * i.cost)}</b>
                  </div>
                ))}
              </div>
              <div className="kv-grid" style={{ marginTop: 10 }}>
                <span>Order total</span><b>{money(sel.total)}</b>
                <span>Received value</span><b>{money(sel.receivedValue || 0)}</b>
                <span>Paid</span><b>{money(sel.paid || 0)}</b>
              </div>
              <div className="stack gap-8" style={{ marginTop: 14 }}>
                {sel.status === 'Draft' && <Button variant="dark" icon="send" onClick={() => setPOStatus(sel, 'Ordered')}>Place order</Button>}
                {['Ordered', 'Partially received'].includes(sel.status) && <Button variant="teal" icon="download" onClick={() => setModal({ type: 'receive', po: sel })}>Receive goods</Button>}
                {canPay && (sel.receivedValue || 0) > (sel.paid || 0) && <Button variant="outline" icon="cash" onClick={() => setModal({ type: 'pay', po: sel, supplier: suppliers.find((s) => s.id === sel.supplierId) || { id: sel.supplierId, name: sel.supplierName } })}>Record payment</Button>}
                <div className="row gap-8">
                  <Button variant="outline" icon="printer" className="grow" onClick={() => printPO(sel)}>Print PO</Button>
                  {['Draft', 'Ordered'].includes(sel.status) && <Button variant="outline" icon="x" onClick={() => { if (window.confirm(`Cancel ${sel.number}?`)) setPOStatus(sel, 'Cancelled'); }}>Cancel</Button>}
                </div>
              </div>
            </div>
          ) : <div className="card"><Empty icon="file" title="Select a purchase order" /></div>}
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="card flush" style={{ marginTop: 16 }}>
          {suppliers.length === 0 ? <Empty icon="truck" title="No suppliers yet"><Button variant="dark" icon="plus" style={{ marginTop: 12 }} onClick={() => setModal({ type: 'supplier' })}>Add your first supplier</Button></Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Supplier</th><th>Contact</th><th>Terms</th><th>Open POs</th><th>Balance due</th><th /></tr></thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><div className="cell-title">{s.name}</div><div className="cell-sub">{s.address}</div></td>
                      <td><div>{s.contact}</div><div className="cell-sub">{s.phone} {s.email}</div></td>
                      <td>{s.termsDays ? `Net ${s.termsDays}` : 'On delivery'}</td>
                      <td>{purchases.filter((p) => p.supplierId === s.id && ['Ordered', 'Partially received'].includes(p.status)).length}</td>
                      <td><b className={(s.balance || 0) > 0 ? 'red' : ''}>{money(s.balance || 0)}</b></td>
                      <td>
                        <div className="row gap-6">
                          <Button size="sm" variant="outline" onClick={() => setModal({ type: 'supplier', supplier: s })}>Edit</Button>
                          {canPay && <Button size="sm" variant="dark" disabled={!(s.balance > 0)} onClick={() => setModal({ type: 'pay', supplier: s })}>Pay</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="card flush" style={{ marginTop: 16 }}>
          <div className="row between" style={{ padding: '16px 20px' }}>
            <h2 className="h-card">Supplier payments</h2>
            <Button variant="outline" size="sm" icon="download" onClick={() => downloadCsv('supplier-payments.csv', [['Date', 'Supplier', 'PO', 'Amount', 'Method', 'Reference', 'By'], ...supplierPayments.map((p) => [new Date(p.at).toISOString(), p.supplierName, p.poNumber, p.amount, p.method, p.ref, p.by])])}>Export</Button>
          </div>
          {supplierPayments.length === 0 ? <Empty icon="cash" title="No payments recorded" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Date</th><th>Supplier</th><th>PO</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
                <tbody>{supplierPayments.map((p) => <tr key={p.id}><td className="muted">{shortDate(p.at)}</td><td className="cell-title">{p.supplierName}</td><td className="mono">{p.poNumber || '—'}</td><td>{p.method}</td><td className="mono muted">{p.ref || '—'}</td><td><b>{money(p.amount)}</b></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal?.type === 'supplier' && <SupplierModal supplier={modal.supplier} onClose={() => setModal(null)} />}
      {modal?.type === 'po' && <POModal suppliers={suppliers} products={products} onClose={() => setModal(null)} />}
      {modal?.type === 'receive' && <ReceiveModal po={modal.po} user={user} onClose={() => setModal(null)} />}
      {modal?.type === 'pay' && <PayModal supplier={modal.supplier} po={modal.po} methods={settings.paymentMethods} user={user} onClose={() => setModal(null)} />}
    </>
  );
}
