import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Activity, 
  Eye, 
  Smile, 
  Bone, 
  Wind, 
  Clock, 
  Droplet, 
  CalendarCheck, 
  Video, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  RefreshCw,
  Stethoscope,
  PawPrint,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

// ── Anatomical Locus Definitions ──────────────────────────────────────────────
const ANATOMICAL_LOCI = [
  {
    id: 'gi',
    label: 'Gastrointestinal',
    subtitle: 'Nausea, stool shifts',
    icon: Activity,
    color: '#346B73'
  },
  {
    id: 'eyes',
    label: 'Head & Eyes',
    subtitle: 'Discharge, squinting',
    icon: Eye,
    color: '#160F0C'
  },
  {
    id: 'oral',
    label: 'Oral & Tooth',
    subtitle: 'Ptyalism, breath, gums',
    icon: Smile,
    color: '#160F0C'
  },
  {
    id: 'skin',
    label: 'Skin & Coat',
    subtitle: 'Pruritus, alopecia, rash',
    icon: PawPrint,
    color: '#160F0C'
  },
  {
    id: 'ortho',
    label: 'Musculoskeletal',
    subtitle: 'Limping, stiffness',
    icon: Bone,
    color: '#160F0C'
  },
  {
    id: 'resp',
    label: 'Respiratory',
    subtitle: 'Cough, panting rate',
    icon: Wind,
    color: '#160F0C'
  }
];

// ── Accordion FAQs for Clinical Transparency Framework ────────────────────────
const TRANSPARENCY_FAQS = [
  {
    id: 'red-alert',
    question: 'When does Pet Maya trigger Emergency Red-Alert?',
    answer: 'Pet Maya immediately escalates to Tier 3 Emergency Red-Alert upon detection of critical physiological compromises including: prolonged capillary refill time (> 3.0 seconds indicating hypovolemia or shock), resting respiratory rate exceeding 40 breaths/minute or acute dyspnea, pale/blue/brick-red mucosal membranes, suspected Gastric Dilatation-Volvulus (bloat/non-productive retching), toxic ingestion within 2 hours (e.g. lilies, dark chocolate, rodenticide), or status epilepticus. In Red-Alert status, emergency GPS transit routing to the nearest 24/7 ICU facility is initiated automatically.'
  },
  {
    id: 'validation',
    question: 'How are protocols cross-referenced and validated?',
    answer: 'Our diagnostic algorithms are calibrated using peer-reviewed emergency guidelines from the American Animal Hospital Association (AAHA), World Small Animal Veterinary Association (WSAVA), and the Veterinary Emergency and Critical Care Society (VECCS). Every algorithmic decision pathway is validated against a repository of 12,000+ verified clinical cases and reviewed monthly by board-certified veterinary internists and toxicologists.'
  },
  {
    id: 'replacement',
    question: 'Does algorithmic triage replace hands-on veterinary care?',
    answer: 'No. Algorithmic triage serves as a rapid risk-stratification and stabilization tool designed to eliminate guardian paralysis and prevent unnecessary emergency clinic wait times for benign self-limiting conditions. For cases exhibiting any physiological instability, Pet Maya connects guardians directly with licensed faculty veterinarians via encrypted real-time video consult or initiates priority dispatch to an accredited hospital partner.'
  }
];

export default function HealthTriage({ onNavigate }) {
  const { pets = [], openModal, addToCart, showToast } = useApp();
  const { currentUser } = useAuth();

  // Companion Patient selection
  const defaultPets = useMemo(() => {
    return [
      {
        id: 'pet_milo',
        name: 'Milo',
        breed: 'Golden Retriever',
        age: '3.4 yrs',
        weight: '31.2 kg',
        vaccination: 'Current',
        microchip: '9814-0012-78',
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&auto=format&fit=crop&q=80'
      },
      {
        id: 'pet_cleo',
        name: 'Cleo',
        breed: 'Persian Feline',
        age: '4.8 yrs',
        weight: '4.1 kg',
        vaccination: 'Current',
        microchip: '9814-0044-19',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80'
      }
    ];
  }, []);

  const [selectedPetId, setSelectedPetId] = useState('pet_milo');
  const activePet = defaultPets.find(p => p.id === selectedPetId) || defaultPets[0];

  // Anatomical Symptom Locator state
  const [selectedLocus, setSelectedLocus] = useState('gi');
  const [chiefComplaint, setChiefComplaint] = useState(
    'Milo refused his afternoon meal and vomited clear bile once at 15:30. Otherwise responsive but less energetic.'
  );

  // Clinical Observations & Vitals state
  const [symptomDuration, setSymptomDuration] = useState('4-8h'); // 'under2h' | '4-8h' | '12-24h' | '48h+'
  const [crtStatus, setCrtStatus] = useState('brisk'); // 'brisk' (<2s) | 'delayed' (2-3s) | 'sluggish' (>3s)
  const [respiratoryRate, setRespiratoryRate] = useState(24); // breaths/min
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Accordion state
  const [openFaq, setOpenFaq] = useState(null);

  // Dynamic Triage Calculation
  const triageResult = useMemo(() => {
    // If CRT sluggish or respiratory rate >= 40: Tier 3 Emergency
    if (crtStatus === 'sluggish' || respiratoryRate >= 40) {
      return {
        tier: 'Tier 3: Emergency Red-Alert',
        tierClass: 'emergency',
        tierColor: '#DC2626',
        tierBg: '#FEF2F2',
        conclusion: 'Critical physiological instability detected with compromised perfusion or acute tachypnea. Immediate hands-on transfer to the nearest 24/7 veterinary hospital is required.',
        steps: [
          { title: 'Immediate Hospital Transit', desc: 'Secure pet calmly in vehicle. Do not offer oral medications, water, or food.' },
          { title: 'Emergency Dispatch Active', desc: 'Pet Maya has flagged partner ICU facilities along your direct GPS transit corridor.' },
          { title: 'Airway & Posture Clearance', desc: 'Ensure neck is extended and chest is unencumbered during transit.' }
        ]
      };
    }

    // If CRT delayed or duration 48h+: Tier 2 Moderate
    if (crtStatus === 'delayed' || symptomDuration === '48h+' || respiratoryRate > 32) {
      return {
        tier: 'Tier 2: Elevated / Same-Day Exam',
        tierClass: 'moderate',
        tierColor: '#D97706',
        tierBg: '#FFFBEB',
        conclusion: 'Moderate physiological disturbance with mild dehydration risk. Condition requires in-person or telehealth clinician review within 6 to 12 hours.',
        steps: [
          { title: 'Continuous Hydration Monitoring', desc: 'Offer 100ml electrolyte fluids hourly. Check gum moisture every 60 minutes.' },
          { title: 'Bland Gastrointestinal Rest', desc: 'Boiled chicken and white rice in small tablespoon portions if vomiting ceases.' },
          { title: 'Telehealth Clinical Handoff', desc: 'Review with on-duty veterinarian to authorize prescription anti-emetics.' }
        ]
      };
    }

    // Default: Tier 1 Stable / Home Protocol (exact match to reference)
    return {
      tier: 'Tier 1: Stable / Home Protocol',
      tierClass: 'stable',
      tierColor: '#2E5D62',
      tierBg: '#EBF4F4',
      conclusion: 'Mild acute dietary indisposition with intact tissue perfusion. No respiratory distress or circulatory red flags detected. Emergency transfer is not indicated at this hour.',
      steps: [
        {
          title: 'Solid Diet Fast (4 Hours)',
          desc: 'Withhold kibble and chews until 20:00 to let the gastric mucosa settle.',
          icon: Clock
        },
        {
          title: 'Micro-Hydration Protocol',
          desc: 'Offer 150ml lukewarm electrolyte water or organic bone broth every 2h min. Do not allow large gulps.',
          icon: Droplet
        },
        {
          title: 'Next Algorithmic Checkpoint: 22:00',
          desc: 'Automated push review will check for stool consistency and energy rebound.',
          icon: CalendarCheck
        }
      ]
    };
  }, [crtStatus, respiratoryRate, symptomDuration]);

  // Re-evaluate animation
  const handleReevaluate = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      showToast('Diagnostic Protocol Re-Evaluated • Vitals Synchronized', 'success');
    }, 450);
  };

  const handleStageProbiotic = () => {
    addToCart({
      id: 'maya_gi_probiotic',
      name: 'Maya GI Calming Probiotic Suspension',
      price: 1250,
      brand: 'PET MAYA CLINICAL',
      category: 'pharma',
      categoryLabel: 'GI Therapeutics',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&auto=format&fit=crop&q=80'
    }, 1);
    showToast('Maya GI Probiotic staged into your Care Bag', 'success');
  };

  return (
    <div style={{
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, sans-serif)',
    }}>

      {/* ── 1. HERO SECTION (FULL-WIDTH PALE MINT / SAGE BANNER) ── */}
      <section style={{
        backgroundColor: '#EDF5F3',
        borderBottom: '1px solid #DFE8E5',
        width: '100%',
        padding: '42px 0 46px 0'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '36px'
        }}>
          {/* Left Title Area */}
          <div style={{ flex: '1 1 600px', maxWidth: '780px' }}>
            {/* Monospace Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#DCEEEB',
              border: '1px solid rgba(52, 107, 115, 0.25)',
              borderRadius: '9999px',
              padding: '4px 14px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#346B73',
              textTransform: 'uppercase',
              marginBottom: '18px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#346B73' }} />
              <span>DIAGNOSTIC INTELLIGENCE SUITE V4.0</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(28px, 3.2vw, 40px)',
              fontWeight: 600,
              color: '#160F0C',
              letterSpacing: '-0.02em',
              lineHeight: 1.18,
              margin: '0 0 16px 0',
              maxWidth: '760px'
            }}>
              Evidence-based triage, designed to replace<br />panic with clarity.
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '14px',
              color: '#5C524E',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '580px'
            }}>
              Pet Maya's algorithmic triage system cross-references 12,000+ veterinary protocols to calmly evaluate symptoms, identify urgency tiers, and provide immediate stabilizing steps.
            </p>
          </div>

          {/* Right 3 Stat Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '280px',
            flexShrink: 0
          }} className="triage-metrics-col">
            {/* Metric 1 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DFE8E5',
              borderRadius: '20px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#707973',
                  textTransform: 'uppercase',
                  marginBottom: '3px'
                }}>
                  DIAGNOSTIC FIDELITY
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#160F0C'
                }}>
                  98.4%
                </div>
              </div>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={16} />
              </div>
            </div>

            {/* Metric 2 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DFE8E5',
              borderRadius: '20px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#707973',
                  textTransform: 'uppercase',
                  marginBottom: '3px'
                }}>
                  CLINICIAN ESCALATION
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#160F0C'
                }}>
                  &lt; 3 Minutes
                </div>
              </div>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#F0FDFA',
                border: '1px solid #99F6E4',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ExternalLink size={15} />
              </div>
            </div>

            {/* Metric 3 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DFE8E5',
              borderRadius: '20px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#707973',
                  textTransform: 'uppercase',
                  marginBottom: '3px'
                }}>
                  SAFELY GUIDED OUTCOMES
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#160F0C'
                }}>
                  14,280+ Cases
                </div>
              </div>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#346B73',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MAIN ASSESSMENT & EVALUATION DOSSIER SECTION ── */}
      <section style={{
        backgroundColor: '#FDF8F5',
        width: '100%',
        padding: '40px 0 64px 0'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 32px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '32px',
            alignItems: 'start'
          }} className="triage-main-layout">

            {/* LEFT: 3 STEP ASSESSMENT CARDS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* ── CARD 1: COMPANION PATIENT ── */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #EAE5E1',
                padding: '28px',
                boxShadow: '0 2px 12px rgba(22, 15, 12, 0.02)'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #DCD7D2',
                      color: '#160F0C',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      1
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#160F0C',
                      margin: 0
                    }}>
                      Companion Patient
                    </h2>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#707973',
                    textTransform: 'uppercase'
                  }}>
                    BASELINE VITALS ACTIVE
                  </span>
                </div>

                {/* Pet Selection Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '24px',
                  flexWrap: 'wrap'
                }}>
                  {defaultPets.map(pet => {
                    const isSelected = pet.id === selectedPetId;
                    return (
                      <div
                        key={pet.id}
                        onClick={() => setSelectedPetId(pet.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '6px 20px 6px 8px',
                          borderRadius: '9999px',
                          backgroundColor: isSelected ? '#EFEFEA' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <img
                          src={pet.image}
                          alt={pet.name}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C' }}>
                              {pet.name}
                            </span>
                            {pet.id === 'pet_milo' && (
                              <CheckCircle2 size={13} color="#0D9488" fill="#CCFBF1" />
                            )}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#707973' }}>
                            {pet.breed} • {pet.age}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Vitals Summary Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#707973',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span>Weight: <strong style={{ color: '#160F0C', fontWeight: 700 }}>{activePet.weight}</strong></span>
                    <span>Vaccination: <strong style={{ color: '#059669', fontWeight: 600 }}>{activePet.vaccination}</strong></span>
                    <span>Microchip: <strong style={{ fontFamily: 'var(--font-mono)', color: '#160F0C', fontWeight: 700 }}>{activePet.microchip}</strong></span>
                  </div>
                  <button
                    onClick={() => openModal('addPet')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#346B73',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    + Register Companion
                  </button>
                </div>
              </div>

              {/* ── CARD 2: ANATOMICAL SYMPTOM LOCATOR ── */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #EAE5E1',
                padding: '28px',
                boxShadow: '0 2px 12px rgba(22, 15, 12, 0.02)'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #DCD7D2',
                      color: '#160F0C',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      2
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#160F0C',
                      margin: 0
                    }}>
                      Anatomical Symptom Locator
                    </h2>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#707973',
                    textTransform: 'uppercase'
                  }}>
                    STEP 2 OF 3
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#707973', margin: '0 0 20px 0' }}>
                  Select primary locus of discomfort or physiological change observed in the last 24 hours.
                </p>

                {/* 6 Anatomical Tiles Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }} className="triage-tiles-grid">
                  {ANATOMICAL_LOCI.map(locus => {
                    const Icon = locus.icon;
                    const isSelected = selectedLocus === locus.id;
                    return (
                      <div
                        key={locus.id}
                        onClick={() => setSelectedLocus(locus.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          backgroundColor: isSelected ? '#EDF5F3' : 'transparent',
                          border: isSelected ? '1px solid #C4DCD6' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <div style={{
                          color: isSelected ? '#346B73' : '#160F0C',
                          marginBottom: '8px'
                        }}>
                          <Icon size={20} strokeWidth={1.75} />
                        </div>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: '#160F0C',
                          marginBottom: '2px'
                        }}>
                          {locus.label}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#707973'
                        }}>
                          {locus.subtitle}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chief Complaint Description Box */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#160F0C',
                    marginBottom: '8px'
                  }}>
                    Chief Complaint Description
                  </label>
                  <div style={{
                    backgroundColor: '#FAF7F5',
                    border: '1px solid #EAE5E1',
                    borderRadius: '14px',
                    padding: '12px 16px'
                  }}>
                    <textarea
                      rows={2}
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g., Milo refused his afternoon meal and vomited clear bile once at 15:30. Otherwise responsive but less energetic."
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontSize: '12px',
                        color: '#525B57',
                        lineHeight: 1.45,
                        boxSizing: 'border-box',
                        resize: 'none',
                        fontFamily: 'inherit',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── CARD 3: CLINICAL OBSERVATIONS & VITALS ── */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #EAE5E1',
                padding: '28px',
                boxShadow: '0 2px 12px rgba(22, 15, 12, 0.02)'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #DCD7D2',
                      color: '#160F0C',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      3
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#160F0C',
                      margin: 0
                    }}>
                      Clinical Observations &amp; Vitals
                    </h2>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#707973',
                    textTransform: 'uppercase'
                  }}>
                    STEP 3 OF 3
                  </span>
                </div>

                {/* Symptom Duration */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#160F0C' }}>
                      Symptom Duration
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#707973' }}>
                      {symptomDuration === 'under2h' && 'Under 2 Hours'}
                      {symptomDuration === '4-8h' && '4 to 8 Hours'}
                      {symptomDuration === '12-24h' && '12 to 24 Hours'}
                      {symptomDuration === '48h+' && '48+ Hours'}
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '10px'
                  }}>
                    {[
                      { id: 'under2h', label: 'Under 2h' },
                      { id: '4-8h', label: '4 - 8h' },
                      { id: '12-24h', label: '12 - 24h' },
                      { id: '48h+', label: '48h +' }
                    ].map(item => {
                      const isSelected = symptomDuration === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSymptomDuration(item.id)}
                          style={{
                            padding: '9px 14px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: isSelected ? '#160F0C' : '#EFEFEA',
                            color: isSelected ? '#FFFFFF' : '#160F0C',
                            fontSize: '12px',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hydration: Capillary Refill Time (CRT) */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#160F0C' }}>
                      Hydration: Capillary Refill Time (CRT)
                    </span>
                    <span style={{
                      backgroundColor: '#E6F4F1',
                      border: '1px solid #C4E5DF',
                      color: '#2A6368',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      NORMAL (&lt; 2S)
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#707973', margin: '0 0 10px 0' }}>
                    Press gently on upper gum until blanched, measure seconds to return pink.
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '8px'
                  }}>
                    {[
                      { id: 'brisk', time: 'Brisk (< 2 seconds)', label: 'Healthy hydration', isAlert: false },
                      { id: 'delayed', time: 'Delayed (2-3 seconds)', label: 'Mild dehydration', isAlert: false },
                      { id: 'sluggish', time: 'Sluggish (> 3 seconds)', label: 'Urgent attention', isAlert: true }
                    ].map(crt => {
                      const isSelected = crtStatus === crt.id;
                      return (
                        <div
                          key={crt.id}
                          onClick={() => setCrtStatus(crt.id)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '16px',
                            backgroundColor: isSelected ? '#EFEFEA' : 'transparent',
                            border: isSelected ? '1px solid #E2DDD8' : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                            {crt.time}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: crt.isAlert ? '#DC2626' : '#707973',
                            fontWeight: crt.isAlert ? 600 : 400
                          }}>
                            {crt.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resting Respiratory Rate */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#160F0C' }}>
                      Resting Respiratory Rate
                    </span>
                    <span style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#160F0C'
                    }}>
                      {respiratoryRate} <span style={{ fontSize: '11.5px', color: '#707973', fontWeight: 500 }}>breaths / min</span>
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      accentColor: '#346B73',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  />

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#707973',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <span>10 (Brady)</span>
                    <span style={{ color: '#346B73', fontWeight: 700 }}>18 - 30 (Physiologic Baseline)</span>
                    <span>40+ (Tachypnea)</span>
                  </div>
                </div>

                {/* Primary CTA aligned right */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleReevaluate}
                    disabled={isEvaluating}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '9999px',
                      backgroundColor: '#160F0C',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: isEvaluating ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(22, 15, 12, 0.12)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <RefreshCw size={14} className={isEvaluating ? 'spin-anim' : ''} />
                    <span>{isEvaluating ? 'Recalculating Protocols...' : 'Re-evaluate Clinical Protocol ⇄'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT: STICKY EVALUATION DOSSIER */}
            <div style={{
              position: 'sticky',
              top: '84px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>

              {/* ── Main Dossier Card ── */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #DFE8E5',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(22, 15, 12, 0.03)'
              }}>
                {/* Top Accent Stripe */}
                <div style={{ height: '4px', backgroundColor: '#346B73', width: '100%' }} />

                {/* Inner card content */}
                <div style={{ padding: '24px' }}>
                  {/* Dossier Top Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '18px'
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#707973'
                    }}>
                      EVALUATION DOSSIER: EPR-8936
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                      <span>LIVE CASE</span>
                    </span>
                  </div>

                  {/* Urgency Stratification */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#707973',
                      textTransform: 'uppercase',
                      marginBottom: '6px'
                    }}>
                      URGENCY STRATIFICATION
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#EBF4F4',
                        color: triageResult.tierColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShieldCheck size={16} />
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                        fontSize: '17.5px',
                        fontWeight: 600,
                        color: triageResult.tierColor,
                        lineHeight: 1.2
                      }}>
                        {triageResult.tier}
                      </div>
                    </div>
                  </div>

                  {/* Algorithmic Conclusion Box */}
                  <div style={{
                    backgroundColor: '#EDE8E2',
                    borderRadius: '18px',
                    border: '1px solid #E2DDD5',
                    padding: '18px 20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '8.5px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: '#707973',
                      textTransform: 'uppercase',
                      marginBottom: '6px'
                    }}>
                      ALGORITHMIC CONCLUSION
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                      fontStyle: 'italic',
                      fontSize: '13px',
                      color: '#160F0C',
                      lineHeight: 1.55,
                      margin: 0
                    }}>
                      {triageResult.conclusion}
                    </p>
                  </div>

                  {/* Prescribed Home Care Steps */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#707973',
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}>
                      PRESCRIBED HOME CARE STEPS
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {triageResult.steps.map((step, idx) => {
                        const StepIcon = step.icon || Check;
                        return (
                          <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{
                              color: '#346B73',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <StepIcon size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                                {step.title}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#707973', lineHeight: 1.4 }}>
                                {step.desc}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinician Escalation Section (inner rounded card matching reference) */}
                  <div style={{
                    backgroundColor: '#ECEFEA',
                    borderRadius: '18px',
                    padding: '20px',
                    marginTop: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80"
                          alt="Dr. Sarah Jenkins"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#160F0C' }}>
                            Dr. Sarah Jenkins, MRCVS
                          </div>
                          <div style={{ fontSize: '11px', color: '#707973' }}>
                            Internal Medicine Faculty • On Call Now
                          </div>
                        </div>
                      </div>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
                    </div>

                    <p style={{ fontSize: '11.5px', color: '#5C524E', lineHeight: 1.45, margin: '0 0 14px 0' }}>
                      Want immediate human reassurance? Dr. Jenkins can inspect oral gums and posture in a 10-minute encrypted video consult.
                    </p>

                    <button
                      onClick={() => openModal('booking')}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '9999px',
                        backgroundColor: '#346B73',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(52, 107, 115, 0.25)'
                      }}
                    >
                      <Video size={15} />
                      <span>Connect Live Video ($0 Copay Included)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Supportive Formulary Synchronized Box ── */}
              <div 
                onClick={handleStageProbiotic}
                style={{
                  backgroundColor: '#EDF5F3',
                  border: '1px solid #DFE8E5',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.18s ease'
                }}
              >
                <div style={{
                  color: '#346B73',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Package size={20} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#160F0C', marginBottom: '2px' }}>
                    Supportive Formulary Synchronized
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#707973', lineHeight: 1.35 }}>
                    Maya GI Calming Probiotic suspension has been staged in your Care Bag.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CLINICAL TRANSPARENCY FRAMEWORK (GOVERNANCE SECTION) ── */}
      <section style={{
        backgroundColor: '#EDF5F3',
        borderTop: '1px solid #DFE8E5',
        width: '100%',
        padding: '56px 0 72px 0'
      }}>
        <div style={{
          maxWidth: '840px',
          margin: '0 auto',
          padding: '0 32px',
          textAlign: 'center'
        }}>
          {/* Section Tag */}
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: '#346B73',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            GOVERNANCE &amp; MEDICAL RIGOR
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
            fontSize: 'clamp(24px, 3vw, 34px)',
            fontWeight: 600,
            color: '#160F0C',
            letterSpacing: '-0.02em',
            margin: '0 0 32px 0'
          }}>
            Clinical Transparency Framework
          </h2>

          {/* Accordion FAQ Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left',
            marginBottom: '32px'
          }}>
            {TRANSPARENCY_FAQS.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: isOpen ? '20px' : '9999px',
                    border: '1px solid #EAE5E1',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
                    transition: 'border-radius 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    style={{
                      width: '100%',
                      padding: '16px 28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#160F0C',
                      textAlign: 'left'
                    }}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} color="#707973" /> : <ChevronDown size={16} color="#707973" />}
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 28px 20px 28px',
                      fontSize: '13px',
                      color: '#5C524E',
                      lineHeight: 1.6
                    }}>
                      <div style={{ paddingTop: '10px', borderTop: '1px solid #F5F1EE' }}>
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Emergency Hospital Dispatch Banner */}
          <div style={{
            backgroundColor: '#EFEFEA',
            borderRadius: '9999px',
            padding: '12px 32px',
            fontSize: '12.5px',
            color: '#5C524E',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>Need urgent hospital dispatch? Pet Maya Emergency Dispatch line is active 24/7 at</span>
            <strong style={{ color: '#160F0C', fontFamily: 'var(--font-mono)' }}>1-800-MAYA-VET</strong>
          </div>
        </div>
      </section>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        @media (max-width: 1080px) {
          .triage-main-layout {
            grid-template-columns: 1fr !important;
          }
          .triage-metrics-col {
            width: 100% !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
          }
          .triage-metrics-col > div {
            flex: 1 1 calc(33.333% - 10px) !important;
          }
        }
        @media (max-width: 720px) {
          .triage-tiles-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .triage-metrics-col > div {
            flex: 1 1 100% !important;
          }
        }
        .spin-anim {
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
