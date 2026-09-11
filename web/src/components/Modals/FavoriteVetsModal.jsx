import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, Heart, Star, Calendar, Video, Stethoscope, MapPin, 
  ExternalLink, Sparkles, ChevronRight 
} from 'lucide-react';

export default function FavoriteVetsModal() {
  const { 
    closeModal, 
    openModal, 
    vets = [], 
    favoriteVetIds = [], 
    toggleFavoriteVet,
    setActiveTab 
  } = useApp();

  const favoriteVets = vets.filter(v => favoriteVetIds.includes(v.id));

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '620px', width: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                background: 'rgba(239,68,68,0.1)', 
                color: '#EF4444', 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Heart size={12} fill="#EF4444" />
                Specialist Bookmarks
              </span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Favorite Specialists
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Your saved trusted veterinary surgeons, dermatologists, and clinicians.
            </p>
          </div>
          <button className="icon-btn" onClick={closeModal} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Doctor List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {favoriteVets.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 20px', 
              background: 'var(--surface-alt)', 
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)'
            }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'rgba(239,68,68,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: '#EF4444'
              }}>
                <Heart size={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                No Favorite Specialists Yet
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto 18px' }}>
                Bookmark your favorite verified veterinarians to instantly book clinical consultations or start video teleconsults.
              </p>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ padding: '9px 18px', fontSize: '13px', margin: '0 auto' }}
                onClick={() => {
                  closeModal();
                  setActiveTab('specialists');
                }}
              >
                <Stethoscope size={15} />
                <span>Explore Certified Veterinarians</span>
              </button>
            </div>
          ) : (
            favoriteVets.map(vet => (
              <div 
                key={vet.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={vet.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop'} 
                      alt={vet.name} 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      background: '#10B981',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid #fff'
                    }} title="Verified Specialist" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vet.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleFavoriteVet(vet.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#EF4444',
                          padding: '4px'
                        }}
                        title="Remove from favorites"
                      >
                        <Heart size={18} fill="#EF4444" />
                      </button>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, marginBottom: '4px' }}>
                      {vet.specialty || vet.qualification || 'Senior Veterinary Surgeon'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F59E0B', fontWeight: 700 }}>
                        <Star size={13} fill="#F59E0B" />
                        <span>{vet.rating || '4.9'}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({vet.reviews || '120+'})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} />
                        <span>{vet.clinic || 'Banani Care Clinic'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px', fontSize: '12.5px' }}
                    onClick={() => {
                      closeModal();
                      openModal('booking', { doctor: vet });
                    }}
                  >
                    <Calendar size={13} />
                    <span>Book In-Clinic</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '12.5px' }}
                    onClick={() => {
                      closeModal();
                      openModal('teleconsult', { doctor: vet });
                    }}
                  >
                    <Video size={13} />
                    <span>Video Consult (৳500)</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {favoriteVets.length} saved specialist{favoriteVets.length === 1 ? '' : 's'}.
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '12px' }}
            onClick={() => {
              closeModal();
              setActiveTab('specialists');
            }}
          >
            <span>Browse All Vets</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

