import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  ShieldAlert, 
  Calendar,
  HeartPulse,
  Stethoscope,
  Activity,
  Eye,
  Ear,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleReveal } from '../Animations/AppleReveal';
import LottieUploadIcon from '../Common/LottieUploadIcon';
import catDiseasePlaceholder from '../../../assets/images/cat_disease.jpg';

const SAMPLE_CASES = {
  dermatitis: {
    title: 'Feline Dermatitis & Otitis Externa Symptoms',
    image: catDiseasePlaceholder,
    severity: 'Moderate Priority',
    confidence: '96.2%',
    care: 'Clean hotspot with warm saline or chlorhexidine wipe. Fit protective cone collar to stop self-mutilation scratching.',
    clinic: 'Book cytology swab with Dr. Aris Thorne (Feline Medicine) to determine antibiotic vs antifungal course.',
    differential: ['Otodectes cynotis (Ear Mites)', 'Flea Allergy Dermatitis (FAD)', 'Malassezia Yeast Dermatitis'],
    bbox: { top: '22%', left: '46%', width: '90px', height: '80px' }
  },
  conjunctivitis: {
    title: 'Feline Infectious Conjunctivitis / Ocular Discharge',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    severity: 'High Priority',
    confidence: '94.8%',
    care: 'Gently wipe discharge with sterile warm water gauze. Do not administer human eye drops.',
    clinic: 'Schedule immediate fluorescein corneal stain test with Dr. Emily Vance to rule out ulceration.',
    differential: ['Feline Herpesvirus-1 (FHV-1)', 'Chlamydia felis Infection', 'Corneal Foreign Body / Abrasion'],
    bbox: { top: '28%', left: '38%', width: '90px', height: '60px' }
  },
  otitis: {
    title: 'Otitis Externa (Ear Mite & Cerumen Irritation)',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    severity: 'Moderate Priority',
    confidence: '92.5%',
    care: 'Avoid deep probing with cotton swabs. Keep ear canal dry and gently wipe outer pinna.',
    clinic: 'Video or in-clinic otoscopic examination with Dr. Sarah Jenkins for prescription ear drops.',
    differential: ['Otodectes cynotis (Ear Mites)', 'Pseudomonas Biofilm Infection', 'Allergic Otitis Externa'],
    bbox: { top: '20%', left: '22%', width: '80px', height: '80px' }
  },
  healthy: {
    title: 'Normal Physiological Markers (No Acute Pathology)',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    severity: 'Routine / Healthy',
    confidence: '98.5%',
    care: 'Pet shows clear eyes, intact skin barrier, and alert posture. Continue regular preventative schedule.',
    clinic: 'Maintain annual DHPP/Rabies vaccinations and monthly flea & tick chewables.',
    differential: ['Optimal Vital Range', 'Benign Physiological Baseline'],
    bbox: { top: '40%', left: '35%', width: '140px', height: '100px' }
  }
};

export default function HealthTriage() {
  const { pets = [], openModal, showToast, addMedicalRecord } = useApp();

  const [selectedPet, setSelectedPet] = useState(pets.length > 0 ? pets[0] : null);
  const [issueDescription, setIssueDescription] = useState('Mild redness and scratching behind left ear for 2 days.');
  const [uploadedImage, setUploadedImage] = useState(catDiseasePlaceholder);
  const [selectedScanMode, setSelectedScanMode] = useState('skin');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isSavedToEHR, setIsSavedToEHR] = useState(false);

  const activePetName = selectedPet?.name || 'Miko';

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      setScanResult(null);
      setIsSavedToEHR(false);
      runScanProcess(null, event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (key) => {
    const sample = SAMPLE_CASES[key];
    setUploadedImage(sample.image);
    setScanResult(null);
    setIsSavedToEHR(false);
    runScanProcess(sample, sample.image);
  };

  const runScanProcess = (samplePayload, imageSrc) => {
    if (!imageSrc && !uploadedImage) {
      showToast('Please upload or select a symptom photo first.', 'error');
      return;
    }

    setIsScanning(true);
    setScanProgress(10);
    setStatusMsg('Preprocessing convolutional neural feature layers…');
    setIsSavedToEHR(false);

    let p = 10;
    const timer = setInterval(() => {
      p += 15;
      setScanProgress(p);

      if (p === 30) setStatusMsg('Scanning epithelial margins & lesion contours…');
      if (p === 60) setStatusMsg('Comparing lesion morphology against 50,000+ veterinary clinical cases…');
      if (p === 90) setStatusMsg('Synthesizing differential diagnosis and triage urgency…');

      if (p >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsScanning(false);
          setScanResult(samplePayload || SAMPLE_CASES.dermatitis);
          showToast('AI Health Diagnostic analysis complete!', 'success');
        }, 300);
      }
    }, 120);
  };

  const handleSaveToMedicalRecord = () => {
    if (!scanResult) return;
    addMedicalRecord({
      petName: activePetName,
      serviceType: 'AI Health Assessment',
      diagnosis: scanResult.title,
      prescription: scanResult.care,
      cost: 0,
      date: new Date().toISOString().split('T')[0],
      nextBooster: '48h Follow-up'
    });
    setIsSavedToEHR(true);
    showToast(`Saved AI assessment to ${activePetName}'s Medical History!`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      <AppleReveal duration={0.6} yOffset={18}>
        <div 
          style={{ 
            background: 'var(--surface-alt)',
            borderRadius: '28px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            padding: '28px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                AI Health Scanner
              </h1>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                Instant triage, lesion analysis &amp; multi-modal diagnostic protocol for pets.
              </p>
            </div>
          </div>

          {/* Pet Selector (Matching App) */}
          {pets.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Select Pet for Assessment:
              </span>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {pets.map((p) => {
                  const isSelected = selectedPet?.id === p.id || selectedPet?.petID === p.petID;
                  return (
                    <button
                      key={p.id || p.petID}
                      onClick={() => setSelectedPet(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid #10B981' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface)',
                        color: isSelected ? '#10B981' : 'var(--text-main)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img 
                        src={p.photo || p.photoUrl || 'assets/images/Pet_1.jpg'} 
                        alt={p.name} 
                        style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photo Dropzone / Camera Area */}
          <div style={{ position: 'relative' }}>
            <label 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px 20px',
                borderRadius: '24px',
                border: '2px dashed rgba(124, 77, 255, 0.3)',
                background: 'rgba(124, 77, 255, 0.03)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              <LottieUploadIcon size={56} style={{ margin: '0 auto 8px' }} />
              <strong style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Drop or Click to Upload Symptom Photo
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Skin lesion, red eye, cloudy ear canal, dental plaque, or stool sample
              </span>
            </label>
          </div>

          {/* Clinical Presets Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Clinical Presets:</span>
            <button className="chip-pill" onClick={() => loadSample('dermatitis')}>
              <Activity size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Feline Dermatitis
            </button>
            <button className="chip-pill" onClick={() => loadSample('conjunctivitis')}>
              <Eye size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Eye Infection
            </button>
            <button className="chip-pill" onClick={() => loadSample('otitis')}>
              <Ear size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Ear Canal Mites
            </button>
            <button className="chip-pill" onClick={() => loadSample('healthy')}>
              <Sparkles size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Routine Baseline
            </button>
          </div>

          {/* Scanner Preview with Laser Beam Animation */}
          {uploadedImage && (
            <div style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', height: '240px', background: '#000' }}>
              <img 
                src={uploadedImage} 
                alt="Symptom Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isScanning ? 0.7 : 1, transition: 'opacity 0.3s' }} 
              />
              
              {/* Laser Scanning Line */}
              {isScanning && (
                <motion.div
                  animate={{ y: [0, 240, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #10B981, #7C4DFF, transparent)',
                    boxShadow: '0 0 16px 4px rgba(16, 185, 129, 0.7)',
                    zIndex: 10
                  }}
                />
              )}
            </div>
          )}

          {/* Clinical Issue Prompt Input */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Describe Observed Symptoms &amp; Duration:
            </label>
            <textarea
              rows={2}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="e.g. Mild redness and scratching behind left ear for 2 days..."
              style={{
                width: '100%',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                padding: '12px 16px',
                fontSize: '13.5px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.45
              }}
            />
          </div>

          {/* Action Button: Run Diagnosis */}
          <button 
            onClick={() => runScanProcess(SAMPLE_CASES.dermatitis, uploadedImage)}
            disabled={isScanning}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '18px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: isScanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
              opacity: isScanning ? 0.7 : 1,
              transition: 'transform 0.15s ease'
            }}
          >
            <HeartPulse size={18} />
            <span>{isScanning ? 'Analyzing Clinical Morphology…' : 'Run AI Health Diagnosis'}</span>
          </button>

          {/* Scan Progress Feedback */}
          {isScanning && (
            <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{statusMsg}</span>
                <span style={{ color: '#10B981' }}>{scanProgress}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${scanProgress}%`, 
                    background: 'linear-gradient(90deg, #10B981, #7C4DFF)', 
                    transition: 'width 0.2s ease' 
                  }} 
                />
              </div>
            </div>
          )}

          {/* Diagnostic Result Section */}
          {scanResult && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {/* Header result row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{
                  background: '#FEF3C7',
                  color: '#D97706',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '8px'
                }}>
                  {scanResult.severity}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>
                  Confidence: {scanResult.confidence}
                </span>
              </div>

              {/* Title */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  PRIMARY CLINICAL ASSESSMENT FOR {activePetName.toUpperCase()}
                </span>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                  {scanResult.title}
                </h3>
              </div>

              {/* Protocol Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                    <ShieldAlert size={14} /> Immediate First Aid Protocol
                  </strong>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.45, margin: 0 }}>
                    {scanResult.care}
                  </p>
                </div>

                <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '11px', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                    <Stethoscope size={14} /> Recommended Specialist Action
                  </strong>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.45, margin: 0 }}>
                    {scanResult.clinic}
                  </p>
                </div>
              </div>

              {/* Differential Diagnosis Pills */}
              {scanResult.differential && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Differential Diagnosis Considerations:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {scanResult.differential.map((d, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        • {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Save to EHR & Book */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
                <button
                  onClick={handleSaveToMedicalRecord}
                  disabled={isSavedToEHR}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    background: isSavedToEHR ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface)',
                    color: isSavedToEHR ? '#10B981' : 'var(--text-main)',
                    border: '1px solid var(--border)',
                    padding: '10px 18px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSavedToEHR ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <BookmarkCheck size={16} color={isSavedToEHR ? '#10B981' : 'currentColor'} />
                  <span>{isSavedToEHR ? 'Saved to Medical History' : `Save to ${activePetName}'s EHR`}</span>
                </button>

                <button
                  onClick={() => openModal('booking', { doctor: 'Dr. Nazmul Hoda', mode: 'In-Clinic Consultation' })}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    background: '#10B981',
                    color: '#FFF',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Calendar size={15} />
                  <span>Book Recommended Specialist</span>
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </AppleReveal>
    </div>
  );
}
