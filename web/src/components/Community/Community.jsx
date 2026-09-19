import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import EditorialNavbar from '../Navigation/EditorialNavbar';
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
  const { showToast, openModal, cart } = useApp ? useApp() : { showToast: () => {}, openModal: () => {}, cart: [] };
  const { currentUser } = useAuth ? useAuth() : { currentUser: null };

  // Category filter state
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'recovery', 'nutrition', 'social'
  const [activeNavRail, setActiveNavRail] = useState('all'); // 'all', 'photos', 'recovery', 'rescue', 'amber', 'bookmarks'

  // Post composer state
  const [postContent, setPostContent] = useState('');
  const [showAmberAlert, setShowAmberAlert] = useState(true);
  const [showReportSightingModal, setShowReportSightingModal] = useState(false);
  const [showContactGuardianModal, setShowContactGuardianModal] = useState(false);
  const [showAmberTriggerModal, setShowAmberTriggerModal] = useState(false);
  const [sightingLocation, setSightingLocation] = useState('');

  // Post interactive reactions
  const [post1Liked, setPost1Liked] = useState(false);
  const [post1LikeCount, setPost1LikeCount] = useState(84);
  const [post1Saved, setPost1Saved] = useState(false);

  const [post2Liked, setPost2Liked] = useState(false);
  const [post2LikeCount, setPost2LikeCount] = useState(42);
  const [post2Saved, setPost2Saved] = useState(false);
  const [questionInput, setQuestionInput] = useState('');

  // Event RSVP state
  const [eventRsvpd, setEventRsvpd] = useState(false);

  // Followed clinicians state
  const [followedClinicians, setFollowedClinicians] = useState({});

  // Footer newsletter
  const [footerEmail, setFooterEmail] = useState('');

  const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

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

  const handlePublishPost = (e) => {
    e.preventDefault();
    if (!postContent.trim()) {
      showToast('Please enter a thought or recovery update to publish.', 'error');
      return;
    }
    showToast('✨ Moment published to Dhaka Mesh Community!', 'success');
    setPostContent('');
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
    showToast('Clinical question submitted to Sarah Ahmed & verified clinicians!', 'success');
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
                  <img
                    src={currentUser?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'}
                    alt="Rehan Chowdhury"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#160F0C' }}>
                      {currentUser?.name || 'Rehan Chowdhury'}
                    </span>
                    <CheckCircle2 size={14} color="#047857" />
                  </div>
                  <div style={{ fontSize: '11px', color: '#707973' }}>
                    Banani Pod #02
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#3E7B84', fontWeight: 600, marginTop: '2px' }}>
                    🐾 2 Registered Pets (Milo & Cleo)
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
                    480 <span style={{ fontSize: '10px', fontWeight: 500 }}>pts</span>
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
                    +98 Score
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#8C827A' }}>
                    12 Helpful Acts
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
                { id: 'all', label: 'All Stories', badge: '342', icon: Layers },
                { id: 'photos', label: 'Photo Moments', badge: '128', icon: Camera },
                { id: 'recovery', label: 'Health & Recovery', badge: 'TPLO Hub', badgeColor: '#3E7B84', badgeBg: 'rgba(62,123,132,0.12)', icon: Stethoscope },
                { id: 'rescue', label: 'Rescue & Adoption', badge: '14', icon: Users },
                { id: 'amber', label: 'Lost & Found Alerts', badge: '1 Active', badgeColor: '#EF4444', badgeBg: 'rgba(239,68,68,0.1)', icon: AlertTriangle },
                { id: 'bookmarks', label: 'Saved Bookmarks', badge: '9', icon: Bookmark }
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
              </div>
            </div>

            {/* Active Amber Alert Banner */}
            {showAmberAlert && (
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
                    <span style={{ fontSize: '11px', color: '#8C827A' }}>• Missing &lt; 30m ago</span>
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
                  <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src="https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=160&q=80"
                      alt="Missing Beagle Copper"
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
                      COPPER
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#160F0C' }}>Missing: Copper</span>
                      <span style={{ fontSize: '11.5px', color: '#707973' }}>Beagle, 2.5 yrs (Male)</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        ৳ 5,000 Reward
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#675C58', marginTop: '3px' }}>
                      📍 <strong>Last seen:</strong> Gulshan Lake Park, Dhaka (near Road 11 bridge)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#8C827A', fontFamily: 'monospace', marginTop: '2px' }}>
                      BLE Tag: <strong>PM-BLE-4109</strong> • Microchip: #985141009927341
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
                    onClick={() => {
                      showToast('🎉 Copper marked as safely reunited with guardian!', 'success');
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
                  <img
                    src={currentUser?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'}
                    alt="User Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's on your pet's mind, Rehan? Share a recovery update or moment..."
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
                  <button
                    onClick={() => showToast('Photo / Video upload opened', 'info')}
                    style={{ background: 'none', border: 'none', color: '#675C58', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    <Camera size={15} color="#3E7B84" /> Photo/Video
                  </button>
                  <button
                    onClick={() => showToast('Tagged Milo (Golden Retriever)', 'info')}
                    style={{ background: 'none', border: 'none', color: '#675C58', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🐾 Tag Pet (Milo / Cleo)
                  </button>
                  <button
                    onClick={() => showToast('Category selector opened', 'info')}
                    style={{ background: 'none', border: 'none', color: '#675C58', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🏷 Category
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

            {/* ── POST 1: Milo's 8-Week Post-TPLO Rehabilitation ── */}
            {(activeCategory === 'all' || activeCategory === 'recovery') && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #EBE5DF',
                padding: '22px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                {/* Author Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        alt="Tanzim R."
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#160F0C' }}>Tanzim R.</span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(62,123,132,0.12)',
                          color: '#3E7B84',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          VERIFIED GUARDIAN
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#707973' }}>
                        Parent to Milo (Golden Retriever, 4 yrs) • 3 hours ago
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#FAF7F5',
                    color: '#675C58',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #EFE9E4'
                  }}>
                    Health & Recovery
                  </span>
                </div>

                {/* Title & Body */}
                <h3 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#160F0C',
                  margin: '0 0 8px 0',
                  lineHeight: 1.3
                }}>
                  Milo's 8-Week Post-TPLO Rehabilitation & Cold-Chain Recovery
                </h3>

                <p style={{ fontSize: '13px', color: '#675C58', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  We reached week 8 post-tibial plateau leveling osteotomy! From week 2 crate confinement to 20-minute daily underwater treadmill hydrotherapy at Pet Maya's Banani suite, his passive range of motion is back to 92%. We strictly sustained the botanical Boswellia + cold-chain Omega regimen prescribed by the clinical team.
                </p>

                {/* 2-Column Media & Clinical Biometrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1fr',
                  gap: '14px',
                  backgroundColor: '#FAF7F5',
                  borderRadius: '14px',
                  padding: '12px',
                  border: '1px solid #EFE9E4',
                  marginBottom: '16px'
                }}>
                  {/* Photo with Overlay */}
                  <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: '160px' }}>
                    <img
                      src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80"
                      alt="Milo Hydro Pacing"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(22, 15, 12, 0.85)',
                      color: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      Hydro Pacing: Wk 8 Cleared
                    </span>
                  </div>

                  {/* Clinical Biometrics Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#160F0C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          CLINICAL BIOMETRICS
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#047857', fontWeight: 700 }}>
                          ✔ Verified Log
                        </span>
                      </div>

                      {/* Bar 1 */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '2px' }}>
                          <span style={{ color: '#675C58' }}>Stifle Gait Resolution</span>
                          <strong style={{ color: '#3E7B84' }}>92%</strong>
                        </div>
                        <div style={{ width: '100%', height: '5px', backgroundColor: '#EBE5DF', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '92%', height: '100%', backgroundColor: '#3E7B84' }} />
                        </div>
                      </div>

                      {/* Bar 2 */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '2px' }}>
                          <span style={{ color: '#675C58' }}>Hindlimb Symmetrical Loading</span>
                          <strong style={{ color: '#3E7B84' }}>88%</strong>
                        </div>
                        <div style={{ width: '100%', height: '5px', backgroundColor: '#EBE5DF', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '88%', height: '100%', backgroundColor: '#3E7B84' }} />
                        </div>
                      </div>
                    </div>

                    {/* Attending Vet Clinician Note */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '8px',
                      border: '1px solid #EBE5DF',
                      fontSize: '10.5px',
                      color: '#4B5563'
                    }}>
                      <div style={{ fontWeight: 700, color: '#3E7B84', marginBottom: '2px' }}>
                        🩺 Attending Vet Clinician Note
                      </div>
                      "Stifle effusion completely quiescent. Cleared for gradual off-leash lawn walking next fortnight." — <em>Dr. Nazmul Huda (Orthopedic Surgery)</em>
                    </div>
                  </div>
                </div>

                {/* Reaction & Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid #F5EFEB',
                  fontSize: '12px',
                  color: '#675C58',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => {
                        setPost1Liked(prev => !prev);
                        setPost1LikeCount(c => post1Liked ? c - 1 : c + 1);
                      }}
                      style={{ background: 'none', border: 'none', color: post1Liked ? '#EF4444' : '#675C58', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <Heart size={15} fill={post1Liked ? '#EF4444' : 'none'} color={post1Liked ? '#EF4444' : '#675C58'} /> {post1LikeCount}
                    </button>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🐾 23
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🍃 15
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageCircle size={14} /> 19 comments
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setPost1Saved(prev => !prev);
                        showToast(post1Saved ? 'Removed from bookmarks' : 'Saved to bookmarks', 'info');
                      }}
                      style={{ background: 'none', border: 'none', color: post1Saved ? '#3E7B84' : '#8C827A', cursor: 'pointer' }}
                    >
                      <Bookmark size={15} fill={post1Saved ? '#3E7B84' : 'none'} />
                    </button>
                    <button
                      onClick={() => showToast('Moment link copied to clipboard', 'info')}
                      style={{ background: 'none', border: 'none', color: '#8C827A', cursor: 'pointer' }}
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Verified Clinician Comment Box */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid #EFE9E4',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#3E7B84',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    NH
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#160F0C' }}>Dr. Nazmul Huda, AO VET</span>
                      <span style={{ fontSize: '10px', color: '#8C827A' }}>2h ago</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#4B5563', margin: 0, lineHeight: 1.4 }}>
                      "Please sustain the cold pack application for 10 mins post-underwater pacing sessions through day 65."
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ── POST 2: Transitioning Bella to GI Low Fat Steamed Puree ── */}
            {(activeCategory === 'all' || activeCategory === 'nutrition') && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #EBE5DF',
                padding: '22px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                {/* Author Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
                        alt="Sarah Ahmed"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#160F0C' }}>Sarah Ahmed</span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(62,123,132,0.12)',
                          color: '#3E7B84',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          VERIFIED GUARDIAN
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#707973' }}>
                        Parent to Bella (Persian Cat, 3 yrs) • 6 hours ago
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#FAF7F5',
                    color: '#675C58',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #EFE9E4'
                  }}>
                    Nutrition & GI
                  </span>
                </div>

                {/* Title & Body */}
                <h3 style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#160F0C',
                  margin: '0 0 8px 0',
                  lineHeight: 1.3
                }}>
                  Transitioning Bella from Commercial Kibble to GI Low Fat Steamed Puree
                </h3>

                <p style={{ fontSize: '13px', color: '#675C58', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  For any fellow Persian parents wrestling with recurring IBD flare-ups: here is our 14-day stool consistency scorecard following the Pet Maya GI formulation combined with pumpkin-pectin botanical pastes. Noticeable drop in vomiting episodes within 72 hours.
                </p>

                {/* Purina Bristol-V Stool Scale Improvement Scorecard */}
                <div style={{
                  backgroundColor: '#FAF7F5',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1px solid #EFE9E4',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#160F0C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      PURINA BRISTOL-V STOOL SCALE IMPROVEMENT
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16,185,129,0.12)',
                      color: '#047857',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Target: Grade 2 (Optimal)
                    </span>
                  </div>

                  {/* 7 Stool Scale Score Chips */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '6px',
                    textAlign: 'center'
                  }}>
                    {[
                      { day: 'D1', val: '6', label: 'Loose', color: '#DC2626', bg: '#FEE2E2' },
                      { day: 'D3', val: '5', label: 'Soft', color: '#D97706', bg: '#FEF3C7' },
                      { day: 'D6', val: '4', label: 'Mixed', color: '#6B7280', bg: '#F3F4F6' },
                      { day: 'D7', val: '3', label: 'Formed', color: '#6B7280', bg: '#F3F4F6' },
                      { day: 'D9', val: '3', label: 'Formed', color: '#6B7280', bg: '#F3F4F6' },
                      { day: 'D11', val: '2', label: 'Ideal', color: '#047857', bg: 'rgba(16,185,129,0.15)', active: true },
                      { day: 'D14', val: '2', label: 'Stable', color: '#047857', bg: 'rgba(16,185,129,0.15)', active: true }
                    ].map(chip => (
                      <div
                        key={chip.day}
                        style={{
                          backgroundColor: chip.bg,
                          padding: '6px 4px',
                          borderRadius: '8px',
                          border: chip.active ? '1.5px solid #10B981' : '1px solid #E5E7EB'
                        }}
                      >
                        <div style={{ fontSize: '9px', color: '#8C827A', fontWeight: 600 }}>{chip.day}</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: chip.color }}>{chip.val}</div>
                        <div style={{ fontSize: '8.5px', color: chip.color, fontWeight: 700 }}>{chip.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reaction & Action Bar with Clinical Question Form */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid #F5EFEB',
                  fontSize: '12px',
                  color: '#675C58',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        setPost2Liked(prev => !prev);
                        setPost2LikeCount(c => post2Liked ? c - 1 : c + 1);
                      }}
                      style={{ background: 'none', border: 'none', color: post2Liked ? '#EF4444' : '#675C58', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <Heart size={15} fill={post2Liked ? '#EF4444' : 'none'} color={post2Liked ? '#EF4444' : '#675C58'} /> {post2LikeCount}
                    </button>
                    <span>💡 18 helpful</span>
                    <span>11 responses</span>
                  </div>

                  <form onSubmit={handleAddQuestion} style={{ display: 'flex', flex: 1, maxWidth: '280px' }}>
                    <input
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="Add clinical question..."
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: '1px solid #D6CEC7',
                        fontSize: '11px',
                        outline: 'none',
                        backgroundColor: '#FAF7F5'
                      }}
                    />
                  </form>

                  <button
                    onClick={() => {
                      setPost2Saved(prev => !prev);
                      showToast(post2Saved ? 'Removed from bookmarks' : 'Saved to bookmarks', 'info');
                    }}
                    style={{ background: 'none', border: 'none', color: post2Saved ? '#3E7B84' : '#8C827A', cursor: 'pointer' }}
                  >
                    <Bookmark size={15} fill={post2Saved ? '#3E7B84' : 'none'} />
                  </button>
                </div>

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
                      showToast(eventRsvpd ? "RSVP cancelled for Milo's spot" : "🎉 Milo's spot reserved for Lake Park West Stride!", 'success');
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
                    {eventRsvpd ? '✓ Milo Confirmed' : "🖤 RSVP Milo's Spot"}
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
                {[
                  { tag: '#TPLORecovery', count: '43 posts' },
                  { tag: '#GutMicrobiome', count: '88 posts' },
                  { tag: '#AmberReunited', count: '19 posts' },
                  { tag: '#FearFreeDhaka', count: '35 posts' },
                  { tag: '#VaccineAwareness', count: '64 posts' }
                ].map(item => (
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
                ))}
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
                {[
                  { initials: 'EV', name: 'Dr. Evelyn Vance, MRCVS', role: 'Head of Internal Med (Cambridge)' },
                  { initials: 'NH', name: 'Dr. Nazmul Huda, AO VET', role: 'Orthopedic & Trauma Specialist' },
                  { initials: 'AK', name: 'Dr. Arman K. Rahman', role: "PharmD • Milo's Nutritionist" }
                ].map(clinician => (
                  <div
                    key={clinician.name}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        {clinician.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#160F0C' }}>
                          {clinician.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#8C827A' }}>
                          {clinician.role}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFollow(clinician.name)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: followedClinicians[clinician.name] ? '#047857' : '#FAF7F5',
                        color: followedClinicians[clinician.name] ? '#FFFFFF' : '#160F0C',
                        border: '1px solid #D6CEC7',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {followedClinicians[clinician.name] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
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
                  Report Sighting for Copper
                </h3>
                <div style={{ fontSize: '11.5px', color: '#707973' }}>
                  BLE Tag: PM-BLE-4109 • Microchip: #985141009927341
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
                placeholder="Condition observed (e.g. running towards bridge, wearing red collar)..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D6CEC7', fontSize: '12.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('🚨 Sighting dispatched to Copper\'s guardian with high-priority push!', 'success');
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
              Contact Copper's Guardian
            </h3>
            <div style={{ fontSize: '12px', color: '#707973', marginBottom: '16px' }}>
              Direct encrypted cellular link • Gulshan Zone
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <a
                href="tel:01711223344"
                onClick={() => {
                  showToast('Connecting to Copper\'s guardian...', 'info');
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
                <Phone size={14} /> Call Guardian (+880 1711-223344)
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
              Simulates a geofence breach broadcast for Milo to all 1,240 active neighborhood mesh nodes.
            </p>

            <div style={{ backgroundColor: '#FAF7F5', padding: '14px', borderRadius: '12px', border: '1px solid #EFE9E4', fontSize: '12px', color: '#675C58', marginBottom: '18px' }}>
              <div><strong>Target Companion:</strong> Milo (Golden Retriever)</div>
              <div><strong>Collar:</strong> Maya Halo™ V3 (#HL-88210)</div>
              <div><strong>Broadcast Radius:</strong> 3.5 km (Banani + Gulshan + Baridhara)</div>
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
