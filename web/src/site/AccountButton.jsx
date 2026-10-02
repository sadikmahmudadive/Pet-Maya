import { Link } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { Icon } from '../ui/index.jsx';
import { cx, initials } from '../lib/format.js';
import { isRealUser } from '../data/actions.js';

/**
 * Header account control.
 * Signed in  → the user's own profile photo (initials when there's no photo), opens /profile.
 * Signed out → a neutral person icon, opens /signin.
 *
 * The photo comes from the live `users/{uid}` document first so a change made on
 * /profile (or in the Flutter app) shows up here without a reload; the auth
 * record's photoUrl is the fallback.
 */
export default function AccountButton({ className }) {
  const { user, profile } = useStore();
  const signedIn = !!user;
  const name = profile?.name || user?.name || '';
  const photo = (isRealUser(user) ? profile?.photoUrl || profile?.photoURL || profile?.photo : '') || user?.photoUrl || '';

  if (!signedIn) {
    return (
      <Link to="/signin" className={cx('btn btn-ghost btn-square', className)} aria-label="Sign in">
        <Icon name="user" />
      </Link>
    );
  }

  const label = name ? `${name} — your profile` : 'Your profile';
  return (
    <Link to="/profile" className={cx('hdr-account', className)} aria-label={label} title={label}>
      <span className="hdr-avatar">
        {photo
          ? <img src={photo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          : <span className="hdr-avatar-ini">{initials(name) || <Icon name="user" size={17} />}</span>}
      </span>
    </Link>
  );
}
