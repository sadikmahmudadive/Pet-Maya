import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Activity, 
  Heart, 
  Moon, 
  Zap, 
  Radio, 
  Syringe, 
  Pill, 
  FlaskConical, 
  Smile, 
  UploadCloud, 
  FileText, 
  ExternalLink, 
  PhoneCall, 
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DigitalPassportPage({ onNavigate }) {
  const { pets = [], showToast, openModal } = useApp();
  const { currentUser } = useAuth();

  const [copiedTransponder, setCopiedTransponder] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [recentArchives, setRecentArchives] = useState([
    { name: 'Abdominal_Ultrasound_Scan_Oct24.pdf', size: '8.2 MB' },
    { name: 'AKC_Pedigree_Lineage_Verified.pdf', size: '2.1 MB' },
    { name: 'UK_DEFRA_Pet_Travel_Schema_Entry.pdf', size: '1.4 MB' }
  ]);
  const fileInputRef = useRef(null);

  // Copy ISO Transponder Code to clipboard
  const handleCopyTransponder = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedTransponder(true);
    showToast('ISO Transponder Hash Copied to Clipboard', 'success');
    setTimeout(() => setCopiedTransponder(false), 2000);
  };

  // Export Travel Dossier (PDF)
  const handleExportPDF = () => {
    showToast('Generating Sovereign EU/GCC Travel Dossier PDF...', 'info');
    setTimeout(() => {
      showToast('Travel Dossier Exported Successfully ✅', 'success');
    }, 1200);
  };

  // Share QR Code
  const handleShareQR = () => {
    if (typeof openModal === 'function') {
      openModal('passportQR', { petName: 'Milo', transponder: '981020002847192' });
    }
    showToast('Clinician QR Link Ready for Inspection', 'info');
  };

  // Upload Clinical Document
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast(`Parsing ${file.name} via Pet Maya Optical Model...`, 'info');

    setTimeout(() => {
      setIsUploading(false);
      setRecentArchives(prev => [
        { name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` },
        ...prev
      ]);
      showToast(`Attested ${file.name} to Milo's Sovereign Vault ✅`, 'success');
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF7F5',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, sans-serif)',
      paddingBottom: '80px'
    }}>

      {/* ── 1. HERO HEADER SECTION ── */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '36px 32px 28px 32px'
      }}>
        {/* Top Eyebrow Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#EDF5F3',
          border: '1px solid #C4DCD6',
          borderRadius: '9999px',
          padding: '4px 14px',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '9.5px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#346B73',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
          <span>AAHA • EU ANNEX IV CRYPTOGRAPHIC LEDGER</span>
        </div>

        {/* Title Row with Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ maxWidth: '780px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(30px, 3.4vw, 42px)',
              fontWeight: 600,
              color: '#160F0C',
              letterSpacing: '-0.025em',
              lineHeight: 1.18,
              margin: '0 0 14px 0'
            }}>
              The unified biometric health record for<br />
              your companion.
            </h1>

            <p style={{
              fontSize: '13.5px',
              color: '#5C524E',
              lineHeight: 1.55,
              margin: 0
            }}>
              Zero lost vaccination cards. An immutable electronic health record synced with ISO microchip telemetry,
              internationally recognized for sovereign border clearance and instantaneous clinical continuity.
            </p>
          </div>

          {/* Top Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleShareQR}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '9999px',
                border: '1px solid #DFE8E5',
                backgroundColor: '#EDE8E2',
                color: '#160F0C',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <Share2 size={15} />
              <span>Share Clinician QR</span>
            </button>

            <button
              onClick={handleExportPDF}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#160F0C',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22, 15, 12, 0.15)',
                transition: 'all 0.18s ease'
              }}
            >
              <Download size={15} />
              <span>Export Travel Dossier (PDF)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. SECTION 1: SOVEREIGN PET PASSPORT & FAST ACCESS TERMINAL ── */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 32px 32px 32px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 350px',
          gap: '24px',
          alignItems: 'stretch'
        }} className="vault-passport-grid">

          {/* ── LEFT CARD: SOVEREIGN PET PASSPORT ── */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #DFE8E5',
            padding: '26px',
            boxShadow: '0 2px 12px rgba(22, 15, 12, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px'
          }}>
            {/* Top Passport Header Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid #F5F1EE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#EDF5F3',
                  color: '#346B73',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={14} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '8.5px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#707973',
                    textTransform: 'uppercase'
                  }}>
                    SOVEREIGN PET PASSPORT
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#160F0C'
                  }}>
                    EHR-VET-2025-9941M
                  </span>
                </div>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#EDF5F3',
                border: '1px solid #C4DCD6',
                color: '#0D9488',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
                <span>EU • GCC FLIGHT APPROVED</span>
              </span>
            </div>

            {/* Main Passport Content Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '170px 1fr',
              gap: '24px',
              alignItems: 'start'
            }} className="passport-inner-grid">

              {/* Pet Photo with Specimen Tag */}
              <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', height: '180px' }}>
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop&q=80"
                  alt="Milo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(22, 15, 12, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '8px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  VERIFIED SPECIMEN
                </div>
              </div>

              {/* Identity & Transponder Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#346B73',
                      textTransform: 'uppercase',
                      marginBottom: '2px'
                    }}>
                      CANIS LUPUS FAMILIARIS
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                      fontSize: '26px',
                      fontWeight: 600,
                      color: '#160F0C',
                      margin: '0 0 2px 0'
                    }}>
                      Milo
                    </h2>
                    <div style={{ fontSize: '12px', color: '#5C524E' }}>
                      Golden Retriever • Intact Male • 3.4 Years
                    </div>
                  </div>

                  {/* Body Mass Box */}
                  <div style={{
                    backgroundColor: '#FAF7F5',
                    border: '1px solid #EAE5E1',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '8px',
                      fontWeight: 700,
                      color: '#707973',
                      textTransform: 'uppercase'
                    }}>
                      BODY MASS
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#160F0C'
                    }}>
                      28.4 <span style={{ fontSize: '11px', color: '#707973', fontWeight: 500 }}>kg</span>
                    </div>
                  </div>
                </div>

                {/* ISO Transponder Box */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE5E1',
                  borderRadius: '14px',
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '8px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#707973',
                      textTransform: 'uppercase'
                    }}>
                      ISO 11784/11785 TRANSPONDER
                    </span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '9.5px',
                      color: '#0D9488',
                      fontWeight: 600
                    }}>
                      <Lock size={10} /> Verified Encrypted
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '15px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#160F0C'
                    }}>
                      981020002847192
                    </span>
                    <button
                      onClick={() => handleCopyTransponder('981020002847192')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        border: '1px solid #DFE8E5',
                        backgroundColor: '#FFFFFF',
                        color: copiedTransponder ? '#0D9488' : '#5C524E',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedTransponder ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedTransponder ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                </div>

                {/* Rabies Titre & Valid Transit Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  paddingTop: '4px'
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '8px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#707973',
                      textTransform: 'uppercase',
                      marginBottom: '2px'
                    }}>
                      RABIES TITRE (FAVN)
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#160F0C'
                    }}>
                      2.45 <span style={{ fontSize: '10px', color: '#707973' }}>IU/mL</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#0D9488', fontWeight: 600 }}>
                      Compliant (&gt; 0.50 IU/mL)
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '8px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#707973',
                      textTransform: 'uppercase',
                      marginBottom: '2px'
                    }}>
                      VALID TRANSIT WINDOW
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#160F0C'
                    }}>
                      Oct 2026
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#707973' }}>
                      Full customs reciprocity
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Crypto Signature Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid #F5F1EE',
              fontSize: '9px',
              color: '#707973',
              fontFamily: 'var(--font-mono, monospace)',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span>🔒 SHA-256 Signature: 0f4a7c29...e4dc2a</span>
              <span>LAST RE-ATTESTED: MAR 01, 2026</span>
            </div>
          </div>

          {/* ── RIGHT CARD: FAST ACCESS TERMINAL (QR CODE) ── */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #DFE8E5',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(22, 15, 12, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#707973',
                  textTransform: 'uppercase'
                }}>
                  FAST ACCESS TERMINAL
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
              </div>

              <h3 style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#160F0C',
                margin: '0 0 6px 0'
              }}>
                Border &amp; ER Triage Code
              </h3>

              <p style={{
                fontSize: '11px',
                color: '#707973',
                lineHeight: 1.45,
                margin: 0
              }}>
                Scan with any cellular or veterinary scanner to reveal live medical permissions, critical allergy alerts,
                and sovereign immunization status.
              </p>
            </div>

            {/* QR Container */}
            <div style={{
              backgroundColor: '#FAF7F5',
              border: '1px solid #EAE5E1',
              borderRadius: '18px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              {/* High Contrast QR Code Canvas */}
              <div style={{
                width: '140px',
                height: '140px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #DFE8E5',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://petmaya.com/verify/EHR-VET-2025-9941M"
                  alt="Sovereign QR Code"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                color: '#346B73',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Lock size={10} /> DYNAMIC TOKEN • REFRESHES IN 4M
              </span>
            </div>

            {/* Emergency Direct Dial Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid #F5F1EE'
            }}>
              <span style={{ fontSize: '11.5px', color: '#707973' }}>
                Emergency Direct Dial
              </span>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#160F0C'
              }}>
                +1 (800) 555-0198
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. SECTION 2: CONTINUOUS REMOTE SENSING (SMART COLLAR IOT TELEMETRY) ── */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 32px 36px 32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#346B73',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              CONTINUOUS REMOTE SENSING
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontSize: '19px',
              fontWeight: 600,
              color: '#160F0C',
              margin: 0
            }}>
              Smart Collar IoT Telemetry
            </h2>
          </div>

          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            color: '#707973',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
            <span>PetMaya SmartBand II • Synced 6 mins ago</span>
          </span>
        </div>

        {/* 4 Telemetry Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '16px'
        }} className="telemetry-grid">

          {/* Metric 1: Resting Heart Rate */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase'
              }}>
                RESTING HEART RATE
              </span>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#EDF5F3',
                color: '#346B73',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart size={13} />
              </div>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#160F0C',
                lineHeight: 1
              }}>
                68 <span style={{ fontSize: '11px', color: '#707973', fontWeight: 500 }}>BPM</span>
              </div>
            </div>

            {/* Visual Rhythm Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
              {[8, 12, 16, 14, 18, 10, 14, 16, 12, 8].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}px`,
                    backgroundColor: i === 4 ? '#346B73' : '#C4DCD6',
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>

            <span style={{ fontSize: '11px', color: '#0D9488', fontWeight: 600 }}>
              Normal sinus rhythm baseline
            </span>
          </div>

          {/* Metric 2: Rest & Deep Sleep */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase'
              }}>
                REST &amp; DEEP SLEEP
              </span>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#EDF5F3',
                color: '#346B73',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Moon size={13} />
              </div>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#160F0C',
                lineHeight: 1
              }}>
                8.4 <span style={{ fontSize: '11px', color: '#707973', fontWeight: 500 }}>HRS / 24H</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '5px', backgroundColor: '#EAE5E1', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', backgroundColor: '#346B73' }} />
            </div>

            <span style={{ fontSize: '11px', color: '#707973' }}>
              3.1h REM • Zero nocturnal scratching
            </span>
          </div>

          {/* Metric 3: Activity Index */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase'
              }}>
                ACTIVITY INDEX
              </span>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#EDF5F3',
                color: '#346B73',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={13} />
              </div>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#160F0C',
                lineHeight: 1
              }}>
                4,820 <span style={{ fontSize: '11px', color: '#707973', fontWeight: 500 }}>STEPS</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '5px', backgroundColor: '#EAE5E1', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: '88%', height: '100%', backgroundColor: '#0D9488' }} />
            </div>

            <span style={{ fontSize: '11px', color: '#0D9488', fontWeight: 600 }}>
              88% of daily energy target met
            </span>
          </div>

          {/* Metric 4: GPS Safe-Zone Presence */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase'
              }}>
                GPS SAFE-ZONE PRESENCE
              </span>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#EDF5F3',
                color: '#346B73',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Radio size={13} />
              </div>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '20px',
                fontWeight: 700,
                color: '#160F0C',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                lineHeight: 1
              }}>
                <span>Secure</span>
                <span style={{ fontSize: '11px', color: '#346B73', fontWeight: 600 }}>Home Sanctuary</span>
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#707973', lineHeight: 1.3 }}>
              Accuracy: ±0.8m via Galileo Sat<br />
              Wi-Fi Anchor 5GHz connected
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. SECTION 3: IMMUNOLOGY & BIOMETRICS (VERIFIED CLINICAL HISTORY LEDGER) ── */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 32px 36px 32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#346B73',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              IMMUNOLOGY &amp; BIOMETRICS
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontSize: '19px',
              fontWeight: 600,
              color: '#160F0C',
              margin: 0
            }}>
              Verified Clinical History Ledger
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9px',
              color: '#707973'
            }}>
              4 Recorded Interventions
            </span>
            <button
              onClick={() => showToast('All clinical interventions filtered by date & attestation', 'info')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: '1px solid #DFE8E5',
                backgroundColor: '#FFFFFF',
                color: '#5C524E',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Filter size={11} />
              <span>Filter Ledger</span>
            </button>
          </div>
        </div>

        {/* 4 Clinical Ledger Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Row 1: Nobivac DHPPi + L4 Core Vaccine */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 24px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1.4fr) minmax(0, 1fr) auto',
            gap: '20px',
            alignItems: 'center'
          }} className="ledger-row-grid">
            {/* Left Icon */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#EDF5F3',
              color: '#346B73',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Syringe size={18} />
            </div>

            {/* Intervention Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{
                  backgroundColor: '#EDF5F3',
                  color: '#346B73',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  ACTIVE CORE
                </span>
                <span style={{ fontSize: '11px', color: '#707973' }}>
                  Administered Nov 14, 2024
                </span>
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C', margin: '0 0 2px 0' }}>
                Nobivac DHPPi + L4 Core Vaccine
              </h3>
              <div style={{ fontSize: '11px', color: '#707973' }}>
                Manufacturer: MSD Animal Health • Batch #143-892 • Right Prescapular SubQ
              </div>
            </div>

            {/* Attending Clinician */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                ATTENDING CLINICIAN
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                Dr. Evelyn Vance, MRCVS
              </div>
              <div style={{ fontSize: '10.5px', color: '#707973' }}>
                Lic. #VS-198204-UK
              </div>
            </div>

            {/* Booster Date & Lot Link */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                NEXT BOOSTER REQUIRED
              </div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#160F0C'
              }}>
                Nov 2025 <span style={{ fontSize: '10px', color: '#707973', fontWeight: 500 }}>(in 9 mos)</span>
              </div>
              <button
                onClick={() => showToast('Lot Certificate #143-892 Verified via MSD Blockchain Ledger', 'info')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#346B73',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '2px'
                }}
              >
                VIEW LOT SLIP ↗
              </button>
            </div>
          </div>

          {/* Row 2: NexGard Spectra Chewable */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 24px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1.4fr) minmax(0, 1fr) auto',
            gap: '20px',
            alignItems: 'center'
          }} className="ledger-row-grid">
            {/* Left Icon */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FAF7F5',
              color: '#346B73',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Pill size={18} />
            </div>

            {/* Intervention Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  color: '#5C524E',
                  border: '1px solid #EAE5E1',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  DISPENSED ROUTINE
                </span>
                <span style={{ fontSize: '11px', color: '#707973' }}>
                  Administered Mar 01, 2025
                </span>
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C', margin: '0 0 2px 0' }}>
                NexGard Spectra Chewable
              </h3>
              <div style={{ fontSize: '11px', color: '#707973' }}>
                Afoxolaner + Milbemycin Oxime (15.1 - 30.0kg) • Internal &amp; External Parasiticide
              </div>
            </div>

            {/* Compliance Method */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                COMPLIANCE METHOD
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                Guardian Administered
              </div>
              <div style={{ fontSize: '10.5px', color: '#707973' }}>
                Confirmed via Smart Dispenser
              </div>
            </div>

            {/* Next Re-Dose */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                SCHEDULED RE-DOSE
              </div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#160F0C'
              }}>
                Apr 01, 2025
              </div>
              <div style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                color: '#0D9488',
                fontWeight: 700,
                marginTop: '2px'
              }}>
                AUTO-REFILL ACTIVE ↗
              </div>
            </div>
          </div>

          {/* Row 3: Annual Preventive Biomarker Panel */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 24px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1.4fr) minmax(0, 1fr) auto',
            gap: '20px',
            alignItems: 'center'
          }} className="ledger-row-grid">
            {/* Left Icon */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#EDF5F3',
              color: '#346B73',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FlaskConical size={18} />
            </div>

            {/* Intervention Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{
                  backgroundColor: '#EDF5F3',
                  color: '#346B73',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  COMPREHENSIVE LAB
                </span>
                <span style={{ fontSize: '11px', color: '#707973' }}>
                  Sampled Jan 10, 2025
                </span>
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C', margin: '0 0 2px 0' }}>
                Annual Preventive Biomarker Panel
              </h3>
              <div style={{ fontSize: '11px', color: '#707973' }}>
                Idexx Reference Laboratories • Complete Blood Chemistry + Kidney/Hepatic Markers
              </div>
            </div>

            {/* Biometric Values */}
            <div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE5E1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: '#160F0C',
                  fontWeight: 600
                }}>
                  ALT: 52 IU/L (Normal)
                </span>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE5E1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: '#160F0C',
                  fontWeight: 600
                }}>
                  BUN: 14 mg/dL
                </span>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE5E1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: '#160F0C',
                  fontWeight: 600
                }}>
                  SDMA: 9 µg/dL
                </span>
              </div>
            </div>

            {/* Interpretation & Lab Link */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                PANEL INTERPRETATION
              </div>
              <div style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#0D9488'
              }}>
                Optimal Longevity Profile
              </div>
              <button
                onClick={() => showToast('Opening IDEXX Comprehensive 24-Page Lab Report', 'info')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#346B73',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '2px'
                }}
              >
                FULL 24-PAGE LAB PDF ↗
              </button>
            </div>
          </div>

          {/* Row 4: Ultrasonic Dental Prophylaxis & Polish */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #DFE8E5',
            padding: '18px 24px',
            boxShadow: '0 2px 8px rgba(22, 15, 12, 0.02)',
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1.4fr) minmax(0, 1fr) auto',
            gap: '20px',
            alignItems: 'center'
          }} className="ledger-row-grid">
            {/* Left Icon */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FAF7F5',
              color: '#346B73',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Smile size={18} />
            </div>

            {/* Intervention Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{
                  backgroundColor: '#FAF7F5',
                  color: '#5C524E',
                  border: '1px solid #EAE5E1',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  SURGICAL PROCEDURE
                </span>
                <span style={{ fontSize: '11px', color: '#707973' }}>
                  Completed Aug 12, 2024
                </span>
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C', margin: '0 0 2px 0' }}>
                Ultrasonic Dental Prophylaxis &amp; Polish
              </h3>
              <div style={{ fontSize: '11px', color: '#707973' }}>
                Full-mouth intraoral radiography performed • Zero extractions required • Grade 1 gingivitis resolved
              </div>
            </div>

            {/* Sedation Protocol */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                SEDATION PROTOCOL
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                Isoflurane / Propofol Continuous
              </div>
              <div style={{ fontSize: '10.5px', color: '#707973' }}>
                Capnography monitored
              </div>
            </div>

            {/* Follow Up & Radiographs */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#707973',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                FOLLOW-UP EVALUATION
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#160F0C'
              }}>
                Annual Dental Check Aug 2025
              </div>
              <button
                onClick={() => showToast('Displaying 14 High-Resolution Dental Radiographs', 'info')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#346B73',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '2px'
                }}
              >
                RADIOGRAPHS (14) ↗
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. SECTION 4: DIRECT CLINICAL DOCUMENT UPLOAD (SOVEREIGN CLOUD STORAGE) ── */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 32px'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #DFE8E5',
          padding: '28px',
          boxShadow: '0 2px 12px rgba(22, 15, 12, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Header Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={15} color="#346B73" />
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#346B73',
                textTransform: 'uppercase'
              }}>
                256-BIT TLS SOVEREIGN CLOUD STORAGE
              </span>
            </div>

            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              color: '#707973'
            }}>
              CLOUD SPACE <strong style={{ color: '#160F0C' }}>1.4 GB</strong> used of <strong>50 GB</strong>
            </span>
          </div>

          <div>
            <h3 style={{
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#160F0C',
              margin: '0 0 4px 0'
            }}>
              Direct Clinical Document Upload
            </h3>
            <p style={{ fontSize: '12.5px', color: '#707973', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
              Upload diagnostic imaging, foreign clinical notes, rabies certificates, or pedigree documentation.
              Pet Maya's parsing model extracts metadata automatically for your vet.
            </p>
          </div>

          {/* Large Drag & Drop Container */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.dicom,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: '#EDF5F3',
              border: '2px dashed #A7D0C8',
              borderRadius: '20px',
              padding: '36px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #C4DCD6',
              color: '#346B73',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <UploadCloud size={22} />
            </div>

            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#160F0C', marginBottom: '4px' }}>
              Drop outside veterinary records, DICOMs, or blood panels here
            </div>

            <div style={{ fontSize: '11.5px', color: '#707973', maxWidth: '520px', lineHeight: 1.45, marginBottom: '18px' }}>
              Accepted formats: PDF, DICOM, JPG, PNG up to 150MB per file. Automatically attested to Milo's microchip hash.
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Select Files from Device
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showToast('Connecting to VetPartners & IDEXX Clinical API Gateway...', 'info');
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: '9999px',
                  border: '1px solid #DFE8E5',
                  backgroundColor: '#FFFFFF',
                  color: '#160F0C',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Connect Clinic Portal
              </button>
            </div>
          </div>

          {/* Recent Archives Pill Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            paddingTop: '6px'
          }}>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#707973',
              textTransform: 'uppercase'
            }}>
              RECENT ARCHIVES:
            </span>

            {recentArchives.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => showToast(`Opening ${doc.name}`, 'info')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid #EAE5E1',
                  borderRadius: '9999px',
                  padding: '5px 14px',
                  fontSize: '11px',
                  color: '#160F0C',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={12} color="#346B73" />
                <span>{doc.name}</span>
                <span style={{ color: '#707973', fontSize: '10px' }}>({doc.size})</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        @media (max-width: 1080px) {
          .vault-passport-grid {
            grid-template-columns: 1fr !important;
          }
          .telemetry-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .ledger-row-grid {
            grid-template-columns: auto 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .passport-inner-grid {
            grid-template-columns: 1fr !important;
          }
          .telemetry-grid {
            grid-template-columns: 1fr !important;
          }
          .ledger-row-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
