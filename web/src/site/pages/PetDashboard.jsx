import { useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useMyEvents } from '../../data/hooks.js';
import { useCollection, normOrder } from '../../data/firestore.js';
import { SAMPLES } from '../../data/hooks.js';
import { normDevice, SAMPLE_DEVICE, metersBetween } from './Gps.jsx';
import { Icon, Button, Pill, Avatar, Stat, Empty, Ph } from '../../ui/index.jsx';
import { money, cx, greeting, shortDate, timeOfDay, ago } from '../../lib/format.js';
import { Reveal } from '../../lib/motion.jsx';
import { useApp } from '../../context/AppContext.jsx';

const STATUS_STEP = { 'Rx review': 1, Packing: 2, 'In transit': 3, Delivered: 4 };
const STATUS_TONE = { 'Rx review': 'yellow', Packing: '', 'In transit': 'teal', Delivered: '', Return: 'red', Cancelled: 'red' };

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

const QUICK = [
  ['pulse', 'Check symptoms', 'AI triage in 2 minutes', '/triage', 'teal'],
  ['video', 'Talk to a vet', 'Video or clinic visit', '/specialists', 'teal'],
  ['target', 'GPS radar', 'Live location & safe zones', '/gps', ''],
  ['file', 'Health vault', 'Records & vaccines', '/vault', ''],
  ['bag', 'Care shop', 'Medicine, food & gear', '/shop', 'yellow'],
  ['users', 'Community', 'Pet parents near you', '/community', ''],
];

export default function PetDashboard() {
  const { user, pets, activePet, setPetId, myOrders, localOrders, addToCart, products, vets } = useStore();
  const { openModal } = useApp();
  const real = user && !String(user.uid).startsWith('demo_guest');
  const events = useMyEvents(user);
  const devices = useCollection('devices', { map: normDevice, sample: [normDevice(SAMPLE_DEVICE.id, SAMPLE_DEVICE)], sampleWhenEmpty: !real });
  const [done, setDone] = useState(() => read('pm_dash_done', []));
  const pet = activePet;

  const orders = useMemo(() => {
    if (!real) return SAMPLES.orders.filter((o) => ['PM-88902', 'PM-88899'].includes(o.id));
    const local = (localOrders || []).map((o) => normOrder(o.id || o.orderId, o));
    return [...myOrders.items, ...local].sort((a, b) => b.placedAt - a.placedAt);
  }, [real, myOrders.items, localOrders]);
  const active = orders.filter((o) => ['Rx review', 'Packing', 'In transit'].includes(o.status));

  const upcoming = useMemo(() => {
    const now = Date.now();
    if (!real) {
      const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(10, 30, 0, 0);
      return [{ id: 's1', pet: 'Milo', reason: 'Wellness check & stool test', doctor: 'Dr. Tariq Rahman', start: d.getTime(), mode: 'Video', status: 'Confirmed' }];
    }
    return (events.items || []).filter((e) => e.start >= now - 3600e3).sort((a, b) => a.start - b.start);
  }, [real, events.items]);
  const next = upcoming[0];

  const device = useMemo(() => {
    const list = devices.items || [];
    const mine = real ? list.filter((d) => (pets.items || []).some((p) => p.id === d.petId || p.name === d.petName)) : list;
    return mine.find((d) => !pet || d.petId === pet.id || d.petName === pet.name) || mine[0];
  }, [devices.items, pets.items, pet, real]);

  // Things to reorder: items from delivered orders, most recent first.
  const reorder = useMemo(() => {
    const seen = new Set(); const out = [];
    orders.filter((o) => o.status === 'Delivered' || !real).forEach((o) => o.items.forEach((i) => {
      if (seen.has(i.id) || !i.price) return;
      seen.add(i.id);
      out.push({ ...(products.items.find((p) => p.id === i.id) || i), lastAt: o.placedAt });
    }));
    return out.slice(0, 3);
  }, [orders, products.items, real]);

  const refillsDue = orders.flatMap((o) => o.items).filter((i) => /auto-refill/i.test(i.variant) || products.items.find((p) => p.id === i.id)?.subscribe).length;

  // Today's checklist, built from real data.
  const todo = [
    next && { id: `appt-${next.id}`, icon: 'calendar', text: `${next.mode === 'Video' ? 'Video consult' : 'Clinic visit'} with ${next.doctor || 'your vet'}`, sub: `${shortDate(next.start)} · ${timeOfDay(next.start)}`, to: '/vault' },
    pet?.nextVaccine && { id: `vac-${pet.id}`, icon: 'shield', text: `${pet.name}’s vaccine is due`, sub: pet.nextVaccine, to: '/specialists' },
    active.find((o) => o.status === 'Rx review') && { id: 'rx', icon: 'file', text: 'Prescription being checked', sub: 'We’ll message you once it’s approved', to: `/account/orders/${active.find((o) => o.status === 'Rx review').id}` },
    reorder[0] && { id: `re-${reorder[0].id}`, icon: 'refresh', text: `Running low on ${reorder[0].name}?`, sub: `Last ordered ${shortDate(reorder[0].lastAt)}`, action: () => addToCart(reorder[0]) },
    device && device.batteryLevel < 30 && { id: 'batt', icon: 'battery', text: `Charge ${device.petName || 'the'} collar`, sub: `${device.batteryLevel}% left`, to: '/gps' },
    { id: 'walk', icon: 'paw', text: `Daily walk for ${pet?.name || 'your pet'}`, sub: 'At least 30 minutes' },
  ].filter(Boolean);
  const toggle = (id) => setDone((d) => { const n = d.includes(id) ? d.filter((x) => x !== id) : [...d, id]; try { localStorage.setItem('pm_dash_done', JSON.stringify(n)); } catch { /* ignore */ } return n; });

  const firstName = (user?.name || '').split(' ')[0];
  const isAdmin = /^(admin|super ?admin|superadmin)$/i.test(String(user?.role || '').trim());
  const gps = device ? metersBetween(device.homeLat, device.homeLng, device.latitude, device.longitude) : null;
  const vet = vets.items.find((v) => !v.emergency) || vets.items[0];

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      {!real && (
        <div className="card row between wrap gap-12" style={{ background: 'var(--yellow-tint)', borderColor: 'transparent', marginBottom: 20 }}>
          <span style={{ fontSize: 14 }}><b>You’re viewing a sample dashboard.</b> Sign in to see your own pets, orders and appointments.</span>
          <Button variant="dark" size="sm" to="/signin?next=/dashboard">Sign in</Button>
        </div>
      )}

      <div className="row between wrap gap-16" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 className="display-2" style={{ marginTop: 10 }}>{greeting()}{firstName ? `, ${firstName}` : ''}.</h1>
          <p className="muted" style={{ marginTop: 6 }}>{pet ? `Here’s what’s happening with ${(pets.items || []).map((p) => p.name).join(' & ')}.` : 'Add your first pet to get started.'}</p>
        </div>
        <div className="row gap-8 wrap">
          {isAdmin && <Button variant="ghost" icon="grid" to="/admin">Admin console</Button>}
          <Button variant="outline" icon="phoneDevice" onClick={() => openModal && openModal('myDevices')}>My Devices</Button>
          <Button variant="outline" icon="bag" to="/shop">Shop</Button>
          <Button variant="teal" icon="video" to="/specialists">Book a vet</Button>
        </div>
      </div>

      {/* Pets */}
      <Reveal className="dash-pets" stagger style={{ marginTop: 22 }}>
        {(pets.items || []).map((p) => (
          <button key={p.id} className={cx('card dash-pet', p.id === pet?.id && 'on')} onClick={() => setPetId(p.id)} aria-pressed={p.id === pet?.id}>
            <Avatar name={p.name} src={p.photo} size="lg" />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div className="row gap-6"><span className="serif" style={{ fontSize: 22 }}>{p.name}</span><Pill mono sm>{p.species}</Pill></div>
              <div className="sub ellipsis" style={{ fontSize: 12 }}>{[p.breed, p.age, p.weight].filter(Boolean).join(' · ')}</div>
            </div>
          </button>
        ))}
        <Link to="/vault" className="card dash-pet add"><span className="well round"><Icon name="plus" /></span><b style={{ fontSize: 14 }}>Add a pet</b></Link>
      </Reveal>

      <div className="stat-grid" style={{ marginTop: 16 }}>
        <Stat label="Next vet visit" value={next ? `${Math.max(0, Math.ceil((next.start - Date.now()) / 864e5))} days` : '—'} icon="calendar" note={next ? `${shortDate(next.start)} · ${next.doctor || ''}` : 'Nothing booked'} />
        <Stat label="Active orders" value={active.length} icon="bag" note={active[0] ? `${active[0].id} · ${active[0].status}` : 'Nothing on the way'} />
        <Stat label="Refills" value={refillsDue} icon="refresh" note="auto-refill items" />
        <Stat label="Care points" value={user?.points ?? 0} icon="sparkles" note="earn on every order" />
      </div>

      <div className="split wide-right" style={{ marginTop: 16 }}>
        <div className="stack gap-16">
          <div className="card">
            <div className="card-head"><div><h2 className="h-card">Today for {pet?.name || 'your pets'}</h2><div className="sub">{todo.filter((t) => done.includes(t.id)).length} of {todo.length} done</div></div><div className="meter" style={{ width: 120, marginTop: 8 }}><span style={{ width: `${(todo.filter((t) => done.includes(t.id)).length / Math.max(1, todo.length)) * 100}%` }} /></div></div>
            <div className="list">
              {todo.map((t) => {
                const isDone = done.includes(t.id);
                return (
                  <div key={t.id} className="list-row" style={{ opacity: isDone ? 0.55 : 1 }}>
                    <input type="checkbox" className="check" checked={isDone} onChange={() => toggle(t.id)} aria-label={`Mark “${t.text}” done`} />
                    <span className="well sm teal"><Icon name={t.icon} size={15} /></span>
                    <div className="grow"><div style={{ fontWeight: 600, fontSize: 14, textDecoration: isDone ? 'line-through' : 'none' }}>{t.text}</div><div className="sub" style={{ fontSize: 12 }}>{t.sub}</div></div>
                    {t.to && <Link to={t.to} className="btn btn-ghost btn-sm btn-square" aria-label="Open"><Icon name="arrowRight" size={15} /></Link>}
                    {t.action && <Button variant="dark" size="sm" icon="plus" onClick={t.action}>Add</Button>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="h-card">Your orders</h2><div className="sub">{active.length ? `${active.length} on the way` : 'Nothing on the way right now'}</div></div><Link to="/account/orders" className="link-plain" style={{ fontSize: 13 }}>All orders →</Link></div>
            {orders.length === 0 ? <Empty icon="bag" title="No orders yet"><Link to="/shop" className="link">Visit the shop</Link></Empty> : (
              <div className="stack gap-10">
                {orders.slice(0, 3).map((o) => {
                  const step = STATUS_STEP[o.status] || 0;
                  return (
                    <Link key={o.id} to={`/account/orders/${o.id}`} className="panel stack gap-10">
                      <div className="row between gap-8">
                        <div><b className="mono" style={{ fontSize: 13 }}>{o.id}</b><span className="sub"> · {o.items.length} items · {money(o.total)}</span></div>
                        <Pill tone={STATUS_TONE[o.status]} sm>{o.status}</Pill>
                      </div>
                      {step > 0 && step < 4 && (
                        <div className="row gap-4">{[1, 2, 3, 4].map((s) => <span key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: s <= step ? 'var(--teal)' : 'var(--sunk-2)' }} />)}</div>
                      )}
                      <div className="sub" style={{ fontSize: 12 }}>{o.items.map((i) => i.name).slice(0, 2).join(', ')}{o.items.length > 2 ? ` +${o.items.length - 2} more` : ''} · {ago(o.placedAt)}</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="h-card">Appointments</h2><div className="sub">{upcoming.length ? `${upcoming.length} coming up` : 'Nothing booked'}</div></div><Link to="/specialists" className="link-plain" style={{ fontSize: 13 }}>Book →</Link></div>
            {upcoming.length === 0 ? (
              <div className="panel row gap-12">
                {vet && <Avatar name={vet.name.replace('Dr. ', '')} src={vet.photo} />}
                <div className="grow"><b style={{ fontSize: 14 }}>Due a check-up?</b><div className="sub" style={{ fontSize: 12 }}>{vet ? `${vet.name} · ${vet.availability}` : 'Vets available today'}</div></div>
                <Button variant="teal" size="sm" to="/specialists">Book</Button>
              </div>
            ) : (
              <div className="list">
                {upcoming.slice(0, 4).map((e) => (
                  <div key={e.id} className="list-row">
                    <div className="dash-date"><b>{new Date(e.start).getDate()}</b><small>{new Date(e.start).toLocaleDateString('en-GB', { month: 'short' })}</small></div>
                    <div className="grow"><b style={{ fontSize: 14 }}>{e.reason}</b><div className="sub" style={{ fontSize: 12 }}>{timeOfDay(e.start)} · {e.doctor || 'Vet to be assigned'} · {e.pet}</div></div>
                    <Pill tone={/pending/i.test(e.status) ? 'yellow' : 'teal'} sm icon={e.mode === 'Video' ? 'video' : 'pin'}>{/pending/i.test(e.status) ? 'Requested' : e.mode}</Pill>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="stack gap-16">
          <Reveal className="dash-quick" stagger>
            {QUICK.map(([icon, title, sub, to, tone]) => (
              <Link key={to} to={to} className="card tight stack gap-10">
                <span className={cx('well sm', tone)}><Icon name={icon} size={15} /></span>
                <div><b style={{ fontSize: 14 }}>{title}</b><div className="sub" style={{ fontSize: 11.5 }}>{sub}</div></div>
              </Link>
            ))}
          </Reveal>

          {pet && (
            <div className="card">
              <div className="card-head"><div><h2 className="h-card">{pet.name}’s health</h2><div className="sub">From the Health Vault</div></div><Link to="/vault" className="link-plain" style={{ fontSize: 13 }}>Open →</Link></div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="mini-stat"><div className="k">Weight</div><div className="v">{pet.weight || '—'}</div></div>
                <div className="mini-stat"><div className="k">Age</div><div className="v">{pet.age || '—'}</div></div>
                <div className="mini-stat"><div className="k">Vaccines</div><div className="v" style={{ fontSize: 16 }}>{pet.nextVaccine ? 'Due soon' : 'Up to date'}</div></div>
                <div className="mini-stat"><div className="k">Microchip</div><div className="v mono" style={{ fontSize: 13 }}>{pet.microchip || '—'}</div></div>
              </div>
            </div>
          )}

          {device ? (
            <Link to="/gps" className="card">
              <div className="card-head"><div><h2 className="h-card">{device.petName || device.name} on the radar</h2><div className="sub">{device.name}</div></div><Pill tone={device.isOnline ? 'teal' : ''} mono sm><span className={cx('dot', !device.isOnline && 'grey')} /> {device.isOnline ? 'Live' : 'Offline'}</Pill></div>
              <div className="radar" style={{ aspectRatio: '2.2 / 1', borderRadius: 16, backgroundSize: '22px 22px' }}>
                <div className="zone" style={{ width: '42%', aspectRatio: '1', height: 'auto' }} />
                <div className="pet-dot" style={{ left: `${50 + Math.max(-18, Math.min(18, (gps?.dx || 0) / 10))}%`, top: `${50 - Math.max(-30, Math.min(30, (gps?.dy || 0) / 6))}%`, width: 16, height: 16, borderWidth: 3 }} />
              </div>
              <div className="row between" style={{ marginTop: 12, fontSize: 13 }}>
                <span className="row gap-6"><Icon name="battery" size={15} className="teal" /> {device.batteryLevel}%</span>
                <span className={gps && gps.d > device.safeZoneRadius ? 'red' : 'teal'}>{gps && gps.d > device.safeZoneRadius ? `Outside safe zone · ${Math.round(gps.d)} m` : 'Inside safe zone'}</span>
              </div>
            </Link>
          ) : (
            <div className="card flat row gap-12">
              <Icon name="target" className="teal" />
              <div className="grow"><b style={{ fontSize: 14 }}>Add a GPS collar</b><div className="sub" style={{ fontSize: 12 }}>Live location and escape alerts</div></div>
              <Button variant="outline" size="sm" to="/gps">See how</Button>
            </div>
          )}

          {reorder.length > 0 && (
            <div className="card">
              <div className="card-head"><div><h2 className="h-card">Buy again</h2><div className="sub">From your recent orders</div></div></div>
              <div className="stack gap-10">
                {reorder.map((p) => (
                  <div key={p.id} className="row gap-12">
                    <Ph src={p.image} label=" " style={{ width: 44, height: 44, minHeight: 0, borderRadius: 12, flex: 'none' }} />
                    <div className="grow" style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div><div className="sub" style={{ fontSize: 12 }}>{money(p.price)}</div></div>
                    <Button variant="dark" size="sm" icon="plus" onClick={() => addToCart(p)} aria-label={`Add ${p.name}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
