import { useMemo, useState } from 'react';
import { useAdmin, useAdminWrite, ADMIN_CONFIG } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Avatar, Segmented, Empty } from '../../ui/index.jsx';
import { money, timeOfDay, cx, minutesSince } from '../../lib/format.js';

const dayStart = (offset = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d.getTime(); };
const HOUR_PX = 64;

export default function Appointments() {
  const { events, vets, live } = useAdmin();
  const write = useAdminWrite();
  const [view, setView] = useState('day');
  const [dayOffset, setDayOffset] = useState(0);
  const [assigning, setAssigning] = useState({});
  const [hidden, setHidden] = useState([]);

  const doctors = vets.filter((v) => !/groom|board|shop/i.test(`${v.tag} ${v.specialty}`));
  const vetFor = (e) => doctors.find((v) => v.id === e.vetId || (e.doctor && v.name === e.doctor));
  const from = dayStart(dayOffset);
  const to = from + 864e5;

  const scheduled = events.filter((e) => e.start && (e.vetId || e.doctor) && !/cancel/i.test(e.status));
  const today = scheduled.filter((e) => e.start >= from && e.start < to);
  const requests = events.filter((e) => !e.vetId && !e.doctor && !/cancel|complete/i.test(e.status) && !hidden.includes(e.id));
  const columns = doctors.filter((v) => today.some((e) => vetFor(e)?.id === v.id)).concat(doctors.filter((v) => !today.some((e) => vetFor(e)?.id === v.id))).slice(0, Math.max(4, new Set(today.map((e) => vetFor(e)?.id)).size));
  const startH = ADMIN_CONFIG.dayStartHour;
  const endH = Math.max(ADMIN_CONFIG.dayEndHour, ...today.map((e) => new Date(e.start).getHours() + Math.ceil(e.minutes / 60)));
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const totalSlots = columns.length * hours.length;

  const fee = (e) => vetFor(e)?.price || 500;
  const earnings = today.reduce((a, e) => a + fee(e), 0);
  const noShows = today.filter((e) => /no.?show/i.test(e.status)).length;

  // Open slots: first free hour per column after now
  const openSlots = useMemo(() => columns.map((v) => {
    const taken = today.filter((e) => vetFor(e)?.id === v.id).map((e) => [new Date(e.start).getHours(), new Date(e.start).getHours() + Math.ceil(e.minutes / 60)]);
    const nowH = dayOffset === 0 ? new Date().getHours() + 1 : startH;
    const h = hours.find((x) => x >= nowH && !taken.some(([a, b]) => x >= a && x < b));
    return h != null ? { vetId: v.id, h } : null;
  }).filter(Boolean), [columns, today, dayOffset]); // eslint-disable-line

  const assign = async (r, vetId) => {
    const v = doctors.find((x) => x.id === vetId);
    if (!v) return;
    if (await write('events', r.id, { vetId: v.id, doctor: v.name, status: 'Confirmed' }, `Assigned to ${v.name}`)) setHidden((h) => [...h, r.id]);
  };

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const s = dayStart(i); const e = s + 864e5;
    return { s, items: scheduled.filter((x) => x.start >= s && x.start < e).sort((a, b) => a.start - b.start) };
  }), [scheduled]);

  return (
    <>
      <PageHead eyebrow="Specialist network" title="Appointments">
        <Button variant="outline" icon="user" to="/specialists">View vet listings</Button>
        <Button variant="dark" icon="plus" to="/specialists">New booking</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Booked today" value={today.length} icon="calendar" note={`${totalSlots ? Math.round((today.length / totalSlots) * 100) : 0}% of slots`} />
        <Stat label="Waiting requests" value={requests.length} icon="clock" delta={requests.length ? `${Math.max(...requests.map((r) => r.waitingMin ?? minutesSince(r.requestedAt)))} min` : null} deltaTone="red" note={requests.length ? 'longest wait' : 'all assigned'} />
        <Stat label="No-shows" value={noShows} icon="bell" note="today" />
        <Stat label="Vets on shift" value={new Set(today.map((e) => vetFor(e)?.id).filter(Boolean)).size} icon="stethoscope" note={`of ${doctors.length} listed`} />
      </div>

      <div className="adm-grid-side wide" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="h-card">{view === 'day' ? new Date(from).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Next 7 days'}</h2>
              <div className="sub">{view === 'day' ? `${new Set(today.map((e) => vetFor(e)?.id)).size} vets on shift · ${today.length} of ${totalSlots} slots booked` : `${week.reduce((a, d) => a + d.items.length, 0)} appointments`}</div>
            </div>
            <div className="row gap-8">
              {view === 'day' && <><Button variant="outline" size="sm" icon="chevronLeft" onClick={() => setDayOffset((d) => d - 1)} aria-label="Previous day" /><Button variant="outline" size="sm" onClick={() => setDayOffset(0)}>Today</Button><Button variant="outline" size="sm" icon="chevronRight" onClick={() => setDayOffset((d) => d + 1)} aria-label="Next day" /></>}
              <div style={{ width: 160 }}><Segmented items={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} value={view} onChange={setView} /></div>
            </div>
          </div>

          {view === 'day' ? (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `52px repeat(${columns.length}, minmax(150px, 1fr))`, minWidth: 52 + columns.length * 150 }}>
                <div />
                {columns.map((v) => (
                  <div key={v.id} className="cal-head">
                    <Avatar name={v.name.replace('Dr. ', '')} src={v.photo} size="sm" />
                    <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }} className="ellipsis">{v.name}</div><div className="sub ellipsis" style={{ fontSize: 11 }}>{v.specialty}</div></div>
                  </div>
                ))}
                <div>{hours.map((h) => <div key={h} className="cal-hour" style={{ height: HOUR_PX }}>{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</div>)}</div>
                {columns.map((v) => (
                  <div key={v.id} className="cal-col" style={{ height: hours.length * HOUR_PX }}>
                    {hours.map((h) => <div key={h} className="cal-slot" style={{ height: HOUR_PX }} />)}
                    {today.filter((e) => vetFor(e)?.id === v.id).map((e) => {
                      const d = new Date(e.start);
                      const top = (d.getHours() - startH + d.getMinutes() / 60) * HOUR_PX;
                      const cls = e.urgent ? 'urgent' : e.tentative || /pending/i.test(e.status) ? 'soft' : 'solid';
                      return (
                        <div key={e.id} className={cx('appt', cls)} style={{ top: top + 4, height: Math.max(36, (e.minutes / 60) * HOUR_PX - 8) }} title={`${e.pet} · ${e.reason} · ${e.mode}`}>
                          <b>{e.pet} · {e.reason}</b>{timeOfDay(e.start)} · {e.minutes} min{e.mode === 'Video' ? ' · video' : ''}
                        </div>
                      );
                    })}
                    {openSlots.filter((s) => s.vetId === v.id).map((s) => (
                      <div key={`o-${s.h}`} className="appt open" style={{ top: (s.h - startH) * HOUR_PX + 4, height: HOUR_PX - 8 }}><b>Open slot</b>{s.h > 12 ? s.h - 12 : s.h} {s.h >= 12 ? 'PM' : 'AM'} · 60 min</div>
                    ))}
                  </div>
                ))}
              </div>
              {columns.length === 0 && <Empty icon="calendar" title="No vets listed">Add vets in the vets collection to see their schedule.</Empty>}
            </div>
          ) : (
            <div className="stack gap-16">
              {week.map((d) => (
                <div key={d.s}>
                  <div className="eyebrow muted" style={{ marginBottom: 8 }}>{new Date(d.s).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} · {d.items.length}</div>
                  {d.items.length === 0 ? <div className="sub">No appointments</div> : (
                    <div className="list">
                      {d.items.map((e) => (
                        <div key={e.id} className="list-row"><span className="mono" style={{ fontSize: 12, width: 70 }}>{timeOfDay(e.start)}</span><div className="grow"><b style={{ fontSize: 14 }}>{e.pet} · {e.reason}</b><div className="sub" style={{ fontSize: 12 }}>{vetFor(e)?.name || e.doctor} · {e.mode}</div></div><Pill tone={e.urgent ? 'red' : 'teal'} sm>{e.status}</Pill></div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stack gap-16">
          <div className="card">
            <div className="card-head"><div><h2 className="h-card">Unassigned requests</h2><div className="sub">{requests.length} waiting</div></div>{live.events && <Pill tone="teal" sm>Live</Pill>}</div>
            {requests.length === 0 ? <div className="sub">Every request has a vet. 🎉</div> : (
              <div className="list">
                {requests.map((r) => {
                  const wait = r.waitingMin ?? minutesSince(r.requestedAt);
                  return (
                    <div key={r.id} className="list-row" style={{ flexWrap: 'wrap' }}>
                      <Avatar name={r.customer || r.pet} />
                      <div className="grow"><b style={{ fontSize: 14 }}>{r.customer || r.pet}</b><div className="sub" style={{ fontSize: 12 }}>{r.mode} · {r.reason}{r.pet ? `, ${r.pet}` : ''}</div></div>
                      <span className={cx('mono', wait > 3 ? 'red' : 'muted')} style={{ fontSize: 12 }}>{wait} min</span>
                      {assigning[r.id] ? (
                        <select className="filter-select" style={{ height: 36, width: '100%' }} autoFocus defaultValue="" onChange={(e) => assign(r, e.target.value)} aria-label="Choose vet">
                          <option value="" disabled>Choose a vet…</option>
                          {doctors.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.specialty}</option>)}
                        </select>
                      ) : <Button variant="dark" size="sm" onClick={() => setAssigning({ ...assigning, [r.id]: true })}>Assign</Button>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="h-card">Consult earnings</h2>
            <div className="sub">{dayOffset === 0 ? 'Today' : new Date(from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
            <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', margin: '14px 0 10px' }}>{money(earnings)}</div>
            <div className="kv"><span>{today.length} consults</span><span>{money(earnings)}</span></div>
            <div className="kv"><span>Vet share ({ADMIN_CONFIG.vetSharePct}%)</span><span>{money(earnings * ADMIN_CONFIG.vetSharePct / 100)}</span></div>
            <div className="kv"><span>Platform ({100 - ADMIN_CONFIG.vetSharePct}%)</span><span>{money(earnings * (100 - ADMIN_CONFIG.vetSharePct) / 100)}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
