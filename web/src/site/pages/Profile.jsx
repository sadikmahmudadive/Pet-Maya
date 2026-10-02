import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Icon, Button, Pill, Field, Well, Empty, Avatar, ThemeToggle } from '../../ui/index.jsx';
import { cx, money, num, shortDate, initials } from '../../lib/format.js';
import { isRealUser } from '../../data/actions.js';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../config/firebase';
import { Reveal } from '../../lib/motion.jsx';

const MAX_PHOTO = 4 * 1024 * 1024; // 4 MB

/** Profile photo with an in-place change control. */
function PhotoPicker({ user, photo, name, onPicked, real }) {
  const { toast } = useStore();
  const input = useRef(null);
  const [busy, setBusy] = useState(0);
  const [preview, setPreview] = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Please choose an image file', { tone: 'error' }); return; }
    if (file.size > MAX_PHOTO) { toast('That image is over 4 MB — please pick a smaller one', { tone: 'error' }); return; }

    const local = URL.createObjectURL(file);
    setPreview(local);

    if (!real) { // demo session — keep the local preview only
      await onPicked(local);
      toast('Photo updated for this demo session');
      return;
    }

    setBusy(1);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const r = ref(storage, `avatars/${user.uid}/profile_${Date.now()}.${ext}`);
      const task = uploadBytesResumable(r, file);
      task.on('state_changed', (s) => setBusy(Math.max(1, Math.round((s.bytesTransferred / s.totalBytes) * 100))));
      await task;
      const url = await getDownloadURL(r);
      await onPicked(url);
      toast('Profile photo updated');
    } catch (err) {
      console.warn('[Profile] photo upload failed:', err);
      toast('Couldn’t upload that photo — please try again', { tone: 'error' });
      setPreview('');
    } finally {
      setBusy(0);
    }
  };

  const shown = preview || photo;
  return (
    <div className="pf-photo">
      <span className={cx('pf-photo-ring', busy && 'busy')}>
        {shown
          ? <img src={shown} alt={`${name || 'Your'} profile photo`} />
          : <span className="pf-photo-ini">{initials(name) || <Icon name="user" size={30} />}</span>}
        {!!busy && <span className="pf-photo-progress">{busy}%</span>}
      </span>
      <input ref={input} type="file" accept="image/*" onChange={pick} hidden aria-hidden="true" tabIndex={-1} />
      <div className="row gap-8 wrap" style={{ justifyContent: 'center' }}>
        <Button variant="outline" size="sm" icon="image" disabled={!!busy} onClick={() => input.current?.click()}>
          {shown ? 'Change photo' : 'Add a photo'}
        </Button>
        {shown && !busy && (
          <button type="button" className="link-plain" style={{ fontSize: 13 }} onClick={async () => { setPreview(''); await onPicked(''); }}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, profile, pets, myOrders, localOrders, wishlist, toast } = useStore();
  const { updateUserProfile, logout } = useAuth() || {};
  const { navigate } = useRouter();
  const real = isRealUser(user);

  const live = real ? profile || {} : {};
  const name = live.name || user?.name || '';
  const photo = live.photoUrl || live.photoURL || live.photo || user?.photoUrl || '';
  const points = live.points ?? user?.points ?? 0;
  const referral = live.referralCode || user?.referralCode || '';

  const [f, setF] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Keep the form in step with the live document until the parent starts typing.
  useEffect(() => {
    if (dirty) return;
    setF({
      name: live.name || user?.name || '',
      phone: live.phone || user?.phone || '',
      address: live.address || user?.address || '',
    });
  }, [live.name, live.phone, live.address, user?.name, user?.phone, user?.address, dirty]);

  const orders = useMemo(() => {
    const list = real ? myOrders.items || [] : localOrders || [];
    return [...list].sort((a, b) => (b.placedAt || 0) - (a.placedAt || 0));
  }, [real, myOrders.items, localOrders]);

  const set = (k) => (e) => { setDirty(true); setF((p) => ({ ...p, [k]: e.target.value })); };

  const save = async (e) => {
    e.preventDefault();
    if (!updateUserProfile) return;
    setSaving(true);
    try {
      await updateUserProfile({ name: f.name.trim(), phone: f.phone.trim(), address: f.address.trim() });
      setDirty(false);
      toast('Profile saved');
    } catch (err) {
      console.warn('[Profile] save failed:', err);
      toast('Couldn’t save your details — please try again', { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const savePhoto = async (url) => {
    if (!updateUserProfile) return;
    try { await updateUserProfile({ photoUrl: url }); }
    catch (err) { console.warn('[Profile] photo save failed:', err); throw err; }
  };

  const signOut = async () => {
    try { await logout?.(); } catch { /* ignore */ }
    navigate('/');
  };

  if (!user) {
    return (
      <div className="container" style={{ paddingTop: 48, maxWidth: 560 }}>
        <div className="card">
          <Empty icon="user" title="Sign in to see your profile">
            Your details, pets, orders and care points all live here.
            <div style={{ marginTop: 16 }}><Button variant="dark" to="/signin?next=/profile">Sign in</Button></div>
          </Empty>
        </div>
      </div>
    );
  }

  const quick = [
    { to: '/dashboard', icon: 'grid', label: 'My dashboard', sub: 'Today’s care at a glance' },
    { to: '/vault', icon: 'shield', label: 'Health vault', sub: 'Records, vaccines & pets' },
    { to: '/account/orders', icon: 'truck', label: 'Orders', sub: `${orders.length} placed` },
    { to: '/shop?saved=1', icon: 'heart', label: 'Saved items', sub: `${(wishlist || []).length} saved` },
    { to: '/specialists', icon: 'video', label: 'Book a vet', sub: 'Video or clinic visit' },
    { to: '/gps', icon: 'navigation', label: 'GPS radar', sub: 'Collars & locations' },
  ];

  return (
    <div className="container page-head">
      {!real && (
        <div className="card row between wrap gap-12" style={{ background: 'var(--yellow-tint)', borderColor: 'transparent', marginBottom: 20 }}>
          <span style={{ fontSize: 14 }}><b>You’re in a demo session.</b> Changes here stay on this device until you sign in.</span>
          <Button variant="dark" size="sm" to="/signin?next=/profile">Sign in</Button>
        </div>
      )}

      <div className="eyebrow"><span className="dot" /> Your account</div>
      <h1 className="display-2" style={{ marginTop: 10 }}>{name || 'Your profile'}</h1>
      <p className="muted" style={{ marginTop: 6 }}>Your photo, contact details and everything tied to your Pet Maya account.</p>

      <div className="pf-grid">
        <Reveal className="card pf-ident">
          <PhotoPicker user={user} photo={photo} name={name} onPicked={savePhoto} real={real} />
          <div className="pf-ident-name">{name || 'Pet parent'}</div>
          <div className="sub" style={{ wordBreak: 'break-word' }}>{live.email || user?.email || '—'}</div>
          <div className="row gap-6 wrap" style={{ justifyContent: 'center', marginTop: 12 }}>
            <Pill tone="teal" icon="sparkles">{num(points)} care points</Pill>
            {real ? <Pill icon="check">Verified</Pill> : <Pill>Demo</Pill>}
          </div>

          {referral && (
            <div className="pf-referral">
              <div className="eyebrow muted">Invite a friend</div>
              <div className="row between gap-8" style={{ marginTop: 8 }}>
                <b className="mono" style={{ fontSize: 15, letterSpacing: '.08em' }}>{referral}</b>
                <button
                  type="button"
                  className="link-plain"
                  style={{ fontSize: 13 }}
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(referral); toast('Referral code copied'); }
                    catch { toast('Couldn’t copy — select the code instead', { tone: 'error' }); }
                  }}
                >Copy</button>
              </div>
              <div className="sub" style={{ marginTop: 6 }}>They get 10% off their first order, you get care points.</div>
            </div>
          )}

          <div className="pf-theme">
            <div className="eyebrow muted" style={{ marginBottom: 8 }}>Appearance</div>
            <ThemeToggle mode="segmented" />
          </div>
        </Reveal>

        <div className="pf-main">
          <Reveal as="form" className="card" onSubmit={save}>
            <div className="card-head">
              <div>
                <b>Your details</b>
                <div className="sub">Used for delivery, prescriptions and vet appointments.</div>
              </div>
              {dirty && <Pill tone="yellow">Unsaved</Pill>}
            </div>
            <div className="fields" style={{ marginTop: 18 }}>
              <Field className="full" label="Full name" value={f.name} onChange={set('name')} placeholder="e.g. Nusrat Rahman" />
              <Field label="Phone" hint="for delivery updates" value={f.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" inputMode="tel" />
              <Field label="Email" hint="can’t be changed here" value={live.email || user?.email || ''} disabled />
              <Field className="full" label="Delivery address" value={f.address} onChange={set('address')} placeholder="House, road, area, city" />
            </div>
            <div className="row gap-8 wrap" style={{ marginTop: 20 }}>
              <Button type="submit" variant="dark" disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save changes'}</Button>
              {dirty && <Button variant="ghost" onClick={() => setDirty(false)}>Discard</Button>}
            </div>
          </Reveal>

          <Reveal className="card">
            <div className="card-head">
              <div><b>Your pets</b><div className="sub">{(pets.items || []).length ? 'Tap a pet to open its health record.' : 'No pets added yet.'}</div></div>
              <Link to="/vault" className="link-plain" style={{ fontSize: 13 }}>Manage →</Link>
            </div>
            {(pets.items || []).length ? (
              <div className="pf-pets">
                {pets.items.map((p) => (
                  <Link key={p.id} to="/vault" className="pf-pet">
                    <Avatar name={p.name} src={p.photoUrl || p.photo} tone="teal" />
                    <span className="pf-pet-txt">
                      <b>{p.name}</b>
                      <span className="sub">{[p.breed, p.age && `${p.age}`].filter(Boolean).join(' · ') || p.species || 'Pet'}</span>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 14 }}><Button variant="outline" icon="plus" to="/vault">Add a pet</Button></div>
            )}
          </Reveal>

          <Reveal className="card">
            <div className="card-head">
              <div><b>Recent orders</b><div className="sub">{orders.length ? `${orders.length} order${orders.length > 1 ? 's' : ''} on this account.` : 'Nothing ordered yet.'}</div></div>
              <Link to="/account/orders" className="link-plain" style={{ fontSize: 13 }}>All orders →</Link>
            </div>
            {orders.length ? (
              <div className="pf-orders">
                {orders.slice(0, 4).map((o) => (
                  <Link key={o.id || o.orderId} to={`/account/orders/${o.id || o.orderId}`} className="pf-order">
                    <Well icon="bag" size="sm" round iconSize={14} />
                    <span className="pf-order-txt">
                      <b className="mono" style={{ fontSize: 13 }}>{o.id || o.orderId}</b>
                      <span className="sub">{shortDate(o.placedAt)} · {(o.items || []).length} item{(o.items || []).length === 1 ? '' : 's'}</span>
                    </span>
                    <span className="pf-order-end">
                      <b>{money(o.total)}</b>
                      <Pill sm>{o.status}</Pill>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 14 }}><Button variant="outline" icon="bag" to="/shop">Start shopping</Button></div>
            )}
          </Reveal>

          <Reveal className="card">
            <div className="card-head"><div><b>Shortcuts</b><div className="sub">Everything else on your account.</div></div></div>
            <div className="pf-quick">
              {quick.map((q) => (
                <Link key={q.to} to={q.to} className="pf-quick-item">
                  <Well icon={q.icon} size="sm" round iconSize={15} />
                  <span><b>{q.label}</b><span className="sub">{q.sub}</span></span>
                </Link>
              ))}
            </div>
          </Reveal>

          <div className="card row between wrap gap-12">
            <div>
              <b>Sign out</b>
              <div className="sub">You’ll stay signed in on your phone.</div>
            </div>
            <Button variant="outline" icon="logout" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
