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
  Radio 
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
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          padding: '24px 28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShieldCheck size={28} color="#10b981" />
          <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Super Admin Governance Console</h2>
        </div>
        <p style={{ fontSize: '14px', opacity: 0.85 }}>
          Manage certified veterinary licenses, update consultation prices, and broadcast community alerts.
        </p>
      </div>

      {/* ── BROADCAST MESSENGER ── */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="#ef4444" />
          <span>Platform Broadcast &amp; Push Notification Messenger</span>
        </h3>

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label className="label-mini">Broadcast Title</label>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="e.g. Free Rabies Vaccination Camp Tomorrow" 
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="label-mini">Target Audience</label>
              <select 
                className="input-clean" 
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
              >
                <option value="all">Broadcast to All Users</option>
                <option value="owners">Pet Owners Only</option>
                <option value="vets">Verified Doctors &amp; Spas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-mini">Notification Message</label>
            <textarea 
              className="input-clean" 
              rows={2} 
              placeholder="Write the platform-wide announcement..." 
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: 'fit-content', background: '#ef4444' }}
            disabled={!broadcastTitle.trim() || !broadcastMsg.trim()}
          >
            <Send size={15} />
            <span>Send Push Broadcast</span>
          </button>
        </form>

        {/* Broadcast History */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <span className="label-mini">Recent Broadcast Log</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {broadcasts.map(b => (
              <div key={b.id} style={{ background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong>{b.title}</strong>
                  <span className="badge badge-purple">{b.target} • {b.date}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROVIDER PRICING & LICENSE VERIFICATION ── */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
          Verified Care Providers &amp; Fee Management
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px' }}>Doctor / Provider</th>
                <th style={{ padding: '12px 10px' }}>Specialty</th>
                <th style={{ padding: '12px 10px' }}>Rating</th>
                <th style={{ padding: '12px 10px' }}>Consultation Fee</th>
                <th style={{ padding: '12px 10px' }}>License Status</th>
                <th style={{ padding: '12px 10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {vets.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 10px', fontWeight: 800 }}>{v.name}</td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>{v.tag}</td>
                  <td style={{ padding: '14px 10px' }}>⭐ {v.rating} ({v.reviewsCount})</td>
                  <td style={{ padding: '14px 10px', fontWeight: 800, color: 'var(--primary)' }}>{v.price}</td>
                  <td style={{ padding: '14px 10px' }}>
                    <span className="badge badge-green">Verified Active</span>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => openModal('editPrice', { vetId: v.id, currentPrice: v.price, name: v.name })}
                    >
                      <Edit size={13} />
                      <span>Edit Fee</span>
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
