import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Star, 
  MapPin, 
  Clock, 
  Calendar, 
  Video, 
  MessageSquarePlus, 
  ShieldCheck,
  Heart,
  Flame,
  ChevronRight,
  Briefcase,
  History,
  Navigation
} from 'lucide-react';

// ── Specialty filter chip definitions ──────────────────────────────────────
const SPECIALTY_CHIPS = [
  { id: 'all',               label: 'All Specialties' },
  { id: 'Surgery',           label: 'Surgery' },
  { id: 'Dermatology',       label: 'Dermatology' },
  { id: 'Internal Medicine', label: 'Internal Medicine' },
  { id: 'Dentistry',         label: 'Dentistry' },
  { id: 'Ophthalmology',     label: 'Ophthalmology' },
];

// ── Simulated rating-breakdown distribution ────────────────────────────────
const RATING_DIST = [
  { stars: 5, pct: 0.70 },
  { stars: 4, pct: 0.20 },
  { stars: 3, pct: 0.07 },
  { stars: 2, pct: 0.02 },
  { stars: 1, pct: 0.01 },
];

// ── Clinic hours helper ────────────────────────────────────────────────────
function isOpenNow() {
  const h = new Date().getHours();
  return h >= 9 && h < 20;
}

// ── Visual star row component ──────────────────────────────────────────────
function StarRow({ rating }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px', alignItems: 'center' }}>
      {Array(5).fill(0).map((_, idx) => (
        <Star
          key={idx}
          size={11}
          color="#F59E0B"
          fill={idx < Math.floor(rating) ? '#F59E0B' : 'none'}
        />
      ))}
    </span>
  );
}

// ── Rating breakdown mini bar-chart (details/summary) ─────────────────────
function RatingBreakdown({ reviews }) {
  return (
    <details style={{ fontSize: '11px', marginTop: '6px' }}>
      <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', listStyle: 'none', userSelect: 'none' }}>
        ▸ Rating breakdown
      </summary>
      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {RATING_DIST.map(({ stars, pct }) => {
          const count = Math.round((reviews || 0) * pct);
          return (
            <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', textAlign: 'right', fontWeight: 600 }}>{stars}★</span>
              {/* Track */}
              <div style={{ position: 'relative', width: '60px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                {/* Fill bar */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct * 100}%`,
                  background: stars >= 4 ? '#10B981' : stars === 3 ? '#F59E0B' : '#EF4444',
                  borderRadius: '2px'
                }} />
              </div>
              <span style={{ color: 'var(--text-muted)', minWidth: '28px' }}>{count}</span>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export default function Specialists() {
  const { vets, isVetsLoading, openModal, favoriteVetIds, toggleFavoriteVet } = useApp();
  const { currentUser } = useAuth();

  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedCategory,   setSelectedCategory]   = useState('all');
  const [sortBy,             setSortBy]             = useState('rating');
  const [selectedSpecialty,  setSelectedSpecialty]  = useState('all');
  const [onlyNearby,         setOnlyNearby]         = useState(false);

  const openNow = isOpenNow();

  const filteredVets = vets.filter(v => {
    const matchesSearch = (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.qualification || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (v.clinic || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'all' || 
                       (selectedCategory === 'vet'      && (v.tag || '').toLowerCase().includes('vet')) ||
                       (selectedCategory === 'grooming' && (v.tag || '').toLowerCase().includes('groom')) ||
                       (selectedCategory === 'boarding' && (v.tag || '').toLowerCase().includes('board'));

    const matchesSpecialty = selectedSpecialty === 'all' ||
      (v.qualification || '').toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
      (v.bio || '').toLowerCase().includes(selectedSpecialty.toLowerCase());

    const distVal = parseFloat(v.distance || '10');
    const matchesNearby = !onlyNearby || distVal < 3.0;

    return matchesSearch && matchesCat && matchesSpecialty && matchesNearby;
  }).sort((a, b) => {
    if (sortBy === 'rating')   return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
    if (sortBy === 'name')     return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── HEADER & ACTIONS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span className="apple-card-eyebrow" style={{ color: '#F59E0B' }}>Clinical Network</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>Specialists &amp; Clinicians</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Discover verified veterinarians, specialist surgeons, grooming spas &amp; boarding resorts.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => openModal('favoriteVets')}
          >
            <Heart size={14} color="#EF4444" fill="#EF4444" />
            <span>Saved Specialists</span>
          </button>
          <button className="apple-btn-blue" onClick={() => openModal('booking')}>
            <Calendar size={15} />
            <span>Book In-Clinic Visit</span>
          </button>
        </div>
      </div>

      {/* ── 24/7 EMERGENCY ON-CALL BANNER ── */}
      <div 
        className="apple-solid-card"
        style={{
          padding: '24px 30px',
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <Flame size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '16px', fontWeight: 700 }}>24/7 Emergency Clinical Triage</strong>
              <span className="badge badge-green" style={{ fontSize: '10.5px' }}>Live On-Call</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Immediate video tele-health connection with on-duty emergency veterinarians.</p>
          </div>
        </div>
        <button 
          className="apple-btn-blue" 
          style={{ background: '#EF4444' }}
          onClick={() => openModal('booking', { doctor: 'Dr. Sarah Jenkins', mode: 'HD Tele-Consultation' })}
        >
          <Video size={15} />
          <span>Instant Video Triage</span>
        </button>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            type="text" 
            className="input-clean" 
            placeholder="Search by clinician name, qualification, or clinic..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setOnlyNearby(!onlyNearby)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              border: onlyNearby ? '1px solid #10B981' : '1px solid var(--border)',
              background: onlyNearby ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface)',
              color: onlyNearby ? '#10B981' : 'var(--text-muted)',
              transition: 'all 0.18s ease',
            }}
          >
            <Navigation size={13} color={onlyNearby ? '#10B981' : 'currentColor'} />
            <span>Nearby (&lt; 3 km)</span>
          </button>

          <select 
            className="input-clean" 
            style={{ width: 'auto', fontWeight: 600 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Highest Rating</option>
            <option value="distance">Nearest to Me</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="chip-row">
        <button className={`chip-pill ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>
          All Specialists ({vets.length})
        </button>
        <button className={`chip-pill ${selectedCategory === 'vet' ? 'active' : ''}`} onClick={() => setSelectedCategory('vet')}>
          Veterinarians
        </button>
        <button className={`chip-pill ${selectedCategory === 'grooming' ? 'active' : ''}`} onClick={() => setSelectedCategory('grooming')}>
          Grooming Spas
        </button>
        <button className={`chip-pill ${selectedCategory === 'boarding' ? 'active' : ''}`} onClick={() => setSelectedCategory('boarding')}>
          Boarding Resorts
        </button>
      </div>

      {/* ── NEW: SPECIALTY FILTER CHIPS ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px', whiteSpace: 'nowrap' }}>
          Specialty:
        </span>
        {SPECIALTY_CHIPS.map(chip => (
          <button
            key={chip.id}
            onClick={() => setSelectedSpecialty(chip.id)}
            style={{
              padding: '5px 13px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1.5px solid',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              borderColor: selectedSpecialty === chip.id ? '#10B981' : 'var(--border)',
              background:  selectedSpecialty === chip.id ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color:       selectedSpecialty === chip.id ? '#10B981' : 'var(--text-muted)',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── SPECIALISTS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {isVetsLoading && vets.length === 0 ? (
          [1, 2, 3].map((n) => (
            <div 
              key={n} 
              className="apple-solid-card" 
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '22px', opacity: 0.6 }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--surface-alt)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: '60%', height: 16, background: 'var(--surface-alt)', borderRadius: 4 }} />
                  <div style={{ width: '40%', height: 12, background: 'var(--surface-alt)', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ width: '100%', height: 38, background: 'var(--surface-alt)', borderRadius: 6 }} />
              <div style={{ width: '100%', height: 34, background: 'var(--surface-alt)', borderRadius: 8, marginTop: 'auto' }} />
            </div>
          ))
        ) : (
          filteredVets.map((v) => {
          const isFav = (currentUser?.favoriteVetIds || favoriteVetIds || []).includes(v.id);
          const isVet = (v.tag || '').toLowerCase().includes('vet');

          return (
            <div 
              key={v.id} 
              className="apple-solid-card" 
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'stretch', textAlign: 'left', padding: '22px' }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {/* Avatar with Open/Closed badge overlay */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img 
                      src={v.photo || 'assets/images/Pet_1.jpg'} 
                      alt={v.name} 
                      style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    {/* ── NEW: Clinic Hours Badge ── */}
                    <span style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '8px',
                      background: openNow ? '#10B981' : '#6B7280',
                      color: '#fff',
                      border: '1.5px solid var(--surface)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}>
                      {openNow ? '● Open' : '● Closed'}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '17px', fontWeight: 700 }}>{v.name}</strong>
                      {v.isVerified && <ShieldCheck size={16} color="#10B981" />}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'block' }}>
                      {v.qualification}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{v.clinic}</span>
                  </div>
                </div>

                <button 
                  className="icon-btn" 
                  style={{ width: 32, height: 32, color: isFav ? '#EF4444' : 'var(--text-muted)' }}
                  onClick={() => toggleFavoriteVet(v.id)}
                  title="Save to Favorites"
                >
                  <Heart size={15} fill={isFav ? '#EF4444' : 'none'} />
                </button>
              </div>

              {/* Professional Profile Box (Matching App) */}
              <div style={{
                background: 'var(--surface-alt)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
              }}>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  PROFESSIONAL PROFILE
                </span>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {v.bio || 'Experienced in complex surgeries and preventive care for small animals.'}
                </p>
              </div>

              {/* Meta Stats & Rating Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                {/* Top row: rating + distance */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                    <StarRow rating={v.rating} />
                    <span style={{ marginLeft: '3px' }}>{v.rating}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({v.reviews} reviews)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                    <MapPin size={13} />
                    <span>{v.distance}</span>
                  </div>
                </div>
                <RatingBreakdown reviews={v.reviews} />
              </div>

              {/* Badges Row (Exp + Teleconsult) & Action CTA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--surface-alt)',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)'
                  }}>
                    <Briefcase size={11} />
                    <span>{v.experience || '10 Years'} Exp</span>
                  </div>

                  {isVet && (
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '10px' }}
                      onClick={() => openModal('teleconsult', { doctor: v.name })}
                      title="Instant Video Consult"
                    >
                      <Video size={12} color="#3B82F6" />
                      <span>৳500 Video</span>
                    </button>
                  )}
                </div>

                {/* Start / Book In-Clinic Button */}
                <button 
                  onClick={() => openModal('booking', { doctor: v.name, clinic: v.clinic })}
                  style={{
                    background: '#10B981',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Start</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
