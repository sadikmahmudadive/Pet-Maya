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
  ChevronRight
} from 'lucide-react';

export default function Profile() {
  const { medicalRecords, openModal, showToast } = useApp();
  const { currentUser, logout, loginAsGuest, awardPoints } = useAuth();

  const copyReferral = () => {
    if (!currentUser?.referralCode) return;
    navigator.clipboard.writeText(currentUser.referralCode);
    showToast(`📋 Referral code ${currentUser.referralCode} copied!`, 'success');
  };

  const handleSignOut = async () => {
    await logout();
    showToast('👋 You have been signed out successfully.', 'info');
  };

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px', margin: '40px auto', width: '100%' }}>
        <div className="apple-promo-card" style={{ padding: '44px 30px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 16px' }}>
            <User size={30} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>You are currently signed out</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px' }}>
            Sign in to manage your pets, view medical records, earn rewards, and access clinical consultations.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="apple-btn-blue" onClick={() => openModal('auth')}>
              <span>Sign In / Create Account</span>
            </button>
            <button className="btn-ghost" onClick={() => { loginAsGuest('Pet Owner'); showToast('Entered Guest Demo Mode', 'info'); }}>
              <span>Continue as Guest Demo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
      {/* ── USER PROFILE CARD ── */}
      <div className="apple-promo-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img 
              src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
              alt={currentUser?.name} 
              style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>{currentUser?.name || 'Pet Parent'}</h2>
                <span className="badge badge-green">{currentUser?.role || 'Pet Owner'}</span>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentUser?.email}</span>
            </div>
          </div>

          <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={handleSignOut}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* ── REFERRAL & REWARDS BANNER ── */}
        <div 
          style={{
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Award size={30} color="#F59E0B" />
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 700, display: 'block' }}>
                {currentUser?.points || 0} Reward Points Available
              </strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Share your referral code to earn +5 points for each friend who joins!
              </span>
            </div>
          </div>

          <button className="apple-btn-blue" onClick={copyReferral}>
            <Copy size={14} />
            <span>Code: {currentUser?.referralCode || 'PM89AC12'}</span>
          </button>
        </div>


      </div>

      {/* ── DIGITAL PATIENT RECORDS (EHR) ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.02em' }}>Digital Medical Records &amp; Clinical EHR</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified veterinary diagnoses, prescription dosages, and follow-up boosters.</p>
          </div>
          <button className="apple-btn-blue" onClick={() => openModal('addRecord')}>
            <Plus size={15} />
            <span>Add Clinical Record</span>
          </button>
        </div>

        {medicalRecords.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No medical records recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {medicalRecords.map(rec => (
              <div 
                key={rec.id} 
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={17} color="#10B981" />
                    <strong style={{ fontSize: '15.5px', fontWeight: 600 }}>{rec.petName}</strong>
                    <span className="badge badge-blue">{rec.serviceType}</span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{rec.date}</span>
                </div>

                <div style={{ fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Diagnosis: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{rec.diagnosis}</strong>
                </div>

                <div style={{ fontSize: '13px', background: 'var(--surface-solid)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Rx Prescription:</span>
                  <span>{rec.prescription}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Weight: <strong style={{ color: 'var(--text-main)' }}>{rec.weight}</strong></span>
                  <span>Treatment Fee: <strong style={{ color: 'var(--text-main)' }}>${rec.cost}</strong></span>
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
