import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, Sparkles, Upload, CheckCircle2, ShieldCheck, Heart, 
  Activity, Award, Zap, RefreshCw, Plus, Info, ArrowRight 
} from 'lucide-react';

const SAMPLE_PETS = [
  {
    name: 'Golden Retriever',
    species: 'Dog',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop',
    confidence: '98.7%',
    group: 'Sporting Dog • AKC Registered',
    lifespan: '10 - 12 yrs',
    weight: '25 - 34 kg',
    energy: 'High (60+ min/day)',
    grooming: 'Weekly brushing',
    temperament: ['Intelligent', 'Friendly', 'Devoted', 'Gentle'],
    nutrition: 'High-protein diet with glucosamine for hip health and Omega-3 for coat luster.',
    healthWatch: 'Hip dysplasia screening & annual cardiology check recommended.'
  },
  {
    name: 'Persian Longhair',
    species: 'Cat',
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&auto=format&fit=crop',
    confidence: '97.2%',
    group: 'Brachycephalic • Pedigree Cat',
    lifespan: '12 - 17 yrs',
    weight: '3.5 - 5.5 kg',
    energy: 'Calm & Sedentary',
    grooming: 'Daily combing',
    temperament: ['Quiet', 'Docile', 'Affectionate', 'Sweet'],
    nutrition: 'Moisture-rich wet diet to protect urinary tract, specialized kibble for flat faces.',
    healthWatch: 'Regular tear duct cleaning and respiratory monitoring in warm weather.'
  },
  {
    name: 'Siberian Husky',
    species: 'Dog',
    image: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600&auto=format&fit=crop',
    confidence: '99.1%',
    group: 'Working Dog • Arctic Lineage',
    lifespan: '12 - 15 yrs',
    weight: '20 - 27 kg',
    energy: 'Very High (90+ min/day)',
    grooming: 'Seasonal blowing coat',
    temperament: ['Outgoing', 'Athletic', 'Mischievous', 'Vocal'],
    nutrition: 'High energy density diet with zinc and healthy lipids.',
    healthWatch: 'Corneal dystrophy screening and strict secure fencing required.'
  },
  {
    name: 'British Shorthair',
    species: 'Cat',
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&auto=format&fit=crop',
    confidence: '96.8%',
    group: 'Classic Shorthair • Pedigree',
    lifespan: '14 - 20 yrs',
    weight: '4.0 - 7.0 kg',
    energy: 'Moderate',
    grooming: 'Low maintenance',
    temperament: ['Easygoing', 'Loyal', 'Placid', 'Patient'],
    nutrition: 'Portion-controlled diet to prevent feline obesity and support cardiac health.',
    healthWatch: 'Hypertrophic cardiomyopathy (HCM) genetic screening recommended.'
  }
];

export default function BreedFinderModal() {
  const { closeModal, openModal, addPet } = useApp();

  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [customImage, setCustomImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const activePetData = SAMPLE_PETS[selectedSampleIndex];
  const displayImage = customImage || activePetData.image;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);
      setScanResult(null);
    }
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult(activePetData);
    }, 1400);
  };

  const handleAddToMyPets = () => {
    if (scanResult) {
      addPet({
        name: scanResult.name.split(' ')[0],
        breed: scanResult.name,
        type: scanResult.species,
        age: '1 year',
        weight: scanResult.weight.split(' - ')[0] + ' kg',
        image: displayImage
      });
      closeModal();
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, rgba(26,182,128,0.2) 0%, rgba(59,130,246,0.2) 100%)', 
                color: 'var(--primary)', 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={12} />
                Vision AI 2.0
              </span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              AI Pet Breed Identifier
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Upload or snap a photo of any dog or cat to analyze genetic markers and care guidelines.
            </p>
          </div>
          <button className="icon-btn" onClick={closeModal} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sample Selectors */}
          <div>
            <label className="label-mini" style={{ marginBottom: '8px', display: 'block' }}>Choose Sample or Upload Your Own Pet Photo</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {SAMPLE_PETS.map((sample, idx) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => {
                    setSelectedSampleIndex(idx);
                    setCustomImage(null);
                    setScanResult(null);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '12px',
                    border: (!customImage && selectedSampleIndex === idx) ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: (!customImage && selectedSampleIndex === idx) ? 'rgba(26,182,128,0.06)' : 'var(--surface-alt)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <img 
                    src={sample.image} 
                    alt={sample.name} 
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: 'var(--text-main)', 
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}>
                    {sample.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Image & Scanner Box */}
          <div style={{
            position: 'relative',
            height: '240px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px dashed var(--border-color)',
            background: 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={displayImage} 
              alt="Pet Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />

            {/* Scanning Laser Overlay */}
            {isScanning && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(26, 182, 128, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(2px)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'var(--primary)',
                  boxShadow: '0 0 15px var(--primary), 0 0 30px var(--primary)',
                  animation: 'pulse 1.2s infinite'
                }} />
                <div style={{
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  <RefreshCw size={16} className="spin" style={{ color: 'var(--primary)' }} />
                  <span>ANALYZING MORPHOLOGY &amp; COAT PATTERNS...</span>
                </div>
              </div>
            )}

            {/* Upload Button overlay */}
            <label style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '7px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s'
            }}>
              <Upload size={13} />
              <span>Upload Custom Photo</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>

          {/* Action to scan if not yet scanned */}
          {!scanResult && (
            <button
              type="button"
              className="btn-primary"
              disabled={isScanning}
              onClick={handleRunScan}
              style={{
                padding: '14px',
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '0.4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={18} />
              <span>{isScanning ? 'IDENTIFYING GENETIC MARKERS...' : 'START AI VISION ANALYSIS'}</span>
            </button>
          )}

          {/* Result Card */}
          {scanResult && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: 'var(--shadow-sm)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {/* Header result */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(16,185,129,0.12)',
                    color: '#10B981',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px'
                  }}>
                    <ShieldCheck size={13} />
                    <span>AI MATCH: {scanResult.confidence} CERTAINTY</span>
                  </span>
                  <h4 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    {scanResult.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    {scanResult.group}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--primary)' }}>
                    {scanResult.confidence}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>
                    MATCH ACCURACY
                  </div>
                </div>
              </div>

              {/* Physical Traits Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'var(--surface-alt)', padding: '10px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Expected Lifespan</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{scanResult.lifespan}</strong>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: '10px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Healthy Weight</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{scanResult.weight}</strong>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: '10px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Energy &amp; Exercise</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{scanResult.energy}</strong>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: '10px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Coat Maintenance</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{scanResult.grooming}</strong>
                </div>
              </div>

              {/* Temperament Tags */}
              <div style={{ marginBottom: '14px' }}>
                <span className="label-mini" style={{ marginBottom: '6px', display: 'block' }}>Temperament Profile</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {scanResult.temperament.map(t => (
                    <span 
                      key={t}
                      style={{
                        background: 'rgba(26,182,128,0.08)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Vet Insights */}
              <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontWeight: 800, fontSize: '12px', marginBottom: '4px' }}>
                  <Info size={14} />
                  <span>VETERINARY ADVISORY NOTE</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                  <strong>Nutrition:</strong> {scanResult.nutrition}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  <strong>Preventative Care:</strong> {scanResult.healthWatch}
                </p>
              </div>

              {/* Bottom buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAddToMyPets}
                  style={{ flex: 1, padding: '11px', fontSize: '13px' }}
                >
                  <Plus size={15} />
                  <span>Register {scanResult.name.split(' ')[0]} to My Pets</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setScanResult(null)}
                  style={{ padding: '11px 16px', fontSize: '13px' }}
                >
                  <RefreshCw size={14} />
                  <span>Scan Another</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
