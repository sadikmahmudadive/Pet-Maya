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
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Heart,
  Clock,
  Sun,
  Moon,
  Gift,
  ArrowRight,
  Share2,
  Pencil,
  Camera,
  Radio,
  FileCheck,
  Sparkles,
  Bell,
  Info,
  ExternalLink,
  Check,
  PawPrint
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';

export default function Profile() {
  const { pets, orders, devices, theme, toggleTheme, medicalRecords, openModal, showToast, setActiveTab } = useApp();
  const { currentUser, logout, loginAsGuest, awardPoints } = useAuth();

  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemedCode, setRedeemedCode] = useState(currentUser?.referredBy || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const referralCode = currentUser?.referralCode || 'PM89AC12';

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showToast(`Referral code ${referralCode} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShare = async () => {
    const shareText = `Join me on Pet Maya, the smart pet care platform! Use my referral code: ${referralCode} to unlock 15 welcome points and rewards.\nhttps://petmaya.app/`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pet Maya Referral Code',
          text: shareText,
          url: 'https://petmaya.app/'
        });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Invite link copied to clipboard!', 'success');
    }
  };

  const handleApplyRedeem = () => {
    const code = redeemInput.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a referral code.', 'error');
      return;
    }
    if (code === referralCode) {
      showToast('You cannot redeem your own referral code.', 'error');
      return;
    }
    if (redeemedCode) {
      showToast('You have already applied a referral code.', 'error');
      return;
    }

    awardPoints(5);
    setRedeemedCode(code);
    setShowRedeemModal(false);
    setRedeemInput('');
    showToast(`Referral code "${code}" applied! +5 points awarded.`, 'success');
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out of Pet Maya?')) {
      await logout();
      showToast('You have been signed out successfully.', 'info');
    }
  };

  const exportEHRSummary = () => {
    const ehrText = `PET MAYA ELECTRONIC HEALTH RECORD (EHR)\nOwner: ${currentUser?.name || 'Pet Parent'}\nEmail: ${currentUser?.email || 'N/A'}\nGenerated: ${new Date().toLocaleDateString()}\n\n` +
      medicalRecords.map((r, i) => `${i + 1}. [${r.date}] ${r.serviceType || 'Care'} - ${r.diagnosis || 'General Checkup'}\n   Pet: ${r.petName || 'Pet'} (${r.weight || 'N/A'})\n   Prescription: ${r.prescription || 'None'}\n   Booster Due: ${r.nextBooster || 'None'}\n   Cost: $${r.cost || 0}`).join('\n\n');

    const blob = new Blob([ehrText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `PetMaya_EHR_${currentUser?.name?.replace(/\s+/g, '_') || 'Patient'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Clinical EHR summary exported!', 'success');
  };

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', margin: '40px auto', width: '100%', maxWidth: '800px' }}>
        <div className="apple-solid-card" style={{ padding: '48px 30px', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(26, 182, 128, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 18px' }}>
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>You are currently signed out</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '26px', maxWidth: '440px', margin: '0 auto 26px', lineHeight: 1.5 }}>
            Sign in to access your pet family, verified electronic health records, active telemetry trackers, and loyalty points.
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* ── 1. PREMIUM PARALLAX / GRADIENT HEADER (Matches user_profile_screen.dart) ── */}
      <AppleReveal duration={0.8} yOffset={25}>
        <div 
          className="apple-solid-card" 
          style={{ 
            padding: 0, 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'stretch',
            borderRadius: '28px',
            border: '1px solid var(--border)'
          }}
        >
          {/* Emerald Gradient Top Banner */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, #1AB680 0%, #10865E 100%)', 
              padding: '48px 24px 36px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              position: 'relative',
              boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.1)'
            }}
          >
            {/* Background Watermark */}
            <div 
              style={{ 
                position: 'absolute', 
                right: '-30px', 
                top: '-20px', 
                opacity: 0.08, 
                pointerEvents: 'none',
                color: '#FFF'
              }}
            >
              <PawPrint size={240} />
            </div>

            {/* Top Bar Actions: Edit & Logout */}
            <div style={{ position: 'absolute', top: '18px', right: '20px', display: 'flex', gap: '10px' }}>
              <button 
                title="Edit Profile" 
                onClick={() => openModal('editProfile')}
                style={{ 
                  background: 'rgba(0,0,0,0.22)', 
                  color: '#FFF', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: 38, 
                  height: 38, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.36)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.22)'}
              >
                <Pencil size={17} />
              </button>
              <button 
                title="Sign Out" 
                onClick={handleSignOut}
                style={{ 
                  background: 'rgba(0,0,0,0.22)', 
                  color: '#FFF', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: 38, 
                  height: 38, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.36)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.22)'}
              >
                <LogOut size={17} />
              </button>
            </div>
            
            {/* Avatar with Camera Overlay */}
            <div 
              style={{ position: 'relative', marginBottom: '16px', cursor: 'pointer' }} 
              onClick={() => openModal('editProfile')}
            >
              <div 
                style={{ 
                  padding: '4px', 
                  borderRadius: '50%', 
                  border: '2px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                }}
              >
                <img 
                  src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                  alt={currentUser?.name} 
                  style={{ 
                    width: 104, 
                    height: 104, 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    display: 'block'
                  }} 
                />
              </div>
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: 4, 
                  right: 4, 
                  background: '#FFF', 
                  color: 'var(--primary)', 
                  borderRadius: '50%', 
                  width: 30, 
                  height: 30, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  border: '2px solid #FFF'
                }}
                title="Change Photo"
              >
                <Camera size={14} />
              </div>
            </div>
            
            {/* User Name & Role Badge */}
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#FFF', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {currentUser?.name || 'Pet Parent'}
            </h2>
            <div 
              style={{ 
                background: 'rgba(255,255,255,0.24)', 
                color: '#FFF', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                fontSize: '10px', 
                fontWeight: 900, 
                letterSpacing: '1px', 
                textTransform: 'uppercase' 
              }}
            >
              {currentUser?.role || 'PET OWNER'}
            </div>
          </div>

          {/* Platform Stats Row (Matches _buildPlatformStats) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', padding: '24px 20px 16px' }}>
            <div 
              className="apple-solid-card" 
              style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '20px', border: '1px solid var(--border)' }}
            >
              <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <PawPrint size={22} />
              </div>
              <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1.2, color: 'var(--text-main)' }}>
                {pets?.length || 0}
              </strong>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800 }}>
                Pets
              </span>
            </div>

            <div 
              className="apple-solid-card" 
              style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => openModal('orderTracker')}
            >
              <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <ShoppingBag size={22} />
              </div>
              <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1.2, color: 'var(--text-main)' }}>
                {orders?.length || 0}
              </strong>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800 }}>
                Orders
              </span>
            </div>

            <div 
              className="apple-solid-card" 
              style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '20px', border: '1px solid var(--border)' }}
            >
              <div style={{ color: '#F59E0B', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <Award size={22} />
              </div>
              <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1.2, color: 'var(--text-main)' }}>
                {currentUser?.points || 25}
              </strong>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800 }}>
                Points
              </span>
            </div>

            <div 
              className="apple-solid-card" 
              style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => openModal('myDevices')}
            >
              <div style={{ color: '#3B82F6', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <Radio size={22} />
              </div>
              <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1.2, color: 'var(--text-main)' }}>
                {devices?.length || 0}
              </strong>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800 }}>
                Trackers
              </span>
            </div>
          </div>

          {/* Pet Family Section (Matches _buildPetFamilySection) */}
          <div style={{ padding: '8px 24px 24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Pet Family
              </span>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => openModal('breedFinder')}
                  style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 800, color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Sparkles size={13} />
                  <span>AI BREED FINDER</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => openModal('addPet')}
                  style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
                >
                  + ADD PET
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
              {pets && pets.length > 0 ? pets.map(p => (
                <div 
                  key={p.id || p.petID} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '6px', 
                    flexShrink: 0,
                    minWidth: '76px'
                  }}
                >
                  <div 
                    style={{ 
                      position: 'relative', 
                      padding: '2px', 
                      borderRadius: '50%', 
                      border: '2px solid var(--primary)' 
                    }}
                  >
                    <img 
                      src={p.photo || p.photoUrl || 'assets/images/Pet_1.jpg'} 
                      alt={p.name} 
                      style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', display: 'block' }} 
                    />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {p.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => openModal('petPassport', { pet: p })}
                    style={{
                      background: 'rgba(26, 182, 128, 0.12)',
                      color: 'var(--primary)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileCheck size={11} />
                    <span>Passport</span>
                  </button>
                </div>
              )) : (
                <div 
                  style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--text-muted)', 
                    cursor: 'pointer', 
                    border: '1.5px dashed var(--border)' 
                  }} 
                  onClick={() => openModal('addPet')}
                >
                  <Plus size={20} />
                </div>
              )}
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── 2. PERSONAL DETAILS (Matches _buildContactCard) ── */}
      <AppleReveal delay={0.1} yOffset={25}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>
            Personal Details
          </div>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: '24px', 
              position: 'relative', 
              borderRadius: '24px',
              border: '1px solid var(--border)'
            }}
          >
            {/* Edit Icon Top-Right */}
            <button 
              onClick={() => openModal('editProfile')}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                background: 'rgba(26, 182, 128, 0.1)', 
                color: 'var(--primary)', 
                border: 'none', 
                borderRadius: '50%', 
                width: 36, 
                height: 36, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              title="Edit Details"
            >
              <Pencil size={15} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(26, 182, 128, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</span>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.email || 'user@petmaya.app'}
                  </strong>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(26, 182, 128, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</span>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-main)' }}>
                    {currentUser?.phone || 'Not set'}
                  </strong>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(26, 182, 128, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</span>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-main)' }}>
                    {currentUser?.address || 'Not set'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── 3. CARE & SERVICES GROUP (Matches _buildGroupedCard) ── */}
      <AppleReveal delay={0.15} yOffset={25}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>
            Care &amp; Services
          </div>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              borderRadius: '24px',
              border: '1px solid var(--border)'
            }}
          >
            {/* My Appointments */}
            <div 
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s ease' }}
              onClick={() => openModal('myAppointments')}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(0, 177, 106, 0.12)', color: '#00B16A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>My Appointments</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Clinic &amp; Video Consultations</span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginLeft: '74px', marginRight: '16px' }} />

            {/* My Orders */}
            <div 
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s ease' }}
              onClick={() => openModal('orderTracker')}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(26, 182, 128, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={20} />
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>My Orders</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{orders?.length || 0} active &amp; completed deliveries</span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginLeft: '74px', marginRight: '16px' }} />

            {/* Favorite Specialists */}
            <div 
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s ease' }}
              onClick={() => openModal('favoriteVets')}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(233, 30, 99, 0.12)', color: '#E91E63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={20} />
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>Favorite Specialists</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saved veterinary doctors</span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginLeft: '74px', marginRight: '16px' }} />

            {/* My Devices & Trackers */}
            <div 
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s ease' }}
              onClick={() => openModal('myDevices')}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radio size={20} />
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>My Devices &amp; Trackers</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{devices?.length || 0} paired collars &amp; beacons</span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── 4. PREFERENCES GROUP (Matches _buildPreferencesGroup) ── */}
      <AppleReveal delay={0.2} yOffset={25}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>
            Preferences
          </div>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              borderRadius: '24px',
              border: '1px solid var(--border)'
            }}
          >
            {/* Appearance */}
            <div 
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s ease' }}
              onClick={toggleTheme}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(92, 107, 192, 0.12)', color: '#5C6BC0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>Appearance</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {theme === 'dark' ? 'Dark Mode (Deep Emerald)' : 'Light Mode (Soft Mint)'}
                </span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginLeft: '74px', marginRight: '16px' }} />

            {/* Notifications */}
            <div 
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s ease' }}
              onClick={() => {
                setNotificationsEnabled(!notificationsEnabled);
                showToast(`Notifications ${!notificationsEnabled ? 'enabled' : 'muted'}.`, 'info');
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(255, 152, 0, 0.12)', color: '#FF9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>Notifications</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Alerts &amp; Booster Reminders</span>
              </div>
              <div 
                style={{ 
                  width: 42, 
                  height: 24, 
                  borderRadius: '12px', 
                  background: notificationsEnabled ? 'var(--primary)' : 'var(--border)', 
                  position: 'relative',
                  transition: 'background 0.2s ease'
                }}
              >
                <div 
                  style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#FFF', 
                    position: 'absolute', 
                    top: 2, 
                    left: notificationsEnabled ? 20 : 2,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── 5. REWARDS & REFERRAL BANNER (Matches _buildRewardsBanner) ── */}
      <AppleReveal delay={0.25} yOffset={25}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>
            Rewards &amp; Referral
          </div>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: '24px', 
              borderRadius: '28px',
              border: '1.5px solid rgba(26, 182, 128, 0.25)',
              background: 'linear-gradient(135deg, rgba(26, 182, 128, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
              boxShadow: '0 8px 24px rgba(26, 182, 128, 0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: 'rgba(26, 182, 128, 0.15)', 
                    color: 'var(--primary-dark, #10865E)', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    letterSpacing: '1px' 
                  }}
                >
                  <Gift size={12} />
                  <span>REFERRAL PROGRAM</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-main)' }}>
                  Invite Friends &amp; Earn Points!
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, maxWidth: '420px' }}>
                  New users get 15 initial points. Earn +5 points for every friend who joins with your code!
                </p>
              </div>

              <div 
                style={{ 
                  width: 54, 
                  height: 54, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #1AB680 0%, #10865E 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#FFF',
                  boxShadow: '0 6px 18px rgba(26, 182, 128, 0.35)',
                  flexShrink: 0
                }}
              >
                <Gift size={26} />
              </div>
            </div>

            {/* Actions & Code Pill */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '20px' }}>
              {/* Copy Code Pill */}
              <div 
                onClick={copyReferral}
                style={{ 
                  background: 'var(--surface)', 
                  border: '1.2px solid rgba(26, 182, 128, 0.35)', 
                  borderRadius: '14px', 
                  padding: '8px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
                title="Click to copy code"
              >
                <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px' }}>
                  {referralCode}
                </span>
                {copiedCode ? <Check size={14} color="var(--primary)" /> : <Copy size={14} color="var(--primary)" />}
              </div>

              {/* Share Button */}
              <button 
                onClick={handleShare}
                style={{ 
                  background: 'var(--primary)', 
                  color: '#FFF', 
                  border: 'none', 
                  borderRadius: '14px', 
                  padding: '9px 16px', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(26, 182, 128, 0.35)'
                }}
              >
                <Share2 size={14} />
                <span>Share Invite</span>
              </button>

              {/* Have a code? */}
              {redeemedCode ? (
                <div 
                  style={{ 
                    background: 'rgba(26, 182, 128, 0.12)', 
                    color: 'var(--primary)', 
                    borderRadius: '12px', 
                    padding: '8px 12px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Referred by {redeemedCode}</span>
                </div>
              ) : (
                <button 
                  onClick={() => setShowRedeemModal(true)}
                  style={{ 
                    background: 'var(--surface-alt)', 
                    color: 'var(--text-main)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '14px', 
                    padding: '8px 14px', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    cursor: 'pointer' 
                  }}
                >
                  <ArrowRight size={14} />
                  <span>Have a code?</span>
                </button>
              )}
            </div>

            {/* Inline Redeem Dialog */}
            {showRedeemModal && (
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Redeem a Friend&apos;s Referral Code</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter a code to claim your +5 bonus points.</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g. PM89AC12" 
                    value={redeemInput} 
                    onChange={(e) => setRedeemInput(e.target.value)}
                    style={{ 
                      flex: 1, 
                      padding: '8px 14px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border)', 
                      background: 'var(--surface-alt)', 
                      color: 'var(--text-main)', 
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }} 
                  />
                  <button 
                    onClick={handleApplyRedeem}
                    style={{ background: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '12px', padding: '8px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Apply
                  </button>
                  <button 
                    onClick={() => setShowRedeemModal(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppleReveal>

      {/* ── 6. ELECTRONIC HEALTH RECORDS (EHR) ── */}
      <AppleReveal delay={0.3} yOffset={25}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>
            Electronic Health Records (EHR)
          </div>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: '26px', 
              borderRadius: '24px',
              border: '1px solid var(--border)',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '18px' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Cloud Health Records
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 4px', color: 'var(--text-main)' }}>
                  Verified Clinical Timeline
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                  Encrypted diagnoses, prescriptions, and booster milestones.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-ghost" 
                  onClick={exportEHRSummary}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '14px', fontSize: '12px' }}
                >
                  <Download size={14} />
                  <span>Export EHR</span>
                </button>
                <button 
                  className="apple-btn-blue" 
                  onClick={() => openModal('addRecord')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '14px', fontSize: '12px' }}
                >
                  <Plus size={14} />
                  <span>Add Record</span>
                </button>
              </div>
            </div>

            {medicalRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--surface-alt)', borderRadius: '16px' }}>
                No clinical records logged yet. Add your pet&apos;s latest checkup or vaccine record above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {medicalRecords.map((r) => (
                  <div 
                    key={r.id} 
                    style={{ 
                      background: 'var(--surface-alt)', 
                      borderRadius: '16px', 
                      padding: '16px 20px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span 
                          style={{ 
                            background: 'rgba(26, 182, 128, 0.15)', 
                            color: 'var(--primary)', 
                            padding: '3px 10px', 
                            borderRadius: '12px', 
                            fontSize: '11px', 
                            fontWeight: 800 
                          }}
                        >
                          {r.serviceType || 'Consultation'}
                        </span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {r.petName || 'Pet'} ({r.weight || '12 kg'})
                        </strong>
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
                      <span>Fee: <strong>${r.cost || 35}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppleReveal>

      {/* ── 7. SUPPORT & LEGAL GROUP (Matches _buildGroupedCard) ── */}
      <AppleReveal delay={0.35} yOffset={25}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>
            Support &amp; Legal
          </div>
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              borderRadius: '24px',
              border: '1px solid var(--border)'
            }}
          >
            {/* Privacy Policy & Terms */}
            <a 
              href="https://petmaya.app/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', textDecoration: 'none', transition: 'background 0.2s ease' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(38, 166, 154, 0.12)', color: '#26A69A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>Privacy Policy &amp; Terms</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AES-256 encrypted biometric health records</span>
              </div>
              <ExternalLink size={16} color="var(--text-muted)" />
            </a>

            <div style={{ height: '1px', background: 'var(--border)', marginLeft: '74px', marginRight: '16px' }} />

            {/* App Version */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(156, 163, 175, 0.15)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={20} />
              </div>
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <strong style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>App &amp; Web Version</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>v2.4.0 (Build 42) — Production Release</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(26, 182, 128, 0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                Latest
              </span>
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── 8. BANGLADESH 24/7 EMERGENCY SOS HOTLINES ── */}
      <AppleReveal delay={0.4} yOffset={25}>
        <div 
          className="apple-solid-card" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            alignItems: 'stretch', 
            textAlign: 'left', 
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>24/7 Animal Emergency &amp; SOS Hotlines</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Instant casualty triage assistance in Bangladesh</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--text-main)' }}>Central Veterinary Hospital (CVH)</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dhaka • 24/7 Casualty &amp; Surgery Unit</span>
              <a href="tel:+88029331908" style={{ color: '#EF4444', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', textDecoration: 'none' }}>
                <PhoneCall size={14} />
                <span>+880 2-9331908</span>
              </a>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--text-main)' }}>Pet Maya Emergency Tele-Triage</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>On-Call Telehealth Medical Officers</span>
              <a href="tel:+8801800738629" style={{ color: '#EF4444', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', textDecoration: 'none' }}>
                <PhoneCall size={14} />
                <span>+880 1800-PETMAYA</span>
              </a>
            </div>
          </div>
        </div>
      </AppleReveal>

      {/* ── 9. SIGN OUT BUTTON (Matches _buildSignOutButton) ── */}
      <AppleReveal delay={0.45} yOffset={25}>
        <div style={{ padding: '0 2px' }}>
          <button 
            onClick={handleSignOut}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: 'rgba(239, 68, 68, 0.08)', 
              color: '#EF4444', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              fontWeight: 700, 
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={18} />
            <span>Sign Out of Pet Maya</span>
          </button>
        </div>
      </AppleReveal>

      {/* ── 10. PARTNER BRANDING (Matches _buildPartnerBranding) ── */}
      <div style={{ textAlign: 'center', padding: '16px 0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Supported by</span>
          <a 
            href="https://vertexhand.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'underline' }}
          >
            VertexHand
          </a>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', marginTop: '4px' }}>
          Developed by MASA
        </div>
      </div>

    </div>
  );
}
