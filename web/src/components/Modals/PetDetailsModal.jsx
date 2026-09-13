import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Pencil, 
  FileCheck, 
  Syringe, 
  UtensilsCrossed, 
  Activity, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PetDetailsModal() {
  const { 
    modalData, 
    pets = [], 
    medicalRecords = [], 
    closeModal, 
    openModal, 
    setActiveTab, 
    showToast,
    addMedicalRecord 
  } = useApp();
  const { currentUser } = useAuth();

  const [isUploading, setIsUploading] = useState(false);

  // Active pet from modalData or first pet
  const pet = modalData?.pet || pets[0] || {
    id: 'demo_pet',
    name: 'Miko',
    species: 'Cat',
    breed: 'Domestic Shorthair',
    gender: 'Female',
    age: '1 Year, 4 Months',
    weight: '3 kg',
    photo: 'assets/images/Pet_1.jpg',
    healthIndex: 100
  };

  const microchipId = `BD-982-004-${(pet.id || '912').slice(-3).toUpperCase()}`;

  // Species accreditation
  const getAccreditation = () => {
    const s = (pet.species || pet.breed || '').toLowerCase();
    if (s.includes('cat') || s.includes('feline')) return 'FELINE ACCREDITATION';
    if (s.includes('dog') || s.includes('canine')) return 'CANINE ACCREDITATION';
    if (s.includes('bird') || s.includes('avian')) return 'AVIAN ACCREDITATION';
    if (s.includes('rabbit')) return 'LAGOMORPH ACCREDITATION';
    return 'OFFICIAL PET ACCREDITATION';
  };

  // Filter records for this pet
  const petRecords = medicalRecords.filter(r => 
    !r.petName || r.petName.toLowerCase() === pet.name.toLowerCase() || r.petId === pet.id
  );

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      addMedicalRecord({
        petName: pet.name,
        petId: pet.id,
        serviceType: 'Diagnostic Lab',
        diagnosis: `Uploaded Clinical Report: ${file.name}`,
        prescription: 'Diagnostic report archived to verified cloud ledger.',
        cost: 0,
        date: new Date().toISOString().split('T')[0],
      });
      showToast(`Diagnostic report "${file.name}" uploaded successfully! 📄`, 'success');
    }, 1000);
  };

  const handleEditPet = () => {
    closeModal();
    openModal('addPet', { pet });
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <motion.div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        style={{ 
          maxWidth: '640px', 
          width: '92%', 
          maxHeight: '88vh', 
          overflowY: 'auto', 
          padding: '24px',
          borderRadius: '28px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'var(--primary-tint)',
              color: 'var(--primary)',
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '999px',
              letterSpacing: '0.5px'
            }}>
              {getAccreditation()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="icon-btn" 
              onClick={handleEditPet}
              title="Edit Pet"
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil size={15} color="var(--text-muted)" />
            </button>
            <button 
              className="icon-btn" 
              onClick={closeModal}
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        {/* Hero Pet Profile Card */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            background: 'var(--surface-alt)',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            marginBottom: '20px'
          }}
        >
          <img 
            src={pet.photo || pet.photoUrl || 'assets/images/Pet_1.jpg'} 
            alt={pet.name} 
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--primary)'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {pet.name}
              </h2>
              <span style={{
                background: '#10B981',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '999px',
              }}>
                {pet.healthIndex ?? 100}% Vitality
              </span>
            </div>
            <p style={{ margin: '4px 0 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
              {pet.breed || 'Companion'} • {pet.species || 'Canine/Feline'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-main)', fontWeight: 600 }}>
                {pet.age || '2 Yrs'}
              </span>
              <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-main)', fontWeight: 600 }}>
                {pet.weight ? `${pet.weight} kg` : '3.5 kg'}
              </span>
              <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-main)', fontWeight: 600 }}>
                {pet.gender || 'Male'}
              </span>
              <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Chip: {microchipId}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Hub Action Buttons (Direct Flutter Parity) */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-main)' }}>
            Pet Care Hub
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {/* 1. Digital Passport */}
            <button 
              className="pet-hub-action-btn"
              onClick={() => {
                closeModal();
                openModal('petPassport', { pet });
              }}
            >
              <div style={{ color: 'var(--primary)' }}>
                <FileCheck size={22} />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Passport</span>
            </button>

            {/* 2. Vaccinations */}
            <button 
              className="pet-hub-action-btn"
              onClick={() => {
                closeModal();
                setActiveTab('vaccines');
              }}
            >
              <div style={{ color: '#00B6D2' }}>
                <Syringe size={22} />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Vaccines</span>
            </button>

            {/* 3. Nutrition & Diet */}
            <button 
              className="pet-hub-action-btn"
              onClick={() => {
                closeModal();
                setActiveTab('food');
              }}
            >
              <div style={{ color: '#F59E0B' }}>
                <UtensilsCrossed size={22} />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Nutrition</span>
            </button>

            {/* 4. Live Radar */}
            <button 
              className="pet-hub-action-btn"
              onClick={() => {
                closeModal();
                setActiveTab('tracker');
              }}
            >
              <div style={{ color: '#7C4DFF' }}>
                <Activity size={22} />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Radar</span>
            </button>
          </div>
        </div>

        {/* Upload Diagnostic Report / Document */}
        <div 
          style={{
            background: 'var(--surface-alt)',
            border: '1px dashed var(--border)',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Upload Clinical Document
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Attach lab panels, bloodwork, or veterinary prescriptions (PDF, JPG)
              </div>
            </div>
          </div>
          <label 
            className="apple-btn-blue" 
            style={{ 
              fontSize: '12px', 
              padding: '7px 14px', 
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Medical History & Diagnostic Records */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Medical Records ({petRecords.length})
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="var(--primary)" /> Verified EHR Ledger
            </span>
          </div>

          {petRecords.length === 0 ? (
            <div 
              style={{ 
                padding: '24px', 
                textAlign: 'center', 
                background: 'var(--surface-alt)', 
                borderRadius: '18px', 
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}
            >
              No clinical records logged for {pet.name} yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {petRecords.map((rec, idx) => (
                <div 
                  key={rec.id || idx}
                  style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: rec.serviceType === 'Vaccination' ? '#10B981' : '#3B82F6',
                        flexShrink: 0
                      }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {rec.diagnosis || rec.serviceType || 'Veterinary Consultation'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {rec.date || 'Recent'}
                    </span>
                  </div>

                  {rec.prescription && (
                    <p style={{ margin: '4px 0 0 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {rec.prescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

