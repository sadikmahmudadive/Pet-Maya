import { useMemo, useState } from 'react';
import { useAdmin, useAdminWrite, downloadCsv } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Tabs, Field, Empty, Portal } from '../../ui/index.jsx';
import { money, cx, shortDate } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const BLANK = {
  code: '',
  discountType: 'fixed',
  value: 100,
  minOrder: 500,
  maxUsage: 200,
  description: '',
  active: true,
  expiresInDays: 30,
};

function CouponModal({ onClose, coupon = null, onSave }) {
  const [f, setF] = useState(coupon ? { ...coupon, expiresInDays: coupon.expiresAt ? Math.round((coupon.expiresAt - Date.now()) / 864e5) : 30 } : BLANK);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.code.trim()) return;
    setBusy(true);
    const codeClean = f.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const data = {
      code: codeClean,
      discountType: f.discountType,
      value: Number(f.value) || 0,
      minOrder: Number(f.minOrder) || 0,
      maxUsage: Number(f.maxUsage) || 100,
      usageCount: coupon?.usageCount || 0,
      active: f.active !== false,
      expiresAt: Date.now() + (Number(f.expiresInDays) || 30) * 864e5,
      description: f.description || `${f.discountType === 'percent' ? `${f.value}%` : money(f.value)} discount on orders over ${money(f.minOrder)}`,
      createdAt: coupon?.createdAt || Date.now(),
    };
    await onSave(data, coupon?.id || `c-${codeClean.toLowerCase()}`);
    setBusy(false);
    onClose();
  };

  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Manage coupon">
        <div className="row between">
          <h2 className="serif" style={{ fontSize: 24 }}>{coupon ? 'Edit Promo Code' : 'Create New Promo Code'}</h2>
          <button type="button" className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>
        </div>
        <p className="sub" style={{ marginTop: 4 }}>Promo codes can be applied by customers at checkout for instant discounts.</p>
        <div className="stack gap-14" style={{ marginTop: 16 }}>
          <Field label="Coupon code">
            <input className="input mono" style={{ textTransform: 'uppercase', fontWeight: 600 }} required placeholder="e.g. MAYA200" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
          </Field>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Discount type">
              <select className="select" value={f.discountType} onChange={(e) => setF({ ...f, discountType: e.target.value })}>
                <option value="fixed">Fixed BDT Amount (৳)</option>
                <option value="percent">Percentage Discount (%)</option>
              </select>
            </Field>
            <Field label={f.discountType === 'percent' ? 'Percentage (%)' : 'Discount value (BDT)'}>
              <input className="input" type="number" min="1" required value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
            </Field>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Min order value (BDT)">
              <input className="input" type="number" min="0" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} />
            </Field>
            <Field label="Usage limit (claims)">
              <input className="input" type="number" min="1" value={f.maxUsage} onChange={(e) => setF({ ...f, maxUsage: e.target.value })} />
            </Field>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Valid for (days)">
              <input className="input" type="number" min="1" value={f.expiresInDays} onChange={(e) => setF({ ...f, expiresInDays: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className="select" value={f.active ? '1' : '0'} onChange={(e) => setF({ ...f, active: e.target.value === '1' })}>
                <option value="1">Active</option>
                <option value="0">Disabled</option>
              </select>
            </Field>
          </div>
          <Field label="Internal description / Banner text">
            <input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="e.g. ৳200 off your first prescription order" />
          </Field>
        </div>
        <Button type="submit" variant="dark" size="lg" block icon="check" style={{ marginTop: 20 }} disabled={busy}>
          {busy ? 'Saving…' : coupon ? 'Update Promo Code' : 'Create Promo Code'}
        </Button>
      </form>
    </Portal>
  );
}

export default function Promotions() {
  const { coupons = [] } = useAdmin();
  const write = useAdminWrite();
  const { toast } = useStore();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [editCoupon, setEditCoupon] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const TABS = [
    ['all', 'All Coupons', () => true],
    ['active', 'Active', (c) => c.active && (!c.expiresAt || c.expiresAt > Date.now())],
    ['expired', 'Expired / Exhausted', (c) => !c.active || (c.expiresAt && c.expiresAt <= Date.now()) || (c.usageCount >= c.maxUsage)],
  ];

  const filtered = useMemo(() => coupons.filter((c) => {
    if (q && !`${c.code} ${c.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [coupons, q]);

  const list = filtered.filter(TABS.find((t) => t[0] === tab)[2]);

  const activeCount = coupons.filter((c) => c.active && (!c.expiresAt || c.expiresAt > Date.now())).length;
  const totalClaims = coupons.reduce((a, c) => a + (c.usageCount || 0), 0);
  const topCoupon = [...coupons].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];

  const handleSave = async (data, id) => {
    await write('coupons', id, data, 'Promo code saved');
  };

  const toggleStatus = async (c) => {
    await write('coupons', c.id || c.code, { active: !c.active }, `${c.code} ${!c.active ? 'activated' : 'disabled'}`);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast(`Copied "${code}" to clipboard!`);
  };

  return (
    <>
      <PageHead eyebrow="Marketing & Growth" title="Coupons & Promotions">
        <Button variant="outline" icon="download" onClick={() => downloadCsv('promotions.csv', [['Code', 'Discount', 'Min Order', 'Redemptions', 'Status', 'Description'], ...coupons.map((c) => [c.code, c.discountType === 'percent' ? `${c.value}%` : `৳${c.value}`, c.minOrder, `${c.usageCount || 0}/${c.maxUsage || '∞'}`, c.active ? 'Active' : 'Disabled', c.description])])}>Export CSV</Button>
        <Button variant="dark" icon="plus" onClick={() => { setEditCoupon(null); setShowModal(true); }}>Create Promo Code</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Active coupons" value={activeCount} icon="tag" note={`${coupons.length} total created`} />
        <Stat label="Total redemptions" value={totalClaims.toLocaleString('en-US')} icon="trend" note="across all campaigns" />
        <Stat label="Top performer" value={topCoupon ? topCoupon.code : '—'} icon="star" delta={topCoupon ? `${topCoupon.usageCount} uses` : null} note={topCoupon ? `${topCoupon.discountType === 'percent' ? `${topCoupon.value}% off` : money(topCoupon.value)}` : 'No data'} />
        <Stat label="Avg discount" value="15%" icon="sparkles" note="estimated margin boost" />
      </div>

      <div className="filter-row" style={{ marginTop: 16 }}>
        <div className="searchbar"><Icon name="filter" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search promo codes or description…" aria-label="Filter promotions" /></div>
      </div>

      <div className="card flush" style={{ marginTop: 16 }}>
        <div className="card-tabs">
          <Tabs items={TABS.map(([v, l, fn]) => ({ value: v, label: l, count: filtered.filter(fn).length }))} value={tab} onChange={setTab} />
        </div>
        {list.length === 0 ? <Empty icon="tag" title="No promo codes found">Create a code or adjust your search filters.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Redemptions</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const isExpired = c.expiresAt && c.expiresAt <= Date.now();
                  const isExhausted = c.maxUsage && c.usageCount >= c.maxUsage;
                  const isActive = c.active && !isExpired && !isExhausted;
                  return (
                    <tr key={c.id || c.code}>
                      <td>
                        <div className="row gap-8">
                          <span className="mono bold pill teal" style={{ cursor: 'pointer', letterSpacing: '0.05em' }} onClick={() => copyCode(c.code)} title="Click to copy">
                            {c.code}
                          </span>
                          <span className="subtle hide-sm" style={{ fontSize: 12 }}>{c.description}</span>
                        </div>
                      </td>
                      <td><b>{c.discountType === 'percent' ? `${c.value}% OFF` : `${money(c.value)} OFF`}</b></td>
                      <td>{c.minOrder ? money(c.minOrder) : 'No min'}</td>
                      <td><span className="mono">{c.usageCount || 0}</span> / <span className="muted">{c.maxUsage || '∞'}</span></td>
                      <td className="muted" style={{ fontSize: 13 }}>{c.expiresAt ? shortDate(c.expiresAt) : 'Never'}</td>
                      <td>
                        <Pill tone={isActive ? 'teal' : isExpired || isExhausted ? 'red' : ''} sm>
                          {isActive ? 'Active' : isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Disabled'}
                        </Pill>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(c)}>
                            {c.active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="sm" icon="settings" onClick={() => { setEditCoupon(c); setShowModal(true); }}>Edit</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CouponModal
          coupon={editCoupon}
          onClose={() => { setShowModal(false); setEditCoupon(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
