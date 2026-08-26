import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { X, Star, Send } from 'lucide-react';

export default function ReviewModal() {
  const { closeModal, modalData, addVetReview } = useApp();
  const { currentUser } = useAuth();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const targetName = modalData?.targetName || 'Specialist';
  const targetId = modalData?.targetId;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim() || !targetId) return;

    addVetReview(targetId, Number(rating), comment.trim(), currentUser ? currentUser.name : 'Alex Johnson');
    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Rate &amp; Review Specialist</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Share your experience with <strong style={{ color: 'var(--primary)' }}>{targetName}</strong>.</p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label-mini">Rating (Stars)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star}
                  type="button" 
                  className="icon-btn"
                  style={{ background: star <= rating ? '#FEF3C7' : 'var(--surface-alt)', color: star <= rating ? '#f59e0b' : 'var(--text-muted)' }}
                  onClick={() => setRating(star)}
                >
                  <Star size={20} fill={star <= rating ? '#f59e0b' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-mini">Your Review Feedback</label>
            <textarea 
              className="input-clean" 
              rows={3} 
              placeholder="Dr. Jenkins provided gentle care for my Golden Retriever..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '15px' }} disabled={!comment.trim()}>
            <Send size={16} />
            <span>Submit Review</span>
          </button>
        </form>
      </div>
    </div>
  );
}
