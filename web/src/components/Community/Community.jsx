import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Sparkles 
} from 'lucide-react';

export default function Community() {
  const { posts, createPost, toggleLike, addComment, pets } = useApp();
  const { currentUser } = useAuth();

  const [postText, setPostText] = useState('');
  const [selectedPetTag, setSelectedPetTag] = useState(pets[0]?.name || 'Max');
  const [commentInputs, setCommentInputs] = useState({});

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    createPost({
      author: currentUser ? currentUser.name : 'Alex Johnson',
      petTag: `${selectedPetTag} (${pets.find(p => p.name === selectedPetTag)?.breed || 'Pet'})`,
      content: postText.trim(),
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80'
    });

    setPostText('');
  };

  const handleCommentSubmit = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    addComment(postId, text, currentUser ? currentUser.name : 'Alex Johnson');
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
      {/* ── CREATE POST BOX ── */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#10b981" />
          <span>Share with the Pet Maya Community</span>
        </h3>

        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea 
            className="input-clean" 
            rows={3} 
            placeholder="Share a cute moment, milestone, health update or question..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            style={{ resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-mini" style={{ margin: 0 }}>Pet:</span>
              <select 
                className="input-clean" 
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                value={selectedPetTag}
                onChange={(e) => setSelectedPetTag(e.target.value)}
              >
                {pets.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.species})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={!postText.trim()}>
              <Send size={15} />
              <span>Post Story</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── POSTS FEED ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {posts.map(post => (
          <div key={post.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Author */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={post.authorAvatar} 
                  alt={post.author} 
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div>
                  <strong style={{ fontSize: '15px' }}>{post.author}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{post.petTag}</span> • <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
              {post.content}
            </p>

            {/* Media */}
            {post.image && (
              <img 
                src={post.image} 
                alt="Post Media" 
                style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
              />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button 
                className="icon-btn" 
                style={{ width: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-full)', gap: '6px', color: post.likedByMe ? '#ef4444' : 'var(--text-main)' }}
                onClick={() => toggleLike(post.id)}
              >
                <Heart size={16} fill={post.likedByMe ? '#ef4444' : 'none'} />
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{post.likes}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <MessageCircle size={16} />
                <span>{post.comments.length} Comments</span>
              </div>
            </div>

            {/* Comments List */}
            {post.comments.length > 0 && (
              <div style={{ background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {post.comments.map((c, i) => (
                  <div key={i} style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--primary)' }}>{c.author}: </strong>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="Write a comment..." 
                value={commentInputs[post.id] || ''}
                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                style={{ padding: '8px 14px', fontSize: '13px' }}
              />
              <button className="btn-primary" style={{ padding: '8px 16px' }} onClick={() => handleCommentSubmit(post.id)}>
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
