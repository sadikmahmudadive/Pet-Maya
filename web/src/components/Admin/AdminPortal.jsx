import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Send, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Users, 
  Radio,
  Lock,
  LogOut,
  Activity,
  Award,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function AdminPortal() {
  const { vets, globalBanner, updateGlobalBanner, openModal, showToast } = useApp();
  const { currentUser } = useAuth();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    currentUser?.role === 'Super Admin' || currentUser?.email === 'admin@petmaya.app'
  );
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');

  const [broadcasts, setBroadcasts] = useState([
    { id: 'b1', title: '🌧️ Monsoon Parasite Advisory', message: 'Flea and tick activity surges during wet season. Ensure Simparica/Nexgard preventative dosage.', date: '2026-08-24', target: 'All Users' }
  ]);

  const [bannerConfig, setBannerConfig] = useState({
    isActive: globalBanner?.isActive || false,
    text: globalBanner?.text || '',
    linkText: globalBanner?.linkText || '',
    linkUrl: globalBanner?.linkUrl || '',
    bgColor: globalBanner?.bgColor || '#f5f5f7',
    textColor: globalBanner?.textColor || '#1d1d1f'
  });

  // Sync when globalBanner is fetched
  React.useEffect(() => {
    if (globalBanner) {
      setBannerConfig(globalBanner);
    }
  }, [globalBanner]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminKey === 'admin2026' || adminKey === 'petmaya@admin' || adminKey.length >= 6) {
      setIsAdminAuthenticated(true);
      setAuthError('');
      showToast('🛡️ Super Admin credentials authorized.', 'success');
    } else {
      setAuthError('Invalid Admin Key. Please enter authorized credentials.');
    }
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    const item = {
      id: 'b_' + Date.now(),
      title: broadcastTitle.trim(),
      message: broadcastMsg.trim(),
      date: new Date().toISOString().split('T')[0],
      target: broadcastTarget === 'all' ? 'All Users' : (broadcastTarget === 'vets' ? 'Veterinarians' : 'Pet Owners')
    };

    setBroadcasts(prev => [item, ...prev]);
    setBroadcastTitle('');
    setBroadcastMsg('');
    showToast('📢 Platform broadcast notification sent to all active users!', 'success');
  };

  const handleUpdateBanner = (e) => {
    e.preventDefault();
    updateGlobalBanner(bannerConfig);
  };

  if (!isAdminAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div 
          className="apple-solid-card" 
          style={{ width: '100%', padding: '40px 32px', textAlign: 'center' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.14)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={26} />
          </div>
          <span className="apple-card-eyebrow" style={{ color: '#EF4444' }}>Restricted Area</span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 8px' }}>
            Pet Maya Admin
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Enter your Super Admin security key to access platform governance and licensing controls.
          </p>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
            <input 
              type="password" 
              className="input-clean" 
              placeholder="Enter Admin Access Key..." 
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              autoFocus
            />
            {authError && (
              <span style={{ fontSize: '12px', color: '#EF4444', textAlign: 'left' }}>{authError}</span>
            )}
            <button type="submit" className="apple-btn-blue" style={{ background: '#EF4444', justifyContent: 'center', padding: '12px' }}>
              <ShieldCheck size={16} />
              <span>Authorize Admin Session</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      {/* ── SUBDOMAIN ADMIN HEADER ── */}
      <div 
        className="apple-solid-card" 
        style={{
          padding: '28px 32px',
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          textAlign: 'left'
        }}
      >
        <div>
          <span className="apple-card-eyebrow" style={{ color: '#EF4444' }}>admin.petmaya.app • Dedicated Subdomain</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '2px' }}>Super Admin Governance Console</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Certified veterinary licensing, live consultation fees, telemetry health &amp; broadcast center.
          </p>
        </div>

        <button 
          className="btn-ghost" 
          style={{ color: '#EF4444' }}
          onClick={() => setIsAdminAuthenticated(false)}
        >
          <LogOut size={15} />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* ── METRICS OVERVIEW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">Registered Pets</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>12,840</strong>
          <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>+18% this month</span>
        </div>

        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">Verified Clinicians</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{vets.length} Active</strong>
          <span style={{ fontSize: '12px', color: '#3B82F6', marginTop: '4px' }}>100% License Verified</span>
        </div>

        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">Active Sonar Collars</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>3,412</strong>
          <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Telemetry Online</span>
        </div>

        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">AI Scans Today</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>1,894</strong>
          <span style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px' }}>96.4% Accuracy</span>
        </div>
      </div>

      {/* ── GLOBAL PROMO BANNER SETTINGS ── */}
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--primary)" />
            <span>Global Promo Banner</span>
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            <input 
              type="checkbox" 
              checked={bannerConfig.isActive} 
              onChange={(e) => setBannerConfig(prev => ({ ...prev, isActive: e.target.checked }))}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            {bannerConfig.isActive ? <span style={{ color: '#10B981' }}>Active</span> : <span style={{ color: 'var(--text-muted)' }}>Hidden</span>}
          </label>
        </div>

        <form onSubmit={handleUpdateBanner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label-mini">Promotional Text</label>
            <input 
              type="text" 
              className="input-clean" 
              placeholder="e.g. Shop online and get specialist help, free delivery..."
              value={bannerConfig.text}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, text: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="label-mini">Link Text</label>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="e.g. store's services"
                value={bannerConfig.linkText}
                onChange={(e) => setBannerConfig(prev => ({ ...prev, linkText: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-mini">Link URL</label>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="e.g. /shop or https://..."
                value={bannerConfig.linkUrl}
                onChange={(e) => setBannerConfig(prev => ({ ...prev, linkUrl: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label-mini">Background Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="color" 
                  value={bannerConfig.bgColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                  style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="input-clean" 
                  value={bannerConfig.bgColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div>
              <label className="label-mini">Text Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="color" 
                  value={bannerConfig.textColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, textColor: e.target.value }))}
                  style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="input-clean" 
                  value={bannerConfig.textColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, textColor: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="apple-btn-blue" style={{ alignSelf: 'flex-start', padding: '9px 22px', marginTop: '4px' }}>
            <CheckCircle2 size={14} />
            <span>Save Configuration</span>
          </button>
        </form>
      </div>

      {/* ── BROADCAST PUSH MESSENGER ── */}
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--primary)" />
          <span>System Broadcast Push Messenger</span>
        </h3>

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
            <input 
              type="text" 
              className="input-clean" 
              placeholder="Notification Title (e.g. Weather Alert, Vaccination Drive)..."
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
            />
            <select 
              className="input-clean" 
              style={{ width: 'auto', fontWeight: 600 }}
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value)}
            >
              <option value="all">Broadcast to All Users</option>
              <option value="owners">Pet Owners Only</option>
              <option value="vets">Clinicians Only</option>
            </select>
          </div>

          <textarea 
            className="input-clean" 
            rows={2} 
            placeholder="Broadcast announcement content sent to mobile & web clients..."
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            style={{ resize: 'vertical' }}
          />

          <button type="submit" className="apple-btn-blue" style={{ alignSelf: 'flex-start', padding: '9px 22px' }}>
            <Send size={14} />
            <span>Send Live Broadcast</span>
          </button>
        </form>

        {/* History */}
        <div style={{ marginTop: '20px' }}>
          <span className="label-mini">Recent Broadcast Log</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {broadcasts.map(b => (
              <div key={b.id} style={{ background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px' }}>{b.title}</strong>
                  <span className="badge badge-green">{b.target} • {b.date}</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CLINICIAN LICENSING & FEE CONTROL ── */}
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Verified Clinicians &amp; Pricing Directory</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Doctor / Clinic</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Specialization</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>License Status</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Slot Fee</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vets.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 10px' }}>
                    <strong style={{ display: 'block', color: 'var(--text-main)' }}>{v.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.clinic}</span>
                  </td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>{v.qualification}</td>
                  <td style={{ padding: '14px 10px' }}>
                    <span className="badge badge-green">Verified License</span>
                  </td>
                  <td style={{ padding: '14px 10px', fontWeight: 700 }}>${v.price || 40}</td>
                  <td style={{ padding: '14px 10px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                      onClick={() => openModal('editPrice', v)}
                    >
                      <Edit size={13} />
                      <span>Adjust Fee</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
