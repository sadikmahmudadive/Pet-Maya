import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Award, 
  Copy, 
  LogOut, 
  ShieldCheck, 
  FileText, 
  Plus,
  ArrowRightLeft
} from 'lucide-react';

export default function Profile() {
  const { medicalRecords, openModal, showToast } = useApp();
  const { currentUser, switchRole, logout, awardPoints } = useAuth();

  const copyReferral = () => {
    if (!currentUser?.referralCode) return;
    navigator.clipboard.writeText(currentUser.referralCode);
    showToast(`📋 Referral code ${currentUser.referralCode} copied!`, 'success');
  };

  const handleRoleChange = (newRole) => {
    switchRole(newRole);
    showToast(`🔀 Switched active portal to: ${newRole}`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
      {/* ── USER PROFILE CARD ── */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img 
              src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
              alt={currentUser?.name} 
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900 }}>{currentUser?.name || 'Pet Parent'}</h2>
                <span className="badge badge-green">{currentUser?.role || 'Pet Owner'}</span>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentUser?.email}</span>
            </div>
          </div>

          <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* ── REFERRAL & REWARDS BANNER ── */}
        <div 
          style={{
            background: 'var(--primary-tint)',
            border: '1.5px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Award size={32} color="#f59e0b" />
            <div>
              <strong style={{ fontSize: '16px', display: 'block' }}>
                {currentUser?.points || 0} Reward Points Available
              </strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Share your referral code to earn +5 points for each friend who joins!
              </span>
            </div>
          </div>

          <button className="btn-primary" onClick={copyReferral}>
            <Copy size={15} />
            <span>Code: {currentUser?.referralCode || 'PM89AC12'}</span>
          </button>
        </div>

        {/* ── ROLE SWITCHER (FOR DEMO & MULTI-PORTAL TESTING) ── */}
        <div>
          <span className="label-mini">Switch Portal Role (Instant Testing)</span>
          <div className="chip-row">
            {['Pet Owner', 'Veterinarian', 'Grooming / Boarding Provider', 'Shop Merchant', 'Super Admin'].map(r => (
              <button 
                key={r}
                className={`chip-pill ${currentUser?.role === r ? 'active' : ''}`}
                onClick={() => handleRoleChange(r)}
              >
                <ArrowRightLeft size={13} style={{ display: 'inline', marginRight: 4 }} />
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── DIGITAL PATIENT RECORDS (EHR) ── */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800 }}>Digital Medical Records &amp; Clinical EHR</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified veterinary diagnoses, prescription dosages, and follow-up boosters.</p>
          </div>
          <button className="btn-primary" onClick={() => openModal('addRecord')}>
            <Plus size={16} />
            <span>Add Clinical Record</span>
          </button>
        </div>

        {medicalRecords.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No medical records recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {medicalRecords.map(rec => (
              <div 
                key={rec.id} 
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#10b981" />
                    <strong style={{ fontSize: '15.5px' }}>{rec.petName}</strong>
                    <span className="badge badge-blue">{rec.serviceType}</span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{rec.date}</span>
                </div>

                <div style={{ fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Diagnosis: </span>
                  <strong>{rec.diagnosis}</strong>
                </div>

                <div style={{ fontSize: '13px', background: 'var(--surface)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, display: 'block', marginBottom: '2px' }}>Rx Prescription:</span>
                  <span>{rec.prescription}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Weight: <strong>{rec.weight}</strong></span>
                  <span>Treatment Fee: <strong>${rec.cost}</strong></span>
                  <span>Next Booster: <strong style={{ color: 'var(--primary)' }}>{rec.nextBooster}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
