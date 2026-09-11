import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  ShieldCheck, 
  Award, 
  QrCode, 
  Download, 
  Share2, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Heart,
  FileCheck,
  Printer
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PetPassportModal() {
  const { modalData, pets, closeModal, showToast } = useApp();
  const { currentUser } = useAuth();

  // Selected pet from modalData or first pet
  const [selectedPetId, setSelectedPetId] = useState(modalData?.pet?.id || pets[0]?.id || '');
  const pet = pets.find(p => p.id === selectedPetId) || pets[0] || {
    id: 'demo_pet',
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever',
    gender: 'Male',
    age: '2.5 Yrs',
    weight: '28 kg',
    photo: 'assets/images/Pet_1.jpg'
  };

  const microchipId = `BD-982-004-${(pet.id || '912').slice(-3).toUpperCase()}`;
  const rabiesTagId = `PM-RAB-2026-${(pet.id || '101').slice(-3).toUpperCase()}`;

  const handleSharePassport = () => {
    const url = `${window.location.origin}/#/passport?id=${pet.id}`;
    navigator.clipboard.writeText(url);
    showToast('🔗 Digital Passport & Lost Pet Recovery URL copied!', 'success');
  };

  const handleDownloadPassport = () => {
    const passportData = `======================================================
PET MAYA OFFICIAL DIGITAL PET PASSPORT & HEALTH RECORD
======================================================
Patient Name: ${pet.name}
Species / Breed: ${pet.species || 'Canine'} • ${pet.breed}
Gender: ${pet.gender || 'Male'} | Age: ${pet.age || '2 Yrs'} | Weight: ${pet.weight || '12 kg'}
Microchip Transponder ID: ${microchipId}
Rabies Vaccination Tag: ${rabiesTagId}
Immunization Status: CERTIFIED UP-TO-DATE (Rabies, DHPP, Bordetella)
Owner / Guardian: ${currentUser?.name || 'Pet Parent'}
Emergency Contact: ${currentUser?.phone || '+8801835120307'}
Registered Address: ${currentUser?.address || 'Mirpur, Dhaka, Bangladesh'}
Verification Registry: PetMaya Central Health Ledger (AES-256 Verified)
======================================================`;

    const blob = new Blob([passportData], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `PetPassport_${pet.name}_${microchipId}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📄 Official Pet Passport exported!', 'success');
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(16,185,129,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Digital Pet Passport</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Verified Veterinary Cloud Registry</span>
            </div>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {/* Pet Switcher Tabs if multiple pets */}
        {pets.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
            {pets.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPetId(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: selectedPetId === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedPetId === p.id ? 'rgba(16,185,129,0.12)' : 'var(--surface-alt)',
                  color: selectedPetId === p.id ? 'var(--primary)' : 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <img src={p.photo} alt={p.name} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ═══ PASSPORT CARD CONTAINER ═══ */}
        <div style={{
          background: 'linear-gradient(145deg, var(--surface-alt), var(--surface-solid))',
          borderRadius: '20px',
          border: '1.5px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)'
        }}>
          {/* Top Gold / Green Ribbon */}
          <div style={{ 
            background: 'linear-gradient(90deg, #10B981, #059669)', 
            padding: '12px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            color: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Pet Maya Official Health Document
              </span>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              VERIFIED
            </span>
          </div>

          {/* Main Pet Info Strip */}
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={pet.photo} 
                  alt={pet.name} 
                  style={{ 
                    width: 76, 
                    height: 76, 
                    borderRadius: '16px', 
                    objectFit: 'cover', 
                    border: '2px solid var(--primary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }} 
                />
                <span style={{ 
                  position: 'absolute', 
                  bottom: -6, 
                  right: -6, 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  borderRadius: '50%', 
                  width: 20, 
                  height: 20, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CheckCircle2 size={12} />
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{pet.name}</h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                    {pet.species || 'Dog'}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  {pet.breed} • {pet.gender || 'Male'}
                </span>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  <span>Age: <strong>{pet.age || '2 Yrs'}</strong></span>
                  <span>Weight: <strong>{pet.weight || '12.5'} kg</strong></span>
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
              <div style={{ background: 'var(--surface-solid)', padding: '10px 12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  Microchip Tag ID
                </span>
                <strong style={{ fontSize: '12.5px', fontFamily: 'monospace', color: 'var(--text-main)', display: 'block', marginTop: '3px' }}>
                  {microchipId}
                </strong>
              </div>

              <div style={{ background: 'var(--surface-solid)', padding: '10px 12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  Rabies Certificate
                </span>
                <strong style={{ fontSize: '12.5px', fontFamily: 'monospace', color: 'var(--primary)', display: 'block', marginTop: '3px' }}>
                  {rabiesTagId}
                </strong>
              </div>
            </div>

            {/* QR Recovery & Emergency Block */}
            <div style={{ 
              background: 'var(--surface-solid)', 
              borderRadius: '14px', 
              padding: '14px', 
              display: 'flex', 
              gap: '16px', 
              alignItems: 'center',
              border: '1px solid var(--border)'
            }}>
              {/* Simulated High-Res Passport QR Code SVG */}
              <div style={{ 
                background: '#FFFFFF', 
                padding: '8px', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="5" height="5" x="3" y="3" rx="1"/>
                  <rect width="5" height="5" x="16" y="3" rx="1"/>
                  <rect width="5" height="5" x="3" y="16" rx="1"/>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                  <path d="M21 21v.01"/>
                  <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                  <path d="M3 12h.01"/>
                  <path d="M12 3h.01"/>
                  <path d="M12 16v.01"/>
                  <path d="M16 12h1"/>
                  <path d="M21 12v.01"/>
                  <path d="M12 21v-1"/>
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  Emergency Recovery QR
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>
                  Scan to Return Lost Pet
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px', lineHeight: 1.3 }}>
                  Directly links to guardian contact &amp; critical veterinary allergy notes.
                </span>
              </div>
            </div>

            {/* Owner Details */}
            <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered Guardian:</span>
                <strong style={{ fontSize: '12.5px', display: 'block', color: 'var(--text-main)' }}>
                  {currentUser?.name || 'Pet Parent'}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hotline:</span>
                <strong style={{ fontSize: '12.5px', display: 'block', color: 'var(--primary)' }}>
                  {currentUser?.phone || '+8801835120307'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '18px' }}>
          <button className="btn-ghost" onClick={handleSharePassport}>
            <Share2 size={15} />
            <span>Share QR Link</span>
          </button>
          <button className="apple-btn-blue" onClick={handleDownloadPassport}>
            <Download size={15} />
            <span>Download Card</span>
          </button>
        </div>

      </div>
    </div>
  );
}

