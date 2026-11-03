import { useEffect, useMemo, useState } from 'react';
import { useCollection, saveDoc } from '../../data/firestore.js';
import { useSupportContact } from '../../data/support.js';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Empty, Avatar, Field } from '../../ui/index.jsx';
import { cx, ago } from '../../lib/format.js';
import { cleanContactForm, telHref, whatsappHref } from '../../lib/contact.js';
import { useStore } from '../../lib/store.jsx';
import { supportReply, supportSetStatus, supportMarkRead } from '../../data/actions.js';

const STATUS = {
  open: { label: 'Open', tone: 'red' },
  in_progress: { label: 'In progress', tone: 'yellow' },
  resolved: { label: 'Resolved', tone: 'teal' },
};
const FILTERS = [['all', 'All'], ['open', 'Open'], ['in_progress', 'In progress'], ['resolved', 'Resolved']];

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function Support() {
  const { toast } = useStore();
  const [tab, setTab] = useState('tickets'); // 'tickets' | 'feedback' | 'contact'
  const [filter, setFilter] = useState('open');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const ticketsQuery = useCollection('support_tickets', { sampleWhenEmpty: false });
  const feedbackQuery = useCollection('app_feedback', { sampleWhenEmpty: false });

  const tickets = useMemo(
    () => [...(ticketsQuery.items || [])].sort((a, b) => (b.lastMessageAt || b.createdAt || 0) - (a.lastMessageAt || a.createdAt || 0)),
    [ticketsQuery.items],
  );
  const counts = useMemo(() => {
    const c = { all: tickets.length, open: 0, in_progress: 0, resolved: 0 };
    tickets.forEach((t) => { if (c[t.status] != null) c[t.status] += 1; });
    return c;
  }, [tickets]);
  const waiting = tickets.filter((t) => t.unreadForStaff && t.status !== 'resolved').length;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tickets.filter((t) => (filter === 'all' || t.status === filter)
      && (!needle || [t.subject, t.ownerName, t.ownerEmail, t.orderNumber, t.message].some((v) => String(v || '').toLowerCase().includes(needle))));
  }, [tickets, filter, q]);

  const selected = tickets.find((t) => t.id === selectedId) || null;
  const thread = useCollection(selected ? `support_tickets/${selected.id}/messages` : 'support_tickets', {
    enabled: !!selected, sampleWhenEmpty: false,
  });
  const messages = useMemo(
    () => (selected ? [...(thread.items || [])].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)) : []),
    [thread.items, selected],
  );

  // Opening a ticket clears its "new" flag for the team.
  useEffect(() => {
    if (selected?.unreadForStaff) supportMarkRead(selected.id);
  }, [selected?.id, selected?.unreadForStaff]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    const text = draft.trim();
    if (!selected || !text || busy) return;
    setBusy(true);
    const res = await supportReply(selected.id, text);
    setBusy(false);
    if (res.ok) { setDraft(''); toast('Reply sent. The customer was notified.'); } else toast(res.message, { tone: 'error' });
  };
  const setStatus = async (status) => {
    if (!selected) return;
    const res = await supportSetStatus(selected.id, status);
    toast(res.ok ? `Marked ${STATUS[status].label.toLowerCase()}` : res.message, res.ok ? undefined : { tone: 'error' });
  };

  const feedback = useMemo(
    () => [...(feedbackQuery.items || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [feedbackQuery.items],
  );
  const avg = feedback.length ? feedback.reduce((a, f) => a + (f.rating || 0), 0) / feedback.length : 0;

  return (
    <>
      <PageHead eyebrow="Customer care" title="Support center">
        <Pill tone={waiting ? 'red' : 'teal'}><Icon name="bell" size={13} /> {waiting ? `${waiting} waiting for a reply` : 'All caught up'}</Pill>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Open tickets" value={counts.open} icon="alert" note={`${counts.in_progress} in progress`} />
        <Stat label="Resolved" value={counts.resolved} icon="check" note={`of ${counts.all} tickets`} />
        <Stat label="App rating" value={feedback.length ? avg.toFixed(1) : '—'} icon="star" note={`${feedback.length} feedback ${feedback.length === 1 ? 'entry' : 'entries'}`} />
      </div>

      <div className="card tight" style={{ marginTop: 20 }}>
        <div className="row gap-4" style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)' }}>
          <button type="button" className={cx('btn btn-sm', tab === 'tickets' ? 'btn-teal' : 'btn-ghost')} onClick={() => setTab('tickets')}>Tickets ({counts.all})</button>
          <button type="button" className={cx('btn btn-sm', tab === 'feedback' ? 'btn-teal' : 'btn-ghost')} onClick={() => setTab('feedback')}>App feedback ({feedback.length})</button>
          <button type="button" className={cx('btn btn-sm', tab === 'contact' ? 'btn-teal' : 'btn-ghost')} onClick={() => setTab('contact')}>Contact details</button>
        </div>

        {tab === 'contact' && <ContactDetails />}

        {tab === 'tickets' && (
          <div className="row" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 340px', maxWidth: 460, borderRight: '1px solid var(--line)', minWidth: 0 }}>
              <div className="stack gap-8" style={{ padding: 12 }}>
                <input className="input" placeholder="Search subject, name, email, order…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tickets" />
                <div className="row gap-4 wrap">
                  {FILTERS.map(([v, label]) => (
                    <button key={v} type="button" className={cx('btn btn-sm', filter === v ? 'btn-dark' : 'btn-ghost')} onClick={() => setFilter(v)}>{label} ({counts[v]})</button>
                  ))}
                </div>
              </div>
              {shown.length === 0 ? (
                <Empty icon="mail" title="No tickets here">{tickets.length ? 'Try another filter.' : 'Customers’ requests from the app will appear here.'}</Empty>
              ) : shown.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedId(t.id); setDraft(''); }}
                  className="row gap-10"
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px', borderTop: '1px solid var(--line)',
                    background: t.id === selected?.id ? 'var(--sunk)' : 'transparent', alignItems: 'flex-start',
                  }}
                >
                  <Avatar name={t.ownerName || t.ownerEmail || '?'} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row between gap-8">
                      <b className="ellipsis" style={{ fontSize: 14 }}>{t.subject}</b>
                      <span className="sub" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{ago(t.lastMessageAt || t.createdAt)}</span>
                    </div>
                    <div className="sub ellipsis" style={{ fontSize: 12 }}>{t.ownerName || 'Customer'} · {t.category}{t.orderNumber ? ` · ${t.orderNumber}` : ''}</div>
                    <div className="row gap-6" style={{ marginTop: 6 }}>
                      <Pill tone={(STATUS[t.status] || STATUS.open).tone} sm>{(STATUS[t.status] || STATUS.open).label}</Pill>
                      {t.unreadForStaff && <Pill tone="red" sm>New reply</Pill>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ flex: '2 1 380px', minWidth: 0, padding: 16 }}>
              {!selected ? (
                <Empty icon="mail" title="Select a ticket">Pick a conversation on the left to read and reply.</Empty>
              ) : (
                <div className="stack gap-14">
                  <div className="row between wrap gap-10">
                    <div style={{ minWidth: 0 }}>
                      <h2 className="serif" style={{ fontSize: 22 }}>{selected.subject}</h2>
                      <div className="sub" style={{ fontSize: 12 }}>
                        {selected.ownerName || 'Customer'}{selected.ownerEmail ? ` · ${selected.ownerEmail}` : ''}{selected.ownerPhone ? ` · ${selected.ownerPhone}` : ''}
                      </div>
                      <div className="sub" style={{ fontSize: 12 }}>
                        {selected.category}{selected.orderNumber ? ` · Order ${selected.orderNumber}` : ''}{selected.platform ? ` · ${selected.platform}` : ''}{selected.appVersion ? ` · app ${selected.appVersion}` : ''}
                      </div>
                    </div>
                    <div className="row gap-4 wrap">
                      {Object.entries(STATUS).map(([v, s]) => (
                        <button key={v} type="button" className={cx('btn btn-sm', selected.status === v ? 'btn-teal' : 'btn-outline')} onClick={() => setStatus(v)} disabled={selected.status === v}>{s.label}</button>
                      ))}
                    </div>
                  </div>

                  <Bubble who={selected.ownerName || 'Customer'} when={selected.createdAt} text={selected.message} image={selected.imageUrl} />
                  {messages.map((m) => (
                    <Bubble key={m.id} staff={m.senderRole === 'staff'} who={m.senderRole === 'staff' ? 'Support' : (m.senderName || 'Customer')} when={m.createdAt} text={m.text} />
                  ))}

                  <div className="stack gap-8">
                    <textarea
                      className="input"
                      rows={4}
                      maxLength={2000}
                      placeholder="Write a reply. The customer gets a notification in the app."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      aria-label="Reply"
                    />
                    <div className="row between gap-8">
                      <span className="sub" style={{ fontSize: 12 }}>{draft.length}/2000</span>
                      <Button variant="dark" icon="send" onClick={send} disabled={busy || !draft.trim()}>{busy ? 'Sending…' : 'Send reply'}</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'feedback' && (
          <div style={{ padding: 16 }}>
            {feedback.length === 0 ? (
              <Empty icon="star" title="No feedback yet">Ratings and comments sent from the app will appear here.</Empty>
            ) : (
              <div className="stack gap-10">
                {feedback.map((f) => (
                  <div key={f.id} className="card" style={{ padding: 14 }}>
                    <div className="row between wrap gap-8">
                      <span style={{ color: '#E0A526', letterSpacing: 2 }} aria-label={`${f.rating} out of 5`}>{stars(f.rating || 0)}</span>
                      <span className="sub" style={{ fontSize: 12 }}>{ago(f.createdAt)}</span>
                    </div>
                    <div className="row gap-6 wrap" style={{ marginTop: 6 }}>
                      <Pill sm>{f.category || 'Other'}</Pill>
                      {f.platform && <Pill sm>{f.platform}</Pill>}
                      {f.appVersion && <Pill sm>app {f.appVersion}</Pill>}
                    </div>
                    {f.message && <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{f.message}</p>}
                    <div className="sub" style={{ fontSize: 12, marginTop: 6 }}>{f.ownerName || 'Customer'}{f.ownerEmail ? ` · ${f.ownerEmail}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/** The phone, WhatsApp and email the app (Help & Support) and the website show to customers. */
function ContactDetails() {
  const { toast } = useStore();
  const saved = useSupportContact();
  const [form, setForm] = useState({ phone: '', whatsapp: '', email: '', hours: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  // Fill the form once, when the saved values arrive; never overwrite what the admin is typing.
  useEffect(() => {
    if (saved.loading || loadedOnce) return;
    setForm({ phone: saved.phone, whatsapp: saved.whatsapp, email: saved.email, hours: saved.hours });
    setLoadedOnce(true);
  }, [saved.loading, loadedOnce]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };
  const preview = cleanContactForm(form).data;

  const save = async (e) => {
    e.preventDefault();
    const { data, errors: errs } = cleanContactForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await saveDoc('settings', 'support', data);
      toast('Contact details saved. The app and website show them straight away.');
    } catch (err) {
      toast(err?.code === 'permission-denied' ? 'You do not have permission to change this.' : 'Could not save. Try again.', { tone: 'error' });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} style={{ padding: 16, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: 18 }}>
        <p className="muted" style={{ fontSize: 14 }}>
          Customers see these in the app under Help &amp; Support, and on the website. Leave a field empty to hide that button.
        </p>
        <Field label="Phone number" hint="for the Call button" value={form.phone} onChange={set('phone')} placeholder="01712 345678" inputMode="tel" autoComplete="off" />
        {errors.phone && <div className="red" style={{ fontSize: 13, marginTop: -10 }}>{errors.phone}</div>}
        <Field label="WhatsApp number" hint="opens a WhatsApp chat" value={form.whatsapp} onChange={set('whatsapp')} placeholder="01712 345678 or +880 1712 345678" inputMode="tel" autoComplete="off" />
        {errors.whatsapp && <div className="red" style={{ fontSize: 13, marginTop: -8 }}>{errors.whatsapp}</div>}
        <Field label="Support email" hint="defaults to support@petmaya.app" value={form.email} onChange={set('email')} placeholder="support@petmaya.app" inputMode="email" autoComplete="off" />
        {errors.email && <div className="red" style={{ fontSize: 13, marginTop: -8 }}>{errors.email}</div>}
        <Field label="Opening hours" hint="shown next to the buttons" value={form.hours} onChange={set('hours')} placeholder="Sat–Thu, 10am–8pm" maxLength={80} autoComplete="off" />
        <div className="row gap-8">
          <Button type="submit" variant="dark" disabled={busy}>{busy ? 'Saving…' : 'Save contact details'}</Button>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="eyebrow">What customers will see</div>
        <div className="stack gap-10" style={{ marginTop: 12 }}>
          {preview.phone ? <Button variant="outline" icon="phone" to={telHref(preview.phone)}>Call {preview.phone}</Button> : <span className="sub">No phone button</span>}
          {preview.whatsapp
            ? (whatsappHref(preview.whatsapp)
              ? <Button variant="outline" icon="message" to={whatsappHref(preview.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp {preview.whatsapp}</Button>
              : <span className="red" style={{ fontSize: 13 }}>That WhatsApp number is too short to open a chat.</span>)
            : <span className="sub">No WhatsApp button</span>}
          <Button variant="outline" icon="mail" to={`mailto:${preview.email || 'support@petmaya.app'}`}>{preview.email || 'support@petmaya.app'}</Button>
          {preview.hours && <div className="sub">{preview.hours}</div>}
        </div>
        <p className="sub" style={{ marginTop: 14, fontSize: 12 }}>Tip: tap the buttons here to check that the call and chat open correctly before you save.</p>
      </div>
    </form>
  );
}

function Bubble({ who, when, text, image, staff }) {
  return (
    <div style={{ alignSelf: staff ? 'flex-end' : 'flex-start', maxWidth: '88%', marginLeft: staff ? 'auto' : 0 }}>
      <div className="sub" style={{ fontSize: 11, marginBottom: 4, textAlign: staff ? 'right' : 'left' }}>{who} · {ago(when)}</div>
      <div
        className="card"
        style={{ padding: '10px 14px', background: staff ? 'var(--teal-soft, #E4F4F2)' : undefined, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      >
        {text}
        {image && (
          <a href={image} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8 }}>
            <img src={image} alt="Attached by the customer" loading="lazy" style={{ maxWidth: 240, maxHeight: 240, borderRadius: 12 }} />
          </a>
        )}
      </div>
    </div>
  );
}
