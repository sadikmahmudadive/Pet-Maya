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
  Flame
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER & SEARCH ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>Veterinarians &amp; Care Specialists</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Discover verified clinicians, specialist veterinarians, grooming spas &amp; boarding resorts.</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('booking')}>
          <Calendar size={16} />
          <span>Book In-Clinic Slot</span>
        </button>
      </div>

      {/* ── 24/7 EMERGENCY BANNER ── */}
      <div 
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(16,185,129,0.10) 100%)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <Flame size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '16px' }}>24/7 Emergency Clinical Triage</strong>
              <span className="badge badge-green" style={{ fontSize: '10px' }}>Live On-Call</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Immediate video tele-health connection with verified on-duty emergency veterinarians.</p>
          </div>
        </div>
        <button 
          className="btn-primary" 
          style={{ background: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
          onClick={() => openModal('booking', { doctor: 'Dr. Sarah Jenkins', mode: 'HD Tele-Consultation' })}
        >
          <Video size={16} />
          <span>Instant Video Triage</span>
        </button>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            type="text" 
            className="input-clean" 
            placeholder="Search by clinician name, qualification, or clinic..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '42px' }}
          />
        </div>

        <select 
          className="input-clean" 
          style={{ width: 'auto', fontWeight: 700 }}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredVets.map((v) => {
          const isFav = currentUser?.favoriteVetIds?.includes(v.id);
          const isVet = v.tag.toLowerCase().includes('vet');

          return (
            <div key={v.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img 
                    src={v.photo || 'assets/images/Pet_1.jpg'} 
                    alt={v.name} 
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '16.5px' }}>{v.name}</strong>
                      {v.isVerified && <ShieldCheck size={16} color="#10b981" />}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, display: 'block' }}>
                      {v.qualification}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{v.clinic}</span>
                  </div>
                </div>

                <button 
                  className="icon-btn" 
                  style={{ width: 34, height: 34, color: isFav ? '#ef4444' : 'var(--text-muted)' }}
                  onClick={() => toggleFavoriteVet(v.id)}
                  title="Save to Favorites"
                >
                  <Heart size={16} fill={isFav ? '#ef4444' : 'none'} />
                </button>
              </div>

              {/* Bio snippet */}
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {v.bio}
              </p>

              {/* Badges & Meta */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                  <Star size={15} color="#f59e0b" fill="#f59e0b" />
                  <span>{v.rating}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({v.reviewsCount})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                  <MapPin size={15} />
                  <span>{v.distance}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                  <Clock size={15} />
                  <span>{v.availability}</span>
                </div>
              </div>

              {/* Pricing Tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Consultation Fee</span>
                  <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>{v.price}</strong>
                </div>
                <span className={`badge ${isVet ? 'badge-blue' : 'badge-purple'}`}>{v.tag}</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: 'auto' }}>
                <button 
                  className="btn-primary" 
                  style={{ fontSize: '12px', padding: '8px 4px' }}
                  onClick={() => openModal('booking', { doctor: v.name, mode: 'In-Clinic Consultation' })}
                >
                  <Calendar size={13} />
                  <span>Book</span>
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ fontSize: '12px', padding: '8px 4px' }}
                  onClick={() => openModal('teleconsult', { doctor: v.name, petName: 'Max' })}
                >
                  <Video size={13} />
                  <span>Video</span>
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ fontSize: '12px', padding: '8px 4px' }}
                  onClick={() => openModal('review', { targetId: v.id, targetName: v.name })}
                >
                  <MessageSquarePlus size={13} />
                  <span>Review</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
