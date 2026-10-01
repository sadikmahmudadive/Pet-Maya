import { useEffect, useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useCollection, saveDoc } from '../../data/firestore.js';
import { Icon, Button, Pill, Avatar, Toggle, Segmented } from '../../ui/index.jsx';
import ProductCard from '../ProductCard.jsx';
import { cx, toMillis, ago } from '../../lib/format.js';

export const SAMPLE_DEVICE = {
  id: 'sample-halo', name: 'Maya Halo', petName: 'Milo', batteryLevel: 89, isOnline: true, signalStrength: 4,
  trackingMode: 'Real-time (10 s)', firmwareVersion: 'v3.4.1', latitude: 23.79395, longitude: 90.40328,
  homeLat: 23.7936, homeLng: 90.4029, safeZoneRadius: 350, lastSyncAt: Date.now() - 20000, steps: 4820, stepsGoal: 6700,
  safeZones: [{ name: 'Home', radius: 350, active: true, note: 'Wi-Fi beacon linked' }, { name: 'Gulshan Park', radius: 200, active: false, note: 'Weekdays 6:00 – 9:00 AM' }],
  trail: [{ t: '7:15 AM', title: 'Morning walk', sub: '1.8 km · normal pace' }, { t: '9:30 AM', title: 'Resting at home', sub: 'Until 1:10 PM' }, { t: '2:15 PM', title: 'Backyard play', sub: 'Now · 1.1 km/h' }],
};

export const normDevice = (id, d) => ({
  id, name: d.name || 'Pet tracker', petName: d.petName || '', petId: d.petId || '', batteryLevel: Number(d.batteryLevel ?? 100),
  isOnline: d.isOnline !== false, signalStrength: Number(d.signalStrength ?? 4), trackingMode: d.trackingMode || 'Real-time',
  firmwareVersion: d.firmwareVersion || '', latitude: Number(d.latitude) || 0, longitude: Number(d.longitude) || 0,
  homeLat: Number(d.homeLat ?? d.safeZoneLat ?? d.latitude) || 0, homeLng: Number(d.homeLng ?? d.safeZoneLng ?? d.longitude) || 0,
  safeZoneRadius: Number(d.safeZoneRadius || 350), lastSyncAt: toMillis(d.lastSyncAt || d.updatedAt || d.createdAt),
  lostMode: !!d.lostMode, steps: Number(d.steps || 0), stepsGoal: Number(d.stepsGoal || 0),
  safeZones: Array.isArray(d.safeZones) ? d.safeZones : [{ name: 'Home', radius: Number(d.safeZoneRadius || 350), active: d.isSafeZone !== false }],
  trail: Array.isArray(d.trail) ? d.trail : [],
});

export function metersBetween(aLat, aLng, bLat, bLng) {
  const dy = (bLat - aLat) * 111320;
  const dx = (bLng - aLng) * 111320 * Math.cos((aLat * Math.PI) / 180);
  return { dx, dy, d: Math.hypot(dx, dy) };
}
const bearing = (dx, dy) => ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'][Math.round(((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 / 45) % 8];
const dms = (v, pos, neg) => { const a = Math.abs(v); const d = Math.floor(a); const m = Math.floor((a - d) * 60); const s = ((a - d - m / 60) * 3600).toFixed(1); return `${d}°${m}'${s}"${v >= 0 ? pos : neg}`; };

export default function Gps() {
  const { user, pets, products, toast } = useStore();
  const real = user && !String(user.uid).startsWith('demo_guest');
  const devices = useCollection('devices', { map: normDevice, sample: [normDevice(SAMPLE_DEVICE.id, SAMPLE_DEVICE)], sampleWhenEmpty: !real });
  const myPetIds = new Set((pets.items || []).map((p) => p.id));
  const mine = useMemo(() => {
    const all = devices.items;
    const filtered = real ? all.filter((d) => myPetIds.has(d.petId) || d.ownerId === user.uid) : all;
    return filtered.length ? filtered : (real ? [] : all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.items, real, pets.items]);

  const [devId, setDevId] = useState('');
  const dev = mine.find((d) => d.id === devId) || mine[0];
  const [layer, setLayer] = useState('radar');
  const [zoom, setZoom] = useState(1);
  const [lost, setLost] = useState(false);
  const [jitter, setJitter] = useState({ x: 0, y: 0 });

  useEffect(() => setLost(!!dev?.lostMode), [dev?.id, dev?.lostMode]);
  // Sample device drifts a little so the radar feels alive.
  useEffect(() => {
    if (!dev || devices.live) return undefined;
    const t = setInterval(() => setJitter({ x: (Math.random() - 0.5) * 18, y: (Math.random() - 0.5) * 18 }), 2500);
    return () => clearInterval(t);
  }, [dev, devices.live]);

  const collar = products.items.find((p) => p.category === 'smart-gear');

  if (!dev) {
    return (
      <div className="container page-head">
        <div className="eyebrow">GPS radar</div>
        <h1 className="display-1" style={{ marginTop: 12, maxWidth: '14ch' }}>Always know where they are.</h1>
        <p className="lead" style={{ marginTop: 14 }}>Pair a Maya Halo collar to see live location, set safe zones and get an alert the moment your pet leaves one.</p>
        <div className="row gap-10" style={{ marginTop: 24 }}>
          {collar && <Button variant="dark" icon="bag" to={`/product/${collar.id}`}>Get the collar</Button>}
          <Button variant="outline" icon="phoneDevice" to="/vault">Pair in the app</Button>
        </div>
        {collar && <div style={{ maxWidth: 320, marginTop: 32 }}><ProductCard p={collar} /></div>}
      </div>
    );
  }

  const pet = (pets.items || []).find((p) => p.id === dev.petId || p.name === dev.petName) || { name: dev.petName || 'Your pet' };
  const { dx, dy, d } = metersBetween(dev.homeLat, dev.homeLng, dev.latitude, dev.longitude);
  const radius = dev.safeZoneRadius;
  const inZone = d <= radius;
  const scale = (38 / Math.max(radius * 1.25, d * 1.1, 50)) * zoom; // % of radar width per metre
  const px = Math.max(6, Math.min(94, 50 + dx * scale + jitter.x / 10));
  const py = Math.max(8, Math.min(92, 50 - dy * scale * 1.45 + jitter.y / 10));
  const zonePct = radius * scale * 2;

  const ring = async () => {
    try { if (devices.live) await saveDoc('devices', dev.id, { ringRequestedAt: Date.now() }); toast(`Ringing ${pet.name}’s collar`); }
    catch { toast('Couldn’t reach the collar', { tone: 'error' }); }
  };
  const toggleLost = async (v) => {
    setLost(v);
    try { if (devices.live) await saveDoc('devices', dev.id, { lostMode: v, trackingMode: v ? 'Lost mode (5 s)' : 'Real-time (10 s)' }); }
    catch { setLost(!v); }
    toast(v ? 'Lost mode on — location updates every few seconds' : 'Lost mode off');
  };

  const battery = dev.batteryLevel;
  const daysLeft = Math.round((battery / 100) * 20);

  return (
    <div className="container">
      <div className="crumbs mono" style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase' }}>
        <Link to="/gps">GPS radar</Link><span>/</span><span className="teal">{dev.name}</span>
      </div>
      <div className="row gap-16 wrap" style={{ marginTop: 10 }}>
        <h1 className="display-2">{pet.name}’s live radar</h1>
        <Pill tone={dev.isOnline ? 'teal' : ''} mono><span className={cx('dot', !dev.isOnline && 'grey')} /> {dev.isOnline ? 'Live' : 'Offline'}</Pill>
        {mine.length > 1 && (
          <select className="select" style={{ width: 'auto', height: 36, borderRadius: 999 }} value={dev.id} onChange={(e) => setDevId(e.target.value)} aria-label="Choose collar">
            {mine.map((m) => <option key={m.id} value={m.id}>{m.petName || m.name}</option>)}
          </select>
        )}
      </div>
      <div className="row gap-10 wrap" style={{ marginTop: 16 }}>
        {[['target', 'GPS fix', dev.isOnline ? 'Good signal' : 'Searching'], ['battery', 'Battery', `${battery}% (about ${daysLeft} days)`], ['signal', 'Network', `${'●'.repeat(dev.signalStrength)}${'○'.repeat(Math.max(0, 5 - dev.signalStrength))}`], ['shield', 'Firmware', dev.firmwareVersion || '—']].map(([i, k, v]) => (
          <div key={k} className="card tight row gap-12" style={{ padding: '10px 16px' }}><Icon name={i} className="teal" /><div><div className="stat-label" style={{ fontSize: 9.5 }}>{k}</div><div style={{ fontSize: 14, marginTop: 3 }}>{v}</div></div></div>
        ))}
      </div>

      <div className="split wide-right" style={{ marginTop: 20 }}>
        <div className="stack gap-12">
          <div className="card flush" style={{ borderRadius: 28 }}>
            <div className="radar" style={{ borderRadius: 0 }}>
              <div className="ring" style={{ width: '82%', aspectRatio: '1', height: 'auto' }} />
              <div className="ring" style={{ width: '48%', aspectRatio: '1', height: 'auto' }} />
              <div className="ring" style={{ width: '22%', aspectRatio: '1', height: 'auto' }} />
              <div className="zone" style={{ width: `${zonePct}%`, aspectRatio: '1', height: 'auto' }} />
              <span className="home"><span className="well sm white" style={{ width: 30, height: 30 }}><Icon name="home" size={14} /></span></span>
              {dev.trail.length > 0 && [[-0.35, 0.3], [-0.1, 0.55], [0.15, 0.2]].map(([a, b], i) => <span key={i} className="trail-dot" style={{ left: `${50 + a * zonePct * 0.5}%`, top: `${50 + b * zonePct * 0.5}%` }} />)}
              <div className="pet-dot" style={{ left: `${px}%`, top: `${py}%` }} />
              <span className="map-label dark" style={{ left: `${px}%`, top: `${py + 6}%`, transform: 'translateX(-50%)' }}>{pet.name} · {inZone ? 'in safe zone' : `${Math.round(d)} m away`}</span>
              <span className="compass" style={{ top: 12, left: '50%' }}>N</span>
              <span className="compass" style={{ bottom: 12, left: '50%' }}>S</span>
              <span className="compass" style={{ left: 14, top: '50%' }}>W</span>
              <span className="compass" style={{ right: 14, top: '50%' }}>E</span>

              <div className="card tight row gap-10" style={{ position: 'absolute', left: 16, top: 16, padding: '10px 14px' }}>
                <Avatar name={pet.name} src={pet.photo} />
                <div>
                  <div className="row gap-6"><span className="serif" style={{ fontSize: 17 }}>{pet.name}</span><Pill tone={inZone ? 'teal' : 'red'} mono sm>{inZone ? 'In safe zone' : 'Outside zone'}</Pill></div>
                  <div className="sub" style={{ fontSize: 12 }}>{[pet.breed, pet.weight, dev.name].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
              <div className="row gap-4 hide-sm" style={{ position: 'absolute', right: 16, top: 16, background: '#fff', borderRadius: 999, padding: 4 }}>
                <Segmented items={[{ value: 'radar', label: 'Radar' }, { value: 'map', label: 'Map' }]} value={layer} onChange={(v) => { setLayer(v); if (v === 'map') window.open(`https://www.google.com/maps?q=${dev.latitude},${dev.longitude}`, '_blank', 'noopener'); }} />
              </div>
              <span className="map-label mono" style={{ left: 16, bottom: 16, fontSize: 11 }}><span className="dot" /> {dms(dev.latitude, 'N', 'S')}, {dms(dev.longitude, 'E', 'W')} · updated {ago(dev.lastSyncAt) || 'just now'}</span>
              <div className="stack" style={{ position: 'absolute', right: 16, bottom: 16, background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
                <button className="btn btn-ghost btn-square" onClick={() => setZoom((z) => Math.min(3, z * 1.3))} aria-label="Zoom in"><Icon name="plus" /></button>
                <hr className="divider" />
                <button className="btn btn-ghost btn-square" onClick={() => setZoom((z) => Math.max(0.4, z / 1.3))} aria-label="Zoom out"><Icon name="minus" /></button>
              </div>
            </div>
            <div className="row gap-12 wrap" style={{ padding: 18 }}>
              <Button variant="dark" size="lg" icon="volume" onClick={ring}>Ring the collar</Button>
              <div className="panel row gap-12 grow" style={{ padding: '10px 16px' }}>
                <Icon name="navigation" className="teal" />
                <div><div className="stat-label" style={{ fontSize: 9.5 }}>Distance from home</div><div style={{ fontSize: 14, marginTop: 3 }}>{Math.round(d)} m {d > 5 ? bearing(dx, dy) : ''}</div></div>
              </div>
              <label className="row gap-10" style={{ fontSize: 14 }}>Lost mode <Toggle checked={lost} onChange={toggleLost} label="Lost mode" /></label>
            </div>
          </div>
          <div className="trio">
            {[['clock', 'Update interval', dev.trackingMode], ['signal', 'Connection', dev.isOnline ? 'Online' : 'Offline'], ['pulse', 'Today’s activity', dev.steps ? `${dev.steps.toLocaleString('en-US')} steps` : '—']].map(([i, k, v]) => (
              <div key={k} className="card tight row gap-12"><Icon name={i} className="teal" /><div><div className="stat-label" style={{ fontSize: 9.5 }}>{k}</div><div style={{ fontSize: 14, marginTop: 3 }}>{v}</div></div></div>
            ))}
          </div>
        </div>

        <aside className="stack gap-12">
          <div className="card">
            <div className="card-head"><div className="row gap-8"><Icon name="zap" className="teal" /><h2 className="h-card">Battery</h2></div><Pill mono sm>{battery > 20 ? 'OK' : 'Charge soon'}</Pill></div>
            <div className="row between" style={{ alignItems: 'baseline' }}><span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em' }}>{battery}%</span><span className="sub">≈ {daysLeft} days left</span></div>
            <div className={cx('meter', battery < 20 && 'red')} style={{ marginTop: 10, height: 8 }}><span style={{ width: `${battery}%` }} /></div>
          </div>
          {dev.steps > 0 && (
            <div className="card">
              <div className="card-head"><div className="row gap-8"><Icon name="pulse" className="teal" /><h2 className="h-card">Activity today</h2></div></div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="mini-stat"><div className="k">Steps</div><div className="v mono">{dev.steps.toLocaleString('en-US')}</div>{dev.stepsGoal > 0 && <div className="s">{Math.round((dev.steps / dev.stepsGoal) * 100)}% of goal</div>}</div>
                <div className="mini-stat"><div className="k">Status</div><div className="v mono">{inZone ? 'Home' : 'Out'}</div><div className="s">{inZone ? 'Within safe zone' : 'Outside safe zone'}</div></div>
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-head"><div className="row gap-8"><Icon name="grid" className="teal" /><h2 className="h-card">Safe zones</h2></div><button className="link-plain" style={{ fontSize: 13 }} onClick={() => toast('Add zones from the Pet Maya app')}>+ New zone</button></div>
            <div className="stack gap-8">
              {dev.safeZones.map((z) => (
                <div key={z.name} className="panel row gap-12">
                  <span className={cx('dot', !z.active && 'grey')} />
                  <div className="grow"><b style={{ fontSize: 14 }}>{z.name}</b><div className="sub" style={{ fontSize: 12 }}>Radius {z.radius} m{z.note ? ` · ${z.note}` : ''}</div></div>
                  <Pill tone={z.active ? 'teal' : ''} sm>{z.active ? 'Active' : 'Standby'}</Pill>
                </div>
              ))}
            </div>
            <div className="kv" style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 12 }}><span>Alerts</span><span>Push notification</span></div>
          </div>
          {dev.trail.length > 0 && (
            <div className="card">
              <div className="card-head"><div className="row gap-8"><Icon name="trend" className="teal" /><h2 className="h-card">Today’s trail</h2></div><span className="eyebrow muted">Today</span></div>
              <div className="stack gap-12">
                {dev.trail.map((t) => <div key={t.t} className="row gap-10" style={{ alignItems: 'flex-start' }}><span className="dot grey" style={{ marginTop: 7 }} /><div><b style={{ fontSize: 14 }}>{t.title}</b><div className="sub" style={{ fontSize: 12 }}>{t.t} · {t.sub}</div></div></div>)}
              </div>
            </div>
          )}
        </aside>
      </div>

      <section className="section">
        <div className="card flat row between wrap gap-16" style={{ padding: 24 }}>
          <div className="row gap-8 wrap">
            {['Water-resistant', 'Wireless charging', 'Lightweight clasp', 'Works across Bangladesh'].map((t) => <Pill key={t} className="outline" style={{ height: 32, background: '#fff' }}>{t}</Pill>)}
          </div>
          <div className="row gap-12"><span className="sub">Help with your collar?</span><Button variant="outline" icon="phone" to="mailto:support@petmaya.app">Contact support</Button></div>
        </div>
      </section>
    </div>
  );
}
