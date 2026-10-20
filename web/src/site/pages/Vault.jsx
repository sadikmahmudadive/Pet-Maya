import { useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMyRecords, useMyEvents } from '../../data/hooks.js';
import { savePet } from '../../data/actions.js';
import { BD_DISTRICTS, DHAKA_AREAS } from '../../data/content.js';
import { Icon, Button, Pill, Avatar, Field, Empty, Tabs, Portal, Ph } from '../../ui/index.jsx';
import { money, cx, toMillis, shortDate, timeOfDay } from '../../lib/format.js';

const dAt = (days, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d.getTime(); };
const SAMPLE_RECORDS = [
  { id: 'r1', kind: 'visit', date: dAt(3, 10, 30), title: 'Wellness check & stool test', serviceType: 'Consultation', doctor: 'Dr. Tariq Rahman', status: 'Scheduled', note: 'Routine tummy check after last month’s upset; bring a fresh stool sample. Continue daily probiotic.' },
  { id: 'r2', kind: 'lab', date: dAt(-20, 14, 15), title: 'Blood test (14 values)', serviceType: 'Lab', doctor: 'Pet Maya lab', note: 'Kidney, liver and blood sugar all within normal range.', values: [['ALT (liver)', '42', 'Normal'], ['Creatinine', '1.1', 'Normal'], ['Glucose', '92 mg/dL', 'Normal'], ['Protein', '6.4 g/dL', 'Normal']] },
  { id: 'r3', kind: 'order', date: dAt(-28, 11, 10), title: 'Monthly preventive delivered', serviceType: 'Pharmacy', doctor: 'Approved by Dr. Vance', note: 'NexGard Spectra · Synoquin EFA · probiotic.' },
  { id: 'r4', kind: 'surgery', date: dAt(-80, 9, 0), title: 'Dental scale & polish', serviceType: 'Dental', doctor: 'Dr. Tariq Rahman', note: 'Full scale and polish under anaesthetic. No tooth loss. Maintain with daily enzymatic dental gel.' },
];

const KIND_ICON = { visit: 'calendar', lab: 'flask', order: 'bag', surgery: 'smile', vaccine: 'shield', Consultation: 'calendar' };
const KIND_TONE = { visit: 'teal', lab: 'teal', order: 'yellow', surgery: 'teal', vaccine: 'teal' };

const TABS = [
  { value: 'records', label: 'Health records' },
  { value: 'orders', label: 'Orders & refills' },
  { value: 'visits', label: 'Consultations' },
  { value: 'account', label: 'Account & addresses' },
];

function matchRecordProducts(rec, products = [], pet = null) {
  const text = `${rec.title || ''} ${rec.note || ''} ${rec.serviceType || ''}`.toLowerCase();
  if (!text.trim() || !products.length) return [];
  const sp = pet ? (String(pet.species || 'dog').toLowerCase().includes('cat') ? 'cat' : 'dog') : null;
  const matched = [];
  for (const p of products) {
    if (p.showOnStorefront === false || p.inStock === false) continue;
    const pName = String(p.name || '').toLowerCase();
    const firstWord = pName.split(/\s+/)[0];
    const directHit = (pName && text.includes(pName)) || (firstWord && firstWord.length >= 5 && text.includes(firstWord));
    const keywordHit =
      (text.includes('probiotic') && (pName.includes('probiotic') || pName.includes('fortiflora'))) ||
      (text.includes('dental') && (p.category === 'grooming' || pName.includes('dental') || pName.includes('orozym'))) ||
      (text.includes('preventive') && p.category === 'preventives' && (!sp || p.pet === sp || p.pet === 'both')) ||
      (text.includes('joint') && p.category === 'joint');
    if (directHit || keywordHit) {
      matched.push(p);
    }
    if (matched.length >= 3) break;
  }
  return matched;
}

function AddPet({ onClose }) {
  const { user, toast } = useStore();
  const [f, setF] = useState({ name: '', species: 'Dog', breed: '', age: '', weight: '', gender: 'Male' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await savePet(user, f);
    setBusy(false);
    if (res.ok) { toast(`${f.name} added`); onClose(); }
    else if (res.reason === 'signin') toast('Sign in to add a pet', { tone: 'error' });
    else toast('Couldn’t save — please try again', { tone: 'error' });
  };
  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={save} role="dialog" aria-modal="true" aria-label="Add a pet">
        <div className="row between"><h2 className="serif" style={{ fontSize: 26 }}>Add a pet</h2><button type="button" className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button></div>
        <div className="fields" style={{ marginTop: 20 }}>
          <Field className="full" label="Name" required value={f.name} onChange={set('name')} />
          <Field label="Species"><select className="select" value={f.species} onChange={set('species')}><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option></select></Field>
          <Field label="Breed" value={f.breed} onChange={set('breed')} />
          <Field label="Age" value={f.age} onChange={set('age')} placeholder="e.g. 3 yrs" />
          <Field label="Weight" value={f.weight} onChange={set('weight')} placeholder="e.g. 12.5 kg" />
        </div>
        <Button type="submit" variant="dark" size="lg" block style={{ marginTop: 20 }} disabled={busy || !f.name}>{busy ? 'Saving…' : 'Save pet'}</Button>
      </form>
    </Portal>
  );
}

export default function Vault() {
  const { user, pets, activePet, setPetId, myOrders, localOrders, vets, products, addToCart, toast } = useStore();
  const { logout, updateUserProfile } = useAuth() || {};
  const real = user && !String(user.uid).startsWith('demo_guest');
  const records = useMyRecords(user);
  const events = useMyEvents(user);
  const [tab, setTab] = useState('records');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('all');
  const pet = activePet;

  const timeline = useMemo(() => {
    if (!real) return SAMPLE_RECORDS;
    const recs = (records.items || []).filter((r) => !pet || !r.petName || r.petName === pet.name || r.petId === pet.id).map((r) => ({
      id: r.id, kind: /lab|blood/i.test(r.serviceType) ? 'lab' : /vacc/i.test(r.serviceType) ? 'vaccine' : /dental|surg/i.test(r.serviceType) ? 'surgery' : 'visit',
      date: toMillis(r.date || r.createdAt), title: r.serviceType || 'Visit', serviceType: r.serviceType, doctor: r.doctor || r.providerName || '',
      note: [r.diagnosis, r.prescription && r.prescription !== 'None' ? `Rx: ${r.prescription}` : ''].filter(Boolean).join(' · '),
    }));
    const evs = (events.items || []).filter((e) => !pet || e.pet === pet.name).map((e) => ({
      id: e.id, kind: 'visit', date: e.start, title: e.reason, serviceType: e.mode, doctor: e.doctor, status: e.status, note: '',
    }));
    return [...recs, ...evs].sort((a, b) => b.date - a.date);
  }, [real, records.items, events.items, pet]);

  const shown = filter === 'all' ? timeline : timeline.filter((t) => t.kind === filter);
  const upcoming = timeline.filter((t) => t.date > Date.now()).sort((a, b) => a.date - b.date)[0];
  const lastVisit = timeline.find((t) => t.date <= Date.now());
  const orders = useMemo(() => {
    const map = new Map();
    (myOrders?.items || []).forEach((o) => map.set(o.id || o.orderId, o));
    (localOrders || []).forEach((o) => {
      const k = o.id || o.orderId;
      if (!map.has(k)) map.set(k, o);
    });
    return Array.from(map.values()).sort((a, b) => toMillis(b.placedAt) - toMillis(a.placedAt));
  }, [myOrders?.items, localOrders]);

  const refillItems = useMemo(() => {
    const seen = new Map();
    for (const o of orders) {
      if (o.status === 'Cancelled') continue;
      const placedMs = toMillis(o.placedAt) || Date.now();
      for (const item of (o.items || [])) {
        const key = item.id || item.name;
        if (!key || seen.has(key)) continue;
        const catalogProduct = (products.items || []).find((p) => p.id === item.id || p.name === item.name);
        if (!catalogProduct && !item.price) continue;
        const daysAgo = Math.max(0, Math.floor((Date.now() - placedMs) / 864e5));
        const cycleDays = 30;
        const dueInDays = cycleDays - daysAgo;
        seen.set(key, {
          product: catalogProduct || item,
          variant: item.variant || catalogProduct?.variants?.[0] || '',
          lastOrderedAt: placedMs,
          daysAgo,
          dueInDays,
        });
      }
    }
    if (seen.size > 0) return Array.from(seen.values()).slice(0, 4);
    // Fallback to pet-matched monthly preventives/consumables if no order history yet
    const sp = pet ? (String(pet.species || 'dog').toLowerCase().includes('cat') ? 'cat' : 'dog') : 'dog';
    return (products.items || [])
      .filter((p) => p.showOnStorefront !== false && p.inStock !== false && p.subscribe && (p.pet === sp || p.pet === 'both'))
      .slice(0, 3)
      .map((p, idx) => ({
        product: p,
        variant: p.variants?.[0] || '',
        lastOrderedAt: dAt(-26 - idx * 2, 11, 0),
        daysAgo: 26 + idx * 2,
        dueInDays: Math.max(0, 30 - (26 + idx * 2)),
      }));
  }, [orders, products.items, pet]);

  const emergency = vets.items.find((v) => v.emergency);

  const reorderOrder = (order) => {
    const lines = order.items || [];
    let count = 0;
    lines.forEach((line) => {
      const catProd = (products.items || []).find((p) => p.id === line.id || p.name === line.name) || line;
      if (catProd) {
        addToCart(catProd, line.qty || 1, line.variant);
        count += line.qty || 1;
      }
    });
    if (count > 0) toast(`Added ${count} item${count > 1 ? 's' : ''} from ${order.id || order.orderId} to your bag`);
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      {!real && (
        <div className="card row between wrap gap-12" style={{ background: 'var(--yellow-tint)', borderColor: 'transparent', marginBottom: 16 }}>
          <span style={{ fontSize: 14 }}><b>This is a sample vault.</b> Sign in to see your own pets, records and orders.</span>
          <Button variant="dark" size="sm" to="/signin?next=/vault">Sign in</Button>
        </div>
      )}
      <div className="row between wrap gap-8">
        <span className="eyebrow muted"><span className="dot" /> Account & health records</span>
        <span className="eyebrow">Synced with the Pet Maya app</span>
      </div>

      <div className="vault-top" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="row gap-12">
            <Avatar name={user?.name || 'Guest'} src={user?.photoUrl} size="lg" />
            <div className="grow"><h2 className="serif" style={{ fontSize: 24 }}>{user?.name || 'Guest'}</h2><div className="teal" style={{ fontSize: 13 }}>{user?.points ? `${user.points} care points` : 'Pet parent'}</div></div>
          </div>
          <div className="stack gap-6 sub" style={{ marginTop: 14, fontSize: 13 }}>
            {user?.email && <span className="row gap-8"><Icon name="mail" size={14} /> {user.email}</span>}
            {user?.address && <span className="row gap-8"><Icon name="pin" size={14} /> {user.address}</span>}
          </div>
          <div className="panel row between" style={{ marginTop: 14, padding: '10px 14px' }}>
            <span className="mono" style={{ fontSize: 11 }}>● {(pets.items || []).length} PETS</span>
            <button className="link-plain" style={{ fontSize: 12 }} onClick={() => setTab('account')}>Edit profile & addresses →</button>
          </div>
        </div>
        {(pets.items || []).map((p) => (
          <button key={p.id} className={cx('card pet-pick', p.id === pet?.id && 'on')} onClick={() => setPetId(p.id)}>
            <div className="row gap-10">
              <Avatar name={p.name} src={p.photo} size="lg" />
              <div style={{ textAlign: 'left' }}><div className="row gap-6"><span className="serif" style={{ fontSize: 24 }}>{p.name}</span><Pill mono sm>{p.species}</Pill></div><div className="sub" style={{ fontSize: 12 }}>{[p.breed, p.age, p.neutered && 'Neutered'].filter(Boolean).join(' · ')}</div></div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 14 }}>
              <div className="mini-stat" style={{ padding: '8px 10px' }}><div className="k">Weight</div><div className="v" style={{ fontSize: 15 }}>{p.weight || '—'}</div></div>
              <div className="mini-stat" style={{ padding: '8px 10px' }}><div className="k">Gender</div><div className="v" style={{ fontSize: 15 }}>{p.gender || '—'}</div></div>
              <div className="mini-stat" style={{ padding: '8px 10px' }}><div className="k">Chip</div><div className="v mono" style={{ fontSize: 12 }}>{p.microchip ? `…${p.microchip.slice(-4)}` : '—'}</div></div>
            </div>
            {p.id === pet?.id && <div className="teal" style={{ fontSize: 12, marginTop: 10, textAlign: 'left' }}>Viewing records ✓</div>}
          </button>
        ))}
        {real && (
          <button className="card pet-pick" style={{ display: 'grid', placeItems: 'center', borderStyle: 'dashed', color: 'var(--muted)' }} onClick={() => setAdding(true)}>
            <span className="stack gap-6" style={{ alignItems: 'center' }}><Icon name="plus" size={22} /><b style={{ fontSize: 14 }}>Add a pet</b></span>
          </button>
        )}
      </div>

      <Tabs className="vault-tabs" items={TABS} value={tab} onChange={setTab} />

      {tab === 'records' && (
        <div className="split" style={{ marginTop: 18 }}>
          <div className="stack gap-16">
            <div className="card" style={{ padding: 28 }}>
              <div className="row gap-8"><Pill mono sm>{pet ? `Patient ${pet.microchip || pet.id.slice(0, 8).toUpperCase()}` : 'No pet selected'}</Pill></div>
              <h1 className="display-2" style={{ marginTop: 14, maxWidth: '16ch' }}>{pet ? `${pet.name}’s health records` : 'Add a pet to start their records'}</h1>
              <Button variant="dark" size="sm" icon="file" style={{ marginTop: 16 }} onClick={() => window.print()}>Download PDF summary</Button>
              <div className="biom-grid" style={{ marginTop: 20 }}>
                <div className="mini-stat"><div className="k">Weight</div><div className="v">{pet?.weight || '—'}</div><div className="s">Latest</div></div>
                <div className="mini-stat"><div className="k">Age</div><div className="v">{pet?.age || '—'}</div><div className="s">{pet?.breed || ''}</div></div>
                <div className="mini-stat"><div className="k">Vaccines</div><div className="v">{pet?.nextVaccine ? 'Due soon' : 'Up to date'}</div><div className="s">{pet?.nextVaccine || 'No reminders'}</div></div>
                <div className="mini-stat"><div className="k">Next visit</div><div className="v">{upcoming ? `${Math.max(0, Math.ceil((upcoming.date - Date.now()) / 864e5))} days` : '—'}</div><div className="s">{upcoming ? upcoming.title : lastVisit ? `Last: ${shortDate(lastVisit.date)}` : 'Nothing booked'}</div></div>
              </div>
            </div>

            <div className="row between wrap gap-8">
              <h2 className="display-3">Timeline</h2>
              <select className="select" style={{ width: 'auto', height: 38, borderRadius: 999, background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line-2)' }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter records">
                <option value="all">All records</option><option value="visit">Visits</option><option value="lab">Lab tests</option><option value="vaccine">Vaccines</option><option value="surgery">Procedures</option><option value="order">Pharmacy</option>
              </select>
            </div>
            {shown.length === 0 ? (
              <div className="card"><Empty icon="file" title="No records yet">Visits, lab results and vaccines added by your vet will show up here.</Empty></div>
            ) : shown.map((r) => {
              const rxProducts = matchRecordProducts(r, products.items || [], pet);
              return (
                <div key={r.id} className="card ledger-card">
                  <span className={cx('well', KIND_TONE[r.kind])}><Icon name={KIND_ICON[r.kind] || 'file'} /></span>
                  <div>
                    <div className="row gap-8 wrap"><span className="mono subtle" style={{ fontSize: 11 }}>{shortDate(r.date).toUpperCase()} · {timeOfDay(r.date)}</span><Pill tone={r.date > Date.now() ? 'teal' : ''} mono sm>{r.status || r.serviceType}</Pill></div>
                    <div className="row between wrap gap-8" style={{ marginTop: 8 }}>
                      <h3 className="serif" style={{ fontSize: 21 }}>{r.title}</h3>
                      {r.doctor && <span className="pill outline">{r.doctor}</span>}
                    </div>
                    {r.note && <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{r.note}</p>}
                    {r.values && (
                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(110px, 100%), 1fr))', gap: 8, marginTop: 12 }}>
                        {r.values.map(([k, v, s]) => <div key={k} className="mini-stat" style={{ padding: '8px 12px' }}><div className="k">{k}</div><div className="v" style={{ fontSize: 16 }}>{v}</div><div className="s">{s}</div></div>)}
                      </div>
                    )}
                    {rxProducts.length > 0 && (
                      <div className="panel stack gap-8" style={{ marginTop: 12, padding: '10px 14px' }}>
                        <div className="row between wrap gap-6">
                          <span className="mono teal" style={{ fontSize: 11 }}>VET-LINKED PHARMACY ITEMS</span>
                          <span className="sub" style={{ fontSize: 11 }}>1-tap prescription & care refill</span>
                        </div>
                        <div className="row gap-8 wrap">
                          {rxProducts.map((prod) => (
                            <div key={prod.id} className="row gap-8" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '6px 10px' }}>
                              <Link to={`/product/${prod.id}`} style={{ fontWeight: 600, fontSize: 13 }}>{prod.name}</Link>
                              <span className="sub" style={{ fontSize: 12 }}>{money(prod.price)}</span>
                              <button
                                type="button"
                                className="btn btn-teal btn-sm"
                                style={{ height: 26, padding: '0 10px', fontSize: 12 }}
                                onClick={() => addToCart(prod, 1, prod.variants?.[0])}
                              >
                                <Icon name="plus" size={12} /> Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.date > Date.now() && (
                      <div className="panel row between wrap gap-8" style={{ marginTop: 12, padding: '8px 8px 8px 14px' }}>
                        <span className="sub row gap-6"><Icon name="calendar" size={14} /> Arrive 10 minutes early for check-in</span>
                        <div className="row gap-6 wrap"><Button variant="outline" size="sm" to="/specialists">Reschedule</Button><Button variant="teal" size="sm" to="/triage">Add symptoms</Button></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="stack gap-12">
            <div className="card">
              <div className="eyebrow muted" style={{ fontSize: 10 }}>Coming up</div>
              <h3 className="serif" style={{ fontSize: 22, margin: '8px 0 12px' }}>{upcoming ? upcoming.title : 'Nothing booked'}</h3>
              {upcoming ? <div className="sub">{shortDate(upcoming.date)} · {timeOfDay(upcoming.date)}{upcoming.doctor ? ` · ${upcoming.doctor}` : ''}</div> : <p className="sub">Book a check-up with a vet.</p>}
              <Button variant="soft" block icon="calendar" style={{ marginTop: 14 }} to="/specialists">{upcoming ? 'Manage booking' : 'Book a vet'}</Button>
            </div>
            <div className="card">
              <div className="row between"><h3 className="serif" style={{ fontSize: 22 }}>Maya Halo collar</h3><Pill tone="teal" mono sm>GPS</Pill></div>
              <p className="sub" style={{ margin: '8px 0 14px' }}>See {pet?.name || 'your pet'} live on the radar, set safe zones and get escape alerts.</p>
              <Button variant="soft" block icon="target" to="/gps">Open GPS radar</Button>
            </div>
            <div className="dark-card">
              <div className="row gap-6" style={{ color: '#F19A90' }}><span className="dot red" /><span className="eyebrow" style={{ color: '#F19A90' }}>Emergency</span></div>
              <h3 className="serif" style={{ fontSize: 24, marginTop: 10 }}>Something urgent?</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>Book an urgent visit — {pet?.name || 'your pet'}’s records are shared with the vet automatically.</p>
              <Button variant="teal" block icon="calendar" style={{ marginTop: 16 }} to="/specialists">{emergency ? `Urgent visit · ${emergency.name}` : 'Book an urgent visit'}</Button>
            </div>
            <div className="row gap-8 sub" style={{ fontSize: 12, padding: '0 6px' }}><Icon name="lock" size={14} /> Only you and the vets you book can see these records.</div>
          </aside>
        </div>
      )}

      {tab === 'orders' && (
        <div className="stack gap-16" style={{ marginTop: 18 }}>
          {refillItems.length > 0 && (
            <div className="card">
              <div className="row between wrap gap-8" style={{ marginBottom: 14 }}>
                <div>
                  <span className="eyebrow"><span className="dot" /> 1-Tap Refill Reminders</span>
                  <h2 className="serif" style={{ fontSize: 24, marginTop: 4 }}>Monthly essentials for {pet?.name || 'your pet'}</h2>
                </div>
                <Pill tone="teal" sm>Save 5% on monthly refills</Pill>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {refillItems.map(({ product: p, variant, daysAgo, dueInDays }) => (
                  <div key={p.id || p.name} className="panel row gap-12" style={{ padding: 12, background: 'var(--surface)' }}>
                    <Ph src={p.image} label=" " style={{ width: 54, height: 54, minHeight: 0, borderRadius: 12 }} />
                    <div className="grow">
                      <Link to={`/product/${p.id}`} style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</Link>
                      <div className="sub" style={{ fontSize: 12 }}>
                        {variant ? `${variant} · ` : ''}{money(p.price)}
                      </div>
                      <div className="row gap-6" style={{ marginTop: 4 }}>
                        <Pill tone={dueInDays <= 5 ? 'yellow' : 'teal'} sm>
                          {dueInDays <= 0 ? 'Refill due now' : `Due in ${dueInDays}d (ordered ${daysAgo}d ago)`}
                        </Pill>
                      </div>
                    </div>
                    <Button
                      variant="dark"
                      size="sm"
                      icon="repeat"
                      onClick={() => addToCart(p, 1, variant, { refill: true })}
                    >
                      Refill
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card flush">
            {orders.length === 0 ? <Empty icon="bag" title="No orders yet"><Link to="/shop" className="link">Visit the shop</Link></Empty> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{orders.map((o) => {
                    const oid = o.id || o.orderId;
                    return (
                      <tr key={oid}>
                        <td><Link to={`/account/orders/${oid}`} className="mono link-plain">{oid}</Link></td>
                        <td>{shortDate(o.placedAt)}</td>
                        <td>{(o.items || []).length}</td>
                        <td><span className="sub" style={{ fontSize: 12 }}>{o.payment || 'Cash on delivery'}</span></td>
                        <td><b>{money(o.total)}</b></td>
                        <td><Pill tone={o.status === 'Cancelled' || o.status === 'Return' ? 'yellow' : 'teal'}>{o.status}</Pill></td>
                        <td>
                          <div className="row gap-6">
                            <Button variant="outline" size="sm" to={`/account/orders/${oid}`}>Track</Button>
                            <Button variant="soft" size="sm" icon="repeat" onClick={() => reorderOrder(o)}>Reorder</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'visits' && (
        <div className="stack gap-10" style={{ marginTop: 18 }}>
          {timeline.filter((t) => t.kind === 'visit').length === 0
            ? <div className="card"><Empty icon="stethoscope" title="No consultations yet"><Link to="/specialists" className="link">Book a vet</Link></Empty></div>
            : timeline.filter((t) => t.kind === 'visit').map((t) => (
              <div key={t.id} className="card row gap-12"><span className="well teal"><Icon name="calendar" /></span><div className="grow"><b>{t.title}</b><div className="sub">{shortDate(t.date)} · {timeOfDay(t.date)}{t.doctor ? ` · ${t.doctor}` : ''}</div></div><Pill tone={t.date > Date.now() ? 'teal' : ''}>{t.status || (t.date > Date.now() ? 'Upcoming' : 'Done')}</Pill></div>
            ))}
        </div>
      )}

      {tab === 'account' && <Account user={user} real={real} save={updateUserProfile} logout={logout} />}

      {adding && <AddPet onClose={() => setAdding(false)} />}
    </div>
  );
}

function Account({ user, real, save, logout }) {
  const { toast, savedAddresses, saveAddress, removeAddress, setDefaultAddress } = useStore();
  const [f, setF] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [addingAddr, setAddingAddr] = useState(false);
  const [af, setAf] = useState({
    label: 'Home',
    name: user?.name || '',
    phone: user?.phone || '',
    district: 'Dhaka',
    area: '',
    address: '',
    note: '',
  });
  const setA = (k) => (e) => setAf({ ...af, [k]: e.target.value });

  const submitAddr = (e) => {
    e.preventDefault();
    if (!af.address.trim() || !af.phone.trim()) {
      toast('Please enter phone and street address', { tone: 'error' });
      return;
    }
    saveAddress({
      ...af,
      isDefault: !(savedAddresses && savedAddresses.length > 0),
    });
    setAddingAddr(false);
    setAf({ label: 'Home', name: user?.name || '', phone: user?.phone || '', district: 'Dhaka', area: '', address: '', note: '' });
  };

  return (
    <div className="split" style={{ marginTop: 18 }}>
      <div>
        {!real ? (
          <div className="card">
            <Empty icon="user" title="Sign in to sync your profile across devices">
              <Link to="/signin" className="link">Sign in</Link>
            </Empty>
          </div>
        ) : (
          <form className="card" onSubmit={async (e) => { e.preventDefault(); try { await save?.(f); toast('Profile saved'); } catch { toast('Couldn’t save', { tone: 'error' }); } }}>
            <h3 className="serif" style={{ fontSize: 22, marginBottom: 14 }}>Profile details</h3>
            <div className="fields">
              <Field className="full" label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <Field label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <Field label="Email" value={user.email || ''} disabled />
              <Field className="full" label="Primary address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            </div>
            <div className="row gap-8" style={{ marginTop: 20 }}>
              <Button type="submit" variant="dark">Save changes</Button>
              <Button variant="outline" icon="logout" onClick={() => logout?.()}>Sign out</Button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <div className="row between wrap gap-8" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="serif" style={{ fontSize: 22 }}>Saved delivery addresses</h3>
            <div className="sub" style={{ fontSize: 12 }}>Used for 1-click autofill at checkout</div>
          </div>
          <Button variant="outline" size="sm" icon="plus" onClick={() => setAddingAddr((v) => !v)}>
            {addingAddr ? 'Cancel' : 'Add address'}
          </Button>
        </div>

        {addingAddr && (
          <form className="panel stack gap-12" onSubmit={submitAddr} style={{ marginBottom: 16 }}>
            <div className="row gap-6">
              {['Home', 'Office', 'Clinic', 'Other'].map((lbl) => (
                <button
                  type="button"
                  key={lbl}
                  className={cx('pill', af.label === lbl ? 'solid-teal' : 'outline')}
                  style={{ height: 28, padding: '0 12px', fontSize: 12, cursor: 'pointer' }}
                  onClick={() => setAf({ ...af, label: lbl })}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="fields">
              <Field label="Recipient name" required value={af.name} onChange={setA('name')} />
              <Field label="Mobile number" required value={af.phone} onChange={setA('phone')} placeholder="017XX-XXXXXX" />
              <Field label="District">
                <select className="select" value={af.district} onChange={setA('district')}>
                  {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label={af.district === 'Dhaka' ? 'Area / Thana' : 'Upazila / Area'} required>
                <input
                  className="input"
                  list={af.district === 'Dhaka' ? 'vault-dhaka-areas' : undefined}
                  value={af.area}
                  onChange={setA('area')}
                  placeholder={af.district === 'Dhaka' ? 'e.g. Gulshan 2, Banani' : 'e.g. Agrabad'}
                  required
                />
                {af.district === 'Dhaka' && (
                  <datalist id="vault-dhaka-areas">
                    {DHAKA_AREAS.map((a) => <option key={a} value={a} />)}
                  </datalist>
                )}
              </Field>
              <Field className="full" label="Street address" required value={af.address} onChange={setA('address')} placeholder="House #, Road #, Flat/Floor" />
            </div>
            <Button type="submit" variant="dark" size="sm">Save address</Button>
          </form>
        )}

        {(savedAddresses || []).length === 0 ? (
          <Empty icon="pin" title="No saved addresses yet">Save your home or office address for faster checkout.</Empty>
        ) : (
          <div className="stack gap-10">
            {savedAddresses.map((a) => (
              <div key={a.id} className="panel row between wrap gap-10" style={{ background: 'var(--surface)' }}>
                <div>
                  <div className="row gap-6">
                    <b>{a.label || 'Address'}</b>
                    {a.isDefault && <Pill tone="teal" sm>Default</Pill>}
                    <Pill sm>{a.district || 'Dhaka'}</Pill>
                  </div>
                  <div style={{ fontSize: 13.5, marginTop: 4 }}>{[a.address, a.area, a.district].filter(Boolean).join(', ')}</div>
                  <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>{[a.name, a.phone].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="row gap-6">
                  {!a.isDefault && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setDefaultAddress(a.id)}>Set default</button>
                  )}
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => removeAddress(a.id)} aria-label="Remove address">
                    <Icon name="x" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
