import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { useRouter } from '../lib/router.jsx';
import { bookAppointment, notify } from '../data/actions.js';
import { Icon, Button, Avatar, Segmented, Field, Portal } from '../ui/index.jsx';
import { money, cx } from '../lib/format.js';

const SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:30 PM', '6:00 PM', '7:30 PM'];

function nextDays(n = 7) {
  return Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d; });
}

export default function BookingModal({ vet, onClose, defaultMode = 'Video' }) {
  const { user, pets, activePet, toast } = useStore();
  const { navigate } = useRouter();
  const days = useMemo(() => nextDays(7), []);
  const [mode, setMode] = useState(defaultMode);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState('');
  const [petId, setPetId] = useState(activePet?.id || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const now = new Date();
  const slotOk = (s) => {
    if (day !== 0) return true;
    const [t, ap] = s.split(' ');
    let [h, m] = t.split(':').map(Number);
    if (ap === 'PM' && h !== 12) h += 12;
    return h * 60 + m > now.getHours() * 60 + now.getMinutes() + 30;
  };
  const pet = (pets.items || []).find((p) => p.id === petId) || activePet;

  const book = async () => {
    if (!user) { onClose(); navigate('/signin?next=/specialists'); return; }
    setBusy(true);
    const d = days[day];
    const data = {
      title: `${mode === 'Video' ? 'Video consult' : 'Clinic visit'} with ${vet.name}`,
      reason: reason || 'Consultation',
      doctor: vet.name, vetId: vet.id, clinic: vet.clinic || '',
      petName: pet?.name || 'Pet', petId: pet?.id || '',
      date: d.toISOString(), time: slot, fromTime: slot,
      mode: mode === 'Video' ? 'Video Consultation' : 'In-Clinic Consultation',
      status: 'Pending', category: 'VET APPOINTMENT',
      userId: user.uid, ownerName: user.name || '',
      fee: vet.price,
    };
    const res = await bookAppointment(user, data);
    setBusy(false);
    if (res.ok) {
      setDone(true);
      notify(user, {
        title: 'Appointment requested',
        body: `${mode === 'Video' ? 'Video consult' : 'Clinic visit'} with ${vet.name} on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${slot}.`,
        category: 'appointment',
        url: '/vault',
      });
    } else if (res.reason === 'signin') {
      onClose();
      navigate('/signin?next=/specialists');
    } else {
      toast('Booking failed — please try again', { tone: 'error' });
    }
  };

  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Book ${vet.name}`}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="row gap-12">
            <Avatar name={vet.name.replace('Dr. ', '')} src={vet.photo} size="lg" />
            <div><h2 className="serif" style={{ fontSize: 24 }}>{vet.name}</h2><div className="sub">{vet.specialty} · {money(vet.price)} / 25 min</div></div>
          </div>
          <button className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>
        </div>

        {done ? (
          <div className="empty" style={{ padding: '32px 0 8px' }}>
            <span className="well lg round teal" style={{ margin: '0 auto 12px' }}><Icon name="check" size={22} stroke={2.4} /></span>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 17 }}>Request sent</div>
            <div className="sub" style={{ marginTop: 6 }}>
              {days[day].toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} at {slot}. We’ll confirm by SMS{mode === 'Video' ? ' and send the video link' : ''}.
            </div>
            <Button variant="dark" style={{ marginTop: 18 }} onClick={() => { onClose(); navigate('/vault'); }}>View in Health Vault</Button>
          </div>
        ) : (
          <div className="stack gap-16" style={{ marginTop: 22 }}>
            <Segmented items={[{ value: 'Video', label: 'Video call' }, { value: 'Clinic', label: 'Clinic visit' }]} value={mode} onChange={setMode} />
            <div>
              <span className="label">Day</span>
              <div className="tabs" style={{ gap: 8 }}>
                {days.map((d, i) => (
                  <button key={i} className={cx('day-chip', i === day && 'on')} onClick={() => { setDay(i); setSlot(''); }}>
                    <small>{i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' })}</small>
                    <b>{d.getDate()}</b>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Time</span>
              <div className="slot-grid">
                {SLOTS.map((s) => (
                  <button key={s} disabled={!slotOk(s)} className={cx('chip', slot === s && 'active teal')} style={{ justifyContent: 'center', opacity: slotOk(s) ? 1 : 0.4 }} onClick={() => setSlot(s)}>{s}</button>
                ))}
              </div>
            </div>
            {(pets.items || []).length > 0 && (
              <Field label="Which pet?">
                <select className="select" value={petId} onChange={(e) => setPetId(e.target.value)}>
                  {pets.items.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.breed || p.species}</option>)}
                </select>
              </Field>
            )}
            <Field label="What’s going on?" hint="optional">
              <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Scratching his left ear for 3 days, a bit of smell" />
            </Field>
            <Button variant="dark" size="lg" block disabled={!slot || busy} onClick={book}>
              {!user ? 'Sign in to book' : busy ? 'Booking…' : slot ? `Request ${slot} · ${money(vet.price)}` : 'Pick a time'}
            </Button>
            <div className="sub" style={{ textAlign: 'center' }}>You’ll pay after the vet confirms. Free cancellation up to 2 hours before.</div>
          </div>
        )}
      </div>
    </Portal>
  );
}
