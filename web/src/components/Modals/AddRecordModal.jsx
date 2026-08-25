import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, FileText, Plus } from 'lucide-react';

export default function AddRecordModal() {
  const { closeModal, addMedicalRecord, pets } = useApp();

  const [petName, setPetName] = useState(pets[0]?.name || 'Max');
  const [serviceType, setServiceType] = useState('Consultation');
  const [weight, setWeight] = useState('28.4 kg');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [cost, setCost] = useState('45');
  const [nextBooster, setNextBooster] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    addMedicalRecord({
      petName,
      ownerName: 'Alex Johnson',
      serviceType,
      weight,
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim() || 'N/A',
      cost: parseFloat(cost) || 40,
      nextBooster
    });
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Add Clinical EHR Record</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Record veterinary diagnosis &amp; medical prescription.</p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label-mini">Patient</label>
              <select className="input-clean" value={petName} onChange={e => setPetName(e.target.value)}>
                {pets.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label-mini">Service Type</label>
              <select className="input-clean" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                <option value="Consultation">Clinical Consultation</option>
                <option value="Vaccination">Vaccination &amp; Booster</option>
                <option value="Surgery">Minor Surgery / Dental</option>
                <option value="Diagnostics">Bloodwork &amp; Lab Triage</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label-mini">Patient Weight</label>
              <input type="text" className="input-clean" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>

            <div>
              <label className="label-mini">Treatment Cost ($)</label>
              <input type="number" className="input-clean" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label-mini">Clinical Diagnosis</label>
            <input type="text" className="input-clean" placeholder="e.g. Acute allergic dermatitis, ear erythema" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required />
          </div>

          <div>
            <label className="label-mini">Prescription Instructions (Rx)</label>
            <textarea className="input-clean" rows={2} placeholder="e.g. Apoquel 16mg daily for 14 days..." value={prescription} onChange={e => setPrescription(e.target.value)} />
          </div>

          <div>
            <label className="label-mini">Next Booster / Checkup Date</label>
            <input type="date" className="input-clean" value={nextBooster} onChange={e => setNextBooster(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px', marginTop: '6px' }}>
            <Plus size={16} />
            <span>Save to Patient Passport</span>
          </button>
        </form>
      </div>
    </div>
  );
}
