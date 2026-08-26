import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Sparkles,
  ChevronRight
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
      <div className="apple-solid-card" style={{ padding: '24px', alignItems: 'stretch', textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span>Share with Pet Parents</span>
        </h3>

        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea 
            className="input-clean" 
            rows={3} 
            placeholder="Share a milestone, health update, or cute photo..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            style={{ resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-mini" style={{ margin: 0 }}>Tag Pet:</span>
              <select 
                className="input-clean" 
                style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                value={selectedPetTag}
                onChange={(e) => setSelectedPetTag(e.target.value)}
              >
                {pets.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.breed})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="apple-btn-blue" style={{ padding: '8px 20px', fontSize: '13px' }}>
              <Send size={14} />
              <span>Post Story</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── COMMUNITY STORIES FEED ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {posts.map((post) => (
          <div key={post.id} className="apple-solid-card" style={{ padding: '24px', alignItems: 'stretch', textAlign: 'left' }}>
            {/* Author Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src={post.authorPhoto || 'assets/images/tail_wagging_logo.png'} 
                  alt={post.author} 
                  style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div>
                  <strong style={{ fontSize: '15px', fontWeight: 600, display: 'block' }}>{post.author}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{post.petTag} • {post.time}</span>
                </div>
              </div>
              <span className="badge badge-green">Community</span>
            </div>

            {/* Content Text */}
            <p style={{ fontSize: '14.5px', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '14px' }}>
              {post.content}
            </p>

            {/* Post Photo */}
            {post.image && (
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '14px' }}>
                <img src={post.image} alt="Story visual" style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            {/* Likes & Comments Counters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button 
                className="btn-ghost" 
                style={{ padding: '6px 14px', fontSize: '12.5px', color: post.isLiked ? '#EF4444' : 'var(--text-muted)' }}
                onClick={() => toggleLike(post.id)}
              >
                <Heart size={14} fill={post.isLiked ? '#EF4444' : 'none'} />
                <span>{post.likes} Likes</span>
              </button>

              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={14} />
                <span>{post.comments?.length || 0} Comments</span>
              </span>
            </div>

            {/* Comments List */}
            {post.comments && post.comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
                {post.comments.map((c, i) => (
                  <div key={i} style={{ fontSize: '12.5px' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{c.author}: </strong>
                    <span style={{ color: 'var(--text-muted)' }}>{c.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Input */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="Write a comment..." 
                value={commentInputs[post.id] || ''}
                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
              <button 
                className="apple-btn-blue" 
                style={{ padding: '8px 14px', fontSize: '13px' }}
                onClick={() => handleCommentSubmit(post.id)}
              >
                Send
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
