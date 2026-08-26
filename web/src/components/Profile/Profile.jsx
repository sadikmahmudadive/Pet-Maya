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
  HeartHandshake,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Heart,
  Clock,
  Sun,
  Gift,
  Share2,
  ArrowRight
} from 'lucide-react';

export default function Profile() {
  const { pets, orders, theme, toggleTheme, medicalRecords, openModal, showToast } = useApp();
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
      
      {/* ── 1. MOBILE-APP INSPIRED PROFILE HEADER ── */}
      <div className="apple-promo-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--surface-solid)', alignItems: 'stretch' }}>
        {/* Green Top Section */}
        <div style={{ background: 'var(--primary)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleSignOut}>
            <LogOut size={16} />
          </button>
          
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <img 
              src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
              alt={currentUser?.name} 
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFF' }} 
            />
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFF', margin: '0 0 8px' }}>{currentUser?.name || 'Sm Adive'}</h2>
          <span style={{ background: 'rgba(255,255,255,0.25)', color: '#FFF', padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {currentUser?.role || 'Pet Owner'}
          </span>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '20px' }}>
          <div style={{ background: 'var(--surface-alt)', padding: '16px 10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><User size={20} /></div>
            <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1 }}>{pets?.length || 2}</strong>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Pets</span>
          </div>
          <div style={{ background: 'var(--surface-alt)', padding: '16px 10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><ShoppingBag size={20} /></div>
            <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1 }}>{orders?.length || 0}</strong>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Orders</span>
          </div>
          <div style={{ background: 'var(--surface-alt)', padding: '16px 10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ color: '#F59E0B', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><Award size={20} /></div>
            <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1 }}>{currentUser?.points || 20}</strong>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Points</span>
          </div>
        </div>

        {/* Pet Family */}
        <div style={{ padding: '0 20px 20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pet Family</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>VIEW ALL</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {pets && pets.length > 0 ? pets.map(p => (
              <img key={p.id} src={p.photo} alt={p.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface-alt)' }} />
            )) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Plus size={20} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. PERSONAL DETAILS ── */}
      <div className="apple-promo-card" style={{ padding: '24px 20px', textAlign: 'left', alignItems: 'stretch' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>Personal Details</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Mail size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email</span>
              <strong style={{ fontSize: '14px', display: 'block' }}>{currentUser?.email || 'siradive137@gmail.com'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Phone size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone</span>
              <strong style={{ fontSize: '14px', display: 'block' }}>{currentUser?.phone || '+8801835120307'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <MapPin size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Address</span>
              <strong style={{ fontSize: '14px', display: 'block' }}>{currentUser?.address || '25 Rd No. 9, Mirpur, Dhaka, Bangladesh'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. ACCOUNT & SECURITY ── */}
      <div style={{ textAlign: 'left' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px', display: 'block', paddingLeft: '8px' }}>Account & Security</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="apple-promo-card" style={{ padding: '20px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
            <Clock size={18} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>My Orders</span>
          </div>
          <div className="apple-promo-card" style={{ padding: '20px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
            <Heart size={18} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Favorite Vets</span>
          </div>
          <div className="apple-promo-card" style={{ padding: '20px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', cursor: 'pointer' }} onClick={toggleTheme}>
            <Sun size={18} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>System ({theme})</span>
          </div>
          <div className="apple-promo-card" style={{ padding: '20px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Privacy & Terms</span>
          </div>
        </div>
      </div>

      {/* ── 4. REFERRAL PROGRAM ── */}
      <div className="apple-promo-card" style={{ padding: '30px', textAlign: 'left', alignItems: 'stretch', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(0,0,0,0))', borderColor: 'rgba(16,185,129,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>REFERRAL PROGRAM 🎁</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '12px' }}>Invite Friends & Earn Points!</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '300px' }}>New users get 15 initial points. Earn +5 points for every friend who joins with your code!</p>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
            <Gift size={24} />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>{currentUser?.referralCode || 'PMKELG15'}</span>
            <Copy size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={copyReferral} />
          </div>
          <button className="apple-btn-blue" style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)' }}>
            <Share2 size={16} />
            <span>Share Invite</span>
          </button>
        </div>
        <button className="btn-ghost" style={{ marginTop: '16px', alignSelf: 'flex-start', padding: '8px 16px' }}>
          <ArrowRight size={14} />
          <span>Have a code?</span>
        </button>
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
