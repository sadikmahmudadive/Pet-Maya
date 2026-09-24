import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import EditorialNavbar from '../Navigation/EditorialNavbar';
import { generatePetMedicalPassport } from '../../services/pdfGenerator';
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
  ShoppingBag,
  User,
  UserCheck,
  Bell,
  Key,
  LogOut,
  ArrowRight,
  Shield
} from 'lucide-react';

export default function Profile({ onNavigate, initialTab = 'settings' }) {
  const { 
    showToast, 
    openModal, 
    cart = [], 
    pets = [], 
    addPet, 
    updatePet, 
    deletePet, 
    devices = [],
    medicalRecords = [], 
    addMedicalRecord, 
    deleteMedicalRecord,
    uploadImageFile 
  } = useApp ? useApp() : { showToast: () => {}, openModal: () => {}, cart: [] };
  const { currentUser, updateUserProfile, logout, resetPassword } = useAuth ? useAuth() : { currentUser: null, updateUserProfile: () => {}, logout: () => {}, resetPassword: () => {} };

  // Active Patient Selector
  const [activePatientId, setActivePatientId] = useState('');

  // Navigation Tabs State: Defaults to 'settings' (Guardian Profile)
  const [activeNavTab, setActiveNavTab] = useState(initialTab || 'settings');

  useEffect(() => {
    if (initialTab) {
      setActiveNavTab(initialTab);
    }
  }, [initialTab]);

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

  // Register Companion Form State
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('Canine');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetMicrochip, setNewPetMicrochip] = useState('');
  const [newPetAge, setNewPetAge] = useState('');
  const [newPetWeight, setNewPetWeight] = useState('');
  const [newPetPhoto, setNewPetPhoto] = useState('');
  const [isRegisteringPet, setIsRegisteringPet] = useState(false);

  // Newsletter subscription
  const [footerEmail, setFooterEmail] = useState('');

  // Guardian Bio & Settings Form State
  const [guardianName, setGuardianName] = useState(currentUser?.displayName || currentUser?.name || 'Care Guardian');
  const [guardianEmail, setGuardianEmail] = useState(currentUser?.email || '');
  const [guardianPhone, setGuardianPhone] = useState(currentUser?.phone || '+880 1712-345678');
  const [guardianAddress, setGuardianAddress] = useState(currentUser?.address || 'Banani, Dhaka, Bangladesh');
  const [emergencyContact, setEmergencyContact] = useState('Adnan Mahmud (+880 1819-998877)');
  const [preferredClinic, setPreferredClinic] = useState('Pet Maya Central Banani Triage Node');
  const [guardianPhoto, setGuardianPhoto] = useState(currentUser?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80');

  // Real-time synchronization when currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name || currentUser.displayName) setGuardianName(currentUser.name || currentUser.displayName);
      if (currentUser.email) setGuardianEmail(currentUser.email);
      if (currentUser.phone) setGuardianPhone(currentUser.phone);
      if (currentUser.address) setGuardianAddress(currentUser.address);
      if (currentUser.photoUrl) setGuardianPhoto(currentUser.photoUrl);
    }
  }, [currentUser]);

  // Alert preferences
  const [notifyVitals, setNotifyVitals] = useState(true);
  const [notifyGeofence, setNotifyGeofence] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(true);
  const [notifyDispensary, setNotifyDispensary] = useState(true);

  // Guardian profile saving
  const handleSaveGuardianProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name: guardianName,
          email: guardianEmail,
          phone: guardianPhone,
          address: guardianAddress,
          photoUrl: guardianPhoto
        });
      }
      showToast('Guardian Profile successfully synchronized!', 'success');
      setShowEditBioModal(false);
    } catch (err) {
      showToast('Failed to save profile: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!guardianEmail) {
      showToast('Please enter an email address for password reset.', 'error');
      return;
    }
    try {
      if (resetPassword) {
        await resetPassword(guardianEmail);
        showToast('Password reset link dispatched to ' + guardianEmail, 'success');
      } else {
        showToast('Password reset instructions sent to ' + guardianEmail, 'info');
      }
    } catch (err) {
      showToast('Error sending reset email: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      if (logout) await logout();
      showToast('Signed out of Guardian Portal', 'info');
      handleRoute('landing');
    } catch (err) {
      showToast('Error signing out', 'error');
    }
  };

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

  // Merge live pets from Firestore/localStorage
  const combinedPatients = useMemo(() => {
    const base = {};
    (pets || []).forEach((p, idx) => {
      const pid = p.id || p.petID || `pet-${idx}`;
      base[pid] = {
        id: pid,
        rawPet: p,
        name: p.name || 'Companion',
        species: (p.species || 'Canine').toUpperCase(),
        breed: p.breed || 'Companion Breed',
        age: p.age ? (String(p.age).includes('yr') ? String(p.age) : `${p.age} yrs`) : '2 yrs',
        device: p.device || 'Maya Halo™ Connected',
        weight: p.weight ? (String(p.weight).includes('kg') ? String(p.weight) : `${p.weight} kg`) : '16.5 kg',
        status: p.status || 'Active Patient',
        healthIndex: p.healthIndex || 95,
        avatarUrl: p.photo || (String(p.species).toLowerCase().includes('cat') || String(p.species).toLowerCase().includes('fel')
          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=160&q=80'
          : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=160&q=80'),
        ehrId: p.petID || p.microchip || `EHR-${(p.name || 'PM').toUpperCase().slice(0, 2)}-${Math.floor(1000 + Math.random() * 9000)}`,
        restingHr: p.restingHr || '72 BPM',
        restingHrNote: 'Normal Resting',
        bodyTemp: p.bodyTemp || '38.4 °C',
        bodyTempNote: 'Afebrile (Ideal)',
        rabiesTitre: p.rabiesTitre || 'Compliant',
        rabiesNote: p.nextVaccine ? `Valid Thru ${p.nextVaccine}` : 'Valid Thru 2027',
        nextCheckup: p.nextCheckup || '28 days',
        nextCheckupNote: 'Wellness Screening',
        hrvTrend: 'Stable Homeostasis (±0.0%)',
        hrvRange: '64 - 76 BPM'
      };
    });
    return base;
  }, [pets]);

  const patientList = useMemo(() => Object.values(combinedPatients), [combinedPatients]);
  const currentPatient = combinedPatients[activePatientId] || patientList[0] || null;

  const currentPatientRecords = useMemo(() => {
    return (medicalRecords || []).filter(r => {
      if (!r.petName) return true;
      return r.petName.toLowerCase() === (currentPatient?.name || '').toLowerCase();
    });
  }, [medicalRecords, currentPatient]);

  const handleRegisterPetSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newPetName.trim()) {
      showToast('Please enter a companion name.', 'error');
      return;
    }
    setIsRegisteringPet(true);
    try {
      const photoFallback = newPetSpecies.toLowerCase() === 'feline'
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=160&q=80'
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=160&q=80';

      const created = await addPet({
        name: newPetName.trim(),
        species: newPetSpecies,
        breed: newPetBreed.trim() || 'Companion Breed',
        microchip: newPetMicrochip.trim() || `ISO-${Math.floor(100000000 + Math.random() * 900000000)}`,
        age: newPetAge.trim() || '2 yrs',
        weight: newPetWeight.trim() || '15.0',
        photo: newPetPhoto || photoFallback,
        status: 'Active Companion',
        healthIndex: 96
      });
      showToast(`Companion ${newPetName} provisioned in Sovereign Cloud Vault!`, 'success');
      setActivePatientId(created?.id || newPetName.toLowerCase());
      setNewPetName('');
      setNewPetBreed('');
      setNewPetMicrochip('');
      setNewPetAge('');
      setNewPetWeight('');
      setNewPetPhoto('');
      setShowRegisterPetModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to register companion: ' + err.message, 'error');
    } finally {
      setIsRegisteringPet(false);
    }
  };

  const handleSaveGuardianBio = async () => {
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name: guardianName,
          email: guardianEmail,
          address: guardianAddress
        });
      }
      showToast('Guardian profile updated and synchronized with Vault', 'success');
      setShowEditBioModal(false);
    } catch (err) {
      showToast('Failed to update bio: ' + err.message, 'error');
    }
  };

  const handleDownloadDossier = () => {
    if (!currentPatient) {
      showToast('No companion selected to generate dossier', 'error');
      return;
    }
    generatePetMedicalPassport({
      pet: currentPatient?.rawPet || {
        name: currentPatient.name,
        species: currentPatient.species,
        breed: currentPatient.breed,
        age: currentPatient.age,
        weight: currentPatient.weight,
        petID: currentPatient.ehrId,
        microchip: currentPatient.ehrId,
        nextVaccine: 'Oct 2027',
        photo: currentPatient.avatarUrl
      },
      owner: currentUser || {
        name: guardianName,
        email: guardianEmail,
        address: guardianAddress,
        phone: currentUser?.phone || ''
      },
      medicalRecords: (medicalRecords || []).filter(r => 
        (r.petName || '').toLowerCase() === (currentPatient?.name || '').toLowerCase() || !r.petName
      )
    });
    showToast(`Official Certified Medical Passport for ${currentPatient.name} downloaded!`, 'success');
    setShowPdfDossierModal(false);
  };

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
          1. TOP GLOBAL PROTOCOL BANNER & EDITORIAL NAVBAR
          ════════════════════════════════════════════════════════════════ */}
      <EditorialNavbar currentRoute="profile" onNavigate={handleRoute} />

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
                    color: '#675C58',
                    overflow: 'hidden',
                    border: '1.5px solid #3E7B84'
                  }}>
                    {guardianPhoto ? (
                      <img
                        src={guardianPhoto}
                        alt={guardianName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      (guardianName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#160F0C' }}>{guardianName}</span>
                      <ShieldCheck size={16} color="#047857" />
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#3E7B84', fontWeight: 600 }}>
                      Care Guardian
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
                  ACCOUNT ACTIVE
                </span>
              </div>

              {/* Contact List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: '#675C58', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="#8C827A" />
                  <span>{guardianEmail || 'No email provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="#8C827A" />
                  <span>{guardianAddress || 'No address provided'}</span>
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
                ● {patientList.length} DEPENDENT{patientList.length === 1 ? '' : 'S'} ACTIVE
              </span>
              <button
                onClick={() => {
                  setActiveNavTab('settings');
                }}
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
              gridTemplateColumns: patientList.length > 1 ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
              gap: '16px',
              marginBottom: '10px'
            }}>
              {patientList.length === 0 ? (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1.5px dashed #D6CEC7',
                  padding: '28px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  gridColumn: '1 / -1'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(62, 123, 132, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3E7B84'
                  }}>
                    <Heart size={20} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#160F0C' }}>
                    No Companions Registered Yet
                  </div>
                  <div style={{ fontSize: '12px', color: '#675C58', maxWidth: '360px' }}>
                    Register your pet companion to initialize continuous telemetry, EHR records, and prescription dossiers.
                  </div>
                  <button
                    onClick={() => setShowRegisterPetModal(true)}
                    style={{
                      marginTop: '4px',
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ⊕ Register Your Companion
                  </button>
                </div>
              ) : (
                patientList.map((p, idx) => {
                const isSelected = activePatientId === p.id;
                return (
                  <div
                    key={p.id || idx}
                    onClick={() => {
                      setActivePatientId(p.id);
                      showToast(`${p.name}'s longitudinal records loaded`, 'info');
                    }}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '18px',
                      border: isSelected ? '2px solid #3E7B84' : '1px solid #EBE5DF',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 14px rgba(62, 123, 132, 0.12)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>{p.name}</span>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              backgroundColor: '#EBE5DF',
                              color: '#675C58',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {p.species}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#707973' }}>
                            {p.breed} • {p.age}
                          </div>
                          <div style={{ fontSize: '11px', color: isSelected ? '#3E7B84' : '#675C58', fontWeight: 600 }}>
                            {p.device}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
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
                        <span style={{ fontSize: '9.5px', color: '#8C827A', fontFamily: 'monospace' }}>PATIENT 0{idx + 1}</span>
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
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C' }}>{p.weight}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>STATUS</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>{p.status}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase' }}>HEALTH INDEX</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#3E7B84' }}>{p.healthIndex}<span style={{ fontSize: '10px', color: '#8C827A' }}>/100</span></div>
                      </div>
                    </div>

                    {/* Sub-status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: isSelected ? '#3E7B84' : '#8C827A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Radio size={11} /> {isSelected ? 'Bio-Telemetry Streaming' : '((•)) Connected'}
                      </span>
                      <span style={{ color: isSelected ? '#047857' : '#160F0C', fontWeight: 600 }}>
                        {isSelected ? 'Records Loaded ✓' : 'Switch Companion ⇄'}
                      </span>
                    </div>
                  </div>
                );
              }))}
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
            { id: 'settings', label: 'Guardian Profile & Account', icon: UserCheck },
            { id: 'ehr-vault', label: 'Medical EHR Vault', icon: FileText },
            { id: 'consultations', label: 'Consultation History', icon: Calendar },
            { id: 'billing', label: 'Billing & Membership', icon: CreditCard },
            { id: 'prescriptions', label: 'Active Prescriptions', icon: Layers },
            { id: 'hardware', label: 'Hardware Devices & Collars', icon: Radio }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveNavTab(tab.id);
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

            {/* ════════════════════════════════════════════════════════════════
                TAB 1: GUARDIAN PROFILE & ACCOUNT SETTINGS
                ════════════════════════════════════════════════════════════════ */}
            {activeNavTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. Guardian Master Profile Details */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EBE5DF',
                  padding: '28px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F5EFEB' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3E7B84', marginBottom: '4px' }}>
                        GUARDIAN REPOSITORY • SOVEREIGN NODE
                      </div>
                      <h2 style={{
                        fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                        fontSize: '26px',
                        fontWeight: 800,
                        color: '#160F0C',
                        margin: 0
                      }}>
                        Guardian Profile & Account Credentials
                      </h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#675C58' }}>
                        Manage your verified identity, emergency clinical proxy, residence details, and biometric dispatch nodes.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#047857',
                        backgroundColor: 'rgba(4, 120, 87, 0.1)',
                        padding: '5px 12px',
                        borderRadius: '9999px'
                      }}>
                        <ShieldCheck size={14} /> AAHA / BVC Verified Guardian
                      </span>
                    </div>
                  </div>

                  {/* Avatar Section & Live Preview */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '16px 20px',
                    backgroundColor: '#FAF7F5',
                    borderRadius: '16px',
                    border: '1px solid #EFE9E4',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: '#EBE5DF',
                      border: '2.5px solid #3E7B84',
                      flexShrink: 0
                    }}>
                      <img
                        src={guardianPhoto}
                        alt={guardianName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C', marginBottom: '2px' }}>
                        {guardianName || 'Care Guardian'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#707973', marginBottom: '8px' }}>
                        {guardianEmail || 'No email specified'} • Member ID: PM-ACC-4410
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={guardianPhoto}
                          onChange={(e) => setGuardianPhoto(e.target.value)}
                          placeholder="Paste image URL..."
                          style={{
                            flex: 1,
                            maxWidth: '360px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid #D6CEC7',
                            fontSize: '11.5px',
                            backgroundColor: '#FFFFFF'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => showToast('Avatar preview updated!', 'info')}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#160F0C',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Update Photo
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Profile Form */}
                  <form onSubmit={handleSaveGuardianProfile}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '18px',
                      marginBottom: '24px'
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#160F0C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Full Legal Name
                        </label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            border: '1px solid #D6CEC7',
                            fontSize: '13.5px',
                            color: '#160F0C',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#160F0C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Primary Email Address
                        </label>
                        <input
                          type="email"
                          value={guardianEmail}
                          onChange={(e) => setGuardianEmail(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            border: '1px solid #D6CEC7',
                            fontSize: '13.5px',
                            color: '#160F0C',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#160F0C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Contact Phone (WhatsApp Clinical Dispatch)
                        </label>
                        <input
                          type="tel"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          placeholder="+880 1712-345678"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            border: '1px solid #D6CEC7',
                            fontSize: '13.5px',
                            color: '#160F0C',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#160F0C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Emergency Trauma Contact / Proxy
                        </label>
                        <input
                          type="text"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="Adnan Mahmud (+880 1819-998877)"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            border: '1px solid #D6CEC7',
                            fontSize: '13.5px',
                            color: '#160F0C',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#160F0C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Home Sanctuary / Residential Address (For Cold-Chain Dispensary Delivery)
                        </label>
                        <input
                          type="text"
                          value={guardianAddress}
                          onChange={(e) => setGuardianAddress(e.target.value)}
                          placeholder="House 42, Road 11, Block D, Banani, Dhaka-1213"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            border: '1px solid #D6CEC7',
                            fontSize: '13.5px',
                            color: '#160F0C',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#160F0C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Designated Primary Care Hospital
                        </label>
                        <select
                          value={preferredClinic}
                          onChange={(e) => setPreferredClinic(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            border: '1px solid #D6CEC7',
                            fontSize: '13.5px',
                            color: '#160F0C',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="Pet Maya Central Banani Triage Node">Pet Maya Central Banani Triage Node</option>
                          <option value="Gulshan 2 24/7 Emergency Hospital">Gulshan 2 24/7 Emergency Hospital</option>
                          <option value="Dhanmondi Veterinary Care Center">Dhanmondi Veterinary Care Center</option>
                          <option value="Uttara Specialty Surgery Hub">Uttara Specialty Surgery Hub</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#160F0C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Communication Language & Node
                        </label>
                        <select
                          defaultValue="en"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            border: '1px solid #D6CEC7',
                            fontSize: '13.5px',
                            color: '#160F0C',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="en">English (Clinical UK Standards)</option>
                          <option value="bn">বাংলা (Bengali Regional Protocol)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #F5EFEB' }}>
                      <button
                        type="submit"
                        style={{
                          padding: '12px 28px',
                          borderRadius: '9999px',
                          backgroundColor: '#160F0C',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 8px rgba(22, 15, 12, 0.15)'
                        }}
                      >
                        <Check size={16} /> Save Guardian Profile Changes
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Notification & Telemetry Dispatch Node Card */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EBE5DF',
                  padding: '26px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Bell size={18} color="#3E7B84" />
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', margin: 0 }}>
                      Clinical Alerts & Continuous Telemetry Dispatch
                    </h3>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#675C58', margin: '0 0 20px 0' }}>
                    Configure real-time automated triggers delivered directly to your emergency contact devices.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      {
                        title: 'Critical Biometric Anomalies (Heart Rate / Temperature Spikes)',
                        desc: 'Immediate SMS & Push alert if resting HR > 120 BPM or body temperature exceeds 39.5°C.',
                        checked: notifyVitals,
                        toggle: () => setNotifyVitals(!notifyVitals)
                      },
                      {
                        title: 'Maya Halo™ GPS Sanctuary Boundary Breaches',
                        desc: 'Instant audio alarm and mobile notification if companion exits Banani Sanctuary boundary.',
                        checked: notifyGeofence,
                        toggle: () => setNotifyGeofence(!notifyGeofence)
                      },
                      {
                        title: 'Cold-Chain Dispensary Prescription Refill Reminders',
                        desc: 'WhatsApp reminder 3 days before monthly medication or prescription diet depletes.',
                        checked: notifyDispensary,
                        toggle: () => setNotifyDispensary(!notifyDispensary)
                      },
                      {
                        title: 'Weekly AAHA-Compliant Health Index & Longevity Digest',
                        desc: 'Comprehensive biometric summary email dispatched every Sunday morning.',
                        checked: notifyDigest,
                        toggle: () => setNotifyDigest(!notifyDigest)
                      }
                    ].map((pref, i) => (
                      <div
                        key={i}
                        onClick={pref.toggle}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '14px',
                          padding: '14px 18px',
                          backgroundColor: pref.checked ? 'rgba(62, 123, 132, 0.05)' : '#FAF7F5',
                          borderRadius: '12px',
                          border: pref.checked ? '1px solid rgba(62, 123, 132, 0.25)' : '1px solid #EFE9E4',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', marginBottom: '2px' }}>
                            {pref.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#707973' }}>
                            {pref.desc}
                          </div>
                        </div>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          backgroundColor: pref.checked ? '#3E7B84' : '#EBE5DF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          transition: 'all 0.15s ease'
                        }}>
                          {pref.checked && <Check size={14} color="#FFFFFF" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Account Security, Sovereign Node & Sign Out */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EBE5DF',
                  padding: '26px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Lock size={18} color="#3E7B84" />
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#160F0C', margin: 0 }}>
                      Security, Authentication & Sovereign Sessions
                    </h3>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ padding: '16px', backgroundColor: '#FAF7F5', borderRadius: '12px', border: '1px solid #EFE9E4' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase', marginBottom: '4px' }}>
                        AUTHENTICATION NODE
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C', marginBottom: '8px' }}>
                        Firebase Sovereign Protected Session
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '9999px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D6CEC7',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#160F0C',
                          cursor: 'pointer'
                        }}
                      >
                        Request Password Reset Link
                      </button>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: '#FAF7F5', borderRadius: '12px', border: '1px solid #EFE9E4' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase', marginBottom: '4px' }}>
                        TWO-FACTOR SECURITY
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <ShieldCheck size={15} /> Active (AAHA Triage Verified)
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#707973' }}>
                        Direct cryptographic pairing with Maya Halo™ collars.
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone / Sign Out */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    paddingTop: '16px',
                    borderTop: '1px solid #F5EFEB'
                  }}>
                    <div style={{ fontSize: '12px', color: '#707973' }}>
                      Connected Node: <strong>Banani Central Repository</strong> • Sovereign APM-4410
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPdfDossierModal(true);
                        }}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '9999px',
                          backgroundColor: '#FAF7F5',
                          border: '1px solid #D6CEC7',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#160F0C',
                          cursor: 'pointer'
                        }}
                      >
                        Export Complete Dossier (PDF)
                      </button>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '9999px',
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FCA5A5',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <LogOut size={13} /> Sign Out of Portal
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB 2: MEDICAL EHR VAULT (LONGITUDINAL RECORDS & BIOMETRICS)
                ════════════════════════════════════════════════════════════════ */}
            {activeNavTab === 'ehr-vault' && (
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

              {/* Dynamic Live EHR Records from Firestore / Triage */}
              {currentPatientRecords.length === 0 ? (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EBE5DF',
                  padding: '48px 24px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(62, 123, 132, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3E7B84',
                    margin: '0 auto 16px'
                  }}>
                    <FileText size={24} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#160F0C', margin: '0 0 8px 0' }}>
                    No Clinical Ledger Records Found
                  </h3>
                  <p style={{ fontSize: '13px', color: '#675C58', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    No clinical consultations, diagnostic panels, or lab reports recorded for {currentPatient?.name || 'this companion'} yet.
                  </p>
                  <button
                    onClick={() => handleRoute('ai')}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '9999px',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Start Clinical Triage
                  </button>
                </div>
              ) : (
                currentPatientRecords.map(record => (
                  <div key={record.id} style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px solid #3E7B84',
                    padding: '20px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 10px rgba(62, 123, 132, 0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(62, 123, 132, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3E7B84',
                        flexShrink: 0
                      }}>
                        <FileCheck size={18} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: '#8C827A', fontFamily: 'monospace' }}>
                              {(record.date || new Date().toISOString().split('T')[0]).toUpperCase()} • LIVE EHR VAULT
                            </span>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              color: '#047857',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {record.serviceType || 'CLINICAL TRIAGE'}
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#675C58' }}>
                            Patient: <strong>{record.petName || currentPatient?.name || 'Companion'}</strong>
                          </span>
                        </div>

                        <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#160F0C', margin: '0 0 6px 0' }}>
                          {record.diagnosis || 'Clinical Medical Consultation'}
                        </h4>

                        <p style={{ fontSize: '12.5px', color: '#675C58', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                          {record.prescription ? `Prescription & Protocol: ${record.prescription}` : 'Longitudinal electronic health record synchronized with sovereign patient vault.'}
                        </p>

                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #F5EFEB',
                          fontSize: '11.5px'
                        }}>
                          <span style={{ color: '#707973' }}>
                            Weight: <strong>{record.weight || currentPatient?.weight || 'N/A'}</strong> • Total Ledger: <strong>৳{record.cost || '0'}</strong>
                          </span>
                          <button
                            onClick={() => {
                              if (deleteMedicalRecord) deleteMedicalRecord(record.id);
                              showToast('Clinical record archived from vault', 'info');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            Archive Record ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB 3: VETERINARY CONSULTATIONS HISTORY
                ════════════════════════════════════════════════════════════════ */}
            {activeNavTab === 'consultations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EBE5DF',
                  padding: '28px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F5EFEB' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3E7B84', marginBottom: '4px' }}>
                        CLINICAL SESSIONS • TELEHEALTH ARCHIVE
                      </div>
                      <h2 style={{
                        fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                        fontSize: '26px',
                        fontWeight: 800,
                        color: '#160F0C',
                        margin: 0
                      }}>
                        Veterinary Consultations & Telehealth History
                      </h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#675C58' }}>
                        Synchronized video transcripts, diagnostic follow-ups, and specialist clinical recommendations.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRoute('specialists')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '9999px',
                        backgroundColor: '#160F0C',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} /> Book Specialist Consult
                    </button>
                  </div>

                  {/* Upcoming Consultation Alert Card */}
                  <div style={{
                    backgroundColor: '#FAF7F5',
                    borderRadius: '16px',
                    border: '1.5px solid #3E7B84',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#3E7B84',
                        backgroundColor: 'rgba(62, 123, 132, 0.12)',
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        UPCOMING TELEHEALTH SESSION
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} /> Tomorrow • 4:30 PM (BDT)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#EBE5DF' }}>
                          <img
                            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80"
                            alt="Dr. Farhana Ahmed"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>
                            Dr. Farhana Ahmed, BVSc, MS
                          </div>
                          <div style={{ fontSize: '12px', color: '#707973' }}>
                            Chief Veterinary Clinician • Avian & Exotic Medicine Specialist
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#3E7B84', fontWeight: 600, marginTop: '2px' }}>
                            Patient: <strong>{currentPatient.name}</strong> • Routine Molting & Biometric Audit
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => showToast('Launching encrypted Video Telehealth Room...', 'info')}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '9999px',
                            backgroundColor: '#3E7B84',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Video size={14} /> Join Telehealth Room
                        </button>
                        <button
                          onClick={() => setShowRescheduleModal(true)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '9999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D6CEC7',
                            color: '#160F0C',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Historical Consultations Ledger */}
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#160F0C', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Completed Clinical Consultations History
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      {
                        doctor: 'Dr. Tanvir Hossain, DVM, MS (Surgery)',
                        role: 'Orthopedic & Soft Tissue Specialist',
                        date: 'October 12, 2026',
                        patient: 'Miko',
                        reason: 'Post-Trauma Gait Evaluation & Left Hindlimb Biometrics',
                        findings: 'Complete reduction of tarsal inflammation. Weight bearing symmetrical. Prescribed Meloxicam course successfully completed.',
                        status: 'Report Finalized'
                      },
                      {
                        doctor: 'Dr. Farhana Ahmed, BVSc, MS',
                        role: 'Chief Veterinary Clinician',
                        date: 'September 24, 2026',
                        patient: 'Piku',
                        reason: 'Seasonal Plumage Assessment & Baseline Biometrics',
                        findings: 'Respiratory acoustic clear, heart rate telemetry 72 BPM within optimal avian envelope.',
                        status: 'Report Finalized'
                      }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '18px',
                          borderRadius: '14px',
                          backgroundColor: '#FAF7F5',
                          border: '1px solid #EFE9E4'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#160F0C' }}>
                              {item.doctor}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#707973' }}>
                              {item.role} • {item.date} • Patient: <strong>{item.patient}</strong>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#047857',
                            backgroundColor: 'rgba(4, 120, 87, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            {item.status} ✓
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#160F0C', marginBottom: '4px' }}>
                          <strong>Reason:</strong> {item.reason}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#675C58', lineHeight: 1.45, marginBottom: '12px' }}>
                          <strong>Clinical Summary:</strong> {item.findings}
                        </div>
                        <button
                          onClick={() => showToast('Dispatched Clinical Consultation Summary PDF to download queue', 'success')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'none',
                            border: 'none',
                            color: '#3E7B84',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <Download size={13} /> Download Certified Consultation Summary (PDF)
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB 4: BILLING & CARE MEMBERSHIP
                ════════════════════════════════════════════════════════════════ */}
            {activeNavTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EBE5DF',
                  padding: '28px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F5EFEB' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3E7B84', marginBottom: '4px' }}>
                        CARE MEMBERSHIP & SOVEREIGN BILLING
                      </div>
                      <h2 style={{
                        fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                        fontSize: '26px',
                        fontWeight: 800,
                        color: '#160F0C',
                        margin: 0
                      }}>
                        Pet Maya Pro Care Plan & Invoices
                      </h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#675C58' }}>
                        Active subscription privileges, payment method on file, and download-ready VAT receipts.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowManageSubModal(true)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '9999px',
                        backgroundColor: '#160F0C',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Manage Plan & Add-ons
                    </button>
                  </div>

                  {/* Plan Overview Card */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '18px',
                    padding: '22px',
                    backgroundColor: '#FAF7F5',
                    borderRadius: '16px',
                    border: '1px solid #EFE9E4',
                    marginBottom: '26px'
                  }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#3E7B84', textTransform: 'uppercase', marginBottom: '4px' }}>
                        CURRENT CARE TIER
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#160F0C' }}>
                        Pet Maya Pro Tier
                      </div>
                      <div style={{ fontSize: '12px', color: '#707973', marginTop: '2px' }}>
                        ৳499 BDT / billed monthly
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: 700, marginTop: '8px' }}>
                        ● Next automatic renewal: November 18, 2026
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#8C827A', textTransform: 'uppercase', marginBottom: '4px' }}>
                        PRIMARY PAYMENT CARD
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#160F0C' }}>
                        <CreditCard size={18} color="#3E7B84" /> Visa •••• 4818
                      </div>
                      <div style={{ fontSize: '12px', color: '#707973', marginTop: '2px' }}>
                        Expires 09/2028 • Default Payment Method
                      </div>
                      <button
                        onClick={() => showToast('Opening secure PCI-DSS gateway for card update...', 'info')}
                        style={{
                          marginTop: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#3E7B84',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Update Payment Method ➔
                      </button>
                    </div>
                  </div>

                  {/* Included Pro Features */}
                  <div style={{ marginBottom: '26px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#160F0C', marginBottom: '12px', letterSpacing: '0.05em' }}>
                      Included Pro Care Benefits Active:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      {[
                        'Unlimited 24/7 AI Vision Symptom Triage',
                        '2 Free Veterinary Telehealth Consults/mo',
                        'Zero-Fee Cold-Chain Dispensary Delivery',
                        'Continuous Cloud Hardware Telemetry (Maya Halo™)'
                      ].map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#160F0C' }}>
                          <CheckCircle2 size={15} color="#047857" style={{ flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing Invoices Ledger Table */}
                  <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#160F0C', marginBottom: '12px', letterSpacing: '0.05em' }}>
                    Past Billing Invoices & Receipts:
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #EBE5DF', color: '#8C827A', textAlign: 'left', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <th style={{ padding: '10px 12px' }}>Invoice ID</th>
                          <th style={{ padding: '10px 12px' }}>Billing Date</th>
                          <th style={{ padding: '10px 12px' }}>Description</th>
                          <th style={{ padding: '10px 12px' }}>Amount</th>
                          <th style={{ padding: '10px 12px' }}>Status</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'PM-INV-2026-1001', date: 'October 18, 2026', desc: 'Pet Maya Pro Monthly Membership', amount: '৳499', status: 'Paid' },
                          { id: 'PM-INV-2026-0901', date: 'September 18, 2026', desc: 'Pet Maya Pro Monthly Membership', amount: '৳499', status: 'Paid' },
                          { id: 'PM-INV-2026-0801', date: 'August 18, 2026', desc: 'Pet Maya Pro Monthly Membership', amount: '৳499', status: 'Paid' }
                        ].map(inv => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #F5EFEB' }}>
                            <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#160F0C' }}>{inv.id}</td>
                            <td style={{ padding: '12px', color: '#675C58' }}>{inv.date}</td>
                            <td style={{ padding: '12px', color: '#160F0C', fontWeight: 500 }}>{inv.desc}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#160F0C' }}>{inv.amount}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#047857', backgroundColor: 'rgba(4, 120, 87, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                {inv.status} ✓
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={() => showToast(`Receipt ${inv.id} downloaded successfully`, 'success')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#3E7B84',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: '11.5px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Download size={13} /> PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB 5: ACTIVE PRESCRIPTIONS & DISPENSARY FORMULARY
                ════════════════════════════════════════════════════════════════ */}
            {activeNavTab === 'prescriptions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EBE5DF',
                  padding: '28px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F5EFEB' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3E7B84', marginBottom: '4px' }}>
                        ACTIVE DISPENSARY FORMULARY
                      </div>
                      <h2 style={{
                        fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                        fontSize: '26px',
                        fontWeight: 800,
                        color: '#160F0C',
                        margin: 0
                      }}>
                        Active Prescriptions & Cold-Chain Formulary
                      </h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#675C58' }}>
                        Veterinary certified medication dosages, automated cold-chain delivery schedules, and refill tracking.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRoute('orders')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '9999px',
                        backgroundColor: '#160F0C',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Layers size={14} /> Open Dispensary Orders ➔
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      {
                        name: 'Meloxicam Oral Suspension 1.5mg/ml',
                        forPet: 'Miko (Domestic Shorthair)',
                        prescribedBy: 'Dr. Tanvir Hossain',
                        dosage: '0.1ml once daily administered with wet food',
                        refill: 'Active Monthly Auto-Refill',
                        daysLeft: '28 Days Remaining in Sanctuary Dispensary',
                        coldChain: '+2°C to +8°C Verified'
                      },
                      {
                        name: 'Avian Feather Plume Pro Electrolyte Formula',
                        forPet: 'Piku (Ring-necked Dove)',
                        prescribedBy: 'Dr. Farhana Ahmed',
                        dosage: '2 drops per 50ml fresh water daily during molting',
                        refill: 'Auto-Refill On Demand',
                        daysLeft: '14 Days Supply Active',
                        coldChain: 'Ambient Cold-Shield Packaged'
                      }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '20px',
                          borderRadius: '16px',
                          backgroundColor: '#FAF7F5',
                          border: '1px solid #EFE9E4'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#3E7B84', fontWeight: 600 }}>
                              Patient: {item.forPet} • Prescribing Clinician: {item.prescribedBy}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#047857',
                            backgroundColor: 'rgba(4, 120, 87, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            {item.refill} ✓
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#160F0C', marginBottom: '6px' }}>
                          <strong>Dosage Protocol:</strong> {item.dosage}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '11.5px', color: '#707973', paddingTop: '10px', borderTop: '1px solid #F0EAE4' }}>
                          <span>● {item.daysLeft}</span>
                          <span style={{ color: '#3E7B84', fontWeight: 600 }}>Cold-Chain Spec: {item.coldChain}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB 6: HARDWARE DEVICES & MAYA HALO™ COLLARS
                ════════════════════════════════════════════════════════════════ */}
            {activeNavTab === 'hardware' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EBE5DF',
                  padding: '28px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F5EFEB' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3E7B84', marginBottom: '4px' }}>
                        HARDWARE TELEMETRY & BEACON NODES
                      </div>
                      <h2 style={{
                        fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                        fontSize: '26px',
                        fontWeight: 800,
                        color: '#160F0C',
                        margin: 0
                      }}>
                        Maya Halo™ Smart Collars & Hardware Diagnostics
                      </h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#675C58' }}>
                        Live bio-telemetry collars, continuous GPS geofence radar, and battery telemetry.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRoute('pet-gps')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '9999px',
                        backgroundColor: '#160F0C',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Radio size={14} /> Open Live GPS Radar ➔
                    </button>
                  </div>

                  {/* Device Status Card */}
                  <div style={{
                    padding: '22px',
                    borderRadius: '16px',
                    backgroundColor: '#FAF7F5',
                    border: '1px solid #EFE9E4',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Radio size={20} color="#3E7B84" />
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#160F0C' }}>
                            Maya Halo™ V3 Smart Collar
                          </div>
                          <div style={{ fontSize: '12px', color: '#707973' }}>
                            Hardware UID: MH3-8890-DHAKA • Paired with <strong>{currentPatient.name}</strong>
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#047857',
                        backgroundColor: 'rgba(4, 120, 87, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '9999px'
                      }}>
                        ● ONLINE • STREAMING BIO-TELEMETRY
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #EBE5DF' }}>
                        <div style={{ fontSize: '10px', color: '#8C827A', textTransform: 'uppercase' }}>BATTERY HEALTH</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#160F0C' }}>89% (Est. 12 Days)</div>
                        <div style={{ width: '100%', height: '5px', backgroundColor: '#FAF7F5', borderRadius: '3px', marginTop: '6px' }}>
                          <div style={{ width: '89%', height: '100%', backgroundColor: '#10B981', borderRadius: '3px' }} />
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #EBE5DF' }}>
                        <div style={{ fontSize: '10px', color: '#8C827A', textTransform: 'uppercase' }}>FIRMWARE VERSION</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#160F0C' }}>v3.4.1 Production</div>
                        <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600, marginTop: '2px' }}>Up to date ✓</div>
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #EBE5DF' }}>
                        <div style={{ fontSize: '10px', color: '#8C827A', textTransform: 'uppercase' }}>SANCTUARY GEOFENCE</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#3E7B84' }}>Home Sanctuary Active</div>
                        <div style={{ fontSize: '11px', color: '#707973', marginTop: '2px' }}>Banani Radius ±1.2m</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        onClick={() => setShowCollarSettingsModal(true)}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '9999px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D6CEC7',
                          color: '#160F0C',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Configure Collar Calibration & Safe Zones
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

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
                onClick={handleSaveGuardianBio}
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
            maxWidth: '520px',
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
              Add a new companion patient to your guardian encrypted health vault and live telemetry registry.
            </p>

            <form onSubmit={handleRegisterPetSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Companion Name (e.g. Luna)"
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select
                    value={newPetSpecies}
                    onChange={(e) => setNewPetSpecies(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Canine">Canine (Dog)</option>
                    <option value="Feline">Feline (Cat)</option>
                    <option value="Avian">Avian (Bird)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Breed (e.g. Labrador)"
                    value={newPetBreed}
                    onChange={(e) => setNewPetBreed(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Age (e.g. 2 yrs)"
                    value={newPetAge}
                    onChange={(e) => setNewPetAge(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder="Weight in kg (e.g. 14.5)"
                    value={newPetWeight}
                    onChange={(e) => setNewPetWeight(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
                  />
                </div>

                <input
                  type="text"
                  placeholder="ISO Microchip Number (Optional)"
                  value={newPetMicrochip}
                  onChange={(e) => setNewPetMicrochip(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', boxSizing: 'border-box' }}
                />

                {/* Photo Upload or URL */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#675C58', display: 'block', marginBottom: '4px' }}>
                    Companion Photo (Upload or Paste URL)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newPetPhoto}
                      onChange={(e) => setNewPetPhoto(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', fontSize: '12px' }}
                    />
                    <label style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#FAF7F5',
                      border: '1px solid #D6CEC7',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Upload size={13} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && uploadImageFile) {
                            try {
                              showToast('Uploading companion photo...', 'info');
                              const url = await uploadImageFile(file, 'pets');
                              setNewPetPhoto(url);
                              showToast('Photo uploaded successfully!', 'success');
                            } catch (err) {
                              showToast('Photo upload failed: ' + err.message, 'error');
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isRegisteringPet}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '9999px',
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    border: 'none',
                    cursor: isRegisteringPet ? 'wait' : 'pointer'
                  }}
                >
                  {isRegisteringPet ? 'Provisioning Vault...' : 'Provision Patient Vault'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterPetModal(false)}
                  style={{ padding: '11px 20px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
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
                  Patient: {currentPatient.name} ({currentPatient.ehrId}) • Species: {currentPatient.species}
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
              <div><strong>Vaccination & Rabies Titre:</strong> {currentPatient.rabiesNote}</div>
              <div><strong>Weight & Vitals:</strong> {currentPatient.weight} • {currentPatient.restingHr} ({currentPatient.restingHrNote})</div>
              <div><strong>Core Body Temp:</strong> {currentPatient.bodyTemp} ({currentPatient.bodyTempNote})</div>
              <div><strong>Continuous Biometrics:</strong> HRV Trend {currentPatient.hrvTrend}</div>
              <div><strong>Guardian Authenticity:</strong> {guardianName} • AAHA Telehealth Node #PM-ACC-4410</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadDossier}
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
              Full-mouth digital radiograph series for {currentPatient?.name || 'Companion'} • Surgeon: Dr. Tariq H., MRCVS
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
              LAB-BIOCHEM-{(currentPatient?.name || 'PATIENT').toUpperCase()}.PDF
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
              {devices[0]?.name || 'GPS Smart Collar'} Settings
            </h3>
            <div style={{ fontSize: '12px', color: '#707973', marginBottom: '16px' }}>
              Serial: #{devices[0]?.serialNumber || 'PM-TRK-7821'} • Firmware: {devices[0]?.firmwareVersion || 'v2.4.1'}
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
