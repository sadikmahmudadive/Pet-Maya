import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useMyEvents, useMyRecords } from '../../data/hooks.js';
import { useCollection } from '../../data/firestore.js';
import { savePet, deletePet, isRealUser } from '../../data/actions.js';
import { normDevice } from './Gps.jsx';
import { Icon, Button, Pill, Avatar, Empty, Field, Portal, Ph } from '../../ui/index.jsx';
import { shortDate, toMillis } from '../../lib/format.js';
import { SPECIES_OPTIONS, resolveSpecies, withUnit } from '../../lib/species.js';

/** What the app calls "Health Condition": a record count and the stored health index. */
function healthStatus(pet, recordCount) {
  if (recordCount === 0) return { value: 'No medical logs added', tag: 'Unverified', tone: '' };
  const score = pet.healthIndex;
  if (score == null) return { value: `${recordCount} record${recordCount > 1 ? 's' : ''} on file`, tag: 'On file', tone: 'teal' };
  return score > 80
    ? { value: 'Optimal & verified', tag: 'Healthy', tone: 'teal' }
    : { value: 'Checkup recommended', tag: 'Checkup', tone: 'yellow' };
}

function EditPet({ pet, user, onClose }) {
  const { toast } = useStore();
  const [f, setF] = useState({
    name: pet.name, breed: pet.breed, species: pet.species, gender: pet.gender || 'Male', age: pet.age, weight: pet.weight,
    height: pet.height, color: pet.color, description: pet.bio,
  });
  const [picked, setPicked] = useState(false); // once the owner chooses a species, the breed stops changing it
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setBreed = (e) => {
    const breed = e.target.value;
    const guess = resolveSpecies({ type: '', breed });
    setF({ ...f, breed, ...(!picked && SPECIES_OPTIONS.includes(guess) ? { species: guess } : {}) });
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await savePet(user, { id: pet.id, ...f, name: f.name.trim(), breed: f.breed.trim() });
    setBusy(false);
    if (res.ok) { toast(`${f.name.trim()} updated`); onClose(); } else toast('Couldn’t save. Please try again.', { tone: 'error' });
  };
  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={save} role="dialog" aria-modal="true" aria-label={`Edit ${pet.name}`}>
        <div className="row between"><h2 className="serif" style={{ fontSize: 26 }}>Edit {pet.name}</h2><button type="button" className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button></div>
        <div className="fields" style={{ marginTop: 20 }}>
          <Field className="full" label="Name" required value={f.name} onChange={set('name')} />
          <Field label="Breed" value={f.breed} onChange={setBreed} placeholder="e.g. Persian, Labrador, Budgie" />
          <Field label="Species"><select className="select" value={f.species} onChange={(e) => { setPicked(true); set('species')(e); }}>{SPECIES_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Gender"><select className="select" value={f.gender} onChange={set('gender')}><option>Male</option><option>Female</option></select></Field>
          <Field label="Age" value={f.age} onChange={set('age')} placeholder="e.g. 3 Years, 2 Months" />
          <Field label="Weight" value={f.weight} onChange={set('weight')} placeholder="e.g. 12.5 kg" />
          <Field label="Height" value={f.height} onChange={set('height')} placeholder="e.g. 45 cm" />
          <Field className="full" label="Colour" value={f.color} onChange={set('color')} />
          <Field className="full" label="About"><textarea className="textarea" rows={3} value={f.description} onChange={set('description')} placeholder="Personality, favourite things, anything a vet or sitter should know" /></Field>
        </div>
        <Button type="submit" variant="dark" size="lg" block style={{ marginTop: 20 }} disabled={busy || !f.name.trim()}>{busy ? 'Saving…' : 'Save changes'}</Button>
      </form>
    </Portal>
  );
}

function ConfirmDelete({ pet, onCancel, onConfirm, busy }) {
  return (
    <Portal>
      <div className="scrim" onClick={onCancel} />
      <div className="modal" role="alertdialog" aria-modal="true" aria-label={`Delete ${pet.name}`} style={{ maxWidth: 440 }}>
        <h2 className="serif" style={{ fontSize: 26 }}>Delete {pet.name}?</h2>
        <p className="sub" style={{ marginTop: 10, fontSize: 14 }}>This removes {pet.name}’s profile from your account. Health records already in your vault stay there. This can’t be undone.</p>
        <div className="row gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onCancel}>Keep profile</Button>
          <Button variant="red" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting…' : `Delete ${pet.name}`}</Button>
        </div>
      </div>
    </Portal>
  );
}

function Tile({ icon, title, value, tag, tone, to, children }) {
  const body = (
    <>
      <span className="well round"><Icon name={icon} size={18} /></span>
      <div className="grow" style={{ minWidth: 0 }}>
        <b style={{ fontSize: 15 }}>{title}</b>
        <div className="sub ellipsis" style={{ fontSize: 13 }}>{value}</div>
        {children}
      </div>
      {tag && <Pill sm tone={tone}>{tag}</Pill>}
      {to && <Icon name="chevronRight" size={16} />}
    </>
  );
  return to ? <Link to={to} className="card pet-tile">{body}</Link> : <div className="card pet-tile">{body}</div>;
}

export default function PetProfile({ params }) {
  const { user, pets, activePet, setPetId } = useStore();
  const { navigate } = useRouter();
  const real = isRealUser(user);
  const pet = (pets.items || []).find((p) => p.id === params.id);
  const records = useMyRecords(user);
  const events = useMyEvents(user);
  const devices = useCollection('devices', { map: normDevice, sample: [], filters: real ? [['ownerId', '==', user.uid]] : [], enabled: !!real, sampleWhenEmpty: false });
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useStore();

  // Opening a pet makes it the pet the rest of the site (shop, triage, vault) is personalised for.
  useEffect(() => { if (pet && activePet?.id !== pet.id) setPetId(pet.id); }, [pet?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (pet) document.title = `${pet.name} · Pet Maya`; }, [pet?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const myRecords = useMemo(() => {
    if (!pet) return [];
    return (records.items || [])
      .filter((r) => r.petId === pet.id || (r.petName && r.petName === pet.name))
      .map((r) => ({ id: r.id, date: toMillis(r.date || r.createdAt), title: r.serviceType || 'Visit', doctor: r.doctor || r.providerName || '', vaccine: /vacc/i.test(r.serviceType || ''), note: [r.diagnosis, r.prescription && r.prescription !== 'None' ? `Rx: ${r.prescription}` : ''].filter(Boolean).join(' · ') }))
      .sort((a, b) => b.date - a.date);
  }, [records.items, pet]);
  const upcoming = useMemo(() => (events.items || [])
    .filter((e) => pet && e.pet === pet.name && e.start >= Date.now() - 3600e3)
    .sort((a, b) => a.start - b.start), [events.items, pet]);
  const collar = useMemo(() => pet && (devices.items || []).find((d) => d.petId === pet.id || (d.petName && d.petName === pet.name)), [devices.items, pet]);

  if (pets.loading && !pet) return <div className="container page-head"><div className="skeleton" style={{ height: 320, borderRadius: 28 }} /></div>;
  if (!pet) {
    return (
      <div className="container page-head">
        <div className="card"><Empty icon="paw" title="We couldn’t find that pet"><Link to="/dashboard" className="link">Back to your dashboard</Link></Empty></div>
      </div>
    );
  }

  const owner = real && (!pet.ownerID || pet.ownerID === user.uid);
  const vaccines = myRecords.filter((r) => r.vaccine);
  const health = healthStatus(pet, myRecords.length);
  const others = (pets.items || []).filter((p) => p.id !== pet.id);
  const facts = [
    ['Date of birth', pet.dob ? shortDate(toMillis(pet.dob)) : ''],
    ['Microchip', pet.microchip],
    ['Sound', pet.sound],
    ['Allergies', pet.allergies],
  ].filter(([, v]) => v);

  const remove = async () => {
    setBusy(true);
    const res = await deletePet(user, pet.id);
    setBusy(false);
    if (res.ok) { toast(`${pet.name}’s profile was deleted`); navigate('/dashboard'); } else { setConfirming(false); toast('Couldn’t delete. Please try again.', { tone: 'error' }); }
  };

  return (
    <div className="container page-head">
      <Link to="/dashboard" className="link-plain row gap-6" style={{ fontSize: 14, marginBottom: 14 }}><Icon name="arrowLeft" size={15} /> Dashboard</Link>

      {/* Identity */}
      <section className="card pet-hero">
        <Ph src={pet.photo} label={pet.name} className="pet-hero-photo" tone="teal" />
        <div className="pet-hero-body">
          <div className="eyebrow">Pet profile</div>
          <h1 className="display-2" style={{ marginTop: 8 }}>{pet.name}</h1>
          <div className="row gap-8" style={{ marginTop: 6, color: 'var(--teal-ink, var(--teal))', fontWeight: 600 }}>
            <span className="dot" /> {pet.breed || pet.species}
          </div>
          <div className="row gap-8 wrap" style={{ marginTop: 14 }}>
            <Pill mono sm>{pet.species}</Pill>
            {pet.gender && <Pill sm>{pet.gender}</Pill>}
            {pet.age && <Pill sm>{pet.age}</Pill>}
            {pet.neutered && <Pill sm tone="teal">Neutered</Pill>}
          </div>
          <div className="row gap-8 wrap" style={{ marginTop: 20 }}>
            {owner && <Button variant="dark" icon="settings" onClick={() => setEditing(true)}>Edit profile</Button>}
            <Button variant="outline" icon="file" to="/vault">Health vault</Button>
            <Button variant="teal" icon="stethoscope" to="/specialists">Book a vet</Button>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <div className="row gap-8 wrap" style={{ marginTop: 14 }} aria-label="Other pets">
          <span className="sub" style={{ fontSize: 13 }}>Switch to</span>
          {others.map((p) => <Link key={p.id} to={`/pets/${encodeURIComponent(p.id)}`} className="pill"><Avatar name={p.name} src={p.photo} size="sm" /> {p.name}</Link>)}
        </div>
      )}

      {/* About */}
      <section style={{ marginTop: 36 }}>
        <h2 className="display-3 row gap-8"><Icon name="paw" size={20} /> About {pet.name}</h2>
        <div className="stat-grid" style={{ marginTop: 16 }}>
          {[['Age', pet.age], ['Weight', withUnit(pet.weight, 'kg')], ['Height', withUnit(pet.height, 'cm')], ['Colour', pet.color]].map(([k, v]) => (
            <div key={k} className="card stat"><div className="stat-label">{k}</div><div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{v || 'N/A'}</div></div>
          ))}
        </div>
        {(pet.bio || facts.length > 0) && (
          <div className="card" style={{ marginTop: 14 }}>
            {pet.bio && <p style={{ margin: 0, lineHeight: 1.6 }}>{pet.bio}</p>}
            {facts.length > 0 && (
              <dl className="pet-facts" style={{ marginTop: pet.bio ? 16 : 0 }}>
                {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            )}
          </div>
        )}
      </section>

      {/* Health & care hub */}
      <section style={{ marginTop: 36 }}>
        <h2 className="display-3 row gap-8"><Icon name="pulse" size={20} /> {pet.name}’s health &amp; care</h2>
        <div className="pet-tiles" style={{ marginTop: 16 }}>
          <Tile icon="heart" title="Health condition" value={health.value} tag={health.tag} tone={health.tone} to="/vault" />
          <Tile icon="shield" title="Vaccination hub" value={vaccines.length ? `${vaccines.length} vaccine record${vaccines.length > 1 ? 's' : ''}` : (pet.vaccination || 'No vaccine logs recorded yet')} tag={vaccines.length || pet.vaccination ? 'Logged' : 'Unverified'} tone={vaccines.length || pet.vaccination ? 'teal' : ''} to="/vault" />
          <Tile icon="bone" title="Food & nutrition" value={pet.foodName || (pet.feedingTimes.length ? `${pet.feedingTimes.length} meals a day` : 'Set up a meal schedule')} tag={pet.calorieGoal ? `${pet.calorieGoal} kcal` : 'Schedule'} to="/vault" />
          <Tile icon="target" title="Smart collar" value={collar ? `${collar.name} · ${collar.isOnline ? 'online' : 'offline'} · ${collar.batteryLevel}% battery` : 'No collar paired yet'} tag={collar ? (collar.isOnline ? 'Live' : 'Offline') : 'Not paired'} tone={collar?.isOnline ? 'teal' : ''} to="/gps" />
          <Tile icon="smile" title="Current mood" value={pet.mood || 'Happy & active'} tag="Stable" />
        </div>
        {pet.feedingTimes.length > 0 && (
          <div className="card" style={{ marginTop: 12 }}>
            <b style={{ fontSize: 14 }}>Feeding schedule</b>
            <ul className="pet-meals">{pet.feedingTimes.map((t, i) => <li key={`${t}-${i}`}>{t}</li>)}</ul>
          </div>
        )}
      </section>

      {/* Upcoming + records */}
      {upcoming.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h2 className="display-3 row gap-8"><Icon name="calendar" size={20} /> Upcoming</h2>
          <div className="stack gap-8" style={{ marginTop: 16 }}>
            {upcoming.map((e) => (
              <div key={e.id} className="card row between wrap gap-12" style={{ padding: '14px 18px' }}>
                <div><b>{e.reason || 'Appointment'}</b><div className="sub" style={{ fontSize: 13 }}>{[e.doctor, e.mode].filter(Boolean).join(' · ')}</div></div>
                <Pill sm tone="teal" icon="clock">{shortDate(e.start)}</Pill>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 36 }}>
        <div className="row between wrap gap-8"><h2 className="display-3">Care &amp; medical records</h2><Link to="/vault" className="link-plain row gap-6" style={{ fontSize: 14 }}>Open vault <Icon name="arrowRight" size={14} /></Link></div>
        <div className="stack gap-8" style={{ marginTop: 16 }}>
          {myRecords.length === 0 ? (
            <div className="card"><Empty icon="file" title="No records logged yet.">Visits, vaccines and lab results from your vet appear here.</Empty></div>
          ) : myRecords.map((r) => (
            <div key={r.id} className="card" style={{ padding: '16px 20px' }}>
              <div className="row between wrap gap-8">
                <div className="row gap-8"><span className="mono subtle" style={{ fontSize: 11 }}>{shortDate(r.date).toUpperCase()}</span>{r.vaccine && <Pill sm tone="teal">Vaccine</Pill>}</div>
                {r.doctor && <span className="sub" style={{ fontSize: 13 }}>{r.doctor}</span>}
              </div>
              <h3 className="serif" style={{ fontSize: 21, marginTop: 6 }}>{r.title}</h3>
              {r.note && <p className="sub" style={{ margin: '6px 0 0', fontSize: 14 }}>{r.note}</p>}
            </div>
          ))}
        </div>
      </section>

      {owner && (
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <button type="button" className="link tap" style={{ color: 'var(--red, #c0392b)', fontWeight: 600 }} onClick={() => setConfirming(true)}>
            <Icon name="x" size={14} /> Delete {pet.name}’s profile
          </button>
        </div>
      )}

      {editing && <EditPet pet={pet} user={user} onClose={() => setEditing(false)} />}
      {confirming && <ConfirmDelete pet={pet} busy={busy} onCancel={() => setConfirming(false)} onConfirm={remove} />}
    </div>
  );
}
