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
  ChevronRight,
  BookOpen,
  Clock,
  User,
  Tag,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

const BREEDS_DATABASE = [
  {
    name: 'Golden Retriever',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop&q=80',
    tags: ['dog', 'family', 'active'],
    exercise: 90,
    shedding: 80,
    trainability: 95,
    lifespan: '10 - 12 Yrs',
    health: 'Prone to hip dysplasia, ear moisture, and seasonal allergies. Requires joint supplements.'
  },
  {
    name: 'British Shorthair',
    species: 'cat',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80',
    tags: ['cat', 'apartment', 'calm'],
    exercise: 40,
    shedding: 50,
    trainability: 70,
    lifespan: '12 - 17 Yrs',
    health: 'Prone to hypertrophic cardiomyopathy (HCM) and weight gain. Requires controlled portions.'
  },
  {
    name: 'Ring-necked Dove',
    species: 'bird',
    image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80',
    tags: ['bird', 'calm', 'apartment'],
    exercise: 50,
    shedding: 30,
    trainability: 85,
    lifespan: '15 - 20 Yrs',
    health: 'Gentle temperament. Needs diverse seed mix, calcium grit, clean flight cage, and fresh water.'
  },
  {
    name: 'Poodle (Standard & Toy)',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&auto=format&fit=crop&q=80',
    tags: ['dog', 'hypo', 'apartment'],
    exercise: 75,
    shedding: 20,
    trainability: 98,
    lifespan: '12 - 15 Yrs',
    health: 'Hypoallergenic non-shedding coat. Regular ear cleaning and professional grooming needed.'
  },
  {
    name: 'French Bulldog',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop&q=80',
    tags: ['dog', 'apartment', 'low-exercise'],
    exercise: 35,
    shedding: 45,
    trainability: 75,
    lifespan: '10 - 12 Yrs',
    health: 'Brachycephalic airway syndrome. Maintain cool indoor environments and avoid overexertion.'
  },
  {
    name: 'Persian Cat',
    species: 'cat',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&auto=format&fit=crop&q=80',
    tags: ['cat', 'calm', 'indoor'],
    exercise: 30,
    shedding: 85,
    trainability: 60,
    lifespan: '12 - 15 Yrs',
    health: 'Requires daily coat brushing and ocular tear cleaning to prevent staining.'
  },
  {
    name: 'German Shepherd',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&auto=format&fit=crop&q=80',
    tags: ['dog', 'active', 'guard'],
    exercise: 95,
    shedding: 85,
    trainability: 99,
    lifespan: '9 - 13 Yrs',
    health: 'High stamina. Needs high-protein diet, joint mobility support, and daily mental stimulation.'
  }
];

const BLOG_ARTICLES = [
  {
    id: 'b1',
    title: 'Optimal Macronutrient Ratios for Adult Canines & Felines',
    category: 'Nutrition',
    author: 'Dr. Sarah Jenkins, DVM',
    date: 'Aug 20, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Discover the exact protein, fat, and fiber ratios required to sustain lean muscle mass and prevent renal stress in adult pets.',
    content: `Maintaining optimal canine and feline health starts with understanding resting metabolic energy (RER). Dogs thrive on a balanced diet containing 22-28% bioavailable crude protein and 12-16% healthy lipids rich in Omega-3 (EPA/DHA) fatty acids. Cats, as obligate carnivores, require higher dietary protein (30-40%) and essential taurine to prevent dilated cardiomyopathy.

When choosing between dry kibble and wet canned food, a 70/30 split provides superior dental scraping benefits from kibble alongside increased urinary hydration from wet food toppers.`
  },
  {
    id: 'b2',
    title: 'Recognizing Early Warning Signs of Seasonal Atopic Dermatitis',
    category: 'Health',
    author: 'Dr. Aris Thorne, BVSc',
    date: 'Aug 18, 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    excerpt: 'How to differentiate between environmental pollen allergies, flea bite hypersensitivity, and food protein intolerances.',
    content: `Allergic skin disease in companion animals often begins with subtle symptoms: persistent paw licking, face rubbing, and erythema along the groin or inner pinna. If left untreated, self-mutilation leads to secondary bacterial (Staphylococcus) and fungal (Malassezia) infections.

Immediate management includes antiseptic chlorhexidine wipes, hypoallergenic omega-3 skin barrier supplements, and consulting your veterinary clinician for cytological swabs or targeted anti-IL-31 therapeutics.`
  },
  {
    id: 'b3',
    title: 'Hydration Protocols: Preventing Feline Chronic Kidney Disease',
    category: 'Longevity',
    author: 'Dr. Emily Vance, DVM',
    date: 'Aug 14, 2026',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Why domestic cats have a naturally low thirst drive and practical strategies to double their daily fluid intake.',
    content: `Desert-adapted feline ancestors derived the majority of moisture from fresh prey. Consequently, domestic cats feeding exclusively on dry food consume only 50% of their daily physiological hydration needs (50-60ml per kg).

To support glomerular filtration and prevent calcium oxalate bladder crystals:
1. Introduce stainless steel or ceramic circulating water fountains.
2. Incorporate warm bone broth or wet gravy food at every meal.
3. Place water bowls away from food and litter stations.`
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

  const [selectedArticle, setSelectedArticle] = useState(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1120px', margin: '0 auto', width: '100%' }}>
      
      {/* ── 1. NUTRITION CALCULATOR ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <span className="apple-card-eyebrow" style={{ color: '#EC4899' }}>Precision Diet</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>Daily Calorie &amp; Portion Calculator</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Scientifically balanced daily caloric intake (RER/MER) based on breed, weight, and activity level.</p>
        </div>

        <div className="nutrition-calc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
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

      {/* ── 2. VETERINARY BLOG & EXPERT ADVICE ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="apple-card-eyebrow" style={{ color: '#F97316' }}>Knowledge Base</span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Veterinary Blog &amp; Care Advice</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Evidence-based articles written by licensed veterinary clinicians and animal behaviorists.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {BLOG_ARTICLES.map((art) => (
            <div 
              key={art.id} 
              className="apple-promo-card" 
              style={{
                padding: '20px',
                textAlign: 'left',
                alignItems: 'stretch',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                background: 'var(--surface-alt)'
              }}
              onClick={() => setSelectedArticle(art)}
            >
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '160px', marginBottom: '14px' }}>
                <img src={art.image} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-green" style={{ fontSize: '11px' }}>{art.category}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{art.readTime}</span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.35, marginBottom: '8px' }}>{art.title}</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '14px', flex: 1 }}>{art.excerpt}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{art.author}</span>
                <span className="apple-link-cta" style={{ fontSize: '12px', color: '#F97316' }}>
                  <span>Read Article</span>
                  <ChevronRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. BREED TRAIT EXPLORER ── */}
      <div className="apple-promo-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Breed Profiles</span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Breed Trait &amp; Care Explorer</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Discover energy levels, shedding, trainability, and clinical health tendencies.</p>
          </div>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              className="input-clean" 
              placeholder="Search breed (e.g. Retriever, Dove)..." 
              value={breedSearch}
              onChange={(e) => setBreedSearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
        </div>

        <div className="chip-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <button className={`chip-pill ${breedFilter === 'all' ? 'active' : ''}`} onClick={() => setBreedFilter('all')}>All Breeds</button>
          <button className={`chip-pill ${breedFilter === 'dog' ? 'active' : ''}`} onClick={() => setBreedFilter('dog')}>🐕 Dogs</button>
          <button className={`chip-pill ${breedFilter === 'cat' ? 'active' : ''}`} onClick={() => setBreedFilter('cat')}>🐈 Cats</button>
          <button className={`chip-pill ${breedFilter === 'bird' ? 'active' : ''}`} onClick={() => setBreedFilter('bird')}>🕊️ Birds</button>
          <button className={`chip-pill ${breedFilter === 'hypo' ? 'active' : ''}`} onClick={() => setBreedFilter('hypo')}>🌿 Hypoallergenic</button>
          <button className={`chip-pill ${breedFilter === 'apartment' ? 'active' : ''}`} onClick={() => setBreedFilter('apartment')}>🏢 Apartment Friendly</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {filteredBreeds.map(b => (
            <div key={b.name} className="apple-promo-card" style={{ padding: '18px', textAlign: 'left', alignItems: 'stretch' }}>
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 130, marginBottom: '12px' }}>
                <img src={b.image} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0 }}>{b.name}</h4>
                  <span className="badge badge-blue">{b.lifespan}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{b.health}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <span>Exercise Needs</span><span>{b.exercise}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: `${b.exercise}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <span>Trainability</span><span>{b.trainability}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: `${b.trainability}%`, height: '100%', background: '#3B82F6' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. ARTICLE READER MODAL ── */}
      {selectedArticle && (
        <div className="modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge badge-green">{selectedArticle.category}</span>
              <button className="icon-btn" onClick={() => setSelectedArticle(null)}><X size={18} /></button>
            </div>

            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 220, marginBottom: '16px' }}>
              <img src={selectedArticle.image} alt={selectedArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.3, marginBottom: '8px' }}>{selectedArticle.title}</h2>
            <div style={{ display: 'flex', gap: '14px', fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <span>✍️ {selectedArticle.author}</span>
              <span>📅 {selectedArticle.date}</span>
              <span>⏱️ {selectedArticle.readTime}</span>
            </div>

            <div style={{ fontSize: '14.5px', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {selectedArticle.content}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="apple-btn-blue" onClick={() => setSelectedArticle(null)}>
                <span>Close Article</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
