import { useState, useRef, useEffect } from 'react';
import { Link } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { Icon } from '../ui/index.jsx';
import { cx, initials } from '../lib/format.js';
import { isRealUser } from '../data/actions.js';
import { useApp } from '../context/AppContext.jsx';
import { auth, signOut } from '../config/firebase.js';

export default function AccountButton({ className }) {
  const { user, profile } = useStore();
  const { openModal } = useApp();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const signedIn = !!user;
  const name = profile?.name || user?.name || '';
  const photo = (isRealUser(user) ? profile?.photoUrl || profile?.photoURL || profile?.photo : '') || user?.photoUrl || '';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!signedIn) {
    return (
      <Link to="/signin" className={cx('btn btn-ghost btn-square', className)} aria-label="Sign in">
        <Icon name="user" />
      </Link>
    );
  }

  const label = name ? `${name} — account menu` : 'Account menu';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cx('hdr-account', className)}
        aria-label={label}
        title={label}
        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
      >
        <span className="hdr-avatar">
          {photo
            ? <img src={photo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            : <span className="hdr-avatar-ini">{initials(name) || <Icon name="user" size={17} />}</span>}
        </span>
      </button>

      {open && (
        <div
          className="card shadow-lg stack gap-4"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 230,
            padding: 8,
            zIndex: 100,
            background: 'var(--surface)',
            border: '1px solid var(--line-2)',
            borderRadius: 18,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{name || 'Pet Parent'}</div>
            <div className="sub ellipsis" style={{ fontSize: 11.5, marginTop: 2 }}>{user?.email || 'Connected Guardian'}</div>
          </div>

          <Link to="/profile" className="btn btn-ghost" style={{ justifyContent: 'flex-start', height: 36, fontSize: 13, gap: 10 }} onClick={() => setOpen(false)}>
            <Icon name="user" size={15} /> My Profile
          </Link>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start', height: 36, fontSize: 13, gap: 10, color: 'var(--ink)' }}
            onClick={() => {
              setOpen(false);
              if (openModal) openModal('myDevices');
            }}
          >
            <Icon name="phoneDevice" size={15} className="teal" /> My Devices
          </button>

          <Link to="/dashboard" className="btn btn-ghost" style={{ justifyContent: 'flex-start', height: 36, fontSize: 13, gap: 10 }} onClick={() => setOpen(false)}>
            <Icon name="grid" size={15} /> My Dashboard
          </Link>

          <Link to="/vault" className="btn btn-ghost" style={{ justifyContent: 'flex-start', height: 36, fontSize: 13, gap: 10 }} onClick={() => setOpen(false)}>
            <Icon name="lock" size={15} /> Health Vault
          </Link>

          <Link to="/account/orders" className="btn btn-ghost" style={{ justifyContent: 'flex-start', height: 36, fontSize: 13, gap: 10 }} onClick={() => setOpen(false)}>
            <Icon name="bag" size={15} /> My Orders
          </Link>

          <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 4 }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', height: 36, fontSize: 13, gap: 10, color: 'var(--red)', width: '100%' }}
              onClick={() => {
                setOpen(false);
                if (signOut && auth) signOut(auth);
              }}
            >
              <Icon name="logout" size={15} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
