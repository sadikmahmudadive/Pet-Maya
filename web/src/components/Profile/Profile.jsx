import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  FileText,
  Thermometer,
  Heart,
  Activity,
  Radio,
  Settings,
  CreditCard,
  Phone,
  Video,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  X,
  MapPin,
  Mail,
  Sparkles,
  Zap,
  Check,
  Layers,
  Building2,
  Compass,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  HelpCircle,
  Eye,
  Lock,
  ShoppingBag
} from 'lucide-react';

export default function Profile({ onNavigate }) {
  const { showToast, openModal, cart } = useApp ? useApp() : { showToast: () => {}, openModal: () => {}, cart: [] };
  const { currentUser } = useAuth ? useAuth() : { currentUser: null };

  // Active Patient Selector ('milo' or 'cleo')
  const [activePatientId, setActivePatientId] = useState('milo');

  // Navigation Tabs State
  const [activeNavTab, setActiveNavTab] = useState('ehr-vault'); // 'ehr-vault', 'prescriptions', 'hardware', 'consultations', 'billing', 'settings'

  // Filter Category for Clinical Ledger
  const [ledgerFilter, setLedgerFilter] = useState('all'); // 'all', 'consult', 'lab', 'formulary', 'surgery'

  // Modals State
  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [showRegisterPetModal, setShowRegisterPetModal] = useState(false);
  const [showPdfDossierModal, setShowPdfDossierModal] = useState(false);
  const [showXRayModal, setShowXRayModal] = useState(false);
  const [showLabPdfModal, setShowLabPdfModal] = useState(false);
  const [showManageSubModal, setShowManageSubModal] = useState(false);
  const [showCollarSettingsModal, setShowCollarSettingsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [symptomNote, setSymptomNote] = useState('');

  // Newsletter subscription
  const [footerEmail, setFooterEmail] = useState('');

  // Guardian Bio Form State
  const [guardianName, setGuardianName] = useState(currentUser?.name || 'Tanzim R.');
  const [guardianEmail, setGuardianEmail] = useState(currentUser?.email || 'tanzim@petmaya.app');
  const [guardianAddress, setGuardianAddress] = useState(currentUser?.address || 'Banani, Dhaka, BD • Zone 2');

  const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  const handleSubscribeNewsletter = (e) => {
    e.preventDefault();
    if (!footerEmail || !footerEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    showToast('Subscribed to Clinical Dispatches & Protocols!', 'success');
    setFooterEmail('');
  };

  // Patients Data
  const patientsData = {
    milo: {
      id: 'milo',
      name: 'Milo',
      species: 'CANINE',
      breed: 'Golden Retriever',
      age: '3 yrs 2 mos',
      device: 'Maya Halo™ V3 Active',
      weight: '28.4 kg',
      status: 'Neutered',
      healthIndex: 96,
      avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=160&q=80',
      ehrId: 'EHR-ML-8812',
      restingHr: '68 BPM',
      restingHrNote: 'Normal Resting',
      bodyTemp: '38.3 °C',
      bodyTempNote: 'Afebrile (Ideal)',
      rabiesTitre: 'Compliant',
      rabiesNote: 'Valid Thru Oct 2026',
      nextCheckup: '18 days',
      nextCheckupNote: 'Bi-Annual Wellness',
      hrvTrend: 'Stable Homeostasis (+0.2%)',
      hrvRange: '62 - 74 BPM'
    },
    cleo: {
      id: 'cleo',
      name: 'Cleo',
      species: 'FELINE',
      breed: 'Persian',
      age: '4 yrs',
      device: 'Smart Tag Pro #CL-92',
      weight: '4.1 kg',
      status: 'Spayed',
      nutrition: 'Renal Care',
      healthIndex: 92,
      avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=160&q=80',
      ehrId: 'EHR-CL-4109',
      restingHr: '138 BPM',
      restingHrNote: 'Optimal Feline',
      bodyTemp: '38.6 °C',
      bodyTempNote: 'Afebrile (Ideal)',
      rabiesTitre: 'Compliant',
      rabiesNote: 'Valid Thru Aug 2027',
      nextCheckup: '42 days',
      nextCheckupNote: 'Renal Function Screen',
      hrvTrend: 'Optimal Feline Stasis (±0.0%)',
      hrvRange: '130 - 150 BPM'
    }
  };

  const currentPatient = patientsData[activePatientId] || patientsData.milo;

  return (
    <div style={{
      backgroundColor: '#FAF7F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ════════════════════════════════════════════════════════════════
          1. TOP GLOBAL ANNOUNCEMENT BANNER
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: '#F5EFEB',
        borderBottom: '1px solid rgba(222, 217, 214, 0.8)',
        padding: '7px 16px',
        textAlign: 'center',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: '#675C58',
        textTransform: 'uppercase'
      }}>
        WINTER CLINICAL PROTOCOL • COMPLIMENTARY VETERINARY TELEHEALTH TRIAGE WITH EVERY BESPOKE WELLNESS PLAN.
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. EDITORIAL NAVBAR
          ════════════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(253, 248, 245, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(222, 217, 214, 0.6)'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Brand Logo */}
          <a
            onClick={() => handleRoute('landing')}
            style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', cursor: 'pointer' }}
          >
            <span style={{
              fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
              fontSize: '19px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#160F0C',
              lineHeight: 1
            }}>
              PET MAYA
            </span>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#45848D',
              marginTop: '3px',
              lineHeight: 1
            }}>
              VETERINARY MEDICINE
            </span>
          </a>

          {/* Center Links Capsule */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(248, 243, 239, 0.9)',
            padding: '4px 10px',
            borderRadius: '9999px',
            border: '1px solid rgba(222, 217, 214, 0.7)'
          }}>
            {[
              { label: 'Care Shop', path: 'shop' },
              { label: 'AI Triage', path: 'ai' },
              { label: 'Specialists', path: 'specialists' },
              { label: 'Health Vault', path: 'profile', active: true },
              { label: 'Community', path: 'community' },
              { label: 'Journal', path: 'blog' }
            ].map(item => (
              <button
                key={item.label}
                onClick={() => handleRoute(item.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: item.active ? 700 : 500,
                  color: item.active ? '#160F0C' : '#675C58',
                  textDecoration: item.active ? 'underline' : 'none',
                  textUnderlineOffset: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#160F0C'; }}
                onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.color = '#675C58'; }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* User Avatar */}
            <div
              onClick={() => setShowEditBioModal(true)}
              title={guardianName}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #45848D',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EBE5DF'
              }}
            >
              <img
                src={currentUser?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                alt={guardianName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                }}
              />
            </div>

            <button
              onClick={() => handleRoute('book-vet')}
              style={{
                backgroundColor: '#160F0C',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Book Consult
            </button>

            {/* Bag Icon */}
            <button
              onClick={() => handleRoute('cart')}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#160F0C',
                padding: '4px'
              }}
              title="Dispensary Bag"
            >
              <ShoppingBag size={20} />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                backgroundColor: '#3E7B84',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                fontSize: '9.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          3. MAIN CONTENT CONTAINER
          ════════════════════════════════════════════════════════════════ */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', width: '100%', padding: '24px 24px 80px' }}>

        {/* ── Sub-Header Status Line ── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono, monospace)',
          color: '#3E7B84',
          letterSpacing: '0.06em',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3E7B84' }} />
            <span>ACCOUNT & GUARDIAN RECORDS • REPOSITORY NODE #PM-ACC-4410</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              backgroundColor: 'rgba(62, 123, 132, 0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
              color: '#3E7B84',
              fontWeight: 700
            }}>
              ● AAHA COMPLIANT EHR VAULT
            </span>
            <span style={{ color: '#8C827A' }}>SYNCHRONIZED 2M AGO</span>
          </div>
        </div>

        {/* ── Guardian Card + Registered Clinical Patients (2-Column Hero) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '20px',
          marginBottom: '28px'
        }} className="profile-hero-grid">

          {/* LEFT: Guardian Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #EBE5DF',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div>
              {/* Avatar & Verification Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#EBE5DF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#675C58'
                  }}>
                    TR
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#160F0C' }}>{guardianName}</span>
                      <ShieldCheck size={16} color="#047857" />
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#3E7B84', fontWeight: 600 }}>
                      Premium Care Guardian
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '9.5px',
                  fontFamily: 'monospace',
                  color: '#8C827A',
                  backgroundColor: '#FAF7F5',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid #EFE9E4'
                }}>
                  SINCE JAN 2024
                </span>
              </div>

              {/* Contact List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: '#675C58', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="#8C827A" />
                  <span>{guardianEmail}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="#8C827A" />
                  <span>{guardianAddress}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3E7B84', fontWeight: 600 }}>
                  <Sparkles size={14} color="#3E7B84" />
                  <span>Emergency Direct Hotline Linked</span>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #F5EFEB',
              fontSize: '11.5px'
            }}>
              <span style={{ color: '#675C58', fontWeight: 600 }}>
                ● 2 DEPENDENTS ACTIVE
              </span>
              <button
                onClick={() => setShowEditBioModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#160F0C',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '11.5px'
                }}
              >
                Edit Guardian Bio ➔
              </button>
            </div>
          </div>

          {/* RIGHT: Registered Clinical Patients Carousel / Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#160F0C' }}>
                REGISTERED CLINICAL PATIENTS
              </span>
              <span style={{ fontSize: '11.5px', color: '#8C827A' }}>
                Swipe or click to view continuous bio-telemetry
              </span>
            </div>

            {/* Patient Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '10px'
            }}>

              {/* Patient 1: Milo */}
              <div
                onClick={() => {
                  setActivePatientId('milo');
                  showToast("Milo's longitudinal records loaded", 'info');
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: activePatientId === 'milo' ? '2px solid #3E7B84' : '1px solid #EBE5DF',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  boxShadow: activePatientId === 'milo' ? '0 4px 14px rgba(62, 123, 132, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={patientsData.milo.avatarUrl}
                      alt="Milo"
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>Milo</span>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          backgroundColor: '#EBE5DF',
                          color: '#675C58',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          CANINE
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#707973' }}>
                        Golden Retriever • 3 yrs 2 mos
                      </div>
                      <div style={{ fontSize: '11px', color: '#3E7B84', fontWeight: 600 }}>
                        Maya Halo™ V3 Active
                      </div>
                    </div>
                  </div>

                  {activePatientId === 'milo' ? (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(62, 123, 132, 0.12)',
                      color: '#3E7B84',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      letterSpacing: '0.04em'
                    }}>
                      ● ACTIVE DOSSIER
                    </span>
                  ) : (
                    <span style={{ fontSize: '9.5px', color: '#8C827A', fontFamily: 'monospace' }}>PATIENT 01</span>
                  )}
                </div>

                {/* Metrics 3 Cols */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: '#FAF7F5',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid #EFE9E4',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>WEIGHT</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>28.4 <span style={{ fontSize: '10px', fontWeight: 500 }}>kg</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>STATUS</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>Neutered</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>HEALTH INDEX</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#3E7B84' }}>96<span style={{ fontSize: '10px', color: '#8C827A' }}>/100</span></div>
                  </div>
                </div>

                {/* Sub-status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#3E7B84', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Radio size={11} /> Bio-Telemetry Streaming
                  </span>
                  <span style={{ color: '#047857', fontWeight: 600 }}>Records Loaded ✓</span>
                </div>
              </div>

              {/* Patient 2: Cleo */}
              <div
                onClick={() => {
                  setActivePatientId('cleo');
                  showToast("Cleo's longitudinal records loaded", 'info');
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: activePatientId === 'cleo' ? '2px solid #3E7B84' : '1px solid #EBE5DF',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  boxShadow: activePatientId === 'cleo' ? '0 4px 14px rgba(62, 123, 132, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={patientsData.cleo.avatarUrl}
                      alt="Cleo"
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>Cleo</span>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          backgroundColor: '#EBE5DF',
                          color: '#675C58',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          FELINE
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#707973' }}>
                        Persian • 4 yrs • Spayed
                      </div>
                      <div style={{ fontSize: '11px', color: '#675C58' }}>
                        Smart Tag Pro #CL-92
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '9.5px', color: '#8C827A', fontFamily: 'monospace' }}>PATIENT 02</span>
                </div>

                {/* Metrics 3 Cols */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: '#FAF7F5',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid #EFE9E4',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>WEIGHT</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>4.1 <span style={{ fontSize: '10px', fontWeight: 500 }}>kg</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>NUTRITION</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>Renal Care</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>HEALTH INDEX</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#3E7B84' }}>92<span style={{ fontSize: '10px', color: '#8C827A' }}>/100</span></div>
                  </div>
                </div>

                {/* Sub-status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#8C827A' }}>((•)) Last sync 4h ago</span>
                  <span style={{ color: '#160F0C', fontWeight: 600 }}>Switch Companion ⇄</span>
                </div>
              </div>

            </div>

            {/* Bottom Register Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              color: '#8C827A'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#3E7B84" />
                Encrypted end-to-end companion cloud repository
              </span>
              <button
                onClick={() => setShowRegisterPetModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#3E7B84',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ⊕ Register New Companion
              </button>
            </div>
          </div>

        </div>

        {/* ── 4. Horizontal Navigation Tabs Bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '28px',
          borderBottom: '1px solid #EBE5DF'
        }}>
          {[
            { id: 'ehr-vault', label: 'Medical EHR Vault', icon: FileText },
            { id: 'prescriptions', label: 'Active Prescriptions & Subscriptions', icon: Layers },
            { id: 'hardware', label: 'Hardware Devices & Collars', icon: Radio },
            { id: 'consultations', label: 'Consultation History', icon: Calendar },
            { id: 'billing', label: 'Billing & Membership', icon: CreditCard },
            { id: 'settings', label: 'Account Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveNavTab(tab.id);
                  if (tab.id === 'prescriptions') handleRoute('orders');
                  if (tab.id === 'hardware') handleRoute('pet-gps');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: isActive ? 'rgba(62, 123, 132, 0.12)' : '#FFFFFF',
                  color: isActive ? '#3E7B84' : '#675C58',
                  border: isActive ? '1.5px solid #3E7B84' : '1px solid #EBE5DF',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} color={isActive ? '#3E7B84' : '#8C827A'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 5. Main 2-Column Body Layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '28px',
          alignItems: 'start'
        }} className="profile-main-grid">

          {/* ════════════════════════════════════════════════════════════════
              LEFT COLUMN: Longitudinal Health Records & Biometrics
              ════════════════════════════════════════════════════════════════ */}
          <div>

            {/* Longitudinal Vitals & Telemetry Trend Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #EBE5DF',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>

              {/* Title & Export PDF Dossier Row */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#3E7B84',
                    marginBottom: '4px'
                  }}>
                    PATIENT {currentPatient.ehrId} • CONTINUOUS CLOUD REPO
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#160F0C',
                    margin: 0,
                    lineHeight: 1.2
                  }}>
                    {currentPatient.name}'s Longitudinal Health<br />Records & Biometrics
                  </h2>
                </div>

                <button
                  onClick={() => setShowPdfDossierModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '9999px',
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2C221E'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#160F0C'; }}
                >
                  <Download size={14} />
                  Export Certified PDF Dossier
                </button>
              </div>

              {/* 4 Vitals Stat Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {/* 1. Resting HR */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  borderRadius: '14px',
                  border: '1px solid #EFE9E4',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase' }}>
                      RESTING HR
                    </span>
                    <Heart size={14} color="#3E7B84" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#160F0C', lineHeight: 1.1 }}>
                    {currentPatient.restingHr}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600, marginTop: '4px' }}>
                    {currentPatient.restingHrNote}
                  </div>
                </div>

                {/* 2. Body Temp */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  borderRadius: '14px',
                  border: '1px solid #EFE9E4',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase' }}>
                      BODY TEMP
                    </span>
                    <Thermometer size={14} color="#3E7B84" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#160F0C', lineHeight: 1.1 }}>
                    {currentPatient.bodyTemp}
                  </div>
                  <div style={{ fontSize: '11px', color: '#3E7B84', fontWeight: 600, marginTop: '4px' }}>
                    {currentPatient.bodyTempNote}
                  </div>
                </div>

                {/* 3. Rabies Titre */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  borderRadius: '14px',
                  border: '1px solid #EFE9E4',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase' }}>
                      RABIES TITRE
                    </span>
                    <ShieldCheck size={14} color="#3E7B84" />
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', lineHeight: 1.1 }}>
                    {currentPatient.rabiesTitre}
                  </div>
                  <div style={{ fontSize: '11px', color: '#675C58', marginTop: '4px' }}>
                    {currentPatient.rabiesNote}
                  </div>
                </div>

                {/* 4. Next Checkup */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  borderRadius: '14px',
                  border: '1px solid #EFE9E4',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase' }}>
                      NEXT CHECKUP
                    </span>
                    <Calendar size={14} color="#3E7B84" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#160F0C', lineHeight: 1.1 }}>
                    {currentPatient.nextCheckup}
                  </div>
                  <div style={{ fontSize: '11px', color: '#3E7B84', fontWeight: 600, marginTop: '4px' }}>
                    {currentPatient.nextCheckupNote}
                  </div>
                </div>
              </div>

              {/* 30-Day Heart Rate Variability (Telemetry Trend Spline Curve) */}
              <div style={{
                backgroundColor: '#FAF7F5',
                borderRadius: '14px',
                border: '1px solid #EFE9E4',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8C827A',
                  marginBottom: '10px'
                }}>
                  <span>30-DAY HEART RATE VARIABILITY (TELEMETRY TREND)</span>
                  <span style={{ color: '#3E7B84' }}>{currentPatient.hrvTrend}</span>
                </div>

                {/* SVG Curve */}
                <div style={{ height: '70px', width: '100%', position: 'relative' }}>
                  <svg viewBox="0 0 540 70" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="profileHrvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3E7B84" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3E7B84" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient fill */}
                    <path
                      d="M 0 48 C 60 50, 110 32, 180 44 C 250 56, 320 30, 390 42 C 450 50, 490 25, 540 38 L 540 70 L 0 70 Z"
                      fill="url(#profileHrvGrad)"
                    />

                    {/* Spline line */}
                    <path
                      d="M 0 48 C 60 50, 110 32, 180 44 C 250 56, 320 30, 390 42 C 450 50, 490 25, 540 38"
                      fill="none"
                      stroke="#3E7B84"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Key nodes */}
                    <circle cx="0" cy="48" r="3" fill="#3E7B84" />
                    <circle cx="180" cy="44" r="3" fill="#3E7B84" />
                    <circle cx="390" cy="42" r="3" fill="#3E7B84" />
                    <circle cx="540" cy="38" r="5" fill="#3E7B84" />
                    <circle cx="540" cy="38" r="9" fill="#3E7B84" opacity="0.3" className="animate-ping" />
                  </svg>
                </div>

                {/* Timestamps */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  color: '#8C827A',
                  fontFamily: 'monospace',
                  marginTop: '6px'
                }}>
                  <span>DAY 1 (OCT 01)</span>
                  <span>DAY 14</span>
                  <span style={{ color: '#160F0C', fontWeight: 700 }}>TODAY (STABLE RANGE: {currentPatient.hrvRange})</span>
                </div>
              </div>

            </div>

            {/* ── Chronological Clinical Ledger ── */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#160F0C',
                  margin: 0
                }}>
                  Chronological Clinical Ledger
                </h3>

                <button
                  onClick={() => showToast('Filtered by All Clinical Categories', 'info')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D6CEC7',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#160F0C',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Filter Category
                </button>
              </div>

              {/* Entry 1: Follow-up Wellness Consultation */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #EBE5DF',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(62, 123, 132, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3E7B84',
                    flexShrink: 0
                  }}>
                    <Calendar size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#8C827A', fontFamily: 'monospace' }}>
                          OCT 24, 2026 • 10:30 AM
                        </span>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(62, 123, 132, 0.12)',
                          color: '#3E7B84',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          SCHEDULED & CONFIRMED
                        </span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#675C58' }}>
                        Attending: <strong>Dr. Evelyn Vance, MRCVS</strong>
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#160F0C', margin: '0 0 6px 0' }}>
                      Follow-up Wellness Consultation & Stool Culture
                    </h4>

                    <p style={{ fontSize: '12.5px', color: '#675C58', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                      Quarterly companion gastrointestinal assessment, review of post-prophylaxis recovery metrics, and broad-spectrum fecal parasitology culture screening. Telehealth pre-intake questionnaire completed by guardian.
                    </p>

                    {/* Bottom Action Bar */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #F5EFEB'
                    }}>
                      <span style={{ fontSize: '11.5px', color: '#3E7B84', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Video size={13} /> Telehealth link will activate 15 minutes before session
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setShowRescheduleModal(true)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D6CEC7',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#160F0C',
                            cursor: 'pointer'
                          }}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => setShowSymptomsModal(true)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            backgroundColor: '#3E7B84',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          Add Symptoms / Photos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entry 2: Comprehensive Serum Biochemistry Panel */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #EBE5DF',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(62, 123, 132, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3E7B84',
                    flexShrink: 0
                  }}>
                    <Activity size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#8C827A', fontFamily: 'monospace' }}>
                          OCT 12, 2026 • 02:15 PM
                        </span>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          backgroundColor: '#EBE5DF',
                          color: '#675C58',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          CENTRAL LAB PATHOLOGY
                        </span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#675C58' }}>
                        Pathologist: <strong>Dr. Arman K.</strong>
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#160F0C', margin: '0 0 6px 0' }}>
                      Comprehensive Serum Biochemistry Panel (14-Point)
                    </h4>

                    <p style={{ fontSize: '12.5px', color: '#675C58', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                      Quantitative assay evaluating renal function (BUN: 18 mg/dL, Creatinine: 1.1 mg/dL), hepatic profiles (ALT: 42 U/L, ALP: 78 U/L), electrolytes, and total protein. All 14 biomarkers within canine normal thresholds.
                    </p>

                    {/* 4 Biomarkers Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      backgroundColor: '#FAF7F5',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EFE9E4',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>ALT (HEPATIC)</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C' }}>
                          42 <span style={{ fontSize: '10px', color: '#047857', fontWeight: 700 }}>Optimal</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>CREATININE</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C' }}>
                          1.1 <span style={{ fontSize: '10px', color: '#047857', fontWeight: 700 }}>Optimal</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>BLOOD GLUCOSE</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C' }}>
                          92 <span style={{ fontSize: '10px', color: '#675C58' }}>mg/dL</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>TOTAL PROTEIN</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C' }}>
                          6.4 <span style={{ fontSize: '10px', color: '#675C58' }}>g/dL</span>
                        </div>
                      </div>
                    </div>

                    {/* PDF Attachment Box */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #EBE5DF'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#3E7B84" />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C', fontFamily: 'monospace' }}>
                            LAB-BIOCHEM-20261012-MILO.PDF
                          </div>
                          <div style={{ fontSize: '10px', color: '#8C827A' }}>
                            Digital cryptographic signature verified • 2.4 MB
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowLabPdfModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#3E7B84',
                          cursor: 'pointer'
                        }}
                      >
                        ⬇ View PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entry 3: Preventative Formulary Dispatched & Delivered */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #EBE5DF',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(62, 123, 132, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3E7B84',
                    flexShrink: 0
                  }}>
                    <Layers size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#8C827A', fontFamily: 'monospace' }}>
                          OCT 04, 2026 • 11:18 AM
                        </span>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          backgroundColor: '#EBE5DF',
                          color: '#675C58',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          COLD-CHAIN AUTO-FORMULARY
                        </span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#3E7B84', fontWeight: 600 }}>
                        ● DELIVERED TO BANANI RESIDENCE
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#160F0C', margin: '0 0 6px 0' }}>
                      Preventative Formulary Dispatched & Delivered
                    </h4>

                    <div style={{ fontSize: '12px', color: '#675C58', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>• NexGard Spectra (15.1 - 30kg) - 3 Chews Monthly Regimen</div>
                      <div>• Purina Pro Plan Veterinary Diets FortiFlora Canine Probiotic</div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#8C827A',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #F5EFEB'
                    }}>
                      <span>Rx Approved: Dr. Vance</span>
                      <span>Batch: FFP-9022</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entry 4: Ultrasonic Dental Prophylaxis & Polish */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #EBE5DF',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(62, 123, 132, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3E7B84',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#8C827A', fontFamily: 'monospace' }}>
                          AUG 12, 2026 • 09:00 AM
                        </span>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          backgroundColor: '#EBE5DF',
                          color: '#675C58',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          SURGICAL THEATRE
                        </span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#675C58' }}>
                        Surgeon: <strong>Dr. Tariq H., MRCVS</strong>
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#160F0C', margin: '0 0 6px 0' }}>
                      Ultrasonic Dental Prophylaxis & Polish
                    </h4>

                    <p style={{ fontSize: '12.5px', color: '#675C58', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                      Supragingival and subgingival ultrasonic scaling under isoflurane general anesthesia. Full-mouth dental radiographs revealed no periodontal bone loss or root resorption. Gingival sulcus depths normal (&lt;2mm).
                    </p>

                    {/* Radiograph DICOM Link */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #EBE5DF'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ImageIcon size={16} color="#3E7B84" />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#160F0C', fontFamily: 'monospace' }}>
                            DENTAL-XRAY-SERIES-10P.DICOM
                          </div>
                          <div style={{ fontSize: '10px', color: '#8C827A' }}>
                            High-res oral radiology series • 18.2 MB
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowXRayModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#3E7B84',
                          cursor: 'pointer'
                        }}
                      >
                        👁 Examine Series
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Load Earlier Records Button */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  onClick={() => showToast('All historical archives (2024-2025) are fully synchronized and available in permanent cloud vault.', 'info')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D6CEC7',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#675C58',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} /> Load Earlier Archived Clinical Records (2024 - 2025)
                </button>
              </div>

            </div>

          </div>

          {/* ════════════════════════════════════════════════════════════════
              RIGHT SIDEBAR: Care Tier, Maya Halo, Emergency Trauma, Consent
              ════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 1. Active Care Tier Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #EBE5DF',
              padding: '22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3E7B84' }}>
                  ACTIVE CARE TIER
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', lineHeight: 1 }}>৳499</div>
                  <div style={{ fontSize: '9px', color: '#8C827A' }}>/ MONTH</div>
                </div>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', margin: '0 0 4px 0' }}>
                Pet Maya Pro Care Plan
              </h3>
              <div style={{ fontSize: '11px', color: '#8C827A', marginBottom: '14px' }}>
                Next billing date: <strong>November 18, 2026</strong> via Visa •••• 4818
              </div>

              {/* Feature Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#675C58', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#047857" />
                  <span>Unlimited 24/7 AI Vision Symptom Triage</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#047857" />
                  <span>2 Free Veterinary Telehealth Consults/mo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#047857" />
                  <span>Zero-Fee Cold-Chain Dispensary Delivery</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#047857" />
                  <span>Continuous Cloud Hardware Telemetry</span>
                </div>
              </div>

              <button
                onClick={() => setShowManageSubModal(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #D6CEC7',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#160F0C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Settings size={13} /> Manage Subscription & Add-ons
              </button>
            </div>

            {/* 2. Maya Halo™ V3 Smart Collar Status Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #EBE5DF',
              padding: '22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} color="#3E7B84" />
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>
                    Maya Halo™ V3
                  </span>
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#047857',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  ONLINE
                </span>
              </div>

              {/* Hardware Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#675C58', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Collar Battery</span>
                    <strong style={{ color: '#160F0C' }}>89% (Est. 12 Days Left)</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#FAF7F5', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '89%', height: '100%', backgroundColor: '#10B981', borderRadius: '3px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Firmware</span>
                  <strong style={{ color: '#160F0C' }}>v3.4.1 (Up to date)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Safe Geofence</span>
                  <strong style={{ color: '#3E7B84' }}>Home Sanctuary Active</strong>
                </div>
              </div>

              {/* Location Pinpoint */}
              <div style={{
                backgroundColor: '#FAF7F5',
                borderRadius: '10px',
                padding: '10px 12px',
                border: '1px solid #EFE9E4',
                fontSize: '11px',
                color: '#675C58',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px'
              }}>
                <div>
                  <strong style={{ color: '#160F0C' }}>Current Pinpoint: Banani Sanctuary</strong>
                  <div style={{ color: '#8C827A', fontSize: '10px', marginTop: '2px' }}>
                    Accuracy ±1.2 meters • LTE-M Connected
                  </div>
                </div>
                <MapPin size={14} color="#3E7B84" />
              </div>

              <button
                onClick={() => setShowCollarSettingsModal(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #D6CEC7',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#160F0C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Settings size={13} /> Collar Diagnostic Settings
              </button>
            </div>

            {/* 3. Critical Veterinary Dispatch (Emergency Trauma Protocol) */}
            <div style={{
              backgroundColor: '#160F0C',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(22, 15, 12, 0.2)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#F87171',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                CRITICAL VETERINARY DISPATCH
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0', color: '#FFFFFF' }}>
                Emergency Trauma Protocol
              </h3>

              <p style={{ fontSize: '11.5px', color: '#D1D5DB', lineHeight: 1.45, margin: '0 0 14px 0' }}>
                Direct telemetry bypass routing to on-duty trauma triage clinicians. Automatic medical record pre-loading at hospital intake.
              </p>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11px',
                color: '#E5E7EB',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9CA3AF' }}>ASSIGNED HOSPITAL:</span>
                  <strong>Pet Maya Central Banani</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9CA3AF' }}>TRANSIT TIME:</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>~6 mins (Road 11)</span>
                </div>
              </div>

              <a
                href="tel:10805550198"
                onClick={() => showToast('Initiating priority clinical bypass call...', 'info')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '9999px',
                  backgroundColor: '#3E7B84',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <Phone size={14} /> Priority Clinical Line: +1 080 555-0198
              </a>
            </div>

            {/* 4. Guardian Telehealth Consent Active Box */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EBE5DF',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <ShieldCheck size={16} color="#047857" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C', marginBottom: '2px' }}>
                  Guardian Telehealth Consent Active
                </div>
                <div style={{ fontSize: '11px', color: '#675C58', lineHeight: 1.45 }}>
                  Authorized for remote diagnostic evaluations and tele-formulary cold deliveries under Bangladesh Veterinary Council & AAHA guidelines.
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ════════════════════════════════════════════════════════════════
          6. REFERENCE-EXACT EDITORIAL FOOTER
          ════════════════════════════════════════════════════════════════ */}
      <footer style={{
        backgroundColor: '#FDF8F5',
        borderTop: '1px solid rgba(222, 217, 214, 0.8)',
        padding: '48px 24px 28px',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          
          {/* Main Footer Directory Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr',
            gap: '36px',
            paddingBottom: '36px',
            borderBottom: '1px solid #EBE5DF'
          }} className="profile-footer-grid">

            {/* Col 1: Brand & Clinical Newsletter */}
            <div>
              <div style={{
                fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '8px'
              }}>
                PET MAYA
              </div>
              <p style={{ fontSize: '12.5px', color: '#675C58', lineHeight: 1.55, margin: '0 0 16px 0', maxWidth: '320px' }}>
                Evidence-based companion clinical medicine, intelligent continuous bio-telemetry, and bespoke preventative care regimens designed for lifelong wellness.
              </p>

              <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#160F0C', marginBottom: '6px' }}>
                CLINICAL DISPATCHES & PROTOCOLS
              </div>
              <form onSubmit={handleSubscribeNewsletter} style={{ display: 'flex', gap: '6px', maxWidth: '320px' }}>
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="Enter veterinary guardian email"
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    border: '1px solid #D6CEC7',
                    fontSize: '11.5px',
                    outline: 'none',
                    backgroundColor: '#FFFFFF'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#3E7B84',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Col 2: Clinical Ecosystem */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '14px'
              }}>
                CLINICAL ECOSYSTEM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <a onClick={() => handleRoute('shop')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Prescription Dispensary</a>
                <a onClick={() => handleRoute('specialists')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Telehealth Board</a>
                <a onClick={() => handleRoute('ai')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Diagnostic AI Triage</a>
                <a onClick={() => handleRoute('digital-pet-passport')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Comprehensive Vault</a>
                <a onClick={() => handleRoute('pet-gps')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Biometric Radar</a>
              </div>
            </div>

            {/* Col 3: Accredited Care */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '14px'
              }}>
                ACCREDITED CARE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <a onClick={() => handleRoute('about')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>AAHA Standards</a>
                <a onClick={() => handleRoute('shop')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>NABP Pharmacy</a>
                <a onClick={() => handleRoute('features')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Pathology Panels</a>
                <a onClick={() => handleRoute('blog')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Clinical Trials</a>
                <a onClick={() => handleRoute('contact')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Emergency Network</a>
              </div>
            </div>

            {/* Col 4: Accreditation & Certification Box */}
            <div>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #EBE5DF',
                padding: '16px',
                fontSize: '11.5px',
                color: '#675C58'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: '#160F0C', textTransform: 'uppercase', marginBottom: '6px' }}>
                  ACCREDITATION & CERTIFICATION
                </div>
                <p style={{ lineHeight: 1.5, margin: '0 0 10px 0', fontSize: '11px' }}>
                  Certified under American Animal Hospital Association (AAHA) telehealth and remote patient monitoring protocol guidelines. License #VM-992014-CA.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '11px' }}>
                  <ShieldCheck size={14} />
                  Verified Veterinary Medical Board
                </div>
              </div>
            </div>

          </div>

          {/* Legal Bottom Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingTop: '20px',
            fontSize: '11.5px',
            color: '#8C827A'
          }}>
            <div>
              © 2026 Pet Maya Health Systems, Inc. All rights reserved. Companion wellness elevated.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span onClick={() => handleRoute('privacy')} style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span>•</span>
              <span onClick={() => handleRoute('terms')} style={{ cursor: 'pointer' }}>Terms of Service</span>
              <span>•</span>
              <span onClick={() => handleRoute('terms')} style={{ cursor: 'pointer' }}>Telehealth Consent</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          7. MODALS
          ════════════════════════════════════════════════════════════════ */}

      {/* Edit Bio Modal */}
      {showEditBioModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowEditBioModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: '#160F0C' }}>
              Edit Guardian Profile Bio
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#675C58', textTransform: 'uppercase' }}>Guardian Name</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#675C58', textTransform: 'uppercase' }}>Email</label>
                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#675C58', textTransform: 'uppercase' }}>Primary Residence & Zone</label>
                <input
                  type="text"
                  value={guardianAddress}
                  onChange={(e) => setGuardianAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('Guardian profile updated successfully', 'success');
                  setShowEditBioModal(false);
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditBioModal(false)}
                style={{ padding: '11px 20px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Pet Modal */}
      {showRegisterPetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowRegisterPetModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              Register New Companion
            </h3>
            <p style={{ fontSize: '12px', color: '#707973', margin: '0 0 16px 0' }}>
              Add a new canine or feline patient to your guardian encrypted health vault.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Companion Name (e.g. Luna)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
              />
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}>
                <option value="canine">Canine (Dog)</option>
                <option value="feline">Feline (Cat)</option>
              </select>
              <input
                type="text"
                placeholder="Breed (e.g. Labrador Retriever)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                placeholder="ISO Microchip Number (Optional)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('New companion registered and provisioned in Cloud Repository!', 'success');
                  setShowRegisterPetModal(false);
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Provision Patient Vault
              </button>
              <button
                onClick={() => setShowRegisterPetModal(false)}
                style={{ padding: '11px 20px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Certified Dossier Modal */}
      {showPdfDossierModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '540px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPdfDossierModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <FileCheck size={26} color="#047857" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#160F0C' }}>
                  Certified Longitudinal Medical Dossier
                </h3>
                <div style={{ fontSize: '11.5px', color: '#707973' }}>
                  Patient: {currentPatient.name} ({currentPatient.ehrId})
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#FAF7F5',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '12.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px',
              border: '1px solid #EBE5DF'
            }}>
              <div><strong>Vaccination & Rabies Titre:</strong> Verified Compliant (Expires Oct 2026)</div>
              <div><strong>Biochemistry Panel:</strong> 14 Biomarkers Normal (ALT 42, Creatinine 1.1)</div>
              <div><strong>Surgical History:</strong> Ultrasonic Dental Prophylaxis (Aug 2026)</div>
              <div><strong>Continuous Biometrics:</strong> HRV Stasis Normal (62 - 74 BPM)</div>
              <div><strong>Cryptographic Authenticity:</strong> BSEC Digital Cert #EHR-ML-8812-2026</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('Official Certified PDF Dossier downloaded', 'success');
                  setShowPdfDossierModal(false);
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Download Official PDF Dossier
              </button>
              <button
                onClick={() => setShowPdfDossierModal(false)}
                style={{ padding: '11px 20px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* X-Ray Modal */}
      {showXRayModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#160F0C',
            color: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowXRayModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Oral Radiology Series (DICOM Viewer)
            </h3>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 16px 0' }}>
              Full-mouth digital radiograph series for Milo • Surgeon: Dr. Tariq H., MRCVS
            </p>

            <div style={{
              height: '240px',
              backgroundColor: '#000000',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(62,123,132,0.2) 0%, rgba(0,0,0,0.8) 100%)'
              }} />
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <ImageIcon size={48} color="#3E7B84" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700 }}>10-Point High-Res Dental Orthopantomogram</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>All roots intact • Zero bone resorption</div>
              </div>
            </div>

            <button
              onClick={() => setShowXRayModal(false)}
              style={{ width: '100%', padding: '11px', borderRadius: '9999px', backgroundColor: '#3E7B84', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Close Radiograph Viewer
            </button>
          </div>
        </div>
      )}

      {/* Lab PDF Modal */}
      {showLabPdfModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowLabPdfModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              LAB-BIOCHEM-20261012-MILO.PDF
            </h3>
            <div style={{ fontSize: '12px', color: '#707973', marginBottom: '16px' }}>
              Central Lab Pathology • Dr. Arman K.
            </div>

            <div style={{
              backgroundColor: '#FAF7F5',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '12.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '18px'
            }}>
              <div><strong>BUN:</strong> 18 mg/dL (Normal: 7 - 27)</div>
              <div><strong>Creatinine:</strong> 1.1 mg/dL (Normal: 0.5 - 1.5)</div>
              <div><strong>ALT:</strong> 42 U/L (Normal: 10 - 125)</div>
              <div><strong>ALP:</strong> 78 U/L (Normal: 23 - 212)</div>
              <div><strong>Blood Glucose:</strong> 92 mg/dL (Normal: 70 - 143)</div>
              <div><strong>Total Protein:</strong> 6.4 g/dL (Normal: 5.2 - 8.2)</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('Pathology report PDF downloaded', 'success');
                  setShowLabPdfModal(false);
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Download PDF
              </button>
              <button
                onClick={() => setShowLabPdfModal(false)}
                style={{ padding: '10px 18px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Subscription Modal */}
      {showManageSubModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowManageSubModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              Manage Pro Care Plan
            </h3>
            <div style={{ fontSize: '12px', color: '#707973', marginBottom: '16px' }}>
              Tier: ৳499 / Month • Billed to Visa ending in 4818
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  showToast('Add-on: Annual Complete Pathology Screening added to next cycle', 'success');
                  setShowManageSubModal(false);
                }}
                style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px' }}
              >
                <strong>+ Add Annual Pathology Screening</strong>
                <div style={{ fontSize: '11px', color: '#707973' }}>৳1,200 / annual billing</div>
              </button>
              <button
                onClick={() => {
                  showToast('Billing cycle updated to Annual (Save 20%)', 'success');
                  setShowManageSubModal(false);
                }}
                style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px' }}
              >
                <strong>Switch to Annual Plan (৳4,790/yr - Save 20%)</strong>
                <div style={{ fontSize: '11px', color: '#707973' }}>Includes 4 free cold-chain dispatches</div>
              </button>
            </div>

            <button
              onClick={() => setShowManageSubModal(false)}
              style={{ width: '100%', padding: '11px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Collar Settings Modal */}
      {showCollarSettingsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowCollarSettingsModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              Maya Halo™ V3 Settings
            </h3>
            <div style={{ fontSize: '12px', color: '#707973', marginBottom: '16px' }}>
              Serial: #HL-88210 • Firmware: v3.4.1
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  showToast('Acoustic locator chime triggered on collar (85dB)', 'info');
                  setShowCollarSettingsModal(false);
                }}
                style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px' }}
              >
                <strong>🔊 Sound Acoustic Beacon Chime</strong>
                <div style={{ fontSize: '11px', color: '#707973' }}>Help locate pet in darkness or brush</div>
              </button>
              <button
                onClick={() => {
                  handleRoute('pet-gps');
                  setShowCollarSettingsModal(false);
                }}
                style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px' }}
              >
                <strong>🗺 Open Live Polar Satellite Radar</strong>
                <div style={{ fontSize: '11px', color: '#707973' }}>Sub-2-meter real-time coordinates</div>
              </button>
            </div>

            <button
              onClick={() => setShowCollarSettingsModal(false)}
              style={{ width: '100%', padding: '11px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Consultation Modal */}
      {showRescheduleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowRescheduleModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              Reschedule Telehealth Consult
            </h3>
            <div style={{ fontSize: '12px', color: '#707973', marginBottom: '16px' }}>
              Attending Clinician: Dr. Evelyn Vance, MRCVS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  showToast('Consultation rescheduled to Oct 26, 2026 at 11:00 AM', 'success');
                  setShowRescheduleModal(false);
                }}
                style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px' }}
              >
                <strong>Mon, Oct 26 • 11:00 AM</strong>
                <div style={{ fontSize: '11px', color: '#707973' }}>Available HD Video Slot</div>
              </button>
              <button
                onClick={() => {
                  showToast('Consultation rescheduled to Oct 27, 2026 at 04:30 PM', 'success');
                  setShowRescheduleModal(false);
                }}
                style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px' }}
              >
                <strong>Tue, Oct 27 • 04:30 PM</strong>
                <div style={{ fontSize: '11px', color: '#707973' }}>Available HD Video Slot</div>
              </button>
            </div>

            <button
              onClick={() => setShowRescheduleModal(false)}
              style={{ width: '100%', padding: '11px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Symptoms / Photos Modal */}
      {showSymptomsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowSymptomsModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              Add Symptoms & Clinical Photos
            </h3>
            <p style={{ fontSize: '12px', color: '#707973', margin: '0 0 14px 0' }}>
              Upload pre-intake photos or symptom notes for Dr. Evelyn Vance to review prior to the call.
            </p>

            <textarea
              value={symptomNote}
              onChange={(e) => setSymptomNote(e.target.value)}
              placeholder="Describe observations, stool consistency, appetite changes, or behavior..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', fontSize: '12.5px', marginBottom: '14px', boxSizing: 'border-box' }}
            />

            <div style={{
              border: '1.5px dashed #D6CEC7',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#FAF7F5',
              marginBottom: '18px',
              cursor: 'pointer'
            }}
            onClick={() => showToast('Photo attachment simulation: 1 image attached', 'info')}
            >
              <Upload size={20} color="#3E7B84" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>Click to upload symptom photo</div>
              <div style={{ fontSize: '10.5px', color: '#8C827A' }}>Supports JPEG, PNG, DICOM up to 25MB</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('Symptoms and photos attached to Dr. Vance\'s consultation dossier!', 'success');
                  setShowSymptomsModal(false);
                  setSymptomNote('');
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '9999px', backgroundColor: '#160F0C', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Attach to Intake Dossier
              </button>
              <button
                onClick={() => setShowSymptomsModal(false)}
                style={{ padding: '11px 20px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Inline CSS for responsive grid & animations */}
      <style>{`
        @media (max-width: 960px) {
          .profile-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-main-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>

    </div>
  );
}
