import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus } from 'lucide-react';

export default function AddPetModal() {
  const { addPet, closeModal } = useApp();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('2 Yrs');
  const [weight, setWeight] = useState('12.5');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    addPet({
      name: name.trim(),
      species,
      breed: breed.trim() || 'Mixed Breed',
      gender,
      age,
      weight,
      photo: species === 'Cat' ? 'assets/images/Pet_2.jpg' : 'assets/images/Pet_1.jpg'
    });

    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Add New Pet Profile</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Registered across mobile app &amp; veterinary cloud.</p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="label-mini">Pet Name</label>
            <input type="text" className="input-clean" placeholder="e.g. Bella" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label-mini">Species</label>
              <select className="input-clean" value={species} onChange={e => setSpecies(e.target.value)}>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
              </select>
            </div>

            <div>
              <label className="label-mini">Breed</label>
              <input type="text" className="input-clean" placeholder="e.g. Golden Retriever" value={breed} onChange={e => setBreed(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label-mini">Gender</label>
              <select className="input-clean" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="label-mini">Age</label>
              <input type="text" className="input-clean" placeholder="e.g. 2 Yrs" value={age} onChange={e => setAge(e.target.value)} />
            </div>

            <div>
              <label className="label-mini">Weight (kg)</label>
              <input type="number" step="0.1" className="input-clean" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
            <Plus size={16} />
            <span>Save Pet Profile</span>
          </button>
        </form>
      </div>
    </div>
  );
}
