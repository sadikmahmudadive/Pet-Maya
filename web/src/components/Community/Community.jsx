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
  ChevronLeft,
  TrendingUp,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  Camera,
  Activity,
  Globe,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  PhoneCall,
  Eye,
  MapPin,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

export default function Community() {
  const { posts, isPostsLoading, createPost, toggleLike, addComment, resolveAmberAlert, pets, vets, showToast, openModal } = useApp();
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

  // ── HORIZONTAL RECYCLERVIEW / SCROLLABLE TABS STATE ──
  const feedTabsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingTabs = useRef(false);
  const startXTabs = useRef(0);
  const scrollLeftTabs = useRef(0);
  const hasMovedTabs = useRef(false);

  const checkTabsScroll = () => {
    if (!feedTabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = feedTabsRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  React.useEffect(() => {
    checkTabsScroll();
    const timer = setTimeout(checkTabsScroll, 300);
    const el = feedTabsRef.current;
    if (el) {
      el.addEventListener('scroll', checkTabsScroll, { passive: true });
    }
    window.addEventListener('resize', checkTabsScroll);
    return () => {
      clearTimeout(timer);
      if (el) el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [feedFilter]);

  const handleTabsScrollLeft = () => {
    if (feedTabsRef.current) {
      feedTabsRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const handleTabsScrollRight = () => {
    if (feedTabsRef.current) {
      feedTabsRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const handleTabsMouseDown = (e) => {
    if (!feedTabsRef.current) return;
    isDraggingTabs.current = true;
    hasMovedTabs.current = false;
    startXTabs.current = e.pageX - feedTabsRef.current.offsetLeft;
    scrollLeftTabs.current = feedTabsRef.current.scrollLeft;
  };

  const handleTabsMouseMove = (e) => {
    if (!isDraggingTabs.current || !feedTabsRef.current) return;
    const x = e.pageX - feedTabsRef.current.offsetLeft;
    const walk = (x - startXTabs.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedTabs.current = true;
    }
    feedTabsRef.current.scrollLeft = scrollLeftTabs.current - walk;
    checkTabsScroll();
  };

  const handleTabsMouseUp = () => {
    isDraggingTabs.current = false;
  };

  const selectTab = (filterKey, e) => {
    if (hasMovedTabs.current) {
      hasMovedTabs.current = false;
      return;
    }
    setFeedFilter(filterKey);
    setSearchTopic('');
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(checkTabsScroll, 350);
  };

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

  // ── DYNAMIC AMBER ALERT & LOST PET RECOVERY SYSTEM ──
  const [dismissedAmberIds, setDismissedAmberIds] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_dismissed_amber_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });

  // Dynamically derive the most recent unresolved, un-dismissed Amber Alert
  const activeAmberAlert = useMemo(() => {
    return posts.find(p => {
      if (dismissedAmberIds.includes(p.id) || p.isResolved) return false;
      const cat = (p.category || '').toLowerCase();
      const content = (p.content || '').toLowerCase();
      return p.isAmberAlert || cat.includes('lost') || content.includes('lost pet') || content.includes('amber alert') || cat === 'lost_found';
    });
  }, [posts, dismissedAmberIds]);

  // Modals for Amber Alert & Lost Pet Features
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [targetAlertForModal, setTargetAlertForModal] = useState(null);

  // Broadcast Alert Form State
  const [broadcastPetName, setBroadcastPetName] = useState('');
  const [broadcastPetBreed, setBroadcastPetBreed] = useState('');
  const [broadcastLocation, setBroadcastLocation] = useState('');
  const [broadcastTimeAgo, setBroadcastTimeAgo] = useState('Just now (<30m)');
  const [broadcastPhone, setBroadcastPhone] = useState(currentUser?.phone || '+880 1712-345678');
  const [broadcastMicrochip, setBroadcastMicrochip] = useState('');
  const [broadcastCollarTag, setBroadcastCollarTag] = useState('');
  const [broadcastReward, setBroadcastReward] = useState('৳ 5,000');
  const [broadcastNotes, setBroadcastNotes] = useState('');
  const [broadcastImage, setBroadcastImage] = useState(null);
  const broadcastFileInputRef = useRef(null);

  // Sighting Form State
  const [sightingLocation, setSightingLocation] = useState('');
  const [sightingTime, setSightingTime] = useState('Just now');
  const [sightingNotes, setSightingNotes] = useState('');
  const [sightingReporterName, setSightingReporterName] = useState(currentUser?.name || '');
  const [sightingReporterPhone, setSightingReporterPhone] = useState(currentUser?.phone || '');

  // Amber Handlers
  const handleDismissAmberAlert = (alertId) => {
    setDismissedAmberIds(prev => {
      const next = [...prev, alertId];
      try {
        localStorage.setItem('pm_dismissed_amber_alerts', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    showToast('Amber Alert banner dismissed', 'info');
  };

  const handleResolveAlert = (alertId) => {
    if (resolveAmberAlert) {
      resolveAmberAlert(alertId);
    } else {
      showToast('🎉 Wonderful news! Pet marked as safely reunited!', 'success');
    }
  };

  const handleOpenContactModal = (alert) => {
    setTargetAlertForModal(alert);
    setIsContactModalOpen(true);
  };

  const handleOpenSightingModal = (alert) => {
    setTargetAlertForModal(alert);
    setIsSightingModalOpen(true);
  };

  const handleBroadcastImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBroadcastImage(event.target.result);
      showToast('Pet photo attached to alert!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleBroadcastSubmit = (e) => {
    if (e) e.preventDefault();
    if (!broadcastPetName.trim()) {
      showToast('Please enter the missing pet\'s name', 'error');
      return;
    }
    if (!broadcastLocation.trim()) {
      showToast('Please specify the last seen location', 'error');
      return;
    }

    const alertContent = `🚨 LOST PET ALERT: ${broadcastPetName.trim()} (${broadcastPetBreed.trim() || 'Pet'}) went missing near ${broadcastLocation.trim()} (${broadcastTimeAgo})! ${broadcastNotes ? broadcastNotes.trim() + '. ' : ''}${broadcastCollarTag ? `Collar BLE Tag: ${broadcastCollarTag}. ` : ''}${broadcastMicrochip ? `Microchip #${broadcastMicrochip}. ` : ''}Emergency Contact: ${broadcastPhone}. ${broadcastReward ? `Reward: ${broadcastReward}.` : ''} Please report any sightings immediately! 🙏🐾`;

    createPost({
      author: currentUser ? currentUser.name : 'Alex Johnson',
      petTag: `${broadcastPetName.trim()} (${broadcastPetBreed.trim() || 'Pet'})`,
      category: 'Lost & Found',
      content: alertContent,
      image: broadcastImage || '',
      isAmberAlert: true,
      petName: broadcastPetName.trim(),
      petBreed: broadcastPetBreed.trim() || 'Pet',
      location: broadcastLocation.trim(),
      contactPhone: broadcastPhone,
      microchipId: broadcastMicrochip,
      collarTag: broadcastCollarTag,
      reward: broadcastReward
    });

    // Reset dismissed list so this new alert is visible immediately
    setDismissedAmberIds([]);
    try {
      localStorage.removeItem('pm_dismissed_amber_alerts');
    } catch (_) {}

    setIsBroadcastModalOpen(false);
    setBroadcastPetName('');
    setBroadcastPetBreed('');
    setBroadcastLocation('');
    setBroadcastNotes('');
    setBroadcastMicrochip('');
    setBroadcastCollarTag('');
    setBroadcastImage(null);
    showToast('🚨 Emergency Amber Alert broadcasted across Pet Maya network!', 'success');
  };

  const handleSightingSubmit = (e) => {
    if (e) e.preventDefault();
    if (!sightingLocation.trim()) {
      showToast('Please specify where you spotted the pet', 'error');
      return;
    }
    const alert = targetAlertForModal || activeAmberAlert;
    if (!alert) return;

    const sightingText = `📍 VERIFIED COMMUNITY SIGHTING: Spotted near "${sightingLocation.trim()}" around ${sightingTime}. ${sightingNotes ? `Notes: "${sightingNotes.trim()}". ` : ''}${sightingReporterPhone ? `Finder phone: ${sightingReporterPhone}` : ''}`;

    addComment(alert.id, sightingText, sightingReporterName || (currentUser ? currentUser.name : 'Helpful Neighbor'));

    setIsSightingModalOpen(false);
    setSightingLocation('');
    setSightingNotes('');
    showToast('🐾 Sighting reported! Guardian & community updated.', 'success');
  };

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
    if (feedFilter === 'lost') return matchesSearch && (cat.includes('lost') || content.includes('missing') || content.includes('found') || cat.includes('amber') || content.includes('amber'));
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
              className={`apple-nav-item ${feedFilter === 'lost' ? 'active' : ''}`}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: feedFilter === 'lost' ? 'var(--surface-alt)' : 'transparent', fontWeight: 600 }}
              onClick={() => { setFeedFilter('lost'); setSearchTopic(''); }}
            >
              <AlertTriangle size={16} color="#F59E0B" />
              <span>Lost &amp; Found Alerts</span>
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

          {/* ── DYNAMIC EMERGENCY LOST PET AMBER ALERT BANNER / COMMUNITY RADAR ── */}
          <AppleReveal duration={0.6} yOffset={16}>
            {activeAmberAlert ? (
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(245, 158, 11, 0.1) 100%)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '20px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(239, 68, 68, 0.14)'
                }}
              >
                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismissAmberAlert(activeAmberAlert.id)}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Dismiss alert banner"
                >
                  <X size={15} />
                </button>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', paddingRight: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 46,
                      height: 46,
                      borderRadius: '14px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EF4444',
                      flexShrink: 0
                    }}>
                      <AlertTriangle size={24} className="pulse-red" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#EF4444',
                          color: '#FFF',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2.5px 8px',
                          borderRadius: '999px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          Active Amber Alert
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {activeAmberAlert.time || 'Active now'} • {activeAmberAlert.location || (activeAmberAlert.content?.match(/near\s+([^.!,]+)/i)?.[1] ? `Near ${activeAmberAlert.content.match(/near\s+([^.!,]+)/i)[1].trim()}` : 'Gulshan-2, Dhaka')}
                        </span>
                        {activeAmberAlert.reward && (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#F59E0B',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px'
                          }}>
                            Reward: {activeAmberAlert.reward}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '16.5px', fontWeight: 700, margin: '4px 0 0', color: 'var(--text-main)' }}>
                        Lost Pet: &ldquo;{activeAmberAlert.petName || activeAmberAlert.petTag?.split('(')[0]?.trim() || 'Missing Pet'}&rdquo; {activeAmberAlert.petBreed ? `(${activeAmberAlert.petBreed})` : (activeAmberAlert.petTag?.includes('(') ? `(${activeAmberAlert.petTag.split('(')[1].replace(')', '')})` : '')}
                      </h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleOpenContactModal(activeAmberAlert)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '12px',
                        padding: '7px 14px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <PhoneCall size={14} />
                      <span>Contact Guardian</span>
                    </button>

                    <button
                      onClick={() => handleOpenSightingModal(activeAmberAlert)}
                      style={{
                        background: '#EF4444',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '7px 14px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Eye size={14} />
                      <span>Report Sighting</span>
                    </button>

                    <button
                      onClick={() => handleResolveAlert(activeAmberAlert.id)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '12px',
                        padding: '7px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer'
                      }}
                      title="Mark as Reunited"
                    >
                      <CheckCircle2 size={14} />
                      <span>Reunited</span>
                    </button>
                  </div>
                </div>

                {/* Content & Metadata */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {activeAmberAlert.image && (
                    <img 
                      src={activeAmberAlert.image} 
                      alt="Missing Pet" 
                      style={{ width: 80, height: 80, borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(239, 68, 68, 0.3)', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                      {activeAmberAlert.content}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {(activeAmberAlert.collarTag || activeAmberAlert.content?.match(/(PM-BLE-[0-9A-Z]+)/i)?.[1]) && (
                        <span>🏷️ BLE Tag: <strong style={{ color: 'var(--text-main)' }}>{activeAmberAlert.collarTag || activeAmberAlert.content?.match(/(PM-BLE-[0-9A-Z]+)/i)?.[1]}</strong></span>
                      )}
                      {(activeAmberAlert.microchipId || activeAmberAlert.content?.match(/Microchip\s*#?([A-Z0-9\-]+)/i)?.[1]) && (
                        <span>🔬 Microchip: <strong style={{ color: 'var(--text-main)' }}>{activeAmberAlert.microchipId || activeAmberAlert.content?.match(/Microchip\s*#?([A-Z0-9\-]+)/i)?.[1]}</strong></span>
                      )}
                      <span 
                        onClick={() => {
                          setFeedFilter('lost');
                          showToast('Showing Lost & Found alerts in community feed', 'info');
                        }}
                        style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        💬 {activeAmberAlert.comments?.length || 0} sighting updates <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── COMMUNITY LOST PET RADAR (ALL CLEAR STATUS) ── */
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(26, 182, 128, 0.1) 0%, rgba(16, 185, 129, 0.03) 100%)',
                  border: '1px solid rgba(26, 182, 128, 0.28)',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  boxShadow: '0 4px 20px rgba(26, 182, 128, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    background: 'rgba(26, 182, 128, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: 'var(--primary)',
                        color: '#FFF',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}>
                        Radar Active • All Clear
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>24/7 BLE Collar Mesh Network</span>
                    </div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0 0', color: 'var(--text-main)' }}>
                      No active missing pet alerts in your neighborhood
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (pets.length > 0) {
                      setBroadcastPetName(pets[0].name);
                      setBroadcastPetBreed(pets[0].breed || 'Dog');
                    }
                    setIsBroadcastModalOpen(true);
                  }}
                  className="apple-btn-blue"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    padding: '8px 18px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)'
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>Broadcast Amber Alert</span>
                </button>
              </div>
            )}
          </AppleReveal>
          
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
              <button className={`chip-pill ${feedFilter === 'lost' ? 'active' : ''}`} onClick={() => setFeedFilter('lost')}>
                <AlertTriangle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                Lost &amp; Found
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
          {/* ── FEED FILTER TABS (HORIZONTAL RECYCLERVIEW / SCROLLER) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            
            {/* Top Stat Row: Section Label + Story Count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  Community Topics
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  Drag or scroll
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'}
              </span>
            </div>

            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'}
            </span>
            {/* RecyclerView Wrapper with Left/Right Navigation Chevrons & Edge Fades */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              
              {/* Left Scroll Chevron Button */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={handleTabsScrollLeft}
                  style={{
                    position: 'absolute',
                    left: 4,
                    zIndex: 10,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
              )}

              {/* Left Edge Fade */}
              {canScrollLeft && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 36,
                  background: 'linear-gradient(to right, var(--bg) 0%, transparent 100%)',
                  zIndex: 8,
                  pointerEvents: 'none'
                }} />
              )}

              {/* Scrollable RecyclerView Strip with Drag-to-Scroll */}
              <div
                ref={feedTabsRef}
                onMouseDown={handleTabsMouseDown}
                onMouseMove={handleTabsMouseMove}
                onMouseUp={handleTabsMouseUp}
                onMouseLeave={handleTabsMouseUp}
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  padding: '4px 6px 8px 6px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  width: '100%',
                  cursor: isDraggingTabs.current ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                <button 
                  className={`chip-pill ${feedFilter === 'all' ? 'active' : ''}`} 
                  onClick={(e) => selectTab('all', e)}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <TrendingUp size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Trending
                </button>

                <button 
                  className={`chip-pill ${feedFilter === 'lost' ? 'active' : ''}`} 
                  onClick={(e) => selectTab('lost', e)}
                  style={{ 
                    whiteSpace: 'nowrap', 
                    flexShrink: 0, 
                    color: feedFilter === 'lost' ? '#fff' : '#EF4444', 
                    borderColor: feedFilter === 'lost' ? '#EF4444' : 'rgba(239, 68, 68, 0.35)', 
                    background: feedFilter === 'lost' ? '#EF4444' : 'rgba(239, 68, 68, 0.08)' 
                  }}
                >
                  <AlertTriangle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Lost &amp; Found
                </button>

                <button 
                  className={`chip-pill ${feedFilter === 'moments' ? 'active' : ''}`} 
                  onClick={(e) => selectTab('moments', e)}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Camera size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Moments
                </button>

                <button 
                  className={`chip-pill ${feedFilter === 'health' ? 'active' : ''}`} 
                  onClick={(e) => selectTab('health', e)}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Stethoscope size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Health &amp; Care
                </button>

                <button 
                  className={`chip-pill ${feedFilter === 'adoption' ? 'active' : ''}`} 
                  onClick={(e) => selectTab('adoption', e)}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Heart size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Rescue &amp; Adoption
                </button>

                <button 
                  className={`chip-pill ${feedFilter === 'qa' ? 'active' : ''}`} 
                  onClick={(e) => selectTab('qa', e)}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <HelpCircle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Q&amp;A Advice
                </button>

                <button 
                  className={`chip-pill ${feedFilter === 'saved' ? 'active' : ''}`} 
                  onClick={(e) => selectTab('saved', e)}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Bookmark size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Saved ({bookmarkedPosts.length})
                </button>
              </div>

              {/* Right Edge Fade */}
              {canScrollRight && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 36,
                  background: 'linear-gradient(to left, var(--bg) 0%, transparent 100%)',
                  zIndex: 8,
                  pointerEvents: 'none'
                }} />
              )}

              {/* Right Scroll Chevron Button */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={handleTabsScrollRight}
                  style={{
                    position: 'absolute',
                    right: 4,
                    zIndex: 10,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              )}

            </div>
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
                    
                    {/* ── Emergency Amber Alert Ribbon on Card ── */}
                    {(post.isAmberAlert || (post.category && post.category.toLowerCase().includes('lost'))) && (
                      <div style={{
                        background: post.isResolved ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(90deg, rgba(239, 68, 68, 0.18), rgba(245, 158, 11, 0.12))',
                        borderBottom: post.isResolved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={15} color={post.isResolved ? '#10B981' : '#EF4444'} className={post.isResolved ? '' : 'pulse-red'} />
                          <strong style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.04em', color: post.isResolved ? '#10B981' : '#EF4444', textTransform: 'uppercase' }}>
                            {post.isResolved ? '✓ Case Resolved • Reunited with Family' : '🚨 Active Missing Pet Alert'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {!post.isResolved && (
                            <>
                              <button
                                onClick={() => handleOpenContactModal(post)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <PhoneCall size={12} />
                                <span>Call</span>
                              </button>
                              <button
                                onClick={() => handleOpenSightingModal(post)}
                                style={{
                                  background: '#EF4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Eye size={12} />
                                <span>Report Sighting</span>
                              </button>
                              <button
                                onClick={() => handleResolveAlert(post.id)}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  borderRadius: '8px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Mark as Reunited"
                              >
                                <CheckCircle2 size={12} />
                                <span>Reunited</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

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
                        <option value="Lost & Found" style={{ background: 'var(--surface)', color: '#EF4444', fontWeight: 700 }}>🚨 Lost &amp; Found Alert</option>
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

      {/* ── 1. BROADCAST AMBER ALERT MODAL ── */}
      {isBroadcastModalOpen && (
        <div 
          className="apple-modal-overlay" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsBroadcastModalOpen(false); }}
        >
          <div 
            className="apple-modal-card animate-scale-up" 
            style={{ 
              width: '100%', 
              maxWidth: '560px', 
              background: 'var(--surface)', 
              borderRadius: '24px', 
              border: '1.5px solid rgba(239, 68, 68, 0.4)', 
              boxShadow: '0 24px 60px rgba(239, 68, 68, 0.25)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)', borderBottom: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '12px', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} className="pulse-red" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#EF4444' }}>
                    Broadcast Emergency Amber Alert
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Alerts nearby guardians, clinic mesh networks &amp; active finders
                  </p>
                </div>
              </div>
              <button 
                className="icon-btn" 
                style={{ width: 32, height: 32, border: 'none', background: 'transparent' }} 
                onClick={() => setIsBroadcastModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBroadcastSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '76vh', overflowY: 'auto' }}>
              
              {/* Pet Quick Selector */}
              {pets.length > 0 && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Select Registered Pet (or enter below)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {pets.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setBroadcastPetName(p.name);
                          setBroadcastPetBreed(p.breed || 'Pet');
                          if (p.photo) setBroadcastImage(p.photo);
                        }}
                        style={{
                          background: broadcastPetName === p.name ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-alt)',
                          color: broadcastPetName === p.name ? '#EF4444' : 'var(--text-main)',
                          border: broadcastPetName === p.name ? '1.5px solid #EF4444' : '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🐾 {p.name} ({p.breed || 'Pet'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pet Name & Breed Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bruno"
                    value={broadcastPetName}
                    onChange={(e) => setBroadcastPetName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Breed &amp; Age
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Golden Retriever, 3 Yrs"
                    value={broadcastPetBreed}
                    onChange={(e) => setBroadcastPetBreed(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Last Seen Location */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Last Seen Location *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#EF4444' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulshan Lake Park, Road 71, Dhaka"
                    value={broadcastLocation}
                    onChange={(e) => setBroadcastLocation(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13.5px' }}
                  />
                </div>

                {/* Quick Area Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {['Gulshan-2', 'Banani', 'Dhanmondi Lake', 'Uttara Sector 4', 'Mirpur DOHS', 'Mohakhali'].map(loc => (
                    <span
                      key={loc}
                      onClick={() => setBroadcastLocation(loc + ', Dhaka')}
                      style={{
                        fontSize: '11px',
                        background: 'var(--surface-alt)',
                        color: 'var(--text-muted)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: '1px solid var(--border)'
                      }}
                    >
                      + {loc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Time Missing & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Missing Since
                  </label>
                  <select
                    value={broadcastTimeAgo}
                    onChange={(e) => setBroadcastTimeAgo(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13px' }}
                  >
                    <option value="Just now (<30m)">Just now (&lt;30m)</option>
                    <option value="1 hour ago">1 hour ago</option>
                    <option value="2-4 hours ago">2-4 hours ago</option>
                    <option value="Earlier today">Earlier today</option>
                    <option value="Yesterday">Yesterday</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Guardian Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+880 1712-345678"
                    value={broadcastPhone}
                    onChange={(e) => setBroadcastPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* BLE Tag, Microchip & Reward */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Collar BLE Tag
                  </label>
                  <input
                    type="text"
                    placeholder="PM-BLE-4109"
                    value={broadcastCollarTag}
                    onChange={(e) => setBroadcastCollarTag(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Microchip ID
                  </label>
                  <input
                    type="text"
                    placeholder="BD-982-004-912"
                    value={broadcastMicrochip}
                    onChange={(e) => setBroadcastMicrochip(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Reward (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="৳ 5,000"
                    value={broadcastReward}
                    onChange={(e) => setBroadcastReward(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* Distinctive Features / Circumstances */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Distinguishing Features &amp; Circumstances
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wearing an orange collar with bell, very friendly with children, slipped leash near park gate."
                  value={broadcastNotes}
                  onChange={(e) => setBroadcastNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              {/* Pet Photo Upload */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Pet Photo
                </label>
                <input
                  type="file"
                  ref={broadcastFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleBroadcastImageSelect}
                />
                {broadcastImage ? (
                  <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: 120, border: '1px solid var(--border)' }}>
                    <img src={broadcastImage} alt="Pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setBroadcastImage(null)}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => broadcastFileInputRef.current?.click()}
                    style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '14px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface-alt)' }}
                  >
                    <Camera size={20} color="var(--text-muted)" style={{ margin: '0 auto 4px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click to upload clear photo of missing pet</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="apple-btn-blue"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  padding: '12px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.35)',
                  marginTop: '4px'
                }}
              >
                <AlertTriangle size={18} />
                <span>Broadcast Emergency Amber Alert Now</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. REPORT SIGHTING MODAL ── */}
      {isSightingModalOpen && (
        <div 
          className="apple-modal-overlay" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsSightingModalOpen(false); }}
        >
          <div 
            className="apple-modal-card animate-scale-up" 
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              background: 'var(--surface)', 
              borderRadius: '24px', 
              border: '1.5px solid rgba(239, 68, 68, 0.35)', 
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '12px', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Report Pet Sighting
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Alert the guardian &amp; help pinpoint location
                  </p>
                </div>
              </div>
              <button 
                className="icon-btn" 
                style={{ width: 32, height: 32, border: 'none', background: 'transparent' }} 
                onClick={() => setIsSightingModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Pet Preview */}
            {(targetAlertForModal || activeAmberAlert) && (
              <div style={{ padding: '12px 20px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {(targetAlertForModal || activeAmberAlert)?.image && (
                  <img 
                    src={(targetAlertForModal || activeAmberAlert).image} 
                    alt="Pet" 
                    style={{ width: 44, height: 44, borderRadius: '10px', objectFit: 'cover' }} 
                  />
                )}
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                    {(targetAlertForModal || activeAmberAlert)?.petName || (targetAlertForModal || activeAmberAlert)?.petTag || 'Missing Pet'}
                  </strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Reported by {(targetAlertForModal || activeAmberAlert)?.author || 'Guardian'}
                  </span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSightingSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Where was the pet spotted? *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#EF4444' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Lake Park Gate 3, heading towards Road 71"
                    value={sightingLocation}
                    onChange={(e) => setSightingLocation(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  When did you see the pet?
                </label>
                <select
                  value={sightingTime}
                  onChange={(e) => setSightingTime(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13px' }}
                >
                  <option value="Just now (<5 mins ago)">Just now (&lt;5 mins ago)</option>
                  <option value="15 minutes ago">15 minutes ago</option>
                  <option value="30 minutes ago">30 minutes ago</option>
                  <option value="1 hour ago">1 hour ago</option>
                  <option value="Earlier today">Earlier today</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Direction of movement &amp; Pet Condition
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Appeared calm, walking near the sidewalk, accompanied by another stray dog."
                  value={sightingNotes}
                  onChange={(e) => setSightingNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Helpful Neighbor"
                    value={sightingReporterName}
                    onChange={(e) => setSightingReporterName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Your Phone (for callback)
                  </label>
                  <input
                    type="tel"
                    placeholder="+880 1..."
                    value={sightingReporterPhone}
                    onChange={(e) => setSightingReporterPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-main)', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="apple-btn-blue"
                style={{
                  background: '#EF4444',
                  padding: '11px',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                  marginTop: '4px'
                }}
              >
                <Eye size={16} />
                <span>Submit Sighting Report</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. CONTACT GUARDIAN MODAL ── */}
      {isContactModalOpen && (
        <div 
          className="apple-modal-overlay" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsContactModalOpen(false); }}
        >
          <div 
            className="apple-modal-card animate-scale-up" 
            style={{ 
              width: '100%', 
              maxWidth: '460px', 
              background: 'var(--surface)', 
              borderRadius: '24px', 
              border: '1px solid var(--border)', 
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '12px', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Contact Guardian
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Direct emergency lines &amp; instant messaging
                  </p>
                </div>
              </div>
              <button 
                className="icon-btn" 
                style={{ width: 32, height: 32, border: 'none', background: 'transparent' }} 
                onClick={() => setIsContactModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Guardian & Pet Details */}
            {(() => {
              const alert = targetAlertForModal || activeAmberAlert;
              const petName = alert?.petName || alert?.petTag?.split('(')[0]?.trim() || 'Missing Pet';
              const guardianName = alert?.author || 'Pet Guardian';
              const phone = alert?.contactPhone || alert?.content?.match(/(\+?880\s?[0-9\-\s]{8,15})/)?.[1] || '+880 1712-345678';
              const cleanPhone = phone.replace(/[^0-9]/g, '');

              return (
                <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Guardian Card */}
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--surface-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img 
                      src={alert?.authorPhoto || 'assets/images/tail_wagging_logo.png'} 
                      alt={guardianName} 
                      style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid #EF4444' }} 
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '15.5px', color: 'var(--text-main)' }}>{guardianName}</strong>
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px' }}>
                          Verified Parent
                        </span>
                      </div>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        Searching for <strong>{petName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Primary Phone Number Display */}
                  <div style={{ textAlign: 'center', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      Verified Emergency Phone
                    </span>
                    <strong style={{ fontSize: '19px', color: '#EF4444', letterSpacing: '0.03em' }}>
                      {phone}
                    </strong>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Call Direct */}
                    <button
                      onClick={() => {
                        window.location.href = `tel:${phone}`;
                        showToast(`Initiating call to ${phone}...`, 'info');
                      }}
                      className="apple-btn-blue"
                      style={{
                        background: '#EF4444',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <PhoneCall size={16} />
                      <span>Call Guardian Directly</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      onClick={() => {
                        const waUrl = `https://wa.me/${cleanPhone.startsWith('880') ? cleanPhone : '880' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(`Hello ${guardianName}, I saw your Amber Alert on Pet Maya regarding ${petName}. I have an update.`)}`;
                        window.open(waUrl, '_blank');
                      }}
                      style={{
                        background: '#25D366',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
                      }}
                    >
                      <MessageCircle size={16} />
                      <span>Message on WhatsApp</span>
                    </button>

                    {/* Copy Number */}
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(phone);
                          showToast('Emergency phone number copied to clipboard!', 'success');
                        }
                      }}
                      style={{
                        background: 'var(--surface-alt)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Copy size={14} />
                      <span>Copy Phone Number</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
