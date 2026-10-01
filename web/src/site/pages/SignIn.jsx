import { useEffect, useState } from 'react';
import { useRouter } from '../../lib/router.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { auth, sendPasswordResetEmail } from '../../config/firebase';
import { Icon, Button, Ph, Field } from '../../ui/index.jsx';
import { cx } from '../../lib/format.js';
import { TRUST } from '../../data/content.js';

const ERR = {
  'auth/invalid-credential': 'That email and password don’t match.',
  'auth/wrong-password': 'That email and password don’t match.',
  'auth/user-not-found': 'No account with that email yet — create one instead.',
  'auth/email-already-in-use': 'An account with that email already exists. Sign in instead.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/popup-closed-by-user': 'The Google window was closed before finishing.',
};

export default function SignIn() {
  const { query, navigate } = useRouter();
  const { currentUser, loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState(query.get('mode') === 'signup' ? 'signup' : 'signin');
  const [f, setF] = useState({ name: '', email: '', password: '', ref: '' });
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const next = query.get('next') || '/dashboard';

  useEffect(() => { if (currentUser && !String(currentUser.uid).startsWith('demo_guest')) navigate(next, { replace: true }); }, [currentUser, next, navigate]);

  const run = async (fn) => {
    setErr(''); setInfo(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(ERR[e?.code] || 'Something went wrong. Please try again.'); } finally { setBusy(false); }
  };
  const submit = (e) => {
    e.preventDefault();
    run(() => (mode === 'signin' ? loginWithEmail(f.email, f.password) : signupWithEmail(f.name, f.email, f.password, f.ref)));
  };
  const reset = () => {
    if (!f.email) { setErr('Enter your email first, then press “Forgot password?”.'); return; }
    run(async () => { await sendPasswordResetEmail(auth, f.email); setInfo('Check your inbox for a reset link.'); });
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="container">
      <div className="auth-grid">
        <div className="card flat stack gap-20" style={{ padding: 'clamp(24px,3.5vw,44px)', borderRadius: 32, background: 'var(--sunk)' }}>
          <div className="row between" style={{ borderBottom: '1px solid var(--line-2)', paddingBottom: 14 }}>
            <span className="eyebrow"><span className="dot" /> Pet Maya account</span>
          </div>
          <h1 className="display-1" style={{ fontSize: 'clamp(38px,4.2vw,56px)' }}>Calmer, simpler care for the pets you love.</h1>
          <Ph label="photo — pet resting at home" style={{ height: 260, borderRadius: 22 }} />
          <div className="stack gap-10">
            {[['lock', 'Health vault', 'Records, vaccines and prescriptions in one place.'], [TRUST[0].icon, TRUST[0].title, TRUST[0].text], ['video', 'Vets on video', 'Book a consult in minutes from your phone.']].map(([i, t, d]) => (
              <div key={t} className="card row gap-12" style={{ padding: 16 }}><span className="well teal"><Icon name={i} /></span><div><b style={{ fontSize: 15 }}>{t}</b><div className="sub">{d}</div></div></div>
            ))}
          </div>
          <div className="mono subtle" style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>Encrypted connection · You control who sees your pet’s records</div>
        </div>

        <div className="card" style={{ padding: 'clamp(24px,3.5vw,44px)', borderRadius: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="row gap-4" style={{ background: 'var(--sunk)', borderRadius: 14, padding: 4 }}>
            {[['signin', 'Sign in'], ['signup', 'Create account']].map(([k, l]) => (
              <button key={k} className={cx('tab grow')} style={{ justifyContent: 'center', height: 44, borderRadius: 11, background: mode === k ? 'var(--surface)' : 'transparent', boxShadow: mode === k ? 'var(--shadow-sm)' : 'none', color: mode === k ? 'var(--ink)' : 'var(--muted)' }} onClick={() => { setMode(k); setErr(''); }}>{l}</button>
            ))}
          </div>
          <h2 className="display-2" style={{ marginTop: 28, fontSize: 'clamp(28px,3vw,38px)' }}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="muted" style={{ marginTop: 8 }}>{mode === 'signin' ? 'See your pets’ records, orders, bookings and GPS collar.' : 'It takes a minute. Add your pets after you sign up.'}</p>

          <div className="row gap-10" style={{ marginTop: 22 }}>
            <Button variant="outline" size="lg" className="grow" onClick={() => run(loginWithGoogle)} disabled={busy}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
              Continue with Google
            </Button>
          </div>
          <div className="row gap-12 eyebrow muted" style={{ margin: '22px 0', fontSize: 10 }}><hr className="divider grow" />or use email<hr className="divider grow" /></div>

          <form className="stack gap-16" onSubmit={submit}>
            {mode === 'signup' && <Field label="Your name" required value={f.name} onChange={set('name')} autoComplete="name" />}
            <Field label="Email" type="email" required value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
            <div>
              <div className="row between"><span className="label">Password</span>{mode === 'signin' && <button type="button" className="link-plain" style={{ fontSize: 13, marginBottom: 8 }} onClick={reset}>Forgot password?</button>}</div>
              <input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} aria-label="Password" />
            </div>
            {mode === 'signup' && <Field label="Referral code" hint="optional" value={f.ref} onChange={set('ref')} />}
            {err && <div className="rx-note" style={{ background: 'var(--red-tint)', color: 'var(--red)', marginTop: 0 }}><Icon name="alertCircle" size={15} /> {err}</div>}
            {info && <div className="coupon-applied"><Icon name="check" size={15} /> {info}</div>}
            <Button type="submit" variant="dark" size="lg" block disabled={busy} iconRight="arrowRight">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
          </form>
          <div className="panel row gap-10" style={{ marginTop: 20, fontSize: 13.5, alignItems: 'flex-start' }}>
            <Icon name="shield" size={16} className="teal" style={{ marginTop: 2 }} />
            <span>{mode === 'signin' ? 'New to Pet Maya? Create an account to keep your pet’s records, orders and vet visits together.' : 'By creating an account you agree to our Terms and Privacy Policy.'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
