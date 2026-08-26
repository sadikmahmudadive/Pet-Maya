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
  Smile,
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
  Award
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

const MOOD_ACTIVITIES = [
  '🐾 Playful & Energetic',
  '🩺 Health Check Complete',
  '🎾 Park Day & Agility',
  '💤 Cozy Nap Time',
  '🎓 Training Milestone',
  '🍗 Gourmet Treat Time'
];

export default function Community() {
  const { posts, isPostsLoading, createPost, toggleLike, addComment, pets, vets, showToast, openModal } = useApp();
  const { currentUser } = useAuth();

  // State for Create Post
  const [postText, setPostText] = useState('');
  const [selectedPetTag, setSelectedPetTag] = useState(pets[0]?.name || 'My Pet');
  const [selectedCategory, setSelectedCategory] = useState('Moment');
  const [selectedMood, setSelectedMood] = useState(MOOD_ACTIVITIES[0]);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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

  // User Custom Added Stories
  const [userCustomStories, setUserCustomStories] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_user_stories');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });

  // Story Viewer Modal
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);

  // ── DYNAMIC STORIES REEL (Derived directly from live posts, registered pets, and vets) ──
  const dynamicStories = useMemo(() => {
    const stories = [];

    // 1. User custom uploaded stories
    userCustomStories.forEach(s => stories.push(s));

    // 2. Stories from actual fetched posts with images
    posts.filter(p => p.image).slice(0, 6).forEach((p, idx) => {
      stories.push({
        id: `story_post_${p.id || idx}`,
        author: p.author ? p.author.split(' ')[0] : 'Pet Parent',
        owner: p.author || 'Pet Parent',
        avatar: p.authorPhoto || 'assets/images/tail_wagging_logo.png',
        storyMedia: p.image,
        tag: p.petTag || p.category || 'Community Moment',
        caption: p.content || 'Sharing a lovely pet moment!',
        time: p.time || 'Recent',
        hasUnseen: true
      });
    });

    // 3. Stories from verified specialists
    vets.slice(0, 2).forEach(v => {
      stories.push({
        id: `story_vet_${v.id}`,
        author: v.name.split(' ')[0],
        owner: v.name,
        avatar: v.photo || 'assets/images/Pet_1.jpg',
        storyMedia: v.photo || 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&auto=format&fit=crop&q=80',
        tag: `${v.qualification} Tip`,
        caption: `💡 Clinical Tip: Keep hydration optimal and schedule routine checks with ${v.clinic || 'your clinic'}!`,
        time: 'Verified Vet',
        isVet: true,
        hasUnseen: true
      });
    });

    // 4. Fallback to registered pets if list is small
    if (stories.length === 0) {
      pets.forEach(pet => {
        stories.push({
          id: `story_pet_${pet.id}`,
          author: pet.name,
          owner: currentUser ? currentUser.name : 'Pet Parent',
          avatar: pet.photoUrl || 'assets/images/Pet_1.jpg',
          storyMedia: pet.photoUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80',
          tag: pet.breed || 'Pet',
          caption: `${pet.name} is happy and healthy today! 🐾`,
          time: 'Pet Profile',
          hasUnseen: false
        });
      });
    }

    return stories;
  }, [userCustomStories, posts, vets, pets, currentUser]);

  // ── DYNAMIC SUGGESTED CLINICIANS & PARENTS ──
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

    // Also include unique post authors
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
      showToast('📸 Photo attached! Ready to share.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // ── Post Submission ──
  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim() && !postImagePreview) {
      showToast('⚠️ Please enter a message or attach a photo', 'error');
      return;
    }

    const currentPet = pets.find(p => p.name === selectedPetTag) || pets[0];
    const petTagText = `${selectedPetTag} • ${currentPet?.breed || 'Pet'}`;

    createPost({
      author: currentUser ? currentUser.name : 'Alex Johnson',
      petTag: petTagText,
      content: postText.trim(),
      category: selectedCategory,
      mood: selectedMood,
      image: postImagePreview || ''
    });

    setPostText('');
    setPostImagePreview(null);
  };

  // ── Add User Story ──
  const handleAddStory = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newStory = {
        id: `story_user_${Date.now()}`,
        author: currentUser ? currentUser.name.split(' ')[0] : 'My Pet',
        owner: currentUser ? currentUser.name : 'You',
        avatar: currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png',
        storyMedia: event.target.result,
        tag: selectedPetTag || '24h Story',
        caption: `New moment from ${currentUser ? currentUser.name : 'Pet Parent'}! ✨`,
        time: 'Just now',
        hasUnseen: true
      };

      const updated = [newStory, ...userCustomStories];
      setUserCustomStories(updated);
      try {
        localStorage.setItem('pm_user_stories', JSON.stringify(updated));
      } catch (_) {}
      showToast('✨ Story published to community reel!', 'success');
    };
    reader.readAsDataURL(file);
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
      showToast(next.includes(postId) ? '🔖 Saved to your Bookmarks!' : 'Removed from bookmarks', 'info');
      return next;
    });
  };

  // ── Follow Toggle ──
  const handleToggleFollow = (id, name) => {
    setFollowedParents(prev => {
      const isFollowing = !prev[id];
      showToast(isFollowing ? `✨ Following ${name}` : `Unfollowed ${name}`, 'info');
      return { ...prev, [id]: isFollowing };
    });
  };

  // ── Share Post ──
  const handleSharePost = (postId) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/community#${postId}`);
      showToast('🔗 Story link copied to clipboard!', 'success');
    } else {
      showToast('🔗 Link ready to share!', 'success');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* ── 1. INSTAGRAM / FACEBOOK STORIES REEL ── */}
      <AppleReveal duration={0.6} yOffset={15}>
        <div 
          className="apple-solid-card" 
          style={{ 
            padding: '16px 20px', 
            overflowX: 'auto', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '18px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Create Your Story */}
          <div 
            className="story-avatar-container"
            onClick={() => {
              const fileInput = document.getElementById('pm-story-uploader');
              if (fileInput) fileInput.click();
            }}
          >
            <input 
              id="pm-story-uploader"
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleAddStory} 
            />
            <div style={{ position: 'relative', width: 62, height: 62 }}>
              <img 
                src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                alt="Your Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} 
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: -2, 
                  right: -2, 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  width: 22, 
                  height: 22, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid var(--bg)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-main)', maxWidth: 66, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Your Story
            </span>
          </div>

          {/* Dynamic Community Stories */}
          {dynamicStories.map((story, idx) => (
            <div 
              key={story.id} 
              className="story-avatar-container"
              onClick={() => setActiveStoryIndex(idx)}
            >
              <div className={story.isVet ? "story-ring-verified" : (story.hasUnseen ? "story-ring-active" : "story-ring-seen")}>
                <img 
                  src={story.avatar} 
                  alt={story.author} 
                  className="story-avatar-inner"
                  style={{ width: 56, height: 56, objectFit: 'cover' }} 
                />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-main)', maxWidth: 66, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {story.author}
              </span>
            </div>
          ))}
        </div>
      </AppleReveal>

      {/* ── 2. THREE-COLUMN COMMUNITY LAYOUT ── */}
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
                  🐾 {pets.length} Registered {pets.length === 1 ? 'Pet' : 'Pets'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Paw Points</span>
                <strong style={{ color: '#F59E0B', fontSize: '13px' }}>✨ 480 pts</strong>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Community Rank</span>
                <strong style={{ color: 'var(--primary)', fontSize: '13px' }}>🏅 Guardian</strong>
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
              <span>All Community Stories</span>
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
          
          {/* ── FACEBOOK-STYLE CREATE POST CARD ── */}
          <AppleReveal duration={0.6} yOffset={20}>
            <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Avatar + Main Input Bar */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <img 
                  src={currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'} 
                  alt="User" 
                  style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <textarea 
                  className="input-clean" 
                  rows={postImagePreview || postText.length > 60 ? 3 : 2} 
                  placeholder={`What's on your pet's mind, ${currentUser ? currentUser.name.split(' ')[0] : 'Pet Parent'}?`}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  style={{ resize: 'none', fontSize: '14px', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}
                />
              </div>

              {/* Attached Image Preview */}
              {postImagePreview && (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 280, border: '1px solid var(--border)' }}>
                  <img src={postImagePreview} alt="Attached Preview" style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
                  <button 
                    className="icon-btn" 
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none' }}
                    onClick={() => setPostImagePreview(null)}
                    title="Remove Photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Tags and Metadata Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Photo Upload Trigger */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleImageSelect} 
                  />
                  <button 
                    type="button" 
                    className="btn-ghost" 
                    style={{ padding: '6px 12px', fontSize: '12.5px', color: '#10B981' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={16} />
                    <span>Photo</span>
                  </button>

                  {/* Pet Tag Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-alt)', padding: '4px 10px', borderRadius: '20px' }}>
                    <Tag size={13} color="var(--primary)" />
                    <select 
                      value={selectedPetTag} 
                      onChange={(e) => setSelectedPetTag(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                    >
                      {pets.map(p => (
                        <option key={p.id} value={p.name} style={{ background: 'var(--surface)', color: 'var(--text-main)' }}>
                          {p.name} ({p.breed || 'Pet'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Pill Selector */}
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, borderRadius: '20px', padding: '4px 10px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="Moment" style={{ background: 'var(--surface)' }}>📸 Moment</option>
                    <option value="Health" style={{ background: 'var(--surface)' }}>🩺 Health Milestone</option>
                    <option value="Adoption" style={{ background: 'var(--surface)' }}>🏠 Rescue Story</option>
                    <option value="Question" style={{ background: 'var(--surface)' }}>💡 Advice Needed</option>
                  </select>
                </div>

                {/* Submit Post Button */}
                <button 
                  type="button" 
                  className="apple-btn-blue" 
                  style={{ padding: '7px 22px', fontSize: '13px', borderRadius: '20px' }}
                  onClick={handlePostSubmit}
                  disabled={isUploadingImage}
                >
                  <Send size={13} />
                  <span>Post Story</span>
                </button>
              </div>
            </div>
          </AppleReveal>

          {/* ── FEED FILTER TABS ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              <button className={`chip-pill ${feedFilter === 'all' ? 'active' : ''}`} onClick={() => setFeedFilter('all')}>
                🔥 Trending
              </button>
              <button className={`chip-pill ${feedFilter === 'moments' ? 'active' : ''}`} onClick={() => setFeedFilter('moments')}>
                📸 Moments
              </button>
              <button className={`chip-pill ${feedFilter === 'health' ? 'active' : ''}`} onClick={() => setFeedFilter('health')}>
                🩺 Health
              </button>
              <button className={`chip-pill ${feedFilter === 'adoption' ? 'active' : ''}`} onClick={() => setFeedFilter('adoption')}>
                🏠 Rescue
              </button>
              <button className={`chip-pill ${feedFilter === 'qa' ? 'active' : ''}`} onClick={() => setFeedFilter('qa')}>
                💡 Q&amp;A
              </button>
            </div>

            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {/* ── POSTS FEED (INSTAGRAM & FACEBOOK STYLE) ── */}
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
                  onClick={() => { setFeedFilter('all'); fileInputRef.current?.click(); }}
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
                    
                    {/* Post Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        
                        {/* Avatar with Story Ring */}
                        <div className="story-ring-active" style={{ padding: '2px' }}>
                          <img 
                            src={post.authorPhoto || 'assets/images/tail_wagging_logo.png'} 
                            alt={post.author} 
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'block' }} 
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {post.author}
                            </strong>
                            <CheckCircle size={14} color="#10B981" fill="#10B981" />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>🐾 {post.petTag}</span>
                            <span>•</span>
                            <span>{post.time || 'Recent'}</span>
                          </div>
                        </div>
                      </div>

                      {/* More / Category Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {post.category && (
                          <span className="badge badge-green" style={{ fontSize: '11px' }}>
                            {post.category}
                          </span>
                        )}
                        <button 
                          className="icon-btn" 
                          style={{ width: 30, height: 30, border: 'none', background: 'transparent' }}
                          onClick={() => handleSharePost(post.id)}
                          title="Share post"
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Post Caption */}
                    {post.content && (
                      <p style={{ fontSize: '14.5px', color: 'var(--text-main)', lineHeight: 1.55, padding: '0 20px 14px', margin: 0 }}>
                        {post.content}
                      </p>
                    )}

                    {/* Edge-to-Edge Visual Image with Double-Tap Heart */}
                    {post.image && (
                      <div 
                        style={{ position: 'relative', background: '#000', cursor: 'pointer', overflow: 'hidden' }}
                        onDoubleClick={() => handleDoubleTap(post.id)}
                      >
                        <img 
                          src={post.image} 
                          alt="Story visual" 
                          style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} 
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

                    {/* Engagement Actions Bar (Facebook & Instagram Style) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderTop: '1px solid var(--border)' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Like Button */}
                        <button 
                          className={`reaction-btn ${post.isLiked ? 'liked' : ''}`}
                          onClick={() => toggleLike(post.id)}
                        >
                          <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} />
                          <span>{likesCount > 0 ? likesCount : 'Like'}</span>
                        </button>

                        {/* Comment Button */}
                        <button 
                          className="reaction-btn"
                          onClick={() => setActiveCommentPostId(isCommentSectionOpen ? null : post.id)}
                        >
                          <MessageCircle size={18} />
                          <span>{post.comments?.length || 0} Comments</span>
                        </button>
                      </div>

                      {/* Bookmark Icon */}
                      <button 
                        className="icon-btn" 
                        style={{ width: 34, height: 34, border: 'none', background: 'transparent', color: isBookmarked ? '#F59E0B' : 'var(--text-muted)' }}
                        onClick={() => handleToggleBookmark(post.id)}
                        title="Save to bookmarks"
                      >
                        <Bookmark size={18} fill={isBookmarked ? '#F59E0B' : 'none'} />
                      </button>
                    </div>

                    {/* Social Proof Text */}
                    {likesCount > 0 && (
                      <div style={{ padding: '0 20px 10px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        Liked by <strong style={{ color: 'var(--text-main)' }}>{likesCount} {likesCount === 1 ? 'pet parent' : 'pet parents'}</strong>
                      </div>
                    )}

                    {/* Comments Section Drawer */}
                    {isCommentSectionOpen && (
                      <div style={{ background: 'var(--surface-alt)', padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* Comments List */}
                        {post.comments && post.comments.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 220, overflowY: 'auto', paddingRight: '4px' }}>
                            {post.comments.map((c, i) => (
                              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                                  {c.author ? c.author[0] : 'P'}
                                </div>
                                <div style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', flex: 1 }}>
                                  <strong style={{ color: 'var(--text-main)', fontSize: '12.5px', display: 'block', marginBottom: '2px' }}>
                                    {c.author}
                                  </strong>
                                  <span style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No comments yet. Start the conversation!</span>
                        )}

                        {/* Sticky Inline Add Comment Bar */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            className="input-clean" 
                            placeholder="Add a comment for pet parents..." 
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                            style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '20px' }}
                          />
                          <button 
                            className="apple-btn-blue" 
                            style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '20px' }}
                            onClick={() => handleCommentSubmit(post.id)}
                          >
                            Post
                          </button>
                        </div>
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
              🛡️ Verified Safe Community
            </span>
            All pet health milestones are moderated with certified veterinary oversight.
          </div>
        </aside>

      </div>

      {/* ── 3. INTERACTIVE STORY VIEWER MODAL (INSTAGRAM REEL STYLE) ── */}
      {activeStoryIndex !== null && dynamicStories[activeStoryIndex] && (
        <div 
          className="modal-backdrop" 
          style={{ background: 'rgba(0,0,0,0.92)', zIndex: 10000 }}
          onClick={() => setActiveStoryIndex(null)}
        >
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: 420, 
              height: '85vh', 
              maxHeight: 740, 
              background: '#000', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Story Progress Bar */}
            <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, display: 'flex', gap: '4px' }}>
              {dynamicStories.map((_, i) => (
                <div 
                  key={i} 
                  style={{ 
                    flex: 1, 
                    height: 3, 
                    background: i < activeStoryIndex ? '#fff' : (i === activeStoryIndex ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'), 
                    borderRadius: 2,
                    overflow: 'hidden' 
                  }}
                >
                  {i === activeStoryIndex && (
                    <div style={{ height: '100%', background: '#fff', animation: 'storyTimer 5s linear forwards' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Story Header Meta */}
            <div style={{ position: 'absolute', top: 24, left: 14, right: 14, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src={dynamicStories[activeStoryIndex].avatar} 
                  alt="Story author" 
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} 
                />
                <div>
                  <strong style={{ fontSize: '13.5px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {dynamicStories[activeStoryIndex].author}
                  </strong>
                  <span style={{ fontSize: '11px', opacity: 0.85, display: 'block' }}>
                    {dynamicStories[activeStoryIndex].tag} • {dynamicStories[activeStoryIndex].time}
                  </span>
                </div>
              </div>

              <button 
                className="icon-btn" 
                style={{ color: '#fff', background: 'rgba(0,0,0,0.5)', border: 'none' }}
                onClick={() => setActiveStoryIndex(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Story Visual Media */}
            <img 
              src={dynamicStories[activeStoryIndex].storyMedia} 
              alt="Story Content" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />

            {/* Story Bottom Caption & Reply Bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                {dynamicStories[activeStoryIndex].caption}
              </p>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder={`Reply to ${dynamicStories[activeStoryIndex].author}...`}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '8px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      showToast(`💌 Reply sent to ${dynamicStories[activeStoryIndex].owner}!`, 'success');
                      e.target.value = '';
                    }
                  }}
                />
                <button 
                  style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#EF4444', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => showToast('❤️ Liked story!', 'success')}
                >
                  <Heart size={18} fill="#EF4444" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
