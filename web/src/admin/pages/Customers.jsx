import { useMemo, useState } from 'react';
import { useRouter } from '../../lib/router.jsx';
import { functions, httpsCallable } from '../../config/firebase';
import { useAdmin, downloadCsv, ADMIN_CONFIG } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Tabs, Avatar, Empty, Field, Portal } from '../../ui/index.jsx';
import { money, cx, shortDate } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const TIER_TONE = { Platinum: 'dark', Gold: 'yellow', Member: '' };

function Campaign({ onClose, count }) {
  const { toast } = useStore();
  const [f, setF] = useState({ title: '', message: '', targetGroup: 'All Pet Owners' });
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!functions) throw new Error('offline');
      await httpsCallable(functions, 'send_broadcast')(f);
      toast('Push notification sent');
      onClose();
    } catch (err) {
      toast(/permission/i.test(String(err?.message)) ? 'Only accounts with the Admin role can send pushes' : 'Couldn’t send — check Cloud Functions', { tone: 'error' });
    } finally { setBusy(false); }
  };
  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={send} role="dialog" aria-modal="true" aria-label="Send campaign">
        <div className="row between"><h2 className="serif" style={{ fontSize: 26 }}>Send a push campaign</h2><button type="button" className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button></div>
        <p className="sub" style={{ marginTop: 6 }}>Goes to app users subscribed to the chosen topic. For a targeted list of these {count} customers, use Export instead.</p>
        <div className="stack gap-14" style={{ marginTop: 18 }}>
          <Field label="Audience"><select className="select" value={f.targetGroup} onChange={(e) => setF({ ...f, targetGroup: e.target.value })}><option>All Pet Owners</option><option>All Veterinarians</option><option>All Shop Merchants</option><option>Everyone</option></select></Field>
          <Field label="Title" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Monsoon tick alert" />
          <Field label="Message"><textarea className="textarea" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Short and useful — 1–2 sentences." /></Field>
        </div>
        <Button type="submit" variant="dark" size="lg" block icon="send" style={{ marginTop: 18 }} disabled={busy || !f.title || !f.message}>{busy ? 'Sending…' : 'Send push'}</Button>
      </form>
    </Portal>
  );
}

export default function Customers() {
  const { customers } = useAdmin();
  const { query, navigate } = useRouter();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('');
  const [zone, setZone] = useState('');
  const [pet, setPet] = useState('');
  const [selId, setSelId] = useState(query.get('id'));
  const [campaign, setCampaign] = useState(false);

  const TABS = [
    ['all', 'All', () => true], ['subs', 'Subscribers', (c) => c.subscriber], ['risk', 'At risk', (c) => c.atRisk], ['new', 'New this week', (c) => c.isNew], ['vip', 'VIP', (c) => c.tier === 'Platinum'],
  ];
  const filtered = useMemo(() => customers.filter((c) => {
    if (q && !`${c.name} ${c.phone} ${c.email} ${c.id}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (tier && c.tier !== tier) return false;
    if (zone && c.area !== zone) return false;
    if (pet && !c.pets.some((p) => p.toLowerCase().includes(pet))) return false;
    return true;
  }), [customers, q, tier, zone, pet]);
  const list = filtered.filter(TABS.find((t) => t[0] === tab)[2]);
  const sel = customers.find((c) => c.id === selId) || list[0];

  const repeat = customers.length ? Math.round((customers.filter((c) => c.orders > 1).length / Math.max(1, customers.filter((c) => c.orders > 0).length)) * 100) : 0;
  const zones = [...new Set(customers.map((c) => c.area).filter(Boolean))].sort();
  const segments = [
    ['Subscribers', customers.filter((c) => c.subscriber).length, 'subs'],
    [`No order in ${ADMIN_CONFIG.atRiskDays} days`, customers.filter((c) => c.atRisk).length, 'risk'],
    ['Multi-pet households', customers.filter((c) => c.pets.length > 1).length, null],
    ['Signed up, never ordered', customers.filter((c) => !c.orders).length, null],
  ];

  return (
    <>
      <PageHead eyebrow="Pet parents & pets" title="Customers">
        <Button variant="outline" icon="download" onClick={() => downloadCsv('customers.csv', [['Name', 'Email', 'Phone', 'Area', 'Pets', 'Orders', 'Lifetime BDT', 'Tier'], ...list.map((c) => [c.name, c.email, c.phone, c.area, c.pets.join('; '), c.orders, c.lifetime, c.tier])])}>Export</Button>
        <Button variant="dark" icon="arrowRight" onClick={() => setCampaign(true)}>Send campaign</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Customers" value={customers.length.toLocaleString('en-US')} icon="user" delta={`+${customers.filter((c) => c.isNew).length}`} note="this week" />
        <Stat label="Repeat rate" value={`${repeat}%`} icon="trend" note="of buyers ordered twice+" />
        <Stat label="Subscribers" value={customers.filter((c) => c.subscriber).length} icon="heart" note="on auto-refill" />
        <Stat label="Churn risk" value={customers.filter((c) => c.atRisk).length} icon="bell" deltaTone="red" note={`no order in ${ADMIN_CONFIG.atRiskDays} days`} />
      </div>

      <div className="filter-row" style={{ marginTop: 16 }}>
        <div className="searchbar"><Icon name="filter" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, email or phone" aria-label="Filter customers" /></div>
        <select className="filter-select" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier"><option value="">Tier</option><option>Platinum</option><option>Gold</option><option>Member</option></select>
        <select className="filter-select" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Zone"><option value="">Zone</option>{zones.map((z) => <option key={z}>{z}</option>)}</select>
        <select className="filter-select" value={pet} onChange={(e) => setPet(e.target.value)} aria-label="Pet type"><option value="">Pet type</option><option value="retriever">Retrievers</option><option value="persian">Persian cats</option><option value="beagle">Beagles</option><option value="husky">Huskies</option></select>
      </div>

      <div className="adm-grid-side wide">
        <div className="stack gap-16">
          <div className="card flush">
            <div className="card-tabs"><Tabs items={TABS.map(([v, l, fn]) => ({ value: v, label: l, count: filtered.filter(fn).length }))} value={tab} onChange={setTab} /></div>
            {list.length === 0 ? <Empty icon="user" title="No customers match" /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Customer</th><th>Pet</th><th>Orders</th><th>Lifetime</th><th>Tier</th></tr></thead>
                  <tbody>
                    {list.map((c) => (
                      <tr key={c.id} className={cx('clickable', sel?.id === c.id && 'selected')} onClick={() => setSelId(c.id)}>
                        <td><div className="row gap-10"><Avatar name={c.name} src={c.photo} tone="teal" /><div><div className="cell-title">{c.name}</div><div className="cell-sub">{[c.area, c.city].filter(Boolean).join(' · ')}</div></div></div></td>
                        <td>{c.pets[0] ? <span className="row gap-6" style={{ fontSize: 13 }}><Icon name="paw" size={13} className="teal" />{c.pets[0]}{c.pets.length > 1 ? ` +${c.pets.length - 1}` : ''}</span> : <span className="subtle">—</span>}</td>
                        <td>{c.orders}</td>
                        <td><b>{money(c.lifetime)}</b></td>
                        <td><Pill tone={TIER_TONE[c.tier]} sm>{c.tier}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="h-card">Segments</h2>
            <div className="sub" style={{ marginBottom: 8 }}>Updated live</div>
            <div className="list">
              {segments.map(([l, n, t]) => (
                <button key={l} className="list-row between" style={{ width: '100%', fontSize: 14 }} onClick={() => t && setTab(t)} disabled={!t}><span>{l}</span><span className="muted">{n}</span></button>
              ))}
            </div>
          </div>
        </div>

        {sel && (
          <div className="card" style={{ position: 'sticky', top: 84 }}>
            <div className="row gap-12">
              <Avatar name={sel.name} src={sel.photo} tone="teal" size="xl" />
              <div>
                <h2 className="serif" style={{ fontSize: 22 }}>{sel.name}</h2>
                <div className="sub" style={{ fontSize: 12 }}>{sel.since ? `Customer since ${sel.since}` : sel.createdAt ? `Joined ${shortDate(sel.createdAt)}` : 'Customer'}</div>
                <Pill tone={TIER_TONE[sel.tier]} sm style={{ marginTop: 6 }}>{sel.tier}</Pill>
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
              {[['Orders', sel.orders], ['Lifetime', money(sel.lifetime, { compact: true })], ['Avg. basket', money(sel.avgBasket || (sel.orders ? sel.lifetime / sel.orders : 0), { compact: true })]].map(([k, v]) => (
                <div key={k} className="mini-stat" style={{ textAlign: 'center' }}><div className="v" style={{ marginTop: 0 }}>{v}</div><div className="sub" style={{ fontSize: 11 }}>{k}</div></div>
              ))}
            </div>
            <div className="stack gap-8" style={{ marginTop: 16, fontSize: 14 }}>
              {sel.phone && <span className="row gap-10"><Icon name="phone" size={15} className="muted" /> {sel.phone}</span>}
              {sel.email && <span className="row gap-10"><Icon name="message" size={15} className="muted" /> {sel.email}</span>}
              {(sel.address || sel.area) && <span className="row gap-10"><Icon name="pin" size={15} className="muted" /> {sel.address || `${sel.area}, ${sel.city}`}</span>}
              {sel.pets.map((p) => <span key={p} className="row gap-10"><Icon name="paw" size={15} className="muted" /> {p}</span>)}
            </div>
            {sel.subscription && (
              <>
                <hr className="divider" style={{ margin: '16px 0' }} />
                <b style={{ fontSize: 13 }}>Subscriptions</b>
                <div className="coupon-applied" style={{ marginTop: 8 }}><span className="grow">{sel.subscription.name} · every {sel.subscription.every} d</span><span>Next {sel.subscription.next}</span></div>
              </>
            )}
            <div className="row gap-8" style={{ marginTop: 18 }}>
              <Button variant="dark" icon="message" className="grow" to={sel.email ? `mailto:${sel.email}` : `tel:${sel.phone}`}>Message</Button>
              <Button variant="outline" onClick={() => navigate(`/admin/orders?q=${encodeURIComponent(sel.name)}`)}>View orders</Button>
            </div>
          </div>
        )}
      </div>
      {campaign && <Campaign count={list.length} onClose={() => setCampaign(false)} />}
    </>
  );
}
