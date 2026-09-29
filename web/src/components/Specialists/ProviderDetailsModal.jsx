import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  X, 
  Check, 
  CheckCircle2, 
  Video, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Award, 
  Phone, 
  Building, 
  Heart, 
  Sparkles, 
  Send, 
  MessageSquare, 
  ChevronRight, 
  ArrowLeft, 
  Stethoscope, 
  Flame, 
  User,
  ThumbsUp,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { db, doc, setDoc, updateDoc, collection, query, where, onSnapshot } from '../../config/firebase';

const RATING_LABELS = {
  5: 'EXCELLENT',
  4: 'VERY GOOD',
  3: 'GOOD',
  2: 'FAIR',
  1: 'POOR'
};

export default function ProviderDetailsModal({
  provider,
  isOpen,
  onClose,
  onSelectClinician,
  isSelected
}) {
  const { currentUser, awardPoints } = useAuth();
  const { showToast, favoriteVetIds = [], toggleFavoriteVet } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  // Review Form States
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customName, setCustomName] = useState(
    currentUser?.displayName || currentUser?.name || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep name synced if auth loads later
  useEffect(() => {
    if (currentUser?.displayName || currentUser?.name) {
      setCustomName(currentUser.displayName || currentUser.name);
    }
  }, [currentUser]);

  // Real-time listener for reviews of this provider
  useEffect(() => {
    if (!provider?.id || !isOpen) return;

    setIsReviewsLoading(true);
    const q = query(
      collection(db, 'reviews'),
      where('targetId', '==', provider.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        // Sort newest first
        fetched.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setReviews(fetched);
        setIsReviewsLoading(false);
      },
      (err) => {
        console.warn('[Firestore] Error fetching provider reviews:', err);
        setIsReviewsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [provider?.id, isOpen]);

  // Aggregate stats calculated dynamically from live reviews
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avgRating: typeof provider?.rating === 'number' ? provider.rating : 5.0,
        totalReviews: provider?.reviewsCount || 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recommendPercent: 100
      };
    }

    let sum = 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rNum = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      counts[rNum] = (counts[rNum] || 0) + 1;
      sum += Number(r.rating) || 5;
    });

    const avg = Number((sum / total).toFixed(1));
    const recommendCount = (counts[5] || 0) + (counts[4] || 0);
    const recommendPercent = Math.round((recommendCount / total) * 100);

    return {
      avgRating: avg,
      totalReviews: total,
      breakdown: counts,
      recommendPercent
    };
  }, [reviews, provider]);

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please provide a short comment describing your experience', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewId =
        'rev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const reviewerId =
        currentUser?.uid || 'guest_' + Math.random().toString(36).substring(2, 9);
      const reviewerName =
        customName.trim() ||
        currentUser?.displayName ||
        currentUser?.name ||
        'Pet Guardian';
      const reviewerPhoto =
        currentUser?.photoURL ||
        currentUser?.photo ||
        '';

      const reviewPayload = {
        id: reviewId,
        targetId: provider.id,
        reviewerId,
        reviewerName,
        reviewerPhoto,
        rating: Number(selectedRating),
        comment: comment.trim(),
        timestamp: Date.now()
      };

      // 1. Save to Firestore reviews collection
      await setDoc(doc(db, 'reviews', reviewId), reviewPayload);

      // 2. Update provider document aggregate rating in vets collection
      const newTotal = reviews.length + 1;
      const currentSum = reviews.reduce(
        (acc, r) => acc + (Number(r.rating) || 5),
        0
      );
      const newAvg = Number(
        ((currentSum + Number(selectedRating)) / newTotal).toFixed(1)
      );

      try {
        await updateDoc(doc(db, 'vets', provider.id), {
          rating: newAvg,
          reviewsCount: newTotal,
          reviews: newTotal
        });
      } catch (err) {
        console.warn('Could not update vet aggregate:', err);
      }

      // 3. Award loyalty points
      if (typeof awardPoints === 'function') {
        awardPoints(10);
      }

      showToast('Review posted! +10 Maya Points awarded ✨', 'success');
      setComment('');
      setShowWriteForm(false);
      setActiveTab('reviews');
    } catch (err) {
      console.error('Failed to submit review:', err);
      showToast('Could not post review. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !provider) return null;

  const isFavorite = favoriteVetIds.includes(provider.id);
  const isEmergency = provider.availabilityType === 'emergency';
  const effectiveRating = hoverRating || selectedRating;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto'
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '90vh',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
            border: '1px solid #EAE5E1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10001
          }}
        >
          {/* ── 1. Top Navigation Bar ── */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #F0ECE8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              zIndex: 10
            }}
          >
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: '#5C524E',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '9999px',
                backgroundColor: '#F7F5F3',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Directory</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  toggleFavoriteVet(provider.id);
                  showToast(
                    isFavorite
                      ? `Removed ${provider.name} from saved specialists`
                      : `Saved ${provider.name} to favorites`,
                    'info'
                  );
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #EAE5E1',
                  backgroundColor: isFavorite ? '#FEE2E2' : '#FFFFFF',
                  color: isFavorite ? '#EF4444' : '#707973',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={16} fill={isFavorite ? '#EF4444' : 'none'} />
              </button>

              <button
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #EAE5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#707973',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── 2. Scrollable Body ── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 0 24px 0'
            }}
          >
            {/* ── Provider Hero Header ── */}
            <div
              style={{
                background: 'linear-gradient(180deg, #F3F8F7 0%, #FFFFFF 100%)',
                padding: '28px 28px 20px 28px',
                borderBottom: '1px solid #F0ECE8'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '24px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Large Round Avatar */}
                <div
                  style={{
                    position: 'relative',
                    width: '104px',
                    height: '104px',
                    flexShrink: 0
                  }}
                >
                  {provider.image ? (
                    <img
                      src={provider.image}
                      alt={provider.name}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '104px',
                        height: '104px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #FFFFFF',
                        boxShadow: '0 8px 20px rgba(52, 107, 115, 0.15)',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: '104px',
                      height: '104px',
                      borderRadius: '50%',
                      backgroundColor: '#EDF5F3',
                      border: '3px solid #C4DCD6',
                      display: provider.image ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#346B73',
                      boxShadow: '0 8px 20px rgba(52, 107, 115, 0.15)'
                    }}
                  >
                    {(provider.name || 'P').charAt(0)}
                  </div>

                  {/* Verified Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isEmergency ? '#DC2626' : '#346B73',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                    }}
                  >
                    {provider.badgeType === 'video' && <Video size={14} />}
                    {provider.badgeType === 'stethoscope' && <Stethoscope size={14} />}
                    {provider.badgeType === 'emergency' && <Flame size={14} />}
                  </div>
                </div>

                {/* Core Provider Info */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '6px'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#EDF5F3',
                        color: '#0D9488',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}
                    >
                      <ShieldCheck size={12} />
                      Verified Provider
                    </span>

                    <span
                      style={{
                        backgroundColor: '#F5F1EE',
                        color: '#5C524E',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {provider.role || 'Specialist'}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#160F0C',
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {provider.name}
                  </h2>

                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5C524E',
                      marginBottom: '12px'
                    }}
                  >
                    {provider.degrees || 'Certified Specialist'} • {provider.clinic || 'Pet Maya Center'}
                  </div>

                  {/* Highlights Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* Star Rating Badge */}
                    <div
                      onClick={() => setActiveTab('reviews')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FDE68A'
                      }}
                    >
                      <Star size={14} color="#D97706" fill="#D97706" />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#92400E'
                        }}
                      >
                        {stats.avgRating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#B45309' }}>
                        ({stats.totalReviews} reviews)
                      </span>
                    </div>

                    {/* Experience Chip */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        color: '#707973',
                        fontWeight: 500
                      }}
                    >
                      <Award size={14} color="#346B73" />
                      <span>{provider.experience || '5+ Years Exp'}</span>
                    </div>

                    {/* Distance Chip */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        color: '#707973',
                        fontWeight: 500
                      }}
                    >
                      <MapPin size={14} color="#346B73" />
                      <span>{provider.distance || '1.2 km away'}</span>
                    </div>

                    {/* Availability Hours */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        color: '#707973',
                        fontWeight: 500
                      }}
                    >
                      <Clock size={14} color="#346B73" />
                      <span>{provider.availability || 'Mon - Fri • 9am - 6pm'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tab Switcher ── */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '16px 28px 0 28px',
                borderBottom: '1px solid #F0ECE8'
              }}
            >
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '10px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    activeTab === 'overview'
                      ? '2px solid #346B73'
                      : '2px solid transparent',
                  color: activeTab === 'overview' ? '#160F0C' : '#707973',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'overview' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Overview & Practice
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                style={{
                  padding: '10px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    activeTab === 'reviews'
                      ? '2px solid #346B73'
                      : '2px solid transparent',
                  color: activeTab === 'reviews' ? '#160F0C' : '#707973',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'reviews' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Reviews & Ratings</span>
                <span
                  style={{
                    backgroundColor:
                      activeTab === 'reviews' ? '#EDF5F3' : '#F5F1EE',
                    color: activeTab === 'reviews' ? '#346B73' : '#707973',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {stats.totalReviews}
                </span>
              </button>
            </div>

            {/* ── 3. Tab Contents ── */}
            <div style={{ padding: '24px 28px' }}>
              {activeTab === 'overview' ? (
                /* ── OVERVIEW TAB ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Bio Card */}
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#160F0C',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      About the Specialist
                    </h3>
                    <p
                      style={{
                        fontSize: '13.5px',
                        color: '#5C524E',
                        lineHeight: 1.65,
                        margin: 0
                      }}
                    >
                      {provider.bio}
                    </p>
                  </div>

                  {/* Consultation Facilities */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '14px'
                    }}
                  >
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        backgroundColor: '#F8FAFA',
                        border: '1px solid #E5EFEF'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '8px'
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            backgroundColor: '#EDF5F3',
                            color: '#346B73',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Video size={16} />
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#160F0C'
                          }}
                        >
                          HD Teleconsultation
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#707973',
                          lineHeight: 1.45,
                          margin: 0
                        }}
                      >
                        Encrypted high-definition video session with automated digital prescriptions and medical history sync.
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        backgroundColor: '#F8FAFA',
                        border: '1px solid #E5EFEF'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '8px'
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            backgroundColor: '#EDF5F3',
                            color: '#346B73',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Building size={16} />
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#160F0C'
                          }}
                        >
                          Clinical Chambers
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#707973',
                          lineHeight: 1.45,
                          margin: 0
                        }}
                      >
                        Direct access at {provider.clinic || 'Central Veterinary Hospital'}. On-site triage and diagnostics.
                      </p>
                    </div>
                  </div>

                  {/* Quick Reviews Preview Teaser */}
                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: '18px',
                      backgroundColor: '#FCFAF8',
                      border: '1px solid #EAE5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          fontSize: '28px',
                          fontWeight: 800,
                          color: '#160F0C'
                        }}
                      >
                        {stats.avgRating.toFixed(1)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              color="#F59E0B"
                              fill={s <= Math.round(stats.avgRating) ? '#F59E0B' : 'none'}
                            />
                          ))}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#707973', fontWeight: 500 }}>
                          Based on {stats.totalReviews} verified pet parent review{stats.totalReviews === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('reviews')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '9999px',
                        border: '1px solid #346B73',
                        backgroundColor: '#FFFFFF',
                        color: '#346B73',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>Read Reviews & Write</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* ── REVIEWS TAB ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* 1. Rating Summary Breakdown Box */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '170px 1fr',
                      gap: '24px',
                      padding: '24px',
                      borderRadius: '20px',
                      backgroundColor: '#F8FAFA',
                      border: '1px solid #E5EFEF',
                      alignItems: 'center'
                    }}
                    className="rating-breakdown-grid"
                  >
                    {/* Big Score Block */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '44px',
                          fontWeight: 800,
                          color: '#160F0C',
                          lineHeight: 1,
                          marginBottom: '6px',
                          letterSpacing: '-0.03em'
                        }}
                      >
                        {stats.avgRating.toFixed(1)}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '3px',
                          marginBottom: '6px'
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            color="#F59E0B"
                            fill={s <= Math.round(stats.avgRating) ? '#F59E0B' : 'none'}
                          />
                        ))}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#5C524E',
                          fontWeight: 600
                        }}
                      >
                        {stats.totalReviews} verified review{stats.totalReviews === 1 ? '' : 's'}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#0D9488',
                          fontWeight: 600,
                          marginTop: '4px'
                        }}
                      >
                        {stats.recommendPercent}% recommend
                      </div>
                    </div>

                    {/* Star Bars Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[5, 4, 3, 2, 1].map((starVal) => {
                        const count = stats.breakdown[starVal] || 0;
                        const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                        return (
                          <div
                            key={starVal}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '12px'
                            }}
                          >
                            <span
                              style={{
                                width: '42px',
                                color: '#5C524E',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              {starVal} <Star size={11} color="#F59E0B" fill="#F59E0B" />
                            </span>
                            {/* Progress bar track */}
                            <div
                              style={{
                                flex: 1,
                                height: '8px',
                                borderRadius: '9999px',
                                backgroundColor: '#E2ECE9',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  backgroundColor: '#F59E0B',
                                  borderRadius: '9999px',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                            <span
                              style={{
                                width: '28px',
                                textAlign: 'right',
                                color: '#707973',
                                fontSize: '11px',
                                fontWeight: 500
                              }}
                            >
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Write Review Action Button / Form Area */}
                  {!showWriteForm ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1.5px dashed #C4DCD6'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#160F0C' }}>
                          Have you consulted with {provider.name}?
                        </div>
                        <div style={{ fontSize: '12px', color: '#707973' }}>
                          Share your experience and help fellow pet parents.
                        </div>
                      </div>

                      <button
                        onClick={() => setShowWriteForm(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '9px 18px',
                          borderRadius: '9999px',
                          backgroundColor: '#346B73',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(52, 107, 115, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Sparkles size={14} />
                        <span>Write a Review</span>
                      </button>
                    </div>
                  ) : (
                    /* Expanded Interactive Review Write Form */
                    <motion.form
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleSubmitReview}
                      style={{
                        padding: '24px',
                        borderRadius: '20px',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #346B73',
                        boxShadow: '0 8px 24px rgba(52, 107, 115, 0.08)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#160F0C' }}>
                            Rate & Review {provider.name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#707973' }}>
                            Earn +10 Maya Care Points upon posting your feedback
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowWriteForm(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#707973',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Interactive Star Picker */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '16px 0',
                          backgroundColor: '#F8FAFA',
                          borderRadius: '16px',
                          marginBottom: '18px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const isFilled = starVal <= effectiveRating;
                            return (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => setSelectedRating(starVal)}
                                onMouseEnter={() => setHoverRating(starVal)}
                                onMouseLeave={() => setHoverRating(0)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  transform:
                                    starVal === effectiveRating ? 'scale(1.15)' : 'scale(1)',
                                  transition: 'transform 0.15s ease'
                                }}
                              >
                                <Star
                                  size={34}
                                  color="#F59E0B"
                                  fill={isFilled ? '#F59E0B' : 'transparent'}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            color: '#346B73',
                            textTransform: 'uppercase'
                          }}
                        >
                          {RATING_LABELS[effectiveRating] || 'EXCELLENT'} ({effectiveRating} / 5)
                        </div>
                      </div>

                      {/* Reviewer Name / Identity */}
                      <div style={{ marginBottom: '14px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#5C524E',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          Your Name
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {currentUser?.photoURL || currentUser?.photo ? (
                            <img
                              src={currentUser.photoURL || currentUser.photo}
                              alt="User"
                              referrerPolicy="no-referrer"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: '#EDF5F3',
                                color: '#346B73',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontWeight: 700
                              }}
                            >
                              <User size={18} />
                            </div>
                          )}
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Your name (defaults to Pet Guardian)"
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              borderRadius: '12px',
                              border: '1px solid #DFE8E5',
                              fontSize: '13px',
                              outline: 'none',
                              color: '#160F0C'
                            }}
                          />
                        </div>
                      </div>

                      {/* Review Comments Textarea */}
                      <div style={{ marginBottom: '18px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#5C524E',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          Your Clinical or Service Experience
                        </label>
                        <textarea
                          rows={4}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Describe the consultation, doctor's attentiveness, pet friendliness, or care results..."
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '14px',
                            border: '1px solid #DFE8E5',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            outline: 'none',
                            color: '#160F0C',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Form Action Buttons */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '10px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setShowWriteForm(false)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            border: '1px solid #EAE5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#5C524E',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting || !comment.trim()}
                          style={{
                            padding: '9px 22px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor:
                              isSubmitting || !comment.trim() ? '#93C5CD' : '#346B73',
                            color: '#FFFFFF',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor:
                              isSubmitting || !comment.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(52, 107, 115, 0.25)'
                          }}
                        >
                          {isSubmitting ? (
                            <span>Submitting...</span>
                          ) : (
                            <>
                              <Send size={13} />
                              <span>Submit Review</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* 3. Live Review Cards List */}
                  <div>
                    <h4
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#5C524E',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '14px'
                      }}
                    >
                      Verified Reviews ({reviews.length})
                    </h4>

                    {isReviewsLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              height: '90px',
                              backgroundColor: '#F8FAFA',
                              borderRadius: '16px',
                              border: '1px solid #E5EFEF',
                              opacity: 0.6
                            }}
                          />
                        ))}
                      </div>
                    ) : reviews.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '36px 20px',
                          backgroundColor: '#F8FAFA',
                          borderRadius: '20px',
                          border: '1px solid #E5EFEF'
                        }}
                      >
                        <MessageSquare
                          size={32}
                          color="#94A3B8"
                          style={{ marginBottom: '8px' }}
                        />
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#160F0C',
                            marginBottom: '4px'
                          }}
                        >
                          No reviews yet
                        </div>
                        <div style={{ fontSize: '12px', color: '#707973', maxWidth: '320px', margin: '0 auto' }}>
                          Be the first pet parent to share feedback for {provider.name}!
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {reviews.map((rev) => {
                          const dateStr = rev.timestamp
                            ? new Date(rev.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'Recently';

                          return (
                            <div
                              key={rev.id}
                              style={{
                                padding: '18px 20px',
                                borderRadius: '18px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #EAE5E1',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  marginBottom: '10px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {rev.reviewerPhoto ? (
                                    <img
                                      src={rev.reviewerPhoto}
                                      alt={rev.reviewerName}
                                      referrerPolicy="no-referrer"
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '1.5px solid #EAE5E1'
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#EDF5F3',
                                        color: '#346B73',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '15px'
                                      }}
                                    >
                                      {(rev.reviewerName || 'P').charAt(0).toUpperCase()}
                                    </div>
                                  )}

                                  <div>
                                    <div
                                      style={{
                                        fontSize: '13.5px',
                                        fontWeight: 700,
                                        color: '#160F0C'
                                      }}
                                    >
                                      {rev.reviewerName || 'Pet Guardian'}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: '#707973',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      <span>{dateStr}</span>
                                      <span>•</span>
                                      <span style={{ color: '#0D9488', fontWeight: 600 }}>
                                        Verified Care Visit
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Star Score Badge */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: '#FEF3C7',
                                    color: '#92400E',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                >
                                  <Star size={12} color="#D97706" fill="#D97706" />
                                  <span>{Number(rev.rating).toFixed(1)}</span>
                                </div>
                              </div>

                              <p
                                style={{
                                  fontSize: '13px',
                                  color: '#374151',
                                  lineHeight: 1.55,
                                  margin: 0
                                }}
                              >
                                {rev.comment}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Sticky Bottom Action Footer ── */}
          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid #F0ECE8',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#707973',
                  textTransform: 'uppercase'
                }}
              >
                {provider.priceLabel || 'TELEHEALTH STANDARD'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#160F0C',
                    letterSpacing: '-0.02em'
                  }}
                >
                  ৳{provider.price}
                </span>
                <span style={{ fontSize: '12px', color: '#707973' }}>
                  {provider.unit || '/ 25 min'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  onSelectClinician(provider);
                  onClose();
                }}
                style={{
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: isSelected ? '#346B73' : '#160F0C',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.18s ease'
                }}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Clinician Selected & Ready</span>
                  </>
                ) : (
                  <>
                    <span>Select Specialist & Book</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
