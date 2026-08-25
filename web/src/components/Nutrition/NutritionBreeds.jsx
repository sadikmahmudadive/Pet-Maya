import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Utensils, 
  Search, 
  Droplet, 
  Beef, 
  Cookie, 
  Sparkles,
  Heart,
  ChevronRight
} from 'lucide-react';

const BREEDS_DATABASE = [
  {
    name: 'Golden Retriever',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'family', 'active'],
    exercise: 90,
    shedding: 80,
    trainability: 95,
    lifespan: '10 - 12 Yrs',
    health: 'Prone to hip dysplasia, ear moisture, and seasonal allergies.'
  },
  {
    name: 'British Shorthair',
    species: 'cat',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80',
    tags: ['cat', 'apartment', 'calm'],
    exercise: 40,
    shedding: 50,
    trainability: 70,
    lifespan: '12 - 17 Yrs',
    health: 'Prone to hypertrophic cardiomyopathy (HCM) and weight gain.'
  },
  {
    name: 'Poodle (Standard & Toy)',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'hypo', 'apartment'],
    exercise: 75,
    shedding: 20,
    trainability: 98,
    lifespan: '12 - 15 Yrs',
    health: 'Hypoallergenic coat. Regular ear cleaning and grooming needed.'
  },
  {
    name: 'French Bulldog',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'apartment', 'low-exercise'],
    exercise: 35,
    shedding: 45,
    trainability: 75,
    lifespan: '10 - 12 Yrs',
    health: 'Brachycephalic airway syndrome. Maintain cool indoor environments.'
  },
  {
    name: 'Persian Cat',
    species: 'cat',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&auto=format&fit=crop&q=80',
    tags: ['cat', 'calm', 'indoor'],
    exercise: 30,
    shedding: 85,
    trainability: 60,
    lifespan: '12 - 15 Yrs',
    health: 'Requires daily coat brushing and ocular tear cleaning.'
  },
  {
    name: 'German Shepherd',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'active', 'guard'],
    exercise: 95,
    shedding: 85,
    trainability: 99,
    lifespan: '9 - 13 Yrs',
    health: 'High stamina. Needs joint supplements and mental stimulation.'
  }
];

export default function NutritionBreeds() {
  const { pets, showToast } = useApp();

  const [selectedPet, setSelectedPet] = useState(pets[0]?.id || 'custom');
  const [weight, setWeight] = useState(pets[0]?.weight ? parseFloat(pets[0].weight) : 12.5);
  const [lifeStage, setLifeStage] = useState('adult');
  const [activity, setActivity] = useState('active');

  const [breedSearch, setBreedSearch] = useState('');
  const [breedFilter, setBreedFilter] = useState('all');

  const handlePetChange = (petId) => {
    setSelectedPet(petId);
    if (petId === 'custom') return;
    const p = pets.find(x => x.id === petId);
    if (p && p.weight) setWeight(parseFloat(p.weight) || 10);
  };

  // Scientific RER & MER Formula (Resting / Maintenance Energy Requirement)
  const rer = 70 * Math.pow(Math.max(weight, 0.5), 0.75);

  let factor = 1.6;
  if (activity === 'neutered') factor = 1.4;
  if (activity === 'active') factor = 1.8;
  if (activity === 'working') factor = 2.4;
  if (activity === 'weightloss') factor = 1.0;
  if (lifeStage === 'puppy') factor = 2.8;
  if (lifeStage === 'senior') factor = 1.2;

  const mer = Math.round(rer * factor);
  const dryGrams = Math.round((mer * 0.75) / 3.75);
  const cups = (dryGrams / 120).toFixed(1);
  const wetGrams = Math.round((mer * 0.15) / 1.0);
  const treatKcal = Math.round(mer * 0.1);
  const waterMl = Math.round(weight * 60);

  const filteredBreeds = BREEDS_DATABASE.filter(b => {
    const matchesQuery = b.name.toLowerCase().includes(breedSearch.toLowerCase()) || 
                          b.health.toLowerCase().includes(breedSearch.toLowerCase());
    const matchesTag = breedFilter === 'all' || b.tags.includes(breedFilter);
    return matchesQuery && matchesTag;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── NUTRITION CALCULATOR ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <span className="apple-card-eyebrow" style={{ color: '#EC4899' }}>Precision Diet</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>Daily Calorie &amp; Portion Calculator</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Scientifically balanced daily caloric intake (RER/MER) based on breed, weight, and activity level.</p>
        </div>

        <div className="nutrition-calc-grid">
          {/* Inputs Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="label-mini">Select Patient</label>
                <select className="input-clean" value={selectedPet} onChange={(e) => handlePetChange(e.target.value)}>
                  {pets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
                  ))}
                  <option value="custom">Custom Entry...</option>
                </select>
              </div>

              <div>
                <label className="label-mini">Body Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.5" 
                  className="input-clean" 
                  value={weight} 
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 1)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="label-mini">Life Stage</label>
                <select className="input-clean" value={lifeStage} onChange={(e) => setLifeStage(e.target.value)}>
                  <option value="adult">Adult (1 - 7 Years)</option>
                  <option value="puppy">Puppy / Kitten (&lt; 1 Year)</option>
                  <option value="senior">Senior (7+ Years)</option>
                </select>
              </div>

              <div>
                <label className="label-mini">Activity Level</label>
                <select className="input-clean" value={activity} onChange={(e) => setActivity(e.target.value)}>
                  <option value="neutered">Neutered / Moderate Indoor</option>
                  <option value="active">Active Daily (Walks &amp; Play)</option>
                  <option value="working">High Performance / Agility</option>
                  <option value="weightloss">Weight Management (Diet)</option>
                </select>
              </div>
            </div>

            <button 
              className="apple-btn-blue" 
              style={{ marginTop: '8px', padding: '12px' }}
              onClick={() => showToast('🥣 Portion recommendations refreshed!', 'success')}
            >
              <Utensils size={15} />
              <span>Calculate Daily Portions</span>
            </button>
          </div>

          {/* Results Card */}
          <div 
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Target Daily Energy
              </span>
              <span className="badge badge-green" style={{ fontSize: '15px', fontWeight: 800, padding: '6px 14px' }}>
                {mer.toLocaleString()} kcal/day
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Beef size={16} color="#10B981" /> Dry Kibble Portion:
                </span>
                <strong style={{ color: 'var(--text-main)' }}>{dryGrams} g / {cups} cups</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Utensils size={16} color="#F59E0B" /> Wet Food / Topper:
                </span>
                <strong style={{ color: 'var(--text-main)' }}>{wetGrams} g / day</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cookie size={16} color="#EC4899" /> Treat Allowance (Max 10%):
                </span>
                <strong style={{ color: 'var(--text-main)' }}>{treatKcal} kcal max</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplet size={16} color="#0071E3" /> Daily Hydration Target:
                </span>
                <strong style={{ color: '#0071E3' }}>{waterMl.toLocaleString()} ml / day</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BREED TRAIT EXPLORER ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Breed Trait &amp; Care Explorer</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Discover energy levels, shedding, trainability, and clinical health tendencies.</p>
          </div>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              className="input-clean" 
              placeholder="Search breed (e.g. Retriever)..." 
              value={breedSearch}
              onChange={(e) => setBreedSearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
        </div>

        <div className="chip-row">
          <button className={`chip-pill ${breedFilter === 'all' ? 'active' : ''}`} onClick={() => setBreedFilter('all')}>All Breeds</button>
          <button className={`chip-pill ${breedFilter === 'dog' ? 'active' : ''}`} onClick={() => setBreedFilter('dog')}>🐕 Dogs</button>
          <button className={`chip-pill ${breedFilter === 'cat' ? 'active' : ''}`} onClick={() => setBreedFilter('cat')}>🐈 Cats</button>
          <button className={`chip-pill ${breedFilter === 'hypo' ? 'active' : ''}`} onClick={() => setBreedFilter('hypo')}>🌿 Hypoallergenic</button>
          <button className={`chip-pill ${breedFilter === 'apartment' ? 'active' : ''}`} onClick={() => setBreedFilter('apartment')}>🏢 Apartment Friendly</button>
        </div>

        <div className="breed-card-grid">
          {filteredBreeds.map(b => (
            <div key={b.name} className="breed-explore-card" style={{ borderRadius: 'var(--radius-md)' }}>
              <img src={b.image} alt={b.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{b.name}</h4>
                  <span className="badge badge-blue">{b.lifespan}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{b.health}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  <span>Exercise Needs</span><span>{b.exercise}%</span>
                </div>
                <div className="trait-meter-bar"><div className="trait-meter-fill" style={{ width: `${b.exercise}%` }} /></div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  <span>Trainability</span><span>{b.trainability}%</span>
                </div>
                <div className="trait-meter-bar"><div className="trait-meter-fill" style={{ width: `${b.trainability}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
