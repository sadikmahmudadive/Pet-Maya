import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function AuthModal() {
  const { closeModal, showToast } = useApp();
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginAsGuest } = useAuth();

  const [tab, setTab] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        await loginWithEmail(email, password);
        showToast('Signed in successfully!', 'success');
      } else {
        await signupWithEmail(name, email, password, referral);
        showToast('🎉 Account created with 15 bonus points!', 'success');
      }
      closeModal();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      showToast('Signed in with Google!', 'success');
      closeModal();
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  const handleGuest = () => {
    loginAsGuest('Pet Owner');
    showToast('👋 Entered demo guest mode as Pet Owner', 'info');
    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="assets/images/tail_wagging_logo.png" alt="Pet Maya" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Welcome to Pet Maya</h3>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="chip-row" style={{ marginBottom: '20px' }}>
          <button className={`chip-pill ${tab === 'signin' ? 'active' : ''}`} style={{ flex: 1, textAlign: 'center' }} onClick={() => setTab('signin')}>
            Sign In
          </button>
          <button className={`chip-pill ${tab === 'signup' ? 'active' : ''}`} style={{ flex: 1, textAlign: 'center' }} onClick={() => setTab('signup')}>
            Create Account
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-tint)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'signup' && (
            <div>
              <label className="label-mini">Full Name</label>
              <input type="text" className="input-clean" placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}

          <div>
            <label className="label-mini">Email Address</label>
            <input type="email" className="input-clean" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div>
            <label className="label-mini">Password</label>
            <input type="password" className="input-clean" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {tab === 'signup' && (
            <div>
              <label className="label-mini">Referral Code (Optional)</label>
              <input type="text" className="input-clean" placeholder="e.g. PM89AC12" value={referral} onChange={e => setReferral(e.target.value.toUpperCase())} />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Processing…' : (tab === 'signin' ? 'Sign In' : 'Create Account (+15 Pts)')}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>or</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-ghost" style={{ justifyContent: 'center', padding: '10px' }} onClick={handleGoogle}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
            <span>Continue with Google</span>
          </button>

          <button className="btn-ghost" style={{ justifyContent: 'center', padding: '10px' }} onClick={handleGuest}>
            <Sparkles size={16} color="#10b981" />
            <span>Continue as Guest Demo Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}
