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
  ChevronRight
} from 'lucide-react';

export default function Specialists() {
  const { vets, openModal } = useApp();
  const { currentUser, toggleFavoriteVet } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const filteredVets = vets.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.qualification.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.clinic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'all' || 
                       (selectedCategory === 'vet' && v.tag.toLowerCase().includes('vet')) ||
                       (selectedCategory === 'grooming' && v.tag.toLowerCase().includes('groom')) ||
                       (selectedCategory === 'boarding' && v.tag.toLowerCase().includes('board'));

    return matchesSearch && matchesCat;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
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
        <button className="apple-btn-blue" onClick={() => openModal('booking')}>
          <Calendar size={15} />
          <span>Book In-Clinic Visit</span>
        </button>
      </div>

      {/* ── 24/7 EMERGENCY ON-CALL BANNER ── */}
      <div 
        className="apple-solid-card"
        style={{
          background: 'var(--surface-solid)',
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

        <select 
          className="input-clean" 
          style={{ width: 'auto', fontWeight: 600 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="rating">Highest Rating ⭐</option>
          <option value="distance">Nearest to Me 📍</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="chip-row">
        <button className={`chip-pill ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>
          All Specialists ({vets.length})
        </button>
        <button className={`chip-pill ${selectedCategory === 'vet' ? 'active' : ''}`} onClick={() => setSelectedCategory('vet')}>
          Veterinarians 🩺
        </button>
        <button className={`chip-pill ${selectedCategory === 'grooming' ? 'active' : ''}`} onClick={() => setSelectedCategory('grooming')}>
          Grooming Spas ✂️
        </button>
        <button className={`chip-pill ${selectedCategory === 'boarding' ? 'active' : ''}`} onClick={() => setSelectedCategory('boarding')}>
          Boarding Resorts 🏨
        </button>
      </div>

      {/* ── SPECIALISTS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {filteredVets.map((v) => {
          const isFav = currentUser?.favoriteVetIds?.includes(v.id);
          const isVet = v.tag.toLowerCase().includes('vet');

          return (
            <div 
              key={v.id} 
              className="apple-solid-card" 
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'stretch', textAlign: 'left', padding: '22px' }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img 
                    src={v.photo || 'assets/images/Pet_1.jpg'} 
                    alt={v.name} 
                    style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }} 
                  />
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

              {/* Bio */}
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {v.bio}
              </p>

              {/* Meta Stats */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap', background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <Star size={13} color="#F59E0B" fill="#F59E0B" />
                  <span>{v.rating}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({v.reviews} reviews)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                  <MapPin size={13} />
                  <span>{v.distance}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                  <Clock size={13} />
                  <span>{v.experience} exp</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                <button 
                  className="apple-btn-blue" 
                  style={{ flex: 1.2, padding: '8px 12px', fontSize: '12.5px' }}
                  onClick={() => openModal('booking', { doctor: v.name, clinic: v.clinic })}
                >
                  <Calendar size={13} />
                  <span>Book In-Clinic</span>
                </button>

                {isVet && (
                  <button 
                    className="btn-ghost" 
                    style={{ flex: 1, padding: '8px 10px', fontSize: '12.5px' }}
                    onClick={() => openModal('teleconsult', { doctor: v.name })}
                  >
                    <Video size={13} color="#3B82F6" />
                    <span>Telehealth</span>
                  </button>
                )}

                <button 
                  className="icon-btn" 
                  style={{ width: 34, height: 34 }}
                  onClick={() => openModal('review', { doctor: v.name })}
                  title="Write Review"
                >
                  <Star size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
