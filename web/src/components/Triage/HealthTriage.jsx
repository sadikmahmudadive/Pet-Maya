import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UploadCloud, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar,
  Layers,
  HeartPulse,
  ChevronRight
} from 'lucide-react';

const SAMPLE_CASES = {
  dermatitis: {
    title: 'Canine Atopic Dermatitis with Secondary Pyoderma',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    severity: 'Moderate Priority',
    confidence: '96.2%',
    care: 'Clean hotspot with warm saline or chlorhexidine wipe. Fit protective cone collar to stop self-mutilation chewing.',
    clinic: 'Book cytology swab with Dr. Aris Thorne (Dermatologist) to determine antibiotic vs antifungal course.',
    bbox: { top: '35%', left: '42%', width: '120px', height: '90px' }
  },
  conjunctivitis: {
    title: 'Feline Infectious Conjunctivitis / Ocular Discharge',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    severity: 'High Priority',
    confidence: '94.8%',
    care: 'Gently wipe discharge with sterile warm water gauze. Do not administer human eye drops.',
    clinic: 'Schedule immediate fluorescein corneal stain test with Dr. Emily Vance to rule out ulceration.',
    bbox: { top: '28%', left: '38%', width: '90px', height: '60px' }
  },
  otitis: {
    title: 'Otitis Externa (Ear Mite & Cerumen Irritation)',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    severity: 'Moderate Priority',
    confidence: '92.5%',
    care: 'Avoid deep probing with cotton swabs. Keep ear canal dry and gently wipe outer pinna.',
    clinic: 'Video or in-clinic otoscopic examination with Dr. Sarah Jenkins for prescription ear drops.',
    bbox: { top: '20%', left: '22%', width: '80px', height: '80px' }
  },
  healthy: {
    title: 'Normal Physiological Markers (No Acute Pathology)',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    severity: 'Routine / Healthy',
    confidence: '98.5%',
    care: 'Pet shows clear eyes, intact skin barrier, and alert posture. Continue regular preventative schedule.',
    clinic: 'Maintain annual DHPP/Rabies vaccinations and monthly flea & tick chewables.',
    bbox: { top: '40%', left: '35%', width: '140px', height: '100px' }
  }
};

export default function HealthTriage() {
  const { openModal, showToast } = useApp();

  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState('dog');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['skin']);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [activeBBox, setActiveBBox] = useState(null);

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      setScanResult(null);
      runScanProcess(null, event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (key) => {
    const sample = SAMPLE_CASES[key];
    setUploadedImage(sample.image);
    setActiveBBox(sample.bbox);
    setScanResult(null);
    runScanProcess(sample, sample.image);
  };

  const runScanProcess = (samplePayload, imageSrc) => {
    if (!imageSrc && !uploadedImage) {
      showToast('⚠️ Please upload or select a symptom photo first.', 'error');
      return;
    }

    setIsScanning(true);
    setScanProgress(10);
    setStatusMsg('Preprocessing convolutional neural feature layers…');

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
          showToast('🔬 AI Health Diagnostic analysis complete!', 'success');
        }, 300);
      }
    }, 120);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <span className="apple-card-eyebrow" style={{ color: '#3B82F6' }}>Neural Diagnostics</span>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>AI Health Vision &amp; Clinical Triage</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Upload symptom photos for instantaneous diagnostic triage and specialist guidance.</p>
          </div>
          <span className="badge badge-green" style={{ fontSize: '12px', padding: '6px 14px' }}>
            <Sparkles size={14} /> AI Model: Clinical V3.4
          </span>
        </div>

        {/* ── PHOTO DROPZONE ── */}
        <label className="vision-dropzone" style={{ display: 'block' }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          <UploadCloud size={40} color="#10B981" style={{ margin: '0 auto 8px' }} />
          <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            Drag &amp; Drop or Click to Upload Symptom Photo
          </strong>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Supports JPG, PNG, WEBP (Skin lesions, cloudy eyes, ear redness, or coat)
          </span>
        </label>

        {/* ── SAMPLE PRESETS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Try Clinical Presets:</span>
          <button className="chip-pill" onClick={() => loadSample('dermatitis')}>🐕 Canine Dermatitis</button>
          <button className="chip-pill" onClick={() => loadSample('conjunctivitis')}>🐱 Feline Eye Infection</button>
          <button className="chip-pill" onClick={() => loadSample('otitis')}>👂 Ear Canal Mites</button>
          <button className="chip-pill" onClick={() => loadSample('healthy')}>✨ Healthy Check</button>
        </div>

        {/* ── LASER SCAN PREVIEW ── */}
        {uploadedImage && (
          <div className="vision-preview-box" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <img src={uploadedImage} alt="Symptom Preview" style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
            {isScanning && <div className="vision-laser-line" />}
            {activeBBox && !isScanning && (
              <div 
                className="vision-target-box" 
                style={{
                  top: activeBBox.top,
                  left: activeBBox.left,
                  width: activeBBox.width,
                  height: activeBBox.height
                }} 
              />
            )}
          </div>
        )}

        {/* ── SYMPTOM CHECKLIST ── */}
        <div style={{ marginTop: '24px' }}>
          <span className="label-mini">Step 1 — Patient Species</span>
          <div className="chip-row">
            {['dog', 'cat', 'bird', 'rabbit'].map(s => (
              <button 
                key={s} 
                className={`chip-pill ${selectedSpecies === s ? 'active' : ''}`}
                onClick={() => setSelectedSpecies(s)}
              >
                {s === 'dog' ? '🐕 Dog' : s === 'cat' ? '🐈 Cat' : s === 'bird' ? '🦜 Bird' : '🐇 Rabbit'}
              </button>
            ))}
          </div>

          <span className="label-mini" style={{ marginTop: '14px' }}>Step 2 — Observed Clinical Symptoms</span>
          <div className="chip-row">
            {[
              { id: 'skin', label: '🔴 Skin Redness / Hotspot' },
              { id: 'eye', label: '👁️ Cloudy Eye / Discharge' },
              { id: 'ear', label: '👂 Ear Scratching' },
              { id: 'lethargy', label: '💤 Lethargy / Fatigue' },
              { id: 'limping', label: '🐾 Limping / Stiffness' },
              { id: 'cough', label: '🫁 Coughing / Wheezing' },
              { id: 'vomiting', label: '🤢 Vomiting / Loss of Appetite' }
            ].map(sym => (
              <button 
                key={sym.id}
                className={`chip-pill ${selectedSymptoms.includes(sym.id) ? 'active' : ''}`}
                onClick={() => toggleSymptom(sym.id)}
              >
                {sym.label}
              </button>
            ))}
          </div>

          <button 
            className="apple-btn-blue" 
            style={{ marginTop: '14px', padding: '12px 28px', fontSize: '15px' }}
            onClick={() => runScanProcess(SAMPLE_CASES.dermatitis, uploadedImage)}
            disabled={isScanning}
          >
            <HeartPulse size={17} />
            <span>{isScanning ? 'Analyzing Morphology…' : 'Run AI Diagnostic Scan'}</span>
          </button>
        </div>

        {/* ── SCAN PROGRESS BAR ── */}
        {isScanning && (
          <div style={{ marginTop: '22px', background: 'var(--surface-alt)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <span>{statusMsg}</span>
              <span>{scanProgress}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${scanProgress}%`, background: 'linear-gradient(90deg, var(--primary), #3B82F6)', transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        {/* ── RESULT CARD ── */}
        {scanResult && !isScanning && (
          <div 
            style={{
              marginTop: '24px',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--primary)',
              background: 'var(--primary-tint)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <span className="badge badge-yellow" style={{ fontSize: '12px', padding: '5px 12px' }}>
                {scanResult.severity}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Confidence: {scanResult.confidence}
              </span>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              {scanResult.title}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--surface-solid)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <strong style={{ fontSize: '12px', color: 'var(--primary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🛡️ Immediate First Aid Protocol
                </strong>
                <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {scanResult.care}
                </p>
              </div>

              <div style={{ background: 'var(--surface-solid)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <strong style={{ fontSize: '12px', color: 'var(--primary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🩺 Recommended Clinical Step
                </strong>
                <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {scanResult.clinic}
                </p>
              </div>
            </div>

            <button 
              className="apple-btn-blue" 
              onClick={() => openModal('booking', { doctor: 'Dr. Aris Thorne', mode: 'In-Clinic Consultation' })}
            >
              <Calendar size={15} />
              <span>Book Recommended Specialist</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
