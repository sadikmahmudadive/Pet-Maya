import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import EditorialNavbar from '../Navigation/EditorialNavbar';
import UserAvatar from '../Common/UserAvatar';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
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
  Check,
  Radio,
  Search,
  ShoppingBag,
  Bell,
  Sparkles,
  Send,
  Calendar,
  Layers,
  Phone,
  Video,
  Award,
  Filter
} from 'lucide-react';

export default function Community({ onNavigate }) {
  const { 
    showToast, 
    openModal, 
    cart = [], 
    posts: communityPosts = [], 
    createPost: createCommunityPost, 
    toggleReaction: togglePostReaction, 
    addComment: addPostComment, 
    resolveAmberAlert, 
    uploadImageFile, 
    pets = [],
    devices = [],
    vets = []
  } = useApp ? useApp() : { showToast: () => {}, openModal: () => {}, cart: [], posts: [] };
  const { currentUser } = useAuth ? useAuth() : { currentUser: null };

  const primaryPetName = pets[0]?.name || 'Companion';

  // Category filter state
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'recovery', 'nutrition', 'social'
  const [activeNavRail, setActiveNavRail] = useState('all'); // 'all', 'photos', 'recovery', 'rescue', 'amber', 'bookmarks'

  // Post composer state
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [taggedPetName, setTaggedPetName] = useState(pets[0]?.name || '');
  const [showAmberAlert, setShowAmberAlert] = useState(true);
  const [showReportSightingModal, setShowReportSightingModal] = useState(false);
  const [showContactGuardianModal, setShowContactGuardianModal] = useState(false);
  const [showAmberTriggerModal, setShowAmberTriggerModal] = useState(false);
  const [sightingLocation, setSightingLocation] = useState('');
  const [questionInput, setQuestionInput] = useState('');

  const activeAmberAlert = useMemo(() => {
    return (communityPosts || []).find(p => (p.isAmberAlert || p.category === 'amber') && !p.isResolved);
  }, [communityPosts]);

  // Event RSVP state
  const [eventRsvpd, setEventRsvpd] = useState(false);

  // Followed clinicians state
  const [followedClinicians, setFollowedClinicians] = useState({});

  // Footer newsletter
  const [footerEmail, setFooterEmail] = useState('');

  const totalCartCount = (cart || []).reduce((sum, item) => sum + (Number(item.qty || item.quantity) || 1), 0);

  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  const handleToggleFollow = (name) => {
    setFollowedClinicians(prev => {
      const next = !prev[name];
      showToast(next ? `Following ${name}` : `Unfollowed ${name}`, 'info');
      return { ...prev, [name]: next };
    });
  };

  const handlePublishPost = async (e) => {
    if (e) e.preventDefault();
    if (!postContent.trim()) {
      showToast('Please enter a thought or recovery update to publish.', 'error');
      return;
    }
    try {
      if (createCommunityPost) {
        await createCommunityPost({
          content: postContent.trim(),
          postType: activeCategory === 'all' ? 'recovery' : activeCategory,
          imageUrl: postImageUrl || '',
          petName: taggedPetName || primaryPetName,
          userName: currentUser?.name || currentUser?.displayName || 'Pet Maya Guardian',
          userPhoto: currentUser?.photoUrl || ''
        });
      }
      showToast('✨ Moment published to Dhaka Mesh Community!', 'success');
      setPostContent('');
      setPostImageUrl('');
    } catch (err) {
      showToast('Failed to publish: ' + err.message, 'error');
    }
  };

  const handleSubscribeNewsletter = (e) => {
    e.preventDefault();
    if (!footerEmail || !footerEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    showToast('Subscribed to Clinical Bulletins & Protocols!', 'success');
    setFooterEmail('');
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    showToast(`Clinical question submitted to ${vets[0]?.name || 'verified clinicians'}!`, 'success');
    setQuestionInput('');
  };

  return (
    <div style={{
      backgroundColor: '#FAF7F5',
      minHeight: '100vh',
      color: '#160F0C',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ════════════════════════════════════════════════════════════════
          1. TOP GLOBAL PROTOCOL BANNER & EDITORIAL NAVBAR
          ════════════════════════════════════════════════════════════════ */}
      <EditorialNavbar currentRoute="community" onNavigate={handleRoute} />

      {/* ════════════════════════════════════════════════════════════════
          3. MAIN 3-COLUMN COMMUNITY MESH LAYOUT
          ════════════════════════════════════════════════════════════════ */}
      <main style={{
        maxWidth: '1360px',
        margin: '0 auto',
        width: '100%',
        padding: '28px 24px 80px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 280px',
          gap: '24px',
          alignItems: 'start'
        }} className="community-main-grid">

          {/* ────────────────────────────────────────────────────────────
              LEFT COLUMN: User Profile Card, Nav Rail & Triage Hotline
              ──────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* User Profile Capsule Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EBE5DF',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #3E7B84',
                  flexShrink: 0
                }}>
                  <UserAvatar user={currentUser} size={46} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#160F0C' }}>
                      {currentUser?.name || currentUser?.displayName || 'Guardian Member'}
                    </span>
                    <CheckCircle2 size={14} color="#047857" />
                  </div>
                  <div style={{ fontSize: '11px', color: '#707973' }}>
                    {currentUser?.address || 'Dhaka Metropolitan Mesh'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#3E7B84', fontWeight: 600, marginTop: '2px' }}>
                    🐾 {pets.length} Registered Companion{pets.length === 1 ? '' : 's'}{pets.length > 0 ? ` (${pets.map(p => p.name).join(' & ')})` : ''}
                  </div>
                </div>
              </div>

              {/* Paw Points & Community Karma (2 Stats Boxes) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                backgroundColor: '#FAF7F5',
                borderRadius: '12px',
                padding: '10px',
                border: '1px solid #EFE9E4',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase', fontWeight: 700 }}>
                    PAW POINTS
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#160F0C' }}>
                    {communityPosts.filter(p => p.userId === currentUser?.uid || p.userEmail === currentUser?.email).length * 40 || currentUser ? communityPosts.filter(p => p.userId === currentUser?.uid || p.userEmail === currentUser?.email).length * 40 : 0} <span style={{ fontSize: '10px', fontWeight: 500 }}>pts</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#3E7B84', fontWeight: 600 }}>
                    Guardian Rank
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '9px', color: '#8C827A', textTransform: 'uppercase', fontWeight: 700 }}>
                    COMMUNITY KARMA
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#047857' }}>
                    +{communityPosts.filter(p => p.userId === currentUser?.uid || p.userEmail === currentUser?.email).reduce((sum, p) => sum + (p.likesCount || 0), 0)} Score
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#8C827A' }}>
                    {communityPosts.filter(p => p.userId === currentUser?.uid || p.userEmail === currentUser?.email).length} Post{communityPosts.filter(p => p.userId === currentUser?.uid || p.userEmail === currentUser?.email).length !== 1 ? 's' : ''} Published
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Rail List */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EBE5DF',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              {[
                { id: 'all', label: 'All Stories', badge: communityPosts.length || '0', icon: Layers },
                { id: 'photos', label: 'Photo Moments', badge: communityPosts.filter(p => p.imageUrl).length || '0', icon: Camera },
                { id: 'recovery', label: 'Health & Recovery', badge: 'TPLO Hub', badgeColor: '#3E7B84', badgeBg: 'rgba(62,123,132,0.12)', icon: Stethoscope },
                { id: 'rescue', label: 'Rescue & Adoption', badge: communityPosts.filter(p => p.postType === 'rescue' || p.category === 'rescue').length || '0', icon: Users },
                { id: 'amber', label: 'Lost & Found Alerts', badge: communityPosts.filter(p => p.isAmberAlert || p.category === 'amber').length > 0 ? `${communityPosts.filter(p => p.isAmberAlert || p.category === 'amber').length} Active` : '0', badgeColor: '#EF4444', badgeBg: 'rgba(239,68,68,0.1)', icon: AlertTriangle },
                { id: 'bookmarks', label: 'Saved Bookmarks', badge: '0', icon: Bookmark }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeNavRail === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNavRail(item.id);
                      if (item.id === 'recovery') setActiveCategory('recovery');
                      if (item.id === 'all') setActiveCategory('all');
                      showToast(`Filtered feed: ${item.label}`, 'info');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'rgba(62, 123, 132, 0.1)' : 'transparent',
                      color: isActive ? '#3E7B84' : '#675C58',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} color={isActive ? '#3E7B84' : '#8C827A'} />
                      <span>{item.label}</span>
                    </div>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: item.badgeColor || '#8C827A',
                      backgroundColor: item.badgeBg || '#FAF7F5',
                      padding: '2px 6px',
                      borderRadius: '9999px'
                    }}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 24/7 Triage Line Banner (Urgent Care) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EBE5DF',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#EF4444',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  24/7 TRIAGE LINE
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  color: '#DC2626',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Trauma Unit
                </span>
              </div>

              <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#160F0C', margin: '0 0 4px 0' }}>
                Pet Maya Urgent Care
              </h4>
              <p style={{ fontSize: '11px', color: '#675C58', lineHeight: 1.45, margin: '0 0 14px 0' }}>
                Instant clinician video dispatch & physical rescue medic.
              </p>

              <a
                href="tel:080016107386292"
                onClick={() => showToast('Connecting to 24/7 Trauma Hotline...', 'info')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '9999px',
                  backgroundColor: '#7C2D12',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <Phone size={13} /> +880 1610 PETMAYA
              </a>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────────────
              CENTER COLUMN: Live Feed, Amber Alert, Composer & Posts
              ──────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Radar & Mesh Sub-header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#3E7B84'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Radar Active • Dhaka Mesh: Gulshan & Banani Zone</span>
              </div>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Radio size={12} /> 1,240 GUARDIANS ONLINE
                <Radio size={12} /> {communityPosts.length > 0 ? `${(communityPosts.length * 8 + 200).toLocaleString()}` : '1,200+'} GUARDIANS ONLINE
              </div>
            </div>

            {/* Active Amber Alert Banner */}
            {showAmberAlert && activeAmberAlert && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1.5px solid #F87171',
                padding: '18px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)',
                position: 'relative'
              }}>
                {/* Header Line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertTriangle size={11} /> ACTIVE AMBER ALERT
                    </span>
                    <span style={{ fontSize: '11px', color: '#8C827A' }}>• {activeAmberAlert.reportedTime || 'Active Broadcast'}</span>
                  </div>

                  <button
                    onClick={() => setShowAmberAlert(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
                    title="Dismiss Banner"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body Row: Photo + Info */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  {activeAmberAlert.imageUrl && (
                    <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                      <img
                        src={activeAmberAlert.imageUrl}
                        alt={`Missing ${activeAmberAlert.petName || 'Companion'}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '2px',
                        backgroundColor: 'rgba(220, 38, 38, 0.9)',
                        color: '#FFFFFF',
                        fontSize: '8px',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '3px'
                      }}>
                        {(activeAmberAlert.petName || 'COMPANION').toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>Missing: {activeAmberAlert.petName || 'Companion'}</span>
                      {activeAmberAlert.breed && <span style={{ fontSize: '11.5px', color: '#707973' }}>{activeAmberAlert.breed}</span>}
                      {activeAmberAlert.reward && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {activeAmberAlert.reward}
                        </span>
                      )}
                    </div>

                    {activeAmberAlert.location && (
                      <div style={{ fontSize: '11.5px', color: '#675C58', marginTop: '3px' }}>
                        📍 <strong>Last seen:</strong> {activeAmberAlert.location}
                      </div>
                    )}
                    <div style={{ fontSize: '10.5px', color: '#8C827A', fontFamily: 'monospace', marginTop: '2px' }}>
                      {activeAmberAlert.tagId ? `BLE Tag: ${activeAmberAlert.tagId}` : ''} {activeAmberAlert.microchip ? `• Microchip: #${activeAmberAlert.microchip}` : ''}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowReportSightingModal(true)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '9999px',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🚨 Report Sighting
                  </button>

                  <button
                    onClick={() => setShowContactGuardianModal(true)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '9999px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D6CEC7',
                      color: '#160F0C',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💬 Contact Guardian
                  </button>

                  <button
                    onClick={async () => {
                      if (resolveAmberAlert && activeAmberAlert.id) {
                        try {
                          await resolveAmberAlert(activeAmberAlert.id);
                        } catch (e) {
                          console.error(e);
                        }
                      }
                      showToast(`🎉 ${activeAmberAlert.petName || 'Companion'} marked as safely reunited!`, 'success');
                      setShowAmberAlert(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8C827A',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    Mark Reunited
                  </button>
                </div>
              </div>
            )}

            {/* Compose Post Box */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EBE5DF',
              padding: '16px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <UserAvatar user={currentUser} size={38} />
                </div>

                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`What's on your pet's mind, ${currentUser?.name || currentUser?.displayName || 'Guardian'}? Share a recovery update or moment...`}
                  rows={2}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    color: '#160F0C'
                  }}
                />
              </div>

              {/* Compose Actions Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #F5EFEB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#675C58' }}>
                  <label style={{
                    background: 'none',
                    border: 'none',
                    color: postImageUrl ? '#047857' : '#675C58',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: postImageUrl ? 700 : 500
                  }}>
                    <Camera size={15} color={postImageUrl ? '#047857' : '#3E7B84'} /> {postImageUrl ? 'Photo Attached ✓' : 'Photo/Video'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && uploadImageFile) {
                          try {
                            showToast('Uploading photo to mesh...', 'info');
                            const url = await uploadImageFile(file, 'community');
                            setPostImageUrl(url);
                            showToast('Photo attached to moment!', 'success');
                          } catch (err) {
                            showToast('Upload failed: ' + err.message, 'error');
                          }
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const names = (pets || []).map(p => p.name).filter(Boolean);
                      if (names.length === 0) {
                        showToast('No companions registered yet', 'info');
                        return;
                      }
                      const currentIdx = names.indexOf(taggedPetName);
                      const nextName = names[(currentIdx + 1) % names.length];
                      setTaggedPetName(nextName);
                      showToast(`Tagged companion: ${nextName}`, 'info');
                    }}
                    style={{ background: 'none', border: 'none', color: '#675C58', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🐾 Tag: <strong>{taggedPetName}</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cats = ['all', 'recovery', 'nutrition', 'social'];
                      const next = cats[(cats.indexOf(activeCategory) + 1) % cats.length];
                      setActiveCategory(next);
                      showToast(`Category switched to: ${next}`, 'info');
                    }}
                    style={{ background: 'none', border: 'none', color: '#675C58', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🏷 Category: {activeCategory}
                  </button>
                </div>

                <button
                  onClick={handlePublishPost}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    backgroundColor: '#3E7B84',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Publish Moment ➔
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px'
            }}>
              {[
                { id: 'all', label: 'All Moments' },
                { id: 'recovery', label: 'Medical Recovery & Triumphs' },
                { id: 'nutrition', label: 'Nutrition & GI Transitions' },
                { id: 'social', label: 'Puppyhood & Social' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  style={{
                    backgroundColor: activeCategory === tab.id ? '#160F0C' : '#FFFFFF',
                    color: activeCategory === tab.id ? '#FFFFFF' : '#675C58',
                    border: activeCategory === tab.id ? 'none' : '1px solid #EBE5DF',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dynamic Community Posts from Firestore */}
            {communityPosts.map(post => {
              const pId = post.postId || post.id;
              const hasLiked = post.likedByMe || (post.likedByUserIds && currentUser && post.likedByUserIds.includes(currentUser.uid));
              const likes = post.likesCount || (post.likedBy ? post.likedBy.length : 0) || 0;
              return (
                <div key={pId} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid #EBE5DF',
                  padding: '22px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  marginBottom: '20px'
                }}>
                  {/* Author Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <UserAvatar photoUrl={post.userPhoto} size={42} alt={post.userName || 'Member'} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#160F0C' }}>{post.userName || 'Dhaka Guardian'}</span>
                          <span style={{
                            backgroundColor: 'rgba(62, 123, 132, 0.12)',
                            color: '#3E7B84',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {post.petName || 'Companion'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#8C827A' }}>
                          {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : 'Just now'} • Verified Mesh Member
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <p style={{ fontSize: '13.5px', color: '#160F0C', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <div style={{ marginBottom: '14px', borderRadius: '12px', overflow: 'hidden', maxHeight: '380px' }}>
                      <img src={post.imageUrl} alt="Post media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* Actions & Reactions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid #F5EFEB',
                    fontSize: '12px',
                    color: '#675C58'
                  }}>
                    <button
                      onClick={() => {
                        if (togglePostReaction) togglePostReaction(pId, 'Like');
                        showToast('Reaction updated', 'success');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: hasLiked ? '#EF4444' : '#675C58',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      <Heart size={15} fill={hasLiked ? '#EF4444' : 'none'} color={hasLiked ? '#EF4444' : '#675C58'} /> {likes}
                    </button>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageCircle size={14} /> {post.commentsCount || 0} comments
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty state when no dynamic community posts exist */}
            {(!communityPosts || communityPosts.length === 0) && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px dashed #D6CEC7',
                padding: '48px 24px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌿</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#160F0C', margin: '0 0 6px 0' }}>Community Mesh Feed is Quiet</h3>
                <p style={{ fontSize: '13px', color: '#675C58', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Be the first guardian in Dhaka to share a clinical recovery milestone, nutritional routine, or neighborhood alert.
                </p>
              </div>
            )}

            {/* ── POST 3: Weekend Social Event (Lake Park West Lawn Stride) ── */}
            {(activeCategory === 'all' || activeCategory === 'social') && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #EBE5DF',
                padding: '22px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                {/* Event Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(62,123,132,0.12)',
                      color: '#3E7B84',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Users size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#160F0C' }}>
                        Banani Canine Social & Leash-Walking Circle
                      </div>
                      <div style={{ fontSize: '11px', color: '#707973' }}>
                        Coordinated by Farhan Q. • Fear-Free Certified Stride
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    backgroundColor: '#E0F2FE',
                    color: '#0284C7',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    WEEKEND EVENT
                  </span>
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#160F0C',
                  margin: '0 0 6px 0'
                }}>
                  Quiet Mornings: Lake Park West Lawn Stride (Leash Only)
                </h3>

                <p style={{ fontSize: '12.5px', color: '#675C58', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  A serene 45-minute decompression stroll for recovering, senior, or anxious companions. 10-meter personal space boundaries strictly maintained. First-aid cooling pads and hydration packs supplied on-site.
                </p>

                {/* Event Schedule & RSVP Button Box */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FAF7F5',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid #EFE9E4'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: '#675C58' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} color="#3E7B84" />
                      <strong>Saturday 07:00 AM - 07:45 AM</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#3E7B84" />
                      <span>Banani Lake Park West Gate (opp. Road 11)</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#047857', fontWeight: 600, marginTop: '2px' }}>
                      18 verified guardians attending with companions
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEventRsvpd(prev => !prev);
                      showToast(eventRsvpd ? `RSVP cancelled for ${primaryPetName}'s spot` : `🎉 ${primaryPetName}'s spot reserved for Lake Park West Stride!`, 'success');
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      backgroundColor: eventRsvpd ? '#047857' : '#160F0C',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {eventRsvpd ? `✓ ${primaryPetName} Confirmed` : `🖤 RSVP ${primaryPetName}'s Spot`}
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* ────────────────────────────────────────────────────────────
              RIGHT COLUMN: Trending, Verified Directory & Broadcast Tool
              ──────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 1. Trending in Dhaka Mesh */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EBE5DF',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#160F0C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  TRENDING IN DHAKA MESH
                </span>
                <TrendingUp size={15} color="#3E7B84" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                {(() => {
                  // Extract hashtags from post content and build frequency map
                  const tagFreq = {};
                  communityPosts.forEach(post => {
                    const matches = ((post.content || '') + ' ' + (post.tags || []).join(' ')).match(/#[\w]+/g) || [];
                    matches.forEach(tag => {
                      const normalized = tag.toLowerCase();
                      tagFreq[normalized] = (tagFreq[normalized] || 0) + 1;
                    });
                    // Also count post types as implicit tags
                    if (post.postType && post.postType !== 'general') {
                      const typeTag = `#${post.postType}`;
                      tagFreq[typeTag] = (tagFreq[typeTag] || 0) + 1;
                    }
                  });
                  const dynamicTags = Object.entries(tagFreq)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([tag, count]) => ({ tag, count: `${count} post${count !== 1 ? 's' : ''}` }));
                  // Fallback placeholders if DB has no hashtag data
                  const displayTags = dynamicTags.length >= 3 ? dynamicTags : [
                    { tag: '#PetMayaCommunity', count: `${communityPosts.length} posts` },
                    { tag: '#DhakaMesh', count: 'Active' },
                    { tag: '#PetHealth', count: 'Trending' }
                  ].slice(0, 3);
                  return displayTags.map(item => (
                    <div
                      key={item.tag}
                      onClick={() => showToast(`Filtered by ${item.tag}`, 'info')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        padding: '3px 0'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#160F0C' }}>{item.tag}</span>
                      <span style={{ fontSize: '11px', color: '#8C827A' }}>{item.count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* 2. Verified Clinicians & Parents */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EBE5DF',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#160F0C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  VERIFIED CLINICIANS & PARENTS
                </span>
                <span style={{ fontSize: '10px', color: '#3E7B84', fontWeight: 700 }}>1-Click</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vets.slice(0, 3).length > 0
                  ? vets.slice(0, 3).map(vet => {
                      const initials = (vet.name || '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <div
                          key={vet.id}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {vet.photo ? (
                              <img
                                src={vet.photo}
                                alt={vet.name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#FAF7F5',
                                border: '1px solid #E5DED6',
                                color: '#3E7B84',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                                {vet.name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#8C827A' }}>
                                {vet.qualification || vet.tag || ''}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleFollow(vet.name)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              backgroundColor: followedClinicians[vet.name] ? '#047857' : '#FAF7F5',
                              color: followedClinicians[vet.name] ? '#FFFFFF' : '#160F0C',
                              border: '1px solid #D6CEC7',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {followedClinicians[vet.name] ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      );
                    })
                  : [0, 1, 2].map(i => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EFEFEA', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ height: '10px', width: '80%', borderRadius: '4px', backgroundColor: '#EFEFEA', marginBottom: '4px' }} />
                          <div style={{ height: '8px', width: '60%', borderRadius: '4px', backgroundColor: '#EFEFEA' }} />
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>

            {/* 3. Emergency Broadcast Tool */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EBE5DF',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '9.5px',
                fontWeight: 800,
                color: '#EF4444',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                <AlertTriangle size={12} /> EMERGENCY BROADCAST TOOL
              </div>

              <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#160F0C', margin: '0 0 6px 0' }}>
                Instant Pet Amber Mobilization
              </h4>

              <p style={{ fontSize: '11.5px', color: '#675C58', lineHeight: 1.45, margin: '0 0 14px 0' }}>
                If your pet breaches geofence, trigger an instant high-priority radius broadcast to all 1,240 neighborhood guardians.
                If your pet breaches geofence, trigger an instant high-priority radius broadcast to all nearby verified neighborhood guardians.
              </p>

              <button
                onClick={() => setShowAmberTriggerModal(true)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #F87171',
                  color: '#DC2626',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                🚨 Test Amber Protocol Trigger
              </button>
            </div>

            {/* 4. Clinical Moderation Pledge */}
            <div style={{
              backgroundColor: '#FAF7F5',
              borderRadius: '16px',
              border: '1px solid #EFE9E4',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <ShieldCheck size={16} color="#3E7B84" />
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#3E7B84', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  CLINICAL MODERATION PLEDGE
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#675C58', lineHeight: 1.45, margin: 0 }}>
                All medical notes, dosages, and recovery discussions are verified by AAHA-certified resident clinicians at Pet Maya. No unsanctioned pharmacology.
              </p>
            </div>

          </div>

        </div>

        {/* ── 4. Trust Pillars Bar ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          padding: '20px 24px',
          backgroundColor: '#FAF7F5',
          borderRadius: '16px',
          border: '1px solid #E5DED6',
          marginTop: '48px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#3E7B84'
        }}>
          <div>✓ VERIFIED PET PARENTS ONLY</div>
          <div>🛡 ZERO COMMERCIAL AD INFILTRATION</div>
          <div>🔒 HIPAA-GRADE PET HEALTH PRIVACY</div>
          <div>🚑 24/7 CLINICAL EMERGENCY ON-CALL</div>
        </div>

      </main>

      {/* ════════════════════════════════════════════════════════════════
          5. REFERENCE-EXACT EDITORIAL FOOTER
          ════════════════════════════════════════════════════════════════ */}
      <footer style={{
        backgroundColor: '#FDF8F5',
        borderTop: '1px solid rgba(222, 217, 214, 0.8)',
        padding: '48px 24px 28px',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          
          {/* Main Footer Directory Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr',
            gap: '36px',
            paddingBottom: '36px',
            borderBottom: '1px solid #EBE5DF'
          }} className="community-footer-grid">

            {/* Col 1: Brand & Philosophy */}
            <div>
              <div style={{
                fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '2px'
              }}>
                PET MAYA
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#45848D', marginBottom: '8px' }}>
                Veterinary Medicine & Clinical Apothecary
              </div>
              <p style={{ fontSize: '12px', color: '#675C58', lineHeight: 1.55, margin: '0 0 14px 0', maxWidth: '320px' }}>
                Elevating companion longevity through quiet clinical rigor, continuous bio-telemetry, and bespoke pharmaceutical care designed for the modern home sanctuary.
              </p>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#047857',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={13} /> AAHA CERTIFIED CLINICAL PARTNER • FEAR FREE CARE
              </div>
            </div>

            {/* Col 2: Clinical Ecosystem */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '14px'
              }}>
                CLINICAL ECOSYSTEM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <a onClick={() => handleRoute('ai')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Diagnostic AI Triage</a>
                <a onClick={() => handleRoute('specialists')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Veterinary Specialists</a>
                <a onClick={() => handleRoute('digital-pet-passport')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Health Vault Records</a>
                <a onClick={() => handleRoute('shop')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Botanical Apothecary</a>
                <a onClick={() => handleRoute('pet-gps')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>GPS Vital Telemetry</a>
              </div>
            </div>

            {/* Col 3: Platform & Practice */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '14px'
              }}>
                PLATFORM & PRACTICE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <a onClick={() => handleRoute('profile')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Guardian Portal</a>
                <a onClick={() => handleRoute('community')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Guardian Circle</a>
                <a onClick={() => handleRoute('blog')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Clinical Journal</a>
                <a onClick={() => handleRoute('about')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Pharmacy Standards</a>
                <a onClick={() => handleRoute('ai')} style={{ color: '#675C58', textDecoration: 'none', cursor: 'pointer' }}>Urgent Care Protocol</a>
              </div>
            </div>

            {/* Col 4: Clinical Bulletins & Protocols */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#160F0C',
                marginBottom: '8px'
              }}>
                CLINICAL BULLETINS & PROTOCOLS
              </div>
              <p style={{ fontSize: '12px', color: '#675C58', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                Peer-reviewed veterinary wellness insights, seasonal allergen dispatches, and botanical formulations.
              </p>
              <form onSubmit={handleSubscribeNewsletter} style={{ display: 'flex', gap: '6px', maxWidth: '320px' }}>
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="guardian@sanctuary.com"
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    border: '1px solid #D6CEC7',
                    fontSize: '11.5px',
                    outline: 'none',
                    backgroundColor: '#FFFFFF'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>

          </div>

          {/* Legal Bottom Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingTop: '20px',
            fontSize: '11.5px',
            color: '#8C827A'
          }}>
            <div>
              © 2026 Pet Maya Veterinary Medicine Corp. AAHA Accredited Platform. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span onClick={() => handleRoute('privacy')} style={{ cursor: 'pointer' }}>Bio-Ethics Policy</span>
              <span>•</span>
              <span onClick={() => handleRoute('terms')} style={{ cursor: 'pointer' }}>Privacy & HIPAA-V</span>
              <span>•</span>
              <span onClick={() => handleRoute('terms')} style={{ cursor: 'pointer' }}>Prescription Verification</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          6. MODALS
          ════════════════════════════════════════════════════════════════ */}

      {/* Report Sighting Modal */}
      {showReportSightingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowReportSightingModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <AlertTriangle size={24} color="#DC2626" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#160F0C' }}>
                  Report Sighting for {activeAmberAlert?.petName || 'Missing Companion'}
                </h3>
                <div style={{ fontSize: '11.5px', color: '#707973' }}>
                  {activeAmberAlert?.tagId ? `BLE Tag: ${activeAmberAlert.tagId}` : 'BLE Broadcast Active'} {activeAmberAlert?.microchip ? `• Microchip: #${activeAmberAlert.microchip}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <input
                type="text"
                value={sightingLocation}
                onChange={(e) => setSightingLocation(e.target.value)}
                placeholder="Exact location (e.g. Gulshan Lake Park North gate near café)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', fontSize: '12.5px', boxSizing: 'border-box' }}
              />
              <textarea
                placeholder="Condition observed (e.g. running towards bridge, wearing collar)..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', fontSize: '12.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast(`🚨 Sighting dispatched to ${activeAmberAlert?.petName || 'companion'}'s guardian with high-priority push!`, 'success');
                  setShowReportSightingModal(false);
                  setSightingLocation('');
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '9999px', backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Send High-Priority Sighting
              </button>
              <button
                onClick={() => setShowReportSightingModal(false)}
                style={{ padding: '11px 20px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Guardian Modal */}
      {showContactGuardianModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowContactGuardianModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              Contact {activeAmberAlert?.petName || 'Companion'}'s Guardian
            </h3>
            <div style={{ fontSize: '12px', color: '#707973', marginBottom: '16px' }}>
              Direct encrypted cellular link • {activeAmberAlert?.location || 'Local Zone'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <a
                href={`tel:${activeAmberAlert?.phone || activeAmberAlert?.contactPhone || '01700000000'}`}
                onClick={() => {
                  showToast(`Connecting to ${activeAmberAlert?.petName || 'companion'}'s guardian...`, 'info');
                  setShowContactGuardianModal(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '9999px',
                  backgroundColor: '#160F0C',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                <Phone size={14} /> Call Guardian ({activeAmberAlert?.phone || activeAmberAlert?.contactPhone || '+880 1700-000000'})
              </a>
              <button
                onClick={() => {
                  showToast('Direct SMS notification sent to guardian', 'success');
                  setShowContactGuardianModal(false);
                }}
                style={{ padding: '11px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, fontSize: '12.5px', cursor: 'pointer' }}
              >
                Send Direct SMS Ping
              </button>
            </div>

            <button
              onClick={() => setShowContactGuardianModal(false)}
              style={{ width: '100%', padding: '10px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Amber Trigger Test Modal */}
      {showAmberTriggerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAmberTriggerModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C827A' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#160F0C' }}>
              Test Pet Amber Protocol
            </h3>
            <p style={{ fontSize: '12px', color: '#707973', margin: '0 0 16px 0' }}>
              Simulates a geofence breach broadcast for {primaryPetName} to all local active neighborhood mesh nodes.
            </p>

            <div style={{ backgroundColor: '#FAF7F5', padding: '14px', borderRadius: '12px', border: '1px solid #EFE9E4', fontSize: '12px', color: '#675C58', marginBottom: '18px' }}>
              <div><strong>Target Companion:</strong> {primaryPetName} {pets[0]?.breed ? `(${pets[0].breed})` : ''}</div>
              <div><strong>Collar:</strong> {devices[0]?.name || 'Maya Halo™ Collar'} ({devices[0]?.id || devices[0]?.serial || '#HL-ACTIVE'})</div>
              <div><strong>Broadcast Radius:</strong> 3.5 km (Active Neighborhood Mesh)</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('🚨 Test Amber Broadcast transmitted to 1,240 local nodes!', 'success');
                  setShowAmberTriggerModal(false);
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '9999px', backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Trigger Test Broadcast
              </button>
              <button
                onClick={() => setShowAmberTriggerModal(false)}
                style={{ padding: '11px 20px', borderRadius: '9999px', backgroundColor: '#FAF7F5', border: '1px solid #D6CEC7', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for responsiveness */}
      <style>{`
        @media (max-width: 1080px) {
          .community-main-grid {
            grid-template-columns: 1fr !important;
          }
          .community-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>

    </div>
  );
}
