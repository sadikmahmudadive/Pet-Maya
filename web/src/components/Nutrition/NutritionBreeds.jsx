import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Clock, User, X, ChevronLeft, 
  Share2, PenLine, Search
} from 'lucide-react';
import { 
  db, collection, query, orderBy, onSnapshot
} from '../../config/firebase';
import ArticleEditor from './ArticleEditor';
import { AppleReveal } from '../Animations/AppleReveal';
import { AppleStagger } from '../Animations/AppleStagger';

const CATEGORIES = ['ALL', 'HEALTH', 'NUTRITION', 'TRAINING', 'LIFESTYLE'];

const CATEGORY_COLORS = {
  HEALTH: '#10B981',
  NUTRITION: '#F59E0B',
  TRAINING: '#3B82F6',
  LIFESTYLE: '#EC4899',
  ALL: '#86868B'
};

// Fallback articles if Firestore is empty
const FALLBACK_ARTICLES = [
  {
    id: 'b1',
    title: 'Optimal Macronutrient Ratios for Adult Canines & Felines',
    category: 'NUTRITION',
    authorName: 'Dr. Sarah Jenkins, DVM',
    authorPhoto: null,
    timestamp: Date.now() - 5 * 24 * 3600 * 1000,
    readTimeMinutes: 4,
    imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
    content: 'Maintaining optimal canine and feline health starts with understanding resting metabolic energy (RER). Dogs thrive on a balanced diet containing 22-28% bioavailable crude protein and 12-16% healthy lipids rich in Omega-3 (EPA/DHA) fatty acids. Cats, as obligate carnivores, require higher dietary protein (30-40%) and essential taurine to prevent dilated cardiomyopathy.\n\nWhen choosing between dry kibble and wet canned food, a 70/30 split provides superior dental scraping benefits from kibble alongside increased urinary hydration from wet food toppers.',
    tags: ['nutrition', 'cats', 'dogs']
  },
  {
    id: 'b2',
    title: 'Recognizing Early Warning Signs of Seasonal Atopic Dermatitis',
    category: 'HEALTH',
    authorName: 'Dr. Aris Thorne, BVSc',
    authorPhoto: null,
    timestamp: Date.now() - 7 * 24 * 3600 * 1000,
    readTimeMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
    content: 'Allergic skin disease in companion animals often begins with subtle symptoms: persistent paw licking, face rubbing, and erythema along the groin or inner pinna. If left untreated, self-mutilation leads to secondary bacterial (Staphylococcus) and fungal (Malassezia) infections.\n\nImmediate management includes antiseptic chlorhexidine wipes, hypoallergenic omega-3 skin barrier supplements, and consulting your veterinary clinician for cytological swabs or targeted anti-IL-31 therapeutics.',
    tags: ['health', 'skin', 'allergies']
  },
  {
    id: 'b3',
    title: 'Hydration Protocols: Preventing Feline Chronic Kidney Disease',
    category: 'HEALTH',
    authorName: 'Dr. Emily Vance, DVM',
    authorPhoto: null,
    timestamp: Date.now() - 11 * 24 * 3600 * 1000,
    readTimeMinutes: 3,
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    content: 'Desert-adapted feline ancestors derived the majority of moisture from fresh prey. Consequently, domestic cats feeding exclusively on dry food consume only 50% of their daily physiological hydration needs.\n\nTo support glomerular filtration:\n1. Introduce stainless steel or ceramic circulating water fountains.\n2. Incorporate warm bone broth or wet gravy food at every meal.\n3. Place water bowls away from food and litter stations.',
    tags: ['cats', 'kidney', 'hydration']
  },
  {
    id: 'b4',
    title: 'Positive Reinforcement Training: The Science Behind It',
    category: 'TRAINING',
    authorName: 'Dr. Marcus Reid',
    authorPhoto: null,
    timestamp: Date.now() - 14 * 24 * 3600 * 1000,
    readTimeMinutes: 6,
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80',
    content: 'Positive reinforcement is the most scientifically validated training method for companion animals. Operant conditioning relies on reinforcing desired behaviors with immediate rewards — within a 1.5 second window — to build reliable neural pathways.\n\nFor dogs, high-value protein treats (chicken, salmon) combined with a clear verbal marker ("yes!" or a clicker) creates predictable behavioral responses within 5-10 repetitions.',
    tags: ['training', 'dogs', 'behavior']
  },
  {
    id: 'b5',
    title: 'Creating an Enriching Indoor Environment for Cats',
    category: 'LIFESTYLE',
    authorName: 'Dr. Anna Lewin',
    authorPhoto: null,
    timestamp: Date.now() - 18 * 24 * 3600 * 1000,
    readTimeMinutes: 4,
    imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&auto=format&fit=crop&q=80',
    content: 'Indoor cats face significant behavioral challenges due to understimulation. Without prey-simulating activities, cats develop stress-induced conditions including overgrooming, aggression, and inappropriate elimination.\n\nAn enriched environment should include: multi-level climbing structures (cat trees), puzzle feeders for foraging instincts, window perches for visual stimulation, and at minimum 15 minutes of interactive wand-toy play per day.',
    tags: ['cats', 'lifestyle', 'indoor']
  }
];

export default function Blog() {
  const { showToast } = useApp();
  const { currentUser } = useAuth();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        if (snap.empty) {
          setBlogs(FALLBACK_ARTICLES);
        } else {
          setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        setLoading(false);
      }, () => {
        setBlogs(FALLBACK_ARTICLES);
        setLoading(false);
      });
      return () => unsub();
    } catch {
      setBlogs(FALLBACK_ARTICLES);
      setLoading(false);
    }
  }, []);

  const filteredBlogs = blogs.filter(b => {
    const isApproved = b.isApproved === true || b.status === 'APPROVED' || b.status === 'approved' || (!('status' in b) && !('isApproved' in b));
    if (!isApproved) return false;
    const matchesCat = selectedCategory === 'ALL' || (b.category || '').toUpperCase() === selectedCategory;
    const matchesSearch = !searchQuery || 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? ts : ts.seconds * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const catColor = CATEGORY_COLORS[selectedCategory] || '#10B981';

  // If editor is open, render it full-screen
  if (showEditor) {
    return (
      <AnimatePresence>
        <ArticleEditor
          key="editor"
          onClose={() => setShowEditor(false)}
          onPublished={() => setShowEditor(false)}
          showToast={showToast}
        />
      </AnimatePresence>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>

      {/* ── HEADER ── */}
      <AppleReveal duration={0.8} yOffset={25}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="apple-card-eyebrow" style={{ color: '#EC4899' }}>Pet Care Blog</span>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 6px' }}>
            Advice & Insights
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Expert articles on health, nutrition, training & lifestyle — by veterinarians.
          </p>
        </div>
        <button className="apple-btn-blue" onClick={() => setShowEditor(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PenLine size={15} />
          <span>Write Article</span>
        </button>
      </div>
      </AppleReveal>

      {/* ── SEARCH BAR ── */}
      <AppleReveal delay={0.1} yOffset={25}>
      <div style={{ position: 'relative', maxWidth: '440px' }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input-clean"
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '38px' }}
        />
      </div>

      {/* ── CATEGORY FILTER CHIPS ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="chip-pill"
            style={{
              background: selectedCategory === cat ? (CATEGORY_COLORS[cat] || 'var(--primary)') : 'var(--surface-alt)',
              color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
              fontWeight: selectedCategory === cat ? 700 : 500,
              border: 'none',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.03em'
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      </AppleReveal>

      {/* ── ARTICLE GRID ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Loading articles...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.25, marginBottom: 16 }} />
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No articles found</h3>
          <p style={{ fontSize: '14px' }}>Try a different category or be the first to write one!</p>
        </div>
      ) : (
        <AppleStagger className="apple-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredBlogs.map((article) => (
            <div
              key={article.id}
              className="apple-solid-card"
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setSelectedArticle(article)}
            >
              {/* Cover Image */}
              <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '22px 22px 0 0', background: 'var(--surface-alt)', flexShrink: 0 }}>
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800'; }}
                />
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {/* Category & Read Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: `${CATEGORY_COLORS[(article.category || '').toUpperCase()] || '#10B981'}18`,
                    color: CATEGORY_COLORS[(article.category || '').toUpperCase()] || '#10B981',
                    fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em',
                    padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase'
                  }}>
                    {article.category}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Clock size={11} />
                    {article.readTimeMinutes} min read
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0 }}>
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p style={{
                  fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {article.content}
                </p>

                {/* Author Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-alt)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {article.authorPhoto ? (
                      <img src={article.authorPhoto} alt={article.authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={14} color="var(--text-muted)" />
                    )}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {article.authorName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatDate(article.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </AppleStagger>
      )}

      {/* ══════════════ ARTICLE DETAIL PANEL ══════════════ */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px 16px',
              WebkitBackdropFilter: 'blur(16px)'
            }}
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '860px', maxHeight: '90vh', borderRadius: '24px',
                background: 'var(--bg-pure)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)'
              }}
            >
              {/* Hero Image */}
              <div style={{ position: 'relative', flexShrink: 0, background: 'var(--surface-alt)' }}>
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  style={{ width: '100%', height: '360px', maxHeight: '420px', minHeight: '260px', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                  onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800'; }}
                />
                {/* Floating Back / Close Button */}
                <button
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    position: 'absolute', top: 16, left: 16,
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: 'none',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
                {/* Share Button */}
                <button
                  onClick={() => { 
                    if (navigator.share) {
                      navigator.share({ title: selectedArticle.title, url: window.location.href }); 
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('Article link copied to clipboard!', 'success');
                    }
                  }}
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: 'none',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Content (scrollable) */}
              <div style={{ overflow: 'auto', flex: 1, padding: '32px 36px 60px' }}>
                {/* Category + Read Time */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{
                    background: `${CATEGORY_COLORS[(selectedArticle.category || '').toUpperCase()] || '#10B981'}18`,
                    color: CATEGORY_COLORS[(selectedArticle.category || '').toUpperCase()] || '#10B981',
                    fontSize: '11px', fontWeight: 900, letterSpacing: '0.06em',
                    padding: '5px 12px', borderRadius: '10px', textTransform: 'uppercase'
                  }}>
                    {selectedArticle.category}
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {selectedArticle.readTimeMinutes || 5} min read
                  </span>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '20px' }}>
                  {selectedArticle.title}
                </h2>

                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface-alt)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedArticle.authorPhoto ? (
                      <img src={selectedArticle.authorPhoto} alt={selectedArticle.authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={20} color="var(--text-muted)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14.5px' }}>{selectedArticle.authorName || 'Pet Maya Author'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(selectedArticle.timestamp)}</div>
                  </div>
                </div>

                {/* Article Body - Rich HTML Formatting */}
                {selectedArticle.htmlContent ? (
                  <div 
                    className="article-rich-content"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.htmlContent }}
                  />
                ) : (
                  <div className="article-rich-content" style={{ whiteSpace: 'pre-line' }}>
                    {selectedArticle.content}
                  </div>
                )}

                {/* Tags */}
                {selectedArticle.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    {selectedArticle.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '6px 14px', borderRadius: '10px',
                        background: 'var(--surface-alt)', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ CREATE ARTICLE MODAL ══════════════ */}
      {showEditor && <ArticleEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}
