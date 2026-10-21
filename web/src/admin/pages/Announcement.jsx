import { useEffect, useMemo, useRef, useState } from 'react';
import { useDoc } from '../../data/firestore.js';
import { PageHead } from '../AdminApp.jsx';
import { saveRecord } from '../erp.js';
import { Button, Field, Toggle, Pill, Icon } from '../../ui/index.jsx';
import { useStore } from '../../lib/store.jsx';
import AnnouncementBar from '../../site/AnnouncementBar.jsx';
import {
  MAX_MESSAGES, MAX_TEXT, MIN_ROTATE, MAX_ROTATE,
  cleanLink, contrastRatio, normalizeAnnouncement,
} from '../../lib/announcement.js';

const THEME_BG = '#14161c';
const THEME_INK = '#ffffff';
const newId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const blank = () => ({ id: newId(), text: '', linkUrl: '', active: true, startAt: null, endAt: null });

// <input type="datetime-local"> works in local time without a zone.
const toLocalInput = (ms) => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const fromLocalInput = (v) => { const t = v ? new Date(v).getTime() : NaN; return Number.isFinite(t) ? t : null; };

function statusOf(m, now) {
  if (!m.active) return ['Off', ''];
  if (m.startAt && now < m.startAt) return ['Scheduled', 'yellow'];
  if (m.endAt && now >= m.endAt) return ['Ended', 'red'];
  return ['Live', 'teal'];
}

function ColorPick({ label, value, fallback, onChange }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="row gap-8">
        <input
          type="color" aria-label={label} value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 44, height: 36, padding: 2, border: '1px solid var(--line)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
        />
        <span className="mono" style={{ fontSize: 13 }}>{value || 'Theme default'}</span>
        {value && <Button variant="outline" size="sm" onClick={() => onChange('')}>Use theme</Button>}
      </div>
    </div>
  );
}

export default function Announcement() {
  const { toast, user } = useStore();
  const { data: doc, loading } = useDoc('settings', 'announcement');
  const [f, setF] = useState(() => normalizeAnnouncement(null));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);
  const now = Date.now();

  // Follow the saved copy only when IT changes and there are no unsaved edits. (Depending on `dirty` here would
  // snap the form back to the old copy for a moment right after saving, before the database update arrives.)
  const dirtyRef = useRef(false);
  const markDirty = (v) => { dirtyRef.current = v; setDirty(v); };
  useEffect(() => { if (!dirtyRef.current && !loading) setF(normalizeAnnouncement(doc)); }, [doc, loading]);

  const set = (patch) => { setF((x) => ({ ...x, ...patch })); markDirty(true); setErrors([]); };
  const setMsg = (id, patch) => set({ messages: f.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const move = (idx, dir) => {
    const to = idx + dir;
    if (to < 0 || to >= f.messages.length) return;
    const list = [...f.messages];
    [list[idx], list[to]] = [list[to], list[idx]];
    set({ messages: list });
  };
  const setRight = (patch) => set({ rightLink: { ...f.rightLink, ...patch } });

  // What the website would show for this draft (empty and unsafe entries already removed).
  const preview = useMemo(() => normalizeAnnouncement(f), [f]);

  const problems = () => {
    const out = [];
    f.messages.forEach((m, i) => {
      if (!m.text.trim()) return;
      if (m.linkUrl.trim() && !cleanLink(m.linkUrl)) out.push(`Message ${i + 1}: the link must start with / (a page on this site) or https://.`);
      if (m.startAt && m.endAt && m.endAt <= m.startAt) out.push(`Message ${i + 1}: the end time must be after the start time.`);
    });
    if (f.rightLink.enabled) {
      if (!f.rightLink.text.trim()) out.push('Right-hand link: add the text to show.');
      if (!cleanLink(f.rightLink.url)) out.push('Right-hand link: the link must start with / or https://.');
    }
    return out;
  };

  const save = async () => {
    const found = problems();
    if (found.length) { setErrors(found); toast('Fix the highlighted problems first', { tone: 'error' }); return; }
    setBusy(true);
    try {
      const clean = normalizeAnnouncement(f);
      await saveRecord('settings', 'announcement', {
        enabled: clean.enabled,
        messages: clean.messages,
        rotateSeconds: clean.rotateSeconds,
        bgColor: clean.bgColor,
        textColor: clean.textColor,
        dismissible: clean.dismissible,
        rightLink: { enabled: f.rightLink.enabled, text: f.rightLink.text.trim().slice(0, 40), url: cleanLink(f.rightLink.url) },
        updatedBy: user?.name || user?.email || 'admin',
      });
      setF({ ...clean, rightLink: { ...f.rightLink, url: cleanLink(f.rightLink.url) } });
      markDirty(false);
      toast('Announcement bar saved — it is live on the website now');
    } catch { toast('Couldn’t save — only admins and managers can change this', { tone: 'error' }); }
    setBusy(false);
  };

  const resetDefaults = () => {
    if (!window.confirm('Replace everything here with the original messages and settings?')) return;
    setF(normalizeAnnouncement(null));
    markDirty(true);
  };

  const ratio = f.bgColor && f.textColor ? contrastRatio(f.bgColor, f.textColor) : null;
  const liveCount = preview.messages.filter((m) => m.active && (!m.startAt || now >= m.startAt) && (!m.endAt || now < m.endAt)).length;

  return (
    <>
      <PageHead eyebrow="Storefront" title="Announcement bar">
        {dirty && <Pill sm>Unsaved changes</Pill>}
        <Button variant="outline" icon="rotate" onClick={resetDefaults}>Restore original</Button>
        <Button variant="dark" icon="check" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : 'Save & publish'}</Button>
      </PageHead>

      <div className="card flush" style={{ overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ padding: '14px 18px 10px' }}>
          <h2 className="h-card" style={{ fontSize: 16 }}>Live preview</h2>
          <div className="sub">The thin bar at the very top of every page. Updates as you type; links are switched off here.</div>
        </div>
        {f.enabled && preview.messages.some((m) => m.active)
          ? <AnnouncementBar config={{ ...preview, enabled: true }} preview ignoreSchedule />
          : <div className="muted" style={{ padding: '18px', background: 'var(--sunk)', fontSize: 14 }}>
            {f.enabled ? 'No message is switched on, so the bar will be hidden.' : 'The bar is switched off, so visitors will not see it.'}
          </div>}
      </div>

      {errors.length > 0 && (
        <div className="card" role="alert" style={{ borderColor: 'var(--red, #c0392b)', marginBottom: 18 }}>
          <b>Please fix:</b>
          <ul style={{ margin: '6px 0 0 18px' }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="adm-grid-2">
        <div className="card">
          <div className="row between wrap gap-8">
            <div>
              <h2 className="h-card">Messages</h2>
              <div className="sub">They take turns, one at a time. {liveCount} of {preview.messages.length} live right now.</div>
            </div>
            <Button variant="outline" size="sm" icon="plus" disabled={f.messages.length >= MAX_MESSAGES} onClick={() => set({ messages: [...f.messages, blank()] })}>Add message</Button>
          </div>

          <div className="stack" style={{ gap: 12, marginTop: 14 }}>
            {f.messages.length === 0 && <div className="muted" style={{ fontSize: 14 }}>No messages yet. Add one to show the bar.</div>}
            {f.messages.map((m, idx) => {
              const [label, tone] = statusOf(m, now);
              const linkBad = m.linkUrl.trim() && !cleanLink(m.linkUrl);
              return (
                <div key={m.id} className="card flat" style={{ padding: 14, borderRadius: 16 }}>
                  <div className="row between gap-8">
                    <div className="row gap-8">
                      <Toggle checked={m.active} onChange={(v) => setMsg(m.id, { active: v })} label={`Message ${idx + 1} on`} />
                      <Pill sm tone={tone}>{label}</Pill>
                    </div>
                    <div className="row gap-4">
                      <Button variant="outline" size="sm" icon="chevronLeft" aria-label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} style={{ transform: 'rotate(90deg)' }} />
                      <Button variant="outline" size="sm" icon="chevronRight" aria-label="Move down" disabled={idx === f.messages.length - 1} onClick={() => move(idx, 1)} style={{ transform: 'rotate(90deg)' }} />
                      <Button variant="outline" size="sm" icon="x" aria-label="Delete message" onClick={() => set({ messages: f.messages.filter((x) => x.id !== m.id) })} />
                    </div>
                  </div>
                  <div className="fields" style={{ marginTop: 10 }}>
                    <Field className="full" label="Text" hint={`${m.text.length}/${MAX_TEXT}`}>
                      <input className="input" maxLength={MAX_TEXT} value={m.text} onChange={(e) => setMsg(m.id, { text: e.target.value })} placeholder="e.g. Free delivery over ৳2,500" />
                    </Field>
                    <Field className="full" label="Link" hint="optional · makes the message clickable">
                      <input className="input" value={m.linkUrl} onChange={(e) => setMsg(m.id, { linkUrl: e.target.value })} placeholder="/shop or https://…" aria-invalid={!!linkBad} />
                      {linkBad && <span className="subtle" style={{ color: 'var(--red, #c0392b)', fontSize: 12 }}>Must start with / or https://</span>}
                    </Field>
                    <Field label="Show from" hint="optional">
                      <input className="input" type="datetime-local" value={toLocalInput(m.startAt)} onChange={(e) => setMsg(m.id, { startAt: fromLocalInput(e.target.value) })} />
                    </Field>
                    <Field label="Hide after" hint="optional">
                      <input className="input" type="datetime-local" value={toLocalInput(m.endAt)} onChange={(e) => setMsg(m.id, { endAt: fromLocalInput(e.target.value) })} />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <div className="card">
            <h2 className="h-card">Show &amp; behave</h2>
            <div style={{ marginTop: 10 }}>
              <div className="toggle-row"><span>Show the bar on the website</span><Toggle checked={f.enabled} onChange={(v) => set({ enabled: v })} label="Show bar" /></div>
              <div className="toggle-row"><span>Let visitors close it <span className="subtle">(comes back when you change a message)</span></span><Toggle checked={f.dismissible} onChange={(v) => set({ dismissible: v })} label="Dismissible" /></div>
            </div>
            <div className="fields" style={{ marginTop: 12 }}>
              <Field label="Seconds per message" hint={`${MIN_ROTATE}–${MAX_ROTATE}`}>
                <input className="input" type="number" min={MIN_ROTATE} max={MAX_ROTATE} value={f.rotateSeconds} onChange={(e) => set({ rotateSeconds: e.target.value === '' ? '' : Number(e.target.value) })} />
              </Field>
            </div>
          </div>

          <div className="card">
            <h2 className="h-card">Colours</h2>
            <div className="sub" style={{ marginBottom: 12 }}>Leave both on “Theme default” to follow light and dark mode automatically.</div>
            <div className="row gap-24 wrap">
              <ColorPick label="Background" value={f.bgColor} fallback={THEME_BG} onChange={(v) => set({ bgColor: v })} />
              <ColorPick label="Text" value={f.textColor} fallback={THEME_INK} onChange={(v) => set({ textColor: v })} />
            </div>
            {(f.bgColor || f.textColor) && !(f.bgColor && f.textColor) && (
              <div className="row gap-8" style={{ marginTop: 12, fontSize: 13 }}><Icon name="alertCircle" size={15} /> Set both colours: the other one still follows the theme and can become unreadable in dark mode.</div>
            )}
            {ratio !== null && ratio < 4.5 && (
              <div className="row gap-8" style={{ marginTop: 12, fontSize: 13, color: 'var(--red, #c0392b)' }}><Icon name="alertCircle" size={15} /> Low contrast ({ratio}:1). Text needs at least 4.5:1 to be easy to read.</div>
            )}
            {ratio !== null && ratio >= 4.5 && <div className="subtle" style={{ marginTop: 12, fontSize: 13 }}>Contrast {ratio}:1 — readable.</div>}
          </div>

          <div className="card">
            <h2 className="h-card">Right-hand link</h2>
            <div className="sub">Shown on the right on tablets and desktops (hidden on phones to leave room for the message).</div>
            <div className="toggle-row" style={{ marginTop: 10 }}><span>Show it</span><Toggle checked={f.rightLink.enabled} onChange={(v) => setRight({ enabled: v })} label="Show right link" /></div>
            <div className="fields" style={{ marginTop: 8 }}>
              <Field label="Text" hint="max 40"><input className="input" maxLength={40} value={f.rightLink.text} onChange={(e) => setRight({ text: e.target.value })} placeholder="Track order →" /></Field>
              <Field label="Link"><input className="input" value={f.rightLink.url} onChange={(e) => setRight({ url: e.target.value })} placeholder="/account/orders" /></Field>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

