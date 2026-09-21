import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import EditorialNavbar from '../Navigation/EditorialNavbar';
import {
  Search,
  Bookmark,
  ArrowRight,
  Clock,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Download,
  Share2,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  Stethoscope,
  Microscope,
  Send,
  Layers,
  Thermometer,
  Radio,
  Heart
} from 'lucide-react';

export default function JournalPage({ onNavigate }) {
  const { showToast, openModal, addToCart, posts = [], isPostsLoading, vets = [] } = useApp ? useApp() : { showToast: () => {}, openModal: () => {}, addToCart: () => {}, posts: [], isPostsLoading: false, vets: [] };
  const { currentUser } = useAuth ? useAuth() : { currentUser: null };

  const handleRoute = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedArticles, setSavedArticles] = useState({});
  const [selectedArticleModal, setSelectedArticleModal] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Category filter tabs
  // Dynamic category filter tabs
  const categoryTabs = [
    { id: 'all', label: 'All Dispatches (48)' },
    { id: 'all', label: `All Dispatches (${posts.length || 6})` },
    { id: 'nutrition', label: 'Clinical Nutrition & GI' },
    { id: 'diagnostics', label: 'Preventive Diagnostics & Labs' },
    { id: 'cold-chain', label: 'Cold-Chain Biologics' },
    { id: 'orthopedics', label: 'Canine Orthopedics' },
    { id: 'longevity', label: 'Feline Longevity' },
    { id: 'travel', label: 'Travel & Global Export' }
  ];

  // Clinical articles database
  const featuredArticle = {
  // Dynamic clinical articles from community posts filtered by article/clinical type (with static fallback)
  const articlePosts = posts.filter(p => 
    p.postType === 'article' || p.category === 'article' || 
    p.category === 'journal' || p.category === 'clinical'
  );

  const fallbackFeatured = {
    id: 'microbiome-gut-brain',
    categoryTag: 'CLINICAL MONOGRAPH',
    readTime: '7 MIN READ',
    publishedDate: 'OCT 2026',
    specialty: 'CLINICAL NUTRITION',
    title: 'Beyond Kibble: Microbiome Diversification and Gut-Brain Axis in Senior Canines',
    excerpt: 'An editorial review on cold-chain digestive supplements, short-chain fatty acids (SCFAs), and targeted probiotic modulation in longevity. Evidence confirms that maintaining tight microbial flora diversity reduces systemic neuro-inflammation and prolongs cognitive threshold in aging canines.',
    authors: [
      {
        name: 'Dr. Evelyn Vance, MRCVS',
        role: 'Head of Internal Medicine',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80'
      },
      {
        name: 'Dr. Nazmul Huda, DVM',
        role: 'Board Orthopedic Surgeon',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80'
        name: vets[0]?.name || 'Dr. Evelyn Vance, MRCVS',
        role: vets[0]?.tag || 'Head of Internal Medicine',
        avatar: vets[0]?.photo || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80'
      }
    ],
    peerReviewNotice: 'Peer-reviewed by 2 Board Specialists',
    peerReviewNotice: 'Peer-reviewed by Board Specialists',
    heroImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1000&q=80',
    figureTag: 'FIG. 03 // ENTERIC BIOMARKERS',
    content: `
      ### Executive Summary & Clinical Background
      Canine cognitive longevity and gastrointestinal mucosal integrity are bi-directionally coupled through the enteric nervous system (ENS) and vagal afferents. Recent clinical trials evaluating 120 senior canines (mean age: 9.4 years) demonstrated that dietary supplementation with micro-encapsulated Bifidobacterium animalis and butyrate-producing substrates significantly attenuated circulating IL-6 and TNF-alpha cytokines.

      ### Key Clinical Takeaways:
      1. **Mucosal Barrier Optimization:** Live multi-strain bacterial colonizers require strict cold-chain compliance (<8°C) to retain viable CFU counts upon administration.
      2. **SCFA Synthesis:** Targeted soluble botanical fibers accelerate propionate and butyrate synthesis, nourishing colonocytes and down-regulating neuro-inflammation.
      3. **Dosage & Titration Protocol:** Begin with 5 Billion CFU daily during morning meal; assess Bristol Stool Score at Day 7, 14, and 28.
    `
  };

  const clinicalArticles = [
  const featuredArticle = articlePosts.length > 0 ? {
    id: articlePosts[0].id,
    categoryTag: (articlePosts[0].category || 'CLINICAL MONOGRAPH').toUpperCase(),
    readTime: articlePosts[0].readTime || '5 MIN READ',
    publishedDate: articlePosts[0].createdAt ? new Date(articlePosts[0].createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'RECENT',
    specialty: (articlePosts[0].specialty || articlePosts[0].category || 'CLINICAL RESEARCH').toUpperCase(),
    title: articlePosts[0].title || articlePosts[0].content?.substring(0, 80) || 'Clinical Monograph',
    excerpt: articlePosts[0].excerpt || articlePosts[0].content?.substring(0, 200) || '',
    authors: [
      {
        name: articlePosts[0].authorName || vets[0]?.name || 'Editorial Board',
        role: articlePosts[0].authorRole || vets[0]?.tag || 'Veterinary Reviewer',
        avatar: articlePosts[0].authorPhoto || vets[0]?.photo || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80'
      }
    ],
    peerReviewNotice: 'Peer-reviewed by Board Specialists',
    heroImage: articlePosts[0].image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1000&q=80',
    figureTag: 'FIG. 01 // CLINICAL DISPATCH',
    content: articlePosts[0].content || 'No content provided.'
  } : fallbackFeatured;

  const clinicalArticles = articlePosts.length > 1 ? articlePosts.slice(1).map(p => ({
    id: p.id,
    category: p.category || 'diagnostics',
    badge: p.badge || p.category || 'Clinical Monograph',
    image: p.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    readTime: p.readTime || '5 MIN READ',
    author: p.authorName || vets[0]?.name || 'Pet Maya Editorial',
    title: p.title || p.content?.substring(0, 80) || 'Clinical Dispatch',
    desc: p.excerpt || p.content?.substring(0, 150) || '',
    actionText: 'Read Full Monograph',
    fullText: p.content || ''
  })) : [
    {
      id: 'sdma-feline-renal',
      category: 'diagnostics',
      badge: 'Preventive Biomarkers',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
      readTime: '5 MIN READ',
      author: 'Dr. Sarah Jenkins, MRCVS',
      author: vets[0]?.name ? `${vets[0].name}, MRCVS` : 'Dr. Sarah Jenkins, MRCVS',
      title: 'The Silent Renal Index: Deciphering SDMA Before Creatinine Spikes in Feline Patients',
      desc: 'Symmetric dimethylarginine (SDMA) elevates with as little as 25% kidney loss, compared to 75% for serum creatinine. A diagnostic roadmap for early feline nephro-protection.',
      actionText: 'Access Lab Protocol',
      fullText: 'SDMA biomarker analysis enables detection of chronic kidney disease (CKD) on average 17 months earlier in cats than conventional serum creatinine assays.'
    },
    {
      id: 'pet-export-biosecurity',
      category: 'travel',
      badge: 'Global Biosecurity',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80',
      readTime: '9 MIN READ',
      author: 'Pet Maya Travel Board',
      title: 'Navigating UK, EU & UAE Pet Export: A Step-by-Step Biosecurity Protocol',
      desc: 'Critical compliance timeline covering the 21-day rabies post-vaccination latency, FAVN antibody titers (>0.5 IU/ml), USDA/DEFRA health endorsements, and tapeworm treatments.',
      actionText: 'Download Titer Checklist',
      fullText: 'Step-by-step cross-border transport guide including ISO 11784/11785 microchip implant dates, OIE-approved laboratory titer certificates, and RNATT declaration workflows.'
    },
    {
      id: 'vaccine-cold-chain-integrity',
      category: 'cold-chain',
      badge: 'Pharmacology QC',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      readTime: '4 MIN READ',
      author: 'Dr. Arman K., PharmD',
      author: vets[1]?.name || 'Dr. Arman K., PharmD',
      title: 'Cold-Chain Integrity: Why Biologic Temperature Fluctuation Above 8°C Renders Vaccines Inert',
      desc: 'Analysis of protein denaturation in core modified-live vaccines (DHPP, FPV). Continuous IoT sensor data reveals silent immunity failure from compromised transit logs.',
      actionText: 'Review Storage Standards',
      fullText: 'Thermal breach analysis proving that even a 2-hour cumulative excursion past 8.5°C degrades live virus titer below protective immunogenic thresholds in DHLPP formulations.'
    },
    {
      id: 'tplo-vs-lateral-suture',
      category: 'orthopedics',
      badge: 'Surgical Science',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
      readTime: '8 MIN READ',
      author: 'Dr. Nazmul Huda, DVM',
      author: vets[2]?.name || 'Dr. Nazmul Hoda, DVM',
      title: 'Understanding TPLO vs Lateral Suture for Cruciate Ligament Ruptures',
      desc: 'Evaluating biomechanical tibial plateau leveling osteotomy against extracapsular suture stabilization across canine weight classes (>15kg), post-op recovery curves, and osteoarthritis progression.',
      actionText: 'View Radiographic Sets',
      fullText: 'Comparative kinematic study of 84 large-breed canines undergoing TPLO versus lateral fabellar suture, demonstrating 42% faster full weight-bearing recovery at Week 8.'
    },
    {
      id: 'iso-microchip-frequency',
      category: 'travel',
      badge: 'Biometric Identity',
      image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=600&q=80',
      readTime: '4 MIN READ',
      author: 'Standards Committee',
      title: 'Microchip Frequency Wars: Why ISO 11784 FDX-B is the Sole International Standard',
      desc: 'The technical distinction between 134.2 kHz and obsolete 125 kHz transponders. How non-compliant microchips risk pet quarantine upon cross-continental arrival.',
      actionText: 'ISO Compatibility Table',
      fullText: 'Complete technical breakdown of HDX and FDX-B radiofrequency transponders, encrypted parity bits, and universal scanner interoperability across global border points.'
    },
    {
      id: 'tropical-parasitology-south-asia',
      category: 'longevity',
      badge: 'Parasite Protocols',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
      readTime: '6 MIN READ',
      author: 'Dr. Ananya Roy, Dip. ECVD',
      title: 'Seasonal Tropical Parasitology in South Asia: Managing Heartworm and Tick-Borne Ehrlichia',
      desc: 'Microfilariae prevention regimens combining isoxazolines and monthly moxidectin. Clinical treatment paths for acute canine monocytic ehrlichiosis with doxycycline.',
      actionText: 'Differential Diagnostic Flow',
      fullText: 'Epidemiological overview of Dirofilaria immitis microfilaremia and Ehrlichia canis morulae visualization in monocyte buffy coats in subtropical climates.'
    }
  ];

  const editorialBoardMembers = [
  // Dynamic editorial board members from live Firestore vets
  const editorialBoardMembers = vets.length > 0 ? vets.slice(0, 4).map(v => ({
    name: v.name,
    credentials: v.qualification || v.degrees || 'DVM',
    role: `${v.specialty || v.tag || 'Specialist'} • Peer Reviewer`
  })) : [
    {
      name: 'Dr. Evelyn Vance',
      credentials: 'BVM&S, MRCVS',
      role: 'Lead Reviewer • Gastroenterology & Internal Medicine'
    },
    {
      name: 'Dr. Nazmul Huda',
      name: 'Dr. Nazmul Hoda',
      credentials: 'DVM, MS (Ortho)',
      role: 'Surgical Reviewer • Canine Biomechanics & TPLO'
    },
    {
      name: 'Dr. Ananya Roy',
      credentials: 'Dip. ECVD, MRCVS',
      role: 'Dermatology & Vector-Borne Parasitology'
    },
    {
      name: 'Arman K. Rahman',
      credentials: 'PharmD, BCPPS',
      role: 'Pharmacology Director • Biologics Cold-Chain QC'
      role: 'Dermatology Reviewer • Tropical Immunology'
    }
  ];

  // Bookmark toggle handler
  const handleToggleBookmark = (id, title, e) => {
    if (e) e.stopPropagation();
    setSavedArticles(prev => {
      const next = !prev[id];
      showToast(next ? `Saved "${title}" to your Health Vault` : `Removed from Health Vault`, 'info');
      return { ...prev, [id]: next };
    });
  };

  // Newsletter submission
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setNewsletterSubscribed(true);
    showToast('✨ Subscribed to The Mindful Companion Digest & Gazette!', 'success');
  };

  // Filtered articles
  const filteredArticles = clinicalArticles.filter(art => {
    const matchesCat = activeCategory === 'all' || art.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      art.title.toLowerCase().includes(query) || 
      art.desc.toLowerCase().includes(query) || 
      art.author.toLowerCase().includes(query) ||
      art.badge.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{
      backgroundColor: 'var(--bg)',
      minHeight: '100vh',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ════════════════════════════════════════════════════════════════
          1. TOP GLOBAL PROTOCOL BANNER & EDITORIAL NAVBAR
          ════════════════════════════════════════════════════════════════ */}
      <EditorialNavbar currentRoute="journal" onNavigate={handleRoute} />

      {/* ════════════════════════════════════════════════════════════════
          2. MAIN CONTENT BODY
          ════════════════════════════════════════════════════════════════ */}
      <main style={{
        maxWidth: '1360px',
        margin: '0 auto',
        width: '100%',
        padding: '32px 24px 80px'
      }}>

        {/* ── A. FEATURED CLINICAL MONOGRAPH HERO CARD (Split 2-Column) ── */}
        <section style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(222, 217, 214, 0.85)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1.18fr 1fr',
          boxShadow: '0 4px 24px rgba(22, 15, 12, 0.04)',
          marginBottom: '36px'
        }}>
          {/* Left Column: Monograph Content */}
          <div style={{
            padding: '40px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {/* Meta Tags Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <span style={{
                backgroundColor: 'rgba(69, 132, 141, 0.08)',
                color: '#3E7B84',
                border: '1px solid rgba(69, 132, 141, 0.25)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                padding: '4px 10px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                {featuredArticle.categoryTag}
              </span>
              <span style={{
                color: '#717D79',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}>
                • &nbsp; {featuredArticle.readTime} &nbsp; • &nbsp; PUBLISHED {featuredArticle.publishedDate} &nbsp; • &nbsp; {featuredArticle.specialty}
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1.22,
              color: '#160F0C',
              margin: '0 0 16px 0',
              letterSpacing: '-0.01em'
            }}>
              {featuredArticle.title}
            </h1>

            {/* Excerpt */}
            <p style={{
              fontSize: '14px',
              lineHeight: 1.68,
              color: '#55605C',
              margin: '0 0 24px 0'
            }}>
              {featuredArticle.excerpt}
            </p>

            {/* Authors */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '28px'
            }}>
              {/* Overlapping twin avatars */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={featuredArticle.authors[0].avatar}
                  alt={featuredArticle.authors[0].name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #FFFFFF'
                  }}
                />
                <img
                  src={featuredArticle.authors[1].avatar}
                  alt={featuredArticle.authors[1].name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #FFFFFF',
                    marginLeft: '-10px'
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#55605C' }}>
                <strong style={{ color: '#160F0C' }}>{featuredArticle.authors[0].name}</strong>
                <span> ({featuredArticle.authors[0].role}) &amp; </span>
                <strong style={{ color: '#160F0C' }}>{featuredArticle.authors[1].name}</strong>
              </div>
            </div>

            {/* Action Buttons & Peer-review footnote */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              <button
                onClick={() => setSelectedArticleModal(featuredArticle)}
                style={{
                  backgroundColor: '#3E7B84',
                  color: '#FFFFFF',
                  padding: '11px 22px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(62, 123, 132, 0.25)',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#346971'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3E7B84'}
              >
                <span>Read Clinical Monograph</span>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={() => handleToggleBookmark(featuredArticle.id, featuredArticle.title)}
                style={{
                  backgroundColor: '#F8F4EE',
                  color: '#160F0C',
                  border: '1px solid #DED9D6',
                  padding: '11px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0EAE3'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8F4EE'}
              >
                <Bookmark size={15} fill={savedArticles[featuredArticle.id] ? '#160F0C' : 'none'} />
                <span>Save to Health Vault</span>
              </button>

              <span style={{
                fontSize: '11px',
                color: '#8C9691',
                fontStyle: 'italic',
                marginLeft: 'auto'
              }}>
                {featuredArticle.peerReviewNotice}
              </span>
            </div>
          </div>

          {/* Right Column: Hero Image with Figure Tag */}
          <div style={{
            position: 'relative',
            minHeight: '380px',
            backgroundColor: '#EBE5DF'
          }}>
            <img
              src={featuredArticle.heroImage}
              alt="Microbiome Research in Senior Canines"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            {/* Figure Overlay Badge */}
            <div style={{
              position: 'absolute',
              bottom: '18px',
              right: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#160F0C',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              padding: '6px 14px',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              {featuredArticle.figureTag}
            </div>
          </div>
        </section>

        {/* ── B. SEARCH & EVIDENCE REPOSITORY STATUS BAR ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '390px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#717D79'
              }}
            />
            <input
              type="text"
              placeholder="Search articles, clinical studies, drug monographs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '9999px',
                border: '1px solid #DED9D6',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                color: '#160F0C',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#3E7B84'}
              onBlur={e => e.target.style.borderColor = '#DED9D6'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#717D79'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Live Repository Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: '#55605C'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'inline-block',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
            }} />
            <span>LIVE EVIDENCE REPOSITORY</span>
            <span style={{ color: '#A0A9A4' }}>|</span>
            <span>48 MONOGRAPHS INDEXED</span>
          </div>
        </div>

        {/* ── C. CATEGORY FILTER PILL TABS ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '36px',
          scrollbarWidth: 'none'
        }}>
          {categoryTabs.map(tab => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? '#3E7B84' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#55605C',
                  border: isActive ? '1px solid #3E7B84' : '1px solid #DED9D6',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 2px 6px rgba(62, 123, 132, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#F8F4EE';
                    e.currentTarget.style.color = '#160F0C';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = '#55605C';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── D. RECENT CLINICAL DISPATCHES SECTION HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(222, 217, 214, 0.7)',
          paddingBottom: '12px'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
            fontSize: '22px',
            fontWeight: 800,
            color: '#160F0C',
            margin: 0
          }}>
            Recent Clinical Dispatches
          </h2>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#717D79',
            textTransform: 'uppercase'
          }}>
            CURATED EVIDENCE-BASED PRACTICE
          </span>
        </div>

        {/* ── E. 6-ARTICLE CLINICAL GRID (2 Rows x 3 Columns) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {filteredArticles.map(art => {
            const isSaved = !!savedArticles[art.id];
            return (
              <article
                key={art.id}
                onClick={() => setSelectedArticleModal(art)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(222, 217, 214, 0.85)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(22, 15, 12, 0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.02)';
                }}
              >
                {/* Top Image Container */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#EBE5DF'
                }}>
                  <img
                    src={art.image}
                    alt={art.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  {/* Category overlay badge */}
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    color: '#160F0C',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                  }}>
                    {art.badge}
                  </div>
                </div>

                {/* Body Content */}
                <div style={{
                  padding: '20px 22px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}>
                  {/* Meta */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#717D79',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    marginBottom: '10px'
                  }}>
                    <Clock size={12} />
                    <span>{art.readTime}</span>
                    <span>•</span>
                    <span>{art.author}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                    fontSize: '17px',
                    fontWeight: 800,
                    lineHeight: 1.35,
                    color: '#160F0C',
                    margin: '0 0 10px 0'
                  }}>
                    {art.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#55605C',
                    margin: '0 0 18px 0',
                    flex: 1
                  }}>
                    {art.desc}
                  </p>

                  {/* Card Bottom Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(222, 217, 214, 0.6)'
                  }}>
                    <span style={{
                      color: '#3E7B84',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{art.actionText}</span>
                      <ArrowRight size={13} />
                    </span>

                    <button
                      onClick={(e) => handleToggleBookmark(art.id, art.title, e)}
                      aria-label="Save to Vault"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isSaved ? '#160F0C' : '#717D79',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Bookmark size={15} fill={isSaved ? '#160F0C' : 'none'} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── F. THE MINDFUL COMPANION DIGEST / GAZETTE SUBSCRIPTION BANNER ── */}
        <section style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(222, 217, 214, 0.85)',
          padding: '44px 48px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          marginBottom: '48px'
        }}>
          {/* Subtle Watermark Beaker Background */}
          <div style={{
            position: 'absolute',
            right: '40px',
            bottom: '-20px',
            opacity: 0.05,
            pointerEvents: 'none'
          }}>
            <Microscope size={220} strokeWidth={1} />
          </div>

          <div style={{ maxWidth: '680px', position: 'relative', zIndex: 1 }}>
            {/* Tag */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#3E7B84',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              <BookOpen size={14} />
              <span>FORTNIGHTLY CLINICAL CORRESPONDENCE</span>
            </div>

            {/* Heading */}
            <h2 style={{
              fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
              fontSize: '28px',
              fontWeight: 800,
              color: '#160F0C',
              margin: '0 0 10px 0'
            }}>
              The Mindful Companion Digest
            </h2>

            {/* Subtitle */}
            <p style={{
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: '#55605C',
              margin: '0 0 24px 0'
            }}>
              Receive bi-weekly clinical research digests, seasonal parasite forecasts, cold-chain advisories, and veterinary drug safety notices straight to your inbox.
            </p>

            {/* Subscription Form */}
            {newsletterSubscribed ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#065F46',
                padding: '12px 20px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600
              }}>
                <CheckCircle2 size={16} color="#10B981" />
                <span>Subscription Confirmed! Welcome to the Pet Maya Clinical Gazette.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="name@veterinary-practice.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '9999px',
                    backgroundColor: '#FAF7F5',
                    border: '1px solid #DED9D6',
                    fontSize: '13.5px',
                    width: '320px',
                    color: '#160F0C',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#3E7B84'}
                  onBlur={e => e.target.style.borderColor = '#DED9D6'}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Subscribe to Gazette
                </button>
              </form>
            )}

            {/* Footer Trust Guarantee */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#717D79',
              marginTop: '16px'
            }}>
              <CheckCircle2 size={13} color="#10B981" />
              <span>Zero marketing noise. Only peer-reviewed clinical medicine. &nbsp; • &nbsp; Unsubscribe at any time.</span>
            </div>
          </div>
        </section>

        {/* ── G. EDITORIAL ADVISORY BOARD & PEER REVIEW TRANSPARENCY ── */}
        <section style={{
          borderTop: '1px solid rgba(222, 217, 214, 0.8)',
          paddingTop: '32px',
          marginBottom: '48px'
        }}>
          {/* Header Row */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#3E7B84',
                textTransform: 'uppercase'
              }}>
                SCIENTIFIC RIGOR
              </span>
              <h3 style={{
                fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                fontSize: '19px',
                fontWeight: 800,
                color: '#160F0C',
                margin: '4px 0 0 0'
              }}>
                Editorial Advisory Board &amp; Peer Review Transparency
              </h3>
            </div>

            <p style={{
              fontSize: '12px',
              lineHeight: 1.5,
              color: '#717D79',
              maxWidth: '460px',
              margin: 0
            }}>
              Every clinical dispatch is double-blind peer reviewed by qualified members of the Royal College of Veterinary Surgeons (RCVS) and American Animal Hospital Association (AAHA) contributors.
            </p>
          </div>

          {/* 4 Board Member Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            {editorialBoardMembers.map((member, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid rgba(222, 217, 214, 0.8)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C' }}>
                    {member.name}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#3E7B84'
                  }}>
                    {member.credentials}
                  </span>
                </div>
                <p style={{
                  fontSize: '11px',
                  color: '#675C58',
                  lineHeight: 1.45,
                  margin: '6px 0 0 0'
                }}>
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ════════════════════════════════════════════════════════════════
          3. EDITORIAL FOOTER
          ════════════════════════════════════════════════════════════════ */}
      <footer style={{
        backgroundColor: '#F5EFEB',
        borderTop: '1px solid #DED9D6',
        padding: '36px 24px 28px',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            {/* Brand Logo & Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#160F0C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Stethoscope size={16} />
              </div>
              <div>
                <span style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#160F0C'
                }}>
                  PET MAYA
                </span>
                <span style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: '#717D79',
                  textTransform: 'uppercase',
                  marginTop: '1px'
                }}>
                  VETERINARY MEDICINE &amp; CLINICAL GAZETTE
                </span>
              </div>
            </div>

            {/* Middle Nav Links */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              fontSize: '12px',
              color: '#55605C'
            }}>
              <a
                href="#editorial-standards"
                onClick={(e) => { e.preventDefault(); showToast('Editorial Peer-Review Standards loaded', 'info'); }}
                style={{ color: '#55605C', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#160F0C'}
                onMouseLeave={e => e.currentTarget.style.color = '#55605C'}
              >
                Editorial Standards
              </a>
              <span>•</span>
              <a
                href="#conflict-of-interest"
                onClick={(e) => { e.preventDefault(); showToast('All authors have zero pharmaceutical conflicts of interest', 'info'); }}
                style={{ color: '#55605C', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#160F0C'}
                onMouseLeave={e => e.currentTarget.style.color = '#55605C'}
              >
                Conflict of Interest Disclosures
              </a>
              <span>•</span>
              <a
                href="#submit-manuscript"
                onClick={(e) => { e.preventDefault(); showToast('Clinician Manuscript Submission portal opened', 'info'); }}
                style={{ color: '#55605C', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#160F0C'}
                onMouseLeave={e => e.currentTarget.style.color = '#55605C'}
              >
                Submit a Clinical Manuscript
              </a>
              <span>•</span>
              <a
                href="#biosecurity-export"
                onClick={(e) => { e.preventDefault(); handleRoute('specialists'); }}
                style={{ color: '#55605C', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#160F0C'}
                onMouseLeave={e => e.currentTarget.style.color = '#55605C'}
              >
                Biosecurity Export Forms
              </a>
              <span>•</span>
              <a
                href="#institutional-access"
                onClick={(e) => { e.preventDefault(); showToast('Institutional RCVS/AAHA Library Login active', 'info'); }}
                style={{ color: '#55605C', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#160F0C'}
                onMouseLeave={e => e.currentTarget.style.color = '#55605C'}
              >
                Institutional Access
              </a>
            </div>

            {/* Copyright & Accreditations */}
            <div style={{ fontSize: '11.5px', color: '#717D79', textAlign: 'right' }}>
              © 2026 Pet Maya Healthcare. All rights reserved. AAHA &amp; RCVS Aligned.
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          4. INTERACTIVE CLINICAL ARTICLE MODAL DRAWER
          ════════════════════════════════════════════════════════════════ */}
      {selectedArticleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 15, 12, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '780px',
            width: '100%',
            maxHeight: '88vh',
            overflowY: 'auto',
            padding: '36px 40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedArticleModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F8F4EE',
                border: '1px solid #DED9D6',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#160F0C'
              }}
            >
              <X size={16} />
            </button>

            {/* Modal Tag */}
            <span style={{
              backgroundColor: 'rgba(69, 132, 141, 0.08)',
              color: '#3E7B84',
              border: '1px solid rgba(69, 132, 141, 0.25)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              padding: '4px 10px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              {selectedArticleModal.badge || selectedArticleModal.categoryTag || 'CLINICAL DISPATCH'}
            </span>

            {/* Modal Title */}
            <h2 style={{
              fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
              fontSize: '26px',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#160F0C',
              margin: '14px 0 12px 0'
            }}>
              {selectedArticleModal.title}
            </h2>

            {/* Meta */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '12px',
              color: '#717D79',
              fontFamily: 'var(--font-mono, monospace)',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(222, 217, 214, 0.6)',
              paddingBottom: '14px'
            }}>
              <span>⏱ {selectedArticleModal.readTime}</span>
              <span>•</span>
              <span>Author: {selectedArticleModal.author || (selectedArticleModal.authors && selectedArticleModal.authors[0].name)}</span>
            </div>

            {/* Featured Image if present */}
            {(selectedArticleModal.heroImage || selectedArticleModal.image) && (
              <img
                src={selectedArticleModal.heroImage || selectedArticleModal.image}
                alt={selectedArticleModal.title}
                style={{
                  width: '100%',
                  height: '240px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '20px'
                }}
              />
            )}

            {/* Modal Text Content */}
            <div style={{ fontSize: '14.5px', lineHeight: 1.75, color: '#4A5568' }}>
              <p style={{ fontWeight: 500, color: '#160F0C', fontSize: '15px', marginBottom: '16px' }}>
                {selectedArticleModal.excerpt || selectedArticleModal.desc}
              </p>
              <p>
                {selectedArticleModal.fullText || (
                  `Clinical investigations conducted at Pet Maya Veterinary Medicine demonstrate that early biomarker monitoring, rigorous temperature stasis control (<8°C), and species-appropriate metabolic interventions dramatically improve patient recovery trajectories.`
                )}
              </p>
              
              <div style={{
                backgroundColor: '#FAF7F5',
                borderLeft: '3px solid #3E7B84',
                padding: '14px 18px',
                borderRadius: '4px',
                margin: '20px 0',
                fontSize: '13.5px',
                color: '#160F0C'
              }}>
                <strong>Clinical Recommendation:</strong> Consult a verified Pet Maya clinician or synchronize with your patient's longitudinal EHR vault before altering ongoing pharmaceutical or surgical rehabilitation protocols.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(222, 217, 214, 0.8)'
            }}>
              <button
                onClick={() => {
                  handleToggleBookmark(selectedArticleModal.id, selectedArticleModal.title);
                }}
                style={{
                  backgroundColor: '#F8F4EE',
                  border: '1px solid #DED9D6',
                  color: '#160F0C',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Bookmark size={15} fill={savedArticles[selectedArticleModal.id] ? '#160F0C' : 'none'} />
                <span>{savedArticles[selectedArticleModal.id] ? 'Saved in Vault' : 'Save to Health Vault'}</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    showToast('Clinical Monograph PDF generated and downloaded', 'success');
                  }}
                  style={{
                    backgroundColor: '#160F0C',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 960px) {
          section[style*="grid-template-columns: 1.18fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"],
          div[style*="grid-template-columns: repeat(3, 1fr)"],
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
