import React, { useState } from 'react';
import { 
  Activity, 
  Heart, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight, 
  Search, 
  AlertTriangle,
  Syringe,
  Utensils,
  ChevronRight
} from 'lucide-react';

export default function PetHealthHub({ onNavigate }) {
  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const articles = [
    {
      id: 'dog-vaccination',
      category: 'dogs',
      categoryLabel: 'Canine Care',
      title: 'Complete Dog Vaccination Schedule: Puppyhood to Senior',
      desc: 'Understand the difference between core vaccines (DHPP, Rabies) and lifestyle vaccines (Bordetella, Leptospirosis), along with safe booster intervals.',
      readTime: '6 min read',
      tag: 'Vaccinations',
      action: '/digital-pet-passport',
      actionLabel: 'Log in Passport'
    },
    {
      id: 'cat-nutrition',
      category: 'cats',
      categoryLabel: 'Feline Care',
      title: 'Hydration and Kidney Health in Domestic Cats: Wet vs Dry Food',
      desc: 'Clinical recommendations on urinary tract health, moisture intake strategies, and preventing feline idiopathic cystitis through diet.',
      readTime: '5 min read',
      tag: 'Nutrition',
      action: 'food',
      actionLabel: 'Nutrition Guide'
    },
    {
      id: 'pet-first-aid',
      category: 'emergency',
      categoryLabel: 'Emergency Protocol',
      title: 'Emergency First Aid: Heatstroke, Choking, and Toxic Ingestion',
      desc: 'Step-by-step immediate actions every pet parent must know before reaching the emergency veterinary clinic.',
      readTime: '7 min read',
      tag: 'First Aid',
      action: 'ai',
      actionLabel: 'AI Triage Protocol'
    },
    {
      id: 'canine-weight',
      category: 'dogs',
      categoryLabel: 'Canine Care',
      title: 'Managing Canine Body Condition Score (BCS 1 to 9)',
      desc: 'How maintaining an optimal body condition score extends canine longevity by up to 2.5 years and relieves orthopedic strain.',
      readTime: '4 min read',
      tag: 'Weight & Wellness',
      action: 'food',
      actionLabel: 'Calorie Calculator'
    },
    {
      id: 'cat-parasite',
      category: 'cats',
      categoryLabel: 'Feline Care',
      title: 'Indoor Cat Parasite Prevention: Fleas, Ticks, and Heartworm',
      desc: 'Why strictly indoor cats still need regular parasite prophylaxis and the science behind modern topical treatments.',
      readTime: '5 min read',
      tag: 'Preventative Care',
      action: '#shop',
      actionLabel: 'Care Pharmacy'
    },
    {
      id: 'vet-teleconsult',
      category: 'general',
      categoryLabel: 'Veterinary Access',
      title: 'When to Use Video Teleconsultation vs Going to the Hospital',
      desc: 'A practical clinical framework for deciding when a video triage session is appropriate and when physical palpation is necessary.',
      readTime: '4 min read',
      tag: 'Telehealth',
      action: '/for-veterinarians',
      actionLabel: 'Find a Specialist'
    }
  ];

  const filtered = articles.filter(a => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory;
    const matchQuery = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)' }}>
      {/* ── HERO ── */}
      <section className="editorial-section editorial-section-border" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="editorial-container">
          <span className="text-eyebrow text-eyebrow-accent" style={{ marginBottom: '14px' }}>
            VETERINARY KNOWLEDGE HUB
          </span>
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              maxWidth: '820px',
              margin: '0 auto 20px',
            }}
          >
            Evidence-based pet health guidance.
          </h1>
          <p
            style={{
              fontSize: 'clamp(17px, 2vw, 20px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '620px',
              margin: '0 auto 36px',
            }}
          >
            Clinical advice reviewed by verified veterinarians. Simple explanations, preventive regimens, and responsible medical information.
          </p>

          {/* Search bar */}
          <div style={{ maxWidth: '480px', margin: '0 auto 28px', position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search pet health articles, vaccines, diets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 18px 13px 44px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                fontFamily: 'var(--font-body)',
                fontSize: '14.5px',
                outline: 'none',
                color: 'var(--foreground)',
                boxShadow: 'var(--shadow-xs)',
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'dogs', label: 'Dog Care' },
              { id: 'cats', label: 'Cat Care' },
              { id: 'emergency', label: 'Emergency First Aid' },
              { id: 'general', label: 'Preventive Care' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${activeCategory === cat.id ? 'var(--foreground)' : 'var(--border)'}`,
                  backgroundColor: activeCategory === cat.id ? 'var(--foreground)' : 'var(--surface)',
                  color: activeCategory === cat.id ? '#FFF' : 'var(--foreground)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARTICLES GRID ── */}
      <section className="editorial-section editorial-section-border">
        <div className="editorial-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {filtered.map(article => (
              <div
                key={article.id}
                className="editorial-card"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {article.categoryLabel}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {article.readTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 700, lineHeight: 1.35, marginBottom: '10px' }}>
                    {article.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                    {article.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Topic: {article.tag}
                  </span>
                  <button
                    onClick={() => handleRoute(article.action)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{article.actionLabel}</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="editorial-section" style={{ backgroundColor: 'var(--soft-surface)', textAlign: 'center' }}>
        <div className="editorial-container-narrow">
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 50px)', fontWeight: 800, marginBottom: '16px' }}>
            Have a specific pet health question?
          </h2>
          <p style={{ fontSize: '16.5px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Consult our clinical AI symptom checker or book an appointment with a verified veterinary specialist.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={() => handleRoute('ai')} className="editorial-btn-primary">
              <span>Try AI Health Scanner</span>
              <ArrowRight size={15} />
            </button>
            <button onClick={() => handleRoute('vets')} className="editorial-btn-secondary">
              <span>Find a Veterinarian</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
