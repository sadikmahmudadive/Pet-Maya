import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Sparkles,
  Share2,
  Bookmark,
  MoreHorizontal,
  ShieldCheck,
  Plus,
  Compass,
  Users,
  Flame,
  Tag,
  Stethoscope,
  Clock,
  X,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Camera,
  Activity,
  Globe,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

export default function Community() {
  const { posts, isPostsLoading, createPost, toggleLike, addComment, pets, vets, showToast, openModal } = useApp();
  const { currentUser } = useAuth();

  // State for Create Post Modal & Inputs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedPetTag, setSelectedPetTag] = useState(pets[0]?.name || 'My Pet');
  const [selectedCategory, setSelectedCategory] = useState('Moment');
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPhotoDropzone, setShowPhotoDropzone] = useState(false);
  const fileInputRef = useRef(null);

  // Feed Filter & Search
  const [feedFilter, setFeedFilter] = useState('all'); // 'all', 'moments', 'health', 'adoption', 'qa', 'saved'
  const [searchTopic, setSearchTopic] = useState('');

  // Interactive Comments & Bookmarks
  const [commentInputs, setCommentInputs] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [bookmarkedPosts, setBookmarkedPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_bookmarked_posts');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [followedParents, setFollowedParents] = useState({});
  const [heartAnimPostId, setHeartAnimPostId] = useState(null);

  // ── DYNAMIC SUGGESTED CLINICIANS & MEMBERS ──
  const dynamicSuggested = useMemo(() => {
    const list = [];
    vets.slice(0, 3).forEach(v => {
      list.push({
        id: v.id,
        name: v.name,
        subtitle: `${v.qualification} • ${v.clinic || 'Animal Hospital'}`,
        avatar: v.photo || 'assets/images/Pet_1.jpg',
        isVet: true
      });
    });

    const seenAuthors = new Set(vets.map(v => v.name));
    posts.forEach(p => {
      if (p.author && !seenAuthors.has(p.author) && p.author !== (currentUser?.name)) {
        seenAuthors.add(p.author);
        list.push({
          id: `author_${p.author}`,
          name: p.author,
          subtitle: p.petTag || 'Pet Parent',
          avatar: p.authorPhoto || 'assets/images/tail_wagging_logo.png',
          isVet: false
        });
      }
    });

    return list.slice(0, 4);
  }, [vets, posts, currentUser]);

  // ── DYNAMIC TRENDING TOPICS ──
  const dynamicTopics = useMemo(() => {
    const tagCounts = {};
    posts.forEach(p => {
      const words = (p.content || '').split(/\s+/);
      words.forEach(w => {
        if (w.startsWith('#') && w.length > 2) {
          tagCounts[w] = (tagCounts[w] || 0) + 1;
        }
      });
      if (p.category) {
        const catTag = `#${p.category.replace(/\s+/g, '')}`;
        tagCounts[catTag] = (tagCounts[catTag] || 0) + 1;
      }
    });

    const topicList = Object.keys(tagCounts).map(tag => ({
      tag,
      count: `${tagCounts[tag]} ${tagCounts[tag] === 1 ? 'post' : 'posts'}`
    }));

    if (topicList.length < 3) {
      return [
        { tag: '#PetCareMoments', count: `${Math.max(1, posts.length)} stories` },
        { tag: '#HealthyPets', count: 'Live veterinary updates' },
        { tag: '#PetMayaCommunity', count: 'Active network' }
      ];
    }

    return topicList.slice(0, 5);
  }, [posts]);

  // ── Image Upload Handling ──
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPostImagePreview(event.target.result);
      setIsUploadingImage(false);
      setShowPhotoDropzone(true);
      showToast('Photo attached! Ready to share.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // ── Post Submission ──
  const handlePostSubmit = (e) => {
    if (e) e.preventDefault();
    if (!postText.trim() && !postImagePreview) {
      showToast('Please enter a message or attach a photo', 'error');
      return;
    }

    const currentPet = pets.find(p => p.name === selectedPetTag) || pets[0];
    const petTagText = `${selectedPetTag} • ${currentPet?.breed || 'Pet'}`;

    createPost({
      author: currentUser ? currentUser.name : 'Alex Johnson',
      petTag: petTagText,
      content: postText.trim(),
      category: selectedCategory,
      image: postImagePreview || ''
    });

    setPostText('');
    setPostImagePreview(null);
    setShowPhotoDropzone(false);
    setIsCreateModalOpen(false);
  };

  // ── Comment Submission ──
  const handleCommentSubmit = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    addComment(postId, text, currentUser ? currentUser.name : 'Alex Johnson');
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // ── Double Tap Heart Trigger (Instagram Style) ──
  const handleDoubleTap = (postId) => {
    toggleLike(postId);
    setHeartAnimPostId(postId);
    setTimeout(() => {
      setHeartAnimPostId(null);
    }, 850);
  };

  // ── Bookmark Toggle ──
  const handleToggleBookmark = (postId) => {
    setBookmarkedPosts(prev => {
      const next = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem('pm_bookmarked_posts', JSON.stringify(next));
      } catch (_) {}
      showToast(next.includes(postId) ? 'Saved to your Bookmarks!' : 'Removed from bookmarks', 'info');
      return next;
    });
  };

  // ── Follow Toggle ──
  const handleToggleFollow = (id, name) => {
    setFollowedParents(prev => {
      const isFollowing = !prev[id];
      showToast(isFollowing ? `Following ${name}` : `Unfollowed ${name}`, 'info');
      return { ...prev, [id]: isFollowing };
    });
  };

  // ── Share Post ──
  const handleSharePost = (postId) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/community#${postId}`);
      showToast('Story link copied to clipboard!', 'success');
    } else {
      showToast('Link ready to share!', 'success');
    }
  };

  // Filtered Posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTopic || 
      (post.content || '').toLowerCase().includes(searchTopic.toLowerCase()) ||
      (post.author || '').toLowerCase().includes(searchTopic.toLowerCase()) ||
      (post.petTag || '').toLowerCase().includes(searchTopic.toLowerCase());

    const cat = (post.category || '').toLowerCase();
    const content = (post.content || '').toLowerCase();

    if (feedFilter === 'moments') return matchesSearch && (cat.includes('moment') || !cat);
    if (feedFilter === 'health') return matchesSearch && (cat.includes('health') || content.includes('vet') || content.includes('vaccine'));
    if (feedFilter === 'adoption') return matchesSearch && (cat.includes('adopt') || content.includes('rescue') || content.includes('foster'));
    if (feedFilter === 'qa') return matchesSearch && (cat.includes('question') || content.includes('?'));
    if (feedFilter === 'saved') return matchesSearch && bookmarkedPosts.includes(post.id);

    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ── HEADER ── */}
      <AppleReveal duration={0.6} yOffset={15}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="apple-card-eyebrow" style={{ color: 'var(--primary)' }}>Pet Parent Network</span>
            <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em' }}>Community Moments</h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Share milestones, adorable pet moments, health updates &amp; questions.</p>
          </div>
        </div>
      </AppleReveal>

      {/* ── THREE-COLUMN COMMUNITY LAYOUT ── */}
      <div className="community-layout">

        {/* ── LEFT SIDEBAR (Shortcuts & Pet Profile) ── */}
        <aside className="community-left-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* User Mini Profile Card */}
          <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <img 
                src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                alt="Profile" 
                style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '15px', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser ? currentUser.name : 'Pet Parent'}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                  {pets.length} Registered {pets.length === 1 ? 'Pet' : 'Pets'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Paw Points</span>
                <strong style={{ color: '#F59E0B', fontSize: '13px' }}>480 pts</strong>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Community Rank</span>
                <strong style={{ color: 'var(--primary)', fontSize: '13px' }}>Guardian</strong>
              </div>
            </div>
          </div>

          {/* Quick Filter Shortcuts */}
          <div className="apple-solid-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <button 
              className={`apple-nav-item ${feedFilter === 'all' ? 'active' : ''}`}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: feedFilter === 'all' ? 'var(--surface-alt)' : 'transparent', fontWeight: 600 }}
              onClick={() => { setFeedFilter('all'); setSearchTopic(''); }}
            >
              <Compass size={16} color="var(--primary)" />
              <span>All Stories</span>
            </button>

            <button 
              className={`apple-nav-item ${feedFilter === 'moments' ? 'active' : ''}`}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: feedFilter === 'moments' ? 'var(--surface-alt)' : 'transparent', fontWeight: 600 }}
              onClick={() => { setFeedFilter('moments'); setSearchTopic(''); }}
            >
              <Camera size={16} color="#EC4899" />
              <span>Photo Moments</span>
            </button>

            <button 
              className={`apple-nav-item ${feedFilter === 'health' ? 'active' : ''}`}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: feedFilter === 'health' ? 'var(--surface-alt)' : 'transparent', fontWeight: 600 }}
              onClick={() => { setFeedFilter('health'); setSearchTopic(''); }}
            >
              <Stethoscope size={16} color="#10B981" />
              <span>Health &amp; Recovery</span>
            </button>

            <button 
              className={`apple-nav-item ${feedFilter === 'adoption' ? 'active' : ''}`}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: feedFilter === 'adoption' ? 'var(--surface-alt)' : 'transparent', fontWeight: 600 }}
              onClick={() => { setFeedFilter('adoption'); setSearchTopic(''); }}
            >
              <Heart size={16} color="#EF4444" />
              <span>Rescue &amp; Adoption</span>
            </button>

            <button 
              className={`apple-nav-item ${feedFilter === 'saved' ? 'active' : ''}`}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: feedFilter === 'saved' ? 'var(--surface-alt)' : 'transparent', fontWeight: 600 }}
              onClick={() => { setFeedFilter('saved'); setSearchTopic(''); }}
            >
              <Bookmark size={16} color="#F59E0B" />
              <span>Saved Bookmarks ({bookmarkedPosts.length})</span>
            </button>
          </div>

          {/* 24/7 Hotline Mini Alert */}
          <div 
            className="apple-solid-card" 
            style={{ 
              padding: '16px', 
              textAlign: 'left', 
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
              border: '1px solid rgba(239,68,68,0.2)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#EF4444' }}>
              <Activity size={16} />
              <strong style={{ fontSize: '13px' }}>24/7 Emergency Help</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
              Immediate on-call veterinary support for urgent pet symptoms.
            </p>
            <button 
              className="apple-btn-blue" 
              style={{ width: '100%', padding: '6px 12px', fontSize: '12px', background: '#EF4444' }}
              onClick={() => openModal('teleconsult')}
            >
              Emergency Vet Line
            </button>
          </div>
        </aside>

        {/* ── CENTER COLUMN (Create Post & Posts Feed) ── */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* ── AUTHENTIC FACEBOOK-STYLE CREATE POST BOX ── */}
          <AppleReveal duration={0.6} yOffset={20}>
            <div className="apple-solid-card" style={{ padding: '16px 18px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Top Row: Avatar + Clickable Pill Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                  alt="User" 
                  style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                />
                <div 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="fb-input-pill"
                  style={{
                    flex: 1,
                    background: 'var(--surface-alt)',
                    borderRadius: '24px',
                    padding: '11px 18px',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    border: '1px solid var(--border)'
                  }}
                >
                  {`What's on your pet's mind, ${currentUser ? currentUser.name.split(' ')[0] : 'Pet Parent'}?`}
                </div>
              </div>

              {/* Divider Line */}
              <div style={{ height: '1px', background: 'var(--border)', width: '100%' }} />

              {/* Bottom Action Row: 3 Classic Facebook Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '6px' }}>
                
                {/* Photo / Video Button */}
                <button 
                  type="button" 
                  className="fb-action-btn"
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setShowPhotoDropzone(true);
                    setTimeout(() => fileInputRef.current?.click(), 150);
                  }}
                >
                  <ImageIcon size={20} color="#10B981" />
                  <span>Photo/video</span>
                </button>

                {/* Tag Pet Button */}
                <button 
                  type="button" 
                  className="fb-action-btn"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Tag size={20} color="#3B82F6" />
                  <span>Tag Pet</span>
                </button>

                {/* Category Button */}
                <button 
                  type="button" 
                  className="fb-action-btn"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Sparkles size={20} color="#F59E0B" />
                  <span>Category</span>
                </button>
              </div>
            </div>
          </AppleReveal>

          {/* ── FEED FILTER TABS ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              <button className={`chip-pill ${feedFilter === 'all' ? 'active' : ''}`} onClick={() => setFeedFilter('all')}>
                Trending
              </button>
              <button className={`chip-pill ${feedFilter === 'moments' ? 'active' : ''}`} onClick={() => setFeedFilter('moments')}>
                Moments
              </button>
              <button className={`chip-pill ${feedFilter === 'health' ? 'active' : ''}`} onClick={() => setFeedFilter('health')}>
                Health
              </button>
              <button className={`chip-pill ${feedFilter === 'adoption' ? 'active' : ''}`} onClick={() => setFeedFilter('adoption')}>
                Rescue
              </button>
              <button className={`chip-pill ${feedFilter === 'qa' ? 'active' : ''}`} onClick={() => setFeedFilter('qa')}>
                Q&amp;A
              </button>
            </div>

            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {/* ── POSTS FEED ── */}
          <AppleStagger className="apple-grid-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Shimmer Skeleton Loading while fetching real Firestore posts */}
            {isPostsLoading && posts.length === 0 ? (
              [1, 2].map((n) => (
                <div key={n} className="apple-solid-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', opacity: 0.6 }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface-alt)' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ width: '40%', height: 16, background: 'var(--surface-alt)', borderRadius: 4 }} />
                      <div style={{ width: '25%', height: 12, background: 'var(--surface-alt)', borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ width: '90%', height: 16, background: 'var(--surface-alt)', borderRadius: 4 }} />
                  <div style={{ width: '100%', height: 260, background: 'var(--surface-alt)', borderRadius: 8 }} />
                </div>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="apple-solid-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Sparkles size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No community stories here yet</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  Be the first to share a moment, milestone, or cute photo with pet parents!
                </p>
                <button 
                  className="apple-btn-blue" 
                  style={{ margin: '0 auto' }}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Camera size={14} />
                  <span>Share First Story</span>
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isBookmarked = bookmarkedPosts.includes(post.id);
                const isCommentSectionOpen = activeCommentPostId === post.id;
                const likesCount = post.likes ?? (post.likedBy?.length || 0);

                return (
                  <article 
                    key={post.id} 
                    className="apple-solid-card" 
                    style={{ 
                      padding: 0, 
                      overflow: 'hidden', 
                      textAlign: 'left', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--border)'
                    }}
                  >
                    
                    {/* ── Facebook Post Header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Avatar */}
                        <img 
                          src={post.authorPhoto || 'assets/images/tail_wagging_logo.png'} 
                          alt={post.author} 
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '1px solid var(--border)' }} 
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                              {post.author}
                            </strong>
                            {post.category && (
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>
                                shared a {post.category.toLowerCase()}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>{post.time || 'Recent'}</span>
                            <span>·</span>
                            <Globe size={12} />
                            {post.petTag && (
                              <>
                                <span>·</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{post.petTag}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Top Right Options: More & Bookmark */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button 
                          className="icon-btn" 
                          style={{ width: 32, height: 32, border: 'none', background: 'transparent' }}
                          onClick={() => handleToggleBookmark(post.id)}
                          title={isBookmarked ? "Saved" : "Save post"}
                        >
                          <Bookmark size={18} fill={isBookmarked ? '#F59E0B' : 'none'} color={isBookmarked ? '#F59E0B' : 'var(--text-muted)'} />
                        </button>

                        <button 
                          className="icon-btn" 
                          style={{ width: 32, height: 32, border: 'none', background: 'transparent' }}
                          onClick={() => handleSharePost(post.id)}
                          title="More options"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </div>

                    {/* ── Post Text Content ── */}
                    {post.content && (
                      <p style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.5, padding: '2px 16px 12px', margin: 0, whiteSpace: 'pre-line' }}>
                        {post.content}
                      </p>
                    )}

                    {/* ── Attached Visual Image with Double-Tap Heart ── */}
                    {post.image && (
                      <div 
                        style={{ position: 'relative', background: '#000', cursor: 'pointer', overflow: 'hidden' }}
                        onDoubleClick={() => handleDoubleTap(post.id)}
                      >
                        <img 
                          src={post.image} 
                          alt="Post visual" 
                          style={{ width: '100%', maxHeight: 540, objectFit: 'contain', display: 'block', background: '#080808' }} 
                        />

                        {/* Floating Heart on Double Tap */}
                        {heartAnimPostId === post.id && (
                          <Heart 
                            size={90} 
                            color="#fff" 
                            fill="#EF4444" 
                            className="instagram-heart-pop" 
                          />
                        )}
                      </div>
                    )}

                    {/* ── Embedded Shared Post if present ── */}
                    {(post.sharedPostContent || post.sharedPostImageUrl) && (
                      <div style={{ margin: '0 16px 12px', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt)' }}>
                        {post.sharedPostAuthor && (
                          <strong style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--primary)' }}>
                            Shared from {post.sharedPostAuthor}
                          </strong>
                        )}
                        {post.sharedPostContent && (
                          <p style={{ fontSize: '13.5px', margin: '0 0 8px', color: 'var(--text-main)' }}>
                            {post.sharedPostContent}
                          </p>
                        )}
                        {post.sharedPostImageUrl && (
                          <img 
                            src={post.sharedPostImageUrl} 
                            alt="Shared content" 
                            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} 
                          />
                        )}
                      </div>
                    )}

                    {/* ── Facebook Reaction & Comment Stats Row ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {/* Left: Like/Reaction Count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {likesCount > 0 ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#1877F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                                <ThumbsUp size={10} fill="#fff" />
                              </span>
                              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', marginLeft: '-4px' }}>
                                <Heart size={10} fill="#fff" />
                              </span>
                            </div>
                            <span>{likesCount}</span>
                          </>
                        ) : (
                          <span>Be the first to react</span>
                        )}
                      </div>

                      {/* Right: Comments Count */}
                      <div 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveCommentPostId(isCommentSectionOpen ? null : post.id)}
                      >
                        <span>{post.comments?.length || 0} comments</span>
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '0 16px' }} />

                    {/* ── Facebook 3-Button Action Row ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '3px 8px' }}>
                      {/* Like Button */}
                      <button 
                        className={`fb-action-btn ${post.isLiked ? 'liked' : ''}`}
                        onClick={() => toggleLike(post.id)}
                        style={{ color: post.isLiked ? '#1877F2' : 'var(--text-muted)' }}
                      >
                        <ThumbsUp size={18} fill={post.isLiked ? '#1877F2' : 'none'} />
                        <span>Like</span>
                      </button>

                      {/* Comment Button */}
                      <button 
                        className="fb-action-btn"
                        onClick={() => setActiveCommentPostId(isCommentSectionOpen ? null : post.id)}
                      >
                        <MessageSquare size={18} />
                        <span>Comment</span>
                      </button>

                      {/* Share Button */}
                      <button 
                        className="fb-action-btn"
                        onClick={() => handleSharePost(post.id)}
                      >
                        <Share2 size={18} />
                        <span>Share</span>
                      </button>
                    </div>

                    {/* ── Facebook Comments Drawer ── */}
                    {isCommentSectionOpen && (
                      <div style={{ background: 'var(--surface-alt)', padding: '12px 16px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* Write a comment input bar with current user avatar */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img 
                            src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                            alt="Current User" 
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                          />
                          <div style={{ display: 'flex', flex: 1, gap: '8px', alignItems: 'center', background: 'var(--surface)', borderRadius: '20px', padding: '4px 6px 4px 14px', border: '1px solid var(--border)' }}>
                            <input 
                              type="text" 
                              placeholder="Write a comment..." 
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '13px' }}
                            />
                            <button 
                              type="button"
                              className="icon-btn"
                              style={{ width: 28, height: 28, color: (commentInputs[post.id]?.trim()) ? 'var(--primary)' : 'var(--text-muted)' }}
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Existing Comments List */}
                        {post.comments && post.comments.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 240, overflowY: 'auto', paddingTop: '4px' }}>
                            {post.comments.map((c, i) => (
                              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                                  {c.author ? c.author[0].toUpperCase() : 'P'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '85%' }}>
                                  <div style={{ background: 'var(--surface)', padding: '8px 14px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <strong style={{ color: 'var(--text-main)', fontSize: '13px', display: 'block', marginBottom: '2px' }}>
                                      {c.author}
                                    </strong>
                                    <span style={{ color: 'var(--text-main)', lineHeight: 1.4, wordBreak: 'break-word' }}>{c.text}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: 'var(--text-muted)', paddingLeft: '8px' }}>
                                    <span style={{ fontWeight: 600, cursor: 'pointer' }}>Like</span>
                                    <span style={{ fontWeight: 600, cursor: 'pointer' }}>Reply</span>
                                    <span>Just now</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </AppleStagger>
        </main>

        {/* ── RIGHT SIDEBAR (Dynamic Topics & Verified Community Clinicians) ── */}
        <aside className="community-right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Dynamic Trending Topics */}
          <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--primary)" />
              <span>Trending Pet Topics</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dynamicTopics.map((topic, i) => (
                <div 
                  key={i} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 0' }}
                  onClick={() => setSearchTopic(topic.tag.replace('#', ''))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Flame size={15} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', fontWeight: 600, display: 'block', color: 'var(--text-main)' }}>{topic.tag}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{topic.count}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Suggested Specialists & Pet Parents */}
          {dynamicSuggested.length > 0 && (
            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="#EC4899" />
                <span>Specialists &amp; Members</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {dynamicSuggested.map((parent) => {
                  const isFollowing = followedParents[parent.id];

                  return (
                    <div key={parent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <img 
                          src={parent.avatar} 
                          alt={parent.name} 
                          style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <strong style={{ fontSize: '13px', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {parent.name}
                            </strong>
                            {parent.isVet && <ShieldCheck size={13} color="#10B981" />}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{parent.subtitle}</span>
                        </div>
                      </div>

                      <button 
                        className={isFollowing ? "btn-ghost" : "apple-btn-blue"}
                        style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: '16px', flexShrink: 0 }}
                        onClick={() => handleToggleFollow(parent.id, parent.name)}
                      >
                        {isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community Guidelines */}
          <div className="apple-solid-card" style={{ padding: '16px 20px', textAlign: 'left', background: 'var(--surface-alt)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Verified Safe Community
            </span>
            All pet health milestones are moderated with certified veterinary oversight.
          </div>
        </aside>

      </div>

      {/* ── AUTHENTIC FACEBOOK CREATE POST MODAL ── */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '540px', width: '100%', padding: '0', overflow: 'hidden', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, textAlign: 'center' }}>Create post</h3>
              <button 
                className="icon-btn" 
                style={{ position: 'absolute', right: 14, top: 14, width: 34, height: 34 }} 
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '78vh', overflowY: 'auto' }}>
              
              {/* Author & Selectors Info Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                  alt="User" 
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ fontSize: '15px', fontWeight: 700 }}>
                    {currentUser ? currentUser.name : 'Pet Parent'}
                  </strong>

                  {/* Badges Selector Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Public Badge */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      <Globe size={11} />
                      <span>Public</span>
                    </span>

                    {/* Pet Tag Selector */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600 }}>
                      <Tag size={11} color="var(--primary)" />
                      <select 
                        value={selectedPetTag} 
                        onChange={(e) => setSelectedPetTag(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '11.5px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                      >
                        {pets.map(p => (
                          <option key={p.id} value={p.name} style={{ background: 'var(--surface)', color: 'var(--text-main)' }}>
                            {p.name} ({p.breed || 'Pet'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category Selector */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600 }}>
                      <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '11.5px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="Moment" style={{ background: 'var(--surface)' }}>Moment</option>
                        <option value="Health" style={{ background: 'var(--surface)' }}>Health Milestone</option>
                        <option value="Adoption" style={{ background: 'var(--surface)' }}>Rescue Story</option>
                        <option value="Question" style={{ background: 'var(--surface)' }}>Advice Needed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Large Content Textarea */}
              <textarea 
                className="input-clean" 
                rows={postImagePreview ? 3 : 5}
                placeholder={`What's on your pet's mind, ${currentUser ? currentUser.name.split(' ')[0] : 'Pet Parent'}?`}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                style={{ 
                  resize: 'none', 
                  fontSize: postText.length > 70 ? '15px' : '18px', 
                  lineHeight: 1.45,
                  padding: '10px 0', 
                  border: 'none', 
                  background: 'transparent' 
                }}
                autoFocus
              />

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageSelect} 
              />

              {/* Attached Image Preview */}
              {postImagePreview ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                  <img src={postImagePreview} alt="Attached Preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
                  <button 
                    className="icon-btn" 
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none' }}
                    onClick={() => { setPostImagePreview(null); setShowPhotoDropzone(false); }}
                    title="Remove Photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : showPhotoDropzone ? (
                <div 
                  style={{ 
                    border: '2px dashed var(--border)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '28px 16px', 
                    textAlign: 'center', 
                    background: 'var(--surface-alt)',
                    cursor: 'pointer'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#10B981' }}>
                    <ImageIcon size={22} />
                  </div>
                  <strong style={{ fontSize: '14px', display: 'block' }}>Add photos/videos</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or click to browse files</span>
                </div>
              ) : null}

              {/* Facebook-style "Add to your post" Toolbar */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border)', 
                background: 'var(--surface-alt)' 
              }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Add to your post</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    type="button" 
                    className="icon-btn"
                    style={{ color: '#10B981', width: 34, height: 34 }}
                    onClick={() => { setShowPhotoDropzone(true); fileInputRef.current?.click(); }}
                    title="Add Photo"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <button 
                    type="button" 
                    className="icon-btn"
                    style={{ color: '#3B82F6', width: 34, height: 34 }}
                    title="Tag Pet"
                  >
                    <Tag size={18} />
                  </button>

                  <button 
                    type="button" 
                    className="icon-btn"
                    style={{ color: '#F59E0B', width: 34, height: 34 }}
                    title="Category"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
              </div>

              {/* Full Width Post Button */}
              <button 
                type="button" 
                className="apple-btn-blue" 
                style={{ 
                  width: '100%', 
                  padding: '11px', 
                  fontSize: '14.5px', 
                  fontWeight: 700, 
                  borderRadius: 'var(--radius-sm)', 
                  opacity: (postText.trim() || postImagePreview) ? 1 : 0.45,
                  cursor: (postText.trim() || postImagePreview) ? 'pointer' : 'not-allowed'
                }}
                onClick={handlePostSubmit}
                disabled={(!postText.trim() && !postImagePreview) || isUploadingImage}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
