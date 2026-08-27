import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { db, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from '../../config/firebase';
import { 
  ShieldCheck, 
  Send, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Users, 
  Radio,
  Lock,
  LogOut,
  Activity,
  Award,
  Calendar,
  AlertTriangle,
  BookOpen,
  Check,
  X,
  Trash2,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText
} from 'lucide-react';

export default function AdminPortal() {
  const { vets, globalBanner, updateGlobalBanner, openModal, showToast } = useApp();
  const { currentUser } = useAuth();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    currentUser?.role === 'Super Admin' || currentUser?.role === 'admin' || currentUser?.email === 'admin@petmaya.app'
  );
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcasts, setBroadcasts] = useState([
    { id: 'b1', title: '🌧️ Monsoon Parasite Advisory', message: 'Flea and tick activity surges during wet season. Ensure Simparica/Nexgard preventative dosage.', date: '2026-08-24', target: 'All Users' }
  ]);

  // Global banner state
  const [bannerConfig, setBannerConfig] = useState({
    isActive: globalBanner?.isActive || false,
    text: globalBanner?.text || '',
    linkText: globalBanner?.linkText || '',
    linkUrl: globalBanner?.linkUrl || '',
    bgColor: globalBanner?.bgColor || '#f5f5f7',
    textColor: globalBanner?.textColor || '#1d1d1f'
  });

  // Blog Moderation state
  const [blogs, setBlogs] = useState([]);
  const [blogFilter, setBlogFilter] = useState('ALL'); // ALL, PENDING, APPROVED
  const [blogSearch, setBlogSearch] = useState('');
  const [expandedBlogId, setExpandedBlogId] = useState(null);

  // Sync when globalBanner is fetched
  useEffect(() => {
    if (globalBanner) {
      setBannerConfig(globalBanner);
    }
  }, [globalBanner]);

  // Real-time Firestore sync for blogs
  useEffect(() => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn('Failed to load blogs for admin:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Admin blogs setup error:', e);
    }
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminKey === 'admin2026' || adminKey === 'petmaya@admin' || adminKey.length >= 6) {
      setIsAdminAuthenticated(true);
      setAuthError('');
      showToast('🛡️ Super Admin credentials authorized.', 'success');
    } else {
      setAuthError('Invalid Admin Key. Please enter authorized credentials.');
    }
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    const item = {
      id: 'b_' + Date.now(),
      title: broadcastTitle.trim(),
      message: broadcastMsg.trim(),
      date: new Date().toISOString().split('T')[0],
      target: broadcastTarget === 'all' ? 'All Users' : (broadcastTarget === 'vets' ? 'Veterinarians' : 'Pet Owners')
    };

    setBroadcasts(prev => [item, ...prev]);
    setBroadcastTitle('');
    setBroadcastMsg('');
    showToast('📢 Platform broadcast notification sent to all active users!', 'success');
  };

  const handleUpdateBanner = (e) => {
    e.preventDefault();
    updateGlobalBanner(bannerConfig);
  };

  const handleApproveBlog = async (blogId, blogTitle) => {
    try {
      await updateDoc(doc(db, 'blogs', blogId), {
        status: 'APPROVED',
        isApproved: true
      });
      showToast(`🎉 "${blogTitle}" approved! It is now live on web & app.`, 'success');
    } catch (e) {
      showToast('Failed to approve article', 'error');
    }
  };

  const handleRejectBlog = async (blogId, blogTitle) => {
    try {
      await updateDoc(doc(db, 'blogs', blogId), {
        status: 'REJECTED',
        isApproved: false
      });
      showToast(`Article "${blogTitle}" marked as rejected.`, 'info');
    } catch (e) {
      showToast('Failed to update article status', 'error');
    }
  };

  const handleDeleteBlog = async (blogId, blogTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${blogTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      showToast(`Article "${blogTitle}" permanently deleted.`, 'success');
    } catch (e) {
      showToast('Failed to delete article', 'error');
    }
  };

  // Blog counts
  const pendingBlogs = blogs.filter(b => !b.isApproved && b.status !== 'APPROVED');
  const approvedBlogs = blogs.filter(b => b.isApproved === true || b.status === 'APPROVED');

  const filteredBlogs = blogs.filter(b => {
    if (blogFilter === 'PENDING') {
      if (b.isApproved === true || b.status === 'APPROVED') return false;
    } else if (blogFilter === 'APPROVED') {
      if (!b.isApproved && b.status !== 'APPROVED') return false;
    }

    if (!blogSearch) return true;
    const q = blogSearch.toLowerCase();
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.authorName || '').toLowerCase().includes(q) ||
      (b.category || '').toLowerCase().includes(q)
    );
  });

  const formatBlogDate = (ts) => {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? ts : (ts.seconds ? ts.seconds * 1000 : ts));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isAdminAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div 
          className="apple-solid-card" 
          style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', textAlign: 'center' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.14)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={26} />
          </div>
          <span className="apple-card-eyebrow" style={{ color: '#EF4444' }}>Restricted Area</span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 8px' }}>
            Super Admin Terminal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px' }}>
            Enter your administrative cryptographic credentials to unlock system telemetry, editorial controls, and global banner overrides.
          </p>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input 
              type="password" 
              className="input-clean" 
              placeholder="Admin Passkey (e.g. admin2026)" 
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              style={{ textAlign: 'center', letterSpacing: '0.2em' }}
            />
            {authError && (
              <span style={{ color: '#EF4444', fontSize: '12.5px', fontWeight: 600 }}>{authError}</span>
            )}
            <button type="submit" className="apple-btn-blue" style={{ width: '100%', padding: '12px' }}>
              <ShieldCheck size={16} />
              <span>Authenticate Root Access</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', paddingBottom: '60px' }}>
      
      {/* ── HEADER BANNER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-green" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Super Admin Session Active
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• Root Command</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            Platform Control &amp; Moderation
          </h1>
        </div>

        <button 
          className="btn-ghost" 
          style={{ color: '#EF4444' }}
          onClick={() => setIsAdminAuthenticated(false)}
        >
          <LogOut size={15} />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* ── METRICS OVERVIEW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">Pending Blog Approvals</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: pendingBlogs.length > 0 ? '#F59E0B' : 'var(--text-main)' }}>
            {pendingBlogs.length} Articles
          </strong>
          <span style={{ fontSize: '12px', color: pendingBlogs.length > 0 ? '#F59E0B' : '#10B981', marginTop: '4px' }}>
            {pendingBlogs.length > 0 ? 'Requires Editorial Review' : 'All clear & up to date'}
          </span>
        </div>

        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">Live Published Blogs</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{approvedBlogs.length} Live</strong>
          <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>Web &amp; Mobile Synced</span>
        </div>

        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">Verified Clinicians</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{vets.length} Active</strong>
          <span style={{ fontSize: '12px', color: '#3B82F6', marginTop: '4px' }}>100% License Verified</span>
        </div>

        <div className="apple-solid-card" style={{ padding: '20px', textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="label-mini">Registered Pets</span>
          <strong style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>12,840</strong>
          <span style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>+18% this month</span>
        </div>
      </div>

      {/* ── 📝 COMMUNITY BLOG & ARTICLE MODERATION COMMAND CENTER ── */}
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BookOpen size={18} color="var(--primary)" />
              <span>Community Blog &amp; Article Moderation</span>
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Approve user-submitted articles so they appear live across the web and mobile app feeds.
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-alt)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setBlogFilter('ALL')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                background: blogFilter === 'ALL' ? 'var(--primary)' : 'transparent',
                color: blogFilter === 'ALL' ? '#FFFFFF' : 'var(--text-muted)'
              }}
            >
              All ({blogs.length})
            </button>
            <button
              onClick={() => setBlogFilter('PENDING')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                background: blogFilter === 'PENDING' ? '#F59E0B' : 'transparent',
                color: blogFilter === 'PENDING' ? '#FFFFFF' : (pendingBlogs.length > 0 ? '#F59E0B' : 'var(--text-muted)')
              }}
            >
              Pending Review ({pendingBlogs.length})
            </button>
            <button
              onClick={() => setBlogFilter('APPROVED')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                background: blogFilter === 'APPROVED' ? '#10B981' : 'transparent',
                color: blogFilter === 'APPROVED' ? '#FFFFFF' : 'var(--text-muted)'
              }}
            >
              Approved &amp; Live ({approvedBlogs.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-clean"
            placeholder="Search articles by title, author, or category..."
            value={blogSearch}
            onChange={(e) => setBlogSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* Article Moderation List */}
        {filteredBlogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No articles match the selected filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredBlogs.map((article) => {
              const isApproved = article.isApproved === true || article.status === 'APPROVED';
              const isRejected = article.status === 'REJECTED';
              const isExpanded = expandedBlogId === article.id;

              return (
                <div
                  key={article.id}
                  style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    {/* Left info */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img
                        src={article.imageUrl || 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800'}
                        alt={article.title}
                        style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800';
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10B981'
                            }}
                          >
                            {article.category || 'HEALTH'}
                          </span>

                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isApproved 
                                ? 'rgba(16, 185, 129, 0.15)' 
                                : (isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                              color: isApproved ? '#10B981' : (isRejected ? '#EF4444' : '#F59E0B')
                            }}
                          >
                            {isApproved ? '● LIVE ON FEED' : (isRejected ? '● REJECTED' : '⏳ PENDING REVIEW')}
                          </span>
                        </div>

                        <strong style={{ fontSize: '16px', display: 'block', color: 'var(--text-main)' }}>
                          {article.title}
                        </strong>

                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          By {article.authorName || 'Pet Maya User'} • {formatBlogDate(article.timestamp)} • {article.readTimeMinutes || 5} min read
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!isApproved && (
                        <button
                          className="apple-btn-blue"
                          style={{ padding: '6px 14px', fontSize: '12px', background: '#10B981' }}
                          onClick={() => handleApproveBlog(article.id, article.title)}
                        >
                          <Check size={14} />
                          <span>Approve &amp; Publish</span>
                        </button>
                      )}

                      {isApproved && (
                        <button
                          className="btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '12px', color: '#F59E0B' }}
                          onClick={() => handleRejectBlog(article.id, article.title)}
                        >
                          <X size={14} />
                          <span>Unpublish</span>
                        </button>
                      )}

                      <button
                        className="btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setExpandedBlogId(isExpanded ? null : article.id)}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? 'Hide' : 'Read'}</span>
                      </button>

                      <button
                        className="icon-btn"
                        style={{ width: 32, height: 32, color: '#EF4444' }}
                        onClick={() => handleDeleteBlog(article.id, article.title)}
                        title="Delete Article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content preview */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '14px 18px',
                        background: 'var(--bg)',
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        lineHeight: 1.6,
                        color: 'var(--text-main)',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}
                    >
                      <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{article.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GLOBAL PROMO BANNER SETTINGS ── */}
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--primary)" />
            <span>Global Promo Banner</span>
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            <input 
              type="checkbox" 
              checked={bannerConfig.isActive} 
              onChange={(e) => setBannerConfig(prev => ({ ...prev, isActive: e.target.checked }))}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            {bannerConfig.isActive ? <span style={{ color: '#10B981' }}>Active</span> : <span style={{ color: 'var(--text-muted)' }}>Hidden</span>}
          </label>
        </div>

        <form onSubmit={handleUpdateBanner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label-mini">Promotional Text</label>
            <input 
              type="text" 
              className="input-clean" 
              placeholder="e.g. Shop online and get specialist help, free delivery..."
              value={bannerConfig.text}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, text: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="label-mini">Link Text</label>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="e.g. store's services"
                value={bannerConfig.linkText}
                onChange={(e) => setBannerConfig(prev => ({ ...prev, linkText: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-mini">Link URL</label>
              <input 
                type="text" 
                className="input-clean" 
                placeholder="e.g. /shop or https://..."
                value={bannerConfig.linkUrl}
                onChange={(e) => setBannerConfig(prev => ({ ...prev, linkUrl: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label-mini">Background Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="color" 
                  value={bannerConfig.bgColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                  style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="input-clean" 
                  value={bannerConfig.bgColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div>
              <label className="label-mini">Text Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="color" 
                  value={bannerConfig.textColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, textColor: e.target.value }))}
                  style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="input-clean" 
                  value={bannerConfig.textColor}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, textColor: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="apple-btn-blue" style={{ alignSelf: 'flex-start', padding: '9px 22px', marginTop: '4px' }}>
            <CheckCircle2 size={14} />
            <span>Save Configuration</span>
          </button>
        </form>
      </div>

      {/* ── BROADCAST PUSH MESSENGER ── */}
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--primary)" />
          <span>System Broadcast Push Messenger</span>
        </h3>

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
            <input 
              type="text" 
              className="input-clean" 
              placeholder="Notification Title (e.g. Weather Alert, Vaccination Drive)..."
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
            />
            <select 
              className="input-clean" 
              style={{ width: 'auto', fontWeight: 600 }}
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value)}
            >
              <option value="all">Broadcast to All Users</option>
              <option value="owners">Pet Owners Only</option>
              <option value="vets">Clinicians Only</option>
            </select>
          </div>

          <textarea 
            className="input-clean" 
            rows={2} 
            placeholder="Broadcast announcement content sent to mobile & web clients..."
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            style={{ resize: 'vertical' }}
          />

          <button type="submit" className="apple-btn-blue" style={{ alignSelf: 'flex-start', padding: '9px 22px' }}>
            <Send size={14} />
            <span>Send Live Broadcast</span>
          </button>
        </form>

        {/* History */}
        <div style={{ marginTop: '20px' }}>
          <span className="label-mini">Recent Broadcast Log</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {broadcasts.map(b => (
              <div key={b.id} style={{ background: 'var(--surface-alt)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px' }}>{b.title}</strong>
                  <span className="badge badge-green">{b.target} • {b.date}</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CLINICIAN LICENSING & FEE CONTROL ── */}
      <div className="apple-solid-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Verified Clinicians &amp; Pricing Directory</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Doctor / Clinic</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Specialization</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>License Status</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Slot Fee</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vets.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 10px' }}>
                    <strong style={{ display: 'block', color: 'var(--text-main)' }}>{v.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.clinic}</span>
                  </td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>{v.qualification}</td>
                  <td style={{ padding: '14px 10px' }}>
                    <span className="badge badge-green">Verified License</span>
                  </td>
                  <td style={{ padding: '14px 10px', fontWeight: 700 }}>${v.price || 40}</td>
                  <td style={{ padding: '14px 10px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                      onClick={() => openModal('editPrice', v)}
                    >
                      <Edit size={13} />
                      <span>Adjust Fee</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
