import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Send, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Users, 
  Radio,
  ChevronRight
} from 'lucide-react';

export default function AdminPortal() {
  const { vets, openModal, showToast } = useApp();

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');

  const [broadcasts, setBroadcasts] = useState([
    { id: 'b1', title: '🌧️ Monsoon Parasite Advisory', message: 'Flea and tick activity surges during wet season. Ensure Simparica/Nexgard preventative dosage.', date: '2026-08-24', target: 'All Users' }
  ]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── HEADER ── */}
      <div 
        className="apple-promo-card" 
        style={{
          background: 'var(--surface-solid)',
          padding: '28px 32px',
          alignItems: 'flex-start',
          textAlign: 'left'
        }}
      >
        <span className="apple-card-eyebrow" style={{ color: '#EF4444' }}>Governance</span>
        <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '2px' }}>Super Admin Console</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Manage certified veterinary licenses, update consultation prices, and broadcast community alerts across all devices.
        </p>
      </div>

      {/* ── BROADCAST PUSH MESSENGER ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
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
              <div key={b.id} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
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
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Verified Clinicians &amp; Pricing Directory</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
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
