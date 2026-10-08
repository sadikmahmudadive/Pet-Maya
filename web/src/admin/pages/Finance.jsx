import { useMemo, useState } from 'react';
import { useAdmin, downloadCsv } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { saveRecord, removeRecord, printDocument, escapeHtml as esc } from '../erp.js';
import { Modal } from './POS.jsx';
import { Icon, Button, Pill, Stat, Tabs, Empty, Field } from '../../ui/index.jsx';
import { money, cx, shortDate } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const monthKey = (ms) => new Date(ms).toISOString().slice(0, 7);
function periodRange(p, custom) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const som = new Date(d.getFullYear(), d.getMonth(), 1);
  switch (p) {
    case 'month': return [som.getTime(), Date.now() + 1, 'This month'];
    case 'last': { const s = new Date(d.getFullYear(), d.getMonth() - 1, 1); return [s.getTime(), som.getTime(), s.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })]; }
    case 'quarter': { const s = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1); return [s.getTime(), Date.now() + 1, 'This quarter']; }
    case 'year': return [new Date(d.getFullYear(), 0, 1).getTime(), Date.now() + 1, `Year to date ${d.getFullYear()}`];
    case 'custom': { const [y, m] = (custom || monthKey(Date.now())).split('-').map(Number); return [new Date(y, m - 1, 1).getTime(), new Date(y, m, 1).getTime(), new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })]; }
    default: return [0, Date.now() + 1, 'All time'];
  }
}

function ExpenseModal({ expense, categories, methods, user, onClose }) {
  const { toast } = useStore();
  const [f, setF] = useState({
    date: new Date(expense?.date || Date.now()).toISOString().slice(0, 10), category: categories[0], description: '', amount: '', method: 'Cash', paidTo: '', ref: '', ...expense,
    ...(expense?.date ? { date: new Date(expense.date).toISOString().slice(0, 10) } : {}),
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      await saveRecord('expenses', expense?.id, { date: Date.parse(f.date) || Date.now(), category: f.category, description: f.description, amount: Number(f.amount) || 0, method: f.method, paidTo: f.paidTo, ref: f.ref, by: expense?.by || user?.name || '' });
      toast(expense?.id ? 'Expense updated' : 'Expense recorded');
      onClose();
    } catch { toast('Couldn’t save — check permissions', { tone: 'error' }); }
  };
  return (
    <Modal title={expense?.id ? 'Edit expense' : 'Record expense'} onClose={onClose} width={540}>
      <form className="stack gap-14" onSubmit={save}>
        <div className="fields">
          <Field label="Date" type="date" value={f.date} onChange={set('date')} required />
          <Field label="Category"><select className="select" value={f.category} onChange={set('category')}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field className="full" label="Description" value={f.description} onChange={set('description')} required placeholder="e.g. October shop rent" autoFocus />
          <Field label="Amount (BDT)" type="number" min="0" step="0.01" value={f.amount} onChange={set('amount')} required />
          <Field label="Paid by"><select className="select" value={f.method} onChange={set('method')}>{['Cash', 'Bank', ...methods.filter((m) => m !== 'Cash')].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Paid to" value={f.paidTo} onChange={set('paidTo')} />
          <Field label="Reference / voucher" value={f.ref} onChange={set('ref')} />
        </div>
        <Button type="submit" variant="dark" block icon="check">Save expense</Button>
      </form>
    </Modal>
  );
}

export default function Finance({ user }) {
  const { orders, sales, expenses, supplierPayments, suppliers, products, shifts, settings } = useAdmin();
  const { toast } = useStore();
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState(monthKey(Date.now()));
  const [tab, setTab] = useState('pl');
  const [edit, setEdit] = useState(null);
  const [from, to, label] = periodRange(period, custom);
  const inP = (t) => t >= from && t < to;

  const f = useMemo(() => {
    const costOf = Object.fromEntries(products.map((p) => [p.id, p.cost || 0]));
    const online = orders.filter((o) => inP(o.placedAt) && o.status !== 'Cancelled' && o.status !== 'Return');
    const onlineSales = online.reduce((a, o) => a + o.subtotal - (o.discount || 0), 0);
    const delivery = online.reduce((a, o) => a + (o.shipping || 0), 0);
    const onlineCogs = online.reduce((a, o) => a + o.items.reduce((b, i) => b + (costOf[i.id] || 0) * i.qty, 0), 0);

    const pos = sales.filter((s) => inP(s.createdAt));
    const posGross = pos.reduce((a, s) => a + (s.total || 0), 0);
    const posVat = pos.reduce((a, s) => a + (s.vat || 0), 0);
    const posRefunds = pos.reduce((a, s) => a + (s.refundedTotal || 0), 0);
    const posNet = posGross - posVat - posRefunds;
    const posCogs = pos.reduce((a, s) => a + (s.cost || 0) * (s.total ? 1 - (s.refundedTotal || 0) / s.total : 1), 0);

    const exp = expenses.filter((e) => inP(e.date));
    const byCat = {};
    exp.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const opex = exp.reduce((a, e) => a + e.amount, 0);

    const revenue = onlineSales + delivery + posNet;
    const cogs = onlineCogs + posCogs;
    const gross = revenue - cogs;
    const net = gross - opex;

    // Cash book by method
    const book = {};
    const add = (m, k, v) => { book[m] ||= { in: 0, out: 0 }; book[m][k] += v; };
    pos.forEach((s) => {
      (s.payments || []).forEach((p) => add(p.method, 'in', p.amount));
      if (s.change) add('Cash', 'out', s.change);
      (s.refunds || []).forEach((r) => add(r.method, 'out', r.amount));
    });
    online.filter((o) => o.status === 'Delivered' || !/cod|cash/i.test(o.payment)).forEach((o) => add(/cod|cash/i.test(o.payment) ? 'Cash (COD)' : o.payment, 'in', o.total));
    exp.forEach((e) => add(e.method || 'Cash', 'out', e.amount));
    supplierPayments.filter((p) => inP(p.at)).forEach((p) => add(p.method, 'out', p.amount));
    shifts.forEach((sh) => (sh.cashMoves || []).filter((m) => inP(m.at)).forEach((m) => add('Cash', m.type === 'in' ? 'in' : 'out', m.amount)));

    const receivable = orders.filter((o) => /cod|cash/i.test(o.payment) && ['Packing', 'In transit', 'Rx review'].includes(o.status)).reduce((a, o) => a + o.total, 0);
    const payable = suppliers.reduce((a, s) => a + Math.max(0, s.balance || 0), 0);
    const missingCost = products.filter((p) => !p.cost).length;
    return { onlineSales, delivery, onlineCogs, posGross, posVat, posRefunds, posNet, posCogs, byCat, opex, revenue, cogs, gross, net, book, receivable, payable, exp, missingCost, onlineCount: online.length, posCount: pos.length };
  }, [orders, sales, expenses, supplierPayments, suppliers, products, shifts, from, to]); // eslint-disable-line

  const vatByMonth = useMemo(() => {
    const m = {};
    sales.forEach((s) => { const k = monthKey(s.createdAt); m[k] ||= { taxable: 0, vat: 0, n: 0 }; m[k].vat += s.vat || 0; m[k].taxable += (s.total || 0) - (s.vat || 0); m[k].n++; });
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sales]);

  const plRows = [
    ['Online product sales', f.onlineSales], ['Delivery charges', f.delivery], ['Store (POS) sales, net of VAT & refunds', f.posNet],
    ['Total revenue', f.revenue, 'b'], ['Cost of goods sold', -f.cogs], ['Gross profit', f.gross, 'b'],
    ...Object.entries(f.byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => [`  ${c}`, -v]), ['Operating expenses', -f.opex, 'b'], ['Net profit', f.net, 'bb'],
  ];
  const printPL = () => printDocument(`P&L ${label}`, `<h1>Profit & loss</h1><div class="muted">${esc(settings.businessName)} · ${esc(label)}</div>
    <table>${plRows.map(([k, v, s]) => `<tr${s ? ' class="tot"' : ''}><td>${esc(k)}</td><td class="r">${money(v)}</td></tr>`).join('')}</table>
    <p class="muted">VAT collected (liability, excluded from revenue): ${money(f.posVat)}. Online COGS uses current product cost prices.</p>`);

  const book = Object.entries(f.book);
  return (
    <>
      <PageHead eyebrow="Accounting" title="Finance">
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
          <option value="month">This month</option><option value="last">Last month</option><option value="quarter">This quarter</option><option value="year">Year to date</option><option value="custom">Pick a month…</option><option value="all">All time</option>
        </select>
        {period === 'custom' && <input className="filter-select" type="month" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Month" style={{ paddingRight: 16 }} />}
        <Button variant="outline" icon="printer" onClick={printPL}>Print P&L</Button>
        <Button variant="dark" icon="plus" onClick={() => setEdit({})}>Record expense</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Revenue" value={money(f.revenue, { compact: true })} icon="trend" note={`${f.onlineCount} online · ${f.posCount} in store`} />
        <Stat label="Gross profit" value={money(f.gross, { compact: true })} icon="pulse" delta={f.revenue ? `${Math.round((f.gross / f.revenue) * 100)}%` : null} note="margin" />
        <Stat label="Expenses" value={money(f.opex, { compact: true })} icon="file" note={label} />
        <Stat label="Net profit" value={money(f.net, { compact: true })} icon="cash" deltaTone={f.net < 0 ? 'red' : 'teal'} delta={f.net < 0 ? 'loss' : 'profit'} note={label} />
      </div>
      {f.missingCost > 0 && <div className="note-yellow" style={{ marginTop: 12 }}>{f.missingCost} products have no cost price, so their cost of goods counts as ৳0. Add costs in Inventory or receive them through Purchasing.</div>}

      <div style={{ marginTop: 16 }}><Tabs items={[{ value: 'pl', label: 'Profit & loss' }, { value: 'cash', label: 'Cash book' }, { value: 'expenses', label: 'Expenses', count: f.exp.length }, { value: 'vat', label: 'VAT' }]} value={tab} onChange={setTab} /></div>

      {tab === 'pl' && (
        <div className="adm-grid-2" style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head"><div><h2 className="h-card">Profit & loss</h2><div className="sub">{label}</div></div></div>
            <div className="pl">
              {plRows.map(([k, v, s]) => (
                <div key={k} className={cx('pl-row', s)}><span>{k}</span><span className={v < 0 ? 'red' : ''}>{money(v)}</span></div>
              ))}
            </div>
          </div>
          <div className="stack gap-16">
            <div className="card">
              <h2 className="h-card">Position today</h2>
              <div className="kv-grid" style={{ marginTop: 10 }}>
                <span>Receivable · COD not yet collected</span><b>{money(f.receivable)}</b>
                <span>Payable · owed to suppliers</span><b className="red">{money(f.payable)}</b>
                <span>VAT collected this period</span><b>{money(f.posVat)}</b>
              </div>
            </div>
            <div className="card">
              <h2 className="h-card">Where revenue came from</h2>
              <div className="stack gap-12" style={{ marginTop: 12 }}>
                {[['Online shop', f.onlineSales + f.delivery], ['Store / POS', f.posNet]].map(([k, v]) => (
                  <div key={k}>
                    <div className="row between" style={{ fontSize: 14 }}><span>{k}</span><b>{money(v)}</b></div>
                    <div className="meter" style={{ marginTop: 6, height: 6 }}><span style={{ width: `${f.revenue ? (v / f.revenue) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'cash' && (
        <div className="card flush" style={{ marginTop: 16 }}>
          {book.length === 0 ? <Empty icon="cash" title="No money moved in this period" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Account / method</th><th>Money in</th><th>Money out</th><th>Net</th></tr></thead>
                <tbody>
                  {book.map(([m, v]) => <tr key={m}><td className="cell-title">{m}</td><td className="teal">{money(v.in)}</td><td className="red">{money(v.out)}</td><td><b>{money(v.in - v.out)}</b></td></tr>)}
                  <tr><td><b>Total</b></td><td><b>{money(book.reduce((a, [, v]) => a + v.in, 0))}</b></td><td><b>{money(book.reduce((a, [, v]) => a + v.out, 0))}</b></td><td><b>{money(book.reduce((a, [, v]) => a + v.in - v.out, 0))}</b></td></tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="sub" style={{ padding: '12px 20px' }}>In: till payments, prepaid online orders and collected COD. Out: change, refunds, expenses, supplier payments and drawer paid-outs.</div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card flush" style={{ marginTop: 16 }}>
          <div className="row between" style={{ padding: '16px 20px' }}>
            <div className="row gap-6 wrap">{Object.entries(f.byCat).map(([c, v]) => <span key={c} className="pill">{c} · {money(v)}</span>)}</div>
            <Button size="sm" variant="outline" icon="download" onClick={() => downloadCsv(`expenses-${label}.csv`, [['Date', 'Category', 'Description', 'Amount', 'Method', 'Paid to', 'Reference', 'By'], ...f.exp.map((e) => [new Date(e.date).toISOString().slice(0, 10), e.category, e.description, e.amount, e.method, e.paidTo, e.ref, e.by])])}>Export</Button>
          </div>
          {f.exp.length === 0 ? <Empty icon="file" title="No expenses in this period" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid to</th><th>Method</th><th>Amount</th><th /></tr></thead>
                <tbody>
                  {f.exp.map((e) => (
                    <tr key={e.id}>
                      <td className="muted">{shortDate(e.date)}</td><td><span className="pill sm">{e.category}</span></td>
                      <td className="cell-title" style={{ whiteSpace: 'normal' }}>{e.description}</td><td>{e.paidTo || '—'}</td><td>{e.method}</td><td><b>{money(e.amount)}</b></td>
                      <td>
                        <div className="row gap-4">
                          <button className="btn btn-ghost btn-square btn-sm" onClick={() => setEdit(e)} aria-label="Edit"><Icon name="settings" size={14} /></button>
                          <button className="btn btn-ghost btn-square btn-sm" style={{ color: 'var(--red)' }} aria-label="Delete" onClick={async () => { if (!window.confirm('Delete this expense?')) return; try { await removeRecord('expenses', e.id); toast('Expense deleted'); } catch { toast('Couldn’t delete', { tone: 'error' }); } }}><Icon name="x" size={14} /></button>
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

      {tab === 'vat' && (
        <div className="card flush" style={{ marginTop: 16 }}>
          <div className="row between" style={{ padding: '16px 20px' }}>
            <div><h2 className="h-card">VAT collected at the till</h2><div className="sub">Rate {settings.vatRate}% · {settings.pricesIncludeVat ? 'prices include VAT' : 'VAT added at checkout'}{settings.bin ? ` · BIN ${settings.bin}` : ''}</div></div>
            <Button size="sm" variant="outline" icon="download" onClick={() => downloadCsv('vat-by-month.csv', [['Month', 'Receipts', 'Taxable value', 'VAT'], ...vatByMonth.map(([k, v]) => [k, v.n, v.taxable.toFixed(2), v.vat.toFixed(2)])])}>Export</Button>
          </div>
          {vatByMonth.length === 0 ? <Empty icon="file" title="No till sales yet" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Month</th><th>Receipts</th><th>Taxable value</th><th>VAT</th></tr></thead>
                <tbody>{vatByMonth.map(([k, v]) => <tr key={k}><td className="mono">{k}</td><td>{v.n}</td><td>{money(v.taxable)}</td><td><b>{money(v.vat)}</b></td></tr>)}</tbody>
              </table>
            </div>
          )}
          {!settings.vatRate && <div className="note-yellow" style={{ margin: 16 }}>VAT rate is 0%. Set your rate and BIN under Settings so receipts and this report show VAT.</div>}
        </div>
      )}

      {edit && <ExpenseModal expense={edit.id ? edit : null} categories={settings.expenseCategories} methods={settings.paymentMethods} user={user} onClose={() => setEdit(null)} />}
    </>
  );
}
