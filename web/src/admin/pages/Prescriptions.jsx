import { useEffect, useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useAdmin, useAdminWrite, ADMIN_CONFIG } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { statusUpdate } from './Orders.jsx';
import { Icon, Button, Pill, Stat, Ph, Empty } from '../../ui/index.jsx';
import { timeOfDay, shortDate, cx } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

export default function Prescriptions({ user }) {
  const { rxQueue, orders, live } = useAdmin();
  const write = useAdminWrite();
  const { toast } = useStore();
  const [selId, setSelId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState([]);   // ids decided this session (sample mode)

  const queue = useMemo(() => rxQueue.filter((r) => !done.includes(r.id)).sort((a, b) => (b.waitingMin || 0) - (a.waitingMin || 0)), [rxQueue, done]);
  const rx = queue.find((r) => r.id === selId) || queue[0];
  useEffect(() => { setZoom(1); setRot(0); setMsg(rx ? `Verified by ${user?.name && user.name !== 'Preview' ? user.name : 'our vet'}. Dispatching within ${ADMIN_CONFIG.rxSlaMin} minutes.` : ''); }, [rx?.id]); // eslint-disable-line

  const decidedToday = orders.filter((o) => (o.timeline || []).some((t) => t.at >= dayStart() && (t.status === 'Packing' || t.status === 'Cancelled') && o.hasRx));
  const approved = live.orders ? decidedToday.filter((o) => o.status !== 'Cancelled').length : 64;
  const rejected = live.orders ? decidedToday.filter((o) => o.status === 'Cancelled').length : 5;
  const median = (() => { const w = queue.map((r) => r.waitingMin || 0).sort((a, b) => a - b); return w.length ? w[Math.floor(w.length / 2)] : 0; })();

  const history = rx ? orders.filter((o) => o.customer === rx.uploadedBy && o.docId !== rx.docId).slice(0, 4) : [];

  const decide = async (kind) => {
    if (!rx) return;
    const by = user?.name || 'Vet';
    let ok = true;
    if (rx.docId && rx.order) {
      if (kind === 'approve') ok = await write('orders', rx.docId, { ...statusUpdate('Packing', by), rxStatus: 'approved', rxNote: msg, rxReviewedBy: by }, `${rx.id} approved`);
      if (kind === 'reject') ok = await write('orders', rx.docId, { ...statusUpdate('Cancelled', by), rxStatus: 'rejected', rxNote: msg, rxReviewedBy: by }, `${rx.id} rejected`);
      if (kind === 'clarify') ok = await write('orders', rx.docId, { rxStatus: 'clarification', rxNote: msg, rxReviewedBy: by }, 'Clarification requested');
    } else {
      toast(`${rx.id} ${kind === 'approve' ? 'approved' : kind === 'reject' ? 'rejected' : 'sent back'} (sample data — not stored)`);
    }
    if (ok && kind !== 'clarify') { setDone((d) => [...d, rx.id]); setSelId(null); }
  };

  const checks = rx ? [
    { ok: rx.licence ? true : null, title: 'Vet licence', sub: rx.prescriber ? `${rx.prescriber}${rx.licence ? ` · ${rx.licence}` : ''}` : 'Check the prescriber’s registration on the image' },
    { ok: rx.weightKg ? true : null, title: 'Patient matches record', sub: `${rx.pet}${rx.breed ? ` · ${rx.breed}` : ''}${rx.weightKg ? ` · ${rx.weightKg} kg` : ''}` },
    { ok: rx.flag ? false : rx.dose ? true : null, title: rx.flag || 'Dose within range', sub: rx.dose || 'Compare dose with weight on the prescription' },
    rx.issuedDaysAgo != null
      ? { ok: rx.issuedDaysAgo <= rx.validDays * 0.8 ? true : 'warn', title: rx.issuedDaysAgo <= rx.validDays * 0.8 ? 'Issue date valid' : 'Issue date near limit', sub: `Issued ${rx.issuedDaysAgo} days ago · valid ${rx.validDays} days` }
      : { ok: null, title: 'Issue date', sub: 'Confirm the prescription hasn’t expired' },
  ] : [];

  return (
    <>
      <PageHead eyebrow="Veterinary compliance" title="Prescription review">
        <Button variant="outline" icon="file" to="/admin/orders?status=Rx%20review">All Rx orders</Button>
      </PageHead>
      <div className="stat-grid">
        <Stat label="Waiting" value={queue.length} icon="file" delta={queue.length ? `${queue.filter((r) => r.waitingMin > ADMIN_CONFIG.rxSlaMin).length} over SLA` : '0'} deltaTone={queue.some((r) => r.waitingMin > ADMIN_CONFIG.rxSlaMin) ? 'red' : 'teal'} />
        <Stat label="Median wait" value={`${median} min`} icon="clock" delta={`SLA ${ADMIN_CONFIG.rxSlaMin} min`} />
        <Stat label="Approved today" value={approved} icon="check" note="released to packing" />
        <Stat label="Rejected today" value={rejected} icon="x" note="customer notified" />
      </div>

      {!rx ? (
        <div className="card" style={{ marginTop: 16 }}><Empty icon="check" title="Queue is clear">New prescription orders will appear here.</Empty></div>
      ) : (
        <div className="adm-grid-3" style={{ marginTop: 16 }}>
          <div className="card">
            <h2 className="h-card">Queue</h2>
            <div className="sub" style={{ marginBottom: 14 }}>{queue.length} waiting · SLA {ADMIN_CONFIG.rxSlaMin} min</div>
            <div className="stack gap-8">
              {queue.map((r) => (
                <button key={r.id} className={cx('queue-item', r.id === rx.id && 'on')} onClick={() => setSelId(r.id)}>
                  <span className="well round yellow sm"><Icon name="file" size={14} /></span>
                  <div className="grow" style={{ minWidth: 0 }}><b style={{ fontSize: 14 }}>{r.pet}{r.breed ? ` · ${r.breed}` : ''}</b><div className="sub ellipsis" style={{ fontSize: 12 }}>{r.drug}</div></div>
                  <span className={cx('mono', r.waitingMin > ADMIN_CONFIG.rxSlaMin ? 'red' : '')} style={{ fontSize: 11, color: r.waitingMin > ADMIN_CONFIG.rxSlaMin ? undefined : 'var(--yellow-ink)', fontWeight: 600 }}>{r.waitingMin} min</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div><h2 className="h-card">Prescription · {rx.id}</h2><div className="sub">Uploaded by {rx.uploadedBy} · {timeOfDay(rx.uploadedAt)}{rx.order ? <> · <Link to={`/admin/orders/${encodeURIComponent(rx.docId)}`} className="link-plain">{rx.orderId}</Link></> : ''}</div></div>
            </div>
            <div className="rx-view">
              <div style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transition: 'transform .25s' }}>
                {rx.imageUrl ? <img src={rx.imageUrl} alt={`Prescription ${rx.id}`} /> : <Ph tone="teal" label="prescription image · zoom + rotate" />}
              </div>
            </div>
            <div className="row gap-8 wrap" style={{ marginTop: 12 }}>
              <Button variant="outline" size="sm" icon="zoom" onClick={() => setZoom((z) => (z >= 2 ? 1 : z + 0.5))}>{zoom > 1 ? `${zoom}×` : 'Zoom in'}</Button>
              <Button variant="outline" size="sm" icon="rotate" onClick={() => setRot((r) => r + 90)}>Rotate</Button>
              {rx.imageUrl && <Button variant="outline" size="sm" icon="external" to={rx.imageUrl} target="_blank" rel="noreferrer">Open original</Button>}
            </div>
            <div style={{ marginTop: 14 }}>
              {checks.map((c) => (
                <div key={c.title} className="check-row">
                  <span className={cx('well round sm', c.ok === true ? 'teal' : c.ok === false ? 'red' : c.ok === 'warn' ? 'yellow' : '')} style={{ width: 26, height: 26 }}>
                    <Icon name={c.ok === true ? 'check' : c.ok === false ? 'alert' : c.ok === 'warn' ? 'bell' : 'eye'} size={13} />
                  </span>
                  <div><b style={{ fontSize: 14 }}>{c.title}</b><div className="sub" style={{ fontSize: 12 }}>{c.sub}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="stack gap-16">
            <div className="card">
              <h2 className="h-card">Decision</h2>
              <div className="sub" style={{ marginBottom: 14 }}>{user?.name && user.name !== 'Preview' ? `${user.name} · on shift` : 'Reviewing vet'}</div>
              <div className="stack gap-8">
                <Button variant="dark" size="lg" block icon="check" onClick={() => decide('approve')}>Approve & release</Button>
                <Button variant="outline" block icon="message" onClick={() => decide('clarify')}>Request clarification</Button>
                <Button variant="danger" block icon="x" onClick={() => { if (window.confirm('Reject this prescription? The order will be cancelled.')) decide('reject'); }}>Reject prescription</Button>
              </div>
              <label className="label" style={{ marginTop: 16 }}>Note to customer</label>
              <textarea className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} />
            </div>
            <div className="card">
              <h2 className="h-card">Patient history</h2>
              <div className="sub" style={{ marginBottom: 12 }}>{rx.pet}</div>
              {history.length === 0 ? <div className="sub">No previous orders for this customer.</div> : (
                <div className="stack gap-12">
                  {history.map((h) => (
                    <Link key={h.docId} to={`/admin/orders/${encodeURIComponent(h.docId)}`} className="row gap-10" style={{ alignItems: 'flex-start' }}>
                      <span className="dot" style={{ marginTop: 7 }} />
                      <div><b style={{ fontSize: 13 }}>{h.items.map((i) => i.name).slice(0, 2).join(', ')}</b><div className="sub" style={{ fontSize: 11 }}>{shortDate(h.placedAt)} · {h.status}</div></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
