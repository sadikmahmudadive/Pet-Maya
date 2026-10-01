import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { Icon, Button, Ph, Pill, Empty } from '../../ui/index.jsx';
import BookingModal from '../BookingModal.jsx';
import { money, cx } from '../../lib/format.js';
import { Reveal, Count } from '../../lib/motion.jsx';
import { BRAND } from '../../data/content.js';

const SERVICES = [
  { k: 'Veterinarian', label: 'Veterinarian', sub: 'Video & clinic consults', icon: 'stethoscope', tag: 'Video & clinic' },
  { k: 'Boarding', label: 'Boarding', sub: 'Stays & recovery care', icon: 'home', tag: 'Supervised' },
  { k: 'Pet Shop', label: 'Pet shop', sub: 'Medicine & food', icon: 'bag', tag: 'Cold-chain Rx' },
  { k: 'Grooming', label: 'Pet groomer', sub: 'Baths, cuts & spa', icon: 'paw', tag: 'Fear-free' },
];

const matchService = (v, k) => {
  const t = `${v.tag} ${v.specialty}`.toLowerCase();
  if (k === 'Veterinarian') return !/groom|board|shop/.test(t);
  if (k === 'Grooming') return /groom/.test(t);
  if (k === 'Boarding') return /board/.test(t);
  if (k === 'Pet Shop') return /shop/.test(t);
  return true;
};

export default function Specialists() {
  const { vets } = useStore();
  const [svc, setSvc] = useState('Veterinarian');
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('all');
  const [booking, setBooking] = useState(null);

  const pool = useMemo(() => vets.items.filter((v) => matchService(v, svc)), [vets.items, svc]);
  const specs = useMemo(() => [...new Set(pool.map((v) => v.specialty))].filter(Boolean), [pool]);
  const list = useMemo(() => pool.filter((v) => {
    if (spec !== 'all' && v.specialty !== spec) return false;
    if (q && !`${v.name} ${v.specialty} ${v.focus.join(' ')} ${v.bio}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => Number(b.emergency) - Number(a.emergency) || b.rating - a.rating), [pool, spec, q]);

  const minFee = pool.length ? Math.min(...pool.map((v) => v.price)) : 500;
  const emergencyVet = vets.items.find((v) => v.emergency);

  return (
    <div className="container">
      <div className="svc-tabs">
        {SERVICES.map((s) => {
          const count = vets.items.filter((v) => matchService(v, s.k)).length;
          return (
            <button key={s.k} className={cx('svc-tab', svc === s.k && 'on')} onClick={() => { setSvc(s.k); setSpec('all'); }}>
              <div className="row between"><span className="well sm"><Icon name={s.icon} size={15} /></span><span className="mono teal" style={{ fontSize: 11 }}>{svc === s.k && count ? `● ${count} listed` : s.tag}</span></div>
              <div><div style={{ fontSize: 16 }}>{s.label}</div><div className="sub" style={{ fontSize: 12 }}>{s.sub}</div></div>
            </button>
          );
        })}
      </div>

      <section style={{ marginTop: 44 }}>
        <Pill mono>Licensed vets · Bangladesh Veterinary Council registered</Pill>
        <h1 className="display-1" style={{ marginTop: 18, maxWidth: '15ch' }}>
          Talk to a vet, <em className="accent">without the waiting room.</em>
        </h1>
        <p className="lead" style={{ marginTop: 18 }}>
          Video consults and clinic visits with vets for skin, tummy, joints, behaviour and emergencies. Prescriptions go straight to your bag.
        </p>
        <div className="kpi-row" style={{ marginTop: 26 }}>
          {[['stethoscope', 'Vets', `${pool.length} available`], ['clock', 'Response', 'Usually same day'], ['shield', 'Checks', 'Licence verified'], ['cloud', 'Records', 'Saved to Health Vault']].map(([i, k, v]) => (
            <div key={k} className="card tight row gap-12"><Icon name={i} size={18} className="teal" /><div><div className="stat-label" style={{ fontSize: 9.5 }}>{k}</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{v}</div></div></div>
          ))}
        </div>
      </section>

      <div className="card" style={{ marginTop: 22 }}>
        <div className="searchbar" style={{ background: 'var(--sunk)', border: 0 }}>
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, specialty or problem (e.g. itching, limping)" aria-label="Search vets" />
        </div>
        <div className="row gap-8 wrap" style={{ marginTop: 14 }}>
          <span className="eyebrow muted" style={{ marginRight: 4 }}>Specialty</span>
          <button className={cx('chip', spec === 'all' && 'active')} onClick={() => setSpec('all')}>All ({pool.length})</button>
          {specs.map((s) => <button key={s} className={cx('chip', spec === s && 'active')} onClick={() => setSpec(s)}>{s}</button>)}
        </div>
      </div>

      <section className="section" style={{ paddingTop: 44 }}>
        <div className="section-head">
          <div><h2 className="display-3">Available now</h2><div className="sub" style={{ marginTop: 6 }}>Showing {list.length} {list.length === 1 ? 'provider' : 'providers'}</div></div>
        </div>
        {list.length === 0 ? (
          <div className="card"><Empty icon="stethoscope" title="No one matches that search">Try another specialty or clear the search.</Empty></div>
        ) : (
          <Reveal className="vet-grid" stagger key={`${svc}-${spec}`}>
            {list.map((v) => (
              <article key={v.id} className={cx('card vet-card', v.emergency && 'emergency')}>
                <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                  <Ph src={v.photo} label="photo" style={{ width: 64, height: 64, minHeight: 0, flex: 'none', borderRadius: 16 }} />
                  <div className="grow">
                    <div className="row between gap-6">
                      <Pill tone={v.emergency ? 'red' : 'teal'} mono sm>{v.emergency ? 'On call' : v.availability}</Pill>
                      <span className="row gap-4" style={{ fontSize: 12 }}><Icon name="star" size={12} stroke={1} style={{ fill: '#E0A526', color: '#E0A526' }} /><b>{v.rating.toFixed(2).replace(/0$/, '')}</b><span className="muted">({v.reviewsCount})</span></span>
                    </div>
                    <h3 className="serif" style={{ fontSize: 21, marginTop: 8 }}>{v.name}</h3>
                    <div className="teal" style={{ fontSize: 13 }}>{v.specialty}{v.qualification ? ` · ${v.qualification}` : ''}</div>
                  </div>
                </div>
                <div>
                  <div className="eyebrow muted" style={{ fontSize: 10, marginBottom: 6 }}>Helps with</div>
                  <p style={{ fontSize: 14 }}>{v.bio}</p>
                </div>
                {v.focus.length > 0 && <div className="focus-tags">{v.focus.slice(0, 3).map((f) => <span key={f}>{f}</span>)}</div>}
                <div style={{ fontSize: 14, marginTop: 'auto' }}><b style={{ fontSize: 20 }}>{money(v.price)}</b> <span className="muted">/ 25 min session</span></div>
                <div className="row gap-8">
                  <Button variant={v.emergency ? 'red' : 'teal'} className="grow" onClick={() => setBooking({ vet: v, mode: 'Video' })}>{v.emergency ? 'Urgent video call' : 'Book video call'}</Button>
                  <Button variant="soft" onClick={() => setBooking({ vet: v, mode: 'Clinic' })}>Clinic visit</Button>
                </div>
              </article>
            ))}
          </Reveal>
        )}
      </section>

      <section className="section">
        <div className="card" style={{ padding: 'clamp(22px,4vw,36px)' }}>
          <div className="eyebrow">How it works</div>
          <h2 className="display-3" style={{ marginTop: 8 }}>From worried to sorted in three steps</h2>
          <p className="muted" style={{ marginTop: 6 }}>Your pet’s records travel with you, so you never repeat the story.</p>
          <div className="trio" style={{ marginTop: 22 }}>
            {[
              ['01', 'Share what’s happening', 'Pick your pet, describe the problem and add photos. Their weight, vaccines and history are shared with the vet automatically.', 'No repeated forms'],
              ['02', 'Talk it through', 'A 25-minute video call or clinic visit. The vet can see the problem, ask questions and agree a plan with you.', 'Private, secure call'],
              ['03', 'Get the treatment', 'If medicine is needed, the vet sends the prescription to your bag and we deliver — cold items stay at 2–8°C.', 'Same-day in Dhaka'],
            ].map(([n, t, d, f]) => (
              <div key={n} className="card flat stack gap-10" style={{ padding: 22 }}>
                <span className="mono subtle" style={{ fontSize: 12 }}>{n}</span>
                <b style={{ fontSize: 16 }}>{t}</b>
                <p className="muted" style={{ fontSize: 13.5 }}>{d}</p>
                <span className="sub" style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--line-2)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="eyebrow">Our standards</div>
            <h2 className="display-2" style={{ marginTop: 8 }}>How we choose our vets</h2>
            <p className="muted" style={{ marginTop: 14, maxWidth: '50ch' }}>Every vet on Pet Maya is registered and licence-checked before they can see patients, and we keep listening to your feedback after every visit.</p>
            <div className="row gap-32" style={{ marginTop: 26 }}>
              <div><div style={{ fontSize: 30, fontWeight: 600 }}><Count value={100} format={(x) => `${Math.round(x)}%`} /></div><div className="stat-label" style={{ fontSize: 9.5 }}>Licence checked</div></div>
              <div><div style={{ fontSize: 30, fontWeight: 600 }}><Count value={vets.items.length} /></div><div className="stat-label" style={{ fontSize: 9.5 }}>Vets listed</div></div>
              <div><div style={{ fontSize: 30, fontWeight: 600 }}>{money(minFee)}</div><div className="stat-label" style={{ fontSize: 9.5 }}>Consults from</div></div>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['shield', 'Licence checks', 'Registration and degree verified before onboarding, and re-checked every year.'],
              ['check', 'Clear prescribing', 'Prescriptions are written in the app and checked by our pharmacy before dispatch.'],
              ['lock', 'Private records', 'Only you and the vets you book can see your pet’s health records.'],
              ['file', 'Your feedback', 'Every visit can be rated; low ratings are reviewed by our care team.'],
            ].map(([i, t, d]) => (
              <div key={t} className="card tight stack gap-8"><Icon name={i} size={17} className="teal" /><b style={{ fontSize: 14 }}>{t}</b><p className="muted" style={{ fontSize: 12.5 }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="emergency-band">
          <div className="row gap-8" style={{ color: '#F19A90' }}><span className="dot red" /><span className="eyebrow" style={{ color: '#F19A90' }}>Emergency</span></div>
          <h2 className="display-2" style={{ marginTop: 12, maxWidth: '22ch' }}>Collapse, poisoning or a road accident?</h2>
          <p style={{ marginTop: 12, color: 'rgba(255,255,255,.7)', maxWidth: '60ch' }}>Don’t wait for a booked slot. Start an urgent video call now — the vet will tell you whether to go straight to a clinic and what to do on the way.</p>
          <div className="row gap-10 wrap" style={{ marginTop: 22 }}>
            {emergencyVet && <Button variant="red" icon="video" onClick={() => setBooking({ vet: emergencyVet, mode: 'Video' })}>Urgent video call</Button>}
            {BRAND.supportPhone && <Button className="btn-ghost-dark" variant="ghost" icon="phone" to={`tel:${BRAND.supportPhone.replace(/\s/g, '')}`}>{BRAND.supportPhone}</Button>}
            <Button className="btn-ghost-dark" variant="ghost" icon="pulse" to="/triage">Check symptoms first</Button>
          </div>
        </div>
      </section>

      {booking && <BookingModal vet={booking.vet} defaultMode={booking.mode} onClose={() => setBooking(null)} />}
    </div>
  );
}
