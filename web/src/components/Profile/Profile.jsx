import React, { useState } from 'react';
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
  ChevronRight,
  PhoneCall,
  Download,
  Flame,
  CheckCircle2,
  Calendar,
  Stethoscope,
  HeartHandshake
} from 'lucide-react';

export default function Profile() {
  const { medicalRecords, openModal, showToast } = useApp();
  const { currentUser, logout, loginAsGuest, awardPoints } = useAuth();

  const [pointsRedeemed, setPointsRedeemed] = useState(false);

  const copyReferral = () => {
    if (!currentUser?.referralCode) return;
    navigator.clipboard.writeText(currentUser.referralCode);
    showToast(`📋 Referral code ${currentUser.referralCode} copied!`, 'success');
  };

  const handleRedeemPoints = (pts, rewardName) => {
    if ((currentUser?.points || 0) < pts) {
      showToast(`⚠️ You need at least ${pts} points to redeem ${rewardName}.`, 'error');
      return;
    }
    showToast(`🎉 Redeemed ${pts} pts for ${rewardName}! Applied to your account.`, 'success');
  };

  const handleSignOut = async () => {
    await logout();
    showToast('👋 You have been signed out successfully.', 'info');
  };

  const exportEHRSummary = () => {
    const ehrText = `PET MAYA ELECTRONIC HEALTH RECORD (EHR)\nPatient: Max (Golden Retriever)\nOwner: ${currentUser?.name || 'Pet Parent'}\nGenerated: ${new Date().toLocaleDateString()}\n\n` +
      medicalRecords.map((r, i) => `${i + 1}. [${r.date}] ${r.serviceType} - ${r.diagnosis}\n   Rx: ${r.prescription}\n   Booster Due: ${r.nextBooster}\n   Cost: $${r.cost}`).join('\n\n');

    const blob = new Blob([ehrText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `PetMaya_EHR_${currentUser?.name || 'Patient'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📄 Clinical EHR medical summary exported!', 'success');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '880px', margin: '0 auto', width: '100%' }}>
      
      {/* ── 1. USER PROFILE OVERVIEW CARD ── */}
      <div className="apple-promo-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img 
              src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
              alt={currentUser?.name} 
              style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--primary)' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{currentUser?.name || 'Pet Parent'}</h2>
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
            <Award size={32} color="#F59E0B" />
            <div>
              <strong style={{ fontSize: '16.5px', fontWeight: 700, display: 'block' }}>
                {currentUser?.points || 0} Care Reward Points
              </strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Invite friends with your referral code to earn +15 points per signup!
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'var(--surface-solid)', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '13px', border: '1px solid var(--border)' }}>
              {currentUser?.referralCode || 'PM89AC12'}
            </span>
            <button className="apple-btn-blue" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={copyReferral}>
              <Copy size={13} />
              <span>Copy Code</span>
            </button>
          </div>
        </div>

        {/* Points Redemption Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '13px', display: 'block' }}>$5 Pharmacy Voucher</strong>
              <span style={{ fontSize: '11.5px', color: '#F59E0B', fontWeight: 700 }}>25 Points</span>
            </div>
            <button className="btn-ghost" style={{ fontSize: '11.5px', padding: '4px 10px' }} onClick={() => handleRedeemPoints(25, '$5 Pharmacy Voucher')}>Redeem</button>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '13px', display: 'block' }}>Free Express Delivery</strong>
              <span style={{ fontSize: '11.5px', color: '#F59E0B', fontWeight: 700 }}>40 Points</span>
            </div>
            <button className="btn-ghost" style={{ fontSize: '11.5px', padding: '4px 10px' }} onClick={() => handleRedeemPoints(40, 'Free Express Shipping')}>Redeem</button>
          </div>
        </div>
      </div>

      {/* ── 2. CLINICAL EHR MEDICAL RECORDS ── */}
      <div className="apple-promo-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span className="apple-card-eyebrow" style={{ color: '#10B981' }}>Cloud Health Records</span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Electronic Health Records (EHR)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified clinical diagnoses, prescriptions, and booster milestones.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-ghost" onClick={exportEHRSummary}>
              <Download size={14} />
              <span>Export EHR</span>
            </button>
            <button className="apple-btn-blue" onClick={() => openModal('addRecord')}>
              <Plus size={14} />
              <span>Add Clinical Record</span>
            </button>
          </div>
        </div>

        {medicalRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No clinical records logged yet. Add your pet's latest checkup or vaccine record above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {medicalRecords.map((r) => (
              <div 
                key={r.id} 
                style={{ 
                  background: 'var(--surface-alt)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '18px 22px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-green">{r.serviceType || 'Consultation'}</span>
                    <strong style={{ fontSize: '15px' }}>🐾 {r.petName} ({r.weight || '12 kg'})</strong>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.date}</span>
                </div>

                <p style={{ fontSize: '13.5px', color: 'var(--text-main)', margin: '2px 0' }}>
                  <strong>Diagnosis:</strong> {r.diagnosis}
                </p>

                {r.prescription && (
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    <strong>Prescription:</strong> {r.prescription}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Next Booster: <strong style={{ color: 'var(--primary)' }}>{r.nextBooster || 'N/A'}</strong></span>
                  <span>Cost: <strong>${r.cost || 35}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. BANGLADESH 24/7 EMERGENCY SOS HOTLINES ── */}
      <div className="apple-promo-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={18} />
          </div>
          <div>
            <strong style={{ fontSize: '16px', fontWeight: 700 }}>24/7 Animal Emergency &amp; SOS Hotlines</strong>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block' }}>Emergency assistance in Bangladesh</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '13px', display: 'block' }}>Central Veterinary Hospital (CVH)</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dhaka • 24/7 Casualty Unit</span>
            <a href="tel:+88029331908" style={{ color: '#EF4444', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', textDecoration: 'none' }}>
              <PhoneCall size={12} />
              <span>+880 2-9331908</span>
            </a>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '13px', display: 'block' }}>Pet Maya Emergency Response</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>On-Call Tele-Triage Helpline</span>
            <a href="tel:+8801800738629" style={{ color: '#EF4444', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', textDecoration: 'none' }}>
              <PhoneCall size={12} />
              <span>+880 1800-PETMAYA</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
